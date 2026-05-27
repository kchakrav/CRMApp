const express = require('express');
const router = express.Router();
const { query } = require('../database');

// List all tools
router.get('/', (req, res) => {
  try {
    const { type, category, status } = req.query;
    let tools = query.all('agent_tools');
    if (type) tools = tools.filter(t => t.type === type);
    if (category) tools = tools.filter(t => t.category === category);
    if (status) tools = tools.filter(t => t.status === status);
    res.json(tools);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single tool
router.get('/:id', (req, res) => {
  try {
    const tool = query.get('agent_tools', parseInt(req.params.id));
    if (!tool) return res.status(404).json({ error: 'Tool not found' });
    res.json(tool);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create tool(s)
router.post('/', (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const created = [];
    const now = new Date().toISOString();

    for (const item of items) {
      if (!item.name) continue;
      const result = query.insert('agent_tools', {
        name: item.name,
        description: item.description || '',
        type: item.type || 'custom',
        category: item.category || 'utility',
        status: item.status || 'active',
        icon: item.icon || 'tool',
        endpoint: item.endpoint || '',
        method: item.method || 'POST',
        headers: item.headers || {},
        auth_type: item.auth_type || 'none',
        timeout_ms: item.timeout_ms || 30000,
        retry_policy: item.retry_policy || { max_retries: 0, backoff_ms: 1000 },
        parameters: item.parameters || [],
        input_schema: item.input_schema || {},
        output_schema: item.output_schema || {},
        version: item.version || 1,
        created_by: item.created_by || 'System',
        created_at: now,
        updated_at: now
      });
      created.push(result.record);
    }

    res.status(201).json(created.length === 1 ? created[0] : created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update tool
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('agent_tools', id);
    if (!existing) return res.status(404).json({ error: 'Tool not found' });

    const updates = { ...req.body };
    delete updates.id;
    delete updates.created_at;
    updates.updated_at = new Date().toISOString();

    query.update('agent_tools', id, updates);
    res.json(query.get('agent_tools', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete tool
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('agent_tools', id);
    if (!existing) return res.status(404).json({ error: 'Tool not found' });

    if (existing.type === 'platform' && existing.status === 'active') {
      return res.status(400).json({ error: 'Cannot delete active platform tool. Deactivate it first.' });
    }

    query.delete('agent_tools', id);
    res.json({ message: 'Tool deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
