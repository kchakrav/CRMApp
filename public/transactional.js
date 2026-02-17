// ════════════════════════════════════════════════════════════════
// TRANSACTIONAL MESSAGING – Frontend Module
// 3-Entity Model: Event Templates | Events | Event Messages
// ════════════════════════════════════════════════════════════════
const TXN_API = '/api/transactional';
const _txIco = (p, s) => '<svg width="' + (s || 16) + '" height="' + (s || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';

// ──────────────────────────────────────────
// 1. MAIN VIEW — 3 tabs: Event Templates | Events | Event Messages
// ──────────────────────────────────────────
let _txnMsgFilter = { status: 'all', search: '' };
let _txnActiveTab = 'event_messages'; // 'event_templates' | 'events' | 'event_messages'

window.loadTransactionalMessages = async function () {
  if (_txnActiveTab === 'event_templates') { renderEventTemplatesTab(); return; }
  if (_txnActiveTab === 'events') { renderEventsTab(); return; }

  // ── Event Messages list ──
  try {
    showLoading();
    const [msgsResp, dashResp] = await Promise.all([
      fetch(TXN_API + '/messages'),
      fetch(TXN_API + '/dashboard')
    ]);
    const msgsData = await msgsResp.json();
    const dashData = await dashResp.json();
    let msgs = msgsData.messages || [];
    const ov = dashData.overview || {};

    // Filter
    if (_txnMsgFilter.status !== 'all') msgs = msgs.filter(m => m.status === _txnMsgFilter.status);
    if (_txnMsgFilter.search) {
      const q = _txnMsgFilter.search.toLowerCase();
      msgs = msgs.filter(m => (m.name || '').toLowerCase().includes(q) || (m.event_name || '').toLowerCase().includes(q));
    }

    let html = '';

    // Top tabs
    html += _txnTabBar();

    // Dashboard KPIs
    html += '<div class="txn-dash-grid">';
    html += _txnKpi('Events Received', ov.total_received || 0, _txIco('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>', 18), '#8b5cf6');
    html += _txnKpi('Messages Sent', ov.total_sent || 0, _txIco('<path d="m22 2-7 20-4-9-9-4 20-7z"/>', 18), '#3b82f6');
    html += _txnKpi('Delivered', ov.total_delivered || 0, _txIco('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>', 18), '#10b981');
    html += _txnKpi('Failed', ov.total_failed || 0, _txIco('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>', 18), '#ef4444');
    html += _txnKpi('Active Messages', ov.active_messages || 0, _txIco('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', 18), '#f59e0b');
    html += _txnKpi('Avg Latency', (ov.avg_latency_ms || 0) + 'ms', _txIco('<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>', 18), '#06b6d4');
    html += '</div>';

    // Toolbar
    html += '<div class="txn-toolbar">';
    html += '<div class="txn-toolbar-left">';
    html += '<div class="inline-search"><input type="text" class="form-input inline-search-input" placeholder="Search messages..." value="' + (_txnMsgFilter.search || '') + '" oninput="_txnMsgFilter.search=this.value;loadTransactionalMessages()"><span class="search-icon">' + _txIco('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', 14) + '</span></div>';
    html += '<select class="form-input" style="width:140px" onchange="_txnMsgFilter.status=this.value;loadTransactionalMessages()">';
    ['all', 'draft', 'published'].forEach(s => {
      html += '<option value="' + s + '"' + (_txnMsgFilter.status === s ? ' selected' : '') + '>' + (s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)) + '</option>';
    });
    html += '</select></div>';
    html += '<button class="btn btn-primary" onclick="showTxnWizard()">' + _txIco('<path d="M5 12h14"/><path d="M12 5v14"/>', 14) + ' Create Message</button>';
    html += '</div>';

    // Table
    html += '<div class="card"><div class="table-container"><table class="data-table"><thead><tr>';
    html += '<th>Name</th><th>Event</th><th>Channels</th><th>Recipient</th><th>Status</th><th>Received</th><th>Sent</th><th>Delivered</th><th>Failed</th><th>Published</th><th></th>';
    html += '</tr></thead><tbody>';

    if (msgs.length === 0) {
      html += '<tr><td colspan="11" style="text-align:center;padding:2rem;color:#94a3b8">No event messages yet. Click "Create Message" to get started.</td></tr>';
    }

    msgs.forEach(function (m) {
      const st = m.status || 'draft';
      const badge = '<span class="badge badge-' + ({ published: 'success', draft: 'secondary' }[st] || 'secondary') + '">' + st + '</span>';
      const chIcons = (m.channels || []).map(function (c) {
        if (c === 'email') return _txIco('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>', 14);
        if (c === 'sms') return _txIco('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', 14);
        if (c === 'push') return _txIco('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>', 14);
        return c;
      }).join(' ');
      const modeLabel = { profile_first: 'Profile-first', event_only: 'Event-only', profile_only: 'Profile-only' }[m.recipient_mode] || m.recipient_mode;
      const stats = m.stats || {};

      const actions = [
        { icon: _txIco('<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>', 14), label: 'View Report', onclick: 'showTxnMessageReport(' + m.id + ')' },
        { icon: _txIco('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>', 14), label: 'Edit', onclick: 'editTxnMessage(' + m.id + ')' },
        { divider: true }
      ];
      if (st === 'draft') actions.push({ icon: _txIco('<path d="m22 2-7 20-4-9-9-4 20-7z"/>', 14), label: 'Publish', onclick: 'publishTxnMessage(' + m.id + ')' });
      if (st === 'published') actions.push({ icon: _txIco('<rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/>', 14), label: 'Unpublish', onclick: 'unpublishTxnMessage(' + m.id + ')' });
      actions.push({ divider: true });
      actions.push({ icon: _txIco('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', 14), label: 'Delete', onclick: 'deleteTxnMessage(' + m.id + ')', danger: true });

      html += '<tr>';
      html += '<td><strong>' + (m.name || '') + '</strong><div style="font-size:10px;color:#94a3b8">v' + (m.version || 1) + '</div></td>';
      html += '<td><span class="txn-event-chip">' + _txIco('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>', 12) + ' ' + (m.event_name || '') + '</span></td>';
      html += '<td>' + chIcons + '</td>';
      html += '<td><span class="txn-mode-chip">' + modeLabel + '</span></td>';
      html += '<td>' + badge + '</td>';
      html += '<td>' + (stats.received || 0).toLocaleString() + '</td>';
      html += '<td>' + (stats.sent || 0).toLocaleString() + '</td>';
      html += '<td>' + (stats.delivered || 0).toLocaleString() + '</td>';
      html += '<td>' + (stats.failed || 0).toLocaleString() + '</td>';
      html += '<td>' + (m.published_at ? new Date(m.published_at).toLocaleDateString() : '-') + '</td>';
      html += '<td>' + createActionMenu(90000 + m.id, actions) + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table></div></div>';

    document.getElementById('content').innerHTML = html;
  } catch (error) {
    showToast('Error loading event messages: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
};

// ── Tab bar — 3 tabs ──
function _txnTabBar() {
  return '<div class="txn-tab-bar">' +
    '<button class="txn-tab' + (_txnActiveTab === 'event_templates' ? ' active' : '') + '" onclick="switchTxnTab(\'event_templates\')">' +
      _txIco('<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>', 14) + ' Event Templates</button>' +
    '<button class="txn-tab' + (_txnActiveTab === 'events' ? ' active' : '') + '" onclick="switchTxnTab(\'events\')">' +
      _txIco('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>', 14) + ' Events</button>' +
    '<button class="txn-tab' + (_txnActiveTab === 'event_messages' ? ' active' : '') + '" onclick="switchTxnTab(\'event_messages\')">' +
      _txIco('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', 14) + ' Event Messages</button>' +
    '</div>';
}

function switchTxnTab(tab) {
  _txnActiveTab = tab;
  loadTransactionalMessages();
}

// ──────────────────────────────────────────
// 1a. EVENT TEMPLATES TAB (blueprints)
// ──────────────────────────────────────────
let _tplSearch = '';
let _tplStatusFilter = 'all';
let _tplCatFilter = '';
let _tplExpandedId = null; // which template row is expanded

async function renderEventTemplatesTab() {
  try {
    showLoading();
    var resp = await fetch(TXN_API + '/templates');
    var data = await resp.json();
    var allTemplates = data.templates || [];

    // Collect categories from unfiltered set for filter dropdown
    var cats = [];
    allTemplates.forEach(function (t) { var c = t.category || 'Custom'; if (cats.indexOf(c) === -1) cats.push(c); });
    cats.sort();

    // Apply filters
    var templates = allTemplates;
    if (_tplStatusFilter !== 'all') {
      templates = templates.filter(function (t) {
        return _tplStatusFilter === 'active' ? t.status !== 'inactive' : t.status === 'inactive';
      });
    }
    if (_tplCatFilter) {
      templates = templates.filter(function (t) { return (t.category || 'Custom') === _tplCatFilter; });
    }
    if (_tplSearch) {
      var q = _tplSearch.toLowerCase();
      templates = templates.filter(function (t) {
        return (t.name || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
      });
    }

    var html = '';
    html += _txnTabBar();

    // Summary KPIs
    var activeCount = allTemplates.filter(function (t) { return t.status !== 'inactive'; }).length;
    var disabledCount = allTemplates.filter(function (t) { return t.status === 'inactive'; }).length;
    var totalEvents = allTemplates.reduce(function (sum, t) { return sum + (t.event_count || 0); }, 0);

    html += '<div class="txn-dash-grid">';
    html += _txnKpi('Total Templates', allTemplates.length, _txIco('<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>', 18), '#8b5cf6');
    html += _txnKpi('Active', activeCount, _txIco('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>', 18), '#10b981');
    html += _txnKpi('Disabled', disabledCount, _txIco('<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>', 18), '#94a3b8');
    html += _txnKpi('Events Created', totalEvents, _txIco('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>', 18), '#f59e0b');
    html += '</div>';

    // Toolbar
    html += '<div class="txn-toolbar"><div class="txn-toolbar-left">';
    html += '<div class="inline-search"><input type="text" class="form-input inline-search-input" placeholder="Search templates..." value="' + (_tplSearch || '') + '" oninput="_tplSearch=this.value;renderEventTemplatesTab()"><span class="search-icon">' + _txIco('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', 14) + '</span></div>';
    html += '<select class="form-input" style="width:140px" onchange="_tplStatusFilter=this.value;renderEventTemplatesTab()">';
    ['all', 'active', 'disabled'].forEach(function (s) {
      html += '<option value="' + s + '"' + (_tplStatusFilter === s ? ' selected' : '') + '>' + (s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)) + '</option>';
    });
    html += '</select>';
    html += '<select class="form-input" style="width:150px" onchange="_tplCatFilter=this.value;renderEventTemplatesTab()">';
    html += '<option value=""' + (!_tplCatFilter ? ' selected' : '') + '>All Categories</option>';
    cats.forEach(function (c) {
      html += '<option value="' + c + '"' + (_tplCatFilter === c ? ' selected' : '') + '>' + c + '</option>';
    });
    html += '</select>';
    html += '</div>';
    html += '<button class="btn btn-primary" onclick="showTemplateEditor()">' + _txIco('<path d="M5 12h14"/><path d="M12 5v14"/>', 14) + ' Create Template</button>';
    html += '</div>';

    // Templates table
    html += '<div class="card"><div class="table-container"><table class="data-table"><thead><tr>';
    html += '<th style="width:28px"></th><th>Template Name</th><th>Category</th><th>Status</th><th>Attributes</th><th>Identity</th><th>Delivery</th><th>Events</th><th>Created</th><th></th>';
    html += '</tr></thead><tbody>';

    if (templates.length === 0) {
      html += '<tr><td colspan="10" style="text-align:center;padding:2rem;color:#94a3b8">No templates found. Click "Create Template" to define one.</td></tr>';
    }

    templates.forEach(function (e) {
      var isDisabled = e.status === 'inactive';
      var statusCls = isDisabled ? 'secondary' : 'success';
      var statusLabel = isDisabled ? 'disabled' : 'active';
      var attrCount = (e.attributes || []).length;
      var idCount = (e.identity_fields || []).length;
      var delCount = (e.delivery_fields || []).length;
      var evtCount = e.event_count || 0;
      var isExpanded = _tplExpandedId === e.id;

      // Action menu items
      var actions = [
        { icon: _txIco('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>', 14), label: 'Edit', onclick: 'showTemplateEditor(' + e.id + ')' },
        { icon: _txIco('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>', 14), label: 'Duplicate', onclick: 'duplicateTemplate(' + e.id + ')' },
        { divider: true }
      ];
      if (!isDisabled) {
        actions.push({ icon: _txIco('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>', 14), label: 'Create Event', onclick: 'createEventFromTemplate(' + e.id + ')' });
        actions.push({ divider: true });
        actions.push({ icon: _txIco('<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>', 14), label: 'Disable', onclick: 'disableTemplate(' + e.id + ')', danger: true });
      } else {
        actions.push({ icon: _txIco('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>', 14), label: 'Enable', onclick: 'enableTemplate(' + e.id + ')' });
      }

      // Main row
      html += '<tr style="cursor:pointer;' + (isDisabled ? 'opacity:0.6' : '') + '" onclick="toggleTplExpand(' + e.id + ')">';
      html += '<td style="text-align:center;color:#94a3b8;font-size:11px">' + (isExpanded ? '&#9660;' : '&#9654;') + '</td>';
      html += '<td><strong style="display:flex;align-items:center;gap:4px">' + _txIco('<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>', 13) + ' ' + (e.name || '') + '</strong>';
      if (e.description) html += '<div style="font-size:11px;color:#94a3b8;font-weight:400;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px">' + e.description + '</div>';
      html += '</td>';
      html += '<td><span class="txn-event-card-cat" style="font-size:10px">' + (e.category || 'Custom') + '</span></td>';
      html += '<td><span class="badge badge-' + statusCls + '">' + statusLabel + '</span></td>';
      html += '<td style="font-size:12px">' + attrCount + '</td>';
      html += '<td style="font-size:11px">' + (idCount > 0 ? (e.identity_fields || []).map(function (f) { return '<code>' + f + '</code>'; }).join(', ') : '<span style="color:#cbd5e1">—</span>') + '</td>';
      html += '<td style="font-size:11px">' + (delCount > 0 ? (e.delivery_fields || []).map(function (f) { return '<code>' + f + '</code>'; }).join(', ') : '<span style="color:#cbd5e1">—</span>') + '</td>';
      html += '<td>' + (evtCount > 0 ? '<span style="font-size:12px;font-weight:600">' + evtCount + '</span>' : '<span style="color:#cbd5e1">0</span>') + '</td>';
      html += '<td style="font-size:11px;white-space:nowrap">' + (e.created_at ? new Date(e.created_at).toLocaleDateString() : '-') + '</td>';
      html += '<td onclick="event.stopPropagation()">' + createActionMenu(90000 + e.id, actions) + '</td>';
      html += '</tr>';

      // Expandable detail row
      if (isExpanded) {
        html += '<tr class="tpl-detail-row"><td colspan="10" style="padding:0;background:#f8fafc;border-top:none">';
        html += '<div style="padding:14px 20px 14px 42px;display:flex;gap:24px;flex-wrap:wrap">';

        // Attributes table
        var attrs = e.attributes || [];
        html += '<div style="flex:1;min-width:240px">';
        html += '<div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:6px">Attributes (' + attrs.length + ')</div>';
        if (attrs.length > 0) {
          html += '<table class="txn-evtdef-attr-table" style="font-size:11px"><thead><tr><th>Name</th><th>Type</th><th>Required</th></tr></thead><tbody>';
          attrs.forEach(function (a) {
            html += '<tr><td><code>' + a.name + '</code></td><td>' + (a.type || 'string') + '</td><td>' + (a.required ? _txIco('<path d="M20 6 9 17l-5-5"/>', 12) : '-') + '</td></tr>';
          });
          html += '</tbody></table>';
        } else {
          html += '<div style="font-size:11px;color:#94a3b8">No attributes defined</div>';
        }
        html += '</div>';

        // Sample payload
        html += '<div style="flex:1;min-width:240px">';
        html += '<div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:6px">Sample Payload</div>';
        html += '<pre style="font-size:10px;background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px;margin:0;max-height:180px;overflow:auto">' + JSON.stringify(e.sample_payload || {}, null, 2) + '</pre>';
        html += '</div>';

        html += '</div></td></tr>';
      }
    });

    html += '</tbody></table></div></div>';

    // Info box
    html += '<div class="card" style="margin-top:12px;padding:12px 16px;background:#f0f9ff;border:1px solid #bae6fd">';
    html += '<div style="display:flex;align-items:flex-start;gap:8px">';
    html += '<div style="color:#0284c7;flex-shrink:0;margin-top:2px">' + _txIco('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>', 14) + '</div>';
    html += '<div style="font-size:11px;color:#0369a1">Templates are blueprints for events. They cannot be deleted — only <strong>disabled</strong>. Disabled templates are hidden from new event creation, but existing events continue to work normally.</div>';
    html += '</div></div>';

    document.getElementById('content').innerHTML = html;
  } catch (error) {
    showToast('Error loading event templates: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

function toggleTplExpand(id) {
  _tplExpandedId = _tplExpandedId === id ? null : id;
  renderEventTemplatesTab();
}

// ── Template Editor (create / edit) ──
let _tplForm = null;

async function showTemplateEditor(id) {
  if (id) {
    try {
      showLoading();
      var resp = await fetch(TXN_API + '/templates/' + id);
      var tpl = await resp.json();
      if (!resp.ok) throw new Error(tpl.error);
      _tplForm = JSON.parse(JSON.stringify(tpl));
    } catch (e) { showToast(e.message, 'error'); return; } finally { hideLoading(); }
  } else {
    _tplForm = {
      name: '', description: '', category: 'Custom',
      attributes: [{ name: '', type: 'string', required: false }],
      identity_fields: [''], delivery_fields: [''],
      sample_payload: {}, status: 'active'
    };
  }
  renderTemplateForm();
}

function renderTemplateForm() {
  var d = _tplForm;
  var isEdit = !!d.id;

  var html = '<div class="txn-wizard" style="max-width:780px">';
  html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">';
  html += '<button class="btn-back" onclick="switchTxnTab(\'event_templates\')" title="Back"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
  html += '<h2 style="margin:0;font-size:16px">' + (isEdit ? 'Edit Event Template' : 'Create Event Template') + '</h2>';
  html += '</div>';

  html += '<div class="txn-wizard-body">';

  // Basic info
  html += '<div class="form-row">';
  html += '<div class="form-group"><label class="form-label form-label-required">Template Name</label><input type="text" class="form-input" value="' + (d.name || '').replace(/"/g, '&quot;') + '" placeholder="e.g. OrderPlaced" oninput="_tplForm.name=this.value"></div>';
  html += '<div class="form-group"><label class="form-label">Category</label><select class="form-input" onchange="_tplForm.category=this.value">';
  ['Custom', 'Commerce', 'Account', 'Billing', 'Scheduling', 'Security', 'Marketing', 'Support'].forEach(function (c) {
    html += '<option' + (d.category === c ? ' selected' : '') + '>' + c + '</option>';
  });
  html += '</select></div>';
  html += '<div class="form-group"><label class="form-label">Status</label><select class="form-input" onchange="_tplForm.status=this.value"><option value="active"' + (d.status === 'active' ? ' selected' : '') + '>Active</option><option value="inactive"' + (d.status === 'inactive' ? ' selected' : '') + '>Inactive</option></select></div>';
  html += '</div>';
  html += '<div class="form-group"><label class="form-label">Description</label><textarea class="form-input" rows="2" placeholder="Describe when this event is triggered..." oninput="_tplForm.description=this.value">' + (d.description || '') + '</textarea></div>';

  // ── Attributes (dynamic rows) ──
  html += '<div class="txn-evtdef-editor-section">';
  html += '<div class="txn-evtdef-editor-section-header"><span class="txn-evtdef-editor-section-title">' + _txIco('<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>', 14) + ' Attributes</span>';
  html += '<button class="btn btn-sm btn-secondary" onclick="addTplAttr()">' + _txIco('<path d="M5 12h14"/><path d="M12 5v14"/>', 12) + ' Add</button></div>';
  html += '<table class="txn-evtdef-attr-table txn-evtdef-attr-edit"><thead><tr><th>Name</th><th>Type</th><th>Required</th><th></th></tr></thead><tbody>';
  (d.attributes || []).forEach(function (a, i) {
    html += '<tr>';
    html += '<td><input type="text" class="form-input form-input-sm" value="' + (a.name || '').replace(/"/g, '&quot;') + '" placeholder="attributeName" oninput="_tplForm.attributes[' + i + '].name=this.value"></td>';
    html += '<td><select class="form-input form-input-sm" onchange="_tplForm.attributes[' + i + '].type=this.value">';
    ['string', 'number', 'boolean', 'array', 'object'].forEach(function (t) { html += '<option' + (a.type === t ? ' selected' : '') + '>' + t + '</option>'; });
    html += '</select></td>';
    html += '<td style="text-align:center"><input type="checkbox"' + (a.required ? ' checked' : '') + ' onchange="_tplForm.attributes[' + i + '].required=this.checked"></td>';
    html += '<td><button class="btn-icon-sm" onclick="removeTplAttr(' + i + ')" title="Remove">' + _txIco('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 14) + '</button></td>';
    html += '</tr>';
  });
  html += '</tbody></table></div>';

  // ── Identity Fields ──
  html += '<div class="txn-evtdef-editor-section">';
  html += '<div class="txn-evtdef-editor-section-header"><span class="txn-evtdef-editor-section-title">' + _txIco('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>', 14) + ' Identity Fields</span>';
  html += '<button class="btn btn-sm btn-secondary" onclick="addTplIdentityField()">' + _txIco('<path d="M5 12h14"/><path d="M12 5v14"/>', 12) + ' Add</button></div>';
  html += '<div class="txn-evtdef-field-rows">';
  (d.identity_fields || []).forEach(function (f, i) {
    html += '<div class="txn-evtdef-field-row">';
    html += '<input type="text" class="form-input form-input-sm" value="' + (f || '') + '" placeholder="e.g. userId" oninput="_tplForm.identity_fields[' + i + ']=this.value">';
    html += '<button class="btn-icon-sm" onclick="removeTplIdentityField(' + i + ')" title="Remove">' + _txIco('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 14) + '</button>';
    html += '</div>';
  });
  html += '</div></div>';

  // ── Delivery Fields ──
  html += '<div class="txn-evtdef-editor-section">';
  html += '<div class="txn-evtdef-editor-section-header"><span class="txn-evtdef-editor-section-title">' + _txIco('<path d="m22 2-7 20-4-9-9-4 20-7z"/>', 14) + ' Delivery Fields</span>';
  html += '<button class="btn btn-sm btn-secondary" onclick="addTplDeliveryField()">' + _txIco('<path d="M5 12h14"/><path d="M12 5v14"/>', 12) + ' Add</button></div>';
  html += '<div class="txn-evtdef-field-rows">';
  (d.delivery_fields || []).forEach(function (f, i) {
    html += '<div class="txn-evtdef-field-row">';
    html += '<input type="text" class="form-input form-input-sm" value="' + (f || '') + '" placeholder="e.g. email, phone" oninput="_tplForm.delivery_fields[' + i + ']=this.value">';
    html += '<button class="btn-icon-sm" onclick="removeTplDeliveryField(' + i + ')" title="Remove">' + _txIco('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 14) + '</button>';
    html += '</div>';
  });
  html += '</div></div>';

  // ── Sample Payload ──
  html += '<div class="txn-evtdef-editor-section">';
  html += '<div class="txn-evtdef-editor-section-header"><span class="txn-evtdef-editor-section-title">' + _txIco('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>', 14) + ' Sample Payload</span>';
  html += '<button class="btn btn-sm btn-secondary" onclick="autoGenTplPayload()">' + _txIco('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21"/>', 12) + ' Auto-generate</button></div>';
  html += '<textarea class="form-input" id="tpl-payload-editor" rows="6" style="font-family:monospace;font-size:11px" oninput="parseTplPayload(this.value)">' + JSON.stringify(d.sample_payload || {}, null, 2) + '</textarea>';
  html += '<span class="form-helper">JSON object representing a typical event payload. Used for preview and testing.</span>';
  html += '</div>';

  html += '</div>'; // end wizard-body

  // Footer
  html += '<div class="txn-wizard-footer">';
  html += '<button class="btn btn-secondary" onclick="switchTxnTab(\'event_templates\')">Cancel</button>';
  html += '<button class="btn btn-primary" onclick="saveTemplate()">' + _txIco('<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>', 14) + ' ' + (isEdit ? 'Save Changes' : 'Create Template') + '</button>';
  html += '</div></div>';

  document.getElementById('content').innerHTML = html;
}

// Template CRUD helpers
function addTplAttr() { _tplForm.attributes.push({ name: '', type: 'string', required: false }); renderTemplateForm(); }
function removeTplAttr(i) { _tplForm.attributes.splice(i, 1); renderTemplateForm(); }
function addTplIdentityField() { _tplForm.identity_fields.push(''); renderTemplateForm(); }
function removeTplIdentityField(i) { _tplForm.identity_fields.splice(i, 1); renderTemplateForm(); }
function addTplDeliveryField() { _tplForm.delivery_fields.push(''); renderTemplateForm(); }
function removeTplDeliveryField(i) { _tplForm.delivery_fields.splice(i, 1); renderTemplateForm(); }
function parseTplPayload(val) { try { _tplForm.sample_payload = JSON.parse(val); } catch (e) { /* ignore */ } }

function autoGenTplPayload() {
  var payload = {};
  (_tplForm.attributes || []).forEach(function (a) {
    if (!a.name) return;
    if (a.type === 'string') payload[a.name] = 'sample_' + a.name;
    else if (a.type === 'number') payload[a.name] = 100;
    else if (a.type === 'boolean') payload[a.name] = true;
    else if (a.type === 'array') payload[a.name] = [];
    else if (a.type === 'object') payload[a.name] = {};
    else payload[a.name] = '';
  });
  (_tplForm.identity_fields || []).forEach(function (f) { if (f && !payload[f]) payload[f] = 'USR-001'; });
  (_tplForm.delivery_fields || []).forEach(function (f) {
    if (!f || payload[f]) return;
    if (f.includes('email')) payload[f] = 'user@example.com';
    else if (f.includes('phone')) payload[f] = '+15551234567';
    else if (f.includes('push') || f.includes('token')) payload[f] = 'tok_abc123';
    else payload[f] = 'value_' + f;
  });
  _tplForm.sample_payload = payload;
  var el = document.getElementById('tpl-payload-editor');
  if (el) el.value = JSON.stringify(payload, null, 2);
  showToast('Payload auto-generated from attributes', 'success');
}

async function saveTemplate() {
  var d = _tplForm;
  if (!d.name || !d.name.trim()) { showToast('Template name is required', 'warning'); return; }
  d.attributes = (d.attributes || []).filter(function (a) { return a.name && a.name.trim(); });
  d.identity_fields = (d.identity_fields || []).filter(function (f) { return f && f.trim(); });
  d.delivery_fields = (d.delivery_fields || []).filter(function (f) { return f && f.trim(); });
  if (d.identity_fields.length === 0 && d.delivery_fields.length === 0) {
    showToast('At least one identity or delivery field is required', 'warning'); return;
  }
  try {
    showLoading();
    var url = d.id ? TXN_API + '/templates/' + d.id : TXN_API + '/templates';
    var method = d.id ? 'PUT' : 'POST';
    var resp = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
    if (!resp.ok) throw new Error((await resp.json()).error);
    showToast(d.id ? 'Template updated' : 'Template created', 'success');
    _txnActiveTab = 'event_templates';
    loadTransactionalMessages();
  } catch (e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

async function duplicateTemplate(id) {
  try {
    showLoading();
    var resp = await fetch(TXN_API + '/templates/' + id);
    var tpl = await resp.json();
    if (!resp.ok) throw new Error(tpl.error);
    delete tpl.id; delete tpl.created_at; delete tpl.updated_at;
    tpl.name = tpl.name + ' (Copy)';
    var createResp = await fetch(TXN_API + '/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tpl) });
    if (!createResp.ok) throw new Error((await createResp.json()).error);
    showToast('Template duplicated', 'success');
    renderEventTemplatesTab();
  } catch (e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

async function disableTemplate(id) {
  if (!confirm('Disable this template? Existing events will keep working, but no new events can be created from it.')) return;
  try {
    showLoading();
    var resp = await fetch(TXN_API + '/templates/' + id + '/disable', { method: 'POST' });
    if (!resp.ok) throw new Error((await resp.json()).error);
    showToast('Template disabled', 'success');
    renderEventTemplatesTab();
  } catch (e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

async function enableTemplate(id) {
  try {
    showLoading();
    var resp = await fetch(TXN_API + '/templates/' + id + '/enable', { method: 'POST' });
    if (!resp.ok) throw new Error((await resp.json()).error);
    showToast('Template enabled', 'success');
    renderEventTemplatesTab();
  } catch (e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

// Create event from a template — prompts for name, then navigates to Events tab
async function createEventFromTemplate(templateId) {
  var name = prompt('Enter a name for the new event:');
  if (!name || !name.trim()) return;
  try {
    showLoading();
    var resp = await fetch(TXN_API + '/event-instances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), template_id: templateId })
    });
    if (!resp.ok) throw new Error((await resp.json()).error);
    showToast('Event created from template', 'success');
    _txnActiveTab = 'events';
    loadTransactionalMessages();
  } catch (e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

// ──────────────────────────────────────────
// 1b. EVENTS TAB (instances from templates)
// ──────────────────────────────────────────
let _evtSearch = '';
let _evtStatusFilter = 'all';

async function renderEventsTab() {
  try {
    showLoading();
    var resp = await fetch(TXN_API + '/event-instances');
    var data = await resp.json();
    var events = data.events || [];

    // Filters
    if (_evtStatusFilter !== 'all') events = events.filter(function (e) { return e.status === _evtStatusFilter; });
    if (_evtSearch) {
      var q = _evtSearch.toLowerCase();
      events = events.filter(function (e) {
        return (e.name || '').toLowerCase().includes(q) || (e.template_name || '').toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q);
      });
    }

    var html = '';
    html += _txnTabBar();

    // Summary bar
    var allEvts = data.events || [];
    var pubCount = allEvts.filter(function (e) { return e.status === 'published'; }).length;
    var draftCount = allEvts.filter(function (e) { return e.status === 'draft'; }).length;

    html += '<div class="txn-dash-grid">';
    html += _txnKpi('Total Events', allEvts.length, _txIco('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>', 18), '#8b5cf6');
    html += _txnKpi('Published', pubCount, _txIco('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>', 18), '#10b981');
    html += _txnKpi('Draft', draftCount, _txIco('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>', 18), '#f59e0b');
    html += '</div>';

    // Toolbar
    html += '<div class="txn-toolbar"><div class="txn-toolbar-left">';
    html += '<div class="inline-search"><input type="text" class="form-input inline-search-input" placeholder="Search events..." value="' + (_evtSearch || '') + '" oninput="_evtSearch=this.value;renderEventsTab()"><span class="search-icon">' + _txIco('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', 14) + '</span></div>';
    html += '<select class="form-input" style="width:140px" onchange="_evtStatusFilter=this.value;renderEventsTab()">';
    ['all', 'draft', 'published'].forEach(function (s) {
      html += '<option value="' + s + '"' + (_evtStatusFilter === s ? ' selected' : '') + '>' + (s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)) + '</option>';
    });
    html += '</select></div>';
    html += '<button class="btn btn-primary" onclick="showCreateEventDialog()">' + _txIco('<path d="M5 12h14"/><path d="M12 5v14"/>', 14) + ' Create Event</button>';
    html += '</div>';

    // Events table
    html += '<div class="card"><div class="table-container"><table class="data-table"><thead><tr>';
    html += '<th>Event Name</th><th>Template</th><th>Category</th><th>Status</th><th>Messages</th><th>Identity Fields</th><th>Delivery Fields</th><th>Created</th><th></th>';
    html += '</tr></thead><tbody>';

    if (events.length === 0) {
      html += '<tr><td colspan="9" style="text-align:center;padding:2rem;color:#94a3b8">No events found. Create an event from a template to get started.</td></tr>';
    }

    events.forEach(function (e) {
      var st = e.status || 'draft';
      var badge = '<span class="badge badge-' + ({ published: 'success', draft: 'secondary' }[st] || 'secondary') + '">' + st + '</span>';
      var msgInfo = (e.message_count || 0) + ' total';
      if (e.published_message_count > 0) msgInfo += ' <span class="badge badge-info" style="font-size:9px">' + e.published_message_count + ' live</span>';

      var actions = [
        { icon: _txIco('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>', 14), label: 'Edit', onclick: 'showEventEditor(' + e.id + ')' },
        { divider: true }
      ];
      if (st === 'draft') {
        actions.push({ icon: _txIco('<path d="m22 2-7 20-4-9-9-4 20-7z"/>', 14), label: 'Publish', onclick: 'publishEvent(' + e.id + ')' });
      }
      if (st === 'published') {
        actions.push({ icon: _txIco('<rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/>', 14), label: 'Unpublish', onclick: 'unpublishEvent(' + e.id + ')' });
      }
      actions.push({ divider: true });
      actions.push({ icon: _txIco('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', 14), label: 'Delete', onclick: 'deleteEvent(' + e.id + ')', danger: true });

      html += '<tr>';
      html += '<td><strong>' + _txIco('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>', 12) + ' ' + (e.name || '') + '</strong></td>';
      html += '<td><span class="txn-event-chip" style="font-size:11px">' + _txIco('<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>', 11) + ' ' + (e.template_name || 'Custom') + '</span></td>';
      html += '<td><span class="txn-event-card-cat" style="font-size:10px">' + (e.category || 'Custom') + '</span></td>';
      html += '<td>' + badge + '</td>';
      html += '<td>' + msgInfo + '</td>';
      html += '<td style="font-size:11px">' + (e.identity_fields || []).map(function (f) { return '<code>' + f + '</code>'; }).join(', ') + '</td>';
      html += '<td style="font-size:11px">' + (e.delivery_fields || []).map(function (f) { return '<code>' + f + '</code>'; }).join(', ') + '</td>';
      html += '<td style="font-size:11px;white-space:nowrap">' + (e.created_at ? new Date(e.created_at).toLocaleDateString() : '-') + '</td>';
      html += '<td>' + createActionMenu(80000 + e.id, actions) + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table></div></div>';

    // Info box about lifecycle
    html += '<div class="card" style="margin-top:12px;padding:12px 16px;background:#f0f9ff;border:1px solid #bae6fd">';
    html += '<div style="display:flex;align-items:flex-start;gap:8px">';
    html += '<div style="color:#0284c7;flex-shrink:0;margin-top:2px">' + _txIco('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>', 16) + '</div>';
    html += '<div style="font-size:12px;color:#0369a1"><strong>Lifecycle Rules:</strong> Events can be created from a template or from scratch. An event must be <strong>Published</strong> before it can be linked to a message. ';
    html += 'Published events are <strong>locked for editing</strong> — unpublish first to make changes. ';
    html += 'An event cannot be unpublished while any of its messages are still published.</div>';
    html += '</div></div>';

    document.getElementById('content').innerHTML = html;
  } catch (error) {
    showToast('Error loading events: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

// Create event — pick template dialog
async function showCreateEventDialog() {
  try {
    showLoading();
    var resp = await fetch(TXN_API + '/templates?status=active');
    var data = await resp.json();
    var templates = data.templates || [];
    hideLoading();

    // Build selection UI
    var html = '<div class="txn-wizard" style="max-width:700px">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">';
    html += '<button class="btn-back" onclick="switchTxnTab(\'events\')" title="Back"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
    html += '<h2 style="margin:0;font-size:16px">Create Event</h2>';
    html += '</div>';

    html += '<div class="txn-wizard-body">';
    html += '<div class="form-group"><label class="form-label form-label-required">Event Name</label>';
    html += '<input type="text" class="form-input" id="new-event-name" placeholder="e.g. Order Placed - US Region"></div>';

    // Label
    html += '<div class="form-group" style="margin-bottom:8px"><label class="form-label" style="margin:0">Start from a template or create from scratch</label></div>';

    // "From Scratch" — always visible, outside the scrollable list
    html += '<div class="txn-event-card" onclick="selectTemplateForEvent(null,this)" data-tpl-id="scratch" style="margin-bottom:10px">';
    html += '<div class="txn-event-card-header"><div class="txn-event-card-radio">' + _txIco('<circle cx="12" cy="12" r="10"/>', 16) + '</div>';
    html += '<div><div class="txn-event-card-name">' + _txIco('<path d="M5 12h14"/><path d="M12 5v14"/>', 14) + ' Create from Scratch</div><div class="txn-event-card-desc">Start with a blank event — define your own attributes, identity, and delivery fields.</div></div>';
    html += '<span class="txn-event-card-cat">Custom</span></div></div>';

    // Divider with count
    html += '<div style="display:flex;align-items:center;gap:10px;margin:6px 0 10px">';
    html += '<div style="flex:1;height:1px;background:#e2e8f0"></div>';
    html += '<span style="font-size:11px;color:#94a3b8;white-space:nowrap">or choose from ' + templates.length + ' template' + (templates.length !== 1 ? 's' : '') + '</span>';
    html += '<div style="flex:1;height:1px;background:#e2e8f0"></div>';
    html += '</div>';

    // Search + category filter for templates
    var cats = [];
    templates.forEach(function (t) { var c = t.category || 'Custom'; if (cats.indexOf(c) === -1) cats.push(c); });
    cats.sort();
    html += '<div style="display:flex;gap:8px;margin-bottom:10px">';
    html += '<div class="inline-search" style="flex:1">';
    html += '<input type="text" class="form-input inline-search-input" id="tpl-picker-search" placeholder="Search templates..." oninput="filterCreateEventTemplates()">';
    html += '<span class="search-icon">' + _txIco('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', 14) + '</span></div>';
    html += '<select class="form-input" id="tpl-picker-cat" onchange="filterCreateEventTemplates()" style="width:auto;min-width:120px">';
    html += '<option value="">All categories</option>';
    cats.forEach(function (c) { html += '<option value="' + c + '">' + c + '</option>'; });
    html += '</select>';
    html += '</div>';

    // Scrollable template list
    html += '<div class="txn-event-grid" id="tpl-picker-list" style="max-height:320px;overflow-y:auto;padding-right:4px">';
    html += '<div id="tpl-picker-noresults" style="display:none;text-align:center;padding:24px 0;color:#94a3b8;font-size:12px">' + _txIco('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', 16) + ' No templates match your search</div>';
    templates.forEach(function (t) {
      var attrCount = (t.attributes || []).length;
      html += '<div class="txn-event-card txn-tpl-pick-card" onclick="selectTemplateForEvent(' + t.id + ',this)" data-tpl-id="' + t.id + '" data-tpl-name="' + (t.name || '').toLowerCase() + '" data-tpl-cat="' + (t.category || 'Custom') + '" data-tpl-desc="' + (t.description || '').toLowerCase() + '">';
      html += '<div class="txn-event-card-header"><div class="txn-event-card-radio">' + _txIco('<circle cx="12" cy="12" r="10"/>', 16) + '</div>';
      html += '<div style="flex:1;min-width:0"><div class="txn-event-card-name" style="display:flex;align-items:center;gap:6px">' + _txIco('<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>', 14) + ' ' + t.name + '</div>';
      html += '<div class="txn-event-card-desc" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (t.description || '') + '</div></div>';
      html += '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0">';
      html += '<span style="font-size:10px;color:#94a3b8">' + attrCount + ' attr' + (attrCount !== 1 ? 's' : '') + '</span>';
      html += '<span class="txn-event-card-cat">' + (t.category || 'Custom') + '</span>';
      html += '</div></div>';

      // Collapsed detail — shown only when selected
      html += '<div class="txn-tpl-pick-detail" style="display:none;margin-top:8px;padding-top:8px;border-top:1px solid #f1f5f9">';
      html += '<div class="txn-attr-section"><span class="txn-attr-label">Attributes:</span> ' + (t.attributes || []).map(function (a) { return '<code>' + a.name + '</code>'; }).join(', ') + '</div>';
      html += '<div class="txn-attr-section"><span class="txn-attr-label">Identity:</span> ' + (t.identity_fields || []).map(function (f) { return '<code>' + f + '</code>'; }).join(', ') + '</div>';
      html += '<div class="txn-attr-section"><span class="txn-attr-label">Delivery:</span> ' + (t.delivery_fields || []).map(function (f) { return '<code>' + f + '</code>'; }).join(', ') + '</div>';
      html += '</div>';

      html += '</div>';
    });
    html += '</div>';
    html += '</div>';

    html += '<div class="txn-wizard-footer">';
    html += '<button class="btn btn-secondary" onclick="switchTxnTab(\'events\')">Cancel</button>';
    html += '<button class="btn btn-primary" id="create-event-btn" onclick="submitCreateEvent()" disabled>' + _txIco('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>', 14) + ' Create Event</button>';
    html += '</div></div>';

    document.getElementById('content').innerHTML = html;
  } catch (e) { showToast(e.message, 'error'); hideLoading(); }
}

var _selectedTemplateId = undefined; // undefined = not selected, null = from scratch, number = template ID
function selectTemplateForEvent(tplId, card) {
  _selectedTemplateId = tplId;
  document.querySelectorAll('.txn-event-card').forEach(function (c) { c.classList.remove('selected'); });
  card.classList.add('selected');
  document.querySelectorAll('.txn-event-card-radio').forEach(function (r) {
    r.innerHTML = _txIco('<circle cx="12" cy="12" r="10"/>', 16);
  });
  card.querySelector('.txn-event-card-radio').innerHTML = _txIco('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>', 16);
  // Collapse all details, expand selected
  document.querySelectorAll('.txn-tpl-pick-detail').forEach(function (d) { d.style.display = 'none'; });
  var detail = card.querySelector('.txn-tpl-pick-detail');
  if (detail) detail.style.display = 'block';
  var btn = document.getElementById('create-event-btn');
  if (btn) btn.disabled = false;
}

function filterCreateEventTemplates() {
  var q = (document.getElementById('tpl-picker-search') || {}).value || '';
  q = q.toLowerCase().trim();
  var cat = (document.getElementById('tpl-picker-cat') || {}).value || '';
  var cards = document.querySelectorAll('.txn-tpl-pick-card');
  var visible = 0;
  cards.forEach(function (c) {
    var name = c.getAttribute('data-tpl-name') || '';
    var desc = c.getAttribute('data-tpl-desc') || '';
    var cardCat = c.getAttribute('data-tpl-cat') || '';
    var matchSearch = !q || name.indexOf(q) !== -1 || desc.indexOf(q) !== -1;
    var matchCat = !cat || cardCat === cat;
    if (matchSearch && matchCat) {
      c.style.display = '';
      visible++;
    } else {
      c.style.display = 'none';
    }
  });
  // Show "no results" if needed
  var noRes = document.getElementById('tpl-picker-noresults');
  if (noRes) noRes.style.display = visible === 0 ? 'block' : 'none';
}

async function submitCreateEvent() {
  var name = (document.getElementById('new-event-name') || {}).value || '';
  if (!name.trim()) { showToast('Please enter an event name', 'warning'); return; }
  if (_selectedTemplateId === undefined) { showToast('Please select a starting point', 'warning'); return; }
  try {
    showLoading();
    var body = { name: name.trim() };
    if (_selectedTemplateId !== null) body.template_id = _selectedTemplateId;
    var resp = await fetch(TXN_API + '/event-instances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!resp.ok) throw new Error((await resp.json()).error);
    var created = await resp.json();
    showToast('Event created successfully', 'success');
    _selectedTemplateId = undefined;
    // If created from scratch, go to editor immediately
    if (body.template_id === undefined) {
      showEventEditor(created.id);
    } else {
      _txnActiveTab = 'events';
      loadTransactionalMessages();
    }
  } catch (e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

// Event editor (edit attributes, fields, etc.)
let _evtForm = null;

async function showEventEditor(id) {
  try {
    showLoading();
    var resp = await fetch(TXN_API + '/event-instances/' + id);
    var evt = await resp.json();
    if (!resp.ok) throw new Error(evt.error);
    _evtForm = JSON.parse(JSON.stringify(evt));
  } catch (e) { showToast(e.message, 'error'); return; } finally { hideLoading(); }
  renderEventForm();
}

function renderEventForm() {
  var d = _evtForm;
  var isPublished = d.status === 'published';
  var html = '<div class="txn-wizard" style="max-width:780px">';
  html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">';
  html += '<button class="btn-back" onclick="switchTxnTab(\'events\')" title="Back"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
  html += '<h2 style="margin:0;font-size:16px">' + (isPublished ? 'View Event' : 'Edit Event') + '</h2>';
  html += '<span class="badge badge-' + (isPublished ? 'success' : 'secondary') + '" style="margin-left:8px">' + (d.status || 'draft') + '</span>';
  html += '</div>';

  html += '<div class="txn-wizard-body">';

  // Published lock banner
  if (isPublished) {
    html += '<div class="card" style="padding:12px 16px;background:#fef3c7;border:1px solid #fbbf24;margin-bottom:16px">';
    html += '<div style="display:flex;align-items:center;gap:8px">';
    html += '<div style="color:#d97706;flex-shrink:0">' + _txIco('<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', 18) + '</div>';
    html += '<div style="font-size:12px;color:#92400e"><strong>This event is published and locked for editing.</strong> To make changes, unpublish it first, edit, then republish.</div>';
    html += '<button class="btn btn-sm btn-secondary" onclick="unpublishEvent(' + d.id + ')" style="margin-left:auto;white-space:nowrap">' + _txIco('<rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/>', 12) + ' Unpublish</button>';
    html += '</div></div>';
  }

  // Info card showing template origin
  html += '<div class="card" style="padding:10px 14px;background:#f8fafc;margin-bottom:16px;border:1px solid #e2e8f0">';
  html += '<div style="font-size:11px;color:#64748b">Based on template: <strong>' + (d.template_name || 'Custom (from scratch)') + '</strong></div>';
  html += '</div>';

  var _dis = isPublished ? ' disabled' : '';
  var _disClass = isPublished ? ' style="opacity:0.6;pointer-events:none"' : '';

  // Basic info
  html += '<div class="form-row">';
  html += '<div class="form-group"><label class="form-label form-label-required">Event Name</label><input type="text" class="form-input" value="' + (d.name || '').replace(/"/g, '&quot;') + '" oninput="_evtForm.name=this.value"' + _dis + '></div>';
  html += '<div class="form-group"><label class="form-label">Category</label><select class="form-input" onchange="_evtForm.category=this.value"' + _dis + '>';
  ['Custom', 'Commerce', 'Account', 'Billing', 'Scheduling', 'Security', 'Marketing', 'Support'].forEach(function (c) {
    html += '<option' + (d.category === c ? ' selected' : '') + '>' + c + '</option>';
  });
  html += '</select></div></div>';
  html += '<div class="form-group"><label class="form-label">Description</label><textarea class="form-input" rows="2" oninput="_evtForm.description=this.value"' + _dis + '>' + (d.description || '') + '</textarea></div>';

  // Attributes
  html += '<div class="txn-evtdef-editor-section"' + _disClass + '>';
  html += '<div class="txn-evtdef-editor-section-header"><span class="txn-evtdef-editor-section-title">' + _txIco('<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>', 14) + ' Attributes</span>';
  if (!isPublished) html += '<button class="btn btn-sm btn-secondary" onclick="addEvtAttr()">' + _txIco('<path d="M5 12h14"/><path d="M12 5v14"/>', 12) + ' Add</button>';
  html += '</div>';
  html += '<table class="txn-evtdef-attr-table txn-evtdef-attr-edit"><thead><tr><th>Name</th><th>Type</th><th>Required</th>' + (isPublished ? '' : '<th></th>') + '</tr></thead><tbody>';
  (d.attributes || []).forEach(function (a, i) {
    html += '<tr>';
    html += '<td><input type="text" class="form-input form-input-sm" value="' + (a.name || '').replace(/"/g, '&quot;') + '" oninput="_evtForm.attributes[' + i + '].name=this.value"' + _dis + '></td>';
    html += '<td><select class="form-input form-input-sm" onchange="_evtForm.attributes[' + i + '].type=this.value"' + _dis + '>';
    ['string', 'number', 'boolean', 'array', 'object'].forEach(function (t) { html += '<option' + (a.type === t ? ' selected' : '') + '>' + t + '</option>'; });
    html += '</select></td>';
    html += '<td style="text-align:center"><input type="checkbox"' + (a.required ? ' checked' : '') + ' onchange="_evtForm.attributes[' + i + '].required=this.checked"' + _dis + '></td>';
    if (!isPublished) html += '<td><button class="btn-icon-sm" onclick="removeEvtAttr(' + i + ')">' + _txIco('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 14) + '</button></td>';
    html += '</tr>';
  });
  html += '</tbody></table></div>';

  // Identity Fields
  html += '<div class="txn-evtdef-editor-section"' + _disClass + '>';
  html += '<div class="txn-evtdef-editor-section-header"><span class="txn-evtdef-editor-section-title">' + _txIco('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>', 14) + ' Identity Fields</span>';
  if (!isPublished) html += '<button class="btn btn-sm btn-secondary" onclick="addEvtIdentityField()">' + _txIco('<path d="M5 12h14"/><path d="M12 5v14"/>', 12) + ' Add</button>';
  html += '</div>';
  html += '<div class="txn-evtdef-field-rows">';
  (d.identity_fields || []).forEach(function (f, i) {
    html += '<div class="txn-evtdef-field-row"><input type="text" class="form-input form-input-sm" value="' + (f || '') + '" oninput="_evtForm.identity_fields[' + i + ']=this.value"' + _dis + '>';
    if (!isPublished) html += '<button class="btn-icon-sm" onclick="removeEvtIdentityField(' + i + ')">' + _txIco('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 14) + '</button>';
    html += '</div>';
  });
  html += '</div></div>';

  // Delivery Fields
  html += '<div class="txn-evtdef-editor-section"' + _disClass + '>';
  html += '<div class="txn-evtdef-editor-section-header"><span class="txn-evtdef-editor-section-title">' + _txIco('<path d="m22 2-7 20-4-9-9-4 20-7z"/>', 14) + ' Delivery Fields</span>';
  if (!isPublished) html += '<button class="btn btn-sm btn-secondary" onclick="addEvtDeliveryField()">' + _txIco('<path d="M5 12h14"/><path d="M12 5v14"/>', 12) + ' Add</button>';
  html += '</div>';
  html += '<div class="txn-evtdef-field-rows">';
  (d.delivery_fields || []).forEach(function (f, i) {
    html += '<div class="txn-evtdef-field-row"><input type="text" class="form-input form-input-sm" value="' + (f || '') + '" oninput="_evtForm.delivery_fields[' + i + ']=this.value"' + _dis + '>';
    if (!isPublished) html += '<button class="btn-icon-sm" onclick="removeEvtDeliveryField(' + i + ')">' + _txIco('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 14) + '</button>';
    html += '</div>';
  });
  html += '</div></div>';

  // Sample Payload
  html += '<div class="txn-evtdef-editor-section">';
  html += '<div class="txn-evtdef-editor-section-header"><span class="txn-evtdef-editor-section-title">' + _txIco('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>', 14) + ' Sample Payload</span></div>';
  html += '<textarea class="form-input" id="evt-payload-editor" rows="5" style="font-family:monospace;font-size:11px" oninput="parseEvtPayload(this.value)"' + _dis + '>' + JSON.stringify(d.sample_payload || {}, null, 2) + '</textarea>';
  html += '</div>';

  // Linked messages
  if (d.messages && d.messages.length > 0) {
    html += '<div class="txn-evtdef-editor-section">';
    html += '<div class="txn-evtdef-editor-section-header"><span class="txn-evtdef-editor-section-title">' + _txIco('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', 14) + ' Linked Messages (' + d.messages.length + ')</span></div>';
    html += '<table class="txn-evtdef-attr-table"><thead><tr><th>Name</th><th>Channels</th><th>Status</th></tr></thead><tbody>';
    d.messages.forEach(function (m) {
      html += '<tr><td>' + m.name + '</td><td>' + (m.channels || []).join(', ').toUpperCase() + '</td><td><span class="badge badge-' + (m.status === 'published' ? 'success' : 'secondary') + '">' + m.status + '</span></td></tr>';
    });
    html += '</tbody></table></div>';
  }

  html += '</div>'; // end wizard-body

  html += '<div class="txn-wizard-footer">';
  html += '<button class="btn btn-secondary" onclick="switchTxnTab(\'events\')">' + (isPublished ? 'Back' : 'Cancel') + '</button>';
  if (!isPublished) {
    html += '<button class="btn btn-primary" onclick="saveEvent()">' + _txIco('<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>', 14) + ' Save Changes</button>';
  }
  html += '</div></div>';

  document.getElementById('content').innerHTML = html;
}

// Event form helpers
function addEvtAttr() { _evtForm.attributes.push({ name: '', type: 'string', required: false }); renderEventForm(); }
function removeEvtAttr(i) { _evtForm.attributes.splice(i, 1); renderEventForm(); }
function addEvtIdentityField() { _evtForm.identity_fields.push(''); renderEventForm(); }
function removeEvtIdentityField(i) { _evtForm.identity_fields.splice(i, 1); renderEventForm(); }
function addEvtDeliveryField() { _evtForm.delivery_fields.push(''); renderEventForm(); }
function removeEvtDeliveryField(i) { _evtForm.delivery_fields.splice(i, 1); renderEventForm(); }
function parseEvtPayload(val) { try { _evtForm.sample_payload = JSON.parse(val); } catch (e) { /* ignore */ } }

async function saveEvent() {
  var d = _evtForm;
  if (!d.name || !d.name.trim()) { showToast('Event name is required', 'warning'); return; }
  d.attributes = (d.attributes || []).filter(function (a) { return a.name && a.name.trim(); });
  d.identity_fields = (d.identity_fields || []).filter(function (f) { return f && f.trim(); });
  d.delivery_fields = (d.delivery_fields || []).filter(function (f) { return f && f.trim(); });
  try {
    showLoading();
    var resp = await fetch(TXN_API + '/event-instances/' + d.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: d.name, description: d.description, category: d.category, attributes: d.attributes, identity_fields: d.identity_fields, delivery_fields: d.delivery_fields, sample_payload: d.sample_payload })
    });
    if (!resp.ok) throw new Error((await resp.json()).error);
    showToast('Event updated', 'success');
    _txnActiveTab = 'events';
    loadTransactionalMessages();
  } catch (e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

async function publishEvent(id) {
  try {
    showLoading();
    var resp = await fetch(TXN_API + '/event-instances/' + id + '/publish', { method: 'POST' });
    if (!resp.ok) throw new Error((await resp.json()).error);
    showToast('Event published', 'success');
    renderEventsTab();
  } catch (e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

async function unpublishEvent(id) {
  try {
    showLoading();
    var resp = await fetch(TXN_API + '/event-instances/' + id + '/unpublish', { method: 'POST' });
    if (!resp.ok) throw new Error((await resp.json()).error);
    showToast('Event unpublished', 'success');
    renderEventsTab();
  } catch (e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

async function deleteEvent(id) {
  if (!confirm('Delete this event? This cannot be undone.')) return;
  try {
    showLoading();
    var resp = await fetch(TXN_API + '/event-instances/' + id, { method: 'DELETE' });
    if (!resp.ok) throw new Error((await resp.json()).error);
    showToast('Event deleted', 'success');
    renderEventsTab();
  } catch (e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

// ──────────────────────────────────────────
// KPI helper
// ──────────────────────────────────────────
function _txnKpi(title, value, icon, color) {
  return '<div class="txn-kpi" style="border-left:3px solid ' + color + '"><div class="txn-kpi-icon" style="color:' + color + '">' + icon + '</div><div class="txn-kpi-body"><div class="txn-kpi-value">' + (typeof value === 'number' ? value.toLocaleString() : value) + '</div><div class="txn-kpi-title">' + title + '</div></div></div>';
}

// ── Event Message CRUD actions ──
async function publishTxnMessage(id) {
  try {
    showLoading();
    const resp = await fetch(TXN_API + '/messages/' + id + '/publish', { method: 'POST' });
    if (!resp.ok) throw new Error((await resp.json()).error);
    showToast('Message published', 'success');
    loadTransactionalMessages();
  } catch (e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

async function unpublishTxnMessage(id) {
  try {
    showLoading();
    const resp = await fetch(TXN_API + '/messages/' + id + '/disable', { method: 'POST' });
    if (!resp.ok) throw new Error((await resp.json()).error);
    showToast('Message unpublished', 'success');
    loadTransactionalMessages();
  } catch (e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

async function deleteTxnMessage(id) {
  if (!confirm('Delete this event message? Published messages must be unpublished first.')) return;
  try {
    showLoading();
    const resp = await fetch(TXN_API + '/messages/' + id, { method: 'DELETE' });
    if (!resp.ok) throw new Error((await resp.json()).error);
    showToast('Message deleted', 'success');
    loadTransactionalMessages();
  } catch (e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

// ──────────────────────────────────────────
// 2. EVENT HISTORY VIEW
// ──────────────────────────────────────────
let _evtFilter = { event_name: '', status: '', channel: '' };

window.loadEventHistory = async function () {
  try {
    showLoading();
    let qs = '?limit=100';
    if (_evtFilter.event_name) qs += '&event_name=' + encodeURIComponent(_evtFilter.event_name);
    if (_evtFilter.status) qs += '&status=' + encodeURIComponent(_evtFilter.status);
    if (_evtFilter.channel) qs += '&channel=' + encodeURIComponent(_evtFilter.channel);

    const [logsResp, evtsResp, dashResp] = await Promise.all([
      fetch(TXN_API + '/history' + qs),
      fetch(TXN_API + '/event-instances'),
      fetch(TXN_API + '/dashboard')
    ]);
    const logsData = await logsResp.json();
    const evtsData = await evtsResp.json();
    const dashData = await dashResp.json();
    const logs = logsData.logs || [];
    const events = evtsData.events || [];
    const ov = dashData.overview || {};

    let html = '';

    // Summary KPIs
    html += '<div class="txn-dash-grid">';
    html += _txnKpi('Events Received', ov.total_received || 0, _txIco('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>', 18), '#8b5cf6');
    html += _txnKpi('Sent', ov.total_sent || 0, _txIco('<path d="m22 2-7 20-4-9-9-4 20-7z"/>', 18), '#3b82f6');
    html += _txnKpi('Delivered', ov.total_delivered || 0, _txIco('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>', 18), '#10b981');
    html += _txnKpi('Failed', ov.total_failed || 0, _txIco('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>', 18), '#ef4444');
    html += _txnKpi('Dropped', ov.total_dropped || 0, _txIco('<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>', 18), '#f97316');
    html += _txnKpi('Avg Latency', (ov.avg_latency_ms || 0) + 'ms', _txIco('<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>', 18), '#06b6d4');
    html += '</div>';

    // Filters
    html += '<div class="txn-toolbar"><div class="txn-toolbar-left">';
    html += '<select class="form-input" style="width:160px" onchange="_evtFilter.event_name=this.value;loadEventHistory()"><option value="">All Events</option>';
    events.forEach(function (e) { html += '<option value="' + e.name + '"' + (_evtFilter.event_name === e.name ? ' selected' : '') + '>' + e.name + '</option>'; });
    html += '</select>';
    html += '<select class="form-input" style="width:130px" onchange="_evtFilter.status=this.value;loadEventHistory()"><option value="">All Statuses</option>';
    ['sent', 'delivered', 'failed', 'dropped'].forEach(function (s) { html += '<option value="' + s + '"' + (_evtFilter.status === s ? ' selected' : '') + '>' + s.charAt(0).toUpperCase() + s.slice(1) + '</option>'; });
    html += '</select>';
    html += '<select class="form-input" style="width:130px" onchange="_evtFilter.channel=this.value;loadEventHistory()"><option value="">All Channels</option>';
    ['email', 'sms', 'push'].forEach(function (c) { html += '<option value="' + c + '"' + (_evtFilter.channel === c ? ' selected' : '') + '>' + c.toUpperCase() + '</option>'; });
    html += '</select>';
    html += '</div></div>';

    // Activity log table
    html += '<div class="card"><div class="card-header"><h3 class="card-title">' + _txIco('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>', 16) + ' Activity Log</h3><span style="font-size:11px;color:#94a3b8">' + (logsData.total || 0) + ' total events</span></div>';
    html += '<div class="table-container"><table class="data-table"><thead><tr>';
    html += '<th>Time</th><th>Event ID</th><th>Event</th><th>Message</th><th>Channel</th><th>Recipient</th><th>Status</th><th>Latency</th><th>Error</th>';
    html += '</tr></thead><tbody>';

    if (logs.length === 0) {
      html += '<tr><td colspan="9" style="text-align:center;padding:2rem;color:#94a3b8">No event history yet</td></tr>';
    }

    logs.forEach(function (l) {
      const statusCls = { sent: 'info', delivered: 'success', failed: 'danger', dropped: 'warning' }[l.status] || 'secondary';
      const chIcon = l.channel === 'email' ? _txIco('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>', 12) : l.channel === 'sms' ? _txIco('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', 12) : _txIco('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>', 12);
      html += '<tr>';
      html += '<td style="white-space:nowrap;font-size:11px">' + new Date(l.processed_at || l.created_at).toLocaleString() + '</td>';
      html += '<td style="font-family:monospace;font-size:11px">' + (l.event_id || '') + '</td>';
      html += '<td><span class="txn-event-chip">' + _txIco('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>', 11) + ' ' + l.event_name + '</span></td>';
      html += '<td>' + (l.message_name || '-') + '</td>';
      html += '<td>' + chIcon + ' ' + (l.channel || '').toUpperCase() + '</td>';
      html += '<td style="font-size:11px">' + (l.recipient || '-') + '</td>';
      html += '<td><span class="badge badge-' + statusCls + '">' + l.status + '</span></td>';
      html += '<td>' + (l.latency_ms || 0) + 'ms</td>';
      html += '<td style="font-size:11px;color:#ef4444;max-width:150px;overflow:hidden;text-overflow:ellipsis">' + (l.error || '') + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table></div></div>';

    document.getElementById('content').innerHTML = html;
  } catch (error) {
    showToast('Error loading event history: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
};

// ──────────────────────────────────────────
// 3. CREATE / EDIT EVENT MESSAGE WIZARD
// ──────────────────────────────────────────
let _txnWizard = { step: 1, data: {}, events: [], editing: false };

async function showTxnWizard(existingMsg) {
  _txnWizard = {
    step: 1,
    data: existingMsg ? { ...existingMsg } : {
      name: '', event_id: null, event_name: '',
      channels: [], channel_config: {},
      recipient_mode: 'profile_first', identity_field: '', fallback_delivery_field: '',
      no_recipient_action: 'drop_log',
      content: {}
    },
    events: [],
    editing: !!existingMsg
  };

  // Fetch PUBLISHED events only (events must be published to be used in messages)
  try {
    const resp = await fetch(TXN_API + '/event-instances?status=published');
    const data = await resp.json();
    _txnWizard.events = data.events || [];
  } catch (e) { /* ignore */ }

  renderTxnWizardStep();
}

async function editTxnMessage(id) {
  try {
    showLoading();
    const resp = await fetch(TXN_API + '/messages/' + id);
    const msg = await resp.json();
    if (!resp.ok) throw new Error(msg.error);
    showTxnWizard(msg);
  } catch (e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

function renderTxnWizardStep() {
  const s = _txnWizard.step;
  const d = _txnWizard.data;
  const steps = ['Event', 'Channels', 'Recipient', 'Content', 'Review'];

  let html = '<div class="txn-wizard' + (s === 4 ? ' txn-wizard-wide' : '') + '">';
  // Stepper
  html += '<div class="txn-stepper">';
  steps.forEach(function (label, i) {
    const num = i + 1;
    const cls = num === s ? 'active' : num < s ? 'done' : '';
    html += '<div class="txn-step ' + cls + '" onclick="' + (num < s ? '_txnWizard.step=' + num + ';renderTxnWizardStep()' : '') + '">';
    html += '<div class="txn-step-num">' + (num < s ? _txIco('<path d="M20 6 9 17l-5-5"/>', 14) : num) + '</div>';
    html += '<div class="txn-step-label">' + label + '</div>';
    html += '</div>';
    if (i < steps.length - 1) html += '<div class="txn-step-line ' + (num < s ? 'done' : '') + '"></div>';
  });
  html += '</div>';

  // Step content
  html += '<div class="txn-wizard-body">';

  if (s === 1) html += renderWizStep1();
  else if (s === 2) html += renderWizStep2();
  else if (s === 3) html += renderWizStep3();
  else if (s === 4) html += renderWizStep4();
  else if (s === 5) html += renderWizStep5();

  html += '</div>';

  // Footer
  html += '<div class="txn-wizard-footer">';
  html += '<button class="btn btn-secondary" onclick="' + (s === 1 ? '_txnActiveTab=\'event_messages\';loadTransactionalMessages()' : '_txnWizard.step--;renderTxnWizardStep()') + '">' + (s === 1 ? 'Cancel' : _txIco('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 14) + ' Back') + '</button>';
  if (s < 5) html += '<button class="btn btn-primary" onclick="txnWizNext()">' + 'Next ' + _txIco('<path d="m12 5 7 7-7 7"/><path d="M5 12h14"/>', 14) + '</button>';
  else {
    html += '<button class="btn btn-secondary" onclick="saveTxnDraft()">Save</button>';
    html += '<button class="btn btn-primary" onclick="saveTxnPublish()">' + _txIco('<path d="m22 2-7 20-4-9-9-4 20-7z"/>', 14) + ' Publish</button>';
  }
  html += '</div></div>';

  document.getElementById('content').innerHTML = html;
}

function txnWizNext() {
  const s = _txnWizard.step;
  const d = _txnWizard.data;
  if (s === 1 && !d.event_id) { showToast('Please select an event', 'warning'); return; }
  if (s === 1 && !d.name) { showToast('Please enter a message name', 'warning'); return; }
  if (s === 2 && (!d.channels || d.channels.length === 0)) { showToast('Select at least one channel', 'warning'); return; }
  _txnWizard.step++;
  renderTxnWizardStep();
}

// ── Step 1: Select Published Event ──
function renderWizStep1() {
  const d = _txnWizard.data;
  const events = _txnWizard.events || [];
  let html = '<div class="form-group"><label class="form-label form-label-required">Message Name</label>';
  html += '<input type="text" class="form-input" value="' + (d.name || '') + '" placeholder="e.g. Order Confirmation" oninput="_txnWizard.data.name=this.value"></div>';

  html += '<div class="form-group" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><label class="form-label form-label-required" style="margin:0">Select Event <span style="font-weight:normal;color:#64748b;font-size:11px">(' + events.length + ' published event' + (events.length !== 1 ? 's' : '') + ')</span></label>';
  html += '<button class="btn btn-sm btn-secondary" onclick="_txnActiveTab=\'events\';loadTransactionalMessages()" style="font-size:11px">' + _txIco('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>', 12) + ' Manage Events</button></div>';

  if (events.length === 0) {
    html += '<div class="card" style="padding:24px;text-align:center;color:#94a3b8">';
    html += '<div style="margin-bottom:8px">' + _txIco('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>', 24) + '</div>';
    html += '<div>No published events available. Go to the <strong>Events</strong> tab and publish an event first.</div>';
    html += '</div>';
    return html;
  }

  // Search + category filter
  var cats = [];
  events.forEach(function (e) { var c = e.category || 'Custom'; if (cats.indexOf(c) === -1) cats.push(c); });
  cats.sort();
  html += '<div style="display:flex;gap:8px;margin-bottom:10px">';
  html += '<div class="inline-search" style="flex:1">';
  html += '<input type="text" class="form-input inline-search-input" id="evt-picker-search" placeholder="Search events..." oninput="filterWizEventCards()">';
  html += '<span class="search-icon">' + _txIco('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', 14) + '</span></div>';
  html += '<select class="form-input" id="evt-picker-cat" onchange="filterWizEventCards()" style="width:auto;min-width:120px">';
  html += '<option value="">All categories</option>';
  cats.forEach(function (c) { html += '<option value="' + c + '">' + c + '</option>'; });
  html += '</select>';
  html += '</div>';

  // Scrollable compact event list
  html += '<div class="txn-event-grid" id="evt-picker-list" style="max-height:340px;overflow-y:auto;padding-right:4px">';
  html += '<div id="evt-picker-noresults" style="display:none;text-align:center;padding:24px 0;color:#94a3b8;font-size:12px">' + _txIco('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', 16) + ' No events match your search</div>';

  events.forEach(function (e) {
    const selected = d.event_id === e.id;
    var attrCount = (e.attributes || []).length;
    html += '<div class="txn-event-card txn-evt-pick-card ' + (selected ? 'selected' : '') + '" onclick="selectTxnEvent(' + e.id + ')" data-evt-name="' + (e.name || '').toLowerCase() + '" data-evt-cat="' + (e.category || 'Custom') + '" data-evt-desc="' + (e.description || '').toLowerCase() + '" data-evt-tpl="' + (e.template_name || '').toLowerCase() + '">';

    // Compact header row
    html += '<div class="txn-event-card-header"><div class="txn-event-card-radio">' + (selected ? _txIco('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>', 16) : _txIco('<circle cx="12" cy="12" r="10"/>', 16)) + '</div>';
    html += '<div style="flex:1;min-width:0"><div class="txn-event-card-name" style="display:flex;align-items:center;gap:6px">' + _txIco('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>', 14) + ' ' + e.name + '</div>';
    html += '<div class="txn-event-card-desc" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (e.description || '') + '</div></div>';
    html += '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0">';
    html += '<span style="font-size:10px;color:#94a3b8">' + attrCount + ' attr' + (attrCount !== 1 ? 's' : '') + '</span>';
    html += '<span class="txn-event-card-cat">' + (e.category || 'Custom') + '</span>';
    html += '</div></div>';

    // Detail — shown only when selected
    html += '<div class="txn-evt-pick-detail" style="' + (selected ? '' : 'display:none;') + 'margin-top:8px;padding-top:8px;border-top:1px solid #f1f5f9">';
    html += '<div class="txn-attr-section"><span class="txn-attr-label">Template:</span> <code>' + (e.template_name || 'Custom') + '</code></div>';
    html += '<div class="txn-attr-section"><span class="txn-attr-label">Attributes:</span> ' + (e.attributes || []).map(function (a) { return '<code>' + a.name + '</code>'; }).join(', ') + '</div>';
    html += '<div class="txn-attr-section"><span class="txn-attr-label">Identity:</span> ' + (e.identity_fields || []).map(function (f) { return '<code>' + f + '</code>'; }).join(', ') + '</div>';
    html += '<div class="txn-attr-section"><span class="txn-attr-label">Delivery:</span> ' + (e.delivery_fields || []).map(function (f) { return '<code>' + f + '</code>'; }).join(', ') + '</div>';
    html += '</div>';

    html += '</div>';
  });
  html += '</div>';
  return html;
}

function selectTxnEvent(id) {
  var evt = _txnWizard.events.find(function (e) { return e.id === id; });
  if (!evt) return;
  _txnWizard.data.event_id = id;
  _txnWizard.data.event_name = evt.name;
  // Collapse all details, expand selected
  document.querySelectorAll('.txn-evt-pick-detail').forEach(function (d) { d.style.display = 'none'; });
  document.querySelectorAll('.txn-evt-pick-card').forEach(function (c) { c.classList.remove('selected'); });
  var cards = document.querySelectorAll('.txn-evt-pick-card');
  cards.forEach(function (c) {
    if (c.getAttribute('data-evt-name') === evt.name.toLowerCase()) {
      c.classList.add('selected');
      var detail = c.querySelector('.txn-evt-pick-detail');
      if (detail) detail.style.display = 'block';
      c.querySelector('.txn-event-card-radio').innerHTML = _txIco('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>', 16);
    } else {
      c.querySelector('.txn-event-card-radio').innerHTML = _txIco('<circle cx="12" cy="12" r="10"/>', 16);
    }
  });
}

function filterWizEventCards() {
  var q = (document.getElementById('evt-picker-search') || {}).value || '';
  q = q.toLowerCase().trim();
  var cat = (document.getElementById('evt-picker-cat') || {}).value || '';
  var cards = document.querySelectorAll('.txn-evt-pick-card');
  var visible = 0;
  cards.forEach(function (c) {
    var name = c.getAttribute('data-evt-name') || '';
    var desc = c.getAttribute('data-evt-desc') || '';
    var tpl = c.getAttribute('data-evt-tpl') || '';
    var cardCat = c.getAttribute('data-evt-cat') || '';
    var matchSearch = !q || name.indexOf(q) !== -1 || desc.indexOf(q) !== -1 || tpl.indexOf(q) !== -1;
    var matchCat = !cat || cardCat === cat;
    if (matchSearch && matchCat) {
      c.style.display = '';
      visible++;
    } else {
      c.style.display = 'none';
    }
  });
  var noRes = document.getElementById('evt-picker-noresults');
  if (noRes) noRes.style.display = visible === 0 ? 'block' : 'none';
}

// ── Step 2: Channels ──
function renderWizStep2() {
  const d = _txnWizard.data;
  const channels = d.channels || [];
  const cfg = d.channel_config || {};

  const allCh = [
    { key: 'email', label: 'Email', icon: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>' },
    { key: 'sms', label: 'SMS', icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
    { key: 'push', label: 'Push Notification', icon: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>' },
    { key: 'whatsapp', label: 'WhatsApp', icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
    { key: 'webhook', label: 'Webhook', icon: '<path d="M18 16.98h1a2 2 0 0 0 2-1.98V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8c0 1.1.9 2 2 2h1"/><path d="m12 18 4 4"/><path d="m8 22 4-4"/>' }
  ];

  let html = '<div class="form-group"><label class="form-label form-label-required">Select Channels</label></div>';
  html += '<div class="txn-channel-grid">';
  allCh.forEach(function (ch) {
    const checked = channels.includes(ch.key);
    html += '<label class="txn-channel-card ' + (checked ? 'selected' : '') + '">';
    html += '<input type="checkbox" ' + (checked ? 'checked' : '') + ' onchange="toggleTxnChannel(\'' + ch.key + '\',this.checked)">';
    html += '<div class="txn-channel-icon">' + _txIco(ch.icon, 24) + '</div>';
    html += '<div class="txn-channel-label">' + ch.label + '</div>';
    html += '</label>';
  });
  html += '</div>';

  channels.forEach(function (ch) {
    const c = cfg[ch] || {};
    html += '<div class="txn-ch-config card"><div class="card-header"><h3 class="card-title">' + ch.toUpperCase() + ' Settings</h3></div><div class="card-body">';
    if (ch === 'email') {
      html += '<div class="form-row"><div class="form-group"><label class="form-label">From Name</label><input type="text" class="form-input" value="' + (c.from_name || '') + '" placeholder="Support Team" oninput="updateTxnChConfig(\'email\',\'from_name\',this.value)"></div>';
      html += '<div class="form-group"><label class="form-label">From Email</label><input type="email" class="form-input" value="' + (c.from_email || '') + '" placeholder="no-reply@company.com" oninput="updateTxnChConfig(\'email\',\'from_email\',this.value)"></div>';
      html += '<div class="form-group"><label class="form-label">Reply-To</label><input type="email" class="form-input" value="' + (c.reply_to || '') + '" placeholder="support@company.com" oninput="updateTxnChConfig(\'email\',\'reply_to\',this.value)"></div></div>';
    } else if (ch === 'sms') {
      html += '<div class="form-group"><label class="form-label">Sender ID</label><input type="text" class="form-input" value="' + (c.sender_id || '') + '" placeholder="MyApp" maxlength="11" oninput="updateTxnChConfig(\'sms\',\'sender_id\',this.value)"></div>';
    } else if (ch === 'push') {
      html += '<div class="form-group"><label class="form-label">Default Title</label><input type="text" class="form-input" value="' + (c.title_template || '') + '" placeholder="Notification title" oninput="updateTxnChConfig(\'push\',\'title_template\',this.value)"></div>';
    } else if (ch === 'webhook') {
      html += '<div class="form-group"><label class="form-label">Webhook URL</label><input type="url" class="form-input" value="' + (c.url || '') + '" placeholder="https://api.example.com/webhook" oninput="updateTxnChConfig(\'webhook\',\'url\',this.value)"></div>';
      html += '<div class="form-group"><label class="form-label">Method</label><select class="form-input" onchange="updateTxnChConfig(\'webhook\',\'method\',this.value)"><option' + (c.method === 'POST' ? ' selected' : '') + '>POST</option><option' + (c.method === 'PUT' ? ' selected' : '') + '>PUT</option></select></div>';
    }
    html += '</div></div>';
  });

  return html;
}

function toggleTxnChannel(key, checked) {
  var d = _txnWizard.data;
  if (!d.channels) d.channels = [];
  if (checked && !d.channels.includes(key)) d.channels.push(key);
  else if (!checked) d.channels = d.channels.filter(function (c) { return c !== key; });
  renderTxnWizardStep();
}

function updateTxnChConfig(ch, field, value) {
  var d = _txnWizard.data;
  if (!d.channel_config) d.channel_config = {};
  if (!d.channel_config[ch]) d.channel_config[ch] = {};
  d.channel_config[ch][field] = value;
}

// ── Step 3: Recipient Resolution ──
function renderWizStep3() {
  const d = _txnWizard.data;
  const evt = _txnWizard.events.find(function (e) { return e.id === d.event_id; }) || {};
  const iFields = evt.identity_fields || ['userId'];
  const dFields = evt.delivery_fields || ['email'];

  let html = '<div class="form-group"><label class="form-label form-label-required">Resolution Mode</label></div>';

  const modes = [
    { key: 'profile_first', title: 'Profile-first', desc: 'Look up user profile using identity field. Fall back to delivery field from event payload if profile not found.' },
    { key: 'event_only', title: 'Event-only', desc: 'Ignore profiles entirely. Use delivery field directly from the event payload. Best for anonymous recipients.' },
    { key: 'profile_only', title: 'Profile-only', desc: 'Require a profile match. Drop message if no profile found.' }
  ];

  html += '<div class="txn-mode-grid">';
  modes.forEach(function (m) {
    const sel = d.recipient_mode === m.key;
    html += '<div class="txn-mode-card ' + (sel ? 'selected' : '') + '" onclick="_txnWizard.data.recipient_mode=\'' + m.key + '\';renderTxnWizardStep()">';
    html += '<div class="txn-mode-radio">' + (sel ? _txIco('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>', 16) : _txIco('<circle cx="12" cy="12" r="10"/>', 16)) + '</div>';
    html += '<div><div class="txn-mode-title">' + m.title + '</div><div class="txn-mode-desc">' + m.desc + '</div></div>';
    html += '</div>';
  });
  html += '</div>';

  if (d.recipient_mode === 'profile_first' || d.recipient_mode === 'profile_only') {
    html += '<div class="form-group"><label class="form-label">Identity Field</label><select class="form-input" onchange="_txnWizard.data.identity_field=this.value">';
    html += '<option value="">Select...</option>';
    iFields.forEach(function (f) { html += '<option value="' + f + '"' + (d.identity_field === f ? ' selected' : '') + '>' + f + '</option>'; });
    html += '</select><span class="form-helper">Field in event payload used to look up the profile</span></div>';
  }

  if (d.recipient_mode === 'profile_first' || d.recipient_mode === 'event_only') {
    html += '<div class="form-group"><label class="form-label">Delivery Field (fallback)</label><select class="form-input" onchange="_txnWizard.data.fallback_delivery_field=this.value">';
    html += '<option value="">Select...</option>';
    dFields.forEach(function (f) { html += '<option value="' + f + '"' + (d.fallback_delivery_field === f ? ' selected' : '') + '>' + f + '</option>'; });
    html += '</select><span class="form-helper">Field containing the delivery address (email, phone, push token)</span></div>';
  }

  html += '<div class="form-group"><label class="form-label">If no recipient resolved</label><div class="txn-radio-group">';
  html += '<label class="txn-radio"><input type="radio" name="no_recip" value="drop_log"' + (d.no_recipient_action === 'drop_log' ? ' checked' : '') + ' onchange="_txnWizard.data.no_recipient_action=\'drop_log\'"> Drop &amp; log</label>';
  html += '<label class="txn-radio"><input type="radio" name="no_recip" value="error_queue"' + (d.no_recipient_action === 'error_queue' ? ' checked' : '') + ' onchange="_txnWizard.data.no_recipient_action=\'error_queue\'"> Send to error queue</label>';
  html += '</div></div>';

  return html;
}

// ── Step 4: Content (Rich Channel Editors) ──
function renderWizStep4() {
  var d = _txnWizard.data;
  var channels = d.channels || [];
  var content = d.content || {};
  var evt = _txnWizard.events.find(function (e) { return e.id === d.event_id; }) || {};
  var cfg = d.channel_config || {};
  var _esc = function (s) { return (s || '').replace(/"/g, '&quot;'); };

  var html = '';
  if (channels.length > 1) {
    if (!d._activeContentTab || channels.indexOf(d._activeContentTab) === -1) d._activeContentTab = channels[0];
    html += '<div class="txn-ch-tabs">';
    channels.forEach(function (ch) {
      var lbl = { email: 'Email', sms: 'SMS', push: 'Push', whatsapp: 'WhatsApp', webhook: 'Webhook' }[ch] || ch;
      html += '<button class="txn-ch-tab' + (d._activeContentTab === ch ? ' active' : '') + '" onclick="_txnWizard.data._activeContentTab=\'' + ch + '\';renderTxnWizardStep()">' + _txChIcon(ch, 14) + ' ' + lbl + '</button>';
    });
    html += '</div>';
  } else if (channels.length === 1) {
    d._activeContentTab = channels[0];
  }

  var activeCh = d._activeContentTab || channels[0];
  var c = content[activeCh] || {};
  var chCfg = cfg[activeCh] || {};

  // ── EMAIL EDITOR ──
  if (activeCh === 'email') {
    html += '<div class="txn-content-layout">';
    html += '<div class="txn-content-editors">';
    html += '<div class="form-section compact-form">';
    html += '<h3 class="form-section-title">Email Content</h3>';
    html += '<div class="form-group form-grid-full"><label class="form-label form-label-required">Subject Line</label>';
    html += '<div class="personalize-input-row"><input type="text" class="form-input" id="txn-email-subject" value="' + _esc(c.subject) + '" placeholder="Your order {{event.orderId}} is confirmed" oninput="updateTxnContent(\'email\',\'subject\',this.value)">';
    html += '<button class="btn btn-icon personalize-btn" type="button" title="Insert personalization" onclick="txnInsertToken(\'txn-email-subject\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg></button></div></div>';
    html += '<div class="form-group form-grid-full"><label class="form-label">Preheader</label><input type="text" class="form-input" value="' + _esc(c.preheader) + '" placeholder="Preview text shown in inbox..." maxlength="150" oninput="updateTxnContent(\'email\',\'preheader\',this.value)"><span class="form-helper">First text shown after the subject in many email clients</span></div>';
    html += '<div class="form-group form-grid-full"><label class="form-label form-label-required">Body</label>';
    html += '<div class="personalize-input-row"><textarea class="form-input" rows="12" id="txn-email-body" placeholder="Hi {{event.firstName}},&#10;&#10;Thank you for your order..." oninput="updateTxnContent(\'email\',\'body\',this.value)">' + (c.body || '') + '</textarea>';
    html += '<button class="btn btn-icon personalize-btn" type="button" title="Insert personalization" onclick="txnInsertToken(\'txn-email-body\')" style="align-self:flex-start;margin-top:4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg></button></div></div>';
    html += '<div class="form-group form-grid-full"><label class="form-label">Options</label><div class="sms-options">';
    html += '<label class="sms-option-toggle"><input type="checkbox"' + (c.track_opens !== false ? ' checked' : '') + ' onchange="updateTxnContent(\'email\',\'track_opens\',this.checked)"><span>Track opens</span></label>';
    html += '<label class="sms-option-toggle"><input type="checkbox"' + (c.track_clicks !== false ? ' checked' : '') + ' onchange="updateTxnContent(\'email\',\'track_clicks\',this.checked)"><span>Track clicks</span></label>';
    html += '</div></div>';
    html += '</div></div>';
    html += _txnPersonalizationSidebar(evt, content, channels);
    html += '</div>';

  // ── SMS EDITOR ──
  } else if (activeCh === 'sms') {
    var smsMsg = c.body || '';
    var smsCharCount = smsMsg.length;
    var smsSegments = smsCharCount <= 160 ? 1 : Math.ceil(smsCharCount / 153);
    var optOut = c.opt_out !== false;
    var optOutText = 'Reply STOP to unsubscribe';
    var previewText = smsMsg + (optOut ? '\n\n' + optOutText : '');

    html += '<div class="form-section compact-form"><h3 class="form-section-title">SMS Content</h3>';
    html += '<div class="sms-editor-layout">';
    html += '<div class="sms-editor-panel">';
    html += '<div class="form-group form-grid-full"><label class="form-label">Sender ID</label>';
    html += '<div class="personalize-input-row"><input type="text" class="form-input" id="txn-sms-sender" value="' + _esc(chCfg.sender_id) + '" placeholder="e.g. MyBrand or +1555..." oninput="updateTxnChCfg(\'sms\',\'sender_id\',this.value)">';
    html += '<button class="btn btn-icon personalize-btn" type="button" title="Insert personalization" onclick="txnInsertToken(\'txn-sms-sender\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg></button></div>';
    html += '<span class="form-helper">Alphanumeric (max 11 chars) or phone number</span></div>';

    html += '<div class="form-group form-grid-full"><label class="form-label">Message</label>';
    html += '<div class="personalize-input-row"><textarea class="form-input sms-textarea" rows="5" maxlength="1600" id="txn-sms-body" oninput="txnUpdateSmsContent(this.value)">' + smsMsg + '</textarea>';
    html += '<button class="btn btn-icon personalize-btn" type="button" title="Insert personalization" onclick="txnInsertToken(\'txn-sms-body\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg></button></div>';
    html += '<div class="sms-char-bar"><div class="sms-char-count"><span id="txn-sms-char-num">' + smsCharCount + '</span> characters <span class="sms-char-sep">&middot;</span> <span id="txn-sms-seg-num">' + smsSegments + '</span> segment' + (smsSegments !== 1 ? 's' : '') + '</div>';
    html += '<div class="sms-char-limit ' + (smsCharCount > 160 ? 'warn' : '') + '">' + (smsCharCount <= 160 ? (160 - smsCharCount) + ' remaining' : 'Multi-segment') + '</div></div></div>';

    // AI Compose
    html += '<div class="form-group form-grid-full"><div class="ai-compose-card" id="txn-sms-ai-card">';
    html += '<div class="ai-compose-header" onclick="txnToggleAi(\'sms\')"><div class="ai-compose-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg> AI Compose</div>';
    html += '<svg class="ai-compose-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></div>';
    html += '<div class="ai-compose-body" id="txn-sms-ai-body" style="display:none">';
    html += '<div class="ai-compose-row"><div class="ai-compose-field"><label class="form-label">What should the SMS be about?</label><textarea class="form-input" rows="2" id="txn-sms-ai-prompt" placeholder="e.g. Flash sale on winter jackets, 40% off for VIP customers..."></textarea></div></div>';
    html += '<div class="ai-compose-row ai-compose-settings">';
    html += '<div class="ai-compose-field"><label class="form-label">Tone</label><select class="form-input" id="txn-sms-ai-tone"><option value="professional">Professional</option><option value="friendly" selected>Friendly</option><option value="casual">Casual</option><option value="urgent">Urgent</option><option value="playful">Playful</option><option value="formal">Formal</option></select></div>';
    html += '<div class="ai-compose-field"><label class="form-label">Length</label><select class="form-input" id="txn-sms-ai-length"><option value="short">Short (&lt;100)</option><option value="medium" selected>Medium (120-150)</option><option value="long">Full segment (160)</option></select></div>';
    html += '<div class="ai-compose-field"><label class="form-label">Language</label><select class="form-input" id="txn-sms-ai-lang"><option>English</option><option>Spanish</option><option>French</option><option>German</option><option>Portuguese</option></select></div>';
    html += '</div>';
    html += '<div class="ai-compose-actions"><button class="btn btn-primary btn-sm" onclick="txnAiSms(\'generate\')">' + _txIco('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21"/>', 14) + ' Generate</button>';
    html += '<button class="btn btn-secondary btn-sm" onclick="txnAiSms(\'refine\')"' + (smsMsg ? '' : ' disabled') + '>' + _txIco('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>', 14) + ' Refine Current</button></div>';
    html += '<div class="ai-compose-results" id="txn-sms-ai-results"></div>';
    html += '</div></div></div>';

    html += '<div class="form-group form-grid-full"><label class="form-label">Options</label><div class="sms-options">';
    html += '<label class="sms-option-toggle"><input type="checkbox"' + (optOut ? ' checked' : '') + ' onchange="updateTxnContent(\'sms\',\'opt_out\',this.checked)"><span>Auto-append opt-out message</span></label>';
    html += '<label class="sms-option-toggle"><input type="checkbox"' + (c.shorten_links ? ' checked' : '') + ' onchange="updateTxnContent(\'sms\',\'shorten_links\',this.checked)"><span>Shorten &amp; track links</span></label>';
    html += '<label class="sms-option-toggle"><input type="checkbox"' + (c.unicode ? ' checked' : '') + ' onchange="updateTxnContent(\'sms\',\'unicode\',this.checked)"><span>Allow Unicode characters</span></label>';
    html += '</div></div>';
    html += '</div>';

    html += '<div class="sms-preview-panel"><div class="phone-mockup"><div class="phone-notch"></div>';
    html += '<div class="phone-status-bar"><span>9:41</span><span class="phone-status-icons"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="6" width="4" height="12" rx="1"/><rect x="7" y="4" width="4" height="14" rx="1"/><rect x="13" y="2" width="4" height="16" rx="1"/><rect x="19" y="8" width="4" height="10" rx="1"/></svg><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/></svg></span></div>';
    html += '<div class="phone-header"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg><span class="phone-header-title">' + (chCfg.sender_id || 'Brand') + '</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></div>';
    html += '<div class="phone-messages" id="txn-sms-preview">';
    html += previewText ? '<div class="sms-bubble">' + previewText.replace(/\n/g, '<br>') + '</div>' : '<div class="sms-bubble sms-bubble-placeholder">Your message preview will appear here...</div>';
    html += '</div>';
    html += '<div class="phone-input-bar"><div class="phone-input-field">Text Message</div><svg width="20" height="20" viewBox="0 0 24 24" fill="#007AFF" stroke="none"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></div>';
    html += '</div></div>';
    html += '</div></div>';

  // ── PUSH EDITOR ──
  } else if (activeCh === 'push') {
    var pushTitle = c.title || '';
    var pushBody = c.body || '';
    var pushImage = c.image || '';
    var pushAction = c.action_url || '';
    var pushBtn1 = c.button_1 || '';
    var pushBtn2 = c.button_2 || '';

    html += '<div class="form-section compact-form"><h3 class="form-section-title">Push Notification Content</h3>';
    html += '<div class="push-editor-layout">';
    html += '<div class="push-editor-panel">';
    html += '<div class="form-group form-grid-full"><label class="form-label form-label-required">Title</label>';
    html += '<div class="personalize-input-row"><input type="text" class="form-input" value="' + _esc(pushTitle) + '" maxlength="65" id="txn-push-title" oninput="txnUpdatePush(\'title\',this.value)">';
    html += '<button class="btn btn-icon personalize-btn" type="button" onclick="txnInsertToken(\'txn-push-title\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg></button></div>';
    html += '<div class="push-char-count"><span id="txn-push-title-chars">' + pushTitle.length + '</span>/65</div></div>';

    html += '<div class="form-group form-grid-full"><label class="form-label form-label-required">Body</label>';
    html += '<div class="personalize-input-row"><textarea class="form-input" rows="3" maxlength="240" id="txn-push-body" oninput="txnUpdatePush(\'body\',this.value)">' + pushBody + '</textarea>';
    html += '<button class="btn btn-icon personalize-btn" type="button" onclick="txnInsertToken(\'txn-push-body\')" style="align-self:flex-start;margin-top:4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg></button></div>';
    html += '<div class="push-char-count"><span id="txn-push-body-chars">' + pushBody.length + '</span>/240</div></div>';

    html += '<div class="form-group form-grid-full"><label class="form-label">Rich Media Image</label>';
    html += '<input type="text" class="form-input" value="' + _esc(pushImage) + '" placeholder="https://example.com/image.png" oninput="updateTxnContent(\'push\',\'image\',this.value)">';
    html += '<span class="form-helper">Recommended: 1024x512px, JPEG or PNG, max 1 MB</span></div>';

    html += '<div class="form-group form-grid-full"><label class="form-label">On-Tap Action URL</label>';
    html += '<input type="text" class="form-input" value="' + _esc(pushAction) + '" placeholder="https://yourapp.com/deeplink" oninput="updateTxnContent(\'push\',\'action_url\',this.value)"></div>';

    html += '<div class="form-group form-grid-full"><label class="form-label">Action Buttons (optional)</label>';
    html += '<div class="push-action-btns"><input type="text" class="form-input" value="' + _esc(pushBtn1) + '" placeholder="Button 1 label" oninput="updateTxnContent(\'push\',\'button_1\',this.value)">';
    html += '<input type="text" class="form-input" value="' + _esc(pushBtn2) + '" placeholder="Button 2 label" oninput="updateTxnContent(\'push\',\'button_2\',this.value)"></div></div>';

    // AI Compose
    html += '<div class="form-group form-grid-full"><div class="ai-compose-card" id="txn-push-ai-card">';
    html += '<div class="ai-compose-header" onclick="txnToggleAi(\'push\')"><div class="ai-compose-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg> AI Compose</div>';
    html += '<svg class="ai-compose-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></div>';
    html += '<div class="ai-compose-body" id="txn-push-ai-body" style="display:none">';
    html += '<div class="ai-compose-row"><div class="ai-compose-field"><label class="form-label">What should the notification be about?</label><textarea class="form-input" rows="2" id="txn-push-ai-prompt" placeholder="e.g. New arrivals in summer collection..."></textarea></div></div>';
    html += '<div class="ai-compose-row ai-compose-settings">';
    html += '<div class="ai-compose-field"><label class="form-label">Tone</label><select class="form-input" id="txn-push-ai-tone"><option value="professional">Professional</option><option value="friendly" selected>Friendly</option><option value="casual">Casual</option><option value="urgent">Urgent</option><option value="playful">Playful</option><option value="formal">Formal</option></select></div>';
    html += '<div class="ai-compose-field"><label class="form-label">Language</label><select class="form-input" id="txn-push-ai-lang"><option>English</option><option>Spanish</option><option>French</option><option>German</option><option>Portuguese</option></select></div>';
    html += '</div>';
    html += '<div class="ai-compose-actions"><button class="btn btn-primary btn-sm" onclick="txnAiPush(\'generate\')">' + _txIco('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21"/>', 14) + ' Generate</button>';
    html += '<button class="btn btn-secondary btn-sm" onclick="txnAiPush(\'refine\')"' + (pushTitle || pushBody ? '' : ' disabled') + '>' + _txIco('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>', 14) + ' Refine Current</button></div>';
    html += '<div class="ai-compose-results" id="txn-push-ai-results"></div>';
    html += '</div></div></div>';

    html += '<div class="form-group form-grid-full"><label class="form-label">Target Platform</label>';
    html += '<div class="push-platform-bar">';
    ['both', 'ios', 'android'].forEach(function (p) {
      html += '<label class="push-platform-opt ' + ((c.platform || 'both') === p ? 'active' : '') + '"><input type="radio" name="txn_push_plat" value="' + p + '"' + ((c.platform || 'both') === p ? ' checked' : '') + ' onchange="updateTxnContent(\'push\',\'platform\',\'' + p + '\')">' + p.charAt(0).toUpperCase() + p.slice(1) + '</label>';
    });
    html += '</div></div>';

    html += '<div class="form-group form-grid-full"><label class="form-label">Options</label><div class="sms-options">';
    html += '<label class="sms-option-toggle"><input type="checkbox"' + (c.sound !== false ? ' checked' : '') + ' onchange="updateTxnContent(\'push\',\'sound\',this.checked)"><span>Play notification sound</span></label>';
    html += '<label class="sms-option-toggle"><input type="checkbox"' + (c.badge ? ' checked' : '') + ' onchange="updateTxnContent(\'push\',\'badge\',this.checked)"><span>Update app badge count</span></label>';
    html += '<label class="sms-option-toggle"><input type="checkbox"' + (c.collapse ? ' checked' : '') + ' onchange="updateTxnContent(\'push\',\'collapse\',this.checked)"><span>Collapse with previous</span></label>';
    html += '</div></div>';
    html += '</div>';

    html += '<div class="push-preview-panel"><div class="phone-mockup phone-mockup-push"><div class="phone-notch"></div>';
    html += '<div class="phone-status-bar"><span>9:41</span><span class="phone-status-icons"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="6" width="4" height="12" rx="1"/><rect x="7" y="4" width="4" height="14" rx="1"/><rect x="13" y="2" width="4" height="16" rx="1"/><rect x="19" y="8" width="4" height="10" rx="1"/></svg><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/></svg></span></div>';
    html += '<div class="phone-lockscreen"><div class="phone-lock-time">9:41</div><div class="phone-lock-date">Thursday, February 5</div>';
    html += '<div class="push-notification-card" id="txn-push-preview-card"><div class="push-notif-header"><div class="push-notif-app-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div><span class="push-notif-app-name">YOUR APP</span><span class="push-notif-time">now</span></div>';
    html += '<div class="push-notif-body"><div class="push-notif-text"><div class="push-notif-title" id="txn-push-preview-title">' + (pushTitle || 'Notification Title') + '</div><div class="push-notif-message" id="txn-push-preview-body">' + (pushBody || 'Your message will appear here...') + '</div></div>';
    if (pushImage) html += '<img class="push-notif-thumb" src="' + pushImage + '" alt="">';
    html += '</div>';
    if (pushImage) html += '<img class="push-notif-rich-image" src="' + pushImage + '" alt="">';
    if (pushBtn1 || pushBtn2) { html += '<div class="push-notif-actions">'; if (pushBtn1) html += '<button class="push-notif-action">' + pushBtn1 + '</button>'; if (pushBtn2) html += '<button class="push-notif-action">' + pushBtn2 + '</button>'; html += '</div>'; }
    html += '</div></div></div></div>';
    html += '</div></div>';

  // ── WHATSAPP / WEBHOOK / OTHER ──
  } else {
    html += '<div class="txn-content-layout">';
    html += '<div class="txn-content-editors">';
    html += '<div class="form-section compact-form"><h3 class="form-section-title">' + activeCh.toUpperCase() + ' Content</h3>';
    if (activeCh === 'whatsapp') {
      html += '<div class="form-group form-grid-full"><label class="form-label">Template Message</label><textarea class="form-input" rows="6" placeholder="Hello {{event.firstName}}..." oninput="updateTxnContent(\'whatsapp\',\'body\',this.value)">' + (c.body || '') + '</textarea></div>';
    } else if (activeCh === 'webhook') {
      html += '<div class="form-group form-grid-full"><label class="form-label">Payload Template (JSON)</label><textarea class="form-input" rows="8" style="font-family:monospace;font-size:11px" placeholder=\'{"orderId":"{{event.orderId}}"}\' oninput="updateTxnContent(\'webhook\',\'body\',this.value)">' + (c.body || '') + '</textarea></div>';
    }
    html += '</div></div>';
    html += _txnPersonalizationSidebar(evt, content, channels);
    html += '</div>';
  }

  return html;
}

// Channel icon helper
function _txChIcon(ch, sz) {
  var icons = {
    email: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    sms: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    push: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    whatsapp: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    webhook: '<path d="M18 16.98h1a2 2 0 0 0 2-1.98V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8c0 1.1.9 2 2 2h1"/><path d="m12 18 4 4"/><path d="m8 22 4-4"/>'
  };
  return _txIco(icons[ch] || icons.email, sz || 14);
}

function _txnPersonalizationSidebar(evt, content, channels) {
  var html = '<div class="txn-content-sidebar">';
  html += '<div class="card"><div class="card-header"><h3 class="card-title">' + _txIco('<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>', 14) + ' Personalization</h3></div><div class="card-body">';
  html += '<div class="txn-attr-group-title">Event Attributes</div>';
  (evt.attributes || []).forEach(function (a) { html += '<div class="txn-token-item" onclick="copyTxnToken(\'event.' + a.name + '\')"><code>{{event.' + a.name + '}}</code><span class="txn-token-type">' + a.type + '</span></div>'; });
  html += '<div class="txn-attr-group-title">Identity &amp; Delivery</div>';
  (evt.identity_fields || []).concat(evt.delivery_fields || []).forEach(function (f) { html += '<div class="txn-token-item" onclick="copyTxnToken(\'event.' + f + '\')"><code>{{event.' + f + '}}</code></div>'; });
  html += '<div class="txn-attr-group-title">Profile Attributes</div>';
  ['firstName', 'lastName', 'email', 'phone', 'city', 'country'].forEach(function (f) { html += '<div class="txn-token-item" onclick="copyTxnToken(\'profile.' + f + '\')"><code>{{profile.' + f + '}}</code></div>'; });
  html += '<div class="form-helper" style="margin-top:8px">Click a token to copy it</div>';
  html += '</div></div>';

  html += '<div class="card"><div class="card-header"><h3 class="card-title">' + _txIco('<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>', 14) + ' Preview</h3></div><div class="card-body">';
  var payload = evt.sample_payload || {};
  channels.forEach(function (ch) {
    var cc = content[ch] || {};
    var preview = (cc.subject ? '<strong>Subject:</strong> ' + resolveTokens(cc.subject, payload) + '<br>' : '') + resolveTokens(cc.body || cc.title || '', payload);
    html += '<div class="txn-preview-block"><div class="txn-preview-ch">' + ch.toUpperCase() + '</div><div class="txn-preview-text">' + (preview || '<span style="color:#94a3b8">No content yet</span>') + '</div></div>';
  });
  html += '</div></div></div>';
  return html;
}

// ── Channel editor helpers ──
function updateTxnChCfg(ch, field, val) {
  if (!_txnWizard.data.channel_config) _txnWizard.data.channel_config = {};
  if (!_txnWizard.data.channel_config[ch]) _txnWizard.data.channel_config[ch] = {};
  _txnWizard.data.channel_config[ch][field] = val;
}

function txnUpdateSmsContent(val) {
  updateTxnContent('sms', 'body', val);
  var chars = val.length, segs = chars <= 160 ? 1 : Math.ceil(chars / 153);
  var el1 = document.getElementById('txn-sms-char-num'); if (el1) el1.textContent = chars;
  var el2 = document.getElementById('txn-sms-seg-num'); if (el2) el2.textContent = segs;
  var optOut = _txnWizard.data.content && _txnWizard.data.content.sms && _txnWizard.data.content.sms.opt_out !== false;
  var preview = val + (optOut ? '\n\nReply STOP to unsubscribe' : '');
  var prev = document.getElementById('txn-sms-preview');
  if (prev) prev.innerHTML = preview ? '<div class="sms-bubble">' + preview.replace(/\n/g, '<br>') + '</div>' : '<div class="sms-bubble sms-bubble-placeholder">Your message preview will appear here...</div>';
}

function txnUpdatePush(field, val) {
  updateTxnContent('push', field, val);
  if (field === 'title') {
    var el = document.getElementById('txn-push-title-chars'); if (el) el.textContent = val.length;
    var prev = document.getElementById('txn-push-preview-title'); if (prev) prev.textContent = val || 'Notification Title';
  }
  if (field === 'body') {
    var el2 = document.getElementById('txn-push-body-chars'); if (el2) el2.textContent = val.length;
    var prev2 = document.getElementById('txn-push-preview-body'); if (prev2) prev2.textContent = val || 'Your message will appear here...';
  }
}

function txnInsertToken(inputId) {
  var evt = _txnWizard.events.find(function (e) { return e.id === _txnWizard.data.event_id; }) || {};
  var tokens = [];
  (evt.attributes || []).forEach(function (a) { if (a.name) tokens.push('event.' + a.name); });
  (evt.identity_fields || []).forEach(function (f) { if (f) tokens.push('event.' + f); });
  (evt.delivery_fields || []).forEach(function (f) { if (f) tokens.push('event.' + f); });
  ['firstName', 'lastName', 'email', 'phone'].forEach(function (f) { tokens.push('profile.' + f); });
  var el = document.getElementById(inputId);
  if (!el || tokens.length === 0) return;
  var selected = prompt('Insert personalization token:\n\n' + tokens.map(function (t, i) { return (i + 1) + '. {{' + t + '}}'; }).join('\n') + '\n\nEnter number:');
  if (!selected) return;
  var idx = parseInt(selected) - 1;
  if (idx >= 0 && idx < tokens.length) {
    var token = '{{' + tokens[idx] + '}}';
    var start = el.selectionStart || el.value.length;
    el.value = el.value.substring(0, start) + token + el.value.substring(el.selectionEnd || start);
    el.dispatchEvent(new Event('input'));
    el.focus();
    el.setSelectionRange(start + token.length, start + token.length);
  }
}

function txnToggleAi(ch) {
  var body = document.getElementById('txn-' + ch + '-ai-body');
  var card = document.getElementById('txn-' + ch + '-ai-card');
  if (!body) return;
  var isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  if (card) card.classList.toggle('open', !isOpen);
}

async function txnAiSms(action) {
  var prompt = (document.getElementById('txn-sms-ai-prompt') || {}).value || '';
  var tone = (document.getElementById('txn-sms-ai-tone') || {}).value || 'friendly';
  var length = (document.getElementById('txn-sms-ai-length') || {}).value || 'medium';
  var lang = (document.getElementById('txn-sms-ai-lang') || {}).value || 'English';
  var currentMessage = (_txnWizard.data.content && _txnWizard.data.content.sms && _txnWizard.data.content.sms.body) || '';
  if (action === 'generate' && !prompt) { showToast('Describe what the SMS should be about', 'warning'); return; }
  var resultsEl = document.getElementById('txn-sms-ai-results');
  if (resultsEl) resultsEl.innerHTML = '<div class="ai-compose-loading"><div class="spinner-sm"></div> Generating...</div>';
  try {
    var resp = await fetch('/api/ai/generate-sms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt, tone: tone, length: length, language: lang, currentMessage: currentMessage, action: action }) });
    var data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed');
    var messages = data.messages || [];
    if (!messages.length) { if (resultsEl) resultsEl.innerHTML = '<div class="ai-compose-empty">No suggestions. Try a different prompt.</div>'; return; }
    if (resultsEl) {
      resultsEl.innerHTML = '<div class="ai-results-title">' + (action === 'refine' ? 'Refined' : 'Generated') + '</div>' + messages.map(function (msg) {
        var ch = msg.length, sg = ch <= 160 ? 1 : Math.ceil(ch / 153);
        return '<div class="ai-result-card" onclick="txnApplySmsAi(this)"><div class="ai-result-text">' + msg.replace(/</g, '&lt;') + '</div><div class="ai-result-meta"><span>' + ch + ' chars &middot; ' + sg + ' seg</span><button class="btn btn-sm btn-primary ai-result-apply">Use this</button></div></div>';
      }).join('');
    }
  } catch (e) { if (resultsEl) resultsEl.innerHTML = '<div class="ai-compose-empty">Error: ' + e.message + '</div>'; }
}

function txnApplySmsAi(card) {
  var text = card.querySelector('.ai-result-text').textContent;
  var ta = document.getElementById('txn-sms-body'); if (ta) { ta.value = text; txnUpdateSmsContent(text); }
  showToast('Message applied', 'success');
}

async function txnAiPush(action) {
  var prompt = (document.getElementById('txn-push-ai-prompt') || {}).value || '';
  var tone = (document.getElementById('txn-push-ai-tone') || {}).value || 'friendly';
  var lang = (document.getElementById('txn-push-ai-lang') || {}).value || 'English';
  var ct = (_txnWizard.data.content && _txnWizard.data.content.push) || {};
  if (action === 'generate' && !prompt) { showToast('Describe what the notification should be about', 'warning'); return; }
  var resultsEl = document.getElementById('txn-push-ai-results');
  if (resultsEl) resultsEl.innerHTML = '<div class="ai-compose-loading"><div class="spinner-sm"></div> Generating...</div>';
  try {
    var resp = await fetch('/api/ai/generate-push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt, tone: tone, language: lang, currentTitle: ct.title || '', currentBody: ct.body || '', action: action }) });
    var data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed');
    var notifs = data.notifications || [];
    if (!notifs.length) { if (resultsEl) resultsEl.innerHTML = '<div class="ai-compose-empty">No suggestions. Try a different prompt.</div>'; return; }
    if (resultsEl) {
      resultsEl.innerHTML = '<div class="ai-results-title">' + (action === 'refine' ? 'Refined' : 'Generated') + '</div>' + notifs.map(function (n, i) {
        return '<div class="ai-result-card" onclick="txnApplyPushAi(' + i + ')" data-title="' + (n.title || '').replace(/"/g, '&quot;') + '" data-body="' + (n.body || '').replace(/"/g, '&quot;') + '"><div class="ai-result-push-title">' + (n.title || '').replace(/</g, '&lt;') + '</div><div class="ai-result-text">' + (n.body || '').replace(/</g, '&lt;') + '</div><div class="ai-result-meta"><span>Title: ' + (n.title || '').length + '/65 &middot; Body: ' + (n.body || '').length + '/240</span><button class="btn btn-sm btn-primary ai-result-apply">Use this</button></div></div>';
      }).join('');
    }
  } catch (e) { if (resultsEl) resultsEl.innerHTML = '<div class="ai-compose-empty">Error: ' + e.message + '</div>'; }
}

function txnApplyPushAi(idx) {
  var cards = document.querySelectorAll('#txn-push-ai-results .ai-result-card'); var card = cards[idx]; if (!card) return;
  var title = card.dataset.title || '', body = card.dataset.body || '';
  var ti = document.getElementById('txn-push-title'); if (ti) { ti.value = title; txnUpdatePush('title', title); }
  var bi = document.getElementById('txn-push-body'); if (bi) { bi.value = body; txnUpdatePush('body', body); }
  showToast('Notification applied', 'success');
}

function updateTxnContent(ch, field, value) {
  if (!_txnWizard.data.content) _txnWizard.data.content = {};
  if (!_txnWizard.data.content[ch]) _txnWizard.data.content[ch] = {};
  _txnWizard.data.content[ch][field] = value;
}

function copyTxnToken(token) {
  navigator.clipboard.writeText('{{' + token + '}}').then(function () { showToast('Copied: {{' + token + '}}', 'success'); });
}

function resolveTokens(str, payload) {
  if (!str) return '';
  return str.replace(/\{\{event\.(\w+)\}\}/g, function (_, key) {
    return payload[key] !== undefined ? payload[key] : '{{event.' + key + '}}';
  }).replace(/\n/g, '<br>');
}

// ── Step 5: Review ──
function renderWizStep5() {
  const d = _txnWizard.data;
  const evt = _txnWizard.events.find(function (e) { return e.id === d.event_id; }) || {};
  const modeLabel = { profile_first: 'Profile-first', event_only: 'Event-only', profile_only: 'Profile-only' }[d.recipient_mode] || d.recipient_mode;

  let html = '<div class="txn-review">';
  html += '<div class="txn-review-section"><div class="txn-review-label">Message Name</div><div class="txn-review-value">' + d.name + '</div></div>';
  html += '<div class="txn-review-section"><div class="txn-review-label">Event</div><div class="txn-review-value"><span class="txn-event-chip">' + _txIco('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>', 12) + ' ' + (d.event_name || '') + '</span>';
  if (evt.template_name) html += ' <span style="font-size:10px;color:#64748b">(template: ' + evt.template_name + ')</span>';
  html += '</div></div>';
  html += '<div class="txn-review-section"><div class="txn-review-label">Channels</div><div class="txn-review-value">' + (d.channels || []).map(function (c) { return '<span class="badge badge-info">' + c.toUpperCase() + '</span>'; }).join(' ') + '</div></div>';
  html += '<div class="txn-review-section"><div class="txn-review-label">Recipient Resolution</div><div class="txn-review-value"><span class="txn-mode-chip">' + modeLabel + '</span>';
  if (d.identity_field) html += '<br><span style="font-size:11px;color:#64748b">Identity: <code>' + d.identity_field + '</code></span>';
  if (d.fallback_delivery_field) html += '<br><span style="font-size:11px;color:#64748b">Fallback: <code>' + d.fallback_delivery_field + '</code></span>';
  html += '</div></div>';
  html += '<div class="txn-review-section"><div class="txn-review-label">No Recipient Action</div><div class="txn-review-value">' + (d.no_recipient_action === 'drop_log' ? 'Drop & log' : 'Error queue') + '</div></div>';

  (d.channels || []).forEach(function (ch) {
    var c = (d.content || {})[ch] || {};
    html += '<div class="txn-review-section"><div class="txn-review-label">' + ch.toUpperCase() + ' Content</div><div class="txn-review-value">';
    if (c.subject) html += '<strong>Subject:</strong> ' + c.subject + '<br>';
    if (ch === 'push' && c.title) html += '<strong>Title:</strong> ' + c.title + '<br>';
    html += '<div class="txn-review-body">' + (c.body || (ch !== 'push' ? c.title : '') || '<em>No content</em>').replace(/\n/g, '<br>') + '</div>';
    html += '</div></div>';
  });

  html += '</div>';
  return html;
}

// ── Save actions ──
async function saveTxnDraft() {
  try {
    showLoading();
    var d = _txnWizard.data;
    var url = _txnWizard.editing && d.id ? TXN_API + '/messages/' + d.id : TXN_API + '/messages';
    var method = _txnWizard.editing && d.id ? 'PUT' : 'POST';
    var resp = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
    if (!resp.ok) throw new Error((await resp.json()).error);
    showToast('Message saved', 'success');
    _txnActiveTab = 'event_messages';
    loadTransactionalMessages();
  } catch (e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

async function saveTxnPublish() {
  try {
    showLoading();
    var d = _txnWizard.data;
    var url = _txnWizard.editing && d.id ? TXN_API + '/messages/' + d.id : TXN_API + '/messages';
    var method = _txnWizard.editing && d.id ? 'PUT' : 'POST';
    var resp = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
    var saved = await resp.json();
    if (!resp.ok) throw new Error(saved.error);
    var pubResp = await fetch(TXN_API + '/messages/' + saved.id + '/publish', { method: 'POST' });
    if (!pubResp.ok) throw new Error((await pubResp.json()).error);
    showToast('Message published', 'success');
    _txnActiveTab = 'event_messages';
    loadTransactionalMessages();
  } catch (e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

// ──────────────────────────────────────────
// 4. MESSAGE DETAIL / REPORT
// ──────────────────────────────────────────
async function showTxnMessageReport(id) {
  try {
    showLoading();
    var resp = await fetch(TXN_API + '/messages/' + id + '/report');
    var rpt = await resp.json();
    if (!resp.ok) throw new Error(rpt.error);

    var m = rpt.message;
    var s = rpt.stats;
    var rates = rpt.rates;
    var logs = rpt.recent_logs || [];

    var statusBadge = '<span class="badge badge-' + ({ published: 'success', draft: 'secondary' }[m.status] || 'secondary') + '">' + m.status + '</span>';

    var html = '<div class="rpt-page">';
    html += '<div class="rpt-header card"><div class="rpt-header-left">';
    html += '<button class="btn-back" onclick="_txnActiveTab=\'event_messages\';loadTransactionalMessages()" title="Back"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
    html += '<div><div class="rpt-header-title">' + _txIco('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', 20) + ' ' + m.name + '</div>';
    html += '<div class="rpt-header-sub">' + statusBadge + ' &middot; Event: ' + m.event_name + ' &middot; v' + m.version + (m.published_at ? ' &middot; Published ' + new Date(m.published_at).toLocaleString() : '') + '</div>';
    html += '</div></div></div>';

    html += '<div class="txn-dash-grid" style="margin-top:16px">';
    html += _txnKpi('Events Received', s.received || 0, _txIco('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>', 18), '#8b5cf6');
    html += _txnKpi('Messages Sent', s.sent || 0, _txIco('<path d="m22 2-7 20-4-9-9-4 20-7z"/>', 18), '#3b82f6');
    html += _txnKpi('Delivered', s.delivered || 0, _txIco('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>', 18), '#10b981');
    html += _txnKpi('Failed', s.failed || 0, _txIco('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>', 18), '#ef4444');
    html += _txnKpi('Delivery Rate', (rates.delivery_rate || 0) + '%', _txIco('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>', 18), '#06b6d4');
    html += _txnKpi('Failure Rate', (rates.failure_rate || 0) + '%', _txIco('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>', 18), '#f97316');
    html += '</div>';

    html += '<div class="card" style="margin-top:16px"><div class="card-header"><h3 class="card-title">' + _txIco('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>', 14) + ' Message Volume (24h)</h3></div><div class="card-body"><canvas id="txn-timeline-chart" style="max-height:240px;width:100%"></canvas></div></div>';

    html += '<div class="card" style="margin-top:16px"><div class="card-header"><h3 class="card-title">' + _txIco('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>', 14) + ' Recent Activity</h3></div>';
    html += '<div class="table-container"><table class="data-table"><thead><tr><th>Time</th><th>Channel</th><th>Recipient</th><th>Status</th><th>Latency</th><th>Error</th></tr></thead><tbody>';
    if (logs.length === 0) {
      html += '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#94a3b8">No activity yet</td></tr>';
    }
    logs.forEach(function (l) {
      var statusCls = { sent: 'info', delivered: 'success', failed: 'danger', dropped: 'warning' }[l.status] || 'secondary';
      html += '<tr><td style="font-size:11px;white-space:nowrap">' + new Date(l.processed_at || l.created_at).toLocaleString() + '</td>';
      html += '<td>' + (l.channel || '').toUpperCase() + '</td>';
      html += '<td style="font-size:11px">' + (l.recipient || '') + '</td>';
      html += '<td><span class="badge badge-' + statusCls + '">' + l.status + '</span></td>';
      html += '<td>' + (l.latency_ms || 0) + 'ms</td>';
      html += '<td style="font-size:11px;color:#ef4444">' + (l.error || '') + '</td></tr>';
    });
    html += '</tbody></table></div></div>';
    html += '</div>';

    document.getElementById('content').innerHTML = html;

    setTimeout(function () { drawTxnTimelineChart(rpt.timeline || []); }, 100);
  } catch (e) { showToast(e.message, 'error'); } finally { hideLoading(); }
}

function drawTxnTimelineChart(timeline) {
  var canvas = document.getElementById('txn-timeline-chart');
  if (!canvas || !timeline.length) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.parentElement.clientWidth, h = 240;
  canvas.width = w; canvas.height = h;
  var pad = 50, cw = w - pad * 2, ch = h - pad * 2;
  var maxV = Math.max(1, ...timeline.map(function (d) { return Math.max(d.received, d.sent, d.failed); }));
  var spacing = cw / (timeline.length - 1 || 1);

  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();

  var lines = [
    { key: 'received', color: '#8b5cf6', label: 'Received' },
    { key: 'sent', color: '#3b82f6', label: 'Sent' },
    { key: 'failed', color: '#ef4444', label: 'Failed' }
  ];
  lines.forEach(function (line) {
    ctx.strokeStyle = line.color; ctx.lineWidth = 2;
    ctx.beginPath();
    timeline.forEach(function (d, i) {
      var x = pad + i * spacing, y = h - pad - (d[line.key] / maxV) * ch;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  });

  ctx.fillStyle = '#94a3b8'; ctx.font = '10px system-ui'; ctx.textAlign = 'right';
  for (var i = 0; i <= 4; i++) ctx.fillText(Math.round((maxV / 4) * i).toString(), pad - 6, h - pad - (ch / 4) * i + 4);
  ctx.textAlign = 'center';
  timeline.forEach(function (d, i) { if (i % 4 === 0) ctx.fillText(d.hour + 'h', pad + i * spacing, h - pad + 16); });

  ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'left';
  lines.forEach(function (line, i) { ctx.fillStyle = line.color; ctx.fillText('● ' + line.label, w - 140, 18 + i * 16); });
}
