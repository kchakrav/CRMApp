// ============================================
// ADOBE CAMPAIGN TABLE HELPERS
// ============================================

// Generate Adobe-style table toolbar — unified layout:
//   [filter funnel] [search input] ... [result count (calculate)] [column selector]
function createTableToolbar(options = {}) {
  const {
    resultCount = 0,
    totalCount = 0,
    showFilter = true,
    showSearch = true,
    showColumnSelector = false,
    searchPlaceholder = 'Search...',
    searchValue = '',
    columns = [],
    viewKey = '',
    filters = [],
    filterTags = [],
    onClearTag = null,
    onSearch = () => {}
  } = options;
  const columnVisibility = showColumnSelector && viewKey ? getColumnVisibilityMap(viewKey, columns) : {};
  const hasFilters = filters.length > 0;
  const activeFilterCount = filterTags.length;
  
  return `
    <div class="table-toolbar">
      <div class="table-toolbar-top">
        <div class="toolbar-left">
          ${hasFilters ? `
            <button class="toolbar-filter-btn${activeFilterCount ? ' has-active' : ''}" onclick="toggleInlineFilters()" title="Filters">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              ${activeFilterCount ? `<span class="toolbar-filter-badge">${activeFilterCount}</span>` : ''}
            </button>
          ` : ''}
          
          ${showSearch ? `
            <div class="inline-search">
              <input type="text" 
                     class="inline-search-input" 
                     placeholder="${searchPlaceholder}"
                     value="${searchValue || ''}"
                     onkeyup='${onSearch || 'handleInlineSearch(this.value)'}'>
              <span class="search-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></span>
            </div>
          ` : ''}
          
          <div class="result-counter">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.5"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>
            <strong>${resultCount}</strong>${totalCount ? ` of ${totalCount}` : ' of many'}
            ${!totalCount ? `<a href="#" class="result-counter-link" onclick="recalculateResults(); return false;">(calculate)</a>` : ''}
          </div>
        </div>
        
        ${showColumnSelector && columns.length ? `
          <div class="column-selector">
            <button class="column-selector-btn" onclick="toggleColumnSelector(event, '${viewKey}')" title="Columns"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></button>
            <div class="column-selector-dropdown" id="column-selector-${viewKey}" onclick="event.stopPropagation()">
              ${columns.map(col => `
                <label class="column-selector-item">
                  <input type="checkbox" id="column-toggle-${viewKey}-${col.id}" ${columnVisibility[col.id] !== false ? 'checked' : ''} onchange="toggleColumnVisibility('${viewKey}', '${col.id}')">
                  <span>${col.label}</span>
                </label>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
      
      ${hasFilters ? `
        <div class="table-toolbar-filters" id="inline-filters" style="display: ${activeFilterCount ? 'flex' : 'none'};">
          ${filters.map(filter => `
            <div class="inline-filter-item">
              <label class="inline-filter-label">${filter.label}</label>
              ${filter.type === 'select' ? `
                <select class="inline-filter-select" onchange='${filter.onChange}'>
                  ${filter.options.map(opt => `
                    <option value="${opt.value}" ${filter.value === opt.value ? 'selected' : ''}>
                      ${opt.label}
                    </option>
                  `).join('')}
                </select>
              ` : filter.type === 'text' ? `
                <input type="text" 
                       class="inline-filter-input" 
                       value="${filter.value || ''}"
                       placeholder="${filter.placeholder || ''}"
                       oninput='${filter.onChange}'>
              ` : ''}
            </div>
          `).join('')}
          ${onClearTag ? `<button class="btn btn-sm btn-secondary" onclick="clearAllFilters()">Clear</button>` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

function getColumnVisibilityMap(viewKey, columns = []) {
  const defaults = {};
  columns.forEach(col => {
    defaults[col.id] = col.visible !== false;
  });
  if (!viewKey) return defaults;
  try {
    const stored = localStorage.getItem(`columnVisibility:${viewKey}`);
    if (!stored) return defaults;
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') return defaults;
    return { ...defaults, ...parsed };
  } catch (error) {
    return defaults;
  }
}

function setColumnVisibilityMap(viewKey, map) {
  if (!viewKey) return;
  localStorage.setItem(`columnVisibility:${viewKey}`, JSON.stringify(map || {}));
}

function toggleColumnVisibility(viewKey, columnId) {
  const map = getColumnVisibilityMap(viewKey);
  const checkbox = document.getElementById(`column-toggle-${viewKey}-${columnId}`);
  if (checkbox) {
    map[columnId] = checkbox.checked;
  } else {
    map[columnId] = !map[columnId];
  }
  setColumnVisibilityMap(viewKey, map);
  applyColumnVisibility(viewKey);
}

function applyColumnVisibility(viewKey) {
  if (!viewKey) return;
  const table = document.querySelector(`table[data-view="${viewKey}"]`);
  if (!table) return;
  const map = getColumnVisibilityMap(viewKey);
  table.querySelectorAll('[data-column-id]').forEach(cell => {
    const id = cell.dataset.columnId;
    if (map[id] === false) {
      cell.classList.add('column-hidden');
    } else {
      cell.classList.remove('column-hidden');
    }
  });
}

function toggleColumnSelector(event, viewKey) {
  event.stopPropagation();
  closeColumnSelectors();
  const menu = document.getElementById(`column-selector-${viewKey}`);
  if (menu) {
    menu.classList.toggle('show');
  }
}

function closeColumnSelectors() {
  document.querySelectorAll('.column-selector-dropdown').forEach(menu => {
    menu.classList.remove('show');
  });
}

// Toggle inline filters visibility
function toggleInlineFilters() {
  const filtersDiv = document.getElementById('inline-filters');
  if (filtersDiv) {
    filtersDiv.style.display = filtersDiv.style.display === 'none' ? 'flex' : 'none';
  }
}

// Generate sortable table header
function createSortableHeader(column, label, currentSort = null) {
  const isSorted = currentSort && currentSort.column === column;
  const sortClass = isSorted ? (currentSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : '';
  
  return `
    <th class="table-header-sortable ${sortClass}" 
        onclick="sortTable('${column}')" 
        data-column="${column}"
        data-column-id="${column}">
      ${label}
    </th>
  `;
}

// Generate action menu dropdown
function createActionMenu(id, actions = []) {
  return `
    <div class="action-menu">
      <button class="action-menu-trigger" onclick="toggleActionMenu(event, ${id})">•••</button>
      <div class="action-menu-dropdown" id="action-menu-${id}">
        ${actions.map(action => {
          if (action.divider) {
            return '<div class="action-menu-divider"></div>';
          }
          return `
            <button class="action-menu-item ${action.danger ? 'danger' : ''}" 
                    onclick="${action.onclick}; closeActionMenus();">
              <span>${action.icon || ''}</span>
              <span>${action.label}</span>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Toggle action menu — use fixed positioning to escape overflow:hidden parents
function toggleActionMenu(event, id) {
  event.stopPropagation();
  closeActionMenus(); // Close all other menus
  const menu = document.getElementById(`action-menu-${id}`);
  if (menu) {
    menu.classList.toggle('show');
    if (menu.classList.contains('show')) {
      const trigger = event.currentTarget;
      const rect = trigger.getBoundingClientRect();
      menu.style.position = 'fixed';
      menu.style.top = (rect.bottom + 4) + 'px';
      menu.style.left = 'auto';
      menu.style.right = (window.innerWidth - rect.right) + 'px';
      // If the menu would go below the viewport, show it above the trigger
      requestAnimationFrame(() => {
        const menuRect = menu.getBoundingClientRect();
        if (menuRect.bottom > window.innerHeight - 8) {
          menu.style.top = (rect.top - menuRect.height - 4) + 'px';
        }
      });
    }
  }
}

// Close all action menus
function closeActionMenus() {
  document.querySelectorAll('.action-menu-dropdown').forEach(menu => {
    menu.classList.remove('show');
  });
}

// Close menus when clicking outside
document.addEventListener('click', () => {
  closeActionMenus();
  closeColumnSelectors();
});

// Close menus on scroll (fixed-position menus don't follow scroll)
document.addEventListener('scroll', () => { closeActionMenus(); }, true);

// Create status indicator with dot
function createStatusIndicator(status, label) {
  const statusClass = status.toLowerCase().replace(' ', '-');
  return `
    <div class="status-indicator">
      <span class="status-dot ${statusClass}"></span>
      <span>${label}</span>
    </div>
  `;
}

// Create clickable table cell link
function createTableLink(text, onclick) {
  return `<a href="#" class="table-cell-link" onclick="${onclick}; return false;">${text}</a>`;
}

function renderUsedInList(items, maxItems = 2) {
  if (!items || items.length === 0) {
    return '<span class="used-in-empty">-</span>';
  }
  const visible = items.slice(0, maxItems).map(item => createTableLink(item.label, item.onclick));
  const remaining = items.length - visible.length;
  const more = remaining > 0 ? `<span class="used-in-more">+${remaining} more</span>` : '';
  return `<div class="used-in-list">${visible.join(', ')}${more ? ` ${more}` : ''}</div>`;
}

// Recalculate results (placeholder)
function recalculateResults() {
  showToast('Recalculating results...', 'info');
  // Actual implementation would reload data with full count
}

// Sort table state
let currentTableSort = {
  column: null,
  direction: 'asc'
};

// Sort table function
function sortTable(column) {
  if (currentTableSort.column === column) {
    currentTableSort.direction = currentTableSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    currentTableSort.column = column;
    currentTableSort.direction = 'asc';
  }
  
  // Reload current view with sorting
  const view = currentRoute.view;
  switch(view) {
    case 'workflows':
      loadWorkflows();
      break;
    case 'contacts':
      loadContacts();
      break;
    case 'segments':
      loadSegments();
      break;
    case 'offers':
      if (typeof window.loadOffers === 'function') window.loadOffers();
      break;
    case 'placements':
      if (typeof window.loadPlacements === 'function') window.loadPlacements();
      break;
    case 'collections':
      if (typeof window.loadOfferCollections === 'function') window.loadOfferCollections();
      break;
    case 'decisionRules':
      if (typeof window.loadDecisionRules === 'function') window.loadDecisionRules();
      break;
    case 'strategies':
      if (typeof window.loadStrategies === 'function') window.loadStrategies();
      break;
    case 'decisions':
      if (typeof window.loadDecisions === 'function') window.loadDecisions();
      break;
  }
}

// Apply sorting to array
function applySorting(array, column) {
  if (!currentTableSort.column) return array;
  
  return [...array].sort((a, b) => {
    let aVal = a[column];
    let bVal = b[column];
    
    // Handle nested properties (e.g., 'user.name')
    if (column.includes('.')) {
      const parts = column.split('.');
      aVal = parts.reduce((obj, key) => obj?.[key], a);
      bVal = parts.reduce((obj, key) => obj?.[key], b);
    }
    
    // Handle different data types
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal?.toLowerCase() || '';
    }
    
    if (aVal < bVal) return currentTableSort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return currentTableSort.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

// Global helper to clear all filters (called from toolbar)
function clearAllFilters() {
  // Determine which page we're on and call appropriate clear function
  const view = currentRoute?.view;
  
  switch(view) {
    case 'workflows':
      clearWorkflowFilters();
      break;
    case 'contacts':
      clearContactFilters();
      break;
    case 'segments':
      clearSegmentFilters();
      break;
    case 'audiences':
      clearAudienceFilters();
      break;
    case 'deliveries':
      if (typeof clearDeliveriesFilters === 'function') {
        clearDeliveriesFilters();
      }
      break;
    case 'custom-objects':
      if (typeof updateCustomObjectSearch === 'function') {
        customObjectSearch = '';
        loadCustomObjects();
      }
      break;
    case 'assets':
      if (typeof clearAssetsFilterTag === 'function') {
        assetsSearch = '';
        assetsType = 'all';
        loadAssets();
      }
      break;
    case 'offers':
      if (typeof clearOdOffersFilters === 'function') clearOdOffersFilters();
      break;
    case 'decisions':
      if (typeof clearOdDecisionsFilters === 'function') clearOdDecisionsFilters();
      break;
    case 'placements':
      if (typeof clearOdPlacementsFilters === 'function') clearOdPlacementsFilters();
      break;
    case 'collections':
      if (typeof clearOdCollectionsFilters === 'function') clearOdCollectionsFilters();
      break;
    case 'decisionRules':
      if (typeof clearOdRulesFilters === 'function') clearOdRulesFilters();
      break;
    case 'strategies':
      if (typeof clearOdStrategiesFilters === 'function') clearOdStrategiesFilters();
      break;
    default:
      showToast('No filters to clear', 'info');
  }
}

// Refresh current view
function refreshCurrentView() {
  const view = currentRoute?.view;
  
  switch(view) {
    case 'workflows':
      loadWorkflows();
      break;
    case 'contacts':
      loadContacts();
      break;
    case 'segments':
      loadSegments();
      break;
    case 'audiences':
      loadAudiences();
      break;
    case 'deliveries':
      loadDeliveries();
      break;
    case 'offers':
      if (typeof window.loadOffers === 'function') window.loadOffers();
      break;
    case 'placements':
      if (typeof window.loadPlacements === 'function') window.loadPlacements();
      break;
    case 'collections':
      if (typeof window.loadOfferCollections === 'function') window.loadOfferCollections();
      break;
    case 'decisionRules':
      if (typeof window.loadDecisionRules === 'function') window.loadDecisionRules();
      break;
    case 'strategies':
      if (typeof window.loadStrategies === 'function') window.loadStrategies();
      break;
    case 'decisions':
      if (typeof window.loadDecisions === 'function') window.loadDecisions();
      break;
    default:
      location.reload();
  }
}

// Generic tab handler for string tabs
function changeTab(tabLabel) {
  const view = currentRoute?.view;
  switch (view) {
    case 'segments':
      if (typeof setSegmentTab === 'function') {
        setSegmentTab(tabLabel);
      }
      break;
    case 'audiences':
      if (typeof setAudienceTab === 'function') {
        setAudienceTab(tabLabel);
      }
      break;
    case 'assets':
      if (typeof setAssetsTab === 'function') {
        setAssetsTab(tabLabel);
      }
      break;
    default:
      showToast(`Tab "${tabLabel}" selected`, 'info');
  }
}
