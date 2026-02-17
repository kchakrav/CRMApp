/**
 * Offer Decisioning Frontend – All views
 *   - Offers (catalog, create/edit, lifecycle, representations, constraints)
 *   - Placements
 *   - Collections & Qualifiers
 *   - Decision Rules
 *   - Decisions (policies, strategies, simulate, report)
 *   - Offer Analytics (overview dashboard)
 */

// ── Icon helpers (reuse from app.js ICONS) ──
const OD_ICONS = {
  offer:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>',
  placement:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
  collection:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>',
  rule:     '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>',
  decision: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
  tag:      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>',
  chart:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>',
  play:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>',
  eye:      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  plus:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
  edit:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
  trash:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
  copy:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
  strategy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
};

function statusBadge(status) {
  const colors = {
    draft: '#6E6E6E', approved: '#2196F3', live: '#4CAF50', archived: '#9E9E9E',
    active: '#4CAF50', inactive: '#9E9E9E', paused: '#FF9800'
  };
  const bg = colors[status] || '#6E6E6E';
  return `<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;color:#fff;background:${bg};text-transform:capitalize">${status}</span>`;
}

function typeBadge(type) {
  const isP = type === 'personalized';
  return `<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;color:#fff;background:${isP ? '#1976D2' : '#FF9800'}">${isP ? 'Personalized' : 'Fallback'}</span>`;
}

function channelBadge(channel) {
  const colors = { email: '#4CAF50', web: '#2196F3', mobile: '#9C27B0', sms: '#FF9800', push: '#F44336', any: '#607D8B' };
  return `<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;color:#fff;background:${colors[channel] || '#6E6E6E'}">${channel}</span>`;
}

function qualifierBadge(q) {
  return `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:500;color:#fff;background:${q.color || '#6E6E6E'}">${OD_ICONS.tag} ${q.name}</span>`;
}

function metricCard(label, value, subtitle, color = '#1976D2') {
  return `<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:16px;min-width:140px;flex:1">
    <div style="font-size:12px;color:#666;margin-bottom:4px">${label}</div>
    <div style="font-size:24px;font-weight:700;color:${color}">${value}</div>
    ${subtitle ? `<div style="font-size:11px;color:#999;margin-top:2px">${subtitle}</div>` : ''}
  </div>`;
}

// showToast is provided by app.js - do not redefine here (would cause infinite recursion)

// ── Filter state for offer inventory pages ──
const odOffersFilters = { type: 'all', status: 'all', search: '' };
const odDecisionsFilters = { status: 'all', search: '' };
const odCollectionsFilters = { search: '', type: 'all', status: 'all' };
const odPlacementsFilters = { search: '', channel: 'all', content_type: 'all', status: 'all' };
const odRulesFilters = { search: '', status: 'all', logic: 'all' };
const odStrategiesFilters = { search: '', ranking: 'all', status: 'all' };

function updateOdOffersFilter(key, value) {
  odOffersFilters[key] = value;
  if (key === 'search') {
    debounce('odOffersSearch', () => window.loadOffers(), 400);
  } else {
    window.loadOffers();
  }
}
function clearOdOffersFilters() {
  odOffersFilters.type = 'all';
  odOffersFilters.status = 'all';
  odOffersFilters.search = '';
  window.loadOffers();
}
function clearOdOffersFilterTag(key) {
  odOffersFilters[key] = key === 'search' ? '' : 'all';
  window.loadOffers();
}
function updateOdCollectionsFilter(key, value) {
  odCollectionsFilters[key] = value;
  if (key === 'search') debounce('odCollSearch', () => window.loadOfferCollections(), 400);
  else window.loadOfferCollections();
}
function clearOdCollectionsFilters() {
  odCollectionsFilters.search = ''; odCollectionsFilters.type = 'all'; odCollectionsFilters.status = 'all';
  window.loadOfferCollections();
}
function clearOdCollectionsFilterTag(key) { odCollectionsFilters[key] = key === 'search' ? '' : 'all'; window.loadOfferCollections(); }

function updateOdPlacementsFilter(key, value) {
  odPlacementsFilters[key] = value;
  if (key === 'search') debounce('odPlSearch', () => window.loadPlacements(), 400);
  else window.loadPlacements();
}
function clearOdPlacementsFilters() {
  odPlacementsFilters.search = ''; odPlacementsFilters.channel = 'all'; odPlacementsFilters.content_type = 'all'; odPlacementsFilters.status = 'all';
  window.loadPlacements();
}
function clearOdPlacementsFilterTag(key) { odPlacementsFilters[key] = key === 'search' ? '' : 'all'; window.loadPlacements(); }

function updateOdRulesFilter(key, value) {
  odRulesFilters[key] = value;
  if (key === 'search') debounce('odRulesSearch', () => window.loadDecisionRules(), 400);
  else window.loadDecisionRules();
}
function clearOdRulesFilters() {
  odRulesFilters.search = ''; odRulesFilters.status = 'all'; odRulesFilters.logic = 'all';
  window.loadDecisionRules();
}
function clearOdRulesFilterTag(key) { odRulesFilters[key] = key === 'search' ? '' : 'all'; window.loadDecisionRules(); }

function updateOdStrategiesFilter(key, value) {
  odStrategiesFilters[key] = value;
  if (key === 'search') debounce('odStratSearch', () => window.loadStrategies(), 400);
  else window.loadStrategies();
}
function clearOdStrategiesFilters() {
  odStrategiesFilters.search = ''; odStrategiesFilters.ranking = 'all'; odStrategiesFilters.status = 'all';
  window.loadStrategies();
}
function clearOdStrategiesFilterTag(key) { odStrategiesFilters[key] = key === 'search' ? '' : 'all'; window.loadStrategies(); }

function updateOdDecisionsFilter(key, value) {
  odDecisionsFilters[key] = value;
  if (key === 'search') {
    debounce('odDecisionsSearch', () => window.loadDecisions(), 400);
  } else {
    window.loadDecisions();
  }
}
function clearOdDecisionsFilters() {
  odDecisionsFilters.status = 'all';
  odDecisionsFilters.search = '';
  window.loadDecisions();
}
function clearOdDecisionsFilterTag(key) {
  odDecisionsFilters[key] = key === 'search' ? '' : 'all';
  window.loadDecisions();
}

// ══════════════════════════════════════════════════════
//  1. OFFERS VIEW
// ══════════════════════════════════════════════════════

window.loadOffers = async function() {
  const content = document.getElementById('content');
  showLoading();
  try {
    const offersRes = await fetch('/api/offers').then(r => r.json());
    let offers = offersRes.offers || [];
    const totalCount = offers.length;

    // Apply filters client-side
    if (odOffersFilters.type !== 'all') offers = offers.filter(o => o.type === odOffersFilters.type);
    if (odOffersFilters.status !== 'all') offers = offers.filter(o => o.status === odOffersFilters.status);
    if (odOffersFilters.search) {
      const s = odOffersFilters.search.toLowerCase();
      offers = offers.filter(o => (o.name || '').toLowerCase().includes(s) || (o.description || '').toLowerCase().includes(s));
    }

    // Apply sorting
    offers = applySorting(offers, currentTableSort.column || 'updated_at');

    // Build filter tags
    const filterTags = [];
    if (odOffersFilters.type !== 'all') filterTags.push({ key: 'type', label: 'Type', value: odOffersFilters.type });
    if (odOffersFilters.status !== 'all') filterTags.push({ key: 'status', label: 'Status', value: odOffersFilters.status });
    if (odOffersFilters.search) filterTags.push({ key: 'search', label: 'Search', value: odOffersFilters.search });

    const columns = [
      { id: 'name', label: 'Name' },
      { id: 'type', label: 'Type' },
      { id: 'status', label: 'Status' },
      { id: 'priority', label: 'Priority' },
      { id: 'tags', label: 'Tags' },
      { id: 'reps', label: 'Representations' },
      { id: 'propositions', label: 'Propositions' },
      { id: 'dates', label: 'Date Range' }
    ];

    const tableRows = offers.map(o => {
      const actions = [
        { icon: OD_ICONS.eye, label: 'View Details', onclick: `showOfferDetail(${o.id})` },
        { icon: OD_ICONS.edit, label: 'Edit', onclick: `navigateTo('offers','edit',${o.id})` },
        { icon: OD_ICONS.copy, label: 'Duplicate', onclick: `offerAction(${o.id},'duplicate')` },
        { divider: true },
        ...(o.status === 'draft' ? [{ icon: OD_ICONS.play, label: 'Publish', onclick: `offerAction(${o.id},'publish')` }] : []),
        ...(o.status === 'live' ? [{ icon: OD_ICONS.chart, label: 'Archive', onclick: `offerAction(${o.id},'archive')` }] : []),
        { divider: true },
        { icon: OD_ICONS.trash, label: 'Delete', onclick: `deleteOffer(${o.id})`, danger: true }
      ];
      return `<tr>
        <td data-column-id="name">${createTableLink(`<strong>${o.name}</strong>`, `showOfferDetail(${o.id})`)}<div class="table-subtext">${(o.description || '').substring(0, 60)}</div></td>
        <td data-column-id="type">${typeBadge(o.type)}</td>
        <td data-column-id="status">${createStatusIndicator(o.status, o.status)}</td>
        <td data-column-id="priority" style="text-align:center;font-weight:600">${o.priority}</td>
        <td data-column-id="tags">${(o.tags || []).map(t => qualifierBadge(t)).join(' ') || '<span style="color:#ccc">\u2014</span>'}</td>
        <td data-column-id="reps" style="text-align:center">${o.representation_count || 0}</td>
        <td data-column-id="propositions" style="text-align:center">${o.proposition_count || 0}</td>
        <td data-column-id="dates" style="font-size:12px">${o.start_date ? o.start_date.split('T')[0] : '\u2014'} \u2192 ${o.end_date ? o.end_date.split('T')[0] : '\u2014'}</td>
        <td>${createActionMenu(o.id, actions)}</td>
      </tr>`;
    }).join('');

    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${OD_ICONS.offer} Offer Library</h3>
          <button class="btn btn-primary" onclick="navigateTo('offers','create')">+ Create Offer</button>
        </div>
        ${createTableToolbar({
          resultCount: offers.length,
          totalCount,
          showColumnSelector: true,
          columns,
          viewKey: 'offers',
          showSearch: true,
          searchPlaceholder: 'Search offers...',
          searchValue: odOffersFilters.search,
          onSearch: 'updateOdOffersFilter("search", this.value)',
          filterTags,
          onClearTag: 'clearOdOffersFilterTag',
          filters: [
            { type: 'select', label: 'Type', value: odOffersFilters.type, onChange: 'updateOdOffersFilter("type", this.value)',
              options: [{ value: 'all', label: 'All types' }, { value: 'personalized', label: 'Personalized' }, { value: 'fallback', label: 'Fallback' }] },
            { type: 'select', label: 'Status', value: odOffersFilters.status, onChange: 'updateOdOffersFilter("status", this.value)',
              options: [{ value: 'all', label: 'All statuses' }, { value: 'draft', label: 'Draft' }, { value: 'approved', label: 'Approved' }, { value: 'live', label: 'Live' }, { value: 'archived', label: 'Archived' }] }
          ]
        })}
        <div class="data-table-container">
          <table class="data-table" data-view="offers">
            <thead><tr>
              ${createSortableHeader('name', 'Name', currentTableSort)}
              ${createSortableHeader('type', 'Type', currentTableSort)}
              ${createSortableHeader('status', 'Status', currentTableSort)}
              ${createSortableHeader('priority', 'Priority', currentTableSort)}
              <th data-column-id="tags">Tags</th>
              <th data-column-id="reps">Reps</th>
              <th data-column-id="propositions">Propositions</th>
              <th data-column-id="dates">Date Range</th>
              <th style="width:50px"></th>
            </tr></thead>
            <tbody>${tableRows || '<tr><td colspan="9" style="text-align:center;padding:2rem;color:#6B7280">No offers found</td></tr>'}</tbody>
          </table>
        </div>
      </div>`;

    applyColumnVisibility('offers');
  } catch (e) {
    showError('Failed to load Offers');
  } finally {
    hideLoading();
  }
};

// ── Full-page offer create/edit form (matches Contact / Workflow pattern) ──

window.renderOfferForm = async function(offer) {
  const isEdit = !!offer;
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-inline"><div class="spinner"></div></div>';

  // Load reference data
  const [qualRes, rulesRes] = await Promise.all([
    fetch('/api/collections/qualifiers').then(r => r.json()),
    fetch('/api/decision-rules').then(r => r.json())
  ]);
  const qualifiers = qualRes.qualifiers || [];
  const rules = rulesRes.rules || [];

  let constraint = null;
  if (isEdit) {
    const full = await fetch(`/api/offers/${offer.id}`).then(r => r.json());
    constraint = full.constraint;
    offer = { ...offer, ...full };
  }

  content.innerHTML = `
    <div class="form-container">
      <form id="offer-form" onsubmit="handleOfferSubmit(event)">
        <input type="hidden" id="offer-edit-id" value="${isEdit ? offer.id : ''}">

        <!-- Basic Information -->
        <div class="form-section">
          <h3 class="form-section-title">Basic Information</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label form-label-required">Offer Name</label>
              <input type="text" id="od-name" class="form-input" value="${offer?.name || ''}" required placeholder="e.g., 20% Off Summer Collection">
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Description</label>
              <textarea id="od-desc" class="form-input" rows="2" placeholder="Describe what this offer provides to the customer">${offer?.description || ''}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Offer Type</label>
              <select id="od-type" class="form-input">
                <option value="personalized" ${offer?.type === 'personalized' || !offer ? 'selected' : ''}>Personalized</option>
                <option value="fallback" ${offer?.type === 'fallback' ? 'selected' : ''}>Fallback</option>
              </select>
              <div class="form-help">Personalized offers use eligibility rules. Fallback offers are shown when no personalized offer qualifies.</div>
            </div>
            <div class="form-group">
              <label class="form-label">Priority (0–100)</label>
              <input type="number" id="od-priority" class="form-input" min="0" max="100" value="${offer?.priority ?? 50}">
              <div class="form-help">Higher priority offers are selected first when multiple qualify</div>
            </div>
          </div>
        </div>

        <!-- Schedule -->
        <div class="form-section">
          <h3 class="form-section-title">Validity Period</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Start Date</label>
              <input type="date" id="od-start" class="form-input" value="${offer?.start_date ? offer.start_date.split('T')[0] : ''}">
              <div class="form-help">Offer becomes eligible from this date</div>
            </div>
            <div class="form-group">
              <label class="form-label">End Date</label>
              <input type="date" id="od-end" class="form-input" value="${offer?.end_date ? offer.end_date.split('T')[0] : ''}">
              <div class="form-help">Offer expires after this date</div>
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div class="form-section">
          <h3 class="form-section-title">Collection Qualifiers (Tags)</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label">Tags</label>
              <div style="display:flex;flex-wrap:wrap;gap:8px;padding:4px 0">
                ${qualifiers.length === 0 ? '<span style="color:#6B7280;font-size:13px">No tags defined yet.</span>' :
                  qualifiers.map(q => {
                    const checked = offer && (offer.tags || []).some(t => t.id === q.id);
                    return `<label style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border:2px solid ${q.color};border-radius:20px;font-size:13px;cursor:pointer;background:${checked ? q.color + '18' : '#fff'};transition:background .15s">
                      <input type="checkbox" class="od-tag-cb" value="${q.id}" ${checked ? 'checked' : ''} style="accent-color:${q.color}">
                      <span style="color:${q.color};font-weight:500">${q.name}</span>
                    </label>`;
                  }).join('')}
                <a href="#" onclick="event.preventDefault();navigateTo('collections','list')" style="display:inline-flex;align-items:center;gap:4px;padding:6px 14px;border:2px dashed #ccc;border-radius:20px;font-size:13px;color:#1473E6;text-decoration:none;cursor:pointer">+ Manage tags</a>
              </div>
              <div class="form-help">Tags determine which dynamic collections this offer belongs to</div>
            </div>
          </div>
        </div>

        <!-- Eligibility -->
        <div class="form-section">
          <h3 class="form-section-title">Eligibility</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label">Eligibility Rule</label>
              <select id="od-rule" class="form-input">
                <option value="">All visitors (no rule)</option>
                ${rules.map(r => `<option value="${r.id}" ${offer?.eligibility_rule_id === r.id ? 'selected' : ''}>${r.name} — ${r.description || ''}</option>`).join('')}
              </select>
              <div class="form-help">Only contacts matching this rule will be eligible for this offer. Leave empty to target everyone.</div>
            </div>
          </div>
        </div>

        <!-- Constraints & Capping -->
        <div class="form-section">
          <h3 class="form-section-title">Constraints &amp; Capping</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Per-User Cap</label>
              <input type="number" id="od-per-user-cap" class="form-input" min="0" value="${constraint?.per_user_cap || 0}">
              <div class="form-help">Max times one person sees this offer (0 = unlimited)</div>
            </div>
            <div class="form-group">
              <label class="form-label">Frequency Period</label>
              <select id="od-freq" class="form-input">
                <option value="lifetime" ${constraint?.frequency_period === 'lifetime' ? 'selected' : ''}>Lifetime</option>
                <option value="daily" ${constraint?.frequency_period === 'daily' ? 'selected' : ''}>Daily</option>
                <option value="weekly" ${constraint?.frequency_period === 'weekly' ? 'selected' : ''}>Weekly</option>
                <option value="monthly" ${constraint?.frequency_period === 'monthly' ? 'selected' : ''}>Monthly</option>
              </select>
              <div class="form-help">Time window for the per-user cap</div>
            </div>
            <div class="form-group">
              <label class="form-label">Total Cap</label>
              <input type="number" id="od-total-cap" class="form-input" min="0" value="${constraint?.total_cap || 0}">
              <div class="form-help">Max total propositions across all users (0 = unlimited)</div>
            </div>
          </div>
        </div>

        ${isEdit ? `
        <!-- Status (edit only) -->
        <div class="form-section">
          <h3 class="form-section-title">Status</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Offer Status</label>
              <select id="od-status" class="form-input">
                <option value="draft" ${offer?.status === 'draft' ? 'selected' : ''}>Draft</option>
                <option value="approved" ${offer?.status === 'approved' ? 'selected' : ''}>Approved</option>
                <option value="live" ${offer?.status === 'live' ? 'selected' : ''}>Live</option>
                <option value="archived" ${offer?.status === 'archived' ? 'selected' : ''}>Archived</option>
              </select>
              <div class="form-help">Draft → Approved → Live → Archived</div>
            </div>
          </div>
        </div>

        ` : '<input type="hidden" id="od-status" value="draft">'}

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="navigateTo('offers', 'list')">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? ICONS.save + ' Update' : ICONS.sparkles + ' Create'} Offer</button>
        </div>
      </form>
    </div>
  `;
};

window.handleOfferSubmit = async function(event) {
  event.preventDefault();

  const editId = document.getElementById('offer-edit-id').value;
  const isEdit = !!editId;
  const tags = [...document.querySelectorAll('.od-tag-cb:checked')].map(cb => parseInt(cb.value));

  const data = {
    name: document.getElementById('od-name').value,
    description: document.getElementById('od-desc').value,
    type: document.getElementById('od-type').value,
    priority: parseInt(document.getElementById('od-priority').value) || 50,
    start_date: document.getElementById('od-start').value || null,
    end_date: document.getElementById('od-end').value || null,
    eligibility_rule_id: document.getElementById('od-rule').value || null,
    status: document.getElementById('od-status').value,
    tags
  };

  if (!data.name) {
    if (typeof showToast === 'function') showToast('Offer name is required', 'error');
    return;
  }

  try {
    const url = isEdit ? `/api/offers/${editId}` : '/api/offers';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await res.json();
    const offerId = isEdit ? editId : result.id;

    // Save constraints
    await fetch(`/api/offers/${offerId}/constraints`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        per_user_cap: parseInt(document.getElementById('od-per-user-cap').value) || 0,
        frequency_period: document.getElementById('od-freq').value,
        total_cap: parseInt(document.getElementById('od-total-cap').value) || 0
      })
    });

    if (typeof showToast === 'function') showToast(isEdit ? 'Offer updated' : 'Offer created');
    navigateTo('offers', 'list');
  } catch (err) {
    if (typeof showToast === 'function') showToast('Error saving offer: ' + err.message, 'error');
  }
};

// ── Offer detail view ──

window.showOfferDetail = async function(id) {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-inline"><div class="spinner"></div></div>';

  const offer = await fetch(`/api/offers/${id}`).then(r => r.json());
  const perf = offer.performance || {};

  content.innerHTML = `
    <div style="margin-bottom:12px">
      <button class="btn btn-secondary btn-sm" onclick="navigateTo('offers','list')" style="display:inline-flex;align-items:center;gap:4px">
        ${BACK_SVG} Back to Offers
      </button>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <h3 class="card-title">${offer.name}</h3>
          <div class="card-subtitle">${offer.description || 'No description'}</div>
          <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
            ${typeBadge(offer.type)} ${statusBadge(offer.status)}
            ${(offer.tags || []).map(t => qualifierBadge(t)).join(' ')}
          </div>
        </div>
        <div style="display:flex;gap:8px">
          ${offer.status === 'draft' ? `<button class="btn btn-primary btn-sm" onclick="offerAction(${id},'publish')">Publish</button>` : ''}
          ${offer.status === 'live' ? `<button class="btn btn-secondary btn-sm" onclick="offerAction(${id},'archive')">Archive</button>` : ''}
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('offers','edit',${id})">Edit</button>
        </div>
      </div>
      <div class="card-body">
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px">
          ${metricCard('Priority', offer.priority, '', '#1976D2')}
          ${metricCard('Propositions', perf.total_propositions || 0, `${perf.impressions || 0} impressions`)}
          ${metricCard('Click Rate', (perf.click_rate || '0.00') + '%', `${perf.clicks || 0} clicks`, '#FF9800')}
          ${metricCard('Conversion Rate', (perf.conversion_rate || '0.00') + '%', `${perf.conversions || 0} conversions`, '#4CAF50')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
          <div><strong>Start Date:</strong> ${offer.start_date || 'Not set'}</div>
          <div><strong>End Date:</strong> ${offer.end_date || 'Not set'}</div>
          <div><strong>Eligibility Rule:</strong> ${offer.eligibility_rule ? offer.eligibility_rule.name : 'All visitors'}</div>
          <div><strong>Created:</strong> ${new Date(offer.created_at).toLocaleDateString()}</div>
        </div>
      </div>
    </div>

    <!-- Representations -->
    <div class="card" style="margin-bottom:16px">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
        <h3 class="card-title">${OD_ICONS.placement} Representations (${(offer.representations || []).length})</h3>
        <button class="btn btn-sm btn-secondary" onclick="showAddRepPage(${id})">+ Add Representation</button>
      </div>
      <div class="card-body" style="padding:0">
        ${(offer.representations || []).length === 0
          ? '<div style="padding:24px;text-align:center;color:#999">No representations yet. Add content for each placement.</div>'
          : `<table class="data-table" style="width:100%"><thead><tr><th>Placement</th><th>Channel</th><th>Content Type</th><th>Content Preview</th><th style="width:120px">Actions</th></tr></thead><tbody>
            ${(offer.representations || []).map(r => {
              const escaped = (r.content || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').substring(0, 100);
              return `<tr>
              <td><strong>${r.placement ? r.placement.name : 'Unknown'}</strong></td>
              <td>${r.placement ? channelBadge(r.placement.channel) : '\u2014'}</td>
              <td>${r.content_type}</td>
              <td style="max-width:300px;overflow:hidden;font-size:12px;color:#666;font-family:monospace;white-space:nowrap;text-overflow:ellipsis">${escaped || '<em style="font-family:inherit;color:#ccc">Empty</em>'}${(r.content || '').length > 100 ? '...' : ''}</td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-sm btn-secondary" onclick="showEditRepPage(${id},${r.id})" style="display:inline-flex;align-items:center;gap:4px">${OD_ICONS.edit} Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteRep(${id},${r.id})" style="display:inline-flex;align-items:center;gap:4px">${OD_ICONS.trash}</button>
                </div>
              </td>
            </tr>`;
            }).join('')}
          </tbody></table>`
        }
      </div>
    </div>

    <!-- Constraint -->
    ${offer.constraint ? `<div class="card">
      <div class="card-header"><h3 class="card-title">Constraints</h3></div>
      <div class="card-body" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font-size:13px">
        <div><strong>Per-User Cap:</strong> ${offer.constraint.per_user_cap || 'Unlimited'}</div>
        <div><strong>Frequency:</strong> ${offer.constraint.frequency_period || 'Lifetime'}</div>
        <div><strong>Total Cap:</strong> ${offer.constraint.total_cap || 'Unlimited'}</div>
      </div>
    </div>` : ''}
  `;
};

// ── Add Representation (inline full-page form) ──

window.showAddRepPage = async function(offerId) {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-inline"><div class="spinner"></div></div>';
  document.getElementById('page-title').textContent = 'Add Representation';

  const placementsRes = await fetch('/api/placements').then(r => r.json());
  const placements = placementsRes.placements || [];

  content.innerHTML = `
    <div class="form-container">
      <form id="rep-form" onsubmit="handleRepSubmit(event)">
        <input type="hidden" id="rep-offer-id" value="${offerId}">
        <input type="hidden" id="rep-blocks" value="">
        <div class="form-section">
          <h3 class="form-section-title">Representation Content</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label form-label-required">Placement</label>
              <select id="rep-placement" class="form-input">
                ${placements.map(p => `<option value="${p.id}" data-ctype="${p.content_type}">${p.name} (${p.channel} / ${p.content_type})</option>`).join('')}
              </select>
              <div class="form-help">Select the placement where this offer content will appear</div>
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Content</label>
              <div class="rep-editor-launch" style="display:flex;gap:12px;align-items:stretch;margin-bottom:12px">
                <button type="button" class="btn btn-primary" onclick="openOfferRepEditor(${offerId})" style="display:flex;align-items:center;gap:8px;padding:14px 24px;font-size:14px">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  Open Visual Editor
                </button>
                <div style="display:flex;align-items:center;color:#6B7280;font-size:13px">or enter HTML code below</div>
              </div>
              <textarea id="rep-content" class="form-input" rows="8" placeholder="HTML content — use the Visual Editor above for a drag-and-drop experience, or paste raw HTML here" style="font-family:monospace;font-size:13px"></textarea>
              <div class="form-help">Use the visual editor for rich content, or paste raw HTML/text directly</div>
            </div>
            <div class="form-group">
              <label class="form-label">Image URL</label>
              <input type="url" id="rep-image" class="form-input" placeholder="https://example.com/image.jpg">
              <div class="form-help">Image URL for image-type representations</div>
            </div>
            <div class="form-group">
              <label class="form-label">Link URL</label>
              <input type="url" id="rep-link" class="form-input" placeholder="https://example.com/landing-page">
              <div class="form-help">Destination URL when the offer is clicked</div>
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Alt Text</label>
              <input type="text" id="rep-alt" class="form-input" placeholder="Descriptive text for accessibility">
              <div class="form-help">Alternative text for images or screen readers</div>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="showOfferDetail(${offerId})">Cancel</button>
          <button type="submit" class="btn btn-primary">${ICONS.sparkles} Add Representation</button>
        </div>
      </form>
    </div>`;
};

window.handleRepSubmit = async function(event) {
  event.preventDefault();
  const offerId = document.getElementById('rep-offer-id').value;
  const sel = document.getElementById('rep-placement');
  const placementId = sel.value;
  const ctype = sel.options[sel.selectedIndex].getAttribute('data-ctype') || 'html';
  const blocksStr = document.getElementById('rep-blocks')?.value;
  let blocks = null;
  try { if (blocksStr) blocks = JSON.parse(blocksStr); } catch(_e) {}
  await fetch(`/api/offers/${offerId}/representations`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      placement_id: placementId,
      content_type: ctype,
      content: document.getElementById('rep-content').value,
      image_url: document.getElementById('rep-image').value,
      link_url: document.getElementById('rep-link').value,
      alt_text: document.getElementById('rep-alt').value,
      blocks: blocks
    })
  });
  showToast('Representation added');
  showOfferDetail(parseInt(offerId));
};

// ── Edit Representation ──

window.showEditRepPage = async function(offerId, repId) {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-inline"><div class="spinner"></div></div>';
  document.getElementById('page-title').textContent = 'Edit Representation';

  const [placementsRes, repsRes] = await Promise.all([
    fetch('/api/placements').then(r => r.json()),
    fetch(`/api/offers/${offerId}/representations`).then(r => r.json())
  ]);
  const placements = placementsRes.placements || [];
  const allReps = repsRes.representations || repsRes || [];
  const rep = allReps.find(r => r.id === repId);
  if (!rep) {
    content.innerHTML = '<div class="alert alert-danger">Representation not found.</div>';
    return;
  }

  const escContent = (rep.content || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const hasBlocks = Array.isArray(rep.blocks) && rep.blocks.length > 0;
  const blocksJson = hasBlocks ? JSON.stringify(rep.blocks).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';

  content.innerHTML = `
    <div class="form-container">
      <form id="rep-edit-form" onsubmit="handleRepUpdate(event)">
        <input type="hidden" id="rep-edit-offer-id" value="${offerId}">
        <input type="hidden" id="rep-edit-id" value="${repId}">
        <input type="hidden" id="rep-edit-blocks" value="${blocksJson}">
        <div class="form-section">
          <h3 class="form-section-title">Edit Representation Content</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label">Placement</label>
              <select id="rep-edit-placement" class="form-input">
                ${placements.map(p => `<option value="${p.id}" data-ctype="${p.content_type}" ${p.id === rep.placement_id ? 'selected' : ''}>${p.name} (${p.channel} / ${p.content_type})</option>`).join('')}
              </select>
              <div class="form-help">The placement where this offer content will appear</div>
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Content</label>
              <div class="rep-editor-launch" style="display:flex;gap:12px;align-items:stretch;margin-bottom:12px">
                <button type="button" class="btn btn-primary" onclick="openOfferRepEditor(${offerId}, ${repId})" style="display:flex;align-items:center;gap:8px;padding:14px 24px;font-size:14px">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  Open Visual Editor
                </button>
                ${hasBlocks ? '<span style="display:flex;align-items:center;color:#4CAF50;font-size:13px;gap:4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg> Built with visual editor</span>' : '<div style="display:flex;align-items:center;color:#6B7280;font-size:13px">or edit HTML code below</div>'}
              </div>
              <textarea id="rep-edit-content" class="form-input" rows="10" placeholder="HTML content — use the Visual Editor above for a drag-and-drop experience, or edit raw HTML here" style="font-family:monospace;font-size:13px">${escContent}</textarea>
              <div class="form-help">Use the visual editor for rich content, or edit raw HTML directly</div>
            </div>
            <div class="form-group">
              <label class="form-label">Image URL</label>
              <input type="url" id="rep-edit-image" class="form-input" placeholder="https://example.com/image.jpg" value="${rep.image_url || ''}">
              <div class="form-help">Image URL for image-type representations</div>
            </div>
            <div class="form-group">
              <label class="form-label">Link URL</label>
              <input type="url" id="rep-edit-link" class="form-input" placeholder="https://example.com/landing-page" value="${rep.link_url || ''}">
              <div class="form-help">Destination URL when the offer is clicked</div>
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Alt Text</label>
              <input type="text" id="rep-edit-alt" class="form-input" placeholder="Descriptive text for accessibility" value="${rep.alt_text || ''}">
              <div class="form-help">Alternative text for images or screen readers</div>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="showOfferDetail(${offerId})">Cancel</button>
          <button type="submit" class="btn btn-primary">${ICONS.save} Update Representation</button>
        </div>
      </form>
    </div>`;
};

window.handleRepUpdate = async function(event) {
  event.preventDefault();
  const offerId = document.getElementById('rep-edit-offer-id').value;
  const repId = document.getElementById('rep-edit-id').value;
  const sel = document.getElementById('rep-edit-placement');
  const placementId = sel.value;
  const ctype = sel.options[sel.selectedIndex].getAttribute('data-ctype') || 'html';
  const blocksStr = document.getElementById('rep-edit-blocks')?.value;
  let blocks = null;
  try { if (blocksStr) blocks = JSON.parse(blocksStr); } catch(_e) {}
  const resp = await fetch(`/api/offers/${offerId}/representations/${repId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      placement_id: parseInt(placementId),
      content_type: ctype,
      content: document.getElementById('rep-edit-content').value,
      image_url: document.getElementById('rep-edit-image').value,
      link_url: document.getElementById('rep-edit-link').value,
      alt_text: document.getElementById('rep-edit-alt').value,
      blocks: blocks
    })
  });
  if (resp.ok) {
    showToast('Representation updated');
  } else {
    showToast('Failed to update representation', 'error');
  }
  showOfferDetail(parseInt(offerId));
};

window.deleteRep = async function(offerId, repId) {
  if (!confirm('Delete this representation?')) return;
  await fetch(`/api/offers/${offerId}/representations/${repId}`, { method: 'DELETE' });
  showToast('Representation deleted');
  showOfferDetail(offerId);
};

window.openOfferRepEditor = function(offerId, repId) {
  const params = new URLSearchParams({
    offerRepMode: '1',
    offerId: String(offerId),
    return: 'modal'
  });
  if (repId) params.set('repId', String(repId));
  const url = `/email-designer.html?${params.toString()}`;
  const modal = document.getElementById('email-editor-modal');
  const iframe = document.getElementById('email-editor-iframe');
  if (!modal || !iframe) {
    window.location.href = url;
    return;
  }
  modal.classList.remove('hidden');
  iframe.src = url;
  window._offerRepEditorContext = { offerId, repId };
};

window.offerAction = async function(id, action) {
  await fetch(`/api/offers/${id}/${action}`, { method: 'POST' });
  showToast(`Offer ${action}ed`);
  window.loadOffers();
};

window.deleteOffer = async function(id) {
  if (!confirm('Delete this offer?')) return;
  await fetch(`/api/offers/${id}`, { method: 'DELETE' });
  showToast('Offer deleted');
  window.loadOffers();
};


// ══════════════════════════════════════════════════════
//  2. PLACEMENTS VIEW
// ══════════════════════════════════════════════════════

window.loadPlacements = async function() {
  const content = document.getElementById('content');
  showLoading();
  try {
    const res = await fetch('/api/placements').then(r => r.json());
    let placements = res.placements || [];
    const totalPlacements = placements.length;

    if (odPlacementsFilters.channel !== 'all') placements = placements.filter(p => p.channel === odPlacementsFilters.channel);
    if (odPlacementsFilters.content_type !== 'all') placements = placements.filter(p => p.content_type === odPlacementsFilters.content_type);
    if (odPlacementsFilters.status !== 'all') placements = placements.filter(p => p.status === odPlacementsFilters.status);
    if (odPlacementsFilters.search) {
      const s = odPlacementsFilters.search.toLowerCase();
      placements = placements.filter(p => (p.name || '').toLowerCase().includes(s) || (p.description || '').toLowerCase().includes(s));
    }
    placements = applySorting(placements, currentTableSort.column || 'name');

    const plFilterTags = [];
    if (odPlacementsFilters.channel !== 'all') plFilterTags.push({ key: 'channel', label: 'Channel', value: odPlacementsFilters.channel });
    if (odPlacementsFilters.content_type !== 'all') plFilterTags.push({ key: 'content_type', label: 'Content Type', value: odPlacementsFilters.content_type });
    if (odPlacementsFilters.status !== 'all') plFilterTags.push({ key: 'status', label: 'Status', value: odPlacementsFilters.status });
    if (odPlacementsFilters.search) plFilterTags.push({ key: 'search', label: 'Search', value: odPlacementsFilters.search });

    const columns = [
      { id: 'name', label: 'Name' },
      { id: 'channel', label: 'Channel' },
      { id: 'content_type', label: 'Content Type' },
      { id: 'max_items', label: 'Max Items' },
      { id: 'offers', label: 'Offers' },
      { id: 'decisions', label: 'Decisions' },
      { id: 'status', label: 'Status' }
    ];

    const tableRows = placements.map(p => {
      const actions = [
        { icon: OD_ICONS.edit, label: 'Edit', onclick: `navigateTo('placements','edit',${p.id})` },
        { divider: true },
        { icon: OD_ICONS.trash, label: 'Delete', onclick: `deletePlacement(${p.id})`, danger: true }
      ];
      return `<tr>
        <td data-column-id="name">${createTableLink(`<strong>${p.name}</strong>`, `navigateTo('placements','edit',${p.id})`)}<div class="table-subtext">${p.description || ''}</div></td>
        <td data-column-id="channel">${channelBadge(p.channel)}</td>
        <td data-column-id="content_type"><code style="font-size:12px">${p.content_type}</code></td>
        <td data-column-id="max_items" style="text-align:center">${p.max_items}</td>
        <td data-column-id="offers" style="text-align:center">${p.offer_count || 0}</td>
        <td data-column-id="decisions" style="text-align:center">${p.decision_count || 0}</td>
        <td data-column-id="status">${createStatusIndicator(p.status, p.status)}</td>
        <td>${createActionMenu(p.id + 1000, actions)}</td>
      </tr>`;
    }).join('');

    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${OD_ICONS.placement} Placements</h3>
          <button class="btn btn-primary" onclick="navigateTo('placements','create')">+ Create Placement</button>
        </div>
        ${createTableToolbar({
          resultCount: placements.length,
          totalCount: totalPlacements,
          showColumnSelector: true,
          columns,
          viewKey: 'placements',
          showSearch: true,
          searchPlaceholder: 'Search placements...',
          searchValue: odPlacementsFilters.search,
          onSearch: 'updateOdPlacementsFilter("search", this.value)',
          filterTags: plFilterTags,
          onClearTag: 'clearOdPlacementsFilterTag',
          filters: [
            { type: 'select', label: 'Channel', value: odPlacementsFilters.channel, onChange: 'updateOdPlacementsFilter("channel", this.value)',
              options: [{ value: 'all', label: 'All channels' }, { value: 'email', label: 'Email' }, { value: 'web', label: 'Web' }, { value: 'mobile', label: 'Mobile' }, { value: 'sms', label: 'SMS' }, { value: 'push', label: 'Push' }] },
            { type: 'select', label: 'Content Type', value: odPlacementsFilters.content_type, onChange: 'updateOdPlacementsFilter("content_type", this.value)',
              options: [{ value: 'all', label: 'All types' }, { value: 'html', label: 'HTML' }, { value: 'image', label: 'Image' }, { value: 'text', label: 'Text' }, { value: 'json', label: 'JSON' }] },
            { type: 'select', label: 'Status', value: odPlacementsFilters.status, onChange: 'updateOdPlacementsFilter("status", this.value)',
              options: [{ value: 'all', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] }
          ]
        })}
        <div class="data-table-container">
          <table class="data-table" data-view="placements">
            <thead><tr>
              ${createSortableHeader('name', 'Name', currentTableSort)}
              ${createSortableHeader('channel', 'Channel', currentTableSort)}
              ${createSortableHeader('content_type', 'Content Type', currentTableSort)}
              ${createSortableHeader('max_items', 'Max Items', currentTableSort)}
              <th data-column-id="offers">Offers</th>
              <th data-column-id="decisions">Decisions</th>
              ${createSortableHeader('status', 'Status', currentTableSort)}
              <th style="width:50px"></th>
            </tr></thead>
            <tbody>${tableRows || '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#6B7280">No placements found</td></tr>'}</tbody>
          </table>
        </div>
      </div>`;

    applyColumnVisibility('placements');
  } catch (e) {
    showError('Failed to load Placements');
  } finally {
    hideLoading();
  }
};

window.renderPlacementForm = async function(placement) {
  const isEdit = !!placement;
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="form-container">
      <form id="placement-form" onsubmit="handlePlacementSubmit(event)">
        <input type="hidden" id="pl-edit-id" value="${isEdit ? placement.id : ''}">
        <div class="form-section">
          <h3 class="form-section-title">Placement Details</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label form-label-required">Name</label>
              <input type="text" id="pl-name" class="form-input" value="${placement?.name || ''}" required placeholder="e.g., Email Hero Banner">
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Description</label>
              <input type="text" id="pl-desc" class="form-input" value="${placement?.description || ''}" placeholder="Where this placement appears in the user experience">
              <div class="form-help">Brief description of the placement context</div>
            </div>
            <div class="form-group">
              <label class="form-label form-label-required">Channel</label>
              <select id="pl-channel" class="form-input">
                <option value="email" ${placement?.channel === 'email' ? 'selected' : ''}>Email</option>
                <option value="web" ${placement?.channel === 'web' ? 'selected' : ''}>Web</option>
                <option value="mobile" ${placement?.channel === 'mobile' ? 'selected' : ''}>Mobile</option>
                <option value="sms" ${placement?.channel === 'sms' ? 'selected' : ''}>SMS</option>
                <option value="push" ${placement?.channel === 'push' ? 'selected' : ''}>Push</option>
                <option value="any" ${placement?.channel === 'any' ? 'selected' : ''}>Any</option>
              </select>
              <div class="form-help">The marketing channel this placement belongs to</div>
            </div>
            <div class="form-group">
              <label class="form-label form-label-required">Content Type</label>
              <select id="pl-ctype" class="form-input">
                <option value="html" ${placement?.content_type === 'html' ? 'selected' : ''}>HTML</option>
                <option value="image" ${placement?.content_type === 'image' ? 'selected' : ''}>Image</option>
                <option value="text" ${placement?.content_type === 'text' ? 'selected' : ''}>Text</option>
                <option value="json" ${placement?.content_type === 'json' ? 'selected' : ''}>JSON</option>
              </select>
              <div class="form-help">Format of creative content for this placement</div>
            </div>
            <div class="form-group">
              <label class="form-label">Max Items</label>
              <input type="number" id="pl-max" class="form-input" min="1" max="10" value="${placement?.max_items || 1}">
              <div class="form-help">Maximum number of offers shown in this placement</div>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="navigateTo('placements','list')">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? ICONS.save + ' Update' : ICONS.sparkles + ' Create'} Placement</button>
        </div>
      </form>
    </div>`;
};

window.handlePlacementSubmit = async function(event) {
  event.preventDefault();
  const editId = document.getElementById('pl-edit-id').value;
  const isEdit = !!editId;
  const data = {
    name: document.getElementById('pl-name').value,
    description: document.getElementById('pl-desc').value,
    channel: document.getElementById('pl-channel').value,
    content_type: document.getElementById('pl-ctype').value,
    max_items: parseInt(document.getElementById('pl-max').value) || 1
  };
  if (!data.name) { showToast('Name is required', 'error'); return; }
  const url = isEdit ? `/api/placements/${editId}` : '/api/placements';
  await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  showToast(isEdit ? 'Placement updated' : 'Placement created');
  navigateTo('placements', 'list');
};

window.deletePlacement = async function(id) {
  if (!confirm('Delete this placement?')) return;
  const res = await fetch(`/api/placements/${id}`, { method: 'DELETE' });
  if (!res.ok) { const err = await res.json(); showToast(err.error || 'Cannot delete', 'error'); return; }
  showToast('Placement deleted');
  window.loadPlacements();
};


// ══════════════════════════════════════════════════════
//  3. COLLECTIONS & QUALIFIERS VIEW
// ══════════════════════════════════════════════════════

window.loadOfferCollections = async function() {
  const content = document.getElementById('content');
  showLoading();
  try {
    const [colRes, qualRes] = await Promise.all([
      fetch('/api/collections').then(r => r.json()),
      fetch('/api/collections/qualifiers').then(r => r.json())
    ]);
    let collections = colRes.collections || [];
    const totalCollections = collections.length;
    const qualifiers = qualRes.qualifiers || [];

    // Apply filters
    if (odCollectionsFilters.type !== 'all') collections = collections.filter(c => c.type === odCollectionsFilters.type);
    if (odCollectionsFilters.status !== 'all') collections = collections.filter(c => (c.status || 'active') === odCollectionsFilters.status);
    if (odCollectionsFilters.search) {
      const s = odCollectionsFilters.search.toLowerCase();
      collections = collections.filter(c => (c.name || '').toLowerCase().includes(s) || (c.description || '').toLowerCase().includes(s));
    }
    collections = applySorting(collections, currentTableSort.column || 'name');

    const collFilterTags = [];
    if (odCollectionsFilters.type !== 'all') collFilterTags.push({ key: 'type', label: 'Type', value: odCollectionsFilters.type });
    if (odCollectionsFilters.status !== 'all') collFilterTags.push({ key: 'status', label: 'Status', value: odCollectionsFilters.status });
    if (odCollectionsFilters.search) collFilterTags.push({ key: 'search', label: 'Search', value: odCollectionsFilters.search });

    const columns = [
      { id: 'name', label: 'Name' },
      { id: 'type', label: 'Type' },
      { id: 'qualifiers', label: 'Qualifiers' },
      { id: 'offers', label: 'Offers' },
      { id: 'status', label: 'Status' }
    ];

    const tableRows = collections.map(c => {
      const actions = [
        { icon: OD_ICONS.edit, label: 'Edit', onclick: `showCollectionForm(${c.id})` },
        { divider: true },
        { icon: OD_ICONS.trash, label: 'Delete', onclick: `deleteCollection(${c.id})`, danger: true }
      ];
      return `<tr>
        <td data-column-id="name">${createTableLink(`<strong>${c.name}</strong>`, `showCollectionForm(${c.id})`)}<div class="table-subtext">${c.description || ''}</div></td>
        <td data-column-id="type">${c.type === 'static' ? '<span style="color:#2196F3;font-weight:600">Static</span>' : '<span style="color:#9C27B0;font-weight:600">Dynamic</span>'}</td>
        <td data-column-id="qualifiers">${(c.qualifiers || []).map(q => qualifierBadge(q)).join(' ') || '\u2014'}</td>
        <td data-column-id="offers" style="text-align:center;font-weight:600">${c.offer_count || 0}</td>
        <td data-column-id="status">${createStatusIndicator(c.status || 'active', c.status || 'active')}</td>
        <td>${createActionMenu(c.id + 2000, actions)}</td>
      </tr>`;
    }).join('');

    content.innerHTML = `
      <!-- Qualifiers section -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <h3 class="card-title">${OD_ICONS.tag} Collection Qualifiers (Tags)</h3>
          <button class="btn btn-sm btn-secondary" onclick="showQualifierForm()">+ Add Tag</button>
        </div>
        <div class="card-body">
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${qualifiers.length === 0 ? '<span style="color:#6B7280">No tags yet.</span>' :
              qualifiers.map(q => `<div style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid ${q.color};border-radius:20px;font-size:13px;background:${q.color}11">
                <span style="width:10px;height:10px;border-radius:50%;background:${q.color};display:inline-block"></span>
                <strong>${q.name}</strong> <span style="color:#888">(${q.offer_count || 0} offers)</span>
                <button style="border:none;background:none;cursor:pointer;color:#999;font-size:12px" onclick="showQualifierForm(${q.id})">${OD_ICONS.edit}</button>
                <button style="border:none;background:none;cursor:pointer;color:#f44336;font-size:12px" onclick="deleteQualifier(${q.id})">${OD_ICONS.trash}</button>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Collections section -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${OD_ICONS.collection} Collections</h3>
          <button class="btn btn-primary" onclick="showCollectionForm()">+ Create Collection</button>
        </div>
        ${createTableToolbar({
          resultCount: collections.length,
          totalCount: totalCollections,
          showColumnSelector: true,
          columns,
          viewKey: 'collections',
          showSearch: true,
          searchPlaceholder: 'Search collections...',
          searchValue: odCollectionsFilters.search,
          onSearch: 'updateOdCollectionsFilter("search", this.value)',
          filterTags: collFilterTags,
          onClearTag: 'clearOdCollectionsFilterTag',
          filters: [
            { type: 'select', label: 'Type', value: odCollectionsFilters.type, onChange: 'updateOdCollectionsFilter("type", this.value)',
              options: [{ value: 'all', label: 'All types' }, { value: 'dynamic', label: 'Dynamic' }, { value: 'static', label: 'Static' }] },
            { type: 'select', label: 'Status', value: odCollectionsFilters.status, onChange: 'updateOdCollectionsFilter("status", this.value)',
              options: [{ value: 'all', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] }
          ]
        })}
        <div class="data-table-container">
          <table class="data-table" data-view="collections">
            <thead><tr>
              ${createSortableHeader('name', 'Name', currentTableSort)}
              ${createSortableHeader('type', 'Type', currentTableSort)}
              <th data-column-id="qualifiers">Qualifiers</th>
              <th data-column-id="offers">Offers</th>
              ${createSortableHeader('status', 'Status', currentTableSort)}
              <th style="width:50px"></th>
            </tr></thead>
            <tbody>${tableRows || '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#6B7280">No collections found</td></tr>'}</tbody>
          </table>
        </div>
      </div>`;

    applyColumnVisibility('collections');
  } catch (e) {
    showError('Failed to load Collections');
  } finally {
    hideLoading();
  }
};

// ── Qualifier (Tag) full-page form ──

window.showQualifierForm = async function(editId) {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-inline"><div class="spinner"></div></div>';
  let qualifier = null;
  if (editId) qualifier = await fetch(`/api/collections/qualifiers/${editId}`).then(r => r.json());
  const isEdit = !!qualifier;
  document.getElementById('page-title').textContent = isEdit ? 'Edit Tag' : 'Create Tag';

  content.innerHTML = `
    <div class="form-container">
      <form id="qualifier-form" onsubmit="handleQualifierSubmit(event)">
        <input type="hidden" id="q-edit-id" value="${isEdit ? qualifier.id : ''}">
        <div class="form-section">
          <h3 class="form-section-title">Tag Details</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label form-label-required">Name</label>
              <input type="text" id="q-name" class="form-input" value="${qualifier?.name || ''}" required placeholder="e.g., Summer, Loyalty, Electronics">
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Description</label>
              <input type="text" id="q-desc" class="form-input" value="${qualifier?.description || ''}" placeholder="What category of offers does this tag represent?">
              <div class="form-help">Tags help organize offers into dynamic collections</div>
            </div>
            <div class="form-group">
              <label class="form-label">Color</label>
              <div style="display:flex;align-items:center;gap:12px">
                <input type="color" id="q-color" value="${qualifier?.color || '#6E6E6E'}" style="width:60px;height:40px;border:1px solid #e0e0e0;border-radius:6px;cursor:pointer;padding:2px">
                <span id="q-color-preview" style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:16px;font-size:13px;font-weight:500;color:#fff;background:${qualifier?.color || '#6E6E6E'}">${OD_ICONS.tag} ${qualifier?.name || 'Preview'}</span>
              </div>
              <div class="form-help">Used to visually distinguish this tag across the application</div>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="navigateTo('offer-collections','list')">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? ICONS.save + ' Update' : ICONS.sparkles + ' Create'} Tag</button>
        </div>
      </form>
    </div>`;

  // Live color preview
  document.getElementById('q-color').addEventListener('input', (e) => {
    const preview = document.getElementById('q-color-preview');
    preview.style.background = e.target.value;
    const nameVal = document.getElementById('q-name').value || 'Preview';
    preview.innerHTML = `${OD_ICONS.tag} ${nameVal}`;
  });
  document.getElementById('q-name').addEventListener('input', (e) => {
    const preview = document.getElementById('q-color-preview');
    preview.innerHTML = `${OD_ICONS.tag} ${e.target.value || 'Preview'}`;
  });
};

window.handleQualifierSubmit = async function(event) {
  event.preventDefault();
  const editId = document.getElementById('q-edit-id').value;
  const isEdit = !!editId;
  const data = { name: document.getElementById('q-name').value, description: document.getElementById('q-desc').value, color: document.getElementById('q-color').value };
  if (!data.name) { showToast('Name is required', 'error'); return; }
  const url = isEdit ? `/api/collections/qualifiers/${editId}` : '/api/collections/qualifiers';
  await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  showToast(isEdit ? 'Tag updated' : 'Tag created');
  navigateTo('offer-collections', 'list');
};

window.deleteQualifier = async function(id) {
  if (!confirm('Delete this tag?')) return;
  await fetch(`/api/collections/qualifiers/${id}`, { method: 'DELETE' });
  showToast('Tag deleted');
  window.loadOfferCollections();
};

// ── Collection full-page form ──

window.showCollectionForm = async function(editId) {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-inline"><div class="spinner"></div></div>';

  const [qualRes, offersRes] = await Promise.all([
    fetch('/api/collections/qualifiers').then(r => r.json()),
    fetch('/api/offers').then(r => r.json())
  ]);
  const qualifiers = qualRes.qualifiers || [];
  const offers = offersRes.offers || [];
  let collection = null;
  if (editId) collection = await fetch(`/api/collections/${editId}`).then(r => r.json());
  const isEdit = !!collection;
  document.getElementById('page-title').textContent = isEdit ? 'Edit Collection' : 'Create Collection';

  content.innerHTML = `
    <div class="form-container">
      <form id="collection-form" onsubmit="handleCollectionSubmit(event)">
        <input type="hidden" id="col-edit-id" value="${isEdit ? collection.id : ''}">
        <div class="form-section">
          <h3 class="form-section-title">Collection Details</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label form-label-required">Name</label>
              <input type="text" id="col-name" class="form-input" value="${collection?.name || ''}" required placeholder="e.g., Summer Sale Offers">
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Description</label>
              <input type="text" id="col-desc" class="form-input" value="${collection?.description || ''}" placeholder="What offers belong to this collection?">
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select id="col-type" class="form-input" onchange="toggleCollectionType()">
                <option value="dynamic" ${collection?.type === 'dynamic' || !collection ? 'selected' : ''}>Dynamic (auto by tags)</option>
                <option value="static" ${collection?.type === 'static' ? 'selected' : ''}>Static (hand-picked offers)</option>
              </select>
              <div class="form-help">Dynamic collections auto-include offers matching selected tags. Static collections use hand-picked offers.</div>
            </div>
          </div>
        </div>

        <!-- Dynamic: Filter by tags -->
        <div class="form-section" id="col-dynamic-config" style="${collection?.type === 'static' ? 'display:none' : ''}">
          <h3 class="form-section-title">Filter by Tags</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label">Select Tags</label>
              <div style="display:flex;flex-wrap:wrap;gap:8px;padding:4px 0">
                ${qualifiers.length === 0 ? '<span style="color:#999;font-size:13px">No tags defined yet.</span>' :
                  qualifiers.map(q => {
                    const checked = collection && (collection.qualifier_ids || []).includes(q.id);
                    return `<label style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border:2px solid ${q.color};border-radius:20px;font-size:13px;cursor:pointer;background:${checked ? q.color + '18' : '#fff'}">
                      <input type="checkbox" class="col-qual-cb" value="${q.id}" ${checked ? 'checked' : ''} style="accent-color:${q.color}">
                      <span style="color:${q.color};font-weight:500">${q.name}</span>
                    </label>`;
                  }).join('')}
              </div>
              <div class="form-help">Offers with any of these tags will be automatically included</div>
            </div>
          </div>
        </div>

        <!-- Static: Pick offers -->
        <div class="form-section" id="col-static-config" style="${collection?.type === 'static' ? '' : 'display:none'}">
          <h3 class="form-section-title">Select Offers</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label">Offers</label>
              <div style="max-height:300px;overflow-y:auto;border:1px solid #e0e0e0;border-radius:8px;padding:12px">
                ${offers.length === 0 ? '<span style="color:#999;font-size:13px">No offers available.</span>' :
                  offers.map(o => {
                    const checked = collection && (collection.offer_ids || []).includes(o.id);
                    return `<label style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f5f5f5;font-size:13px;cursor:pointer">
                      <input type="checkbox" class="col-offer-cb" value="${o.id}" ${checked ? 'checked' : ''}>
                      <span style="flex:1"><strong>${o.name}</strong></span>
                      ${typeBadge(o.type)} ${statusBadge(o.status)}
                      <span style="color:#888;font-size:12px">P${o.priority}</span>
                    </label>`;
                  }).join('')}
              </div>
              <div class="form-help">Hand-pick which offers belong to this collection</div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="navigateTo('offer-collections','list')">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? ICONS.save + ' Update' : ICONS.sparkles + ' Create'} Collection</button>
        </div>
      </form>
    </div>`;

  window.toggleCollectionType = () => {
    const isStatic = document.getElementById('col-type').value === 'static';
    document.getElementById('col-static-config').style.display = isStatic ? '' : 'none';
    document.getElementById('col-dynamic-config').style.display = isStatic ? 'none' : '';
  };
};

window.handleCollectionSubmit = async function(event) {
  event.preventDefault();
  const editId = document.getElementById('col-edit-id').value;
  const isEdit = !!editId;
  const type = document.getElementById('col-type').value;
  const data = {
    name: document.getElementById('col-name').value,
    description: document.getElementById('col-desc').value,
    type,
    offer_ids: type === 'static' ? [...document.querySelectorAll('.col-offer-cb:checked')].map(cb => parseInt(cb.value)) : [],
    qualifier_ids: type === 'dynamic' ? [...document.querySelectorAll('.col-qual-cb:checked')].map(cb => parseInt(cb.value)) : []
  };
  if (!data.name) { showToast('Name is required', 'error'); return; }
  const url = isEdit ? `/api/collections/${editId}` : '/api/collections';
  await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  showToast(isEdit ? 'Collection updated' : 'Collection created');
  navigateTo('offer-collections', 'list');
};

window.deleteCollection = async function(id) {
  if (!confirm('Delete this collection?')) return;
  await fetch(`/api/collections/${id}`, { method: 'DELETE' });
  showToast('Collection deleted');
  window.loadOfferCollections();
};


// ══════════════════════════════════════════════════════
//  4. DECISION RULES VIEW
// ══════════════════════════════════════════════════════

window.loadDecisionRules = async function() {
  const content = document.getElementById('content');
  showLoading();
  try {
    const res = await fetch('/api/decision-rules').then(r => r.json());
    let rules = res.rules || [];
    const totalRules = rules.length;

    if (odRulesFilters.status !== 'all') rules = rules.filter(r => (r.status || 'active') === odRulesFilters.status);
    if (odRulesFilters.logic !== 'all') rules = rules.filter(r => (r.logic || 'AND') === odRulesFilters.logic);
    if (odRulesFilters.search) {
      const s = odRulesFilters.search.toLowerCase();
      rules = rules.filter(r => (r.name || '').toLowerCase().includes(s) || (r.description || '').toLowerCase().includes(s));
    }
    rules = applySorting(rules, currentTableSort.column || 'name');

    const rulesFilterTags = [];
    if (odRulesFilters.status !== 'all') rulesFilterTags.push({ key: 'status', label: 'Status', value: odRulesFilters.status });
    if (odRulesFilters.logic !== 'all') rulesFilterTags.push({ key: 'logic', label: 'Logic', value: odRulesFilters.logic });
    if (odRulesFilters.search) rulesFilterTags.push({ key: 'search', label: 'Search', value: odRulesFilters.search });

    const columns = [
      { id: 'name', label: 'Name' },
      { id: 'conditions', label: 'Conditions' },
      { id: 'logic', label: 'Logic' },
      { id: 'usage', label: 'Used By' },
      { id: 'status', label: 'Status' }
    ];

    const tableRows = rules.map(r => {
      const actions = [
        { icon: OD_ICONS.edit, label: 'Edit', onclick: `showRuleForm(${r.id})` },
        { icon: OD_ICONS.eye, label: 'Preview', onclick: `previewRule(${r.id})` },
        { divider: true },
        { icon: OD_ICONS.trash, label: 'Delete', onclick: `deleteRule(${r.id})`, danger: true }
      ];
      return `<tr>
        <td data-column-id="name">${createTableLink(`<strong>${r.name}</strong>`, `showRuleForm(${r.id})`)}<div class="table-subtext">${r.description || ''}</div></td>
        <td data-column-id="conditions"><span style="font-size:12px">${(r.conditions || []).map(c => `<code>${c.entity}.${c.attribute} ${c.operator} ${JSON.stringify(c.value)}</code>`).join(r.logic === 'OR' ? ' <strong>OR</strong> ' : ' <strong>AND</strong> ')}</span></td>
        <td data-column-id="logic"><strong>${r.logic || 'AND'}</strong></td>
        <td data-column-id="usage" style="text-align:center">${r.usage_count || 0} items</td>
        <td data-column-id="status">${createStatusIndicator(r.status || 'active', r.status || 'active')}</td>
        <td>${createActionMenu(r.id + 3000, actions)}</td>
      </tr>`;
    }).join('');

    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${OD_ICONS.rule} Decision Rules</h3>
          <button class="btn btn-primary" onclick="showRuleForm()">+ Create Rule</button>
        </div>
        ${createTableToolbar({
          resultCount: rules.length,
          totalCount: totalRules,
          showColumnSelector: true,
          columns,
          viewKey: 'decisionRules',
          showSearch: true,
          searchPlaceholder: 'Search rules...',
          searchValue: odRulesFilters.search,
          onSearch: 'updateOdRulesFilter("search", this.value)',
          filterTags: rulesFilterTags,
          onClearTag: 'clearOdRulesFilterTag',
          filters: [
            { type: 'select', label: 'Status', value: odRulesFilters.status, onChange: 'updateOdRulesFilter("status", this.value)',
              options: [{ value: 'all', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
            { type: 'select', label: 'Logic', value: odRulesFilters.logic, onChange: 'updateOdRulesFilter("logic", this.value)',
              options: [{ value: 'all', label: 'All logic' }, { value: 'AND', label: 'AND' }, { value: 'OR', label: 'OR' }] }
          ]
        })}
        <div class="data-table-container">
          <table class="data-table" data-view="decisionRules">
            <thead><tr>
              ${createSortableHeader('name', 'Name', currentTableSort)}
              <th data-column-id="conditions">Conditions</th>
              ${createSortableHeader('logic', 'Logic', currentTableSort)}
              <th data-column-id="usage">Used By</th>
              ${createSortableHeader('status', 'Status', currentTableSort)}
              <th style="width:50px"></th>
            </tr></thead>
            <tbody>${tableRows || '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#6B7280">No rules found</td></tr>'}</tbody>
          </table>
        </div>
      </div>`;

    applyColumnVisibility('decisionRules');
  } catch (e) {
    showError('Failed to load Decision Rules');
  } finally {
    hideLoading();
  }
};

// ── Decision Rule full-page form ──

window.showRuleForm = async function(editId) {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-inline"><div class="spinner"></div></div>';

  let rule = null;
  if (editId) rule = await fetch(`/api/decision-rules/${editId}`).then(r => r.json());
  const isEdit = !!rule;
  document.getElementById('page-title').textContent = isEdit ? 'Edit Decision Rule' : 'Create Decision Rule';

  const conditions = rule ? (rule.conditions || []) : [{ entity: 'contact', attribute: '', operator: 'equals', value: '' }];
  const operators = ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'in', 'not_in', 'is_empty', 'is_not_empty', 'is_true', 'is_false'];
  const entities = ['contact', 'orders', 'events'];
  const contactAttrs = ['loyalty_tier', 'engagement_score', 'total_purchases', 'lifetime_value', 'email_opt_in', 'sms_opt_in', 'push_opt_in', 'favorite_categories', 'interests', 'price_sensitivity', 'city', 'state', 'country', 'gender', 'source', 'status'];

  function conditionRow(cond, idx) {
    return `<div class="rule-cond-row" style="display:grid;grid-template-columns:110px 1fr 1fr 1fr 40px;gap:8px;align-items:center;padding:12px;border:1px solid #e8e8e8;border-radius:8px;margin-bottom:8px;background:#fafafa">
      <select class="form-input rc-entity" data-idx="${idx}" style="font-size:12px">${entities.map(e => `<option value="${e}" ${cond.entity === e ? 'selected' : ''}>${e}</option>`).join('')}</select>
      <select class="form-input rc-attr" data-idx="${idx}" style="font-size:12px">${contactAttrs.map(a => `<option value="${a}" ${cond.attribute === a ? 'selected' : ''}>${a.replace(/_/g, ' ')}</option>`).join('')}</select>
      <select class="form-input rc-op" data-idx="${idx}" style="font-size:12px">${operators.map(o => `<option value="${o}" ${cond.operator === o ? 'selected' : ''}>${o.replace(/_/g, ' ')}</option>`).join('')}</select>
      <input type="text" class="form-input rc-val" data-idx="${idx}" value="${Array.isArray(cond.value) ? cond.value.join(', ') : (cond.value || '')}" style="font-size:12px" placeholder="Value">
      <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.rule-cond-row').remove()" style="padding:4px">${OD_ICONS.trash}</button>
    </div>`;
  }

  content.innerHTML = `
    <div class="form-container">
      <form id="rule-form" onsubmit="handleRuleSubmit(event)">
        <input type="hidden" id="rule-edit-id" value="${isEdit ? rule.id : ''}">
        <div class="form-section">
          <h3 class="form-section-title">Rule Details</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label form-label-required">Name</label>
              <input type="text" id="rule-name" class="form-input" value="${rule?.name || ''}" required placeholder="e.g., Gold Tier Loyalty Members">
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Description</label>
              <input type="text" id="rule-desc" class="form-input" value="${rule?.description || ''}" placeholder="Describe which contacts this rule targets">
              <div class="form-help">This description appears when selecting rules on offers</div>
            </div>
            <div class="form-group">
              <label class="form-label">Logic</label>
              <select id="rule-logic" class="form-input" style="width:160px">
                <option value="AND" ${rule?.logic === 'AND' || !rule ? 'selected' : ''}>AND (all must match)</option>
                <option value="OR" ${rule?.logic === 'OR' ? 'selected' : ''}>OR (any must match)</option>
              </select>
              <div class="form-help">How multiple conditions are combined</div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="form-section-title">Conditions</h3>
          <div class="form-help" style="margin-bottom:12px">Define the criteria contacts must meet. Each row is: Entity → Attribute → Operator → Value</div>
          <div id="rule-conditions">${conditions.map((c, i) => conditionRow(c, i)).join('')}</div>
          <button type="button" class="btn btn-sm btn-secondary" style="margin-top:8px" onclick="document.getElementById('rule-conditions').insertAdjacentHTML('beforeend', window._ruleCondRow())">+ Add Condition</button>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="navigateTo('decision-rules','list')">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? ICONS.save + ' Update' : ICONS.sparkles + ' Create'} Rule</button>
        </div>
      </form>
    </div>`;

  window._ruleCondRow = () => conditionRow({ entity: 'contact', attribute: 'loyalty_tier', operator: 'equals', value: '' }, Date.now());
};

window.handleRuleSubmit = async function(event) {
  event.preventDefault();
  const editId = document.getElementById('rule-edit-id').value;
  const isEdit = !!editId;
  const rows = document.querySelectorAll('.rule-cond-row');
  const conds = [...rows].map(row => ({
    entity: row.querySelector('.rc-entity').value,
    attribute: row.querySelector('.rc-attr').value,
    operator: row.querySelector('.rc-op').value,
    value: row.querySelector('.rc-val').value
  }));
  conds.forEach(c => {
    if ((c.operator === 'in' || c.operator === 'not_in') && typeof c.value === 'string') {
      c.value = c.value.split(',').map(s => s.trim());
    }
  });
  const data = {
    name: document.getElementById('rule-name').value,
    description: document.getElementById('rule-desc').value,
    logic: document.getElementById('rule-logic').value,
    conditions: conds
  };
  if (!data.name) { showToast('Name is required', 'error'); return; }
  const url = isEdit ? `/api/decision-rules/${editId}` : '/api/decision-rules';
  await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  showToast(isEdit ? 'Rule updated' : 'Rule created');
  navigateTo('decision-rules', 'list');
};

window.previewRule = async function(ruleId) {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-inline"><div class="spinner"></div></div>';
  document.getElementById('page-title').textContent = 'Rule Preview';

  const [ruleRes, res] = await Promise.all([
    fetch(`/api/decision-rules/${ruleId}`).then(r => r.json()),
    fetch('/api/decision-rules/preview', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rule_id: ruleId })
    }).then(r => r.json())
  ]);

  content.innerHTML = `
    <div style="margin-bottom:12px">
      <button class="btn btn-secondary btn-sm" onclick="navigateTo('decision-rules','list')" style="display:inline-flex;align-items:center;gap:4px">
        ${BACK_SVG} Back to Decision Rules
      </button>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <h3 class="card-title">${OD_ICONS.rule} ${ruleRes.name}</h3>
        <div class="card-subtitle">${ruleRes.description || ''}</div>
      </div>
      <div class="card-body">
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px">
          ${metricCard('Matching Contacts', res.matching_contacts || 0, `of ${res.total_contacts || 0} total`)}
          ${metricCard('Match Rate', (res.match_percentage || '0') + '%', '', '#4CAF50')}
        </div>
        ${(res.sample_matches || []).length > 0 ? `
        <h4 style="margin:0 0 12px;font-size:14px">Sample Matches</h4>
        <table class="data-table" style="width:100%">
          <thead><tr><th>Name</th><th>Email</th></tr></thead>
          <tbody>${(res.sample_matches || []).map(s => `<tr>
            <td><strong>${s.name || 'Unknown'}</strong></td>
            <td>${s.email || '—'}</td>
          </tr>`).join('')}</tbody>
        </table>` : '<p style="color:#999">No matching contacts found.</p>'}
      </div>
    </div>`;
};

window.deleteRule = async function(id) {
  if (!confirm('Delete this rule?')) return;
  const res = await fetch(`/api/decision-rules/${id}`, { method: 'DELETE' });
  if (!res.ok) { const err = await res.json(); showToast(err.error || 'Cannot delete', 'error'); return; }
  showToast('Rule deleted');
  window.loadDecisionRules();
};


// ══════════════════════════════════════════════════════
//  4b. SELECTION STRATEGIES VIEW
// ══════════════════════════════════════════════════════

window.loadStrategies = async function() {
  const content = document.getElementById('content');
  showLoading();
  try {
    const stRes = await fetch('/api/decisions/strategies').then(r => r.json());
    let strategies = stRes.strategies || [];
    const totalStrategies = strategies.length;

    if (odStrategiesFilters.ranking !== 'all') strategies = strategies.filter(st => (st.ranking_method || 'priority') === odStrategiesFilters.ranking);
    if (odStrategiesFilters.status !== 'all') strategies = strategies.filter(st => (st.status || 'active') === odStrategiesFilters.status);
    if (odStrategiesFilters.search) {
      const s = odStrategiesFilters.search.toLowerCase();
      strategies = strategies.filter(st => (st.name || '').toLowerCase().includes(s) || (st.description || '').toLowerCase().includes(s));
    }
    strategies = applySorting(strategies, currentTableSort.column || 'name');

    const stratFilterTags = [];
    if (odStrategiesFilters.ranking !== 'all') stratFilterTags.push({ key: 'ranking', label: 'Ranking', value: odStrategiesFilters.ranking });
    if (odStrategiesFilters.status !== 'all') stratFilterTags.push({ key: 'status', label: 'Status', value: odStrategiesFilters.status });
    if (odStrategiesFilters.search) stratFilterTags.push({ key: 'search', label: 'Search', value: odStrategiesFilters.search });

    const columns = [
      { id: 'name', label: 'Name' },
      { id: 'collection', label: 'Collection' },
      { id: 'ranking', label: 'Ranking' },
      { id: 'rule', label: 'Eligibility Rule' },
      { id: 'status', label: 'Status' }
    ];

    const tableRows = strategies.map(s => {
      const actions = [
        { icon: OD_ICONS.edit, label: 'Edit', onclick: `navigateTo('strategies','edit',${s.id})` },
        { divider: true },
        { icon: OD_ICONS.trash, label: 'Delete', onclick: `deleteStrategy(${s.id})`, danger: true }
      ];
      return `<tr>
        <td data-column-id="name">${createTableLink(`<strong>${s.name}</strong>`, `navigateTo('strategies','edit',${s.id})`)}<div class="table-subtext">${s.description || ''}</div></td>
        <td data-column-id="collection">${s.collection ? s.collection.name : '<span style="color:#6B7280">\u2014</span>'}</td>
        <td data-column-id="ranking"><span class="badge" style="background:#e3f2fd;color:#1565c0">${s.ranking_method || 'priority'}</span></td>
        <td data-column-id="rule">${s.eligibility_rule ? s.eligibility_rule.name : '<span style="color:#6B7280">None</span>'}</td>
        <td data-column-id="status">${createStatusIndicator(s.status || 'active', s.status || 'active')}</td>
        <td>${createActionMenu(s.id + 4000, actions)}</td>
      </tr>`;
    }).join('');

    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${OD_ICONS.strategy} Selection Strategies</h3>
          <button class="btn btn-primary" onclick="navigateTo('strategies','create')">+ Create Strategy</button>
        </div>
        ${createTableToolbar({
          resultCount: strategies.length,
          totalCount: totalStrategies,
          showColumnSelector: true,
          columns,
          viewKey: 'strategies',
          showSearch: true,
          searchPlaceholder: 'Search strategies...',
          searchValue: odStrategiesFilters.search,
          onSearch: 'updateOdStrategiesFilter("search", this.value)',
          filterTags: stratFilterTags,
          onClearTag: 'clearOdStrategiesFilterTag',
          filters: [
            { type: 'select', label: 'Ranking', value: odStrategiesFilters.ranking, onChange: 'updateOdStrategiesFilter("ranking", this.value)',
              options: [{ value: 'all', label: 'All methods' }, { value: 'priority', label: 'Priority' }, { value: 'formula', label: 'Formula' }, { value: 'ai_ranking', label: 'AI Ranking' }] },
            { type: 'select', label: 'Status', value: odStrategiesFilters.status, onChange: 'updateOdStrategiesFilter("status", this.value)',
              options: [{ value: 'all', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] }
          ]
        })}
        <div class="data-table-container">
          <table class="data-table" data-view="strategies">
            <thead><tr>
              ${createSortableHeader('name', 'Name', currentTableSort)}
              ${createSortableHeader('collection', 'Collection', currentTableSort)}
              ${createSortableHeader('ranking', 'Ranking', currentTableSort)}
              <th data-column-id="rule">Eligibility Rule</th>
              ${createSortableHeader('status', 'Status', currentTableSort)}
              <th style="width:50px"></th>
            </tr></thead>
            <tbody>${tableRows || '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#6B7280">No strategies found</td></tr>'}</tbody>
          </table>
        </div>
      </div>`;

    applyColumnVisibility('strategies');
  } catch (e) {
    showError('Failed to load Strategies');
  } finally {
    hideLoading();
  }
};

window.renderStrategyForm = async function(strategy) {
  const isEdit = !!strategy;
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-inline"><div class="spinner"></div></div>';

  const [colRes, ruleRes, fRes] = await Promise.all([
    fetch('/api/collections').then(r => r.json()),
    fetch('/api/decision-rules').then(r => r.json()),
    fetch('/api/decisions/ranking-formulas').then(r => r.json())
  ]);
  const collections = colRes.collections || [];
  const rules = ruleRes.rules || [];
  const formulas = fRes.formulas || [];

  if (isEdit && typeof strategy === 'object' && !strategy.collection_id) {
    const full = await fetch(`/api/decisions/strategies/${strategy.id}`).then(r => r.json());
    strategy = { ...strategy, ...full };
  }

  const rankingMethod = strategy?.ranking_method || 'priority';

  content.innerHTML = `
    <div class="form-container">
      <form id="strategy-form" onsubmit="handleStrategySubmit(event)">
        <input type="hidden" id="strat-edit-id" value="${isEdit ? strategy.id : ''}">
        <div class="form-section">
          <h3 class="form-section-title">Strategy Details</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label form-label-required">Name</label>
              <input type="text" id="strat-name" class="form-input" value="${strategy?.name || ''}" required placeholder="e.g., Summer Sale Priority Strategy">
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Description</label>
              <textarea id="strat-desc" class="form-input" rows="2" placeholder="Describe how this strategy selects offers">${strategy?.description || ''}</textarea>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="form-section-title">Offer Source</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label">Collection</label>
              <select id="strat-collection" class="form-input">
                <option value="">— No collection (all eligible offers) —</option>
                ${collections.map(c => `<option value="${c.id}" ${strategy?.collection_id == c.id ? 'selected' : ''}>${c.name} (${c.type || 'static'})</option>`).join('')}
              </select>
              <div class="form-help">Select which collection of offers this strategy draws from</div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="form-section-title">Ranking</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Ranking Method</label>
              <select id="strat-ranking" class="form-input" onchange="document.getElementById('strat-formula-group').style.display = this.value === 'formula' ? '' : 'none'">
                <option value="priority" ${rankingMethod === 'priority' ? 'selected' : ''}>Priority (highest priority wins)</option>
                <option value="formula" ${rankingMethod === 'formula' ? 'selected' : ''}>Custom Formula</option>
                <option value="ai_model" ${rankingMethod === 'ai_model' ? 'selected' : ''}>AI Model</option>
              </select>
              <div class="form-help">How offers are ranked when multiple qualify</div>
            </div>
            <div class="form-group" id="strat-formula-group" style="${rankingMethod === 'formula' ? '' : 'display:none'}">
              <label class="form-label">Ranking Formula</label>
              <select id="strat-formula" class="form-input">
                <option value="">— None —</option>
                ${formulas.map(f => `<option value="${f.id}" ${strategy?.ranking_formula_id == f.id ? 'selected' : ''}>${f.name}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="form-section-title">Eligibility</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label">Eligibility Rule</label>
              <select id="strat-rule" class="form-input">
                <option value="">— No additional eligibility rule —</option>
                ${rules.map(r => `<option value="${r.id}" ${strategy?.eligibility_rule_id == r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
              </select>
              <div class="form-help">Optional rule to further filter which offers can be selected</div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="navigateTo('strategies','list')">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? ICONS.save + ' Update' : ICONS.sparkles + ' Create'} Strategy</button>
        </div>
      </form>
    </div>`;
};

window.handleStrategySubmit = async function(event) {
  event.preventDefault();
  const editId = document.getElementById('strat-edit-id').value;
  const data = {
    name: document.getElementById('strat-name').value,
    description: document.getElementById('strat-desc').value,
    collection_id: document.getElementById('strat-collection').value || null,
    ranking_method: document.getElementById('strat-ranking').value,
    ranking_formula_id: document.getElementById('strat-formula').value || null,
    eligibility_rule_id: document.getElementById('strat-rule').value || null
  };

  try {
    const url = editId ? `/api/decisions/strategies/${editId}` : '/api/decisions/strategies';
    const method = editId ? 'PUT' : 'POST';
    const resp = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!resp.ok) throw new Error((await resp.json()).error || 'Failed to save strategy');
    showToast(editId ? 'Strategy updated' : 'Strategy created');
    navigateTo('strategies', 'list');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
};

window.deleteStrategy = async function(id) {
  if (!confirm('Delete this strategy?')) return;
  await fetch(`/api/decisions/strategies/${id}`, { method: 'DELETE' });
  showToast('Strategy deleted');
  window.loadStrategies();
};


// ══════════════════════════════════════════════════════
//  5. DECISIONS VIEW
// ══════════════════════════════════════════════════════

window.loadDecisions = async function() {
  const content = document.getElementById('content');
  showLoading();
  try {
    const res = await fetch('/api/decisions').then(r => r.json());
    let decisions = res.decisions || [];
    const totalCount = decisions.length;

    // Apply filters
    if (odDecisionsFilters.status !== 'all') decisions = decisions.filter(d => d.status === odDecisionsFilters.status);
    if (odDecisionsFilters.search) {
      const s = odDecisionsFilters.search.toLowerCase();
      decisions = decisions.filter(d => (d.name || '').toLowerCase().includes(s) || (d.description || '').toLowerCase().includes(s));
    }
    decisions = applySorting(decisions, currentTableSort.column || 'updated_at');

    const filterTags = [];
    if (odDecisionsFilters.status !== 'all') filterTags.push({ key: 'status', label: 'Status', value: odDecisionsFilters.status });
    if (odDecisionsFilters.search) filterTags.push({ key: 'search', label: 'Search', value: odDecisionsFilters.search });

    const columns = [
      { id: 'name', label: 'Name' },
      { id: 'status', label: 'Status' },
      { id: 'placements', label: 'Placements' },
      { id: 'propositions', label: 'Propositions' },
      { id: 'created_at', label: 'Created' }
    ];

    const tableRows = decisions.map(d => {
      const actions = [
        { icon: OD_ICONS.eye, label: 'View Details', onclick: `showDecisionDetail(${d.id})` },
        { icon: OD_ICONS.edit, label: 'Edit', onclick: `navigateTo('decisions','edit',${d.id})` },
        { icon: OD_ICONS.play, label: 'Simulate', onclick: `showSimulatePage(${d.id})` },
        { divider: true },
        ...(d.status === 'draft' ? [{ icon: OD_ICONS.play, label: 'Activate', onclick: `decisionAction(${d.id},'activate')` }] : []),
        ...(d.status === 'live' ? [{ icon: OD_ICONS.chart, label: 'Deactivate', onclick: `decisionAction(${d.id},'deactivate')` }] : []),
        { divider: true },
        { icon: OD_ICONS.trash, label: 'Delete', onclick: `deleteDecision(${d.id})`, danger: true }
      ];
      return `<tr>
        <td data-column-id="name">${createTableLink(`<strong>${d.name}</strong>`, `showDecisionDetail(${d.id})`)}<div class="table-subtext">${d.description || ''}</div></td>
        <td data-column-id="status">${createStatusIndicator(d.status, d.status)}</td>
        <td data-column-id="placements" style="text-align:center;font-weight:600">${d.placement_count || 0}</td>
        <td data-column-id="propositions" style="text-align:center">${d.proposition_count || 0}</td>
        <td data-column-id="created_at" style="font-size:12px">${d.created_at ? new Date(d.created_at).toLocaleDateString() : '\u2014'}</td>
        <td>${createActionMenu(d.id + 5000, actions)}</td>
      </tr>`;
    }).join('');

    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${OD_ICONS.decision} Decisions</h3>
          <button class="btn btn-primary" onclick="navigateTo('decisions','create')">+ Create Decision</button>
        </div>
        ${createTableToolbar({
          resultCount: decisions.length,
          totalCount,
          showColumnSelector: true,
          columns,
          viewKey: 'decisions',
          showSearch: true,
          searchPlaceholder: 'Search decisions...',
          searchValue: odDecisionsFilters.search,
          onSearch: 'updateOdDecisionsFilter("search", this.value)',
          filterTags,
          onClearTag: 'clearOdDecisionsFilterTag',
          filters: [
            { type: 'select', label: 'Status', value: odDecisionsFilters.status, onChange: 'updateOdDecisionsFilter("status", this.value)',
              options: [{ value: 'all', label: 'All statuses' }, { value: 'draft', label: 'Draft' }, { value: 'live', label: 'Live' }, { value: 'archived', label: 'Archived' }] }
          ]
        })}
        <div class="data-table-container">
          <table class="data-table" data-view="decisions">
            <thead><tr>
              ${createSortableHeader('name', 'Name', currentTableSort)}
              ${createSortableHeader('status', 'Status', currentTableSort)}
              <th data-column-id="placements">Placements</th>
              <th data-column-id="propositions">Propositions</th>
              ${createSortableHeader('created_at', 'Created', currentTableSort)}
              <th style="width:50px"></th>
            </tr></thead>
            <tbody>${tableRows || '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#6B7280">No decisions found</td></tr>'}</tbody>
          </table>
        </div>
      </div>`;

    applyColumnVisibility('decisions');
  } catch (e) {
    showError('Failed to load Decisions');
  } finally {
    hideLoading();
  }
};

window.showDecisionDetail = async function(id) {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-inline"><div class="spinner"></div></div>';

  const [decision, report] = await Promise.all([
    fetch(`/api/decisions/${id}`).then(r => r.json()),
    fetch(`/api/decisions/${id}/report`).then(r => r.json())
  ]);

  content.innerHTML = `
    <div style="margin-bottom:12px">
      <button class="btn btn-secondary btn-sm" onclick="navigateTo('decisions','list')" style="display:inline-flex;align-items:center;gap:4px">
        ${BACK_SVG} Back to Decisions
      </button>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <h3 class="card-title">${decision.name}</h3>
          <div class="card-subtitle">${decision.description || ''}</div>
          <div style="margin-top:8px">${statusBadge(decision.status)}</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary btn-sm" onclick="showSimulatePage(${id})">${OD_ICONS.play} Simulate</button>
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('decisions','edit',${id})">Edit</button>
        </div>
      </div>
      <div class="card-body">
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px">
          ${metricCard('Total Propositions', report.total_propositions || 0, `${report.unique_contacts || 0} unique contacts`)}
          ${metricCard('Fallback Rate', (report.fallback_rate || '0.0') + '%', `${report.fallback_count || 0} fallbacks`, '#FF9800')}
          ${metricCard('Click Rate', (report.click_rate || '0.00') + '%', `${report.clicks || 0} clicks`, '#2196F3')}
          ${metricCard('Conversion Rate', (report.conversion_rate || '0.00') + '%', `${report.conversions || 0} conversions`, '#4CAF50')}
        </div>

        <h4 style="margin:0 0 12px;font-size:14px">Placement Configuration</h4>
        <div style="display:grid;gap:12px">
          ${(decision.placement_configs || []).map(pc => `
            <div style="border:1px solid #e0e0e0;border-radius:8px;padding:16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
              <div>
                <div style="font-size:11px;color:#888;margin-bottom:4px">Placement</div>
                <strong>${pc.placement ? pc.placement.name : 'Unknown'}</strong>
                ${pc.placement ? channelBadge(pc.placement.channel) : ''}
              </div>
              <div>
                <div style="font-size:11px;color:#888;margin-bottom:4px">Strategy</div>
                <strong>${pc.selection_strategy ? pc.selection_strategy.name : 'None'}</strong>
              </div>
              <div>
                <div style="font-size:11px;color:#888;margin-bottom:4px">Fallback</div>
                <strong>${pc.fallback_offer ? pc.fallback_offer.name : 'None'}</strong>
              </div>
            </div>
          `).join('')}
        </div>

        ${Object.keys(report.offer_distribution || {}).length > 0 ? `
        <h4 style="margin:20px 0 12px;font-size:14px">Offer Distribution</h4>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${Object.entries(report.offer_distribution).map(([name, data]) => `
            <div style="border:1px solid #e0e0e0;border-radius:8px;padding:12px;min-width:180px">
              <div style="font-weight:600;font-size:13px">${name}</div>
              <div style="font-size:24px;font-weight:700;color:#1976D2">${data.proposed}</div>
              <div style="font-size:11px;color:#999">${data.is_fallback} fallback</div>
            </div>
          `).join('')}
        </div>` : ''}
      </div>
    </div>`;
};

// ── Decision full-page form ──

window.renderDecisionForm = async function(decision) {
  const isEdit = !!decision;
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-inline"><div class="spinner"></div></div>';

  const [plRes, stRes, fbRes] = await Promise.all([
    fetch('/api/placements').then(r => r.json()),
    fetch('/api/decisions/strategies').then(r => r.json()),
    fetch('/api/offers?type=fallback').then(r => r.json())
  ]);
  const placements = plRes.placements || [];
  const strategies = stRes.strategies || [];
  const fallbacks = fbRes.offers || [];

  if (isEdit) {
    const full = await fetch(`/api/decisions/${decision.id}`).then(r => r.json());
    decision = { ...decision, ...full };
  }

  const configs = decision ? (decision.placement_configs || []) : [{ placement_id: '', selection_strategy_id: '', fallback_offer_id: '' }];

  // Helper to build a slot row
  function slotRow(pc, idx) {
    return `<div class="dec-slot" style="border:1px solid #e0e0e0;border-radius:8px;padding:16px;margin-bottom:8px;position:relative;background:#fafafa">
      <button type="button" style="position:absolute;top:8px;right:8px;border:none;background:none;cursor:pointer;color:#f44336" onclick="this.closest('.dec-slot').remove()">${OD_ICONS.trash}</button>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
        <div>
          <label class="form-label">Placement</label>
          <select class="form-input ds-pl">${placements.map(p => `<option value="${p.id}" ${pc.placement_id == p.id ? 'selected' : ''}>${p.name} (${p.channel})</option>`).join('')}</select>
        </div>
        <div>
          <label class="form-label">Selection Strategy</label>
          <select class="form-input ds-st"><option value="">None</option>${strategies.map(s => `<option value="${s.id}" ${pc.selection_strategy_id == s.id ? 'selected' : ''}>${s.name}</option>`).join('')}</select>
          ${strategies.length === 0 ? '<div class="form-help"><a href="#" onclick="event.preventDefault();navigateTo(\'strategies\',\'create\')" style="color:#1976D2">+ Create a strategy first</a></div>' : ''}
        </div>
        <div>
          <label class="form-label">Fallback Offer</label>
          <select class="form-input ds-fb"><option value="">None</option>${fallbacks.map(f => `<option value="${f.id}" ${pc.fallback_offer_id == f.id ? 'selected' : ''}>${f.name}</option>`).join('')}</select>
        </div>
      </div>
    </div>`;
  }

  content.innerHTML = `
    <div class="form-container">
      <form id="decision-form" onsubmit="handleDecisionSubmit(event)">
        <input type="hidden" id="dec-edit-id" value="${isEdit ? decision.id : ''}">
        <div class="form-section">
          <h3 class="form-section-title">Decision Details</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label form-label-required">Name</label>
              <input type="text" id="dec-name" class="form-input" value="${decision?.name || ''}" required placeholder="e.g., Homepage Hero Decision">
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Description</label>
              <textarea id="dec-desc" class="form-input" rows="2" placeholder="Describe the purpose of this decision policy">${decision?.description || ''}</textarea>
              <div class="form-help">A decision policy combines placements, selection strategies, and fallback offers</div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="form-section-title">Placement Slots</h3>
          <div class="form-help" style="margin-bottom:12px">Configure which placement gets which strategy and fallback. Each slot defines one offer location.</div>
          <div id="dec-slots">${configs.map((pc, i) => slotRow(pc, i)).join('')}</div>
          <button type="button" class="btn btn-sm btn-secondary" style="margin-top:8px" onclick="document.getElementById('dec-slots').insertAdjacentHTML('beforeend', window._decSlotRow())">+ Add Placement Slot</button>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="navigateTo('decisions','list')">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? ICONS.save + ' Update' : ICONS.sparkles + ' Create'} Decision</button>
        </div>
      </form>
    </div>`;

  window._decSlotRow = () => slotRow({ placement_id: '', selection_strategy_id: '', fallback_offer_id: '' }, Date.now());
};

window.handleDecisionSubmit = async function(event) {
  event.preventDefault();
  const editId = document.getElementById('dec-edit-id').value;
  const isEdit = !!editId;
  const slots = [...document.querySelectorAll('.dec-slot')].map(slot => ({
    placement_id: slot.querySelector('.ds-pl').value,
    selection_strategy_id: slot.querySelector('.ds-st').value || null,
    fallback_offer_id: slot.querySelector('.ds-fb').value || null
  }));
  const data = {
    name: document.getElementById('dec-name').value,
    description: document.getElementById('dec-desc').value,
    placement_configs: slots
  };
  if (!data.name) { showToast('Name is required', 'error'); return; }
  const url = isEdit ? `/api/decisions/${editId}` : '/api/decisions';
  await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  showToast(isEdit ? 'Decision updated' : 'Decision created');
  navigateTo('decisions', 'list');
};

// ── Simulation full-page view ──

window.showSimulatePage = async function(decisionId) {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-inline"><div class="spinner"></div></div>';
  document.getElementById('page-title').textContent = 'Simulation Results';

  const simRes = await fetch(`/api/decisions/${decisionId}/simulate-batch`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sample_size: 20 })
  }).then(r => r.json());

  const results = simRes.results || [];
  const summary = simRes.summary || {};

  content.innerHTML = `
    <div style="margin-bottom:12px">
      <button class="btn btn-secondary btn-sm" onclick="showDecisionDetail(${decisionId})" style="display:inline-flex;align-items:center;gap:4px">
        ${BACK_SVG} Back to Decision
      </button>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <h3 class="card-title">${OD_ICONS.play} Simulation Overview</h3>
        <div class="card-subtitle">Testing decision policy against ${simRes.contacts_tested || 0} contacts</div>
      </div>
      <div class="card-body">
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px">
          ${metricCard('Contacts Tested', simRes.contacts_tested || 0, '')}
          ${metricCard('Fallback Rate', (summary.fallback_rate || '0.0') + '%', 'Lower is better', '#FF9800')}
        </div>

        ${Object.keys(summary.offer_distribution || {}).length > 0 ? `
        <h4 style="margin:0 0 12px;font-size:14px">Offer Distribution</h4>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px">
          ${Object.entries(summary.offer_distribution).map(([name, count]) =>
            `<div style="padding:8px 16px;border-radius:20px;font-size:13px;background:#E3F2FD;color:#1565C0;font-weight:600">${name}: ${count}</div>`
          ).join('')}
        </div>` : ''}
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Per-Contact Results</h3>
      </div>
      <div class="card-body" style="padding:0">
        <table class="data-table" style="width:100%">
          <thead><tr><th>Contact</th><th>Placement</th><th>Offer</th><th>Fallback?</th></tr></thead>
          <tbody>${results.map(r => {
            if (r.error) return `<tr><td>${r.contact_id}</td><td colspan="3" style="color:red">${r.error}</td></tr>`;
            return (r.placements || []).map(p => `<tr>
              <td><strong>${r.contact_name}</strong></td>
              <td>${p.placement}</td>
              <td><strong>${p.offer}</strong></td>
              <td>${p.fallback_used ? '<span style="color:#FF9800;font-weight:600">Yes</span>' : '<span style="color:#4CAF50">No</span>'}</td>
            </tr>`).join('');
          }).join('')}</tbody>
        </table>
      </div>
    </div>`;
};

window.decisionAction = async function(id, action) {
  await fetch(`/api/decisions/${id}/${action}`, { method: 'POST' });
  showToast(`Decision ${action}d`);
  window.loadDecisions();
};

window.deleteDecision = async function(id) {
  if (!confirm('Delete this decision?')) return;
  await fetch(`/api/decisions/${id}`, { method: 'DELETE' });
  showToast('Decision deleted');
  window.loadDecisions();
};


// ══════════════════════════════════════════════════════
//  6. OFFER ANALYTICS VIEW
// ══════════════════════════════════════════════════════

window.loadOfferAnalytics = async function() {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-inline"><div class="spinner"></div></div>';

  const data = await fetch('/api/decisions/analytics/overview').then(r => r.json());
  const s = data.summary || {};
  const topOffers = data.top_offers || [];

  content.innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <h3 class="card-title">${OD_ICONS.chart} Offer Decisioning Overview</h3>
        <div class="card-subtitle">Performance metrics across all offers and decisions</div>
      </div>
      <div class="card-body">
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px">
          ${metricCard('Total Offers', s.total_offers || 0, `${s.live_offers || 0} live`)}
          ${metricCard('Decisions', s.total_decisions || 0, `${s.live_decisions || 0} live`, '#9C27B0')}
          ${metricCard('Placements', s.total_placements || 0, '')}
          ${metricCard('Collections', s.total_collections || 0, '')}
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px">
          ${metricCard('Propositions', s.total_propositions || 0, `${s.unique_contacts_reached || 0} unique contacts`)}
          ${metricCard('Impressions', s.total_impressions || 0, '')}
          ${metricCard('Click Rate', (s.click_rate || '0.00') + '%', `${s.total_clicks || 0} clicks`, '#FF9800')}
          ${metricCard('Conversion Rate', (s.conversion_rate || '0.00') + '%', `${s.total_conversions || 0} conversions`, '#4CAF50')}
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          ${metricCard('Fallback Rate', (s.fallback_rate || '0.0') + '%', 'Lower is better', '#F44336')}
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <!-- Offers by Status -->
      <div class="card">
        <div class="card-header"><h3 class="card-title">Offers by Status</h3></div>
        <div class="card-body">
          ${Object.entries(data.offers_by_status || {}).map(([status, count]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0">
              ${statusBadge(status)}
              <strong style="font-size:18px">${count}</strong>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Top Offers -->
      <div class="card">
        <div class="card-header"><h3 class="card-title">Top Offers by Propositions</h3></div>
        <div class="card-body" style="padding:0">
          ${topOffers.length === 0 ? '<div style="padding:24px;text-align:center;color:#999">No data yet</div>' : `
          <table class="data-table" style="width:100%">
            <thead><tr><th>Offer</th><th style="text-align:right">Propositions</th></tr></thead>
            <tbody>${topOffers.map((o, i) => `<tr>
              <td><strong style="color:#1976D2">#${i + 1}</strong> ${o.name}</td>
              <td style="text-align:right;font-weight:600">${o.propositions}</td>
            </tr>`).join('')}</tbody>
          </table>`}
        </div>
      </div>
    </div>

    <!-- Offers by Type -->
    <div class="card" style="margin-top:16px">
      <div class="card-header"><h3 class="card-title">Offers by Type</h3></div>
      <div class="card-body" style="display:flex;gap:24px">
        <div style="text-align:center;flex:1">
          <div style="font-size:36px;font-weight:700;color:#1976D2">${(data.offers_by_type || {}).personalized || 0}</div>
          <div style="font-size:13px;color:#666">Personalized Offers</div>
        </div>
        <div style="text-align:center;flex:1">
          <div style="font-size:36px;font-weight:700;color:#FF9800">${(data.offers_by_type || {}).fallback || 0}</div>
          <div style="font-size:13px;color:#666">Fallback Offers</div>
        </div>
      </div>
    </div>
  `;
};
