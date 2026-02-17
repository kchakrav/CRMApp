/**
 * Email Sending Service — Brevo (formerly Sendinblue) via Nodemailer SMTP
 * 
 * Uses nodemailer with Brevo's SMTP relay.
 * Free tier: 300 emails/day.
 * 
 * Required env vars (or runtime config persisted to data/email-config.json):
 *   BREVO_SMTP_KEY     – Your Brevo SMTP key (from https://app.brevo.com/settings/keys/smtp)
 *   BREVO_FROM_EMAIL   – Verified sender email address
 *   BREVO_FROM_NAME    – Display name for the sender (optional, defaults to "CRM Marketing")
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../../data/email-config.json');

let _transporter = null;
let _enabled = true; // Whether sending is enabled (user can toggle off to conserve quota)

// ── Persistent config helpers ─────────────────────────────────
function _loadSavedConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      // Only apply saved values if the env var is not already set (env takes precedence)
      if (data.BREVO_SMTP_KEY && !process.env.BREVO_SMTP_KEY) {
        process.env.BREVO_SMTP_KEY = data.BREVO_SMTP_KEY;
      }
      if (data.BREVO_SMTP_LOGIN && !process.env.BREVO_SMTP_LOGIN) {
        process.env.BREVO_SMTP_LOGIN = data.BREVO_SMTP_LOGIN;
      }
      if (data.BREVO_FROM_EMAIL && !process.env.BREVO_FROM_EMAIL) {
        process.env.BREVO_FROM_EMAIL = data.BREVO_FROM_EMAIL;
      }
      if (data.BREVO_FROM_NAME && !process.env.BREVO_FROM_NAME) {
        process.env.BREVO_FROM_NAME = data.BREVO_FROM_NAME;
      }
      if (data.BREVO_SMTP_PORT && !process.env.BREVO_SMTP_PORT) {
        process.env.BREVO_SMTP_PORT = data.BREVO_SMTP_PORT;
      }
      // Restore enabled/disabled state (default to true if not stored)
      if (data.BREVO_ENABLED !== undefined) {
        _enabled = !!data.BREVO_ENABLED;
      }
    }
  } catch (err) {
    console.error('[Brevo] Failed to load saved config:', err.message);
  }
}

function saveConfig() {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = { BREVO_ENABLED: _enabled };
    if (process.env.BREVO_SMTP_KEY) data.BREVO_SMTP_KEY = process.env.BREVO_SMTP_KEY;
    if (process.env.BREVO_SMTP_LOGIN) data.BREVO_SMTP_LOGIN = process.env.BREVO_SMTP_LOGIN;
    if (process.env.BREVO_FROM_EMAIL) data.BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL;
    if (process.env.BREVO_FROM_NAME) data.BREVO_FROM_NAME = process.env.BREVO_FROM_NAME;
    if (process.env.BREVO_SMTP_PORT) data.BREVO_SMTP_PORT = process.env.BREVO_SMTP_PORT;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[Brevo] Failed to save config:', err.message);
  }
}

// ── Configuration ─────────────────────────────────────────────
function hasCredentials() {
  return !!(process.env.BREVO_SMTP_KEY && process.env.BREVO_FROM_EMAIL);
}

function isConfigured() {
  return hasCredentials() && _enabled;
}

function isEnabled() {
  return _enabled;
}

function setEnabled(enabled) {
  _enabled = !!enabled;
  if (_enabled && hasCredentials()) {
    _buildTransporter();
  } else if (!_enabled) {
    _transporter = null;
  }
  saveConfig();
}

function _buildTransporter(port) {
  if (!isConfigured()) { _transporter = null; return; }
  const usePort = port || parseInt(process.env.BREVO_SMTP_PORT) || 587;
  const useSecure = usePort === 465; // port 465 uses implicit TLS
  _transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: usePort,
    secure: useSecure,
    auth: {
      user: process.env.BREVO_SMTP_LOGIN || process.env.BREVO_FROM_EMAIL,
      pass: process.env.BREVO_SMTP_KEY
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
  _transporter._brevoPort = usePort; // Track which port we're using
}

function init() {
  // Load any previously saved config from disk (e.g. from runtime configure)
  _loadSavedConfig();

  if (hasCredentials() && _enabled) {
    _buildTransporter();
    console.log('✅ Brevo SMTP configured — from:', process.env.BREVO_FROM_EMAIL);
  } else if (hasCredentials() && !_enabled) {
    _transporter = null;
    console.log('⏸️  Brevo SMTP configured but disabled (paused to conserve quota)');
  } else {
    console.log('⚠️  Brevo not configured — email sending disabled');
    console.log('   Set BREVO_SMTP_KEY and BREVO_FROM_EMAIL in .env to enable');
  }
}

// ── Helpers ───────────────────────────────────────────────────
function _from() {
  return `"${process.env.BREVO_FROM_NAME || 'CRM Marketing'}" <${process.env.BREVO_FROM_EMAIL}>`;
}

function _injectPreheader(html, preheader) {
  if (!preheader || !html) return html || '';
  const tag = `<span style="display:none !important;visibility:hidden;mso-hide:all;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>`;
  return tag + html;
}

function _personalizeText(text, contact) {
  if (!text) return text;
  return text
    .replace(/\{\{first_name\}\}/gi, contact.first_name || '')
    .replace(/\{\{last_name\}\}/gi, contact.last_name || '')
    .replace(/\{\{email\}\}/gi, contact.email || '')
    .replace(/\{\{full_name\}\}/gi, [contact.first_name, contact.last_name].filter(Boolean).join(' '));
}

// ── Send a single email ───────────────────────────────────────
async function sendEmail({ to, subject, html, text, preheader }) {
  if (!isConfigured() || !_transporter) {
    return { success: false, error: 'Brevo not configured. Set BREVO_SMTP_KEY and BREVO_FROM_EMAIL in .env' };
  }

  const mailOptions = {
    from: _from(),
    to,
    subject: subject || '(no subject)',
    html: _injectPreheader(html, preheader) || undefined,
    text: text || undefined
  };

  try {
    const info = await _transporter.sendMail(mailOptions);
    console.log(`[Brevo] ✅ Email sent — to: ${to}, messageId: ${info.messageId}, accepted: ${JSON.stringify(info.accepted)}, response: ${info.response || 'n/a'}`);
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      response: info.response
    };
  } catch (err) {
    // If port 587 fails with a connection/greeting error, try port 465 (SSL)
    const isConnectionError = /greeting|connect|ECONN|ETIMEDOUT|socket/i.test(err.message);
    const currentPort = _transporter._brevoPort || 587;
    if (isConnectionError && currentPort !== 465) {
      console.warn(`[Brevo] Port ${currentPort} failed (${err.message}), retrying on port 465 (SSL)...`);
      try {
        _buildTransporter(465);
        const info = await _transporter.sendMail(mailOptions);
        console.log('[Brevo] Port 465 succeeded — using SSL going forward');
        process.env.BREVO_SMTP_PORT = '465';
        saveConfig();
        return {
          success: true,
          messageId: info.messageId,
          accepted: info.accepted
        };
      } catch (fallbackErr) {
        console.error('[Brevo] Port 465 also failed:', fallbackErr.message);
        // Restore original port transporter for next attempt
        _buildTransporter(currentPort);
        return { success: false, error: `Port ${currentPort}: ${err.message} | Port 465: ${fallbackErr.message}` };
      }
    }

    console.error('[Brevo] Send failed:', err.message);
    return { success: false, error: err.message };
  }
}

// ── Send to multiple recipients (one-by-one for personalization) ──
async function sendBulk({ recipients, subject, html, text, preheader }) {
  if (!isConfigured() || !_transporter) {
    return { success: false, sent: 0, failed: 0, error: 'Brevo not configured' };
  }

  const finalHtml = _injectPreheader(html, preheader);
  const from = _from();

  let sent = 0;
  let failed = 0;
  const errors = [];

  // Brevo free tier = 300/day, so we send individually for personalization
  // For high volume, batch in parallel (10 at a time)
  const CONCURRENCY = 10;

  for (let i = 0; i < recipients.length; i += CONCURRENCY) {
    const batch = recipients.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (r) => {
        const personalizedSubject = _personalizeText(r.subject || subject, r);
        const personalizedHtml = _personalizeText(finalHtml, r);
        const toName = [r.first_name, r.last_name].filter(Boolean).join(' ');
        const toAddr = toName ? `"${toName}" <${r.email}>` : r.email;

        return _transporter.sendMail({
          from,
          to: toAddr,
          subject: personalizedSubject || '(no subject)',
          html: personalizedHtml || undefined,
          text: _personalizeText(text, r) || undefined
        });
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        sent++;
      } else {
        failed++;
        errors.push(result.reason?.message || 'Unknown error');
        console.error('[Brevo] Individual send failed:', result.reason?.message);
      }
    }
  }

  return {
    success: failed === 0,
    sent,
    failed,
    total: recipients.length,
    errors: errors.length > 0 ? errors : undefined
  };
}

// ── Send proof/test email ─────────────────────────────────────
async function sendProof({ emails, subject, html, preheader }) {
  if (!isConfigured() || !_transporter) {
    return { success: false, error: 'Brevo not configured' };
  }

  const results = [];
  for (const email of emails) {
    const result = await sendEmail({
      to: email,
      subject: `[PROOF] ${subject || '(no subject)'}`,
      html,
      preheader
    });
    results.push({ email, ...result });
  }

  const sent = results.filter(r => r.success).length;
  return {
    success: sent > 0,
    sent,
    failed: results.length - sent,
    details: results
  };
}

// ── Verify connection ─────────────────────────────────────────
async function verifyConnection() {
  if (!isConfigured() || !_transporter) {
    return { ok: false, error: 'Not configured' };
  }
  try {
    await _transporter.verify();
    return { ok: true, port: _transporter._brevoPort || 587 };
  } catch (err) {
    // If port 587 fails, try port 465 (SSL) as fallback
    const currentPort = _transporter._brevoPort || 587;
    if (currentPort !== 465) {
      console.warn(`[Brevo] Verify on port ${currentPort} failed (${err.message}), trying port 465 (SSL)...`);
      try {
        _buildTransporter(465);
        await _transporter.verify();
        console.log('[Brevo] Port 465 verified — using SSL going forward');
        process.env.BREVO_SMTP_PORT = '465';
        saveConfig();
        return { ok: true, port: 465, note: 'Connected via port 465 (SSL) — port 587 was blocked' };
      } catch (fallbackErr) {
        // Restore original port
        _buildTransporter(currentPort);
        return { ok: false, error: `Port 587: ${err.message} | Port 465: ${fallbackErr.message}` };
      }
    }
    return { ok: false, error: err.message };
  }
}

// ── Get configuration status ──────────────────────────────────
function getStatus() {
  return {
    configured: isConfigured(),       // true only if credentials exist AND enabled
    has_credentials: hasCredentials(), // true if SMTP key + from email are set
    enabled: _enabled,                // user toggle — false means paused
    from_email: process.env.BREVO_FROM_EMAIL || null,
    from_name: process.env.BREVO_FROM_NAME || 'CRM Marketing',
    smtp_login: process.env.BREVO_SMTP_LOGIN || process.env.BREVO_FROM_EMAIL || null,
    provider: 'Brevo'
  };
}

module.exports = {
  init,
  isConfigured,
  isEnabled,
  setEnabled,
  hasCredentials,
  sendEmail,
  sendBulk,
  sendProof,
  verifyConnection,
  getStatus,
  saveConfig
};
