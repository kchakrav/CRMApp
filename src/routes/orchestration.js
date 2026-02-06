const express = require('express');
const router = express.Router();
const { query, saveDatabase } = require('../database');

// Get orchestration for a campaign
router.get('/:campaignId', (req, res) => {
  try {
    const campaignId = parseInt(req.params.campaignId);
    const orchestration = query.get('campaign_orchestrations', r => r.campaign_id === campaignId);
    
    if (!orchestration) {
      // Return default empty canvas
      return res.json({
        campaign_id: campaignId,
        nodes: [],
        connections: [],
        canvas_state: { zoom: 1, pan: { x: 0, y: 0 } }
      });
    }
    
    res.json(orchestration);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save orchestration for a campaign
router.post('/:campaignId', (req, res) => {
  try {
    const campaignId = parseInt(req.params.campaignId);
    const { nodes, connections, canvas_state } = req.body;
    
    // Check if orchestration exists
    const existing = query.get('campaign_orchestrations', r => r.campaign_id === campaignId);
    
    if (existing) {
      // Update existing
      query.update('campaign_orchestrations', existing.id, {
        nodes,
        connections,
        canvas_state,
        updated_at: new Date().toISOString()
      });
    } else {
      // Create new
      query.insert('campaign_orchestrations', {
        campaign_id: campaignId,
        nodes,
        connections,
        canvas_state
      });
    }
    
    res.json({ success: true, message: 'Orchestration saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute orchestration (run the campaign with the orchestration flow)
router.post('/:campaignId/execute', (req, res) => {
  try {
    const campaignId = parseInt(req.params.campaignId);
    const orchestration = query.get('campaign_orchestrations', r => r.campaign_id === campaignId);
    
    if (!orchestration || orchestration.nodes.length === 0) {
      return res.status(400).json({ error: 'No orchestration configured for this campaign' });
    }
    
    // Validate orchestration has required nodes
    const hasEntry = orchestration.nodes.some(n => n.type === 'entry');
    if (!hasEntry) {
      return res.status(400).json({ error: 'Orchestration must have an Entry node' });
    }
    
    // Execute orchestration flow
    const result = executeOrchestration(campaignId, orchestration);
    
    res.json({
      success: true,
      message: 'Orchestration executed successfully',
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Monitor waiting external signals
router.get('/:campaignId/waits', (req, res) => {
  try {
    const campaignId = parseInt(req.params.campaignId);
    const waits = query.all('external_signal_waits', w => w.campaign_id === campaignId && w.status === 'waiting');
    const now = Date.now();
    const withAge = waits.map(w => ({
      ...w,
      waiting_seconds: w.created_at ? Math.round((now - new Date(w.created_at).getTime()) / 1000) : 0
    }));
    res.json({
      count: withAge.length,
      oldest_waiting_seconds: withAge.length ? Math.max(...withAge.map(w => w.waiting_seconds)) : 0,
      waits: withAge
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// External signal endpoint
router.post('/:campaignId/signal', (req, res) => {
  try {
    const campaignId = parseInt(req.params.campaignId);
    if (!isSignalAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { signal_key, correlation_value = null, payload = {}, event_type = 'signal' } = req.body || {};
    if (!signal_key) {
      return res.status(400).json({ error: 'signal_key is required' });
    }
    const waits = query.all('external_signal_waits', w => w.campaign_id === campaignId && w.status === 'waiting' && w.signal_key === signal_key);
    const wait = waits.find(w => !w.correlation_key || (correlation_value && w.correlation_value === correlation_value)) || waits[0];
    if (!wait) {
      return res.status(404).json({ error: 'No waiting instance found for this signal' });
    }
    query.update('external_signal_waits', wait.id, {
      status: event_type === 'timeout' ? 'timed_out' : 'received',
      received_at: new Date().toISOString(),
      correlation_value: correlation_value || wait.correlation_value || null,
      payload
    });
    query.insert('event_history', {
      event_type: 'external_signal',
      source: req.headers['x-sender'] || 'external',
      status: event_type,
      details: {
        campaign_id: campaignId,
        node_id: wait.node_id,
        signal_key,
        correlation_value: correlation_value || null,
        payload
      }
    });
    const orchestration = query.get('campaign_orchestrations', r => r.campaign_id === campaignId);
    const resumeResult = orchestration
      ? resumeOrchestrationFromSignal(campaignId, orchestration, wait.node_id, event_type)
      : { resumed: false };
    res.json({
      success: true,
      message: 'Signal processed',
      wait_id: wait.id,
      ...resumeResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Preview schema for a node/connection
router.get('/:campaignId/preview/schema', (req, res) => {
  try {
    const campaignId = parseInt(req.params.campaignId);
    const nodeId = req.query.nodeId;
    const orchestration = query.get('campaign_orchestrations', r => r.campaign_id === campaignId);
    
    if (!orchestration || !orchestration.nodes) {
      return res.status(404).json({ error: 'Orchestration not found' });
    }
    
    const node = orchestration.nodes.find(n => n.id === nodeId);
    const contacts = query.all('contacts');
    const schema = buildContactSchema(contacts);
    
    res.json({
      node: node ? { id: node.id, type: node.type, category: node.category, name: node.name } : null,
      schema
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Preview results for a node/connection
router.get('/:campaignId/preview/results', (req, res) => {
  try {
    const campaignId = parseInt(req.params.campaignId);
    const nodeId = req.query.nodeId;
    const limit = parseInt(req.query.limit || '20');
    
    const orchestration = query.get('campaign_orchestrations', r => r.campaign_id === campaignId);
    if (!orchestration || !orchestration.nodes) {
      return res.status(404).json({ error: 'Orchestration not found' });
    }
    
    const node = orchestration.nodes.find(n => n.id === nodeId);
    let contacts = query.all('contacts');
    
    if (node) {
      contacts = applyNodePreviewFilter(node, contacts);
    }
    
    const schema = buildContactSchema(contacts);
    const results = contacts.slice(0, limit);
    
    res.json({
      node: node ? { id: node.id, type: node.type, category: node.category, name: node.name } : null,
      total: contacts.length,
      limit,
      schema,
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute orchestration logic
function executeOrchestration(campaignId, orchestration) {
  const { nodes, connections } = orchestration;
  
  // Find entry node
  const entryNode = nodes.find(n => n.type === 'entry');
  if (!entryNode) {
    throw new Error('No entry node found');
  }
  
  const executionLog = [];
  const logMessage = (message, context = {}) => {
    executionLog.push({
      message,
      timestamp: new Date().toISOString(),
      context
    });
  };
  let audienceCount = 0;
  let sentCount = 0;
  
  // Get all contacts (starting audience)
  let audience = query.all('contacts', c => c.status === 'active');
  audienceCount = audience.length;
  logMessage(`Entry: Starting with ${audienceCount} contacts`, { campaign_id: campaignId });
  
  // Traverse the flow
  let currentNodeId = entryNode.id;
  let visitedNodes = new Set();
  
  while (currentNodeId && !visitedNodes.has(currentNodeId)) {
    visitedNodes.add(currentNodeId);
    
    const currentNode = nodes.find(n => n.id === currentNodeId);
    if (!currentNode) break;
    
    // Execute node logic
    const nodeResult = executeNode(currentNode, audience, campaignId);
    audience = nodeResult.audience;
    logMessage(nodeResult.log, { node_id: currentNode.id, type: currentNode.type });
    if (nodeResult.waiting) {
      const waitRecord = {
        campaign_id: campaignId,
        node_id: currentNode.id,
        signal_key: nodeResult.signal_key,
        correlation_key: nodeResult.correlation_key || null,
        correlation_value: nodeResult.correlation_value || null,
        payload_schema: nodeResult.payload_schema || null,
        status: 'waiting',
        created_at: new Date().toISOString()
      };
      query.insert('external_signal_waits', waitRecord);
      logMessage(`Waiting for signal "${nodeResult.signal_key}"`, { node_id: currentNode.id, signal_key: nodeResult.signal_key });
      return {
        executed_at: new Date().toISOString(),
        audience_count: audienceCount,
        sent_count: sentCount,
        status: 'waiting',
        waiting_node_id: currentNode.id,
        execution_log: executionLog
      };
    }
    if (nodeResult.jumpTo) {
      currentNodeId = nodeResult.jumpTo;
      continue;
    }
    
    if (currentNode.category === 'channels' && currentNode.type === 'email') {
      sentCount += nodeResult.sent || 0;
    }
    
    // Find next node
    const nextConnection = connections.find(c => c.from === currentNodeId && c.transition_id !== 'timeout');
    currentNodeId = nextConnection ? nextConnection.to : null;
  }
  
  logMessage(`Completed: Sent to ${sentCount} customers`, { sent_count: sentCount });
  
  return {
    executed_at: new Date().toISOString(),
    audience_count: audienceCount,
    sent_count: sentCount,
    execution_log: executionLog
  };
}

// Execute individual node
function executeNode(node, audience, campaignId) {
  const { category, type, config } = node;
  let log = `${category}/${type}: `;
  let newAudience = [...audience];
  let sent = 0;
  
  switch (category) {
    case 'targeting':
      if (type === 'segment') {
        const segmentId = config?.segment_id;
        if (segmentId) {
          const segment = query.get('segments', segmentId);
          if (segment && segment.conditions) {
            newAudience = filterAudienceByConditions(audience, segment.conditions);
            log += `Filtered to ${newAudience.length} contacts (segment: ${segment.name})`;
          }
        }
      } else if (type === 'build_audience' || type === 'query') {
        const segmentId = config?.segment_id;
        if (segmentId) {
          const segment = query.get('segments', segmentId);
          if (segment && segment.conditions) {
            newAudience = filterAudienceByConditions(audience, segment.conditions);
          }
        }
        log += `Built audience of ${newAudience.length} contacts`;
      } else if (type === 'save_audience') {
        const mode = config?.mode || 'create';
        const name = (config?.name || '').trim() || `Workflow Audience ${campaignId} • ${new Date().toLocaleString()}`;
        const contactIds = newAudience.map(c => c.id).filter(Boolean);
        const payload = {
          name,
          description: config?.description || '',
          audience_type: 'static',
          include_contacts: contactIds,
          exclude_contacts: [],
          include_segments: [],
          exclude_segments: [],
          filters: { workflow_id: campaignId, node_id: node.id },
          estimated_size: contactIds.length,
          contact_count: contactIds.length,
          status: 'active',
          updated_at: new Date().toISOString()
        };
        let savedAudienceId = null;
        if (mode === 'update') {
          const existing = config?.audience_id
            ? query.get('audiences', parseInt(config.audience_id, 10))
            : query.get('audiences', a => a.name === name);
          if (existing) {
            query.update('audiences', existing.id, payload);
            savedAudienceId = existing.id;
          }
        }
        if (!savedAudienceId) {
          const result = query.insert('audiences', payload);
          savedAudienceId = result?.record?.id || null;
        }
        log += `Saved audience "${name}" (${contactIds.length} contacts)`;
      } else if (type === 'filter') {
        const conditions = config?.conditions || {};
        newAudience = filterAudienceByConditions(audience, conditions);
        log += `Filtered to ${newAudience.length} contacts`;
      } else if (type === 'deduplication') {
        const keys = (config?.keys || 'email').split(',').map(k => k.trim()).filter(Boolean);
        const seen = new Set();
        newAudience = audience.filter(contact => {
          const signature = keys.map(k => contact[k]).join('|');
          if (seen.has(signature)) return false;
          seen.add(signature);
          return true;
        });
        log += `Deduped to ${newAudience.length} contacts`;
      } else if (type === 'incremental_query') {
        const days = parseInt(config?.days || 7, 10);
        const since = Date.now() - days * 24 * 60 * 60 * 1000;
        newAudience = audience.filter(contact => {
          const t = new Date(contact.last_activity_at || contact.created_at || 0).getTime();
          return t >= since;
        });
        log += `Incremental query to ${newAudience.length} contacts`;
      }
      break;
    case 'flow_control':
      if (type === 'jump') {
        const targetId = config?.target_node_id;
        if (!targetId) {
          log += 'Jump missing target';
          return { audience: newAudience, log };
        }
        const targetNode = query.get('campaign_orchestrations', r => r.campaign_id === campaignId)?.nodes?.find(n => n.id === targetId);
        if (targetNode && ['entry', 'exit', 'stop'].includes(targetNode.type)) {
          log += 'Jump target invalid';
          return { audience: newAudience, log };
        }
        log += `Jump executed: ${node.id} → ${targetId}`;
        return { audience: newAudience, log, jumpTo: targetId };
      }
      if (type === 'external_signal') {
        const signalKey = config?.signal_key || config?.signal || '';
        const correlationKey = config?.correlation_key || null;
        log += `Waiting for signal "${signalKey || 'unset'}"`;
        return {
          audience: newAudience,
          log,
          waiting: true,
          signal_key: signalKey,
          correlation_key: correlationKey,
          payload_schema: config?.payload_schema || null
        };
      }
      break;
      
    case 'flow_control':
      if (type === 'split') {
        const splitRatio = config?.split_ratio || 50;
        const splitIndex = Math.floor(audience.length * (splitRatio / 100));
        newAudience = audience.slice(0, splitIndex);
          log += `Split ${splitRatio}% = ${newAudience.length} contacts`;
      } else if (type === 'wait') {
        const waitTime = config?.wait_time || 0;
        log += `Wait ${waitTime} ${config?.wait_unit || 'minutes'}`;
      } else if (type === 'scheduler') {
        log += 'Scheduled execution';
      } else if (type === 'alert') {
        log += `Alert sent to ${config?.recipients || 'team'}`;
      }
      break;
      
    case 'channels':
      if (type === 'email') {
        sent = newAudience.length;
        log += `Sent email to ${sent} contacts`;
      } else if (type === 'sms') {
        log += `Sent SMS to ${newAudience.length} contacts`;
      } else if (type === 'push') {
        log += `Sent push notification to ${newAudience.length} contacts`;
      }
      break;
      
    case 'actions':
      if (type === 'update_tag') {
        log += `Updated tags for ${newAudience.length} contacts`;
      } else if (type === 'add_to_segment') {
        log += `Added ${newAudience.length} contacts to segment`;
      }
      break;
      
    default:
      log += 'Processed';
  }
  
  return { audience: newAudience, log, sent };
}

function isSignalAuthorized(req) {
  const token = process.env.EXTERNAL_SIGNAL_TOKEN;
  if (!token) return true;
  const header = req.headers['x-api-key'];
  return header === token;
}

function resumeOrchestrationFromSignal(campaignId, orchestration, signalNodeId, eventType) {
  const { nodes, connections } = orchestration;
  const executionLog = [];
  const logMessage = (message, context = {}) => {
    executionLog.push({
      message,
      timestamp: new Date().toISOString(),
      context
    });
  };
  const startConnection = eventType === 'timeout'
    ? connections.find(c => c.from === signalNodeId && c.transition_id === 'timeout')
    : connections.find(c => c.from === signalNodeId && c.transition_id !== 'timeout');
  if (!startConnection) {
    logMessage('No outbound transition from signal node', { node_id: signalNodeId });
    return { resumed: false, execution_log: executionLog };
  }
  let currentNodeId = startConnection.to;
  let audience = query.all('contacts', c => c.status === 'active');
  let visited = new Set();
  let sentCount = 0;
  while (currentNodeId && !visited.has(currentNodeId)) {
    visited.add(currentNodeId);
    const node = nodes.find(n => n.id === currentNodeId);
    if (!node) break;
    const result = executeNode(node, audience, campaignId);
    audience = result.audience;
    logMessage(result.log, { node_id: node.id, type: node.type });
    if (node.category === 'channels' && node.type === 'email') {
      sentCount += result.sent || 0;
    }
    if (result.waiting) {
      const waitRecord = {
        campaign_id: campaignId,
        node_id: node.id,
        signal_key: result.signal_key,
        correlation_key: result.correlation_key || null,
        status: 'waiting',
        created_at: new Date().toISOString()
      };
      query.insert('external_signal_waits', waitRecord);
      logMessage(`Waiting for signal "${result.signal_key}"`, { node_id: node.id, signal_key: result.signal_key });
      return { resumed: true, status: 'waiting', execution_log: executionLog };
    }
    if (result.jumpTo) {
      currentNodeId = result.jumpTo;
      continue;
    }
    const next = connections.find(c => c.from === currentNodeId && c.transition_id !== 'timeout');
    currentNodeId = next ? next.to : null;
  }
  return { resumed: true, sent_count: sentCount, execution_log: executionLog };
}

// Build schema from contacts
function buildContactSchema(contacts) {
  const sample = contacts[0] || {};
  const keys = Object.keys(sample);
  if (keys.length === 0) {
    return [
      { name: 'id', type: 'number' },
      { name: 'email', type: 'string' },
      { name: 'first_name', type: 'string' },
      { name: 'last_name', type: 'string' },
      { name: 'status', type: 'string' },
      { name: 'subscription_status', type: 'string' }
    ];
  }
  return keys.map(key => ({
    name: key,
    type: typeof sample[key]
  }));
}

// Apply simple filters for preview (segment/filter nodes)
function applyNodePreviewFilter(node, contacts) {
  if (!contacts || contacts.length === 0) return [];
  
  if ((node.type === 'segment' || node.type === 'build_audience' || node.type === 'query') && node.config && node.config.segment_id) {
    const segment = query.get('segments', parseInt(node.config.segment_id));
    if (segment && segment.conditions) {
      return applySegmentConditions(contacts, segment.conditions);
    }
  }
  
  if (node.type === 'filter' && node.config) {
    const field = node.config.filter_field;
    const operator = node.config.operator || 'equals';
    const value = node.config.filter_value;
    if (field && value !== undefined) {
      return contacts.filter(contact => compareValue(contact[field], operator, value));
    }
  }
  
  if (node.type === 'deduplication') {
    const keys = (node.config.keys || 'email').split(',').map(k => k.trim()).filter(Boolean);
    const seen = new Set();
    return contacts.filter(contact => {
      const signature = keys.map(k => contact[k]).join('|');
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  }
  
  if (node.type === 'incremental_query') {
    const days = parseInt(node.config.days || 7, 10);
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    return contacts.filter(contact => {
      const t = new Date(contact.last_activity_at || contact.created_at || 0).getTime();
      return t >= since;
    });
  }
  
  return contacts;
}

function applySegmentConditions(contacts, conditions) {
  return contacts.filter(contact => {
    if (conditions.loyalty_tier && contact.loyalty_tier !== conditions.loyalty_tier) return false;
    if (conditions.subscription_status && contact.subscription_status !== conditions.subscription_status) return false;
    if (conditions.min_engagement_score && (contact.engagement_score || 0) < conditions.min_engagement_score) return false;
    if (conditions.interest) {
      const interests = contact.interests || [];
      if (!interests.includes(conditions.interest)) return false;
    }
    return true;
  });
}

function compareValue(actual, operator, expected) {
  if (actual === undefined || actual === null) return false;
  const actualVal = typeof actual === 'string' ? actual.toLowerCase() : actual;
  const expectedVal = typeof expected === 'string' ? expected.toLowerCase() : expected;
  
  switch (operator) {
    case 'equals':
      return actualVal == expectedVal;
    case 'not_equals':
      return actualVal != expectedVal;
    case 'greater_than':
      return Number(actualVal) > Number(expectedVal);
    case 'less_than':
      return Number(actualVal) < Number(expectedVal);
    case 'contains':
      return String(actualVal).includes(String(expectedVal));
    default:
      return actualVal == expectedVal;
  }
}

// Filter audience by conditions
function filterAudienceByConditions(audience, conditions) {
  return audience.filter(customer => {
    let matches = true;
    
    if (conditions.lifecycle_stage && customer.lifecycle_stage !== conditions.lifecycle_stage) {
      matches = false;
    }
    
    if (conditions.status && customer.status !== conditions.status) {
      matches = false;
    }
    
    if (conditions.min_lead_score && (customer.lead_score || 0) < conditions.min_lead_score) {
      matches = false;
    }
    
    return matches;
  });
}

module.exports = router;
