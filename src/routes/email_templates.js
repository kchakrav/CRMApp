const express = require('express');
const router = express.Router();
const { query } = require('../database');

// Get email templates
router.get('/', (req, res) => {
  try {
    const templates = query.all('content_templates', t => t.type === 'email');
    res.json({ templates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single template
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const template = query.get('content_templates', id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create template
router.post('/', (req, res) => {
  try {
    const { name, subject = '', blocks = [], html = '', created_by = 'System' } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = query.insert('content_templates', {
      name,
      type: 'email',
      subject,
      blocks,
      html,
      created_by: created_by || 'System',
      updated_by: created_by || 'System'
    });
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update template
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('content_templates', id);
    if (!existing) return res.status(404).json({ error: 'Template not found' });
    const updates = { ...req.body };
    delete updates.id;
    delete updates.created_at;
    delete updates.created_by;
    updates.updated_by = updates.updated_by || 'System';
    query.update('content_templates', id, updates);
    res.json(query.get('content_templates', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete template
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('content_templates', id);
    if (!existing) return res.status(404).json({ error: 'Template not found' });
    query.delete('content_templates', id);
    res.json({ message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
