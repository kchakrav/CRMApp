/**
 * Placements API – Where offers appear (email banner, web hero, SMS, etc.)
 */
const express = require('express');
const router = express.Router();
const { query } = require('../database');

// List placements
router.get('/', (req, res) => {
  try {
    let placements = query.all('placements');
    const { channel, content_type, status } = req.query;

    if (channel) placements = placements.filter(p => p.channel === channel);
    if (content_type) placements = placements.filter(p => p.content_type === content_type);
    if (status) placements = placements.filter(p => p.status === status);

    // Enrich with usage counts
    const enriched = placements.map(p => {
      const repCount = query.count('offer_representations', r => r.placement_id === p.id);
      const decisionCount = query.count('decisions', d =>
        (d.placement_configs || []).some(pc => pc.placement_id === p.id)
      );
      return { ...p, offer_count: repCount, decision_count: decisionCount };
    });

    enriched.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    res.json({ placements: enriched, total: enriched.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single placement
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const placement = query.get('placements', id);
    if (!placement) return res.status(404).json({ error: 'Placement not found' });

    const representations = query.all('offer_representations', r => r.placement_id === id);
    const offers = representations.map(r => {
      const offer = query.get('offers', r.offer_id);
      return offer ? { ...offer, representation: r } : null;
    }).filter(Boolean);

    res.json({ ...placement, offers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create placement
router.post('/', (req, res) => {
  try {
    const { name, description, channel, content_type, max_items = 1 } = req.body;
    if (!name || !channel || !content_type) {
      return res.status(400).json({ error: 'name, channel, and content_type are required' });
    }

    const validChannels = ['email', 'web', 'mobile', 'sms', 'push', 'any'];
    if (!validChannels.includes(channel)) {
      return res.status(400).json({ error: `channel must be one of: ${validChannels.join(', ')}` });
    }

    const validTypes = ['html', 'image', 'text', 'json'];
    if (!validTypes.includes(content_type)) {
      return res.status(400).json({ error: `content_type must be one of: ${validTypes.join(', ')}` });
    }

    const result = query.insert('placements', {
      name,
      description: description || '',
      channel,
      content_type,
      max_items: parseInt(max_items) || 1,
      status: 'active'
    });

    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update placement
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const placement = query.get('placements', id);
    if (!placement) return res.status(404).json({ error: 'Placement not found' });

    const updates = {};
    ['name', 'description', 'channel', 'content_type', 'max_items', 'status'].forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    if (updates.max_items) updates.max_items = parseInt(updates.max_items) || 1;

    query.update('placements', id, updates);
    res.json(query.get('placements', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete placement
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const placement = query.get('placements', id);
    if (!placement) return res.status(404).json({ error: 'Placement not found' });

    // Check for usage
    const repCount = query.count('offer_representations', r => r.placement_id === id);
    if (repCount > 0) {
      return res.status(400).json({ error: `Placement is used by ${repCount} offer representations. Remove them first.` });
    }

    query.delete('placements', id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
