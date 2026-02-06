const express = require('express');
const router = express.Router();
const { query } = require('../database');

router.get('/', (req, res) => {
  try {
    const workflows = query.all('workflows');
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const workflow = query.get('workflows', parseInt(req.params.id));
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, description, trigger_type, trigger_config = {}, workflow_steps = [] } = req.body;
    
    if (!name || !trigger_type) {
      return res.status(400).json({ error: 'Name and trigger_type are required' });
    }
    
    const result = query.insert('workflows', {
      name,
      description,
      trigger_type,
      trigger_config,
      workflow_steps,
      status: 'draft',
      entry_count: 0,
      completion_count: 0
    });
    
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('workflows', id);
    if (!existing) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    query.update('workflows', id, req.body);
    const updated = query.get('workflows', id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/activate', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const workflow = query.get('workflows', id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    const orchestration =
      query.get('campaign_orchestrations', r => r.campaign_id === id) ||
      query.get('workflow_orchestrations', r => r.workflow_id === id || r.campaign_id === id);
    if (orchestration) {
      const validation = validateOrchestrationForPublish(orchestration.nodes || [], orchestration.connections || []);
      if (validation.errors.length) {
        return res.status(400).json({ error: validation.errors.join('; ') });
      }
    }
    
    query.update('workflows', id, { status: 'active' });
    res.json({ message: 'Workflow activated successfully', workflow_id: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function validateOrchestrationForPublish(nodes, connections) {
  const errors = [];
  const signalKeys = new Set();
  const duplicates = new Set();
  const nodeById = new Map(nodes.map(n => [n.id, n]));
  nodes.forEach(node => {
    if (node.type === 'jump') {
      const targetId = node.config?.target_node_id;
      const target = targetId ? nodeById.get(targetId) : null;
      if (!targetId || !target) {
        errors.push(`Jump "${node.name}" missing target`);
      } else if (['entry', 'exit', 'stop'].includes(target.type)) {
        errors.push(`Jump "${node.name}" targets invalid node type`);
      }
    }
    if (node.type === 'external_signal') {
      const signalKey = (node.config?.signal_key || node.config?.signal || '').trim();
      if (!signalKey) {
        errors.push(`External Signal "${node.name}" missing signal key`);
      } else if (signalKeys.has(signalKey)) {
        duplicates.add(signalKey);
      } else {
        signalKeys.add(signalKey);
      }
      if (node.config?.timeout_enabled) {
        const hasTimeout = connections.some(c => c.from === node.id && c.transition_id === 'timeout');
        if (!hasTimeout) {
          errors.push(`External Signal "${node.name}" timeout enabled without fallback path`);
        }
      }
      if (node.config?.require_correlation && !node.config?.correlation_key) {
        errors.push(`External Signal "${node.name}" requires correlation mapping`);
      }
    }
  });
  duplicates.forEach(key => errors.push(`Signal key "${key}" must be unique`));
  return { errors };
}

router.post('/:id/pause', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const workflow = query.get('workflows', id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    query.update('workflows', id, { status: 'paused' });
    res.json({ message: 'Workflow paused successfully', workflow_id: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('workflows', id);
    if (!existing) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    query.delete('workflows', id);
    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
