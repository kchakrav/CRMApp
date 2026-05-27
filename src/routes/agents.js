const express = require('express');
const router = express.Router();
const { query } = require('../database');
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

async function callOpenAI(prompt, systemMessage, maxTokens = 2000) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-your-openai-api-key-here') return null;
  try {
    const response = await axios.post(OPENAI_API_URL, {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: maxTokens
    }, {
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }
    });
    return response.data.choices[0].message.content;
  } catch (e) {
    console.error('[Agents] OpenAI error:', e.response?.status, e.response?.data?.error?.message || e.message);
    return null;
  }
}

// ── Similarity detection for agents ──────────────────────────
function findSimilarAgents(decomposition, workflowId) {
  const allExisting = query.all('agents');
  if (allExisting.length === 0) return decomposition;

  const agentMatches = [];
  for (const ex of allExisting) {
    let score = 0;
    const reasons = [];

    if (ex.source_workflow_id === workflowId) {
      score += 70;
      reasons.push('Created from this same workflow');
    }

    const exNameLower = (ex.name || '').toLowerCase();
    const goalLower = (decomposition.goal || '').toLowerCase();
    if (exNameLower.includes(goalLower.split(' ').slice(0, 3).join(' ')) ||
        goalLower.includes(exNameLower.split(' ').slice(0, 3).join(' '))) {
      score += 20;
      reasons.push('Similar goal/name');
    }

    // Check sub-agent role overlap
    const exRoles = new Set((ex.sub_agents || []).map(a => a.role));
    const newRoles = (decomposition.sub_agents || []).map(a => a.role);
    const roleOverlap = newRoles.filter(r => exRoles.has(r));
    if (roleOverlap.length > 0 && ex.source_workflow_id === workflowId) {
      score += 15;
      reasons.push(`${roleOverlap.length} matching sub-agent role(s)`);
    }

    if (score >= 30) {
      agentMatches.push({
        id: ex.id,
        name: ex.name,
        goal: ex.goal,
        status: ex.status,
        sub_agent_count: (ex.sub_agents || []).length,
        score,
        reasons
      });
    }
  }

  agentMatches.sort((a, b) => b.score - a.score);
  return {
    ...decomposition,
    existing_agent_matches: agentMatches.slice(0, 3)
  };
}

// ── AI-assisted agent decomposition from a workflow ──────────
router.post('/decompose/:workflowId', async (req, res) => {
  try {
    const workflowId = parseInt(req.params.workflowId);
    const workflow = query.get('workflows', workflowId);
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    const orchestrations = query.all('campaign_orchestrations');
    const orch = orchestrations.find(o => o.campaign_id === workflowId || o.id === workflowId);
    const nodes = orch?.nodes || workflow.orchestration?.nodes || [];
    const connections = orch?.connections || workflow.orchestration?.connections || [];

    if (nodes.length === 0) {
      return res.status(400).json({ error: 'Workflow has no nodes to create an agent from' });
    }

    // Fetch existing skills for this workflow to reference
    const existingSkills = query.all('agent_skills').filter(s => s.source_workflow_id === workflowId);

    const nodesSummary = nodes.map((n, i) => {
      const cfg = n.config || {};
      let detail = '';
      if (n.type === 'wait' && cfg.wait_time) detail = ` (${cfg.wait_time} ${cfg.wait_unit || 'hours'})`;
      if (n.type === 'email' && cfg.subject) detail = ` (subject: "${cfg.subject}")`;
      if (n.type === 'sms' && cfg.message) detail = ` (msg: "${(cfg.message || '').slice(0, 40)}")`;
      if (n.type === 'condition' && cfg.condition_type) detail = ` (check: ${cfg.condition_type})`;
      if (n.type === 'split' && cfg.split_ratio) detail = ` (${cfg.split_ratio}/${100 - cfg.split_ratio})`;
      return `  ${i}: [${n.type}] "${n.name}" id=${n.id}${detail}`;
    }).join('\n');

    const skillsContext = existingSkills.length > 0
      ? `\nAvailable skills already extracted from this workflow:\n${existingSkills.map(s => `  - "${s.name}" (${s.category}) id=${s.id}: ${s.description}`).join('\n')}`
      : '';

    const prompt = `Analyze this marketing automation workflow and suggest how to decompose it into an agent system.

Workflow: "${workflow.name}"
Description: "${workflow.description || ''}"
Type: ${workflow.workflow_type || 'broadcast'}

Nodes (${nodes.length}):
${nodesSummary}
${skillsContext}

Decompose this workflow into sub-agents by CAPABILITY CONCERN (not by individual node). Common agent roles:
- Orchestrator: coordinates other sub-agents, follows the workflow structure as its plan
- Timing Agent: decides optimal send times and wait durations
- Content Agent: personalizes messaging, selects variants, adapts tone
- Channel Agent: selects the best channel for each contact
- Targeting Agent: refines audience selection and segmentation

Return a JSON object with:
- "goal": the overall goal of this agent (1 sentence, derived from the workflow purpose)
- "sub_agents": array of sub-agent definitions, each with:
  - "name": short name (e.g., "Content Agent")
  - "role": one of orchestrator, timing, content, channel, targeting, conversion
  - "description": what this sub-agent is responsible for (1-2 sentences)
  - "skill_ids": array of existing skill IDs this sub-agent should use (from the available skills list, or empty if none match)
  - "system_instructions": specific AI instructions for this sub-agent
  - "node_ids": which workflow nodes this sub-agent is responsible for
- "guardrails": suggested guardrails object with:
  - "max_messages_per_contact_per_day": number
  - "channel_limits": object (e.g., {"email": 2, "sms": 1, "push": 1})
  - "require_approval": boolean
  - "budget_limit": null or number

Always include an Orchestrator sub-agent. Include 2-4 additional sub-agents based on what the workflow actually does.

Return ONLY valid JSON. No markdown, no explanation.`;

    const result = await callOpenAI(prompt,
      'You are a marketing automation architect specializing in agent-based systems. You decompose workflows into intelligent sub-agents. Return only valid JSON.');

    let decomposition = null;
    if (result) {
      try {
        const cleaned = result.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
        decomposition = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('[Agents] Failed to parse AI response:', parseErr.message);
      }
    }

    if (decomposition && decomposition.sub_agents) {
      const validRoles = ['orchestrator', 'timing', 'content', 'channel', 'targeting', 'conversion'];
      decomposition.sub_agents = decomposition.sub_agents
        .filter(a => a && a.name)
        .map(a => ({
          name: String(a.name).slice(0, 60),
          role: validRoles.includes(a.role) ? a.role : 'orchestrator',
          description: String(a.description || '').slice(0, 300),
          skill_ids: Array.isArray(a.skill_ids) ? a.skill_ids : [],
          system_instructions: String(a.system_instructions || ''),
          node_ids: Array.isArray(a.node_ids) ? a.node_ids : []
        }));

      const enriched = findSimilarAgents(decomposition, workflowId);
      return res.json({
        workflow_id: workflowId,
        workflow_name: workflow.name,
        ...enriched,
        source: 'openai'
      });
    }

    // ── Mock fallback ──
    const mockDecomposition = buildMockDecomposition(workflow, nodes, existingSkills);
    const enrichedMock = findSimilarAgents(mockDecomposition, workflowId);
    res.json({
      workflow_id: workflowId,
      workflow_name: workflow.name,
      ...enrichedMock,
      source: 'mock',
      message: 'Using pattern-based decomposition. Add OPENAI_API_KEY for AI-powered analysis.'
    });
  } catch (error) {
    console.error('Error decomposing workflow:', error);
    res.status(500).json({ error: error.message });
  }
});

function buildMockDecomposition(workflow, nodes, existingSkills) {
  const nodeTypes = nodes.map(n => n.type);
  const hasEmail = nodeTypes.includes('email');
  const hasSms = nodeTypes.includes('sms');
  const hasPush = nodeTypes.includes('push');
  const hasWait = nodeTypes.includes('wait');
  const hasCondition = nodeTypes.includes('condition');
  const hasTargeting = nodeTypes.some(t => ['segment', 'filter', 'exclude', 'query', 'build_audience'].includes(t));
  const channelCount = [hasEmail, hasSms, hasPush].filter(Boolean).length;

  const subAgents = [];

  // Always include an orchestrator
  subAgents.push({
    name: 'Orchestrator',
    role: 'orchestrator',
    description: `Coordinates the "${workflow.name}" workflow, managing the sequence of sub-agent actions and ensuring the overall goal is met.`,
    skill_ids: [],
    system_instructions: `You are the orchestrator for the "${workflow.name}" campaign. Follow the workflow structure as your plan. Coordinate timing, content, and channel agents. Monitor conversion goals and adjust the plan if needed.`,
    node_ids: nodes.filter(n => ['entry', 'exit', 'fork'].includes(n.type)).map(n => n.id)
  });

  if (hasTargeting) {
    const targetNodes = nodes.filter(n => ['segment', 'filter', 'exclude', 'query', 'build_audience'].includes(n.type));
    const matchingSkills = existingSkills.filter(s => s.category === 'targeting').map(s => s.id);
    subAgents.push({
      name: 'Targeting Agent',
      role: 'targeting',
      description: 'Selects and refines the target audience based on segmentation rules, filters, and exclusion criteria.',
      skill_ids: matchingSkills,
      system_instructions: 'Select the optimal audience for this campaign. Apply segmentation rules, filter for engaged contacts, and exclude recently contacted or unsubscribed profiles.',
      node_ids: targetNodes.map(n => n.id)
    });
  }

  if (channelCount > 0) {
    const channelNodes = nodes.filter(n => ['email', 'sms', 'push', 'direct_mail'].includes(n.type));
    const matchingSkills = existingSkills.filter(s => s.category === 'content' || s.category === 'channel').map(s => s.id);
    subAgents.push({
      name: channelCount > 1 ? 'Content & Channel Agent' : 'Content Agent',
      role: 'content',
      description: `Personalizes messaging and ${channelCount > 1 ? 'selects the best channel' : 'optimizes content'} for each contact based on their profile and engagement history.`,
      skill_ids: matchingSkills,
      system_instructions: `Personalize all outgoing messages. ${hasEmail ? 'Craft compelling email subject lines and body copy.' : ''} ${hasSms ? 'Write concise, high-converting SMS messages.' : ''} ${hasPush ? 'Create attention-grabbing push notifications.' : ''} Adapt tone based on customer lifecycle stage.`,
      node_ids: channelNodes.map(n => n.id)
    });
  }

  if (hasWait) {
    const waitNodes = nodes.filter(n => n.type === 'wait');
    const matchingSkills = existingSkills.filter(s => s.category === 'timing').map(s => s.id);
    subAgents.push({
      name: 'Timing Agent',
      role: 'timing',
      description: 'Determines optimal send times and wait durations based on engagement patterns and send-time optimization data.',
      skill_ids: matchingSkills,
      system_instructions: 'Optimize the timing of each touchpoint. Use engagement history and STO data to determine the best send time for each contact. Adjust wait durations based on campaign urgency and audience behavior.',
      node_ids: waitNodes.map(n => n.id)
    });
  }

  if (hasCondition) {
    const condNodes = nodes.filter(n => ['condition', 'goal'].includes(n.type));
    const matchingSkills = existingSkills.filter(s => s.category === 'conversion').map(s => s.id);
    subAgents.push({
      name: 'Conversion Agent',
      role: 'conversion',
      description: 'Monitors customer behavior at decision points and determines the appropriate branch in the workflow.',
      skill_ids: matchingSkills,
      system_instructions: 'Monitor conversion events and engagement signals at each decision point. Recommend the most effective follow-up action based on customer behavior.',
      node_ids: condNodes.map(n => n.id)
    });
  }

  const wfNameLower = (workflow.name || '').toLowerCase();
  let goal = `Execute the "${workflow.name}" campaign effectively`;
  if (/cart|abandon/.test(wfNameLower)) goal = 'Recover abandoned carts by re-engaging customers with timely, personalized reminders and incentives';
  else if (/welcome|onboard/.test(wfNameLower)) goal = 'Onboard new subscribers with a warm welcome series that drives first purchase';
  else if (/win.?back|re.?engage|churn/.test(wfNameLower)) goal = 'Win back inactive customers with escalating re-engagement offers';
  else if (/vip|loyal/.test(wfNameLower)) goal = 'Delight VIP customers with exclusive offers that increase loyalty and lifetime value';
  else if (/nurture|drip/.test(wfNameLower)) goal = 'Nurture leads through an educational content series that builds trust and drives conversion';

  return {
    goal,
    sub_agents: subAgents,
    guardrails: {
      max_messages_per_contact_per_day: channelCount > 1 ? 3 : 2,
      channel_limits: {
        email: hasEmail ? 2 : 0,
        sms: hasSms ? 1 : 0,
        push: hasPush ? 2 : 0
      },
      require_approval: true,
      budget_limit: null
    }
  };
}

// ── Helpers for unified agent model ─────────────────────────

function enrichOrchestrator(agent) {
  if (agent.type !== 'orchestrator' || !Array.isArray(agent.child_agents)) return agent;
  const enriched = { ...agent };
  enriched.sub_agents = agent.child_agents.map(ref => {
    const child = query.get('agents', ref.agent_id);
    if (!child) return { id: ref.agent_id, name: '(deleted)', role: 'unknown', node_ids: ref.node_ids || [] };
    return {
      id: child.id,
      name: child.name,
      role: child.role || 'executor',
      description: child.description || '',
      system_instructions: child.system_instructions || '',
      skill_ids: child.skill_ids || [],
      tool_ids: child.tool_ids || [],
      node_ids: ref.node_ids || child.node_ids || [],
      output_schema: child.output_schema || []
    };
  });
  return enriched;
}

function countUsages(agentId) {
  const all = query.all('agents');
  return all.filter(a => a.type === 'orchestrator' && Array.isArray(a.child_agents) &&
    a.child_agents.some(c => c.agent_id === agentId)).length;
}

function decomposeSubAgents(subAgents, existingChildAgents) {
  const now = new Date().toISOString();
  const childRefs = [];
  for (const sa of subAgents) {
    if (sa.id) {
      const existing = query.get('agents', sa.id);
      if (existing) {
        query.update('agents', sa.id, {
          name: sa.name, role: sa.role || 'executor',
          description: sa.description || '', system_instructions: sa.system_instructions || '',
          skill_ids: sa.skill_ids || [], tool_ids: sa.tool_ids || [],
          output_schema: sa.output_schema || [], updated_at: now
        });
        childRefs.push({ agent_id: sa.id, node_ids: sa.node_ids || [] });
        continue;
      }
    }
    const result = query.insert('agents', {
      name: sa.name || 'New Agent', type: 'agent', role: sa.role || 'executor',
      description: sa.description || '', system_instructions: sa.system_instructions || '',
      skill_ids: sa.skill_ids || [], tool_ids: sa.tool_ids || [],
      node_ids: sa.node_ids || [], output_schema: sa.output_schema || [],
      status: 'active', created_by: 'System', created_at: now, updated_at: now
    });
    childRefs.push({ agent_id: result.lastID, node_ids: sa.node_ids || [] });
  }
  return childRefs;
}

// ── CRUD endpoints ──────────────────────────────────────────

// List all agents
router.get('/', (req, res) => {
  try {
    const { status, type } = req.query;
    let agents = query.all('agents');
    if (status) agents = agents.filter(a => a.status === status);
    if (type) agents = agents.filter(a => (a.type || 'orchestrator') === type);
    agents = agents.map(a => {
      const enriched = enrichOrchestrator(a);
      if (a.type === 'agent') enriched._used_in = countUsages(a.id);
      return enriched;
    });
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single agent
router.get('/:id', (req, res) => {
  try {
    const agent = query.get('agents', parseInt(req.params.id));
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    const enriched = enrichOrchestrator(agent);
    if (agent.type === 'agent') enriched._used_in = countUsages(agent.id);
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create agent
router.post('/', (req, res) => {
  try {
    const { name, description, goal, source_workflow_id, workflow_snapshot,
            sub_agents, logic_nodes, guardrails, status, type,
            role, system_instructions, skill_ids, tool_ids, output_schema, node_ids } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const now = new Date().toISOString();
    const agentType = type || (sub_agents && sub_agents.length > 0 ? 'orchestrator' : 'agent');

    if (agentType === 'orchestrator') {
      const childRefs = sub_agents ? decomposeSubAgents(sub_agents, []) : [];
      const result = query.insert('agents', {
        name, type: 'orchestrator',
        description: description || '', goal: goal || '',
        source_workflow_id: source_workflow_id || null,
        workflow_snapshot: workflow_snapshot || null,
        child_agents: childRefs,
        logic_nodes: logic_nodes || [],
        guardrails: guardrails || { max_messages_per_contact_per_day: 3, channel_limits: { email: 2, sms: 1, push: 2 }, require_approval: true, budget_limit: null },
        status: status || 'draft', tool_ids: req.body.tool_ids || [],
        triggers: req.body.triggers || [],
        created_by: req.body.created_by || 'System', created_at: now, updated_at: now
      });
      res.status(201).json(enrichOrchestrator(result.record));
    } else {
      const result = query.insert('agents', {
        name, type: 'agent', role: role || 'executor',
        description: description || '', system_instructions: system_instructions || '',
        skill_ids: skill_ids || [], tool_ids: tool_ids || [],
        node_ids: node_ids || [], output_schema: output_schema || [],
        status: status || 'active',
        created_by: req.body.created_by || 'System', created_at: now, updated_at: now
      });
      res.status(201).json(result.record);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update agent
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('agents', id);
    if (!existing) return res.status(404).json({ error: 'Agent not found' });

    const updates = { ...req.body };
    delete updates.id;
    delete updates.created_at;
    updates.updated_at = new Date().toISOString();

    if ((existing.type || 'orchestrator') === 'orchestrator' && updates.sub_agents) {
      updates.child_agents = decomposeSubAgents(updates.sub_agents, existing.child_agents || []);
      delete updates.sub_agents;
    }

    query.update('agents', id, updates);
    const updated = query.get('agents', id);
    res.json(enrichOrchestrator(updated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete agent
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('agents', id);
    if (!existing) return res.status(404).json({ error: 'Agent not found' });

    if (existing.status === 'active') {
      return res.status(400).json({ error: 'Cannot delete active agent. Pause it first.' });
    }

    if (existing.type === 'agent') {
      const usages = countUsages(id);
      if (usages > 0) {
        return res.status(400).json({ error: `Cannot delete — this agent is used in ${usages} orchestration(s). Remove it from those first.` });
      }
    }

    query.delete('agents', id);
    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Agent Simulation Engine ────────────────────────────────────

function evaluateExpression(expr, data) {
  if (!expr || !expr.trim()) return { result: true, detail: 'No expression — defaults to true' };
  const m = expr.trim().match(/^([\w.]+)\s*(>=|<=|!=|==|>|<)\s*(.+)$/);
  if (!m) return { result: true, detail: `Cannot parse "${expr}" — defaults to true` };
  const [, field, op, rawVal] = m;
  const fieldValue = field.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), data);
  let cmp = rawVal.trim().replace(/^['"]|['"]$/g, '');
  if (cmp === 'true') cmp = true;
  else if (cmp === 'false') cmp = false;
  else if (!isNaN(cmp)) cmp = Number(cmp);
  let result;
  switch (op) {
    case '>': result = fieldValue > cmp; break;
    case '<': result = fieldValue < cmp; break;
    case '>=': result = fieldValue >= cmp; break;
    case '<=': result = fieldValue <= cmp; break;
    case '==': result = fieldValue == cmp; break;
    case '!=': result = fieldValue != cmp; break;
    default: result = true;
  }
  return { result, detail: `${field} = ${JSON.stringify(fieldValue)} ${op} ${JSON.stringify(cmp)}` };
}

function simulateAgentFlow(agent, contact, allSkills) {
  const sas = Array.isArray(agent.sub_agents) ? agent.sub_agents : [];
  const lns = Array.isArray(agent.logic_nodes) ? agent.logic_nodes : [];
  const maxSlot = sas.length;
  lns.forEach(n => { if (n.slot > maxSlot) n.slot = maxSlot; });

  const timeline = [];
  const messages = { email: 0, sms: 0, push: 0 };
  let estimatedMinutes = 0;
  let stopped = false;
  let jumpToSlot = -1;
  const dataContext = {}; // accumulated outputs from sub-agents: { "Agent Name": { key: value } }

  const addStep = (obj) => { obj.step = timeline.length; timeline.push(obj); };

  addStep({ type: 'start', name: 'Agent Start', status: 'executed',
    detail: `Simulating for ${contact.first_name || ''} ${contact.last_name || ''} (${contact.email || 'no email'})` });

  for (let slot = 0; slot <= maxSlot && !stopped; slot++) {
    // If a condition routed us past this slot, skip it
    if (jumpToSlot > slot) {
      const skippedNodes = lns.filter(n => n.slot === slot);
      for (const sn of skippedNodes) {
        addStep({ type: sn.type, name: sn.label || sn.type, status: 'skipped',
          detail: 'Skipped — condition routed past this node' });
      }
      if (slot < sas.length) {
        addStep({ type: 'sub-agent', name: sas[slot].name || `Sub-agent ${slot + 1}`, status: 'skipped',
          role: sas[slot].role, detail: 'Skipped — condition routed past this sub-agent' });
      }
      continue;
    }
    jumpToSlot = -1;

    const nodesAtSlot = lns.filter(n => n.slot === slot);
    for (const node of nodesAtSlot) {
      if (stopped) break;
      const c = node.config || {};

      if (node.type === 'delay') {
        const dur = c.duration || 1;
        const unit = c.unit || 'hours';
        const mins = unit === 'minutes' ? dur : unit === 'hours' ? dur * 60 : dur * 1440;
        estimatedMinutes += mins;
        addStep({ type: 'delay', name: node.label || 'Delay', status: 'waiting',
          detail: `Wait ${dur} ${unit}`, duration_display: `${dur} ${unit}` });

      } else if (node.type === 'condition') {
        const ev = evaluateExpression(c.expression, contact);
        const branch = ev.result ? 'then' : 'else';
        const branchLabel = ev.result ? (c.then_label || 'Yes') : (c.else_label || 'No');
        const target = ev.result ? c.then_target : c.else_target;
        const targetName = (target !== null && target !== undefined && sas[target]) ? sas[target].name : null;
        addStep({ type: 'condition', name: node.label || 'Condition', status: ev.result ? 'then' : 'else',
          detail: ev.detail, branch, branch_label: branchLabel,
          routed_to: targetName, expression: c.expression });
        // Actually jump to the routed sub-agent, skipping intermediate slots
        if (target !== null && target !== undefined && target > slot) {
          jumpToSlot = target;
        }

      } else if (node.type === 'gate') {
        const ev = evaluateExpression(c.expression, contact);
        if (ev.result) {
          addStep({ type: 'gate', name: node.label || 'Gate', status: 'passed', detail: ev.detail });
        } else {
          const fb = c.fallback || 'skip';
          if (fb === 'route' && c.fallback_target !== null && c.fallback_target !== undefined && c.fallback_target > slot) {
            const fbName = sas[c.fallback_target] ? sas[c.fallback_target].name : null;
            addStep({ type: 'gate', name: node.label || 'Gate', status: 'failed',
              detail: ev.detail, fallback: fb, routed_to: fbName });
            jumpToSlot = c.fallback_target;
          } else {
            const fbTarget = (fb === 'route' && c.fallback_target !== null && sas[c.fallback_target])
              ? sas[c.fallback_target].name : null;
            addStep({ type: 'gate', name: node.label || 'Gate', status: 'failed',
              detail: ev.detail, fallback: fb, routed_to: fbTarget });
            if (fb === 'stop') stopped = true;
            if (fb === 'skip') stopped = true;
          }
        }

      } else if (node.type === 'loop') {
        const count = c.loop_type === 'foreach' ? `each ${c.iterator || '...'}` : `${c.count || 3} times`;
        addStep({ type: 'loop', name: node.label || 'Loop', status: 'executed',
          detail: `Repeat ${count} (max ${c.max_iterations || 10})`, iterations: c.count || 3 });

      } else if (node.type === 'transform') {
        const maps = (c.mappings || []).filter(m => m.from || m.to);
        addStep({ type: 'transform', name: node.label || 'Transform', status: 'executed',
          detail: `${maps.length} data mapping(s)`, mappings: maps });

      } else if (node.type === 'parallel') {
        const branches = Array.isArray(c.branches) ? c.branches : [];
        const branchNames = branches.map(i => sas[i] ? sas[i].name : `Sub-agent ${i + 1}`).filter(Boolean);
        const waitMode = c.wait_mode || 'all';
        addStep({ type: 'parallel', name: node.label || 'Parallel', status: 'executed',
          detail: branchNames.length > 0
            ? `Run ${branchNames.length} sub-agents in parallel (${waitMode === 'any' ? 'race' : 'join'})`
            : (c.description || 'Run next steps in parallel'),
          branches: branchNames, wait_mode: waitMode });

      } else if (node.type === 'ab_split') {
        const variants = Array.isArray(c.variants) ? c.variants : [];
        const totalWeight = variants.reduce((s, v) => s + (v.weight || 0), 0);
        let roll = Math.random() * totalWeight;
        let chosen = variants[0] || { name: '?', weight: 0, target: null };
        for (const v of variants) {
          roll -= v.weight || 0;
          if (roll <= 0) { chosen = v; break; }
        }
        const chosenName = (chosen.target !== null && chosen.target !== undefined && sas[chosen.target])
          ? sas[chosen.target].name : null;
        addStep({ type: 'ab_split', name: node.label || 'A/B Split', status: 'executed',
          detail: `Variant ${chosen.name} selected (${chosen.weight}%)`,
          chosen_variant: chosen.name, routed_to: chosenName,
          variants: variants.map(v => ({ name: v.name, weight: v.weight })) });
        if (chosen.target !== null && chosen.target !== undefined && chosen.target > slot) {
          jumpToSlot = chosen.target;
        }

      } else if (node.type === 'wait_event') {
        const evt = (c.event_type || 'event').replace(/_/g, ' ');
        const dur = c.timeout_duration || 24;
        const unit = c.timeout_unit || 'hours';
        const mins = unit === 'minutes' ? dur : unit === 'hours' ? dur * 60 : dur * 1440;
        const received = Math.random() > 0.3;
        if (received) {
          estimatedMinutes += Math.floor(mins * Math.random() * 0.5);
          addStep({ type: 'wait_event', name: node.label || 'Wait for Event', status: 'received',
            detail: `${evt} received within timeout`, event_type: c.event_type,
            timeout: `${dur} ${unit}` });
        } else {
          estimatedMinutes += mins;
          const action = c.timeout_action || 'continue';
          addStep({ type: 'wait_event', name: node.label || 'Wait for Event', status: 'timeout',
            detail: `${evt} not received — ${action}`, event_type: c.event_type,
            timeout: `${dur} ${unit}`, timeout_action: action });
          if (action === 'skip') stopped = true;
          if (action === 'route' && c.timeout_target !== null && c.timeout_target !== undefined && c.timeout_target > slot) {
            jumpToSlot = c.timeout_target;
          }
        }
      } else if (node.type === 'invoke_agent') {
        const targetId = c.target_agent_id;
        let targetName = `Agent #${targetId}`;
        let childSummary = '';
        if (targetId) {
          try {
            const tAgent = query.get('agents', targetId);
            if (tAgent) {
              targetName = tAgent.name || targetName;
              const tSas = (tAgent.sub_agents || []).length;
              childSummary = `${tSas} sub-agent${tSas !== 1 ? 's' : ''} executed in child flow`;
            }
          } catch (_) {}
        }
        estimatedMinutes += Math.floor(Math.random() * 10) + 2;
        addStep({
          type: 'invoke_agent', name: node.label || 'Invoke Agent', status: 'completed',
          detail: `Chained to ${targetName}`,
          target_agent_id: targetId, target_agent: targetName,
          context_passed: c.pass_context !== false,
          child_summary: childSummary
        });
      }
    }

    if (slot < sas.length && !stopped) {
      if (jumpToSlot > slot) {
        addStep({ type: 'sub-agent', name: sas[slot].name || `Sub-agent ${slot + 1}`, status: 'skipped',
          role: sas[slot].role, detail: 'Skipped — condition routed past this sub-agent' });
      } else {
        const sa = sas[slot];
        const skills = (sa.skill_ids || []).map(sid => {
          const sk = allSkills.find(s => s.id === sid);
          return sk ? { id: sk.id, name: sk.name, steps: (sk.steps || []).length } : null;
        }).filter(Boolean);
        const channel = (sa.node_ids || []).find(n => ['email', 'sms', 'push'].includes(n)) || null;
        if (channel && messages[channel] !== undefined) messages[channel]++;

        // Generate simulated outputs from output_schema
        const outputSchema = Array.isArray(sa.output_schema) ? sa.output_schema : [];
        const producedOutputs = {};
        for (const o of outputSchema) {
          if (!o.key) continue;
          if (o.type === 'string') producedOutputs[o.key] = `[simulated ${o.key}]`;
          else if (o.type === 'number') producedOutputs[o.key] = Math.floor(Math.random() * 100);
          else if (o.type === 'boolean') producedOutputs[o.key] = Math.random() > 0.5;
          else if (o.type === 'array') producedOutputs[o.key] = ['item_1', 'item_2'];
          else if (o.type === 'object') producedOutputs[o.key] = { sample: true };
        }
        const saName = sa.name || `Sub-agent ${slot + 1}`;
        if (Object.keys(producedOutputs).length > 0) {
          dataContext[saName] = producedOutputs;
        }

        // Resolve upstream references in instructions
        let resolvedInstr = sa.system_instructions || '';
        const varRefs = resolvedInstr.match(/\{\{([^}]+)\}\}/g) || [];
        const resolvedVars = [];
        for (const ref of varRefs) {
          const path = ref.replace(/[{}]/g, '');
          const dotIdx = path.indexOf('.');
          if (dotIdx > 0) {
            const agentName = path.slice(0, dotIdx);
            const key = path.slice(dotIdx + 1);
            const val = dataContext[agentName]?.[key];
            if (val !== undefined) {
              resolvedVars.push({ ref: path, value: typeof val === 'object' ? JSON.stringify(val) : String(val) });
            }
          }
        }

        addStep({ type: 'sub-agent', name: saName, status: 'executed',
          role: sa.role, detail: sa.description || '', skills_used: skills,
          channel, instructions_preview: (sa.system_instructions || '').slice(0, 120),
          outputs: Object.keys(producedOutputs).length > 0 ? producedOutputs : undefined,
          output_keys: outputSchema.map(o => o.key).filter(Boolean),
          resolved_vars: resolvedVars.length > 0 ? resolvedVars : undefined,
          upstream_data: resolvedVars.length > 0 ? true : undefined });
      }
    }
  }

  addStep({ type: 'end', name: stopped ? 'Agent Stopped' : 'Agent Complete',
    status: stopped ? 'stopped' : 'executed',
    detail: stopped ? 'Flow stopped by gate or skip' : 'All steps processed' });

  const g = agent.guardrails || {};
  const totalMsgs = messages.email + messages.sms + messages.push;
  const guardrails = [];
  const maxPerDay = g.max_messages_per_contact_per_day;
  if (maxPerDay) guardrails.push({ rule: `Messages/day ≤ ${maxPerDay}`, value: totalMsgs, limit: maxPerDay, passed: totalMsgs <= maxPerDay });
  const cl = g.channel_limits || {};
  if (cl.email) guardrails.push({ rule: `Email/day ≤ ${cl.email}`, value: messages.email, limit: cl.email, passed: messages.email <= cl.email });
  if (cl.sms) guardrails.push({ rule: `SMS/day ≤ ${cl.sms}`, value: messages.sms, limit: cl.sms, passed: messages.sms <= cl.sms });
  if (cl.push) guardrails.push({ rule: `Push/day ≤ ${cl.push}`, value: messages.push, limit: cl.push, passed: messages.push <= cl.push });
  if (g.require_approval) guardrails.push({ rule: 'Requires approval', value: 'Yes', passed: true, info: true });

  const summary = {
    sub_agents_executed: timeline.filter(s => s.type === 'sub-agent').length,
    sub_agents_total: sas.length,
    logic_nodes_processed: timeline.filter(s => !['start', 'end', 'sub-agent'].includes(s.type)).length,
    gates_passed: timeline.filter(s => s.type === 'gate' && s.status === 'passed').length,
    gates_total: timeline.filter(s => s.type === 'gate').length,
    branches_taken: timeline.filter(s => s.type === 'condition').map(s => s.branch_label).filter(Boolean),
    channels_used: Object.entries(messages).filter(([, v]) => v > 0).map(([k]) => k),
    estimated_duration_minutes: estimatedMinutes,
    guardrails_passed: guardrails.filter(g => !g.info).every(g => g.passed),
    guardrail_violations: guardrails.filter(g => !g.passed && !g.info).length
  };

  return { timeline, guardrails, summary, contact: { id: contact.id, name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(), email: contact.email, loyalty_tier: contact.loyalty_tier, lifetime_value: contact.lifetime_value, total_purchases: contact.total_purchases } };
}

router.post('/:id/simulate', (req, res) => {
  try {
    const raw = query.get('agents', parseInt(req.params.id));
    if (!raw) return res.status(404).json({ error: 'Agent not found' });
    const agent = enrichOrchestrator(raw);

    let contact;
    if (req.body.contact_id) {
      contact = query.get('contacts', parseInt(req.body.contact_id));
      if (!contact) return res.status(404).json({ error: 'Contact not found' });
    } else {
      const all = query.all('contacts');
      if (all.length === 0) return res.status(400).json({ error: 'No contacts available for simulation' });
      contact = all[Math.floor(Math.random() * all.length)];
    }

    const orders = query.all('orders').filter(o => o.contact_id === contact.id);
    if (orders.length > 0) {
      const lastOrder = orders.sort((a, b) => (b.ordered_at || '').localeCompare(a.ordered_at || ''))[0];
      contact.last_order = lastOrder;
      contact.order_value = lastOrder.total || lastOrder.subtotal || 0;
      contact.cart_value = contact.order_value;
    }
    contact.email_opt_in = contact.email_opt_in !== false && contact.email_opt_in !== 0;
    contact.sms_opt_in = contact.sms_opt_in === true || contact.sms_opt_in === 1;

    const allSkills = query.all('agent_skills');
    const result = simulateAgentFlow(agent, contact, allSkills);

    const execRecord = query.insert('agent_executions', {
      agent_id: agent.id, agent_name: agent.name, contact_id: contact.id,
      type: 'simulation', result: JSON.stringify(result.summary),
      timeline_length: result.timeline.length,
      guardrails_passed: result.summary.guardrails_passed,
      created_at: new Date().toISOString()
    });

    res.json({ ...result, execution_id: execRecord.lastID });
  } catch (error) {
    console.error('[Simulate]', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/simulations', (req, res) => {
  try {
    const agentId = parseInt(req.params.id);
    const all = query.all('agent_executions').filter(e => e.agent_id === agentId);
    res.json(all.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 20));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Agent Test Engine (AI-powered content generation) ──────────

function buildSubAgentPrompt(sa, contact, agent, skills, upstreamData) {
  const contactCtx = `Customer: ${contact.first_name} ${contact.last_name}, email: ${contact.email}, ` +
    `loyalty tier: ${contact.loyalty_tier || 'standard'}, lifetime value: $${contact.lifetime_value || 0}, ` +
    `total purchases: ${contact.total_purchases || 0}, engagement score: ${contact.engagement_score || 0}` +
    (contact.last_order ? `, last order: $${contact.last_order.total || 0} on ${(contact.last_order.ordered_at || '').slice(0, 10)}` : '') +
    (contact.interests ? `, interests: ${contact.interests}` : '');

  const skillSteps = (sa.skill_ids || []).map(sid => {
    const sk = skills.find(s => s.id === sid);
    if (!sk) return null;
    const steps = (sk.steps || []).map(st => `  ${st.step}. [${st.action}] ${st.instruction}${st.channel ? ' ('+st.channel+')' : ''}`).join('\n');
    return `Skill "${sk.name}":\n${steps}`;
  }).filter(Boolean).join('\n\n');

  // Include upstream data context if available
  let upstreamCtx = '';
  if (upstreamData && Object.keys(upstreamData).length > 0) {
    upstreamCtx = '\n\nUpstream data from prior sub-agents:\n';
    for (const [agentName, data] of Object.entries(upstreamData)) {
      upstreamCtx += `  ${agentName}: ${JSON.stringify(data)}\n`;
    }
  }

  // Include output schema requirements if defined
  const outputSchema = Array.isArray(sa.output_schema) ? sa.output_schema.filter(o => o.key) : [];
  let outputReq = '';
  if (outputSchema.length > 0) {
    outputReq = '\n\nYou MUST produce a JSON object with these output fields:\n' +
      outputSchema.map(o => `  - "${o.key}" (${o.type}): ${o.description || 'no description'}`).join('\n') +
      '\n\nReturn the JSON object at the end of your response wrapped in ```json``` code fences.';
  }

  return {
    system: sa.system_instructions || `You are a ${sa.role || 'executor'} sub-agent for the "${agent.name}" agent. ${agent.goal || ''}`,
    user: `${contactCtx}${upstreamCtx}\n\nAgent goal: ${agent.goal || 'No goal set'}\n\n` +
      (skillSteps ? `Follow these skills:\n${skillSteps}\n\n` : '') +
      `Based on the above, generate the actual content/message you would produce for this customer. ` +
      `Include: subject line (if email), message body, channel recommendation, and any personalization. ` +
      `Keep it concise and production-ready.${outputReq}`
  };
}

function mockSubAgentResponse(sa, contact, skills) {
  const channel = (sa.node_ids || []).find(n => ['email', 'sms', 'push'].includes(n)) || 'email';
  const skillNames = (sa.skill_ids || []).map(sid => { const sk = skills.find(s => s.id === sid); return sk ? sk.name : null; }).filter(Boolean);
  const firstName = contact.first_name || 'Customer';

  const templates = {
    content: {
      subject: `${firstName}, we picked something special for you`,
      body: `Hi ${firstName},\n\nBased on your interests${contact.interests ? ' in ' + contact.interests : ''}, we thought you'd love these curated picks.\n\n[Personalized product recommendations would go here based on browsing/purchase history]\n\nAs a ${contact.loyalty_tier || 'valued'} member, you get exclusive early access.\n\nBest,\nThe Team`,
      channel
    },
    orchestrator: {
      subject: null,
      body: `[Orchestration decision]\nCustomer segment: ${contact.loyalty_tier || 'standard'} tier, LTV $${contact.lifetime_value || 0}\nRecommended approach: ${(contact.lifetime_value || 0) > 200 ? 'Premium personalized outreach' : 'Standard engagement sequence'}\nOptimal channel: ${channel}\nUrgency: ${(contact.engagement_score || 0) < 30 ? 'High — re-engagement needed' : 'Normal'}`,
      channel: 'internal'
    },
    timing: {
      subject: null,
      body: `[Send-time optimization]\nCustomer timezone: ${contact.timezone || 'UTC'}\nHistorical peak engagement: ${['9:00 AM', '12:30 PM', '6:00 PM', '8:00 PM'][Math.floor(Math.random() * 4)]}\nRecommended send time: ${['Tomorrow 9:00 AM', 'Today 6:00 PM', 'Tomorrow 8:00 AM'][Math.floor(Math.random() * 3)]}\nDay preference: ${['Tuesday', 'Wednesday', 'Thursday'][Math.floor(Math.random() * 3)]}`,
      channel: 'internal'
    },
    conversion: {
      subject: null,
      body: `[Conversion analysis]\nCustomer: ${firstName} ${contact.last_name || ''}\nPurchase likelihood: ${(contact.engagement_score || 0) > 50 ? 'High' : (contact.engagement_score || 0) > 25 ? 'Medium' : 'Low'} (score: ${contact.engagement_score || 0})\nLast activity: ${contact.last_activity_at ? contact.last_activity_at.slice(0, 10) : 'Unknown'}\nRecommendation: ${(contact.engagement_score || 0) > 50 ? 'Proceed with current sequence' : 'Escalate incentive level'}`,
      channel: 'internal'
    }
  };

  const tmpl = templates[sa.role] || templates.content;
  return {
    subject: tmpl.subject,
    body: tmpl.body,
    channel: tmpl.channel || channel,
    skills_applied: skillNames,
    ai_generated: false
  };
}

router.post('/:id/test', async (req, res) => {
  try {
    const raw = query.get('agents', parseInt(req.params.id));
    if (!raw) return res.status(404).json({ error: 'Agent not found' });
    const agent = enrichOrchestrator(raw);

    let contact;
    if (req.body.contact_id) {
      contact = query.get('contacts', parseInt(req.body.contact_id));
      if (!contact) return res.status(404).json({ error: 'Contact not found' });
    } else {
      const all = query.all('contacts');
      if (all.length === 0) return res.status(400).json({ error: 'No contacts available' });
      contact = all[Math.floor(Math.random() * all.length)];
    }

    const orders = query.all('orders').filter(o => o.contact_id === contact.id);
    if (orders.length > 0) {
      const lastOrder = orders.sort((a, b) => (b.ordered_at || '').localeCompare(a.ordered_at || ''))[0];
      contact.last_order = lastOrder;
      contact.order_value = lastOrder.total || lastOrder.subtotal || 0;
      contact.cart_value = contact.order_value;
    }
    contact.email_opt_in = contact.email_opt_in !== false && contact.email_opt_in !== 0;
    contact.sms_opt_in = contact.sms_opt_in === true || contact.sms_opt_in === 1;

    const allSkills = query.all('agent_skills');
    const sas = Array.isArray(agent.sub_agents) ? agent.sub_agents : [];
    const lns = Array.isArray(agent.logic_nodes) ? agent.logic_nodes : [];

    // First run simulation to get the flow path
    const simResult = simulateAgentFlow(agent, contact, allSkills);

    // Now generate content for each executed sub-agent, passing upstream data
    const outputs = [];
    const testDataContext = {};
    for (const step of simResult.timeline) {
      if (step.type !== 'sub-agent') continue;
      if (step.status === 'skipped') continue;
      const saIdx = sas.findIndex(sa => sa.name === step.name);
      const sa = saIdx >= 0 ? sas[saIdx] : null;
      if (!sa) continue;

      const prompt = buildSubAgentPrompt(sa, contact, agent, allSkills, testDataContext);
      let aiResponse = await callOpenAI(prompt.user, prompt.system, 600);
      let output;

      if (aiResponse) {
        const channel = (sa.node_ids || []).find(n => ['email', 'sms', 'push'].includes(n)) || 'email';
        const skillNames = (sa.skill_ids || []).map(sid => { const sk = allSkills.find(s => s.id === sid); return sk ? sk.name : null; }).filter(Boolean);
        const subjectMatch = aiResponse.match(/subject\s*(?:line)?[:\s]*["']?(.+?)["']?\s*(?:\n|body|message)/i);
        output = {
          subject: subjectMatch ? subjectMatch[1].trim() : null,
          body: aiResponse,
          channel,
          skills_applied: skillNames,
          ai_generated: true
        };
      } else {
        output = mockSubAgentResponse(sa, contact, allSkills);
      }

      // Extract structured outputs and store in context for downstream sub-agents
      const outputSchema = Array.isArray(sa.output_schema) ? sa.output_schema.filter(o => o.key) : [];
      let structuredOutput = null;
      if (outputSchema.length > 0) {
        // Try to parse JSON output from AI response
        const jsonMatch = (output.body || '').match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try { structuredOutput = JSON.parse(jsonMatch[1]); } catch (_) {}
        }
        if (!structuredOutput) {
          // Generate mock structured output
          structuredOutput = {};
          for (const o of outputSchema) {
            if (o.type === 'string') structuredOutput[o.key] = output.subject || output.body?.slice(0, 80) || `[${o.key}]`;
            else if (o.type === 'number') structuredOutput[o.key] = Math.floor(Math.random() * 100);
            else if (o.type === 'boolean') structuredOutput[o.key] = true;
            else if (o.type === 'array') structuredOutput[o.key] = ['item_1', 'item_2'];
            else structuredOutput[o.key] = { generated: true };
          }
        }
        testDataContext[sa.name || `Sub-agent ${saIdx + 1}`] = structuredOutput;
      }

      outputs.push({
        sub_agent_name: sa.name,
        role: sa.role,
        index: saIdx,
        output,
        structured_output: structuredOutput,
        upstream_data_used: Object.keys(testDataContext).filter(k => k !== sa.name).length > 0
      });
    }

    const result = {
      simulation: simResult,
      outputs,
      contact: {
        id: contact.id,
        name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
        email: contact.email,
        loyalty_tier: contact.loyalty_tier,
        lifetime_value: contact.lifetime_value,
        total_purchases: contact.total_purchases,
        engagement_score: contact.engagement_score
      }
    };

    query.insert('agent_executions', {
      agent_id: agent.id, agent_name: agent.name, contact_id: contact.id,
      type: 'test',
      result: JSON.stringify({ summary: simResult.summary, outputs_count: outputs.length, ai_used: outputs.some(o => o.output.ai_generated) }),
      timeline_length: simResult.timeline.length,
      guardrails_passed: simResult.summary.guardrails_passed,
      created_at: new Date().toISOString()
    });

    res.json(result);
  } catch (error) {
    console.error('[Test]', error);
    res.status(500).json({ error: error.message });
  }
});

/* ───── Trigger agent ───── */
router.post('/:id/trigger', async (req, res) => {
  try {
    const raw = query.get('agents', parseInt(req.params.id));
    if (!raw) return res.status(404).json({ error: 'Agent not found' });
    const agent = enrichOrchestrator(raw);

    if (agent.status !== 'active' && agent.status !== 'draft') {
      return res.status(400).json({ error: 'Agent is not active' });
    }

    const triggers = Array.isArray(agent.triggers) ? agent.triggers : [];

    const triggerType = req.body.trigger_type || 'api';
    const matchingTrigger = triggers.find(t => t.type === triggerType && t.enabled !== false);
    if (triggers.length > 0 && !matchingTrigger) {
      return res.status(400).json({ error: `No active trigger of type "${triggerType}" configured` });
    }

    let contacts = [];
    if (req.body.contact_id) {
      const c = query.get('contacts', parseInt(req.body.contact_id));
      if (!c) return res.status(404).json({ error: 'Contact not found' });
      contacts.push(c);
    } else if (req.body.segment_id || req.body.segment_name) {
      const all = query.all('contacts');
      const segName = req.body.segment_name || '';
      contacts = all.filter(c => {
        if (c.loyalty_tier && c.loyalty_tier.toLowerCase() === segName.toLowerCase()) return true;
        if (c.tags && Array.isArray(c.tags) && c.tags.includes(segName)) return true;
        return false;
      });
      if (contacts.length === 0) {
        contacts = all.slice(0, 10);
      }
    } else {
      const all = query.all('contacts');
      if (all.length === 0) return res.status(400).json({ error: 'No contacts available' });
      contacts.push(all[Math.floor(Math.random() * all.length)]);
    }

    const allSkills = query.all('agent_skills');
    const executions = [];

    for (const contact of contacts) {
      const orders = query.all('orders').filter(o => o.contact_id === contact.id);
      if (orders.length > 0) {
        const lastOrder = orders.sort((a, b) => (b.ordered_at || '').localeCompare(a.ordered_at || ''))[0];
        contact.last_order = lastOrder;
        contact.order_value = lastOrder.total || lastOrder.subtotal || 0;
        contact.cart_value = contact.order_value;
      }
      contact.email_opt_in = contact.email_opt_in !== false && contact.email_opt_in !== 0;
      contact.sms_opt_in = contact.sms_opt_in === true || contact.sms_opt_in === 1;

      const simResult = simulateAgentFlow(agent, contact, allSkills);

      const execId = query.insert('agent_executions', {
        agent_id: agent.id,
        agent_name: agent.name,
        contact_id: contact.id,
        type: 'trigger',
        trigger_type: triggerType,
        result: JSON.stringify({
          summary: simResult.summary,
          trigger: matchingTrigger || { type: triggerType },
          event_data: req.body.event_data || null
        }),
        timeline_length: simResult.timeline.length,
        guardrails_passed: simResult.summary.guardrails_passed,
        created_at: new Date().toISOString()
      });

      executions.push({
        execution_id: execId,
        contact: { id: contact.id, name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(), email: contact.email },
        simulation: simResult
      });
    }

    res.json({
      agent_id: agent.id,
      agent_name: agent.name,
      trigger_type: triggerType,
      contacts_processed: contacts.length,
      executions
    });
  } catch (error) {
    console.error('[Trigger]', error);
    res.status(500).json({ error: error.message });
  }
});

/* ───── List trigger history ───── */
router.get('/:id/triggers/history', (req, res) => {
  try {
    const agentId = parseInt(req.params.id);
    const execs = query.all('agent_executions')
      .filter(e => e.agent_id === agentId && e.type === 'trigger')
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .slice(0, 50);
    res.json(execs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Approval Queue ─────────────────────────────────────────

router.get('/ops/approvals', (req, res) => {
  try {
    const approvals = query.all('agent_approvals')
      .filter(a => a.status === 'pending')
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    res.json(approvals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ops/approvals', (req, res) => {
  try {
    const { agent_id, agent_name, trigger_type, contact_id, content_preview, requested_by } = req.body;
    if (!agent_id) return res.status(400).json({ error: 'agent_id is required' });

    const result = query.insert('agent_approvals', {
      agent_id,
      agent_name: agent_name || '',
      trigger_type: trigger_type || 'manual',
      contact_id: contact_id || null,
      content_preview: content_preview || '',
      requested_by: requested_by || 'System',
      status: 'pending',
      reviewer: null,
      notes: null,
      reviewed_at: null,
      created_at: new Date().toISOString()
    });

    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/ops/approvals/:approvalId', (req, res) => {
  try {
    const approvalId = parseInt(req.params.approvalId);
    const existing = query.get('agent_approvals', approvalId);
    if (!existing) return res.status(404).json({ error: 'Approval not found' });

    const { action, reviewer, notes } = req.body;
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be "approve" or "reject"' });
    }

    const now = new Date().toISOString();
    query.update('agent_approvals', approvalId, {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewer: reviewer || 'Unknown',
      notes: notes || '',
      reviewed_at: now
    });

    res.json(query.get('agent_approvals', approvalId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Analytics ──────────────────────────────────────────────

router.get('/ops/analytics', (req, res) => {
  try {
    const executions = query.all('agent_executions');
    const total_executions = executions.length;

    const executions_by_type = {};
    const executions_by_agent = {};
    let guardrails_passed_count = 0;
    let total_timeline_length = 0;
    const dateCounts = {};
    const agentCounts = {};
    const channelCounts = {};

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

    for (const exec of executions) {
      const type = exec.type || 'unknown';
      executions_by_type[type] = (executions_by_type[type] || 0) + 1;

      const agentKey = exec.agent_name || `Agent ${exec.agent_id}`;
      executions_by_agent[agentKey] = (executions_by_agent[agentKey] || 0) + 1;
      agentCounts[agentKey] = (agentCounts[agentKey] || 0) + 1;

      if (exec.guardrails_passed) guardrails_passed_count++;
      if (exec.timeline_length) total_timeline_length += exec.timeline_length;

      const dateKey = (exec.created_at || '').slice(0, 10);
      if (dateKey >= thirtyDaysAgoStr) {
        dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
      }

      try {
        const result = typeof exec.result === 'string' ? JSON.parse(exec.result) : exec.result;
        const channels = result?.summary?.channels_used || result?.channels_used || [];
        for (const ch of channels) {
          channelCounts[ch] = (channelCounts[ch] || 0) + 1;
        }
      } catch (_) {}
    }

    const executions_over_time = Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const top_agents = Object.entries(agentCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      total_executions,
      executions_by_type,
      executions_by_agent,
      guardrails_pass_rate: total_executions > 0
        ? Math.round((guardrails_passed_count / total_executions) * 100) : 0,
      avg_timeline_length: total_executions > 0
        ? Math.round(total_timeline_length / total_executions) : 0,
      executions_over_time,
      top_agents,
      channel_distribution: channelCounts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Contact Journey ────────────────────────────────────────

router.get('/ops/journey/:contactId', (req, res) => {
  try {
    const contactId = parseInt(req.params.contactId);
    const executions = query.all('agent_executions')
      .filter(e => e.contact_id === contactId)
      .map(e => ({
        type: 'agent_execution',
        id: e.id,
        agent_id: e.agent_id,
        agent_name: e.agent_name,
        execution_type: e.type,
        guardrails_passed: e.guardrails_passed,
        timeline_length: e.timeline_length,
        date: e.created_at
      }));

    const deliveryLogs = query.all('delivery_logs')
      .filter(d => d.contact_id === contactId)
      .map(d => ({
        type: 'delivery',
        id: d.id,
        delivery_id: d.delivery_id,
        channel: d.channel || 'email',
        status: d.status,
        subject: d.subject,
        date: d.sent_at || d.created_at
      }));

    const contactEvents = query.all('contact_events')
      .filter(e => e.contact_id === contactId)
      .map(e => ({
        type: 'contact_event',
        id: e.id,
        event_type: e.event_type || e.type,
        description: e.description,
        date: e.event_date || e.created_at
      }));

    const timeline = [...executions, ...deliveryLogs, ...contactEvents]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    res.json({
      contact_id: contactId,
      total_events: timeline.length,
      timeline
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Audit Trail ────────────────────────────────────────────

router.get('/ops/audit', (req, res) => {
  try {
    const { agent_id, type, from, to } = req.query;
    let executions = query.all('agent_executions');

    if (agent_id) {
      const aid = parseInt(agent_id);
      executions = executions.filter(e => e.agent_id === aid);
    }
    if (type) {
      executions = executions.filter(e => e.type === type);
    }
    if (from) {
      executions = executions.filter(e => (e.created_at || '') >= from);
    }
    if (to) {
      executions = executions.filter(e => (e.created_at || '') <= to);
    }

    executions.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

    const enriched = executions.slice(0, 100).map(e => {
      const agent = query.get('agents', e.agent_id);
      return {
        ...e,
        agent_status: agent ? agent.status : 'unknown',
        agent_goal: agent ? agent.goal : null
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Knowledge Base ─────────────────────────────────────────

const KB_CATEGORIES = ['product_catalog', 'brand_guidelines', 'faq', 'compliance', 'templates', 'general'];

router.get('/ops/knowledge-base', (req, res) => {
  try {
    const entries = query.all('knowledge_base');
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ops/knowledge-base', (req, res) => {
  try {
    const { title, category, content, tags } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    if (category && !KB_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${KB_CATEGORIES.join(', ')}` });
    }

    const now = new Date().toISOString();
    const result = query.insert('knowledge_base', {
      title,
      category: category || 'general',
      content: content || '',
      tags: Array.isArray(tags) ? tags : [],
      created_at: now,
      updated_at: now
    });

    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/ops/knowledge-base/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('knowledge_base', id);
    if (!existing) return res.status(404).json({ error: 'Knowledge base entry not found' });

    const updates = { ...req.body };
    delete updates.id;
    delete updates.created_at;
    if (updates.category && !KB_CATEGORIES.includes(updates.category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${KB_CATEGORIES.join(', ')}` });
    }
    updates.updated_at = new Date().toISOString();

    query.update('knowledge_base', id, updates);
    res.json(query.get('knowledge_base', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/ops/knowledge-base/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('knowledge_base', id);
    if (!existing) return res.status(404).json({ error: 'Knowledge base entry not found' });

    query.delete('knowledge_base', id);
    res.json({ message: 'Knowledge base entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Feedback Tracking ──────────────────────────────────────

router.post('/ops/feedback', (req, res) => {
  try {
    const { execution_id, agent_id, feedback_type, notes, metric_type, metric_value } = req.body;
    if (!agent_id) return res.status(400).json({ error: 'agent_id is required' });
    if (!feedback_type || !['positive', 'negative', 'neutral'].includes(feedback_type)) {
      return res.status(400).json({ error: 'feedback_type must be "positive", "negative", or "neutral"' });
    }

    const result = query.insert('agent_feedback', {
      execution_id: execution_id || null,
      agent_id,
      feedback_type,
      notes: notes || '',
      metric_type: metric_type || null,
      metric_value: metric_value != null ? metric_value : null,
      created_at: new Date().toISOString()
    });

    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ops/feedback/:agentId', (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId);
    const feedback = query.all('agent_feedback')
      .filter(f => f.agent_id === agentId)
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Agent Versions ─────────────────────────────────────────

router.post('/:id/versions', (req, res) => {
  try {
    const agentId = parseInt(req.params.id);
    const agent = query.get('agents', agentId);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const { version_note } = req.body;

    const existingVersions = query.all('agent_versions')
      .filter(v => v.agent_id === agentId);
    const version_number = existingVersions.length + 1;

    const snapshot = { ...agent };
    const now = new Date().toISOString();

    const result = query.insert('agent_versions', {
      agent_id: agentId,
      version_number,
      version_note: version_note || `Version ${version_number}`,
      snapshot,
      created_at: now
    });

    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/versions', (req, res) => {
  try {
    const agentId = parseInt(req.params.id);
    const agent = query.get('agents', agentId);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const versions = query.all('agent_versions')
      .filter(v => v.agent_id === agentId)
      .sort((a, b) => b.version_number - a.version_number);

    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/versions/:versionId/restore', (req, res) => {
  try {
    const agentId = parseInt(req.params.id);
    const versionId = parseInt(req.params.versionId);

    const agent = query.get('agents', agentId);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const version = query.get('agent_versions', versionId);
    if (!version || version.agent_id !== agentId) {
      return res.status(404).json({ error: 'Version not found for this agent' });
    }

    const snapshot = version.snapshot;
    const restoredData = { ...snapshot };
    delete restoredData.id;
    delete restoredData.created_at;
    restoredData.updated_at = new Date().toISOString();

    query.update('agents', agentId, restoredData);
    res.json(query.get('agents', agentId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Agent Clone ────────────────────────────────────────────

router.post('/:id/clone', (req, res) => {
  try {
    const agentId = parseInt(req.params.id);
    const agent = query.get('agents', agentId);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const now = new Date().toISOString();
    const cloneData = {
      name: `Copy of ${agent.name}`,
      description: agent.description || '',
      type: agent.type || 'orchestrator',
      status: 'draft',
      created_by: req.body.created_by || agent.created_by || 'System',
      cloned_from: agentId,
      created_at: now,
      updated_at: now
    };
    if (agent.type === 'orchestrator' || !agent.type) {
      Object.assign(cloneData, {
        goal: agent.goal || '',
        source_workflow_id: agent.source_workflow_id || null,
        workflow_snapshot: agent.workflow_snapshot || null,
        child_agents: agent.child_agents || [],
        logic_nodes: agent.logic_nodes || [],
        guardrails: agent.guardrails || {},
        triggers: agent.triggers || [],
        tool_ids: agent.tool_ids || []
      });
    } else {
      Object.assign(cloneData, {
        role: agent.role || 'executor',
        system_instructions: agent.system_instructions || '',
        skill_ids: agent.skill_ids || [],
        tool_ids: agent.tool_ids || [],
        node_ids: agent.node_ids || [],
        output_schema: agent.output_schema || []
      });
    }

    const result = query.insert('agents', cloneData);
    res.status(201).json(enrichOrchestrator(result.record));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Agent Recommendations ──────────────────────────────────

router.get('/:id/recommendations', (req, res) => {
  try {
    const agentId = parseInt(req.params.id);
    const agent = query.get('agents', agentId);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const executions = query.all('agent_executions')
      .filter(e => e.agent_id === agentId)
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .slice(0, 20);

    const recommendations = [];
    const guardrails = agent.guardrails || {};
    const subAgents = agent.sub_agents || [];
    const triggers = agent.triggers || [];

    if (!guardrails.max_messages_per_contact_per_day) {
      recommendations.push({
        type: 'guardrail',
        title: 'Add message frequency cap',
        description: 'No daily message limit is configured. Adding a cap prevents over-messaging contacts and reduces unsubscribe risk.',
        priority: 'high',
        action: 'Set guardrails.max_messages_per_contact_per_day to 3'
      });
    }

    if (!guardrails.require_approval) {
      recommendations.push({
        type: 'guardrail',
        title: 'Enable approval workflow',
        description: 'Running without approvals increases risk of sending unreviewed content. Enable approval for production agents.',
        priority: 'medium',
        action: 'Set guardrails.require_approval to true'
      });
    }

    const channelLimits = guardrails.channel_limits || {};
    if (Object.keys(channelLimits).length === 0) {
      recommendations.push({
        type: 'guardrail',
        title: 'Configure channel-specific limits',
        description: 'No per-channel limits are set. Different channels have different tolerance thresholds — SMS especially should be limited.',
        priority: 'medium',
        action: 'Set guardrails.channel_limits (e.g., email: 2, sms: 1, push: 2)'
      });
    }

    if (triggers.length === 0) {
      recommendations.push({
        type: 'trigger',
        title: 'Add at least one trigger',
        description: 'This agent has no triggers configured. Add an event-based or scheduled trigger to automate execution.',
        priority: 'high',
        action: 'Add a trigger with type "event", "schedule", or "api"'
      });
    } else {
      const enabledTriggers = triggers.filter(t => t.enabled !== false);
      if (enabledTriggers.length === 0) {
        recommendations.push({
          type: 'trigger',
          title: 'Enable at least one trigger',
          description: 'All triggers are currently disabled. Enable a trigger for the agent to execute automatically.',
          priority: 'high',
          action: 'Set enabled: true on at least one trigger'
        });
      }
    }

    if (subAgents.length === 0) {
      recommendations.push({
        type: 'sub_agent',
        title: 'Define sub-agents',
        description: 'This agent has no sub-agents. Decompose the workflow into specialized sub-agents for better control and observability.',
        priority: 'high',
        action: 'Use the decompose endpoint or manually add sub-agents'
      });
    } else {
      const roles = subAgents.map(s => s.role);
      if (!roles.includes('orchestrator')) {
        recommendations.push({
          type: 'sub_agent',
          title: 'Add an orchestrator sub-agent',
          description: 'No orchestrator is defined. An orchestrator coordinates all other sub-agents and manages the overall flow.',
          priority: 'medium',
          action: 'Add a sub-agent with role "orchestrator"'
        });
      }

      const withoutSkills = subAgents.filter(s => !s.skill_ids || s.skill_ids.length === 0);
      if (withoutSkills.length > 0) {
        recommendations.push({
          type: 'sub_agent',
          title: `Assign skills to ${withoutSkills.length} sub-agent(s)`,
          description: `${withoutSkills.map(s => s.name).join(', ')} have no skills assigned. Skills provide step-by-step instructions for consistent execution.`,
          priority: 'low',
          action: 'Assign relevant skill IDs to sub-agent skill_ids arrays'
        });
      }
    }

    if (executions.length > 0) {
      const failedGuardrails = executions.filter(e => !e.guardrails_passed);
      if (failedGuardrails.length > executions.length * 0.3) {
        recommendations.push({
          type: 'guardrail',
          title: 'High guardrail violation rate',
          description: `${failedGuardrails.length} of ${executions.length} recent executions failed guardrail checks. Review and adjust limits or agent logic.`,
          priority: 'high',
          action: 'Review guardrail configuration and recent execution results'
        });
      }

      const avgTimeline = executions.reduce((s, e) => s + (e.timeline_length || 0), 0) / executions.length;
      if (avgTimeline > 15) {
        recommendations.push({
          type: 'timing',
          title: 'Complex execution flow detected',
          description: `Average timeline length is ${Math.round(avgTimeline)} steps. Consider simplifying the flow or splitting into multiple agents.`,
          priority: 'low',
          action: 'Review logic nodes and sub-agent chain for optimization opportunities'
        });
      }
    } else {
      recommendations.push({
        type: 'timing',
        title: 'Run a test execution',
        description: 'This agent has no execution history. Run a simulation or test to validate the flow before activating.',
        priority: 'medium',
        action: 'Use POST /:id/simulate or POST /:id/test'
      });
    }

    recommendations.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.priority] || 2) - (order[b.priority] || 2);
    });

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Intelligent Flow ─────────────────────────────────────

router.post('/:id/probabilistic/generate', async (req, res) => {
  try {
    const agentId = parseInt(req.params.id);
    const raw = query.get('agents', agentId);
    if (!raw) return res.status(404).json({ error: 'Agent not found' });

    const agent = enrichOrchestrator(raw);
    const sas = Array.isArray(agent.sub_agents) ? agent.sub_agents : [];
    if (sas.length === 0) {
      return res.status(400).json({ error: 'Agent has no sub-agents to build a probabilistic flow from' });
    }

    const wfId = agent.source_workflow_id;
    const existingSkills = query.all('agent_skills').filter(s => s.source_workflow_id === wfId);

    let orchNodes = [];
    let orchConnections = [];
    if (wfId) {
      const orchestrations = query.all('campaign_orchestrations');
      const orch = orchestrations.find(o => o.campaign_id === wfId || o.id === wfId);
      if (orch) {
        orchNodes = orch.nodes || [];
        orchConnections = orch.connections || [];
      }
    }

    const edges = [];
    const skillChains = {};

    // Build a map: node_id → sub-agent index
    const nodeToSA = {};
    sas.forEach((sa, idx) => {
      (sa.node_ids || []).forEach(nid => { nodeToSA[nid] = idx; });
    });

    // Derive edges from deterministic topology
    const edgeSet = new Set();
    for (const conn of orchConnections) {
      const fromSA = nodeToSA[conn.from];
      const toSA = nodeToSA[conn.to];
      if (fromSA !== undefined && toSA !== undefined && fromSA !== toSA) {
        const key = `${fromSA}->${toSA}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({ from_index: fromSA, to_index: toSA, probability: 0, label: 'success' });
        }
      }
    }

    // If no topology edges, create a linear chain
    if (edges.length === 0) {
      for (let i = 0; i < sas.length - 1; i++) {
        edges.push({ from_index: i, to_index: i + 1, probability: 0, label: 'success' });
      }
    }

    // Distribute probabilities: uniform per outgoing group
    const outgoing = {};
    edges.forEach(e => {
      if (!outgoing[e.from_index]) outgoing[e.from_index] = [];
      outgoing[e.from_index].push(e);
    });
    for (const group of Object.values(outgoing)) {
      const p = Math.round((100 / group.length) * 100) / 100;
      group.forEach((e, i) => {
        e.probability = i === group.length - 1 ? +(100 - p * (group.length - 1)).toFixed(2) : p;
      });
    }

    // Derive skill chains within each sub-agent
    sas.forEach((sa, idx) => {
      const ids = sa.skill_ids || [];
      if (ids.length === 0) return;

      // Order skills by their node_ids positions in the deterministic flow
      const nodeOrder = {};
      orchNodes.forEach((n, ni) => { nodeOrder[n.id] = ni; });

      const ordered = ids.slice().sort((a, b) => {
        const skA = existingSkills.find(s => s.id === a);
        const skB = existingSkills.find(s => s.id === b);
        const posA = Math.min(...(skA?.node_ids || []).map(nid => nodeOrder[nid] ?? 9999));
        const posB = Math.min(...(skB?.node_ids || []).map(nid => nodeOrder[nid] ?? 9999));
        return posA - posB;
      });
      skillChains[String(idx)] = ordered;
    });

    // Layout: simple grid
    const layout = {};
    sas.forEach((sa, idx) => {
      layout[String(idx)] = { slot: idx, expanded: true };
    });

    // Attempt AI-based probability estimation
    const aiPrompt = `You are analyzing a marketing agent system. Given these sub-agents and their connections, estimate the probability (0-100) of each transition occurring during a typical execution.

Sub-agents:
${sas.map((sa, i) => `  ${i}: "${sa.name}" (role: ${sa.role}) — ${sa.description || 'no description'}`).join('\n')}

Current edges (need probability estimates):
${edges.map(e => `  ${sas[e.from_index]?.name || e.from_index} → ${sas[e.to_index]?.name || e.to_index} (label: ${e.label})`).join('\n')}

Return ONLY a JSON array of objects: [{"from_index": 0, "to_index": 1, "probability": 85, "label": "success"}, ...]
Each probability is 0-100. Outgoing edges from each node should sum to ~100.`;

    const aiResult = await callOpenAI(aiPrompt,
      'You estimate transition probabilities in agent workflows. Return only valid JSON arrays.');
    if (aiResult) {
      try {
        const cleaned = aiResult.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
        const aiEdges = JSON.parse(cleaned);
        if (Array.isArray(aiEdges)) {
          for (const ae of aiEdges) {
            const match = edges.find(e => e.from_index === ae.from_index && e.to_index === ae.to_index);
            if (match) {
              match.probability = Math.max(0, Math.min(100, Number(ae.probability) || match.probability));
              if (ae.label) match.label = String(ae.label).slice(0, 40);
            }
          }
        }
      } catch (_) { /* keep uniform fallback */ }
    }

    const probConfig = { edges, skill_chains: skillChains, layout };

    // Resolve workflow name for auto-naming
    let wfName = '';
    if (wfId) {
      const wf = query.get('workflows', wfId);
      if (wf) wfName = wf.name || wf.campaign_name || '';
    }
    if (!wfName) wfName = agent.name || 'Workflow';

    const newName = `Intelligent: ${wfName}`;
    const now = new Date().toISOString();

    // Create new child agent records (copies of the source agent's sub-agents)
    const newSubAgents = sas.map(sa => ({
      name: sa.name, role: sa.role || 'executor',
      description: sa.description || '', system_instructions: sa.system_instructions || '',
      skill_ids: sa.skill_ids || [], tool_ids: sa.tool_ids || [],
      node_ids: sa.node_ids || [], output_schema: sa.output_schema || []
    }));
    const childRefs = decomposeSubAgents(newSubAgents, []);

    const result = query.insert('agents', {
      name: newName,
      type: 'orchestrator',
      description: `Intelligent orchestration derived from "${wfName}". Agents are connected with probability-weighted transitions and ordered skill chains.`,
      goal: agent.goal || '',
      source_workflow_id: wfId || null,
      workflow_snapshot: agent.workflow_snapshot || null,
      child_agents: childRefs,
      logic_nodes: [],
      guardrails: agent.guardrails || { max_messages_per_contact_per_day: 3, channel_limits: { email: 2, sms: 1, push: 2 }, require_approval: true, budget_limit: null },
      probabilistic_config: probConfig,
      status: 'draft',
      tool_ids: agent.tool_ids || [],
      triggers: [],
      created_by: 'System',
      created_at: now,
      updated_at: now
    });

    const newAgent = enrichOrchestrator(result.record);
    res.status(201).json({ agent_id: newAgent.id, agent_name: newName, probabilistic_config: probConfig, agent: newAgent });
  } catch (error) {
    console.error('[Intelligent Generate]', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/probabilistic', (req, res) => {
  try {
    const agentId = parseInt(req.params.id);
    const existing = query.get('agents', agentId);
    if (!existing) return res.status(404).json({ error: 'Agent not found' });

    const { probabilistic_config } = req.body;
    if (!probabilistic_config) return res.status(400).json({ error: 'probabilistic_config is required' });

    query.update('agents', agentId, {
      probabilistic_config,
      updated_at: new Date().toISOString()
    });

    res.json({ success: true, probabilistic_config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
