const express = require('express');
const router = express.Router();
const { query, db, saveDatabase } = require('../database');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');

// Configure multer for CSV uploads
const upload = multer({ storage: multer.memoryStorage() });

// Get all audiences
router.get('/', (req, res) => {
  try {
    const audiences = query.all('audiences');
    res.json(audiences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single audience
router.get('/:id', (req, res) => {
  try {
    const audience = query.get('audiences', parseInt(req.params.id));
    if (!audience) {
      return res.status(404).json({ error: 'Audience not found' });
    }
    res.json(audience);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create audience
router.post('/', (req, res) => {
  try {
    console.log('📥 Received audience creation request:', req.body);
    
    const {
      name,
      description,
      audience_type = 'static',
      segment_id = null,
      filters = {},
      include_segments = [],
      exclude_segments = [],
      include_contacts = [],
      exclude_contacts = [],
      estimated_size = 0,
      status = 'draft'
    } = req.body;
    
    console.log('📋 Parsed fields:', { name, description, audience_type, segment_id, filters, estimated_size, status });
    
    if (!name) {
      console.error('❌ Validation failed: Missing name');
      return res.status(400).json({ error: 'Audience name is required' });
    }
    
    const insertData = {
      name,
      description,
      audience_type,
      segment_id,
      filters,
      include_segments,
      exclude_segments,
      include_contacts,
      exclude_contacts,
      estimated_size,
      status,
      contact_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('💾 Attempting to insert:', insertData);
    
    const result = query.insert('audiences', insertData);
    
    console.log('✅ Audience created successfully:', result.record);
    res.status(201).json(result.record);
  } catch (error) {
    console.error('❌ Error creating audience:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Update audience
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      name,
      description,
      audience_type,
      segment_id,
      filters,
      include_segments,
      exclude_segments,
      include_contacts,
      exclude_contacts,
      estimated_size,
      status
    } = req.body;
    
    const existing = query.get('audiences', id);
    if (!existing) {
      return res.status(404).json({ error: 'Audience not found' });
    }
    
    const updateData = {
      updated_at: new Date().toISOString()
    };
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (audience_type) updateData.audience_type = audience_type;
    if (segment_id !== undefined) updateData.segment_id = segment_id;
    if (filters !== undefined) updateData.filters = filters;
    if (include_segments !== undefined) updateData.include_segments = include_segments;
    if (exclude_segments !== undefined) updateData.exclude_segments = exclude_segments;
    if (include_contacts !== undefined) updateData.include_contacts = include_contacts;
    if (exclude_contacts !== undefined) updateData.exclude_contacts = exclude_contacts;
    if (estimated_size !== undefined) updateData.estimated_size = estimated_size;
    if (status) updateData.status = status;
    
    const result = query.update('audiences', id, updateData);
    console.log('✅ Audience updated successfully:', result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete audience
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const existing = query.get('audiences', id);
    if (!existing) {
      return res.status(404).json({ error: 'Audience not found' });
    }
    
    query.delete('audiences', id);
    res.json({ message: 'Audience deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate audience members
router.get('/:id/members', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const audience = query.get('audiences', id);
    
    if (!audience) {
      return res.status(404).json({ error: 'Audience not found' });
    }
    
    const members = calculateAudienceMembers(audience);
    
    res.json({
      audience_id: id,
      total_count: members.length,
      members: members.slice(0, 100) // First 100 for preview
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Preview audience (get count and samples)
router.post('/preview', (req, res) => {
  try {
    const audienceConfig = req.body;
    
    const members = calculateAudienceMembers(audienceConfig);
    
    res.json({
      count: members.length,
      samples: members.slice(0, 10).map(c => ({
        id: c.id,
        email: c.email,
        first_name: c.first_name,
        last_name: c.last_name,
        subscription_status: c.subscription_status,
        engagement_score: c.engagement_score
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import contacts from CSV
router.post('/:id/import-csv', upload.single('file'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const audience = query.get('audiences', id);
    
    if (!audience) {
      return res.status(404).json({ error: 'Audience not found' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Parse CSV
    const results = [];
    const stream = Readable.from(req.file.buffer.toString());
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });
    
    if (results.length === 0) {
      return res.status(400).json({ error: 'No data found in CSV' });
    }
    
    // Extract contact IDs or emails
    const importedContacts = [];
    const contacts = query.all('contacts');
    
    results.forEach(row => {
      // Try to match by email or customer_id
      const email = row.email || row.Email || row.EMAIL;
      const contactId = row.contact_id || row.customer_id || row.id || row.ID;
      
      let contact = null;
      if (contactId) {
        contact = contacts.find(c => c.id === parseInt(contactId));
      } else if (email) {
        contact = contacts.find(c => c.email.toLowerCase() === email.toLowerCase());
      }
      
      if (contact && !importedContacts.includes(contact.id)) {
        importedContacts.push(contact.id);
      }
    });
    
    // Add to audience's include_contacts
    const currentInclude = audience.include_contacts || [];
    const updatedInclude = [...new Set([...currentInclude, ...importedContacts])];
    
    query.update('audiences', id, {
      include_contacts: updatedInclude,
      customer_count: updatedInclude.length
    });
    
    saveDatabase();
    
    res.json({
      success: true,
      imported: importedContacts.length,
      total_in_audience: updatedInclude.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate audience members
function calculateAudienceMembers(audienceConfig) {
  const {
    include_segments = [],
    exclude_segments = [],
    include_contacts = [],
    exclude_contacts = [],
    segment_id = null,
    filters = null
  } = audienceConfig;
  const parsedSegmentId = segment_id ? parseInt(segment_id, 10) : null;
  const normalizedIncludeSegments = include_segments.length
    ? include_segments.map(id => parseInt(id, 10)).filter(id => !isNaN(id))
    : (parsedSegmentId && !isNaN(parsedSegmentId) ? [parsedSegmentId] : []);
  
  let finalContacts = new Set();
  
  // Start with all contacts from included segments
  if (normalizedIncludeSegments.length > 0) {
    normalizedIncludeSegments.forEach(segId => {
      const segment = query.get('segments', segId);
      if (segment) {
        // Get contacts matching segment conditions (regardless of segment status for preview)
        const segmentMembers = getSegmentMembers(segment);
        segmentMembers.forEach(c => finalContacts.add(c.id));
      }
    });
  }
  
  // Add explicitly included contacts
  include_contacts.forEach(contactId => {
    const contact = query.get('contacts', contactId);
    if (contact && contact.status === 'active') {
      finalContacts.add(contact.id);
    }
  });
  
  // Remove contacts from excluded segments
  if (exclude_segments.length > 0) {
    exclude_segments.forEach(segId => {
      const segment = query.get('segments', segId);
      if (segment) {
        const segmentMembers = getSegmentMembers(segment);
        segmentMembers.forEach(c => finalContacts.delete(c.id));
      }
    });
  }
  
  // Remove explicitly excluded contacts
  exclude_contacts.forEach(contactId => {
    finalContacts.delete(contactId);
  });
  
  // If no includes specified at all, start with all active contacts
  if (normalizedIncludeSegments.length === 0 && include_contacts.length === 0) {
    const allContacts = query.all('contacts', c => c.status === 'active');
    allContacts.forEach(c => finalContacts.add(c.id));
    
    // Then apply exclusions
    exclude_segments.forEach(segId => {
      const segment = query.get('segments', segId);
      if (segment) {
        const segmentMembers = getSegmentMembers(segment);
        segmentMembers.forEach(c => finalContacts.delete(c.id));
      }
    });
    
    exclude_contacts.forEach(contactId => {
      finalContacts.delete(contactId);
    });
  }
  
  // Convert IDs back to contact objects
  let contactIds = Array.from(finalContacts);
  let results = contactIds.map(id => query.get('contacts', id)).filter(c => c);
  
  // Apply custom JSON filters if provided
  if (filters && typeof filters === 'object' && Object.keys(filters).length > 0) {
    results = applyCustomFilters(results, filters);
  }
  
  return results;
}

// Apply custom JSON filters to a list of contacts
// Supports formats:
//   { "field": "value" }              -- exact match
//   { "field": { "$gte": 50 } }       -- comparison operators
//   { "field": { "$contains": "x" } } -- string contains
function applyCustomFilters(contacts, filters) {
  return contacts.filter(contact => {
    for (const [field, condition] of Object.entries(filters)) {
      const contactValue = contact[field];
      
      if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
        // Operator-based condition: { "$gte": 50, "$lte": 100 }
        for (const [op, val] of Object.entries(condition)) {
          if (!applyFilterOperator(contactValue, op, val)) return false;
        }
      } else if (typeof condition === 'boolean') {
        // Boolean match: { "email_opt_in": true }
        if (Boolean(contactValue) !== condition) return false;
      } else {
        // Simple equality: { "status": "active" }
        if (String(contactValue).toLowerCase() !== String(condition).toLowerCase()) return false;
      }
    }
    return true;
  });
}

// Apply a single filter operator
function applyFilterOperator(contactValue, operator, value) {
  switch (operator) {
    case '$eq':
      return String(contactValue).toLowerCase() === String(value).toLowerCase();
    case '$ne':
      return String(contactValue).toLowerCase() !== String(value).toLowerCase();
    case '$gt':
      return Number(contactValue) > Number(value);
    case '$gte':
      return Number(contactValue) >= Number(value);
    case '$lt':
      return Number(contactValue) < Number(value);
    case '$lte':
      return Number(contactValue) <= Number(value);
    case '$contains':
      return String(contactValue || '').toLowerCase().includes(String(value).toLowerCase());
    case '$not_contains':
      return !String(contactValue || '').toLowerCase().includes(String(value).toLowerCase());
    case '$starts_with':
      return String(contactValue || '').toLowerCase().startsWith(String(value).toLowerCase());
    case '$ends_with':
      return String(contactValue || '').toLowerCase().endsWith(String(value).toLowerCase());
    case '$in':
      return Array.isArray(value) && value.map(v => String(v).toLowerCase()).includes(String(contactValue).toLowerCase());
    case '$nin':
      return Array.isArray(value) && !value.map(v => String(v).toLowerCase()).includes(String(contactValue).toLowerCase());
    case '$exists':
      return value ? (contactValue !== undefined && contactValue !== null && contactValue !== '') 
                    : (contactValue === undefined || contactValue === null || contactValue === '');
    default:
      return true; // Unknown operator, don't filter
  }
}

// Convert legacy flat conditions (e.g. {"loyalty_tier":"platinum"}) into rules format
function convertLegacySegmentConditions(conditions) {
  // Map legacy keys to proper contact field names and operators
  const legacyFieldMap = {
    min_engagement_score: { field: 'engagement_score', operator: 'greater_than_or_equal' },
    min_lead_score: { field: 'lead_score', operator: 'greater_than_or_equal' },
  };

  const rules = [];
  for (const [key, value] of Object.entries(conditions)) {
    if (['logic', 'rules', 'base_entity'].includes(key)) continue;

    const mapping = legacyFieldMap[key];
    if (mapping) {
      rules.push({ entity: 'customer', attribute: mapping.field, operator: mapping.operator, value: String(value) });
    } else {
      // Direct field match: { "loyalty_tier": "platinum" } → equals
      rules.push({ entity: 'customer', attribute: key, operator: 'equals', value: String(value) });
    }
  }
  return { logic: 'AND', rules };
}

// Helper to get segment members (reuse from segments.js logic)
function getSegmentMembers(segment) {
  const contacts = query.all('contacts');
  
  if (!segment.conditions) {
    return contacts;
  }

  // Determine conditions - handle both new (rules-based) and legacy (flat) formats
  let conditions = segment.conditions;
  if (!conditions.rules) {
    conditions = convertLegacySegmentConditions(conditions);
  }

  const { logic = 'AND', rules = [] } = conditions;
  
  if (rules.length === 0) {
    return contacts;
  }
  
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

// Derive a virtual field value from the contact when the field doesn't exist directly
function resolveContactField(contact, attribute) {
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

// Evaluate rule against a contact
function evaluateRule(contact, rule) {
  const { entity, attribute, operator, value, case_sensitive } = rule;
  const cs = (s) => case_sensitive ? String(s ?? '') : String(s ?? '').toLowerCase();
  
  let contactValue;
  
  if (entity === 'contact' || entity === 'customer') {
    contactValue = resolveContactField(contact, attribute);
  } else if (entity === 'orders') {
    const orders = query.all('orders', o => o.contact_id === contact.id);
    if (attribute === 'total_orders') {
      contactValue = orders.length;
    } else if (attribute === 'total_spent' || attribute === 'total_amount') {
      contactValue = orders.reduce((sum, o) => sum + (o.total || o.total_amount || 0), 0);
    } else if (attribute === 'last_order_date') {
      const sorted = orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      contactValue = sorted.length > 0 ? sorted[0].created_at : null;
    }
  } else if (entity === 'events') {
    const events = query.all('contact_events', e => e.contact_id === contact.id);
    if (attribute === 'event_count') {
      contactValue = events.length;
    } else if (attribute === 'last_activity_date') {
      const sorted = events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      contactValue = sorted.length > 0 ? sorted[0].created_at : null;
    }
  } else {
    // Custom object entities
    const customData = db.custom_object_data ? (db.custom_object_data[entity] || []) : [];
    const records = customData.filter(r => r.contact_id === contact.id);
    if (records.length > 0) {
      contactValue = records[records.length - 1][attribute];
    }
  }
  
  // Apply operator
  switch (operator) {
    case 'equals':
      return cs(contactValue) === cs(value);
    case 'not_equals':
      return cs(contactValue) !== cs(value);
    case 'greater_than':
      return Number(contactValue) > Number(value);
    case 'less_than':
      return Number(contactValue) < Number(value);
    case 'greater_than_or_equal':
      return Number(contactValue) >= Number(value);
    case 'less_than_or_equal':
      return Number(contactValue) <= Number(value);
    case 'contains':
      return cs(contactValue).includes(cs(value));
    case 'not_contains':
      return !cs(contactValue).includes(cs(value));
    case 'starts_with':
      return cs(contactValue).startsWith(cs(value));
    case 'ends_with':
      return cs(contactValue).endsWith(cs(value));
    case 'is_empty':
      return contactValue === undefined || contactValue === null || contactValue === '';
    case 'is_not_empty':
      return contactValue !== undefined && contactValue !== null && contactValue !== '';
    case 'is_set':
      return contactValue !== undefined && contactValue !== null;
    case 'is_not_set':
      return contactValue === undefined || contactValue === null;
    case 'in_last': {
      if (!contactValue) return false;
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - Number(value));
      return new Date(contactValue) >= daysAgo;
    }
    case 'not_in_last': {
      if (!contactValue) return true;
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - Number(value));
      return new Date(contactValue) < daysAgo;
    }
    default:
      return false;
  }
}

module.exports = router;
