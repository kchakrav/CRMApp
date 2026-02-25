const express = require('express');
const router = express.Router();
const { query } = require('../database');
const emailService = require('../services/emailService');

// Aggregate opens/clicks from delivery_logs by hour and day (for STO and reports)
function aggregateDeliveryLogsByTime(deliveryIds = null) {
  let logs = query.all('delivery_logs');
  if (deliveryIds && deliveryIds.length > 0) {
    const set = new Set(deliveryIds);
    logs = logs.filter(l => set.has(l.delivery_id));
  }
  const hourTotals = new Array(24).fill(0);
  const dayTotals = new Array(7).fill(0);
  const hourClicks = new Array(24).fill(0);
  const dayClicks = new Array(7).fill(0);
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => ({ opens: 0, clicks: 0 })));
  for (const log of logs) {
    const t = new Date(log.occurred_at || log.created_at);
    const dow = (t.getDay() + 6) % 7;
    const h = t.getHours();
    if (log.event_type === 'open') {
      hourTotals[h]++;
      dayTotals[dow]++;
      grid[dow][h].opens++;
    } else if (log.event_type === 'click') {
      hourClicks[h]++;
      dayClicks[dow]++;
      grid[dow][h].clicks++;
    }
  }
  return { hourTotals, dayTotals, hourClicks, dayClicks, grid, totalOpens: dayTotals.reduce((a, b) => a + b, 0), totalClicks: dayClicks.reduce((a, b) => a + b, 0) };
}
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

// ── STO Insights — system-wide optimal send times ───────────
router.get('/sto-insights', (req, res) => {
  try {
    const allDeliveries = query.all('deliveries');
    if (allDeliveries.length === 0) {
      return res.json({ available: false, message: 'No delivery data to compute STO insights.' });
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const channelGroups = { email: [], sms: [], push: [] };
    allDeliveries.forEach(d => {
      const ch = (d.channel || 'email').toLowerCase();
      if (channelGroups[ch]) channelGroups[ch].push(d);
    });

    function computeInsights(deliveries, channelName) {
      if (deliveries.length === 0) return null;

      let totalSent = 0, totalOpens = 0, totalClicks = 0;
      deliveries.forEach(d => { totalSent += d.sent || 0; totalOpens += d.opens || 0; totalClicks += d.clicks || 0; });

      const deliveryIds = deliveries.map(d => d.id);
      const fromLogs = aggregateDeliveryLogsByTime(deliveryIds);
      const useLogs = fromLogs.totalOpens > 0 || fromLogs.totalClicks > 0;
      const hourTotals = useLogs ? fromLogs.hourTotals : new Array(24).fill(0);
      const dayTotals = useLogs ? fromLogs.dayTotals : new Array(7).fill(0);
      const grid = [];
      if (useLogs) {
        for (let di = 0; di < 7; di++) {
          for (let hi = 0; hi < 24; hi++) {
            grid.push({ day: days[di], hour: hi, opens: fromLogs.grid[di][hi].opens });
          }
        }
      } else {
        for (let di = 0; di < 7; di++) {
          for (let hi = 0; hi < 24; hi++) {
            let openSum = 0;
            deliveries.forEach(d => {
              const seed = d.id * 7 + 31;
              const rng = (i) => { const x = Math.sin(seed + i) * 10000; return x - Math.floor(x); };
              const dOpens = d.opens || 0;
              const peakMul = (hi >= 9 && hi <= 11) ? 2.5 : (hi >= 14 && hi <= 16) ? 2.0 : (hi >= 19 && hi <= 21) ? 1.8 : (hi < 6 || hi > 22) ? 0.2 : 1.0;
              const dayMul = (di === 1 || di === 2) ? 1.4 : (di >= 5) ? 0.5 : 1.0;
              const base = (dOpens / 168) * peakMul * dayMul;
              const idx = di * 24 + hi;
              openSum += Math.round(base * (0.6 + rng(idx) * 0.8));
            });
            grid.push({ day: days[di], hour: hi, opens: openSum });
          }
        }
      }

      const hourRanked = hourTotals.map((v, i) => ({ hour: i, opens: v })).sort((a, b) => b.opens - a.opens);
      const top3Hours = hourRanked.slice(0, 3);
      const dayRanked = dayTotals.map((v, i) => ({ day: days[i], dayIndex: i, opens: v })).sort((a, b) => b.opens - a.opens);
      const top3Days = dayRanked.slice(0, 3);
      const gridRanked = [...grid].sort((a, b) => b.opens - a.opens);
      const top3Slots = gridRanked.slice(0, 3).map(g => ({
        day: g.day, hour: g.hour,
        label: g.day + ' ' + (g.hour < 10 ? '0' : '') + g.hour + ':00',
        opens: g.opens
      }));
      const worst3Hours = hourRanked.slice(-3).reverse();

      const avgOpenRate = totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : '0.0';
      const avgCTOR = totalOpens > 0 ? ((totalClicks / totalOpens) * 100).toFixed(1) : '0.0';

      const stoDeliveries = deliveries.filter(d => d.sto_enabled);
      const nonStoDeliveries = deliveries.filter(d => !d.sto_enabled);
      let stoLift = null;
      if (stoDeliveries.length > 0 && nonStoDeliveries.length > 0) {
        const stoOR = stoDeliveries.reduce((s, d) => s + (d.sent > 0 ? (d.opens || 0) / d.sent : 0), 0) / stoDeliveries.length;
        const nonOR = nonStoDeliveries.reduce((s, d) => s + (d.sent > 0 ? (d.opens || 0) / d.sent : 0), 0) / nonStoDeliveries.length;
        stoLift = nonOR > 0 ? (((stoOR - nonOR) / nonOR) * 100).toFixed(1) : null;
      }

      return {
        channel: channelName,
        delivery_count: deliveries.length,
        total_sent: totalSent,
        total_opens: totalOpens,
        avg_open_rate: avgOpenRate,
        avg_ctor: avgCTOR,
        best_hours: top3Hours.map(h => ({
          hour: h.hour,
          label: (h.hour < 10 ? '0' : '') + h.hour + ':00',
          opens: h.opens,
          pct_of_total: totalOpens > 0 ? ((h.opens / totalOpens) * 100).toFixed(1) : '0.0'
        })),
        best_days: top3Days.map(d => ({
          day: d.day, opens: d.opens,
          pct_of_total: totalOpens > 0 ? ((d.opens / totalOpens) * 100).toFixed(1) : '0.0'
        })),
        best_slots: top3Slots,
        avoid_hours: worst3Hours.map(h => ({
          hour: h.hour,
          label: (h.hour < 10 ? '0' : '') + h.hour + ':00',
          opens: h.opens
        })),
        sto_adoption: {
          enabled_count: stoDeliveries.length,
          total_count: deliveries.length,
          pct: deliveries.length > 0 ? ((stoDeliveries.length / deliveries.length) * 100).toFixed(0) : '0',
          lift_pct: stoLift
        }
      };
    }

    const overall = computeInsights(allDeliveries, 'all');
    const byChannel = {};
    for (const [ch, dels] of Object.entries(channelGroups)) {
      const insight = computeInsights(dels, ch);
      if (insight) byChannel[ch] = insight;
    }

    res.json({
      available: true,
      overall,
      by_channel: byChannel,
      total_deliveries: allDeliveries.length
    });
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
      ab_winner_rule = 'open_rate',
      folder_id = null,
      // Send Time Optimization
      sto_enabled = false,
      sto_model = 'engagement_history',
      sto_window_hours = 24,
      // Wave Sending
      wave_enabled = false,
      wave_count = 3,
      wave_interval_minutes = 60,
      wave_start_pct = 10,
      wave_ramp_type = 'linear',
      wave_custom_pcts = null,
      wave_timing_mode = 'interval',
      wave_custom_times = null
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
      folder_id: folder_id ? parseInt(folder_id) : null,
      // Send Time Optimization
      sto_enabled: !!sto_enabled,
      sto_model: sto_model || 'engagement_history',
      sto_window_hours: parseInt(sto_window_hours) || 24,
      // Wave Sending
      wave_enabled: !!wave_enabled,
      wave_count: parseInt(wave_count) || 3,
      wave_interval_minutes: parseInt(wave_interval_minutes) || 60,
      wave_start_pct: parseInt(wave_start_pct) || 10,
      wave_ramp_type: wave_ramp_type || 'linear',
      wave_custom_pcts: wave_custom_pcts || null,
      wave_timing_mode: wave_timing_mode || 'interval',
      wave_custom_times: wave_custom_times || null,
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

// Get workflow schedule context for a delivery
router.get('/:id/workflow-schedule', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const delivery = query.get('deliveries', id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

    const workflows = query.all('workflows');
    const linkedWorkflows = [];

    workflows.forEach(w => {
      const nodes = w.orchestration?.nodes || [];
      const matchingNodes = nodes.filter(n =>
        ['email', 'sms', 'push'].includes(n.type) && parseInt(n.config?.delivery_id) === id
      );
      if (matchingNodes.length > 0) {
        // Calculate delivery timing within the workflow
        const allNodes = nodes;
        const connections = w.orchestration?.connections || [];
        let cumulativeWaitMinutes = 0;
        const nodeOrder = [];

        // Simple traversal: walk connections from entry to find path to delivery node
        const visited = new Set();
        function walkPath(nodeId) {
          if (visited.has(nodeId)) return;
          visited.add(nodeId);
          const node = allNodes.find(n => n.id === nodeId);
          if (!node) return;
          nodeOrder.push(node);
          if (node.type === 'wait') {
            const wt = parseInt(node.config?.wait_time) || 0;
            const wu = node.config?.wait_unit || 'hours';
            cumulativeWaitMinutes += wu === 'days' ? wt * 1440 : wu === 'minutes' ? wt : wt * 60;
          }
          const outgoing = connections.filter(c => c.from === nodeId);
          outgoing.forEach(c => walkPath(c.to));
        }
        const entryNode = allNodes.find(n => n.type === 'entry');
        if (entryNode) walkPath(entryNode.id);

        // Find position of delivery node in the path
        const deliveryNode = matchingNodes[0];
        const nodeIdx = nodeOrder.findIndex(n => n.id === deliveryNode.id);
        let waitBeforeDelivery = 0;
        if (nodeIdx > 0) {
          for (let i = 0; i < nodeIdx; i++) {
            const n = nodeOrder[i];
            if (n.type === 'wait') {
              const wt = parseInt(n.config?.wait_time) || 0;
              const wu = n.config?.wait_unit || 'hours';
              waitBeforeDelivery += wu === 'days' ? wt * 1440 : wu === 'minutes' ? wt : wt * 60;
            }
          }
        }

        // Build schedule info
        const trigger = w.entry_trigger || {};
        const schedule = {
          workflow_id: w.id,
          workflow_name: w.name,
          workflow_status: w.status,
          workflow_type: w.workflow_type,
          trigger_type: trigger.type || 'manual',
          scheduled_at: trigger.config?.scheduled_at || null,
          frequency: trigger.config?.frequency || null,
          recurring_day: trigger.config?.day || null,
          recurring_time: trigger.config?.time || null,
          next_run_at: w.next_run_at || null,
          delivery_node_name: deliveryNode.name || deliveryNode.type,
          delivery_position: nodeIdx + 1,
          total_nodes: allNodes.length,
          wait_before_delivery_minutes: waitBeforeDelivery,
          nodes_before_delivery: nodeIdx
        };

        // Calculate estimated delivery time
        if (trigger.config?.scheduled_at) {
          const wfStart = new Date(trigger.config.scheduled_at);
          const estDeliveryTime = new Date(wfStart.getTime() + waitBeforeDelivery * 60000);
          schedule.estimated_delivery_time = estDeliveryTime.toISOString();
        }

        linkedWorkflows.push(schedule);
      }
    });

    res.json({
      delivery_id: id,
      delivery_name: delivery.name,
      delivery_scheduled_at: delivery.scheduled_at,
      linked_workflows: linkedWorkflows,
      is_workflow_linked: linkedWorkflows.length > 0
    });
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
    if (updates.sto_window_hours !== undefined) updates.sto_window_hours = parseInt(updates.sto_window_hours) || 24;
    if (updates.wave_count !== undefined) updates.wave_count = parseInt(updates.wave_count) || 3;
    if (updates.wave_interval_minutes !== undefined) updates.wave_interval_minutes = parseInt(updates.wave_interval_minutes) || 60;
    if (updates.wave_start_pct !== undefined) updates.wave_start_pct = parseInt(updates.wave_start_pct) || 10;
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

    // Engagement timeline (48 h) — from delivery_logs when available
    const engagementTimeline = [];
    const deliveryLogs = query.all('delivery_logs').filter(l => l.delivery_id === id);
    const hasLogs = deliveryLogs.length > 0 && delivery.sent_at;
    if (hasLogs) {
      const baseTs = new Date(delivery.sent_at).getTime();
      const opensByHour = new Array(48).fill(0);
      const clicksByHour = new Array(48).fill(0);
      for (const l of deliveryLogs) {
        const t = new Date(l.occurred_at || l.created_at).getTime();
        const h = Math.floor((t - baseTs) / 3600000);
        if (h >= 0 && h < 48) {
          if (l.event_type === 'open') opensByHour[h]++;
          else if (l.event_type === 'click') clicksByHour[h]++;
        }
      }
      for (let h = 0; h < 48; h++) {
        engagementTimeline.push({
          hour: h,
          time: new Date(baseTs + h * 3600000).toISOString(),
          opens: opensByHour[h],
          clicks: clicksByHour[h],
          ...(channel === 'sms' ? { delivered: Math.round(delivered * 0.04 * Math.exp(-0.12 * h) * (0.8 + Math.random() * 0.4)) } : {})
        });
      }
    } else if (delivery.sent_at) {
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

    // Exclusion reasons (Adobe Campaign v8 style)
    const exclusions = [
      { reason: 'User unknown', count: Math.round(excluded * 0.25), pct: 25 },
      { reason: 'Invalid domain', count: Math.round(excluded * 0.15), pct: 15 },
      { reason: 'Mailbox full', count: Math.round(excluded * 0.12), pct: 12 },
      { reason: 'Account disabled', count: Math.round(excluded * 0.18), pct: 18 },
      { reason: 'Refused', count: Math.round(excluded * 0.10), pct: 10 },
      { reason: 'Unreachable', count: Math.round(excluded * 0.08), pct: 8 },
      { reason: 'Address not specified', count: Math.round(excluded * 0.07), pct: 7 },
      { reason: 'Control group', count: Math.round(excluded * 0.05), pct: 5 }
    ].filter(e => e.count > 0);

    // ── Broadcast Statistics (per-domain) ──
    const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'aol.com', 'icloud.com', 'protonmail.com', 'other'];
    const domainShares = [0.32, 0.22, 0.14, 0.10, 0.06, 0.05, 0.03, 0.08];
    const broadcastStats = domains.map((domain, i) => {
      const share = domainShares[i];
      const dProcessed = Math.round(sent * share);
      const dDelivered = Math.round(dProcessed * (0.94 + Math.random() * 0.05));
      const dHardBounce = Math.round(dProcessed * (0.005 + Math.random() * 0.015));
      const dSoftBounce = Math.round(dProcessed * (0.01 + Math.random() * 0.02));
      const dOpens = Math.round(dDelivered * (0.25 + Math.random() * 0.20));
      const dClicks = Math.round(dOpens * (0.15 + Math.random() * 0.15));
      const dUnsubs = Math.round(dDelivered * (0.003 + Math.random() * 0.005));
      return {
        domain,
        processed: dProcessed,
        delivered_pct: dProcessed > 0 ? parseFloat(((dDelivered / dProcessed) * 100).toFixed(1)) : 0,
        hard_bounces_pct: dProcessed > 0 ? parseFloat(((dHardBounce / dProcessed) * 100).toFixed(2)) : 0,
        soft_bounces_pct: dProcessed > 0 ? parseFloat(((dSoftBounce / dProcessed) * 100).toFixed(2)) : 0,
        opens_pct: dDelivered > 0 ? parseFloat(((dOpens / dDelivered) * 100).toFixed(1)) : 0,
        clicks_pct: dDelivered > 0 ? parseFloat(((dClicks / dDelivered) * 100).toFixed(1)) : 0,
        unsubs_pct: dDelivered > 0 ? parseFloat(((dUnsubs / dDelivered) * 100).toFixed(2)) : 0
      };
    }).filter(d => d.processed > 0);

    // ── Non-deliverables ──
    const errorTypes = [
      { type: 'User unknown', count: Math.round(bounced * 0.30), pct: 30 },
      { type: 'Invalid domain', count: Math.round(bounced * 0.18), pct: 18 },
      { type: 'Mailbox full', count: Math.round(bounced * 0.15), pct: 15 },
      { type: 'Account disabled', count: Math.round(bounced * 0.12), pct: 12 },
      { type: 'Refused', count: Math.round(bounced * 0.10), pct: 10 },
      { type: 'Unreachable', count: Math.round(bounced * 0.08), pct: 8 },
      { type: 'Not connected', count: Math.round(bounced * 0.07), pct: 7 }
    ].filter(e => e.count > 0);

    const errorsByDomain = domains.slice(0, 5).map((domain, i) => {
      const share = domainShares[i];
      return {
        domain,
        user_unknown: Math.round(hardBounce * share * 0.4),
        invalid_domain: Math.round(hardBounce * share * 0.2),
        mailbox_full: Math.round(softBounce * share * 0.35),
        refused: Math.round(softBounce * share * 0.15),
        unreachable: Math.round(softBounce * share * 0.10),
        total: Math.round(bounced * share)
      };
    }).filter(e => e.total > 0);

    // ── Open and click-through rate ──
    const openClickRate = {
      sent,
      complaints: spamComplaints,
      opens,
      clicks,
      raw_reactivity: opens > 0 ? parseFloat(((clicks / opens) * 100).toFixed(2)) : 0
    };

    // ── User Activities (hourly breakdown last 24h) ──
    const userActivities = [];
    if (delivery.sent_at) {
      const base = new Date(delivery.sent_at);
      for (let h = 0; h < 24; h++) {
        const decay = Math.exp(-0.08 * h);
        const burst = h < 2 ? 2.5 : h < 4 ? 1.5 : 1;
        userActivities.push({
          hour: h,
          time: new Date(base.getTime() + h * 3600000).toISOString(),
          opens: Math.round(opens * 0.06 * decay * burst * (0.7 + Math.random() * 0.6)),
          clicks: Math.round(clicks * 0.05 * decay * burst * (0.6 + Math.random() * 0.8))
        });
      }
    }

    // ── Clicks over time ──
    const clicksOverTime = [];
    if (delivery.sent_at) {
      const base = new Date(delivery.sent_at);
      for (let h = 0; h < 24; h++) {
        const decay = Math.exp(-0.10 * h);
        clicksOverTime.push({
          hour: h,
          time: new Date(base.getTime() + h * 3600000).toISOString(),
          clicks: Math.round(clicks * 0.07 * decay * (0.6 + Math.random() * 0.8))
        });
      }
    }

    // ── OS breakdown ──
    const osBreakdown = [
      { os: 'iOS', count: Math.round(opens * 0.38), pct: 38 },
      { os: 'Windows', count: Math.round(opens * 0.25), pct: 25 },
      { os: 'macOS', count: Math.round(opens * 0.18), pct: 18 },
      { os: 'Android', count: Math.round(opens * 0.14), pct: 14 },
      { os: 'Linux', count: Math.round(opens * 0.03), pct: 3 },
      { os: 'Other', count: Math.round(opens * 0.02), pct: 2 }
    ].filter(o => o.count > 0);

    // ── Browser breakdown ──
    const browserBreakdown = [
      { browser: 'Apple Mail', count: Math.round(opens * 0.34), pct: 34 },
      { browser: 'Chrome', count: Math.round(opens * 0.24), pct: 24 },
      { browser: 'Safari', count: Math.round(opens * 0.16), pct: 16 },
      { browser: 'Outlook', count: Math.round(opens * 0.12), pct: 12 },
      { browser: 'Firefox', count: Math.round(opens * 0.06), pct: 6 },
      { browser: 'Samsung Internet', count: Math.round(opens * 0.04), pct: 4 },
      { browser: 'Other', count: Math.round(opens * 0.04), pct: 4 }
    ].filter(b => b.count > 0);

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
      broadcast_stats: broadcastStats,
      non_deliverables: { errors_by_type: errorTypes, errors_by_domain: errorsByDomain },
      open_click_rate: openClickRate,
      user_activities: userActivities,
      clicks_over_time: clicksOverTime,
      os_breakdown: osBreakdown,
      browser_breakdown: browserBreakdown,
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

// ══════════════════════════════════════════════════════
// HEATMAP DATA
// ══════════════════════════════════════════════════════

// ── Aggregate heatmap across all deliveries ────────────
router.get('/heatmap/aggregate', (req, res) => {
  try {
    const channelFilter = (req.query.channel || '').toLowerCase();
    const sourceFilter = (req.query.source || '').toLowerCase(); // 'all', 'standalone', 'workflow'
    let deliveries = query.all('deliveries');

    // Build set of workflow-linked delivery IDs
    const workflows = query.all('workflows');
    const workflowLinkedIds = new Set();
    workflows.forEach(w => {
      const nodes = w.orchestration?.nodes || [];
      nodes.forEach(n => {
        if (['email', 'sms', 'push'].includes(n.type) && n.config?.delivery_id) {
          workflowLinkedIds.add(parseInt(n.config.delivery_id));
        }
      });
    });

    // Apply channel filter
    if (channelFilter && channelFilter !== 'all') {
      deliveries = deliveries.filter(d => (d.channel || '').toLowerCase() === channelFilter);
    }

    // Apply source filter
    if (sourceFilter === 'standalone') {
      deliveries = deliveries.filter(d => !workflowLinkedIds.has(d.id));
    } else if (sourceFilter === 'workflow') {
      deliveries = deliveries.filter(d => workflowLinkedIds.has(d.id));
    }

    // Count by source for the response
    const allDeliveries = query.all('deliveries');
    const standaloneCount = allDeliveries.filter(d => !workflowLinkedIds.has(d.id)).length;
    const workflowCount = allDeliveries.filter(d => workflowLinkedIds.has(d.id)).length;

    if (deliveries.length === 0) {
      return res.status(200).json({
        deliveries_count: 0,
        message: 'No deliveries found for this filter.',
        source_counts: { all: allDeliveries.length, standalone: standaloneCount, workflow: workflowCount }
      });
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Aggregate totals
    let totalSent = 0, totalOpens = 0, totalClicks = 0;
    deliveries.forEach(d => {
      totalSent += d.sent || 0;
      totalOpens += d.opens || 0;
      totalClicks += d.clicks || 0;
    });

    // ── Engagement heatmap: from delivery_logs when available ──
    const deliveryIds = deliveries.map(d => d.id);
    const fromLogs = aggregateDeliveryLogsByTime(deliveryIds);
    const useLogs = fromLogs.totalOpens > 0 || fromLogs.totalClicks > 0;
    let hourTotals = new Array(24).fill(0);
    let dayTotals = new Array(7).fill(0);
    const engagementGrid = [];
    let engMax = 0;
    if (useLogs) {
      hourTotals = fromLogs.hourTotals.slice();
      dayTotals = fromLogs.dayTotals.slice();
      for (let di = 0; di < 7; di++) {
        for (let hi = 0; hi < 24; hi++) {
          const o = fromLogs.grid[di][hi].opens;
          const c = fromLogs.grid[di][hi].clicks;
          engagementGrid.push({ day: days[di], hour: hi, opens: o, clicks: c });
          if (o > engMax) engMax = o;
        }
      }
    } else {
      for (let di = 0; di < 7; di++) {
        for (let hi = 0; hi < 24; hi++) {
          let openSum = 0, clickSum = 0;
          deliveries.forEach((d) => {
            const seed = d.id * 7 + 31;
            const rng = (i) => { const x = Math.sin(seed + i) * 10000; return x - Math.floor(x); };
            const dOpens = d.opens || 0;
            const dClicks = d.clicks || 0;
            const peakMul = (hi >= 9 && hi <= 11) ? 2.5 : (hi >= 14 && hi <= 16) ? 2.0 : (hi >= 19 && hi <= 21) ? 1.8 : (hi < 6 || hi > 22) ? 0.2 : 1.0;
            const dayMul = (di === 1 || di === 2) ? 1.4 : (di >= 5) ? 0.5 : 1.0;
            const base = (dOpens / 168) * peakMul * dayMul;
            const idx = di * 24 + hi;
            const val = Math.round(base * (0.6 + rng(idx) * 0.8));
            openSum += val;
            clickSum += Math.round(val * (dClicks / (dOpens || 1)) * (0.7 + rng(idx + 100) * 0.6));
          });
          engagementGrid.push({ day: days[di], hour: hi, opens: openSum, clicks: clickSum });
          if (openSum > engMax) engMax = openSum;
          hourTotals[hi] += openSum;
          dayTotals[di] += openSum;
        }
      }
    }

    // ── Device breakdown (aggregate) ──
    const deviceAgg = { desktop: { opens: 0, clicks: 0 }, mobile: { opens: 0, clicks: 0 }, tablet: { opens: 0, clicks: 0 }, other: { opens: 0, clicks: 0 } };
    deliveries.forEach(d => {
      const ch = (d.channel || 'email').toLowerCase();
      const dO = d.opens || 0;
      const dC = d.clicks || 0;
      if (ch === 'email') {
        deviceAgg.desktop.opens += Math.round(dO * 0.42);
        deviceAgg.desktop.clicks += Math.round(dC * 0.48);
        deviceAgg.mobile.opens += Math.round(dO * 0.45);
        deviceAgg.mobile.clicks += Math.round(dC * 0.38);
        deviceAgg.tablet.opens += Math.round(dO * 0.10);
        deviceAgg.tablet.clicks += Math.round(dC * 0.11);
        deviceAgg.other.opens += Math.round(dO * 0.03);
        deviceAgg.other.clicks += Math.round(dC * 0.03);
      } else if (ch === 'sms') {
        deviceAgg.mobile.opens += Math.round((d.sent || 0) * 0.92);
        deviceAgg.mobile.clicks += Math.round(dC * 0.95);
        deviceAgg.desktop.opens += Math.round((d.sent || 0) * 0.08);
        deviceAgg.desktop.clicks += Math.round(dC * 0.05);
      } else {
        deviceAgg.mobile.opens += Math.round((d.sent || 0) * 0.75);
        deviceAgg.mobile.clicks += Math.round(dC * 0.70);
        deviceAgg.tablet.opens += Math.round((d.sent || 0) * 0.20);
        deviceAgg.tablet.clicks += Math.round(dC * 0.25);
        deviceAgg.desktop.opens += Math.round((d.sent || 0) * 0.05);
        deviceAgg.desktop.clicks += Math.round(dC * 0.05);
      }
    });

    // ── Geo breakdown (aggregate) ──
    const geoWeights = [
      { country: 'United States', code: 'US', openW: 0.35, clickW: 0.38 },
      { country: 'United Kingdom', code: 'GB', openW: 0.14, clickW: 0.12 },
      { country: 'Germany', code: 'DE', openW: 0.10, clickW: 0.09 },
      { country: 'France', code: 'FR', openW: 0.08, clickW: 0.08 },
      { country: 'Canada', code: 'CA', openW: 0.07, clickW: 0.07 },
      { country: 'Australia', code: 'AU', openW: 0.05, clickW: 0.05 },
      { country: 'Netherlands', code: 'NL', openW: 0.04, clickW: 0.04 },
      { country: 'Spain', code: 'ES', openW: 0.04, clickW: 0.03 },
      { country: 'Brazil', code: 'BR', openW: 0.03, clickW: 0.03 },
      { country: 'Japan', code: 'JP', openW: 0.03, clickW: 0.02 }
    ];
    const geoData = geoWeights.map(g => ({
      country: g.country, code: g.code,
      opens: Math.round(totalOpens * g.openW),
      clicks: Math.round(totalClicks * g.clickW)
    }));

    // ── Per-delivery performance table ──
    const deliveryPerf = deliveries.map(d => ({
      id: d.id,
      name: d.name,
      channel: d.channel || 'Email',
      status: d.status,
      sent: d.sent || 0,
      opens: d.opens || 0,
      clicks: d.clicks || 0,
      open_rate: d.sent ? ((d.opens || 0) / d.sent * 100).toFixed(1) : '0.0',
      click_rate: d.opens ? ((d.clicks || 0) / d.opens * 100).toFixed(1) : '0.0'
    })).sort((a, b) => parseFloat(b.open_rate) - parseFloat(a.open_rate));

    // ── Channel breakdown ──
    const byChannel = {};
    deliveries.forEach(d => {
      const ch = d.channel || 'Email';
      if (!byChannel[ch]) byChannel[ch] = { count: 0, sent: 0, opens: 0, clicks: 0 };
      byChannel[ch].count++;
      byChannel[ch].sent += d.sent || 0;
      byChannel[ch].opens += d.opens || 0;
      byChannel[ch].clicks += d.clicks || 0;
    });

    // ── AI Recommendations (cross-delivery) ──
    const bestHourIdx = hourTotals.indexOf(Math.max(...hourTotals));
    const bestDayIdx = dayTotals.indexOf(Math.max(...dayTotals));
    const worstDayIdx = dayTotals.indexOf(Math.min(...dayTotals));
    const avgOpenRate = totalOpens / (totalSent || 1);
    const avgClickRate = totalClicks / (totalOpens || 1);
    const mobileShare = deviceAgg.mobile.opens / (totalOpens || 1);
    const topDelivery = deliveryPerf[0];
    const bottomDelivery = deliveryPerf[deliveryPerf.length - 1];
    const bestGeo = [...geoData].sort((a, b) => (b.clicks / (b.opens || 1)) - (a.clicks / (a.opens || 1)))[0];

    const recommendations = [
      {
        type: 'timing', priority: 'high', icon: 'clock',
        title: 'Global Optimal Send Window',
        description: `Across all ${deliveries.length} deliveries, peak engagement is on <strong>${days[bestDayIdx]}</strong> at <strong>${bestHourIdx}:00</strong>. Align future scheduling to this window.`,
        metric: `${days[bestDayIdx]} ${bestHourIdx}:00`, impact: '+12-18% open rate'
      },
      {
        type: 'performance', priority: 'high', icon: 'target',
        title: 'Top Performing Delivery',
        description: `<strong>${topDelivery.name}</strong> (${topDelivery.channel}) leads with a ${topDelivery.open_rate}% open rate and ${topDelivery.click_rate}% CTOR. Analyze its subject line, timing, and audience for replicable patterns.`,
        metric: `${topDelivery.open_rate}% open rate`, impact: 'Template for success'
      },
      {
        type: 'performance', priority: bottomDelivery && parseFloat(bottomDelivery.open_rate) < 15 ? 'high' : 'medium', icon: 'alert',
        title: 'Underperforming Delivery',
        description: `<strong>${bottomDelivery.name}</strong> (${bottomDelivery.channel}) has the lowest open rate at ${bottomDelivery.open_rate}%. Consider A/B testing subject lines or refreshing the audience segment.`,
        metric: `${bottomDelivery.open_rate}% open rate`, impact: 'Recovery opportunity'
      },
      {
        type: 'engagement', priority: avgClickRate < 0.12 ? 'high' : 'low', icon: 'sparkle',
        title: 'Average Click-Through Rate',
        description: avgClickRate < 0.12
          ? `Overall CTOR is <strong>${(avgClickRate * 100).toFixed(1)}%</strong> across ${deliveries.length} deliveries. Below the 12% benchmark — consider stronger CTAs, personalization, or offer incentives.`
          : `Overall CTOR of <strong>${(avgClickRate * 100).toFixed(1)}%</strong> is healthy. Maintain current content strategies and experiment with micro-optimizations.`,
        metric: `${(avgClickRate * 100).toFixed(1)}% avg CTOR`, impact: avgClickRate < 0.12 ? '+5-10% CTOR' : 'On track'
      },
      {
        type: 'device', priority: mobileShare > 0.45 ? 'high' : 'medium', icon: 'device',
        title: 'Cross-Delivery Mobile Trend',
        description: `<strong>${(mobileShare * 100).toFixed(0)}%</strong> of all opens come from mobile devices. ${mobileShare > 0.45 ? 'Ensure all templates are mobile-first with thumb-friendly CTAs.' : 'Desktop is still significant — maintain responsive balance.'}`,
        metric: `${(mobileShare * 100).toFixed(0)}% mobile`, impact: '+8-15% engagement'
      },
      {
        type: 'geo', priority: 'medium', icon: 'globe',
        title: 'Geographic Performance Leader',
        description: `<strong>${bestGeo.country}</strong> has the highest click-to-open ratio across all deliveries. Consider localized campaigns, timezone-based sends, or regional offers.`,
        metric: bestGeo.country, impact: '+5-8% conversion'
      }
    ];

    // Tag each delivery performance row with workflow-linked status
    deliveryPerf.forEach(dp => {
      dp.is_workflow_linked = workflowLinkedIds.has(dp.id);
    });

    res.json({
      filter: channelFilter || 'all',
      source_filter: sourceFilter || 'all',
      source_counts: { all: allDeliveries.length, standalone: standaloneCount, workflow: workflowCount },
      deliveries_count: deliveries.length,
      total_sent: totalSent,
      total_opens: totalOpens,
      total_clicks: totalClicks,
      avg_open_rate: (avgOpenRate * 100).toFixed(1),
      avg_click_rate: (avgClickRate * 100).toFixed(1),
      by_channel: byChannel,
      engagement_heatmap: { grid: engagementGrid, max: engMax, days, hours },
      device_heatmap: deviceAgg,
      geo_heatmap: geoData,
      hour_totals: hourTotals,
      day_totals: dayTotals,
      delivery_performance: deliveryPerf,
      ai_recommendations: recommendations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/heatmap', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const delivery = query.get('deliveries', id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

    const seed = id * 7 + 31;
    const rng = (i) => {
      const x = Math.sin(seed + i) * 10000;
      return x - Math.floor(x);
    };

    const totalOpens = delivery.opens || 0;
    const totalClicks = delivery.clicks || 0;
    const totalSent = delivery.sent || 1;
    const ch = (delivery.channel || 'Email').toLowerCase();

    // ── Engagement heatmap: hour-of-day × day-of-week ──
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const engagementGrid = [];
    let engMax = 0;
    const hourTotals = new Array(24).fill(0);
    const dayTotals = new Array(7).fill(0);
    let idx = 0;

    for (const day of days) {
      for (const hour of hours) {
        const peakMul = (hour >= 9 && hour <= 11) ? 2.5 : (hour >= 14 && hour <= 16) ? 2.0 : (hour >= 19 && hour <= 21) ? 1.8 : (hour < 6 || hour > 22) ? 0.2 : 1.0;
        const dayMul = (day === 'Tue' || day === 'Wed') ? 1.4 : (day === 'Sat' || day === 'Sun') ? 0.5 : 1.0;
        const base = (totalOpens / 168) * peakMul * dayMul;
        const val = Math.round(base * (0.6 + rng(idx) * 0.8));
        engagementGrid.push({ day, hour, opens: val, clicks: Math.round(val * (totalClicks / (totalOpens || 1)) * (0.7 + rng(idx + 100) * 0.6)) });
        if (val > engMax) engMax = val;
        hourTotals[hour] += val;
        dayTotals[days.indexOf(day)] += val;
        idx++;
      }
    }

    // ── Click map heatmap (email only): position-based ──
    const clickZones = ch === 'email' ? [
      { zone: 'Header Logo', y: 0, clicks: Math.round(totalClicks * 0.05 * (0.8 + rng(200) * 0.4)) },
      { zone: 'Hero Image', y: 1, clicks: Math.round(totalClicks * 0.22 * (0.8 + rng(201) * 0.4)) },
      { zone: 'Primary CTA', y: 2, clicks: Math.round(totalClicks * 0.35 * (0.8 + rng(202) * 0.4)) },
      { zone: 'Product Grid 1', y: 3, clicks: Math.round(totalClicks * 0.12 * (0.8 + rng(203) * 0.4)) },
      { zone: 'Product Grid 2', y: 4, clicks: Math.round(totalClicks * 0.08 * (0.8 + rng(204) * 0.4)) },
      { zone: 'Secondary CTA', y: 5, clicks: Math.round(totalClicks * 0.10 * (0.8 + rng(205) * 0.4)) },
      { zone: 'Social Links', y: 6, clicks: Math.round(totalClicks * 0.04 * (0.8 + rng(206) * 0.4)) },
      { zone: 'Footer / Unsubscribe', y: 7, clicks: Math.round(totalClicks * 0.04 * (0.8 + rng(207) * 0.4)) }
    ] : [];

    // ── Device heatmap ──
    const deviceData = ch === 'email' ? {
      desktop: { opens: Math.round(totalOpens * 0.42), clicks: Math.round(totalClicks * 0.48) },
      mobile: { opens: Math.round(totalOpens * 0.45), clicks: Math.round(totalClicks * 0.38) },
      tablet: { opens: Math.round(totalOpens * 0.10), clicks: Math.round(totalClicks * 0.11) },
      other: { opens: Math.round(totalOpens * 0.03), clicks: Math.round(totalClicks * 0.03) }
    } : ch === 'sms' ? {
      mobile: { opens: Math.round(totalSent * 0.92), clicks: Math.round(totalClicks * 0.95) },
      desktop: { opens: Math.round(totalSent * 0.08), clicks: Math.round(totalClicks * 0.05) }
    } : {
      mobile: { opens: Math.round(totalSent * 0.75), clicks: Math.round(totalClicks * 0.70) },
      tablet: { opens: Math.round(totalSent * 0.20), clicks: Math.round(totalClicks * 0.25) },
      desktop: { opens: Math.round(totalSent * 0.05), clicks: Math.round(totalClicks * 0.05) }
    };

    // ── Geographic heatmap ──
    const geoData = [
      { country: 'United States', code: 'US', opens: Math.round(totalOpens * 0.35 * (0.9 + rng(300) * 0.2)), clicks: Math.round(totalClicks * 0.38 * (0.9 + rng(301) * 0.2)) },
      { country: 'United Kingdom', code: 'GB', opens: Math.round(totalOpens * 0.14 * (0.9 + rng(302) * 0.2)), clicks: Math.round(totalClicks * 0.12 * (0.9 + rng(303) * 0.2)) },
      { country: 'Germany', code: 'DE', opens: Math.round(totalOpens * 0.10 * (0.9 + rng(304) * 0.2)), clicks: Math.round(totalClicks * 0.09 * (0.9 + rng(305) * 0.2)) },
      { country: 'France', code: 'FR', opens: Math.round(totalOpens * 0.08 * (0.9 + rng(306) * 0.2)), clicks: Math.round(totalClicks * 0.08 * (0.9 + rng(307) * 0.2)) },
      { country: 'Canada', code: 'CA', opens: Math.round(totalOpens * 0.07 * (0.9 + rng(308) * 0.2)), clicks: Math.round(totalClicks * 0.07 * (0.9 + rng(309) * 0.2)) },
      { country: 'Australia', code: 'AU', opens: Math.round(totalOpens * 0.05 * (0.9 + rng(310) * 0.2)), clicks: Math.round(totalClicks * 0.05 * (0.9 + rng(311) * 0.2)) },
      { country: 'Netherlands', code: 'NL', opens: Math.round(totalOpens * 0.04 * (0.9 + rng(312) * 0.2)), clicks: Math.round(totalClicks * 0.04 * (0.9 + rng(313) * 0.2)) },
      { country: 'Spain', code: 'ES', opens: Math.round(totalOpens * 0.04 * (0.9 + rng(314) * 0.2)), clicks: Math.round(totalClicks * 0.03 * (0.9 + rng(315) * 0.2)) },
      { country: 'Brazil', code: 'BR', opens: Math.round(totalOpens * 0.03 * (0.9 + rng(316) * 0.2)), clicks: Math.round(totalClicks * 0.03 * (0.9 + rng(317) * 0.2)) },
      { country: 'Japan', code: 'JP', opens: Math.round(totalOpens * 0.03 * (0.9 + rng(318) * 0.2)), clicks: Math.round(totalClicks * 0.02 * (0.9 + rng(319) * 0.2)) }
    ];

    // ── AI Recommendations ──
    const bestHourIdx = hourTotals.indexOf(Math.max(...hourTotals));
    const bestDayIdx = dayTotals.indexOf(Math.max(...dayTotals));
    const worstDayIdx = dayTotals.indexOf(Math.min(...dayTotals));
    const bestGeo = geoData.sort((a, b) => (b.clicks / (b.opens || 1)) - (a.clicks / (a.opens || 1)))[0];
    const openRate = totalOpens / (totalSent || 1);
    const clickRate = totalClicks / (totalOpens || 1);
    const mobileShare = (deviceData.mobile?.opens || 0) / (totalOpens || 1);

    const recommendations = [
      {
        type: 'timing',
        priority: 'high',
        icon: 'clock',
        title: 'Optimal Send Time',
        description: `Peak engagement occurs on <strong>${days[bestDayIdx]}</strong> at <strong>${bestHourIdx}:00</strong>. Consider scheduling future sends during this window for maximum impact.`,
        metric: `${days[bestDayIdx]} ${bestHourIdx}:00`,
        impact: '+12-18% open rate'
      },
      {
        type: 'timing',
        priority: 'medium',
        icon: 'alert',
        title: 'Avoid Low-Engagement Periods',
        description: `<strong>${days[worstDayIdx]}</strong> shows the lowest engagement. ${days[worstDayIdx] === 'Sat' || days[worstDayIdx] === 'Sun' ? 'Weekend sends underperform weekdays for this audience.' : 'Consider shifting volume to higher-performing days.'}`,
        metric: days[worstDayIdx],
        impact: 'Reduce waste'
      },
      {
        type: 'device',
        priority: mobileShare > 0.45 ? 'high' : 'medium',
        icon: 'device',
        title: 'Mobile Optimization',
        description: mobileShare > 0.45
          ? `<strong>${(mobileShare * 100).toFixed(0)}%</strong> of opens come from mobile. Ensure responsive design, large tap targets, and concise copy.`
          : `Mobile accounts for <strong>${(mobileShare * 100).toFixed(0)}%</strong> of opens. Desktop rendering should be prioritized but keep mobile-friendly.`,
        metric: `${(mobileShare * 100).toFixed(0)}% mobile`,
        impact: mobileShare > 0.45 ? '+8-15% click rate' : 'Maintain quality'
      },
      {
        type: 'engagement',
        priority: clickRate < 0.15 ? 'high' : 'low',
        icon: 'target',
        title: 'Click-Through Rate Analysis',
        description: clickRate < 0.15
          ? `CTOR is <strong>${(clickRate * 100).toFixed(1)}%</strong> which is below the 15% benchmark. Consider stronger CTAs, personalized content, or offer-based incentives.`
          : `CTOR of <strong>${(clickRate * 100).toFixed(1)}%</strong> is above average. The current content strategy is effective.`,
        metric: `${(clickRate * 100).toFixed(1)}% CTOR`,
        impact: clickRate < 0.15 ? '+5-10% CTOR' : 'On track'
      },
      {
        type: 'geo',
        priority: 'medium',
        icon: 'globe',
        title: 'Geographic Opportunity',
        description: `<strong>${bestGeo.country}</strong> has the highest click-to-open ratio. Consider creating localized content or running targeted campaigns for this region.`,
        metric: bestGeo.country,
        impact: '+5-8% conversion'
      },
      {
        type: 'send_time',
        priority: delivery.sto_enabled ? 'low' : 'high',
        icon: 'sparkle',
        title: 'Send Time Optimization',
        description: delivery.sto_enabled
          ? 'Send Time Optimization is already enabled. Continue monitoring performance.'
          : 'Enable <strong>Send Time Optimization</strong> to automatically deliver at each recipient\'s predicted best engagement time.',
        metric: delivery.sto_enabled ? 'Active' : 'Not enabled',
        impact: delivery.sto_enabled ? 'Active' : '+20-30% opens'
      }
    ];

    res.json({
      delivery_id: id,
      delivery_name: delivery.name,
      channel: ch,
      total_sent: totalSent,
      total_opens: totalOpens,
      total_clicks: totalClicks,
      engagement_heatmap: { grid: engagementGrid, max: engMax, days, hours },
      click_zones: clickZones,
      device_heatmap: deviceData,
      geo_heatmap: geoData,
      hour_totals: hourTotals,
      day_totals: dayTotals,
      ai_recommendations: recommendations
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
