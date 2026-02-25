/**
 * Decision Rules API – Eligibility rules for offer targeting
 * Reuses the segment-builder condition format (entity, attribute, operator, value)
 */
const express = require('express');
const router = express.Router();
const { query } = require('../database');
const { evaluateEligibility } = require('../services/decisionEngine');

// List rules
router.get('/', (req, res) => {
  try {
    let rules = query.all('decision_rules');
    const { status, search } = req.query;
    if (status) rules = rules.filter(r => r.status === status);
    if (search) {
      const s = search.toLowerCase();
      rules = rules.filter(r =>
        (r.name || '').toLowerCase().includes(s) ||
        (r.description || '').toLowerCase().includes(s)
      );
    }

    // Enrich with usage count
    const enriched = rules.map(r => {
      const offerCount = query.count('offers', o => o.eligibility_rule_id === r.id);
      const strategyCount = query.count('selection_strategies', s => s.eligibility_rule_id === r.id);
      return { ...r, offer_count: offerCount, strategy_count: strategyCount, usage_count: offerCount + strategyCount };
    });

    enriched.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    res.json({ rules: enriched, total: enriched.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single rule
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rule = query.get('decision_rules', id);
    if (!rule) return res.status(404).json({ error: 'Decision rule not found' });
    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create rule
router.post('/', (req, res) => {
  try {
    const { name, description, conditions = [], logic = 'AND', folder_id = null } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const result = query.insert('decision_rules', {
      name,
      description: description || '',
      conditions,
      logic,
      folder_id: folder_id ? parseInt(folder_id) : null,
      status: 'active'
    });

    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update rule
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rule = query.get('decision_rules', id);
    if (!rule) return res.status(404).json({ error: 'Decision rule not found' });

    const updates = {};
    ['name', 'description', 'conditions', 'logic', 'status', 'folder_id'].forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    query.update('decision_rules', id, updates);
    res.json(query.get('decision_rules', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete rule
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Check for usage
    const offerCount = query.count('offers', o => o.eligibility_rule_id === id);
    if (offerCount > 0) {
      return res.status(400).json({ error: `Rule is used by ${offerCount} offers. Remove associations first.` });
    }
    query.delete('decision_rules', id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Evaluate a rule against a specific contact (for testing)
router.post('/evaluate', (req, res) => {
  try {
    const { rule_id, contact_id } = req.body;
    if (!rule_id || !contact_id) {
      return res.status(400).json({ error: 'rule_id and contact_id are required' });
    }

    const contact = query.get('contacts', parseInt(contact_id));
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    const rule = query.get('decision_rules', parseInt(rule_id));
    if (!rule) return res.status(404).json({ error: 'Rule not found' });

    const eligible = evaluateEligibility(parseInt(rule_id), contact);

    // Provide per-condition breakdown
    const conditionResults = (rule.conditions || []).map(cond => {
      let value;
      if (!cond.entity || cond.entity === 'contact' || cond.entity === 'profile') {
        value = contact[cond.attribute];
      } else {
        value = null;
      }
      return {
        ...cond,
        actual_value: value,
        result: eligible // simplified; full per-condition eval would need extraction
      };
    });

    res.json({
      eligible,
      rule_id: rule.id,
      contact_id: contact.id,
      contact_name: `${contact.first_name} ${contact.last_name}`,
      logic: rule.logic,
      conditions: conditionResults
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Preview: count how many contacts match a rule
router.post('/preview', (req, res) => {
  try {
    const { rule_id } = req.body;
    if (!rule_id) return res.status(400).json({ error: 'rule_id is required' });

    const contacts = query.all('contacts');
    let matchCount = 0;
    const samples = [];

    for (const contact of contacts) {
      const eligible = evaluateEligibility(parseInt(rule_id), contact);
      if (eligible) {
        matchCount++;
        if (samples.length < 10) {
          samples.push({ id: contact.id, name: `${contact.first_name} ${contact.last_name}`, email: contact.email });
        }
      }
    }

    res.json({
      total_contacts: contacts.length,
      matching_contacts: matchCount,
      match_percentage: ((matchCount / contacts.length) * 100).toFixed(1),
      sample_matches: samples
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
