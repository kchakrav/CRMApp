const express = require('express');
const router = express.Router();
const { query } = require('../database');

// Get all predefined filters
router.get('/', (req, res) => {
  try {
    const filters = query.all('predefined_filters');
    res.json({ filters });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get one predefined filter
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const filter = query.get('predefined_filters', id);
    if (!filter) return res.status(404).json({ error: 'Filter not found' });
    res.json(filter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create predefined filter
router.post('/', (req, res) => {
  try {
    const {
      name,
      entity_type,
      conditions = {},
      usage_count = 0,
      created_by = 'System'
    } = req.body;
    
    if (!name || !entity_type) {
      return res.status(400).json({ error: 'name and entity_type are required' });
    }
    
    const result = query.insert('predefined_filters', {
      name,
      entity_type,
      conditions,
      usage_count,
      created_by: created_by || 'System',
      updated_by: created_by || 'System'
    });
    
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update predefined filter
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('predefined_filters', id);
    if (!existing) return res.status(404).json({ error: 'Filter not found' });
    const updates = { ...req.body };
    delete updates.id;
    delete updates.created_at;
    delete updates.created_by;
    updates.updated_by = updates.updated_by || 'System';
    query.update('predefined_filters', id, updates);
    const updated = query.get('predefined_filters', id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete predefined filter
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('predefined_filters', id);
    if (!existing) return res.status(404).json({ error: 'Filter not found' });
    query.delete('predefined_filters', id);
    res.json({ message: 'Filter deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
