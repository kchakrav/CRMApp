const express = require('express');
const router = express.Router();
const { query } = require('../database');

function buildVersionSnapshot(page) {
  return {
    version: page.version || 1,
    name: page.name,
    slug: page.slug || '',
    status: page.status || 'draft',
    content_blocks: page.content_blocks || [],
    html_output: page.html_output || '',
    published_at: new Date().toISOString()
  };
}

// Get landing pages
router.get('/', (req, res) => {
  try {
    const pages = query.all('landing_pages');
    res.json({ pages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single landing page
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const page = query.get('landing_pages', id);
    if (!page) return res.status(404).json({ error: 'Landing page not found' });
    res.json(page);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create landing page
router.post('/', (req, res) => {
  try {
    const {
      name,
      slug = '',
      status = 'draft',
      version = 1,
      content_blocks = [],
      html_output = '',
      body_style = null,
      tags = [],
      folder = '',
      created_by = 'System'
    } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = query.insert('landing_pages', {
      name,
      slug,
      status,
      version,
      content_blocks,
      html_output,
      body_style,
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

// Update landing page
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('landing_pages', id);
    if (!existing) return res.status(404).json({ error: 'Landing page not found' });
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

    query.update('landing_pages', id, updates);
    res.json(query.get('landing_pages', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete landing page
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('landing_pages', id);
    if (!existing) return res.status(404).json({ error: 'Landing page not found' });
    query.delete('landing_pages', id);
    res.json({ message: 'Landing page deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
