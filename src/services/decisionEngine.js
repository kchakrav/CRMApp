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

  let results = [...matchingOfferIds]
    .map(oid => query.get('offers', oid))
    .filter(o => o && o.status === 'live' && o.type === 'personalized');

  // Apply attribute-based conditions if defined
  const conditions = collection.attribute_conditions || [];
  if (conditions.length > 0) {
    results = results.filter(offer => {
      const attrs = offer.custom_attributes || {};
      return conditions.every(cond => {
        const val = attrs[cond.attribute];
        const target = cond.value;
        switch (cond.operator) {
          case 'equals': return String(val) === String(target);
          case 'not_equals': return String(val) !== String(target);
          case 'contains': return val != null && String(val).toLowerCase().includes(String(target).toLowerCase());
          case 'gt': return Number(val) > Number(target);
          case 'lt': return Number(val) < Number(target);
          case 'exists': return val != null && val !== '';
          default: return true;
        }
      });
    });
  }

  return results;
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
  if (!ruleId) return true;

  const rule = query.get('decision_rules', ruleId);
  if (!rule || !rule.conditions || rule.conditions.length === 0) return true;

  const hasMixedConnectors = rule.conditions.some(c => c.connector);

  if (hasMixedConnectors || rule.logic === 'MIXED') {
    // Per-condition connectors: split into AND-groups separated by OR.
    // AND binds tighter than OR, so: A AND B OR C AND D = (A AND B) OR (C AND D)
    const groups = [[]];
    rule.conditions.forEach((cond, i) => {
      if (i > 0 && (cond.connector || 'AND') === 'OR') {
        groups.push([]);
      }
      groups[groups.length - 1].push(cond);
    });
    return groups.some(group =>
      group.every(cond => {
        const value = getNestedValue(contact, cond.entity, cond.attribute);
        return evaluateCondition(value, cond.operator, cond.value);
      })
    );
  }

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

/** Evaluate audience/segment-based eligibility */
function evaluateAudienceEligibility(contact, audienceIds, logic = 'OR') {
  if (!audienceIds || audienceIds.length === 0) return true;
  const segments = query.all('segments');
  const results = audienceIds.map(segId => {
    const segment = segments.find(s => s.id === segId);
    if (!segment) return false;
    // Simple membership check - in a real system this would evaluate segment conditions
    return true; // Assume contact is in all segments for simulation
  });
  return logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
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

  // Advanced capping rules (GAP 3)
  if (constraint.capping_rules && Array.isArray(constraint.capping_rules)) {
    const events = query.all('offer_events');
    for (const rule of constraint.capping_rules) {
      let relevantCount = 0;
      if (rule.event === 'decision') {
        const pool = rule.cap_type === 'per_profile'
          ? propositions.filter(p => p.contact_id === contactId)
          : propositions;
        relevantCount = filterByResetPeriod(pool, rule.reset_period, rule.reset_count).length;
      } else {
        const offerEvents = events.filter(e => {
          const prop = query.get('offer_propositions', e.proposition_id);
          if (!prop || prop.offer_id !== offer.id) return false;
          if (rule.cap_type === 'per_profile' && prop.contact_id !== contactId) return false;
          return e.event_type === rule.event;
        });
        relevantCount = filterByResetPeriod(offerEvents, rule.reset_period, rule.reset_count).length;
      }
      let effectiveLimit = rule.limit;
      if (rule.limit_expression) {
        try {
          const attrs = offer.custom_attributes || {};
          const expr = rule.limit_expression
            .replace(/\b([a-zA-Z_]\w*)\b/g, (m) => attrs[m] !== undefined ? Number(attrs[m]) : m);
          effectiveLimit = Math.floor(Function('"use strict"; return (' + expr + ')')());
        } catch (_e) { effectiveLimit = rule.limit || 10; }
      }
      if (effectiveLimit && relevantCount >= effectiveLimit) return false;
    }
  }

  return true;
}

function filterByResetPeriod(items, period, count) {
  if (!period || period === 'none') return items;
  const start = getPeriodStart(period, count || 1);
  return items.filter(item => {
    const ts = item.timestamp || item.created_at;
    return ts && new Date(ts) >= start;
  });
}

function getPeriodStart(period, count = 1) {
  const now = new Date();
  const n = Math.max(1, count || 1);
  switch (period) {
    case 'daily': {
      const d = new Date(now);
      d.setDate(d.getDate() - (n - 1));
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'weekly': {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay() - (n - 1) * 7);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'monthly': {
      const d = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1);
      return d;
    }
    default: return new Date(0);
  }
}

// ── Arbitration helpers ──

/** Apply tiebreak when multiple offers have the same score/priority */
function applyTiebreak(offers, tiebreakRule, contactId) {
  if (offers.length <= 1) return offers;
  switch (tiebreakRule) {
    case 'most_recent':
      return [...offers].sort((a, b) => {
        const aDate = new Date(a.updated_at || a.created_at || 0);
        const bDate = new Date(b.updated_at || b.created_at || 0);
        return bDate - aDate;
      });
    case 'least_shown': {
      const propCounts = {};
      for (const o of offers) {
        propCounts[o.id] = query.count('offer_propositions', p =>
          p.offer_id === o.id && p.contact_id === contactId
        );
      }
      return [...offers].sort((a, b) => (propCounts[a.id] || 0) - (propCounts[b.id] || 0));
    }
    case 'offer_id_asc':
      return [...offers].sort((a, b) => a.id - b.id);
    case 'random':
    default:
      return [...offers].sort(() => Math.random() - 0.5);
  }
}

/** Check suppression window — skip offers shown to this contact recently */
function isWithinSuppressionWindow(offerId, contactId, windowHours) {
  if (!windowHours || windowHours <= 0) return false;
  const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);
  const recentProp = query.get('offer_propositions', p =>
    p.offer_id === offerId &&
    p.contact_id === contactId &&
    new Date(p.timestamp) >= cutoff
  );
  return !!recentProp;
}

/** Compute weighted arbitration score */
function computeArbitrationScore(offer, contactId, arb) {
  const priorityW = (arb.priority_weight || 60) / 100;
  const recencyW = (arb.recency_weight || 20) / 100;
  const perfW = (arb.performance_weight || 20) / 100;

  // Priority score (0–100)
  const priorityScore = offer.priority || 0;

  // Recency score: newer offers score higher (based on created_at)
  const age = (Date.now() - new Date(offer.created_at || 0).getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 100 - age);

  // Performance score: based on historical proposition outcomes
  const props = query.all('offer_propositions', p => p.offer_id === offer.id);
  const total = props.length || 1;
  const clicks = props.filter(p => p.status === 'clicked' || p.status === 'converted').length;
  const perfScore = (clicks / total) * 100;

  return priorityScore * priorityW + recencyScore * recencyW + perfScore * perfW;
}

// ── Main resolve function ──

/**
 * Resolve the best offers for a contact given a decision.
 * Applies arbitration rules for cross-placement deduplication,
 * suppression windows, global offer limits, and tiebreaking.
 * @param {number} contactId
 * @param {number} decisionId
 * @param {Object} contextData - real-time context (weather, device, time, etc.)
 * @param {boolean} [traceMode=false] - if true, returns detailed arbitration trace
 * @returns {Object} { placements: [{ placement, offers: [...], fallback_used }], arbitration_trace? }
 */
function resolve(contactId, decisionId, contextData = {}, traceMode = false) {
  const decision = query.get('decisions', decisionId);
  if (!decision) throw new Error('Decision not found');

  const contact = query.get('contacts', contactId);
  if (!contact) throw new Error('Contact not found');

  const arb = decision.arbitration || {};
  const dedupPolicy = arb.dedup_policy || 'no_duplicates';
  const tiebreakRule = arb.tiebreak_rule || 'random';
  const arbMethod = arb.method || 'priority_order';
  const suppressionHours = arb.suppression_window_hours || 0;
  const globalLimit = arb.global_offer_limit || 0;

  const results = [];
  const usedOfferIds = new Set(); // for cross-placement deduplication
  let totalOffersSelected = 0;
  const trace = traceMode ? [] : null;

  for (const slotConfig of (decision.placement_configs || [])) {
    const placement = query.get('placements', slotConfig.placement_id);
    if (!placement) continue;

    const strategy = slotConfig.selection_strategy_id
      ? query.get('selection_strategies', slotConfig.selection_strategy_id)
      : null;

    let qualifiedOffers = [];
    const slotTrace = traceMode ? {
      placement_id: placement.id,
      placement_name: placement.name,
      steps: []
    } : null;

    if (strategy) {
      // 1. Resolve collection
      let candidates = strategy.collection_id
        ? resolveCollection(strategy.collection_id)
        : query.all('offers', o => o.status === 'live' && o.type === 'personalized');
      if (slotTrace) slotTrace.steps.push({ step: 'collection_resolve', count: candidates.length, detail: `${candidates.length} candidate(s) from collection` });

      // 2. Filter by date range
      const beforeDate = candidates.length;
      candidates = candidates.filter(isWithinDateRange);
      if (slotTrace) slotTrace.steps.push({ step: 'date_range', count: candidates.length, removed: beforeDate - candidates.length });

      // 3. Filter offers that have a representation for this placement
      const reps = query.all('offer_representations', r => r.placement_id === placement.id);
      const repOfferIds = new Set(reps.map(r => r.offer_id));
      const beforeRep = candidates.length;
      candidates = candidates.filter(o => repOfferIds.has(o.id));
      if (slotTrace) slotTrace.steps.push({ step: 'representation_check', count: candidates.length, removed: beforeRep - candidates.length });

      // 4. Strategy eligibility (rule-based or audience-based)
      if (strategy.eligibility_type === 'audiences' && strategy.eligibility_audience_ids?.length > 0) {
        const beforeElig = candidates.length;
        const eligible = evaluateAudienceEligibility(contact, strategy.eligibility_audience_ids, strategy.audience_logic);
        if (!eligible) candidates = [];
        if (slotTrace) slotTrace.steps.push({ step: 'strategy_eligibility', count: candidates.length, removed: beforeElig - candidates.length, detail: `Audience-based (${strategy.audience_logic})` });
      } else if (strategy.eligibility_rule_id) {
        const beforeElig = candidates.length;
        candidates = candidates.filter(o => evaluateEligibility(strategy.eligibility_rule_id, contact));
        if (slotTrace) slotTrace.steps.push({ step: 'strategy_eligibility', count: candidates.length, removed: beforeElig - candidates.length });
      }

      // 5. Per-offer eligibility (rule-based or audience-based)
      const beforeOfferElig = candidates.length;
      candidates = candidates.filter(o => {
        if (o.eligibility_type === 'audiences' && o.eligibility_audience_ids?.length > 0) {
          return evaluateAudienceEligibility(contact, o.eligibility_audience_ids, o.audience_logic);
        }
        if (!o.eligibility_rule_id) return true;
        return evaluateEligibility(o.eligibility_rule_id, contact);
      });
      if (slotTrace) slotTrace.steps.push({ step: 'offer_eligibility', count: candidates.length, removed: beforeOfferElig - candidates.length });

      // 6. Constraint checks (capping)
      const beforeCap = candidates.length;
      candidates = candidates.filter(o => checkConstraints(o, contactId, placement.id));
      if (slotTrace) slotTrace.steps.push({ step: 'capping_constraints', count: candidates.length, removed: beforeCap - candidates.length });

      // ── ARBITRATION: Suppression window ──
      if (suppressionHours > 0) {
        const beforeSup = candidates.length;
        candidates = candidates.filter(o => !isWithinSuppressionWindow(o.id, contactId, suppressionHours));
        if (slotTrace) slotTrace.steps.push({ step: 'suppression_window', count: candidates.length, removed: beforeSup - candidates.length, detail: `${suppressionHours}h window` });
      }

      // ── ARBITRATION: Cross-placement deduplication ──
      if (dedupPolicy === 'no_duplicates' && usedOfferIds.size > 0) {
        const beforeDedup = candidates.length;
        candidates = candidates.filter(o => !usedOfferIds.has(o.id));
        if (slotTrace) slotTrace.steps.push({ step: 'deduplication', count: candidates.length, removed: beforeDedup - candidates.length, detail: `Removed offers already used in prior placements` });
      }

      // ── ARBITRATION: Global offer limit ──
      if (globalLimit > 0 && totalOffersSelected >= globalLimit) {
        candidates = [];
        if (slotTrace) slotTrace.steps.push({ step: 'global_limit', count: 0, detail: `Global limit of ${globalLimit} already reached` });
      }

      // 7. Rank (using arbitration method)
      if (arbMethod === 'weighted_score') {
        qualifiedOffers = candidates.map(o => ({
          ...o,
          _score: computeArbitrationScore(o, contactId, arb)
        })).sort((a, b) => b._score - a._score);
        qualifiedOffers = applyTiebreak(qualifiedOffers, tiebreakRule, contactId);
      } else if (arbMethod === 'ai_optimized') {
        qualifiedOffers = rankOffers(candidates, 'ai', {
          profile: contact,
          context: contextData
        });
        qualifiedOffers = applyTiebreak(qualifiedOffers, tiebreakRule, contactId);
      } else {
        // priority_order (default) — use strategy ranking method
        qualifiedOffers = rankOffers(candidates, strategy.ranking_method || 'priority', {
          formulaId: strategy.ranking_formula_id,
          modelId: strategy.ranking_model_id,
          profile: contact,
          context: contextData
        });
        qualifiedOffers = applyTiebreak(qualifiedOffers, tiebreakRule, contactId);
      }

      if (slotTrace) slotTrace.steps.push({ step: 'ranking', count: qualifiedOffers.length, detail: `Method: ${arbMethod}, tiebreak: ${tiebreakRule}` });
    }

    // Limit to placement max_items (and global limit)
    let maxItems = placement.max_items || 1;
    if (globalLimit > 0) {
      maxItems = Math.min(maxItems, globalLimit - totalOffersSelected);
      if (maxItems <= 0) maxItems = 0;
    }
    const topOffers = qualifiedOffers.slice(0, maxItems);

    let fallbackUsed = false;
    let finalOffers = topOffers;

    // If no offers qualified, use fallback
    if (topOffers.length === 0 && slotConfig.fallback_offer_id) {
      const fallback = query.get('offers', slotConfig.fallback_offer_id);
      if (fallback) {
        finalOffers = [fallback];
        fallbackUsed = true;
        if (slotTrace) slotTrace.steps.push({ step: 'fallback', detail: `Using fallback offer: ${fallback.name}` });
      }
    }

    // Track used offers for deduplication
    for (const o of finalOffers) {
      usedOfferIds.add(o.id);
      totalOffersSelected++;
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

    if (slotTrace) slotTrace.steps.push({ step: 'final_selection', count: offersWithContent.length, offers: offersWithContent.map(o => ({ id: o.offer_id, name: o.offer_name, score: o.score, is_fallback: o.is_fallback })) });

    results.push({
      placement_id: placement.id,
      placement_name: placement.name,
      placement_channel: placement.channel,
      offers: offersWithContent,
      fallback_used: fallbackUsed,
      candidates_evaluated: qualifiedOffers.length + (fallbackUsed ? 0 : topOffers.length),
    });

    if (slotTrace) trace.push(slotTrace);
  }

  const result = {
    decision_id: decisionId,
    contact_id: contactId,
    resolved_at: new Date().toISOString(),
    arbitration_settings: arb,
    placements: results
  };
  if (traceMode) result.arbitration_trace = trace;
  return result;
}

/**
 * Simulate resolution for a decision (doesn't log propositions)
 * @param {boolean} [trace=false] - if true, returns detailed arbitration trace
 */
function simulate(contactId, decisionId, contextData = {}, trace = false) {
  const beforeCount = query.count('offer_propositions');
  const result = resolve(contactId, decisionId, contextData, trace);

  // Remove any propositions that were logged during simulation
  const allProps = query.all('offer_propositions');
  const toRemove = allProps.slice(beforeCount);
  for (const prop of toRemove) {
    query.delete('offer_propositions', prop.id);
  }

  return { ...result, simulated: true };
}

module.exports = { resolve, simulate, resolveCollection, evaluateEligibility, evaluateAudienceEligibility, checkConstraints };
