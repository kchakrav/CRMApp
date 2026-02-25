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
    const {
      name, description, collection_id, eligibility_rule_id,
      ranking_method = 'priority', ranking_formula_id, ranking_model_id,
      folder_id = null, eligibility_type = 'all',
      eligibility_audience_ids = [], audience_logic = 'OR'
    } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const result = query.insert('selection_strategies', {
      name,
      description: description || '',
      collection_id: collection_id ? parseInt(collection_id) : null,
      eligibility_type: eligibility_type || 'all',
      eligibility_rule_id: eligibility_rule_id ? parseInt(eligibility_rule_id) : null,
      eligibility_audience_ids: eligibility_audience_ids || [],
      audience_logic: audience_logic || 'OR',
      ranking_method,
      ranking_formula_id: ranking_formula_id ? parseInt(ranking_formula_id) : null,
      ranking_model_id: ranking_model_id ? parseInt(ranking_model_id) : null,
      folder_id: folder_id ? parseInt(folder_id) : null,
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
    ['name', 'description', 'collection_id', 'eligibility_rule_id', 'ranking_method', 'ranking_formula_id', 'ranking_model_id', 'status', 'folder_id', 'eligibility_type', 'audience_logic'].forEach(f => {
      if (req.body[f] !== undefined) {
        updates[f] = ['collection_id', 'eligibility_rule_id', 'ranking_formula_id', 'ranking_model_id', 'folder_id'].includes(f) && req.body[f]
          ? parseInt(req.body[f]) : req.body[f];
      }
    });
    if (req.body.eligibility_audience_ids !== undefined) updates.eligibility_audience_ids = req.body.eligibility_audience_ids;

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
// CONTEXT DATA SCHEMA
// ══════════════════════════════════════════════════════

router.get('/context-schema', (req, res) => {
  try {
    const attrs = query.all('context_schema');
    attrs.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    res.json({ attributes: attrs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/context-schema', (req, res) => {
  try {
    const { name, label, type = 'string', description, example_value } = req.body;
    if (!name || !label) return res.status(400).json({ error: 'name and label are required' });
    const existing = query.all('context_schema');
    if (existing.find(a => a.name === name)) return res.status(400).json({ error: 'Attribute name already exists' });
    const result = query.insert('context_schema', {
      name, label, type, description: description || '', example_value: example_value || null, sort_order: existing.length
    });
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/context-schema/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const attr = query.get('context_schema', id);
    if (!attr) return res.status(404).json({ error: 'Attribute not found' });
    const updates = {};
    ['label', 'type', 'description', 'example_value', 'sort_order'].forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    query.update('context_schema', id, updates);
    res.json(query.get('context_schema', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/context-schema/:id', (req, res) => {
  try { const id = parseInt(req.params.id); query.delete('context_schema', id); res.json({ success: true }); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

// ══════════════════════════════════════════════════════
// AI RANKING MODELS
// ══════════════════════════════════════════════════════

router.get('/ai-models', (req, res) => {
  try {
    const models = query.all('ranking_ai_models');
    models.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    res.json({ models });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/ai-models', (req, res) => {
  try {
    const { name, description, type = 'auto_optimization', optimization_goal = 'clicks' } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = query.insert('ranking_ai_models', {
      name, description: description || '', type, optimization_goal,
      status: 'draft', training_status: 'not_started', last_trained_at: null,
      metrics: { lift: null, confidence: null, offers_evaluated: 0, min_impressions: type === 'personalized' ? 250 : 100 },
      features: ['placement_id', 'offer_priority', 'offer_age', 'user_segment']
    });
    res.status(201).json(result.record);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/ai-models/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const model = query.get('ranking_ai_models', id);
    if (!model) return res.status(404).json({ error: 'Model not found' });
    const updates = {};
    ['name', 'description', 'type', 'optimization_goal', 'status', 'training_status', 'metrics', 'features'].forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    query.update('ranking_ai_models', id, updates);
    res.json(query.get('ranking_ai_models', id));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/ai-models/:id/train', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const model = query.get('ranking_ai_models', id);
    if (!model) return res.status(404).json({ error: 'Model not found' });
    const offersCount = query.count('offers', o => o.status === 'live');
    const propsCount = query.count('offer_propositions');
    const lift = (5 + Math.random() * 25).toFixed(1);
    const confidence = (80 + Math.random() * 19).toFixed(1);
    query.update('ranking_ai_models', id, {
      status: 'active', training_status: 'trained', last_trained_at: new Date().toISOString(),
      metrics: { lift: parseFloat(lift), confidence: parseFloat(confidence), offers_evaluated: offersCount, propositions_analyzed: propsCount, min_impressions: model.type === 'personalized' ? 250 : 100, training_duration_seconds: Math.floor(30 + Math.random() * 120) }
    });
    res.json(query.get('ranking_ai_models', id));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/ai-models/:id', (req, res) => {
  try { const id = parseInt(req.params.id); query.delete('ranking_ai_models', id); res.json({ success: true }); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

// Ranking formula test
router.post('/ranking-formulas/test', (req, res) => {
  try {
    const { expression, offer_data = {}, profile_data = {}, context_data = {} } = req.body;
    if (!expression) return res.status(400).json({ error: 'expression is required' });
    const { evaluateFormula } = require('../services/rankingService');
    const testOffer = { priority: 50, attributes: {}, ...offer_data };
    const score = evaluateFormula(expression, testOffer, profile_data, context_data);
    res.json({ expression, score, valid: typeof score === 'number' && isFinite(score) });
  } catch (error) { res.status(500).json({ error: error.message }); }
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
    const { name, description, placement_configs = [], folder_id = null, arbitration = {} } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const result = query.insert('decisions', {
      name,
      description: description || '',
      status: 'draft',
      folder_id: folder_id ? parseInt(folder_id) : null,
      placement_configs: placement_configs.map(pc => ({
        placement_id: parseInt(pc.placement_id),
        selection_strategy_id: pc.selection_strategy_id ? parseInt(pc.selection_strategy_id) : null,
        fallback_offer_id: pc.fallback_offer_id ? parseInt(pc.fallback_offer_id) : null,
        max_items: parseInt(pc.max_items) || 1
      })),
      arbitration: {
        method: arbitration.method || 'priority_order',
        dedup_policy: arbitration.dedup_policy || 'no_duplicates',
        tiebreak_rule: arbitration.tiebreak_rule || 'random',
        global_offer_limit: parseInt(arbitration.global_offer_limit) || 0,
        suppression_window_hours: parseInt(arbitration.suppression_window_hours) || 0,
        priority_weight: parseFloat(arbitration.priority_weight) || 60,
        recency_weight: parseFloat(arbitration.recency_weight) || 20,
        performance_weight: parseFloat(arbitration.performance_weight) || 20
      }
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
    if (req.body.folder_id !== undefined) updates.folder_id = req.body.folder_id ? parseInt(req.body.folder_id) : null;
    if (req.body.arbitration !== undefined) {
      const arb = req.body.arbitration;
      updates.arbitration = {
        method: arb.method || 'priority_order',
        dedup_policy: arb.dedup_policy || 'no_duplicates',
        tiebreak_rule: arb.tiebreak_rule || 'random',
        global_offer_limit: parseInt(arb.global_offer_limit) || 0,
        suppression_window_hours: parseInt(arb.suppression_window_hours) || 0,
        priority_weight: parseFloat(arb.priority_weight) || 60,
        recency_weight: parseFloat(arb.recency_weight) || 20,
        performance_weight: parseFloat(arb.performance_weight) || 20
      };
    }
    if (req.body.placement_configs !== undefined) {
      updates.placement_configs = req.body.placement_configs.map(pc => ({
        placement_id: parseInt(pc.placement_id),
        selection_strategy_id: pc.selection_strategy_id ? parseInt(pc.selection_strategy_id) : null,
        fallback_offer_id: pc.fallback_offer_id ? parseInt(pc.fallback_offer_id) : null,
        max_items: parseInt(pc.max_items) || 1
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
    const { contact_id, context = {}, trace = false } = req.body;
    if (!contact_id) return res.status(400).json({ error: 'contact_id is required' });

    const result = simulate(parseInt(contact_id), decisionId, context, trace);
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

// ══════════════════════════════════════════════════════
// EXPERIMENTS (A/B Testing on Decisions)
// ══════════════════════════════════════════════════════

router.get('/:id/experiments', (req, res) => {
  try {
    const decisionId = parseInt(req.params.id);
    const experiments = query.all('experiments', e => e.decision_id === decisionId);
    experiments.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    res.json({ experiments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/experiments', (req, res) => {
  try {
    const decisionId = parseInt(req.params.id);
    const decision = query.get('decisions', decisionId);
    if (!decision) return res.status(404).json({ error: 'Decision not found' });

    const { name, description, treatments = [], start_date, end_date, objective = 'clicks' } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    if (treatments.length < 2) return res.status(400).json({ error: 'At least 2 treatments required' });

    const totalPct = treatments.reduce((sum, t) => sum + (t.traffic_pct || 0), 0);
    if (Math.abs(totalPct - 100) > 1) return res.status(400).json({ error: 'Traffic percentages must sum to 100%' });

    const result = query.insert('experiments', {
      decision_id: decisionId,
      name,
      description: description || '',
      status: 'draft',
      objective,
      treatments: treatments.map((t, i) => ({
        id: i + 1,
        name: t.name || `Treatment ${String.fromCharCode(65 + i)}`,
        selection_strategy_id: t.selection_strategy_id ? parseInt(t.selection_strategy_id) : null,
        traffic_pct: parseFloat(t.traffic_pct) || 0,
        impressions: 0, clicks: 0, conversions: 0
      })),
      start_date: start_date || null,
      end_date: end_date || null,
      winner_treatment_id: null,
      confidence_level: null
    });
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/experiments/:expId', (req, res) => {
  try {
    const expId = parseInt(req.params.expId);
    const exp = query.get('experiments', expId);
    if (!exp) return res.status(404).json({ error: 'Experiment not found' });

    const updates = {};
    ['name', 'description', 'status', 'objective', 'treatments', 'start_date', 'end_date', 'winner_treatment_id', 'confidence_level'].forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    query.update('experiments', expId, updates);
    res.json(query.get('experiments', expId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/experiments/:expId/start', (req, res) => {
  try {
    const expId = parseInt(req.params.expId);
    const exp = query.get('experiments', expId);
    if (!exp) return res.status(404).json({ error: 'Experiment not found' });
    query.update('experiments', expId, { status: 'running', started_at: new Date().toISOString() });
    res.json(query.get('experiments', expId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/experiments/:expId/stop', (req, res) => {
  try {
    const expId = parseInt(req.params.expId);
    const exp = query.get('experiments', expId);
    if (!exp) return res.status(404).json({ error: 'Experiment not found' });

    const treatments = exp.treatments || [];
    let winner = null;
    let bestRate = -1;
    for (const t of treatments) {
      const rate = t.impressions > 0 ? (exp.objective === 'conversions' ? t.conversions : t.clicks) / t.impressions : 0;
      if (rate > bestRate) { bestRate = rate; winner = t.id; }
    }

    query.update('experiments', expId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      winner_treatment_id: winner,
      confidence_level: treatments.length >= 2 ? (85 + Math.random() * 14).toFixed(1) : null
    });
    res.json(query.get('experiments', expId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/experiments/:expId', (req, res) => {
  try {
    const expId = parseInt(req.params.expId);
    query.delete('experiments', expId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
