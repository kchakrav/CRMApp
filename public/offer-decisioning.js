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
// Folder toggle for offers
window._folderToggle_offers = function() {
  if (typeof toggleListFolderSidebar === 'function') toggleListFolderSidebar('offers', 'offers', window.loadOffers);
};

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
    if (typeof ensureAllFoldersLoaded === 'function') await ensureAllFoldersLoaded();
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

    // Apply folder filter
    if (typeof applyFolderFilter === 'function') {
      offers = applyFolderFilter('offers', offers);
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
      { id: 'dates', label: 'Date Range' },
      { id: 'folder', label: 'Folder', visible: false }
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
        <td data-column-id="folder">${typeof folderCellHtml === 'function' ? folderCellHtml(o.folder_id) : ''}</td>
        <td>${createActionMenu(o.id, actions)}</td>
      </tr>`;
    }).join('');

    let offersHtml = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${OD_ICONS.offer} Offer Library</h3>
          <div style="display:flex;gap:8px;align-items:center">
            ${typeof getFolderToggleButtonHtml === 'function' ? getFolderToggleButtonHtml('offers') : ''}
            <button class="btn btn-primary" onclick="navigateTo('offers','create')">+ Create Offer</button>
          </div>
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
              <th data-column-id="folder">Folder</th>
              <th style="width:50px"></th>
            </tr></thead>
            <tbody>${tableRows || '<tr><td colspan="10" style="text-align:center;padding:2rem;color:#6B7280">No offers found</td></tr>'}</tbody>
          </table>
        </div>
      </div>`;

    // Wrap with folder sidebar if enabled
    if (typeof wrapWithFolderSidebarHtml === 'function') {
      offersHtml = wrapWithFolderSidebarHtml('offers', 'offers', offersHtml);
    }
    content.innerHTML = offersHtml;
    applyColumnVisibility('offers');
    // Initialize folder tree for offers
    if (typeof initListFolderTree === 'function') {
      initListFolderTree('offers', 'offers', window.loadOffers);
    }
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
  const [qualRes, rulesRes, schemaRes, segRes] = await Promise.all([
    fetch('/api/collections/qualifiers').then(r => r.json()),
    fetch('/api/decision-rules').then(r => r.json()),
    fetch('/api/collections/catalog-schema').then(r => r.json()),
    fetch('/api/segments').then(r => r.json()),
    typeof ensureFolderPickerData === 'function' ? ensureFolderPickerData('offers') : Promise.resolve([])
  ]);
  const qualifiers = qualRes.qualifiers || [];
  const rules = rulesRes.rules || [];
  const catalogSchema = schemaRes.attributes || [];
  const segments = (segRes.segments || segRes || []);
  const offerFolderId = offer?.folder_id || (typeof getDefaultFolderForEntity === 'function' ? getDefaultFolderForEntity('offers') : null);

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
            ${typeof folderPickerHtml === 'function' ? folderPickerHtml('offer-folder-id', 'offers', offerFolderId) : ''}
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

        <!-- Custom Attributes (from Item Catalog) — GAP 1 -->
        ${catalogSchema.length > 0 ? (() => {
          const _caCollapsed = catalogSchema.length > 4;
          return `
        <div class="form-section">
          <div onclick="toggleCustomAttrs()" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;padding:2px 0">
            <h3 class="form-section-title" style="margin:0;display:flex;align-items:center;gap:8px">
              Custom Attributes
              <span style="font-size:11px;font-weight:500;background:#e8eaed;color:#555;padding:2px 8px;border-radius:10px">${catalogSchema.length}</span>
            </h3>
            <span id="od-ca-chevron" style="font-size:18px;color:#888;transition:transform 0.25s ease;transform:rotate(${_caCollapsed ? '0' : '180'}deg)">&#9660;</span>
          </div>
          <div class="form-help" style="margin:6px 0 0">These fields are defined in the Item Catalog schema.</div>
          <div id="od-ca-body" style="max-height:${_caCollapsed ? '0' : '320px'};overflow:hidden;transition:max-height 0.3s ease;margin-top:${_caCollapsed ? '0' : '12px'}">
            <div style="max-height:320px;overflow-y:auto;padding:2px">
              <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));gap:16px">
                ${catalogSchema.map(attr => {
                  const val = offer?.custom_attributes?.[attr.name] ?? attr.default_value ?? '';
                  const reqMark = attr.required ? ' form-label-required' : '';
                  if (attr.type === 'boolean') {
                    return '<div class="form-group"><label class="form-label' + reqMark + '">' + attr.label + '</label><select id="ca-field-' + attr.name + '" class="form-input od-custom-attr" data-ca-name="' + attr.name + '"><option value="">— Not set —</option><option value="true" ' + (val === true || val === 'true' ? 'selected' : '') + '>Yes</option><option value="false" ' + (val === false || val === 'false' ? 'selected' : '') + '>No</option></select>' + (attr.description ? '<div class="form-help">' + attr.description + '</div>' : '') + '</div>';
                  } else if (attr.type === 'date' || attr.type === 'datetime') {
                    return '<div class="form-group"><label class="form-label' + reqMark + '">' + attr.label + '</label><input type="' + (attr.type === 'datetime' ? 'datetime-local' : 'date') + '" id="ca-field-' + attr.name + '" class="form-input od-custom-attr" data-ca-name="' + attr.name + '" value="' + (val || '') + '">' + (attr.description ? '<div class="form-help">' + attr.description + '</div>' : '') + '</div>';
                  } else if (attr.type === 'integer') {
                    return '<div class="form-group"><label class="form-label' + reqMark + '">' + attr.label + '</label><input type="number" id="ca-field-' + attr.name + '" class="form-input od-custom-attr" data-ca-name="' + attr.name + '" value="' + (val || '') + '" ' + (attr.required ? 'required' : '') + '>' + (attr.description ? '<div class="form-help">' + attr.description + '</div>' : '') + '</div>';
                  } else if (attr.type === 'asset') {
                    return '<div style="grid-column:1/-1" class="form-group"><label class="form-label' + reqMark + '">' + attr.label + ' <span style="font-size:11px;color:#999;font-weight:400">(Decisioning Asset)</span></label><div style="display:flex;gap:8px;align-items:flex-start"><div style="flex:1"><input type="url" id="ca-field-' + attr.name + '" class="form-input od-custom-attr" data-ca-name="' + attr.name + '" value="' + (val || '') + '" ' + (attr.required ? 'required' : '') + ' placeholder="https://cdn.example.com/image.jpg" oninput="(function(v){var p=document.getElementById(\'ca-preview-' + attr.name + '\');if(p)p.innerHTML=v?\'<img src=&quot;\'+v+\'&quot; style=&quot;max-width:100%;max-height:100%;object-fit:contain;border-radius:4px&quot; onerror=&quot;this.parentNode.innerHTML=\\\\\'<span style=color:#999;font-size:11px>Invalid URL</span>\\\\\'&quot;>\':\'\';})(this.value)"></div><div id="ca-preview-' + attr.name + '" style="width:80px;height:80px;border:1px dashed #ccc;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;background:#fafafa">' + (val ? '<img src="' + val + '" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:4px" onerror="this.parentNode.innerHTML=\'<span style=color:#999;font-size:11px>Invalid URL</span>\'">' : '<span style="color:#ccc;font-size:20px">&#128444;</span>') + '</div></div>' + (attr.description ? '<div class="form-help">' + attr.description + '</div>' : '<div class="form-help">Public URL pointing to an image or media asset</div>') + '</div>';
                  } else {
                    return '<div class="form-group"><label class="form-label' + reqMark + '">' + attr.label + '</label><input type="text" id="ca-field-' + attr.name + '" class="form-input od-custom-attr" data-ca-name="' + attr.name + '" value="' + (val || '') + '" ' + (attr.required ? 'required' : '') + ' placeholder="' + (attr.description || '') + '">' + (attr.description ? '<div class="form-help">' + attr.description + '</div>' : '') + '</div>';
                  }
                }).join('')}
              </div>
            </div>
          </div>
        </div>`;
        })() : ''}

        <!-- Eligibility — GAP 4: audience-based + rule-based -->
        <div class="form-section">
          <h3 class="form-section-title">Eligibility</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label">Eligibility Type</label>
              <select id="od-elig-type" class="form-input" onchange="document.getElementById('od-elig-rule-panel').style.display=this.value==='rule'?'':'none';document.getElementById('od-elig-audience-panel').style.display=this.value==='audiences'?'':'none'">
                <option value="all" ${(!offer?.eligibility_type || offer?.eligibility_type === 'all') ? 'selected' : ''}>All visitors (no restriction)</option>
                <option value="audiences" ${offer?.eligibility_type === 'audiences' ? 'selected' : ''}>By audience / segment</option>
                <option value="rule" ${offer?.eligibility_type === 'rule' ? 'selected' : ''}>By decision rule</option>
              </select>
            </div>
            <div class="form-group form-grid-full" id="od-elig-audience-panel" style="display:${offer?.eligibility_type === 'audiences' ? '' : 'none'}">
              <label class="form-label">Target Audiences</label>
              <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
                <span style="font-size:12px;font-weight:600">Match:</span>
                <select id="od-audience-logic" class="form-input" style="width:auto">
                  <option value="OR" ${offer?.audience_logic !== 'AND' ? 'selected' : ''}>ANY (OR)</option>
                  <option value="AND" ${offer?.audience_logic === 'AND' ? 'selected' : ''}>ALL (AND)</option>
                </select>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;max-height:200px;overflow-y:auto;padding:8px;border:1px solid #e0e0e0;border-radius:8px">
                ${segments.map(seg => {
                  const checked = (offer?.eligibility_audience_ids || []).includes(seg.id);
                  return `<label style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border:1px solid #e0e0e0;border-radius:16px;font-size:12px;cursor:pointer;background:${checked ? '#e3f2fd' : '#fff'}"><input type="checkbox" class="od-aud-cb" value="${seg.id}" data-count="${seg.contact_count || 0}" ${checked ? 'checked' : ''} onchange="updateEligibilityEstimate()"> ${seg.name} <span style="color:#999;font-size:11px">(${seg.contact_count || 0})</span></label>`;
                }).join('') || '<span style="color:#999">No segments available</span>'}
              </div>
              <div id="od-elig-estimate" style="margin-top:8px"></div>
              <div class="form-help">Visitors in the selected audience(s) will be eligible</div>
            </div>
            <div class="form-group form-grid-full" id="od-elig-rule-panel" style="display:${offer?.eligibility_type === 'rule' ? '' : 'none'}">
              <label class="form-label">Eligibility Rule</label>
              <select id="od-rule" class="form-input">
                <option value="">— Select a rule —</option>
                ${rules.map(r => `<option value="${r.id}" ${offer?.eligibility_rule_id === r.id ? 'selected' : ''}>${r.name} — ${r.description || ''}</option>`).join('')}
              </select>
              <div class="form-help">Only contacts matching this rule will be eligible</div>
            </div>
          </div>
        </div>

        <!-- Constraints & Capping — GAP 3: multi-rule capping -->
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
          <div style="margin-top:16px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <label class="form-label" style="margin:0">Advanced Capping Rules <span style="font-size:11px;color:#999">(up to 10)</span></label>
              <button type="button" class="btn btn-sm btn-secondary" onclick="addCappingRule()">+ Add Rule</button>
            </div>
            <div id="od-capping-rules">
              ${(constraint?.capping_rules || []).map((rule, idx) => `
                <div class="capping-rule-row" style="border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:10px;background:#fafbfc;position:relative">
                  <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.capping-rule-row').remove()" style="position:absolute;top:10px;right:10px;padding:4px 8px;font-size:11px">${OD_ICONS.trash}</button>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
                    <div>
                      <label class="form-label" style="font-size:11px;margin-bottom:4px">Capping Event</label>
                      <select class="form-input cr-event">
                        <option value="decision" ${rule.event === 'decision' ? 'selected' : ''}>Decision (default)</option>
                        <option value="impression" ${rule.event === 'impression' ? 'selected' : ''}>Impression</option>
                        <option value="click" ${rule.event === 'click' ? 'selected' : ''}>Click</option>
                        <option value="custom" ${rule.event === 'custom' ? 'selected' : ''}>Custom Event</option>
                      </select>
                    </div>
                    <div>
                      <label class="form-label" style="font-size:11px;margin-bottom:4px">Capping Type</label>
                      <select class="form-input cr-type">
                        <option value="total" ${rule.cap_type === 'total' ? 'selected' : ''}>In total (global)</option>
                        <option value="per_profile" ${rule.cap_type === 'per_profile' ? 'selected' : ''}>Per profile</option>
                      </select>
                    </div>
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div>
                      <label class="form-label" style="font-size:11px;margin-bottom:4px">Capping Limit</label>
                      <div style="display:flex;gap:8px;align-items:center">
                        <select class="form-input cr-limit-mode" style="width:110px;flex-shrink:0" onchange="this.closest('.capping-rule-row').querySelector('.cr-limit').style.display=this.value==='static'?'':'none';this.closest('.capping-rule-row').querySelector('.cr-limit-expr').style.display=this.value==='expression'?'':'none'">
                          <option value="static" ${!rule.limit_expression ? 'selected' : ''}>Static</option>
                          <option value="expression" ${rule.limit_expression ? 'selected' : ''}>Expression</option>
                        </select>
                        <input type="number" class="form-input cr-limit" min="1" value="${rule.limit || 10}" style="flex:1;${rule.limit_expression ? 'display:none' : ''}">
                        <input type="text" class="form-input cr-limit-expr" value="${rule.limit_expression || ''}" placeholder="e.g., inventory * 2" style="flex:1;font-family:monospace;${rule.limit_expression ? '' : 'display:none'}">
                      </div>
                    </div>
                    <div>
                      <label class="form-label" style="font-size:11px;margin-bottom:4px">Reset Frequency</label>
                      <div style="display:flex;gap:8px;align-items:center">
                        <span style="font-size:12px;color:#555;white-space:nowrap">Every</span>
                        <input type="number" class="form-input cr-reset-n" min="1" max="365" value="${rule.reset_count || 1}" style="width:60px;flex-shrink:0">
                        <select class="form-input cr-reset" style="flex:1">
                          <option value="none" ${rule.reset_period === 'none' ? 'selected' : ''}>Never</option>
                          <option value="daily" ${rule.reset_period === 'daily' ? 'selected' : ''}>Day(s)</option>
                          <option value="weekly" ${rule.reset_period === 'weekly' ? 'selected' : ''}>Week(s)</option>
                          <option value="monthly" ${rule.reset_period === 'monthly' ? 'selected' : ''}>Month(s)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
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

window.updateEligibilityEstimate = function() {
  const container = document.getElementById('od-elig-estimate');
  if (!container) return;
  const checked = [...document.querySelectorAll('.od-aud-cb:checked')];
  if (checked.length === 0) { container.innerHTML = ''; return; }
  const logic = document.getElementById('od-audience-logic')?.value || 'OR';
  const counts = checked.map(cb => parseInt(cb.getAttribute('data-count') || '0'));
  let estimate;
  if (logic === 'OR') {
    estimate = counts.reduce((sum, c) => sum + c, 0);
  } else {
    estimate = Math.min(...counts);
  }
  container.innerHTML = `<div style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;background:#e8f5e9;border-radius:20px;font-size:12px;font-weight:600;color:#2e7d32">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    Estimated qualified profiles: ~${estimate.toLocaleString()}${logic === 'OR' ? ' (union)' : ' (intersection)'}
  </div>`;
};

window.toggleCustomAttrs = function() {
  const body = document.getElementById('od-ca-body');
  const chevron = document.getElementById('od-ca-chevron');
  if (!body) return;
  const isCollapsed = body.style.maxHeight === '0px' || body.style.maxHeight === '0';
  body.style.maxHeight = isCollapsed ? '320px' : '0';
  body.style.marginTop = isCollapsed ? '12px' : '0';
  if (chevron) chevron.style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
};

window.addCappingRule = function() {
  const container = document.getElementById('od-capping-rules');
  if (!container) return;
  if (container.querySelectorAll('.capping-rule-row').length >= 10) { showToast('Maximum 10 capping rules', 'error'); return; }
  container.insertAdjacentHTML('beforeend', `
    <div class="capping-rule-row" style="border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:10px;background:#fafbfc;position:relative">
      <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.capping-rule-row').remove()" style="position:absolute;top:10px;right:10px;padding:4px 8px;font-size:11px">${OD_ICONS.trash}</button>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <label class="form-label" style="font-size:11px;margin-bottom:4px">Capping Event</label>
          <select class="form-input cr-event">
            <option value="decision">Decision (default)</option>
            <option value="impression">Impression</option>
            <option value="click">Click</option>
            <option value="custom">Custom Event</option>
          </select>
        </div>
        <div>
          <label class="form-label" style="font-size:11px;margin-bottom:4px">Capping Type</label>
          <select class="form-input cr-type">
            <option value="total">In total (global)</option>
            <option value="per_profile">Per profile</option>
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <label class="form-label" style="font-size:11px;margin-bottom:4px">Capping Limit</label>
          <div style="display:flex;gap:8px;align-items:center">
            <select class="form-input cr-limit-mode" style="width:110px;flex-shrink:0" onchange="this.closest('.capping-rule-row').querySelector('.cr-limit').style.display=this.value==='static'?'':'none';this.closest('.capping-rule-row').querySelector('.cr-limit-expr').style.display=this.value==='expression'?'':'none'">
              <option value="static">Static</option>
              <option value="expression">Expression</option>
            </select>
            <input type="number" class="form-input cr-limit" min="1" value="10" style="flex:1">
            <input type="text" class="form-input cr-limit-expr" value="" placeholder="e.g., inventory * 2" style="flex:1;font-family:monospace;display:none">
          </div>
        </div>
        <div>
          <label class="form-label" style="font-size:11px;margin-bottom:4px">Reset Frequency</label>
          <div style="display:flex;gap:8px;align-items:center">
            <span style="font-size:12px;color:#555;white-space:nowrap">Every</span>
            <input type="number" class="form-input cr-reset-n" min="1" max="365" value="1" style="width:60px;flex-shrink:0">
            <select class="form-input cr-reset" style="flex:1">
              <option value="none">Never</option>
              <option value="daily">Day(s)</option>
              <option value="weekly">Week(s)</option>
              <option value="monthly">Month(s)</option>
            </select>
          </div>
        </div>
      </div>
    </div>`);
};

window.handleOfferSubmit = async function(event) {
  event.preventDefault();

  const editId = document.getElementById('offer-edit-id').value;
  const isEdit = !!editId;
  const tags = [...document.querySelectorAll('.od-tag-cb:checked')].map(cb => parseInt(cb.value));

  // Collect custom attributes
  const customAttrs = {};
  document.querySelectorAll('.od-custom-attr').forEach(el => {
    const name = el.dataset.caName;
    if (name && el.value !== '') customAttrs[name] = el.type === 'number' ? parseFloat(el.value) : el.value;
  });

  // Eligibility
  const eligType = document.getElementById('od-elig-type')?.value || 'all';
  const audienceIds = [...document.querySelectorAll('.od-aud-cb:checked')].map(cb => parseInt(cb.value));
  const audienceLogic = document.getElementById('od-audience-logic')?.value || 'OR';

  const data = {
    name: document.getElementById('od-name').value,
    description: document.getElementById('od-desc').value,
    type: document.getElementById('od-type').value,
    priority: parseInt(document.getElementById('od-priority').value) || 50,
    start_date: document.getElementById('od-start').value || null,
    end_date: document.getElementById('od-end').value || null,
    eligibility_type: eligType,
    eligibility_rule_id: eligType === 'rule' ? (document.getElementById('od-rule')?.value || null) : null,
    eligibility_audience_ids: eligType === 'audiences' ? audienceIds : [],
    audience_logic: audienceLogic,
    custom_attributes: customAttrs,
    status: document.getElementById('od-status').value,
    folder_id: typeof getSelectedFolderId === 'function' ? getSelectedFolderId('offer-folder-id') : null,
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

    // Collect advanced capping rules
    const cappingRules = [...document.querySelectorAll('.capping-rule-row')].map(row => {
      const mode = row.querySelector('.cr-limit-mode')?.value || 'static';
      return {
        event: row.querySelector('.cr-event').value,
        cap_type: row.querySelector('.cr-type').value,
        limit: mode === 'static' ? (parseInt(row.querySelector('.cr-limit').value) || 10) : null,
        limit_expression: mode === 'expression' ? (row.querySelector('.cr-limit-expr')?.value || '') : null,
        reset_period: row.querySelector('.cr-reset').value,
        reset_count: parseInt(row.querySelector('.cr-reset-n')?.value) || 1
      };
    });

    // Save constraints
    await fetch(`/api/offers/${offerId}/constraints`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        per_user_cap: parseInt(document.getElementById('od-per-user-cap').value) || 0,
        frequency_period: document.getElementById('od-freq').value,
        total_cap: parseInt(document.getElementById('od-total-cap').value) || 0,
        capping_rules: cappingRules
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
          ${offer.status === 'draft' ? `<button class="btn btn-primary btn-sm" onclick="offerAction(${id},'approve')">Approve</button><button class="btn btn-primary btn-sm" onclick="offerAction(${id},'publish')">Publish</button>` : ''}
          ${offer.status === 'approved' ? `<button class="btn btn-primary btn-sm" onclick="offerAction(${id},'publish')">Publish</button><button class="btn btn-secondary btn-sm" onclick="offerAction(${id},'undo-approve')">Revert to Draft</button>` : ''}
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
          <div><strong>Eligibility:</strong> ${
            offer.eligibility_type === 'audiences'
              ? `By audience (${(offer.eligibility_audience_ids || []).length} segments, ${offer.audience_logic || 'OR'})`
              : offer.eligibility_rule ? offer.eligibility_rule.name : 'All visitors'
          }</div>
          <div><strong>Created:</strong> ${new Date(offer.created_at).toLocaleDateString()}</div>
        </div>

        ${Object.keys(offer.custom_attributes || {}).length > 0 ? `
        <div style="margin-top:16px">
          <h4 style="margin:0 0 8px;font-size:13px;font-weight:600;color:var(--text-secondary)">Custom Attributes</h4>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${Object.entries(offer.custom_attributes).map(([k, v]) =>
              `<span style="display:inline-flex;padding:4px 12px;background:#f0f4ff;border-radius:16px;font-size:12px"><strong>${k}:</strong>&nbsp;${v}</span>`
            ).join('')}
          </div>
        </div>` : ''}

        ${offer.constraint && (offer.constraint.capping_rules || []).length > 0 ? `
        <div style="margin-top:16px">
          <h4 style="margin:0 0 8px;font-size:13px;font-weight:600;color:var(--text-secondary)">Advanced Capping Rules</h4>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${(offer.constraint.capping_rules || []).map(r =>
              `<span style="display:inline-flex;padding:4px 12px;background:#fff3e0;border-radius:16px;font-size:12px">${r.event} · ${r.cap_type} · limit ${r.limit}${r.reset_period ? ' · resets ' + r.reset_period : ''}</span>`
            ).join('')}
          </div>
        </div>` : ''}
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
  const labels = { approve: 'Approve this offer?', publish: 'Publish this offer to live?', archive: 'Archive this offer?', 'undo-approve': 'Revert this offer to draft?' };
  if (labels[action] && !confirm(labels[action])) return;
  const res = await fetch(`/api/offers/${id}/${action}`, { method: 'POST' });
  if (!res.ok) { const err = await res.json().catch(() => ({})); showToast(err.error || `Failed to ${action}`, 'error'); return; }
  const actionLabels = { approve: 'approved', publish: 'published', archive: 'archived', 'undo-approve': 'reverted to draft' };
  showToast(`Offer ${actionLabels[action] || action + 'ed'}`);
  showOfferDetail(id);
};

window.deleteOffer = async function(id) {
  if (!confirm('Delete this offer? This cannot be undone.')) return;
  const res = await fetch(`/api/offers/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    showToast(err.error || 'Cannot delete offer', 'error');
    return;
  }
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
    if (typeof ensureAllFoldersLoaded === 'function') await ensureAllFoldersLoaded();
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
      { id: 'status', label: 'Status' },
      { id: 'folder', label: 'Folder', visible: false }
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
        <td data-column-id="folder">${typeof folderCellHtml === 'function' ? folderCellHtml(p.folder_id) : ''}</td>
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
              <th data-column-id="folder">Folder</th>
              <th style="width:50px"></th>
            </tr></thead>
            <tbody>${tableRows || '<tr><td colspan="9" style="text-align:center;padding:2rem;color:#6B7280">No placements found</td></tr>'}</tbody>
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
  if (typeof ensureFolderPickerData === 'function') await ensureFolderPickerData('placements');
  const plFolderId = placement?.folder_id || (typeof getDefaultFolderForEntity === 'function' ? getDefaultFolderForEntity('placements') : null);
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
            ${typeof folderPickerHtml === 'function' ? folderPickerHtml('placement-folder-id', 'placements', plFolderId) : ''}
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
    max_items: parseInt(document.getElementById('pl-max').value) || 1,
    folder_id: typeof getSelectedFolderId === 'function' ? getSelectedFolderId('placement-folder-id') : null
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
    if (typeof ensureAllFoldersLoaded === 'function') await ensureAllFoldersLoaded();
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
      { id: 'status', label: 'Status' },
      { id: 'folder', label: 'Folder', visible: false }
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
        <td data-column-id="folder">${typeof folderCellHtml === 'function' ? folderCellHtml(c.folder_id) : ''}</td>
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
              <th data-column-id="folder">Folder</th>
              <th style="width:50px"></th>
            </tr></thead>
            <tbody>${tableRows || '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#6B7280">No collections found</td></tr>'}</tbody>
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

  const [qualRes, offersRes, catRes] = await Promise.all([
    fetch('/api/collections/qualifiers').then(r => r.json()),
    fetch('/api/offers').then(r => r.json()),
    fetch('/api/collections/catalog-schema').then(r => r.json()),
    typeof ensureFolderPickerData === 'function' ? ensureFolderPickerData('collections') : Promise.resolve([])
  ]);
  const qualifiers = qualRes.qualifiers || [];
  const offers = offersRes.offers || [];
  const catalogAttrs = catRes.attributes || [];
  let collection = null;
  if (editId) collection = await fetch(`/api/collections/${editId}`).then(r => r.json());
  const isEdit = !!collection;
  const colFolderId = collection?.folder_id || (typeof getDefaultFolderForEntity === 'function' ? getDefaultFolderForEntity('collections') : null);
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
                    return `<label style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border:2px solid ${q.color};border-radius:20px;font-size:13px;cursor:pointer;background:${checked ? q.color + '18' : '#fff'};transition:background .15s" class="col-qual-label">
                      <input type="checkbox" class="col-qual-cb" value="${q.id}" ${checked ? 'checked' : ''} style="accent-color:${q.color}" onchange="updateCollectionTagPreview()">
                      <span style="color:${q.color};font-weight:500">${q.name}</span>
                    </label>`;
                  }).join('')}
              </div>
              <div class="form-help">Offers with any of these tags will be automatically included</div>
            </div>
          </div>
          <div id="col-tag-preview" style="margin-top:8px"></div>

          <!-- Attribute-based conditions -->
          <div style="margin-top:16px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <label class="form-label" style="margin:0">Attribute Conditions <span style="font-size:11px;color:#999">(optional, narrow results further)</span></label>
              <button type="button" class="btn btn-sm btn-secondary" onclick="addCollectionAttrCondition()">+ Add Condition</button>
            </div>
            <div id="col-attr-conditions">
              ${(collection?.attribute_conditions || []).map((c, idx) => `
                <div class="col-attr-cond-row" style="border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:10px;background:#fafbfc;position:relative">
                  <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.col-attr-cond-row').remove();updateCollectionTagPreview()" style="position:absolute;top:10px;right:10px;padding:4px 8px;font-size:11px">${OD_ICONS.trash}</button>
                  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding-right:40px">
                    <div>
                      <label class="form-label" style="font-size:11px;margin-bottom:4px">Attribute</label>
                      <select class="form-input cac-attr">${catalogAttrs.map(a => `<option value="${a.name}" ${c.attribute === a.name ? 'selected' : ''}>${a.label || a.name}</option>`).join('')}</select>
                    </div>
                    <div>
                      <label class="form-label" style="font-size:11px;margin-bottom:4px">Operator</label>
                      <select class="form-input cac-op"><option value="equals" ${c.operator === 'equals' ? 'selected' : ''}>Equals</option><option value="not_equals" ${c.operator === 'not_equals' ? 'selected' : ''}>Not equals</option><option value="contains" ${c.operator === 'contains' ? 'selected' : ''}>Contains</option><option value="gt" ${c.operator === 'gt' ? 'selected' : ''}>Greater than</option><option value="lt" ${c.operator === 'lt' ? 'selected' : ''}>Less than</option><option value="exists" ${c.operator === 'exists' ? 'selected' : ''}>Exists</option></select>
                    </div>
                    <div>
                      <label class="form-label" style="font-size:11px;margin-bottom:4px">Value</label>
                      <input type="text" class="form-input cac-val" value="${c.value || ''}" placeholder="Value to match">
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="form-help">Filter offers by their custom attribute values (e.g., product_category equals "electronics")</div>
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

        ${typeof folderPickerHtml === 'function' ? `<div class="form-section"><h3 class="form-section-title">Organization</h3><div class="form-grid">${folderPickerHtml('collection-folder-id', 'collections', colFolderId)}</div></div>` : ''}

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="navigateTo('offer-collections','list')">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? ICONS.save + ' Update' : ICONS.sparkles + ' Create'} Collection</button>
        </div>
      </form>
    </div>`;

  window._colFormOffers = offers;
  window._colFormQualifiers = qualifiers;
  window._colFormCatalogAttrs = catalogAttrs;

  window.addCollectionAttrCondition = () => {
    const container = document.getElementById('col-attr-conditions');
    if (!container) return;
    const attrs = window._colFormCatalogAttrs || [];
    if (attrs.length === 0) { showToast('No custom attributes defined in Item Catalog', 'error'); return; }
    const row = document.createElement('div');
    row.className = 'col-attr-cond-row';
    row.style.cssText = 'border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:10px;background:#fafbfc;position:relative';
    row.innerHTML = `
      <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.col-attr-cond-row').remove();updateCollectionTagPreview()" style="position:absolute;top:10px;right:10px;padding:4px 8px;font-size:11px">${OD_ICONS.trash}</button>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding-right:40px">
        <div>
          <label class="form-label" style="font-size:11px;margin-bottom:4px">Attribute</label>
          <select class="form-input cac-attr">${attrs.map(a => `<option value="${a.name}">${a.label || a.name}</option>`).join('')}</select>
        </div>
        <div>
          <label class="form-label" style="font-size:11px;margin-bottom:4px">Operator</label>
          <select class="form-input cac-op"><option value="equals">Equals</option><option value="not_equals">Not equals</option><option value="contains">Contains</option><option value="gt">Greater than</option><option value="lt">Less than</option><option value="exists">Exists</option></select>
        </div>
        <div>
          <label class="form-label" style="font-size:11px;margin-bottom:4px">Value</label>
          <input type="text" class="form-input cac-val" placeholder="Value to match">
        </div>
      </div>`;
    container.appendChild(row);
  };

  window.toggleCollectionType = () => {
    const isStatic = document.getElementById('col-type').value === 'static';
    document.getElementById('col-static-config').style.display = isStatic ? '' : 'none';
    document.getElementById('col-dynamic-config').style.display = isStatic ? 'none' : '';
  };

  window.updateCollectionTagPreview = () => {
    const preview = document.getElementById('col-tag-preview');
    if (!preview) return;
    const selectedIds = [...document.querySelectorAll('.col-qual-cb:checked')].map(cb => parseInt(cb.value));

    // highlight selected tag labels
    document.querySelectorAll('.col-qual-label').forEach(lbl => {
      const cb = lbl.querySelector('.col-qual-cb');
      const color = lbl.style.borderColor;
      lbl.style.background = cb.checked ? (color ? color.replace(')', ',0.1)').replace('rgb', 'rgba') : '#e3f2fd') : '#fff';
    });

    if (selectedIds.length === 0) {
      preview.innerHTML = '';
      return;
    }

    const allOffers = window._colFormOffers || [];
    const attrConds = [...document.querySelectorAll('.col-attr-cond-row')].map(row => ({
      attribute: row.querySelector('.cac-attr')?.value,
      operator: row.querySelector('.cac-op')?.value || 'equals',
      value: row.querySelector('.cac-val')?.value || ''
    })).filter(c => c.attribute);

    let matching = allOffers.filter(o =>
      (o.tags || []).some(t => selectedIds.includes(t.id))
    );
    if (attrConds.length > 0) {
      matching = matching.filter(o => {
        const attrs = o.custom_attributes || {};
        return attrConds.every(c => {
          const v = attrs[c.attribute], t = c.value;
          if (c.operator === 'equals') return String(v) === String(t);
          if (c.operator === 'not_equals') return String(v) !== String(t);
          if (c.operator === 'contains') return v != null && String(v).toLowerCase().includes(String(t).toLowerCase());
          if (c.operator === 'gt') return Number(v) > Number(t);
          if (c.operator === 'lt') return Number(v) < Number(t);
          if (c.operator === 'exists') return v != null && v !== '';
          return true;
        });
      });
    }

    const statusColors = { draft: '#6B7280', approved: '#2196F3', live: '#4CAF50', archived: '#9E9E9E' };

    preview.innerHTML = `
      <div style="border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
        <div style="padding:10px 16px;background:#f8f9fa;border-bottom:1px solid #e0e0e0;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;font-weight:600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1976D2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>
            Matching Offers
          </span>
          <span style="font-size:12px;font-weight:700;color:#1976D2;background:#e3f2fd;padding:2px 10px;border-radius:12px">${matching.length} offer${matching.length !== 1 ? 's' : ''}</span>
        </div>
        ${matching.length === 0
          ? '<div style="padding:20px;text-align:center;color:#999;font-size:13px">No offers match the selected tags</div>'
          : `<div style="max-height:240px;overflow-y:auto">
              <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead><tr style="background:#fafafa;border-bottom:1px solid #e0e0e0">
                  <th style="text-align:left;padding:6px 12px;font-weight:600;color:#555">Offer</th>
                  <th style="text-align:left;padding:6px 12px;font-weight:600;color:#555">Type</th>
                  <th style="text-align:left;padding:6px 12px;font-weight:600;color:#555">Status</th>
                  <th style="text-align:center;padding:6px 12px;font-weight:600;color:#555">Priority</th>
                  <th style="text-align:left;padding:6px 12px;font-weight:600;color:#555">Tags</th>
                </tr></thead>
                <tbody>${matching.map(o => `<tr style="border-bottom:1px solid #f0f0f0">
                  <td style="padding:6px 12px"><strong>${o.name}</strong></td>
                  <td style="padding:6px 12px">${typeBadge(o.type)}</td>
                  <td style="padding:6px 12px"><span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;color:#fff;background:${statusColors[o.status] || '#999'}">${o.status}</span></td>
                  <td style="padding:6px 12px;text-align:center;font-weight:600">${o.priority}</td>
                  <td style="padding:6px 12px">${(o.tags || []).map(t => `<span style="display:inline-block;padding:1px 8px;border-radius:10px;font-size:11px;font-weight:500;border:1px solid ${t.color || '#ccc'};color:${t.color || '#666'};margin-right:3px">${t.name}</span>`).join('')}</td>
                </tr>`).join('')}</tbody>
              </table>
            </div>`
        }
      </div>`;
  };

  // Show initial preview if tags are already selected (edit mode)
  setTimeout(() => updateCollectionTagPreview(), 50);
};

window.handleCollectionSubmit = async function(event) {
  event.preventDefault();
  const editId = document.getElementById('col-edit-id').value;
  const isEdit = !!editId;
  const type = document.getElementById('col-type').value;
  const attrConditions = type === 'dynamic' ? [...document.querySelectorAll('.col-attr-cond-row')].map(row => ({
    attribute: row.querySelector('.cac-attr')?.value,
    operator: row.querySelector('.cac-op')?.value || 'equals',
    value: row.querySelector('.cac-val')?.value || ''
  })).filter(c => c.attribute) : [];
  const data = {
    name: document.getElementById('col-name').value,
    description: document.getElementById('col-desc').value,
    type,
    offer_ids: type === 'static' ? [...document.querySelectorAll('.col-offer-cb:checked')].map(cb => parseInt(cb.value)) : [],
    qualifier_ids: type === 'dynamic' ? [...document.querySelectorAll('.col-qual-cb:checked')].map(cb => parseInt(cb.value)) : [],
    attribute_conditions: attrConditions,
    folder_id: typeof getSelectedFolderId === 'function' ? getSelectedFolderId('collection-folder-id') : null
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
    if (typeof ensureAllFoldersLoaded === 'function') await ensureAllFoldersLoaded();
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
      { id: 'status', label: 'Status' },
      { id: 'folder', label: 'Folder', visible: false }
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
        <td data-column-id="conditions"><div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center">${(r.conditions || []).map((c, ci) => {
          const opLabel = { equals: '=', not_equals: '≠', contains: '~', not_contains: '!~', greater_than: '>', less_than: '<', greater_than_or_equal: '≥', less_than_or_equal: '≤', in: 'in', not_in: 'not in', is_empty: 'is empty', is_not_empty: 'is set', starts_with: 'starts', ends_with: 'ends', in_last: 'in last', not_in_last: 'not in last' }[c.operator] || c.operator.replace(/_/g, ' ');
          const val = Array.isArray(c.value) ? c.value.join(', ') : (c.value || '');
          const valStr = ['is_empty', 'is_not_empty'].includes(c.operator) ? '' : (' <strong>' + val + '</strong>');
          const conn = ci > 0 ? (c.connector || r.logic || 'AND') : '';
          const sep = conn ? '<span style="font-size:10px;font-weight:700;color:' + (conn === 'OR' ? '#f59e0b' : '#6366f1') + ';padding:0 2px">' + conn + '</span>' : '';
          return sep + '<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;font-size:11px;white-space:nowrap"><span style="color:#6366f1;font-weight:600">' + c.attribute.replace(/_/g, ' ') + '</span> <span style="color:#94a3b8">' + opLabel + '</span>' + valStr + '</span>';
        }).join('')}${(r.conditions || []).length === 0 ? '<span style="color:#94a3b8;font-size:11px">No conditions</span>' : ''}</div></td>
        <td data-column-id="logic"><span style="display:inline-flex;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;background:${(r.logic || 'AND') === 'OR' ? '#fffbeb;color:#d97706' : (r.logic || 'AND') === 'MIXED' ? '#fef3c7;color:#92400e' : '#eef2ff;color:#4f46e5'}">${r.logic || 'AND'}</span></td>
        <td data-column-id="usage" style="text-align:center">${r.usage_count || 0} items</td>
        <td data-column-id="status">${createStatusIndicator(r.status || 'active', r.status || 'active')}</td>
        <td data-column-id="folder">${typeof folderCellHtml === 'function' ? folderCellHtml(r.folder_id) : ''}</td>
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
              <th data-column-id="folder">Folder</th>
              <th style="width:50px"></th>
            </tr></thead>
            <tbody>${tableRows || '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#6B7280">No rules found</td></tr>'}</tbody>
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

// ── Decision Rule attribute registry (mirrors segment builder) ──
const DR_ATTRS = {
  contact: [
    { name: 'loyalty_tier', label: 'Loyalty Tier', type: 'select', options: ['bronze','silver','gold','platinum'] },
    { name: 'engagement_score', label: 'Engagement Score', type: 'number' },
    { name: 'total_purchases', label: 'Total Purchases', type: 'number' },
    { name: 'lifetime_value', label: 'Lifetime Value', type: 'number' },
    { name: 'average_order_value', label: 'Avg Order Value', type: 'number' },
    { name: 'loyalty_points', label: 'Loyalty Points', type: 'number' },
    { name: 'referral_count', label: 'Referral Count', type: 'number' },
    { name: 'email_opt_in', label: 'Email Opt-in', type: 'boolean' },
    { name: 'sms_opt_in', label: 'SMS Opt-in', type: 'boolean' },
    { name: 'push_opt_in', label: 'Push Opt-in', type: 'boolean' },
    { name: 'marketing_consent', label: 'Marketing Consent', type: 'boolean' },
    { name: 'gdpr_consent', label: 'GDPR Consent', type: 'boolean' },
    { name: 'city', label: 'City', type: 'text' },
    { name: 'state', label: 'State', type: 'text' },
    { name: 'country', label: 'Country', type: 'text' },
    { name: 'gender', label: 'Gender', type: 'select', options: ['male','female','other','unknown'] },
    { name: 'status', label: 'Status', type: 'select', options: ['active','inactive','prospect','churned'] },
    { name: 'source', label: 'Source', type: 'select', options: ['organic','paid','referral','social','direct','email'] },
    { name: 'lifecycle_stage', label: 'Lifecycle Stage', type: 'select', options: ['prospect','new','active','loyal','at_risk','churned'] },
    { name: 'subscription_status', label: 'Subscription Status', type: 'select', options: ['subscribed','unsubscribed','pending'] },
    { name: 'preferred_channel', label: 'Preferred Channel', type: 'select', options: ['email','sms','push','whatsapp'] },
    { name: 'favorite_categories', label: 'Favorite Categories', type: 'text' },
    { name: 'interests', label: 'Interests', type: 'text' },
    { name: 'price_sensitivity', label: 'Price Sensitivity', type: 'select', options: ['low','medium','high'] },
    { name: 'last_purchase_date', label: 'Last Purchase Date', type: 'date' },
    { name: 'created_at', label: 'Created Date', type: 'date' },
    { name: 'last_activity_at', label: 'Last Activity', type: 'date' }
  ],
  orders: [
    { name: 'total_amount', label: 'Total Amount', type: 'number' },
    { name: 'item_count', label: 'Item Count', type: 'number' },
    { name: 'category', label: 'Category', type: 'text' },
    { name: 'order_date', label: 'Order Date', type: 'date' }
  ],
  events: [
    { name: 'event_type', label: 'Event Type', type: 'select', options: ['page_view','email_open','email_click','purchase','cart_add','cart_abandon'] },
    { name: 'event_count', label: 'Event Count', type: 'number' },
    { name: 'event_date', label: 'Event Date', type: 'date' },
    { name: 'event_value', label: 'Event Value', type: 'number' }
  ]
};

function _drGetOperators(type) {
  switch (type) {
    case 'text': return [
      { v: 'equals', l: 'equals' }, { v: 'not_equals', l: 'does not equal' },
      { v: 'contains', l: 'contains' }, { v: 'not_contains', l: 'does not contain' },
      { v: 'starts_with', l: 'starts with' }, { v: 'ends_with', l: 'ends with' },
      { v: 'in', l: 'is one of' }, { v: 'not_in', l: 'is not one of' },
      { v: 'is_empty', l: 'is empty' }, { v: 'is_not_empty', l: 'is not empty' }
    ];
    case 'number': return [
      { v: 'equals', l: 'equals' }, { v: 'not_equals', l: 'does not equal' },
      { v: 'greater_than', l: 'greater than' }, { v: 'less_than', l: 'less than' },
      { v: 'greater_than_or_equal', l: '≥' }, { v: 'less_than_or_equal', l: '≤' }
    ];
    case 'date': return [
      { v: 'in_last', l: 'in last (days)' }, { v: 'not_in_last', l: 'not in last (days)' },
      { v: 'greater_than', l: 'after' }, { v: 'less_than', l: 'before' }
    ];
    case 'select': return [
      { v: 'equals', l: 'is' }, { v: 'not_equals', l: 'is not' },
      { v: 'in', l: 'is one of' }, { v: 'not_in', l: 'is not one of' }
    ];
    case 'boolean': return [{ v: 'equals', l: 'is' }];
    default: return [
      { v: 'equals', l: 'equals' }, { v: 'not_equals', l: 'does not equal' }
    ];
  }
}

function _drValueInput(attr, operator, value) {
  const noVal = ['is_empty', 'is_not_empty', 'is_true', 'is_false'];
  if (noVal.includes(operator)) return '';
  const v = Array.isArray(value) ? value.join(', ') : (value || '');
  if (attr?.type === 'boolean') {
    return '<select class="form-input rc-val" style="font-size:12px;max-width:120px"><option value="true"' + (v === 'true' ? ' selected' : '') + '>Yes</option><option value="false"' + (v !== 'true' ? ' selected' : '') + '>No</option></select>';
  }
  if (attr?.type === 'select' && attr.options && !['in', 'not_in'].includes(operator)) {
    return '<select class="form-input rc-val" style="font-size:12px;min-width:130px"><option value="">Select...</option>' + attr.options.map(o => '<option value="' + o + '"' + (v === o ? ' selected' : '') + '>' + o.replace(/_/g, ' ') + '</option>').join('') + '</select>';
  }
  if (attr?.type === 'number') {
    return '<input type="number" class="form-input rc-val" value="' + v + '" placeholder="Enter value..." style="font-size:12px;min-width:100px">';
  }
  if (attr?.type === 'date') {
    if (operator === 'in_last' || operator === 'not_in_last') {
      return '<input type="number" class="form-input rc-val" value="' + v + '" placeholder="Days..." style="font-size:12px;width:90px"><span style="font-size:11px;color:#888;margin-left:4px">days</span>';
    }
    return '<input type="date" class="form-input rc-val" value="' + v + '" style="font-size:12px">';
  }
  if (['in', 'not_in'].includes(operator)) {
    return '<input type="text" class="form-input rc-val" value="' + v + '" placeholder="val1, val2, val3..." style="font-size:12px;min-width:160px">';
  }
  return '<input type="text" class="form-input rc-val" value="' + v + '" placeholder="Enter value..." style="font-size:12px;min-width:130px">';
}

function _drConnectorHtml(connector, isFirst) {
  if (isFirst) return '';
  const isAnd = connector !== 'OR';
  return `<div class="rule-connector" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:4px 0;margin:-2px 0">
    <div style="flex:1;height:1px;background:#e5e7eb"></div>
    <div style="display:flex;gap:2px;background:#f1f5f9;border-radius:8px;padding:2px">
      <button type="button" class="rc-conn-btn" data-conn="AND" style="padding:2px 12px;border-radius:6px;font-size:10px;font-weight:700;border:none;cursor:pointer;transition:all 0.15s;${isAnd ? 'background:#6366f1;color:#fff' : 'background:transparent;color:#94a3b8'}" onclick="drToggleConn(this,'AND')">AND</button>
      <button type="button" class="rc-conn-btn" data-conn="OR" style="padding:2px 12px;border-radius:6px;font-size:10px;font-weight:700;border:none;cursor:pointer;transition:all 0.15s;${!isAnd ? 'background:#f59e0b;color:#fff' : 'background:transparent;color:#94a3b8'}" onclick="drToggleConn(this,'OR')">OR</button>
    </div>
    <div style="flex:1;height:1px;background:#e5e7eb"></div>
  </div>`;
}

function _drBuildCondRow(cond, idx, isFirst) {
  const entityList = ['contact', 'orders', 'events'];
  const entityLabels = { contact: 'Contact', orders: 'Orders', events: 'Events' };
  const attrs = DR_ATTRS[cond.entity] || DR_ATTRS.contact;
  const selAttr = attrs.find(a => a.name === cond.attribute) || attrs[0];
  const ops = _drGetOperators(selAttr?.type || 'text');
  const uid = 'rc-' + idx;

  return _drConnectorHtml(cond.connector || 'AND', isFirst) + `<div class="rule-cond-row" data-uid="${uid}" data-connector="${isFirst ? '' : (cond.connector || 'AND')}" style="display:flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid #e5e7eb;border-left:3px solid var(--primary-color, #6366f1);border-radius:8px;background:#fff;transition:box-shadow 0.15s" onmouseenter="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'" onmouseleave="this.style.boxShadow='none'">
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;flex:1">
      <select class="form-input rc-entity" style="font-size:12px;width:auto;padding:5px 8px;background:#f0f0ff;border-color:#c7d2fe;border-radius:6px;font-weight:600;color:#4338ca" onchange="drEntityChanged(this)">${entityList.map(e => '<option value="' + e + '"' + (cond.entity === e ? ' selected' : '') + '>' + entityLabels[e] + '</option>').join('')}</select>
      <span style="color:#cbd5e1;font-size:12px">→</span>
      <select class="form-input rc-attr" style="font-size:12px;width:auto;padding:5px 8px;border-radius:6px;min-width:140px" onchange="drAttrChanged(this)">${attrs.map(a => '<option value="' + a.name + '" data-type="' + a.type + '"' + (cond.attribute === a.name ? ' selected' : '') + '>' + a.label + '</option>').join('')}</select>
      <select class="form-input rc-op" style="font-size:12px;width:auto;padding:5px 8px;border-radius:6px;color:#6b7280" onchange="drOpChanged(this)">${ops.map(o => '<option value="' + o.v + '"' + (cond.operator === o.v ? ' selected' : '') + '>' + o.l + '</option>').join('')}</select>
      <span class="rc-val-wrap" style="display:inline-flex;align-items:center;gap:4px">${_drValueInput(selAttr, cond.operator, cond.value)}</span>
    </div>
    <button type="button" class="btn btn-sm" onclick="drRemoveCondRow(this)" style="padding:4px 6px;color:#94a3b8;border:none;background:none;cursor:pointer;font-size:16px" title="Remove condition" onmouseenter="this.style.color='#ef4444'" onmouseleave="this.style.color='#94a3b8'">&times;</button>
  </div>`;
}

window.drAddCondition = function() {
  const container = document.getElementById('rule-conditions');
  if (!container) return;
  const hasRows = container.querySelectorAll('.rule-cond-row').length > 0;
  const html = _drBuildCondRow({ entity: 'contact', attribute: 'loyalty_tier', operator: 'equals', value: '', connector: 'AND' }, Date.now(), !hasRows);
  container.insertAdjacentHTML('beforeend', html);
};

window.drSetAllConnectors = function(val) {
  if (val === 'custom') return;
  document.querySelectorAll('.rule-connector').forEach(conn => {
    conn.querySelectorAll('.rc-conn-btn').forEach(b => {
      const isActive = b.dataset.conn === val;
      b.style.background = isActive ? (val === 'AND' ? '#6366f1' : '#f59e0b') : 'transparent';
      b.style.color = isActive ? '#fff' : '#94a3b8';
    });
    const nextRow = conn.nextElementSibling;
    if (nextRow && nextRow.classList.contains('rule-cond-row')) {
      nextRow.dataset.connector = val;
    }
  });
};

window.drToggleConn = function(btn, val) {
  const connDiv = btn.closest('.rule-connector');
  if (!connDiv) return;
  connDiv.querySelectorAll('.rc-conn-btn').forEach(b => {
    const isActive = b.dataset.conn === val;
    b.style.background = isActive ? (val === 'AND' ? '#6366f1' : '#f59e0b') : 'transparent';
    b.style.color = isActive ? '#fff' : '#94a3b8';
  });
  const nextRow = connDiv.nextElementSibling;
  if (nextRow && nextRow.classList.contains('rule-cond-row')) {
    nextRow.dataset.connector = val;
  }
};

window.drRemoveCondRow = function(btn) {
  const row = btn.closest('.rule-cond-row');
  if (!row) return;
  const prev = row.previousElementSibling;
  if (prev && prev.classList.contains('rule-connector')) prev.remove();
  else {
    const next = row.nextElementSibling;
    if (next && next.classList.contains('rule-connector')) next.remove();
  }
  row.remove();
};

window.drEntityChanged = function(sel) {
  const row = sel.closest('.rule-cond-row');
  const entity = sel.value;
  const attrs = DR_ATTRS[entity] || [];
  const attrSel = row.querySelector('.rc-attr');
  attrSel.innerHTML = attrs.map(a => '<option value="' + a.name + '" data-type="' + a.type + '">' + a.label + '</option>').join('');
  drAttrChanged(attrSel);
};

window.drAttrChanged = function(sel) {
  const row = sel.closest('.rule-cond-row');
  const entity = row.querySelector('.rc-entity').value;
  const attrName = sel.value;
  const attrs = DR_ATTRS[entity] || [];
  const attr = attrs.find(a => a.name === attrName) || { type: 'text' };
  const ops = _drGetOperators(attr.type);
  const opSel = row.querySelector('.rc-op');
  const curOp = opSel.value;
  opSel.innerHTML = ops.map(o => '<option value="' + o.v + '"' + (curOp === o.v ? ' selected' : '') + '>' + o.l + '</option>').join('');
  const valWrap = row.querySelector('.rc-val-wrap');
  valWrap.innerHTML = _drValueInput(attr, opSel.value, '');
};

window.drOpChanged = function(sel) {
  const row = sel.closest('.rule-cond-row');
  const entity = row.querySelector('.rc-entity').value;
  const attrName = row.querySelector('.rc-attr').value;
  const attrs = DR_ATTRS[entity] || [];
  const attr = attrs.find(a => a.name === attrName) || { type: 'text' };
  const curVal = row.querySelector('.rc-val')?.value || '';
  const valWrap = row.querySelector('.rc-val-wrap');
  valWrap.innerHTML = _drValueInput(attr, sel.value, curVal);
};

window.showRuleForm = async function(editId) {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-inline"><div class="spinner"></div></div>';

  let rule = null;
  if (editId) rule = await fetch(`/api/decision-rules/${editId}`).then(r => r.json());
  const isEdit = !!rule;
  document.getElementById('page-title').textContent = isEdit ? 'Edit Decision Rule' : 'Create Decision Rule';

  const conditions = rule ? (rule.conditions || []) : [{ entity: 'contact', attribute: 'loyalty_tier', operator: 'equals', value: '' }];
  // Backfill connectors from legacy `logic` field
  if (rule?.logic && conditions.length > 1) {
    conditions.forEach((c, i) => { if (i > 0 && !c.connector) c.connector = rule.logic; });
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
              <div class="form-help">This description appears when selecting rules on offers and strategies</div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <h3 class="form-section-title" style="margin:0;display:flex;align-items:center;gap:8px">${OD_ICONS.rule} Build Query</h3>
            <div style="display:flex;align-items:center;gap:10px">
              <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#64748b;font-weight:500">Match:
                <select class="form-input" style="width:auto;font-size:12px;padding:4px 8px" onchange="drSetAllConnectors(this.value)">
                  <option value="AND">All conditions (AND)</option>
                  <option value="OR">Any condition (OR)</option>
                  <option value="custom">Custom per-row</option>
                </select>
              </label>
              <button type="button" class="btn btn-sm btn-secondary" onclick="drAddCondition()">+ Add Condition</button>
            </div>
          </div>
          <div id="rule-conditions" style="border:2px dashed #e5e7eb;border-radius:12px;padding:14px;background:#fefce8;min-height:60px">${conditions.map((c, i) => _drBuildCondRow(c, i, i === 0)).join('')}</div>
          <div style="text-align:center;padding:12px 0">
            <button type="button" style="background:none;border:2px dashed #d1d5db;border-radius:8px;padding:10px 24px;color:#9ca3af;font-size:12px;cursor:pointer;transition:all 0.15s" onmouseenter="this.style.borderColor='#6366f1';this.style.color='#6366f1'" onmouseleave="this.style.borderColor='#d1d5db';this.style.color='#9ca3af'" onclick="drAddCondition()">+ Add another condition</button>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="navigateTo('decision-rules','list')">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? ICONS.save + ' Update' : ICONS.sparkles + ' Create'} Rule</button>
        </div>
      </form>
    </div>`;

};

window.handleRuleSubmit = async function(event) {
  event.preventDefault();
  const editId = document.getElementById('rule-edit-id').value;
  const isEdit = !!editId;
  const rows = [...document.querySelectorAll('.rule-cond-row')];
  const conds = rows.map((row, i) => {
    const entity = row.querySelector('.rc-entity').value;
    const attribute = row.querySelector('.rc-attr').value;
    const operator = row.querySelector('.rc-op').value;
    let value = row.querySelector('.rc-val')?.value || '';
    if (['in', 'not_in'].includes(operator) && typeof value === 'string') {
      value = value.split(',').map(s => s.trim()).filter(Boolean);
    }
    const connector = i === 0 ? undefined : (row.dataset.connector || 'AND');
    return { entity, attribute, operator, value, ...(connector ? { connector } : {}) };
  });
  // Derive backward-compatible logic: if all connectors are the same, use that; otherwise 'MIXED'
  const connectors = conds.filter(c => c.connector).map(c => c.connector);
  const allSame = connectors.length === 0 || connectors.every(c => c === connectors[0]);
  const logic = allSame ? (connectors[0] || 'AND') : 'MIXED';
  const data = {
    name: document.getElementById('rule-name').value,
    description: document.getElementById('rule-desc').value,
    logic,
    conditions: conds
  };
  if (!data.name) { showToast('Name is required', 'error'); return; }
  if (conds.length === 0) { showToast('Add at least one condition', 'error'); return; }
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
        <div style="margin-bottom:16px;padding:12px;background:#fefce8;border:1px dashed #e5e7eb;border-radius:10px">
          <div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;margin-bottom:8px">Conditions</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">${(ruleRes.conditions || []).map((c, ci) => {
            const opLabel = { equals: '=', not_equals: '≠', contains: '~', not_contains: '!~', greater_than: '>', less_than: '<', greater_than_or_equal: '≥', less_than_or_equal: '≤', in: 'in', not_in: 'not in', is_empty: 'is empty', is_not_empty: 'is set', starts_with: 'starts', ends_with: 'ends', in_last: 'in last', not_in_last: 'not in last' }[c.operator] || c.operator.replace(/_/g, ' ');
            const val = Array.isArray(c.value) ? c.value.join(', ') : (c.value || '');
            const valStr = ['is_empty', 'is_not_empty'].includes(c.operator) ? '' : (' <strong>' + val + '</strong>');
            const conn = ci > 0 ? (c.connector || ruleRes.logic || 'AND') : '';
            const sep = conn ? '<span style="display:inline-flex;padding:1px 8px;border-radius:6px;font-size:10px;font-weight:700;' + (conn === 'OR' ? 'background:#fef3c7;color:#d97706' : 'background:#eef2ff;color:#6366f1') + '">' + conn + '</span>' : '';
            return sep + '<span style="display:inline-flex;align-items:center;gap:3px;padding:3px 10px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;font-size:12px;white-space:nowrap"><span style="color:#6366f1;font-weight:600">' + (c.entity !== 'contact' ? c.entity + '.' : '') + c.attribute.replace(/_/g, ' ') + '</span> <span style="color:#94a3b8">' + opLabel + '</span>' + valStr + '</span>';
          }).join('')}</div>
        </div>
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
    if (typeof ensureAllFoldersLoaded === 'function') await ensureAllFoldersLoaded();
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
      { id: 'status', label: 'Status' },
      { id: 'folder', label: 'Folder', visible: false }
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
        <td data-column-id="folder">${typeof folderCellHtml === 'function' ? folderCellHtml(s.folder_id) : ''}</td>
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
              <th data-column-id="folder">Folder</th>
              <th style="width:50px"></th>
            </tr></thead>
            <tbody>${tableRows || '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#6B7280">No strategies found</td></tr>'}</tbody>
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

  const [colRes, ruleRes, fRes, segRes2, aiModRes] = await Promise.all([
    fetch('/api/collections').then(r => r.json()),
    fetch('/api/decision-rules').then(r => r.json()),
    fetch('/api/decisions/ranking-formulas').then(r => r.json()),
    fetch('/api/segments').then(r => r.json()),
    fetch('/api/decisions/ai-models').then(r => r.json()),
    typeof ensureFolderPickerData === 'function' ? ensureFolderPickerData('selection_strategies') : Promise.resolve([])
  ]);
  const collections = colRes.collections || [];
  const rules = ruleRes.rules || [];
  const formulas = fRes.formulas || [];
  const stratSegments = (segRes2.segments || segRes2 || []);
  const aiModels = (aiModRes.models || []).filter(m => m.status === 'active');

  if (isEdit && typeof strategy === 'object' && !strategy.collection_id) {
    const full = await fetch(`/api/decisions/strategies/${strategy.id}`).then(r => r.json());
    strategy = { ...strategy, ...full };
  }

  const rankingMethod = strategy?.ranking_method || 'priority';
  const stratFolderId = strategy?.folder_id || (typeof getDefaultFolderForEntity === 'function' ? getDefaultFolderForEntity('selection_strategies') : null);

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
              <select id="strat-ranking" class="form-input" onchange="document.getElementById('strat-formula-group').style.display=this.value==='formula'?'':'none';document.getElementById('strat-model-group').style.display=this.value==='ai_model'?'':'none'">
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
              <div class="form-help"><a href="#" onclick="event.preventDefault();navigateTo('ranking-formulas','list')" style="color:#1473E6">Manage formulas</a></div>
            </div>
            <div class="form-group" id="strat-model-group" style="${rankingMethod === 'ai_model' ? '' : 'display:none'}">
              <label class="form-label">AI Model</label>
              <select id="strat-ai-model" class="form-input">
                <option value="">— None —</option>
                ${aiModels.map(m => `<option value="${m.id}" ${strategy?.ranking_model_id == m.id ? 'selected' : ''}>${m.name} (${m.type})</option>`).join('')}
              </select>
              <div class="form-help"><a href="#" onclick="event.preventDefault();navigateTo('ai-models','list')" style="color:#1473E6">Manage AI models</a></div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="form-section-title">Eligibility</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label">Eligibility Type</label>
              <select id="strat-elig-type" class="form-input" onchange="document.getElementById('strat-rule-panel').style.display=this.value==='rule'?'':'none';document.getElementById('strat-aud-panel').style.display=this.value==='audiences'?'':'none'">
                <option value="all" ${(!strategy?.eligibility_type || strategy?.eligibility_type === 'all') ? 'selected' : ''}>All visitors</option>
                <option value="audiences" ${strategy?.eligibility_type === 'audiences' ? 'selected' : ''}>By audience / segment</option>
                <option value="rule" ${strategy?.eligibility_type === 'rule' ? 'selected' : ''}>By decision rule</option>
              </select>
            </div>
            <div class="form-group form-grid-full" id="strat-aud-panel" style="display:${strategy?.eligibility_type === 'audiences' ? '' : 'none'}">
              <label class="form-label">Audiences</label>
              <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
                <span style="font-size:12px;font-weight:600">Match:</span>
                <select id="strat-aud-logic" class="form-input" style="width:auto"><option value="OR" ${strategy?.audience_logic !== 'AND' ? 'selected' : ''}>ANY (OR)</option><option value="AND" ${strategy?.audience_logic === 'AND' ? 'selected' : ''}>ALL (AND)</option></select>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;max-height:160px;overflow-y:auto;padding:8px;border:1px solid #e0e0e0;border-radius:8px">
                ${stratSegments.map(seg => {
                  const checked = (strategy?.eligibility_audience_ids || []).includes(seg.id);
                  return `<label style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border:1px solid #e0e0e0;border-radius:16px;font-size:12px;cursor:pointer;background:${checked ? '#e3f2fd' : '#fff'}"><input type="checkbox" class="strat-aud-cb" value="${seg.id}" ${checked ? 'checked' : ''}> ${seg.name}</label>`;
                }).join('') || '<span style="color:#999">No segments available</span>'}
              </div>
            </div>
            <div class="form-group form-grid-full" id="strat-rule-panel" style="display:${strategy?.eligibility_type === 'rule' ? '' : 'none'}">
              <label class="form-label">Eligibility Rule</label>
              <select id="strat-rule" class="form-input">
                <option value="">— No additional eligibility rule —</option>
                ${rules.map(r => `<option value="${r.id}" ${strategy?.eligibility_rule_id == r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        ${typeof folderPickerHtml === 'function' ? `<div class="form-section"><h3 class="form-section-title">Organization</h3><div class="form-grid">${folderPickerHtml('strategy-folder-id', 'selection_strategies', stratFolderId)}</div></div>` : ''}

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
  const eligType = document.getElementById('strat-elig-type')?.value || 'all';
  const data = {
    name: document.getElementById('strat-name').value,
    description: document.getElementById('strat-desc').value,
    collection_id: document.getElementById('strat-collection').value || null,
    ranking_method: document.getElementById('strat-ranking').value,
    ranking_formula_id: document.getElementById('strat-formula').value || null,
    ranking_model_id: document.getElementById('strat-ai-model')?.value || null,
    eligibility_type: eligType,
    eligibility_rule_id: eligType === 'rule' ? (document.getElementById('strat-rule')?.value || null) : null,
    eligibility_audience_ids: eligType === 'audiences' ? [...document.querySelectorAll('.strat-aud-cb:checked')].map(cb => parseInt(cb.value)) : [],
    audience_logic: document.getElementById('strat-aud-logic')?.value || 'OR',
    folder_id: typeof getSelectedFolderId === 'function' ? getSelectedFolderId('strategy-folder-id') : null
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
    if (typeof ensureAllFoldersLoaded === 'function') await ensureAllFoldersLoaded();
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
      { id: 'arbitration', label: 'Arbitration' },
      { id: 'propositions', label: 'Propositions' },
      { id: 'created_at', label: 'Created' },
      { id: 'folder', label: 'Folder', visible: false }
    ];

    const arbMethodLabel = { priority_order: 'Priority', weighted_score: 'Weighted', ai_optimized: 'AI' };

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
      const arb = d.arbitration || {};
      const arbLabel = arbMethodLabel[arb.method] || 'Priority';
      const arbDedup = arb.dedup_policy === 'allow_duplicates' ? '' : '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><path d="m9 12 2 2 4-4"/></svg>';
      return `<tr>
        <td data-column-id="name">${createTableLink(`<strong>${d.name}</strong>`, `showDecisionDetail(${d.id})`)}<div class="table-subtext">${d.description || ''}</div></td>
        <td data-column-id="status">${createStatusIndicator(d.status, d.status)}</td>
        <td data-column-id="placements" style="text-align:center;font-weight:600">${d.placement_count || 0}</td>
        <td data-column-id="arbitration"><span class="badge badge-info" title="${arbLabel} method, ${arb.dedup_policy === 'allow_duplicates' ? 'dupes allowed' : 'no duplicates'}, ${arb.tiebreak_rule || 'random'} tiebreak">${arbDedup} ${arbLabel}</span></td>
        <td data-column-id="propositions" style="text-align:center">${d.proposition_count || 0}</td>
        <td data-column-id="created_at" style="font-size:12px">${d.created_at ? new Date(d.created_at).toLocaleDateString() : '\u2014'}</td>
        <td data-column-id="folder">${typeof folderCellHtml === 'function' ? folderCellHtml(d.folder_id) : ''}</td>
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
              <th data-column-id="arbitration">Arbitration</th>
              <th data-column-id="propositions">Propositions</th>
              ${createSortableHeader('created_at', 'Created', currentTableSort)}
              <th data-column-id="folder">Folder</th>
              <th style="width:50px"></th>
            </tr></thead>
            <tbody>${tableRows || '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#6B7280">No decisions found</td></tr>'}</tbody>
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
            <div style="border:1px solid #e0e0e0;border-radius:8px;padding:16px;display:grid;grid-template-columns:1fr 1fr 1fr 80px;gap:12px">
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
              <div>
                <div style="font-size:11px;color:#888;margin-bottom:4px">Max Items</div>
                <strong style="font-size:18px;color:#1976D2">${pc.max_items || 1}</strong>
              </div>
            </div>
          `).join('')}
        </div>

        ${renderArbSummaryCard(decision.arbitration)}

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
    </div>

    <!-- Content Experiments (A/B Testing) — GAP 5 -->
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <h3 class="card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="M8 3H2v15h7c1.7 0 3 1.3 3 3V7c0-2.2-1.8-4-4-4z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14c0-1.7 1.3-3 3-3h7V3z"/></svg>
          Content Experiments
        </h3>
      </div>
      <div class="card-body" id="experiments-tab-container">
        <div class="loading-inline"><div class="spinner"></div></div>
      </div>
    </div>

    <!-- Arbitration Trace Simulator -->
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <h3 class="card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
          Arbitration Trace
        </h3>
      </div>
      <div class="card-body">
        <div class="form-help" style="margin-bottom:12px">Select a contact to see step-by-step how arbitration resolves offers for each placement.</div>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:16px">
          <input type="text" id="arb-trace-contact-search" class="form-input" style="max-width:300px" placeholder="Search contact by name..." oninput="searchArbTraceContacts(this.value)">
          <select id="arb-trace-contact-id" class="form-input" style="max-width:200px">
            <option value="">Pick a contact...</option>
          </select>
          <button class="btn btn-primary btn-sm" onclick="runArbTrace(${id})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
            Run Trace
          </button>
        </div>
        <div id="arb-trace-results"></div>
      </div>
    </div>`;

  // Load experiments tab
  setTimeout(() => showExperimentsTab(id), 100);
};

// ── Decision full-page form ──

window.renderDecisionForm = async function(decision) {
  const isEdit = !!decision;
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-inline"><div class="spinner"></div></div>';

  const [plRes, stRes, fbRes] = await Promise.all([
    fetch('/api/placements').then(r => r.json()),
    fetch('/api/decisions/strategies').then(r => r.json()),
    fetch('/api/offers?type=fallback').then(r => r.json()),
    typeof ensureFolderPickerData === 'function' ? ensureFolderPickerData('decisions') : Promise.resolve([])
  ]);
  const placements = plRes.placements || [];
  const strategies = stRes.strategies || [];
  const fallbacks = fbRes.offers || [];

  if (isEdit) {
    const full = await fetch(`/api/decisions/${decision.id}`).then(r => r.json());
    decision = { ...decision, ...full };
  }
  const decFolderId = decision?.folder_id || (typeof getDefaultFolderForEntity === 'function' ? getDefaultFolderForEntity('decisions') : null);

  const configs = decision ? (decision.placement_configs || []) : [{ placement_id: '', selection_strategy_id: '', fallback_offer_id: '' }];
  const arb = decision?.arbitration || {};

  // Helper to build a slot row
  function slotRow(pc, idx) {
    return `<div class="dec-slot" style="border:1px solid #e0e0e0;border-radius:8px;padding:16px;margin-bottom:8px;position:relative;background:#fafafa">
      <button type="button" style="position:absolute;top:8px;right:8px;border:none;background:none;cursor:pointer;color:#f44336" onclick="this.closest('.dec-slot').remove()">${OD_ICONS.trash}</button>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 80px;gap:12px">
        <div>
          <label class="form-label">Placement</label>
          <select class="form-input ds-pl">${placements.map(p => `<option value="${p.id}" ${pc.placement_id == p.id ? 'selected' : ''}>${p.name} (${p.channel})</option>`).join('')}</select>
        </div>
        <div>
          <label class="form-label">Selection Strategy</label>
          <select class="form-input ds-st"><option value="">None</option>${strategies.map(s => `<option value="${s.id}" ${pc.selection_strategy_id == s.id ? 'selected' : ''}>${s.name}</option>`).join('')}</select>
        </div>
        <div>
          <label class="form-label">Fallback Offer</label>
          <select class="form-input ds-fb"><option value="">None</option>${fallbacks.map(f => `<option value="${f.id}" ${pc.fallback_offer_id == f.id ? 'selected' : ''}>${f.name}</option>`).join('')}</select>
        </div>
        <div>
          <label class="form-label">Max Items</label>
          <input type="number" class="form-input ds-max" min="1" max="20" value="${pc.max_items || 1}">
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

        <!-- Arbitration Settings -->
        <div class="form-section">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <h3 class="form-section-title" style="margin:0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
              Arbitration
            </h3>
          </div>
          <div class="form-help" style="margin-bottom:16px">Arbitration controls how competing offers are resolved across placements — including deduplication, tiebreaking, suppression, and scoring.</div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Arbitration Method</label>
              <select id="arb-method" class="form-input" onchange="toggleArbWeights()">
                <option value="priority_order" ${(arb.method || 'priority_order') === 'priority_order' ? 'selected' : ''}>Priority Order (use strategy ranking)</option>
                <option value="weighted_score" ${arb.method === 'weighted_score' ? 'selected' : ''}>Weighted Score</option>
                <option value="ai_optimized" ${arb.method === 'ai_optimized' ? 'selected' : ''}>AI-Optimized</option>
              </select>
              <span class="form-help">How offers are scored and ranked across all placements</span>
            </div>
            <div class="form-group">
              <label class="form-label">Deduplication Policy</label>
              <select id="arb-dedup" class="form-input">
                <option value="no_duplicates" ${(arb.dedup_policy || 'no_duplicates') === 'no_duplicates' ? 'selected' : ''}>No duplicates across placements</option>
                <option value="allow_duplicates" ${arb.dedup_policy === 'allow_duplicates' ? 'selected' : ''}>Allow same offer in multiple placements</option>
              </select>
              <span class="form-help">Whether the same offer can appear in more than one placement</span>
            </div>
            <div class="form-group">
              <label class="form-label">Tiebreak Rule</label>
              <select id="arb-tiebreak" class="form-input">
                <option value="random" ${(arb.tiebreak_rule || 'random') === 'random' ? 'selected' : ''}>Random</option>
                <option value="most_recent" ${arb.tiebreak_rule === 'most_recent' ? 'selected' : ''}>Most recently created</option>
                <option value="least_shown" ${arb.tiebreak_rule === 'least_shown' ? 'selected' : ''}>Least shown to this contact</option>
                <option value="offer_id_asc" ${arb.tiebreak_rule === 'offer_id_asc' ? 'selected' : ''}>Offer ID (ascending)</option>
              </select>
              <span class="form-help">How to break ties when offers have identical scores</span>
            </div>
            <div class="form-group">
              <label class="form-label">Suppression Window (hours)</label>
              <select id="arb-suppression" class="form-input">
                <option value="0" ${(!arb.suppression_window_hours || arb.suppression_window_hours === 0) ? 'selected' : ''}>None (no suppression)</option>
                <option value="1" ${arb.suppression_window_hours === 1 ? 'selected' : ''}>1 hour</option>
                <option value="6" ${arb.suppression_window_hours === 6 ? 'selected' : ''}>6 hours</option>
                <option value="12" ${arb.suppression_window_hours === 12 ? 'selected' : ''}>12 hours</option>
                <option value="24" ${arb.suppression_window_hours === 24 ? 'selected' : ''}>24 hours</option>
                <option value="48" ${arb.suppression_window_hours === 48 ? 'selected' : ''}>48 hours</option>
                <option value="72" ${arb.suppression_window_hours === 72 ? 'selected' : ''}>72 hours</option>
                <option value="168" ${arb.suppression_window_hours === 168 ? 'selected' : ''}>7 days</option>
              </select>
              <span class="form-help">Skip offers recently shown to the same contact within this window</span>
            </div>
            <div class="form-group">
              <label class="form-label">Global Offer Limit</label>
              <select id="arb-global-limit" class="form-input">
                <option value="0" ${(!arb.global_offer_limit || arb.global_offer_limit === 0) ? 'selected' : ''}>No limit</option>
                <option value="1" ${arb.global_offer_limit === 1 ? 'selected' : ''}>1 offer total</option>
                <option value="2" ${arb.global_offer_limit === 2 ? 'selected' : ''}>2 offers total</option>
                <option value="3" ${arb.global_offer_limit === 3 ? 'selected' : ''}>3 offers total</option>
                <option value="5" ${arb.global_offer_limit === 5 ? 'selected' : ''}>5 offers total</option>
                <option value="10" ${arb.global_offer_limit === 10 ? 'selected' : ''}>10 offers total</option>
              </select>
              <span class="form-help">Maximum total offers across all placements in one resolution</span>
            </div>
          </div>

          <!-- Weighted score sliders (only visible when method = weighted_score) -->
          <div id="arb-weights-panel" style="display:${arb.method === 'weighted_score' ? 'block' : 'none'};margin-top:16px;background:var(--bg-secondary, #f8fafc);border:1px solid var(--border-default, #e2e8f0);border-radius:8px;padding:16px">
            <div style="font-size:13px;font-weight:600;margin-bottom:12px;color:var(--text-primary, #1e293b)">Score Weights</div>
            <div class="form-help" style="margin-bottom:12px">Adjust the relative importance of each factor. Weights should sum to 100%.</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
              <div>
                <label class="form-label">Priority Weight</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <input type="range" id="arb-w-priority" min="0" max="100" value="${arb.priority_weight || 60}" style="flex:1" oninput="updateArbWeightLabel(this)">
                  <span class="arb-w-val" style="min-width:36px;text-align:right;font-size:12px;font-weight:600">${arb.priority_weight || 60}%</span>
                </div>
                <span class="form-help">Offer priority score</span>
              </div>
              <div>
                <label class="form-label">Recency Weight</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <input type="range" id="arb-w-recency" min="0" max="100" value="${arb.recency_weight || 20}" style="flex:1" oninput="updateArbWeightLabel(this)">
                  <span class="arb-w-val" style="min-width:36px;text-align:right;font-size:12px;font-weight:600">${arb.recency_weight || 20}%</span>
                </div>
                <span class="form-help">Newer offers score higher</span>
              </div>
              <div>
                <label class="form-label">Performance Weight</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <input type="range" id="arb-w-performance" min="0" max="100" value="${arb.performance_weight || 20}" style="flex:1" oninput="updateArbWeightLabel(this)">
                  <span class="arb-w-val" style="min-width:36px;text-align:right;font-size:12px;font-weight:600">${arb.performance_weight || 20}%</span>
                </div>
                <span class="form-help">Historical click/conversion rates</span>
              </div>
            </div>
            <div id="arb-weight-total" style="margin-top:8px;font-size:12px;text-align:right;font-weight:600"></div>
          </div>

          <!-- How it works info -->
          <div style="margin-top:16px;background:var(--bg-secondary, #f8fafc);border:1px solid var(--border-default, #e2e8f0);border-radius:8px;padding:12px 16px">
            <div style="display:flex;align-items:flex-start;gap:10px">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-info, #3b82f6)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <div style="font-size:12px;color:var(--text-secondary, #64748b);line-height:1.6">
                <strong style="color:var(--text-primary, #1e293b)">How arbitration works:</strong><br>
                <strong>1.</strong> Each placement resolves its candidate offers via collection + eligibility + capping.<br>
                <strong>2.</strong> Offers are ranked using the selected arbitration method.<br>
                <strong>3.</strong> Deduplication removes offers already selected for prior placements.<br>
                <strong>4.</strong> Suppression filters out recently shown offers.<br>
                <strong>5.</strong> Tiebreak resolves identical scores.<br>
                <strong>6.</strong> Global limit caps the total offers across all placements.
              </div>
            </div>
          </div>
        </div>

        ${typeof folderPickerHtml === 'function' ? `<div class="form-section"><h3 class="form-section-title">Organization</h3><div class="form-grid">${folderPickerHtml('decision-folder-id', 'decisions', decFolderId)}</div></div>` : ''}

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="navigateTo('decisions','list')">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? ICONS.save + ' Update' : ICONS.sparkles + ' Create'} Decision</button>
        </div>
      </form>
    </div>`;

  window._decSlotRow = () => slotRow({ placement_id: '', selection_strategy_id: '', fallback_offer_id: '' }, Date.now());
  if (arb.method === 'weighted_score') updateArbWeightTotal();
};

/* ── Arbitration UI helpers ── */

window.toggleArbWeights = function() {
  const method = document.getElementById('arb-method')?.value;
  const panel = document.getElementById('arb-weights-panel');
  if (panel) panel.style.display = method === 'weighted_score' ? 'block' : 'none';
};

window.updateArbWeightLabel = function(input) {
  const span = input.nextElementSibling;
  if (span) span.textContent = input.value + '%';
  updateArbWeightTotal();
};

window.updateArbWeightTotal = function() {
  const p = parseInt(document.getElementById('arb-w-priority')?.value || 0);
  const r = parseInt(document.getElementById('arb-w-recency')?.value || 0);
  const f = parseInt(document.getElementById('arb-w-performance')?.value || 0);
  const total = p + r + f;
  const el = document.getElementById('arb-weight-total');
  if (el) {
    const color = total === 100 ? 'var(--color-success, #10b981)' : 'var(--color-warning, #f59e0b)';
    el.innerHTML = `Total: <span style="color:${color}">${total}%</span>${total !== 100 ? ' <span style="color:var(--color-warning, #f59e0b)">(should be 100%)</span>' : ' ✓'}`;
  }
};

window.handleDecisionSubmit = async function(event) {
  event.preventDefault();
  const editId = document.getElementById('dec-edit-id').value;
  const isEdit = !!editId;
  const slots = [...document.querySelectorAll('.dec-slot')].map(slot => ({
    placement_id: slot.querySelector('.ds-pl').value,
    selection_strategy_id: slot.querySelector('.ds-st').value || null,
    fallback_offer_id: slot.querySelector('.ds-fb').value || null,
    max_items: parseInt(slot.querySelector('.ds-max')?.value) || 1
  }));
  const data = {
    name: document.getElementById('dec-name').value,
    description: document.getElementById('dec-desc').value,
    placement_configs: slots,
    folder_id: typeof getSelectedFolderId === 'function' ? getSelectedFolderId('decision-folder-id') : null,
    arbitration: {
      method: document.getElementById('arb-method')?.value || 'priority_order',
      dedup_policy: document.getElementById('arb-dedup')?.value || 'no_duplicates',
      tiebreak_rule: document.getElementById('arb-tiebreak')?.value || 'random',
      suppression_window_hours: parseInt(document.getElementById('arb-suppression')?.value) || 0,
      global_offer_limit: parseInt(document.getElementById('arb-global-limit')?.value) || 0,
      priority_weight: parseInt(document.getElementById('arb-w-priority')?.value) || 60,
      recency_weight: parseInt(document.getElementById('arb-w-recency')?.value) || 20,
      performance_weight: parseInt(document.getElementById('arb-w-performance')?.value) || 20
    }
  };
  if (!data.name) { showToast('Name is required', 'error'); return; }
  const url = isEdit ? `/api/decisions/${editId}` : '/api/decisions';
  await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  showToast(isEdit ? 'Decision updated' : 'Decision created');
  navigateTo('decisions', 'list');
};

// ── Simulation full-page view ──

/* ── Arbitration summary card (read-only detail view) ── */
function renderArbSummaryCard(arb) {
  if (!arb || !arb.method) {
    return `
      <h4 style="margin:20px 0 12px;font-size:14px">Arbitration Settings</h4>
      <div style="color:var(--text-secondary, #64748b);font-size:13px;padding:12px;background:var(--bg-secondary, #f8fafc);border-radius:8px">
        Default arbitration (priority order, no duplicates, random tiebreak)
      </div>`;
  }
  const labels = {
    method: { priority_order: 'Priority Order', weighted_score: 'Weighted Score', ai_optimized: 'AI-Optimized' },
    dedup: { no_duplicates: 'No duplicates across placements', allow_duplicates: 'Allow duplicates' },
    tiebreak: { random: 'Random', most_recent: 'Most recent', least_shown: 'Least shown', offer_id_asc: 'Offer ID ascending' }
  };
  const pills = [
    { label: 'Method', value: labels.method[arb.method] || arb.method, icon: '⚖️' },
    { label: 'Dedup', value: labels.dedup[arb.dedup_policy] || arb.dedup_policy, icon: '🔁' },
    { label: 'Tiebreak', value: labels.tiebreak[arb.tiebreak_rule] || arb.tiebreak_rule, icon: '🎯' }
  ];
  if (arb.suppression_window_hours > 0) pills.push({ label: 'Suppression', value: arb.suppression_window_hours + 'h window', icon: '⏳' });
  if (arb.global_offer_limit > 0) pills.push({ label: 'Global limit', value: arb.global_offer_limit + ' offers max', icon: '🔢' });
  if (arb.method === 'weighted_score') {
    pills.push({ label: 'Weights', value: `P:${arb.priority_weight}% R:${arb.recency_weight}% F:${arb.performance_weight}%`, icon: '📊' });
  }
  return `
    <h4 style="margin:20px 0 12px;font-size:14px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
      Arbitration Settings
    </h4>
    <div style="display:flex;flex-wrap:wrap;gap:8px">
      ${pills.map(p => `
        <div class="arb-pill">
          <span class="arb-pill-icon">${p.icon}</span>
          <span class="arb-pill-label">${p.label}:</span>
          <span class="arb-pill-value">${p.value}</span>
        </div>
      `).join('')}
    </div>`;
}

/* ── Arbitration trace search + runner ── */
window.searchArbTraceContacts = async function(term) {
  const sel = document.getElementById('arb-trace-contact-id');
  if (!sel || term.length < 2) return;
  try {
    const resp = await fetch(`/api/contacts?search=${encodeURIComponent(term)}&limit=20`);
    const data = await resp.json();
    const contacts = data.contacts || data || [];
    sel.innerHTML = '<option value="">Pick a contact...</option>' +
      contacts.slice(0, 20).map(c => `<option value="${c.id}">${c.first_name} ${c.last_name} (${c.email})</option>`).join('');
  } catch (e) { /* ignore */ }
};

window.runArbTrace = async function(decisionId) {
  const contactId = document.getElementById('arb-trace-contact-id')?.value;
  if (!contactId) { showToast('Please select a contact first', 'error'); return; }
  const container = document.getElementById('arb-trace-results');
  if (!container) return;
  container.innerHTML = '<div class="loading-inline"><div class="spinner"></div></div>';

  try {
    const resp = await fetch(`/api/decisions/${decisionId}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_id: parseInt(contactId), trace: true })
    });
    const result = await resp.json();
    renderArbTraceResults(container, result);
  } catch (e) {
    container.innerHTML = `<div class="text-danger">Error: ${e.message}</div>`;
  }
};

function renderArbTraceResults(container, result) {
  const traces = result.arbitration_trace || [];
  const placements = result.placements || [];

  if (traces.length === 0) {
    container.innerHTML = '<div style="color:var(--text-secondary);padding:16px">No arbitration trace available. Ensure the decision has placement slots configured.</div>';
    return;
  }

  const stepIcons = {
    collection_resolve: '📦', date_range: '📅', representation_check: '🖼️',
    strategy_eligibility: '🛡️', offer_eligibility: '👤', capping_constraints: '🔒',
    suppression_window: '⏳', deduplication: '🔁', global_limit: '🔢',
    ranking: '📊', fallback: '🔄', final_selection: '✅'
  };
  const stepLabels = {
    collection_resolve: 'Collection Resolve', date_range: 'Date Range Filter',
    representation_check: 'Representation Check', strategy_eligibility: 'Strategy Eligibility',
    offer_eligibility: 'Offer Eligibility', capping_constraints: 'Capping Constraints',
    suppression_window: 'Suppression Window', deduplication: 'Deduplication',
    global_limit: 'Global Offer Limit', ranking: 'Ranking',
    fallback: 'Fallback', final_selection: 'Final Selection'
  };

  let html = '';
  traces.forEach((t, idx) => {
    const placement = placements[idx];
    const selectedOffer = placement?.offers?.[0];
    html += `
      <div class="arb-trace-placement">
        <div class="arb-trace-placement-header">
          <div>
            <strong>${t.placement_name}</strong>
            <span style="font-size:11px;color:var(--text-secondary, #64748b);margin-left:8px">Placement #${t.placement_id}</span>
          </div>
          <div>
            ${selectedOffer ? `<span class="badge ${selectedOffer.is_fallback ? 'badge-warning' : 'badge-success'}">${selectedOffer.is_fallback ? 'Fallback' : 'Selected'}: ${selectedOffer.offer_name}</span>` : '<span class="badge badge-secondary">No offer</span>'}
          </div>
        </div>
        <div class="arb-trace-steps">
          ${t.steps.map(s => {
            const icon = stepIcons[s.step] || '•';
            const label = stepLabels[s.step] || s.step;
            const isReduction = s.removed > 0;
            const isFinal = s.step === 'final_selection';
            return `
              <div class="arb-trace-step ${isFinal ? 'arb-trace-step-final' : ''} ${isReduction ? 'arb-trace-step-reduction' : ''}">
                <span class="arb-trace-step-icon">${icon}</span>
                <span class="arb-trace-step-label">${label}</span>
                ${s.count !== undefined ? `<span class="arb-trace-step-count">${s.count} remaining</span>` : ''}
                ${s.removed > 0 ? `<span class="arb-trace-step-removed">-${s.removed}</span>` : ''}
                ${s.detail ? `<span class="arb-trace-step-detail">${s.detail}</span>` : ''}
                ${isFinal && s.offers ? `<div class="arb-trace-final-offers">${s.offers.map(o => `<span class="arb-trace-offer-chip ${o.is_fallback ? 'fallback' : ''}">${o.name}${o.score !== undefined && o.score !== null ? ` (${typeof o.score === 'number' ? o.score.toFixed(1) : o.score})` : ''}</span>`).join('')}</div>` : ''}
              </div>`;
          }).join('')}
        </div>
      </div>`;
  });

  container.innerHTML = html;
}

window.showSimulatePage = async function(decisionId) {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-inline"><div class="spinner"></div></div>';
  document.getElementById('page-title').textContent = 'Simulation Results';

  // Fetch context schema for simulation context input
  let ctxSchema = [];
  try { const cs = await fetch('/api/decisions/context-schema').then(r => r.json()); ctxSchema = cs.attributes || []; } catch (_e) {}

  const contextData = {};
  ctxSchema.forEach(a => { if (a.example_value) contextData[a.name] = a.example_value; });

  const simRes = await fetch(`/api/decisions/${decisionId}/simulate-batch`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sample_size: 20, context: contextData })
  }).then(r => r.json());

  const results = simRes.results || [];
  const summary = simRes.summary || {};

  content.innerHTML = `
    <div style="margin-bottom:12px">
      <button class="btn btn-secondary btn-sm" onclick="showDecisionDetail(${decisionId})" style="display:inline-flex;align-items:center;gap:4px">
        ${BACK_SVG} Back to Decision
      </button>
    </div>

    ${ctxSchema.length > 0 ? `
    <div class="card" style="margin-bottom:16px">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
        <h3 class="card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Context Data
        </h3>
        <button class="btn btn-sm btn-primary" onclick="rerunSimulation(${decisionId})">Re-run with Context</button>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">
          ${ctxSchema.map(a => `
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-size:12px">${a.label || a.name}</label>
              <input type="text" class="form-input sim-ctx-input" data-ctx-name="${a.name}" value="${contextData[a.name] || ''}" placeholder="${a.example_value || ''}" style="font-size:12px">
              ${a.description ? `<div class="form-help">${a.description}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>` : ''}

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

    <div class="card" id="sim-results-table">
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

window.rerunSimulation = async function(decisionId) {
  const contextData = {};
  document.querySelectorAll('.sim-ctx-input').forEach(inp => {
    const name = inp.getAttribute('data-ctx-name');
    const val = inp.value.trim();
    if (name && val) contextData[name] = isNaN(val) ? val : Number(val);
  });
  const container = document.getElementById('sim-results-table');
  if (container) container.innerHTML = '<div class="loading-inline" style="padding:24px"><div class="spinner"></div></div>';
  try {
    const simRes = await fetch(`/api/decisions/${decisionId}/simulate-batch`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sample_size: 20, context: contextData })
    }).then(r => r.json());
    const results = simRes.results || [];
    if (container) {
      container.innerHTML = `
        <div class="card-header"><h3 class="card-title">Per-Contact Results</h3></div>
        <div class="card-body" style="padding:0">
          <table class="data-table" style="width:100%">
            <thead><tr><th>Contact</th><th>Placement</th><th>Offer</th><th>Fallback?</th></tr></thead>
            <tbody>${results.map(r => {
              if (r.error) return '<tr><td>' + r.contact_id + '</td><td colspan="3" style="color:red">' + r.error + '</td></tr>';
              return (r.placements || []).map(p => '<tr><td><strong>' + r.contact_name + '</strong></td><td>' + p.placement + '</td><td><strong>' + p.offer + '</strong></td><td>' + (p.fallback_used ? '<span style="color:#FF9800;font-weight:600">Yes</span>' : '<span style="color:#4CAF50">No</span>') + '</td></tr>').join('');
            }).join('')}</tbody>
          </table>
        </div>`;
    }
    showToast('Simulation re-run with updated context');
  } catch (e) {
    if (container) container.innerHTML = '<div style="padding:24px;color:red">Error: ' + e.message + '</div>';
  }
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


// ══════════════════════════════════════════════════════
//  7. ITEM CATALOG (Custom Attributes Schema) — GAP 1
// ══════════════════════════════════════════════════════

window.loadItemCatalog = async function() {
  const content = document.getElementById('content');
  showLoading();
  try {
    const res = await fetch('/api/collections/catalog-schema').then(r => r.json());
    const attrs = res.attributes || [];

    const typeLabels = { string: 'String', integer: 'Integer', boolean: 'Boolean', date: 'Date', datetime: 'DateTime', object: 'Object', asset: 'Decisioning Asset' };

    const tableRows = attrs.map(a => {
      return `<tr>
        <td><strong>${a.label || a.name}</strong><div class="table-subtext"><code>${a.name}</code></div></td>
        <td><span class="badge badge-info">${typeLabels[a.type] || a.type}</span></td>
        <td style="text-align:center">${a.required ? '<span style="color:#4CAF50;font-weight:600">Yes</span>' : '<span style="color:#999">No</span>'}</td>
        <td style="font-size:12px;color:#666">${a.default_value != null ? String(a.default_value) : '\u2014'}</td>
        <td style="font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis">${a.description || '\u2014'}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm btn-secondary" onclick="showCatalogAttrForm(${a.id})">${OD_ICONS.edit}</button>
            <button class="btn btn-sm btn-danger" onclick="deleteCatalogAttr(${a.id})">${OD_ICONS.trash}</button>
          </div>
        </td>
      </tr>`;
    }).join('');

    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${OD_ICONS.collection} Item Catalog Schema</h3>
          <button class="btn btn-primary" onclick="showCatalogAttrForm()">+ Add Custom Attribute</button>
        </div>
        <div class="card-body">
          <div class="form-help" style="margin-bottom:16px">Define custom attributes for decision items (offers). These attributes appear on the offer create/edit form and can be used in collection filters and ranking formulas. Up to 100 attributes supported.</div>
          ${attrs.length === 0 ? '<div style="text-align:center;padding:24px;color:#999">No custom attributes defined yet. Click "Add Custom Attribute" to get started.</div>' : `
          <div class="data-table-container">
            <table class="data-table">
              <thead><tr><th>Attribute</th><th>Type</th><th>Required</th><th>Default</th><th>Description</th><th style="width:100px">Actions</th></tr></thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>`}
        </div>
      </div>`;
  } catch (e) {
    showError('Failed to load catalog schema');
  } finally {
    hideLoading();
  }
};

window.showCatalogAttrForm = async function(editId) {
  let attr = null;
  if (editId) attr = await fetch(`/api/collections/catalog-schema`).then(r => r.json()).then(d => (d.attributes || []).find(a => a.id === editId));

  const html = `<div class="modal-overlay" id="catalog-attr-modal" onclick="if(event.target===this)this.remove()">
    <div class="modal" style="max-width:500px">
      <div class="modal-header"><h3>${attr ? 'Edit' : 'Add'} Custom Attribute</h3><button class="modal-close" onclick="document.getElementById('catalog-attr-modal').remove()">&times;</button></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label form-label-required">Internal Name</label><input type="text" id="ca-name" class="form-input" value="${attr?.name || ''}" placeholder="e.g., product_category" ${attr ? 'readonly style="background:#f5f5f5"' : ''}><div class="form-help">Unique machine-readable name (no spaces)</div></div>
        <div class="form-group"><label class="form-label form-label-required">Display Label</label><input type="text" id="ca-label" class="form-input" value="${attr?.label || ''}" placeholder="e.g., Product Category"></div>
        <div class="form-group"><label class="form-label">Type</label><select id="ca-type" class="form-input">
          <option value="string" ${attr?.type === 'string' ? 'selected' : ''}>String</option>
          <option value="integer" ${attr?.type === 'integer' ? 'selected' : ''}>Integer</option>
          <option value="boolean" ${attr?.type === 'boolean' ? 'selected' : ''}>Boolean</option>
          <option value="date" ${attr?.type === 'date' ? 'selected' : ''}>Date</option>
          <option value="datetime" ${attr?.type === 'datetime' ? 'selected' : ''}>DateTime</option>
          <option value="object" ${attr?.type === 'object' ? 'selected' : ''}>Object</option>
          <option value="asset" ${attr?.type === 'asset' ? 'selected' : ''}>Decisioning Asset (URL)</option>
        </select></div>
        <div class="form-group"><label class="form-label">Required</label><select id="ca-required" class="form-input"><option value="false" ${!attr?.required ? 'selected' : ''}>No</option><option value="true" ${attr?.required ? 'selected' : ''}>Yes</option></select></div>
        <div class="form-group"><label class="form-label">Default Value</label><input type="text" id="ca-default" class="form-input" value="${attr?.default_value != null ? attr.default_value : ''}" placeholder="Optional default"></div>
        <div class="form-group"><label class="form-label">Description</label><input type="text" id="ca-desc" class="form-input" value="${attr?.description || ''}" placeholder="Brief description"></div>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary" onclick="document.getElementById('catalog-attr-modal').remove()">Cancel</button><button class="btn btn-primary" onclick="saveCatalogAttr(${editId || 'null'})">${attr ? 'Update' : 'Create'}</button></div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
};

window.saveCatalogAttr = async function(editId) {
  const data = {
    name: document.getElementById('ca-name').value,
    label: document.getElementById('ca-label').value,
    type: document.getElementById('ca-type').value,
    required: document.getElementById('ca-required').value === 'true',
    default_value: document.getElementById('ca-default').value || null,
    description: document.getElementById('ca-desc').value
  };
  if (!data.name || !data.label) { showToast('Name and label are required', 'error'); return; }
  const url = editId ? `/api/collections/catalog-schema/${editId}` : '/api/collections/catalog-schema';
  const method = editId ? 'PUT' : 'POST';
  const resp = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!resp.ok) { const err = await resp.json(); showToast(err.error || 'Error', 'error'); return; }
  document.getElementById('catalog-attr-modal')?.remove();
  showToast(editId ? 'Attribute updated' : 'Attribute created');
  window.loadItemCatalog();
};

window.deleteCatalogAttr = async function(id) {
  if (!confirm('Delete this custom attribute?')) return;
  await fetch(`/api/collections/catalog-schema/${id}`, { method: 'DELETE' });
  showToast('Attribute deleted');
  window.loadItemCatalog();
};


// ══════════════════════════════════════════════════════
//  8. RANKING FORMULAS UI — GAP 2
// ══════════════════════════════════════════════════════

window.loadRankingFormulas = async function() {
  const content = document.getElementById('content');
  showLoading();
  try {
    const [res, stratRes] = await Promise.all([
      fetch('/api/decisions/ranking-formulas').then(r => r.json()),
      fetch('/api/decisions/strategies').then(r => r.json()).catch(() => ({ strategies: [] }))
    ]);
    const formulas = res.formulas || [];
    const strategies = stratRes.strategies || [];

    const tableRows = formulas.map(f => {
      const usedBy = strategies.filter(s => s.ranking_formula_id === f.id);
      const actions = [
        { icon: OD_ICONS.edit, label: 'Edit', onclick: `showFormulaForm(${f.id})` },
        { divider: true },
        { icon: OD_ICONS.trash, label: 'Delete', onclick: `deleteFormula(${f.id})`, danger: true }
      ];
      return `<tr>
        <td>${createTableLink(`<strong>${f.name}</strong>`, `showFormulaForm(${f.id})`)}<div class="table-subtext">${f.description || ''}</div></td>
        <td><div style="background:#1e1e2e;color:#a6e3a1;padding:6px 10px;border-radius:6px;font-family:monospace;font-size:11px;max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${(f.expression || '').replace(/"/g, '&quot;')}">${f.expression || '—'}</div></td>
        <td>${usedBy.length > 0 ? usedBy.map(s => '<span style="display:inline-flex;padding:2px 8px;background:#eef2ff;border-radius:10px;font-size:11px;margin:1px">' + s.name + '</span>').join('') : '<span style="color:#94a3b8;font-size:11px">Not used</span>'}</td>
        <td>${createStatusIndicator(f.status || 'active', f.status || 'active')}</td>
        <td>${createActionMenu(f.id + 5000, actions)}</td>
      </tr>`;
    }).join('');

    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${OD_ICONS.chart} Ranking Formulas</h3>
          <button class="btn btn-primary" onclick="showFormulaForm()">+ Create Formula</button>
        </div>
        <div class="card-body">
          <div class="form-help" style="margin-bottom:16px">Ranking formulas define custom expressions to score and order eligible offers. They are used inside Selection Strategies.</div>
          ${formulas.length === 0 ? '<div style="text-align:center;padding:40px;color:#94a3b8"><div style="font-size:32px;margin-bottom:8px">𝑓(𝑥)</div><div style="font-size:14px">No ranking formulas yet</div><div style="font-size:12px;margin-top:4px">Create one to use custom scoring in your strategies</div></div>' : `
          <div class="data-table-container">
            <table class="data-table"><thead><tr><th>Name</th><th>Expression</th><th>Used By Strategies</th><th>Status</th><th style="width:50px"></th></tr></thead>
            <tbody>${tableRows}</tbody></table>
          </div>`}
        </div>
      </div>`;
  } catch (e) { showError('Failed to load ranking formulas'); } finally { hideLoading(); }
};

window.showFormulaForm = async function(editId) {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-inline"><div class="spinner"></div></div>';

  let formula = null;
  if (editId) {
    const res = await fetch('/api/decisions/ranking-formulas').then(r => r.json());
    formula = (res.formulas || []).find(f => f.id === editId);
  }
  const isEdit = !!formula;
  document.getElementById('page-title').textContent = isEdit ? 'Edit Ranking Formula' : 'Create Ranking Formula';

  let catalogAttrs = [];
  try { catalogAttrs = await fetch('/api/collections/catalog-schema').then(r => r.json()); } catch (_) {}
  if (!Array.isArray(catalogAttrs)) catalogAttrs = [];

  let contextAttrs = [];
  try { contextAttrs = await fetch('/api/decisions/context-schema').then(r => r.json()); } catch (_) {}
  if (!Array.isArray(contextAttrs)) contextAttrs = [];
  contextAttrs = (contextAttrs.attributes || contextAttrs || []);

  const offerVars = [
    { code: 'offer.priority', desc: 'Priority score (0-100)', type: 'number' },
    { code: 'offer.id', desc: 'Offer ID', type: 'number' },
    ...catalogAttrs.filter(a => a.type === 'integer' || a.type === 'number').map(a => ({ code: 'offer.' + a.name, desc: a.label + ' (custom)', type: 'number' }))
  ];
  const profileVars = [
    { code: 'profile.engagement_score', desc: 'Engagement Score' },
    { code: 'profile.lifetime_value', desc: 'Lifetime Value' },
    { code: 'profile.total_purchases', desc: 'Total Purchases' },
    { code: 'profile.loyalty_points', desc: 'Loyalty Points' },
    { code: 'profile.average_order_value', desc: 'Avg Order Value' },
    { code: 'profile.referral_count', desc: 'Referral Count' }
  ];
  const contextVars = [
    { code: 'context.page_type', desc: 'Page type' },
    { code: 'context.device_type', desc: 'Device type' },
    ...contextAttrs.filter(a => a.type === 'integer' || a.type === 'number').map(a => ({ code: 'context.' + a.name, desc: a.label || a.name }))
  ];

  const varSection = (title, icon, vars, color) => `
    <div style="margin-bottom:12px">
      <div style="font-size:11px;font-weight:700;color:${color};text-transform:uppercase;margin-bottom:6px">${icon} ${title}</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">${vars.map(v =>
        `<button type="button" class="rf-var-btn" onclick="rfInsertVar('${v.code}')" title="${v.desc}" style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;font-size:11px;font-family:monospace;cursor:pointer;transition:all 0.15s;color:#334155" onmouseenter="this.style.borderColor='${color}';this.style.background='${color}11'" onmouseleave="this.style.borderColor='#e2e8f0';this.style.background='#fff'">${v.code}</button>`
      ).join('')}</div>
    </div>`;

  const presetFormulas = [
    { label: 'Priority only', expr: 'offer.priority' },
    { label: 'Priority + Engagement', expr: 'offer.priority * 0.6 + profile.engagement_score * 0.4' },
    { label: 'LTV weighted', expr: 'offer.priority * 0.3 + profile.lifetime_value * 0.007' },
    { label: 'Balanced', expr: '(offer.priority * 2 + profile.engagement_score + profile.total_purchases * 0.5) / 3' }
  ];

  content.innerHTML = `
    <div class="form-container">
      <form id="rf-form" onsubmit="saveFormula(event, ${editId || 'null'})">
        <div class="form-section">
          <h3 class="form-section-title">Formula Details</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label form-label-required">Name</label>
              <input type="text" id="rf-name" class="form-input" value="${formula?.name || ''}" required placeholder="e.g., Priority + Recency Boost">
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <input type="text" id="rf-desc" class="form-input" value="${formula?.description || ''}" placeholder="What this formula optimizes for">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="form-section-title" style="margin-bottom:4px">Expression Editor</h3>
          <div class="form-help" style="margin-bottom:12px">Write a mathematical expression using offer, profile, and context variables. Click any variable below to insert it.</div>
          <div style="display:grid;grid-template-columns:1fr 280px;gap:16px">
            <div>
              <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
                <span style="font-size:11px;color:#64748b;padding:4px 0;font-weight:500">Presets:</span>
                ${presetFormulas.map(p => `<button type="button" class="btn btn-sm btn-secondary" style="font-size:10px;padding:2px 8px;font-family:monospace" onclick="document.getElementById('rf-expr').value='${p.expr}';rfHighlightExpr()">${p.label}</button>`).join('')}
              </div>
              <div style="position:relative;border:2px solid #e2e8f0;border-radius:10px;overflow:hidden;transition:border-color 0.2s" onfocuswithin="this.style.borderColor='#6366f1'" onfocusout="this.style.borderColor='#e2e8f0'">
                <div style="background:#1e1e2e;padding:4px 12px;display:flex;align-items:center;justify-content:space-between">
                  <span style="font-size:10px;color:#6b7280;font-family:monospace">f(offer, profile, context) = </span>
                  <div style="display:flex;gap:4px">
                    <button type="button" class="btn btn-sm" style="padding:1px 6px;font-size:10px;background:#374151;color:#9ca3af;border:1px solid #4b5563;border-radius:4px" onclick="rfInsertOp('+')">+</button>
                    <button type="button" class="btn btn-sm" style="padding:1px 6px;font-size:10px;background:#374151;color:#9ca3af;border:1px solid #4b5563;border-radius:4px" onclick="rfInsertOp('-')">−</button>
                    <button type="button" class="btn btn-sm" style="padding:1px 6px;font-size:10px;background:#374151;color:#9ca3af;border:1px solid #4b5563;border-radius:4px" onclick="rfInsertOp('*')">×</button>
                    <button type="button" class="btn btn-sm" style="padding:1px 6px;font-size:10px;background:#374151;color:#9ca3af;border:1px solid #4b5563;border-radius:4px" onclick="rfInsertOp('/')">/</button>
                    <button type="button" class="btn btn-sm" style="padding:1px 6px;font-size:10px;background:#374151;color:#9ca3af;border:1px solid #4b5563;border-radius:4px" onclick="rfInsertOp('(')">(</button>
                    <button type="button" class="btn btn-sm" style="padding:1px 6px;font-size:10px;background:#374151;color:#9ca3af;border:1px solid #4b5563;border-radius:4px" onclick="rfInsertOp(')')">)</button>
                  </div>
                </div>
                <textarea id="rf-expr" rows="4" style="width:100%;border:none;outline:none;font-family:'Fira Code',monospace;font-size:14px;padding:12px 14px;background:#1e1e2e;color:#a6e3a1;resize:vertical;line-height:1.6;min-height:80px" placeholder="e.g., offer.priority * 2 + profile.engagement_score * 0.5" spellcheck="false">${formula?.expression || ''}</textarea>
              </div>
              <div style="margin-top:12px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0">
                  <span style="font-size:12px;font-weight:600;color:#334155">Test Expression</span>
                  <button type="button" class="btn btn-sm btn-primary" style="padding:3px 14px;font-size:11px" onclick="rfTestExpr()">Run Test</button>
                </div>
                <div style="padding:10px 14px">
                  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
                    <div>
                      <label style="font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;display:block;margin-bottom:3px">Offer Priority</label>
                      <input type="number" id="rf-test-priority" class="form-input" value="50" style="font-size:12px;padding:4px 8px">
                    </div>
                    <div>
                      <label style="font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;display:block;margin-bottom:3px">Engagement Score</label>
                      <input type="number" id="rf-test-engagement" class="form-input" value="75" style="font-size:12px;padding:4px 8px">
                    </div>
                    <div>
                      <label style="font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;display:block;margin-bottom:3px">Lifetime Value</label>
                      <input type="number" id="rf-test-ltv" class="form-input" value="1200" style="font-size:12px;padding:4px 8px">
                    </div>
                  </div>
                  <div id="rf-test-result" style="min-height:24px"></div>
                </div>
              </div>
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;overflow-y:auto;max-height:420px">
              <div style="font-size:12px;font-weight:700;margin-bottom:12px;color:#334155">Variables Reference</div>
              <div style="font-size:10px;color:#94a3b8;margin-bottom:10px">Click to insert into expression</div>
              ${varSection('Offer', '📦', offerVars, '#6366f1')}
              ${varSection('Profile', '👤', profileVars, '#059669')}
              ${varSection('Context', '🌐', contextVars, '#d97706')}
              <div style="margin-top:12px;padding-top:10px;border-top:1px solid #e2e8f0">
                <div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:6px">Operators</div>
                <div style="font-size:11px;color:#64748b;line-height:1.8">
                  <code>+</code> Add &nbsp; <code>-</code> Subtract &nbsp; <code>*</code> Multiply &nbsp; <code>/</code> Divide &nbsp; <code>( )</code> Group
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="navigateTo('ranking-formulas','list')">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? ICONS.save + ' Update' : ICONS.sparkles + ' Create'} Formula</button>
        </div>
      </form>
    </div>`;
};

window.rfInsertVar = function(varName) {
  const ta = document.getElementById('rf-expr');
  if (!ta) return;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const before = ta.value.substring(0, start);
  const after = ta.value.substring(end);
  const pad = before.length > 0 && !/[\s(+\-*/]$/.test(before) ? ' ' : '';
  ta.value = before + pad + varName + after;
  ta.focus();
  ta.selectionStart = ta.selectionEnd = start + pad.length + varName.length;
};

window.rfInsertOp = function(op) {
  const ta = document.getElementById('rf-expr');
  if (!ta) return;
  const start = ta.selectionStart;
  const before = ta.value.substring(0, start);
  const after = ta.value.substring(ta.selectionEnd);
  const padL = before.length > 0 && !/\s$/.test(before) && op !== '(' && op !== ')' ? ' ' : '';
  const padR = op !== '(' && op !== ')' ? ' ' : '';
  ta.value = before + padL + op + padR + after;
  ta.focus();
  ta.selectionStart = ta.selectionEnd = start + padL.length + op.length + padR.length;
};

window.rfTestExpr = async function() {
  const expr = document.getElementById('rf-expr')?.value;
  if (!expr) { showToast('Enter an expression first', 'error'); return; }
  const el = document.getElementById('rf-test-result');
  if (el) el.innerHTML = '<span style="color:#94a3b8;font-size:12px">Testing...</span>';
  try {
    const resp = await fetch('/api/decisions/ranking-formulas/test', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expression: expr,
        offer_data: { priority: parseFloat(document.getElementById('rf-test-priority')?.value) || 50 },
        profile_data: {
          engagement_score: parseFloat(document.getElementById('rf-test-engagement')?.value) || 75,
          lifetime_value: parseFloat(document.getElementById('rf-test-ltv')?.value) || 1200,
          total_purchases: 25, loyalty_points: 5000, average_order_value: 48, referral_count: 3
        }
      })
    });
    const data = await resp.json();
    if (el) {
      if (data.valid) {
        el.innerHTML = '<div style="display:flex;align-items:center;gap:10px"><div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:6px 14px;display:inline-flex;align-items:center;gap:6px"><span style="font-size:11px;color:#059669;font-weight:600">SCORE</span><span style="font-size:18px;font-weight:700;color:#065f46">' + (typeof data.score === 'number' ? data.score.toFixed(2) : data.score) + '</span></div><span style="font-size:11px;color:#6b7280">Expression is valid</span></div>';
      } else {
        el.innerHTML = '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:6px 14px;display:inline-flex;align-items:center;gap:6px"><span style="color:#dc2626;font-size:12px;font-weight:600">Invalid expression</span></div>';
      }
    }
  } catch (e) {
    if (el) el.innerHTML = '<span style="color:#dc2626;font-size:12px">Error: ' + e.message + '</span>';
  }
};

window.saveFormula = async function(event, editId) {
  if (event && event.preventDefault) event.preventDefault();
  const data = {
    name: document.getElementById('rf-name').value,
    description: document.getElementById('rf-desc').value,
    expression: document.getElementById('rf-expr').value
  };
  if (!data.name || !data.expression) { showToast('Name and expression are required', 'error'); return; }
  const url = editId ? `/api/decisions/ranking-formulas/${editId}` : '/api/decisions/ranking-formulas';
  const resp = await fetch(url, { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!resp.ok) { showToast('Error saving formula', 'error'); return; }
  showToast(editId ? 'Formula updated' : 'Formula created');
  navigateTo('ranking-formulas', 'list');
};

window.deleteFormula = async function(id) {
  if (!confirm('Delete this formula?')) return;
  await fetch(`/api/decisions/ranking-formulas/${id}`, { method: 'DELETE' });
  showToast('Formula deleted');
  window.loadRankingFormulas();
};


// ══════════════════════════════════════════════════════
//  9. AI MODELS UI — GAP 7
// ══════════════════════════════════════════════════════

window.loadAIModels = async function() {
  const content = document.getElementById('content');
  showLoading();
  try {
    const res = await fetch('/api/decisions/ai-models').then(r => r.json());
    const models = res.models || [];

    const typeLabel = { auto_optimization: 'Auto-Optimization', personalized: 'Personalized' };
    const statusColors = { draft: '#6E6E6E', active: '#4CAF50', training: '#FF9800', inactive: '#9E9E9E' };

    const tableRows = models.map(m => {
      const metrics = m.metrics || {};
      return `<tr>
        <td><strong>${m.name}</strong><div class="table-subtext">${m.description || ''}</div></td>
        <td><span class="badge badge-info">${typeLabel[m.type] || m.type}</span></td>
        <td>${m.optimization_goal || 'clicks'}</td>
        <td>${createStatusIndicator(m.status, m.status)}</td>
        <td>${m.training_status === 'trained' ? '<span style="color:#4CAF50;font-weight:600">Trained</span>' : '<span style="color:#999">' + (m.training_status || 'Not started') + '</span>'}</td>
        <td>${metrics.lift != null ? `<span style="color:#4CAF50;font-weight:600">+${metrics.lift}%</span>` : '\u2014'}</td>
        <td>${m.last_trained_at ? new Date(m.last_trained_at).toLocaleDateString() : '\u2014'}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm btn-primary" onclick="trainAIModel(${m.id})" title="Train model">${OD_ICONS.play}</button>
            <button class="btn btn-sm btn-secondary" onclick="showAIModelForm(${m.id})">${OD_ICONS.edit}</button>
            <button class="btn btn-sm btn-danger" onclick="deleteAIModel(${m.id})">${OD_ICONS.trash}</button>
          </div>
        </td>
      </tr>`;
    }).join('');

    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${OD_ICONS.chart} AI Ranking Models</h3>
          <button class="btn btn-primary" onclick="showAIModelForm()">+ Create AI Model</button>
        </div>
        <div class="card-body">
          <div class="form-help" style="margin-bottom:16px">AI models use machine learning to automatically rank offers based on historical performance data. Auto-optimization uses Thompson sampling; Personalized uses supervised learning with profile features.</div>
          ${models.length === 0 ? '<div style="text-align:center;padding:24px;color:#999">No AI models yet.</div>' : `
          <div class="data-table-container">
            <table class="data-table"><thead><tr><th>Name</th><th>Type</th><th>Goal</th><th>Status</th><th>Training</th><th>Lift</th><th>Last Trained</th><th style="width:130px">Actions</th></tr></thead>
            <tbody>${tableRows}</tbody></table>
          </div>`}
        </div>
      </div>`;
  } catch (e) { showError('Failed to load AI models'); } finally { hideLoading(); }
};

window.showAIModelForm = async function(editId) {
  let model = null;
  if (editId) { const res = await fetch('/api/decisions/ai-models').then(r => r.json()); model = (res.models || []).find(m => m.id === editId); }

  const html = `<div class="modal-overlay" id="ai-model-modal" onclick="if(event.target===this)this.remove()">
    <div class="modal" style="max-width:500px">
      <div class="modal-header"><h3>${model ? 'Edit' : 'Create'} AI Model</h3><button class="modal-close" onclick="document.getElementById('ai-model-modal').remove()">&times;</button></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label form-label-required">Name</label><input type="text" id="aim-name" class="form-input" value="${model?.name || ''}" placeholder="e.g., Holiday Season Optimizer"></div>
        <div class="form-group"><label class="form-label">Description</label><input type="text" id="aim-desc" class="form-input" value="${model?.description || ''}" placeholder="Describe what this model optimizes"></div>
        <div class="form-group"><label class="form-label">Model Type</label><select id="aim-type" class="form-input">
          <option value="auto_optimization" ${model?.type === 'auto_optimization' || !model ? 'selected' : ''}>Auto-Optimization (Thompson Sampling)</option>
          <option value="personalized" ${model?.type === 'personalized' ? 'selected' : ''}>Personalized Optimization (Supervised ML)</option>
        </select><div class="form-help">Auto-optimization needs 100+ impressions; Personalized needs 250+ per offer</div></div>
        <div class="form-group"><label class="form-label">Optimization Goal</label><select id="aim-goal" class="form-input">
          <option value="clicks" ${model?.optimization_goal === 'clicks' || !model ? 'selected' : ''}>Clicks</option>
          <option value="conversions" ${model?.optimization_goal === 'conversions' ? 'selected' : ''}>Conversions</option>
          <option value="revenue" ${model?.optimization_goal === 'revenue' ? 'selected' : ''}>Revenue</option>
        </select></div>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary" onclick="document.getElementById('ai-model-modal').remove()">Cancel</button><button class="btn btn-primary" onclick="saveAIModel(${editId || 'null'})">${model ? 'Update' : 'Create'}</button></div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
};

window.saveAIModel = async function(editId) {
  const data = { name: document.getElementById('aim-name').value, description: document.getElementById('aim-desc').value, type: document.getElementById('aim-type').value, optimization_goal: document.getElementById('aim-goal').value };
  if (!data.name) { showToast('Name is required', 'error'); return; }
  const url = editId ? `/api/decisions/ai-models/${editId}` : '/api/decisions/ai-models';
  const resp = await fetch(url, { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!resp.ok) { showToast('Error saving model', 'error'); return; }
  document.getElementById('ai-model-modal')?.remove();
  showToast(editId ? 'Model updated' : 'Model created');
  window.loadAIModels();
};

window.trainAIModel = async function(id) {
  showToast('Training model...');
  const resp = await fetch(`/api/decisions/ai-models/${id}/train`, { method: 'POST' });
  if (resp.ok) { showToast('Model trained successfully'); window.loadAIModels(); }
  else showToast('Training failed', 'error');
};

window.deleteAIModel = async function(id) {
  if (!confirm('Delete this AI model?')) return;
  await fetch(`/api/decisions/ai-models/${id}`, { method: 'DELETE' });
  showToast('Model deleted');
  window.loadAIModels();
};


// ══════════════════════════════════════════════════════
//  10. CONTEXT DATA SCHEMA UI — GAP 6
// ══════════════════════════════════════════════════════

window.loadContextSchema = async function() {
  const content = document.getElementById('content');
  showLoading();
  try {
    const res = await fetch('/api/decisions/context-schema').then(r => r.json());
    const attrs = res.attributes || [];

    const tableRows = attrs.map(a => `<tr>
      <td><strong>${a.label || a.name}</strong><div class="table-subtext"><code>context.${a.name}</code></div></td>
      <td><span class="badge badge-info">${a.type}</span></td>
      <td style="font-size:12px;color:#666">${a.description || '\u2014'}</td>
      <td style="font-size:12px;font-family:monospace">${a.example_value || '\u2014'}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm btn-secondary" onclick="showContextAttrForm(${a.id})">${OD_ICONS.edit}</button>
          <button class="btn btn-sm btn-danger" onclick="deleteContextAttr(${a.id})">${OD_ICONS.trash}</button>
        </div>
      </td>
    </tr>`).join('');

    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${OD_ICONS.rule} Context Data Schema</h3>
          <button class="btn btn-primary" onclick="showContextAttrForm()">+ Add Context Attribute</button>
        </div>
        <div class="card-body">
          <div class="form-help" style="margin-bottom:16px">Define the expected real-time context data attributes passed at decision time (e.g., current page, device, location). These can be used in eligibility rules and ranking formulas via <code>context.&lt;name&gt;</code>.</div>
          ${attrs.length === 0 ? '<div style="text-align:center;padding:24px;color:#999">No context attributes defined yet.</div>' : `
          <div class="data-table-container">
            <table class="data-table"><thead><tr><th>Attribute</th><th>Type</th><th>Description</th><th>Example</th><th style="width:100px">Actions</th></tr></thead>
            <tbody>${tableRows}</tbody></table>
          </div>`}
        </div>
      </div>`;
  } catch (e) { showError('Failed to load context schema'); } finally { hideLoading(); }
};

window.showContextAttrForm = async function(editId) {
  let attr = null;
  if (editId) { const res = await fetch('/api/decisions/context-schema').then(r => r.json()); attr = (res.attributes || []).find(a => a.id === editId); }

  const html = `<div class="modal-overlay" id="ctx-attr-modal" onclick="if(event.target===this)this.remove()">
    <div class="modal" style="max-width:480px">
      <div class="modal-header"><h3>${attr ? 'Edit' : 'Add'} Context Attribute</h3><button class="modal-close" onclick="document.getElementById('ctx-attr-modal').remove()">&times;</button></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label form-label-required">Name</label><input type="text" id="ctx-name" class="form-input" value="${attr?.name || ''}" placeholder="e.g., page_type" ${attr ? 'readonly style="background:#f5f5f5"' : ''}></div>
        <div class="form-group"><label class="form-label form-label-required">Label</label><input type="text" id="ctx-label" class="form-input" value="${attr?.label || ''}" placeholder="e.g., Page Type"></div>
        <div class="form-group"><label class="form-label">Type</label><select id="ctx-type" class="form-input">
          <option value="string" ${attr?.type === 'string' ? 'selected' : ''}>String</option><option value="number" ${attr?.type === 'number' ? 'selected' : ''}>Number</option><option value="boolean" ${attr?.type === 'boolean' ? 'selected' : ''}>Boolean</option>
        </select></div>
        <div class="form-group"><label class="form-label">Description</label><input type="text" id="ctx-desc" class="form-input" value="${attr?.description || ''}" placeholder="What this context value represents"></div>
        <div class="form-group"><label class="form-label">Example Value</label><input type="text" id="ctx-example" class="form-input" value="${attr?.example_value || ''}" placeholder='e.g., "homepage"'></div>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary" onclick="document.getElementById('ctx-attr-modal').remove()">Cancel</button><button class="btn btn-primary" onclick="saveContextAttr(${editId || 'null'})">${attr ? 'Update' : 'Create'}</button></div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
};

window.saveContextAttr = async function(editId) {
  const data = { name: document.getElementById('ctx-name').value, label: document.getElementById('ctx-label').value, type: document.getElementById('ctx-type').value, description: document.getElementById('ctx-desc').value, example_value: document.getElementById('ctx-example').value };
  if (!data.name || !data.label) { showToast('Name and label are required', 'error'); return; }
  const url = editId ? `/api/decisions/context-schema/${editId}` : '/api/decisions/context-schema';
  const resp = await fetch(url, { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!resp.ok) { const err = await resp.json(); showToast(err.error || 'Error', 'error'); return; }
  document.getElementById('ctx-attr-modal')?.remove();
  showToast(editId ? 'Attribute updated' : 'Attribute created');
  window.loadContextSchema();
};

window.deleteContextAttr = async function(id) {
  if (!confirm('Delete this context attribute?')) return;
  await fetch(`/api/decisions/context-schema/${id}`, { method: 'DELETE' });
  showToast('Attribute deleted');
  window.loadContextSchema();
};


// ══════════════════════════════════════════════════════
//  11. EXPERIMENTS (A/B Testing) UI — GAP 5
// ══════════════════════════════════════════════════════

window.showExperimentsTab = async function(decisionId) {
  const container = document.getElementById('experiments-tab-container');
  if (!container) return;
  container.innerHTML = '<div class="loading-inline"><div class="spinner"></div></div>';

  const [expRes, stRes] = await Promise.all([
    fetch(`/api/decisions/${decisionId}/experiments`).then(r => r.json()),
    fetch('/api/decisions/strategies').then(r => r.json())
  ]);
  const experiments = expRes.experiments || [];
  const strategies = stRes.strategies || [];

  const statusColors = { draft: '#6E6E6E', running: '#4CAF50', completed: '#2196F3', stopped: '#9E9E9E' };

  let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
    <h4 style="margin:0">Content Experiments</h4>
    <button class="btn btn-sm btn-primary" onclick="showCreateExperiment(${decisionId})">+ New Experiment</button>
  </div>`;

  if (experiments.length === 0) {
    html += '<div style="text-align:center;padding:24px;color:#999">No experiments yet. Create one to A/B test different selection strategies.</div>';
  } else {
    html += experiments.map(exp => {
      const treatments = exp.treatments || [];
      return `<div style="border:1px solid #e0e0e0;border-radius:8px;padding:16px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
          <div>
            <strong style="font-size:15px">${exp.name}</strong>
            <div style="font-size:12px;color:#666;margin-top:2px">${exp.description || ''}</div>
            <div style="margin-top:6px">${statusBadge(exp.status)} <span style="font-size:11px;color:#999;margin-left:8px">Objective: ${exp.objective || 'clicks'}</span></div>
          </div>
          <div style="display:flex;gap:6px">
            ${exp.status === 'draft' ? `<button class="btn btn-sm btn-primary" onclick="startExperiment(${exp.id}, ${decisionId})">Start</button>` : ''}
            ${exp.status === 'running' ? `<button class="btn btn-sm btn-secondary" onclick="stopExperiment(${exp.id}, ${decisionId})">Stop & Pick Winner</button>` : ''}
            <button class="btn btn-sm btn-danger" onclick="deleteExperiment(${exp.id}, ${decisionId})">${OD_ICONS.trash}</button>
          </div>
        </div>
        <table class="data-table" style="width:100%;font-size:13px"><thead><tr><th>Treatment</th><th>Strategy</th><th>Traffic</th><th>Impressions</th><th>Clicks</th><th>Conversions</th><th>Rate</th><th></th></tr></thead>
        <tbody>${treatments.map(t => {
          const strat = strategies.find(s => s.id === t.selection_strategy_id);
          const rate = t.impressions > 0 ? ((exp.objective === 'conversions' ? t.conversions : t.clicks) / t.impressions * 100).toFixed(2) : '0.00';
          const isWinner = exp.winner_treatment_id === t.id;
          return `<tr style="${isWinner ? 'background:#e8f5e9' : ''}">
            <td><strong>${t.name}</strong></td>
            <td>${strat ? strat.name : '\u2014'}</td>
            <td>${t.traffic_pct}%</td>
            <td>${t.impressions || 0}</td>
            <td>${t.clicks || 0}</td>
            <td>${t.conversions || 0}</td>
            <td><strong>${rate}%</strong></td>
            <td>${isWinner ? '<span style="color:#4CAF50;font-weight:600">Winner</span>' : ''}</td>
          </tr>`;
        }).join('')}</tbody></table>
        ${exp.confidence_level ? `<div style="margin-top:8px;font-size:12px;color:#666">Statistical confidence: <strong>${exp.confidence_level}%</strong></div>` : ''}
      </div>`;
    }).join('');
  }

  container.innerHTML = html;
};

window.showCreateExperiment = async function(decisionId) {
  const stRes = await fetch('/api/decisions/strategies').then(r => r.json());
  const strategies = stRes.strategies || [];

  const html = `<div class="modal-overlay" id="exp-modal" onclick="if(event.target===this)this.remove()">
    <div class="modal" style="max-width:600px">
      <div class="modal-header"><h3>Create Experiment</h3><button class="modal-close" onclick="document.getElementById('exp-modal').remove()">&times;</button></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label form-label-required">Name</label><input type="text" id="exp-name" class="form-input" placeholder="e.g., Priority vs Formula Test"></div>
        <div class="form-group"><label class="form-label">Description</label><input type="text" id="exp-desc" class="form-input" placeholder="What are you testing?"></div>
        <div class="form-group"><label class="form-label">Objective</label><select id="exp-obj" class="form-input"><option value="clicks">Clicks</option><option value="conversions">Conversions</option></select></div>
        <div style="margin-top:12px">
          <label class="form-label">Treatments</label>
          <div id="exp-treatments">
            <div class="exp-treatment" style="display:grid;grid-template-columns:1fr 2fr 80px;gap:8px;margin-bottom:8px;align-items:end">
              <div><label class="form-label" style="font-size:11px">Name</label><input type="text" class="form-input exp-t-name" value="Treatment A"></div>
              <div><label class="form-label" style="font-size:11px">Strategy</label><select class="form-input exp-t-strat"><option value="">None</option>${strategies.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
              <div><label class="form-label" style="font-size:11px">Traffic %</label><input type="number" class="form-input exp-t-pct" value="50" min="1" max="100"></div>
            </div>
            <div class="exp-treatment" style="display:grid;grid-template-columns:1fr 2fr 80px;gap:8px;margin-bottom:8px;align-items:end">
              <div><input type="text" class="form-input exp-t-name" value="Treatment B"></div>
              <div><select class="form-input exp-t-strat"><option value="">None</option>${strategies.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
              <div><input type="number" class="form-input exp-t-pct" value="50" min="1" max="100"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary" onclick="document.getElementById('exp-modal').remove()">Cancel</button><button class="btn btn-primary" onclick="saveExperiment(${decisionId})">Create</button></div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
};

window.saveExperiment = async function(decisionId) {
  const treatments = [...document.querySelectorAll('.exp-treatment')].map(row => ({
    name: row.querySelector('.exp-t-name').value,
    selection_strategy_id: row.querySelector('.exp-t-strat').value || null,
    traffic_pct: parseFloat(row.querySelector('.exp-t-pct').value) || 0
  }));
  const data = { name: document.getElementById('exp-name').value, description: document.getElementById('exp-desc').value, objective: document.getElementById('exp-obj').value, treatments };
  if (!data.name) { showToast('Name is required', 'error'); return; }
  const totalPct = treatments.reduce((s, t) => s + t.traffic_pct, 0);
  if (Math.abs(totalPct - 100) > 1) { showToast('Traffic percentages must sum to 100%', 'error'); return; }
  const resp = await fetch(`/api/decisions/${decisionId}/experiments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!resp.ok) { const err = await resp.json(); showToast(err.error || 'Error', 'error'); return; }
  document.getElementById('exp-modal')?.remove();
  showToast('Experiment created');
  showExperimentsTab(decisionId);
};

window.startExperiment = async function(expId, decisionId) {
  await fetch(`/api/decisions/experiments/${expId}/start`, { method: 'POST' });
  showToast('Experiment started');
  showExperimentsTab(decisionId);
};

window.stopExperiment = async function(expId, decisionId) {
  await fetch(`/api/decisions/experiments/${expId}/stop`, { method: 'POST' });
  showToast('Experiment completed');
  showExperimentsTab(decisionId);
};

window.deleteExperiment = async function(expId, decisionId) {
  if (!confirm('Delete this experiment?')) return;
  await fetch(`/api/decisions/experiments/${expId}`, { method: 'DELETE' });
  showToast('Experiment deleted');
  showExperimentsTab(decisionId);
};
