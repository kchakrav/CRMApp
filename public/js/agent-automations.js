// Agent Automations — schedule and run agents on a cron
(function () {
  'use strict';

  var PRESETS = [
    { id: 'cart-recovery',   icon: '🛒', label: 'Cart Recovery Briefing',    cron: '0 9 * * 1-5', desc: 'Daily cart recovery summary on weekdays' },
    { id: 'daily-briefing',  icon: '📋', label: 'Daily Performance Briefing', cron: '0 8 * * 1-5', desc: 'Morning metrics digest every weekday' },
    { id: 'weekly-report',   icon: '📊', label: 'Weekly Report',              cron: '0 17 * * 5',  desc: 'End-of-week campaign performance report' },
    { id: 'anomaly-monitor', icon: '🔔', label: 'Anomaly Monitor',            cron: '0 * * * *',   desc: 'Hourly check for metric anomalies' },
    { id: 'segment-refresh', icon: '👥', label: 'Segment Refresh',            cron: '0 6 * * *',   desc: 'Daily audience segment re-evaluation' },
    { id: 'loyalty-check',   icon: '⭐', label: 'Loyalty Milestone Check',    cron: '0 10 * * 1',  desc: 'Weekly loyalty tier review' },
    { id: 'winback-scan',    icon: '🔄', label: 'Win-back Scan',              cron: '0 9 * * 2',   desc: 'Tuesday inactive contact identification' },
    { id: 'cost-audit',      icon: '💰', label: 'Cost & Send Audit',          cron: '0 9 * * 1',   desc: 'Weekly messaging cost and volume audit' }
  ];

  var _selectedAgents = [];
  var _cronValue = '';

  function cronToHuman(cron) {
    var map = {
      '0 9 * * 1-5': 'Weekdays at 9:00 AM', '0 8 * * 1-5': 'Weekdays at 8:00 AM',
      '0 17 * * 5': 'Fridays at 5:00 PM', '0 * * * *': 'Every hour',
      '0 6 * * *': 'Daily at 6:00 AM', '0 10 * * 1': 'Mondays at 10:00 AM',
      '0 9 * * 2': 'Tuesdays at 9:00 AM', '0 9 * * 1': 'Mondays at 9:00 AM',
      '0 9 * * *': 'Daily at 9:00 AM', '0 8 * * *': 'Daily at 8:00 AM',
      '0 */4 * * *': 'Every 4 hours', '*/30 * * * *': 'Every 30 minutes',
      '0 9 1 * *': 'Monthly on the 1st at 9:00 AM'
    };
    if (!cron) return '';
    if (map[cron.trim()]) return map[cron.trim()];
    return 'Custom: ' + cron;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function toast(msg, ok) {
    if (typeof window.showToast === 'function') { window.showToast(msg, ok ? 'success' : 'error'); return; }
    var t = document.getElementById('auto-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'auto-toast';
      t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:var(--spectrum-green,#268E6C);color:#fff;padding:10px 18px;border-radius:6px;font-size:13px;z-index:9999;opacity:0;transition:opacity .25s;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,.15);';
      document.body.appendChild(t);
    }
    t.style.background = ok !== false ? 'var(--spectrum-green,#268E6C)' : 'var(--spectrum-red,#D7373F)';
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._tid);
    t._tid = setTimeout(function() { t.style.opacity = '0'; }, 2800);
  }

  // ── Render the full automations page ─────────────────────────────────────
  window.renderAgentAutomations = function (container) {
    container.innerHTML =
      '<div style="padding:24px 32px;max-width:1100px;">' +

        // Page header
        '<div style="margin-bottom:28px;">' +
          '<h1 style="font-size:20px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">Agent Automations</h1>' +
          '<p style="font-size:13px;color:var(--text-secondary);">Schedule agents to run automatically on a cron or trigger them manually.</p>' +
        '</div>' +

        // Presets section
        '<div style="margin-bottom:32px;">' +
          '<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-secondary);margin-bottom:12px;">Quick-start Presets</div>' +
          '<div id="auto-preset-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;"></div>' +
        '</div>' +

        // New automation form
        '<div id="auto-form-wrap" style="margin-bottom:32px;"></div>' +

        // Active automations
        '<div>' +
          '<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-secondary);margin-bottom:12px;">Active Automations</div>' +
          '<div id="auto-list-wrap"></div>' +
        '</div>' +

      '</div>';

    renderPresets();
    renderForm();
    loadScheduleList();
  };

  function renderPresets() {
    var grid = document.getElementById('auto-preset-grid');
    if (!grid) return;
    grid.innerHTML = PRESETS.map(function(p) {
      return '<div onclick="window.autoFillPreset(\'' + p.id + '\')" style="cursor:pointer;background:var(--bg-layer-1);border:1px solid var(--border-default);border-radius:8px;padding:14px 16px;transition:border-color .15s;" ' +
        'onmouseenter="this.style.borderColor=\'var(--blue-500)\'" onmouseleave="this.style.borderColor=\'var(--border-default)\'">' +
        '<div style="font-size:22px;margin-bottom:8px;">' + p.icon + '</div>' +
        '<div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:4px;">' + esc(p.label) + '</div>' +
        '<div style="font-size:11px;color:var(--text-secondary);margin-bottom:6px;">' + esc(p.desc) + '</div>' +
        '<div style="font-size:10px;color:var(--blue-500);background:rgba(20,115,230,.08);padding:2px 6px;border-radius:3px;display:inline-block;">' + esc(cronToHuman(p.cron)) + '</div>' +
      '</div>';
    }).join('');
  }

  function renderForm() {
    var wrap = document.getElementById('auto-form-wrap');
    if (!wrap) return;
    // Fetch agents to populate multi-select
    fetch('/api/agents')
      .then(function(r) { return r.ok ? r.json() : []; })
      .then(function(agents) { wrap.innerHTML = buildFormHtml(agents); })
      .catch(function() { wrap.innerHTML = buildFormHtml([]); });
  }

  function buildFormHtml(agents) {
    return '<div style="background:var(--bg-layer-1);border:1px solid var(--border-default);border-radius:10px;padding:20px;">' +
      '<div style="font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:18px;">New Automation</div>' +

      // Schedule input
      '<div style="margin-bottom:14px;">' +
        '<label style="font-size:12px;color:var(--text-secondary);display:block;margin-bottom:6px;">Schedule (natural language or cron)</label>' +
        '<div style="display:flex;gap:8px;">' +
          '<input id="auto-nl-input" type="text" placeholder="e.g. every weekday at 9am" style="flex:1;background:var(--bg-layer-2);border:1px solid var(--border-default);border-radius:6px;color:var(--text-primary);font-size:13px;padding:8px 12px;outline:none;" oninput="window.autoNlPreview()" />' +
          '<button onclick="window.autoConvertNl()" style="background:var(--bg-layer-2);border:1px solid var(--border-default);border-radius:6px;color:var(--text-secondary);font-size:12px;padding:8px 14px;cursor:pointer;white-space:nowrap;transition:all .15s;" onmouseenter="this.style.borderColor=\'var(--blue-500)\'" onmouseleave="this.style.borderColor=\'var(--border-default)\'">Convert</button>' +
        '</div>' +
        '<div id="auto-cron-preview" style="font-size:11px;color:var(--blue-500);margin-top:4px;min-height:16px;"></div>' +
        '<div id="auto-cron-raw" style="display:none;margin-top:8px;">' +
          '<label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">Cron expression</label>' +
          '<input id="auto-cron-input" type="text" placeholder="0 9 * * 1-5" style="width:100%;background:var(--bg-layer-2);border:1px solid var(--border-default);border-radius:6px;color:var(--text-primary);font-size:12px;font-family:monospace;padding:7px 10px;outline:none;box-sizing:border-box;" oninput="window.autoUpdateCronPreview()" />' +
        '</div>' +
      '</div>' +

      // Prompt
      '<div style="margin-bottom:14px;">' +
        '<label style="font-size:12px;color:var(--text-secondary);display:block;margin-bottom:6px;">What should the agent do?</label>' +
        '<textarea id="auto-prompt-input" rows="3" placeholder="e.g. Summarize cart abandonment recoveries from the past 24 hours and send a Slack report..." style="width:100%;background:var(--bg-layer-2);border:1px solid var(--border-default);border-radius:6px;color:var(--text-primary);font-size:13px;padding:8px 12px;outline:none;box-sizing:border-box;resize:vertical;font-family:inherit;"></textarea>' +
      '</div>' +

      // Agent multi-select
      '<div style="margin-bottom:18px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<label style="font-size:12px;color:var(--text-secondary);">Agents <span id="auto-agent-count" style="color:var(--blue-500);"></span></label>' +
          '<button onclick="window.autoToggleAllAgents()" style="background:none;border:none;color:var(--blue-500);font-size:11px;cursor:pointer;padding:0;">Select all</button>' +
        '</div>' +
        '<input id="auto-agent-search" type="text" placeholder="Search agents…" oninput="window.autoFilterAgents()" style="width:100%;background:var(--bg-layer-2);border:1px solid var(--border-default);border-radius:6px;color:var(--text-primary);font-size:12px;padding:6px 10px;outline:none;box-sizing:border-box;margin-bottom:6px;" />' +
        '<div id="auto-agent-list" style="max-height:180px;overflow-y:auto;background:var(--bg-base);border:1px solid var(--border-default);border-radius:6px;padding:4px 0;">' +
          (agents.length ? agents.map(function(a) {
            var name = a.name || a.title || String(a.id);
            return '<label id="auto-agent-row-' + esc(a.id) + '" style="display:flex;align-items:center;gap:8px;padding:7px 12px;cursor:pointer;" ' +
              'onmouseenter="this.style.background=\'var(--gray-100)\'" onmouseleave="this.style.background=\'\'">' +
              '<input type="checkbox" class="auto-agent-cb" value="' + esc(a.id) + '" data-name="' + esc(name) + '" onchange="window.autoUpdateAgentCount()" style="accent-color:var(--blue-500);cursor:pointer;" />' +
              '<span style="font-size:13px;color:var(--text-primary);">' + esc(name) + '</span>' +
              '<span style="font-size:10px;color:var(--text-secondary);margin-left:auto;">' + esc(a.type || a.agent_type || '') + '</span>' +
            '</label>';
          }).join('') : '<div style="padding:14px 12px;font-size:13px;color:var(--text-secondary);">No agents found</div>') +
        '</div>' +
      '</div>' +

      '<button onclick="window.saveAutomation()" style="background:var(--blue-500);color:#fff;border:none;border-radius:6px;padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s;" onmouseenter="this.style.background=\'var(--blue-600)\'" onmouseleave="this.style.background=\'var(--blue-500)\'">Save Automation</button>' +
    '</div>';
  }

  // ── Preset fill ──────────────────────────────────────────────────────────
  window.autoFillPreset = function(id) {
    // Fetch the preset prompt from server
    fetch('/api/agent-schedules/presets')
      .then(function(r) { return r.ok ? r.json() : []; })
      .then(function(presets) {
        var preset = presets.filter(function(p) { return p.id === id; })[0];
        if (!preset) preset = PRESETS.filter(function(p) { return p.id === id; })[0];
        if (!preset) return;
        var nlIn = document.getElementById('auto-nl-input');
        var cronIn = document.getElementById('auto-cron-input');
        var promptIn = document.getElementById('auto-prompt-input');
        var preview = document.getElementById('auto-cron-preview');
        if (nlIn) nlIn.value = cronToHuman(preset.cron);
        if (cronIn) cronIn.value = preset.cron;
        if (promptIn) promptIn.value = preset.prompt || '';
        if (preview) preview.textContent = cronToHuman(preset.cron);
        _cronValue = preset.cron;
        document.querySelectorAll('.auto-agent-cb').forEach(function(cb) { cb.checked = false; });
        window.autoUpdateAgentCount();
        var formWrap = document.getElementById('auto-form-wrap');
        if (formWrap) formWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
  };

  // ── NL conversion ────────────────────────────────────────────────────────
  window.autoNlPreview = function() {
    // Live preview while typing — skip API call, just show placeholder
    var val = (document.getElementById('auto-nl-input') || {}).value || '';
    var preview = document.getElementById('auto-cron-preview');
    if (preview && !val) preview.textContent = '';
  };

  window.autoConvertNl = function() {
    var input = document.getElementById('auto-nl-input');
    var preview = document.getElementById('auto-cron-preview');
    var val = input ? input.value.trim() : '';
    if (!val) return;
    if (preview) preview.textContent = 'Converting…';
    fetch('/api/agent-schedules/nl-to-cron', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: val })
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        _cronValue = data.cron || '';
        if (preview) preview.textContent = data.human_readable || cronToHuman(_cronValue);
        var rawWrap = document.getElementById('auto-cron-raw');
        var cronIn = document.getElementById('auto-cron-input');
        if (rawWrap) rawWrap.style.display = '';
        if (cronIn) cronIn.value = _cronValue;
      })
      .catch(function() { if (preview) preview.textContent = 'Conversion failed — try entering a cron directly below'; });
  };

  window.autoUpdateCronPreview = function() {
    var cronIn = document.getElementById('auto-cron-input');
    var preview = document.getElementById('auto-cron-preview');
    if (!cronIn || !preview) return;
    _cronValue = cronIn.value.trim();
    preview.textContent = _cronValue ? cronToHuman(_cronValue) : '';
  };

  window.autoUpdateAgentCount = function() {
    var checked = document.querySelectorAll('.auto-agent-cb:checked');
    var el = document.getElementById('auto-agent-count');
    if (el) el.textContent = checked.length ? '(' + checked.length + ' selected)' : '';
  };

  window.autoToggleAllAgents = function() {
    var boxes = document.querySelectorAll('.auto-agent-cb');
    var allChecked = Array.prototype.every.call(boxes, function(b) { return b.style.display === 'none' || b.checked; });
    boxes.forEach(function(b) { if (b.style.display !== 'none') b.checked = !allChecked; });
    window.autoUpdateAgentCount();
  };

  window.autoFilterAgents = function() {
    var q = ((document.getElementById('auto-agent-search') || {}).value || '').toLowerCase();
    document.querySelectorAll('#auto-agent-list label').forEach(function(row) {
      var name = (row.querySelector('span') || {}).textContent || '';
      row.style.display = name.toLowerCase().indexOf(q) >= 0 ? '' : 'none';
    });
  };

  // ── Save automation ──────────────────────────────────────────────────────
  window.saveAutomation = function() {
    var checked = document.querySelectorAll('.auto-agent-cb:checked');
    var cronIn = document.getElementById('auto-cron-input');
    var promptIn = document.getElementById('auto-prompt-input');
    var cron = _cronValue || (cronIn ? cronIn.value.trim() : '');
    var prompt = promptIn ? promptIn.value.trim() : '';

    if (!checked.length) { toast('Select at least one agent', false); return; }
    if (!cron) { toast('Enter a schedule first', false); return; }

    var agentIds = Array.prototype.map.call(checked, function(cb) { return cb.value; });
    var saves = agentIds.map(function(agentId) {
      return fetch('/api/agent-schedules/' + encodeURIComponent(agentId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cron: cron, enabled: true, prompt: prompt })
      }).then(function(r) { return r.json(); });
    });

    Promise.all(saves)
      .then(function() {
        toast(agentIds.length === 1 ? 'Automation saved' : agentIds.length + ' automations saved');
        if (cronIn) cronIn.value = '';
        if (promptIn) promptIn.value = '';
        var nlIn = document.getElementById('auto-nl-input');
        if (nlIn) nlIn.value = '';
        var preview = document.getElementById('auto-cron-preview');
        if (preview) preview.textContent = '';
        _cronValue = '';
        document.querySelectorAll('.auto-agent-cb').forEach(function(cb) { cb.checked = false; });
        window.autoUpdateAgentCount();
        loadScheduleList();
      })
      .catch(function() { toast('Save failed — check console', false); });
  };

  // ── Active automations list ──────────────────────────────────────────────
  function loadScheduleList() {
    var wrap = document.getElementById('auto-list-wrap');
    if (!wrap) return;
    wrap.innerHTML = '<div style="color:var(--text-secondary);font-size:13px;padding:8px 0;">Loading…</div>';
    fetch('/api/agent-schedules')
      .then(function(r) { return r.ok ? r.json() : []; })
      .then(renderScheduleList)
      .catch(function() { wrap.innerHTML = '<div style="color:var(--spectrum-red);font-size:13px;">Failed to load automations.</div>'; });
  }

  function renderScheduleList(schedules) {
    var wrap = document.getElementById('auto-list-wrap');
    if (!wrap) return;
    if (!schedules || !schedules.length) {
      wrap.innerHTML = '<div style="background:var(--bg-layer-1);border:1px solid var(--border-default);border-radius:8px;padding:32px;text-align:center;color:var(--text-secondary);font-size:13px;">No automations yet. Pick a preset or create one above.</div>';
      return;
    }
    wrap.innerHTML = '<div style="display:grid;gap:10px;">' +
      schedules.map(function(s) {
        var enabled = !!s.enabled;
        var last = s.last_run_at ? new Date(s.last_run_at).toLocaleString() : '—';
        var label = s.agent_title || s.agent_id || 'Agent';
        return '<div style="background:var(--bg-layer-1);border:1px solid var(--border-default);border-radius:8px;padding:14px 18px;display:flex;align-items:center;gap:16px;">' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">' +
              '<span style="font-size:13px;font-weight:600;color:var(--text-primary);">' + esc(label) + '</span>' +
              '<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:3px;' + (enabled ? 'background:rgba(38,142,108,.12);color:var(--spectrum-green);' : 'background:var(--bg-base);color:var(--text-secondary);') + '">' + (enabled ? 'ENABLED' : 'DISABLED') + '</span>' +
            '</div>' +
            '<div style="font-size:11px;color:var(--blue-500);font-family:monospace;margin-bottom:2px;">' + esc(s.cron || '') + '</div>' +
            '<div style="font-size:11px;color:var(--text-secondary);">' + esc(cronToHuman(s.cron || '')) + '</div>' +
            '<div style="font-size:10px;color:var(--text-secondary);margin-top:4px;">Last run: ' + esc(last) + '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">' +
            '<button onclick="window.autoRunNow(\'' + esc(s.agent_id) + '\')" style="background:rgba(38,142,108,.1);border:1px solid rgba(38,142,108,.3);color:var(--spectrum-green);font-size:11px;font-weight:700;padding:6px 12px;border-radius:5px;cursor:pointer;">▶ Run Now</button>' +
            '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;color:var(--text-secondary);">' +
              '<input type="checkbox" ' + (enabled ? 'checked' : '') + ' onchange="window.autoToggleSchedule(\'' + esc(s.agent_id) + '\',this.checked,\'' + esc(s.cron) + '\')" style="accent-color:var(--blue-500);cursor:pointer;" />' +
              'Enabled' +
            '</label>' +
            '<button onclick="window.autoDeleteSchedule(\'' + esc(s.agent_id) + '\')" style="background:none;border:none;color:var(--text-secondary);font-size:11px;cursor:pointer;padding:4px 8px;border-radius:4px;" onmouseenter="this.style.color=\'var(--spectrum-red)\'" onmouseleave="this.style.color=\'var(--text-secondary)\'">Delete</button>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  window.autoRunNow = function(agentId) {
    fetch('/api/agent-schedules/' + encodeURIComponent(agentId) + '/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      .then(function(r) { return r.json(); })
      .then(function() { toast('Agent triggered successfully'); })
      .catch(function() { toast('Failed to trigger agent', false); });
  };

  window.autoToggleSchedule = function(agentId, enabled, cron) {
    fetch('/api/agent-schedules/' + encodeURIComponent(agentId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cron: cron, enabled: enabled })
    })
      .then(function() { toast(enabled ? 'Automation enabled' : 'Automation disabled'); loadScheduleList(); })
      .catch(function() { toast('Update failed', false); loadScheduleList(); });
  };

  window.autoDeleteSchedule = function(agentId) {
    if (!confirm('Delete this automation? This cannot be undone.')) return;
    fetch('/api/agent-schedules/' + encodeURIComponent(agentId), { method: 'DELETE' })
      .then(function() { toast('Automation deleted'); loadScheduleList(); })
      .catch(function() { toast('Delete failed', false); });
  };

})();
