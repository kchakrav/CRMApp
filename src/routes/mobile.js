const express = require('express');
const router = express.Router();
const { query } = require('../database');
const crypto = require('crypto');
const os = require('os');
const QRCode = require('qrcode');

// In-memory token store (token → { created_at, expires_at })
const _tokens = new Map();
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

// ── POST /token — generate a mobile access token ─────────────────────────────
router.post('/token', (req, res) => {
  try {
    const token = crypto.randomBytes(16).toString('hex');
    const now = Date.now();
    _tokens.set(token, { created_at: new Date(now).toISOString(), expires_at: new Date(now + TOKEN_TTL_MS).toISOString() });

    // Prune expired tokens
    for (const [t, meta] of _tokens) {
      if (new Date(meta.expires_at) < new Date()) _tokens.delete(t);
    }

    const port = process.env.PORT || 3000;
    const ip = getLocalIP();
    const mobileUrl = `http://${ip}:${port}/mobile.html?token=${token}`;
    res.json({ token, mobile_url: mobileUrl, expires_at: new Date(now + TOKEN_TTL_MS).toISOString() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /qr?url=... — generate QR code as PNG (no external service) ──────────
router.get('/qr', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'url param required' });
    const png = await QRCode.toBuffer(url, { type: 'png', width: 220, margin: 2,
      color: { dark: '#000000', light: '#ffffff' } });
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'no-store');
    res.send(png);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /validate/:token ──────────────────────────────────────────────────────
router.get('/validate/:token', (req, res) => {
  const meta = _tokens.get(req.params.token);
  if (!meta) return res.status(401).json({ valid: false, error: 'Invalid or expired token' });
  if (new Date(meta.expires_at) < new Date()) {
    _tokens.delete(req.params.token);
    return res.status(401).json({ valid: false, error: 'Token expired' });
  }
  res.json({ valid: true, expires_at: meta.expires_at });
});

// ── GET /server-info ──────────────────────────────────────────────────────────
router.get('/server-info', (req, res) => {
  const port = process.env.PORT || 3000;
  const ip = getLocalIP();
  res.json({ ip, port, base_url: `http://${ip}:${port}` });
});

// ── GET /agents — list agents for mobile ────────────────────────────────────
router.get('/agents', (req, res) => {
  try {
    const agents = query.all('agents') || [];
    res.json(agents.slice(0, 20).map(a => ({
      id: a.id,
      name: a.name || a.title || String(a.id),
      type: a.type || a.agent_type || 'agent',
      status: a.status || 'active',
      description: a.description || ''
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /runs — recent agent runs for mobile ─────────────────────────────────
router.get('/runs', (req, res) => {
  try {
    const runs = query.all('agent_executions') || [];
    res.json(runs.slice(0, 30).map(r => ({
      id: r.id,
      agent_id: r.agent_id,
      agent_name: r.agent_name || r.agent_id,
      status: r.status || 'unknown',
      created_at: r.created_at,
      duration_ms: r.duration_ms,
      triggered_by: r.triggered_by || 'system',
      output: r.output ? String(r.output).slice(0, 200) : ''
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /schedules — schedules for mobile ────────────────────────────────────
router.get('/schedules', (req, res) => {
  try {
    const schedules = query.all('agent_schedules') || [];
    const agents = query.all('agents') || [];
    const agentMap = {};
    agents.forEach(a => { agentMap[a.id] = a.name || a.title || String(a.id); });
    res.json(schedules.map(s => ({ ...s, agent_title: agentMap[s.agent_id] || s.agent_id })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
