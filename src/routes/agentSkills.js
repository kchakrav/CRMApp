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
    console.error('[AgentSkills] OpenAI error:', e.response?.status, e.response?.data?.error?.message || e.message);
    return null;
  }
}

// ── Similarity detection ─────────────────────────────────────
function findSimilarSkills(suggested, workflowId) {
  const allExisting = query.all('agent_skills');
  if (allExisting.length === 0) return suggested;

  return suggested.map(skill => {
    const matches = [];

    for (const ex of allExisting) {
      let score = 0;
      const reasons = [];

      // Same source workflow + same category = strong match
      if (ex.source_workflow_id === workflowId && ex.category === skill.category) {
        score += 60;
        reasons.push('Same workflow & category');
      }

      // Name similarity (case-insensitive substring match)
      const exNameLower = (ex.name || '').toLowerCase();
      const skillNameLower = (skill.name || '').toLowerCase();
      if (exNameLower === skillNameLower) {
        score += 50;
        reasons.push('Identical name');
      } else if (exNameLower.includes(skillNameLower) || skillNameLower.includes(exNameLower)) {
        score += 30;
        reasons.push('Similar name');
      }

      // Overlapping node_ids
      const exNodeIds = new Set(ex.node_ids || []);
      const skillNodeIds = skill.node_ids || [];
      if (skillNodeIds.length > 0 && exNodeIds.size > 0) {
        const overlap = skillNodeIds.filter(id => exNodeIds.has(id));
        if (overlap.length > 0) {
          const overlapPct = Math.round((overlap.length / Math.max(skillNodeIds.length, exNodeIds.size)) * 100);
          if (overlapPct >= 50) {
            score += 40;
            reasons.push(`${overlapPct}% node overlap`);
          } else if (overlapPct >= 25) {
            score += 20;
            reasons.push(`${overlapPct}% node overlap`);
          }
        }
      }

      // Same category (weaker signal on its own)
      if (ex.category === skill.category && score < 30) {
        score += 10;
      }

      if (score >= 30) {
        matches.push({
          id: ex.id,
          name: ex.name,
          category: ex.category,
          status: ex.status,
          score,
          reasons
        });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return {
      ...skill,
      existing_matches: matches.slice(0, 3)
    };
  });
}

// ── AI-assisted skill extraction from a workflow ──────────────
router.post('/extract/:workflowId', async (req, res) => {
  try {
    const workflowId = parseInt(req.params.workflowId);
    const workflow = query.get('workflows', workflowId);
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    // Read live orchestration from campaign_orchestrations (authoritative canvas source)
    const orchestrations = query.all('campaign_orchestrations');
    const orch = orchestrations.find(o => o.campaign_id === workflowId || o.id === workflowId);
    const nodes = orch?.nodes || workflow.orchestration?.nodes || [];
    const connections = orch?.connections || workflow.orchestration?.connections || [];

    if (nodes.length === 0) {
      return res.status(400).json({ error: 'Workflow has no nodes to extract skills from' });
    }

    const nodesSummary = nodes.map((n, i) => {
      const cfg = n.config || {};
      let detail = '';
      if (n.type === 'wait' && cfg.wait_time) detail = ` (${cfg.wait_time} ${cfg.wait_unit || 'hours'})`;
      if (n.type === 'email' && cfg.subject) detail = ` (subject: "${cfg.subject}")`;
      if (n.type === 'sms' && cfg.message) detail = ` (msg: "${(cfg.message || '').slice(0, 40)}")`;
      if (n.type === 'condition' && cfg.condition_type) detail = ` (check: ${cfg.condition_type})`;
      if (n.type === 'split' && cfg.split_ratio) detail = ` (${cfg.split_ratio}/${100 - cfg.split_ratio})`;
      if (n.type === 'segment') detail = ` (${cfg.action || 'include'})`;
      if (n.type === 'filter' && cfg.filter_field) detail = ` (${cfg.filter_field} ${cfg.operator || ''} ${cfg.filter_value || ''})`;
      return `  ${i}: [${n.type}] "${n.name}" id=${n.id}${detail}`;
    }).join('\n');

    const connSummary = connections.map(c => {
      const from = nodes.find(n => n.id === c.from);
      const to = nodes.find(n => n.id === c.to);
      return `  ${from?.name || c.from} -> ${to?.name || c.to}`;
    }).join('\n');

    const prompt = `Analyze this marketing automation workflow and identify reusable skill patterns.

Workflow: "${workflow.name}"
Description: "${workflow.description || ''}"
Type: ${workflow.workflow_type || 'broadcast'}

Nodes (${nodes.length}):
${nodesSummary}

Connections:
${connSummary || '  (sequential)'}

Identify 2-5 reusable capability patterns (skills) in this workflow. Group related nodes by CONCERN, not by individual node. Good skill categories:
- targeting: audience selection, filtering, segmentation patterns
- content: messaging strategy, personalization, A/B testing patterns
- timing: wait sequences, send time patterns, cadence strategies
- channel: multi-channel orchestration, channel selection patterns
- conversion: goal tracking, condition checking, re-engagement patterns

For each skill, return:
- "name": short descriptive name (e.g., "Escalating Urgency Outreach")
- "description": 1-2 sentence description of what this skill does and when to reuse it
- "category": one of targeting, content, timing, channel, conversion
- "node_ids": array of node IDs this skill covers
- "steps": array of step objects, each with:
  - "step": sequential number starting from 1
  - "action": one of wait, send, check, filter, split, enrich, target, track
  - "instruction": human-readable instruction with {placeholders} for reusable parameters
  - "channel": (only for send actions) one of email, sms, push
  - "node_ref": the node ID this step maps to (from the node list above)
- "input_schema": object describing expected inputs (e.g., {"wait_time": "duration", "incentive": "string"})
- "output_schema": object describing outputs (e.g., {"messages_sent": "number", "converted": "boolean"})

Return ONLY a valid JSON array of skill objects. No markdown, no explanation.`;

    const result = await callOpenAI(prompt,
      'You are a marketing automation architect who specializes in identifying reusable patterns in customer journeys. Return only valid JSON arrays.');

    let skills = null;
    if (result) {
      try {
        const cleaned = result.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
        skills = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('[AgentSkills] Failed to parse AI response:', parseErr.message);
      }
    }

    if (skills && Array.isArray(skills)) {
      const validCategories = ['targeting', 'content', 'timing', 'channel', 'conversion'];
      const validActions = ['wait', 'send', 'check', 'filter', 'split', 'enrich', 'target', 'track'];
      const validChannels = ['email', 'sms', 'push'];
      const sanitized = skills.filter(s => s && s.name).map(s => {
        const steps = (Array.isArray(s.steps) ? s.steps : []).map((st, i) => {
          const step = { step: st.step || i + 1, action: validActions.includes(st.action) ? st.action : 'check', instruction: String(st.instruction || '') };
          if (st.channel && validChannels.includes(st.channel)) step.channel = st.channel;
          if (st.node_ref) step.node_ref = st.node_ref;
          return step;
        });
        return {
          name: String(s.name).slice(0, 80),
          description: String(s.description || '').slice(0, 500),
          category: validCategories.includes(s.category) ? s.category : 'content',
          node_ids: Array.isArray(s.node_ids) ? s.node_ids : [],
          steps,
          prompt_template: steps.length > 0 ? steps.map(st => st.step + '. ' + st.instruction).join('\n') : String(s.prompt_template || ''),
          input_schema: s.input_schema && typeof s.input_schema === 'object' ? s.input_schema : {},
          output_schema: s.output_schema && typeof s.output_schema === 'object' ? s.output_schema : {}
        };
      });

      return res.json({
        workflow_id: workflowId,
        workflow_name: workflow.name,
        suggested_skills: findSimilarSkills(sanitized, workflowId),
        source: 'openai'
      });
    }

    // ── Mock fallback: rule-based skill extraction ──
    const mockSkills = extractMockSkills(workflow, nodes, connections);
    res.json({
      workflow_id: workflowId,
      workflow_name: workflow.name,
      suggested_skills: findSimilarSkills(mockSkills, workflowId),
      source: 'mock',
      message: 'Using pattern-based extraction. Add OPENAI_API_KEY for AI-powered analysis.'
    });
  } catch (error) {
    console.error('Error extracting skills:', error);
    res.status(500).json({ error: error.message });
  }
});

function extractMockSkills(workflow, nodes, connections) {
  const skills = [];
  const nodeTypes = nodes.map(n => n.type);

  // Targeting skill: segment/filter/exclude/query/build_audience nodes
  const targetingNodes = nodes.filter(n =>
    ['segment', 'filter', 'exclude', 'query', 'build_audience', 'deduplication', 'enrichment'].includes(n.type));
  if (targetingNodes.length > 0) {
    const typeToAction = { segment: 'target', filter: 'filter', exclude: 'filter', query: 'target', build_audience: 'target', deduplication: 'filter', enrichment: 'enrich' };
    const steps = targetingNodes.map((n, i) => ({
      step: i + 1,
      action: typeToAction[n.type] || 'target',
      instruction: typeToAction[n.type] === 'filter' ? `Apply filter: ${n.name}` : `Select segment "${n.name}"`,
      node_ref: n.id
    }));
    skills.push({
      name: 'Audience Targeting Strategy',
      description: `Targets and filters the audience using ${targetingNodes.length} step(s): ${targetingNodes.map(n => n.name).join(', ')}. Reuse this pattern when you need similar audience selection logic.`,
      category: 'targeting',
      node_ids: targetingNodes.map(n => n.id),
      steps,
      prompt_template: steps.map(s => s.step + '. ' + s.instruction).join('\n'),
      input_schema: { segment_id: 'number', filter_criteria: 'object' },
      output_schema: { audience_size: 'number', filtered_contacts: 'array' }
    });
  }

  // Timing skill: wait nodes and their surrounding context
  const waitNodes = nodes.filter(n => n.type === 'wait');
  if (waitNodes.length > 0) {
    const timingDesc = waitNodes.map(n => {
      const cfg = n.config || {};
      return `${cfg.wait_time || '?'} ${cfg.wait_unit || 'hours'}`;
    }).join(', then ');
    const steps = waitNodes.map((n, i) => {
      const cfg = n.config || {};
      return { step: i + 1, action: 'wait', instruction: `Wait ${cfg.wait_time || '?'} ${cfg.wait_unit || 'hours'}`, node_ref: n.id };
    });
    skills.push({
      name: 'Engagement Timing Cadence',
      description: `Spaces interactions with wait periods: ${timingDesc}. Reuse this cadence pattern for similar campaign types.`,
      category: 'timing',
      node_ids: waitNodes.map(n => n.id),
      steps,
      prompt_template: steps.map(s => s.step + '. ' + s.instruction).join('\n'),
      input_schema: { intervals: 'array', time_unit: 'string' },
      output_schema: { schedule: 'array' }
    });
  }

  // Channel skill: email/sms/push nodes
  const channelNodes = nodes.filter(n => ['email', 'sms', 'push', 'direct_mail'].includes(n.type));
  if (channelNodes.length > 0) {
    const channels = [...new Set(channelNodes.map(n => n.type))];
    const steps = channelNodes.map((n, i) => {
      const step = { step: i + 1, action: 'send', instruction: `Send ${n.name}`, node_ref: n.id };
      if (['email', 'sms', 'push'].includes(n.type)) step.channel = n.type;
      return step;
    });
    skills.push({
      name: channels.length > 1 ? 'Multi-Channel Outreach' : `${channels[0].charAt(0).toUpperCase() + channels[0].slice(1)} Outreach`,
      description: `Delivers messages via ${channels.join(', ')} across ${channelNodes.length} touchpoint(s). Reuse for similar messaging patterns.`,
      category: 'channel',
      node_ids: channelNodes.map(n => n.id),
      steps,
      prompt_template: steps.map(s => s.step + '. ' + s.instruction).join('\n'),
      input_schema: { content_variants: 'object', personalization: 'object' },
      output_schema: { messages_sent: 'number', channels_used: 'array' }
    });
  }

  // Conversion skill: condition + goal nodes
  const conversionNodes = nodes.filter(n => ['condition', 'goal'].includes(n.type));
  if (conversionNodes.length > 0) {
    const steps = conversionNodes.map((n, i) => {
      if (n.type === 'goal') return { step: i + 1, action: 'track', instruction: `Track goal: ${n.name}`, node_ref: n.id };
      return { step: i + 1, action: 'check', instruction: `Check: ${n.name} (${n.config?.condition_type || 'check'})`, node_ref: n.id };
    });
    skills.push({
      name: 'Conversion Tracking & Branching',
      description: `Checks ${conversionNodes.length} condition(s) to branch based on customer behavior: ${conversionNodes.map(n => n.name).join(', ')}. Reuse this decision logic.`,
      category: 'conversion',
      node_ids: conversionNodes.map(n => n.id),
      steps,
      prompt_template: steps.map(s => s.step + '. ' + s.instruction).join('\n'),
      input_schema: { conditions: 'array', time_windows: 'object' },
      output_schema: { converted: 'boolean', branch_taken: 'string' }
    });
  }

  // If we found no distinct patterns, create one holistic skill from the whole workflow
  if (skills.length === 0) {
    const steps = nodes.map((n, i) => ({ step: i + 1, action: 'check', instruction: `Execute: ${n.name}`, node_ref: n.id }));
    skills.push({
      name: `${workflow.name} Strategy`,
      description: `Complete workflow strategy with ${nodes.length} steps. Reuse as a template for similar campaigns.`,
      category: 'content',
      node_ids: nodes.map(n => n.id),
      steps,
      prompt_template: steps.map(s => s.step + '. ' + s.instruction).join('\n'),
      input_schema: { campaign_name: 'string' },
      output_schema: { completed: 'boolean' }
    });
  }

  return skills;
}

// ── CRUD endpoints ──────────────────────────────────────────

// List all skills
router.get('/', (req, res) => {
  try {
    const { category, status } = req.query;
    let skills = query.all('agent_skills');
    if (category) skills = skills.filter(s => s.category === category);
    if (status) skills = skills.filter(s => s.status === status);
    res.json(skills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single skill
router.get('/:id', (req, res) => {
  try {
    const skill = query.get('agent_skills', parseInt(req.params.id));
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    res.json(skill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create skill(s) — accepts a single object or an array
router.post('/', (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const created = [];
    const now = new Date().toISOString();

    for (const item of items) {
      if (!item.name) continue;
      const result = query.insert('agent_skills', {
        name: item.name,
        description: item.description || '',
        category: item.category || 'content',
        source_workflow_id: item.source_workflow_id || null,
        scope: item.scope || 'workflow',
        node_ids: item.node_ids || [],
        node_snapshot: item.node_snapshot || null,
        steps: item.steps || [],
        prompt_template: item.prompt_template || '',
        input_schema: item.input_schema || {},
        output_schema: item.output_schema || {},
        version: 1,
        status: item.status || 'active',
        created_by: item.created_by || 'System',
        created_at: now,
        updated_at: now
      });
      created.push(result.record);
    }

    res.status(201).json(created.length === 1 ? created[0] : created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update skill
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('agent_skills', id);
    if (!existing) return res.status(404).json({ error: 'Skill not found' });

    const updates = { ...req.body };
    delete updates.id;
    delete updates.created_at;
    updates.updated_at = new Date().toISOString();

    query.update('agent_skills', id, updates);
    res.json(query.get('agent_skills', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete skill
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('agent_skills', id);
    if (!existing) return res.status(404).json({ error: 'Skill not found' });
    query.delete('agent_skills', id);
    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
