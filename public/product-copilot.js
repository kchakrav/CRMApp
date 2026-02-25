/* ================================================================
   Product Copilot — Independent Agent
   Feedback · AI Analysis · Review Pipeline · Auto-Build
   ================================================================ */
(function () {
  'use strict';

  const API = '/api/feedback';
  let _open = false;
  let _tab = 'submit';
  let _attachments = [];
  let _cache = { all: [], stats: null };
  let _detailId = null;

  /* ── Toggle ────────────────────────────────────────── */
  window.toggleProductCopilot = function () {
    const panel = document.getElementById('copilot-panel');
    const overlay = document.getElementById('copilot-overlay');
    const btn = document.getElementById('copilot-btn');
    if (!panel) return;
    _open = !_open;
    panel.classList.toggle('open', _open);
    overlay.classList.toggle('open', _open);
    if (btn) btn.classList.toggle('active', _open);
    if (_open) {
      _switchTab('submit');
    }
  };

  /* ── Tabs ──────────────────────────────────────────── */
  function _renderTabs() {
    const ct = document.getElementById('copilot-tabs');
    if (!ct) return;
    const tabs = [
      { id: 'submit', label: 'Submit', icon: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z' },
      { id: 'my-feedback', label: 'My Feedback', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
      { id: 'admin', label: 'Manage', icon: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' }
    ];
    ct.innerHTML = tabs.map(t =>
      `<button class="copilot-tab ${_tab === t.id ? 'active' : ''}" onclick="window._copilotTab('${t.id}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${t.icon}"/></svg>
        ${t.label}
      </button>`
    ).join('');
  }

  function _switchTab(tab) {
    _tab = tab;
    _detailId = null;
    _renderTabs();
    const body = document.getElementById('copilot-body');
    if (!body) return;
    if (tab === 'submit') _renderSubmitForm(body);
    else if (tab === 'my-feedback') _renderMyFeedback(body);
    else if (tab === 'admin') _renderAdmin(body);
  }
  window._copilotTab = _switchTab;

  /* ══════════════════════════════════════════════════════
     SUBMIT TAB
     ══════════════════════════════════════════════════════ */
  function _renderSubmitForm(c) {
    const ctx = typeof currentRoute !== 'undefined' ? currentRoute.view : '';
    _attachments = [];
    c.innerHTML = `
      <div class="cpl-form">
        <p class="cpl-intro">How are we doing? Share your feedback here.</p>
        <div class="cpl-field">
          <label class="cpl-label">Subject</label>
          <input type="text" id="cpl-subject" class="cpl-input" placeholder="e.g. Improve delivery reports">
        </div>
        <div class="cpl-field">
          <label class="cpl-label">Description <span class="cpl-req">*</span></label>
          <textarea id="cpl-desc" class="cpl-textarea" rows="5" placeholder="Tell us what you'd like to see improved, or report an issue..."></textarea>
        </div>
        <div class="cpl-field">
          <label class="cpl-label">Category</label>
          <select id="cpl-cat" class="cpl-select">
            <option value="feature_request">Feature Request</option>
            <option value="bug_report">Bug Report</option>
            <option value="ui_improvement">UI Improvement</option>
            <option value="performance">Performance</option>
            <option value="integration">Integration</option>
            <option value="documentation">Documentation</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="cpl-field">
          <label class="cpl-label">Attachments</label>
          <div class="cpl-dropzone" onclick="document.getElementById('cpl-file').click()">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M12 16V4"/><path d="m5 9 7-7 7 7"/></svg>
            <p><strong>Drag and drop your file</strong></p>
            <p class="cpl-drop-sub">Or, select a file from your computer</p>
            <button type="button" class="cpl-browse">Browse files</button>
            <input type="file" id="cpl-file" style="display:none" multiple accept="image/*,.pdf,.txt" onchange="window._cplFiles(this.files)">
          </div>
          <div id="cpl-file-list" class="cpl-file-list"></div>
        </div>
        <input type="hidden" id="cpl-ctx" value="${ctx}">
        <button class="cpl-submit-btn" onclick="window._cplSubmit()">Submit Feedback</button>
      </div>`;
  }

  window._cplFiles = function (files) {
    for (const f of files) _attachments.push(f.name);
    const el = document.getElementById('cpl-file-list');
    if (el) el.innerHTML = _attachments.map((n, i) =>
      `<div class="cpl-file-item"><span>${_esc(n)}</span><button onclick="window._cplRmFile(${i})">×</button></div>`
    ).join('');
  };
  window._cplRmFile = function (i) { _attachments.splice(i, 1); window._cplFiles([]); };

  window._cplSubmit = async function () {
    const subject = document.getElementById('cpl-subject')?.value?.trim();
    const desc = document.getElementById('cpl-desc')?.value?.trim();
    const cat = document.getElementById('cpl-cat')?.value;
    const ctx = document.getElementById('cpl-ctx')?.value;
    if (!desc) { showToast('Description is required', 'error'); return; }
    try {
      const r = await fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject || 'General Feedback', description: desc, category: cat, page_context: ctx, attachments: _attachments })
      });
      if (r.ok) {
        showToast('Feedback submitted! AI analysis starting...', 'success');
        _attachments = [];
        _switchTab('my-feedback');
      } else {
        const d = await r.json();
        showToast(d.error || 'Submit failed', 'error');
      }
    } catch { showToast('Error submitting feedback', 'error'); }
  };

  /* ══════════════════════════════════════════════════════
     MY FEEDBACK TAB
     ══════════════════════════════════════════════════════ */
  async function _renderMyFeedback(c) {
    c.innerHTML = '<div class="cpl-loading">Loading...</div>';
    try {
      const res = await fetch(API);
      const items = await res.json();
      _cache.all = items;
      if (items.length === 0) {
        c.innerHTML = _emptyState('No feedback submitted yet.');
        return;
      }
      c.innerHTML = `<div class="cpl-list">${items.map(_renderListItem).join('')}</div>`;
    } catch { c.innerHTML = _emptyState('Error loading feedback.'); }
  }

  /* ══════════════════════════════════════════════════════
     ADMIN / MANAGE TAB
     ══════════════════════════════════════════════════════ */
  let _adminFilter = 'all';

  async function _renderAdmin(c) {
    c.innerHTML = '<div class="cpl-loading">Loading...</div>';
    try {
      const [fbRes, stRes] = await Promise.all([fetch(API), fetch(`${API}/stats/summary`)]);
      const items = await fbRes.json();
      const stats = await stRes.json();
      _cache.all = items;
      _cache.stats = stats;
      _adminFilter = 'all';
      _paintAdmin(c, items, stats);
    } catch { c.innerHTML = _emptyState('Error loading data.'); }
  }

  function _paintAdmin(c, items, stats) {
    c.innerHTML = `
      <div class="cpl-admin">
        <!-- Stats -->
        <div class="cpl-stats-row">
          <div class="cpl-stat"><span class="cpl-stat-val">${stats.total}</span><span class="cpl-stat-lbl">Total</span></div>
          <div class="cpl-stat cpl-stat-review"><span class="cpl-stat-val">${stats.submitted + stats.under_review}</span><span class="cpl-stat-lbl">Pending</span></div>
          <div class="cpl-stat cpl-stat-ok"><span class="cpl-stat-val">${stats.approved}</span><span class="cpl-stat-lbl">Approved</span></div>
          <div class="cpl-stat cpl-stat-built"><span class="cpl-stat-val">${stats.built}</span><span class="cpl-stat-lbl">Built</span></div>
          <div class="cpl-stat cpl-stat-no"><span class="cpl-stat-val">${stats.rejected}</span><span class="cpl-stat-lbl">Rejected</span></div>
        </div>

        <!-- Filters -->
        <div class="cpl-filters">
          ${['all', 'submitted', 'under_review', 'approved', 'built', 'rejected'].map(f =>
            `<button class="cpl-filter ${_adminFilter === f ? 'active' : ''}" onclick="window._cplFilter('${f}', this)">${_statusLabel(f)} (${f === 'all' ? stats.total : stats[f] || 0})</button>`
          ).join('')}
        </div>

        <!-- List -->
        <div id="cpl-admin-list" class="cpl-admin-list">
          ${_renderAdminItems(items)}
        </div>
      </div>`;
  }

  function _renderAdminItems(items) {
    if (items.length === 0) return '<div class="cpl-empty-mini">No items</div>';
    return items.map(item => {
      const a = item.ai_analysis || {};
      return `
        <div class="cpl-admin-card" onclick="window._cplDetail(${item.id})">
          <div class="cpl-admin-card-top">
            <span class="cpl-admin-subj">${_esc(item.subject)}</span>
            <span class="cpl-badge cpl-badge-${item.status}">${_statusLabel(item.status)}</span>
          </div>
          <p class="cpl-admin-desc">${_esc(item.description).substring(0, 90)}${item.description.length > 90 ? '...' : ''}</p>
          <div class="cpl-admin-meta">
            <span class="cpl-cat-tag">${_catLabel(item.category)}</span>
            ${a.priority ? `<span class="cpl-pri-tag cpl-pri-${a.priority}">${a.priority}</span>` : ''}
            <span class="cpl-date-tag">${_fmtDate(item.created_at)}</span>
          </div>
          <div class="cpl-admin-actions" onclick="event.stopPropagation()">
            ${item.status === 'submitted' || item.status === 'under_review' ? `
              <button class="cpl-act-btn cpl-act-approve" onclick="window._cplApprove(${item.id})" title="Approve">&#10003;</button>
              <button class="cpl-act-btn cpl-act-reject" onclick="window._cplReject(${item.id})" title="Reject">&#10005;</button>
            ` : ''}
            ${item.status === 'approved' ? `
              <button class="cpl-act-btn cpl-act-build" onclick="window._cplBuild(${item.id})" title="Auto Build">&#9881; Build</button>
            ` : ''}
            <button class="cpl-act-btn cpl-act-del" onclick="window._cplDelete(${item.id})" title="Delete">&#128465;</button>
          </div>
        </div>`;
    }).join('');
  }

  window._cplFilter = function (f, btn) {
    _adminFilter = f;
    document.querySelectorAll('.cpl-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filtered = f === 'all' ? _cache.all : _cache.all.filter(i => i.status === f);
    document.getElementById('cpl-admin-list').innerHTML = _renderAdminItems(filtered);
  };

  /* ── Detail View (inline in panel) ──────────────────── */
  window._cplDetail = async function (id) {
    const body = document.getElementById('copilot-body');
    body.innerHTML = '<div class="cpl-loading">Loading...</div>';
    try {
      const r = await fetch(`${API}/${id}`);
      const item = await r.json();
      const a = item.ai_analysis || {};
      body.innerHTML = `
        <div class="cpl-detail">
          <button class="cpl-back" onclick="window._copilotTab('${_tab}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
            Back
          </button>

          <h3 class="cpl-detail-title">${_esc(item.subject)}</h3>
          <div class="cpl-detail-row">
            <span class="cpl-badge cpl-badge-${item.status}">${_statusLabel(item.status)}</span>
            <span class="cpl-cat-tag">${_catLabel(item.category)}</span>
            <span class="cpl-date-tag">${_fmtDate(item.created_at)}</span>
            ${item.page_context ? `<span class="cpl-ctx-tag">from: ${item.page_context}</span>` : ''}
          </div>

          <div class="cpl-detail-sec">
            <h4>Description</h4>
            <p class="cpl-detail-desc">${_esc(item.description)}</p>
          </div>

          ${item.attachments?.length ? `
            <div class="cpl-detail-sec">
              <h4>Attachments</h4>
              <div class="cpl-file-list">${item.attachments.map(a => `<div class="cpl-file-item"><span>${_esc(a)}</span></div>`).join('')}</div>
            </div>
          ` : ''}

          ${a.detected_category ? `
            <div class="cpl-detail-sec cpl-analysis-box">
              <h4>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>
                AI Analysis
                <span class="cpl-confidence">${Math.round((a.confidence || 0) * 100)}%</span>
              </h4>
              <div class="cpl-analysis-grid">
                <div><span class="cpl-a-label">Priority</span><span class="cpl-pri-tag cpl-pri-${a.priority}">${a.priority}</span></div>
                <div><span class="cpl-a-label">Complexity</span><span class="cpl-a-val">${a.complexity}</span></div>
                <div><span class="cpl-a-label">Effort</span><span class="cpl-a-val">${a.estimated_effort}</span></div>
                <div><span class="cpl-a-label">Category</span><span class="cpl-a-val">${_catLabel(a.detected_category)}</span></div>
              </div>
              <div class="cpl-a-sub"><strong>Affected Areas</strong><div class="cpl-tag-row">${(a.affected_areas || []).map(x => `<span class="cpl-tag">${x}</span>`).join('')}</div></div>
              <div class="cpl-a-sub"><strong>Scope</strong><div class="cpl-tag-row">${(a.scope || []).map(x => `<span class="cpl-tag">${x}</span>`).join('')}</div></div>
              <div class="cpl-a-sub"><strong>Implementation Plan</strong><ol class="cpl-steps">${(a.implementation_steps || []).map(s => `<li>${s}</li>`).join('')}</ol></div>
              <div class="cpl-a-sub"><strong>Recommendations</strong><ul class="cpl-recs">${(a.recommendations || []).map(r => `<li>${r}</li>`).join('')}</ul></div>
            </div>
          ` : `
            <div class="cpl-detail-sec">
              <button class="cpl-act-btn cpl-act-build" onclick="window._cplAnalyze(${item.id})">Run AI Analysis</button>
            </div>
          `}

          ${item.build_log ? `
            <div class="cpl-detail-sec">
              <h4>Build Log</h4>
              <pre class="cpl-build-log">${_esc(item.build_log)}</pre>
            </div>
          ` : ''}

          ${item.admin_notes ? `
            <div class="cpl-detail-sec">
              <h4>Admin Notes</h4>
              <p class="cpl-detail-desc">${_esc(item.admin_notes)}</p>
            </div>
          ` : ''}

          <div class="cpl-detail-bar">
            ${item.status === 'submitted' || item.status === 'under_review' ? `
              <button class="cpl-act-btn cpl-act-approve" onclick="window._cplApprove(${item.id})">&#10003; Approve</button>
              <button class="cpl-act-btn cpl-act-reject" onclick="window._cplReject(${item.id})">&#10005; Reject</button>
            ` : ''}
            ${item.status === 'approved' ? `
              <button class="cpl-act-btn cpl-act-build" onclick="window._cplBuild(${item.id})">&#9881; Auto Build</button>
            ` : ''}
          </div>
        </div>`;
    } catch { body.innerHTML = _emptyState('Error loading details.'); }
  };

  /* ── Shared list item renderer ──────────────────────── */
  function _renderListItem(item) {
    const a = item.ai_analysis || {};
    return `
      <div class="cpl-list-card" onclick="window._cplDetail(${item.id})">
        <div class="cpl-list-card-top">
          <span class="cpl-list-subj">${_esc(item.subject)}</span>
          <span class="cpl-badge cpl-badge-${item.status}">${_statusLabel(item.status)}</span>
        </div>
        <p class="cpl-list-desc">${_esc(item.description).substring(0, 100)}${item.description.length > 100 ? '...' : ''}</p>
        <div class="cpl-list-meta">
          <span class="cpl-cat-tag">${_catLabel(item.category)}</span>
          ${a.priority ? `<span class="cpl-pri-tag cpl-pri-${a.priority}">${a.priority}</span>` : ''}
          ${a.estimated_effort ? `<span class="cpl-a-val">${a.estimated_effort}</span>` : ''}
          <span class="cpl-date-tag">${_fmtDate(item.created_at)}</span>
        </div>
        ${item.status === 'built' ? '<div class="cpl-built-tag">&#10003; Built & Deployed</div>' : ''}
      </div>`;
  }

  /* ── Actions ────────────────────────────────────────── */
  window._cplApprove = async function (id) {
    try {
      const r = await fetch(`${API}/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (r.ok) { showToast('Approved', 'success'); _switchTab(_tab); }
    } catch { showToast('Error', 'error'); }
  };

  window._cplReject = async function (id) {
    const notes = prompt('Rejection reason (optional):');
    try {
      const r = await fetch(`${API}/${id}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admin_notes: notes || '' }) });
      if (r.ok) { showToast('Rejected', 'info'); _switchTab(_tab); }
    } catch { showToast('Error', 'error'); }
  };

  window._cplBuild = async function (id) {
    if (!confirm('This will generate real code changes and apply them to the application. Continue?')) return;

    // Show building progress in the detail view
    const body = document.getElementById('copilot-body');
    body.innerHTML = `
      <div class="cpl-building">
        <div class="cpl-building-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="m6.343 6.343 2.828 2.828"/><path d="M2 12h4"/><path d="m17.657 6.343-2.828 2.828"/><path d="M22 12h-4"/><path d="m6.343 17.657 2.828-2.828"/><path d="M12 22v-4"/><path d="m17.657 17.657-2.828-2.828"/></svg>
        </div>
        <h3 class="cpl-building-title">Building...</h3>
        <p class="cpl-building-sub">Reading source code, generating changes, and applying them to the codebase.</p>
        <div class="cpl-building-steps">
          <div class="cpl-build-step active">Identifying target files...</div>
          <div class="cpl-build-step">Reading source code...</div>
          <div class="cpl-build-step">Generating code changes...</div>
          <div class="cpl-build-step">Applying changes...</div>
          <div class="cpl-build-step">Verifying...</div>
        </div>
      </div>`;

    // Animate steps
    const steps = body.querySelectorAll('.cpl-build-step');
    let stepIdx = 0;
    const stepTimer = setInterval(() => {
      if (stepIdx < steps.length) {
        steps[stepIdx].classList.remove('active');
        steps[stepIdx].classList.add('done');
      }
      stepIdx++;
      if (stepIdx < steps.length) {
        steps[stepIdx].classList.add('active');
      }
    }, 1500);

    try {
      const r = await fetch(`${API}/${id}/build`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      clearInterval(stepTimer);
      steps.forEach(s => { s.classList.remove('active'); s.classList.add('done'); });

      if (r.ok) {
        const data = await r.json();
        const filesChanged = data.build?.files_modified || 0;

        // Show success state
        body.innerHTML = `
          <div class="cpl-building">
            <div class="cpl-build-success-icon">&#10003;</div>
            <h3 class="cpl-building-title">Build Successful</h3>
            <p class="cpl-building-sub">${filesChanged} file(s) modified. Changes are live.</p>
            ${data.build?.changes?.length ? `
              <div class="cpl-build-changes">
                <strong>Changes applied:</strong>
                <ul>${data.build.changes.map(c => `<li><code>${c.file}</code> — ${c.description}</li>`).join('')}</ul>
              </div>
            ` : ''}
            <div class="cpl-build-action-row">
              <button class="cpl-submit-btn" onclick="location.reload()" style="margin-top:12px">
                Reload App to See Changes
              </button>
              <button class="cpl-act-btn" onclick="window._cplDetail(${id})" style="margin-top:8px;width:100%;text-align:center">
                View Build Log
              </button>
            </div>
          </div>`;
      } else {
        const d = await r.json();
        body.innerHTML = `
          <div class="cpl-building">
            <div class="cpl-build-fail-icon">&#10005;</div>
            <h3 class="cpl-building-title">Build Failed</h3>
            <p class="cpl-building-sub">${d.error || 'An error occurred during the build.'}</p>
            <button class="cpl-act-btn" onclick="window._copilotTab('admin')" style="margin-top:12px">Back to Manage</button>
          </div>`;
      }
    } catch (e) {
      clearInterval(stepTimer);
      body.innerHTML = `
        <div class="cpl-building">
          <div class="cpl-build-fail-icon">&#10005;</div>
          <h3 class="cpl-building-title">Build Error</h3>
          <p class="cpl-building-sub">${e.message || 'Network error'}</p>
          <button class="cpl-act-btn" onclick="window._copilotTab('admin')" style="margin-top:12px">Back to Manage</button>
        </div>`;
    }
  };

  window._cplDelete = async function (id) {
    if (!confirm('Delete this feedback?')) return;
    try {
      await fetch(`${API}/${id}`, { method: 'DELETE' });
      showToast('Deleted', 'info');
      _switchTab(_tab);
    } catch { showToast('Error', 'error'); }
  };

  window._cplAnalyze = async function (id) {
    showToast('Running AI analysis...', 'info');
    try {
      const r = await fetch(`${API}/${id}/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (r.ok) { showToast('Analysis complete', 'success'); window._cplDetail(id); }
    } catch { showToast('Error', 'error'); }
  };

  /* ── Helpers ────────────────────────────────────────── */
  function _esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function _statusLabel(s) {
    return { all: 'All', submitted: 'Submitted', under_review: 'Under Review', approved: 'Approved', rejected: 'Rejected', building: 'Building...', built: 'Built' }[s] || s;
  }
  function _catLabel(c) {
    return { feature_request: 'Feature Request', bug_report: 'Bug Report', ui_improvement: 'UI Improvement', performance: 'Performance', integration: 'Integration', documentation: 'Documentation', reporting: 'Reporting', other: 'Other' }[c] || c;
  }
  function _fmtDate(d) {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return d; }
  }
  function _emptyState(msg) {
    return `<div class="cpl-empty">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>
      <p>${msg}</p>
    </div>`;
  }
})();
