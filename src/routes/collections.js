/**
 * Collection Qualifiers (Tags) + Collections API
 */
const express = require('express');
const router = express.Router();
const { query } = require('../database');

// ══════════════════════════════════════════════════════
// COLLECTION QUALIFIERS (Tags)
// ══════════════════════════════════════════════════════

router.get('/qualifiers', (req, res) => {
  try {
    const qualifiers = query.all('collection_qualifiers');
    // Enrich with offer count
    const enriched = qualifiers.map(q => {
      const count = query.count('offer_tags', t => t.qualifier_id === q.id);
      return { ...q, offer_count: count };
    });
    res.json({ qualifiers: enriched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/qualifiers/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const qualifier = query.get('collection_qualifiers', id);
    if (!qualifier) return res.status(404).json({ error: 'Qualifier not found' });
    res.json(qualifier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/qualifiers', (req, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const result = query.insert('collection_qualifiers', {
      name,
      description: description || '',
      color: color || '#6E6E6E'
    });
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/qualifiers/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const qualifier = query.get('collection_qualifiers', id);
    if (!qualifier) return res.status(404).json({ error: 'Qualifier not found' });

    const updates = {};
    ['name', 'description', 'color'].forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    query.update('collection_qualifiers', id, updates);
    res.json(query.get('collection_qualifiers', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/qualifiers/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Remove associations
    query.all('offer_tags', t => t.qualifier_id === id).forEach(t => query.delete('offer_tags', t.id));
    query.delete('collection_qualifiers', id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ══════════════════════════════════════════════════════
// COLLECTIONS
// ══════════════════════════════════════════════════════

router.get('/', (req, res) => {
  try {
    let collections = query.all('collections');
    const { type, search } = req.query;

    if (type) collections = collections.filter(c => c.type === type);
    if (search) {
      const s = search.toLowerCase();
      collections = collections.filter(c =>
        (c.name || '').toLowerCase().includes(s) ||
        (c.description || '').toLowerCase().includes(s)
      );
    }

    // Enrich with offer counts
    const enriched = collections.map(c => {
      let offerCount = 0;
      if (c.type === 'static') {
        offerCount = (c.offer_ids || []).length;
      } else {
        // Dynamic: count by qualifier
        const qualifierIds = c.qualifier_ids || [];
        if (qualifierIds.length === 0) {
          offerCount = query.count('offers', o => o.status === 'live' && o.type === 'personalized');
        } else {
          const matchingOfferIds = new Set();
          const allTags = query.all('offer_tags');
          for (const tag of allTags) {
            if (qualifierIds.includes(tag.qualifier_id)) matchingOfferIds.add(tag.offer_id);
          }
          offerCount = matchingOfferIds.size;
        }
      }

      // Get qualifiers for display
      const qualifiers = (c.qualifier_ids || []).map(qid => query.get('collection_qualifiers', qid)).filter(Boolean);

      return { ...c, offer_count: offerCount, qualifiers };
    });

    enriched.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    res.json({ collections: enriched, total: enriched.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const collection = query.get('collections', id);
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    // Resolve offers
    let offers = [];
    if (collection.type === 'static') {
      offers = (collection.offer_ids || []).map(oid => query.get('offers', oid)).filter(Boolean);
    } else {
      const qualifierIds = collection.qualifier_ids || [];
      if (qualifierIds.length === 0) {
        offers = query.all('offers', o => o.status === 'live' && o.type === 'personalized');
      } else {
        const matchingOfferIds = new Set();
        const allTags = query.all('offer_tags');
        for (const tag of allTags) {
          if (qualifierIds.includes(tag.qualifier_id)) matchingOfferIds.add(tag.offer_id);
        }
        offers = [...matchingOfferIds].map(oid => query.get('offers', oid)).filter(Boolean);
      }
    }

    const qualifiers = (collection.qualifier_ids || []).map(qid => query.get('collection_qualifiers', qid)).filter(Boolean);

    res.json({ ...collection, offers, qualifiers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, description, type = 'static', offer_ids = [], qualifier_ids = [] } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    if (!['static', 'dynamic'].includes(type)) {
      return res.status(400).json({ error: 'type must be static or dynamic' });
    }

    const result = query.insert('collections', {
      name,
      description: description || '',
      type,
      offer_ids: type === 'static' ? offer_ids.map(Number) : [],
      qualifier_ids: type === 'dynamic' ? qualifier_ids.map(Number) : [],
      status: 'active'
    });

    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const collection = query.get('collections', id);
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    const updates = {};
    ['name', 'description', 'type', 'status'].forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    if (req.body.offer_ids !== undefined) updates.offer_ids = req.body.offer_ids.map(Number);
    if (req.body.qualifier_ids !== undefined) updates.qualifier_ids = req.body.qualifier_ids.map(Number);

    query.update('collections', id, updates);
    res.json(query.get('collections', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    query.delete('collections', id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Preview collection offers
router.post('/:id/preview', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const collection = query.get('collections', id);
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    let offers = [];
    if (collection.type === 'static') {
      offers = (collection.offer_ids || []).map(oid => query.get('offers', oid)).filter(Boolean);
    } else {
      const qualifierIds = collection.qualifier_ids || [];
      if (qualifierIds.length === 0) {
        offers = query.all('offers', o => o.status === 'live' && o.type === 'personalized');
      } else {
        const matchingOfferIds = new Set();
        const allTags = query.all('offer_tags');
        for (const tag of allTags) {
          if (qualifierIds.includes(tag.qualifier_id)) matchingOfferIds.add(tag.offer_id);
        }
        offers = [...matchingOfferIds].map(oid => query.get('offers', oid)).filter(Boolean);
      }
    }

    res.json({ count: offers.length, offers: offers.slice(0, 50) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
