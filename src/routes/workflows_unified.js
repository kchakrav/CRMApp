const express = require('express');
const router = express.Router();
const { query } = require('../database');

/**
 * UNIFIED WORKFLOWS API
 * Combines previous "campaigns" and "workflows" into single system
 * 
 * Workflow Types:
 * - broadcast: One-time or scheduled send (was "campaign")
 * - automated: Event-triggered continuous automation
 * - recurring: Scheduled to run repeatedly (daily, weekly, etc.)
 */

// Get all workflows with optional filtering
router.get('/', (req, res) => {
  try {
    const { type, status } = req.query;
    let workflows = query.all('workflows');
    
    // Filter by workflow type
    if (type) {
      workflows = workflows.filter(w => w.workflow_type === type);
    }
    
    // Filter by status
    if (status) {
      workflows = workflows.filter(w => w.status === status);
    }
    
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single workflow by ID
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

// Create new workflow
router.post('/', (req, res) => {
  try {
    const {
      name,
      description,
      workflow_type = 'broadcast', // broadcast, automated, recurring
      entry_trigger = {},
      orchestration = {},
      audience_config = {},
      status = 'draft',
      created_by = 'System',
      folder_id = null
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Create workflow record
    const now = new Date().toISOString();
    const result = query.insert('workflows', {
      name,
      description,
      workflow_type: workflow_type || 'broadcast',
      entry_trigger: {
        type: entry_trigger.type || 'manual',
        config: entry_trigger.config || {}
      },
      orchestration: orchestration || { nodes: [], connections: [] },
      audience_config: audience_config || {},
      status,
      created_by: created_by || 'System',
      updated_by: created_by || 'System',
      
      folder_id: folder_id ? parseInt(folder_id) : null,

      // Metadata
      entry_count: 0,
      completion_count: 0,
      active_count: 0,
      
      // Timestamps
      last_run_at: null,
      next_run_at: entry_trigger.scheduled_at || null,
      created_at: now,
      updated_at: now
    });
    
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update workflow
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('workflows', id);
    if (!existing) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    // Don't allow changing workflow_type after creation
    const updates = { ...req.body };
    delete updates.workflow_type;
    delete updates.id;
    delete updates.created_at;
    delete updates.created_by;
    
    if (!updates.updated_by) {
      updates.updated_by = 'System';
    }
    updates.updated_at = new Date().toISOString();
    
    query.update('workflows', id, updates);
    const updated = query.get('workflows', id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete workflow
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('workflows', id);
    if (!existing) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    // Don't allow deleting active workflows
    if (existing.status === 'active') {
      return res.status(400).json({ error: 'Cannot delete active workflow. Pause it first.' });
    }
    
    query.delete('workflows', id);
    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activate workflow
router.post('/:id/activate', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const workflow = query.get('workflows', id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    query.update('workflows', id, { 
      status: 'active',
      activated_at: new Date().toISOString()
    });
    
    res.json({ message: 'Workflow activated successfully', workflow_id: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pause workflow
router.post('/:id/pause', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const workflow = query.get('workflows', id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    query.update('workflows', id, { 
      status: 'paused',
      paused_at: new Date().toISOString()
    });
    
    res.json({ message: 'Workflow paused successfully', workflow_id: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete workflow (for broadcast workflows)
router.post('/:id/complete', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const workflow = query.get('workflows', id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    query.update('workflows', id, { 
      status: 'completed',
      completed_at: new Date().toISOString()
    });
    
    res.json({ message: 'Workflow completed successfully', workflow_id: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Archive workflow
router.post('/:id/archive', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const workflow = query.get('workflows', id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    query.update('workflows', id, { 
      status: 'archived',
      archived_at: new Date().toISOString()
    });
    
    res.json({ message: 'Workflow archived successfully', workflow_id: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get workflow orchestration
router.get('/:id/orchestration', (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);
    const workflow = query.get('workflows', workflowId);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    res.json({
      workflow_id: workflowId,
      workflow_name: workflow.name,
      workflow_type: workflow.workflow_type,
      orchestration: workflow.orchestration || { nodes: [], connections: [] }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update workflow orchestration
router.put('/:id/orchestration', (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);
    const workflow = query.get('workflows', workflowId);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    const { nodes = [], connections = [] } = req.body;
    
    query.update('workflows', workflowId, {
      orchestration: { nodes, connections }
    });
    
    res.json({ 
      message: 'Orchestration updated successfully',
      workflow_id: workflowId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get workflow report (metrics, performance)
router.get('/:id/report', (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);
    const workflow = query.get('workflows', workflowId);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    // Get workflow metrics
    const metrics = query.get('workflow_metrics', m => m.workflow_id === workflowId) || {};
    
    // Get workflow sends (recipient level data)
    const sends = query.all('workflow_sends', s => s.workflow_id === workflowId);
    
    // Calculate detailed metrics
    const totalSent = metrics.sent || 0;
    const totalDelivered = totalSent - (metrics.bounced || 0);
    const totalOpened = metrics.opened || 0;
    const totalClicked = metrics.clicked || 0;
    const totalBounced = metrics.bounced || 0;
    const totalUnsubscribed = metrics.unsubscribed || 0;
    const totalConverted = metrics.converted || 0;
    const totalRevenue = metrics.revenue || 0;
    
    // Calculate rates
    const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(2) : 0;
    const openRate = totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100).toFixed(2) : 0;
    const clickRate = totalDelivered > 0 ? ((totalClicked / totalDelivered) * 100).toFixed(2) : 0;
    const ctr = totalDelivered > 0 ? ((totalClicked / totalDelivered) * 100).toFixed(2) : 0;
    const ctor = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(2) : 0;
    const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(2) : 0;
    const unsubscribeRate = totalDelivered > 0 ? ((totalUnsubscribed / totalDelivered) * 100).toFixed(2) : 0;
    const conversionRate = totalDelivered > 0 ? ((totalConverted / totalDelivered) * 100).toFixed(2) : 0;
    
    // Engagement timeline
    const engagementTimeline = [];
    if (workflow.last_run_at) {
      const runTime = new Date(workflow.last_run_at);
      const hours = 48;
      
      for (let i = 0; i < hours; i++) {
        const hourStart = new Date(runTime.getTime() + i * 60 * 60 * 1000);
        const hourEnd = new Date(runTime.getTime() + (i + 1) * 60 * 60 * 1000);
        
        const opensInHour = sends.filter(s => {
          if (!s.opened_at) return false;
          const openTime = new Date(s.opened_at);
          return openTime >= hourStart && openTime < hourEnd;
        }).length;
        
        const clicksInHour = sends.filter(s => {
          if (!s.clicked_at) return false;
          const clickTime = new Date(s.clicked_at);
          return clickTime >= hourStart && clickTime < hourEnd;
        }).length;
        
        if (opensInHour > 0 || clicksInHour > 0 || i < 12) {
          engagementTimeline.push({
            hour: i,
            time: hourStart.toISOString(),
            opens: opensInHour,
            clicks: clicksInHour
          });
        }
      }
    }
    
    // Device breakdown
    const deviceBreakdown = {
      desktop: Math.round(totalOpened * 0.45),
      mobile: Math.round(totalOpened * 0.42),
      tablet: Math.round(totalOpened * 0.10),
      other: Math.round(totalOpened * 0.03)
    };
    
    // Top links
    const topLinks = [
      { url: 'Primary CTA', clicks: Math.round(totalClicked * 0.6), percentage: 60 },
      { url: 'Secondary Link', clicks: Math.round(totalClicked * 0.25), percentage: 25 },
      { url: 'Footer Link', clicks: Math.round(totalClicked * 0.15), percentage: 15 }
    ].filter(l => l.clicks > 0);
    
    // Geographic breakdown
    const geoBreakdown = [
      { country: 'United States', opens: Math.round(totalOpened * 0.45), clicks: Math.round(totalClicked * 0.42) },
      { country: 'United Kingdom', opens: Math.round(totalOpened * 0.20), clicks: Math.round(totalClicked * 0.22) },
      { country: 'Canada', opens: Math.round(totalOpened * 0.12), clicks: Math.round(totalClicked * 0.13) },
      { country: 'Australia', opens: Math.round(totalOpened * 0.08), clicks: Math.round(totalClicked * 0.09) },
      { country: 'Other', opens: Math.round(totalOpened * 0.15), clicks: Math.round(totalClicked * 0.14) }
    ].filter(g => g.opens > 0);
    
    // Top engaged recipients
    const topRecipients = sends
      .filter(s => s.opened_at || s.clicked_at)
      .map(s => {
        const contact = query.get('contacts', s.contact_id);
        return {
          contact_id: s.contact_id,
          email: contact?.email || 'Unknown',
          name: contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown',
          sent_at: s.sent_at,
          opened_at: s.opened_at,
          clicked_at: s.clicked_at,
          bounced: s.status === 'bounced',
          engagement_score: (s.opened_at ? 1 : 0) + (s.clicked_at ? 2 : 0)
        };
      })
      .sort((a, b) => b.engagement_score - a.engagement_score)
      .slice(0, 50);
    
    // Non-engaged recipients
    const nonEngaged = sends
      .filter(s => !s.opened_at && !s.clicked_at && s.status !== 'bounced')
      .map(s => {
        const contact = query.get('contacts', s.contact_id);
        return {
          contact_id: s.contact_id,
          email: contact?.email || 'Unknown',
          name: contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown',
          sent_at: s.sent_at
        };
      })
      .slice(0, 50);
    
    // Bounced emails
    const bounced = sends
      .filter(s => s.status === 'bounced')
      .map(s => {
        const contact = query.get('contacts', s.contact_id);
        return {
          contact_id: s.contact_id,
          email: contact?.email || 'Unknown',
          name: contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown',
          bounce_type: s.bounce_type || 'hard',
          sent_at: s.sent_at
        };
      });
    
    // Execution history (simulated)
    const executionHistory = [];
    if (workflow.last_run_at) {
      const baseTime = new Date(workflow.last_run_at);
      for (let i = 0; i < 5; i++) {
        const startTime = new Date(baseTime.getTime() - i * 86400000 * 3);
        const durationMs = Math.round(30000 + Math.random() * 120000);
        executionHistory.push({
          run_id: 1000 + i,
          started_at: startTime.toISOString(),
          completed_at: new Date(startTime.getTime() + durationMs).toISOString(),
          duration_ms: durationMs,
          status: i === 0 ? 'completed' : (Math.random() > 0.15 ? 'completed' : 'error'),
          entries_processed: Math.round(totalSent * (0.8 + Math.random() * 0.4)),
          errors: i === 3 ? 2 : 0
        });
      }
    }

    // Activity metrics from orchestration nodes
    const orchestration = workflow.orchestration || {};
    const nodes = orchestration.nodes || [];
    const activityMetrics = nodes.map(n => {
      const baseCount = totalSent || Math.round(500 + Math.random() * 2000);
      let processed, transitioned, rejected;
      if (n.type === 'entry' || n.type === 'entry_event') {
        processed = baseCount;
        transitioned = baseCount;
        rejected = 0;
      } else if (n.type === 'email' || n.type === 'sms' || n.type === 'push') {
        processed = Math.round(baseCount * (0.85 + Math.random() * 0.15));
        transitioned = Math.round(processed * 0.97);
        rejected = processed - transitioned;
      } else if (n.type === 'decision' || n.type === 'split') {
        processed = Math.round(baseCount * 0.9);
        transitioned = processed;
        rejected = 0;
      } else if (n.type === 'wait') {
        processed = Math.round(baseCount * 0.88);
        transitioned = processed;
        rejected = 0;
      } else {
        processed = Math.round(baseCount * 0.85);
        transitioned = processed;
        rejected = 0;
      }
      return {
        node_id: n.id,
        label: n.label || n.type,
        type: n.type,
        processed,
        transitioned,
        rejected,
        duration_ms: Math.round(1000 + Math.random() * 10000),
        status: Math.random() > 0.1 ? 'completed' : 'warning'
      };
    });

    // Deliveries linked to this workflow (orchestration nodes with config.delivery_id)
    const linkedDeliveryIds = new Set();
    nodes.forEach(n => {
      if (['email', 'sms', 'push'].includes(n.type) && n.config?.delivery_id) {
        linkedDeliveryIds.add(parseInt(n.config.delivery_id));
      }
    });
    const allDeliveries = query.all('deliveries');
    const workflowDeliveries = allDeliveries
      .filter(d => linkedDeliveryIds.has(d.id))
      .map(d => ({
        id: d.id,
        name: d.name,
        channel: d.channel || d.channel_key || 'email',
        status: d.status || 'draft',
        sent: d.sent || 0,
        delivered: d.delivered || d.sent || 0,
        opens: d.opens || 0,
        clicks: d.clicks || 0,
        scheduled_at: d.scheduled_at,
        sent_at: d.sent_at,
        delivery_rate: (d.sent > 0 && (d.delivered != null || d.sent != null))
          ? (((d.delivered ?? d.sent) / d.sent) * 100).toFixed(1) : '0',
        open_rate: ((d.delivered ?? d.sent) > 0)
          ? ((d.opens || 0) / (d.delivered ?? d.sent) * 100).toFixed(1) : '0',
        click_rate: ((d.delivered ?? d.sent) > 0)
          ? ((d.clicks || 0) / (d.delivered ?? d.sent) * 100).toFixed(1) : '0'
      }));

    // Delivery breakdown – from linked delivery records when available, else from nodes with synthetic metrics
    const deliveryNodes = nodes.filter(n => ['email', 'sms', 'push'].includes(n.type));
    const deliveryBreakdown = deliveryNodes.map(n => {
      const deliveryId = n.config?.delivery_id ? parseInt(n.config.delivery_id) : null;
      const linkedDelivery = deliveryId ? workflowDeliveries.find(wd => wd.id === deliveryId) : null;
      const dsent = linkedDelivery ? linkedDelivery.sent : Math.round((totalSent || 1000) * (0.4 + Math.random() * 0.6));
      const ddeliv = linkedDelivery ? linkedDelivery.delivered : Math.round(dsent * 0.97);
      const dop = linkedDelivery ? linkedDelivery.opens : (n.type === 'email' ? Math.round(ddeliv * 0.32) : 0);
      const dcl = linkedDelivery ? linkedDelivery.clicks : (n.type !== 'email' ? Math.round(ddeliv * 0.05) : Math.round(dop * 0.22));
      return {
        node_id: n.id,
        label: n.label || n.type,
        channel: n.type,
        delivery_id: deliveryId,
        sent: dsent,
        delivered: ddeliv,
        opens: dop,
        clicks: dcl,
        delivery_rate: dsent > 0 ? ((ddeliv / dsent) * 100).toFixed(1) : '0',
        open_rate: ddeliv > 0 ? ((dop / ddeliv) * 100).toFixed(1) : '0',
        click_rate: ddeliv > 0 ? ((dcl / ddeliv) * 100).toFixed(1) : '0'
      };
    });

    // Workflow-level aggregates
    const wfEntryCount = workflow.entry_count || totalSent || 0;
    const wfCompletionCount = workflow.completion_count || Math.round(wfEntryCount * 0.82);
    const wfActiveCount = workflow.active_count || 0;
    const wfErrorCount = executionHistory.reduce((s, e) => s + e.errors, 0);

    res.json({
      workflow: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description || '',
        workflow_type: workflow.workflow_type,
        status: workflow.status,
        created_at: workflow.created_at,
        activated_at: workflow.activated_at,
        last_run_at: workflow.last_run_at,
        next_run_at: workflow.next_run_at,
        entry_count: wfEntryCount,
        completion_count: wfCompletionCount,
        active_count: wfActiveCount
      },
      metrics: {
        sent: totalSent,
        delivered: totalDelivered,
        opened: totalOpened,
        clicked: totalClicked,
        bounced: totalBounced,
        unsubscribed: totalUnsubscribed,
        converted: totalConverted,
        revenue: totalRevenue
      },
      performance: {
        delivery_rate: deliveryRate,
        open_rate: openRate,
        click_rate: clickRate,
        ctr: ctr,
        ctor: ctor,
        bounce_rate: bounceRate,
        unsubscribe_rate: unsubscribeRate,
        conversion_rate: conversionRate
      },
      engagement_timeline: engagementTimeline,
      device_breakdown: deviceBreakdown,
      top_links: topLinks,
      geo_breakdown: geoBreakdown,
      execution_history: executionHistory,
      activity_metrics: activityMetrics,
      delivery_breakdown: deliveryBreakdown,
      workflow_deliveries: workflowDeliveries,
      workflow_errors: wfErrorCount,
      recipients: {
        engaged: topRecipients,
        non_engaged: nonEngaged,
        bounced: bounced
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quick action: Send now (creates and activates broadcast workflow)
router.post('/quick/send-now', (req, res) => {
  try {
    const { name, subject, content, audience_id } = req.body;
    
    if (!name || !subject || !content) {
      return res.status(400).json({ error: 'name, subject, and content are required' });
    }
    
    // Create broadcast workflow with simple structure
    const result = query.insert('workflows', {
      name,
      description: 'Quick send workflow',
      workflow_type: 'broadcast',
      entry_trigger: {
        type: 'manual',
        config: { send_immediately: true }
      },
      orchestration: {
        nodes: [
          { id: 'entry', type: 'entry', position: { x: 100, y: 100 } },
          { id: 'email', type: 'email', config: { subject, content }, position: { x: 100, y: 250 } },
          { id: 'exit', type: 'exit', position: { x: 100, y: 400 } }
        ],
        connections: [
          { from: 'entry', to: 'email' },
          { from: 'email', to: 'exit' }
        ]
      },
      audience_config: { audience_id },
      status: 'active',
      entry_count: 0,
      completion_count: 0,
      last_run_at: new Date().toISOString()
    });
    
    res.status(201).json({ 
      message: 'Workflow created and activated',
      workflow: result.record
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get workflow templates
router.get('/templates/list', (req, res) => {
  try {
    const templates = [
      {
        id: 'welcome-series',
        name: 'Welcome Series',
        description: 'Onboard new subscribers with a multi-email sequence',
        workflow_type: 'automated',
        entry_trigger: { type: 'event', config: { event_name: 'contact_created' } }
      },
      {
        id: 'cart-recovery',
        name: 'Cart Abandonment',
        description: 'Recover abandoned carts with timed reminders',
        workflow_type: 'automated',
        entry_trigger: { type: 'event', config: { event_name: 'cart_abandoned' } }
      },
      {
        id: 'winback',
        name: 'Win-back Campaign',
        description: 'Re-engage inactive customers',
        workflow_type: 'automated',
        entry_trigger: { type: 'segment_entry', config: { segment_id: null } }
      },
      {
        id: 'product-launch',
        name: 'Product Launch',
        description: 'Broadcast new product announcement',
        workflow_type: 'broadcast',
        entry_trigger: { type: 'scheduled', config: {} }
      },
      {
        id: 'weekly-newsletter',
        name: 'Weekly Newsletter',
        description: 'Recurring weekly content digest',
        workflow_type: 'recurring',
        entry_trigger: { type: 'scheduled', config: { frequency: 'weekly', day: 'monday', time: '09:00' } }
      }
    ];
    
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ══════════════════════════════════════════════════════
// HEATMAP DATA
// ══════════════════════════════════════════════════════

router.get('/:id/heatmap', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const workflow = query.get('workflows', id);
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    const seed = id * 13 + 47;
    const rng = (i) => { const x = Math.sin(seed + i) * 10000; return x - Math.floor(x); };

    const metrics = query.get('workflow_metrics', m => m.workflow_id === id) || {};
    const totalSent = metrics.sent || workflow.entry_count || 100;
    const totalDelivered = metrics.delivered || Math.round(totalSent * 0.95);
    const totalOpened = metrics.opened || Math.round(totalSent * 0.38);
    const totalClicked = metrics.clicked || Math.round(totalSent * 0.12);
    const totalConverted = metrics.converted || Math.round(totalSent * 0.04);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // ── Execution heatmap: when workflows fire ──
    const executionGrid = [];
    let execMax = 0;
    const hourTotals = new Array(24).fill(0);
    const dayTotals = new Array(7).fill(0);
    let idx = 0;
    const isRecurring = workflow.workflow_type === 'recurring';

    for (const day of days) {
      for (const hour of hours) {
        const peakMul = (hour >= 8 && hour <= 10) ? 2.8 : (hour >= 13 && hour <= 15) ? 2.2 : (hour >= 18 && hour <= 20) ? 1.6 : (hour < 5 || hour > 23) ? 0.1 : 1.0;
        const dayMul = (day === 'Tue' || day === 'Wed' || day === 'Thu') ? 1.3 : (day === 'Sat' || day === 'Sun') ? (isRecurring ? 0.8 : 0.3) : 1.0;
        const base = (totalSent / 168) * peakMul * dayMul;
        const entries = Math.round(base * (0.5 + rng(idx) * 1.0));
        const completions = Math.round(entries * (0.6 + rng(idx + 500) * 0.35));
        const errors = Math.round(entries * rng(idx + 600) * 0.05);
        executionGrid.push({ day, hour, entries, completions, errors });
        if (entries > execMax) execMax = entries;
        hourTotals[hour] += entries;
        dayTotals[days.indexOf(day)] += entries;
        idx++;
      }
    }

    // ── Conversion funnel heatmap (by stage × day) ──
    const stages = ['Sent', 'Delivered', 'Opened', 'Clicked', 'Converted'];
    const stageValues = [totalSent, totalDelivered, totalOpened, totalClicked, totalConverted];
    const conversionFunnel = stages.map((stage, si) => {
      const dayBreakdown = days.map((day, di) => {
        const dayShare = dayTotals[di] / (dayTotals.reduce((a, b) => a + b, 1));
        return { day, value: Math.round(stageValues[si] * dayShare * (0.85 + rng(si * 7 + di + 700) * 0.3)) };
      });
      return { stage, total: stageValues[si], days: dayBreakdown };
    });

    // ── Node performance heatmap ──
    const nodes = (workflow.orchestration?.nodes || []).filter(n => n.type !== 'start' && n.type !== 'end');
    const nodePerformance = nodes.map((n, ni) => {
      const processed = Math.round(totalSent * (0.3 + rng(ni + 800) * 0.7));
      const success = Math.round(processed * (0.7 + rng(ni + 900) * 0.25));
      const errCount = Math.round(processed * rng(ni + 950) * 0.08);
      const avgDuration = Math.round(200 + rng(ni + 960) * 3000);
      return {
        node_id: n.id,
        node_type: n.type,
        node_label: n.label || n.type,
        processed,
        success,
        errors: errCount,
        success_rate: processed > 0 ? ((success / processed) * 100).toFixed(1) : '0.0',
        avg_duration_ms: avgDuration
      };
    });

    // ── Drop-off heatmap: hour × funnel stage ──
    const dropoffGrid = [];
    for (const hour of hours) {
      const hourShare = hourTotals[hour] / (hourTotals.reduce((a, b) => a + b, 1));
      for (let si = 0; si < stages.length; si++) {
        const val = Math.round(stageValues[si] * hourShare * (0.8 + rng(hour * stages.length + si + 1100) * 0.4));
        dropoffGrid.push({ hour, stage: stages[si], value: val });
      }
    }

    // ── AI Recommendations ──
    const bestHour = hourTotals.indexOf(Math.max(...hourTotals));
    const bestDay = dayTotals.indexOf(Math.max(...dayTotals));
    const worstDay = dayTotals.indexOf(Math.min(...dayTotals));
    const convRate = totalConverted / (totalSent || 1);
    const openToClick = totalClicked / (totalOpened || 1);
    const dropoff = 1 - (totalConverted / (totalSent || 1));
    const biggestDrop = stageValues.reduce((worst, val, i) => {
      if (i === 0) return worst;
      const rate = 1 - val / (stageValues[i - 1] || 1);
      return rate > worst.rate ? { stage: stages[i], rate, prev: stages[i - 1] } : worst;
    }, { stage: '', rate: 0, prev: '' });

    const slowNode = nodePerformance.length > 0 ? nodePerformance.reduce((s, n) => n.avg_duration_ms > s.avg_duration_ms ? n : s) : null;
    const errorNode = nodePerformance.length > 0 ? nodePerformance.reduce((s, n) => n.errors > s.errors ? n : s) : null;

    const recommendations = [
      {
        type: 'timing', priority: 'high', icon: 'clock',
        title: 'Peak Execution Window',
        description: `Workflow entries peak on <strong>${days[bestDay]}</strong> at <strong>${bestHour}:00</strong>. Schedule trigger campaigns and batch runs during this window for optimal audience reach.`,
        metric: `${days[bestDay]} ${bestHour}:00`, impact: '+15-22% engagement'
      },
      {
        type: 'timing', priority: 'medium', icon: 'alert',
        title: 'Low-Activity Period',
        description: `<strong>${days[worstDay]}</strong> has the fewest entries. ${isRecurring ? 'Consider pausing recurring runs on this day to save resources.' : 'Avoid scheduling one-time sends for this day.'}`,
        metric: days[worstDay], impact: 'Resource optimization'
      },
      {
        type: 'funnel', priority: biggestDrop.rate > 0.5 ? 'high' : 'medium', icon: 'target',
        title: 'Biggest Funnel Drop-off',
        description: `The largest drop occurs between <strong>${biggestDrop.prev}</strong> → <strong>${biggestDrop.stage}</strong> (<strong>${(biggestDrop.rate * 100).toFixed(0)}%</strong> loss). Focus optimization efforts on this transition.`,
        metric: `${(biggestDrop.rate * 100).toFixed(0)}% drop`, impact: `+${Math.round(biggestDrop.rate * 15)}% conversion`
      },
      {
        type: 'conversion', priority: convRate < 0.03 ? 'high' : 'low', icon: 'sparkle',
        title: 'Conversion Rate',
        description: convRate < 0.03
          ? `Overall conversion rate is <strong>${(convRate * 100).toFixed(1)}%</strong>, below the 3% benchmark. Consider A/B testing subject lines, content, and CTAs.`
          : `Conversion rate of <strong>${(convRate * 100).toFixed(1)}%</strong> is healthy. Continue monitoring for regression.`,
        metric: `${(convRate * 100).toFixed(1)}%`, impact: convRate < 0.03 ? '+1-3% conversion' : 'On track'
      },
      ...(slowNode ? [{
        type: 'performance', priority: slowNode.avg_duration_ms > 2000 ? 'high' : 'low', icon: 'zap',
        title: 'Slow Activity Node',
        description: `The <strong>"${slowNode.node_label}"</strong> node averages <strong>${slowNode.avg_duration_ms}ms</strong> execution time. ${slowNode.avg_duration_ms > 2000 ? 'This bottleneck is slowing overall workflow throughput.' : 'Execution time is acceptable.'}`,
        metric: `${slowNode.avg_duration_ms}ms`, impact: slowNode.avg_duration_ms > 2000 ? 'Reduce latency' : 'OK'
      }] : []),
      ...(errorNode && errorNode.errors > 0 ? [{
        type: 'errors', priority: errorNode.errors > 10 ? 'high' : 'medium', icon: 'alert',
        title: 'Error-Prone Node',
        description: `The <strong>"${errorNode.node_label}"</strong> node has <strong>${errorNode.errors}</strong> errors (${errorNode.success_rate}% success). Review configuration and error logs.`,
        metric: `${errorNode.errors} errors`, impact: 'Reduce failures'
      }] : []),
      {
        type: 'engagement', priority: openToClick < 0.2 ? 'high' : 'low', icon: 'target',
        title: 'Open-to-Click Ratio',
        description: openToClick < 0.2
          ? `Only <strong>${(openToClick * 100).toFixed(1)}%</strong> of openers click through. Improve CTA visibility, personalize content, or add urgency.`
          : `<strong>${(openToClick * 100).toFixed(1)}%</strong> open-to-click ratio is strong. Current content resonates with the audience.`,
        metric: `${(openToClick * 100).toFixed(1)}%`, impact: openToClick < 0.2 ? '+5-10% clicks' : 'On track'
      }
    ];

    res.json({
      workflow_id: id,
      workflow_name: workflow.name,
      workflow_type: workflow.workflow_type,
      total_sent: totalSent,
      total_delivered: totalDelivered,
      total_opened: totalOpened,
      total_clicked: totalClicked,
      total_converted: totalConverted,
      execution_heatmap: { grid: executionGrid, max: execMax, days, hours },
      conversion_funnel: conversionFunnel,
      node_performance: nodePerformance,
      dropoff_grid: dropoffGrid,
      hour_totals: hourTotals,
      day_totals: dayTotals,
      ai_recommendations: recommendations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
