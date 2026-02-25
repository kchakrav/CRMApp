const express = require('express');
const router = express.Router();
const { query, db, saveDatabase } = require('../database');

// Get custom objects for segment builder — all active custom objects (excluding junction tables)
router.get('/for-segments', (req, res) => {
  try {
    const allObjects = query.all('custom_objects', o => o.is_active);

    const junctionNames = new Set(
      allObjects
        .filter(o => o.name.endsWith('_link'))
        .map(o => o.name)
    );

    const formatted = allObjects
      .filter(obj => !junctionNames.has(obj.name))
      .map(obj => {
        const rels = obj.relationships || [];
        const relToContacts = rels.find(r => r.to_table === 'contacts');
        const relType = relToContacts ? relToContacts.type : null;

        return {
          name: obj.name,
          label: obj.label,
          icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>',
          relationship: relType,
          fields: (obj.fields || []).map(f => ({
            name: f.name,
            label: f.label,
            type: f.type
          }))
        };
      });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Same scope as workflow Entry point so segment preview count matches Query node result
const ACTIVE_STATUS = 'active';

// Single source of truth: compute segment audience (active contacts filtered by conditions).
// Returns { count, contacts }. Used by GET :id/contacts, getSegmentContactCount, and for consistency.
function computeSegmentAudience(conditions) {
  let contacts = query.all('contacts', c => c.status === ACTIVE_STATUS);
  if (!conditions || typeof conditions !== 'object') {
    return { count: contacts.length, contacts };
  }
  if (conditions.rules && conditions.rules.length > 0) {
    contacts = filterContactsByConditions(contacts, conditions);
    return { count: contacts.length, contacts };
  }
  if (conditions.subscription_status != null) {
    contacts = contacts.filter(c => c.subscription_status === conditions.subscription_status);
  }
  if (conditions.min_engagement_score != null) {
    contacts = contacts.filter(c => (c.engagement_score || 0) >= conditions.min_engagement_score);
  }
  if (conditions.status) {
    contacts = contacts.filter(c => c.status === conditions.status);
  }
  return { count: contacts.length, contacts };
}

function getSegmentContactCount(segmentId) {
  const segment = query.get('segments', segmentId);
  if (!segment) return 0;
  return computeSegmentAudience(segment.conditions || {}).count;
}

// Preview segment - get count and sample results (contact-based: active contacts only).
// If segment_id is provided, use the saved segment's conditions so the count matches the workflow.
router.post('/preview', (req, res) => {
  try {
    const { conditions: bodyConditions, segment_id: segmentIdParam } = req.body;
    let conditions = bodyConditions;
    let fromSavedSegment = false;
    if (segmentIdParam != null && segmentIdParam !== '') {
      const segId = parseInt(segmentIdParam, 10);
      if (!Number.isNaN(segId)) {
        const segment = query.get('segments', segId);
        if (segment && segment.conditions && segment.conditions.rules && segment.conditions.rules.length > 0) {
          conditions = segment.conditions;
          fromSavedSegment = true;
        }
      }
    }
    
    if (!conditions || !conditions.rules || conditions.rules.length === 0) {
      return res.json({ count: 0, samples: [], fromSavedSegment: false });
    }
    
    const baseEntity = conditions?.base_entity || 'customer';
    const isContactBased = ['contact', 'customer'].includes(baseEntity);

    let records;

    if (isContactBased) {
      const { count, contacts } = computeSegmentAudience(conditions);
      records = contacts;
      // count is from single source of truth below; we'll set it from records.length for consistency
    } else {
      // Custom object as base entity — query its records directly
      const customData = db.custom_object_data?.[baseEntity] || [];
      records = filterRecordsByConditions(customData, conditions, baseEntity);
    }
    
    const count = records.length;

    // Stats only apply to contact-based segments
    let stats = { avg_score: 0, active_count: 0, vip_count: 0 };
    if (isContactBased && records.length > 0) {
      stats.avg_score = records.reduce((sum, c) => sum + (Number(c.engagement_score ?? c.lead_score) || 0), 0) / records.length;
      stats.active_count = records.filter(c => c.status === 'active').length;
      stats.vip_count = records.filter(c => (c.loyalty_tier || '').toLowerCase() === 'platinum').length;
    }
    
    const samples = records.slice(0, 10);
    
    res.json({ count, samples, stats, fromSavedSegment: !!fromSavedSegment });
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

    const baseEntity = conditions?.base_entity || 'customer';
    const isContactBased = ['contact', 'customer'].includes(baseEntity);

    let records;
    if (isContactBased) {
      records = query.all('contacts');
      const rawRules = (conditions?.rules || []).filter(r => r && r.entity && r.attribute && r.operator);
      if (rawRules.length) {
        records = filterContactsByConditions(records, { ...(conditions || {}), rules: rawRules });
      }
    } else {
      records = db.custom_object_data?.[baseEntity] || [];
      const rawRules = (conditions?.rules || []).filter(r => r && r.entity && r.attribute && r.operator);
      if (rawRules.length) {
        records = filterRecordsByConditions(records, { ...(conditions || {}), rules: rawRules }, baseEntity);
      }
    }

    const total = records.length;
    if (!total) {
      return res.json({ total: 0, items: [] });
    }
    const counts = new Map();
    records.forEach(record => {
      let value;
      if (isContactBased) {
        value = getAttributeValue(record, attribute.entity, attribute.name);
      } else {
        value = record[attribute.name];
      }
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
    return combineResults(results, rules, logic);
  });
}

// Combine rule results respecting per-rule nextOperator, falling back to global logic
function combineResults(results, rules, globalLogic) {
  if (results.length === 0) return false;
  const hasPerRuleOps = rules.some(r => r.nextOperator);
  if (!hasPerRuleOps) {
    return globalLogic === 'OR' ? results.some(r => r) : results.every(r => r);
  }
  let combined = results[0];
  for (let i = 1; i < results.length; i++) {
    const op = rules[i - 1].nextOperator || globalLogic || 'AND';
    combined = op === 'OR' ? (combined || results[i]) : (combined && results[i]);
  }
  return combined;
}

// Filter arbitrary records (custom objects) by conditions — rules target the record directly
function filterRecordsByConditions(records, conditions, baseEntity) {
  const { logic = 'AND', rules = [] } = conditions;

  return records.filter(record => {
    const results = rules.map(rule => {
      const attr = rule.attribute;
      const recordValue = (rule.entity === baseEntity || rule.entity === 'customer' || rule.entity === 'contact')
        ? record[attr]
        : record[attr];
      return applyOperator(recordValue, rule.operator, rule.value, rule.case_sensitive);
    });

    return combineResults(results, rules, logic);
  });
}

// Evaluate a single rule
function evaluateRule(contact, rule) {
  const { entity, attribute, operator, value, case_sensitive } = rule;
  const contactValue = getAttributeValue(contact, entity, attribute);
  
  // Apply operator
  return applyOperator(contactValue, operator, value, case_sensitive);
}

function getAttributeValue(contact, entity, attribute) {
  if (entity === 'contact' || entity === 'customer') {
    const val = contact[attribute];
    if (val !== undefined) return val;

    // Field aliases and derived values
    if (attribute === 'lead_score') return contact.engagement_score;
    if (attribute === 'engagement_score') return contact.lead_score;
    if (attribute === 'lifecycle_stage') {
      const tier = (contact.loyalty_tier || '').toLowerCase();
      if (tier === 'platinum') return 'vip';
      if (tier === 'gold' || tier === 'silver') return 'customer';
      if (contact.status === 'inactive') return 'churned';
      const score = Number(contact.engagement_score || contact.lead_score || 0);
      if (score < 30) return 'at_risk';
      return 'lead';
    }
    return undefined;
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
function applyOperator(contactValue, operator, value, caseSensitive) {
  // Handle null/undefined
  if (contactValue === null || contactValue === undefined) {
    return operator === 'is_empty' || operator === 'is_not_set';
  }

  const str = (v) => String(v ?? '');
  const cmp = caseSensitive
    ? (a, b) => str(a) === str(b)
    : (a, b) => str(a).toLowerCase() === str(b).toLowerCase();
  const includes = caseSensitive
    ? (haystack, needle) => str(haystack).includes(str(needle))
    : (haystack, needle) => str(haystack).toLowerCase().includes(str(needle).toLowerCase());
  const startsWith = caseSensitive
    ? (s, prefix) => str(s).startsWith(str(prefix))
    : (s, prefix) => str(s).toLowerCase().startsWith(str(prefix).toLowerCase());
  const endsWith = caseSensitive
    ? (s, suffix) => str(s).endsWith(str(suffix))
    : (s, suffix) => str(s).toLowerCase().endsWith(str(suffix).toLowerCase());
  
  switch (operator) {
    case 'equals':
      return caseSensitive ? str(contactValue) === str(value) : cmp(contactValue, value);
    case 'not_equals':
      return caseSensitive ? str(contactValue) !== str(value) : !cmp(contactValue, value);
    case 'contains':
      return includes(contactValue, value);
    case 'not_contains':
      return !includes(contactValue, value);
    case 'starts_with':
      return startsWith(contactValue, value);
    case 'ends_with':
      return endsWith(contactValue, value);
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
    // Return segment as stored; do not recalc contact_count here so workflow run
    // counts are not overwritten when the segment is opened in the builder.
    // contact_count is updated on: PUT (save), GET :id/contacts, and workflow execute.
    res.json(segment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, description, segment_type = 'dynamic', conditions = {}, status = 'draft', folder_id = null } = req.body;
    
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
      is_active: status === 'active',
      folder_id: folder_id ? parseInt(folder_id) : null
    });
    const newId = result.record.id;
    const contact_count = getSegmentContactCount(newId);
    query.update('segments', newId, { contact_count });
    const record = query.get('segments', newId);
    res.status(201).json(record);
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
    
    const { count: fullCount, contacts } = computeSegmentAudience(segment.conditions || {});
    query.update('segments', id, { contact_count: fullCount });
    
    const result = contacts.slice(0, parseInt(limit, 10));
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
    const contact_count = getSegmentContactCount(id);
    query.update('segments', id, { contact_count });
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
module.exports.filterContactsByConditions = filterContactsByConditions;
