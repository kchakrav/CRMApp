const express = require('express');
const router = express.Router();
const { query, db, saveDatabase } = require('../database');

// Get custom objects for segment builder
router.get('/for-segments', (req, res) => {
  try {
    const objects = query.all('custom_objects', o => o.is_active);
    
    // Format for segment builder
    const formatted = objects.map(obj => ({
      name: obj.name,
      label: obj.label,
      icon: '🗂️',
      fields: obj.fields.map(f => ({
        name: f.name,
        label: f.label,
        type: f.type
      }))
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Preview segment - get count and sample results
router.post('/preview', (req, res) => {
  try {
    const { conditions } = req.body;
    
    if (!conditions || !conditions.rules || conditions.rules.length === 0) {
      return res.json({ count: 0, samples: [] });
    }
    
    // Get all contacts
    let contacts = query.all('contacts');
    
    // Apply filters based on conditions
    contacts = filterContactsByConditions(contacts, conditions);
    
    const baseEntity = conditions?.base_entity || 'customer';
    const contactIds = new Set(contacts.map(c => c.id));
    let records = contacts;
    if (baseEntity === 'orders') {
      records = query.all('orders', o => contactIds.has(o.contact_id));
    } else if (baseEntity === 'events') {
      records = query.all('contact_events', e => contactIds.has(e.contact_id));
    } else if (baseEntity && !['contact', 'customer'].includes(baseEntity)) {
      const customData = db.custom_object_data[baseEntity] || [];
      records = customData.filter(r => contactIds.has(r.contact_id));
    }
    
    // Get count
    const count = records.length;
    
    const avgScore = contacts.length
      ? contacts.reduce((sum, c) => sum + (Number(c.lead_score ?? c.engagement_score) || 0), 0) / contacts.length
      : 0;
    const activeCount = contacts.filter(c => c.status === 'active').length;
    const vipCount = contacts.filter(c => c.lifecycle_stage === 'vip' || c.subscription_status === 'vip').length;
    
    // Get sample (first 10)
    const samples = records.slice(0, 10);
    
    res.json({
      count,
      samples,
      stats: {
        avg_score: avgScore,
        active_count: activeCount,
        vip_count: vipCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Distribution of values for an attribute
router.post('/distribution', (req, res) => {
  try {
    const { conditions, attribute } = req.body || {};
    if (!attribute || !attribute.entity || !attribute.name) {
      return res.status(400).json({ error: 'Attribute is required' });
    }
    let contacts = query.all('contacts');
    const baseEntity = conditions?.base_entity;
    if (baseEntity && !['contact', 'customer'].includes(baseEntity)) {
      const baseRecords = db.custom_object_data[baseEntity] || [];
      const allowedIds = new Set(baseRecords.map(r => r.contact_id));
      contacts = contacts.filter(c => allowedIds.has(c.id));
    }
    const rawRules = conditions?.rules || [];
    const filteredRules = rawRules.filter(rule => (
      rule && rule.entity && rule.attribute && rule.operator
    ));
    if (filteredRules.length) {
      contacts = filterContactsByConditions(contacts, {
        ...(conditions || {}),
        rules: filteredRules
      });
    }
    const total = contacts.length;
    if (!total) {
      return res.json({ total: 0, items: [] });
    }
    const counts = new Map();
    contacts.forEach(contact => {
      const value = getAttributeValue(contact, attribute.entity, attribute.name);
      const label = value === null || value === undefined || value === '' ? 'Empty' : String(value);
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    const items = Array.from(counts.entries())
      .map(([value, count]) => ({ value, count, percentage: count / total }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    res.json({ total, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to filter contacts by conditions
function filterContactsByConditions(contacts, conditions) {
  const { logic = 'AND', rules = [] } = conditions;
  
  return contacts.filter(contact => {
    const results = rules.map(rule => evaluateRule(contact, rule));
    
    if (logic === 'AND') {
      return results.every(r => r);
    } else if (logic === 'OR') {
      return results.some(r => r);
    }
    return false;
  });
}

// Evaluate a single rule
function evaluateRule(contact, rule) {
  const { entity, attribute, operator, value } = rule;
  const contactValue = getAttributeValue(contact, entity, attribute);
  
  // Apply operator
  return applyOperator(contactValue, operator, value);
}

function getAttributeValue(contact, entity, attribute) {
  if (entity === 'contact' || entity === 'customer') {
    return contact[attribute];
  }
  if (entity === 'orders') {
    const orders = query.all('orders', o => o.contact_id === contact.id);
    if (attribute === 'total_orders') {
      return orders.length;
    }
    if (attribute === 'total_spent') {
      return orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    }
    if (attribute === 'last_order_date') {
      const dates = orders.map(o => new Date(o.created_at));
      return dates.length > 0 ? Math.max(...dates) : null;
    }
    const latestOrder = orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    if (!latestOrder) return null;
    if (attribute === 'id') return latestOrder.id;
    if (attribute === 'total_amount') return latestOrder.total_amount;
    if (attribute === 'status') return latestOrder.status;
    if (attribute === 'created_at') return latestOrder.created_at;
  }
  if (entity === 'events') {
    const events = query.all('contact_events', e => e.contact_id === contact.id);
    if (attribute === 'event_count') {
      return events.length;
    }
    if (attribute === 'last_activity_date') {
      const dates = events.map(e => new Date(e.event_time));
      return dates.length > 0 ? Math.max(...dates) : null;
    }
  }
  const { db } = require('../database');
  const customData = db.custom_object_data[entity] || [];
  const records = customData.filter(r => r.contact_id === contact.id);
  if (records.length > 0) {
    const latestRecord = records[records.length - 1];
    return latestRecord[attribute];
  }
  return null;
}

// Apply comparison operator
function applyOperator(contactValue, operator, value) {
  // Handle null/undefined
  if (contactValue === null || contactValue === undefined) {
    return operator === 'is_empty' || operator === 'is_not_set';
  }
  
  switch (operator) {
    case 'equals':
      return contactValue == value;
    case 'not_equals':
      return contactValue != value;
    case 'contains':
      return String(contactValue).toLowerCase().includes(String(value).toLowerCase());
    case 'not_contains':
      return !String(contactValue).toLowerCase().includes(String(value).toLowerCase());
    case 'starts_with':
      return String(contactValue).toLowerCase().startsWith(String(value).toLowerCase());
    case 'ends_with':
      return String(contactValue).toLowerCase().endsWith(String(value).toLowerCase());
    case 'greater_than':
      return Number(contactValue) > Number(value);
    case 'less_than':
      return Number(contactValue) < Number(value);
    case 'greater_than_or_equal':
      return Number(contactValue) >= Number(value);
    case 'less_than_or_equal':
      return Number(contactValue) <= Number(value);
    case 'is_empty':
      return !contactValue || contactValue === '';
    case 'is_not_empty':
      return contactValue && contactValue !== '';
    case 'is_set':
      return contactValue !== null && contactValue !== undefined;
    case 'is_not_set':
      return contactValue === null || contactValue === undefined;
    case 'in_last':
      // For date fields - check if within last N days
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - Number(value));
      return new Date(contactValue) >= daysAgo;
    case 'not_in_last':
      const daysAgo2 = new Date();
      daysAgo2.setDate(daysAgo2.getDate() - Number(value));
      return new Date(contactValue) < daysAgo2;
    default:
      return false;
  }
}

router.get('/', (req, res) => {
  try {
    const segments = query.all('segments');
    res.json({ segments }); // Wrap in object for consistency
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const segment = query.get('segments', parseInt(req.params.id));
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    res.json(segment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, description, segment_type = 'dynamic', conditions = {}, status = 'draft' } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Segment name is required' });
    }
    
    const result = query.insert('segments', {
      name,
      description,
      segment_type,
      conditions,
      contact_count: 0,
      status,
      is_active: status === 'active'
    });
    
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/contacts', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { limit = 100 } = req.query;
    
    const segment = query.get('segments', id);
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    
    let contacts = query.all('contacts');
    const conditions = segment.conditions || {};
    
    if (conditions.subscription_status) {
      contacts = contacts.filter(c => c.subscription_status === conditions.subscription_status);
    }
    
    if (conditions.min_engagement_score) {
      contacts = contacts.filter(c => c.engagement_score >= conditions.min_engagement_score);
    }
    
    if (conditions.status) {
      contacts = contacts.filter(c => c.status === conditions.status);
    }
    
    const result = contacts.slice(0, parseInt(limit));
    
    // Update contact count
    query.update('segments', id, { contact_count: result.length });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('segments', id);
    if (!existing) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    
    query.update('segments', id, req.body);
    const updated = query.get('segments', id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('segments', id);
    if (!existing) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    
    query.delete('segments', id);
    res.json({ message: 'Segment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change segment status
router.patch('/:id/status', (req, res) => {
  try {
    const segmentId = parseInt(req.params.id);
    const { status } = req.body;
    
    const validStatuses = ['draft', 'active', 'paused', 'archived'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status', 
        validStatuses 
      });
    }
    
    const segment = query.get('segments', segmentId);
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    
    // Update status and is_active flag
    const result = query.update('segments', segmentId, {
      status,
      is_active: status === 'active'
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error changing segment status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get segments by status
router.get('/by-status/:status', (req, res) => {
  try {
    const { status } = req.params;
    const segments = query.all('segments', s => s.status === status);
    
    res.json({
      status,
      count: segments.length,
      segments
    });
  } catch (error) {
    console.error('Error fetching segments by status:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
