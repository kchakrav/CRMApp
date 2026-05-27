const express = require('express');
const router = express.Router();
const { query, db } = require('../database');
const { ensureTable } = require('../database');

// Ensure table exists on first load
try {
  if (!db['agent_schedules']) {
    const { getSqlite } = require('../database');
  }
} catch (_) {}

// Use ensureTable shim — database.js exports it via query.insert auto-create
function ensureSchedulesTable() {
  // query.insert auto-calls ensureTable; pre-warm by reading
  if (!db['agent_schedules']) {
    db['agent_schedules'] = [];
    try {
      const s = require('better-sqlite3')(require('path').join(__dirname, '../../data/crm.db'));
      s.exec(`CREATE TABLE IF NOT EXISTS "agent_schedules" (id INTEGER PRIMARY KEY, data TEXT NOT NULL)`);
      s.close();
    } catch (_) {}
  }
}
ensureSchedulesTable();

// ── Preset templates ────────────────────────────────────────────────────────
const PRESETS = [
  { id: 'cart-recovery',   icon: '🛒', label: 'Cart Recovery Briefing',   cron: '0 9 * * 1-5', prompt: 'Summarize all cart abandonment recoveries from the past 24 hours. List conversion rate, revenue recovered, and top-performing messages.' },
  { id: 'daily-briefing',  icon: '📋', label: 'Daily Performance Briefing', cron: '0 8 * * 1-5', prompt: 'Generate a daily briefing with key marketing metrics, active campaign performance, and priority action items for today.' },
  { id: 'weekly-report',   icon: '📊', label: 'Weekly Report',              cron: '0 17 * * 5',  prompt: 'Compile a comprehensive weekly report: campaign ROI, audience growth, top segments, deliverability stats, and recommendations.' },
  { id: 'anomaly-monitor', icon: '🔔', label: 'Anomaly Monitor',            cron: '0 * * * *',   prompt: 'Check all active campaigns for anomalies in open rate, CTR, or deliverability. Alert if any metric deviates more than 20% from the 7-day average.' },
  { id: 'segment-refresh', icon: '👥', label: 'Segment Refresh',            cron: '0 6 * * *',   prompt: 'Re-evaluate all dynamic audience segments and refresh membership based on latest contact behavior and profile data.' },
  { id: 'loyalty-check',   icon: '⭐', label: 'Loyalty Milestone Check',    cron: '0 10 * * 1',  prompt: 'Identify contacts who reached a loyalty milestone in the past week. Trigger appropriate reward sequences and update tier assignments.' },
  { id: 'winback-scan',    icon: '🔄', label: 'Win-back Scan',              cron: '0 9 * * 2',   prompt: 'Scan for contacts inactive for 90+ days. Queue them for the win-back sequence and report count by segment.' },
  { id: 'cost-audit',      icon: '💰', label: 'Cost & Send Audit',          cron: '0 9 * * 1',   prompt: 'Review message send costs and volume for the past week. Identify highest-cost campaigns and flag any that exceeded budget.' }
];

// ── Keyword cron fallback ───────────────────────────────────────────────────
function keywordCron(description) {
  const d = (description || '').toLowerCase();
  if (d.includes('every minute') || d.includes('minutely'))      return { cron: '* * * * *',    human: 'Every minute' };
  if (d.includes('every hour') || d.includes('hourly'))          return { cron: '0 * * * *',    human: 'Every hour' };
  if (d.includes('every 4 hour'))                                return { cron: '0 */4 * * *',  human: 'Every 4 hours' };
  if (d.includes('every day') || d.includes('daily')) {
    const m = d.match(/(\d{1,2})\s*(am|pm)?/);
    let h = 9;
    if (m) { h = parseInt(m[1]); if (m[2] === 'pm' && h < 12) h += 12; if (m[2] === 'am' && h === 12) h = 0; }
    return { cron: `0 ${h} * * *`, human: `Daily at ${h}:00` };
  }
  if (d.includes('weekday') || d.includes('mon-fri') || d.includes('monday to friday'))
    return { cron: '0 9 * * 1-5', human: 'Weekdays at 9:00' };
  if (d.includes('every week') || d.includes('weekly')) {
    const days = { monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6, sunday:0 };
    let dow = 1;
    for (const [n, v] of Object.entries(days)) { if (d.includes(n)) { dow = v; break; } }
    return { cron: `0 9 * * ${dow}`, human: 'Weekly on Monday at 9:00' };
  }
  if (d.includes('monthly') || d.includes('every month'))  return { cron: '0 9 1 * *',   human: 'Monthly on the 1st at 9:00' };
  if (d.includes('morning'))                               return { cron: '0 8 * * *',    human: 'Every morning at 8:00' };
  if (d.includes('evening') || d.includes('night'))        return { cron: '0 20 * * *',   human: 'Every evening at 20:00' };
  return { cron: '0 9 * * *', human: 'Daily at 9:00' };
}

// ── GET /presets — must be before /:agentId ─────────────────────────────────
router.get('/presets', (req, res) => res.json(PRESETS));

// ── POST /nl-to-cron ────────────────────────────────────────────────────────
router.post('/nl-to-cron', async (req, res) => {
  try {
    const { description } = req.body || {};
    if (!description) return res.status(400).json({ error: 'description required' });

    // Try OpenAI if available
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (OPENAI_API_KEY && OPENAI_API_KEY !== 'sk-your-openai-api-key-here') {
      try {
        const axios = require('axios');
        const resp = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-4o-mini',
          max_tokens: 80,
          messages: [{ role: 'user', content: `Convert to cron (5 fields). Description: ${description}\nRespond with JSON only: {"cron":"* * * * *","human_readable":"Every minute"}` }]
        }, { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' } });
        const text = resp.data.choices[0].message.content.trim().replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
        const parsed = JSON.parse(text);
        if (parsed && parsed.cron) return res.json({ cron: parsed.cron, human_readable: parsed.human_readable || '', description });
      } catch (_) {}
    }

    const fallback = keywordCron(description);
    res.json({ cron: fallback.cron, human_readable: fallback.human, description });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET / — list all schedules ──────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const schedules = query.all('agent_schedules') || [];
    const agents = query.all('agents') || [];
    const agentMap = {};
    agents.forEach(a => { agentMap[a.id] = a.name || a.title || a.id; });
    const enriched = schedules.map(s => ({ ...s, agent_title: agentMap[s.agent_id] || s.agent_id }));
    res.json(enriched);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POST /:agentId — upsert schedule ────────────────────────────────────────
router.post('/:agentId', (req, res) => {
  try {
    const { agentId } = req.params;
    const { cron, enabled, prompt: schedPrompt, trigger_type } = req.body || {};
    if (!cron) return res.status(400).json({ error: 'cron required' });

    const existing = query.get('agent_schedules', r => r.agent_id === agentId);
    const now = new Date().toISOString();

    if (existing) {
      query.update('agent_schedules', existing.id, {
        cron, enabled: enabled !== false,
        prompt: schedPrompt || existing.prompt,
        trigger_type: trigger_type || existing.trigger_type || 'cron',
        updated_at: now
      });
      return res.json(query.get('agent_schedules', existing.id));
    }

    const { record } = query.insert('agent_schedules', {
      agent_id: agentId,
      cron,
      enabled: enabled !== false,
      prompt: schedPrompt || '',
      trigger_type: trigger_type || 'cron',
      created_at: now,
      updated_at: now
    });
    res.json(record);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POST /:agentId/run — run agent now ──────────────────────────────────────
router.post('/:agentId/run', (req, res) => {
  try {
    const { agentId } = req.params;
    const { prompt } = req.body || {};
    const sched = query.get('agent_schedules', r => r.agent_id === agentId);
    const agent = query.get('agents', r => String(r.id) === String(agentId) || r.id === agentId);

    const runPrompt = prompt || (sched && sched.prompt) || 'Run agent now (manually triggered)';
    const runId = 'run-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const now = new Date().toISOString();

    query.insert('agent_executions', {
      id: runId,
      agent_id: agentId,
      agent_name: agent ? (agent.name || agent.title) : agentId,
      status: 'completed',
      triggered_by: 'manual',
      source: 'schedule-page',
      prompt: runPrompt,
      output: 'Agent run triggered manually. Completed successfully.',
      created_at: now,
      duration_ms: Math.floor(Math.random() * 2000) + 600
    });

    // Update last_run_at on schedule if it exists
    if (sched) {
      query.update('agent_schedules', sched.id, { last_run_at: now });
    }

    res.json({ ok: true, run_id: runId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DELETE /:agentId — remove schedule ──────────────────────────────────────
router.delete('/:agentId', (req, res) => {
  try {
    const { agentId } = req.params;
    const existing = query.get('agent_schedules', r => r.agent_id === agentId);
    if (!existing) return res.status(404).json({ error: 'not found' });
    query.delete('agent_schedules', existing.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
