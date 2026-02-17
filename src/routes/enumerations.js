const express = require('express');
const router = express.Router();
const { query } = require('../database');

// List all enumerations (optionally filter by system/custom)
router.get('/', (req, res) => {
  try {
    let enums = query.all('enumerations');
    if (req.query.type === 'system') enums = enums.filter(e => e.is_system);
    if (req.query.type === 'custom') enums = enums.filter(e => !e.is_system);
    if (req.query.search) {
      const q = req.query.search.toLowerCase();
      enums = enums.filter(e =>
        (e.name || '').toLowerCase().includes(q) ||
        (e.label || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q)
      );
    }
    enums.sort((a, b) => (a.label || a.name || '').localeCompare(b.label || b.name || ''));
    res.json({ enumerations: enums });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single enumeration
router.get('/:id', (req, res) => {
  try {
    const e = query.get('enumerations', parseInt(req.params.id));
    if (!e) return res.status(404).json({ error: 'Enumeration not found' });
    res.json(e);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create enumeration
router.post('/', (req, res) => {
  try {
    const { name, label, description, values = [], is_system = false } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
      return res.status(400).json({ error: 'name must start with a letter and contain only letters, numbers, and underscores' });
    }
    // Check for duplicate name
    const existing = query.all('enumerations').find(e => e.name === name);
    if (existing) return res.status(400).json({ error: `An enumeration with name "${name}" already exists` });

    // Validate values
    const cleanValues = (values || []).map((v, i) => ({
      key: v.key || `val_${i}`,
      label: v.label || v.key || `Value ${i + 1}`,
      order: v.order !== undefined ? v.order : i,
      enabled: v.enabled !== undefined ? v.enabled : true,
      color: v.color || ''
    }));

    const result = query.insert('enumerations', {
      name,
      label: label || name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      description: description || '',
      values: cleanValues,
      is_system: !!is_system,
      created_by: req.body.created_by || 'System',
      updated_by: req.body.created_by || 'System'
    });
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update enumeration
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('enumerations', id);
    if (!existing) return res.status(404).json({ error: 'Enumeration not found' });

    const updates = {};
    if (req.body.label !== undefined) updates.label = req.body.label;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.values !== undefined) {
      updates.values = (req.body.values || []).map((v, i) => ({
        key: v.key || `val_${i}`,
        label: v.label || v.key || `Value ${i + 1}`,
        order: v.order !== undefined ? v.order : i,
        enabled: v.enabled !== undefined ? v.enabled : true,
        color: v.color || ''
      }));
    }
    if (req.body.is_system !== undefined) updates.is_system = !!req.body.is_system;
    updates.updated_by = req.body.updated_by || 'System';

    query.update('enumerations', id, updates);
    res.json(query.get('enumerations', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete enumeration
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('enumerations', id);
    if (!existing) return res.status(404).json({ error: 'Enumeration not found' });
    if (existing.is_system) return res.status(400).json({ error: 'System enumerations cannot be deleted' });
    query.delete('enumerations', id);
    res.json({ message: 'Enumeration deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Seed sample enumerations ─────────────────────────────────────────
function seedSampleEnumerations() {
  const existing = query.all('enumerations');
  if (existing.length > 0) return;

  const samples = [
    {
      name: 'contact_status',
      label: 'Contact Status',
      description: 'Status values for contacts in the system',
      is_system: true,
      values: [
        { key: 'active', label: 'Active', order: 0, enabled: true, color: '#059669' },
        { key: 'inactive', label: 'Inactive', order: 1, enabled: true, color: '#6B7280' },
        { key: 'prospect', label: 'Prospect', order: 2, enabled: true, color: '#2563EB' },
        { key: 'blacklisted', label: 'Blacklisted', order: 3, enabled: true, color: '#DC2626' },
        { key: 'quarantined', label: 'Quarantined', order: 4, enabled: true, color: '#D97706' }
      ]
    },
    {
      name: 'delivery_status',
      label: 'Delivery Status',
      description: 'Lifecycle states for deliveries',
      is_system: true,
      values: [
        { key: 'draft', label: 'Draft', order: 0, enabled: true, color: '#6B7280' },
        { key: 'scheduled', label: 'Scheduled', order: 1, enabled: true, color: '#2563EB' },
        { key: 'sending', label: 'Sending', order: 2, enabled: true, color: '#D97706' },
        { key: 'sent', label: 'Sent', order: 3, enabled: true, color: '#059669' },
        { key: 'paused', label: 'Paused', order: 4, enabled: true, color: '#9333EA' },
        { key: 'failed', label: 'Failed', order: 5, enabled: true, color: '#DC2626' }
      ]
    },
    {
      name: 'channel_type',
      label: 'Channel Type',
      description: 'Communication channels supported by the platform',
      is_system: true,
      values: [
        { key: 'email', label: 'Email', order: 0, enabled: true, color: '#2563EB' },
        { key: 'sms', label: 'SMS', order: 1, enabled: true, color: '#059669' },
        { key: 'push', label: 'Push Notification', order: 2, enabled: true, color: '#7C3AED' },
        { key: 'in_app', label: 'In-App Message', order: 3, enabled: true, color: '#D97706' },
        { key: 'direct_mail', label: 'Direct Mail', order: 4, enabled: true, color: '#0891B2' }
      ]
    },
    {
      name: 'gender',
      label: 'Gender',
      description: 'Gender values for contact profiles',
      is_system: true,
      values: [
        { key: 'male', label: 'Male', order: 0, enabled: true, color: '' },
        { key: 'female', label: 'Female', order: 1, enabled: true, color: '' },
        { key: 'non_binary', label: 'Non-binary', order: 2, enabled: true, color: '' },
        { key: 'not_specified', label: 'Not specified', order: 3, enabled: true, color: '' }
      ]
    },
    {
      name: 'workflow_status',
      label: 'Workflow Status',
      description: 'Status values for workflow execution',
      is_system: true,
      values: [
        { key: 'draft', label: 'Draft', order: 0, enabled: true, color: '#6B7280' },
        { key: 'active', label: 'Active', order: 1, enabled: true, color: '#059669' },
        { key: 'paused', label: 'Paused', order: 2, enabled: true, color: '#D97706' },
        { key: 'completed', label: 'Completed', order: 3, enabled: true, color: '#2563EB' },
        { key: 'error', label: 'Error', order: 4, enabled: true, color: '#DC2626' }
      ]
    },
    {
      name: 'subscription_status',
      label: 'Subscription Status',
      description: 'Opt-in states for subscription services',
      is_system: true,
      values: [
        { key: 'subscribed', label: 'Subscribed', order: 0, enabled: true, color: '#059669' },
        { key: 'unsubscribed', label: 'Unsubscribed', order: 1, enabled: true, color: '#DC2626' },
        { key: 'pending', label: 'Pending confirmation', order: 2, enabled: true, color: '#D97706' }
      ]
    },
    {
      name: 'country',
      label: 'Country',
      description: 'Country codes for addresses and localization',
      is_system: false,
      values: [
        { key: 'US', label: 'United States', order: 0, enabled: true, color: '' },
        { key: 'GB', label: 'United Kingdom', order: 1, enabled: true, color: '' },
        { key: 'CA', label: 'Canada', order: 2, enabled: true, color: '' },
        { key: 'DE', label: 'Germany', order: 3, enabled: true, color: '' },
        { key: 'FR', label: 'France', order: 4, enabled: true, color: '' },
        { key: 'AU', label: 'Australia', order: 5, enabled: true, color: '' },
        { key: 'JP', label: 'Japan', order: 6, enabled: true, color: '' },
        { key: 'IN', label: 'India', order: 7, enabled: true, color: '' },
        { key: 'BR', label: 'Brazil', order: 8, enabled: true, color: '' },
        { key: 'MX', label: 'Mexico', order: 9, enabled: true, color: '' }
      ]
    },
    {
      name: 'priority',
      label: 'Priority',
      description: 'Priority levels for tickets, tasks, or campaigns',
      is_system: false,
      values: [
        { key: 'critical', label: 'Critical', order: 0, enabled: true, color: '#DC2626' },
        { key: 'high', label: 'High', order: 1, enabled: true, color: '#D97706' },
        { key: 'medium', label: 'Medium', order: 2, enabled: true, color: '#2563EB' },
        { key: 'low', label: 'Low', order: 3, enabled: true, color: '#059669' }
      ]
    },
    {
      name: 'lead_source',
      label: 'Lead Source',
      description: 'Origin of contact acquisition',
      is_system: false,
      values: [
        { key: 'website', label: 'Website', order: 0, enabled: true, color: '#2563EB' },
        { key: 'social_media', label: 'Social Media', order: 1, enabled: true, color: '#7C3AED' },
        { key: 'referral', label: 'Referral', order: 2, enabled: true, color: '#059669' },
        { key: 'paid_ads', label: 'Paid Ads', order: 3, enabled: true, color: '#D97706' },
        { key: 'email_campaign', label: 'Email Campaign', order: 4, enabled: true, color: '#0891B2' },
        { key: 'event', label: 'Event / Webinar', order: 5, enabled: true, color: '#DB2777' },
        { key: 'organic_search', label: 'Organic Search', order: 6, enabled: true, color: '#65A30D' },
        { key: 'direct', label: 'Direct', order: 7, enabled: true, color: '#6B7280' }
      ]
    },
    {
      name: 'content_category',
      label: 'Content Category',
      description: 'Categories for organizing content templates and assets',
      is_system: false,
      values: [
        { key: 'onboarding', label: 'Onboarding', order: 0, enabled: true, color: '#2563EB' },
        { key: 'promotional', label: 'Promotional', order: 1, enabled: true, color: '#DC2626' },
        { key: 'newsletter', label: 'Newsletter', order: 2, enabled: true, color: '#7C3AED' },
        { key: 'transactional', label: 'Transactional', order: 3, enabled: true, color: '#059669' },
        { key: 'event', label: 'Event', order: 4, enabled: true, color: '#D97706' },
        { key: 'retention', label: 'Retention', order: 5, enabled: true, color: '#0891B2' }
      ]
    }
  ];

  samples.forEach(e => {
    query.insert('enumerations', {
      name: e.name,
      label: e.label,
      description: e.description,
      values: e.values,
      is_system: e.is_system,
      created_by: 'System',
      updated_by: 'System'
    });
  });

  console.log(`📋 Seeded ${samples.length} sample enumerations`);
}

module.exports = router;
module.exports.seedSampleEnumerations = seedSampleEnumerations;
