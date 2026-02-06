// ============================================
// ADOBE CAMPAIGN TABLE HELPERS
// ============================================

// Generate Adobe-style table toolbar with inline filters
function createTableToolbar(options = {}) {
  const {
    tabs = ['Browse'],
    activeTab = 'Browse',
    resultCount = 0,
    totalCount = 0,
    showFilter = true,
    showRefresh = true,
    showSearch = true,
    showColumnSelector = false,
    searchPlaceholder = 'Search...',
    searchValue = '',
    columns = [],
    viewKey = '',
    filters = [], // Array of {type, label, options, value, onChange}
    filterTags = [], // Array of {key, label, value}
    onClearTag = null,
    onTabChange = null,
    onRefresh = () => {},
    onSearch = () => {}
  } = options;
  const columnVisibility = showColumnSelector && viewKey ? getColumnVisibilityMap(viewKey, columns) : {};
  
  return `
    <div class="table-toolbar">
      <div class="table-toolbar-top">
        <div class="table-toolbar-left">
          ${tabs.length > 1 ? `
            <div class="table-tabs">
              ${tabs.map(tab => typeof tab === 'string' ? `
                <button class="table-tab ${tab === activeTab ? 'active' : ''}" 
                        onclick='${typeof onTabChange === 'string' && onTabChange ? onTabChange : `changeTab("${tab}")`}'>
                  ${tab}
                </button>
              ` : `
                <button class="table-tab ${tab.active ? 'active' : ''}" 
                        onclick='${tab.onclick}'>
                  ${tab.label}
                </button>
              `).join('')}
            </div>
          ` : ''}
          
          ${showFilter && filters.length > 0 ? `<button class="filter-icon-btn" onclick="toggleInlineFilters()" title="Filters">▼</button>` : ''}
          
          <div class="result-counter">
            <strong>${resultCount}</strong>${totalCount ? ` of ${totalCount}` : ' of many'} 
            ${!totalCount ? `<a href="#" class="result-counter-link" onclick="recalculateResults(); return false;">(calculate)</a>` : ''}
          </div>
        </div>
        
        <div class="table-toolbar-right">
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
          ${showColumnSelector && columns.length ? `
            <div class="column-selector">
              <button class="column-selector-btn" onclick="toggleColumnSelector(event, '${viewKey}')" title="Columns"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg></button>
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
          ${showRefresh ? `
            <button class="refresh-icon-btn" onclick="${onRefresh || 'refreshCurrentView()'}" title="Refresh"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg></button>
          ` : ''}
        </div>
      </div>
      
      ${filters.length > 0 ? `
        <div class="table-toolbar-filters" id="inline-filters" style="display: none;">
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
          <button class="btn btn-sm btn-secondary" onclick="clearAllFilters()">Clear</button>
        </div>
      ` : ''}

      ${filterTags.length > 0 ? `
        <div class="table-toolbar-tags">
          ${filterTags.map(tag => `
            <span class="filter-tag">
              <span class="filter-tag-label">${tag.label}: ${tag.value}</span>
              ${onClearTag ? `<button class="filter-tag-remove" onclick='${onClearTag}("${tag.key}")'><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>` : ''}
            </span>
          `).join('')}
          <button class="btn btn-sm btn-secondary" onclick="clearAllFilters()">Clear all</button>
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
      loadWorkflows(currentWorkflowFilter);
      break;
    case 'contacts':
      loadContacts();
      break;
    case 'segments':
      loadSegments();
      break;
    // Add other cases as needed
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
    default:
      showToast('No filters to clear', 'info');
  }
}

// Refresh current view
function refreshCurrentView() {
  const view = currentRoute?.view;
  
  switch(view) {
    case 'workflows':
      loadWorkflows(currentWorkflowFilter);
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
    default:
      location.reload();
  }
}

// Generic tab handler for string tabs
function changeTab(tabLabel) {
  const view = currentRoute?.view;
  switch (view) {
    case 'deliveries':
      if (typeof setDeliveriesTab === 'function') {
        setDeliveriesTab(tabLabel);
      }
      break;
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
