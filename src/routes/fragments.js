const express = require('express');
const router = express.Router();
const { query } = require('../database');

// Get fragments (optional type filter)
router.get('/', (req, res) => {
  try {
    const type = req.query.type;
    let fragments = query.all('fragments');
    if (type) {
      fragments = fragments.filter(f => f.type === type);
    }
    res.json({ fragments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single fragment
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const fragment = query.get('fragments', id);
    if (!fragment) return res.status(404).json({ error: 'Fragment not found' });
    res.json(fragment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function buildVersionSnapshot(fragment) {
  return {
    version: fragment.version || 1,
    name: fragment.name,
    type: fragment.type || 'email',
    status: fragment.status || 'draft',
    blocks: fragment.blocks || [],
    html: fragment.html || '',
    published_at: new Date().toISOString()
  };
}

// Create fragment
router.post('/', (req, res) => {
  try {
    const {
      name,
      type = 'email',
      blocks = [],
      html = '',
      status = 'draft',
      version = 1,
      tags = [],
      folder = '',
      created_by = 'System'
    } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = query.insert('fragments', {
      name,
      type,
      status,
      version,
      blocks,
      html,
      tags,
      folder,
      created_by: created_by || 'System',
      updated_by: created_by || 'System',
      versions: []
    });
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update fragment
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('fragments', id);
    if (!existing) return res.status(404).json({ error: 'Fragment not found' });
    const updates = { ...req.body };
    delete updates.id;
    delete updates.created_at;
    delete updates.created_by;
    updates.updated_by = updates.updated_by || 'System';
    const isPublishing = updates.status === 'published' && existing.status !== 'published';
    if (isPublishing) {
      const nextVersion = (existing.version || 1) + 1;
      updates.version = nextVersion;
      const versions = Array.isArray(existing.versions) ? existing.versions.slice() : [];
      versions.push(buildVersionSnapshot({
        ...existing,
        ...updates,
        version: nextVersion
      }));
      updates.versions = versions;
    }
    query.update('fragments', id, updates);
    res.json(query.get('fragments', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete fragment
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('fragments', id);
    if (!existing) return res.status(404).json({ error: 'Fragment not found' });
    query.delete('fragments', id);
    res.json({ message: 'Fragment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
