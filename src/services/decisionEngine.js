/**
 * Decision Engine – Core offer resolution logic
 *
 * resolve(contactId, decisionId, contextData) =>
 *   For each placement in the decision:
 *     1. Resolve collection → candidate offers
 *     2. Filter by date (start/end)
 *     3. Apply eligibility rules against contact profile
 *     4. Apply constraints (capping / frequency)
 *     5. Rank offers
 *     6. Return top N (or fallback)
 *     7. Log propositions
 */
const { query } = require('../database');
const { rankOffers } = require('./rankingService');

// ── Helpers ──

/** Resolve collection members → array of offer objects */
function resolveCollection(collectionId) {
  const collection = query.get('collections', collectionId);
  if (!collection) return [];

  if (collection.type === 'static') {
    // Static: offer_ids is an explicit list
    return (collection.offer_ids || [])
      .map(oid => query.get('offers', oid))
      .filter(Boolean);
  }

  // Dynamic: filter by qualifier tags
  const qualifierIds = collection.qualifier_ids || [];
  if (qualifierIds.length === 0) {
    // No qualifier filter → all live personalized offers
    return query.all('offers', o => o.status === 'live' && o.type === 'personalized');
  }

  // Find offer IDs that have at least one of the qualifier tags
  const matchingOfferIds = new Set();
  const allTags = query.all('offer_tags');
  for (const tag of allTags) {
    if (qualifierIds.includes(tag.qualifier_id)) {
      matchingOfferIds.add(tag.offer_id);
    }
  }

  return [...matchingOfferIds]
    .map(oid => query.get('offers', oid))
    .filter(o => o && o.status === 'live' && o.type === 'personalized');
}

/** Check if offer is within its valid date range */
function isWithinDateRange(offer) {
  const now = new Date();
  if (offer.start_date && new Date(offer.start_date) > now) return false;
  if (offer.end_date && new Date(offer.end_date) < now) return false;
  return true;
}

/** Evaluate eligibility rule against a contact profile */
function evaluateEligibility(ruleId, contact) {
  if (!ruleId) return true; // No rule = everyone eligible

  const rule = query.get('decision_rules', ruleId);
  if (!rule || !rule.conditions || rule.conditions.length === 0) return true;

  const logic = rule.logic || 'AND';

  const results = rule.conditions.map(cond => {
    const value = getNestedValue(contact, cond.entity, cond.attribute);
    return evaluateCondition(value, cond.operator, cond.value);
  });

  return logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
}

function getNestedValue(contact, entity, attribute) {
  if (!entity || entity === 'contact' || entity === 'profile') {
    return contact[attribute];
  }
  // For events, orders, etc. – check related data
  if (entity === 'orders') {
    const orders = query.all('orders', o => o.contact_id === contact.id);
    if (attribute === 'count') return orders.length;
    if (attribute === 'total_value') return orders.reduce((s, o) => s + (o.total || 0), 0);
    return orders.length > 0 ? orders[0][attribute] : null;
  }
  if (entity === 'events') {
    const events = query.all('contact_events', e => e.contact_id === contact.id);
    if (attribute === 'count') return events.length;
    return events.length > 0 ? events[0][attribute] : null;
  }
  return contact[attribute];
}

function evaluateCondition(actual, operator, expected) {
  if (actual === undefined || actual === null) {
    return operator === 'is_empty' || operator === 'is_null';
  }

  switch (operator) {
    case 'equals': return String(actual).toLowerCase() === String(expected).toLowerCase();
    case 'not_equals': return String(actual).toLowerCase() !== String(expected).toLowerCase();
    case 'contains': return String(actual).toLowerCase().includes(String(expected).toLowerCase());
    case 'not_contains': return !String(actual).toLowerCase().includes(String(expected).toLowerCase());
    case 'starts_with': return String(actual).toLowerCase().startsWith(String(expected).toLowerCase());
    case 'greater_than': return Number(actual) > Number(expected);
    case 'less_than': return Number(actual) < Number(expected);
    case 'greater_than_or_equal': return Number(actual) >= Number(expected);
    case 'less_than_or_equal': return Number(actual) <= Number(expected);
    case 'in': {
      const list = Array.isArray(expected) ? expected : String(expected).split(',').map(s => s.trim());
      return list.some(v => String(v).toLowerCase() === String(actual).toLowerCase());
    }
    case 'not_in': {
      const list = Array.isArray(expected) ? expected : String(expected).split(',').map(s => s.trim());
      return !list.some(v => String(v).toLowerCase() === String(actual).toLowerCase());
    }
    case 'is_empty': return actual === '' || actual === null || actual === undefined;
    case 'is_not_empty': return actual !== '' && actual !== null && actual !== undefined;
    case 'is_true': return actual === true || actual === 'true';
    case 'is_false': return actual === false || actual === 'false';
    default: return true;
  }
}

/** Check constraint caps */
function checkConstraints(offer, contactId, placementId) {
  const constraint = query.get('offer_constraints', c => c.offer_id === offer.id);
  if (!constraint) return true;

  const propositions = query.all('offer_propositions', p => p.offer_id === offer.id);

  // Total cap
  if (constraint.total_cap && constraint.total_cap > 0) {
    if (propositions.length >= constraint.total_cap) return false;
  }

  // Per-user cap with frequency period
  if (constraint.per_user_cap && constraint.per_user_cap > 0) {
    let userProps = propositions.filter(p => p.contact_id === contactId);

    if (constraint.frequency_period && constraint.frequency_period !== 'lifetime') {
      const periodStart = getPeriodStart(constraint.frequency_period);
      userProps = userProps.filter(p => new Date(p.timestamp) >= periodStart);
    }

    if (userProps.length >= constraint.per_user_cap) return false;
  }

  // Per-placement cap
  if (constraint.per_placement_caps && placementId) {
    const placementCap = constraint.per_placement_caps[placementId];
    if (placementCap && placementCap > 0) {
      const placementProps = propositions.filter(p => p.placement_id === placementId);
      if (placementProps.length >= placementCap) return false;
    }
  }

  return true;
}

function getPeriodStart(period) {
  const now = new Date();
  switch (period) {
    case 'daily': return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'weekly': {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'monthly': return new Date(now.getFullYear(), now.getMonth(), 1);
    default: return new Date(0);
  }
}

// ── Main resolve function ──

/**
 * Resolve the best offers for a contact given a decision
 * @param {number} contactId
 * @param {number} decisionId
 * @param {Object} contextData - real-time context (weather, device, time, etc.)
 * @returns {Object} { placements: [{ placement, offers: [...], fallback_used }] }
 */
function resolve(contactId, decisionId, contextData = {}) {
  const decision = query.get('decisions', decisionId);
  if (!decision) throw new Error('Decision not found');

  const contact = query.get('contacts', contactId);
  if (!contact) throw new Error('Contact not found');

  const results = [];

  for (const slotConfig of (decision.placement_configs || [])) {
    const placement = query.get('placements', slotConfig.placement_id);
    if (!placement) continue;

    const strategy = slotConfig.selection_strategy_id
      ? query.get('selection_strategies', slotConfig.selection_strategy_id)
      : null;

    let qualifiedOffers = [];

    if (strategy) {
      // 1. Resolve collection
      let candidates = strategy.collection_id
        ? resolveCollection(strategy.collection_id)
        : query.all('offers', o => o.status === 'live' && o.type === 'personalized');

      // 2. Filter by date range
      candidates = candidates.filter(isWithinDateRange);

      // 3. Filter offers that have a representation for this placement
      const reps = query.all('offer_representations', r => r.placement_id === placement.id);
      const repOfferIds = new Set(reps.map(r => r.offer_id));
      candidates = candidates.filter(o => repOfferIds.has(o.id));

      // 4. Apply eligibility rule
      if (strategy.eligibility_rule_id) {
        candidates = candidates.filter(o => evaluateEligibility(strategy.eligibility_rule_id, contact));
      }

      // Also apply per-offer eligibility rules
      candidates = candidates.filter(o => {
        if (!o.eligibility_rule_id) return true;
        return evaluateEligibility(o.eligibility_rule_id, contact);
      });

      // 5. Apply constraint checks
      candidates = candidates.filter(o => checkConstraints(o, contactId, placement.id));

      // 6. Rank
      qualifiedOffers = rankOffers(candidates, strategy.ranking_method || 'priority', {
        formulaId: strategy.ranking_formula_id,
        modelId: strategy.ranking_model_id,
        profile: contact,
        context: contextData
      });
    }

    // Limit to placement max_items
    const maxItems = placement.max_items || 1;
    const topOffers = qualifiedOffers.slice(0, maxItems);

    let fallbackUsed = false;
    let finalOffers = topOffers;

    // If no offers qualified, use fallback
    if (topOffers.length === 0 && slotConfig.fallback_offer_id) {
      const fallback = query.get('offers', slotConfig.fallback_offer_id);
      if (fallback) {
        finalOffers = [fallback];
        fallbackUsed = true;
      }
    }

    // Get representations for the final offers
    const offersWithContent = finalOffers.map(offer => {
      const rep = query.get('offer_representations',
        r => r.offer_id === offer.id && r.placement_id === placement.id
      );
      return {
        offer_id: offer.id,
        offer_name: offer.name,
        priority: offer.priority,
        score: offer._score,
        content: rep ? {
          content_type: rep.content_type,
          content: rep.content,
          image_url: rep.image_url,
          link_url: rep.link_url,
          alt_text: rep.alt_text
        } : null,
        is_fallback: fallbackUsed
      };
    });

    // Log propositions
    for (const offerResult of offersWithContent) {
      query.insert('offer_propositions', {
        offer_id: offerResult.offer_id,
        contact_id: contactId,
        decision_id: decisionId,
        placement_id: placement.id,
        channel: placement.channel,
        status: 'proposed',
        is_fallback: offerResult.is_fallback,
        context_data: contextData,
        timestamp: new Date().toISOString()
      });
    }

    results.push({
      placement_id: placement.id,
      placement_name: placement.name,
      placement_channel: placement.channel,
      offers: offersWithContent,
      fallback_used: fallbackUsed,
      candidates_evaluated: qualifiedOffers.length + (fallbackUsed ? 0 : topOffers.length),
    });
  }

  return {
    decision_id: decisionId,
    contact_id: contactId,
    resolved_at: new Date().toISOString(),
    placements: results
  };
}

/**
 * Simulate resolution for a decision (doesn't log propositions)
 */
function simulate(contactId, decisionId, contextData = {}) {
  // Temporarily capture propositions length before resolve
  const beforeCount = query.count('offer_propositions');
  const result = resolve(contactId, decisionId, contextData);

  // Remove any propositions that were logged during simulation
  const allProps = query.all('offer_propositions');
  const toRemove = allProps.slice(beforeCount);
  for (const prop of toRemove) {
    query.delete('offer_propositions', prop.id);
  }

  return { ...result, simulated: true };
}

module.exports = { resolve, simulate, resolveCollection, evaluateEligibility, checkConstraints };
