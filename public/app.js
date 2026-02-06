// API Base URL
const API_BASE = '/api';

// Shared back-button chevron SVG
const BACK_SVG = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// ============================================
// LUCIDE ICON LIBRARY (line/outline, monochrome, consistent stroke)
// Usage: ICONS.name  — returns an SVG string
// ============================================
const _i = (w, paths) => '<svg width="' + w + '" height="' + w + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';

const ICONS = {
  // --- Navigation / Sections ---
  dashboard:    _i(16, '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>'),
  compass:      _i(16, '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>'),
  zap:          _i(16, '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
  send:         _i(16, '<path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/>'),
  messageSquare:_i(16, '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
  history:      _i(16, '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>'),
  fileText:     _i(16, '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>'),
  image:        _i(16, '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>'),
  globe:        _i(16, '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>'),
  layers:       _i(16, '<path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>'),
  tag:          _i(16, '<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>'),
  users:        _i(16, '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  usersRound:   _i(16, '<path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/>'),
  mail:         _i(16, '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'),
  sliders:      _i(16, '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>'),
  target:       _i(16, '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
  database:     _i(16, '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>'),
  code:         _i(16, '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'),
  trendingUp:   _i(16, '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'),
  sparkles:     _i(16, '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>'),
  bookOpen:     _i(16, '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'),

  // --- Common Actions ---
  edit:         _i(14, '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>'),
  trash:        _i(14, '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>'),
  play:         _i(14, '<polygon points="6 3 20 12 6 21 6 3"/>'),
  pause:        _i(14, '<rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/>'),
  stop:         _i(14, '<rect width="14" height="14" x="5" y="5" rx="2"/>'),
  save:         _i(14, '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>'),
  refresh:      _i(14, '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>'),
  search:       _i(14, '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
  plus:         _i(14, '<path d="M5 12h14"/><path d="M12 5v14"/>'),
  x:            _i(14, '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  check:        _i(14, '<path d="M20 6 9 17l-5-5"/>'),
  alertTriangle:_i(14, '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>'),
  info:         _i(14, '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'),
  chevronRight: _i(14, '<path d="m9 18 6-6-6-6"/>'),
  arrowUp:      _i(14, '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>'),
  arrowDown:    _i(14, '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>'),
  barChart:     _i(14, '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>'),
  palette:      _i(14, '<circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="6.5" cy="12" r="0.5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2Z"/>'),

  // --- Workflow / Campaign ---
  broadcast:    _i(14, '<path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>'),
  bot:          _i(14, '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>'),
  repeat:       _i(14, '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'),
  workflow:     _i(14, '<rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/>'),

  // --- Analytics / Stats ---
  mailStat:     _i(16, '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'),
  eye:          _i(14, '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'),
  mousePointer: _i(14, '<path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/>'),
  star:         _i(14, '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),
  gem:          _i(14, '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>'),
  dollarSign:   _i(14, '<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
  thumbsUp:     _i(14, '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/>'),
  handWave:     _i(14, '<path d="M18.11 12.68a3.44 3.44 0 0 0-4.86 0l-.49.49a1 1 0 0 1-1.42-1.42l2.13-2.12a3.07 3.07 0 0 0-4.32-4.37l-3.53 3.53a8 8 0 0 0 0 11.31l.49.49a8 8 0 0 0 11.31 0l3.18-3.17a3.44 3.44 0 0 0-2.49-5.74Z"/>'),
  timer:        _i(14, '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>'),
  megaphone:    _i(14, '<path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>'),

  // --- Content / UI ---
  folder:       _i(14, '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>'),
  puzzle:       _i(14, '<path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z"/>'),
  blocks:       _i(14, '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/>'),
  monitor:      _i(14, '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>'),
  link:         _i(14, '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
  userPlus:     _i(14, '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>'),
  combine:      _i(14, '<circle cx="7" cy="12" r="3"/><circle cx="17" cy="12" r="3"/><path d="M14 12H10"/>'),
  saveData:     _i(14, '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>'),
  hardDrive:    _i(14, '<line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/>'),
  webhook:      _i(14, '<path d="M18 16.98h1a2 2 0 0 0 2-1.98V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8c0 1.1.9 2 2 2h1"/><path d="m12 18 4 4"/><path d="m8 22 4-4"/>'),
  smartphone:   _i(14, '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>'),
  entryPoint:   _i(14, '<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>'),
  splitBranch:  _i(14, '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M6 9v6c0 1.66 1.34 3 3 3h3"/><path d="M6 9h6c1.66 0 3-1.34 3-3"/>'),
  wait:         _i(14, '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  jump:         _i(14, '<polyline points="17 11 21 7 17 3"/><path d="M21 7H9a4 4 0 0 0-4 4v10"/>'),
};


// Debounce utility function
let debounceTimers = {};
function debounce(key, callback, delay = 500) {
  if (debounceTimers[key]) {
    clearTimeout(debounceTimers[key]);
  }
  debounceTimers[key] = setTimeout(() => {
    callback();
    delete debounceTimers[key];
  }, delay);
}

// Routing state
let currentRoute = {
  view: 'dashboard',
  page: 'list', // 'list', 'create', 'edit', 'detail'
  id: null,
  breadcrumbs: []
};

// Navigate to a route
function navigateTo(view, page = 'list', id = null) {
  currentRoute = { view, page, id };
  updateBreadcrumbs();
  renderCurrentPage();
  
  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === view);
  });
}

// Update breadcrumbs
function updateBreadcrumbs() {
  const breadcrumbsEl = document.getElementById('breadcrumbs');
  const crumbs = [];
  
  // Add home
  if (currentRoute.view !== 'dashboard') {
    crumbs.push({ label: 'Dashboard', view: 'dashboard', page: 'list' });
  }
  
  // Add current view
  const viewLabel = currentRoute.view.charAt(0).toUpperCase() + currentRoute.view.slice(1);
  if (currentRoute.page === 'list') {
    crumbs.push({ label: viewLabel, current: true });
  } else {
    crumbs.push({ label: viewLabel, view: currentRoute.view, page: 'list' });
    
    // Add create/edit page
    if (currentRoute.page === 'create') {
      crumbs.push({ label: `Create ${viewLabel.slice(0, -1)}`, current: true });
    } else if (currentRoute.page === 'edit') {
      crumbs.push({ label: `Edit ${viewLabel.slice(0, -1)}`, current: true });
    }
  }
  
  currentRoute.breadcrumbs = crumbs;
  renderBreadcrumbs();
}

// Render breadcrumbs
function renderBreadcrumbs() {
  const breadcrumbsEl = document.getElementById('breadcrumbs');
  
  if (currentRoute.breadcrumbs.length <= 1) {
    breadcrumbsEl.classList.add('hidden');
    return;
  }
  
  breadcrumbsEl.classList.remove('hidden');
  breadcrumbsEl.innerHTML = currentRoute.breadcrumbs.map((crumb, index) => {
    if (crumb.current) {
      return `<span class="breadcrumb-current">${crumb.label}</span>`;
    } else {
      const isLast = index === currentRoute.breadcrumbs.length - 1;
      return `
        <a href="#" class="breadcrumb-link" onclick="event.preventDefault(); navigateTo('${crumb.view}', '${crumb.page}')">${crumb.label}</a>
        ${!isLast ? '<span class="breadcrumb-separator">/</span>' : ''}
      `;
    }
  }).join('');
}

// Render current page
function renderCurrentPage() {
  const { view, page, id } = currentRoute;
  const titleMap = {
    dashboard: 'Dashboard',
    contacts: 'Contacts',
    workflows: 'Workflows',
    segments: 'Segments',
    audiences: 'Audiences',
    'custom-objects': 'Custom Objects',
    'query-service': 'Query Service',
    analytics: 'Analytics',
    ai: 'AI Features',
    'api-docs': 'API Documentation'
  };
  
  document.getElementById('page-title').textContent = titleMap[view] || view;
  
  // Show/hide create button
  const createBtn = document.getElementById('create-btn');
  if (['contacts', 'campaigns', 'segments', 'audiences', 'custom-objects'].includes(view) && page === 'list') {
    createBtn.style.display = 'block';
    const label = view === 'custom-objects' ? 'Custom Object' : view === 'audiences' ? 'Audience' : view === 'contacts' ? 'Contact' : titleMap[view].slice(0, -1);
    document.getElementById('create-btn-text').textContent = `+ Create ${label}`;
  } else {
    createBtn.style.display = 'none';
  }
  
  // Route to appropriate page
  if (page === 'create') {
    showCreatePage(view);
  } else if (page === 'edit') {
    showEditPage(view, id);
  } else if (page === 'list') {
    showListPage(view);
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view') || 'dashboard';
  const deliveryId = params.get('deliveryId');
  const deliveryStep = parseInt(params.get('step'), 10);
  if (deliveryId) {
    window.pendingDeliveryId = parseInt(deliveryId, 10);
  }
  if (!Number.isNaN(deliveryStep)) {
    window.pendingDeliveryStep = deliveryStep;
  }
  navigateTo(view, 'list');
  
  // Refresh button
  document.getElementById('refresh-btn').addEventListener('click', () => {
    renderCurrentPage();
  });
  
  // Create button
  document.getElementById('create-btn').addEventListener('click', () => {
    navigateTo(currentRoute.view, 'create');
  });
});

// Navigation
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.dataset.view;
      navigateTo(view, 'list');
    });
  });
}

// Show list page
function renderMissingView(viewLabel) {
  const content = document.getElementById('content');
  if (!content) return;
  const label = viewLabel || 'View';
  content.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">${ICONS.alertTriangle} ${label}</h3>
        <div class="card-subtitle">This view is not available yet</div>
      </div>
      <div class="card-body">
        <p>We could not load this page right now. If you just updated the app, try refreshing.</p>
      </div>
    </div>
  `;
}

function callViewLoader(loader, label) {
  if (typeof loader === 'function') {
    loader();
    return;
  }
  renderMissingView(label);
}

function showListPage(view) {
  switch(view) {
    case 'dashboard':
      callViewLoader(loadDashboard, 'Dashboard');
      break;
    case 'explorer':
      callViewLoader(window.loadExplorer, 'Explorer');
      break;
    case 'contacts':
      callViewLoader(loadContacts, 'Contacts');
      break;
    case 'workflows':
      callViewLoader(loadWorkflows, 'Workflows');
      break;
    case 'deliveries':
      callViewLoader(window.loadDeliveries, 'Deliveries');
      break;
    case 'transactional':
      callViewLoader(window.loadTransactionalMessages, 'Transactional Messages');
      break;
    case 'event-history':
      callViewLoader(window.loadEventHistory, 'Event History');
      break;
    case 'content-templates':
      callViewLoader(window.loadContentTemplates, 'Content Templates');
      break;
    case 'landing-pages':
      callViewLoader(window.loadLandingPages, 'Landing Pages');
      break;
    case 'assets':
      callViewLoader(window.loadAssets, 'Asset Library');
      break;
    case 'fragments':
      callViewLoader(window.loadFragments, 'Fragments');
      break;
    case 'brands':
      callViewLoader(window.loadBrands, 'Brands');
      break;
    case 'audiences':
      callViewLoader(loadAudiences, 'Audiences');
      break;
    case 'subscription-services':
      callViewLoader(window.loadSubscriptionServices, 'Subscription Services');
      break;
    case 'predefined-filters':
      callViewLoader(window.loadPredefinedFilters, 'Predefined Filters');
      break;
    case 'segments':
      callViewLoader(loadSegments, 'Segments');
      break;
    case 'custom-objects':
      callViewLoader(loadCustomObjects, 'Custom Objects');
      break;
    case 'query-service':
      callViewLoader(loadQueryService, 'Query Service');
      break;
    case 'analytics':
      callViewLoader(loadAnalytics, 'Analytics');
      break;
    case 'ai':
      callViewLoader(loadAIFeatures, 'AI Features');
      break;
    case 'api-docs':
      callViewLoader(loadAPIDocs, 'API Documentation');
      break;
    default:
      renderMissingView(view);
      break;
  }
}

// Show create page
function showCreatePage(view) {
  const label = view === 'custom-objects' ? 'Custom Object' : view.charAt(0).toUpperCase() + view.slice(1, -1);
  document.getElementById('page-title').textContent = `Create ${label}`;
  
  switch(view) {
    case 'contacts':
      renderContactForm();
      break;
    case 'workflows':
      renderWorkflowForm();
      break;
    case 'segments':
      renderSegmentForm();
      break;
    case 'audiences':
      renderAudienceForm();
      break;
    case 'custom-objects':
      renderCustomObjectForm();
      break;
  }
}

// Show edit page
async function showEditPage(view, id) {
  const label = view === 'custom-objects' ? 'Custom Object' : view.charAt(0).toUpperCase() + view.slice(1, -1);
  document.getElementById('page-title').textContent = `Edit ${label}`;
  showLoading();
  
  try {
    const endpoint = view === 'custom-objects' ? 'custom-objects' : view;
    const response = await fetch(`${API_BASE}/${endpoint}/${id}`);
    const data = await response.json();
    
    switch(view) {
      case 'contacts':
        renderContactForm(data);
        break;
      case 'workflows':
        renderWorkflowForm(data);
        break;
      case 'segments':
        renderSegmentForm(data);
        break;
      case 'audiences':
        renderAudienceForm(data);
        break;
      case 'custom-objects':
        renderCustomObjectForm(data);
        break;
    }
    
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error loading data', 'error');
    navigateTo(view, 'list');
  }
}

// Render Customer Form
function renderContactForm(contact = null) {
  const isEdit = !!contact;
  const content = document.getElementById('content');
  
  content.innerHTML = `
    <div class="form-container">
      <form id="contact-form" onsubmit="handleContactSubmit(event)">
        <div class="form-section">
          <h3 class="form-section-title">Basic Information</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label form-label-required">Email</label>
              <input type="email" id="contact-email" class="form-input" value="${contact?.email || ''}" required>
              <div class="form-error" id="email-error">Please enter a valid email</div>
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="tel" id="contact-phone" class="form-input" value="${contact?.phone || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">First Name</label>
              <input type="text" id="contact-first-name" class="form-input" value="${contact?.first_name || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Last Name</label>
              <input type="text" id="contact-last-name" class="form-input" value="${contact?.last_name || ''}">
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <h3 class="form-section-title">Status & Subscription</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select id="contact-status" class="form-input">
                <option value="active" ${contact?.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="inactive" ${contact?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Subscription Status</label>
              <select id="contact-subscription" class="form-input">
                <option value="subscribed" ${contact?.subscription_status === 'subscribed' ? 'selected' : ''}>Subscribed</option>
                <option value="unsubscribed" ${contact?.subscription_status === 'unsubscribed' ? 'selected' : ''}>Unsubscribed</option>
                <option value="bounced" ${contact?.subscription_status === 'bounced' ? 'selected' : ''}>Bounced</option>
                <option value="pending" ${contact?.subscription_status === 'pending' ? 'selected' : ''}>Pending</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Loyalty Tier</label>
              <select id="contact-loyalty" class="form-input">
                <option value="bronze" ${contact?.loyalty_tier === 'bronze' ? 'selected' : ''}>Bronze</option>
                <option value="silver" ${contact?.loyalty_tier === 'silver' ? 'selected' : ''}>Silver</option>
                <option value="gold" ${contact?.loyalty_tier === 'gold' ? 'selected' : ''}>Gold</option>
                <option value="platinum" ${contact?.loyalty_tier === 'platinum' ? 'selected' : ''}>Platinum</option>
              </select>
              <div class="form-help">Loyalty tier based on purchase history</div>
            </div>
            <div class="form-group">
              <label class="form-label">Engagement Score (0-100)</label>
              <input type="number" id="contact-engagement" class="form-input" value="${contact?.engagement_score || 50}" min="0" max="100">
              <div class="form-help">Marketing engagement score</div>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <h3 class="form-section-title">Demographics</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">City</label>
              <input type="text" id="contact-city" class="form-input" value="${contact?.city || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">State</label>
              <input type="text" id="contact-state" class="form-input" value="${contact?.state || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Country</label>
              <input type="text" id="contact-country" class="form-input" value="${contact?.country || 'USA'}">
            </div>
            <div class="form-group">
              <label class="form-label">Gender</label>
              <select id="contact-gender" class="form-input">
                <option value="">Select...</option>
                <option value="male" ${contact?.gender === 'male' ? 'selected' : ''}>Male</option>
                <option value="female" ${contact?.gender === 'female' ? 'selected' : ''}>Female</option>
                <option value="non-binary" ${contact?.gender === 'non-binary' ? 'selected' : ''}>Non-binary</option>
                <option value="prefer not to say" ${contact?.gender === 'prefer not to say' ? 'selected' : ''}>Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <h3 class="form-section-title">Communication Preferences</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">
                <input type="checkbox" id="contact-email-opt" ${contact?.email_opt_in ? 'checked' : ''}> 
                Email Opt-in
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">
                <input type="checkbox" id="contact-sms-opt" ${contact?.sms_opt_in ? 'checked' : ''}> 
                SMS Opt-in
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">Preferred Channel</label>
              <select id="contact-channel" class="form-input">
                <option value="email" ${contact?.preferred_channel === 'email' ? 'selected' : ''}>Email</option>
                <option value="sms" ${contact?.preferred_channel === 'sms' ? 'selected' : ''}>SMS</option>
                <option value="push" ${contact?.preferred_channel === 'push' ? 'selected' : ''}>Push</option>
                <option value="whatsapp" ${contact?.preferred_channel === 'whatsapp' ? 'selected' : ''}>WhatsApp</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Communication Frequency</label>
              <select id="contact-frequency" class="form-input">
                <option value="daily" ${contact?.communication_frequency === 'daily' ? 'selected' : ''}>Daily</option>
                <option value="weekly" ${contact?.communication_frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
                <option value="monthly" ${contact?.communication_frequency === 'monthly' ? 'selected' : ''}>Monthly</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="navigateTo('contacts', 'list')">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Contact</button>
        </div>
      </form>
    </div>
  `;
}

// Handle Contact Form Submit
async function handleContactSubmit(event) {
  event.preventDefault();
  
  const contactData = {
    email: document.getElementById('contact-email').value,
    first_name: document.getElementById('contact-first-name').value,
    last_name: document.getElementById('contact-last-name').value,
    phone: document.getElementById('contact-phone').value,
    status: document.getElementById('contact-status').value,
    subscription_status: document.getElementById('contact-subscription').value,
    loyalty_tier: document.getElementById('contact-loyalty').value,
    engagement_score: parseInt(document.getElementById('contact-engagement').value) || 50,
    city: document.getElementById('contact-city').value,
    state: document.getElementById('contact-state').value,
    country: document.getElementById('contact-country').value,
    gender: document.getElementById('contact-gender').value,
    email_opt_in: document.getElementById('contact-email-opt').checked,
    sms_opt_in: document.getElementById('contact-sms-opt').checked,
    preferred_channel: document.getElementById('contact-channel').value,
    communication_frequency: document.getElementById('contact-frequency').value
  };
  
  const isEdit = currentRoute.id !== null;
  const url = isEdit ? `${API_BASE}/contacts/${currentRoute.id}` : `${API_BASE}/contacts`;
  const method = isEdit ? 'PUT' : 'POST';
  
  showLoading();
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save contact');
    }
    
    const result = await response.json();
    console.log('✅ Contact saved successfully:', result);
    
    hideLoading();
    showToast(`Contact ${isEdit ? 'updated' : 'created'} successfully`, 'success');
    
    // Force reload contacts list with a small delay
    setTimeout(() => {
      navigateTo('contacts', 'list');
    }, 500);
  } catch (error) {
    console.error('❌ Error saving contact:', error);
    hideLoading();
    showToast(`Error ${isEdit ? 'updating' : 'creating'} contact: ${error.message}`, 'error');
  }
}

// Render Campaign Form
function renderCampaignForm(campaign = null) {
  const isEdit = !!campaign;
  const content = document.getElementById('content');
  
  content.innerHTML = `
    <div class="form-container">
      <form id="campaign-form" onsubmit="handleCampaignSubmit(event)">
        <div class="form-section">
          <h3 class="form-section-title">Campaign Details</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label form-label-required">Campaign Name</label>
              <input type="text" id="campaign-name" class="form-input" value="${campaign?.name || ''}" required>
              <div class="form-help">Give your campaign a clear, descriptive name</div>
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Description</label>
              <textarea id="campaign-description" class="form-input" rows="2">${campaign?.description || ''}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Campaign Type</label>
              <select id="campaign-type" class="form-input">
                <option value="email" ${campaign?.campaign_type === 'email' ? 'selected' : ''}>Email</option>
                <option value="sms" ${campaign?.campaign_type === 'sms' ? 'selected' : ''}>SMS</option>
                <option value="push" ${campaign?.campaign_type === 'push' ? 'selected' : ''}>Push Notification</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select id="campaign-status" class="form-input">
                <option value="draft" ${campaign?.status === 'draft' ? 'selected' : ''}>Draft</option>
                <option value="scheduled" ${campaign?.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
                <option value="active" ${campaign?.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="paused" ${campaign?.status === 'paused' ? 'selected' : ''}>Paused</option>
                <option value="completed" ${campaign?.status === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="archived" ${campaign?.status === 'archived' ? 'selected' : ''}>Archived</option>
              </select>
              <div class="form-help">Set the campaign status</div>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <h3 class="form-section-title">Content</h3>
          <div class="form-group">
            <label class="form-label form-label-required">Subject Line</label>
            <input type="text" id="campaign-subject" class="form-input" value="${campaign?.subject_line || ''}" required>
            <div class="form-help">Keep under 50 characters for best mobile display</div>
          </div>
          <div class="form-group">
            <label class="form-label">Email Content (HTML)</label>
            <textarea id="campaign-content" class="form-input" rows="10">${campaign?.content_html || '<h1>Your Campaign Title</h1><p>Your message here...</p>'}</textarea>
            <div class="form-help">Use HTML for rich formatting. Personalize with {{first_name}}, {{last_name}}, etc.</div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="navigateTo('campaigns', 'list')">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Campaign</button>
        </div>
      </form>
    </div>
  `;
}

// Handle Campaign Form Submit
async function handleCampaignSubmit(event) {
  event.preventDefault();
  
  const campaignData = {
    name: document.getElementById('campaign-name').value,
    description: document.getElementById('campaign-description').value,
    campaign_type: document.getElementById('campaign-type').value,
    status: document.getElementById('campaign-status').value,
    subject_line: document.getElementById('campaign-subject').value,
    content_html: document.getElementById('campaign-content').value
  };
  
  const isEdit = currentRoute.id !== null;
  const url = isEdit ? `${API_BASE}/campaigns/${currentRoute.id}` : `${API_BASE}/campaigns`;
  const method = isEdit ? 'PUT' : 'POST';
  
  showLoading();
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignData)
    });
    
    if (!response.ok) throw new Error('Failed to save campaign');
    
    hideLoading();
    showToast(`Campaign ${isEdit ? 'updated' : 'created'} successfully`, 'success');
    navigateTo('campaigns', 'list');
  } catch (error) {
    hideLoading();
    showToast(`Error ${isEdit ? 'updating' : 'creating'} campaign`, 'error');
  }
}

// Render Workflow Form
function renderWorkflowForm(workflow = null) {
  const isEdit = !!workflow;
  const content = document.getElementById('content');
  
  // Default workflow type for new workflows
  const workflowType = workflow?.workflow_type || 'broadcast';
  const entryTriggerType = workflow?.entry_trigger?.type || 'manual';
  
  content.innerHTML = `
    <div class="form-container">
      <form id="workflow-form" onsubmit="handleWorkflowSubmit(event)">
        <!-- Workflow Type Selection (only for new workflows) -->
        ${!isEdit ? `
        <div class="form-section">
          <h3 class="form-section-title">${ICONS.zap} Choose Workflow Type</h3>
          <div class="workflow-type-selector" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
            <label class="workflow-type-card" onclick="selectWorkflowType('broadcast')">
              <input type="radio" name="workflow_type" value="broadcast" checked style="display: none;">
              <div class="type-card broadcast active">
                <div class="type-icon">${ICONS.broadcast}</div>
                <div class="type-title">Broadcast</div>
                <div class="type-description">One-time or scheduled send to your audience</div>
                <div class="type-examples">Product launches, announcements, promotions</div>
              </div>
            </label>
            <label class="workflow-type-card" onclick="selectWorkflowType('automated')">
              <input type="radio" name="workflow_type" value="automated" style="display: none;">
              <div class="type-card automated">
                <div class="type-icon">${ICONS.bot}</div>
                <div class="type-title">Automated</div>
                <div class="type-description">Event-triggered journey that runs continuously</div>
                <div class="type-examples">Welcome series, cart recovery, win-back</div>
              </div>
            </label>
            <label class="workflow-type-card" onclick="selectWorkflowType('recurring')">
              <input type="radio" name="workflow_type" value="recurring" style="display: none;">
              <div class="type-card recurring">
                <div class="type-icon">${ICONS.repeat}</div>
                <div class="type-title">Recurring</div>
                <div class="type-description">Scheduled workflow that repeats regularly</div>
                <div class="type-examples">Weekly newsletter, monthly roundup</div>
              </div>
            </label>
          </div>
        </div>
        ` : `
          <input type="hidden" name="workflow_type" value="${workflowType}">
          <div class="form-section">
            <div class="info-banner" style="padding: 1rem; background: #EFF6FF; border-left: 4px solid #3B82F6; border-radius: 0.5rem; margin-bottom: 1.5rem;">
              <strong>Workflow Type:</strong> 
              ${workflowType === 'broadcast' ? `${ICONS.broadcast} Broadcast` : workflowType === 'automated' ? `${ICONS.bot} Automated` : `${ICONS.repeat} Recurring`}
              <div style="font-size: 0.875rem; color: #6B7280; margin-top: 0.25rem;">Workflow type cannot be changed after creation</div>
            </div>
          </div>
        `}
        
        <!-- Basic Information -->
        <div class="form-section">
          <h3 class="form-section-title">Basic Information</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label form-label-required">Workflow Name</label>
              <input type="text" id="workflow-name" class="form-input" value="${workflow?.name || ''}" required placeholder="e.g., Summer Sale 2026">
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Description</label>
              <textarea id="workflow-description" class="form-input" rows="2" placeholder="Describe the purpose of this workflow">${workflow?.description || ''}</textarea>
            </div>
          </div>
        </div>
        
        <!-- Entry Trigger Configuration -->
        <div class="form-section" id="trigger-section">
          <h3 class="form-section-title">Entry Trigger</h3>
          <div class="form-grid" id="trigger-config">
            <!-- Dynamic trigger configuration will be inserted here -->
          </div>
        </div>
        
        <!-- Status -->
        <div class="form-section">
          <h3 class="form-section-title">Status</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Workflow Status</label>
              <select id="workflow-status" class="form-input">
                <option value="draft" ${workflow?.status === 'draft' ? 'selected' : ''}>Draft</option>
                <option value="active" ${workflow?.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="paused" ${workflow?.status === 'paused' ? 'selected' : ''}>Paused</option>
                ${isEdit && workflow?.status === 'completed' ? '<option value="completed" selected>Completed</option>' : ''}
                ${isEdit && workflow?.status === 'archived' ? '<option value="archived" selected>Archived</option>' : ''}
              </select>
              <div class="form-help">Draft workflows can be edited, active workflows are running</div>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="navigateTo('workflows', 'list')">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? `${ICONS.save} Update` : `${ICONS.sparkles} Create`} Workflow</button>
          ${isEdit ? `<button type="button" class="btn btn-primary" onclick="window.location.href='orchestration.html?workflowId=${workflow.id}'">${ICONS.palette} Edit Orchestration</button>` : ''}
        </div>
      </form>
    </div>
  `;
  
  // Initialize trigger configuration
  updateTriggerConfig(workflowType, workflow);
}

// Select workflow type (for new workflows)
function selectWorkflowType(type) {
  // Update radio button
  document.querySelectorAll('.workflow-type-card input[type="radio"]').forEach(radio => {
    radio.checked = radio.value === type;
  });
  
  // Update visual selection
  document.querySelectorAll('.type-card').forEach(card => {
    card.classList.remove('active');
  });
  event.currentTarget.querySelector('.type-card').classList.add('active');
  
  // Update trigger configuration
  updateTriggerConfig(type, null);
}

// Update trigger configuration based on workflow type
function updateTriggerConfig(workflowType, workflow = null) {
  const triggerConfig = document.getElementById('trigger-config');
  if (!triggerConfig) return;
  
  let html = '';
  
  if (workflowType === 'broadcast') {
    const triggerType = workflow?.entry_trigger?.type || 'manual';
    html = `
      <div class="form-group form-grid-full">
        <label class="form-label form-label-required">Send Option</label>
        <select id="entry-trigger-type" class="form-input" onchange="updateBroadcastTrigger(this.value)" required>
          <option value="manual" ${triggerType === 'manual' ? 'selected' : ''}>Send Now (Manual)</option>
          <option value="scheduled" ${triggerType === 'scheduled' ? 'selected' : ''}>Schedule for Later</option>
        </select>
      </div>
      <div id="schedule-fields" style="display: ${triggerType === 'scheduled' ? 'contents' : 'none'};">
        <div class="form-group">
          <label class="form-label form-label-required">Scheduled Date</label>
          <input type="date" id="scheduled-date" class="form-input" value="${workflow?.entry_trigger?.config?.scheduled_at ? new Date(workflow.entry_trigger.config.scheduled_at).toISOString().split('T')[0] : ''}">
        </div>
        <div class="form-group">
          <label class="form-label form-label-required">Scheduled Time</label>
          <input type="time" id="scheduled-time" class="form-input" value="${workflow?.entry_trigger?.config?.scheduled_at ? new Date(workflow.entry_trigger.config.scheduled_at).toTimeString().slice(0, 5) : '10:00'}">
        </div>
      </div>
    `;
  } else if (workflowType === 'automated') {
    const eventName = workflow?.entry_trigger?.config?.event_name || 'contact_created';
    html = `
      <div class="form-group form-grid-full">
        <label class="form-label form-label-required">Trigger Event</label>
        <select id="trigger-event" class="form-input" required>
          <option value="contact_created" ${eventName === 'contact_created' ? 'selected' : ''}>Contact Created (New Subscriber)</option>
          <option value="cart_abandoned" ${eventName === 'cart_abandoned' ? 'selected' : ''}>Cart Abandoned</option>
          <option value="order_completed" ${eventName === 'order_completed' ? 'selected' : ''}>Order Completed</option>
          <option value="inactivity_detected" ${eventName === 'inactivity_detected' ? 'selected' : ''}>Inactivity Detected</option>
          <option value="birthday" ${eventName === 'birthday' ? 'selected' : ''}>Birthday</option>
          <option value="loyalty_upgrade" ${eventName === 'loyalty_upgrade' ? 'selected' : ''}>Loyalty Tier Upgrade</option>
          <option value="browse_behavior" ${eventName === 'browse_behavior' ? 'selected' : ''}>Browse Behavior</option>
        </select>
        <div class="form-help">This workflow will trigger automatically when this event occurs</div>
      </div>
    `;
  } else if (workflowType === 'recurring') {
    const frequency = workflow?.entry_trigger?.config?.frequency || 'weekly';
    html = `
      <div class="form-group">
        <label class="form-label form-label-required">Frequency</label>
        <select id="recurring-frequency" class="form-input" onchange="updateRecurringFields(this.value)" required>
          <option value="daily" ${frequency === 'daily' ? 'selected' : ''}>Daily</option>
          <option value="weekly" ${frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
          <option value="monthly" ${frequency === 'monthly' ? 'selected' : ''}>Monthly</option>
        </select>
      </div>
      <div class="form-group" id="recurring-day-field" style="display: ${frequency !== 'daily' ? 'block' : 'none'};">
        <label class="form-label form-label-required">Day</label>
        ${frequency === 'weekly' ? `
          <select id="recurring-day" class="form-input" required>
            <option value="monday">Monday</option>
            <option value="tuesday">Tuesday</option>
            <option value="wednesday">Wednesday</option>
            <option value="thursday">Thursday</option>
            <option value="friday">Friday</option>
            <option value="saturday">Saturday</option>
            <option value="sunday">Sunday</option>
          </select>
        ` : `
          <input type="number" id="recurring-day" class="form-input" min="1" max="28" value="1" required>
          <div class="form-help">Day of month (1-28)</div>
        `}
      </div>
      <div class="form-group">
        <label class="form-label form-label-required">Time</label>
        <input type="time" id="recurring-time" class="form-input" value="${workflow?.entry_trigger?.config?.time || '10:00'}" required>
      </div>
    `;
  }
  
  triggerConfig.innerHTML = html;
}

// Helper functions for trigger config
function updateBroadcastTrigger(type) {
  const scheduleFields = document.getElementById('schedule-fields');
  if (scheduleFields) {
    scheduleFields.style.display = type === 'scheduled' ? 'contents' : 'none';
  }
}

function updateRecurringFields(frequency) {
  const dayField = document.getElementById('recurring-day-field');
  if (dayField) {
    dayField.style.display = frequency !== 'daily' ? 'block' : 'none';
  }
}

// Handle Workflow Form Submit
async function handleWorkflowSubmit(event) {
  event.preventDefault();
  
  const isEdit = currentRoute.id !== null;
  
  // Get workflow type
  const workflowType = isEdit 
    ? document.querySelector('input[name="workflow_type"]').value
    : document.querySelector('input[name="workflow_type"]:checked').value;
  
  // Base workflow data
  const workflowData = {
    name: document.getElementById('workflow-name').value,
    description: document.getElementById('workflow-description').value,
    status: document.getElementById('workflow-status').value
  };
  
  // Add workflow_type for new workflows
  if (!isEdit) {
    workflowData.workflow_type = workflowType;
  }
  
  // Build entry_trigger based on workflow type
  if (workflowType === 'broadcast') {
    const triggerType = document.getElementById('entry-trigger-type').value;
    workflowData.entry_trigger = {
      type: triggerType,
      config: {}
    };
    
    if (triggerType === 'scheduled') {
      const date = document.getElementById('scheduled-date').value;
      const time = document.getElementById('scheduled-time').value;
      if (date && time) {
        workflowData.entry_trigger.config.scheduled_at = `${date}T${time}:00Z`;
      }
    }
  } else if (workflowType === 'automated') {
    workflowData.entry_trigger = {
      type: 'event',
      config: {
        event_name: document.getElementById('trigger-event').value,
        conditions: {}
      }
    };
  } else if (workflowType === 'recurring') {
    const frequency = document.getElementById('recurring-frequency').value;
    const time = document.getElementById('recurring-time').value;
    
    workflowData.entry_trigger = {
      type: 'scheduled',
      config: {
        frequency: frequency,
        time: time
      }
    };
    
    if (frequency !== 'daily') {
      const day = document.getElementById('recurring-day').value;
      workflowData.entry_trigger.config.day = day;
    }
  }
  
  // Initialize empty orchestration for new workflows
  if (!isEdit) {
    workflowData.orchestration = {
      nodes: [],
      connections: []
    };
    workflowData.audience_config = {};
  }
  
  const url = isEdit ? `${API_BASE}/workflows/${currentRoute.id}` : `${API_BASE}/workflows`;
  const method = isEdit ? 'PUT' : 'POST';
  
  showLoading();
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflowData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save workflow');
    }
    
    const result = await response.json();
    
    hideLoading();
    showToast(`Workflow ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
    
    // For new workflows, optionally redirect to orchestration canvas
    if (!isEdit && result.id) {
      setTimeout(() => {
        if (confirm('Would you like to build the workflow orchestration now?')) {
          window.location.href = `orchestration.html?workflowId=${result.id}`;
        } else {
          navigateTo('workflows', 'list');
        }
      }, 500);
    } else {
      navigateTo('workflows', 'list');
    }
  } catch (error) {
    hideLoading();
    showToast(`Error ${isEdit ? 'updating' : 'creating'} workflow: ${error.message}`, 'error');
    console.error(error);
  }
}

// Segment filter helper functions
function updateSegmentFilter(key, value) {
  segmentFilters[key] = value;
  
  // Debounce search, reload immediately for other filters
  if (key === 'search') {
    debounce('segmentSearch', () => loadSegments(), 400);
  } else {
    loadSegments();
  }
}

function clearSegmentFilters() {
  segmentFilters = {
    status: 'all',
    type: 'all',
    search: ''
  };
  loadSegments();
}

// Render Segment Form
// Render Segment Form - Redirect to visual builder
function renderSegmentForm(segment = null) {
  const isEdit = !!segment;
  
  if (isEdit) {
    // Redirect to builder with segment ID
    window.location.href = `/segment-builder.html?id=${segment.id}`;
  } else {
    // Redirect to builder for new segment
    window.location.href = '/segment-builder.html';
  }
}

// Handle Segment Form Submit
async function handleSegmentSubmit(event) {
  event.preventDefault();
  
  const conditions = {};
  const lifecycle = document.getElementById('segment-lifecycle').value;
  const score = document.getElementById('segment-score').value;
  const status = document.getElementById('segment-status').value;
  
  if (lifecycle) conditions.lifecycle_stage = lifecycle;
  if (score) conditions.min_lead_score = parseInt(score);
  if (status) conditions.status = status;
  
  const segmentData = {
    name: document.getElementById('segment-name').value,
    description: document.getElementById('segment-description').value,
    segment_type: document.getElementById('segment-type').value,
    conditions
  };
  
  const isEdit = currentRoute.id !== null;
  const url = isEdit ? `${API_BASE}/segments/${currentRoute.id}` : `${API_BASE}/segments`;
  const method = isEdit ? 'PUT' : 'POST';
  
  showLoading();
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(segmentData)
    });
    
    if (!response.ok) throw new Error('Failed to save segment');
    
    hideLoading();
    showToast(`Segment ${isEdit ? 'updated' : 'created'} successfully`, 'success');
    navigateTo('segments', 'list');
  } catch (error) {
    hideLoading();
    showToast(`Error ${isEdit ? 'updating' : 'creating'} segment`, 'error');
  }
}

// Dashboard View
async function loadDashboard() {
  showLoading();
  try {
    const [dashboardRes, deliveriesRes, workflowsRes] = await Promise.all([
      fetch(`${API_BASE}/analytics/dashboard`),
      fetch(`${API_BASE}/deliveries`),
      fetch(`${API_BASE}/workflows`)
    ]);
    if (!dashboardRes.ok) {
      throw new Error(`HTTP ${dashboardRes.status}: ${dashboardRes.statusText}`);
    }
    const data = await dashboardRes.json();
    const deliveriesPayload = deliveriesRes.ok ? await deliveriesRes.json() : { deliveries: [] };
    const workflowsPayload = workflowsRes.ok ? await workflowsRes.json() : { workflows: [] };
    const deliveries = deliveriesPayload.deliveries || deliveriesPayload || [];
    const workflows = workflowsPayload.workflows || workflowsPayload || [];

    const greetingName = 'Chakravarthy Kalva';
    const features = [
      {
        icon: '📰',
        title: 'Experience Manager live and large copies',
        description: 'Launch web experiences faster with reusable content and templates.',
        tag: 'Experience Management',
        cta: 'Manage experiences'
      },
      {
        icon: ICONS.globe,
        title: 'Multilingual deliveries',
        description: 'Send localized messages with language variations and fallback logic.',
        tag: 'Campaign Management',
        cta: 'Create multilingual delivery'
      },
      {
        icon: ICONS.puzzle,
        title: 'Profile enrichment',
        description: 'Add behavioral and transactional attributes to improve targeting.',
        tag: 'Data Enrichment',
        cta: 'Enrich profiles'
      },
      {
        icon: ICONS.sparkles,
        title: 'Content experiments: A/B testing',
        description: 'Test subject lines, blocks, and offers with winner automation.',
        tag: 'Content Optimization',
        cta: 'Create content experiments'
      },
      {
        icon: ICONS.trendingUp,
        title: 'Continuous delivery activity',
        description: 'Monitor and optimize ongoing deliveries with live metrics.',
        tag: 'Continuous Delivery',
        cta: 'Continuous delivery'
      },
      {
        icon: ICONS.check,
        title: 'Campaign approval management',
        description: 'Control approvals with role-based workflows and audit trails.',
        tag: 'Campaign Operations',
        cta: 'Manage approvals'
      }
    ];

    const kpis = [
      { label: 'Deliveries', value: deliveries.length, suffix: '', meta: 'All channels' },
      { label: 'Open rate', value: data.email_metrics.open_rate, suffix: '%', meta: `${data.email_metrics.total_emails_sent.toLocaleString()} sent` },
      { label: 'Click rate', value: data.email_metrics.click_rate, suffix: '%', meta: `${data.email_metrics.total_clicks.toLocaleString()} clicks` },
      { label: 'Conversions', value: data.email_metrics.conversion_rate, suffix: '%', meta: `${data.email_metrics.total_conversions.toLocaleString()} conversions` },
      { label: 'Total contacts', value: data.contacts.total_contacts.toLocaleString(), suffix: '', meta: `+${data.contacts.new_contacts_30d} new (30 days)` },
      { label: 'Active workflows', value: data.workflows.active_workflows, suffix: '', meta: `${data.workflows.total_workflows} total` }
    ];

    const recentDeliveries = deliveries
      .slice()
      .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
      .slice(0, 5);
    const recentsRows = recentDeliveries.map(d => `
      <tr>
        <td><strong>${d.name || 'Untitled delivery'}</strong><div class="table-subtext">${d.channel || 'Email'}</div></td>
        <td>${d.channel || 'Email'}</td>
        <td><span class="status-pill status-${(d.status || 'draft').toLowerCase()}">${d.status || 'draft'}</span></td>
        <td>${d.created_by || 'System'}</td>
        <td>${d.updated_at ? new Date(d.updated_at).toLocaleDateString() : (d.created_at ? new Date(d.created_at).toLocaleDateString() : '—')}</td>
        <td><button class="btn btn-sm btn-secondary" onclick="editDelivery(${d.id})">Edit</button></td>
      </tr>
    `).join('');

    const content = `
      <div class="dashboard-greeting">Good morning, ${greetingName}!</div>
      <div class="dashboard-hero">
        <div class="dashboard-hero-left">
          <div class="dashboard-hero-title">Experience the new Campaign user interface</div>
          <p class="dashboard-hero-text">
            New views, simplified navigation, and collaboration features make multi-channel
            marketing faster and clearer for every team.
          </p>
          <div class="dashboard-hero-actions">
            <button class="btn btn-primary dashboard-pill">Get started with Campaign</button>
            <button class="btn btn-secondary dashboard-pill">See release notes</button>
          </div>
        </div>
        <div class="dashboard-hero-right">
          <div class="dashboard-carousel">
            <button class="carousel-nav prev" type="button" onclick="scrollDashboardCarousel(-1)">‹</button>
            <div class="dashboard-feature-track" id="dashboard-feature-track">
              ${features.map(feature => `
                <div class="dashboard-feature-card">
                  <div class="dashboard-feature-icon">${feature.icon}</div>
                  <div class="dashboard-feature-title">${feature.title}</div>
                  <div class="dashboard-feature-text">${feature.description}</div>
                <button class="dashboard-feature-tag" type="button" onclick="showToast('${feature.tag} filter coming soon', 'info')">${feature.tag}</button>
                </div>
              `).join('')}
            </div>
            <button class="carousel-nav next" type="button" onclick="scrollDashboardCarousel(1)">›</button>
          </div>
        </div>
      </div>

      <div class="dashboard-kpis">
        ${kpis.map(kpi => `
          <div class="dashboard-kpi">
            <div class="dashboard-kpi-label">${kpi.label}</div>
            <div class="dashboard-kpi-value">${kpi.value}${kpi.suffix}</div>
            <div class="dashboard-kpi-meta">${kpi.meta}</div>
          </div>
        `).join('')}
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Recents</h3>
            <div class="card-subtitle">Latest deliveries and updates across channels</div>
          </div>
          <button class="btn btn-secondary" onclick="loadDeliveries()">View all</button>
        </div>
        <div class="card-body dashboard-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Modified</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${recentsRows || '<tr><td colspan="6" class="empty-state">No recent deliveries found.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="dashboard-learning">
        <div class="dashboard-learning-header">
          <h3 class="card-title">Learning</h3>
          <span class="card-subtitle">Get started and go further</span>
        </div>
        <div class="dashboard-learning-grid">
          <div class="dashboard-learning-card">
            <div class="dashboard-learning-title">Help and documentation</div>
            <div class="dashboard-learning-text">Explore product guides, onboarding, and best practices.</div>
            <button class="btn btn-ghost dashboard-pill dashboard-learning-cta">Explore documentation</button>
          </div>
          <div class="dashboard-learning-card">
            <div class="dashboard-learning-title">Release notes</div>
            <div class="dashboard-learning-text">Track the latest updates across deliveries and orchestration.</div>
            <button class="btn btn-ghost dashboard-pill dashboard-learning-cta">View release notes</button>
          </div>
          <div class="dashboard-learning-card">
            <div class="dashboard-learning-title">Get started with emails</div>
            <div class="dashboard-learning-text">Build and publish your first delivery in minutes.</div>
            <button class="btn btn-ghost dashboard-pill dashboard-learning-cta">Create delivery</button>
          </div>
          <div class="dashboard-learning-card">
            <div class="dashboard-learning-title">Predefined filter management</div>
            <div class="dashboard-learning-text">Standardize filters for segments, audiences, and workflows.</div>
            <button class="btn btn-ghost dashboard-pill dashboard-learning-cta">Manage filters</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('content').innerHTML = content;
    initDashboardCarousel();
  } catch (error) {
    console.error('Dashboard load error:', error);
    showError(`Failed to load dashboard: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// Customers View with CRUD
// Filter state for contacts
let contactFilters = {
  status: 'all',
  subscription: 'all',
  loyalty: 'all',
  engagement: 'all',
  search: ''
};

function setSegmentTab(tabLabel) {
  const map = {
    'All': 'all',
    'Dynamic': 'dynamic',
    'Static': 'static'
  };
  segmentFilters.type = map[tabLabel] || 'all';
  loadSegments();
}

function setAudienceTab(tabLabel) {
  const map = {
    'All': 'all',
    'Segment-based': 'segment_based',
    'Combined': 'combined',
    'Imported': 'imported'
  };
  audienceFilters.type = map[tabLabel] || 'all';
  loadAudiences();
}

function initDashboardCarousel() {
  const track = document.getElementById('dashboard-feature-track');
  if (!track) return;
  const observer = new ResizeObserver(() => {
    track.dataset.cardWidth = track.querySelector('.dashboard-feature-card')?.offsetWidth || 320;
  });
  observer.observe(track);
}

function scrollDashboardCarousel(direction) {
  const track = document.getElementById('dashboard-feature-track');
  if (!track) return;
  const card = track.querySelector('.dashboard-feature-card');
  const cardWidth = card ? card.offsetWidth : 320;
  const gap = parseInt(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '16', 10) || 16;
  track.scrollBy({ left: direction * (cardWidth + gap), behavior: 'smooth' });
}

function clearContactFilterTag(key) {
  switch (key) {
    case 'status':
      contactFilters.status = 'all';
      break;
    case 'subscription':
      contactFilters.subscription = 'all';
      break;
    case 'loyalty':
      contactFilters.loyalty = 'all';
      break;
    case 'engagement':
      contactFilters.engagement = 'all';
      break;
    case 'search':
      contactFilters.search = '';
      break;
  }
  loadContacts();
}

function clearWorkflowFilterTag(key) {
  switch (key) {
    case 'type':
      workflowFilters.type = 'all';
      currentWorkflowFilter = 'all';
      break;
    case 'status':
      workflowFilters.status = 'all';
      break;
    case 'search':
      workflowFilters.search = '';
      break;
  }
  loadWorkflows(workflowFilters.type);
}

function clearSegmentFilterTag(key) {
  switch (key) {
    case 'type':
      segmentFilters.type = 'all';
      break;
    case 'status':
      segmentFilters.status = 'all';
      break;
    case 'search':
      segmentFilters.search = '';
      break;
  }
  loadSegments();
}

function clearAudienceFilterTag(key) {
  switch (key) {
    case 'type':
      audienceFilters.type = 'all';
      break;
    case 'status':
      audienceFilters.status = 'all';
      break;
    case 'search':
      audienceFilters.search = '';
      break;
  }
  loadAudiences();
}

async function loadContacts() {
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/contacts?limit=100`);
    const data = await response.json();
    
    // Apply filters
    let filteredContacts = data.contacts.filter(contact => {
      if (contactFilters.status !== 'all' && contact.status !== contactFilters.status) return false;
      if (contactFilters.subscription !== 'all' && contact.subscription_status !== contactFilters.subscription) return false;
      if (contactFilters.loyalty !== 'all' && contact.loyalty_tier !== contactFilters.loyalty) return false;
      
      if (contactFilters.engagement !== 'all') {
        const score = contact.engagement_score || 0;
        if (contactFilters.engagement === 'high' && score < 70) return false;
        if (contactFilters.engagement === 'medium' && (score < 40 || score >= 70)) return false;
        if (contactFilters.engagement === 'low' && score >= 40) return false;
      }
      
      if (contactFilters.search) {
        const searchTerm = contactFilters.search.toLowerCase();
        const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
        const email = (contact.email || '').toLowerCase();
        if (!fullName.includes(searchTerm) && !email.includes(searchTerm)) return false;
      }
      
      return true;
    });
    
    // Apply sorting
    filteredContacts = applySorting(filteredContacts, currentTableSort.column || 'id');
    
    // Generate Adobe Campaign style table rows
    const tableRows = filteredContacts.map(c => {
      const statusMap = {
        'active': 'in-progress',
        'inactive': 'paused'
      };
      
      const subStatus = c.subscription_status === 'subscribed' ? 'in-progress' : 'stopped';
      
      const actions = [
        {icon: ICONS.edit, label: 'Edit', onclick: `navigateTo('contacts', 'edit', ${c.id})`},
        {icon: ICONS.barChart, label: 'View Activity', onclick: `showToast('View activity for ${c.first_name}', 'info')`},
        {divider: true},
        {icon: ICONS.trash, label: 'Delete', onclick: `deleteContact(${c.id})`, danger: true}
      ];
      
      return `
        <tr>
          <td data-column-id="first_name">${createTableLink(`${c.first_name || ''} ${c.last_name || ''}`, `navigateTo('contacts', 'edit', ${c.id})`)}</td>
          <td data-column-id="email">${c.email}</td>
          <td data-column-id="phone">${c.phone || '-'}</td>
          <td data-column-id="status">${createStatusIndicator(statusMap[c.status] || 'draft', c.status)}</td>
          <td data-column-id="subscription_status">${createStatusIndicator(subStatus, c.subscription_status || 'N/A')}</td>
          <td data-column-id="loyalty_tier">${c.loyalty_tier || '-'}</td>
          <td data-column-id="engagement_score">${c.engagement_score || 0}/100</td>
          <td data-column-id="created_at">${new Date(c.created_at || Date.now()).toLocaleDateString()}</td>
          <td>${createActionMenu(c.id, actions)}</td>
        </tr>
      `;
    }).join('');

    const filterTags = [];
    if (contactFilters.status !== 'all') {
      filterTags.push({ key: 'status', label: 'Status', value: contactFilters.status });
    }
    if (contactFilters.subscription !== 'all') {
      filterTags.push({ key: 'subscription', label: 'Subscription', value: contactFilters.subscription });
    }
    if (contactFilters.loyalty !== 'all') {
      filterTags.push({ key: 'loyalty', label: 'Loyalty', value: contactFilters.loyalty });
    }
    if (contactFilters.engagement !== 'all') {
      filterTags.push({ key: 'engagement', label: 'Engagement', value: contactFilters.engagement });
    }
    if (contactFilters.search) {
      filterTags.push({ key: 'search', label: 'Search', value: contactFilters.search });
    }
    
    const columns = [
      { id: 'first_name', label: 'Name' },
      { id: 'email', label: 'Email' },
      { id: 'phone', label: 'Phone' },
      { id: 'status', label: 'Status' },
      { id: 'subscription_status', label: 'Subscription' },
      { id: 'loyalty_tier', label: 'Loyalty' },
      { id: 'engagement_score', label: 'Engagement' },
      { id: 'created_at', label: 'Created' }
    ];
    
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${ICONS.users} Profiles</h3>
        </div>
        
        ${createTableToolbar({
          tabs: [
            {id: 'all', label: 'All', active: true, onclick: 'loadContacts()'},
            {id: 'import', label: 'Import', active: false, onclick: 'showContactImportDialog()'},
            {id: 'export', label: 'Export', active: false, onclick: 'showContactExportDialog()'}
          ],
          resultCount: filteredContacts.length,
          totalCount: data.contacts.length,
          showRefresh: false,
          showColumnSelector: true,
          columns,
          viewKey: 'contacts',
          showSearch: true,
          searchPlaceholder: 'Search contacts...',
          searchValue: contactFilters.search || '',
          onSearch: 'updateContactFilter("search", this.value)',
          filterTags,
          onClearTag: 'clearContactFilterTag',
          filters: [
            {
              type: 'select',
              label: 'Status',
              value: contactFilters.status,
              onChange: 'updateContactFilter("status", this.value)',
              options: [
                {value: 'all', label: 'All Statuses'},
                {value: 'active', label: 'Active'},
                {value: 'inactive', label: 'Inactive'}
              ]
            },
            {
              type: 'select',
              label: 'Subscription',
              value: contactFilters.subscription,
              onChange: 'updateContactFilter("subscription", this.value)',
              options: [
                {value: 'all', label: 'All'},
                {value: 'subscribed', label: 'Subscribed'},
                {value: 'unsubscribed', label: 'Unsubscribed'},
                {value: 'pending', label: 'Pending'}
              ]
            },
            {
              type: 'select',
              label: 'Loyalty',
              value: contactFilters.loyalty,
              onChange: 'updateContactFilter("loyalty", this.value)',
              options: [
                {value: 'all', label: 'All Tiers'},
                {value: 'platinum', label: 'Platinum'},
                {value: 'gold', label: 'Gold'},
                {value: 'silver', label: 'Silver'},
                {value: 'bronze', label: 'Bronze'}
              ]
            }
          ]
        })}
        
        <div class="data-table-container">
          <table class="data-table" data-view="contacts">
            <thead>
              <tr>
                ${createSortableHeader('first_name', 'Name', currentTableSort)}
                ${createSortableHeader('email', 'Email', currentTableSort)}
                <th data-column-id="phone">Phone</th>
                ${createSortableHeader('status', 'Status', currentTableSort)}
                ${createSortableHeader('subscription_status', 'Subscription', currentTableSort)}
                ${createSortableHeader('loyalty_tier', 'Loyalty', currentTableSort)}
                ${createSortableHeader('engagement_score', 'Engagement', currentTableSort)}
                ${createSortableHeader('created_at', 'Created', currentTableSort)}
                <th style="width: 50px;"></th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #6B7280;">No contacts found</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    document.getElementById('content').innerHTML = content;
    applyColumnVisibility('contacts');
  } catch (error) {
    showError('Failed to load contacts');
    console.error(error);
  } finally {
    hideLoading();
  }
}

// Contact filter helper functions
function updateContactFilter(key, value) {
  contactFilters[key] = value;
  
  // Debounce search, reload immediately for other filters
  if (key === 'search') {
    debounce('contactSearch', () => loadContacts(), 400);
  } else {
    loadContacts();
  }
}

function clearContactFilters() {
  contactFilters = {
    status: 'all',
    subscription: 'all',
    loyalty: 'all',
    engagement: 'all',
    search: ''
  };
  loadContacts();
}

// Show Customer Modal (Create/Edit)
function showCustomerModal(customer = null) {
  currentEditId = customer ? customer.id : null;
  
  document.getElementById('modal-title').textContent = customer ? 'Edit Customer' : 'Create Customer';
  document.querySelector('.modal-content').classList.add('modal-with-ai');
  
  const formHtml = `
    <div class="form-group">
      <label class="form-label">Email *</label>
      <input type="email" id="customer-email" class="form-input" value="${customer?.email || ''}" required>
    </div>
    <div class="form-group">
      <label class="form-label">First Name</label>
      <input type="text" id="customer-first-name" class="form-input" value="${customer?.first_name || ''}">
    </div>
    <div class="form-group">
      <label class="form-label">Last Name</label>
      <input type="text" id="customer-last-name" class="form-input" value="${customer?.last_name || ''}">
    </div>
    <div class="form-group">
      <label class="form-label">Phone</label>
      <input type="tel" id="customer-phone" class="form-input" value="${customer?.phone || ''}">
    </div>
    <div class="form-group">
      <label class="form-label">Status</label>
      <select id="customer-status" class="form-input">
        <option value="active" ${customer?.status === 'active' ? 'selected' : ''}>Active</option>
        <option value="inactive" ${customer?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Lifecycle Stage</label>
      <select id="customer-lifecycle" class="form-input">
        <option value="">Select...</option>
        <option value="lead" ${customer?.lifecycle_stage === 'lead' ? 'selected' : ''}>Lead</option>
        <option value="customer" ${customer?.lifecycle_stage === 'customer' ? 'selected' : ''}>Customer</option>
        <option value="vip" ${customer?.lifecycle_stage === 'vip' ? 'selected' : ''}>VIP</option>
        <option value="at_risk" ${customer?.lifecycle_stage === 'at_risk' ? 'selected' : ''}>At Risk</option>
        <option value="churned" ${customer?.lifecycle_stage === 'churned' ? 'selected' : ''}>Churned</option>
      </select>
    </div>
  `;
  
  const aiAssistant = createAIAssistant('customer', {
    suggestions: [
      { label: 'Tip', text: 'Set lifecycle stage based on purchase history and engagement' },
      { label: 'Best Practice', text: 'VIP customers typically have 5+ orders or $500+ lifetime value' },
      { label: 'Recommendation', text: 'Mark customers as "At Risk" if no activity in 60+ days' }
    ]
  });
  
  const modalBody = `
    <div class="modal-body-split">
      <div class="modal-form-section">
        ${formHtml}
      </div>
      ${aiAssistant}
    </div>
  `;
  
  document.getElementById('modal-body').innerHTML = modalBody;
  document.getElementById('modal').classList.remove('hidden');
  
  document.getElementById('modal-submit-btn').onclick = saveCustomer;
}

// Save Customer
async function saveCustomer() {
  const data = {
    email: document.getElementById('customer-email').value,
    first_name: document.getElementById('customer-first-name').value,
    last_name: document.getElementById('customer-last-name').value,
    phone: document.getElementById('customer-phone').value,
    status: document.getElementById('customer-status').value,
    lifecycle_stage: document.getElementById('customer-lifecycle').value
  };
  
  if (!data.email) {
    showError('Email is required');
    return;
  }
  
  showLoading();
  try {
    const url = currentEditId ? `${API_BASE}/contacts/${currentEditId}` : `${API_BASE}/contacts`;
    const method = currentEditId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save customer');
    }
    
    closeModal();
    showToast(currentEditId ? 'Customer updated successfully!' : 'Customer created successfully!', 'success');
    loadContacts();
  } catch (error) {
    showError(error.message);
  } finally {
    hideLoading();
  }
}

// Edit Customer
async function editCustomer(id) {
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/contacts/${id}`);
    const customer = await response.json();
    showCustomerModal(customer);
  } catch (error) {
    showError('Failed to load customer');
  } finally {
    hideLoading();
  }
}

// Delete Customer
function deleteContact(id) {
  showConfirmModal('Are you sure you want to delete this contact?', async () => {
    showLoading();
    try {
      const response = await fetch(`${API_BASE}/contacts/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      
      showToast('Contact deleted successfully!', 'success');
      loadContacts();
    } catch (error) {
      showError('Failed to delete contact');
    } finally {
      hideLoading();
    }
  });
}

// Campaigns View with CRUD
async function loadCampaigns() {
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/campaigns?limit=50`);
    const data = await response.json();
    
    let tableRows = '';
    for (const campaign of data.campaigns) {
      const statusBadge = 
        campaign.status === 'active' ? 'badge-success' :
        campaign.status === 'completed' ? 'badge-info' :
        campaign.status === 'draft' ? 'badge-secondary' : 'badge-warning';
      
      tableRows += `
        <tr>
          <td>${campaign.id}</td>
          <td>${campaign.name}</td>
          <td><span class="badge ${statusBadge}">${campaign.status}</span></td>
          <td>${campaign.subject_line || 'N/A'}</td>
          <td>${campaign.campaign_type}</td>
          <td>${campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : 'N/A'}</td>
          <td>
            <div class="action-buttons">
              ${campaign.status !== 'draft' ? `<button class="btn btn-sm btn-info" onclick="viewCampaignReport(${campaign.id})" title="View Campaign Report">${ICONS.barChart} Report</button>` : ''}
              <button class="btn btn-sm btn-primary" onclick="openOrchestration(${campaign.id})" title="Open Orchestration Canvas">${ICONS.palette} Orchestrate</button>
              ${campaign.status === 'draft' ? `<button class="btn btn-sm btn-success" onclick="changeCampaignStatus(${campaign.id}, 'active')" title="Activate Campaign">${ICONS.play} Activate</button>` : ''}
              ${campaign.status === 'active' ? `<button class="btn btn-sm btn-warning" onclick="changeCampaignStatus(${campaign.id}, 'paused')" title="Pause Campaign">${ICONS.pause} Pause</button>` : ''}
              ${campaign.status === 'paused' ? `<button class="btn btn-sm btn-success" onclick="changeCampaignStatus(${campaign.id}, 'active')" title="Resume Campaign">${ICONS.play} Resume</button>` : ''}
              ${['active', 'paused'].includes(campaign.status) ? `<button class="btn btn-sm btn-info" onclick="changeCampaignStatus(${campaign.id}, 'completed')" title="Complete Campaign">${ICONS.check} Complete</button>` : ''}
              <button class="btn btn-sm btn-secondary" onclick="navigateTo('campaigns', 'edit', ${campaign.id})">${ICONS.edit} Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteCampaign(${campaign.id})">${ICONS.trash} Delete</button>
            </div>
          </td>
        </tr>
      `;
    }
    
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Campaign List (${data.pagination.total} total)</h3>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows || '<tr><td colspan="7" style="text-align: center;">No campaigns found</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('content').innerHTML = content;
  } catch (error) {
    showError('Failed to load campaigns');
    console.error(error);
  } finally {
    hideLoading();
  }
}

// Show Campaign Modal
function showCampaignModal(campaign = null) {
  currentEditId = campaign ? campaign.id : null;
  
  document.getElementById('modal-title').textContent = campaign ? 'Edit Campaign' : 'Create Campaign';
  document.querySelector('.modal-content').classList.add('modal-with-ai');
  
  const formHtml = `
    <div class="form-group">
      <label class="form-label">Campaign Name *</label>
      <input type="text" id="campaign-name" class="form-input" value="${campaign?.name || ''}" required>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea id="campaign-description" class="form-input" rows="2">${campaign?.description || ''}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Campaign Type</label>
      <select id="campaign-type" class="form-input">
        <option value="email" ${campaign?.campaign_type === 'email' ? 'selected' : ''}>Email</option>
        <option value="sms" ${campaign?.campaign_type === 'sms' ? 'selected' : ''}>SMS</option>
        <option value="push" ${campaign?.campaign_type === 'push' ? 'selected' : ''}>Push Notification</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Subject Line *</label>
      <input type="text" id="campaign-subject" class="form-input" value="${campaign?.subject_line || ''}" required>
      <button type="button" class="btn btn-sm btn-secondary" style="margin-top: 0.5rem;" onclick="generateSubjectForCampaign()">
        ${ICONS.sparkles} Generate with AI
      </button>
    </div>
    <div class="form-group">
      <label class="form-label">Email Content (HTML)</label>
      <textarea id="campaign-content" class="form-input" rows="6">${campaign?.content_html || '<h1>Your Campaign Title</h1><p>Your message here...</p>'}</textarea>
      <button type="button" class="btn btn-sm btn-secondary" style="margin-top: 0.5rem;" onclick="generateContentForCampaign()">
        ${ICONS.sparkles} Generate with AI
      </button>
    </div>
  `;
  
  const aiAssistant = createAIAssistant('campaign', {
    suggestions: [
      { label: 'Subject Line Tip', text: 'Keep subject lines under 50 characters for best mobile display' },
      { label: 'Best Practice', text: 'Use personalization: "Hi {{first_name}}" increases open rates by 26%' },
      { label: 'Emoji Tip', text: 'Adding 1-2 emojis can increase open rates by 15-20%' },
      { label: 'Timing', text: 'Tuesday-Thursday, 10 AM or 2 PM typically have highest open rates' },
      { label: 'A/B Testing', text: 'Test different subject lines to find what resonates with your audience' }
    ],
    quickActions: [
      { text: `${ICONS.sparkles} Generate Subject Lines`, action: 'generateSubjectForCampaign' },
      { text: `${ICONS.sparkles} Generate Email Content`, action: 'generateContentForCampaign' },
      { text: `${ICONS.target} Suggest Improvements`, action: 'suggestCampaignImprovements' }
    ]
  });
  
  const modalBody = `
    <div class="modal-body-split">
      <div class="modal-form-section">
        ${formHtml}
      </div>
      ${aiAssistant}
    </div>
  `;
  
  document.getElementById('modal-body').innerHTML = modalBody;
  document.getElementById('modal').classList.remove('hidden');
  
  document.getElementById('modal-submit-btn').onclick = saveCampaign;
}

// Save Campaign
async function saveCampaign() {
  const data = {
    name: document.getElementById('campaign-name').value,
    description: document.getElementById('campaign-description').value,
    campaign_type: document.getElementById('campaign-type').value,
    subject_line: document.getElementById('campaign-subject').value,
    content_html: document.getElementById('campaign-content').value
  };
  
  if (!data.name || !data.subject_line) {
    showError('Name and subject line are required');
    return;
  }
  
  showLoading();
  try {
    const url = currentEditId ? `${API_BASE}/campaigns/${currentEditId}` : `${API_BASE}/campaigns`;
    const method = currentEditId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error('Failed to save campaign');
    
    closeModal();
    showToast(currentEditId ? 'Campaign updated successfully!' : 'Campaign created successfully!', 'success');
    loadCampaigns();
  } catch (error) {
    showError(error.message);
  } finally {
    hideLoading();
  }
}

// Edit Campaign
async function editCampaign(id) {
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/campaigns/${id}`);
    const campaign = await response.json();
    showCampaignModal(campaign);
  } catch (error) {
    showError('Failed to load campaign');
  } finally {
    hideLoading();
  }
}

// Send Campaign
async function sendCampaign(id) {
  showConfirmModal('Are you sure you want to send this campaign to all active customers?', async () => {
    showLoading();
    try {
      const response = await fetch(`${API_BASE}/campaigns/${id}/send`, { method: 'POST' });
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error || 'Failed to send campaign');
      
      showToast(`Campaign sent to ${result.recipients_count} recipients!`, 'success');
      loadCampaigns();
    } catch (error) {
      showError(error.message);
    } finally {
      hideLoading();
    }
  });
}

// Delete Campaign
// Change campaign status
async function changeCampaignStatus(id, newStatus) {
  const statusNames = {
    active: 'activate',
    paused: 'pause',
    completed: 'complete',
    archived: 'archive'
  };
  
  const action = statusNames[newStatus] || 'change';
  
  showConfirmModal(`Are you sure you want to ${action} this campaign?`, async () => {
    showLoading();
    try {
      const response = await fetch(`${API_BASE}/campaigns/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change status');
      }
      
      hideLoading();
      showToast(`Campaign ${action}d successfully!`, 'success');
      loadCampaigns();
    } catch (error) {
      hideLoading();
      showError(error.message || 'Failed to change campaign status');
    }
  });
}

function deleteCampaign(id) {
  showConfirmModal('Are you sure you want to delete this campaign?', async () => {
    showLoading();
    try {
      const response = await fetch(`${API_BASE}/campaigns/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      
      showToast('Campaign deleted successfully!', 'success');
      loadCampaigns();
    } catch (error) {
      showError('Failed to delete campaign');
    } finally {
      hideLoading();
    }
  });
}

// Workflows View with CRUD
// Workflows View (Unified: Broadcast + Automated + Recurring)
let currentWorkflowFilter = 'all'; // all, broadcast, automated, recurring

// Additional workflow filters
let workflowFilters = {
  type: 'all',
  status: 'all',
  search: ''
};

async function loadWorkflows(filterType = 'all') {
  showLoading();
  currentWorkflowFilter = filterType;
  workflowFilters.type = filterType;
  
  try {
    const response = await fetch(`${API_BASE}/workflows`);
    let workflows = await response.json();
    const allWorkflows = Array.isArray(workflows) ? workflows : [];
    const [segmentsResp, audiencesResp, deliveriesResp] = await Promise.all([
      fetch(`${API_BASE}/segments`),
      fetch(`${API_BASE}/audiences`),
      fetch(`${API_BASE}/deliveries`)
    ]);
    const segmentsData = await segmentsResp.json();
    const audiencesData = await audiencesResp.json();
    const deliveriesData = await deliveriesResp.json();
    const segments = segmentsData.segments || segmentsData || [];
    const audiences = audiencesData.audiences || audiencesData || [];
    const deliveries = deliveriesData.deliveries || deliveriesData || [];
    const segmentById = new Map(segments.map(seg => [seg.id, seg]));
    const audienceById = new Map(audiences.map(aud => [aud.id, aud]));
    const deliveryById = new Map(deliveries.map(delivery => [delivery.id, delivery]));
    
    // Apply filters
    workflows = workflows.filter(w => {
      if (workflowFilters.type !== 'all' && w.workflow_type !== workflowFilters.type) return false;
      if (workflowFilters.status !== 'all' && w.status !== workflowFilters.status) return false;
      if (workflowFilters.search) {
        const searchTerm = workflowFilters.search.toLowerCase();
        const name = (w.name || '').toLowerCase();
        const desc = (w.description || '').toLowerCase();
        if (!name.includes(searchTerm) && !desc.includes(searchTerm)) return false;
      }
      return true;
    });
    
    // Apply sorting
    workflows = applySorting(workflows, currentTableSort.column || 'id');
    
    const counts = {
      all: workflows.length,
      broadcast: workflows.filter(w => w.workflow_type === 'broadcast').length,
      automated: workflows.filter(w => w.workflow_type === 'automated').length,
      recurring: workflows.filter(w => w.workflow_type === 'recurring').length
    };

    const filterTags = [];
    if (workflowFilters.type !== 'all') {
      filterTags.push({ key: 'type', label: 'Type', value: workflowFilters.type });
    }
    if (workflowFilters.status !== 'all') {
      filterTags.push({ key: 'status', label: 'Status', value: workflowFilters.status });
    }
    if (workflowFilters.search) {
      filterTags.push({ key: 'search', label: 'Search', value: workflowFilters.search });
    }
    
    // Generate Adobe Campaign style table rows
    const tableRows = workflows.map(w => {
      const statusMap = {
        'active': 'in-progress',
        'paused': 'paused',
        'completed': 'stopped',
        'draft': 'draft',
        'archived': 'draft'
      };
      
      const typeIcon = 
        w.workflow_type === 'broadcast' ? ICONS.broadcast :
        w.workflow_type === 'automated' ? ICONS.bot : ICONS.repeat;
      
      const usage = { segments: [], audiences: [], deliveries: [] };
      const addUniqueUsage = (list, item) => {
        if (!list.some(existing => existing.id === item.id)) {
          list.push(item);
        }
      };
      const nodes = w.orchestration?.nodes || [];
      nodes.forEach(node => {
        if (node.type === 'segment' && node.config?.segment_id) {
          const segment = segmentById.get(node.config.segment_id);
          if (segment) addUniqueUsage(usage.segments, { id: segment.id, name: segment.name });
        }
        if (['query', 'build_audience'].includes(node.type)) {
          if (node.config?.source_type === 'segment' && node.config?.segment_id) {
            const segment = segmentById.get(node.config.segment_id);
            if (segment) addUniqueUsage(usage.segments, { id: segment.id, name: segment.name });
          }
          if (node.config?.source_type === 'audience' && node.config?.audience_id) {
            const audience = audienceById.get(node.config.audience_id);
            if (audience) addUniqueUsage(usage.audiences, { id: audience.id, name: audience.name });
          }
        }
        if (['email', 'sms', 'push', 'direct_mail'].includes(node.type) && node.config?.delivery_id) {
          const delivery = deliveryById.get(node.config.delivery_id);
          if (delivery) addUniqueUsage(usage.deliveries, { id: delivery.id, name: delivery.name });
        }
      });
      
      const usedInItems = [
        ...usage.segments.map(seg => ({ label: `Segment: ${seg.name}`, onclick: `navigateTo('segments', 'edit', ${seg.id})` })),
        ...usage.audiences.map(aud => ({ label: `Audience: ${aud.name}`, onclick: `navigateTo('audiences', 'edit', ${aud.id})` })),
        ...usage.deliveries.map(delivery => ({ label: `Delivery: ${delivery.name}`, onclick: `editDelivery(${delivery.id})` }))
      ];
      
      const actions = [
        {icon: ICONS.edit, label: 'Edit', onclick: `navigateTo('workflows', 'edit', ${w.id})`},
        {icon: ICONS.palette, label: 'Orchestration', onclick: `window.location.href='orchestration.html?workflowId=${w.id}'`},
        {icon: ICONS.barChart, label: 'View Report', onclick: `showWorkflowReport(${w.id})`},
        {divider: true}
      ];
      
      if (w.status === 'draft' || w.status === 'paused') {
        actions.push({icon: ICONS.play, label: 'Activate', onclick: `activateWorkflow(${w.id})`});
      }
      if (w.status === 'active') {
        actions.push({icon: ICONS.pause, label: 'Pause', onclick: `pauseWorkflow(${w.id})`});
      }
      
      actions.push({divider: true});
      actions.push({icon: ICONS.trash, label: 'Delete', onclick: `confirmDeleteWorkflow(${w.id})`, danger: true});
      
      return `
        <tr>
          <td data-column-id="name">${createTableLink(`${typeIcon} ${w.name}`, `navigateTo('workflows', 'edit', ${w.id})`)}</td>
          <td data-column-id="status">${createStatusIndicator(statusMap[w.status] || 'draft', w.status)}</td>
          <td data-column-id="workflow_type">${w.workflow_type}</td>
          <td data-column-id="used_in">${renderUsedInList(usedInItems)}</td>
          <td data-column-id="created_by">${w.created_by || 'System'}</td>
          <td data-column-id="created_at">${w.created_at ? new Date(w.created_at).toLocaleString() : '-'}</td>
          <td data-column-id="updated_by">${w.updated_by || 'System'}</td>
          <td data-column-id="updated_at">${new Date(w.updated_at || w.created_at || Date.now()).toLocaleString()}</td>
          <td data-column-id="last_run_at">${w.last_run_at ? new Date(w.last_run_at).toLocaleString() : '-'}</td>
          <td data-column-id="next_run_at">${w.next_run_at ? new Date(w.next_run_at).toLocaleString() : '-'}</td>
          <td>${createActionMenu(w.id, actions)}</td>
        </tr>
      `;
    }).join('');
    
    const columns = [
      { id: 'name', label: 'Workflow' },
      { id: 'status', label: 'Status' },
      { id: 'workflow_type', label: 'Type' },
      { id: 'used_in', label: 'Uses' },
      { id: 'created_by', label: 'Created by' },
      { id: 'created_at', label: 'Created at' },
      { id: 'updated_by', label: 'Updated by' },
      { id: 'updated_at', label: 'Updated at' },
      { id: 'last_run_at', label: 'Last processing' },
      { id: 'next_run_at', label: 'Next processing' }
    ];
    
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${ICONS.zap} Workflows</h3>
          <button class="btn btn-primary" onclick="navigateTo('workflows', 'create')">+ Create Workflow</button>
        </div>
        
        ${createTableToolbar({
          tabs: [
            {id: 'all', label: `All (${counts.all})`, active: filterType === 'all', onclick: 'loadWorkflows("all")'},
            {id: 'broadcast', label: `${ICONS.broadcast} Broadcast (${counts.broadcast})`, active: filterType === 'broadcast', onclick: 'loadWorkflows("broadcast")'},
            {id: 'automated', label: `${ICONS.bot} Automated (${counts.automated})`, active: filterType === 'automated', onclick: 'loadWorkflows("automated")'},
            {id: 'recurring', label: `${ICONS.repeat} Recurring (${counts.recurring})`, active: filterType === 'recurring', onclick: 'loadWorkflows("recurring")'}
          ],
          resultCount: workflows.length,
          totalCount: allWorkflows.length,
          showRefresh: false,
          showColumnSelector: true,
          columns,
          viewKey: 'workflows',
          showSearch: true,
          searchPlaceholder: 'Search workflows...',
          searchValue: workflowFilters.search || '',
          onSearch: 'updateWorkflowFilter("search", this.value)',
          filterTags,
          onClearTag: 'clearWorkflowFilterTag',
          filters: [
            {
              type: 'select',
              label: 'Status',
              value: workflowFilters.status,
              onChange: 'updateWorkflowFilter("status", this.value)',
              options: [
                {value: 'all', label: 'All Statuses'},
                {value: 'draft', label: 'Draft'},
                {value: 'active', label: 'Active'},
                {value: 'paused', label: 'Paused'},
                {value: 'completed', label: 'Completed'},
                {value: 'archived', label: 'Archived'}
              ]
            }
          ]
        })}
        
        <div class="data-table-container">
          <table class="data-table" data-view="workflows">
            <thead>
              <tr>
                ${createSortableHeader('name', 'Workflow', currentTableSort)}
                ${createSortableHeader('status', 'Status', currentTableSort)}
                ${createSortableHeader('workflow_type', 'Type', currentTableSort)}
                <th data-column-id="used_in">Uses</th>
                ${createSortableHeader('created_by', 'Created by', currentTableSort)}
                ${createSortableHeader('created_at', 'Created at', currentTableSort)}
                ${createSortableHeader('updated_by', 'Updated by', currentTableSort)}
                ${createSortableHeader('updated_at', 'Updated at', currentTableSort)}
                <th data-column-id="last_run_at">Last processing</th>
                <th data-column-id="next_run_at">Next processing</th>
                <th style="width: 50px;"></th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="11" style="text-align: center; padding: 2rem; color: #6B7280;">No workflows found</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    document.getElementById('content').innerHTML = content;
    applyColumnVisibility('workflows');
  } catch (error) {
    showError('Failed to load workflows: ' + error.message);
  } finally {
    hideLoading();
  }
}

// Show Workflow Modal
function showWorkflowModal(workflow = null) {
  currentEditId = workflow ? workflow.id : null;
  
  document.getElementById('modal-title').textContent = workflow ? 'Edit Workflow' : 'Create Workflow';
  document.querySelector('.modal-content').classList.add('modal-with-ai');
  
  const formHtml = `
    <div class="form-group">
      <label class="form-label">Workflow Name *</label>
      <input type="text" id="workflow-name" class="form-input" value="${workflow?.name || ''}" required>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea id="workflow-description" class="form-input" rows="2">${workflow?.description || ''}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Trigger Type *</label>
      <select id="workflow-trigger" class="form-input">
        <option value="customer_created" ${workflow?.trigger_type === 'customer_created' ? 'selected' : ''}>Customer Created</option>
        <option value="order_completed" ${workflow?.trigger_type === 'order_completed' ? 'selected' : ''}>Order Completed</option>
        <option value="cart_abandoned" ${workflow?.trigger_type === 'cart_abandoned' ? 'selected' : ''}>Cart Abandoned</option>
        <option value="email_opened" ${workflow?.trigger_type === 'email_opened' ? 'selected' : ''}>Email Opened</option>
        <option value="scheduled" ${workflow?.trigger_type === 'scheduled' ? 'selected' : ''}>Scheduled</option>
      </select>
    </div>
  `;
  
  const aiAssistant = createAIAssistant('workflow', {
    suggestions: [
      { label: 'Welcome Series', text: 'Trigger: Customer Created → Wait 5 min → Email 1 → Wait 2 days → Email 2' },
      { label: 'Cart Recovery', text: 'Trigger: Cart Abandoned → Wait 1 hour → Email reminder → Wait 24h → Discount offer' },
      { label: 'Post-Purchase', text: 'Trigger: Order Completed → Wait 1 day → Thank you → Wait 7 days → Review request' },
      { label: 'Re-engagement', text: 'Trigger: Scheduled (weekly) → Check inactive 30+ days → Send win-back offer' },
      { label: 'Best Practice', text: 'Add wait steps between emails to avoid overwhelming customers' }
    ],
    quickActions: [
      { text: `${ICONS.sparkles} Suggest Workflow Steps`, action: 'suggestWorkflowSteps' },
      { text: `${ICONS.timer} Optimize Timing`, action: 'optimizeWorkflowTiming' }
    ]
  });
  
  const modalBody = `
    <div class="modal-body-split">
      <div class="modal-form-section">
        ${formHtml}
      </div>
      ${aiAssistant}
    </div>
  `;
  
  document.getElementById('modal-body').innerHTML = modalBody;
  document.getElementById('modal').classList.remove('hidden');
  
  document.getElementById('modal-submit-btn').onclick = saveWorkflow;
}

// Save Workflow
async function saveWorkflow() {
  const data = {
    name: document.getElementById('workflow-name').value,
    description: document.getElementById('workflow-description').value,
    trigger_type: document.getElementById('workflow-trigger').value,
    trigger_config: {},
    workflow_steps: []
  };
  
  if (!data.name || !data.trigger_type) {
    showError('Name and trigger type are required');
    return;
  }
  
  showLoading();
  try {
    const url = currentEditId ? `${API_BASE}/workflows/${currentEditId}` : `${API_BASE}/workflows`;
    const method = currentEditId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error('Failed to save workflow');
    
    closeModal();
    showToast(currentEditId ? 'Workflow updated successfully!' : 'Workflow created successfully!', 'success');
    loadWorkflows();
  } catch (error) {
    showError(error.message);
  } finally {
    hideLoading();
  }
}

// Edit Workflow
async function editWorkflow(id) {
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/workflows/${id}`);
    const workflow = await response.json();
    showWorkflowModal(workflow);
  } catch (error) {
    showError('Failed to load workflow');
  } finally {
    hideLoading();
  }
}

// Workflow filter helper functions
function updateWorkflowFilter(key, value) {
  workflowFilters[key] = value;
  
  // Debounce search, reload immediately for other filters
  if (key === 'search') {
    debounce('workflowSearch', () => loadWorkflows(workflowFilters.type), 400);
  } else {
    loadWorkflows(workflowFilters.type);
  }
}

function clearWorkflowFilters() {
  workflowFilters = {
    type: currentWorkflowFilter, // Keep the type tab
    status: 'all',
    search: ''
  };
  loadWorkflows(currentWorkflowFilter);
}

// Activate Workflow
async function activateWorkflow(id) {
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/workflows/${id}/activate`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to activate');
    
    showToast('Workflow activated successfully!', 'success');
    loadWorkflows();
  } catch (error) {
    showError('Failed to activate workflow');
  } finally {
    hideLoading();
  }
}

// Pause Workflow
async function pauseWorkflow(id) {
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/workflows/${id}/pause`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to pause');
    
    showToast('Workflow paused successfully!', 'success');
    loadWorkflows();
  } catch (error) {
    showError('Failed to pause workflow');
  } finally {
    hideLoading();
  }
}

// Delete Workflow
function confirmDeleteWorkflow(id) {
  showConfirmModal('Are you sure you want to delete this workflow? This action cannot be undone.', async () => {
    showLoading();
    try {
      const response = await fetch(`${API_BASE}/workflows/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      
      showToast('Workflow deleted successfully!', 'success');
      loadWorkflows(currentWorkflowFilter);
    } catch (error) {
      showError('Failed to delete workflow: ' + error.message);
    } finally {
      hideLoading();
    }
  });
}

// Archive Workflow
async function archiveWorkflow(id) {
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/workflows/${id}/archive`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to archive');
    
    showToast('Workflow archived successfully!', 'success');
    loadWorkflows(currentWorkflowFilter);
  } catch (error) {
    showError('Failed to archive workflow');
  } finally {
    hideLoading();
  }
}

// Show Workflow Report
async function showWorkflowReport(id) {
  window.location.href = `campaign-report.html?workflowId=${id}`;
}

// Segments View with CRUD
// Segment filter state
let segmentFilters = {
  status: 'all',
  type: 'all',
  search: ''
};

async function loadSegments() {
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/segments`);
    const data = await response.json();
    
    // Handle wrapped response
    let segments = data.segments || data;
    const allSegments = Array.isArray(segments) ? segments : [];
    
    // Apply filters
    segments = segments.filter(seg => {
      if (segmentFilters.status !== 'all' && seg.status !== segmentFilters.status) return false;
      if (segmentFilters.type !== 'all' && seg.segment_type !== segmentFilters.type) return false;
      
      if (segmentFilters.search) {
        const searchTerm = segmentFilters.search.toLowerCase();
        const name = (seg.name || '').toLowerCase();
        const desc = (seg.description || '').toLowerCase();
        if (!name.includes(searchTerm) && !desc.includes(searchTerm)) return false;
      }
      
      return true;
    });
    
    // Apply sorting
    segments = applySorting(segments, currentTableSort.column || 'id');
    
    const [audiencesResp, deliveriesResp, workflowsResp] = await Promise.all([
      fetch(`${API_BASE}/audiences`),
      fetch(`${API_BASE}/deliveries`),
      fetch(`${API_BASE}/workflows`)
    ]);
    const audiencesData = await audiencesResp.json();
    const deliveriesData = await deliveriesResp.json();
    const workflowsData = await workflowsResp.json();
    const audiences = audiencesData.audiences || audiencesData || [];
    const deliveries = deliveriesData.deliveries || deliveriesData || [];
    const workflows = workflowsData.workflows || workflowsData || [];
    
    const segmentUsage = new Map();
    const ensureSegmentUsage = (id) => {
      if (!segmentUsage.has(id)) {
        segmentUsage.set(id, { workflows: [], deliveries: [], audiences: [] });
      }
      return segmentUsage.get(id);
    };
    const addUniqueUsage = (list, item) => {
      if (!list.some(existing => existing.id === item.id)) {
        list.push(item);
      }
    };
    
    workflows.forEach(w => {
      const nodes = w.orchestration?.nodes || [];
      nodes.forEach(node => {
        const isSegmentNode = node.type === 'segment';
        const isSegmentSource = ['query', 'build_audience'].includes(node.type) && node.config?.source_type === 'segment';
        const segmentId = node.config?.segment_id;
        if ((isSegmentNode || isSegmentSource) && segmentId) {
          const usage = ensureSegmentUsage(segmentId);
          addUniqueUsage(usage.workflows, { id: w.id, name: w.name });
        }
      });
    });
    
    deliveries.forEach(d => {
      if (d.segment_id) {
        const usage = ensureSegmentUsage(d.segment_id);
        addUniqueUsage(usage.deliveries, { id: d.id, name: d.name });
      }
    });
    
    audiences.forEach(a => {
      const includeIds = a.include_segments || [];
      const excludeIds = a.exclude_segments || [];
      [...includeIds, ...excludeIds].forEach(segId => {
        if (!segId) return;
        const usage = ensureSegmentUsage(segId);
        addUniqueUsage(usage.audiences, { id: a.id, name: a.name });
      });
    });
    
    // Generate Adobe Campaign style table rows
    const tableRows = segments.map(seg => {
      const statusMap = {
        'active': 'in-progress',
        'paused': 'paused',
        'draft': 'draft',
        'archived': 'draft'
      };
      
      const actions = [
        {icon: ICONS.palette, label: 'Visual Builder', onclick: `window.location.href='/segment-builder.html?id=${seg.id}'`},
        {icon: ICONS.edit, label: 'Edit', onclick: `navigateTo('segments', 'edit', ${seg.id})`},
        {divider: true}
      ];
      
      if (seg.status === 'draft') {
        actions.push({icon: ICONS.play, label: 'Activate', onclick: `changeSegmentStatus(${seg.id}, 'active')`});
      }
      if (seg.status === 'active') {
        actions.push({icon: ICONS.pause, label: 'Pause', onclick: `changeSegmentStatus(${seg.id}, 'paused')`});
      }
      if (seg.status === 'paused') {
        actions.push({icon: ICONS.play, label: 'Resume', onclick: `changeSegmentStatus(${seg.id}, 'active')`});
      }
      
      actions.push({divider: true});
      actions.push({icon: ICONS.trash, label: 'Delete', onclick: `deleteSegment(${seg.id})`, danger: true});
      
      const usage = segmentUsage.get(seg.id) || { workflows: [], deliveries: [], audiences: [] };
      const usedInItems = [
        ...usage.workflows.map(w => ({ label: `Workflow: ${w.name}`, onclick: `navigateTo('workflows', 'edit', ${w.id})` })),
        ...usage.deliveries.map(d => ({ label: `Delivery: ${d.name}`, onclick: `editDelivery(${d.id})` })),
        ...usage.audiences.map(a => ({ label: `Audience: ${a.name}`, onclick: `navigateTo('audiences', 'edit', ${a.id})` }))
      ];
      
      return `
        <tr>
          <td data-column-id="name">${createTableLink(seg.name, `navigateTo('segments', 'edit', ${seg.id})`)}</td>
          <td data-column-id="status">${createStatusIndicator(statusMap[seg.status] || 'draft', seg.status || 'draft')}</td>
          <td data-column-id="segment_type">${seg.segment_type}</td>
          <td data-column-id="customer_count">${seg.customer_count || 0}</td>
          <td data-column-id="used_in">${renderUsedInList(usedInItems)}</td>
          <td data-column-id="description">${seg.description || '-'}</td>
          <td data-column-id="updated_at">${new Date(seg.updated_at || seg.created_at || Date.now()).toLocaleDateString()}</td>
          <td>${createActionMenu(seg.id, actions)}</td>
        </tr>
      `;
    }).join('');

    const filterTags = [];
    if (segmentFilters.type !== 'all') {
      filterTags.push({ key: 'type', label: 'Type', value: segmentFilters.type });
    }
    if (segmentFilters.status !== 'all') {
      filterTags.push({ key: 'status', label: 'Status', value: segmentFilters.status });
    }
    if (segmentFilters.search) {
      filterTags.push({ key: 'search', label: 'Search', value: segmentFilters.search });
    }
    
    const columns = [
      { id: 'name', label: 'Segment' },
      { id: 'status', label: 'Status' },
      { id: 'segment_type', label: 'Type' },
      { id: 'customer_count', label: 'Profiles' },
      { id: 'used_in', label: 'Used in' },
      { id: 'description', label: 'Description' },
      { id: 'updated_at', label: 'Last modified' }
    ];
    
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${ICONS.target} Segments</h3>
        </div>
        
        ${createTableToolbar({
          tabs: ['All', 'Dynamic', 'Static'],
          activeTab: segmentFilters.type === 'dynamic' ? 'Dynamic' : segmentFilters.type === 'static' ? 'Static' : 'All',
          resultCount: segments.length,
          totalCount: allSegments.length,
          showRefresh: false,
          showColumnSelector: true,
          columns,
          viewKey: 'segments',
          showSearch: true,
          searchPlaceholder: 'Search segments...',
          searchValue: segmentFilters.search || '',
          onSearch: 'updateSegmentFilter("search", this.value)',
          filterTags,
          onClearTag: 'clearSegmentFilterTag',
          filters: [
            {
              type: 'select',
              label: 'Status',
              value: segmentFilters.status,
              onChange: 'updateSegmentFilter("status", this.value)',
              options: [
                {value: 'all', label: 'All Statuses'},
                {value: 'draft', label: 'Draft'},
                {value: 'active', label: 'Active'},
                {value: 'paused', label: 'Paused'},
                {value: 'archived', label: 'Archived'}
              ]
            },
            {
              type: 'select',
              label: 'Type',
              value: segmentFilters.type,
              onChange: 'updateSegmentFilter("type", this.value)',
              options: [
                {value: 'all', label: 'All Types'},
                {value: 'dynamic', label: 'Dynamic'},
                {value: 'static', label: 'Static'}
              ]
            }
          ]
        })}
        
        <div class="data-table-container">
          <table class="data-table" data-view="segments">
            <thead>
              <tr>
                ${createSortableHeader('name', 'Segment', currentTableSort)}
                ${createSortableHeader('status', 'Status', currentTableSort)}
                ${createSortableHeader('segment_type', 'Type', currentTableSort)}
                ${createSortableHeader('customer_count', 'Profiles', currentTableSort)}
                <th data-column-id="used_in">Used in</th>
                <th data-column-id="description">Description</th>
                ${createSortableHeader('updated_at', 'Last modified', currentTableSort)}
                <th style="width: 50px;"></th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #6B7280;">No segments found</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    document.getElementById('content').innerHTML = content;
    applyColumnVisibility('segments');
  } catch (error) {
    showError('Failed to load segments');
    console.error(error);
  } finally {
    hideLoading();
  }
}

// Show Segment Modal
function showSegmentModal(segment = null) {
  currentEditId = segment ? segment.id : null;
  
  document.getElementById('modal-title').textContent = segment ? 'Edit Segment' : 'Create Segment';
  document.querySelector('.modal-content').classList.add('modal-with-ai');
  
  const conditions = segment?.conditions || {};
  
  const formHtml = `
    <div class="form-group">
      <label class="form-label">Segment Name *</label>
      <input type="text" id="segment-name" class="form-input" value="${segment?.name || ''}" required>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea id="segment-description" class="form-input" rows="2">${segment?.description || ''}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Segment Type</label>
      <select id="segment-type" class="form-input">
        <option value="dynamic" ${segment?.segment_type === 'dynamic' ? 'selected' : ''}>Dynamic (Auto-update)</option>
        <option value="static" ${segment?.segment_type === 'static' ? 'selected' : ''}>Static (Manual)</option>
      </select>
    </div>
    <h4 style="margin-top: 1rem; margin-bottom: 0.5rem;">Conditions</h4>
    <div class="form-group">
      <label class="form-label">Lifecycle Stage</label>
      <select id="segment-lifecycle" class="form-input">
        <option value="">Any</option>
        <option value="lead" ${conditions.lifecycle_stage === 'lead' ? 'selected' : ''}>Lead</option>
        <option value="customer" ${conditions.lifecycle_stage === 'customer' ? 'selected' : ''}>Customer</option>
        <option value="vip" ${conditions.lifecycle_stage === 'vip' ? 'selected' : ''}>VIP</option>
        <option value="at_risk" ${conditions.lifecycle_stage === 'at_risk' ? 'selected' : ''}>At Risk</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Minimum Lead Score</label>
      <input type="number" id="segment-score" class="form-input" value="${conditions.min_lead_score || ''}" placeholder="e.g., 70">
    </div>
    <div class="form-group">
      <label class="form-label">Status</label>
      <select id="segment-status" class="form-input">
        <option value="">Any</option>
        <option value="active" ${conditions.status === 'active' ? 'selected' : ''}>Active</option>
        <option value="inactive" ${conditions.status === 'inactive' ? 'selected' : ''}>Inactive</option>
      </select>
    </div>
  `;
  
  const aiAssistant = createAIAssistant('segment', {
    suggestions: [
      { label: 'Popular Segments', text: 'VIP Customers: lifecycle_stage = VIP + min_lead_score >= 80' },
      { label: 'Engagement', text: 'At-Risk: No activity in 60+ days, status = active' },
      { label: 'Retention', text: 'Loyal Customers: 5+ orders, high engagement score' },
      { label: 'Win-Back', text: 'Churned Customers: Last purchase > 90 days ago' },
      { label: 'Tip', text: 'Use dynamic segments for automated, real-time updates' }
    ],
    quickActions: [
      { text: `${ICONS.target} Suggest Segment Ideas`, action: 'suggestSegmentIdeas' },
      { text: `${ICONS.barChart} Predict Segment Size`, action: 'predictSegmentSize' }
    ]
  });
  
  const modalBody = `
    <div class="modal-body-split">
      <div class="modal-form-section">
        ${formHtml}
      </div>
      ${aiAssistant}
    </div>
  `;
  
  document.getElementById('modal-body').innerHTML = modalBody;
  document.getElementById('modal').classList.remove('hidden');
  
  document.getElementById('modal-submit-btn').onclick = saveSegment;
}

// Save Segment
async function saveSegment() {
  const conditions = {};
  
  const lifecycle = document.getElementById('segment-lifecycle').value;
  if (lifecycle) conditions.lifecycle_stage = lifecycle;
  
  const score = document.getElementById('segment-score').value;
  if (score) conditions.min_lead_score = parseInt(score);
  
  const status = document.getElementById('segment-status').value;
  if (status) conditions.status = status;
  
  const data = {
    name: document.getElementById('segment-name').value,
    description: document.getElementById('segment-description').value,
    segment_type: document.getElementById('segment-type').value,
    conditions
  };
  
  if (!data.name) {
    showError('Segment name is required');
    return;
  }
  
  showLoading();
  try {
    const url = currentEditId ? `${API_BASE}/segments/${currentEditId}` : `${API_BASE}/segments`;
    const method = currentEditId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error('Failed to save segment');
    
    closeModal();
    showToast(currentEditId ? 'Segment updated successfully!' : 'Segment created successfully!', 'success');
    loadSegments();
  } catch (error) {
    showError(error.message);
  } finally {
    hideLoading();
  }
}

// Edit Segment
async function editSegment(id) {
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/segments/${id}`);
    const segment = await response.json();
    showSegmentModal(segment);
  } catch (error) {
    showError('Failed to load segment');
  } finally {
    hideLoading();
  }
}

// Delete Segment
// Change segment status
async function changeSegmentStatus(id, newStatus) {
  const statusNames = {
    active: 'activate',
    paused: 'pause',
    archived: 'archive'
  };
  
  const action = statusNames[newStatus] || 'change';
  
  showConfirmModal(`Are you sure you want to ${action} this segment?`, async () => {
    showLoading();
    try {
      const response = await fetch(`${API_BASE}/segments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change status');
      }
      
      hideLoading();
      showToast(`Segment ${action}d successfully!`, 'success');
      loadSegments();
    } catch (error) {
      hideLoading();
      showError(error.message || 'Failed to change segment status');
    }
  });
}

function deleteSegment(id) {
  showConfirmModal('Are you sure you want to delete this segment?', async () => {
    showLoading();
    try {
      const response = await fetch(`${API_BASE}/segments/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      
      showToast('Segment deleted successfully!', 'success');
      loadSegments();
    } catch (error) {
      showError('Failed to delete segment');
    } finally {
      hideLoading();
    }
  });
}

// Analytics View (Read-only)
async function loadAnalytics() {
  showLoading();
  try {
    const [campaignsRes, channelsRes] = await Promise.all([
      fetch(`${API_BASE}/analytics/campaigns`),
      fetch(`${API_BASE}/analytics/channels`)
    ]);
    
    const campaigns = await campaignsRes.json();
    const channels = await channelsRes.json();
    
    let campaignRows = '';
    campaigns.slice(0, 10).forEach(campaign => {
      campaignRows += `
        <tr>
          <td>${campaign.name}</td>
          <td>${campaign.sent || 0}</td>
          <td>${campaign.open_rate || 0}%</td>
          <td>${campaign.click_rate || 0}%</td>
          <td>${campaign.conversion_rate || 0}%</td>
          <td>$${parseFloat(campaign.revenue || 0).toFixed(2)}</td>
        </tr>
      `;
    });
    
    let channelRows = '';
    channels.forEach(channel => {
      channelRows += `
        <tr>
          <td>${channel.channel}</td>
          <td>${channel.campaign_count}</td>
          <td>${channel.total_sent || 0}</td>
          <td>${channel.open_rate}%</td>
          <td>${channel.click_rate}%</td>
          <td>$${channel.total_revenue}</td>
        </tr>
      `;
    });
    
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Top Campaign Performance</h3>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Sent</th>
                  <th>Open Rate</th>
                  <th>Click Rate</th>
                  <th>Conv. Rate</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${campaignRows || '<tr><td colspan="6" style="text-align: center;">No data</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Channel Performance</h3>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Campaigns</th>
                  <th>Sent</th>
                  <th>Open Rate</th>
                  <th>Click Rate</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${channelRows || '<tr><td colspan="6" style="text-align: center;">No data</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('content').innerHTML = content;
  } catch (error) {
    showError('Failed to load analytics');
    console.error(error);
  } finally {
    hideLoading();
  }
}

// AI Features View (existing functionality)
function loadAIFeatures() {
  const content = `
    <div class="ai-features">
      <div class="ai-features-header">
        <div>
          <h2>AI Features</h2>
          <p class="ai-features-subtitle">Generate content and predictions with fast, context-aware tools.</p>
        </div>
      </div>

      <div class="ai-features-grid">
        <div class="ai-feature-card">
          <div class="ai-feature-head">
            <h3>Email subject lines</h3>
            <span class="ai-feature-tag">Content</span>
          </div>
          <div class="ai-feature-body">
            <div class="form-group">
              <label class="form-label">Product name</label>
              <input type="text" id="ai-product-name" class="form-input" placeholder="Product name" value="Summer Collection 2026">
            </div>
            <div class="form-group">
              <label class="form-label">Target audience</label>
              <input type="text" id="ai-audience" class="form-input" placeholder="Target audience" value="Women 25-45">
            </div>
            <button class="btn btn-secondary" onclick="generateSubjectLines()">Generate subject lines</button>
            <div id="ai-subject-output" class="ai-output hidden"></div>
          </div>
        </div>
        
        <div class="ai-feature-card">
          <div class="ai-feature-head">
            <h3>Churn prediction</h3>
            <span class="ai-feature-tag">Insights</span>
          </div>
          <div class="ai-feature-body">
            <div class="form-group">
              <label class="form-label">Customer ID</label>
              <input type="number" id="churn-customer-id" class="form-input" placeholder="Enter customer ID" value="1">
            </div>
            <button class="btn btn-secondary" onclick="predictChurn()">Predict churn risk</button>
            <div id="churn-output" class="ai-output hidden"></div>
          </div>
        </div>
        
        <div class="ai-feature-card">
          <div class="ai-feature-head">
            <h3>Product recommendations</h3>
            <span class="ai-feature-tag">Personalization</span>
          </div>
          <div class="ai-feature-body">
            <div class="form-group">
              <label class="form-label">Customer ID</label>
              <input type="number" id="recommend-customer-id" class="form-input" placeholder="Enter customer ID" value="1">
            </div>
            <button class="btn btn-secondary" onclick="getRecommendations()">Get recommendations</button>
            <div id="recommend-output" class="ai-output hidden"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('content').innerHTML = content;
}

// AI Functions (keeping existing ones)
async function generateSubjectLines() {
  showLoading();
  const productName = document.getElementById('ai-product-name').value;
  const audience = document.getElementById('ai-audience').value;
  
  try {
    const response = await fetch(`${API_BASE}/ai/generate-subject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, targetAudience: audience, count: 5 })
    });
    
    const data = await response.json();
    const output = document.getElementById('ai-subject-output');
    
    let html = '<h4>Generated Subject Lines:</h4>';
    data.subjects.forEach((subject, i) => {
      html += `<div class="ai-output-item">${i + 1}. ${subject}</div>`;
    });
    
    if (data.source === 'mock') {
      html += `<p class="ai-output-note">Note: ${data.message}</p>`;
    }
    
    output.innerHTML = html;
    output.classList.remove('hidden');
    showToast('Subject lines generated successfully!', 'success');
  } catch (error) {
    showError('Failed to generate subject lines');
    console.error(error);
  } finally {
    hideLoading();
  }
}

async function predictChurn() {
  showLoading();
  const customerId = document.getElementById('churn-customer-id').value;
  
  try {
    const response = await fetch(`${API_BASE}/ai/predict-churn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: parseInt(customerId) })
    });
    
    const data = await response.json();
    const output = document.getElementById('churn-output');
    
    const riskColor = 
      data.risk_level === 'high' ? 'var(--danger-color)' :
      data.risk_level === 'medium' ? 'var(--warning-color)' : 'var(--secondary-color)';
    
    const html = `
      <h4>Churn Prediction Results:</h4>
      <div class="metric-row">
        <span class="metric-label">Risk Level</span>
        <span class="metric-value" style="color: ${riskColor}">${data.risk_level.toUpperCase()}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Churn Risk Score</span>
        <span class="metric-value">${(data.churn_risk * 100).toFixed(1)}%</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Days Since Last Order</span>
        <span class="metric-value">${data.factors.days_since_last_order}</span>
      </div>
      <div class="ai-output-item" style="margin-top: 1rem;">
        <strong>Recommendation:</strong> ${data.recommendation}
      </div>
    `;
    
    output.innerHTML = html;
    output.classList.remove('hidden');
    showToast('Churn prediction completed!', 'success');
  } catch (error) {
    showError('Failed to predict churn');
    console.error(error);
  } finally {
    hideLoading();
  }
}

async function getRecommendations() {
  showLoading();
  const customerId = document.getElementById('recommend-customer-id').value;
  
  try {
    const response = await fetch(`${API_BASE}/ai/recommend-products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: parseInt(customerId), limit: 5 })
    });
    
    const data = await response.json();
    const output = document.getElementById('recommend-output');
    
    let html = '<h4>Recommended Products:</h4>';
    data.recommendations.forEach(product => {
      html += `
        <div class="ai-output-item">
          <strong>${product.name}</strong> - $${product.price}
          <br><small style="color: var(--text-secondary);">${product.recommendation_reason}</small>
        </div>
      `;
    });
    
    output.innerHTML = html;
    output.classList.remove('hidden');
    showToast('Product recommendations generated!', 'success');
  } catch (error) {
    showError('Failed to get recommendations');
    console.error(error);
  } finally {
    hideLoading();
  }
}

// Modal Functions
function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.querySelector('.modal-content').classList.remove('modal-with-ai');
  currentEditId = null;
}

// Create AI Assistant Component
function createAIAssistant(context, options = {}) {
  const { suggestions = [], quickActions = [] } = options;
  const contextLabel = context ? context.charAt(0).toUpperCase() + context.slice(1) : 'General';
  
  let suggestionsHtml = '';
  suggestions.forEach(suggestion => {
    suggestionsHtml += `
      <div class="ai-suggestion-item">
        <div class="ai-suggestion-label">${suggestion.label}</div>
        <div class="ai-suggestion-text">${suggestion.text}</div>
      </div>
    `;
  });
  
  let actionsHtml = '';
  quickActions.forEach(action => {
    actionsHtml += `
      <button class="btn btn-sm btn-secondary" onclick="${action.action}()">
        ${action.text}
      </button>
    `;
  });
  
  return `
    <div class="modal-ai-section">
      <div class="ai-assistant-header">
        <div class="ai-assistant-title">
          <span class="ai-assistant-icon">AI</span>
          <h3>AI Assistant</h3>
        </div>
        <span class="ai-context-badge">${contextLabel}</span>
      </div>
      
      <div class="ai-suggestions">
        ${suggestionsHtml}
      </div>
      
      ${actionsHtml ? `<div class="ai-quick-actions">${actionsHtml}</div>` : ''}
      
      <div class="ai-chat-container">
        <div class="ai-chat-messages" id="ai-chat-messages"></div>
        <div class="ai-chat-input-container">
          <input type="text" class="ai-chat-input" id="ai-chat-input" placeholder="Ask AI anything...">
          <button class="btn btn-sm btn-primary" onclick="sendAIMessage()">Send</button>
        </div>
      </div>
    </div>
  `;
}

// AI Assistant Functions

// Send message to AI chat
function sendAIMessage() {
  const input = document.getElementById('ai-chat-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  const messagesContainer = document.getElementById('ai-chat-messages');
  
  // Add user message
  messagesContainer.innerHTML += `
    <div class="ai-message user">${message}</div>
  `;
  
  input.value = '';
  
  // Simulate AI response (in production, call OpenAI API)
  setTimeout(() => {
    const response = getContextualAIResponse(message);
    messagesContainer.innerHTML += `
      <div class="ai-message assistant">${response}</div>
    `;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 500);
}

// Get contextual AI response based on current view
function getContextualAIResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  // Campaign context responses
  if (currentView === 'campaigns') {
    if (lowerMessage.includes('subject') || lowerMessage.includes('headline')) {
      return "For subject lines, keep them under 50 characters, use action words, and create urgency. Would you like me to generate 5 subject line variations for you?";
    }
    if (lowerMessage.includes('content') || lowerMessage.includes('body')) {
      return "For email content, use a clear hierarchy with H1 for main title, short paragraphs, bullet points for key benefits, and a single clear CTA. Would you like me to draft a template?";
    }
    if (lowerMessage.includes('timing') || lowerMessage.includes('when')) {
      return "Best times to send: Tuesday-Thursday at 10 AM or 2 PM. Avoid Mondays and Fridays. Test your specific audience to find optimal timing.";
    }
  }
  
  // Segment context responses
  if (currentView === 'segments') {
    if (lowerMessage.includes('vip') || lowerMessage.includes('high value')) {
      return "For VIP segments, consider: Lifecycle Stage = VIP, Min Lead Score >= 80, Total Orders >= 5, or Lifetime Value >= $500. Dynamic segments update automatically as customers qualify.";
    }
    if (lowerMessage.includes('churn') || lowerMessage.includes('risk')) {
      return "At-risk customers typically have: No purchases in 60+ days, declining engagement scores, or no email opens in 30+ days. Create a segment with these conditions to target them with win-back campaigns.";
    }
  }
  
  // Workflow context responses
  if (currentView === 'workflows') {
    if (lowerMessage.includes('welcome') || lowerMessage.includes('onboard')) {
      return "Welcome workflows should: Send first email within 5 minutes, include 3-4 emails over 7-14 days, highlight key features, provide quick wins, and include a special offer in email 3.";
    }
    if (lowerMessage.includes('cart') || lowerMessage.includes('abandon')) {
      return "Cart abandonment workflow: Wait 1 hour → Reminder email, Wait 24 hours → Discount offer (10-15%), Wait 48 hours → Last chance + urgency. Recovery rate typically 15-30%.";
    }
  }
  
  // General responses
  if (lowerMessage.includes('best practice')) {
    return "Best practices: Personalize content, segment your audience, test everything (A/B test), optimize for mobile, maintain consistent branding, and always include clear CTAs.";
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
    return "I can help you with: generating content, suggesting best practices, optimizing campaigns, creating segments, building workflows, and analyzing performance. What specific area would you like help with?";
  }
  
  return "I'm here to help! I can assist with campaign creation, segmentation strategies, workflow optimization, and best practices. Could you please be more specific about what you need?";
}

// Generate subject lines for campaign
async function generateSubjectForCampaign() {
  const campaignName = document.getElementById('campaign-name').value || 'Campaign';
  
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/ai/generate-subject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productName: campaignName,
        targetAudience: 'Customers',
        count: 5
      })
    });
    
    const data = await response.json();
    
    // Show suggestions
    const messagesContainer = document.getElementById('ai-chat-messages');
    let suggestionsHtml = '<div class="ai-message assistant"><strong>Generated Subject Lines:</strong><br>';
    data.subjects.forEach((subject, i) => {
      suggestionsHtml += `<div style="margin: 0.5rem 0; cursor: pointer;" onclick="document.getElementById('campaign-subject').value='${subject.replace(/'/g, "\\'")}'">
        ${i + 1}. ${subject} <small style="color: var(--primary-color);">(click to use)</small>
      </div>`;
    });
    suggestionsHtml += '</div>';
    messagesContainer.innerHTML += suggestionsHtml;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    showToast('Subject lines generated! Click one to use it.', 'success');
  } catch (error) {
    showError('Failed to generate subject lines');
  } finally {
    hideLoading();
  }
}

// Generate content for campaign
async function generateContentForCampaign() {
  const campaignName = document.getElementById('campaign-name').value || 'Campaign';
  
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/ai/generate-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_type: 'promotional',
        product_name: campaignName,
        target_audience: 'Customers',
        tone: 'professional'
      })
    });
    
    const data = await response.json();
    
    // Insert content
    document.getElementById('campaign-content').value = data.content_html;
    
    const messagesContainer = document.getElementById('ai-chat-messages');
    messagesContainer.innerHTML += '<div class="ai-message assistant">' + ICONS.check + ' Email content generated and inserted! You can now edit it as needed.</div>';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    showToast('Email content generated!', 'success');
  } catch (error) {
    showError('Failed to generate content');
  } finally {
    hideLoading();
  }
}

// Suggest campaign improvements
function suggestCampaignImprovements() {
  const messagesContainer = document.getElementById('ai-chat-messages');
  const suggestions = `
    <div class="ai-message assistant">
      <strong>${ICONS.sparkles} Campaign Improvement Suggestions:</strong><br><br>
      1. <strong>Personalization:</strong> Add {{first_name}} in subject line<br>
      2. <strong>Mobile:</strong> Keep subject under 50 chars<br>
      3. <strong>Urgency:</strong> Add time-limited offer or countdown<br>
      4. <strong>Social Proof:</strong> Include testimonials or ratings<br>
      5. <strong>CTA:</strong> Use action-oriented buttons (not generic "Click here")<br>
      6. <strong>Preview Text:</strong> Write compelling preview text<br>
      7. <strong>Images:</strong> Add relevant product images with alt text<br>
      8. <strong>A/B Test:</strong> Test 2 subject lines to optimize opens
    </div>
  `;
  messagesContainer.innerHTML += suggestions;
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Suggest segment ideas
function suggestSegmentIdeas() {
  const messagesContainer = document.getElementById('ai-chat-messages');
  const suggestions = `
    <div class="ai-message assistant">
      <strong>${ICONS.target} Popular Segment Ideas:</strong><br><br>
      1. <strong>VIP Customers:</strong> Lifecycle = VIP + Score ≥ 80<br>
      2. <strong>At-Risk:</strong> No activity 60+ days + Status = Active<br>
      3. <strong>High Potential:</strong> Score ≥ 70 + Lifecycle = Lead<br>
      4. <strong>Recent Buyers:</strong> Last order < 30 days<br>
      5. <strong>Frequent Shoppers:</strong> Orders ≥ 5<br>
      6. <strong>Cart Abandoners:</strong> Added items but no purchase<br>
      7. <strong>Email Engaged:</strong> Opened 3+ emails in 30 days<br>
      8. <strong>Big Spenders:</strong> Lifetime value ≥ $500
    </div>
  `;
  messagesContainer.innerHTML += suggestions;
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Predict segment size
function predictSegmentSize() {
  const lifecycle = document.getElementById('segment-lifecycle').value;
  const score = document.getElementById('segment-score').value;
  
  let estimate = '50-150';
  if (lifecycle === 'vip') estimate = '30-80';
  if (lifecycle === 'lead') estimate = '200-400';
  if (score >= 80) estimate = '40-100';
  if (score >= 90) estimate = '10-30';
  
  const messagesContainer = document.getElementById('ai-chat-messages');
  messagesContainer.innerHTML += `
    <div class="ai-message assistant">
      ${ICONS.barChart} <strong>Estimated Segment Size:</strong> ${estimate} customers<br><br>
      Based on current conditions. Actual size will be calculated after saving.
    </div>
  `;
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Suggest workflow steps
function suggestWorkflowSteps() {
  const triggerType = document.getElementById('workflow-trigger').value;
  
  let steps = '';
  switch(triggerType) {
    case 'customer_created':
      steps = `
        <strong>Welcome Series Steps:</strong><br>
        1. Wait: 5 minutes<br>
        2. Email: Welcome + Getting Started Guide<br>
        3. Wait: 2 days<br>
        4. Email: Product highlights + Use cases<br>
        5. Wait: 3 days<br>
        6. Email: Special first-purchase discount
      `;
      break;
    case 'cart_abandoned':
      steps = `
        <strong>Cart Recovery Steps:</strong><br>
        1. Wait: 1 hour<br>
        2. Email: "You left items in your cart"<br>
        3. Wait: 24 hours<br>
        4. Email: 10% discount offer<br>
        5. Wait: 48 hours<br>
        6. Email: Last chance + urgency
      `;
      break;
    case 'order_completed':
      steps = `
        <strong>Post-Purchase Steps:</strong><br>
        1. Wait: 1 day<br>
        2. Email: Thank you + Order tracking<br>
        3. Wait: 7 days<br>
        4. Email: Review request + Rewards points<br>
        5. Wait: 14 days<br>
        6. Email: Product recommendations
      `;
      break;
    default:
      steps = `
        <strong>Suggested Steps:</strong><br>
        1. Wait: [Your timing]<br>
        2. Email: [Your message]<br>
        3. Condition: Check response<br>
        4. Branch based on engagement<br>
        5. Follow-up actions
      `;
  }
  
  const messagesContainer = document.getElementById('ai-chat-messages');
  messagesContainer.innerHTML += `<div class="ai-message assistant">${steps}</div>`;
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Optimize workflow timing
function optimizeWorkflowTiming() {
  const messagesContainer = document.getElementById('ai-chat-messages');
  const tips = `
    <div class="ai-message assistant">
      <strong>${ICONS.timer} Timing Optimization Tips:</strong><br><br>
      <strong>Wait Times:</strong><br>
      • First email: 5-10 minutes (immediate engagement)<br>
      • Follow-ups: 2-3 days apart<br>
      • Avoid: Less than 24 hours between emails<br><br>
      <strong>Best Send Times:</strong><br>
      • Tuesday-Thursday: 10 AM or 2 PM<br>
      • Avoid: Mondays (busy), Fridays (weekend mode)<br>
      • Weekends: Lower open rates (unless B2C retail)<br><br>
      <strong>Workflow Duration:</strong><br>
      • Welcome: 7-14 days<br>
      • Cart recovery: 3-5 days<br>
      • Re-engagement: 2-3 weeks<br><br>
      Pro tip: Use AI send-time optimization for each customer!
    </div>
  `;
  messagesContainer.innerHTML += tips;
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Open orchestration canvas
function openOrchestration(campaignId) {
  window.location.href = `/orchestration.html?campaignId=${campaignId}`;
}

// View campaign report
function viewCampaignReport(campaignId) {
  window.location.href = `/campaign-report.html?campaignId=${campaignId}`;
}

function showConfirmModal(message, onConfirm) {
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-modal').classList.remove('hidden');
  
  document.getElementById('confirm-delete-btn').onclick = () => {
    closeConfirmModal();
    onConfirm();
  };
}

function closeConfirmModal() {
  document.getElementById('confirm-modal').classList.add('hidden');
}

// Utility Functions
function showLoading() {
  document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading').classList.add('hidden');
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${getToastIcon(type)}</span>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
  return container;
}

function getToastIcon(type) {
  const icons = {
    success: ICONS.check,
    error: ICONS.x,
    info: ICONS.info,
    warning: ICONS.alertTriangle
  };
  return icons[type] || icons.info;
}

function showError(message) {
  showToast(message, 'error');
}

function openEmailEditorModal(url, deliveryId) {
  const modal = document.getElementById('email-editor-modal');
  const iframe = document.getElementById('email-editor-iframe');
  if (!modal || !iframe) return;
  modal.classList.remove('hidden');
  iframe.src = url;
  window.activeEmailEditorDeliveryId = deliveryId;
}

function openLandingPageEditorModal(landingPageId) {
  const modal = document.getElementById('email-editor-modal');
  const iframe = document.getElementById('email-editor-iframe');
  if (!modal || !iframe) return;
  const params = new URLSearchParams({ landingPageMode: '1', return: 'modal' });
  if (landingPageId) params.set('landingPageId', landingPageId);
  const url = `/email-designer.html?${params.toString()}`;
  modal.classList.remove('hidden');
  iframe.src = url;
  window.activeLandingPageId = landingPageId || null;
}

function closeEmailEditorModal(step = 3) {
  const modal = document.getElementById('email-editor-modal');
  const iframe = document.getElementById('email-editor-iframe');
  if (!modal || !iframe) return;
  modal.classList.add('hidden');
  iframe.src = '';
  const deliveryId = window.activeEmailEditorDeliveryId;
  window.activeEmailEditorDeliveryId = null;
  if (deliveryId && typeof window.editDelivery === 'function') {
    window.pendingDeliveryStep = step;
    window.editDelivery(deliveryId);
  }
}

function closeLandingPageEditorModal() {
  const modal = document.getElementById('email-editor-modal');
  const iframe = document.getElementById('email-editor-iframe');
  if (!modal || !iframe) return;
  modal.classList.add('hidden');
  iframe.src = '';
  window.activeLandingPageId = null;
  if (typeof window.loadLandingPages === 'function') {
    window.loadLandingPages();
  }
}

window.addEventListener('message', (event) => {
  if (!event?.data) return;
  if (event.data.type === 'closeEmailEditor') {
    closeEmailEditorModal(event.data.step || 3);
  }
  if (event.data.type === 'closeLandingPageEditor') {
    closeLandingPageEditorModal();
  }
  if (event.data.type === 'openFragmentEditor') {
    const modal = document.getElementById('email-editor-modal');
    const iframe = document.getElementById('email-editor-iframe');
    if (!modal || !iframe) return;
    window.fragmentEditorReturnUrl = iframe.src || '';
    modal.classList.remove('hidden');
    iframe.src = event.data.url || '/email-designer.html?fragmentMode=1&return=modal';
  }
  if (event.data.type === 'closeFragmentEditor') {
    const modal = document.getElementById('email-editor-modal');
    const iframe = document.getElementById('email-editor-iframe');
    if (!modal || !iframe) return;
    const returnUrl = window.fragmentEditorReturnUrl;
    if (returnUrl) {
      iframe.src = returnUrl;
      window.fragmentEditorReturnUrl = '';
    } else {
      modal.classList.add('hidden');
      iframe.src = '';
    }
  }
});

// Drill-Down Functions
let currentDrillDown = null;
let currentDrillDownPeriod = 30;

async function showDrillDown(metric) {
  currentDrillDown = metric;
  currentDrillDownPeriod = 30;
  
  await loadDrillDown(metric, currentDrillDownPeriod);
}

async function loadDrillDown(metric, period = 30) {
  showLoading();
  
  try {
    const response = await fetch(`${API_BASE}/analytics/drill-down/${metric}?period=${period}`);
    const data = await response.json();
    
    let content = '';
    
    switch(metric) {
      case 'contacts':
      case 'customers': // Legacy support
        content = renderContactsDrillDown(data, period);
        break;
      case 'workflows':
      case 'campaigns': // Legacy support
        content = renderWorkflowsDrillDown(data, period);
        break;
      case 'email':
        content = renderEmailDrillDown(data, period);
        break;
      case 'revenue':
        content = renderRevenueDrillDown(data, period);
        break;
    }
    
    document.getElementById('content').innerHTML = content;
    
    // Render chart after content is in DOM
    setTimeout(() => {
      renderChart(metric, data.chart_data);
    }, 100);
    
  } catch (error) {
    showError('Failed to load drill-down data');
    console.error(error);
  } finally {
    hideLoading();
  }
}

function renderContactsDrillDown(data, period) {
  const trendIcon = parseFloat(data.summary.trend) >= 0 ? ICONS.trendingUp : ICONS.arrowDown;
  const trendClass = parseFloat(data.summary.trend) >= 0 ? 'positive' : 'negative';
  
  return `
    <div class="drill-down-container">
      <div class="drill-down-header">
        <button class="btn-back" onclick="loadDashboard()" title="Back to Dashboard">${BACK_SVG}</button>
        <h2>${ICONS.users} Contact Analytics</h2>
        <div class="period-selector">
          <button class="btn ${period === 7 ? 'btn-primary' : 'btn-secondary'}" onclick="loadDrillDown('customers', 7)">7 Days</button>
          <button class="btn ${period === 30 ? 'btn-primary' : 'btn-secondary'}" onclick="loadDrillDown('customers', 30)">30 Days</button>
          <button class="btn ${period === 90 ? 'btn-primary' : 'btn-secondary'}" onclick="loadDrillDown('customers', 90)">90 Days</button>
        </div>
      </div>
      
      <div class="stats-grid" style="margin-bottom: 2rem;">
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">Total Contacts</span>
            <span class="stat-card-icon">${ICONS.users}</span>
          </div>
          <div class="stat-card-value">${data.summary.total.toLocaleString()}</div>
          <div class="stat-card-label">Active: ${data.summary.active}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">New Contacts</span>
            <span class="stat-card-icon">${ICONS.star}</span>
          </div>
          <div class="stat-card-value">${data.summary.new_in_period}</div>
          <div class="stat-card-label">
            <span class="stat-card-change ${trendClass}">${trendIcon} ${data.summary.trend}% vs previous</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">Subscribed</span>
            <span class="stat-card-icon">${ICONS.mail}</span>
          </div>
          <div class="stat-card-value">${data.summary.subscribed || 0}</div>
          <div class="stat-card-label">Email subscribers</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">VIP Tier</span>
            <span class="stat-card-icon">${ICONS.gem}</span>
          </div>
          <div class="stat-card-value">${data.summary.vip}</div>
          <div class="stat-card-label">Gold & Platinum</div>
        </div>
      </div>
      
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-header">
          <h3 class="card-title">New Contacts Trend</h3>
        </div>
        <div class="card-body">
          <canvas id="drill-down-chart" style="max-height: 300px;"></canvas>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Top Contacts (${data.top_contacts.length})</h3>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Loyalty</th>
                  <th>Engagement</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                </tr>
              </thead>
              <tbody>
                ${data.top_contacts.map(c => `
                  <tr>
                    <td>${c.id}</td>
                    <td>${c.name}</td>
                    <td>${c.email}</td>
                    <td><span class="badge ${c.status === 'active' ? 'badge-success' : 'badge-secondary'}">${c.status}</span></td>
                    <td><span class="badge badge-info">${c.loyalty_tier || 'bronze'}</span></td>
                    <td>${c.engagement_score || 50}/100</td>
                    <td>${c.order_count}</td>
                    <td>$${c.total_spent.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderWorkflowsDrillDown(data, period) {
  return `
    <div class="drill-down-container">
      <div class="drill-down-header">
        <button class="btn-back" onclick="loadDashboard()" title="Back to Dashboard">${BACK_SVG}</button>
        <h2>${ICONS.zap} Workflow Performance</h2>
        <div class="period-selector">
          <button class="btn ${period === 7 ? 'btn-primary' : 'btn-secondary'}" onclick="loadDrillDown('workflows', 7)">7 Days</button>
          <button class="btn ${period === 30 ? 'btn-primary' : 'btn-secondary'}" onclick="loadDrillDown('workflows', 30)">30 Days</button>
          <button class="btn ${period === 90 ? 'btn-primary' : 'btn-secondary'}" onclick="loadDrillDown('workflows', 90)">90 Days</button>
        </div>
      </div>
      
      <div class="stats-grid" style="margin-bottom: 2rem;">
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">Workflows Executed</span>
            <span class="stat-card-icon">${ICONS.zap}</span>
          </div>
          <div class="stat-card-value">${data.summary.in_period}</div>
          <div class="stat-card-label">Total: ${data.summary.total_campaigns}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">Total Sent</span>
            <span class="stat-card-icon">${ICONS.mail}</span>
          </div>
          <div class="stat-card-value">${data.summary.total_sent.toLocaleString()}</div>
          <div class="stat-card-label">Messages delivered</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">Avg Open Rate</span>
            <span class="stat-card-icon">${ICONS.barChart}</span>
          </div>
          <div class="stat-card-value">${data.summary.avg_open_rate}%</div>
          <div class="stat-card-label">${data.summary.total_opened.toLocaleString()} opens</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">Revenue</span>
            <span class="stat-card-icon">${ICONS.dollarSign}</span>
          </div>
          <div class="stat-card-value">$${data.summary.total_revenue.toFixed(2)}</div>
          <div class="stat-card-label">${data.summary.total_converted} conversions</div>
        </div>
      </div>
      
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-header">
          <h3 class="card-title">Channel Breakdown</h3>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Campaigns</th>
                  <th>Messages Sent</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${data.channel_breakdown.map(ch => `
                  <tr>
                    <td><span class="badge badge-primary">${ch.channel}</span></td>
                    <td>${ch.count}</td>
                    <td>${ch.sent.toLocaleString()}</td>
                    <td>$${ch.revenue.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Recent Campaigns (${data.campaigns.length})</h3>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Sent</th>
                  <th>Open Rate</th>
                  <th>Click Rate</th>
                  <th>Conversions</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${data.campaigns.map(c => `
                  <tr>
                    <td><strong>${c.name}</strong></td>
                    <td><span class="badge badge-info">${c.campaign_type}</span></td>
                    <td><span class="badge ${c.status === 'active' ? 'badge-success' : 'badge-secondary'}">${c.status}</span></td>
                    <td>${c.sent.toLocaleString()}</td>
                    <td>${c.open_rate}%</td>
                    <td>${c.click_rate}%</td>
                    <td>${c.converted}</td>
                    <td>$${c.revenue.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderEmailDrillDown(data, period) {
  return `
    <div class="drill-down-container">
      <div class="drill-down-header">
        <button class="btn-back" onclick="loadDashboard()" title="Back to Dashboard">${BACK_SVG}</button>
        <h2>${ICONS.mail} Email Performance</h2>
        <div class="period-selector">
          <button class="btn ${period === 7 ? 'btn-primary' : 'btn-secondary'}" onclick="loadDrillDown('email', 7)">7 Days</button>
          <button class="btn ${period === 30 ? 'btn-primary' : 'btn-secondary'}" onclick="loadDrillDown('email', 30)">30 Days</button>
          <button class="btn ${period === 90 ? 'btn-primary' : 'btn-secondary'}" onclick="loadDrillDown('email', 90)">90 Days</button>
        </div>
      </div>
      
      <div class="stats-grid" style="margin-bottom: 2rem;">
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">Emails Sent</span>
            <span class="stat-card-icon">${ICONS.mail}</span>
          </div>
          <div class="stat-card-value">${data.summary.sent.toLocaleString()}</div>
          <div class="stat-card-label">Total delivered</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">Open Rate</span>
            <span class="stat-card-icon">${ICONS.barChart}</span>
          </div>
          <div class="stat-card-value">${data.summary.open_rate}%</div>
          <div class="stat-card-label">${data.summary.opened.toLocaleString()} opens</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">Click Rate</span>
            <span class="stat-card-icon">${ICONS.mousePointer}</span>
          </div>
          <div class="stat-card-value">${data.summary.click_rate}%</div>
          <div class="stat-card-label">${data.summary.clicked.toLocaleString()} clicks</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">Bounce Rate</span>
            <span class="stat-card-icon">${ICONS.alertTriangle}</span>
          </div>
          <div class="stat-card-value">${data.summary.bounce_rate}%</div>
          <div class="stat-card-label">${data.summary.bounced.toLocaleString()} bounced</div>
        </div>
      </div>
      
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-header">
          <h3 class="card-title">Email Performance Trend</h3>
        </div>
        <div class="card-body">
          <canvas id="drill-down-chart" style="max-height: 300px;"></canvas>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Top Performing Emails (${data.top_emails.length})</h3>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Subject</th>
                  <th>Sent</th>
                  <th>Opens</th>
                  <th>Clicks</th>
                  <th>Open Rate</th>
                  <th>Click Rate</th>
                </tr>
              </thead>
              <tbody>
                ${data.top_emails.map(e => `
                  <tr>
                    <td><strong>${e.name}</strong></td>
                    <td>${e.subject || 'N/A'}</td>
                    <td>${e.sent.toLocaleString()}</td>
                    <td>${e.opened.toLocaleString()}</td>
                    <td>${e.clicked.toLocaleString()}</td>
                    <td><span class="badge badge-success">${e.open_rate}%</span></td>
                    <td><span class="badge badge-info">${e.click_rate}%</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderRevenueDrillDown(data, period) {
  const trendIcon = parseFloat(data.summary.trend) >= 0 ? ICONS.trendingUp : ICONS.arrowDown;
  const trendClass = parseFloat(data.summary.trend) >= 0 ? 'positive' : 'negative';
  
  return `
    <div class="drill-down-container">
      <div class="drill-down-header">
        <button class="btn-back" onclick="loadDashboard()" title="Back to Dashboard">${BACK_SVG}</button>
        <h2>${ICONS.dollarSign} Revenue Analytics</h2>
        <div class="period-selector">
          <button class="btn ${period === 7 ? 'btn-primary' : 'btn-secondary'}" onclick="loadDrillDown('revenue', 7)">7 Days</button>
          <button class="btn ${period === 30 ? 'btn-primary' : 'btn-secondary'}" onclick="loadDrillDown('revenue', 30)">30 Days</button>
          <button class="btn ${period === 90 ? 'btn-primary' : 'btn-secondary'}" onclick="loadDrillDown('revenue', 90)">90 Days</button>
        </div>
      </div>
      
      <div class="stats-grid" style="margin-bottom: 2rem;">
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">Total Revenue</span>
            <span class="stat-card-icon">${ICONS.dollarSign}</span>
          </div>
          <div class="stat-card-value">$${parseFloat(data.summary.total_revenue).toLocaleString()}</div>
          <div class="stat-card-label">
            <span class="stat-card-change ${trendClass}">${trendIcon} ${data.summary.trend}% vs previous</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">Total Orders</span>
            <span class="stat-card-icon">${ICONS.gem}</span>
          </div>
          <div class="stat-card-value">${data.summary.total_orders.toLocaleString()}</div>
          <div class="stat-card-label">Completed orders</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">Avg Order Value</span>
            <span class="stat-card-icon">${ICONS.barChart}</span>
          </div>
          <div class="stat-card-value">$${parseFloat(data.summary.average_order_value).toFixed(2)}</div>
          <div class="stat-card-label">Per transaction</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">Previous Period</span>
            <span class="stat-card-icon">📅</span>
          </div>
          <div class="stat-card-value">$${parseFloat(data.summary.previous_revenue).toLocaleString()}</div>
          <div class="stat-card-label">Comparison</div>
        </div>
      </div>
      
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-header">
          <h3 class="card-title">Revenue Trend</h3>
        </div>
        <div class="card-body">
          <canvas id="drill-down-chart" style="max-height: 300px;"></canvas>
        </div>
      </div>
      
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-header">
          <h3 class="card-title">Top Products (${data.top_products.length})</h3>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Orders</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${data.top_products.map(p => `
                  <tr>
                    <td><strong>${p.name}</strong></td>
                    <td>$${p.price.toFixed(2)}</td>
                    <td>${p.orders.toLocaleString()}</td>
                    <td>$${p.revenue.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Recent Orders (${data.recent_orders.length})</h3>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${data.recent_orders.map(o => `
                  <tr>
                    <td>#${o.id}</td>
                    <td>${o.customer_name}</td>
                    <td>${o.product_name}</td>
                    <td>$${o.total.toFixed(2)}</td>
                    <td><span class="badge ${o.status === 'completed' ? 'badge-success' : 'badge-warning'}">${o.status}</span></td>
                    <td>${new Date(o.ordered_at).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Simple chart rendering function
function renderChart(metric, chartData) {
  const canvas = document.getElementById('drill-down-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.parentElement.clientWidth;
  const height = 300;
  canvas.width = width;
  canvas.height = height;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Prepare data based on metric type
  let labels = [];
  let values = [];
  
  switch(metric) {
    case 'customers':
      labels = chartData.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      values = chartData.map(d => d.count);
      break;
    case 'email':
      labels = chartData.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      values = chartData.map(d => d.sent);
      break;
    case 'revenue':
      labels = chartData.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      values = chartData.map(d => d.revenue);
      break;
  }
  
  if (values.length === 0) {
    ctx.fillStyle = '#6B7280';
    ctx.font = '16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('No data available for chart', width / 2, height / 2);
    return;
  }
  
  // Calculate chart dimensions
  const padding = 60;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values, 0);
  const valueRange = maxValue - minValue || 1;
  
  // Draw axes
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();
  
  // Draw bars
  const barWidth = chartWidth / values.length;
  const barSpacing = barWidth * 0.2;
  
  values.forEach((value, i) => {
    const barHeight = ((value - minValue) / valueRange) * chartHeight;
    const x = padding + (i * barWidth) + barSpacing / 2;
    const y = height - padding - barHeight;
    
    // Gradient
    const gradient = ctx.createLinearGradient(0, y, 0, height - padding);
    gradient.addColorStop(0, '#3B82F6');
    gradient.addColorStop(1, '#60A5FA');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth - barSpacing, barHeight);
    
    // Value label on top
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(value.toLocaleString(), x + (barWidth - barSpacing) / 2, y - 5);
  });
  
  // Draw labels
  ctx.fillStyle = '#6B7280';
  ctx.font = '11px system-ui';
  ctx.textAlign = 'center';
  
  labels.forEach((label, i) => {
    const x = padding + (i * barWidth) + barWidth / 2;
    const y = height - padding + 20;
    
    // Rotate labels if too many
    if (labels.length > 20) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(label, 0, 0);
      ctx.restore();
    } else {
      ctx.fillText(label, x, y);
    }
  });
  
  // Y-axis labels
  ctx.textAlign = 'right';
  ctx.fillStyle = '#6B7280';
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const value = minValue + (valueRange / ySteps) * i;
    const y = height - padding - (chartHeight / ySteps) * i;
    ctx.fillText(value.toFixed(0), padding - 10, y + 4);
    
    // Grid line
    ctx.strokeStyle = '#F3F4F6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }
}

// Audiences Functions
// Audience filter state
let audienceFilters = {
  status: 'all',
  type: 'all',
  search: ''
};

async function loadAudiences() {
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/audiences`);
    let audiences = await response.json();
    const allAudiences = Array.isArray(audiences) ? audiences : [];
    
    // Apply filters
    audiences = audiences.filter(aud => {
      if (audienceFilters.status !== 'all' && aud.status !== audienceFilters.status) return false;
      if (audienceFilters.type !== 'all') {
        if (audienceFilters.type === 'segment_based') {
          if (!['static', 'dynamic', 'segment_based'].includes(aud.audience_type)) return false;
        } else if (aud.audience_type !== audienceFilters.type) {
          return false;
        }
      }
      
      if (audienceFilters.search) {
        const searchTerm = audienceFilters.search.toLowerCase();
        const name = (aud.name || '').toLowerCase();
        const desc = (aud.description || '').toLowerCase();
        if (!name.includes(searchTerm) && !desc.includes(searchTerm)) return false;
      }
      
      return true;
    });
    
    // Apply sorting
    audiences = applySorting(audiences, currentTableSort.column || 'id');
    
    const [deliveriesResp, workflowsResp] = await Promise.all([
      fetch(`${API_BASE}/deliveries`),
      fetch(`${API_BASE}/workflows`)
    ]);
    const deliveriesData = await deliveriesResp.json();
    const workflowsData = await workflowsResp.json();
    const deliveries = deliveriesData.deliveries || deliveriesData || [];
    const workflows = workflowsData.workflows || workflowsData || [];
    
    const audienceUsage = new Map();
    const ensureAudienceUsage = (id) => {
      if (!audienceUsage.has(id)) {
        audienceUsage.set(id, { workflows: [], deliveries: [] });
      }
      return audienceUsage.get(id);
    };
    const addUniqueUsage = (list, item) => {
      if (!list.some(existing => existing.id === item.id)) {
        list.push(item);
      }
    };
    
    workflows.forEach(w => {
      const nodes = w.orchestration?.nodes || [];
      if (w.audience_config?.audience_id) {
        const usage = ensureAudienceUsage(w.audience_config.audience_id);
        addUniqueUsage(usage.workflows, { id: w.id, name: w.name });
      }
      nodes.forEach(node => {
        const isAudienceSource = ['query', 'build_audience'].includes(node.type) && node.config?.source_type === 'audience';
        const audienceId = node.config?.audience_id;
        if (isAudienceSource && audienceId) {
          const usage = ensureAudienceUsage(audienceId);
          addUniqueUsage(usage.workflows, { id: w.id, name: w.name });
        }
      });
    });
    
    deliveries.forEach(d => {
      if (d.audience_id) {
        const usage = ensureAudienceUsage(d.audience_id);
        addUniqueUsage(usage.deliveries, { id: d.id, name: d.name });
      }
    });
    
    // Generate Adobe Campaign style table rows
    const tableRows = audiences.map(aud => {
      const statusMap = {
        'active': 'in-progress',
        'draft': 'draft'
      };
      const typeLabelMap = {
        static: 'Static',
        dynamic: 'Dynamic',
        combined: 'Combined',
        imported: 'Imported',
        segment_based: 'Segment-based'
      };
      
      const actions = [
        {icon: ICONS.usersRound, label: 'View Members', onclick: `viewAudienceMembers(${aud.id})`},
        {icon: ICONS.edit, label: 'Edit', onclick: `navigateTo('audiences', 'edit', ${aud.id})`},
        {divider: true},
        {icon: ICONS.trash, label: 'Delete', onclick: `deleteAudience(${aud.id})`, danger: true}
      ];
      
      const usage = audienceUsage.get(aud.id) || { workflows: [], deliveries: [] };
      const usedInItems = [
        ...usage.workflows.map(w => ({ label: `Workflow: ${w.name}`, onclick: `navigateTo('workflows', 'edit', ${w.id})` })),
        ...usage.deliveries.map(d => ({ label: `Delivery: ${d.name}`, onclick: `editDelivery(${d.id})` }))
      ];
      
      return `
        <tr>
          <td data-column-id="name">${createTableLink(aud.name, `navigateTo('audiences', 'edit', ${aud.id})`)}</td>
          <td data-column-id="status">${createStatusIndicator(statusMap[aud.status] || 'draft', aud.status || 'draft')}</td>
          <td data-column-id="audience_type">${typeLabelMap[aud.audience_type] || aud.audience_type}</td>
          <td data-column-id="customer_count">${aud.customer_count || 0}</td>
          <td data-column-id="used_in">${renderUsedInList(usedInItems)}</td>
          <td data-column-id="description">${aud.description || '-'}</td>
          <td data-column-id="updated_at">${new Date(aud.updated_at || aud.created_at || Date.now()).toLocaleDateString()}</td>
          <td>${createActionMenu(aud.id, actions)}</td>
        </tr>
      `;
    }).join('');

    const filterTags = [];
    if (audienceFilters.type !== 'all') {
      filterTags.push({ key: 'type', label: 'Type', value: audienceFilters.type });
    }
    if (audienceFilters.status !== 'all') {
      filterTags.push({ key: 'status', label: 'Status', value: audienceFilters.status });
    }
    if (audienceFilters.search) {
      filterTags.push({ key: 'search', label: 'Search', value: audienceFilters.search });
    }
    
    const columns = [
      { id: 'name', label: 'Audience' },
      { id: 'status', label: 'Status' },
      { id: 'audience_type', label: 'Type' },
      { id: 'customer_count', label: 'Size' },
      { id: 'used_in', label: 'Used in' },
      { id: 'description', label: 'Description' },
      { id: 'updated_at', label: 'Last modified' }
    ];
    
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${ICONS.usersRound} Audiences</h3>
        </div>
        
        ${createTableToolbar({
          tabs: ['All', 'Segment-based', 'Combined', 'Imported'],
          activeTab: audienceFilters.type === 'segment_based' ? 'Segment-based' : audienceFilters.type === 'combined' ? 'Combined' : audienceFilters.type === 'imported' ? 'Imported' : 'All',
          resultCount: audiences.length,
          totalCount: allAudiences.length,
          showRefresh: false,
          showColumnSelector: true,
          columns,
          viewKey: 'audiences',
          showSearch: true,
          searchPlaceholder: 'Search audiences...',
          searchValue: audienceFilters.search || '',
          onSearch: 'updateAudienceFilter("search", this.value)',
          filterTags,
          onClearTag: 'clearAudienceFilterTag',
          filters: [
            {
              type: 'select',
              label: 'Status',
              value: audienceFilters.status,
              onChange: 'updateAudienceFilter("status", this.value)',
              options: [
                {value: 'all', label: 'All Statuses'},
                {value: 'draft', label: 'Draft'},
                {value: 'active', label: 'Active'}
              ]
            },
            {
              type: 'select',
              label: 'Type',
              value: audienceFilters.type,
              onChange: 'updateAudienceFilter("type", this.value)',
              options: [
                {value: 'all', label: 'All Types'},
                {value: 'segment_based', label: 'Segment Based'},
                {value: 'combined', label: 'Combined'},
                {value: 'imported', label: 'Imported'}
              ]
            }
          ]
        })}
        
        <div class="data-table-container">
          <table class="data-table" data-view="audiences">
            <thead>
              <tr>
                ${createSortableHeader('name', 'Audience', currentTableSort)}
                ${createSortableHeader('status', 'Status', currentTableSort)}
                ${createSortableHeader('audience_type', 'Type', currentTableSort)}
                ${createSortableHeader('customer_count', 'Size', currentTableSort)}
                <th data-column-id="used_in">Used in</th>
                <th data-column-id="description">Description</th>
                ${createSortableHeader('updated_at', 'Last modified', currentTableSort)}
                <th style="width: 50px;"></th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #6B7280;">No audiences found</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    document.getElementById('content').innerHTML = content;
    applyColumnVisibility('audiences');
  } catch (error) {
    showError('Failed to load audiences');
    console.error(error);
  } finally {
    hideLoading();
  }
}

function viewAudienceMembers(id) {
  showToast('Audience member viewer coming soon!', 'info');
}

// Audience filter helper functions
function updateAudienceFilter(key, value) {
  audienceFilters[key] = value;
  
  // Debounce search, reload immediately for other filters
  if (key === 'search') {
    debounce('audienceSearch', () => loadAudiences(), 400);
  } else {
    loadAudiences();
  }
}

function clearAudienceFilters() {
  audienceFilters = {
    status: 'all',
    type: 'all',
    search: ''
  };
  loadAudiences();
}

function editAudience(id) {
  showToast('Audience editor coming soon! Use API for now.', 'info');
}

function deleteAudience(id) {
  showConfirmModal('Are you sure you want to delete this audience?', async () => {
    showLoading();
    try {
      const response = await fetch(`${API_BASE}/audiences/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      
      hideLoading();
      showToast('Audience deleted successfully!', 'success');
      loadAudiences();
    } catch (error) {
      hideLoading();
      showError('Failed to delete audience');
    }
  });
}

// Custom Objects Functions
async function loadCustomObjects() {
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/custom-objects`);
    const objects = await response.json();
    
    const tableRows = objects.map(obj => {
      const statusBadge = obj.is_active ? 'badge-success' : 'badge-secondary';
      const actions = [
        { icon: ICONS.blocks, label: 'Build UI', onclick: `buildObjectUI(${obj.id})` },
        { icon: ICONS.monitor, label: 'Open UI', onclick: `openObjectUI(${obj.id})` },
        { divider: true },
        { icon: ICONS.barChart, label: 'View Data', onclick: `viewObjectData(${obj.id})` },
        { icon: ICONS.edit, label: 'Edit', onclick: `navigateTo('custom-objects', 'edit', ${obj.id})` },
        { divider: true },
        { icon: ICONS.trash, label: 'Delete', onclick: `deleteCustomObject(${obj.id})`, danger: true }
      ];
      
      return `
        <tr>
          <td>${obj.id}</td>
          <td><strong>${obj.label}</strong><br><small>${obj.name}</small></td>
          <td>${obj.description || 'N/A'}</td>
          <td>${obj.fields.length} fields</td>
          <td>${obj.record_count || 0} records</td>
          <td><span class="badge ${statusBadge}">${obj.is_active ? 'Active' : 'Inactive'}</span></td>
          <td>${createActionMenu(obj.id, actions)}</td>
        </tr>
      `;
    }).join('');
    
    const content = `
      <div class="card">
        <div class="card-header" style="display:flex; align-items:center; justify-content:space-between; gap: 1rem;">
          <h3 class="card-title">Custom Objects (${objects.length} total)</h3>
          <button class="btn btn-secondary" onclick="showCustomObjectsER()">ER Diagram</button>
        </div>
        <div class="card-body">
          <div class="data-table-container overflow-visible">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Fields</th>
                  <th>Records</th>
                  <th>Status</th>
                  <th style="width: 50px;"></th>
                </tr>
              </thead>
              <tbody>
                ${tableRows || '<tr><td colspan="7" style="text-align: center;">No custom objects yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('content').innerHTML = content;
  } catch (error) {
    showError('Failed to load custom objects');
  } finally {
    hideLoading();
  }
}

function buildObjectUI(objectId) {
  window.location.href = `/ui-builder.html?objectId=${objectId}`;
}

function openObjectUI(objectId) {
  window.location.href = `/object-ui.html?objectId=${objectId}`;
}

let erDiagramModel = null;
let erDiagramState = {
  layers: {
    definitions: true,
    memberships: true,
    executions: true,
    metrics: true
  },
  entitiesOnly: false,
  showRelationships: true,
  showAttributes: false,
  nodeModes: {},
  selectedEntityId: null,
  hoveredEntityId: null,
  hoveredEdge: null,
  lanePairs: {
    def_mem: true,
    mem_exec: true,
    exec_metrics: true
  }
};

function buildNormalizedERModel(customObjects = []) {
  const nodes = [];
  const relationships = [];
  const addNode = (id, label, fields, column) => {
    nodes.push({ id, label, fields, column });
  };
  const addRel = (from, to, type) => {
    relationships.push({ from, to, type });
  };

  // Definitions (independent)
  addNode('people', 'people', ['id (PK)', 'email', 'first_name', 'last_name', 'status'], 'definitions');
  addNode('segments', 'segments', ['id (PK)', 'name', 'segment_type'], 'definitions');
  addNode('groups', 'groups', ['id (PK)', 'name'], 'definitions');
  addNode('audiences', 'audiences', ['id (PK)', 'name'], 'definitions');
  addNode('programs', 'programs', ['id (PK)', 'name', 'status'], 'definitions');
  addNode('deliveries', 'deliveries', ['id (PK)', 'name', 'channel'], 'definitions');

  // Memberships / junctions
  addNode('segment_memberships', 'segment_memberships', ['id (PK)', 'person_id (FK)', 'segment_id (FK)'], 'memberships');
  addNode('group_memberships', 'group_memberships', ['id (PK)', 'person_id (FK)', 'group_id (FK)'], 'memberships');
  addNode('audience_memberships', 'audience_memberships', ['id (PK)', 'person_id (FK)', 'audience_id (FK)'], 'memberships');
  addNode('delivery_recipients', 'delivery_recipients', ['id (PK)', 'delivery_id (FK)', 'person_id (FK)', 'status'], 'memberships');

  // Executions & runs
  addNode('program_runs', 'program_runs', ['id (PK)', 'program_id (FK)', 'status', 'started_at'], 'executions');

  // Metrics
  addNode('program_metrics', 'program_metrics', ['id (PK)', 'program_id (FK)', 'period_start'], 'metrics');
  addNode('execution_metrics', 'execution_metrics', ['id (PK)', 'program_run_id (FK)', 'period_start'], 'metrics');

  // Orchestration graph (normalized, no blobs)
  addNode('workflow_nodes', 'workflow_nodes', ['id (PK)', 'program_id (FK)', 'type', 'position_x', 'position_y'], 'executions');
  addNode('workflow_connections', 'workflow_connections', ['id (PK)', 'program_id (FK)', 'from_node_id (FK)', 'to_node_id (FK)'], 'executions');

  // Activity & events (attached to business context)
  addNode('activity_events', 'activity_events', ['id (PK)', 'person_id (FK)', 'program_id (FK)', 'program_run_id (FK)', 'event_type'], 'executions');

  // Relationships (explicit FKs + cardinality)
  addRel('segment_memberships', 'people', 'N:1');
  addRel('segment_memberships', 'segments', 'N:1');
  addRel('group_memberships', 'people', 'N:1');
  addRel('group_memberships', 'groups', 'N:1');
  addRel('audience_memberships', 'people', 'N:1');
  addRel('audience_memberships', 'audiences', 'N:1');
  addRel('delivery_recipients', 'people', 'N:1');
  addRel('delivery_recipients', 'deliveries', 'N:1');
  addRel('program_runs', 'programs', 'N:1');
  addRel('program_metrics', 'programs', 'N:1');
  addRel('execution_metrics', 'program_runs', 'N:1');
  addRel('workflow_nodes', 'programs', 'N:1');
  addRel('workflow_connections', 'workflow_nodes', 'N:1');
  addRel('workflow_connections', 'workflow_nodes', 'N:1');
  addRel('activity_events', 'people', 'N:1');
  addRel('activity_events', 'programs', 'N:1');
  addRel('activity_events', 'program_runs', 'N:1');

  // Custom objects (definitions + explicit relationships)
  customObjects.forEach(obj => {
    const fieldList = ['id (PK)', ...(obj.fields || []).map(f => {
      const fk = f.name.endsWith('_id') ? ' (FK)' : '';
      return `${f.name}${fk}`;
    })];
    addNode(`custom-${obj.name}`, obj.name, fieldList, 'definitions');
    (obj.relationships || []).forEach(rel => {
      if (!rel.to_table) return;
      const targetId = rel.to_table === 'contacts' ? 'people' : `custom-${rel.to_table}`;
      addRel(`custom-${obj.name}`, targetId, rel.type || 'N:1');
    });
  });

  return { nodes, relationships };
}

async function showCustomObjectsER() {
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/custom-objects`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load objects');
    const customObjects = Array.isArray(data) ? data : (data.objects || []);
    erDiagramModel = buildNormalizedERModel(customObjects);
    erDiagramState = {
      layers: { definitions: true, memberships: true, executions: true, metrics: true },
      entitiesOnly: false,
      showRelationships: true,
      showAttributes: false,
      nodeModes: {},
      selectedEntityId: null,
      hoveredEntityId: null,
      hoveredEdge: null,
      selectedEdge: null,
      lanePairs: { def_mem: true, mem_exec: true, exec_metrics: true },
      exportOptions: {
        format: 'png',
        scope: 'visible',
        attributes: 'show',
        resolution: 2,
        pageSize: 'letter',
        orientation: 'landscape'
      }
    };
    
    const modal = document.createElement('div');
    modal.className = 'er-modal-overlay';
    modal.id = 'custom-objects-er-modal';
    const columns = [
      { id: 'definitions', label: 'Definitions' },
      { id: 'memberships', label: 'Memberships' },
      { id: 'executions', label: 'Executions' },
      { id: 'metrics', label: 'Metrics' }
    ];
    modal.innerHTML = `
      <div class="er-modal" onclick="event.stopPropagation()">
        <div class="er-modal-header">
          <h3>ER Diagram</h3>
          <div class="er-modal-actions">
            <button class="btn btn-secondary" type="button" onclick="toggleERFullscreen()" id="er-fullscreen-btn">Full screen</button>
            <div class="er-export-menu">
              <button class="btn btn-secondary" onclick="toggleExportMenu()">Export ▾</button>
              <div id="er-export-dropdown" class="er-export-dropdown hidden">
                <button type="button" onclick="openExportPanel('print')">Print</button>
                <button type="button" onclick="openExportPanel('png')">PNG</button>
                <button type="button" onclick="openExportPanel('jpeg')">JPEG</button>
                <button type="button" onclick="openExportPanel('pdf')">PDF</button>
                <button type="button" onclick="openExportPanel('svg')">SVG</button>
              </div>
            </div>
          </div>
          <button class="btn btn-ghost" onclick="closeCustomObjectsER()">${ICONS.x}</button>
        </div>
        <div class="er-controls">
          <div class="er-controls-group">
            <label class="er-control"><input type="checkbox" data-layer="definitions" checked onchange="toggleERLayer('definitions', this.checked)"> Definitions</label>
            <label class="er-control"><input type="checkbox" data-layer="memberships" checked onchange="toggleERLayer('memberships', this.checked)"> Memberships</label>
            <label class="er-control"><input type="checkbox" data-layer="executions" checked onchange="toggleERLayer('executions', this.checked)"> Executions</label>
            <label class="er-control"><input type="checkbox" data-layer="metrics" checked onchange="toggleERLayer('metrics', this.checked)"> Metrics</label>
          </div>
          <div class="er-controls-group">
            <label class="er-control"><input type="checkbox" onchange="toggleEREntitiesOnly(this.checked)"> Entities only</label>
            <label class="er-control"><input type="checkbox" checked onchange="toggleERRelationships(this.checked)"> Relationships</label>
            <label class="er-control"><input type="checkbox" onchange="toggleERAttributes(this.checked)"> Show attributes</label>
          </div>
        </div>
        <div id="er-export-panel" class="er-export-panel hidden">
          <div class="er-export-header">
            <div class="er-export-title">Export options</div>
            <button class="btn btn-ghost" type="button" onclick="closeExportPanel()">${ICONS.x}</button>
          </div>
          <div class="er-export-grid">
            <div class="form-group">
              <label class="form-label">Content scope</label>
              <select id="er-export-scope" class="form-input">
                <option value="visible">Current visible layers</option>
                <option value="all">All layers</option>
                <option value="entities">Entities only</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Attributes</label>
              <select id="er-export-attributes" class="form-input">
                <option value="show">Show</option>
                <option value="hide">Hide</option>
              </select>
            </div>
            <div class="form-group" id="er-export-resolution-row">
              <label class="form-label">Resolution</label>
              <select id="er-export-resolution" class="form-input">
                <option value="1">1x</option>
                <option value="2" selected>2x</option>
                <option value="3">3x</option>
              </select>
            </div>
            <div class="form-group" id="er-export-page-size-row">
              <label class="form-label">Page size</label>
              <select id="er-export-page-size" class="form-input">
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
                <option value="a4">A4</option>
              </select>
            </div>
            <div class="form-group" id="er-export-orientation-row">
              <label class="form-label">Orientation</label>
              <select id="er-export-orientation" class="form-input">
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
              </select>
            </div>
          </div>
          <div class="er-export-actions">
            <div class="er-export-meta" id="er-export-format-label">Format: PNG</div>
            <div>
              <button class="btn btn-secondary" type="button" onclick="closeExportPanel()">Cancel</button>
              <button class="btn btn-primary" type="button" onclick="runERExport()">Export</button>
            </div>
          </div>
        </div>
        <div class="er-diagram" id="er-diagram">
          <svg class="er-svg" id="er-svg"></svg>
        </div>
      </div>
    `;
    
    modal.addEventListener('click', closeCustomObjectsER);
    document.body.appendChild(modal);
    requestAnimationFrame(() => {
      renderERDiagram();
      const diagram = document.getElementById('er-diagram');
      if (diagram) {
        diagram.addEventListener('scroll', drawCustomObjectERLines);
      }
      window.addEventListener('resize', drawCustomObjectERLines);
      window.addEventListener('keydown', handleERKeydown);
      document.addEventListener('click', handleExportMenuClick);
      document.addEventListener('fullscreenchange', handleERFullscreenChange);
    });
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function closeCustomObjectsER() {
  const modal = document.getElementById('custom-objects-er-modal');
  if (modal) {
    const diagram = modal.querySelector('#er-diagram');
    if (diagram) diagram.removeEventListener('scroll', drawCustomObjectERLines);
    window.removeEventListener('resize', drawCustomObjectERLines);
    window.removeEventListener('keydown', handleERKeydown);
    document.removeEventListener('click', handleExportMenuClick);
    document.removeEventListener('fullscreenchange', handleERFullscreenChange);
    modal.remove();
  }
}

function drawCustomObjectERLines() {
  const diagram = document.getElementById('er-diagram');
  const svg = document.getElementById('er-svg');
  if (!diagram || !svg) return;
  
  const diagramRect = diagram.getBoundingClientRect();
  const width = Math.max(diagram.scrollWidth, diagramRect.width);
  const height = Math.max(diagram.scrollHeight, diagramRect.height);
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.innerHTML = '';
  if (erDiagramState.entitiesOnly || !erDiagramState.showRelationships) {
    updateERFocusStyles();
    return;
  }
  const relationships = erDiagramState.visibleRelationships || [];
  const columnIndexMap = new Map();
  diagram.querySelectorAll('.er-column').forEach((col, idx) => {
    col.querySelectorAll('.er-node').forEach(node => {
      columnIndexMap.set(node.dataset.node, idx);
    });
  });
  const laneCounts = new Map();
  const outgoingCounts = new Map();
  const incomingCounts = new Map();
  const outgoingTotals = new Map();
  const incomingTotals = new Map();
  const spreadIndex = (index) => {
    if (index <= 1) return 0;
    const n = Math.ceil(index / 2);
    const sign = index % 2 === 0 ? -1 : 1;
    return sign * n;
  };
  const computePortOffset = (index, total, height) => {
    if (total <= 1) return 0;
    const span = Math.max(20, height * 0.7);
    const step = span / (total - 1);
    return -span / 2 + (index - 1) * step;
  };
  relationships.forEach(rel => {
    const fromEl = diagram.querySelector(`[data-node="${rel.from}"]`);
    const toEl = diagram.querySelector(`[data-node="${rel.to}"]`);
    if (!fromEl || !toEl) return;
    outgoingTotals.set(rel.from, (outgoingTotals.get(rel.from) || 0) + 1);
    incomingTotals.set(rel.to, (incomingTotals.get(rel.to) || 0) + 1);
  });
  relationships.forEach(rel => {
    const fromEl = diagram.querySelector(`[data-node="${rel.from}"]`);
    const toEl = diagram.querySelector(`[data-node="${rel.to}"]`);
    if (!fromEl || !toEl) return;
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    const fromLeft = fromRect.left - diagramRect.left + diagram.scrollLeft;
    const fromRight = fromRect.right - diagramRect.left + diagram.scrollLeft;
    const toLeft = toRect.left - diagramRect.left + diagram.scrollLeft;
    const toRight = toRect.right - diagramRect.left + diagram.scrollLeft;
    const goesRight = fromLeft < toLeft;
    const startX = goesRight ? fromRight : fromLeft;
    const endX = goesRight ? toLeft : toRight;
    const baseStartY = fromRect.top + fromRect.height / 2 - diagramRect.top + diagram.scrollTop;
    const baseEndY = toRect.top + toRect.height / 2 - diagramRect.top + diagram.scrollTop;
    const outIndex = (outgoingCounts.get(rel.from) || 0) + 1;
    const inIndex = (incomingCounts.get(rel.to) || 0) + 1;
    outgoingCounts.set(rel.from, outIndex);
    incomingCounts.set(rel.to, inIndex);
    const startY = baseStartY + computePortOffset(outIndex, outgoingTotals.get(rel.from) || 1, fromRect.height);
    const endY = baseEndY + computePortOffset(inIndex, incomingTotals.get(rel.to) || 1, toRect.height);
    const fromCol = columnIndexMap.get(rel.from) ?? 0;
    const toCol = columnIndexMap.get(rel.to) ?? 0;
    const pairKey = `${Math.min(fromCol, toCol)}-${Math.max(fromCol, toCol)}`;
    const lane = (laneCounts.get(pairKey) || 0) + 1;
    laneCounts.set(pairKey, lane);
    const laneStep = 18;
    const laneOffset = spreadIndex(lane) * laneStep;

    // Smooth cubic bezier curve
    const dx = Math.abs(endX - startX);
    const cpOffset = Math.max(40, dx * 0.4);
    const outDir = goesRight ? 1 : -1;
    const cp1x = startX + outDir * cpOffset;
    const cp1y = startY + laneOffset;
    const cp2x = endX - outDir * cpOffset;
    const cp2y = endY + laneOffset;
    const d = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', 'er-line');
    path.dataset.from = rel.from;
    path.dataset.to = rel.to;
    path.addEventListener('mouseenter', () => {
      erDiagramState.hoveredEdge = { from: rel.from, to: rel.to };
      updateERFocusStyles();
    });
    path.addEventListener('mouseleave', () => {
      erDiagramState.hoveredEdge = null;
      updateERFocusStyles();
    });
    path.addEventListener('click', (event) => {
      event.stopPropagation();
      const current = erDiagramState.selectedEdge;
      if (current && current.from === rel.from && current.to === rel.to) {
        erDiagramState.selectedEdge = null;
      } else {
        erDiagramState.selectedEdge = { from: rel.from, to: rel.to };
      }
      updateERFocusStyles();
    });
    svg.appendChild(path);

    // Small dot at start of line
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', startX);
    dot.setAttribute('cy', startY);
    dot.setAttribute('r', '3');
    dot.setAttribute('class', 'er-line-dot');
    dot.setAttribute('fill', 'var(--border-medium)');
    svg.appendChild(dot);

    // Label badge at midpoint of bezier
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2 + laneOffset * 0.5;
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', midX);
    label.setAttribute('y', midY - 2);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('class', 'er-line-label');
    label.textContent = rel.type || '';
    svg.appendChild(label);
    const bbox = label.getBBox();
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', bbox.x - 5);
    rect.setAttribute('y', bbox.y - 2);
    rect.setAttribute('width', bbox.width + 10);
    rect.setAttribute('height', bbox.height + 4);
    rect.setAttribute('class', 'er-line-label-bg');
    svg.insertBefore(rect, label);
  });
  updateERFocusStyles();
}

function getVisibleLayers() {
  return Object.keys(erDiagramState.layers).filter(layer => erDiagramState.layers[layer]);
}

function getFieldMode(nodeId, fallbackColumn = 'definitions') {
  if (!nodeId) return 'standard';
  if (erDiagramState.nodeModes[nodeId]) return erDiagramState.nodeModes[nodeId];
  if (fallbackColumn === 'definitions') return 'standard';
  return 'basic';
}

function getFieldSet(fields, mode) {
  const isPKFK = field => /\(PK\)|\(FK\)/.test(field);
  if (mode === 'basic') return fields.filter(isPKFK);
  if (mode === 'full') return fields;
  const pkfk = fields.filter(isPKFK);
  const extras = fields.filter(f => !isPKFK(f)).slice(0, 2);
  return [...pkfk, ...extras];
}

function getLaneIndex(column) {
  const laneOrder = ['definitions', 'memberships', 'executions', 'metrics'];
  return laneOrder.indexOf(column);
}

function getLanePairKey(fromColumn, toColumn) {
  const fromIdx = getLaneIndex(fromColumn);
  const toIdx = getLaneIndex(toColumn);
  if (fromIdx === -1 || toIdx === -1) return null;
  if (Math.abs(fromIdx - toIdx) !== 1) return null;
  const pair = fromIdx < toIdx ? `${fromColumn}_${toColumn}` : `${toColumn}_${fromColumn}`;
  if (pair === 'definitions_memberships') return 'def_mem';
  if (pair === 'memberships_executions') return 'mem_exec';
  if (pair === 'executions_metrics') return 'exec_metrics';
  return null;
}

function getAdjacentRelationships(relationships, fromLane, toLane) {
  return relationships.filter(rel => {
    const fromCol = erDiagramModel.nodes.find(n => n.id === rel.from)?.column;
    const toCol = erDiagramModel.nodes.find(n => n.id === rel.to)?.column;
    return (fromCol === fromLane && toCol === toLane) || (fromCol === toLane && toCol === fromLane);
  });
}

function sortNodesByAlignment(nodes, prevNodes, relationships, lane, orderMap, prevLane = null) {
  const order = orderMap[lane] || [];
  if (!prevNodes.length) {
    return nodes.sort((a, b) => {
      const aIdx = order.indexOf(a.id);
      const bIdx = order.indexOf(b.id);
      if (aIdx !== -1 || bIdx !== -1) {
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
      }
      return a.label.localeCompare(b.label);
    });
  }
  const prevIndexMap = new Map(prevNodes.map((node, idx) => [node.id, idx]));
  const rels = prevLane ? getAdjacentRelationships(relationships, lane, prevLane) : [];
  return nodes.sort((a, b) => {
    const aLinks = rels.filter(rel => rel.from === a.id || rel.to === a.id);
    const bLinks = rels.filter(rel => rel.from === b.id || rel.to === b.id);
    const aMin = Math.min(...aLinks.map(rel => prevIndexMap.get(rel.from === a.id ? rel.to : rel.from)).filter(v => v !== undefined), 999);
    const bMin = Math.min(...bLinks.map(rel => prevIndexMap.get(rel.from === b.id ? rel.to : rel.from)).filter(v => v !== undefined), 999);
    if (aMin !== bMin) return aMin - bMin;
    if (bLinks.length !== aLinks.length) return bLinks.length - aLinks.length;
    const aIdx = order.indexOf(a.id);
    const bIdx = order.indexOf(b.id);
    if (aIdx !== -1 || bIdx !== -1) {
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    }
    return a.label.localeCompare(b.label);
  });
}

function updateERFocusStyles() {
  const diagram = document.getElementById('er-diagram');
  if (!diagram) return;
  const nodes = diagram.querySelectorAll('.er-node');
  const lines = diagram.querySelectorAll('.er-line');
  nodes.forEach(node => node.classList.remove('is-active', 'is-dimmed'));
  lines.forEach(line => line.classList.remove('is-active', 'is-dimmed'));
  const hoveredEdge = erDiagramState.hoveredEdge;
  const selectedEdge = erDiagramState.selectedEdge;
  const focusEdge = selectedEdge || hoveredEdge;
  if (focusEdge) {
    nodes.forEach(node => {
      const id = node.dataset.node;
      if (id === focusEdge.from || id === focusEdge.to) {
        node.classList.add('is-active');
      } else {
        node.classList.add('is-dimmed');
      }
    });
    lines.forEach(line => {
      const from = line.dataset.from;
      const to = line.dataset.to;
      if (from === focusEdge.from && to === focusEdge.to) {
        line.classList.add('is-active');
      } else {
        line.classList.add('is-dimmed');
      }
    });
    return;
  }
  const activeEntity = erDiagramState.selectedEntityId || erDiagramState.hoveredEntityId;
  if (!activeEntity) return;
  const related = new Set([activeEntity]);
  (erDiagramState.visibleRelationships || []).forEach(rel => {
    if (rel.from === activeEntity || rel.to === activeEntity) {
      related.add(rel.from);
      related.add(rel.to);
    }
  });
  nodes.forEach(node => {
    const id = node.dataset.node;
    if (related.has(id)) {
      node.classList.add('is-active');
    } else {
      node.classList.add('is-dimmed');
    }
  });
  lines.forEach(line => {
    const from = line.dataset.from;
    const to = line.dataset.to;
    if (from === activeEntity || to === activeEntity) {
      line.classList.add('is-active');
    } else {
      line.classList.add('is-dimmed');
    }
  });
}

function applyERInteractions() {
  const diagram = document.getElementById('er-diagram');
  if (!diagram) return;
  if (!diagram.dataset.erBound) {
    diagram.addEventListener('click', (event) => {
      if (event.target.closest('.er-node') || event.target.closest('.er-line')) return;
      let shouldRender = false;
      if (erDiagramState.selectedEntityId) {
        erDiagramState.selectedEntityId = null;
        shouldRender = true;
      }
      if (erDiagramState.selectedEdge) {
        erDiagramState.selectedEdge = null;
        shouldRender = true;
      }
      if (shouldRender) {
        renderERDiagram();
      }
    });
    diagram.dataset.erBound = 'true';
  }
  diagram.querySelectorAll('.er-node').forEach(node => {
    node.addEventListener('mouseenter', () => {
      erDiagramState.hoveredEntityId = node.dataset.node;
      updateERFocusStyles();
    });
    node.addEventListener('mouseleave', () => {
      erDiagramState.hoveredEntityId = null;
      updateERFocusStyles();
    });
    node.addEventListener('click', (event) => {
      event.stopPropagation();
      const nodeId = node.dataset.node;
      erDiagramState.selectedEdge = null;
      erDiagramState.selectedEntityId = erDiagramState.selectedEntityId === nodeId ? null : nodeId;
      updateERFocusStyles();
    });
  });
}

function toggleERLanePair(pair, value) {
  erDiagramState.lanePairs[pair] = value;
  renderERDiagram();
}

function renderERDiagram() {
  const diagram = document.getElementById('er-diagram');
  if (!diagram || !erDiagramModel) return;
  erDiagramState.hoveredEdge = null;
  erDiagramState.hoveredEntityId = null;
  const laneOrder = ['definitions', 'memberships', 'executions', 'metrics'];
  const relationships = erDiagramModel.relationships || [];
  const orderMap = {
    definitions: ['people', 'segments', 'groups', 'audiences', 'programs', 'deliveries'],
    memberships: ['segment_memberships', 'group_memberships', 'audience_memberships', 'delivery_recipients'],
    executions: ['program_runs', 'workflow_nodes', 'workflow_connections', 'activity_events'],
    metrics: ['program_metrics', 'execution_metrics']
  };
  const grouped = laneOrder.map((lane, idx) => {
    const columnNodes = erDiagramModel.nodes.filter(n => n.column === lane);
    const prevLane = idx > 0 ? laneOrder[idx - 1] : null;
    const prevNodes = prevLane ? erDiagramModel.nodes.filter(n => n.column === prevLane) : [];
    const sorted = sortNodesByAlignment(columnNodes, prevNodes, relationships, lane, orderMap, prevLane);
    const isVisible = erDiagramState.layers[lane];
    return {
      id: lane,
      label: lane.charAt(0).toUpperCase() + lane.slice(1),
      nodes: isVisible ? sorted : [],
      hidden: !isVisible
    };
  });
  diagram.style.gridTemplateColumns = `repeat(${laneOrder.length}, minmax(240px, 1fr))`;
  const nodeHtml = grouped.map(col => `
    <div class="er-column ${col.hidden ? 'is-hidden' : ''}" data-column="${col.id}">
      <div class="er-column-title">${col.label}</div>
      ${(col.nodes || []).map(node => {
        const showFields = erDiagramState.showAttributes && !erDiagramState.entitiesOnly;
        const mode = showFields
          ? (erDiagramState.nodeModes[node.id] || 'full')
          : getFieldMode(node.id, node.column);
        const fields = showFields ? getFieldSet(node.fields || [], mode) : [];
        return `
          <div class="er-node ${node.id === 'people' ? 'er-node-primary' : ''}" data-node="${node.id}">
            <div class="er-node-header">
              <div class="er-node-title">${node.label}</div>
              ${erDiagramState.entitiesOnly ? '' : `<button class="er-node-toggle" onclick="event.stopPropagation(); toggleERNodeMode('${node.id}')" title="Toggle fields">▾</button>`}
            </div>
            ${showFields && fields.length ? `
              <div class="er-node-fields">
                ${fields.map(field => {
                  const isPK = /\(PK\)/.test(field);
                  const isFK = /\(FK\)/.test(field);
                  const cleanName = field.replace(/\s*\(PK\)\s*/g, '').replace(/\s*\(FK\)\s*/g, '').trim();
                  const badges = (isPK ? '<span class="er-field-badge er-field-badge-pk">PK</span>' : '')
                               + (isFK ? '<span class="er-field-badge er-field-badge-fk">FK</span>' : '');
                  return `<div class="er-node-field">${badges}<span class="er-field-name">${cleanName}</span></div>`;
                }).join('')}
              </div>
            ` : ``}
          </div>
        `;
      }).join('')}
    </div>
  `).join('');
  diagram.innerHTML = `<svg class="er-svg" id="er-svg"></svg>${nodeHtml}`;
  const visibleNodeIds = new Set(grouped.flatMap(col => col.nodes.map(n => n.id)));
  erDiagramState.visibleRelationships = relationships.filter(rel => {
    if (!visibleNodeIds.has(rel.from) || !visibleNodeIds.has(rel.to)) return false;
    const fromCol = erDiagramModel.nodes.find(n => n.id === rel.from)?.column;
    const toCol = erDiagramModel.nodes.find(n => n.id === rel.to)?.column;
    const pairKey = getLanePairKey(fromCol, toCol);
    if (!pairKey || !erDiagramState.lanePairs[pairKey]) return false;
    if (erDiagramState.selectedEntityId) {
      return rel.from === erDiagramState.selectedEntityId || rel.to === erDiagramState.selectedEntityId;
    }
    return true;
  });
  drawCustomObjectERLines();
  applyERInteractions();
  updateERFocusStyles();
}

function toggleERLayer(layer, value) {
  erDiagramState.layers[layer] = value;
  renderERDiagram();
}

function toggleEREntitiesOnly(value) {
  erDiagramState.entitiesOnly = value;
  renderERDiagram();
}

function toggleERRelationships(value) {
  erDiagramState.showRelationships = value;
  drawCustomObjectERLines();
  updateERFocusStyles();
}

function toggleERAttributes(value) {
  erDiagramState.showAttributes = value;
  renderERDiagram();
}

function handleERKeydown(event) {
  if (event.key !== 'Escape') return;
  if (erDiagramState.selectedEntityId) {
    erDiagramState.selectedEntityId = null;
    renderERDiagram();
  }
}

function toggleERNodeMode(nodeId) {
  const node = erDiagramModel?.nodes?.find(n => n.id === nodeId);
  const current = getFieldMode(nodeId, node?.column);
  const next = current === 'basic' ? 'standard' : current === 'standard' ? 'full' : 'basic';
  erDiagramState.nodeModes[nodeId] = next;
  renderERDiagram();
}

function toggleExportMenu() {
  const menu = document.getElementById('er-export-dropdown');
  if (!menu) return;
  menu.classList.toggle('hidden');
}

function handleExportMenuClick(event) {
  const menu = document.getElementById('er-export-dropdown');
  const panel = document.getElementById('er-export-panel');
  if (!menu || !panel) return;
  const menuRoot = event.target.closest('.er-export-menu');
  const panelRoot = event.target.closest('.er-export-panel');
  if (!menuRoot && !panelRoot) {
    menu.classList.add('hidden');
  }
}

function toggleERFullscreen() {
  const modal = document.getElementById('custom-objects-er-modal');
  if (!modal) return;
  const isFullscreen = document.fullscreenElement === modal;
  if (isFullscreen) {
    document.exitFullscreen();
  } else {
    modal.requestFullscreen().catch(() => {
      showToast('Full screen not available', 'error');
    });
  }
}

function handleERFullscreenChange() {
  const modal = document.getElementById('custom-objects-er-modal');
  const btn = document.getElementById('er-fullscreen-btn');
  if (!modal || !btn) return;
  const isFullscreen = document.fullscreenElement === modal;
  modal.classList.toggle('is-fullscreen', isFullscreen);
  btn.textContent = isFullscreen ? 'Exit full screen' : 'Full screen';
}

function openExportPanel(format) {
  const menu = document.getElementById('er-export-dropdown');
  if (menu) menu.classList.add('hidden');
  erDiagramState.exportOptions.format = format || 'png';
  const panel = document.getElementById('er-export-panel');
  if (!panel) return;
  panel.classList.remove('hidden');
  hydrateExportPanel();
}

function closeExportPanel() {
  const panel = document.getElementById('er-export-panel');
  if (panel) panel.classList.add('hidden');
}

function hydrateExportPanel() {
  const opts = erDiagramState.exportOptions || {};
  const scope = document.getElementById('er-export-scope');
  const attributes = document.getElementById('er-export-attributes');
  const resolution = document.getElementById('er-export-resolution');
  const pageSize = document.getElementById('er-export-page-size');
  const orientation = document.getElementById('er-export-orientation');
  if (scope) scope.value = opts.scope || 'visible';
  if (attributes) attributes.value = opts.attributes || 'show';
  if (resolution) resolution.value = String(opts.resolution || 2);
  if (pageSize) pageSize.value = opts.pageSize || 'letter';
  if (orientation) orientation.value = opts.orientation || 'landscape';
  updateExportPanelVisibility();
  const label = document.getElementById('er-export-format-label');
  if (label) label.textContent = `Format: ${String(opts.format || 'png').toUpperCase()}`;
}

function updateExportPanelVisibility() {
  const format = erDiagramState.exportOptions.format || 'png';
  const resolutionRow = document.getElementById('er-export-resolution-row');
  const pageSizeRow = document.getElementById('er-export-page-size-row');
  const orientationRow = document.getElementById('er-export-orientation-row');
  const showResolution = ['png', 'jpeg', 'pdf'].includes(format);
  const showPage = ['print', 'pdf'].includes(format);
  if (resolutionRow) resolutionRow.style.display = showResolution ? 'block' : 'none';
  if (pageSizeRow) pageSizeRow.style.display = showPage ? 'block' : 'none';
  if (orientationRow) orientationRow.style.display = showPage ? 'block' : 'none';
}

async function runERExport() {
  const scope = document.getElementById('er-export-scope')?.value || 'visible';
  const attributes = document.getElementById('er-export-attributes')?.value || 'show';
  const resolution = parseInt(document.getElementById('er-export-resolution')?.value || '2', 10);
  const pageSize = document.getElementById('er-export-page-size')?.value || 'letter';
  const orientation = document.getElementById('er-export-orientation')?.value || 'landscape';
  erDiagramState.exportOptions = {
    ...(erDiagramState.exportOptions || {}),
    scope,
    attributes,
    resolution,
    pageSize,
    orientation
  };
  closeExportPanel();
  await performERExport(erDiagramState.exportOptions);
}

async function performERExport(options) {
  const diagram = document.getElementById('er-diagram');
  if (!diagram) {
    showToast('ER diagram not available', 'error');
    return;
  }
  if (typeof html2canvas !== 'function' && options.format !== 'svg') {
    showToast('Export library not loaded', 'error');
    return;
  }
  const prevState = JSON.parse(JSON.stringify({
    layers: erDiagramState.layers,
    entitiesOnly: erDiagramState.entitiesOnly,
    showRelationships: erDiagramState.showRelationships,
    showAttributes: erDiagramState.showAttributes
  }));
  applyExportState(options);
  renderERDiagram();
  await new Promise(requestAnimationFrame);
  try {
    if (options.format === 'print') {
      await printERDiagram(options);
      return;
    }
    if (options.format === 'svg') {
      exportERDiagramSvg(diagram);
      return;
    }
    const canvas = await html2canvas(diagram, {
      backgroundColor: '#ffffff',
      scale: Math.max(1, options.resolution || 2),
      useCORS: true
    });
    if (options.format === 'pdf') {
      exportERDiagramPdf(canvas, options);
      return;
    }
    exportERDiagramImage(canvas, options.format);
  } catch (error) {
    showToast('Failed to export ER diagram', 'error');
  } finally {
    erDiagramState.layers = prevState.layers;
    erDiagramState.entitiesOnly = prevState.entitiesOnly;
    erDiagramState.showRelationships = prevState.showRelationships;
    erDiagramState.showAttributes = prevState.showAttributes;
    renderERDiagram();
  }
}

function applyExportState(options) {
  if (options.scope === 'all') {
    erDiagramState.layers = { definitions: true, memberships: true, executions: true, metrics: true };
    erDiagramState.entitiesOnly = false;
    erDiagramState.showRelationships = true;
  }
  if (options.scope === 'entities') {
    erDiagramState.entitiesOnly = true;
    erDiagramState.showRelationships = false;
  }
  if (options.scope === 'visible') {
    erDiagramState.entitiesOnly = erDiagramState.entitiesOnly;
  }
  erDiagramState.showAttributes = options.attributes === 'show';
  if (options.scope !== 'entities' && erDiagramState.showRelationships === false) {
    erDiagramState.showRelationships = true;
  }
}

function exportERDiagramImage(canvas, format) {
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataUrl = canvas.toDataURL(mime, 0.92);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `er-diagram.${format === 'jpeg' ? 'jpg' : 'png'}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function exportERDiagramPdf(canvas, options) {
  const jspdf = window.jspdf;
  if (!jspdf || !jspdf.jsPDF) {
    showToast('PDF library not loaded', 'error');
    return;
  }
  const format = options.pageSize || 'letter';
  const orientation = options.orientation || 'landscape';
  const pdf = new jspdf.jsPDF({
    orientation,
    unit: 'pt',
    format
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;
  const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
  const imgWidth = canvas.width * scale;
  const imgHeight = canvas.height * scale;
  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
  pdf.save('er-diagram.pdf');
}

function exportERDiagramSvg(diagram) {
  const width = diagram.scrollWidth;
  const height = diagram.scrollHeight;
  const clone = diagram.cloneNode(true);
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.overflow = 'visible';
  const wrapper = document.createElement('div');
  wrapper.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  wrapper.style.width = `${width}px`;
  wrapper.style.height = `${height}px`;
  wrapper.style.background = '#ffffff';
  wrapper.appendChild(clone);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">${wrapper.outerHTML}</foreignObject>
    </svg>
  `.trim();
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'er-diagram.svg';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function printERDiagram(options) {
  const diagram = document.getElementById('er-diagram');
  if (!diagram) return;
  const width = diagram.scrollWidth;
  const height = diagram.scrollHeight;
  const clone = diagram.cloneNode(true);
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.overflow = 'visible';
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  const orientation = options.orientation || 'landscape';
  const pageSize = options.pageSize || 'letter';
  printWindow.document.write(`
    <html>
      <head>
        <title>ER Diagram</title>
        <link rel="stylesheet" href="/style.css">
        <style>
          @page { size: ${pageSize} ${orientation}; margin: 12mm; }
          body { margin: 0; background: #ffffff; }
          .er-diagram { overflow: visible !important; }
          .er-svg { position: absolute; }
        </style>
      </head>
      <body>${clone.outerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.print();
  };
}

// Render Custom Object Form
function renderCustomObjectForm(object = null) {
  const isEdit = !!object;
  const content = document.getElementById('content');
  
  const fieldsHtml = (object?.fields || [{ name: '', label: '', type: 'text' }]).map((field, index) => `
    <div class="field-row" data-index="${index}">
      <input type="text" class="form-input field-name" placeholder="Field Name" value="${field.name}" ${isEdit ? 'readonly' : ''}>
      <input type="text" class="form-input field-label" placeholder="Field Label" value="${field.label}">
      <select class="form-input field-type">
        <option value="text" ${field.type === 'text' ? 'selected' : ''}>Text</option>
        <option value="number" ${field.type === 'number' ? 'selected' : ''}>Number</option>
        <option value="date" ${field.type === 'date' ? 'selected' : ''}>Date</option>
        <option value="datetime" ${field.type === 'datetime' ? 'selected' : ''}>Date &amp; time</option>
        <option value="select" ${field.type === 'select' ? 'selected' : ''}>Select</option>
        <option value="boolean" ${field.type === 'boolean' ? 'selected' : ''}>Boolean</option>
      </select>
      <div class="field-flag">
        <input type="checkbox" class="field-primary" ${field.is_primary ? 'checked' : ''} onchange="enforcePrimaryKey(this)"> Primary
      </div>
      <div class="field-flag">
        <input type="checkbox" class="field-required" ${field.is_required ? 'checked' : ''}> Required
      </div>
      <button type="button" class="btn btn-sm btn-danger" onclick="removeField(${index})">${ICONS.x}</button>
    </div>
  `).join('');

  const relationshipsHtml = (object?.relationships || []).map((rel, index) => `
    <div class="relation-row" data-index="${index}" data-table="${rel.to_table || ''}" data-field="${rel.to_field || ''}">
      <input type="text" class="form-input relation-name" placeholder="Relationship name" value="${rel.name || ''}">
      <select class="form-input relation-table" onchange="updateRelationFieldOptions(${index})"></select>
      <select class="form-input relation-field"></select>
      <select class="form-input relation-type">
        <option value="1:1" ${rel.type === '1:1' ? 'selected' : ''}>1:1</option>
        <option value="1:N" ${rel.type === '1:N' ? 'selected' : ''}>1:N</option>
        <option value="N:1" ${rel.type === 'N:1' ? 'selected' : ''}>N:1</option>
        <option value="N:N" ${rel.type === 'N:N' ? 'selected' : ''}>N:N</option>
      </select>
      <button type="button" class="btn btn-sm btn-danger" onclick="removeRelationship(${index})">${ICONS.x}</button>
    </div>
  `).join('');
  
  content.innerHTML = `
    <div class="form-container">
      <form id="custom-object-form" onsubmit="handleCustomObjectSubmit(event)">
        <div class="form-section">
          <h3 class="form-section-title">Object Details</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label form-label-required">Object Name</label>
              <input type="text" id="object-name" class="form-input" value="${object?.name || ''}" 
                     placeholder="e.g., purchases" pattern="[a-z][a-z0-9_]*" ${isEdit ? 'readonly' : ''} required>
              <div class="form-help">Lowercase, alphanumeric and underscores only. Cannot be changed after creation.</div>
            </div>
            <div class="form-group">
              <label class="form-label form-label-required">Display Label</label>
              <input type="text" id="object-label" class="form-input" value="${object?.label || ''}" 
                     placeholder="e.g., Purchases" required>
              <div class="form-help">Human-readable name for this object</div>
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Description</label>
              <textarea id="object-description" class="form-input" rows="2" 
                        placeholder="Describe what this object represents...">${object?.description || ''}</textarea>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <h3 class="form-section-title">Fields</h3>
          <div class="field-row field-row-header">
            <div class="field-col-title">Field Name</div>
            <div class="field-col-title">Label</div>
            <div class="field-col-title">Type</div>
            <div class="field-col-title">Primary</div>
            <div class="field-col-title">Required</div>
            <div class="field-col-title">Actions</div>
          </div>
          <div id="fields-container" class="fields-container">
            ${fieldsHtml}
          </div>
          <button type="button" class="btn btn-secondary" onclick="addField()">+ Add Field</button>
        </div>

        <div class="form-section">
          <h3 class="form-section-title">Relationships</h3>
          <div class="form-help" style="margin-bottom: 0.5rem;">N:N relationships automatically create a junction table.</div>
          <div class="relation-row relation-row-header">
            <div class="field-col-title">Name</div>
            <div class="field-col-title">Table</div>
            <div class="field-col-title">Field</div>
            <div class="field-col-title">Cardinality</div>
            <div class="field-col-title">Actions</div>
          </div>
          <div id="relationships-container" class="relationships-container">
            ${relationshipsHtml || ''}
          </div>
          <button type="button" class="btn btn-secondary" onclick="addRelationship()">+ Add Relationship</button>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="navigateTo('custom-objects', 'list')">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Object</button>
        </div>
      </form>
    </div>
  `;

  initRelationshipMeta();
}

// Add field to custom object form
function addField() {
  const container = document.getElementById('fields-container');
  const index = container.children.length;
  
  const fieldRow = document.createElement('div');
  fieldRow.className = 'field-row';
  fieldRow.dataset.index = index;
  fieldRow.innerHTML = `
    <input type="text" class="form-input field-name" placeholder="Field Name (e.g., email)">
    <input type="text" class="form-input field-label" placeholder="Field Label (e.g., Email Address)">
    <select class="form-input field-type">
      <option value="text">Text</option>
      <option value="number">Number</option>
      <option value="date">Date</option>
      <option value="select">Select</option>
      <option value="boolean">Boolean</option>
    </select>
    <label class="field-flag">
      <input type="checkbox" class="field-primary" onchange="enforcePrimaryKey(this)"> Primary
    </label>
    <label class="field-flag">
      <input type="checkbox" class="field-required"> Required
    </label>
    <button type="button" class="btn btn-sm btn-danger" onclick="removeField(${index})">${ICONS.x}</button>
  `;
  
  container.appendChild(fieldRow);
}

function enforcePrimaryKey(currentCheckbox = null) {
  const checkboxes = document.querySelectorAll('.field-primary');
  checkboxes.forEach(checkbox => {
    if (currentCheckbox && checkbox !== currentCheckbox) {
      checkbox.checked = false;
    }
  });
}

// Remove field from custom object form
function removeField(index) {
  const fieldRow = document.querySelector(`.field-row[data-index="${index}"]`);
  if (fieldRow) {
    fieldRow.remove();
  }
}

let relationshipMeta = null;

async function initRelationshipMeta() {
  try {
    const response = await fetch(`${API_BASE}/custom-objects/relationship-meta`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load relationship meta');
    relationshipMeta = data.tables || [];
    hydrateRelationshipRows();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function hydrateRelationshipRows() {
  const rows = document.querySelectorAll('.relation-row');
  rows.forEach((row, index) => {
    const tableSelect = row.querySelector('.relation-table');
    const fieldSelect = row.querySelector('.relation-field');
    const currentTable = row.dataset.table || '';
    const currentField = row.dataset.field || '';
    if (!tableSelect || !fieldSelect) return;
    tableSelect.innerHTML = relationshipMeta.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
    if (currentTable) tableSelect.value = currentTable;
    updateRelationFieldOptions(index, currentField);
  });
}

function addRelationship() {
  const container = document.getElementById('relationships-container');
  const index = container.children.length;
  const row = document.createElement('div');
  row.className = 'relation-row';
  row.dataset.index = index;
  row.innerHTML = `
    <input type="text" class="form-input relation-name" placeholder="Relationship name">
    <select class="form-input relation-table" onchange="updateRelationFieldOptions(${index})"></select>
    <select class="form-input relation-field"></select>
    <select class="form-input relation-type">
      <option value="1:1">1:1</option>
      <option value="1:N">1:N</option>
      <option value="N:1">N:1</option>
      <option value="N:N">N:N</option>
    </select>
    <button type="button" class="btn btn-sm btn-danger" onclick="removeRelationship(${index})">${ICONS.x}</button>
  `;
  container.appendChild(row);
  if (relationshipMeta) {
    const tableSelect = row.querySelector('.relation-table');
    tableSelect.innerHTML = relationshipMeta.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
    updateRelationFieldOptions(index);
  }
}

function removeRelationship(index) {
  const row = document.querySelector(`.relation-row[data-index="${index}"]`);
  if (row) row.remove();
}

function updateRelationFieldOptions(index, selectedField = '') {
  const row = document.querySelector(`.relation-row[data-index="${index}"]`);
  if (!row || !relationshipMeta) return;
  const tableSelect = row.querySelector('.relation-table');
  const fieldSelect = row.querySelector('.relation-field');
  if (!tableSelect || !fieldSelect) return;
  const tableName = tableSelect.value;
  const table = relationshipMeta.find(t => t.name === tableName);
  const fields = table ? table.fields : [];
  fieldSelect.innerHTML = fields.map(f => `<option value="${f}">${f}</option>`).join('');
  if (selectedField) fieldSelect.value = selectedField;
}

// Handle Custom Object Form Submit
async function handleCustomObjectSubmit(event) {
  event.preventDefault();
  
  const name = document.getElementById('object-name').value.trim();
  const label = document.getElementById('object-label').value.trim();
  const description = document.getElementById('object-description').value.trim();
  
  // Get all fields
  const fieldRows = document.querySelectorAll('.field-row');
  const fields = [];
  let primaryCount = 0;
  
  fieldRows.forEach(row => {
    const fieldName = row.querySelector('.field-name')?.value.trim();
    const fieldLabel = row.querySelector('.field-label')?.value.trim();
    const fieldType = row.querySelector('.field-type')?.value;
    const isPrimary = row.querySelector('.field-primary')?.checked || false;
    const isRequired = row.querySelector('.field-required')?.checked || false;
    
    if (fieldName && fieldLabel) {
      fields.push({ name: fieldName, label: fieldLabel, type: fieldType, is_primary: isPrimary, is_required: isRequired });
      if (isPrimary) primaryCount += 1;
    }
  });
  
  if (fields.length === 0) {
    showToast('Please add at least one field', 'error');
    return;
  }
  
  if (primaryCount > 1) {
    showToast('Only one field can be marked as primary key', 'error');
    return;
  }
  
  const relationshipRows = document.querySelectorAll('.relation-row');
  const relationships = [];
  relationshipRows.forEach(row => {
    const nameInput = row.querySelector('.relation-name')?.value.trim();
    const table = row.querySelector('.relation-table')?.value;
    const field = row.querySelector('.relation-field')?.value;
    const type = row.querySelector('.relation-type')?.value;
    if (table && field) {
      relationships.push({ name: nameInput || `${name || 'object'}_${table}`, to_table: table, to_field: field, type });
    }
  });
  
  const objectData = { name, label, description, fields, relationships };
  
  const isEdit = currentRoute.id !== null;
  const url = isEdit ? `${API_BASE}/custom-objects/${currentRoute.id}` : `${API_BASE}/custom-objects`;
  const method = isEdit ? 'PUT' : 'POST';
  
  showLoading();
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(objectData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save object');
    }
    
    hideLoading();
    showToast(`Custom object ${isEdit ? 'updated' : 'created'} successfully`, 'success');
    navigateTo('custom-objects', 'list');
  } catch (error) {
    hideLoading();
    showToast(error.message, 'error');
  }
}

// View object data
function viewObjectData(objectId) {
  window.location.href = `/object-data.html?objectId=${objectId}`;
}

// Delete custom object
async function deleteCustomObject(id) {
  showConfirmModal('Delete this custom object and all its data?', async () => {
    showLoading();
    try {
      const response = await fetch(`${API_BASE}/custom-objects/${id}`, { method: 'DELETE' });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      hideLoading();
      showToast('Custom object deleted successfully', 'success');
      loadCustomObjects();
    } catch (error) {
      hideLoading();
      showToast('Error deleting custom object', 'error');
    }
  });
}

// ============================================
// CONTACTS IMPORT/EXPORT
// ============================================

// Show import dialog
function showContactImportDialog() {
  const modalHTML = `
    <div class="modal-overlay" onclick="closeImportDialog()">
      <div class="modal" onclick="event.stopPropagation()" style="max-width: 600px;">
        <div class="modal-header">
          <h2 class="modal-title">Import Contacts</h2>
          <span class="modal-close" onclick="closeImportDialog()">&times;</span>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">CSV File</label>
            <input type="file" id="import-file-input" accept=".csv" class="form-input" />
            <p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
              Upload a CSV file with columns: email, first_name, last_name, phone, status, subscription_status
            </p>
          </div>
          <div class="form-group">
            <label class="form-label">
              <input type="checkbox" id="import-skip-duplicates" checked /> Skip duplicate emails
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeImportDialog()">Cancel</button>
          <button class="btn btn-primary" onclick="processContactImport()">Import</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close import dialog
function closeImportDialog() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) modal.remove();
}

// Process CSV import
async function processContactImport() {
  const fileInput = document.getElementById('import-file-input');
  const skipDuplicates = document.getElementById('import-skip-duplicates').checked;
  
  if (!fileInput.files || !fileInput.files[0]) {
    showToast('Please select a file', 'error');
    return;
  }
  
  const file = fileInput.files[0];
  showLoading();
  
  try {
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    
    if (lines.length < 2) {
      showToast('CSV file is empty or invalid', 'error');
      hideLoading();
      return;
    }
    
    // Parse CSV
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const contacts = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const contact = {};
      
      headers.forEach((header, index) => {
        contact[header] = values[index] || '';
      });
      
      if (contact.email) {
        contacts.push(contact);
      }
    }
    
    // Send to API
    const response = await fetch(`${API_BASE}/contacts/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts, skipDuplicates })
    });
    
    const result = await response.json();
    
    closeImportDialog();
    showToast(`Imported ${result.imported || contacts.length} contacts successfully!`, 'success');
    loadContacts();
  } catch (error) {
    showToast('Import failed: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

// Show export dialog
function showContactExportDialog() {
  const modalHTML = `
    <div class="modal-overlay" onclick="closeExportDialog()">
      <div class="modal" onclick="event.stopPropagation()" style="max-width: 500px;">
        <div class="modal-header">
          <h2 class="modal-title">Export Contacts</h2>
          <span class="modal-close" onclick="closeExportDialog()">&times;</span>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Export Format</label>
            <select id="export-format" class="form-input">
              <option value="csv">CSV (Comma-separated)</option>
              <option value="json">JSON</option>
              <option value="excel">Excel-compatible CSV</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">
              <input type="checkbox" id="export-filtered" checked /> Export only filtered results (${contactFilters.search || contactFilters.status !== 'all' ? 'current filter applied' : 'all contacts'})
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeExportDialog()">Cancel</button>
          <button class="btn btn-primary" onclick="processContactExport()">Export</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close export dialog
function closeExportDialog() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) modal.remove();
}

// Process export
async function processContactExport() {
  const format = document.getElementById('export-format').value;
  const exportFiltered = document.getElementById('export-filtered').checked;
  
  showLoading();
  
  try {
    const response = await fetch(`${API_BASE}/contacts?limit=10000`);
    const data = await response.json();
    let contacts = data.contacts;
    
    // Apply filters if needed
    if (exportFiltered) {
      contacts = contacts.filter(contact => {
        if (contactFilters.status !== 'all' && contact.status !== contactFilters.status) return false;
        if (contactFilters.subscription !== 'all' && contact.subscription_status !== contactFilters.subscription) return false;
        if (contactFilters.loyalty !== 'all' && contact.loyalty_tier !== contactFilters.loyalty) return false;
        if (contactFilters.search) {
          const searchTerm = contactFilters.search.toLowerCase();
          const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
          const email = (contact.email || '').toLowerCase();
          if (!fullName.includes(searchTerm) && !email.includes(searchTerm)) return false;
        }
        return true;
      });
    }
    
    let fileContent, filename, mimeType;
    
    if (format === 'json') {
      fileContent = JSON.stringify(contacts, null, 2);
      filename = 'contacts.json';
      mimeType = 'application/json';
    } else {
      // CSV format
      const headers = ['email', 'first_name', 'last_name', 'phone', 'status', 'subscription_status', 'loyalty_tier', 'engagement_score', 'created_at'];
      const rows = [headers.join(',')];
      
      contacts.forEach(c => {
        const row = headers.map(h => {
          let val = c[h] || '';
          if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
            val = `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        });
        rows.push(row.join(','));
      });
      
      fileContent = rows.join('\n');
      filename = 'contacts.csv';
      mimeType = 'text/csv';
    }
    
    // Download file
    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    closeExportDialog();
    showToast(`Exported ${contacts.length} contacts successfully!`, 'success');
  } catch (error) {
    showToast('Export failed: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

// Legacy alias for backward compatibility
function renderCampaignsDrillDown(data, period) {
  return renderWorkflowsDrillDown(data, period);
}

// Audience Form Rendering
function renderAudienceForm(audience = null) {
  const isEdit = !!audience;
  const content = document.getElementById('content');
  const includeContacts = (audience?.include_contacts || []).join(', ');
  const excludeContacts = (audience?.exclude_contacts || []).join(', ');
  
  content.innerHTML = `
    <div class="form-container">
      <form id="audience-form" onsubmit="handleAudienceSubmit(event)">
        <div class="form-section">
          <h3 class="form-section-title">${ICONS.usersRound} Basic Information</h3>
          
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label form-label-required" for="audience-name">Name</label>
              <input type="text" id="audience-name" class="form-input" required
                     value="${audience?.name || ''}"
                     placeholder="e.g., Black Friday Shoppers">
            </div>
            
            <div class="form-group">
              <label class="form-label form-label-required" for="audience-type">Type</label>
              <select id="audience-type" class="form-input" required onchange="updateAudienceTypeUI()">
                <option value="static" ${audience?.audience_type === 'static' ? 'selected' : ''}>Segment-based (Static)</option>
                <option value="dynamic" ${audience?.audience_type === 'dynamic' ? 'selected' : ''}>Segment-based (Dynamic)</option>
                <option value="combined" ${audience?.audience_type === 'combined' ? 'selected' : ''}>Combined</option>
              </select>
              <small class="form-help">Combined audiences let you include and exclude multiple segments.</small>
            </div>
            
            <div class="form-group">
              <label class="form-label" for="audience-status">Status</label>
              <select id="audience-status" class="form-input" required>
                <option value="draft" ${audience?.status === 'draft' || !audience ? 'selected' : ''}>Draft</option>
                <option value="active" ${audience?.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="archived" ${audience?.status === 'archived' ? 'selected' : ''}>Archived</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="audience-description">Description</label>
            <textarea id="audience-description" class="form-input" rows="3"
                      placeholder="Describe the purpose of this audience...">${audience?.description || ''}</textarea>
          </div>
        </div>
        
        <div class="form-section" id="audience-segment-based-section">
          <h3 class="form-section-title">${ICONS.target} Targeting</h3>
          
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="audience-segment">Based on Segment</label>
              <select id="audience-segment" class="form-input">
                <option value="">Select a segment...</option>
              </select>
              <small class="form-help">Optional: base this audience on an existing segment.</small>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="audience-filters">Custom Filters (JSON)</label>
            <textarea id="audience-filters" class="form-input" rows="5"
                      placeholder='{"status": "active", "engagement_score": {"$gte": 50}}'>${audience?.filters ? JSON.stringify(audience.filters, null, 2) : ''}</textarea>
            <small class="form-help">Define additional filter conditions in JSON format.</small>
          </div>
        </div>
        
        <div class="form-section" id="audience-combined-section">
          <h3 class="form-section-title">${ICONS.puzzle} Combined Sources</h3>
          
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Include Segments</label>
              <div class="segment-picker-advanced">
                <div class="segment-chip-list" id="audience-include-segment-chips"></div>
                <div class="segment-typeahead">
                  <input type="text" id="audience-include-segment-input" class="form-input" placeholder="Search segments..." oninput="updateSegmentDropdown('include')" onfocus="openSegmentDropdown('include')">
                  <div class="segment-dropdown" id="audience-include-segment-dropdown"></div>
                </div>
                <input type="hidden" id="audience-include-segment-ids" value="">
              </div>
              <small class="form-help">People in any of these segments will be included.</small>
            </div>
            
            <div class="form-group">
              <label class="form-label">Exclude Segments</label>
              <div class="segment-picker-advanced">
                <div class="segment-chip-list" id="audience-exclude-segment-chips"></div>
                <div class="segment-typeahead">
                  <input type="text" id="audience-exclude-segment-input" class="form-input" placeholder="Search segments..." oninput="updateSegmentDropdown('exclude')" onfocus="openSegmentDropdown('exclude')">
                  <div class="segment-dropdown" id="audience-exclude-segment-dropdown"></div>
                </div>
                <input type="hidden" id="audience-exclude-segment-ids" value="">
              </div>
              <small class="form-help">People in these segments will be removed.</small>
            </div>
          </div>
          
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="audience-include-contacts">Include Contact IDs</label>
              <input type="text" id="audience-include-contacts" class="form-input"
                     value="${includeContacts}"
                     placeholder="e.g., 12, 24, 56">
              <small class="form-help">Optional: comma-separated contact IDs.</small>
            </div>
            
            <div class="form-group">
              <label class="form-label" for="audience-exclude-contacts">Exclude Contact IDs</label>
              <input type="text" id="audience-exclude-contacts" class="form-input"
                     value="${excludeContacts}"
                     placeholder="e.g., 78, 90">
              <small class="form-help">Optional: remove specific contact IDs.</small>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <h3 class="form-section-title">${ICONS.barChart} Size</h3>
          
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label" for="audience-estimated-size">Estimated Size</label>
              <div class="form-inline">
                <input type="number" id="audience-estimated-size" class="form-input"
                       value="${audience?.estimated_size || 0}"
                       placeholder="0">
                <button type="button" class="btn btn-secondary" onclick="refreshAudienceEstimate()">Calculate</button>
              </div>
              <small class="form-help">Approximate number of contacts.</small>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="navigateTo('audiences', 'list')">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? `${ICONS.save} Update` : `${ICONS.sparkles} Create`} Audience</button>
        </div>
      </form>
    </div>
  `;
  
  // Load segments for dropdowns
  loadSegmentsForAudience(audience?.segment_id, audience?.include_segments || [], audience?.exclude_segments || []);
  updateAudienceTypeUI();

  // Close pickers on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.segment-picker-advanced')) {
      closeSegmentDropdowns();
    }
  });
}

// Load segments for audience form dropdown
let audienceSegmentOptions = [];
let audienceCombinedState = { include: new Set(), exclude: new Set() };

async function loadSegmentsForAudience(selectedId = null, includeIds = [], excludeIds = []) {
  try {
    const response = await fetch(`${API_BASE}/segments`);
    const data = await response.json();
    const segmentSelect = document.getElementById('audience-segment');
    
    // Handle both wrapped and unwrapped responses
    const segments = data.segments || data;
    
    if (Array.isArray(segments)) {
      audienceSegmentOptions = segments;
      if (segmentSelect) {
        segments.forEach(seg => {
          const option = document.createElement('option');
          option.value = seg.id;
          option.textContent = seg.name;
          if (seg.id === selectedId) option.selected = true;
          segmentSelect.appendChild(option);
        });
      }
      initSegmentPickers(includeIds, excludeIds);
    } else {
      console.error('Expected segments array, got:', data);
    }
  } catch (error) {
    console.error('Error loading segments:', error);
  }
}

function updateAudienceTypeUI() {
  const type = document.getElementById('audience-type')?.value;
  const segmentBased = document.getElementById('audience-segment-based-section');
  const combined = document.getElementById('audience-combined-section');
  if (!segmentBased || !combined) return;
  const isCombined = type === 'combined';
  segmentBased.style.display = isCombined ? 'none' : 'block';
  combined.style.display = isCombined ? 'block' : 'none';
}

function initSegmentPickers(includeIds = [], excludeIds = []) {
  audienceCombinedState = {
    include: new Set((includeIds || []).map(id => parseInt(id))),
    exclude: new Set((excludeIds || []).map(id => parseInt(id)))
  };
  renderSegmentPicker('include');
  renderSegmentPicker('exclude');
  updateSegmentHiddenInputs();
}

function renderSegmentPicker(type) {
  renderSegmentChips(type);
  updateSegmentDropdown(type);
}

function renderSegmentChips(type) {
  const container = document.getElementById(`audience-${type}-segment-chips`);
  if (!container) return;
  const selected = audienceCombinedState[type];
  const chips = Array.from(selected).map(id => {
    const seg = audienceSegmentOptions.find(s => s.id === id);
    const name = seg ? seg.name : `Segment ${id}`;
    return `
      <span class="segment-chip">
        ${name}
        <button type="button" class="segment-chip-remove" onclick="removeSegmentChip('${type}', ${id})">${ICONS.x}</button>
      </span>
    `;
  }).join('');
  container.innerHTML = chips || '<span class="segment-chip-placeholder">No segments selected</span>';
}

function openSegmentDropdown(type) {
  closeSegmentDropdowns();
  const dropdown = document.getElementById(`audience-${type}-segment-dropdown`);
  if (dropdown) dropdown.classList.add('show');
}

function closeSegmentDropdowns() {
  document.querySelectorAll('.segment-dropdown').forEach(menu => menu.classList.remove('show'));
}

function updateSegmentDropdown(type) {
  const input = document.getElementById(`audience-${type}-segment-input`);
  const dropdown = document.getElementById(`audience-${type}-segment-dropdown`);
  if (!input || !dropdown) return;
  const term = input.value.trim().toLowerCase();
  const selected = audienceCombinedState[type];
  const list = audienceSegmentOptions
    .filter(seg => seg.name.toLowerCase().includes(term))
    .slice(0, 50)
    .map(seg => {
      const isSelected = selected.has(seg.id);
      return `
        <button type="button" class="segment-option ${isSelected ? 'selected' : ''}"
                onclick="toggleSegmentSelection('${type}', ${seg.id})">
          ${seg.name}
        </button>
      `;
    }).join('');
  dropdown.innerHTML = list || '<div class="segment-option-empty">No matches</div>';
}

function toggleSegmentSelection(type, id) {
  const otherType = type === 'include' ? 'exclude' : 'include';
  if (audienceCombinedState[otherType].has(id)) {
    audienceCombinedState[otherType].delete(id);
  }
  if (audienceCombinedState[type].has(id)) {
    audienceCombinedState[type].delete(id);
  } else {
    audienceCombinedState[type].add(id);
  }
  renderSegmentPicker(type);
  renderSegmentPicker(otherType);
  updateSegmentHiddenInputs();
  const input = document.getElementById(`audience-${type}-segment-input`);
  if (input) input.focus();
}

function removeSegmentChip(type, id) {
  if (audienceCombinedState[type].has(id)) {
    audienceCombinedState[type].delete(id);
    renderSegmentPicker(type);
    updateSegmentHiddenInputs();
  }
}

function updateSegmentHiddenInputs() {
  const includeInput = document.getElementById('audience-include-segment-ids');
  const excludeInput = document.getElementById('audience-exclude-segment-ids');
  if (includeInput) includeInput.value = Array.from(audienceCombinedState.include).join(',');
  if (excludeInput) excludeInput.value = Array.from(audienceCombinedState.exclude).join(',');
  if (document.getElementById('audience-estimated-size')) {
    debounce('audienceEstimate', () => refreshAudienceEstimate(true), 500);
  }
}

function parseIdList(value) {
  return (value || '')
    .split(',')
    .map(v => parseInt(v.trim()))
    .filter(v => !Number.isNaN(v));
}

async function refreshAudienceEstimate(silent = false) {
  const type = document.getElementById('audience-type')?.value;
  const estimatedInput = document.getElementById('audience-estimated-size');
  if (!type || !estimatedInput) return;
  
  let payload = {};
  if (type === 'combined') {
    payload = {
      include_segments: parseIdList(document.getElementById('audience-include-segment-ids')?.value || ''),
      exclude_segments: parseIdList(document.getElementById('audience-exclude-segment-ids')?.value || ''),
      include_contacts: parseIdList(document.getElementById('audience-include-contacts')?.value || ''),
      exclude_contacts: parseIdList(document.getElementById('audience-exclude-contacts')?.value || '')
    };
  } else {
    payload = {
      segment_id: document.getElementById('audience-segment')?.value || null
    };
    try {
      const filtersText = document.getElementById('audience-filters')?.value?.trim() || '';
      if (filtersText) payload.filters = JSON.parse(filtersText);
    } catch (error) {
      if (!silent) showToast('Invalid JSON in filters field', 'error');
      return;
    }
  }
  
  try {
    const response = await fetch(`${API_BASE}/audiences/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to calculate');
    estimatedInput.value = data.count || 0;
    if (!silent) showToast('Estimated size updated', 'success');
  } catch (error) {
    if (!silent) showToast(error.message, 'error');
  }
}

// Handle audience form submission
async function handleAudienceSubmit(event) {
  event.preventDefault();
  
  const type = document.getElementById('audience-type').value;
  let filters = {};
  if (type !== 'combined') {
    try {
      const filtersText = document.getElementById('audience-filters').value.trim();
      if (filtersText) {
        filters = JSON.parse(filtersText);
      }
    } catch (error) {
      showToast('Invalid JSON in filters field', 'error');
      return;
    }
  }
  const includeSegmentsInput = document.getElementById('audience-include-segment-ids');
  const excludeSegmentsInput = document.getElementById('audience-exclude-segment-ids');
  const includeContactsText = document.getElementById('audience-include-contacts')?.value || '';
  const excludeContactsText = document.getElementById('audience-exclude-contacts')?.value || '';
  const includeSegments = parseIdList(includeSegmentsInput?.value || '');
  const excludeSegments = parseIdList(excludeSegmentsInput?.value || '');
  const includeContacts = includeContactsText.split(',').map(v => parseInt(v.trim())).filter(v => !Number.isNaN(v));
  const excludeContacts = excludeContactsText.split(',').map(v => parseInt(v.trim())).filter(v => !Number.isNaN(v));
  const segmentId = type === 'combined' ? null : (document.getElementById('audience-segment').value || null);
  
  const audienceData = {
    name: document.getElementById('audience-name').value,
    description: document.getElementById('audience-description').value,
    audience_type: type,
    segment_id: segmentId,
    filters: type === 'combined' ? {} : filters,
    include_segments: type === 'combined' ? includeSegments : [],
    exclude_segments: type === 'combined' ? excludeSegments : [],
    include_contacts: type === 'combined' ? includeContacts : [],
    exclude_contacts: type === 'combined' ? excludeContacts : [],
    estimated_size: parseInt(document.getElementById('audience-estimated-size').value) || 0,
    status: document.getElementById('audience-status').value
  };
  
  const isEdit = currentRoute.id !== null;
  const url = isEdit ? `${API_BASE}/audiences/${currentRoute.id}` : `${API_BASE}/audiences`;
  const method = isEdit ? 'PUT' : 'POST';
  
  showLoading();
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(audienceData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save audience');
    }
    
    hideLoading();
    showToast(`Audience ${isEdit ? 'updated' : 'created'} successfully`, 'success');
    navigateTo('audiences', 'list');
  } catch (error) {
    hideLoading();
    showToast(`Error ${isEdit ? 'updating' : 'creating'} audience: ${error.message}`, 'error');
  }
}

// Query Service
let queryServiceTables = [];
let queryAggregateState = [];

async function loadQueryService() {
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/query/tables`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load tables');
    queryServiceTables = data.tables || [];
    
    const tableOptions = queryServiceTables.map(t => `<option value="${t.name}">${t.name} (${t.count})</option>`).join('');
    
    const content = `
      <div class="form-container">
        <div class="form-section">
          <h3 class="form-section-title">${ICONS.code} Query Service</h3>
          <div class="form-inline" style="margin-bottom: 1rem;">
            <button type="button" class="btn btn-secondary" id="query-mode-builder" onclick="setQueryMode('builder')">Structured</button>
            <button type="button" class="btn btn-secondary" id="query-mode-sql" onclick="setQueryMode('sql')">SQL</button>
          </div>
          
          <div id="query-builder">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Table</label>
              <select id="query-table" class="form-input" onchange="updateQueryFieldsHint()">
                ${tableOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Fields (comma-separated)</label>
              <input type="text" id="query-fields" class="form-input" placeholder="e.g., id, email, status">
            </div>
            <div class="form-group">
              <label class="form-label">Order By</label>
              <input type="text" id="query-order-by" class="form-input" placeholder="e.g., created_at">
            </div>
            <div class="form-group">
              <label class="form-label">Direction</label>
              <select id="query-order-direction" class="form-input">
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Limit</label>
              <input type="number" id="query-limit" class="form-input" value="50" min="1" max="1000">
            </div>
            <div class="form-group">
              <label class="form-label">Offset</label>
              <input type="number" id="query-offset" class="form-input" value="0" min="0">
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Filters (JSON)</label>
            <textarea id="query-filters" class="form-textarea" rows="5"
              placeholder='{"status": "active", "engagement_score": {"$gte": 80}}'></textarea>
            <small class="form-help" id="query-fields-hint">Use field names from the selected table.</small>
          </div>

          <div class="form-group">
            <label class="form-label">Aggregates</label>
            <div class="form-inline">
              <select id="query-agg-fn" class="form-input">
                <option value="count">count</option>
                <option value="sum">sum</option>
                <option value="avg">avg</option>
                <option value="min">min</option>
                <option value="max">max</option>
              </select>
              <input type="text" id="query-agg-field" class="form-input" placeholder="field (e.g., engagement_score)">
              <input type="text" id="query-agg-alias" class="form-input" placeholder="alias (optional)">
              <button type="button" class="btn btn-secondary" onclick="addAggregate()">Add</button>
            </div>
            <div id="query-agg-list" class="form-help" style="margin-top: 0.5rem;">No aggregates added.</div>
          </div>

          <div class="form-group">
            <label class="form-label">Group By (comma-separated)</label>
            <input type="text" id="query-group-by" class="form-input" placeholder="e.g., status, subscription_status">
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="runQueryService()">Run Query</button>
          </div>
          </div>
          
          <div id="query-sql" style="display:none;">
            <div class="sql-layout">
              <div class="sql-sidebar">
                <div class="sql-sidebar-title">Tables</div>
                <div class="schema-tree" id="query-table-schema"></div>
              </div>
              <div class="sql-editor">
                <label class="form-label">SQL</label>
                <textarea id="query-sql-input" class="form-textarea sql-editor-area" rows="14"
                  placeholder="SELECT contacts.id, contacts.email, audiences.name FROM contacts JOIN audiences ON contacts.id = audiences.id WHERE contacts.status = 'active' LIMIT 50"></textarea>
                <small class="form-help">Supported: SELECT, FROM, JOIN, WHERE, ORDER BY, LIMIT, OFFSET.</small>
                <div class="form-actions">
                  <button type="button" class="btn btn-secondary" onclick="runSqlQuery()">Run SQL</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <h3 class="form-section-title">Results</h3>
          <div id="query-results-summary" class="form-help">No results yet.</div>
          <div class="data-table-container" id="query-results-table"></div>
          <pre class="code-block" id="query-results-json" style="margin-top: 1rem; max-height: 300px; overflow: auto;"></pre>
        </div>
      </div>
    `;
    
    document.getElementById('content').innerHTML = content;
    queryAggregateState = [];
    renderAggregateList();
    setQueryMode('builder');
    updateQueryFieldsHint();
    renderQueryTableSchema();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function updateQueryFieldsHint() {
  const table = document.getElementById('query-table')?.value;
  const hint = document.getElementById('query-fields-hint');
  if (!table || !hint) return;
  const entry = queryServiceTables.find(t => t.name === table);
  if (!entry) return;
  const fields = (entry.fields || []).slice(0, 12).join(', ');
  hint.textContent = fields ? `Example fields: ${fields}` : 'Use field names from the selected table.';
}

function addAggregate() {
  const fn = document.getElementById('query-agg-fn')?.value;
  const field = document.getElementById('query-agg-field')?.value?.trim() || '';
  const alias = document.getElementById('query-agg-alias')?.value?.trim() || '';
  if (!fn) return;
  if (fn !== 'count' && !field) {
    showToast('Field is required for this aggregate', 'warning');
    return;
  }
  queryAggregateState.push({ fn, field: field || null, alias: alias || null });
  document.getElementById('query-agg-field').value = '';
  document.getElementById('query-agg-alias').value = '';
  renderAggregateList();
}

function removeAggregate(index) {
  queryAggregateState.splice(index, 1);
  renderAggregateList();
}

function renderAggregateList() {
  const container = document.getElementById('query-agg-list');
  if (!container) return;
  if (!queryAggregateState.length) {
    container.innerHTML = 'No aggregates added.';
    return;
  }
  container.innerHTML = queryAggregateState.map((agg, idx) => {
    const label = `${agg.fn}(${agg.field || '*'})${agg.alias ? ` as ${agg.alias}` : ''}`;
    return `<span class="filter-tag" style="margin-right: 6px;">
      <span class="filter-tag-label">${label}</span>
      <button class="filter-tag-remove" onclick="removeAggregate(${idx})">${ICONS.x}</button>
    </span>`;
  }).join('');
}

function renderQueryTableSchema() {
  const container = document.getElementById('query-table-schema');
  if (!container) return;
  const html = queryServiceTables.map(table => {
    const columns = (table.fields || []).map(col => `
      <button type="button" class="schema-tree-column" onclick="insertSqlToken('${table.name}.${col}')">${col}</button>
    `).join('');
    return `
      <div class="schema-tree-table" data-table="${table.name}">
        <button type="button" class="schema-tree-row" onclick="toggleSchemaTable('${table.name}')">
          <span class="schema-tree-caret">▸</span>
          <span class="schema-tree-name" onclick="event.stopPropagation(); insertSqlToken('${table.name}')">${table.name}</span>
          <span class="schema-tree-count">(${table.count})</span>
        </button>
        <div class="schema-tree-columns" id="schema-columns-${table.name}">
          ${columns || '<div class="schema-tree-column">No columns</div>'}
        </div>
      </div>
    `;
  }).join('');
  container.innerHTML = html || '<div class="empty-state">No tables found.</div>';
}

function toggleSchemaTable(tableName) {
  const container = document.querySelector(`[data-table="${tableName}"]`);
  if (!container) return;
  container.classList.toggle('open');
}

function insertSqlToken(token) {
  const textarea = document.getElementById('query-sql-input');
  if (!textarea) return;
  const value = textarea.value;
  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const before = value.slice(0, start);
  const after = value.slice(end);
  const insert = `${token} `;
  textarea.value = before + insert + after;
  const cursor = start + insert.length;
  textarea.setSelectionRange(cursor, cursor);
  textarea.focus();
}

function setQueryMode(mode) {
  const builder = document.getElementById('query-builder');
  const sql = document.getElementById('query-sql');
  const builderBtn = document.getElementById('query-mode-builder');
  const sqlBtn = document.getElementById('query-mode-sql');
  if (!builder || !sql || !builderBtn || !sqlBtn) return;
  const isSql = mode === 'sql';
  builder.style.display = isSql ? 'none' : 'block';
  sql.style.display = isSql ? 'block' : 'none';
  builderBtn.classList.toggle('btn-primary', !isSql);
  sqlBtn.classList.toggle('btn-primary', isSql);
  builderBtn.classList.toggle('btn-secondary', isSql);
  sqlBtn.classList.toggle('btn-secondary', !isSql);
}

async function runQueryService() {
  const table = document.getElementById('query-table').value;
  const fieldsText = document.getElementById('query-fields').value.trim();
  const orderBy = document.getElementById('query-order-by').value.trim();
  const direction = document.getElementById('query-order-direction').value;
  const limit = parseInt(document.getElementById('query-limit').value, 10) || 50;
  const offset = parseInt(document.getElementById('query-offset').value, 10) || 0;
  const groupByText = document.getElementById('query-group-by').value.trim();
  let filters = {};
  
  try {
    const filtersText = document.getElementById('query-filters').value.trim();
    if (filtersText) filters = JSON.parse(filtersText);
  } catch (error) {
    showToast('Invalid JSON in filters', 'error');
    return;
  }
  
  const payload = {
    table,
    filters,
    limit,
    offset
  };
  if (fieldsText) payload.fields = fieldsText.split(',').map(f => f.trim()).filter(Boolean);
  if (orderBy) payload.orderBy = { field: orderBy, direction };
  if (groupByText) payload.groupBy = groupByText.split(',').map(f => f.trim()).filter(Boolean);
  if (queryAggregateState.length) payload.aggregates = queryAggregateState;
  
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Query failed');
    
    renderQueryResults(data);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function runSqlQuery() {
  const sql = document.getElementById('query-sql-input')?.value?.trim();
  if (!sql) {
    showToast('Enter a SQL query', 'warning');
    return;
  }
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/query/sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'SQL query failed');
    renderQueryResults(data);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function renderQueryResults(data) {
  const summary = document.getElementById('query-results-summary');
  const tableContainer = document.getElementById('query-results-table');
  const jsonContainer = document.getElementById('query-results-json');
  
  if (!summary || !tableContainer || !jsonContainer) return;
  summary.textContent = `Returned ${data.rows.length} of ${data.total} records.`;
  jsonContainer.textContent = JSON.stringify(data, null, 2);
  
  if (!data.rows.length) {
    tableContainer.innerHTML = '<div class="empty-state">No results</div>';
    return;
  }
  
  const columns = data.columns && data.columns.length ? data.columns : Object.keys(data.rows[0]);
  const header = columns.map(c => `<th>${c}</th>`).join('');
  const body = data.rows.map(row => `
    <tr>
      ${columns.map(c => `<td>${row[c] !== undefined ? String(row[c]) : ''}</td>`).join('')}
    </tr>
  `).join('');
  
  tableContainer.innerHTML = `
    <table class="data-table">
      <thead><tr>${header}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

// ── API Documentation ────────────────────────────────────

async function loadAPIDocs() {
  showLoading();
  try {
    const res = await fetch('/openapi.json');
    const spec = await res.json();

    // Count endpoints
    let endpointCount = 0;
    Object.values(spec.paths).forEach(methods => {
      endpointCount += Object.keys(methods).length;
    });

    // Build groups HTML
    let groupsHtml = '';
    spec.tags.forEach(tag => {
      const tagEndpoints = [];
      Object.entries(spec.paths).forEach(([path, methods]) => {
        Object.entries(methods).forEach(([method, details]) => {
          if (details.tags && details.tags.includes(tag.name)) {
            tagEndpoints.push({ method: method.toUpperCase(), path: '/api' + path, summary: details.summary });
          }
        });
      });
      if (!tagEndpoints.length) return;
      let endpointsHtml = '';
      tagEndpoints.forEach(ep => {
        endpointsHtml += '<div class="api-docs-endpoint">'
          + '<span class="api-method api-method-' + ep.method.toLowerCase() + '">' + ep.method + '</span>'
          + '<span class="api-path">' + ep.path + '</span>'
          + '<span class="api-summary">' + (ep.summary || '') + '</span>'
          + '</div>';
      });
      groupsHtml += '<div class="api-docs-group">'
        + '<div class="api-docs-group-header">'
        + '<div class="api-docs-group-title">' + tag.name + '</div>'
        + '<div class="api-docs-group-desc">' + (tag.description || '') + '</div>'
        + '<span class="api-docs-group-count">' + tagEndpoints.length + '</span>'
        + '</div>'
        + '<div class="api-docs-endpoints">' + endpointsHtml + '</div>'
        + '</div>';
    });

    const content = '<div class="api-docs-container">'
      + '<div class="api-docs-header-bar">'
      + '<div>'
      + '<div class="api-docs-version">' + spec.info.title + ' <span class="badge badge-primary">v' + spec.info.version + '</span></div>'
      + '<div class="api-docs-meta">' + endpointCount + ' endpoints &middot; ' + spec.tags.length + ' resource groups &middot; OpenAPI 3.0</div>'
      + '</div>'
      + '<div class="api-docs-actions">'
      + '<a href="/openapi.json" target="_blank" class="btn btn-secondary btn-sm" download>'
      + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
      + ' Download Spec</a>'
      + '<button class="btn btn-primary btn-sm" onclick="openSwaggerUI()">'
      + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>'
      + ' Open Interactive Docs</button>'
      + '</div>'
      + '</div>'
      + '<div class="api-docs-grid">' + groupsHtml + '</div>'
      + '</div>';

    document.getElementById('content').innerHTML = content;
  } catch (error) {
    showError('Failed to load API documentation');
  } finally {
    hideLoading();
  }
}

function openSwaggerUI() {
  window.open('/api-docs.html', '_blank');
}

