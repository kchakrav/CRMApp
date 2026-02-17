const express = require('express');
const router = express.Router();
const { query } = require('../database');
const emailService = require('../services/emailService');
let decisionEngine;
try { decisionEngine = require('../services/decisionEngine'); } catch (e) { decisionEngine = null; }

// ── Personalization merge: replace {{entity.field}} tokens with profile data ──
function mergePersonalization(text, profile) {
  if (!text || !profile) return text;
  return text.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, entity, field) => {
    // Flatten: treat all entities as the same contact profile for proof
    if (profile[field] !== undefined && profile[field] !== null) {
      return String(profile[field]);
    }
    // Try entity.field style lookup if profile has nested data
    if (profile[entity] && profile[entity][field] !== undefined) {
      return String(profile[entity][field]);
    }
    return match; // Leave token as-is if no value found
  });
}

// ── Offer block resolution: replace OFFER_BLOCK markers with resolved offer content ──
const OFFER_BLOCK_RE = /<!-- OFFER_BLOCK:decision=(\d+)&placement=(\d+) -->[\s\S]*?<!-- \/OFFER_BLOCK -->/g;

function hasOfferBlocks(html) {
  return typeof html === 'string' && html.includes('<!-- OFFER_BLOCK:');
}

function resolveOfferBlocksForContact(html, contactId, channel) {
  if (!decisionEngine || !hasOfferBlocks(html)) return html;
  return html.replace(OFFER_BLOCK_RE, (match, decIdStr, plIdStr) => {
    const decisionId = parseInt(decIdStr, 10);
    const placementId = parseInt(plIdStr, 10);
    try {
      const result = decisionEngine.resolve(contactId, decisionId, { channel: channel || 'email' });
      const placementResult = (result.placements || []).find(p => p.placement_id === placementId);
      if (placementResult && placementResult.offers && placementResult.offers.length > 0) {
        const offer = placementResult.offers[0];
        if (offer.content) {
          if (offer.content.content_type === 'html' && offer.content.content) return offer.content.content;
          if (offer.content.content_type === 'image' && offer.content.image_url) {
            const link = offer.content.link_url || '#';
            const alt = offer.content.alt_text || offer.offer_name || 'Offer';
            return `<a href="${link}" style="text-decoration:none;"><img src="${offer.content.image_url}" alt="${alt}" style="max-width:100%;"></a>`;
          }
          if (offer.content.content_type === 'text' && offer.content.content) return `<div>${offer.content.content}</div>`;
          if (offer.content.content) return offer.content.content;
        }
        return `<div>${offer.offer_name || 'Offer'}</div>`;
      }
    } catch (e) {
      console.warn(`[Offer resolve] Decision ${decisionId} for contact ${contactId}:`, e.message);
    }
    // Return fallback content that was between the markers
    const fallbackMatch = match.match(/<!-- OFFER_BLOCK:[^>]+ -->([\s\S]*?)<!-- \/OFFER_BLOCK -->/);
    return fallbackMatch ? fallbackMatch[1] : '';
  });
}

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
router.post('/:id/send', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const delivery = query.get('deliveries', id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    if (delivery.approval_required && !delivery.approved_at) {
      return res.status(400).json({ error: 'Delivery requires approval' });
    }

    const channel = (delivery.channel || '').toLowerCase();

    // ── Real email sending via Brevo SMTP (email channel only) ──
    if (channel === 'email' && emailService.isConfigured()) {
      // Resolve recipients
      const recipients = resolveDeliveryRecipients(delivery);
      if (recipients.length === 0) {
        return res.status(400).json({ error: 'No recipients found. Assign a segment or audience to this delivery.' });
      }

      // Build the HTML content
      let htmlContent = delivery.html_output || delivery.content || '';
      // If html_output is stored as JSON (object with variant keys), pick the first
      if (typeof htmlContent === 'object' && htmlContent !== null) {
        htmlContent = htmlContent.A || htmlContent.B || Object.values(htmlContent)[0] || '';
      }
      if (!htmlContent) {
        return res.status(400).json({ error: 'No email content found. Design the email before sending.' });
      }

      // Apply basic personalization merge tags in subject
      const baseSubject = delivery.subject || delivery.name || '(no subject)';

      // Mark as in-progress
      query.update('deliveries', id, { status: 'in-progress', sent_at: new Date().toISOString() });

      // Resolve offer blocks per-contact if present
      const htmlHasOffers = hasOfferBlocks(htmlContent);

      // Send via Brevo
      const result = await emailService.sendBulk({
        recipients: recipients.map(c => ({
          email: c.email,
          name: [c.first_name, c.last_name].filter(Boolean).join(' ') || undefined,
          first_name: c.first_name,
          last_name: c.last_name,
          subject: baseSubject
            .replace(/\{\{first_name\}\}/gi, c.first_name || '')
            .replace(/\{\{last_name\}\}/gi, c.last_name || '')
            .replace(/\{\{email\}\}/gi, c.email || ''),
          html: htmlHasOffers ? resolveOfferBlocksForContact(htmlContent, c.id, 'email') : undefined
        })),
        subject: baseSubject,
        html: htmlContent,
        preheader: delivery.preheader || ''
      });

      // Update delivery record with real counts
      query.update('deliveries', id, {
        status: result.success ? 'completed' : 'completed_with_errors',
        sent: result.sent,
        delivered: result.sent,  // Brevo accepted count
        opens: 0,    // Will be updated via webhooks later
        clicks: 0
      });

      return res.json({
        message: result.success ? 'Delivery sent via Brevo' : 'Delivery sent with some errors',
        provider: 'brevo',
        sent: result.sent,
        failed: result.failed,
        total: result.total,
        errors: result.errors
      });
    }

    // ── Fallback: simulated send (non-email channels or Brevo not configured) ──
    // Resolve offer blocks for a sample contact to validate and log propositions
    let contentForSim = delivery.html_output || delivery.content || '';
    if (typeof contentForSim === 'object' && contentForSim !== null) {
      contentForSim = contentForSim.A || contentForSim.B || Object.values(contentForSim)[0] || '';
    }
    if (hasOfferBlocks(contentForSim)) {
      const simRecipients = resolveDeliveryRecipients(delivery);
      const sampleContacts = simRecipients.slice(0, Math.min(simRecipients.length, 5));
      for (const c of sampleContacts) {
        try {
          resolveOfferBlocksForContact(contentForSim, c.id, channel);
        } catch (e) { /* best effort */ }
      }
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
    
    const simulated = !emailService.isConfigured() && channel === 'email';
    res.json({
      message: simulated ? 'Delivery sent (simulated — Brevo not configured)' : 'Delivery sent',
      provider: simulated ? 'simulated' : 'simulated',
      sent, delivered, opens, clicks
    });
  } catch (error) {
    console.error('[Delivery Send Error]', error);
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

// Delivery report – Adobe-Campaign-style, channel-aware
router.get('/:id/report', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const delivery = query.get('deliveries', id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

    const channel = (delivery.channel || '').toLowerCase(); // email | sms | push
    const sent = delivery.sent || 0;
    const delivered = delivery.delivered || 0;
    const opens = delivery.opens || 0;
    const clicks = delivery.clicks || 0;

    // Simulated granular metrics
    const bounced = Math.max(0, sent - delivered);
    const softBounce = Math.round(bounced * 0.6);
    const hardBounce = bounced - softBounce;
    const unsubscribed = Math.round(delivered * 0.008);
    const spamComplaints = Math.round(delivered * 0.001);
    const errors = Math.round(sent * 0.015);
    const newQuarantine = hardBounce;
    const excluded = Math.round(sent * 0.04);
    const toDeliver = sent + excluded;

    // Rates
    const deliveryRate = sent > 0 ? ((delivered / sent) * 100).toFixed(2) : '0.00';
    const openRate = delivered > 0 ? ((opens / delivered) * 100).toFixed(2) : '0.00';
    const clickRate = delivered > 0 ? ((clicks / delivered) * 100).toFixed(2) : '0.00';
    const ctor = opens > 0 ? ((clicks / opens) * 100).toFixed(2) : '0.00';
    const bounceRate = sent > 0 ? ((bounced / sent) * 100).toFixed(2) : '0.00';
    const unsubRate = delivered > 0 ? ((unsubscribed / delivered) * 100).toFixed(2) : '0.00';
    const errorRate = sent > 0 ? ((errors / sent) * 100).toFixed(2) : '0.00';

    // Engagement timeline (48 h)
    const engagementTimeline = [];
    if (delivery.sent_at) {
      const base = new Date(delivery.sent_at);
      for (let h = 0; h < 48; h++) {
        const decay = Math.exp(-0.12 * h);
        const hourOpens = Math.round(opens * 0.08 * decay * (0.7 + Math.random() * 0.6));
        const hourClicks = Math.round(clicks * 0.06 * decay * (0.6 + Math.random() * 0.8));
        engagementTimeline.push({
          hour: h,
          time: new Date(base.getTime() + h * 3600000).toISOString(),
          opens: hourOpens,
          clicks: hourClicks,
          ...(channel === 'sms' ? { delivered: Math.round(delivered * 0.04 * decay * (0.8 + Math.random() * 0.4)) } : {})
        });
      }
    }

    // Throughput (messages / hour for first 12 h)
    const throughput = [];
    if (delivery.sent_at) {
      for (let h = 0; h < 12; h++) {
        throughput.push({
          hour: h,
          messages: h < 3 ? Math.round(sent * 0.22 * (1 - h * 0.25) * (0.85 + Math.random() * 0.3))
                          : Math.round(sent * 0.04 * (0.5 + Math.random() * 0.5))
        });
      }
    }

    // Channel-specific extras
    let channelData = {};

    if (channel === 'email') {
      // Device breakdown
      channelData.device_breakdown = {
        desktop: Math.round(opens * 0.42),
        mobile: Math.round(opens * 0.45),
        tablet: Math.round(opens * 0.10),
        other: Math.round(opens * 0.03)
      };
      // Top links
      channelData.top_links = [
        { url: 'Primary CTA Button', clicks: Math.round(clicks * 0.45), percentage: 45 },
        { url: 'Hero Image Link', clicks: Math.round(clicks * 0.20), percentage: 20 },
        { url: 'Secondary CTA', clicks: Math.round(clicks * 0.15), percentage: 15 },
        { url: 'Social – Facebook', clicks: Math.round(clicks * 0.08), percentage: 8 },
        { url: 'Social – Twitter', clicks: Math.round(clicks * 0.06), percentage: 6 },
        { url: 'Footer – Unsubscribe', clicks: Math.round(clicks * 0.04), percentage: 4 },
        { url: 'Footer – Privacy', clicks: Math.round(clicks * 0.02), percentage: 2 }
      ].filter(l => l.clicks > 0);
      // Geo
      channelData.geo_breakdown = [
        { country: 'United States', opens: Math.round(opens * 0.44), clicks: Math.round(clicks * 0.40) },
        { country: 'United Kingdom', opens: Math.round(opens * 0.18), clicks: Math.round(clicks * 0.20) },
        { country: 'Canada', opens: Math.round(opens * 0.11), clicks: Math.round(clicks * 0.12) },
        { country: 'Germany', opens: Math.round(opens * 0.09), clicks: Math.round(clicks * 0.10) },
        { country: 'Australia', opens: Math.round(opens * 0.07), clicks: Math.round(clicks * 0.08) },
        { country: 'France', opens: Math.round(opens * 0.05), clicks: Math.round(clicks * 0.05) },
        { country: 'Other', opens: Math.round(opens * 0.06), clicks: Math.round(clicks * 0.05) }
      ].filter(g => g.opens > 0);
      // Browser / mail client
      channelData.mail_clients = [
        { client: 'Apple Mail', pct: 38 },
        { client: 'Gmail', pct: 28 },
        { client: 'Outlook', pct: 18 },
        { client: 'Yahoo Mail', pct: 8 },
        { client: 'Other', pct: 8 }
      ];
      channelData.unique_opens = Math.round(opens * 0.72);
      channelData.total_opens = opens;
      channelData.unique_clicks = Math.round(clicks * 0.68);
      channelData.total_clicks = clicks;
      channelData.forwards = Math.round(opens * 0.02);
      channelData.mirror_page = Math.round(opens * 0.03);
    }

    if (channel === 'sms') {
      channelData.opt_outs = Math.round(delivered * 0.005);
      channelData.replies = Math.round(delivered * 0.03);
      channelData.link_clicks = clicks;
      channelData.avg_cost_per_sms = 0.015;
      channelData.total_cost = parseFloat((sent * 0.015).toFixed(2));
      channelData.segments_sent = sent <= 160 ? sent : Math.ceil(sent * 1.3);
      // Carrier breakdown
      channelData.carrier_breakdown = [
        { carrier: 'AT&T', delivered: Math.round(delivered * 0.32), pct: 32 },
        { carrier: 'Verizon', delivered: Math.round(delivered * 0.28), pct: 28 },
        { carrier: 'T-Mobile', delivered: Math.round(delivered * 0.24), pct: 24 },
        { carrier: 'Other', delivered: Math.round(delivered * 0.16), pct: 16 }
      ];
      // Error categories
      channelData.error_categories = [
        { reason: 'Invalid number', count: Math.round(errors * 0.4), pct: 40 },
        { reason: 'Carrier rejected', count: Math.round(errors * 0.25), pct: 25 },
        { reason: 'Number unreachable', count: Math.round(errors * 0.20), pct: 20 },
        { reason: 'Opt-out / DNC list', count: Math.round(errors * 0.10), pct: 10 },
        { reason: 'Other', count: Math.round(errors * 0.05), pct: 5 }
      ].filter(e => e.count > 0);
    }

    if (channel === 'push') {
      channelData.impressions = Math.round(delivered * 0.65);
      channelData.dismissals = Math.round(delivered * 0.30);
      channelData.direct_opens = clicks;
      channelData.influenced_opens = Math.round(clicks * 0.4);
      // Platform breakdown
      const iosShare = 0.55;
      channelData.platform_breakdown = {
        ios: { sent: Math.round(sent * iosShare), delivered: Math.round(delivered * iosShare), opened: Math.round(clicks * 0.58) },
        android: { sent: Math.round(sent * (1 - iosShare)), delivered: Math.round(delivered * (1 - iosShare)), opened: Math.round(clicks * 0.42) }
      };
      // Action button clicks
      channelData.action_button_clicks = [
        { button: delivery.push_button_1 || 'Button 1', clicks: Math.round(clicks * 0.3) },
        { button: delivery.push_button_2 || 'Button 2', clicks: Math.round(clicks * 0.12) }
      ].filter(b => b.clicks > 0);
      // Error categories
      channelData.error_categories = [
        { reason: 'Invalid token', count: Math.round(errors * 0.35), pct: 35 },
        { reason: 'Unregistered device', count: Math.round(errors * 0.30), pct: 30 },
        { reason: 'Payload too large', count: Math.round(errors * 0.10), pct: 10 },
        { reason: 'Rate limited', count: Math.round(errors * 0.15), pct: 15 },
        { reason: 'Other', count: Math.round(errors * 0.10), pct: 10 }
      ].filter(e => e.count > 0);
    }

    // Exclusion reasons
    const exclusions = [
      { reason: 'Address not specified', count: Math.round(excluded * 0.30), pct: 30 },
      { reason: 'Quarantined address', count: Math.round(excluded * 0.25), pct: 25 },
      { reason: 'On denylist', count: Math.round(excluded * 0.20), pct: 20 },
      { reason: 'Duplicate', count: Math.round(excluded * 0.15), pct: 15 },
      { reason: 'Control group', count: Math.round(excluded * 0.10), pct: 10 }
    ].filter(e => e.count > 0);

    // Simulated recipients for tables
    const allContacts = query.all('contacts').slice(0, 100);
    const recipientPool = allContacts.length > 0 ? allContacts : [];

    const topEngaged = recipientPool.slice(0, Math.min(15, recipientPool.length)).map((c, i) => ({
      name: `${c.first_name} ${c.last_name}`,
      email: c.email || c.phone || '',
      phone: c.phone || '',
      sent_at: delivery.sent_at || delivery.created_at,
      opened_at: i < 10 ? new Date(new Date(delivery.sent_at || delivery.created_at).getTime() + (i + 1) * 1800000).toISOString() : null,
      clicked_at: i < 5 ? new Date(new Date(delivery.sent_at || delivery.created_at).getTime() + (i + 1) * 3600000).toISOString() : null,
      bounced: false,
      engagement_score: i < 5 ? 3 : i < 10 ? 1 : 0
    }));

    const nonEngaged = recipientPool.slice(15, Math.min(25, recipientPool.length)).map(c => ({
      name: `${c.first_name} ${c.last_name}`,
      email: c.email || c.phone || '',
      phone: c.phone || '',
      sent_at: delivery.sent_at || delivery.created_at
    }));

    const bouncedRecipients = recipientPool.slice(25, Math.min(30, recipientPool.length)).map(c => ({
      name: `${c.first_name} ${c.last_name}`,
      email: c.email || c.phone || '',
      phone: c.phone || '',
      sent_at: delivery.sent_at || delivery.created_at,
      bounce_type: Math.random() > 0.5 ? 'Hard bounce' : 'Soft bounce'
    }));

    res.json({
      delivery: {
        id: delivery.id,
        name: delivery.name,
        channel: delivery.channel,
        channel_key: channel,
        status: delivery.status,
        subject: delivery.subject,
        content: delivery.content,
        scheduled_at: delivery.scheduled_at,
        sent_at: delivery.sent_at,
        created_at: delivery.created_at,
        created_by: delivery.created_by
      },
      summary: {
        targeted: toDeliver,
        excluded,
        to_deliver: sent,
        success: delivered,
        errors,
        new_quarantine: newQuarantine
      },
      metrics: {
        sent, delivered, opens, clicks, bounced, soft_bounce: softBounce, hard_bounce: hardBounce,
        unsubscribed, spam_complaints: spamComplaints, errors
      },
      rates: {
        delivery_rate: deliveryRate, open_rate: openRate, click_rate: clickRate,
        ctor, bounce_rate: bounceRate, unsubscribe_rate: unsubRate, error_rate: errorRate
      },
      engagement_timeline: engagementTimeline,
      throughput,
      exclusions,
      channel_data: channelData,
      recipients: {
        top_engaged: topEngaged,
        non_engaged: nonEngaged,
        bounced: bouncedRecipients
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send proof emails
router.post('/:id/proof', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const delivery = query.get('deliveries', id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    const emails = Array.isArray(req.body.emails) ? req.body.emails : [];
    const testProfileId = req.body.test_profile_id ? parseInt(req.body.test_profile_id) : null;

    if (emails.length === 0) {
      query.update('deliveries', id, { proof_emails: emails });
      return res.json({ message: 'Proof emails saved (none to send)', emails });
    }

    // Load test profile for personalization
    let testProfile = null;
    if (testProfileId) {
      testProfile = query.get('contacts', testProfileId);
    }

    // If Brevo is configured, actually send the proofs first, then persist
    if (emailService.isConfigured()) {
      let htmlContent = delivery.html_output || delivery.content || '';
      if (typeof htmlContent === 'object' && htmlContent !== null) {
        htmlContent = htmlContent.A || htmlContent.B || Object.values(htmlContent)[0] || '';
      }

      let subject = delivery.subject || delivery.name || '(no subject)';

      // Apply personalization with test profile
      if (testProfile) {
        htmlContent = mergePersonalization(htmlContent, testProfile);
        subject = mergePersonalization(subject, testProfile);
      }

      const result = await emailService.sendProof({
        emails,
        subject,
        html: htmlContent || '<p>No content designed yet.</p>',
        preheader: mergePersonalization(delivery.preheader || '', testProfile)
      });

      // Save proof email list AFTER sending so the DB write doesn't interfere
      query.update('deliveries', id, { proof_emails: emails });

      // Build a user-friendly message that includes errors if any
      let message;
      if (result.success) {
        message = `Proof sent to ${result.sent} recipient(s)`;
        if (testProfile) {
          message += ` with personalization from ${testProfile.first_name || ''} ${testProfile.last_name || ''}`.trim();
        }
      } else {
        const firstError = result.details && result.details.find(d => d.error);
        message = firstError
          ? `Send failed: ${firstError.error}`
          : 'All proof emails failed to send';
      }

      return res.json({
        message,
        provider: 'brevo',
        ...result
      });
    }

    // Brevo not configured — just save the list
    query.update('deliveries', id, { proof_emails: emails });
    res.json({ message: 'Proof emails saved (Brevo not configured — no emails sent)', emails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Preview delivery with personalization from a test profile
router.post('/:id/preview', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const delivery = query.get('deliveries', id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

    const testProfileId = req.body.test_profile_id ? parseInt(req.body.test_profile_id) : null;
    let testProfile = null;
    if (testProfileId) {
      testProfile = query.get('contacts', testProfileId);
      if (!testProfile) return res.status(404).json({ error: 'Test profile not found' });
    }

    let htmlContent = delivery.html_output || delivery.content || '';
    if (typeof htmlContent === 'object' && htmlContent !== null) {
      htmlContent = htmlContent.A || htmlContent.B || Object.values(htmlContent)[0] || '';
    }
    let subject = delivery.subject || delivery.name || '(no subject)';
    let preheader = delivery.preheader || '';
    let smsContent = delivery.content || '';
    let pushSubject = delivery.subject || '';
    let pushContent = delivery.content || '';

    if (testProfile) {
      htmlContent = mergePersonalization(htmlContent, testProfile);
      subject = mergePersonalization(subject, testProfile);
      preheader = mergePersonalization(preheader, testProfile);
      smsContent = mergePersonalization(smsContent, testProfile);
      pushSubject = mergePersonalization(pushSubject, testProfile);
      pushContent = mergePersonalization(pushContent, testProfile);
      // Resolve offer blocks for the test profile
      if (hasOfferBlocks(htmlContent)) {
        const ch = (delivery.channel || 'email').toLowerCase();
        htmlContent = resolveOfferBlocksForContact(htmlContent, testProfile.id, ch);
      }
    }

    res.json({
      html: htmlContent,
      subject,
      preheader,
      sms_content: smsContent,
      push_subject: pushSubject,
      push_content: pushContent,
      test_profile: testProfile ? {
        id: testProfile.id,
        first_name: testProfile.first_name,
        last_name: testProfile.last_name,
        email: testProfile.email
      } : null
    });
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

// ── Email provider status ─────────────────────────────────────
router.get('/email-provider/status', (req, res) => {
  res.json(emailService.getStatus());
});

// ── Toggle Brevo enabled/disabled ─────────────────────────────
router.post('/email-provider/toggle', (req, res) => {
  try {
    const { enabled } = req.body;
    const newState = enabled !== undefined ? !!enabled : !emailService.isEnabled();
    emailService.setEnabled(newState);
    const status = emailService.getStatus();
    res.json({
      message: newState
        ? 'Brevo sending enabled'
        : 'Brevo sending paused — emails will be simulated',
      ...status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Update Brevo config at runtime ────────────────────────────
router.post('/email-provider/configure', async (req, res) => {
  try {
    const { smtp_key, smtp_login, from_email, from_name } = req.body;
    if (smtp_key) process.env.BREVO_SMTP_KEY = smtp_key;
    if (smtp_login) process.env.BREVO_SMTP_LOGIN = smtp_login;
    if (from_email) process.env.BREVO_FROM_EMAIL = from_email;
    if (from_name) process.env.BREVO_FROM_NAME = from_name;
    emailService.init();
    emailService.saveConfig();

    // Try to verify the SMTP connection, but don't block config save on failure
    let verified = false;
    let verifyError = null;
    try {
      const verification = await emailService.verifyConnection();
      verified = verification.ok;
      verifyError = verification.error || null;
    } catch (e) {
      verifyError = e.message;
    }

    const status = emailService.getStatus();
    res.json({
      message: verified
        ? 'Brevo SMTP configured and verified'
        : 'Brevo SMTP configured (verification pending — credentials saved)',
      verified,
      verify_error: verifyError,
      ...status
    });
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

// Resolve actual recipient contacts for real email sending
function resolveDeliveryRecipients(delivery) {
  let contacts = query.all('contacts');

  // Filter to active + subscribed contacts with valid emails
  contacts = contacts.filter(c =>
    c.email &&
    c.status === 'active' &&
    c.subscription_status === 'subscribed'
  );

  // If a segment is assigned, further filter by segment membership
  if (delivery.segment_id) {
    try {
      const memberships = query.all('segment_memberships');
      const segmentContactIds = new Set(
        memberships
          .filter(m => m.segment_id === delivery.segment_id)
          .map(m => m.contact_id)
      );
      if (segmentContactIds.size > 0) {
        contacts = contacts.filter(c => segmentContactIds.has(c.id));
      }
    } catch (e) {
      // segment_memberships table may not exist — use all subscribed contacts
    }
  }

  return contacts;
}
