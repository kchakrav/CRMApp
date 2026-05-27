const express = require('express');
const router = express.Router();
const { query } = require('../database');
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function callOpenAI(prompt, systemMessage) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-your-openai-api-key-here') return null;
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.choices[0].message.content;
  } catch (e) {
    return null;
  }
}

const sampleContact = {
  id: 'test-001', email: 'test@example.com', first_name: 'Alex', last_name: 'Chen',
  age: 34, gender: 'F', city: 'San Francisco', country: 'US',
  total_purchases: 8, lifetime_value: 1240, last_purchase_days_ago: 12,
  email_open_rate: 0.42, email_click_rate: 0.18, loyalty_tier: 'Gold',
  last_interaction: 'Clicked summer sale email, added 2 items to cart'
};

function getContactSummary(contact) {
  return `Name: ${contact.first_name} ${contact.last_name}, Email: ${contact.email}, ` +
    `Age: ${contact.age}, City: ${contact.city}, Country: ${contact.country}, ` +
    `Total Purchases: ${contact.total_purchases}, Lifetime Value: $${contact.lifetime_value}, ` +
    `Last Purchase: ${contact.last_purchase_days_ago} days ago, ` +
    `Email Open Rate: ${contact.email_open_rate}, Click Rate: ${contact.email_click_rate}, ` +
    `Loyalty Tier: ${contact.loyalty_tier}, Last Interaction: ${contact.last_interaction}`;
}

function getMockOutput(nodeType, config) {
  switch (nodeType) {
    case 'ai_branch':
      return { result: true, confidence: 0.78, reasoning: 'Mock: contact meets criteria' };
    case 'ai_classifier':
      return { class: config.classes?.[0] || 'category_a', confidence: 0.82, scores: {} };
    case 'ai_scorer':
      return { score: 0.74, tier: 'high', factors: 'Mock: recency, engagement, LTV' };
    case 'ai_personalize':
      return { content: config.template || 'Hi {{first_name}}, we have an exclusive offer for you!', variant_id: 'v1', tokens_used: 0 };
    case 'ai_sentiment':
      return { sentiment: 'positive', score: 0.6, signals: 'Mock: recent engagement' };
    case 'ai_next_best_action':
      return { action: config.actions?.split(',')[0]?.trim() || 'send_email', confidence: 0.71, alternatives: '' };
    case 'ai_enrich':
      return { enriched_fields: { predicted_age_group: '30-40', income_bracket: 'medium-high' }, fields_count: 2 };
    case 'ai_content_eval':
      return { quality_score: 7.5, passed: true, feedback: 'Mock: content meets quality threshold' };
    default:
      return { result: true, confidence: 0.75, message: 'Mock output - configure OpenAI for real AI execution' };
  }
}

function buildPrompt(nodeType, config, contactSummary) {
  switch (nodeType) {
    case 'ai_branch':
      return {
        system: 'You are an AI workflow node that evaluates conditions on CRM contacts. Always respond with valid JSON only.',
        user: `Given this contact: ${contactSummary}, evaluate: ${config.prompt || 'Is this a high-value customer?'}. Respond with JSON: {"result": boolean, "confidence": 0-1, "reasoning": string}`
      };
    case 'ai_classifier':
      return {
        system: 'You are an AI classification node for CRM contacts. Always respond with valid JSON only.',
        user: `Classify this contact into one of [${config.classes || 'high_value, medium_value, low_value'}]. Contact: ${contactSummary}. Respond JSON: {"class": string, "confidence": number, "scores": {}}`
      };
    case 'ai_scorer':
      return {
        system: 'You are an AI scoring node for CRM contacts. Always respond with valid JSON only.',
        user: `Score this contact on '${config.dimension || 'engagement'}' from 0-1. Contact: ${contactSummary}. JSON: {"score": number, "tier": string, "factors": string}`
      };
    case 'ai_personalize':
      return {
        system: 'You are an AI personalization node for CRM marketing. Always respond with valid JSON only.',
        user: `Generate personalized content using template: ${config.template || 'Hi {{first_name}}, we have a special offer for you!'}. Contact: ${contactSummary}. Return JSON: {"content": string, "variant_id": string}`
      };
    case 'ai_sentiment':
      return {
        system: 'You are an AI sentiment analysis node for CRM contacts. Always respond with valid JSON only.',
        user: `Analyze sentiment of last_interaction. Contact: ${contactSummary}. JSON: {"sentiment": string, "score": number, "signals": string}`
      };
    case 'ai_next_best_action':
      return {
        system: 'You are an AI next-best-action recommendation node for CRM. Always respond with valid JSON only.',
        user: `Recommend next best action from: ${config.actions || 'send_email, send_sms, wait, no_action'}. Contact: ${contactSummary}. JSON: {"action": string, "confidence": number, "alternatives": string}`
      };
    case 'ai_enrich':
      return {
        system: 'You are an AI contact enrichment node for CRM. Always respond with valid JSON only.',
        user: `Infer missing profile fields: ${config.fields || 'predicted_age_group, income_bracket, interests'}. Contact: ${contactSummary}. JSON: {"enriched_fields": {}, "fields_count": number}`
      };
    case 'ai_content_eval':
      return {
        system: 'You are an AI content quality evaluation node. Always respond with valid JSON only.',
        user: `Evaluate content quality: ${config.content || 'Sample marketing email content'}. JSON: {"quality_score": number 0-10, "passed": boolean, "feedback": string}`
      };
    default:
      return null;
  }
}

// Cost per contact by node type
function getCostPerContact(nodeType) {
  switch (nodeType) {
    case 'ai_branch':
    case 'ai_classifier':
    case 'ai_scorer':
      return 0.0001;
    case 'ai_personalize':
    case 'ai_content_eval':
    case 'ai_translate':
      return 0.0003;
    case 'ai_agent':
      return 0.0005;
    default:
      return 0.00005;
  }
}

// Node type -> output variables mapping
function getOutputVariables(nodeType) {
  switch (nodeType) {
    case 'ai_branch':
      return [
        { key: 'result', type: 'boolean', description: 'Branch decision' },
        { key: 'confidence', type: 'number', description: 'Confidence score 0-1' },
        { key: 'reasoning', type: 'string', description: 'AI explanation' }
      ];
    case 'ai_classifier':
      return [
        { key: 'class', type: 'string', description: 'Assigned class' },
        { key: 'confidence', type: 'number', description: 'Confidence score 0-1' },
        { key: 'scores', type: 'object', description: 'Per-class scores' }
      ];
    case 'ai_scorer':
      return [
        { key: 'score', type: 'number', description: 'Score 0-1' },
        { key: 'tier', type: 'string', description: 'high/medium/low' },
        { key: 'factors', type: 'string', description: 'Factors influencing score' }
      ];
    case 'ai_personalize':
      return [
        { key: 'content', type: 'string', description: 'Personalized content' },
        { key: 'variant_id', type: 'string', description: 'Content variant identifier' },
        { key: 'tokens_used', type: 'number', description: 'Tokens consumed' }
      ];
    case 'ai_next_best_action':
      return [
        { key: 'action', type: 'string', description: 'Recommended action' },
        { key: 'confidence', type: 'number', description: 'Confidence score 0-1' },
        { key: 'alternatives', type: 'string', description: 'Alternative actions' }
      ];
    case 'ai_enrich':
      return [
        { key: 'enriched_fields', type: 'object', description: 'Added field values' },
        { key: 'fields_count', type: 'number', description: 'Number of fields added' }
      ];
    case 'ai_sentiment':
      return [
        { key: 'sentiment', type: 'string', description: 'positive/neutral/negative' },
        { key: 'score', type: 'number', description: '-1 to 1' },
        { key: 'signals', type: 'string', description: 'Sentiment signals detected' }
      ];
    case 'ai_agent':
      return [
        { key: 'agent_output', type: 'object', description: 'Agent execution result' },
        { key: 'actions_taken', type: 'string', description: 'Actions performed' },
        { key: 'duration_ms', type: 'number', description: 'Execution duration in milliseconds' }
      ];
    case 'ai_skill':
      return [
        { key: 'skill_output', type: 'object', description: 'Skill execution result' },
        { key: 'steps_completed', type: 'number', description: 'Number of steps completed' }
      ];
    case 'context_store':
      return [
        { key: 'stored_key', type: 'string', description: 'Key that was stored' },
        { key: 'success', type: 'boolean', description: 'Whether store succeeded' }
      ];
    case 'context_recall':
      return [
        { key: 'value', type: 'string', description: 'Recalled value' },
        { key: 'found', type: 'boolean', description: 'Whether key was found' }
      ];
    case 'ai_content_eval':
      return [
        { key: 'quality_score', type: 'number', description: '0-10 quality score' },
        { key: 'passed', type: 'boolean', description: 'Whether content passed evaluation' },
        { key: 'feedback', type: 'string', description: 'Evaluation feedback' }
      ];
    case 'outcome_tracker':
      return [
        { key: 'outcome_recorded', type: 'boolean', description: 'Whether outcome was recorded' },
        { key: 'metric_value', type: 'number', description: 'Recorded metric value' }
      ];
    default:
      return [
        { key: 'result', type: 'object', description: 'Node output' }
      ];
  }
}

// POST /api/ai-nodes/test
router.post('/test', async (req, res) => {
  try {
    const { nodeId, nodeType, config = {}, workflowId } = req.body;

    if (!nodeType) {
      return res.status(400).json({ error: 'nodeType is required' });
    }

    const contactSummary = getContactSummary(sampleContact);
    const promptParts = buildPrompt(nodeType, config, contactSummary);

    // Estimate tokens and cost
    const estimatedPromptTokens = 200;
    const estimatedCompletionTokens = 100;
    const inputCostPer1M = 0.15;
    const outputCostPer1M = 0.60;
    const cost_estimate_usd = parseFloat(
      ((estimatedPromptTokens / 1_000_000) * inputCostPer1M +
       (estimatedCompletionTokens / 1_000_000) * outputCostPer1M).toFixed(6)
    );
    const tokens_used = estimatedPromptTokens + estimatedCompletionTokens;

    let output = null;
    let usedOpenAI = false;

    if (promptParts) {
      const rawResponse = await callOpenAI(promptParts.user, promptParts.system);
      if (rawResponse) {
        try {
          // Try to extract JSON from response
          const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            output = JSON.parse(jsonMatch[0]);
            usedOpenAI = true;
          }
        } catch (parseErr) {
          // Fall back to mock
        }
      }
    }

    if (!output) {
      output = getMockOutput(nodeType, config);
    }

    return res.json({
      success: true,
      output,
      explanation: usedOpenAI
        ? `AI node '${nodeType}' executed successfully against sample contact data.`
        : `Mock output returned — configure a valid OPENAI_API_KEY for live AI execution.`,
      model: usedOpenAI ? 'gpt-4o-mini' : 'mock',
      tokens_used: usedOpenAI ? tokens_used : 0,
      cost_estimate_usd: usedOpenAI ? cost_estimate_usd : 0
    });
  } catch (err) {
    console.error('[AI Nodes] Test error:', err.message);
    return res.status(500).json({ error: 'Failed to test AI node', details: err.message });
  }
});

// GET /api/ai-nodes/cost-estimate
router.get('/cost-estimate', (req, res) => {
  try {
    const { workflowId, contactCount } = req.query;

    if (!workflowId || !contactCount) {
      return res.status(400).json({ error: 'workflowId and contactCount are required' });
    }

    const count = parseInt(contactCount, 10);
    if (isNaN(count) || count < 0) {
      return res.status(400).json({ error: 'contactCount must be a non-negative integer' });
    }

    // Look up workflow orchestration
    const orch = query.get('workflow_orchestrations', r => String(r.workflow_id) === String(workflowId));
    if (!orch) {
      return res.status(404).json({ error: 'Workflow orchestration not found' });
    }

    let nodes = [];
    try {
      const data = typeof orch.data === 'string' ? JSON.parse(orch.data) : orch.data;
      nodes = Array.isArray(data?.nodes) ? data.nodes : [];
    } catch (_) {
      nodes = [];
    }

    const aiNodes = nodes.filter(n => n.category === 'ai');

    const breakdown = aiNodes.map(node => {
      const costPerContact = getCostPerContact(node.type);
      const totalCost = parseFloat((costPerContact * count).toFixed(6));
      return {
        node_id: node.id || node.node_id || '',
        node_type: node.type || '',
        node_name: node.name || node.label || node.type || '',
        cost_per_contact: costPerContact,
        total_cost: totalCost
      };
    });

    const estimated_cost_usd = parseFloat(
      breakdown.reduce((sum, b) => sum + b.total_cost, 0).toFixed(6)
    );

    return res.json({
      ai_node_count: aiNodes.length,
      contact_count: count,
      estimated_cost_usd,
      breakdown
    });
  } catch (err) {
    console.error('[AI Nodes] Cost estimate error:', err.message);
    return res.status(500).json({ error: 'Failed to compute cost estimate', details: err.message });
  }
});

// POST /api/ai-nodes/context/store
router.post('/context/store', (req, res) => {
  try {
    const { contact_id, workflow_id, node_id, key, value } = req.body;

    if (!contact_id || !workflow_id || !node_id || !key) {
      return res.status(400).json({ error: 'contact_id, workflow_id, node_id, and key are required' });
    }

    // Check if record already exists
    const existing = query.get('ai_node_contexts', r =>
      String(r.contact_id) === String(contact_id) &&
      String(r.workflow_id) === String(workflow_id) &&
      String(r.node_id) === String(node_id) &&
      r.key === key
    );

    if (existing) {
      query.update('ai_node_contexts', existing.id, { value, updated_at: new Date().toISOString() });
    } else {
      query.insert('ai_node_contexts', {
        contact_id,
        workflow_id,
        node_id,
        key,
        value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[AI Nodes] Context store error:', err.message);
    return res.status(500).json({ error: 'Failed to store context', details: err.message });
  }
});

// GET /api/ai-nodes/context/recall
router.get('/context/recall', (req, res) => {
  try {
    const { contact_id, workflow_id, node_id, key } = req.query;

    if (!contact_id || !workflow_id) {
      return res.status(400).json({ error: 'contact_id and workflow_id are required' });
    }

    const contexts = query.all('ai_node_contexts', r => {
      if (String(r.contact_id) !== String(contact_id)) return false;
      if (String(r.workflow_id) !== String(workflow_id)) return false;
      if (node_id && String(r.node_id) !== String(node_id)) return false;
      if (key && r.key !== key) return false;
      return true;
    });

    return res.json({
      contexts: contexts.map(c => ({
        contact_id: c.contact_id,
        workflow_id: c.workflow_id,
        node_id: c.node_id,
        key: c.key,
        value: c.value,
        updated_at: c.updated_at
      }))
    });
  } catch (err) {
    console.error('[AI Nodes] Context recall error:', err.message);
    return res.status(500).json({ error: 'Failed to recall context', details: err.message });
  }
});

// GET /api/ai-nodes/hitl/pending
router.get('/hitl/pending', (req, res) => {
  try {
    const { workflow_id } = req.query;

    if (!workflow_id) {
      return res.status(400).json({ error: 'workflow_id is required' });
    }

    const approvals = query.all('ai_hitl_approvals', r =>
      String(r.workflow_id) === String(workflow_id) && r.status === 'pending'
    );

    return res.json({
      approvals: approvals.map(a => ({
        id: a.id,
        node_id: a.node_id,
        workflow_id: a.workflow_id,
        contact_id: a.contact_id,
        question: a.question,
        options: a.options,
        ai_recommendation: a.ai_recommendation,
        status: a.status,
        created_at: a.created_at
      }))
    });
  } catch (err) {
    console.error('[AI Nodes] HITL pending error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve pending approvals', details: err.message });
  }
});

// POST /api/ai-nodes/hitl/:id/decide
router.post('/hitl/:id/decide', (req, res) => {
  try {
    const { id } = req.params;
    const { decision, decided_by } = req.body;

    if (!decision) {
      return res.status(400).json({ error: 'decision is required' });
    }

    const normalizedDecision = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : decision;
    if (!['approved', 'rejected'].includes(normalizedDecision)) {
      return res.status(400).json({ error: "decision must be 'approved' or 'rejected'" });
    }

    const numId = parseInt(id, 10);
    const approval = query.get('ai_hitl_approvals', numId);
    if (!approval) {
      return res.status(404).json({ error: 'Approval not found' });
    }

    const updated = query.update('ai_hitl_approvals', numId, {
      status: normalizedDecision,
      decided_by: decided_by || null,
      decided_at: new Date().toISOString()
    });

    if (!updated) {
      return res.status(500).json({ error: 'Failed to update approval' });
    }

    const refreshed = query.get('ai_hitl_approvals', numId);
    return res.json({ success: true, approval: refreshed });
  } catch (err) {
    console.error('[AI Nodes] HITL decide error:', err.message);
    return res.status(500).json({ error: 'Failed to record decision', details: err.message });
  }
});

// GET /api/ai-nodes/variables/:workflowId
router.get('/variables/:workflowId', (req, res) => {
  try {
    const { workflowId } = req.params;

    const orch = query.get('workflow_orchestrations', r => String(r.workflow_id) === String(workflowId));
    if (!orch) {
      return res.status(404).json({ error: 'Workflow orchestration not found' });
    }

    let nodes = [];
    try {
      const data = typeof orch.data === 'string' ? JSON.parse(orch.data) : orch.data;
      nodes = Array.isArray(data?.nodes) ? data.nodes : [];
    } catch (_) {
      nodes = [];
    }

    const aiNodes = nodes.filter(n => n.category === 'ai');

    const variables = aiNodes.map(node => ({
      node_id: node.id || node.node_id || '',
      node_name: node.name || node.label || node.type || '',
      node_type: node.type || '',
      variables: getOutputVariables(node.type)
    }));

    return res.json({ variables });
  } catch (err) {
    console.error('[AI Nodes] Variables error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve node variables', details: err.message });
  }
});

module.exports = router;
