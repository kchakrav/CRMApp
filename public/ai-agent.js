/* ================================================================
   AI Agent Chat — Frontend Logic
   ================================================================ */
(function () {
  'use strict';

  let _aiOpen = false;
  let _aiHistory = [];
  let _aiTyping = false;

  /* ── Toggle panel ──────────────────────────────────── */
  window.toggleAIAgent = function () {
    const panel = document.getElementById('ai-agent-panel');
    const overlay = document.getElementById('ai-agent-overlay');
    const btn = document.getElementById('ai-agent-btn');
    if (!panel) return;
    _aiOpen = !_aiOpen;
    panel.classList.toggle('open', _aiOpen);
    overlay.classList.toggle('open', _aiOpen);
    if (btn) btn.classList.toggle('active', _aiOpen);
    if (_aiOpen) {
      setTimeout(() => {
        const inp = document.getElementById('ai-agent-input');
        if (inp) inp.focus();
      }, 300);
    }
  };

  /* ── Clear chat ────────────────────────────────────── */
  window.clearAIChat = function () {
    _aiHistory = [];
    const msgs = document.getElementById('ai-agent-messages');
    if (!msgs) return;
    msgs.innerHTML = `
      <div class="ai-msg ai-msg-bot">
        <div class="ai-msg-avatar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg></div>
        <div class="ai-msg-content">
          <div class="ai-msg-text">Hi! I'm your AI assistant. Ask me anything about the Marketing Automation Platform — navigation, features, data, or how-to guides.</div>
        </div>
      </div>`;
    const sugg = document.getElementById('ai-agent-suggestions');
    if (sugg) sugg.style.display = '';
  };

  /* ── Send suggestion chip ──────────────────────────── */
  window.sendAISuggestion = function (el) {
    const text = el.textContent.trim();
    const inp = document.getElementById('ai-agent-input');
    if (inp) inp.value = text;
    sendAIMessage();
  };

  /* ── Send message ──────────────────────────────────── */
  window.sendAIMessage = async function () {
    const inp = document.getElementById('ai-agent-input');
    if (!inp) return;
    const text = inp.value.trim();
    if (!text || _aiTyping) return;
    inp.value = '';

    // Hide suggestions after first message
    const sugg = document.getElementById('ai-agent-suggestions');
    if (sugg) sugg.style.display = 'none';

    // Handle special slash commands locally
    const slashResult = handleSlashCommand(text);
    if (slashResult) {
      appendUserMsg(text);
      appendBotMsg(slashResult);
      return;
    }

    appendUserMsg(text);
    _aiHistory.push({ role: 'user', content: text });

    // Show typing indicator
    showTyping();

    try {
      const resp = await fetch('/api/ai/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: _aiHistory.slice(-10) })
      });
      const data = await resp.json();
      hideTyping();
      if (data.error) {
        appendBotMsg('Sorry, something went wrong. Please try again.');
      } else {
        _aiHistory.push({ role: 'assistant', content: data.message });
        appendBotMsg(data.message);
      }
    } catch (err) {
      hideTyping();
      appendBotMsg('Unable to reach the AI service. Please check that the server is running.');
    }
  };

  /* ── Slash commands ────────────────────────────────── */
  function handleSlashCommand(text) {
    const lower = text.toLowerCase().trim();

    if (lower === '/help') {
      return `**Available commands:**\n
- **/help** — Show this help message
- **/navigate [view]** — Go to a specific view (e.g., /navigate deliveries)
- **/counts** — Show entity counts
- **/clear** — Clear chat history
- **/status** — Show application status\n
Or just ask me anything in natural language!`;
    }

    if (lower === '/clear') {
      setTimeout(() => window.clearAIChat(), 100);
      return null;
    }

    if (lower === '/counts') {
      return '_Fetching counts..._';
    }

    if (lower.startsWith('/navigate ')) {
      const view = lower.replace('/navigate ', '').trim();
      const validViews = [
        'dashboard', 'explorer', 'workflows', 'deliveries', 'transactional',
        'event-history', 'content-templates', 'assets', 'landing-pages', 'fragments',
        'brands', 'contacts', 'segments', 'audiences', 'offers', 'placements',
        'collections', 'decision-rules', 'strategies', 'decisions', 'custom-objects',
        'enumerations', 'predefined-filters', 'query-service', 'analytics', 'ai', 'api-docs'
      ];
      if (validViews.includes(view)) {
        const navItem = document.querySelector(`.nav-item[data-view="${view}"]`);
        if (navItem) {
          setTimeout(() => navItem.click(), 200);
          return `Navigating to **${view}**...`;
        }
      }
      return `Unknown view: "${view}". Valid views are: ${validViews.join(', ')}`;
    }

    if (lower === '/status') {
      return `**Application Status:**\n- Server: Running\n- Database: Active (in-memory + JSON persistence)\n- Current page: ${document.getElementById('page-title')?.textContent || 'Unknown'}`;
    }

    return null;
  }

  /* ── Markdown rendering (simple) ───────────────────── */
  function renderMarkdown(text) {
    let html = escapeHtml(text);
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    // Line breaks: two spaces at end or double newline
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n- /g, '<br>• ');
    html = html.replace(/\n/g, '<br>');
    return '<p>' + html + '</p>';
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* ── Append user message ───────────────────────────── */
  function appendUserMsg(text) {
    const msgs = document.getElementById('ai-agent-messages');
    if (!msgs) return;
    const div = document.createElement('div');
    div.className = 'ai-msg ai-msg-user';
    div.innerHTML = `
      <div class="ai-msg-content">
        <div class="ai-msg-text">${escapeHtml(text)}</div>
      </div>
      <div class="ai-msg-avatar ai-msg-avatar-user">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>`;
    msgs.appendChild(div);
    scrollToBottom();
  }

  /* ── Append bot message ────────────────────────────── */
  let _aiMsgCounter = 0;
  function appendBotMsg(text) {
    const msgs = document.getElementById('ai-agent-messages');
    if (!msgs) return;
    const msgId = 'ai-bot-msg-' + (++_aiMsgCounter);
    const div = document.createElement('div');
    div.className = 'ai-msg ai-msg-bot';
    div.id = msgId;
    div.innerHTML = `
      <div class="ai-msg-avatar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg></div>
      <div class="ai-msg-content">
        <div class="ai-msg-text">${renderMarkdown(text)}</div>
        <div class="ai-msg-feedback">
          <button class="ai-fb-btn" title="Helpful" onclick="window._aiFeedback('${msgId}','up',this)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>
          </button>
          <button class="ai-fb-btn" title="Not helpful" onclick="window._aiFeedback('${msgId}','down',this)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>
          </button>
          <button class="ai-fb-btn" title="Copy response" onclick="window._aiCopyMsg('${msgId}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
          <button class="ai-fb-btn" title="Regenerate" onclick="window._aiRegenerate()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          </button>
        </div>
        <div class="ai-msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>`;
    // Store raw text for copy/regenerate
    div.dataset.rawText = text;
    msgs.appendChild(div);
    scrollToBottom();

    // Check for navigation hints in bot message to offer quick actions
    addQuickActions(div, text);
  }

  /* ── Feedback handlers ────────────────────────────── */
  window._aiFeedback = function (msgId, type, btn) {
    const msgEl = document.getElementById(msgId);
    if (!msgEl) return;
    const fbRow = msgEl.querySelector('.ai-msg-feedback');
    if (!fbRow) return;
    // Disable all buttons in this feedback row
    fbRow.querySelectorAll('.ai-fb-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Visual confirmation
    const label = type === 'up' ? 'Thanks for the feedback!' : 'Sorry about that. I\'ll try to do better.';
    let toast = fbRow.querySelector('.ai-fb-toast');
    if (!toast) {
      toast = document.createElement('span');
      toast.className = 'ai-fb-toast';
      fbRow.appendChild(toast);
    }
    toast.textContent = label;
    toast.style.display = 'inline';
    setTimeout(() => { if (toast) toast.style.display = 'none'; }, 3000);
  };

  window._aiCopyMsg = function (msgId) {
    const msgEl = document.getElementById(msgId);
    if (!msgEl) return;
    const rawText = msgEl.dataset.rawText || msgEl.querySelector('.ai-msg-text')?.textContent || '';
    navigator.clipboard.writeText(rawText).then(() => {
      if (typeof showToast === 'function') showToast('Response copied to clipboard', 'success');
    }).catch(() => {
      if (typeof showToast === 'function') showToast('Failed to copy', 'error');
    });
  };

  window._aiRegenerate = function () {
    // Resend the last user message
    const lastUserMsg = _aiHistory.filter(h => h.role === 'user').pop();
    if (lastUserMsg) {
      // Remove last assistant response from history
      const lastIdx = _aiHistory.findLastIndex(h => h.role === 'assistant');
      if (lastIdx >= 0) _aiHistory.splice(lastIdx, 1);
      // Re-send
      const inp = document.getElementById('ai-agent-input');
      if (inp) { inp.value = lastUserMsg.content; }
      window.sendAIMessage();
    }
  };

  /* ── Quick action buttons from response ────────────── */
  function addQuickActions(msgEl, text) {
    const lower = text.toLowerCase();
    const actions = [];

    if (/go to.*deliver|deliveries/i.test(lower) && /campaign management/i.test(lower)) {
      actions.push({ label: 'Go to Deliveries', view: 'deliveries' });
    }
    if (/go to.*workflow|workflows/i.test(lower) && /campaign management/i.test(lower)) {
      actions.push({ label: 'Go to Workflows', view: 'workflows' });
    }
    if (/go to.*segment|segments/i.test(lower) && /profiles/i.test(lower)) {
      actions.push({ label: 'Go to Segments', view: 'segments' });
    }
    if (/offer decisioning/i.test(lower) && /offers/i.test(lower)) {
      actions.push({ label: 'Go to Offers', view: 'offers' });
    }

    if (actions.length === 0) return;
    const container = document.createElement('div');
    container.className = 'ai-quick-actions';
    actions.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'ai-quick-btn';
      btn.textContent = a.label;
      btn.onclick = () => {
        const nav = document.querySelector(`.nav-item[data-view="${a.view}"]`);
        if (nav) nav.click();
        toggleAIAgent();
      };
      container.appendChild(btn);
    });
    const content = msgEl.querySelector('.ai-msg-content');
    if (content) content.appendChild(container);
  }

  /* ── Typing indicator ──────────────────────────────── */
  function showTyping() {
    _aiTyping = true;
    const msgs = document.getElementById('ai-agent-messages');
    if (!msgs) return;
    const sendBtn = document.getElementById('ai-agent-send-btn');
    if (sendBtn) sendBtn.disabled = true;
    const div = document.createElement('div');
    div.id = 'ai-typing-indicator';
    div.className = 'ai-msg ai-msg-bot';
    div.innerHTML = `
      <div class="ai-msg-avatar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg></div>
      <div class="ai-msg-content">
        <div class="ai-typing-dots"><span></span><span></span><span></span></div>
      </div>`;
    msgs.appendChild(div);
    scrollToBottom();
  }

  function hideTyping() {
    _aiTyping = false;
    const el = document.getElementById('ai-typing-indicator');
    if (el) el.remove();
    const sendBtn = document.getElementById('ai-agent-send-btn');
    if (sendBtn) sendBtn.disabled = false;
  }

  /* ── Scroll ────────────────────────────────────────── */
  function scrollToBottom() {
    const msgs = document.getElementById('ai-agent-messages');
    if (msgs) {
      requestAnimationFrame(() => {
        msgs.scrollTop = msgs.scrollHeight;
      });
    }
  }

  /* ── Keyboard shortcut: Ctrl+Shift+A ───────────────── */
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      toggleAIAgent();
    }
    if (e.key === 'Escape' && _aiOpen) {
      toggleAIAgent();
    }
  });

})();
