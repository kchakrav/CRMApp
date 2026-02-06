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
    segment_id = null
  } = audienceConfig;
  const normalizedIncludeSegments = include_segments.length
    ? include_segments
    : (segment_id ? [parseInt(segment_id)] : []);
  
  let finalContacts = new Set();
  
  // Start with all contacts from included segments
  if (normalizedIncludeSegments.length > 0) {
    normalizedIncludeSegments.forEach(segmentId => {
      const segment = query.get('segments', segmentId);
      if (segment && segment.status === 'active') {
        // Get contacts matching segment conditions
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
    exclude_segments.forEach(segmentId => {
      const segment = query.get('segments', segmentId);
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
  
  // If no includes specified, start with all active contacts
  if (include_segments.length === 0 && include_contacts.length === 0) {
    const allContacts = query.all('contacts', c => c.status === 'active');
    allContacts.forEach(c => finalContacts.add(c.id));
    
    // Then apply exclusions
    exclude_segments.forEach(segmentId => {
      const segment = query.get('segments', segmentId);
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
  const contactIds = Array.from(finalContacts);
  return contactIds.map(id => query.get('contacts', id)).filter(c => c);
}

// Helper to get segment members (reuse from segments.js logic)
function getSegmentMembers(segment) {
  const contacts = query.all('contacts', c => c.status === 'active');
  
  if (!segment.conditions || !segment.conditions.rules) {
    return contacts;
  }
  
  const { logic = 'AND', rules = [] } = segment.conditions;
  
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

// Evaluate rule (simplified version)
function evaluateRule(contact, rule) {
  const { entity, attribute, operator, value } = rule;
  
  let contactValue;
  
  if (entity === 'contact' || entity === 'customer') {
    contactValue = contact[attribute];
  } else if (entity === 'orders') {
    const orders = query.all('orders', o => o.contact_id === contact.id);
    if (attribute === 'total_orders') {
      contactValue = orders.length;
    } else if (attribute === 'total_spent') {
      contactValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    }
  }
  
  // Apply operator
  switch (operator) {
    case 'equals':
      return contactValue == value;
    case 'not_equals':
      return contactValue != value;
    case 'greater_than':
      return Number(contactValue) > Number(value);
    case 'less_than':
      return Number(contactValue) < Number(value);
    case 'contains':
      return String(contactValue).toLowerCase().includes(String(value).toLowerCase());
    default:
      return false;
  }
}

module.exports = router;
