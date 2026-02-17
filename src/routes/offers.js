/**
 * Offers API – Full CRUD + lifecycle management for personalized & fallback offers
 */
const express = require('express');
const router = express.Router();
const { query } = require('../database');

// ── List offers (with filtering) ──
router.get('/', (req, res) => {
  try {
    let offers = query.all('offers');
    const { type, status, tag, search, channel } = req.query;

    if (type) offers = offers.filter(o => o.type === type);
    if (status) offers = offers.filter(o => o.status === status);
    if (search) {
      const s = search.toLowerCase();
      offers = offers.filter(o =>
        (o.name || '').toLowerCase().includes(s) ||
        (o.description || '').toLowerCase().includes(s)
      );
    }

    // Filter by qualifier tag
    if (tag) {
      const tagId = parseInt(tag);
      const offerTagLinks = query.all('offer_tags', t => t.qualifier_id === tagId);
      const tagOfferIds = new Set(offerTagLinks.map(t => t.offer_id));
      offers = offers.filter(o => tagOfferIds.has(o.id));
    }

    // Filter by channel (offers that have representations for this channel)
    if (channel) {
      const placements = query.all('placements', p => p.channel === channel);
      const placementIds = new Set(placements.map(p => p.id));
      const reps = query.all('offer_representations', r => placementIds.has(r.placement_id));
      const offerIds = new Set(reps.map(r => r.offer_id));
      offers = offers.filter(o => offerIds.has(o.id));
    }

    // Enrich with tags and representation count
    const enriched = offers.map(o => {
      const tags = query.all('offer_tags', t => t.offer_id === o.id)
        .map(t => query.get('collection_qualifiers', t.qualifier_id))
        .filter(Boolean);
      const repCount = query.count('offer_representations', r => r.offer_id === o.id);
      const propositionCount = query.count('offer_propositions', p => p.offer_id === o.id);
      return { ...o, tags, representation_count: repCount, proposition_count: propositionCount };
    });

    // Sort by updated_at desc
    enriched.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    res.json({ offers: enriched, total: enriched.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Get single offer (with full details) ──
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const offer = query.get('offers', id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    // Enrich
    const tags = query.all('offer_tags', t => t.offer_id === id)
      .map(t => {
        const q = query.get('collection_qualifiers', t.qualifier_id);
        return q || null;
      }).filter(Boolean);

    const representations = query.all('offer_representations', r => r.offer_id === id)
      .map(r => {
        const placement = query.get('placements', r.placement_id);
        return { ...r, placement };
      });

    const constraint = query.get('offer_constraints', c => c.offer_id === id) || null;
    const eligibilityRule = offer.eligibility_rule_id
      ? query.get('decision_rules', offer.eligibility_rule_id) : null;

    // Performance
    const propositions = query.all('offer_propositions', p => p.offer_id === id);
    const events = query.all('offer_events', e => {
      const prop = query.get('offer_propositions', e.proposition_id);
      return prop && prop.offer_id === id;
    });

    const performance = {
      total_propositions: propositions.length,
      impressions: events.filter(e => e.event_type === 'impression').length,
      clicks: events.filter(e => e.event_type === 'click').length,
      conversions: events.filter(e => e.event_type === 'conversion').length,
      dismissals: events.filter(e => e.event_type === 'dismiss').length,
    };
    performance.click_rate = performance.impressions > 0
      ? ((performance.clicks / performance.impressions) * 100).toFixed(2) : '0.00';
    performance.conversion_rate = performance.impressions > 0
      ? ((performance.conversions / performance.impressions) * 100).toFixed(2) : '0.00';

    res.json({
      ...offer,
      tags,
      representations,
      constraint,
      eligibility_rule: eligibilityRule,
      performance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Create offer ──
router.post('/', (req, res) => {
  try {
    const {
      name, description, type = 'personalized', priority = 0,
      start_date, end_date, tags = [], attributes = {},
      eligibility_rule_id, image_url, status = 'draft'
    } = req.body;

    if (!name) return res.status(400).json({ error: 'name is required' });
    if (!['personalized', 'fallback'].includes(type)) {
      return res.status(400).json({ error: 'type must be personalized or fallback' });
    }

    const result = query.insert('offers', {
      name, description: description || '', type, status,
      priority: parseInt(priority) || 0,
      start_date: start_date || null,
      end_date: end_date || null,
      attributes: attributes || {},
      eligibility_rule_id: eligibility_rule_id ? parseInt(eligibility_rule_id) : null,
      image_url: image_url || null,
      created_by: req.body.created_by || 'System'
    });

    // Create tag associations
    if (tags.length > 0) {
      for (const tagId of tags) {
        query.insert('offer_tags', {
          offer_id: result.lastID,
          qualifier_id: parseInt(tagId)
        });
      }
    }

    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Update offer ──
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const offer = query.get('offers', id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    const {
      name, description, type, priority, start_date, end_date,
      tags, attributes, eligibility_rule_id, image_url, status
    } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (type !== undefined) updates.type = type;
    if (priority !== undefined) updates.priority = parseInt(priority) || 0;
    if (start_date !== undefined) updates.start_date = start_date;
    if (end_date !== undefined) updates.end_date = end_date;
    if (attributes !== undefined) updates.attributes = attributes;
    if (eligibility_rule_id !== undefined) updates.eligibility_rule_id = eligibility_rule_id ? parseInt(eligibility_rule_id) : null;
    if (image_url !== undefined) updates.image_url = image_url;
    if (status !== undefined) updates.status = status;

    query.update('offers', id, updates);

    // Update tags if provided
    if (tags !== undefined) {
      // Remove existing
      const existing = query.all('offer_tags', t => t.offer_id === id);
      existing.forEach(t => query.delete('offer_tags', t.id));
      // Add new
      for (const tagId of tags) {
        query.insert('offer_tags', { offer_id: id, qualifier_id: parseInt(tagId) });
      }
    }

    res.json(query.get('offers', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Delete offer ──
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const offer = query.get('offers', id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    // Clean up related data
    query.all('offer_tags', t => t.offer_id === id).forEach(t => query.delete('offer_tags', t.id));
    query.all('offer_representations', r => r.offer_id === id).forEach(r => query.delete('offer_representations', r.id));
    const constraint = query.get('offer_constraints', c => c.offer_id === id);
    if (constraint) query.delete('offer_constraints', constraint.id);

    query.delete('offers', id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Lifecycle transitions ──
router.post('/:id/approve', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const offer = query.get('offers', id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    if (offer.status !== 'draft') return res.status(400).json({ error: 'Only draft offers can be approved' });
    query.update('offers', id, { status: 'approved', approved_at: new Date().toISOString() });
    res.json(query.get('offers', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/publish', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const offer = query.get('offers', id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    if (!['draft', 'approved'].includes(offer.status)) {
      return res.status(400).json({ error: 'Only draft or approved offers can be published' });
    }
    query.update('offers', id, { status: 'live', published_at: new Date().toISOString() });
    res.json(query.get('offers', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/archive', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const offer = query.get('offers', id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    query.update('offers', id, { status: 'archived', archived_at: new Date().toISOString() });
    res.json(query.get('offers', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/duplicate', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const offer = query.get('offers', id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    const { id: _id, created_at, updated_at, ...offerData } = offer;
    const result = query.insert('offers', {
      ...offerData,
      name: `${offer.name} (Copy)`,
      status: 'draft'
    });

    // Copy representations
    const reps = query.all('offer_representations', r => r.offer_id === id);
    for (const rep of reps) {
      const { id: _rid, created_at: _rc, updated_at: _ru, ...repData } = rep;
      query.insert('offer_representations', { ...repData, offer_id: result.lastID });
    }

    // Copy tags
    const tags = query.all('offer_tags', t => t.offer_id === id);
    for (const tag of tags) {
      query.insert('offer_tags', { offer_id: result.lastID, qualifier_id: tag.qualifier_id });
    }

    // Copy constraints
    const constraint = query.get('offer_constraints', c => c.offer_id === id);
    if (constraint) {
      const { id: _cid, created_at: _cc, updated_at: _cu, ...cData } = constraint;
      query.insert('offer_constraints', { ...cData, offer_id: result.lastID });
    }

    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Offer Representations (content per placement) ──
router.get('/:id/representations', (req, res) => {
  try {
    const offerId = parseInt(req.params.id);
    const reps = query.all('offer_representations', r => r.offer_id === offerId);
    const enriched = reps.map(r => ({
      ...r,
      placement: query.get('placements', r.placement_id)
    }));
    res.json({ representations: enriched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/representations', (req, res) => {
  try {
    const offerId = parseInt(req.params.id);
    const offer = query.get('offers', offerId);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    const { placement_id, content_type, content, image_url, link_url, alt_text, blocks } = req.body;
    if (!placement_id) return res.status(400).json({ error: 'placement_id is required' });

    const result = query.insert('offer_representations', {
      offer_id: offerId,
      placement_id: parseInt(placement_id),
      content_type: content_type || 'html',
      content: content || '',
      image_url: image_url || '',
      link_url: link_url || '',
      alt_text: alt_text || '',
      blocks: blocks || null
    });

    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/representations/:repId', (req, res) => {
  try {
    const repId = parseInt(req.params.repId);
    const rep = query.get('offer_representations', repId);
    if (!rep) return res.status(404).json({ error: 'Representation not found' });

    const updates = {};
    ['content_type', 'content', 'image_url', 'link_url', 'alt_text', 'placement_id', 'blocks'].forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    query.update('offer_representations', repId, updates);
    res.json(query.get('offer_representations', repId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/representations/:repId', (req, res) => {
  try {
    const repId = parseInt(req.params.repId);
    query.delete('offer_representations', repId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Offer Constraints ──
router.get('/:id/constraints', (req, res) => {
  try {
    const offerId = parseInt(req.params.id);
    const constraint = query.get('offer_constraints', c => c.offer_id === offerId);
    res.json(constraint || { offer_id: offerId, frequency_period: 'lifetime', per_user_cap: 0, total_cap: 0, per_placement_caps: {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/constraints', (req, res) => {
  try {
    const offerId = parseInt(req.params.id);
    const existing = query.get('offer_constraints', c => c.offer_id === offerId);

    const data = {
      offer_id: offerId,
      per_user_cap: parseInt(req.body.per_user_cap) || 0,
      frequency_period: req.body.frequency_period || 'lifetime',
      total_cap: parseInt(req.body.total_cap) || 0,
      per_placement_caps: req.body.per_placement_caps || {}
    };

    if (existing) {
      query.update('offer_constraints', existing.id, data);
      res.json(query.get('offer_constraints', existing.id));
    } else {
      const result = query.insert('offer_constraints', data);
      res.status(201).json(result.record);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Performance stats for a single offer ──
router.get('/:id/performance', (req, res) => {
  try {
    const offerId = parseInt(req.params.id);
    const offer = query.get('offers', offerId);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    const propositions = query.all('offer_propositions', p => p.offer_id === offerId);
    const propIds = new Set(propositions.map(p => p.id));
    const events = query.all('offer_events', e => propIds.has(e.proposition_id));

    const impressions = events.filter(e => e.event_type === 'impression').length;
    const clicks = events.filter(e => e.event_type === 'click').length;
    const conversions = events.filter(e => e.event_type === 'conversion').length;
    const dismissals = events.filter(e => e.event_type === 'dismiss').length;

    // Daily breakdown (last 30 days)
    const daily = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      daily[key] = { impressions: 0, clicks: 0, conversions: 0 };
    }
    for (const e of events) {
      const key = e.timestamp.split('T')[0];
      if (daily[key]) {
        if (e.event_type === 'impression') daily[key].impressions++;
        if (e.event_type === 'click') daily[key].clicks++;
        if (e.event_type === 'conversion') daily[key].conversions++;
      }
    }

    // Channel breakdown
    const channelBreakdown = {};
    for (const p of propositions) {
      const ch = p.channel || 'unknown';
      if (!channelBreakdown[ch]) channelBreakdown[ch] = { proposed: 0, fallback: 0 };
      channelBreakdown[ch].proposed++;
      if (p.is_fallback) channelBreakdown[ch].fallback++;
    }

    res.json({
      offer_id: offerId,
      total_propositions: propositions.length,
      fallback_propositions: propositions.filter(p => p.is_fallback).length,
      unique_contacts: new Set(propositions.map(p => p.contact_id)).size,
      impressions, clicks, conversions, dismissals,
      click_rate: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00',
      conversion_rate: impressions > 0 ? ((conversions / impressions) * 100).toFixed(2) : '0.00',
      daily: Object.entries(daily).map(([date, data]) => ({ date, ...data })),
      channel_breakdown: channelBreakdown
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
