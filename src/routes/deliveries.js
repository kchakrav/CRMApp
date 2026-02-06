const express = require('express');
const router = express.Router();
const { query } = require('../database');

// Get deliveries (optional channel filter)
router.get('/', (req, res) => {
  try {
    const channel = req.query.channel;
    let deliveries = query.all('deliveries');
    if (channel) {
      deliveries = deliveries.filter(d => d.channel === channel);
    }
    res.json({ deliveries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single delivery
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const delivery = query.get('deliveries', id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    res.json(delivery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create delivery
router.post('/', (req, res) => {
  try {
    const {
      name,
      channel,
      status = 'draft',
      subject = '',
      content = '',
      created_by = 'System',
      scheduled_at = null,
      audience_id = null,
      segment_id = null,
      approval_required = false,
      preheader = '',
      document_title = '',
      document_language = '',
      wizard_step = 1,
      last_saved_step = 1,
      draft_state = {},
      content_blocks = [],
      html_output = '',
      proof_emails = [],
      ab_test_enabled = false,
      ab_split_pct = 50,
      ab_winner_rule = 'open_rate'
    } = req.body;
    if (!name || !channel) {
      return res.status(400).json({ error: 'name and channel are required' });
    }
    const normalizedChannel = normalizeChannel(channel);
    const result = query.insert('deliveries', {
      name,
      channel: normalizedChannel.label,
      channel_key: normalizedChannel.key,
      status,
      subject,
      content,
      scheduled_at: scheduled_at || null,
      audience_id: audience_id ? parseInt(audience_id) : null,
      segment_id: segment_id ? parseInt(segment_id) : null,
      approval_required: !!approval_required,
      preheader: preheader || '',
      document_title: document_title || '',
      document_language: document_language || '',
      wizard_step: parseInt(wizard_step) || 1,
      last_saved_step: parseInt(last_saved_step) || 1,
      draft_state: draft_state || {},
      content_blocks: content_blocks || [],
      html_output: html_output || '',
      proof_emails: proof_emails || [],
      ab_test_enabled: !!ab_test_enabled,
      ab_split_pct: parseInt(ab_split_pct) || 50,
      ab_winner_rule: ab_winner_rule || 'open_rate',
      approved_at: null,
      sent_at: null,
      sent: 0,
      delivered: 0,
      opens: 0,
      clicks: 0,
      created_by: created_by || 'System',
      updated_by: created_by || 'System'
    });
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update delivery
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('deliveries', id);
    if (!existing) return res.status(404).json({ error: 'Delivery not found' });
    const updates = { ...req.body };
    delete updates.id;
    delete updates.created_at;
    delete updates.created_by;
    updates.updated_by = updates.updated_by || 'System';
    if (updates.channel) {
      const normalizedChannel = normalizeChannel(updates.channel);
      updates.channel = normalizedChannel.label;
      updates.channel_key = normalizedChannel.key;
    }
    if (updates.audience_id) updates.audience_id = parseInt(updates.audience_id);
    if (updates.segment_id) updates.segment_id = parseInt(updates.segment_id);
    if (updates.wizard_step) updates.wizard_step = parseInt(updates.wizard_step);
    if (updates.last_saved_step) updates.last_saved_step = parseInt(updates.last_saved_step);
    if (updates.ab_split_pct) updates.ab_split_pct = parseInt(updates.ab_split_pct);
    query.update('deliveries', id, updates);
    const updated = query.get('deliveries', id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete delivery
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('deliveries', id);
    if (!existing) return res.status(404).json({ error: 'Delivery not found' });
    query.delete('deliveries', id);
    res.json({ message: 'Delivery deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve delivery
router.post('/:id/approve', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('deliveries', id);
    if (!existing) return res.status(404).json({ error: 'Delivery not found' });
    query.update('deliveries', id, { approved_at: new Date().toISOString() });
    res.json({ message: 'Delivery approved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send delivery
router.post('/:id/send', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const delivery = query.get('deliveries', id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    if (delivery.approval_required && !delivery.approved_at) {
      return res.status(400).json({ error: 'Delivery requires approval' });
    }
    
    const baseCount = resolveDeliveryAudienceCount(delivery);
    const sent = baseCount;
    const delivered = Math.max(0, Math.round(sent * 0.97));
    const opens = Math.max(0, Math.round(delivered * 0.32));
    const clicks = Math.max(0, Math.round(opens * 0.22));
    
    query.update('deliveries', id, {
      status: 'completed',
      sent_at: new Date().toISOString(),
      sent,
      delivered,
      opens,
      clicks
    });
    
    res.json({ message: 'Delivery sent', sent, delivered, opens, clicks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pause delivery
router.post('/:id/pause', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const delivery = query.get('deliveries', id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    query.update('deliveries', id, { status: 'paused' });
    res.json({ message: 'Delivery paused' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resume delivery
router.post('/:id/resume', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const delivery = query.get('deliveries', id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    query.update('deliveries', id, { status: 'in-progress' });
    res.json({ message: 'Delivery resumed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop delivery
router.post('/:id/stop', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const delivery = query.get('deliveries', id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    query.update('deliveries', id, { status: 'stopped' });
    res.json({ message: 'Delivery stopped' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delivery report
router.get('/:id/report', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const delivery = query.get('deliveries', id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    res.json(delivery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save proof emails
router.post('/:id/proof', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const delivery = query.get('deliveries', id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    const emails = Array.isArray(req.body.emails) ? req.body.emails : [];
    query.update('deliveries', id, { proof_emails: emails });
    res.json({ message: 'Proof emails saved', emails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish delivery
router.post('/:id/publish', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const delivery = query.get('deliveries', id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    if (delivery.approval_required && !delivery.approved_at) {
      return res.status(400).json({ error: 'Delivery requires approval' });
    }
    const status = delivery.scheduled_at ? 'scheduled' : 'in-progress';
    query.update('deliveries', id, { status, published_at: new Date().toISOString() });
    res.json({ message: 'Delivery published', status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

function normalizeChannel(channel) {
  const raw = String(channel || '').toLowerCase();
  if (raw === 'email') return { key: 'email', label: 'Email' };
  if (raw === 'sms') return { key: 'sms', label: 'SMS' };
  if (raw === 'push') return { key: 'push', label: 'Push' };
  return { key: raw, label: channel };
}

function resolveDeliveryAudienceCount(delivery) {
  if (delivery.segment_id) {
    const segment = query.get('segments', delivery.segment_id);
    if (segment && segment.contact_count) return segment.contact_count;
  }
  if (delivery.audience_id) {
    const audience = query.get('audiences', delivery.audience_id);
    if (audience && audience.contact_count) return audience.contact_count;
  }
  return query.count('contacts');
}
