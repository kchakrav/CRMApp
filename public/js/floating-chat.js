// Floating Chat Widget — persists across all views
(function () {
  'use strict';

  var _open = false;
  var _history = [];
  var _typing = false;
  var _sessionId = 'float-' + Date.now();

  // ── Inject styles ──────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = `
    .fc-fab {
      position: fixed; bottom: 24px; right: 24px;
      width: 52px; height: 52px;
      background: var(--blue-500, #1473E6);
      border: none; border-radius: 50%;
      color: #fff; cursor: pointer;
      box-shadow: 0 4px 16px rgba(20,115,230,.45);
      z-index: 9000;
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s, box-shadow .2s;
    }
    .fc-fab:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(20,115,230,.55); }
    .fc-fab.active { background: var(--gray-800, #4B4B4B); box-shadow: 0 4px 16px rgba(0,0,0,.35); }
    .fc-fab .fc-badge {
      position: absolute; top: -2px; right: -2px;
      width: 14px; height: 14px;
      background: var(--spectrum-red, #D7373F);
      border-radius: 50%; border: 2px solid var(--bg-layer-1, #fff);
      font-size: 8px; color: #fff; display: none;
      align-items: center; justify-content: center; font-weight: 700;
    }
    .fc-badge.show { display: flex; }
    .fc-panel {
      position: fixed; bottom: 88px; right: 24px;
      width: 360px; max-height: 520px;
      background: var(--bg-layer-1, #fff);
      border: 1px solid var(--border-default, #E1E1E1);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,.18);
      display: flex; flex-direction: column;
      z-index: 8999;
      transform: translateY(12px) scale(0.97); opacity: 0;
      pointer-events: none;
      transition: transform .22s cubic-bezier(0.4,0,0.2,1), opacity .22s;
    }
    .fc-panel.open { transform: translateY(0) scale(1); opacity: 1; pointer-events: all; }
    .fc-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px 12px;
      border-bottom: 1px solid var(--border-default, #E1E1E1);
      flex-shrink: 0;
    }
    .fc-header-left { display: flex; align-items: center; gap: 10px; }
    .fc-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, var(--blue-500,#1473E6) 0%, var(--spectrum-purple,#9256D9) 100%);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .fc-title { font-size: 13px; font-weight: 700; color: var(--text-primary); }
    .fc-subtitle { font-size: 11px; color: var(--text-secondary); }
    .fc-close {
      background: none; border: none; cursor: pointer;
      color: var(--text-secondary); padding: 4px; border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s, color .15s;
    }
    .fc-close:hover { background: var(--gray-100); color: var(--text-primary); }
    .fc-messages {
      flex: 1; overflow-y: auto; padding: 12px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .fc-msg { display: flex; gap: 8px; align-items: flex-start; }
    .fc-msg.user { flex-direction: row-reverse; }
    .fc-msg-avatar {
      width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
      background: var(--gray-100); display: flex; align-items: center; justify-content: center;
    }
    .fc-msg.user .fc-msg-avatar { background: var(--blue-500, #1473E6); color: #fff; }
    .fc-msg-bubble {
      max-width: 78%; padding: 8px 12px; border-radius: 10px;
      font-size: 13px; line-height: 1.5; color: var(--text-primary);
    }
    .fc-msg.bot .fc-msg-bubble { background: var(--bg-layer-2); border: 1px solid var(--border-default); border-radius: 2px 10px 10px 10px; }
    .fc-msg.user .fc-msg-bubble { background: var(--blue-500, #1473E6); color: #fff; border-radius: 10px 2px 10px 10px; }
    .fc-typing { display: flex; gap: 4px; align-items: center; padding: 10px 0 4px 34px; }
    .fc-dot { width: 6px; height: 6px; background: var(--text-secondary); border-radius: 50%; animation: fcDot 1.2s infinite; }
    .fc-dot:nth-child(2) { animation-delay: .2s; }
    .fc-dot:nth-child(3) { animation-delay: .4s; }
    @keyframes fcDot { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }
    .fc-input-area {
      display: flex; align-items: flex-end; gap: 8px;
      padding: 10px 12px 12px;
      border-top: 1px solid var(--border-default);
      flex-shrink: 0;
    }
    .fc-input {
      flex: 1; background: var(--bg-layer-2);
      border: 1px solid var(--border-default);
      border-radius: 8px; color: var(--text-primary);
      font-size: 13px; font-family: inherit;
      padding: 8px 12px; outline: none; resize: none;
      line-height: 1.4; max-height: 100px; overflow-y: auto;
      transition: border-color .15s;
    }
    .fc-input:focus { border-color: var(--blue-500); }
    .fc-send {
      width: 34px; height: 34px; flex-shrink: 0;
      background: var(--blue-500, #1473E6); border: none; border-radius: 8px;
      color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background .15s; margin-bottom: 1px;
    }
    .fc-send:hover { background: var(--blue-600); }
    .fc-send:disabled { background: var(--gray-400); cursor: not-allowed; }
    .fc-suggestions {
      display: flex; flex-wrap: wrap; gap: 6px;
      padding: 6px 12px 10px;
    }
    .fc-chip {
      background: var(--bg-base); border: 1px solid var(--border-default);
      border-radius: 16px; padding: 4px 10px; font-size: 11px;
      color: var(--text-secondary); cursor: pointer; transition: all .15s;
    }
    .fc-chip:hover { border-color: var(--blue-500); color: var(--blue-500); background: rgba(20,115,230,.06); }
    @media (max-width: 500px) {
      .fc-panel { right: 12px; left: 12px; width: auto; bottom: 80px; }
      .fc-fab { bottom: 16px; right: 16px; }
    }
  `;
  document.head.appendChild(style);

  // ── Build DOM ────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    // FAB button
    var fab = document.createElement('button');
    fab.className = 'fc-fab';
    fab.id = 'fc-fab';
    fab.setAttribute('title', 'Open chat assistant');
    fab.setAttribute('aria-label', 'Open chat assistant');
    fab.innerHTML =
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>' +
      '<span class="fc-badge" id="fc-badge"></span>';
    fab.onclick = toggleFloatChat;
    document.body.appendChild(fab);

    // Panel
    var panel = document.createElement('div');
    panel.className = 'fc-panel';
    panel.id = 'fc-panel';
    panel.innerHTML = `
      <div class="fc-header">
        <div class="fc-header-left">
          <div class="fc-avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>
          </div>
          <div>
            <div class="fc-title">AI Assistant</div>
            <div class="fc-subtitle">Ask me anything</div>
          </div>
        </div>
        <button class="fc-close" onclick="window.toggleFloatChat()" title="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
      </div>
      <div class="fc-messages" id="fc-messages">
        <div class="fc-msg bot">
          <div class="fc-msg-avatar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg></div>
          <div class="fc-msg-bubble">Hi! I'm your AI assistant. Ask me about campaigns, agents, contacts, or how to use any feature.</div>
        </div>
      </div>
      <div class="fc-suggestions" id="fc-suggestions">
        <button class="fc-chip" onclick="window.fcSuggest(this)">Top performing campaigns</button>
        <button class="fc-chip" onclick="window.fcSuggest(this)">Active agents today</button>
        <button class="fc-chip" onclick="window.fcSuggest(this)">How do I create a workflow?</button>
        <button class="fc-chip" onclick="window.fcSuggest(this)">Recent deliveries</button>
      </div>
      <div class="fc-input-area">
        <textarea class="fc-input" id="fc-input" rows="1" placeholder="Ask anything…" onkeydown="window.fcKeyDown(event)"></textarea>
        <button class="fc-send" id="fc-send" onclick="window.sendFloatChat()" title="Send">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/></svg>
        </button>
      </div>`;
    document.body.appendChild(panel);
  });

  // ── Toggle open/close ─────────────────────────────────────────────────────
  window.toggleFloatChat = function () {
    _open = !_open;
    var panel = document.getElementById('fc-panel');
    var fab = document.getElementById('fc-fab');
    if (panel) panel.classList.toggle('open', _open);
    if (fab) fab.classList.toggle('active', _open);
    if (_open) {
      setTimeout(function () {
        var inp = document.getElementById('fc-input');
        if (inp) inp.focus();
        var msgs = document.getElementById('fc-messages');
        if (msgs) msgs.scrollTop = msgs.scrollHeight;
      }, 250);
    }
  };

  window.fcSuggest = function (el) {
    var inp = document.getElementById('fc-input');
    if (inp) inp.value = el.textContent.trim();
    window.sendFloatChat();
  };

  window.fcKeyDown = function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      window.sendFloatChat();
    }
  };

  // ── Send message ─────────────────────────────────────────────────────────
  window.sendFloatChat = async function () {
    var inp = document.getElementById('fc-input');
    if (!inp) return;
    var text = inp.value.trim();
    if (!text || _typing) return;
    inp.value = '';
    inp.style.height = '';

    var sugg = document.getElementById('fc-suggestions');
    if (sugg) sugg.style.display = 'none';

    appendFcMsg('user', text);
    _history.push({ role: 'user', content: text });
    showFcTyping();

    try {
      var resp = await fetch('/api/ai/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: _history.slice(-8), sessionId: _sessionId })
      });
      var data = await resp.json();
      hideFcTyping();
      var reply = data.response || data.message || data.reply || 'Sorry, I could not generate a response.';
      appendFcMsg('bot', reply);
      _history.push({ role: 'assistant', content: reply });
    } catch (_) {
      hideFcTyping();
      appendFcMsg('bot', 'Sorry, something went wrong. Please try again.');
    }
  };

  function appendFcMsg(role, text) {
    var msgs = document.getElementById('fc-messages');
    if (!msgs) return;
    var div = document.createElement('div');
    div.className = 'fc-msg ' + role;
    var avatarSvg = role === 'bot'
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    div.innerHTML = '<div class="fc-msg-avatar">' + avatarSvg + '</div>' +
      '<div class="fc-msg-bubble">' + renderFcMarkdown(text) + '</div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function renderFcMarkdown(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:var(--bg-base);padding:1px 4px;border-radius:3px;font-size:11px;font-family:monospace;">$1</code>')
      .replace(/\n/g, '<br>');
  }

  function showFcTyping() {
    _typing = true;
    var msgs = document.getElementById('fc-messages');
    if (!msgs) return;
    var el = document.createElement('div');
    el.id = 'fc-typing';
    el.className = 'fc-typing';
    el.innerHTML = '<div class="fc-dot"></div><div class="fc-dot"></div><div class="fc-dot"></div>';
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    var btn = document.getElementById('fc-send');
    if (btn) btn.disabled = true;
  }

  function hideFcTyping() {
    _typing = false;
    var el = document.getElementById('fc-typing');
    if (el) el.remove();
    var btn = document.getElementById('fc-send');
    if (btn) btn.disabled = false;
  }

})();
