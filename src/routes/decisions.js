/**
 * Decisions API – Decision policies, selection strategies, ranking formulas,
 *                 real-time resolution, simulation, and analytics
 */
const express = require('express');
const router = express.Router();
const { query } = require('../database');
const { resolve, simulate } = require('../services/decisionEngine');

// ══════════════════════════════════════════════════════
// RANKING FORMULAS
// ══════════════════════════════════════════════════════

router.get('/ranking-formulas', (req, res) => {
  try {
    const formulas = query.all('ranking_formulas');
    res.json({ formulas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ranking-formulas', (req, res) => {
  try {
    const { name, description, expression } = req.body;
    if (!name || !expression) return res.status(400).json({ error: 'name and expression are required' });

    const result = query.insert('ranking_formulas', {
      name,
      description: description || '',
      expression,
      status: 'active'
    });
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/ranking-formulas/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const formula = query.get('ranking_formulas', id);
    if (!formula) return res.status(404).json({ error: 'Formula not found' });

    const updates = {};
    ['name', 'description', 'expression', 'status'].forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    query.update('ranking_formulas', id, updates);
    res.json(query.get('ranking_formulas', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/ranking-formulas/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    query.delete('ranking_formulas', id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ══════════════════════════════════════════════════════
// SELECTION STRATEGIES
// ══════════════════════════════════════════════════════

router.get('/strategies', (req, res) => {
  try {
    const strategies = query.all('selection_strategies');
    const enriched = strategies.map(s => ({
      ...s,
      collection: s.collection_id ? query.get('collections', s.collection_id) : null,
      eligibility_rule: s.eligibility_rule_id ? query.get('decision_rules', s.eligibility_rule_id) : null,
      ranking_formula: s.ranking_formula_id ? query.get('ranking_formulas', s.ranking_formula_id) : null
    }));
    res.json({ strategies: enriched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/strategies/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const strategy = query.get('selection_strategies', id);
    if (!strategy) return res.status(404).json({ error: 'Strategy not found' });

    const enriched = {
      ...strategy,
      collection: strategy.collection_id ? query.get('collections', strategy.collection_id) : null,
      eligibility_rule: strategy.eligibility_rule_id ? query.get('decision_rules', strategy.eligibility_rule_id) : null,
      ranking_formula: strategy.ranking_formula_id ? query.get('ranking_formulas', strategy.ranking_formula_id) : null
    };
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/strategies', (req, res) => {
  try {
    const { name, description, collection_id, eligibility_rule_id, ranking_method = 'priority', ranking_formula_id, ranking_model_id } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const result = query.insert('selection_strategies', {
      name,
      description: description || '',
      collection_id: collection_id ? parseInt(collection_id) : null,
      eligibility_rule_id: eligibility_rule_id ? parseInt(eligibility_rule_id) : null,
      ranking_method,
      ranking_formula_id: ranking_formula_id ? parseInt(ranking_formula_id) : null,
      ranking_model_id: ranking_model_id ? parseInt(ranking_model_id) : null,
      status: 'active'
    });
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/strategies/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const strategy = query.get('selection_strategies', id);
    if (!strategy) return res.status(404).json({ error: 'Strategy not found' });

    const updates = {};
    ['name', 'description', 'collection_id', 'eligibility_rule_id', 'ranking_method', 'ranking_formula_id', 'ranking_model_id', 'status'].forEach(f => {
      if (req.body[f] !== undefined) {
        updates[f] = ['collection_id', 'eligibility_rule_id', 'ranking_formula_id', 'ranking_model_id'].includes(f) && req.body[f]
          ? parseInt(req.body[f]) : req.body[f];
      }
    });

    query.update('selection_strategies', id, updates);
    res.json(query.get('selection_strategies', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/strategies/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    query.delete('selection_strategies', id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ══════════════════════════════════════════════════════
// DECISIONS (Policies)
// ══════════════════════════════════════════════════════

router.get('/', (req, res) => {
  try {
    let decisions = query.all('decisions');
    const { status, search } = req.query;
    if (status) decisions = decisions.filter(d => d.status === status);
    if (search) {
      const s = search.toLowerCase();
      decisions = decisions.filter(d =>
        (d.name || '').toLowerCase().includes(s) ||
        (d.description || '').toLowerCase().includes(s)
      );
    }

    // Enrich with stats
    const enriched = decisions.map(d => {
      const placementCount = (d.placement_configs || []).length;
      const propositionCount = query.count('offer_propositions', p => p.decision_id === d.id);
      return { ...d, placement_count: placementCount, proposition_count: propositionCount };
    });

    enriched.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    res.json({ decisions: enriched, total: enriched.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const decision = query.get('decisions', id);
    if (!decision) return res.status(404).json({ error: 'Decision not found' });

    // Enrich placement configs
    const enrichedConfigs = (decision.placement_configs || []).map(pc => ({
      ...pc,
      placement: query.get('placements', pc.placement_id),
      selection_strategy: pc.selection_strategy_id ? query.get('selection_strategies', pc.selection_strategy_id) : null,
      fallback_offer: pc.fallback_offer_id ? query.get('offers', pc.fallback_offer_id) : null
    }));

    const propositionCount = query.count('offer_propositions', p => p.decision_id === id);

    res.json({ ...decision, placement_configs: enrichedConfigs, proposition_count: propositionCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, description, placement_configs = [] } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const result = query.insert('decisions', {
      name,
      description: description || '',
      status: 'draft',
      placement_configs: placement_configs.map(pc => ({
        placement_id: parseInt(pc.placement_id),
        selection_strategy_id: pc.selection_strategy_id ? parseInt(pc.selection_strategy_id) : null,
        fallback_offer_id: pc.fallback_offer_id ? parseInt(pc.fallback_offer_id) : null
      }))
    });

    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const decision = query.get('decisions', id);
    if (!decision) return res.status(404).json({ error: 'Decision not found' });

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (req.body.placement_configs !== undefined) {
      updates.placement_configs = req.body.placement_configs.map(pc => ({
        placement_id: parseInt(pc.placement_id),
        selection_strategy_id: pc.selection_strategy_id ? parseInt(pc.selection_strategy_id) : null,
        fallback_offer_id: pc.fallback_offer_id ? parseInt(pc.fallback_offer_id) : null
      }));
    }

    query.update('decisions', id, updates);
    res.json(query.get('decisions', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    query.delete('decisions', id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lifecycle
router.post('/:id/activate', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const decision = query.get('decisions', id);
    if (!decision) return res.status(404).json({ error: 'Decision not found' });
    query.update('decisions', id, { status: 'live', activated_at: new Date().toISOString() });
    res.json(query.get('decisions', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/deactivate', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    query.update('decisions', id, { status: 'draft' });
    res.json(query.get('decisions', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/archive', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    query.update('decisions', id, { status: 'archived' });
    res.json(query.get('decisions', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ══════════════════════════════════════════════════════
// READINESS CHECK (diagnostic for email editor)
// ══════════════════════════════════════════════════════

router.get('/:id/readiness', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const placementId = req.query.placement_id ? parseInt(req.query.placement_id) : null;
    const decision = query.get('decisions', id);
    if (!decision) return res.status(404).json({ error: 'Decision not found' });

    const checks = [];
    let ready = true;

    // 1. Decision status
    if (decision.status === 'live') {
      checks.push({ key: 'decision_status', ok: true, label: 'Decision is live' });
    } else {
      checks.push({ key: 'decision_status', ok: false, severity: 'error',
        label: `Decision is "${decision.status}"`,
        fix: 'Activate this decision from Offer Decisioning > Decisions' });
      ready = false;
    }

    // 2. Placement configs
    const configs = decision.placement_configs || [];
    if (configs.length === 0) {
      checks.push({ key: 'placement_slots', ok: false, severity: 'error',
        label: 'Decision has no placement slots configured',
        fix: 'Edit the decision and add at least one placement slot' });
      ready = false;
    } else {
      checks.push({ key: 'placement_slots', ok: true, label: `${configs.length} placement slot(s) configured` });
    }

    // 3. Check specific placement if provided
    if (placementId) {
      const slot = configs.find(c => c.placement_id === placementId);
      const placement = query.get('placements', placementId);

      if (!slot) {
        checks.push({ key: 'placement_match', ok: false, severity: 'error',
          label: `Placement "${placement?.name || placementId}" is not in this decision`,
          fix: 'Edit the decision and add this placement, or choose a different placement' });
        ready = false;
      } else {
        checks.push({ key: 'placement_match', ok: true, label: `Placement "${placement?.name || placementId}" is configured` });

        // 4. Strategy
        if (slot.selection_strategy_id) {
          const strategy = query.get('selection_strategies', slot.selection_strategy_id);
          if (strategy) {
            checks.push({ key: 'strategy', ok: true, label: `Strategy: "${strategy.name}"` });

            // 5. Collection
            if (strategy.collection_id) {
              const collection = query.get('collections', strategy.collection_id);
              if (collection) {
                let offerCount = 0;
                if (collection.type === 'static') {
                  offerCount = (collection.offer_ids || []).length;
                } else {
                  const qualifierIds = collection.qualifier_ids || [];
                  if (qualifierIds.length === 0) {
                    offerCount = query.count('offers', o => o.status === 'live' && o.type === 'personalized');
                  } else {
                    const matchingOfferIds = new Set();
                    const allTags = query.all('offer_tags');
                    for (const tag of allTags) {
                      if (qualifierIds.includes(tag.qualifier_id)) matchingOfferIds.add(tag.offer_id);
                    }
                    offerCount = [...matchingOfferIds].filter(oid => {
                      const o = query.get('offers', oid);
                      return o && o.status === 'live' && o.type === 'personalized';
                    }).length;
                  }
                }
                checks.push({ key: 'collection', ok: offerCount > 0,
                  severity: offerCount === 0 ? 'warning' : undefined,
                  label: `Collection "${collection.name}" has ${offerCount} offer(s)`,
                  fix: offerCount === 0 ? 'Add live offers to this collection' : undefined });
                if (offerCount === 0) ready = false;
              }
            }
          } else {
            checks.push({ key: 'strategy', ok: false, severity: 'warning',
              label: 'Strategy not found',
              fix: 'Edit the decision and assign a valid strategy' });
          }
        } else {
          checks.push({ key: 'strategy', ok: false, severity: 'warning',
            label: 'No strategy assigned to this placement slot',
            fix: 'Edit the decision and assign a selection strategy' });
        }

        // 6. Live offers with representations for this placement
        const reps = query.all('offer_representations', r => r.placement_id === placementId);
        const liveRepOfferIds = reps
          .map(r => r.offer_id)
          .filter(oid => {
            const o = query.get('offers', oid);
            return o && o.status === 'live' && o.type === 'personalized';
          });
        const uniqueLiveOffers = [...new Set(liveRepOfferIds)];

        if (uniqueLiveOffers.length > 0) {
          checks.push({ key: 'live_offers_with_reps', ok: true,
            label: `${uniqueLiveOffers.length} live offer(s) have content for this placement` });
        } else {
          checks.push({ key: 'live_offers_with_reps', ok: false, severity: 'error',
            label: 'No live offers have content (representations) for this placement',
            fix: 'Go to Offers > edit an offer > add a Representation for this placement, then Publish the offer' });
          ready = false;
        }

        // 7. Fallback
        if (slot.fallback_offer_id) {
          const fallback = query.get('offers', slot.fallback_offer_id);
          if (fallback) {
            const fbRep = query.get('offer_representations',
              r => r.offer_id === fallback.id && r.placement_id === placementId);
            if (fbRep) {
              checks.push({ key: 'fallback', ok: true, label: `Fallback offer "${fallback.name}" has content` });
            } else {
              checks.push({ key: 'fallback', ok: false, severity: 'warning',
                label: `Fallback offer "${fallback.name}" has no content for this placement`,
                fix: 'Edit the fallback offer and add a Representation for this placement' });
            }
          }
        } else {
          checks.push({ key: 'fallback', ok: false, severity: 'warning',
            label: 'No fallback offer configured',
            fix: 'Edit the decision and set a fallback offer for this placement slot' });
        }
      }
    }

    res.json({ decision_id: id, placement_id: placementId, ready, checks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ══════════════════════════════════════════════════════
// RESOLVE & SIMULATE
// ══════════════════════════════════════════════════════

// Real-time resolution
router.post('/:id/resolve', (req, res) => {
  try {
    const decisionId = parseInt(req.params.id);
    const { contact_id, context = {} } = req.body;
    if (!contact_id) return res.status(400).json({ error: 'contact_id is required' });

    const result = resolve(parseInt(contact_id), decisionId, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simulation (doesn't log propositions)
router.post('/:id/simulate', (req, res) => {
  try {
    const decisionId = parseInt(req.params.id);
    const { contact_id, context = {} } = req.body;
    if (!contact_id) return res.status(400).json({ error: 'contact_id is required' });

    const result = simulate(parseInt(contact_id), decisionId, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch simulation (test with multiple contacts)
router.post('/:id/simulate-batch', (req, res) => {
  try {
    const decisionId = parseInt(req.params.id);
    const { contact_ids, sample_size = 20, context = {} } = req.body;

    let contactIds = contact_ids;
    if (!contactIds || contactIds.length === 0) {
      // Random sample
      const allContacts = query.all('contacts');
      const shuffled = allContacts.sort(() => 0.5 - Math.random());
      contactIds = shuffled.slice(0, Math.min(sample_size, 50)).map(c => c.id);
    }

    const results = contactIds.map(cid => {
      try {
        const result = simulate(cid, decisionId, context);
        const contact = query.get('contacts', cid);
        return {
          contact_id: cid,
          contact_name: contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown',
          placements: result.placements.map(p => ({
            placement: p.placement_name,
            offer: p.offers.length > 0 ? p.offers[0].offer_name : 'None',
            fallback_used: p.fallback_used
          }))
        };
      } catch (e) {
        return { contact_id: cid, error: e.message };
      }
    });

    // Summary stats
    const offerDistribution = {};
    let totalFallback = 0;
    for (const r of results) {
      if (r.placements) {
        for (const p of r.placements) {
          if (p.offer !== 'None') {
            offerDistribution[p.offer] = (offerDistribution[p.offer] || 0) + 1;
          }
          if (p.fallback_used) totalFallback++;
        }
      }
    }

    res.json({
      decision_id: decisionId,
      contacts_tested: results.length,
      results,
      summary: {
        offer_distribution: offerDistribution,
        fallback_rate: results.length > 0 ? ((totalFallback / results.length) * 100).toFixed(1) : '0.0'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ══════════════════════════════════════════════════════
// DECISION ANALYTICS / REPORT
// ══════════════════════════════════════════════════════

router.get('/:id/report', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const decision = query.get('decisions', id);
    if (!decision) return res.status(404).json({ error: 'Decision not found' });

    const propositions = query.all('offer_propositions', p => p.decision_id === id);
    const propIds = new Set(propositions.map(p => p.id));
    const events = query.all('offer_events', e => propIds.has(e.proposition_id));

    const impressions = events.filter(e => e.event_type === 'impression').length;
    const clicks = events.filter(e => e.event_type === 'click').length;
    const conversions = events.filter(e => e.event_type === 'conversion').length;

    // Offer distribution
    const offerDist = {};
    for (const p of propositions) {
      const offer = query.get('offers', p.offer_id);
      const name = offer ? offer.name : `Offer #${p.offer_id}`;
      if (!offerDist[name]) offerDist[name] = { proposed: 0, is_fallback: 0 };
      offerDist[name].proposed++;
      if (p.is_fallback) offerDist[name].is_fallback++;
    }

    // Channel breakdown
    const channelDist = {};
    for (const p of propositions) {
      const ch = p.channel || 'unknown';
      channelDist[ch] = (channelDist[ch] || 0) + 1;
    }

    // Daily trend (last 30 days)
    const daily = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      daily[d.toISOString().split('T')[0]] = { propositions: 0, impressions: 0, clicks: 0, conversions: 0 };
    }
    for (const p of propositions) {
      const key = (p.timestamp || p.created_at).split('T')[0];
      if (daily[key]) daily[key].propositions++;
    }
    for (const e of events) {
      const key = (e.timestamp || e.created_at).split('T')[0];
      if (daily[key]) {
        if (e.event_type === 'impression') daily[key].impressions++;
        if (e.event_type === 'click') daily[key].clicks++;
        if (e.event_type === 'conversion') daily[key].conversions++;
      }
    }

    res.json({
      decision_id: id,
      decision_name: decision.name,
      total_propositions: propositions.length,
      unique_contacts: new Set(propositions.map(p => p.contact_id)).size,
      fallback_count: propositions.filter(p => p.is_fallback).length,
      fallback_rate: propositions.length > 0
        ? ((propositions.filter(p => p.is_fallback).length / propositions.length) * 100).toFixed(1) : '0.0',
      impressions, clicks, conversions,
      click_rate: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00',
      conversion_rate: impressions > 0 ? ((conversions / impressions) * 100).toFixed(2) : '0.00',
      offer_distribution: offerDist,
      channel_distribution: channelDist,
      daily_trend: Object.entries(daily).map(([date, data]) => ({ date, ...data }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ══════════════════════════════════════════════════════
// PROPOSITIONS (Tracking)
// ══════════════════════════════════════════════════════

// Get propositions (filterable)
router.get('/propositions/list', (req, res) => {
  try {
    let props = query.all('offer_propositions');
    const { offer_id, contact_id, decision_id, channel } = req.query;

    if (offer_id) props = props.filter(p => p.offer_id === parseInt(offer_id));
    if (contact_id) props = props.filter(p => p.contact_id === parseInt(contact_id));
    if (decision_id) props = props.filter(p => p.decision_id === parseInt(decision_id));
    if (channel) props = props.filter(p => p.channel === channel);

    // Enrich
    const enriched = props.slice(-200).map(p => ({
      ...p,
      offer_name: (query.get('offers', p.offer_id) || {}).name || 'Unknown',
      contact_name: (() => { const c = query.get('contacts', p.contact_id); return c ? `${c.first_name} ${c.last_name}` : 'Unknown'; })(),
      decision_name: (query.get('decisions', p.decision_id) || {}).name || 'Unknown'
    }));

    enriched.sort((a, b) => new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at));
    res.json({ propositions: enriched, total: props.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track events
router.post('/propositions/:propId/impression', (req, res) => {
  try {
    const propId = parseInt(req.params.propId);
    const prop = query.get('offer_propositions', propId);
    if (!prop) return res.status(404).json({ error: 'Proposition not found' });

    query.update('offer_propositions', propId, { status: 'viewed' });
    const result = query.insert('offer_events', {
      proposition_id: propId,
      event_type: 'impression',
      timestamp: new Date().toISOString(),
      metadata: req.body.metadata || {}
    });
    res.json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/propositions/:propId/click', (req, res) => {
  try {
    const propId = parseInt(req.params.propId);
    const prop = query.get('offer_propositions', propId);
    if (!prop) return res.status(404).json({ error: 'Proposition not found' });

    query.update('offer_propositions', propId, { status: 'clicked' });
    const result = query.insert('offer_events', {
      proposition_id: propId,
      event_type: 'click',
      timestamp: new Date().toISOString(),
      metadata: req.body.metadata || {}
    });
    res.json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/propositions/:propId/conversion', (req, res) => {
  try {
    const propId = parseInt(req.params.propId);
    const prop = query.get('offer_propositions', propId);
    if (!prop) return res.status(404).json({ error: 'Proposition not found' });

    query.update('offer_propositions', propId, { status: 'converted' });
    const result = query.insert('offer_events', {
      proposition_id: propId,
      event_type: 'conversion',
      timestamp: new Date().toISOString(),
      metadata: req.body.metadata || {}
    });
    res.json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/propositions/:propId/dismiss', (req, res) => {
  try {
    const propId = parseInt(req.params.propId);
    const prop = query.get('offer_propositions', propId);
    if (!prop) return res.status(404).json({ error: 'Proposition not found' });

    query.update('offer_propositions', propId, { status: 'dismissed' });
    const result = query.insert('offer_events', {
      proposition_id: propId,
      event_type: 'dismiss',
      timestamp: new Date().toISOString(),
      metadata: req.body.metadata || {}
    });
    res.json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ══════════════════════════════════════════════════════
// GLOBAL OFFER ANALYTICS
// ══════════════════════════════════════════════════════

router.get('/analytics/overview', (req, res) => {
  try {
    const offers = query.all('offers');
    const decisions = query.all('decisions');
    const propositions = query.all('offer_propositions');
    const events = query.all('offer_events');
    const placements = query.all('placements');
    const collections = query.all('collections');

    const impressions = events.filter(e => e.event_type === 'impression').length;
    const clicks = events.filter(e => e.event_type === 'click').length;
    const conversions = events.filter(e => e.event_type === 'conversion').length;

    // Top offers by propositions
    const offerCounts = {};
    for (const p of propositions) {
      offerCounts[p.offer_id] = (offerCounts[p.offer_id] || 0) + 1;
    }
    const topOffers = Object.entries(offerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id, count]) => {
        const offer = query.get('offers', parseInt(id));
        return { id: parseInt(id), name: offer ? offer.name : `Offer #${id}`, propositions: count };
      });

    // Eligibility funnel
    const totalProposed = propositions.length;
    const fallbackCount = propositions.filter(p => p.is_fallback).length;

    res.json({
      summary: {
        total_offers: offers.length,
        live_offers: offers.filter(o => o.status === 'live').length,
        draft_offers: offers.filter(o => o.status === 'draft').length,
        total_decisions: decisions.length,
        live_decisions: decisions.filter(d => d.status === 'live').length,
        total_placements: placements.length,
        total_collections: collections.length,
        total_propositions: totalProposed,
        total_impressions: impressions,
        total_clicks: clicks,
        total_conversions: conversions,
        click_rate: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00',
        conversion_rate: impressions > 0 ? ((conversions / impressions) * 100).toFixed(2) : '0.00',
        fallback_rate: totalProposed > 0 ? ((fallbackCount / totalProposed) * 100).toFixed(1) : '0.0',
        unique_contacts_reached: new Set(propositions.map(p => p.contact_id)).size
      },
      top_offers: topOffers,
      offers_by_status: {
        draft: offers.filter(o => o.status === 'draft').length,
        approved: offers.filter(o => o.status === 'approved').length,
        live: offers.filter(o => o.status === 'live').length,
        archived: offers.filter(o => o.status === 'archived').length
      },
      offers_by_type: {
        personalized: offers.filter(o => o.type === 'personalized').length,
        fallback: offers.filter(o => o.type === 'fallback').length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
