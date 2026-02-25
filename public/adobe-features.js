// Shared back-button chevron SVG
const BACK_CHEVRON = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Helper function for Lucide-style SVG icons
const _afIco = (p, s) => '<svg width="' + (s||16) + '" height="' + (s||16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';

// ============================================
// NAVIGATION SECTION TOGGLE (Adobe-style)
// ============================================

function toggleNavSection(header) {
  const section = header.parentElement;
  section.classList.toggle('collapsed');
}

// ============================================
// NEW ADOBE CAMPAIGN VIEWS
// ============================================

// Explorer View
async function loadExplorer() {
  showLoading();
  try {
    // Fetch the full folder tree
    await fetchFolderTree();

    // Expand root-level folders by default
    window._folderTreeFlat.forEach(f => {
      if (f.parent_id === null) _folderExpandedState[f.id] = true;
    });

    const content = `
      <div class="explorer-tree-layout">
        <div class="explorer-tree-sidebar">
          <div class="explorer-tree-sidebar-header">
            ${_afIco('<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>', 16)}
            Explorer
          </div>
          <div id="explorer-folder-tree" style="flex:1;overflow-y:auto;"></div>
        </div>
        <div class="explorer-tree-content" id="explorer-content-panel">
          <div class="explorer-tree-content-header">
            <h3 id="explorer-panel-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
              All Items
            </h3>
            <div id="explorer-panel-breadcrumbs"></div>
          </div>
          <div class="explorer-tree-content-body" id="explorer-panel-body">
            <div style="text-align:center;padding:40px;color:#9ca3af;">Select a folder from the tree to browse its contents</div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('content').innerHTML = content;

    // Render tree
    renderFolderTree('explorer-folder-tree', {
      onSelect: onExplorerFolderSelect,
      showRoot: true,
      showActions: true
    });

    // Auto-select root (All Items)
    onExplorerFolderSelect(null);
  } catch (error) {
    console.error('Explorer error:', error);
    showError('Failed to load Explorer');
  } finally {
    hideLoading();
  }
}

// View mapping for entity types to navigation views
const ENTITY_VIEW_MAP = {
  contacts: 'contacts', workflows: 'workflows', deliveries: 'deliveries',
  segments: 'segments', content_templates: 'content-templates', fragments: 'fragments',
  landing_pages: 'landing-pages', assets: 'assets', brands: 'brands',
  offers: 'offers', placements: 'placements', collections: 'offer-collections',
  decision_rules: 'decision-rules', selection_strategies: 'strategies',
  decisions: 'decisions', audiences: 'audiences', subscription_services: 'subscription-services'
};

const ENTITY_DISPLAY_NAMES = {
  contacts: 'Profiles', workflows: 'Workflows', deliveries: 'Deliveries',
  segments: 'Segments', content_templates: 'Templates', fragments: 'Fragments',
  landing_pages: 'Landing Pages', assets: 'Assets', brands: 'Brands',
  offers: 'Offers', placements: 'Placements', collections: 'Collections',
  decision_rules: 'Decision Rules', selection_strategies: 'Strategies',
  decisions: 'Decisions', audiences: 'Audiences', subscription_services: 'Subscriptions'
};

async function onExplorerFolderSelect(folder) {
  const titleEl = document.getElementById('explorer-panel-title');
  const bcEl = document.getElementById('explorer-panel-breadcrumbs');
  const bodyEl = document.getElementById('explorer-panel-body');
  if (!titleEl || !bodyEl) return;

  if (!folder) {
    // Show root-level: display all root folders as cards
    titleEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg> All Items`;
    bcEl.innerHTML = '';

    const rootFolders = window._folderTreeFlat.filter(f => f.parent_id === null);
    let html = '<div class="explorer-folder-grid">';
    for (const rf of rootFolders) {
      const childCount = window._folderTreeFlat.filter(f => f.parent_id === rf.id).length;
      html += `
        <div class="explorer-folder-card" onclick="selectFolder(${rf.id})">
          <div class="folder-card-icon">${getFolderIcon(rf.icon || 'folder', 24)}</div>
          <div class="folder-card-name">${escapeHtml(rf.name)}</div>
          <div class="folder-card-count">${childCount} subfolder${childCount !== 1 ? 's' : ''}</div>
        </div>`;
    }
    html += '</div>';
    bodyEl.innerHTML = html;
    return;
  }

  // Show selected folder contents
  const icon = getFolderIcon(folder.icon || 'folder', 18);
  titleEl.innerHTML = `${icon} ${escapeHtml(folder.name)}`;
  bcEl.innerHTML = renderFolderBreadcrumbs(folder.id);

  // Get child folders
  const childFolders = window._folderTreeFlat.filter(f => f.parent_id === folder.id);

  // Build content
  let html = '';

  // Child folders grid
  if (childFolders.length > 0) {
    html += '<div class="explorer-folder-grid">';
    for (const cf of childFolders) {
      const subCount = window._folderTreeFlat.filter(f => f.parent_id === cf.id).length;
      html += `
        <div class="explorer-folder-card" onclick="selectFolder(${cf.id})"
             ondragover="onFolderDragOver(event)" ondrop="onFolderDrop(event, ${cf.id})">
          <div class="folder-card-icon">${getFolderIcon(cf.icon || 'folder', 24)}</div>
          <div class="folder-card-name">${escapeHtml(cf.name)}</div>
          <div class="folder-card-count">${subCount > 0 ? subCount + ' subfolder' + (subCount !== 1 ? 's' : '') : ''}</div>
        </div>`;
    }
    html += '</div>';
  }

  // Items in this folder (fetch via API)
  if (folder.entity_type) {
    try {
      const resp = await fetch(`/api/folders/${folder.id}`);
      const data = await resp.json();
      const items = data.items || [];

      if (items.length > 0) {
        const entityType = folder.entity_type;
        const viewKey = ENTITY_VIEW_MAP[entityType] || entityType;
        const displayName = ENTITY_DISPLAY_NAMES[entityType] || entityType;

        html += `<div style="margin-top:${childFolders.length > 0 ? '20px' : '0'}">`;
        html += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <h4 style="margin:0;font-size:14px;color:#374151;">${displayName} (${items.length})</h4>
          <a href="#" onclick="event.preventDefault();navigateTo('${viewKey}','list')" style="font-size:12px;color:#1473E6;text-decoration:none;">View all &rarr;</a>
        </div>`;
        html += '<table class="explorer-items-table"><thead><tr>';
        html += '<th>Name</th><th>Status</th><th>Modified</th>';
        html += '</tr></thead><tbody>';
        for (const item of items.slice(0, 50)) {
          const name = item.name || item.first_name && `${item.first_name} ${item.last_name || ''}` || item.email || `#${item.id}`;
          const status = item.status || '-';
          const modified = item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '-';
          html += `<tr draggable="true" ondragstart="event.dataTransfer.setData('text/plain', JSON.stringify({type:'item',entityType:'${entityType}',itemIds:[${item.id}]}))">
            <td><a class="item-link" onclick="navigateTo('${viewKey}','detail',${item.id})">${escapeHtml(String(name).trim())}</a></td>
            <td>${createExplorerStatusBadge(status)}</td>
            <td style="color:#9ca3af;font-size:12px;">${modified}</td>
          </tr>`;
        }
        if (items.length > 50) {
          html += `<tr><td colspan="3" style="text-align:center;color:#9ca3af;padding:12px;">... and ${items.length - 50} more items. <a href="#" onclick="event.preventDefault();navigateTo('${viewKey}','list')" style="color:#1473E6;">View all</a></td></tr>`;
        }
        html += '</tbody></table></div>';
      } else if (childFolders.length === 0) {
        html += `<div class="explorer-empty-folder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
          <div style="font-size:14px;margin-bottom:4px;">This folder is empty</div>
          <div style="font-size:12px;">Drag items here or navigate to a ${displayName || 'list'} page to organize content</div>
        </div>`;
      }
    } catch (err) {
      console.error('Failed to load folder items:', err);
    }
  } else if (childFolders.length === 0) {
    html += `<div class="explorer-empty-folder">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
      <div style="font-size:14px;margin-bottom:4px;">This is an organisational folder</div>
      <div style="font-size:12px;">Browse the sub-folders to see contents</div>
    </div>`;
  }

  bodyEl.innerHTML = html;
}

function createExplorerStatusBadge(status) {
  const colors = {
    active: '#059669', live: '#059669', completed: '#6366f1',
    draft: '#9ca3af', paused: '#f59e0b', inactive: '#9ca3af',
    approved: '#3b82f6', subscribed: '#059669', unsubscribed: '#dc2626'
  };
  const color = colors[(status || '').toLowerCase()] || '#9ca3af';
  return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:${color};"><span style="width:6px;height:6px;border-radius:50%;background:${color};display:inline-block;"></span>${status}</span>`;
}

// Deliveries View
let deliveriesFilters = {
  channel: 'all',
  status: 'all',
  search: ''
};

// Folder toggle for deliveries
window._folderToggle_deliveries = function() {
  toggleListFolderSidebar('deliveries', 'deliveries', loadDeliveries);
};
// Folder toggles for content management
window['_folderToggle_content-templates'] = function() { toggleListFolderSidebar('content-templates', 'content_templates', _renderContentTemplatesPage); };
window['_folderToggle_landing-pages'] = function() { toggleListFolderSidebar('landing-pages', 'landing_pages', loadLandingPages); };
window._folderToggle_fragments = function() { toggleListFolderSidebar('fragments', 'fragments', loadFragments); };
window._folderToggle_assets = function() { toggleListFolderSidebar('assets', 'assets', loadAssets); };
window._folderToggle_brands = function() { toggleListFolderSidebar('brands', 'brands', loadBrands); };

function clearDeliveriesFilters() {
  deliveriesFilters = { channel: 'all', status: 'all', search: '' };
  loadDeliveries();
}

function clearDeliveriesFilterTag(key) {
  if (key === 'channel') deliveriesFilters.channel = 'all';
  if (key === 'search') deliveriesFilters.search = '';
  if (key === 'status') deliveriesFilters.status = 'all';
  loadDeliveries();
}

function updateDeliveriesFilter(key, value) {
  deliveriesFilters[key] = value || 'all';
  if (key === 'search') {
    deliveriesFilters.search = value || '';
  if (typeof debounce === 'function') {
    debounce('deliveriesSearch', () => loadDeliveries(), 400);
    } else {
      loadDeliveries();
    }
  } else {
    loadDeliveries();
  }
}

async function loadDeliveries() {
  showLoading();
  try {
    if (typeof ensureAllFoldersLoaded === 'function') await ensureAllFoldersLoaded();
    const response = await fetch('/api/deliveries');
    const data = await response.json();
    const deliveries = data.deliveries || [];
    const workflowsResp = await fetch('/api/workflows');
    const workflowsData = await workflowsResp.json();
    const workflows = workflowsData.workflows || workflowsData || [];
    
    // Apply filters
    let filteredDeliveries = deliveries.filter(d => {
      if (deliveriesFilters.channel !== 'all' && d.channel !== deliveriesFilters.channel) return false;
      if (deliveriesFilters.status !== 'all' && d.status !== deliveriesFilters.status) return false;
      if (deliveriesFilters.search) {
        const s = deliveriesFilters.search.toLowerCase();
        if (!(d.name || '').toLowerCase().includes(s)) return false;
      }
      return true;
    });

    // Apply folder filter
    if (typeof applyFolderFilter === 'function') {
      filteredDeliveries = applyFolderFilter('deliveries', filteredDeliveries);
    }

    const filterTags = [];
    if (deliveriesFilters.channel !== 'all') {
      filterTags.push({ key: 'channel', label: 'Channel', value: deliveriesFilters.channel });
    }
    if (deliveriesFilters.search) {
      filterTags.push({ key: 'search', label: 'Search', value: deliveriesFilters.search });
    }
    if (deliveriesFilters.status !== 'all') {
      filterTags.push({ key: 'status', label: 'Status', value: deliveriesFilters.status });
    }
    
    // Apply sorting — default to last modified (newest first)
    if (!currentTableSort.column) {
      currentTableSort.column = 'updated_at';
      currentTableSort.direction = 'desc';
    }
    const sortedDeliveries = applySorting(filteredDeliveries, currentTableSort.column);
    
    const deliveryUsage = new Map();
    const ensureDeliveryUsage = (id) => {
      if (!deliveryUsage.has(id)) {
        deliveryUsage.set(id, { workflows: [] });
      }
      return deliveryUsage.get(id);
    };
    const addUniqueUsage = (list, item) => {
      if (!list.some(existing => existing.id === item.id)) {
        list.push(item);
      }
    };
    
    workflows.forEach(w => {
      const nodes = w.orchestration?.nodes || [];
      nodes.forEach(node => {
        if (['email', 'sms', 'push'].includes(node.type) && node.config?.delivery_id) {
          const usage = ensureDeliveryUsage(node.config.delivery_id);
          addUniqueUsage(usage.workflows, { id: w.id, name: w.name });
        }
      });
    });
    
    // Generate Adobe Campaign style table rows
    const tableRows = sortedDeliveries.map(d => {
      const statusMap = {
        'completed': 'stopped',
        'in-progress': 'in-progress',
        'draft': 'draft',
        'failed': 'stopped',
        'scheduled': 'paused',
        'paused': 'paused',
        'stopped': 'stopped'
      };
      
      const channelIcon = 
        d.channel === 'Email' ? _afIco('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>') :
        d.channel === 'SMS' ? _afIco('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>') : _afIco('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>');
      
      const actions = [
        {icon: _afIco('<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>', 14), label: 'View Report', onclick: `showDeliveryReport(${d.id})`},
        {icon: _afIco('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>', 14), label: 'Heatmap', onclick: `showDeliveryHeatmap(${d.id})`},
        {icon: _afIco('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>', 14), label: 'Edit', onclick: `editDelivery(${d.id})`},
        {icon: _afIco('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>', 14), label: 'Duplicate', onclick: `duplicateDelivery(${d.id})`},
        {divider: true},
        {icon: _afIco('<polygon points="6 3 20 12 6 21 6 3"/>', 14), label: 'Send now', onclick: `sendDelivery(${d.id})`},
        ...(d.approval_required && !d.approved_at ? [{icon: _afIco('<path d="M20 6 9 17l-5-5"/>', 14), label: 'Approve', onclick: `approveDelivery(${d.id})`}] : []),
        {icon: _afIco('<rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/>', 14), label: 'Pause', onclick: `pauseDelivery(${d.id})`},
        {icon: _afIco('<polygon points="6 3 20 12 6 21 6 3"/>', 14), label: 'Resume', onclick: `resumeDelivery(${d.id})`},
        {icon: _afIco('<rect width="14" height="14" x="5" y="5" rx="2"/>', 14), label: 'Stop', onclick: `stopDelivery(${d.id})`},
        {divider: true},
        {icon: _afIco('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', 14), label: 'Delete', onclick: `deleteDelivery(${d.id})`, danger: true}
      ];
      
      const usage = deliveryUsage.get(d.id) || { workflows: [] };
      const usedInItems = [
        ...usage.workflows.map(w => ({ label: `Workflow: ${w.name}`, onclick: `navigateTo('workflows', 'edit', ${w.id})` }))
      ];
      
      const draftMeta = d.status === 'draft' && d.last_saved_step ? `<div class="table-subtext">Draft • Step ${d.last_saved_step}</div>` : '';
      return `
        <tr>
          <td data-column-id="name">${createTableLink(`${channelIcon} ${d.name}`, `editDelivery(${d.id})`)}${draftMeta}</td>
          <td data-column-id="status">${createStatusIndicator(statusMap[d.status] || 'draft', d.status)}</td>
          <td data-column-id="channel">${d.channel}</td>
          <td data-column-id="sent">${(d.sent || 0).toLocaleString()}</td>
          <td data-column-id="delivered">${(d.delivered || 0).toLocaleString()}</td>
          <td data-column-id="opens">${d.opens > 0 ? d.opens.toLocaleString() : '-'}</td>
          <td data-column-id="clicks">${d.clicks > 0 ? d.clicks.toLocaleString() : '-'}</td>
          <td data-column-id="used_in">${renderUsedInList(usedInItems)}</td>
          <td data-column-id="created_at">${d.created_at ? new Date(d.created_at).toLocaleString() : '-'}</td>
          <td data-column-id="updated_at">${d.updated_at ? new Date(d.updated_at).toLocaleString() : '-'}</td>
          <td data-column-id="created_by">${d.created_by || 'System'}</td>
          <td data-column-id="sent_at">${d.sent_at ? new Date(d.sent_at).toLocaleString() : (d.scheduled_at ? `Scheduled: ${new Date(d.scheduled_at).toLocaleString()}` : 'Not sent')}</td>
          <td data-column-id="sto">${d.sto_enabled ? '<span class="badge badge-info" title="Send Time Optimization enabled"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="m4.9 4.9 2.9 2.9"/><path d="m16.2 16.2 2.9 2.9"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="m4.9 19.1 2.9-2.9"/><path d="m16.2 7.8 2.9-2.9"/></svg> STO</span>' : '<span style="color:var(--text-tertiary,#94a3b8)">—</span>'}</td>
          <td data-column-id="wave">${d.wave_enabled ? '<span class="badge badge-info" title="Wave Sending: ' + d.wave_count + ' waves, ' + d.wave_interval_minutes + 'min interval"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg> ' + d.wave_count + ' waves</span>' : '<span style="color:var(--text-tertiary,#94a3b8)">—</span>'}</td>
          <td data-column-id="folder">${typeof folderCellHtml === 'function' ? folderCellHtml(d.folder_id) : ''}</td>
          <td>${createActionMenu(d.id, actions)}</td>
        </tr>
      `;
    }).join('');
    
    const columns = [
      { id: 'name', label: 'Delivery' },
      { id: 'status', label: 'Status' },
      { id: 'channel', label: 'Channel' },
      { id: 'sent', label: 'Sent' },
      { id: 'delivered', label: 'Delivered' },
      { id: 'opens', label: 'Opens' },
      { id: 'clicks', label: 'Clicks' },
      { id: 'used_in', label: 'Used in' },
      { id: 'created_at', label: 'Creation date' },
      { id: 'updated_at', label: 'Last modified' },
      { id: 'created_by', label: 'Created by' },
      { id: 'sent_at', label: 'Sent date' },
      { id: 'sto', label: 'STO', visible: false },
      { id: 'wave', label: 'Waves', visible: false },
      { id: 'folder', label: 'Folder', visible: false }
    ];
    
    let content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${_afIco('<path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/>')} Deliveries</h3>
          <div style="display:flex;gap:8px;align-items:center">
            <span id="sendgrid-status-badge"></span>
            ${typeof getFolderToggleButtonHtml === 'function' ? getFolderToggleButtonHtml('deliveries') : ''}
            <button class="btn btn-secondary btn-sm" onclick="openSendGridConfig()" title="Email Provider Settings">${_afIco('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>', 14)} Brevo</button>
          <button class="btn btn-secondary btn-sm" onclick="showAggregateDeliveryHeatmap()" title="Cross-delivery engagement heatmap">${_afIco('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>', 14)} Heatmap</button>
          <button class="btn btn-primary" onclick="showDeliveryForm()">+ Create Delivery</button>
          </div>
        </div>
        
        ${createTableToolbar({
          resultCount: filteredDeliveries.length,
          totalCount: deliveries.length,
          showColumnSelector: true,
          columns,
          viewKey: 'deliveries',
          showSearch: true,
          searchPlaceholder: 'Search deliveries...',
          searchValue: deliveriesFilters.search || '',
          onSearch: 'updateDeliveriesFilter("search", this.value)',
          filterTags,
          onClearTag: 'clearDeliveriesFilterTag',
          filters: [
            {
              type: 'select',
              label: 'Channel',
              value: deliveriesFilters.channel,
              onChange: 'updateDeliveriesFilter("channel", this.value)',
              options: [
                { value: 'all', label: 'All channels' },
                { value: 'Email', label: 'Email' },
                { value: 'SMS', label: 'SMS' },
                { value: 'Push', label: 'Push' }
              ]
            },
            {
              type: 'select',
              label: 'Status',
              value: deliveriesFilters.status,
              onChange: 'updateDeliveriesFilter("status", this.value)',
              options: [
                { value: 'all', label: 'All statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'in-progress', label: 'In progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'paused', label: 'Paused' },
                { value: 'stopped', label: 'Stopped' },
                { value: 'failed', label: 'Failed' }
              ]
            }
          ]
        })}
        
        <div class="data-table-container">
          <table class="data-table" data-view="deliveries">
            <thead>
              <tr>
                ${createSortableHeader('name', 'Delivery', currentTableSort)}
                ${createSortableHeader('status', 'Status', currentTableSort)}
                ${createSortableHeader('channel', 'Channel', currentTableSort)}
                ${createSortableHeader('sent', 'Sent', currentTableSort)}
                ${createSortableHeader('delivered', 'Delivered', currentTableSort)}
                <th data-column-id="opens">Opens</th>
                <th data-column-id="clicks">Clicks</th>
                <th data-column-id="used_in">Used in</th>
                ${createSortableHeader('created_at', 'Creation date', currentTableSort)}
                ${createSortableHeader('updated_at', 'Last modified', currentTableSort)}
                ${createSortableHeader('created_by', 'Created by', currentTableSort)}
                ${createSortableHeader('sent_at', 'Sent date', currentTableSort)}
                <th data-column-id="sto">STO</th>
                <th data-column-id="wave">Waves</th>
                <th data-column-id="folder">Folder</th>
                <th style="width: 50px;"></th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="16" style="text-align: center; padding: 2rem; color: #6B7280;">No deliveries found</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
    // Wrap with folder sidebar if enabled
    if (typeof wrapWithFolderSidebarHtml === 'function') {
      content = wrapWithFolderSidebarHtml('deliveries', 'deliveries', content);
    }
    document.getElementById('content').innerHTML = content;
    applyColumnVisibility('deliveries');
    _refreshSendGridBadge();
    // Initialize folder tree for deliveries
    if (typeof initListFolderTree === 'function') {
      initListFolderTree('deliveries', 'deliveries', loadDeliveries);
    }
    if (window.pendingDeliveryId) {
      const id = window.pendingDeliveryId;
      window.pendingDeliveryId = null;
      setTimeout(() => editDelivery(id), 0);
    } else if (window.createDeliveryFromWorkflow) {
      const ctx = window.createDeliveryFromWorkflow;
      window.createDeliveryFromWorkflow = null;
      const draft = { name: ctx.defaultName || '', channel: ctx.channel || 'Email' };
      setTimeout(async () => {
        await showDeliveryForm(draft);
        deliveryWizard.fromWorkflow = { workflowId: ctx.workflowId, nodeId: ctx.nodeId };
        renderDeliveryWizard();
      }, 0);
    }
  } catch (error) {
    showError('Failed to load Deliveries');
  } finally {
    hideLoading();
  }
}

const deliverySteps = [
  { id: 1, label: 'Properties' },
  { id: 2, label: 'Audience/Segments' },
  { id: 3, label: 'Content' },
  { id: 4, label: 'Preview & Proof' },
  { id: 5, label: 'Publish' }
];

let deliveryWizard = {
  currentStep: 1,
  deliveryId: null,
  data: {},
  blocks: [],
  blocksByVariant: { A: [], B: [] },
  testProfile: null,       // Selected test contact for personalization
  testProfileSearch: [],   // Contact search results for the picker
  currentVariant: 'A',
  lists: { segments: [], audiences: [], templates: [], assets: [] }
};

async function showDeliveryForm(delivery = null) {
  initDeliveryWizard(delivery);
  await loadDeliveryLists();
  if (typeof ensureFolderPickerData === 'function') await ensureFolderPickerData('deliveries');
  if (!delivery && !deliveryWizard.folder_id && typeof getDefaultFolderForEntity === 'function') {
    deliveryWizard.folder_id = getDefaultFolderForEntity('deliveries');
  }
  // Fetch workflow schedule context for existing deliveries
  deliveryWizard.workflowSchedules = [];
  if (delivery?.id) {
    try {
      const wsResp = await fetch('/api/deliveries/' + delivery.id + '/workflow-schedule');
      const wsData = await wsResp.json();
      if (wsData.linked_workflows) deliveryWizard.workflowSchedules = wsData.linked_workflows;
    } catch (e) { /* non-critical */ }
  }
  renderDeliveryWizard();
}

function initDeliveryWizard(delivery) {
  const draftState = delivery?.draft_state && typeof delivery.draft_state === 'object'
    ? delivery.draft_state
    : {};
  deliveryWizard.deliveryId = delivery?.id || null;
  deliveryWizard.folder_id = delivery?.folder_id || draftState.folder_id || null;
  deliveryWizard.currentStep = delivery?.last_saved_step || delivery?.wizard_step || 1;
  const deliveryBlocks = delivery?.content_blocks;
  const draftBlocks = draftState.content_blocks;
  deliveryWizard.blocks = (deliveryBlocks && (Array.isArray(deliveryBlocks) || typeof deliveryBlocks === 'object'))
    ? deliveryBlocks
    : (draftBlocks || []);
  const htmlOutput = delivery?.html_output || draftState.html_output || '';
  const proofEmails = delivery?.proof_emails || draftState.proof_emails || [];
  deliveryWizard.data = {
    name: delivery?.name || draftState.name || '',
    channel: delivery?.channel || draftState.channel || 'Email',
    status: delivery?.status || draftState.status || 'draft',
    scheduled_at: delivery?.scheduled_at || draftState.scheduled_at || null,
    audience_id: delivery?.audience_id || draftState.audience_id || '',
    segment_id: delivery?.segment_id || draftState.segment_id || '',
    approval_required: delivery?.approval_required ?? draftState.approval_required ?? false,
    subject: delivery?.subject || draftState.subject || '',
    preheader: delivery?.preheader || draftState.preheader || '',
    document_title: delivery?.document_title || draftState.document_title || '',
    document_language: delivery?.document_language || draftState.document_language || '',
    content: delivery?.content || draftState.content || '',
    html_output: htmlOutput,
    proof_emails: Array.isArray(proofEmails) ? proofEmails : [],
    ab_test_enabled: delivery?.ab_test_enabled ?? draftState.ab_test_enabled ?? false,
    ab_split_pct: delivery?.ab_split_pct || draftState.ab_split_pct || 50,
    ab_winner_rule: delivery?.ab_winner_rule || draftState.ab_winner_rule || 'open_rate',
    ab_weighted_metrics: delivery?.ab_weighted_metrics || draftState.ab_weighted_metrics || [],
    ab_guardrails: delivery?.ab_guardrails || draftState.ab_guardrails || [],
    // Send Time Optimization
    sto_enabled: delivery?.sto_enabled ?? draftState.sto_enabled ?? false,
    sto_model: delivery?.sto_model || draftState.sto_model || 'engagement_history',
    sto_window_hours: delivery?.sto_window_hours ?? draftState.sto_window_hours ?? 24,
    // Wave Sending
    wave_enabled: delivery?.wave_enabled ?? draftState.wave_enabled ?? false,
    wave_count: delivery?.wave_count ?? draftState.wave_count ?? 3,
    wave_interval_minutes: delivery?.wave_interval_minutes ?? draftState.wave_interval_minutes ?? 60,
    wave_start_pct: delivery?.wave_start_pct ?? draftState.wave_start_pct ?? 10,
    wave_ramp_type: delivery?.wave_ramp_type || draftState.wave_ramp_type || 'linear',
    wave_custom_pcts: delivery?.wave_custom_pcts || draftState.wave_custom_pcts || null,
    wave_timing_mode: delivery?.wave_timing_mode || draftState.wave_timing_mode || 'interval',
    wave_custom_times: delivery?.wave_custom_times || draftState.wave_custom_times || null
  };
  applyPendingSegmentSelection();
  applyPendingDeliveryStep();
}

async function loadDeliveryLists() {
  try {
    const segRes = await fetch('/api/segments');
    const segData = await segRes.json();
    deliveryWizard.lists.segments = segData.segments || segData || [];
    const audRes = await fetch('/api/audiences');
    const audData = await audRes.json();
    deliveryWizard.lists.audiences = audData.audiences || audData || [];
    const tplRes = await fetch('/api/email-templates');
    const tplData = await tplRes.json();
    deliveryWizard.lists.templates = tplData.templates || [];
  } catch (error) {
    deliveryWizard.lists.segments = [];
    deliveryWizard.lists.audiences = [];
    deliveryWizard.lists.templates = [];
  }
}

function renderDeliveryWizard() {
  const stepper = deliverySteps.map(step => `
    <div class="wizard-step ${step.id === deliveryWizard.currentStep ? 'active' : step.id < deliveryWizard.currentStep ? 'completed' : ''}">
      <div class="wizard-step-index">${step.id}</div>
      <div class="wizard-step-label">${step.label}</div>
    </div>
  `).join('');
  
  const backToWorkflow = deliveryWizard.fromWorkflow
    ? `<button class="btn btn-secondary" onclick="goBackToWorkflow()" title="Return to workflow">${BACK_CHEVRON} Back to Workflow</button>`
    : '';
  const backToDeliveries = `<button class="btn-back" onclick="loadDeliveries()" title="Back to Deliveries">${BACK_CHEVRON}</button>`;
  const content = `
    <div class="form-container">
      <div class="wizard-header">
        <div class="wizard-title">${_afIco('<path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/>')} Delivery</div>
        <div class="wizard-actions" style="display:flex;align-items:center;gap:8px">
          <button class="btn btn-secondary" onclick="saveDeliveryDraft()">Save</button>
          ${backToWorkflow}
          ${backToDeliveries}
        </div>
      </div>
      <div class="wizard-steps">${stepper}</div>
      <div id="delivery-step-content"></div>
      <div class="wizard-nav">
        ${deliveryWizard.currentStep > 1 ? '<button class="btn btn-secondary" onclick="prevDeliveryStep()">Back</button>' : '<div></div>'}
        <button class="btn btn-primary" onclick="nextDeliveryStep()">${deliveryWizard.currentStep === 5 ? 'Finish' : 'Next'}</button>
      </div>
    </div>
  `;
  document.getElementById('content').innerHTML = content;
  renderDeliveryStepContent();
}

function renderDeliveryStepContent() {
  const step = deliveryWizard.currentStep;
  const d = deliveryWizard.data;
  const segments = deliveryWizard.lists.segments;
  const audiences = deliveryWizard.lists.audiences;
  const scheduleValue = d.scheduled_at ? new Date(d.scheduled_at).toISOString().slice(0, 16) : '';
  let html = '';
  
  if (step === 1) {
    html = `
      <div class="form-section compact-form">
        <h3 class="form-section-title">1. Properties</h3>
        <div class="form-grid">
          <div class="form-group form-grid-full">
            <label class="form-label form-label-required">Name</label>
            <input type="text" class="form-input" value="${d.name}" oninput="updateDeliveryField('name', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label form-label-required">Channel</label>
            <select class="form-input" onchange="updateDeliveryField('channel', this.value)">
              <option value="Email" ${d.channel === 'Email' ? 'selected' : ''}>Email</option>
              <option value="SMS" ${d.channel === 'SMS' ? 'selected' : ''}>SMS</option>
              <option value="Push" ${d.channel === 'Push' ? 'selected' : ''}>Push</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-input" onchange="updateDeliveryField('status', this.value)">
              <option value="draft" ${d.status === 'draft' ? 'selected' : ''}>Draft</option>
              <option value="scheduled" ${d.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
              <option value="in-progress" ${d.status === 'in-progress' ? 'selected' : ''}>In progress</option>
              <option value="paused" ${d.status === 'paused' ? 'selected' : ''}>Paused</option>
              <option value="completed" ${d.status === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="stopped" ${d.status === 'stopped' ? 'selected' : ''}>Stopped</option>
              <option value="failed" ${d.status === 'failed' ? 'selected' : ''}>Failed</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Delivery Timing</label>
            <div style="display:flex;gap:0;border:1px solid var(--border-default, #e2e8f0);border-radius:8px;overflow:hidden;margin-bottom:8px">
              <button class="btn ${!d.scheduled_at ? 'btn-primary' : 'btn-ghost'}" style="flex:1;border-radius:0;border:none;padding:8px 12px;font-size:12px" onclick="clearDeliverySchedule()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><polygon points="6 3 20 12 6 21 6 3"/></svg> Send immediately
              </button>
              <button class="btn ${d.scheduled_at ? 'btn-primary' : 'btn-ghost'}" style="flex:1;border-radius:0;border:none;border-left:1px solid var(--border-default, #e2e8f0);padding:8px 12px;font-size:12px" onclick="showDeliverySchedulePicker()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Schedule
              </button>
            </div>
            <div id="delivery-schedule-picker" style="display:${d.scheduled_at ? 'block' : 'none'}">
            <input type="datetime-local" class="form-input" value="${scheduleValue}" onchange="updateDeliveryField('scheduled_at', this.value); syncWave1WithSchedule()">
              <span class="form-helper">Date and time to send</span>
            </div>
            ${!d.scheduled_at ? '<span class="form-helper" style="color:var(--color-success, #10b981)">Sent as soon as published</span>' : ''}
          </div>
          <div class="form-group">
            <label class="form-label">Approval Required</label>
            <select class="form-input" onchange="updateDeliveryField('approval_required', this.value === 'yes')">
              <option value="no" ${d.approval_required ? '' : 'selected'}>No</option>
              <option value="yes" ${d.approval_required ? 'selected' : ''}>Yes</option>
            </select>
          </div>
          ${typeof folderPickerHtml === 'function' ? folderPickerHtml('delivery-folder-id', 'deliveries', deliveryWizard.folder_id) : ''}
        </div>
      </div>

      ${renderWorkflowScheduleContext()}

      <!-- Send Time Optimization -->
      <div class="form-section compact-form" style="margin-top:16px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <h3 class="form-section-title" style="margin:0;flex:1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:6px"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/><circle cx="12" cy="12" r="4"/></svg>
            Send Time Optimization
          </h3>
          <label class="toggle-switch" style="margin:0">
            <input type="checkbox" ${d.sto_enabled ? 'checked' : ''} onchange="toggleSTO(this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <p class="form-helper" style="margin:-4px 0 12px 0">Use AI to determine the optimal send time for each recipient based on their engagement patterns.</p>
        <div id="sto-settings" style="display:${d.sto_enabled ? 'block' : 'none'}">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Optimization Model</label>
              <select class="form-input" onchange="updateDeliveryField('sto_model', this.value)">
                <option value="engagement_history" ${d.sto_model === 'engagement_history' ? 'selected' : ''}>Engagement History</option>
                <option value="open_time_prediction" ${d.sto_model === 'open_time_prediction' ? 'selected' : ''}>Open Time Prediction</option>
                <option value="click_time_prediction" ${d.sto_model === 'click_time_prediction' ? 'selected' : ''}>Click Time Prediction</option>
                <option value="timezone_aware" ${d.sto_model === 'timezone_aware' ? 'selected' : ''}>Timezone-Aware</option>
              </select>
              <span class="form-helper">Algorithm used to predict best send time</span>
            </div>
            <div class="form-group">
              <label class="form-label">Delivery Window (hours)</label>
              <select class="form-input" onchange="updateDeliveryField('sto_window_hours', parseInt(this.value))">
                <option value="6" ${d.sto_window_hours === 6 ? 'selected' : ''}>6 hours</option>
                <option value="12" ${d.sto_window_hours === 12 ? 'selected' : ''}>12 hours</option>
                <option value="24" ${d.sto_window_hours === 24 ? 'selected' : ''}>24 hours</option>
                <option value="48" ${d.sto_window_hours === 48 ? 'selected' : ''}>48 hours</option>
                <option value="72" ${d.sto_window_hours === 72 ? 'selected' : ''}>72 hours</option>
              </select>
              <span class="form-helper">Maximum time window to spread sends across</span>
            </div>
          </div>
          <div class="sto-info-card" style="background:var(--bg-secondary, #f8fafc);border:1px solid var(--border-default, #e2e8f0);border-radius:8px;padding:12px 16px;margin-top:8px">
            <div style="display:flex;align-items:flex-start;gap:10px">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-info, #3b82f6)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <div style="font-size:12px;color:var(--text-secondary, #64748b);line-height:1.5">
                <strong style="color:var(--text-primary, #1e293b)">How it works:</strong> Each recipient will receive the message at their predicted optimal engagement time within the <strong>${d.sto_window_hours}-hour</strong> window after the scheduled send time. Recipients without sufficient engagement data will receive at the scheduled time.
              </div>
            </div>
          </div>

          <!-- System-wide STO insights -->
          <div id="sto-insights-container"></div>
        </div>
      </div>

    `;
  }
  
  if (step === 2) {
    // Estimate audience size from selected segment/audience
    const selectedSegment = segments.find(s => s.id == d.segment_id);
    const selectedAudience = audiences.find(a => a.id == d.audience_id);
    const estAudienceSize = selectedSegment?.size || selectedSegment?.population || selectedAudience?.size || selectedAudience?.population || 0;

    html = `
      <div class="form-section compact-form">
        <h3 class="form-section-title">2. Segments & Audience</h3>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Audience</label>
            <select class="form-input" onchange="updateDeliveryField('audience_id', this.value); renderDeliveryStepContent()">
              <option value="">Select audience...</option>
              ${audiences.map(a => `<option value="${a.id}" ${d.audience_id == a.id ? 'selected' : ''}>${a.name}${a.size || a.population ? ' (' + (a.size || a.population).toLocaleString() + ')' : ''}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Segment</label>
            <select class="form-input" onchange="updateDeliveryField('segment_id', this.value); renderDeliveryStepContent()">
              <option value="">Select segment...</option>
              ${segments.map(s => `<option value="${s.id}" ${d.segment_id == s.id ? 'selected' : ''}>${s.name}${s.size || s.population ? ' (' + (s.size || s.population).toLocaleString() + ')' : ''}</option>`).join('')}
            </select>
          </div>
          <div class="form-group form-grid-full">
            <div class="form-inline-actions">
              <button class="btn btn-secondary" onclick="openSegmentBuilder()">+ Create Segment</button>
              <button class="btn btn-secondary" onclick="refreshDeliveryLists()">Refresh lists</button>
            </div>
          </div>
        </div>
        ${estAudienceSize > 0 ? `<div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;padding:10px 14px;margin-top:4px;display:flex;align-items:center;gap:8px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span style="font-size:13px;color:#3730a3"><strong>Estimated audience size:</strong> ${estAudienceSize.toLocaleString()} recipients</span>
        </div>` : ''}
      </div>

      <!-- Wave Sending (after audience selection) -->
      <div class="form-section compact-form" style="margin-top:16px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <h3 class="form-section-title" style="margin:0;flex:1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:6px"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>
            Wave Sending
          </h3>
          <label class="toggle-switch" style="margin:0">
            <input type="checkbox" ${d.wave_enabled ? 'checked' : ''} onchange="toggleWaveSending(this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <p class="form-helper" style="margin:-4px 0 12px 0">Split your audience into waves and send progressively to manage server load and monitor early results before full rollout.</p>
        <div id="wave-settings" style="display:${d.wave_enabled ? 'block' : 'none'}">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Number of Waves</label>
              <select class="form-input" onchange="updateWaveConfig('wave_count', parseInt(this.value))">
                <option value="2" ${d.wave_count === 2 ? 'selected' : ''}>2 waves</option>
                <option value="3" ${d.wave_count === 3 ? 'selected' : ''}>3 waves</option>
                <option value="4" ${d.wave_count === 4 ? 'selected' : ''}>4 waves</option>
                <option value="5" ${d.wave_count === 5 ? 'selected' : ''}>5 waves</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Wave Timing</label>
              <select class="form-input" onchange="updateWaveConfig('wave_timing_mode', this.value); toggleWaveTimingMode()">
                <option value="interval" ${d.wave_timing_mode === 'interval' ? 'selected' : ''}>Fixed Interval</option>
                <option value="custom_times" ${d.wave_timing_mode === 'custom_times' ? 'selected' : ''}>Custom Times</option>
              </select>
              <span class="form-helper">Fixed intervals or pick a specific date &amp; time per wave</span>
            </div>
            <div class="form-group" id="wave-interval-group" style="display:${d.wave_timing_mode !== 'custom_times' ? 'block' : 'none'}">
              <label class="form-label">Interval Between Waves</label>
              <select class="form-input" onchange="updateWaveConfig('wave_interval_minutes', parseInt(this.value))">
                <option value="15" ${d.wave_interval_minutes === 15 ? 'selected' : ''}>15 minutes</option>
                <option value="30" ${d.wave_interval_minutes === 30 ? 'selected' : ''}>30 minutes</option>
                <option value="60" ${d.wave_interval_minutes === 60 ? 'selected' : ''}>1 hour</option>
                <option value="120" ${d.wave_interval_minutes === 120 ? 'selected' : ''}>2 hours</option>
                <option value="240" ${d.wave_interval_minutes === 240 ? 'selected' : ''}>4 hours</option>
                <option value="480" ${d.wave_interval_minutes === 480 ? 'selected' : ''}>8 hours</option>
                <option value="720" ${d.wave_interval_minutes === 720 ? 'selected' : ''}>12 hours</option>
                <option value="1440" ${d.wave_interval_minutes === 1440 ? 'selected' : ''}>1 day</option>
                <option value="2880" ${d.wave_interval_minutes === 2880 ? 'selected' : ''}>2 days</option>
                <option value="4320" ${d.wave_interval_minutes === 4320 ? 'selected' : ''}>3 days</option>
                <option value="7200" ${d.wave_interval_minutes === 7200 ? 'selected' : ''}>5 days</option>
                <option value="10080" ${d.wave_interval_minutes === 10080 ? 'selected' : ''}>1 week</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">First Wave Size</label>
              <select class="form-input" onchange="updateWaveConfig('wave_start_pct', parseInt(this.value))">
                <option value="5" ${d.wave_start_pct === 5 ? 'selected' : ''}>5% of audience</option>
                <option value="10" ${d.wave_start_pct === 10 ? 'selected' : ''}>10% of audience</option>
                <option value="15" ${d.wave_start_pct === 15 ? 'selected' : ''}>15% of audience</option>
                <option value="20" ${d.wave_start_pct === 20 ? 'selected' : ''}>20% of audience</option>
                <option value="25" ${d.wave_start_pct === 25 ? 'selected' : ''}>25% of audience</option>
                <option value="33" ${d.wave_start_pct === 33 ? 'selected' : ''}>33% of audience</option>
                <option value="50" ${d.wave_start_pct === 50 ? 'selected' : ''}>50% of audience</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Ramp Type</label>
              <select class="form-input" onchange="updateWaveConfig('wave_ramp_type', this.value); toggleCustomWaveInputs()">
                <option value="linear" ${d.wave_ramp_type === 'linear' ? 'selected' : ''}>Linear (equal increments)</option>
                <option value="exponential" ${d.wave_ramp_type === 'exponential' ? 'selected' : ''}>Exponential (doubling)</option>
                <option value="front_loaded" ${d.wave_ramp_type === 'front_loaded' ? 'selected' : ''}>Front-loaded (bulk early)</option>
                <option value="equal" ${d.wave_ramp_type === 'equal' ? 'selected' : ''}>Equal split</option>
                <option value="custom" ${d.wave_ramp_type === 'custom' ? 'selected' : ''}>Custom (define percentages)</option>
              </select>
              <span class="form-helper">How audience is distributed across waves</span>
            </div>
          </div>
          <div id="custom-wave-inputs" style="display:${d.wave_ramp_type === 'custom' ? 'block' : 'none'}">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-top:8px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                <label class="form-label" style="margin:0;font-weight:600;font-size:13px">Custom Wave Percentages</label>
                <span id="custom-wave-total" class="badge badge-success" style="font-size:12px">Total: 100%</span>
              </div>
              <div id="custom-wave-fields" style="display:flex;flex-wrap:wrap;gap:8px"></div>
              <div id="custom-wave-error" style="display:none;color:#ef4444;font-size:12px;margin-top:8px"></div>
            </div>
          </div>
          <div id="custom-wave-times" style="display:${d.wave_timing_mode === 'custom_times' ? 'block' : 'none'}"></div>
          <div id="wave-schedule-preview" style="margin-top:12px"></div>
        </div>
      </div>
    `;
  }
  
  if (step === 3) {
    if (d.channel === 'Email') {
      const templates = deliveryWizard.lists.templates || [];
      const sampleTemplates = templates.filter(t => t.sample);
      const savedTemplates = templates.filter(t => !t.sample);
      const abEnabled = !!d.ab_test_enabled;
      html = `
        <div class="form-section compact-form">
          <h3 class="form-section-title">3. Content (Email Designer)</h3>
          <div class="form-group form-grid-full">
            <label class="form-label">Select a design template</label>
            <div class="dw-template-section">
              <div class="dw-template-tabs">
                <button class="dw-tmpl-tab active" onclick="_dwSwitchTemplateTab(this, 'sample')">Sample templates (${sampleTemplates.length})</button>
                <button class="dw-tmpl-tab" onclick="_dwSwitchTemplateTab(this, 'saved')">Saved templates (${savedTemplates.length})</button>
              </div>
              <div class="dw-template-grid" id="dw-template-grid">
                ${_dwRenderTemplateCards(sampleTemplates)}
              </div>
              <input type="hidden" id="delivery-template-select" value="">
            </div>
            <div style="display:flex;gap:8px;margin-top:8px;">
              <button class="btn btn-secondary btn-sm" onclick="saveTemplateFromEmail()">Save current as template</button>
            </div>
          </div>
          <div class="form-group form-grid-full">
            <label class="form-label">A/B Testing</label>
            <div class="form-help-row">
              <span class="form-help">Send two variants and let the system pick a winner.</span>
              <button class="btn btn-ghost btn-sm" type="button" onclick="showAbTestingHelp()">How it works</button>
            </div>
            <div class="form-inline-actions">
              <select class="form-input" onchange="updateDeliveryField('ab_test_enabled', this.value === 'yes')">
                <option value="no" ${abEnabled ? '' : 'selected'}>Disabled</option>
                <option value="yes" ${abEnabled ? 'selected' : ''}>Enabled</option>
              </select>
              <input class="form-input" type="number" min="10" max="90" value="${d.ab_split_pct || 50}" oninput="updateDeliveryField('ab_split_pct', this.value)" placeholder="Split % for A">
              <select class="form-input" onchange="updateDeliveryField('ab_winner_rule', this.value)">
                <option value="open_rate" ${d.ab_winner_rule === 'open_rate' ? 'selected' : ''}>Open rate</option>
                <option value="click_rate" ${d.ab_winner_rule === 'click_rate' ? 'selected' : ''}>Click rate</option>
                <option value="delivered_rate" ${d.ab_winner_rule === 'delivered_rate' ? 'selected' : ''}>Delivered rate</option>
                <option value="ctor" ${d.ab_winner_rule === 'ctor' ? 'selected' : ''}>Click-to-open rate</option>
                <option value="conversion_rate" ${d.ab_winner_rule === 'conversion_rate' ? 'selected' : ''}>Conversion rate</option>
                <option value="revenue" ${d.ab_winner_rule === 'revenue' ? 'selected' : ''}>Revenue</option>
              </select>
              <select class="form-input" onchange="switchEmailVariant(this.value)">
                <option value="A" ${deliveryWizard.currentVariant === 'A' ? 'selected' : ''}>Variant A</option>
                <option value="B" ${deliveryWizard.currentVariant === 'B' ? 'selected' : ''}>Variant B</option>
              </select>
            </div>
            <div class="form-inline-actions ab-weighted-row">
              <select class="form-input" id="ab-weighted-metric">
                <option value="open_rate">Open rate</option>
                <option value="click_rate">Click rate</option>
                <option value="delivered_rate">Delivered rate</option>
                <option value="ctor">Click-to-open rate</option>
                <option value="conversion_rate">Conversion rate</option>
                <option value="revenue">Revenue</option>
              </select>
              <input class="form-input" type="number" min="1" max="100" value="50" id="ab-weighted-weight" placeholder="Weight %">
              <button class="btn btn-secondary" type="button" onclick="addAbWeightedMetric()">Add</button>
            </div>
            <div class="ab-weighted-summary" id="ab-weighted-summary">${renderAbWeightedSummary(d.ab_weighted_metrics || [])}</div>
            <div class="form-inline-actions ab-guardrail-row">
              <select class="form-input" id="ab-guardrail-metric">
                <option value="unsubscribe_rate">Unsubscribe rate</option>
                <option value="bounce_rate">Bounce rate</option>
                <option value="spam_rate">Spam complaint rate</option>
                <option value="delivered_rate">Delivered rate</option>
                <option value="open_rate">Open rate</option>
                <option value="click_rate">Click rate</option>
              </select>
              <select class="form-input" id="ab-guardrail-operator">
                <option value="<">≤</option>
                <option value=">">≥</option>
              </select>
              <input class="form-input" type="number" min="0" max="100" value="1" id="ab-guardrail-value" placeholder="%">
              <button class="btn btn-secondary" type="button" onclick="addAbGuardrail()">Add guardrail</button>
            </div>
            <div class="ab-guardrail-summary" id="ab-guardrail-summary">${renderAbGuardrailSummary(d.ab_guardrails || [])}</div>
          </div>
          <div class="email-editor-launch">
            <div>
              <h4>Email designer</h4>
              <p>Open the full-page editor to design the email content, manage assets, tracked URLs, and structure.</p>
              <div class="email-editor-meta">
                <span><strong>Subject:</strong> ${d.subject || '—'}</span>
                <span><strong>Blocks:</strong> ${(d.content_blocks || []).length}</span>
              </div>
            </div>
            <div>
              <button class="btn btn-primary" onclick="openEmailEditorPage()">Open Email Designer</button>
            </div>
          </div>
        </div>
      `;
    } else if (d.channel === 'SMS') {
      const smsMsg = d.content || '';
      const smsCharCount = smsMsg.length;
      const smsSegments = smsCharCount <= 160 ? 1 : Math.ceil(smsCharCount / 153);
      const optOut = d.sms_opt_out !== false;
      const optOutText = 'Reply STOP to unsubscribe';
      const previewText = smsMsg + (optOut ? '\n\n' + optOutText : '');
      html = `
        <div class="form-section compact-form">
          <h3 class="form-section-title">3. Content (SMS)</h3>
          <div class="sms-editor-layout">
            <div class="sms-editor-panel">
          <div class="form-group form-grid-full">
                <label class="form-label">Sender ID</label>
                <div class="personalize-input-row">
                  <input type="text" class="form-input" id="sms-sender-input" value="${d.sms_sender_id || ''}" placeholder="e.g. MyBrand or +1555..." oninput="updateDeliveryField('sms_sender_id', this.value)">
                  <button class="btn btn-icon personalize-btn" type="button" title="Insert personalization" onclick="openDeliveryPersonalizer('sms-sender-input', 'sms_sender_id')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg></button>
                </div>
                <span class="form-helper">Alphanumeric (max 11 chars) or phone number</span>
          </div>
          <div class="form-group form-grid-full">
            <label class="form-label">Message</label>
                <div class="personalize-input-row">
                  <textarea class="form-input sms-textarea" rows="5" maxlength="1600" id="sms-message-input" oninput="updateSmsContent(this.value)">${smsMsg}</textarea>
                  <button class="btn btn-icon personalize-btn" type="button" title="Insert personalization" onclick="openDeliveryPersonalizer('sms-message-input', 'content')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg></button>
                </div>
                <div class="sms-char-bar">
                  <div class="sms-char-count">
                    <span id="sms-char-num">${smsCharCount}</span> characters
                    <span class="sms-char-sep">&middot;</span>
                    <span id="sms-seg-num">${smsSegments}</span> segment${smsSegments !== 1 ? 's' : ''}
                  </div>
                  <div class="sms-char-limit ${smsCharCount > 160 ? 'warn' : ''}">${smsCharCount <= 160 ? 160 - smsCharCount + ' remaining' : 'Multi-segment'}</div>
                </div>
              </div>
              <div class="form-group form-grid-full">
                <div class="ai-compose-card" id="sms-ai-card">
                  <div class="ai-compose-header" onclick="toggleAiCompose('sms')">
                    <div class="ai-compose-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                      AI Compose
                    </div>
                    <svg class="ai-compose-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                  <div class="ai-compose-body" id="sms-ai-body" style="display:none">
                    <div class="ai-compose-row">
                      <div class="ai-compose-field">
                        <label class="form-label">What should the SMS be about?</label>
                        <textarea class="form-input" rows="2" id="sms-ai-prompt" placeholder="e.g. Flash sale on winter jackets, 40% off for VIP customers..."></textarea>
                      </div>
                    </div>
                    <div class="ai-compose-row ai-compose-settings">
                      <div class="ai-compose-field">
                        <label class="form-label">Tone</label>
                        <select class="form-input" id="sms-ai-tone">
                          <option value="professional">Professional</option>
                          <option value="friendly" selected>Friendly</option>
                          <option value="casual">Casual</option>
                          <option value="urgent">Urgent</option>
                          <option value="playful">Playful</option>
                          <option value="formal">Formal</option>
                        </select>
                      </div>
                      <div class="ai-compose-field">
                        <label class="form-label">Length</label>
                        <select class="form-input" id="sms-ai-length">
                          <option value="short">Short (&lt;100 chars)</option>
                          <option value="medium" selected>Medium (120-150)</option>
                          <option value="long">Full segment (160)</option>
                        </select>
                      </div>
                      <div class="ai-compose-field">
                        <label class="form-label">Language</label>
                        <select class="form-input" id="sms-ai-lang">
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="German">German</option>
                          <option value="Portuguese">Portuguese</option>
                          <option value="Italian">Italian</option>
                          <option value="Japanese">Japanese</option>
                          <option value="Chinese">Chinese</option>
                        </select>
                      </div>
                    </div>
                    <div class="ai-compose-actions">
                      <button class="btn btn-primary btn-sm" onclick="aiComposeSms('generate')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                        Generate
                      </button>
                      <button class="btn btn-secondary btn-sm" onclick="aiComposeSms('refine')" ${smsMsg ? '' : 'disabled'}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        Refine Current
                      </button>
                    </div>
                    <div class="ai-compose-results" id="sms-ai-results"></div>
                  </div>
                </div>
              </div>
              <div class="form-group form-grid-full">
                <label class="form-label">Options</label>
                <div class="sms-options">
                  <label class="sms-option-toggle">
                    <input type="checkbox" ${optOut ? 'checked' : ''} onchange="updateDeliveryField('sms_opt_out', this.checked); rerenderSmsPreview();">
                    <span>Auto-append opt-out message</span>
                  </label>
                  <label class="sms-option-toggle">
                    <input type="checkbox" ${d.sms_shorten_links ? 'checked' : ''} onchange="updateDeliveryField('sms_shorten_links', this.checked)">
                    <span>Shorten & track links</span>
                  </label>
                  <label class="sms-option-toggle">
                    <input type="checkbox" ${d.sms_unicode ? 'checked' : ''} onchange="updateDeliveryField('sms_unicode', this.checked)">
                    <span>Allow Unicode characters</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="sms-preview-panel">
              <div class="phone-mockup">
                <div class="phone-notch"></div>
                <div class="phone-status-bar">
                  <span>9:41</span>
                  <span class="phone-status-icons">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="6" width="4" height="12" rx="1"/><rect x="7" y="4" width="4" height="14" rx="1"/><rect x="13" y="2" width="4" height="16" rx="1"/><rect x="19" y="8" width="4" height="10" rx="1"/></svg>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/></svg>
                  </span>
                </div>
                <div class="phone-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  <span class="phone-header-title">${d.sms_sender_id || 'Brand'}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                </div>
                <div class="phone-messages" id="sms-preview-messages">
                  ${previewText ? '<div class="sms-bubble">' + previewText.replace(/\n/g, '<br>') + '</div>' : '<div class="sms-bubble sms-bubble-placeholder">Your message preview will appear here...</div>'}
                </div>
                <div class="phone-input-bar">
                  <div class="phone-input-field">Text Message</div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#007AFF" stroke="none"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (d.channel === 'Push') {
      const pushTitle = d.subject || '';
      const pushBody = d.content || '';
      const pushImage = d.push_image || '';
      const pushAction = d.push_action_url || '';
      const pushBtn1 = d.push_button_1 || '';
      const pushBtn2 = d.push_button_2 || '';
      const pushPlatform = d.push_platform || 'both';
      html = `
        <div class="form-section compact-form">
          <h3 class="form-section-title">3. Content (Push Notification)</h3>
          <div class="push-editor-layout">
            <div class="push-editor-panel">
              <div class="form-group form-grid-full">
                <label class="form-label form-label-required">Title</label>
                <div class="personalize-input-row">
                  <input type="text" class="form-input" value="${pushTitle}" maxlength="65" id="push-title-input" oninput="updatePushContent('subject', this.value)">
                  <button class="btn btn-icon personalize-btn" type="button" title="Insert personalization" onclick="openDeliveryPersonalizer('push-title-input', 'subject')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg></button>
                </div>
                <div class="push-char-count"><span id="push-title-chars">${pushTitle.length}</span>/65</div>
              </div>
              <div class="form-group form-grid-full">
                <label class="form-label form-label-required">Body</label>
                <div class="personalize-input-row">
                  <textarea class="form-input" rows="3" maxlength="240" id="push-body-input" oninput="updatePushContent('content', this.value)">${pushBody}</textarea>
                  <button class="btn btn-icon personalize-btn" type="button" title="Insert personalization" onclick="openDeliveryPersonalizer('push-body-input', 'content')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg></button>
                </div>
                <div class="push-char-count"><span id="push-body-chars">${pushBody.length}</span>/240</div>
              </div>
              <div class="form-group form-grid-full">
                <label class="form-label">Rich Media Image</label>
                <input type="text" class="form-input" value="${pushImage}" placeholder="https://example.com/image.png" oninput="updateDeliveryField('push_image', this.value); rerenderPushPreview();">
                <span class="form-helper">Recommended: 1024x512px, JPEG or PNG, max 1 MB</span>
              </div>
              <div class="form-group form-grid-full">
                <label class="form-label">On-Tap Action URL</label>
                <input type="text" class="form-input" value="${pushAction}" placeholder="https://yourapp.com/deeplink" oninput="updateDeliveryField('push_action_url', this.value)">
                <span class="form-helper">Where the user goes when they tap the notification</span>
              </div>
              <div class="form-group form-grid-full">
                <label class="form-label">Action Buttons (optional)</label>
                <div class="push-action-btns">
                  <input type="text" class="form-input" value="${pushBtn1}" placeholder="Button 1 label" oninput="updateDeliveryField('push_button_1', this.value); rerenderPushPreview();">
                  <input type="text" class="form-input" value="${pushBtn2}" placeholder="Button 2 label" oninput="updateDeliveryField('push_button_2', this.value); rerenderPushPreview();">
                </div>
              </div>
              <div class="form-group form-grid-full">
                <div class="ai-compose-card" id="push-ai-card">
                  <div class="ai-compose-header" onclick="toggleAiCompose('push')">
                    <div class="ai-compose-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                      AI Compose
                    </div>
                    <svg class="ai-compose-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                  <div class="ai-compose-body" id="push-ai-body" style="display:none">
                    <div class="ai-compose-row">
                      <div class="ai-compose-field">
                        <label class="form-label">What should the notification be about?</label>
                        <textarea class="form-input" rows="2" id="push-ai-prompt" placeholder="e.g. New arrivals in summer collection, re-engage inactive users..."></textarea>
                      </div>
                    </div>
                    <div class="ai-compose-row ai-compose-settings">
                      <div class="ai-compose-field">
                        <label class="form-label">Tone</label>
                        <select class="form-input" id="push-ai-tone">
                          <option value="professional">Professional</option>
                          <option value="friendly" selected>Friendly</option>
                          <option value="casual">Casual</option>
                          <option value="urgent">Urgent</option>
                          <option value="playful">Playful</option>
                          <option value="formal">Formal</option>
                        </select>
                      </div>
                      <div class="ai-compose-field">
                        <label class="form-label">Language</label>
                        <select class="form-input" id="push-ai-lang">
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="German">German</option>
                          <option value="Portuguese">Portuguese</option>
                          <option value="Italian">Italian</option>
                          <option value="Japanese">Japanese</option>
                          <option value="Chinese">Chinese</option>
                        </select>
                      </div>
                    </div>
                    <div class="ai-compose-actions">
                      <button class="btn btn-primary btn-sm" onclick="aiComposePush('generate')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                        Generate
                      </button>
                      <button class="btn btn-secondary btn-sm" onclick="aiComposePush('refine')" ${pushTitle || pushBody ? '' : 'disabled'}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        Refine Current
                      </button>
                    </div>
                    <div class="ai-compose-results" id="push-ai-results"></div>
                  </div>
                </div>
              </div>
              <div class="form-group form-grid-full">
                <label class="form-label">Target Platform</label>
                <div class="push-platform-bar">
                  <label class="push-platform-opt ${pushPlatform === 'both' ? 'active' : ''}">
                    <input type="radio" name="push_platform" value="both" ${pushPlatform === 'both' ? 'checked' : ''} onchange="updateDeliveryField('push_platform', 'both'); updatePushPlatformUI();">
                    Both
                  </label>
                  <label class="push-platform-opt ${pushPlatform === 'ios' ? 'active' : ''}">
                    <input type="radio" name="push_platform" value="ios" ${pushPlatform === 'ios' ? 'checked' : ''} onchange="updateDeliveryField('push_platform', 'ios'); updatePushPlatformUI();">
                    iOS
                  </label>
                  <label class="push-platform-opt ${pushPlatform === 'android' ? 'active' : ''}">
                    <input type="radio" name="push_platform" value="android" ${pushPlatform === 'android' ? 'checked' : ''} onchange="updateDeliveryField('push_platform', 'android'); updatePushPlatformUI();">
                    Android
                  </label>
                </div>
              </div>
              <div class="form-group form-grid-full">
                <label class="form-label">Options</label>
                <div class="sms-options">
                  <label class="sms-option-toggle">
                    <input type="checkbox" ${d.push_sound !== false ? 'checked' : ''} onchange="updateDeliveryField('push_sound', this.checked)">
                    <span>Play notification sound</span>
                  </label>
                  <label class="sms-option-toggle">
                    <input type="checkbox" ${d.push_badge ? 'checked' : ''} onchange="updateDeliveryField('push_badge', this.checked)">
                    <span>Update app badge count</span>
                  </label>
                  <label class="sms-option-toggle">
                    <input type="checkbox" ${d.push_collapse ? 'checked' : ''} onchange="updateDeliveryField('push_collapse', this.checked)">
                    <span>Collapse with previous notifications</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="push-preview-panel">
              <div class="phone-mockup phone-mockup-push">
                <div class="phone-notch"></div>
                <div class="phone-status-bar">
                  <span>9:41</span>
                  <span class="phone-status-icons">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="6" width="4" height="12" rx="1"/><rect x="7" y="4" width="4" height="14" rx="1"/><rect x="13" y="2" width="4" height="16" rx="1"/><rect x="19" y="8" width="4" height="10" rx="1"/></svg>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/></svg>
                  </span>
                </div>
                <div class="phone-lockscreen">
                  <div class="phone-lock-time">9:41</div>
                  <div class="phone-lock-date">Thursday, February 5</div>
                  <div class="push-notification-card" id="push-preview-card">
                    <div class="push-notif-header">
                      <div class="push-notif-app-icon">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      </div>
                      <span class="push-notif-app-name">YOUR APP</span>
                      <span class="push-notif-time">now</span>
                    </div>
                    <div class="push-notif-body">
                      <div class="push-notif-text">
                        <div class="push-notif-title" id="push-preview-title">${pushTitle || 'Notification Title'}</div>
                        <div class="push-notif-message" id="push-preview-body">${pushBody || 'Your notification message will appear here...'}</div>
                      </div>
                      ${pushImage ? '<img class="push-notif-thumb" src="' + pushImage + '" alt="">' : ''}
                    </div>
                    ${pushImage ? '<img class="push-notif-rich-image" src="' + pushImage + '" alt="" id="push-preview-image">' : '<div class="push-notif-rich-image push-notif-image-placeholder" id="push-preview-image" style="display:none"></div>'}
                    ${(pushBtn1 || pushBtn2) ? '<div class="push-notif-actions">' + (pushBtn1 ? '<button class="push-notif-action">' + pushBtn1 + '</button>' : '') + (pushBtn2 ? '<button class="push-notif-action">' + pushBtn2 + '</button>' : '') + '</div>' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }
  
  if (step === 4) {
    const tp = deliveryWizard.testProfile;
    const merge = (text) => tp ? clientMergePersonalization(text, tp) : text;
    let previewContent = '';
    let checksHtml = '';
    if (d.channel === 'Email') {
      const rawPreviewHtml = d.html_output || generateEmailHtml(getCurrentBlocks());
      const previewHtml = merge(rawPreviewHtml);
      const previewSubject = merge(d.subject || '');
      const checks = runDeliverabilityChecks(d.subject, rawPreviewHtml);
      checksHtml = checks.map(c => `<li class="${c.ok ? 'ok' : 'fail'}">${c.message}</li>`).join('');
      previewContent = `
        ${previewSubject ? `<div class="preview-subject-bar"><strong>Subject:</strong> ${previewSubject}</div>` : ''}
        <div class="email-preview">${previewHtml}</div>`;
    } else if (d.channel === 'SMS') {
      const smsMsg = merge(d.content || '');
      const optOut = d.sms_opt_out !== false;
      const optOutText = 'Reply STOP to unsubscribe';
      const fullMsg = smsMsg + (optOut && smsMsg ? '\n\n' + optOutText : '');
      const smsLen = (d.content || '').length;
      const smsSegs = smsLen <= 160 ? 1 : Math.ceil(smsLen / 153);
      const smsChecks = [
        { ok: smsLen > 0, message: smsLen > 0 ? 'Message content is not empty' : 'Message content is empty' },
        { ok: smsLen <= 160, message: smsLen <= 160 ? 'Single segment (' + smsLen + '/160 chars)' : 'Multi-segment: ' + smsSegs + ' segments (' + smsLen + ' chars)' },
        { ok: !!d.sms_sender_id, message: d.sms_sender_id ? 'Sender ID is set' : 'Sender ID is missing' },
        { ok: optOut, message: optOut ? 'Opt-out message included' : 'No opt-out message — may violate regulations' }
      ];
      checksHtml = smsChecks.map(c => `<li class="${c.ok ? 'ok' : 'fail'}">${c.message}</li>`).join('');
      previewContent = `
        <div class="preview-device-center">
          <div class="phone-mockup phone-mockup-sm">
            <div class="phone-notch"></div>
            <div class="phone-header">
              <span class="phone-header-title">${merge(d.sms_sender_id || 'Brand')}</span>
            </div>
            <div class="phone-messages">
              ${fullMsg ? '<div class="sms-bubble">' + fullMsg.replace(/</g, '&lt;').replace(/\n/g, '<br>') + '</div>' : '<div class="sms-bubble sms-bubble-placeholder">No message content</div>'}
            </div>
          </div>
        </div>`;
    } else if (d.channel === 'Push') {
      const pushSubject = merge(d.subject || '');
      const pushContent = merge(d.content || '');
      const pushChecks = [
        { ok: !!(d.subject), message: d.subject ? 'Title is set' : 'Title is missing' },
        { ok: !!(d.content), message: d.content ? 'Body is set' : 'Body is missing' },
        { ok: (d.subject || '').length <= 65, message: (d.subject || '').length <= 65 ? 'Title within limit (' + (d.subject || '').length + '/65)' : 'Title too long (' + (d.subject || '').length + '/65)' },
        { ok: (d.content || '').length <= 240, message: (d.content || '').length <= 240 ? 'Body within limit (' + (d.content || '').length + '/240)' : 'Body too long (' + (d.content || '').length + '/240)' },
        { ok: !!(d.push_action_url), message: d.push_action_url ? 'On-tap action URL set' : 'No on-tap action URL — notification will just open the app' }
      ];
      checksHtml = pushChecks.map(c => `<li class="${c.ok ? 'ok' : 'fail'}">${c.message}</li>`).join('');
      previewContent = `
        <div class="preview-device-center">
          <div class="phone-mockup phone-mockup-push phone-mockup-sm">
            <div class="phone-notch"></div>
            <div class="phone-lockscreen">
              <div class="phone-lock-time">9:41</div>
              <div class="phone-lock-date">Thursday, February 5</div>
              <div class="push-notification-card">
                <div class="push-notif-header">
                  <div class="push-notif-app-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  </div>
                  <span class="push-notif-app-name">YOUR APP</span>
                  <span class="push-notif-time">now</span>
                </div>
                <div class="push-notif-body">
                  <div class="push-notif-text">
                    <div class="push-notif-title">${pushSubject || 'Notification Title'}</div>
                    <div class="push-notif-message">${pushContent || 'Message body'}</div>
                  </div>
                </div>
                ${d.push_image ? '<img class="push-notif-rich-image" src="' + d.push_image + '" alt="">' : ''}
                ${(d.push_button_1 || d.push_button_2) ? '<div class="push-notif-actions">' + (d.push_button_1 ? '<button class="push-notif-action">' + d.push_button_1 + '</button>' : '') + (d.push_button_2 ? '<button class="push-notif-action">' + d.push_button_2 + '</button>' : '') + '</div>' : ''}
              </div>
            </div>
          </div>
        </div>`;
    }
    html = `
      <div class="form-section compact-form">
        <h3 class="form-section-title">4. Preview & Proof</h3>
        ${buildTestProfilePickerHtml()}
        ${previewContent}
        <div class="form-group">
          <label class="form-label">${d.channel === 'Email' ? 'Deliverability' : 'Validation'} Checks</label>
          <ul class="deliverability-list">
            ${checksHtml}
          </ul>
        </div>
        ${d.channel === 'Email' ? `
        <div class="form-group">
          <label class="form-label">Proof Emails (comma separated)</label>
          <input type="text" class="form-input" value="${(d.proof_emails || []).join(', ')}" oninput="updateProofEmails(this.value)">
        </div>
        <div class="form-inline-actions">
          <button class="btn btn-secondary" onclick="sendProofEmails()">Send Proof</button>
        </div>
        ` : d.channel === 'SMS' ? `
        <div class="form-group">
          <label class="form-label">Test Phone Number</label>
          <input type="text" class="form-input" placeholder="+1 555-0100" id="sms-test-number">
        </div>
        <div class="form-inline-actions">
          <button class="btn btn-secondary" onclick="sendTestSms()">Send Test SMS</button>
        </div>
        ` : `
        <div class="form-group">
          <label class="form-label">Test Device Token or Email</label>
          <input type="text" class="form-input" placeholder="Device token or email" id="push-test-target">
        </div>
        <div class="form-inline-actions">
          <button class="btn btn-secondary" onclick="sendTestPush()">Send Test Push</button>
        </div>
        `}
      </div>
    `;
  }
  
  if (step === 5) {
    html = `
      <div class="form-section">
        <h3 class="form-section-title">5. Publish</h3>
        <div class="preview-meta">
          <div><strong>Name:</strong> ${d.name || '-'}</div>
          <div><strong>Channel:</strong> ${d.channel}</div>
          <div><strong>Delivery:</strong> ${d.scheduled_at ? 'Scheduled for ' + new Date(d.scheduled_at).toLocaleString() : 'Send immediately on publish'}</div>
          <div><strong>Audience:</strong> ${d.audience_id || '—'}</div>
          <div><strong>Segment:</strong> ${d.segment_id || '—'}</div>
        </div>
        <div class="form-inline-actions">
          <button class="btn btn-primary" onclick="publishDelivery()">Publish</button>
          <button class="btn btn-secondary" onclick="sendDeliveryNow()">Send now</button>
        </div>
      </div>
    `;
  }
  
  document.getElementById('delivery-step-content').innerHTML = html;
  if (step === 1 && d.sto_enabled) {
    loadSTOInsights();
  }
  if (step === 2 && d.wave_enabled) {
    renderWaveSchedulePreview();
    if (d.wave_ramp_type === 'custom') renderCustomWaveFields();
    if (d.wave_timing_mode === 'custom_times') renderCustomWaveTimeFields();
  }
  if (step === 3 && d.channel === 'Email') {
    initEmailDesigner();
  }
}

function updateDeliveryField(field, value) {
  deliveryWizard.data[field] = value;
  // Re-render STO insights when channel changes and STO is enabled
  if (field === 'channel' && deliveryWizard.data.sto_enabled && _stoInsightsCache) {
    renderSTOInsights(_stoInsightsCache);
  }
}

function renderWorkflowScheduleContext() {
  const wfs = deliveryWizard.workflowSchedules || [];
  if (wfs.length === 0) return '';

  const cards = wfs.map(ws => {
    const statusColor = ws.workflow_status === 'active' ? '#10b981' : ws.workflow_status === 'draft' ? '#f59e0b' : '#6b7280';
    const statusIcon = ws.workflow_status === 'active'
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 3 20 12 6 21 6 3"/></svg>'
      : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';

    // Schedule description
    let schedDesc = '';
    if (ws.trigger_type === 'manual') {
      schedDesc = 'Manual trigger (run on demand)';
    } else if (ws.frequency) {
      const freqLabels = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', hourly: 'Hourly' };
      schedDesc = '<strong>' + (freqLabels[ws.frequency] || ws.frequency) + '</strong>';
      if (ws.recurring_day) schedDesc += ' on ' + ws.recurring_day;
      if (ws.recurring_time) schedDesc += ' at ' + ws.recurring_time;
    } else if (ws.scheduled_at) {
      schedDesc = 'Scheduled: <strong>' + new Date(ws.scheduled_at).toLocaleString() + '</strong>';
    } else {
      schedDesc = 'No schedule configured';
    }

    // Delivery timing within workflow
    let timingDesc = '';
    if (ws.wait_before_delivery_minutes > 0) {
      const h = Math.floor(ws.wait_before_delivery_minutes / 60);
      const m = ws.wait_before_delivery_minutes % 60;
      const durStr = h > 0 ? (m > 0 ? h + 'h ' + m + 'min' : h + 'h') : m + 'min';
      timingDesc = 'This delivery sends <strong>' + durStr + ' after</strong> workflow starts';
    } else {
      timingDesc = 'This delivery sends <strong>immediately</strong> when workflow starts';
    }

    let estTime = '';
    if (ws.estimated_delivery_time) {
      estTime = '<div style="margin-top:6px;padding:6px 10px;background:#dcfce7;border-radius:6px;font-size:11px;color:#166534">' +
        '<strong>Est. delivery time:</strong> ' + new Date(ws.estimated_delivery_time).toLocaleString() + '</div>';
    }

    return `
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:8px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><path d="M6 9v3a1 1 0 0 0 1 1h3"/><path d="M18 9v3a1 1 0 0 1-1 1h-3"/></svg>
            <a href="#" onclick="navigateTo('workflows','edit',${ws.workflow_id});return false" style="font-weight:600;color:#4f46e5;text-decoration:none;font-size:13px">${ws.workflow_name}</a>
          </div>
          <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:${statusColor};font-weight:500">${statusIcon} ${ws.workflow_status}</span>
        </div>
        <div style="font-size:12px;color:#374151;line-height:1.6">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Workflow schedule: ${schedDesc}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/></svg>
            <span>${timingDesc} (step ${ws.delivery_position} of ${ws.total_nodes})</span>
          </div>
        </div>
        ${estTime}
        <div style="margin-top:8px;display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 10px" onclick="syncWorkflowScheduleToDelivery(${JSON.stringify(ws).replace(/"/g, '&quot;')})">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
            Sync schedule from workflow
          </button>
          <button class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 10px" onclick="navigateTo('workflows','edit',${ws.workflow_id})">
            Open workflow
          </button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="form-section compact-form" style="margin-top:16px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><path d="M6 9v3a1 1 0 0 0 1 1h3"/><path d="M18 9v3a1 1 0 0 1-1 1h-3"/></svg>
        <h3 class="form-section-title" style="margin:0">Workflow Schedule</h3>
        <span class="badge badge-info" style="font-size:11px">${wfs.length} workflow${wfs.length > 1 ? 's' : ''}</span>
      </div>
      <p class="form-helper" style="margin:-2px 0 12px">This delivery is used in the following workflow(s). The delivery timing is determined by the workflow schedule and any wait steps before it.</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${cards}
      </div>
    </div>
  `;
}

function syncWorkflowScheduleToDelivery(ws) {
  if (ws.scheduled_at) {
    // If workflow has a specific scheduled time, calculate estimated delivery time
    const wfStart = new Date(ws.scheduled_at);
    const estDelivery = new Date(wfStart.getTime() + (ws.wait_before_delivery_minutes || 0) * 60000);
    deliveryWizard.data.scheduled_at = estDelivery.toISOString().slice(0, 16);
    showToast('Schedule synced from workflow: ' + estDelivery.toLocaleString(), 'success');
  } else if (ws.frequency && ws.recurring_time) {
    // For recurring workflows, set schedule to the next occurrence
    const now = new Date();
    const [hh, mm] = ws.recurring_time.split(':');
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hh), parseInt(mm));
    if (next <= now) next.setDate(next.getDate() + 1);
    const waitMs = (ws.wait_before_delivery_minutes || 0) * 60000;
    const estDelivery = new Date(next.getTime() + waitMs);
    deliveryWizard.data.scheduled_at = estDelivery.toISOString().slice(0, 16);
    showToast('Schedule synced from recurring workflow (' + ws.frequency + ')', 'success');
  } else {
    deliveryWizard.data.scheduled_at = null;
    showToast('Workflow uses manual trigger — delivery set to send immediately', 'info');
  }
  syncWave1WithSchedule();
  renderDeliveryStepContent();
}

function clearDeliverySchedule() {
  deliveryWizard.data.scheduled_at = null;
  syncWave1WithSchedule();
  renderDeliveryStepContent();
}

function showDeliverySchedulePicker() {
  if (!deliveryWizard.data.scheduled_at) {
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    deliveryWizard.data.scheduled_at = tomorrow.toISOString().slice(0, 16);
  }
  syncWave1WithSchedule();
  renderDeliveryStepContent();
}

function syncWave1WithSchedule() {
  const d = deliveryWizard.data;
  if (d.wave_custom_times && d.wave_custom_times.length > 0) {
    d.wave_custom_times[0] = d.scheduled_at || new Date().toISOString().slice(0, 16);
  }
}

/* ── Send Time Optimization ─────────────────────────────────── */
let _stoInsightsCache = null;

function toggleSTO(enabled) {
  deliveryWizard.data.sto_enabled = enabled;
  const panel = document.getElementById('sto-settings');
  if (panel) panel.style.display = enabled ? 'block' : 'none';
  if (enabled) loadSTOInsights();
}

async function loadSTOInsights() {
  const container = document.getElementById('sto-insights-container');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:12px;color:#6b7280;font-size:12px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite;vertical-align:-3px;margin-right:6px"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Loading system-wide STO insights...</div>';
  try {
    if (!_stoInsightsCache) {
      const resp = await fetch('/api/deliveries/sto-insights');
      _stoInsightsCache = await resp.json();
    }
    renderSTOInsights(_stoInsightsCache);
  } catch (e) {
    container.innerHTML = '<div style="padding:8px;color:#6b7280;font-size:12px">Could not load STO insights.</div>';
  }
}

function renderSTOInsights(data) {
  const container = document.getElementById('sto-insights-container');
  if (!container || !data || !data.available) {
    if (container) container.innerHTML = '<div style="padding:8px;color:#6b7280;font-size:12px">No historical data available for STO recommendations yet.</div>';
    return;
  }

  const ch = (deliveryWizard.data.channel || 'email').toLowerCase();
  const channelInsight = data.by_channel?.[ch];
  const overall = data.overall;
  const insight = channelInsight || overall;
  if (!insight) { container.innerHTML = ''; return; }

  const channelLabel = ch === 'email' ? 'Email' : ch === 'sms' ? 'SMS' : ch === 'push' ? 'Push' : 'All';

  // Best hours bar
  const bestHoursHtml = (insight.best_hours || []).map((h, i) => {
    const colors = ['#10b981', '#3b82f6', '#8b5cf6'];
    const medals = ['#fbbf24', '#94a3b8', '#cd7f32'];
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;${i < 2 ? 'border-bottom:1px solid #f1f5f9;' : ''}">
      <span style="width:20px;height:20px;border-radius:50%;background:${medals[i]};color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center">${i + 1}</span>
      <span style="font-weight:600;font-size:13px;min-width:48px">${h.label}</span>
      <div style="flex:1;height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${Math.min(100, parseFloat(h.pct_of_total) * 3)}%;background:${colors[i]};border-radius:3px"></div>
      </div>
      <span style="font-size:11px;color:#6b7280;min-width:36px;text-align:right">${h.pct_of_total}%</span>
    </div>`;
  }).join('');

  // Best days chips
  const bestDaysHtml = (insight.best_days || []).map((d, i) => {
    const colors = ['#dcfce7', '#dbeafe', '#ede9fe'];
    const textColors = ['#15803d', '#1d4ed8', '#6d28d9'];
    return `<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:12px;background:${colors[i]};color:${textColors[i]};font-size:11px;font-weight:600">${d.day} <span style="font-weight:400;opacity:0.8">${d.pct_of_total}%</span></span>`;
  }).join(' ');

  // Best slots (peak combos)
  const bestSlotsHtml = (insight.best_slots || []).map(s =>
    `<span style="display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:6px;background:#fef3c7;color:#92400e;font-size:11px;font-weight:500"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4"/><circle cx="12" cy="12" r="4"/><path d="M12 18v4"/></svg>${s.label}</span>`
  ).join(' ');

  // Avoid hours
  const avoidHtml = (insight.avoid_hours || []).map(h =>
    `<span style="padding:3px 8px;border-radius:6px;background:#fef2f2;color:#dc2626;font-size:11px;font-weight:500">${h.label}</span>`
  ).join(' ');

  // STO adoption & lift
  let stoAdoptionHtml = '';
  const sto = insight.sto_adoption;
  if (sto) {
    const liftBadge = sto.lift_pct !== null
      ? `<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px;background:${parseFloat(sto.lift_pct) > 0 ? '#dcfce7' : '#fef2f2'};color:${parseFloat(sto.lift_pct) > 0 ? '#15803d' : '#dc2626'};font-size:11px;font-weight:600">${parseFloat(sto.lift_pct) > 0 ? '+' : ''}${sto.lift_pct}% open rate lift</span>`
      : '<span style="font-size:11px;color:#6b7280">Not enough data to compare</span>';
    stoAdoptionHtml = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-top:1px solid #f1f5f9;margin-top:8px">
        <div style="font-size:12px;color:#374151">
          <strong>${sto.enabled_count}</strong> of ${sto.total_count} ${channelLabel} deliveries use STO (<strong>${sto.pct}%</strong>)
        </div>
        <div>${liftBadge}</div>
      </div>`;
  }

  // Channel tabs for switching view
  const channelOptions = Object.keys(data.by_channel || {});
  const channelTabsHtml = channelOptions.length > 1
    ? `<div style="display:flex;gap:4px;margin-bottom:10px">${channelOptions.map(c => {
        const isActive = c === ch;
        const label = c === 'email' ? 'Email' : c === 'sms' ? 'SMS' : 'Push';
        const ci = data.by_channel[c];
        return `<button onclick="switchSTOInsightChannel('${c}')" style="padding:3px 10px;border-radius:12px;border:1px solid ${isActive ? '#4f46e5' : '#e2e8f0'};background:${isActive ? '#eef2ff' : '#fff'};color:${isActive ? '#4f46e5' : '#6b7280'};font-size:11px;font-weight:${isActive ? '600' : '400'};cursor:pointer">${label} (${ci?.delivery_count || 0})</button>`;
      }).join('')}</div>`
    : '';

  container.innerHTML = `
    <div style="background:linear-gradient(135deg, #f0f9ff 0%, #eff6ff 50%, #f5f3ff 100%);border:1px solid #bfdbfe;border-radius:10px;padding:14px 16px;margin-top:12px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/><circle cx="12" cy="12" r="4"/></svg>
        <span style="font-weight:700;font-size:13px;color:#1e293b">System-Wide STO Insights</span>
        <span style="font-size:11px;color:#6b7280">Based on ${insight.delivery_count} ${channelLabel.toLowerCase()} deliver${insight.delivery_count === 1 ? 'y' : 'ies'} &bull; ${(insight.total_sent || 0).toLocaleString()} messages</span>
      </div>

      ${channelTabsHtml}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <!-- Best Hours -->
        <div style="background:#fff;border-radius:8px;padding:10px 12px;border:1px solid #e2e8f0">
          <div style="font-size:11px;font-weight:600;color:#374151;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" style="vertical-align:-1px;margin-right:4px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Peak Hours
          </div>
          ${bestHoursHtml}
        </div>

        <!-- Best Days -->
        <div style="background:#fff;border-radius:8px;padding:10px 12px;border:1px solid #e2e8f0">
          <div style="font-size:11px;font-weight:600;color:#374151;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" style="vertical-align:-1px;margin-right:4px"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            Best Days
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">${bestDaysHtml}</div>

          <div style="font-size:11px;font-weight:600;color:#374151;margin:12px 0 6px;text-transform:uppercase;letter-spacing:0.5px">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" style="vertical-align:-1px;margin-right:4px"><polygon points="12 2 15.1 8.3 22 9.2 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.2 8.9 8.3 12 2"/></svg>
            Peak Slots
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">${bestSlotsHtml}</div>
        </div>
      </div>

      <!-- Avoid & Adoption row -->
      <div style="margin-top:10px;background:#fff;border-radius:8px;padding:10px 12px;border:1px solid #e2e8f0">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <div style="font-size:11px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" style="vertical-align:-1px;margin-right:4px"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            Avoid Sending
          </div>
          ${avoidHtml}
        </div>
        ${stoAdoptionHtml}
      </div>

      <div style="margin-top:8px;font-size:11px;color:#6b7280;display:flex;align-items:center;gap:4px">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        STO will automatically schedule sends during peak engagement windows for each recipient.
      </div>
    </div>`;
}

function switchSTOInsightChannel(ch) {
  if (!_stoInsightsCache) return;
  deliveryWizard._stoViewChannel = ch;
  renderSTOInsightsForChannel(ch);
}

function renderSTOInsightsForChannel(ch) {
  if (!_stoInsightsCache) return;
  // Temporarily override channel to render for that channel
  const origCh = deliveryWizard.data.channel;
  deliveryWizard.data.channel = ch;
  renderSTOInsights(_stoInsightsCache);
  deliveryWizard.data.channel = origCh;
}

/* ── Wave Sending ────────────────────────────────────────────── */
function toggleWaveSending(enabled) {
  deliveryWizard.data.wave_enabled = enabled;
  const panel = document.getElementById('wave-settings');
  if (panel) {
    panel.style.display = enabled ? 'block' : 'none';
    if (enabled) {
      toggleWaveTimingMode();
      renderWaveSchedulePreview();
    }
  }
}

function updateWaveConfig(field, value) {
  deliveryWizard.data[field] = value;
  // When wave count changes, reset custom percentages and custom times
  if (field === 'wave_count') {
    if (deliveryWizard.data.wave_ramp_type === 'custom') {
      deliveryWizard.data.wave_custom_pcts = null;
      renderCustomWaveFields();
    }
    if (deliveryWizard.data.wave_timing_mode === 'custom_times') {
      deliveryWizard.data.wave_custom_times = null;
      renderCustomWaveTimeFields();
    }
  }
  renderWaveSchedulePreview();
}

function toggleWaveTimingMode() {
  const d = deliveryWizard.data;
  const intervalGroup = document.getElementById('wave-interval-group');
  const customTimesContainer = document.getElementById('custom-wave-times');
  if (d.wave_timing_mode === 'custom_times') {
    if (intervalGroup) intervalGroup.style.display = 'none';
    if (customTimesContainer) customTimesContainer.style.display = 'block';
    renderCustomWaveTimeFields();
  } else {
    if (intervalGroup) intervalGroup.style.display = 'block';
    if (customTimesContainer) customTimesContainer.style.display = 'none';
  }
  renderWaveSchedulePreview();
}

function renderCustomWaveTimeFields() {
  const d = deliveryWizard.data;
  const count = d.wave_count || 3;
  const container = document.getElementById('custom-wave-times');
  if (!container) return;

  // Initialize custom times if not set or wrong length
  if (!d.wave_custom_times || d.wave_custom_times.length !== count) {
    const baseTime = d.scheduled_at ? new Date(d.scheduled_at) : new Date();
    d.wave_custom_times = [];
    for (let i = 0; i < count; i++) {
      if (i === 0) {
        // Wave 1 = delivery scheduled time
        d.wave_custom_times.push(d.scheduled_at || baseTime.toISOString().slice(0, 16));
      } else {
        // Subsequent waves default to +1h increments
        const t = new Date(baseTime.getTime() + i * 60 * 60000);
        d.wave_custom_times.push(t.toISOString().slice(0, 16));
      }
    }
  }

  // Ensure wave 1 always matches the delivery schedule
  if (d.scheduled_at) {
    d.wave_custom_times[0] = d.scheduled_at;
  }

  const schedLabel = d.scheduled_at
    ? new Date(d.scheduled_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  const fieldsHtml = d.wave_custom_times.map((t, i) => {
    const isFirst = i === 0;
    const val = t || '';
    const minVal = i > 0 && d.wave_custom_times[i - 1] ? d.wave_custom_times[i - 1] : '';
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;${i > 0 ? 'border-top:1px solid #f1f5f9;' : ''}">
        <span style="width:60px;font-size:12px;font-weight:600;color:${isFirst ? '#4f46e5' : '#374151'}">Wave ${i + 1}</span>
        ${isFirst
          ? `<div style="flex:1;display:flex;align-items:center;gap:8px">
              <input type="datetime-local" class="form-input" value="${val}" style="flex:1;font-size:12px;background:#eef2ff;border-color:#c7d2fe" disabled title="Wave 1 is aligned with delivery schedule">
              <span style="font-size:11px;color:#4f46e5;white-space:nowrap">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:3px"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                Aligned with delivery schedule
              </span>
            </div>`
          : `<input type="datetime-local" class="form-input" value="${val}" ${minVal ? 'min="' + minVal + '"' : ''} style="flex:1;font-size:12px" onchange="updateCustomWaveTime(${i}, this.value)">`
        }
      </div>`;
  }).join('');

  let validationHtml = '';
  if (d.wave_custom_times.length > 1) {
    const issues = [];
    for (let i = 1; i < d.wave_custom_times.length; i++) {
      if (d.wave_custom_times[i] && d.wave_custom_times[i - 1]) {
        if (new Date(d.wave_custom_times[i]) <= new Date(d.wave_custom_times[i - 1])) {
          issues.push('Wave ' + (i + 1) + ' must be after Wave ' + i);
        }
      }
    }
    if (issues.length > 0) {
      validationHtml = `<div style="color:#ef4444;font-size:12px;margin-top:4px;display:flex;align-items:center;gap:4px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        ${issues.join('; ')}
      </div>`;
    }
  }

  container.innerHTML = `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-top:8px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <label class="form-label" style="margin:0;font-weight:600;font-size:13px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Custom Wave Schedule
        </label>
        ${!d.scheduled_at ? '<span style="font-size:11px;color:#f59e0b;display:flex;align-items:center;gap:3px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>Set delivery schedule in Step 1 to auto-align Wave 1</span>' : ''}
      </div>
      <p class="form-helper" style="margin:0 0 8px;font-size:11px">Wave 1 is automatically aligned with the delivery schedule. Set specific times for subsequent waves.</p>
      ${fieldsHtml}
      ${validationHtml}
    </div>`;
}

function updateCustomWaveTime(waveIndex, value) {
  const d = deliveryWizard.data;
  if (!d.wave_custom_times) return;
  d.wave_custom_times[waveIndex] = value;
  renderCustomWaveTimeFields();
  renderWaveSchedulePreview();
}

function computeWaveDistribution() {
  const d = deliveryWizard.data;
  const count = d.wave_count || 3;
  const startPct = d.wave_start_pct || 10;
  const ramp = d.wave_ramp_type || 'linear';
  const interval = d.wave_interval_minutes || 60;
  const timingMode = d.wave_timing_mode || 'interval';
  let pcts = [];

  if (ramp === 'custom') {
    const customPcts = d.wave_custom_pcts || [];
    if (customPcts.length === count) {
      pcts = customPcts.map(v => parseInt(v) || 0);
    } else {
      const eachPct = Math.floor(100 / count);
      pcts = Array(count).fill(eachPct);
      pcts[pcts.length - 1] += (100 - eachPct * count);
    }
  } else if (ramp === 'equal') {
    const eachPct = Math.floor(100 / count);
    pcts = Array(count).fill(eachPct);
    pcts[pcts.length - 1] += (100 - eachPct * count);
  } else if (ramp === 'exponential') {
    pcts.push(startPct);
    let remaining = 100 - startPct;
    for (let i = 1; i < count; i++) {
      if (i === count - 1) {
        pcts.push(remaining);
      } else {
        const next = Math.min(Math.round(pcts[i - 1] * 2), remaining);
        pcts.push(next);
        remaining -= next;
      }
    }
  } else if (ramp === 'front_loaded') {
    const bigWave = Math.round(100 * 0.6);
    pcts.push(bigWave);
    const rem = 100 - bigWave;
    const each = Math.floor(rem / (count - 1));
    for (let i = 1; i < count; i++) {
      pcts.push(i === count - 1 ? rem - each * (count - 2) : each);
    }
  } else {
    pcts.push(startPct);
    const remaining = 100 - startPct;
    const step = Math.floor(remaining / (count - 1));
    for (let i = 1; i < count; i++) {
      pcts.push(i === count - 1 ? remaining - step * (count - 2) : step);
    }
  }

  // Compute schedule-aware times
  const scheduledAt = d.scheduled_at ? new Date(d.scheduled_at) : null;

  if (timingMode === 'custom_times' && d.wave_custom_times && d.wave_custom_times.length === count) {
    // Custom times mode: each wave has an explicit datetime
    const waves = pcts.map((pct, idx) => {
      const waveTime = d.wave_custom_times[idx] ? new Date(d.wave_custom_times[idx]) : null;
      const offsetMinutes = (scheduledAt && waveTime) ? Math.round((waveTime - scheduledAt) / 60000) : idx * interval;
      return {
        wave: idx + 1,
        pct,
        offsetMinutes,
        sendAt: waveTime ? waveTime.toISOString() : null,
        sendAtFormatted: waveTime ? waveTime.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null
      };
    });
    return waves;
  }

  // Interval mode: compute absolute send times from delivery schedule
  const waves = pcts.map((pct, idx) => {
    const offsetMinutes = idx * interval;
    let sendAt = null;
    let sendAtFormatted = null;
    if (scheduledAt) {
      const waveTime = new Date(scheduledAt.getTime() + offsetMinutes * 60000);
      sendAt = waveTime.toISOString();
      sendAtFormatted = waveTime.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    return { wave: idx + 1, pct, offsetMinutes, sendAt, sendAtFormatted };
  });
  return waves;
}

function toggleCustomWaveInputs() {
  const d = deliveryWizard.data;
  const container = document.getElementById('custom-wave-inputs');
  if (!container) return;
  const isCustom = d.wave_ramp_type === 'custom';
  container.style.display = isCustom ? 'block' : 'none';
  if (isCustom) renderCustomWaveFields();
}

function renderCustomWaveFields() {
  const d = deliveryWizard.data;
  const count = d.wave_count || 3;
  const fieldsContainer = document.getElementById('custom-wave-fields');
  if (!fieldsContainer) return;

  // Initialize custom percentages if not set or wrong length
  if (!d.wave_custom_pcts || d.wave_custom_pcts.length !== count) {
    const eachPct = Math.floor(100 / count);
    d.wave_custom_pcts = Array(count).fill(eachPct);
    d.wave_custom_pcts[count - 1] += (100 - eachPct * count);
  }

  fieldsContainer.innerHTML = d.wave_custom_pcts.map((pct, i) => `
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;min-width:70px">
      <label style="font-size:11px;color:#6b7280;font-weight:500">Wave ${i + 1}</label>
      <div style="position:relative;display:flex;align-items:center">
        <input type="number" min="1" max="100" value="${pct}"
          class="form-input" style="width:65px;text-align:center;padding-right:20px;font-weight:600"
          onchange="updateCustomWavePct(${i}, this.value)"
          oninput="validateCustomWaveTotal()">
        <span style="position:absolute;right:8px;color:#6b7280;font-size:12px;pointer-events:none">%</span>
      </div>
    </div>
  `).join('');

  validateCustomWaveTotal();
}

function updateCustomWavePct(index, value) {
  const d = deliveryWizard.data;
  const val = parseInt(value) || 0;
  if (!d.wave_custom_pcts) return;
  d.wave_custom_pcts[index] = Math.max(1, Math.min(99, val));
  validateCustomWaveTotal();
  renderWaveSchedulePreview();
}

function validateCustomWaveTotal() {
  const d = deliveryWizard.data;
  if (!d.wave_custom_pcts) return;
  const total = d.wave_custom_pcts.reduce((s, v) => s + (parseInt(v) || 0), 0);
  const badge = document.getElementById('custom-wave-total');
  const errorDiv = document.getElementById('custom-wave-error');

  if (badge) {
    badge.textContent = 'Total: ' + total + '%';
    if (total === 100) {
      badge.className = 'badge badge-success';
      badge.style.cssText = 'font-size:12px;background:#dcfce7;color:#166534;border:1px solid #86efac';
    } else if (total > 100) {
      badge.className = 'badge badge-danger';
      badge.style.cssText = 'font-size:12px;background:#fef2f2;color:#991b1b;border:1px solid #fca5a5';
    } else {
      badge.className = 'badge badge-warning';
      badge.style.cssText = 'font-size:12px;background:#fffbeb;color:#92400e;border:1px solid #fcd34d';
    }
  }

  if (errorDiv) {
    if (total !== 100) {
      errorDiv.style.display = 'block';
      errorDiv.textContent = total > 100
        ? 'Total exceeds 100%. Please reduce wave percentages by ' + (total - 100) + '%.'
        : 'Total is only ' + total + '%. Please add ' + (100 - total) + '% more across waves.';
    } else {
      errorDiv.style.display = 'none';
    }
  }
}

function formatDuration(minutes) {
  if (minutes === 0) return 'Immediately';
  if (minutes < 60) return minutes + ' min';
  const totalHours = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (totalHours < 24) {
    return m === 0 ? totalHours + 'h' : totalHours + 'h ' + m + 'min';
  }
  const days = Math.floor(totalHours / 24);
  const h = totalHours % 24;
  let result = days + (days === 1 ? ' day' : ' days');
  if (h > 0) result += ' ' + h + 'h';
  if (m > 0) result += ' ' + m + 'min';
  return result;
}

function getEstimatedAudienceSize() {
  const d = deliveryWizard.data;
  const segments = deliveryWizard.lists.segments || [];
  const audiences = deliveryWizard.lists.audiences || [];
  const seg = segments.find(s => s.id == d.segment_id);
  const aud = audiences.find(a => a.id == d.audience_id);
  return seg?.size || seg?.population || aud?.size || aud?.population || 0;
}

function renderWaveSchedulePreview() {
  const container = document.getElementById('wave-schedule-preview');
  if (!container) return;
  const waves = computeWaveDistribution();
  const totalMinutes = waves.length > 1 ? waves[waves.length - 1].offsetMinutes : 0;
  const maxPct = Math.max(...waves.map(w => w.pct));
  const audienceSize = getEstimatedAudienceSize();
  const hasSchedule = !!deliveryWizard.data.scheduled_at;
  const isCustomTimes = deliveryWizard.data.wave_timing_mode === 'custom_times';

  const barsHtml = waves.map(w => {
    const barHeight = Math.max(8, Math.round((w.pct / maxPct) * 60));
    const color = w.wave === 1 ? 'var(--color-primary, #6366f1)' : `hsl(${230 + (w.wave - 1) * 25}, 60%, ${55 + (w.wave - 1) * 5}%)`;
    const recipientCount = audienceSize > 0 ? Math.round(audienceSize * w.pct / 100) : 0;
    const timeLabel = w.sendAtFormatted
      ? w.sendAtFormatted
      : (w.wave === 1 ? 'Start' : '+' + formatDuration(w.offsetMinutes));
    return `
      <div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:4px">
        <span style="font-size:11px;font-weight:600;color:var(--text-primary, #1e293b)">${w.pct}%</span>
        ${audienceSize > 0 ? `<span style="font-size:10px;color:#4f46e5;font-weight:600">${recipientCount.toLocaleString()}</span>` : ''}
        <div style="width:100%;max-width:48px;height:${barHeight}px;background:${color};border-radius:4px 4px 0 0;transition:height 0.3s"></div>
        <div style="font-size:10px;font-weight:600;color:var(--text-secondary, #64748b)">Wave ${w.wave}</div>
        <div style="font-size:9px;color:var(--text-tertiary, #94a3b8);text-align:center;max-width:80px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${timeLabel}">${timeLabel}</div>
      </div>
    `;
  }).join('');

  // Schedule alignment notice
  let scheduleNotice = '';
  if (hasSchedule) {
    const schedTime = new Date(deliveryWizard.data.scheduled_at).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    scheduleNotice = `<div style="display:flex;align-items:center;gap:8px;margin-top:8px;padding:8px 12px;background:#f0fdf4;border-radius:6px;border:1px solid #86efac">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <span style="font-size:12px;color:#15803d"><strong>Wave 1 starts:</strong> ${schedTime} (aligned with delivery schedule)</span>
    </div>`;
  } else {
    scheduleNotice = `<div style="display:flex;align-items:center;gap:8px;margin-top:8px;padding:8px 12px;background:#fffbeb;border-radius:6px;border:1px solid #fcd34d">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      <span style="font-size:12px;color:#92400e">Set a delivery schedule (Step 1) to see actual send times per wave.</span>
    </div>`;
  }

  const audienceNotice = audienceSize > 0 ? `<div style="display:flex;align-items:center;gap:8px;margin-top:8px;padding:8px 12px;background:#eef2ff;border-radius:6px;border:1px solid #c7d2fe">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    <span style="font-size:12px;color:#3730a3"><strong>${audienceSize.toLocaleString()}</strong> total recipients across <strong>${waves.length}</strong> waves</span>
  </div>` : '';

  container.innerHTML = `
    <div style="background:var(--bg-secondary, #f8fafc);border:1px solid var(--border-default, #e2e8f0);border-radius:8px;padding:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <span style="font-size:12px;font-weight:600;color:var(--text-primary, #1e293b)">Wave Schedule Preview</span>
        <span style="font-size:11px;color:var(--text-secondary, #64748b)">${isCustomTimes ? 'Custom schedule' : 'Total duration: ' + formatDuration(totalMinutes)}</span>
      </div>
      <div style="display:flex;align-items:flex-end;gap:8px;padding:8px 0">
        ${barsHtml}
      </div>
      ${scheduleNotice}
      ${audienceNotice}
      <div style="border-top:1px solid var(--border-default, #e2e8f0);margin-top:12px;padding-top:12px">
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          <thead>
            <tr style="text-align:left;color:var(--text-secondary, #64748b)">
              <th style="padding:4px 8px;font-weight:600">Wave</th>
              <th style="padding:4px 8px;font-weight:600">% of Audience</th>
              ${audienceSize > 0 ? '<th style="padding:4px 8px;font-weight:600">Recipients</th>' : ''}
              <th style="padding:4px 8px;font-weight:600">Send Time</th>
            </tr>
          </thead>
          <tbody>
            ${waves.map(w => {
              const count = audienceSize > 0 ? Math.round(audienceSize * w.pct / 100) : 0;
              const timeCell = w.sendAtFormatted
                ? `<span style="color:#1e293b;font-weight:500">${w.sendAtFormatted}</span>${w.wave === 1 ? ' <span style="font-size:10px;color:#10b981;font-weight:500">(scheduled)</span>' : ''}`
                : `<span style="color:var(--text-secondary, #64748b)">${w.wave === 1 ? 'At scheduled time' : '+' + formatDuration(w.offsetMinutes)}</span>`;
              return `<tr style="border-top:1px solid var(--border-default, #e5e7eb)">
                <td style="padding:6px 8px;font-weight:600">${w.wave === 1 ? '<span style="display:inline-flex;align-items:center;gap:4px">Wave 1 <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>' : 'Wave ' + w.wave}</td>
                <td style="padding:6px 8px"><span style="background:#e0e7ff;color:#3730a3;padding:2px 8px;border-radius:10px;font-weight:600">${w.pct}%</span></td>
                ${audienceSize > 0 ? '<td style="padding:6px 8px;font-weight:600;color:#4f46e5">' + count.toLocaleString() + '</td>' : ''}
                <td style="padding:6px 8px">${timeCell}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function sendDeliveryNow() {
  deliveryWizard.data.scheduled_at = null;
  publishDelivery();
}

function switchEmailVariant(variant) {
  deliveryWizard.currentVariant = variant;
  renderEmailBlocks();
}

function getCurrentBlocks() {
  if (deliveryWizard.data.ab_test_enabled) {
    return deliveryWizard.blocksByVariant[deliveryWizard.currentVariant] || [];
  }
  return deliveryWizard.blocks;
}

function prevDeliveryStep() {
  if (deliveryWizard.currentStep > 1) {
    deliveryWizard.currentStep -= 1;
    renderDeliveryWizard();
  }
}

function nextDeliveryStep() {
  if (!validateDeliveryStep(deliveryWizard.currentStep)) return;
  if (deliveryWizard.currentStep < 5) {
    deliveryWizard.currentStep += 1;
    renderDeliveryWizard();
  } else {
    publishDelivery();
  }
}

function validateDeliveryStep(step) {
  if (step === 1) {
    const name = (deliveryWizard.data.name || '').trim();
    if (!name) {
      showToast('Delivery name is required', 'error');
      const nameInput = document.querySelector('#delivery-step-content .form-input');
      if (nameInput) {
        nameInput.classList.add('input-error');
        nameInput.focus();
        nameInput.addEventListener('input', function handler() {
          nameInput.classList.remove('input-error');
          nameInput.removeEventListener('input', handler);
        });
      }
      return false;
    }
  }
  return true;
}

async function openSegmentBuilder() {
  if (!deliveryWizard.deliveryId) {
    await saveDeliveryDraft();
  }
  if (!deliveryWizard.deliveryId) {
    showToast('Save delivery draft before creating a segment', 'warning');
    return;
  }
  const defaultName = (deliveryWizard.data && deliveryWizard.data.name) ? String(deliveryWizard.data.name).trim() : '';
  const url = `/segment-builder.html?return=deliveries&deliveryId=${encodeURIComponent(deliveryWizard.deliveryId)}${defaultName ? '&defaultName=' + encodeURIComponent(defaultName) : ''}`;
  window.open(url, '_blank');
}

async function refreshDeliveryLists() {
  await loadDeliveryLists();
  renderDeliveryWizard();
}

function applyPendingSegmentSelection() {
  if (!deliveryWizard.deliveryId) return;
  const raw = localStorage.getItem('deliverySegmentSelection');
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data.deliveryId === deliveryWizard.deliveryId && data.segmentId) {
      deliveryWizard.data.segment_id = data.segmentId;
      deliveryWizard.currentStep = Math.max(deliveryWizard.currentStep, 2);
      localStorage.removeItem('deliverySegmentSelection');
    }
  } catch (error) {
    // ignore
  }
}

function applyPendingDeliveryStep() {
  const step = window.pendingDeliveryStep;
  if (!step || Number.isNaN(step)) return;
  deliveryWizard.currentStep = Math.max(deliveryWizard.currentStep, step);
  window.pendingDeliveryStep = null;
}

// ============================================
// DELIVERY PERSONALIZATION PICKER (shared by SMS & Push)
// ============================================
let _deliveryPersonalizeState = {
  targetInputId: null,
  targetField: null,
  tables: [],
  loaded: false
};

async function openDeliveryPersonalizer(inputId, field) {
  _deliveryPersonalizeState.targetInputId = inputId;
  _deliveryPersonalizeState.targetField = field;

  // Create or show the picker popover
  let picker = document.getElementById('delivery-personalize-picker');
  if (!picker) {
    picker = document.createElement('div');
    picker.id = 'delivery-personalize-picker';
    picker.className = 'dp-picker';
    picker.innerHTML = '<div class="dp-picker-header">'
      + '<span class="dp-picker-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg> Personalization</span>'
      + '<button class="dp-picker-close" onclick="closeDeliveryPersonalizer()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>'
      + '</div>'
      + '<div class="dp-picker-search"><input type="text" class="form-input" placeholder="Search entities & attributes..." oninput="filterDeliveryPersonalizer(this.value)"></div>'
      + '<div class="dp-picker-body" id="dp-picker-body"><div class="dp-picker-loading">Loading entities...</div></div>';
    document.body.appendChild(picker);
  }

  // Position next to the button that was clicked
  const btn = event.currentTarget;
  const rect = btn.getBoundingClientRect();
  picker.style.top = rect.bottom + 4 + 'px';
  picker.style.left = Math.min(rect.left, window.innerWidth - 340) + 'px';
  picker.classList.add('open');

  // Load tables if needed
  if (!_deliveryPersonalizeState.loaded) {
    try {
      const resp = await fetch(API_BASE + '/query/tables');
      const data = await resp.json();
      _deliveryPersonalizeState.tables = data.tables || [];
      _deliveryPersonalizeState.loaded = true;
    } catch (e) {
      _deliveryPersonalizeState.tables = [];
    }
  }
  renderDeliveryPersonalizerTree(_deliveryPersonalizeState.tables);
}

function closeDeliveryPersonalizer() {
  const picker = document.getElementById('delivery-personalize-picker');
  if (picker) picker.classList.remove('open');
}

// Close when clicking outside
document.addEventListener('click', function(e) {
  const picker = document.getElementById('delivery-personalize-picker');
  if (!picker || !picker.classList.contains('open')) return;
  if (picker.contains(e.target)) return;
  if (e.target.closest('.personalize-btn')) return;
  closeDeliveryPersonalizer();
});

function renderDeliveryPersonalizerTree(tables) {
  const body = document.getElementById('dp-picker-body');
  if (!body) return;
  if (!tables.length) {
    body.innerHTML = '<div class="dp-picker-empty">No entities found.</div>';
    return;
  }
  body.innerHTML = tables.map(function(table) {
    var cols = (table.fields || []).map(function(col) {
      return '<button type="button" class="dp-attr-item" onclick="insertDeliveryToken(\'' + table.name + '\', \'' + col + '\')">'
        + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/></svg>'
        + '<span class="dp-attr-name">' + col + '</span>'
        + '</button>';
    }).join('');
    return '<div class="dp-entity" data-entity="' + table.name + '">'
      + '<button type="button" class="dp-entity-row" onclick="toggleDpEntity(\'' + table.name + '\')">'
      + '<svg class="dp-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>'
      + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>'
      + '<span class="dp-entity-name">' + table.name + '</span>'
      + '<span class="dp-entity-count">' + (table.fields || []).length + '</span>'
      + '</button>'
      + '<div class="dp-attr-list">' + cols + '</div>'
      + '</div>';
  }).join('');
}

function toggleDpEntity(name) {
  var el = document.querySelector('.dp-entity[data-entity="' + name + '"]');
  if (el) el.classList.toggle('open');
}

function filterDeliveryPersonalizer(query) {
  var q = (query || '').toLowerCase();
  if (!q) {
    renderDeliveryPersonalizerTree(_deliveryPersonalizeState.tables);
    return;
  }
  var filtered = _deliveryPersonalizeState.tables.map(function(table) {
    var fields = (table.fields || []).filter(function(f) { return f.toLowerCase().indexOf(q) >= 0; });
    var matchesTable = table.name.toLowerCase().indexOf(q) >= 0;
    if (matchesTable) return table;
    if (fields.length) return { name: table.name, count: table.count, fields: fields };
    return null;
  }).filter(Boolean);
  renderDeliveryPersonalizerTree(filtered);
  // Auto-expand matched entities
  filtered.forEach(function(t) {
    var el = document.querySelector('.dp-entity[data-entity="' + t.name + '"]');
    if (el) el.classList.add('open');
  });
}

function insertDeliveryToken(entity, attribute) {
  var token = '{{' + entity + '.' + attribute + '}}';
  var inputId = _deliveryPersonalizeState.targetInputId;
  var field = _deliveryPersonalizeState.targetField;
  var input = document.getElementById(inputId);
  if (!input) { closeDeliveryPersonalizer(); return; }
  var start = input.selectionStart || input.value.length;
  var end = input.selectionEnd || input.value.length;
  var val = input.value;
  input.value = val.substring(0, start) + token + val.substring(end);
  input.focus();
  input.selectionStart = input.selectionEnd = start + token.length;

  // Update the delivery data and preview
  if (field === 'content') {
    if (deliveryWizard.data.channel === 'SMS') {
      updateSmsContent(input.value);
    } else {
      updatePushContent('content', input.value);
    }
  } else if (field === 'subject') {
    updatePushContent('subject', input.value);
  } else if (field === 'sms_sender_id') {
    updateDeliveryField('sms_sender_id', input.value);
  } else if (field) {
    updateDeliveryField(field, input.value);
  }
  closeDeliveryPersonalizer();
}

// ============================================
// SMS EDITOR HELPERS
// ============================================
function updateSmsContent(value) {
  deliveryWizard.data.content = value;
  const len = value.length;
  const segments = len <= 160 ? 1 : Math.ceil(len / 153);
  const charEl = document.getElementById('sms-char-num');
  const segEl = document.getElementById('sms-seg-num');
  if (charEl) charEl.textContent = len;
  if (segEl) segEl.textContent = segments;
  const limitEl = document.querySelector('.sms-char-limit');
  if (limitEl) {
    if (len <= 160) {
      limitEl.textContent = (160 - len) + ' remaining';
      limitEl.classList.remove('warn');
    } else {
      limitEl.textContent = 'Multi-segment';
      limitEl.classList.add('warn');
    }
  }
  rerenderSmsPreview();
}

function rerenderSmsPreview() {
  const container = document.getElementById('sms-preview-messages');
  if (!container) return;
  const d = deliveryWizard.data;
  const msg = d.content || '';
  const optOut = d.sms_opt_out !== false;
  const optOutText = 'Reply STOP to unsubscribe';
  const full = msg + (optOut && msg ? '\n\n' + optOutText : '');
  if (full) {
    container.innerHTML = '<div class="sms-bubble">' + full.replace(/</g, '&lt;').replace(/\n/g, '<br>') + '</div>';
  } else {
    container.innerHTML = '<div class="sms-bubble sms-bubble-placeholder">Your message preview will appear here...</div>';
  }
}

// ============================================
// PUSH EDITOR HELPERS
// ============================================
function updatePushContent(field, value) {
  deliveryWizard.data[field] = value;
  if (field === 'subject') {
    const charsEl = document.getElementById('push-title-chars');
    if (charsEl) charsEl.textContent = value.length;
    const previewEl = document.getElementById('push-preview-title');
    if (previewEl) previewEl.textContent = value || 'Notification Title';
  }
  if (field === 'content') {
    const charsEl = document.getElementById('push-body-chars');
    if (charsEl) charsEl.textContent = value.length;
    const previewEl = document.getElementById('push-preview-body');
    if (previewEl) previewEl.textContent = value || 'Your notification message will appear here...';
  }
}

function rerenderPushPreview() {
  const d = deliveryWizard.data;
  const titleEl = document.getElementById('push-preview-title');
  const bodyEl = document.getElementById('push-preview-body');
  const imgEl = document.getElementById('push-preview-image');
  if (titleEl) titleEl.textContent = d.subject || 'Notification Title';
  if (bodyEl) bodyEl.textContent = d.content || 'Your notification message will appear here...';
  if (imgEl) {
    if (d.push_image) {
      imgEl.src = d.push_image;
      imgEl.style.display = 'block';
      imgEl.classList.remove('push-notif-image-placeholder');
    } else {
      imgEl.style.display = 'none';
    }
  }
  // Update action buttons
  const card = document.getElementById('push-preview-card');
  if (card) {
    let actionsEl = card.querySelector('.push-notif-actions');
    if (d.push_button_1 || d.push_button_2) {
      if (!actionsEl) {
        actionsEl = document.createElement('div');
        actionsEl.className = 'push-notif-actions';
        card.appendChild(actionsEl);
      }
      actionsEl.innerHTML = (d.push_button_1 ? '<button class="push-notif-action">' + d.push_button_1 + '</button>' : '')
        + (d.push_button_2 ? '<button class="push-notif-action">' + d.push_button_2 + '</button>' : '');
    } else if (actionsEl) {
      actionsEl.remove();
    }
  }
}

function updatePushPlatformUI() {
  document.querySelectorAll('.push-platform-opt').forEach(el => {
    el.classList.toggle('active', el.querySelector('input').checked);
  });
}

// ============================================
// AI COMPOSE FUNCTIONS (SMS & Push)
// ============================================
function toggleAiCompose(channel) {
  const body = document.getElementById(channel + '-ai-body');
  const card = document.getElementById(channel + '-ai-card');
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  if (card) card.classList.toggle('open', !isOpen);
}

async function aiComposeSms(action) {
  const promptEl = document.getElementById('sms-ai-prompt');
  const prompt = promptEl ? promptEl.value.trim() : '';
  const tone = document.getElementById('sms-ai-tone')?.value || 'friendly';
  const length = document.getElementById('sms-ai-length')?.value || 'medium';
  const lang = document.getElementById('sms-ai-lang')?.value || 'English';
  const currentMessage = deliveryWizard.data.content || '';

  if (action === 'generate' && !prompt) {
    showToast('Please describe what the SMS should be about', 'warning');
    return;
  }

  const resultsEl = document.getElementById('sms-ai-results');
  if (resultsEl) resultsEl.innerHTML = '<div class="ai-compose-loading"><div class="spinner-sm"></div> Generating messages...</div>';

  try {
    const resp = await fetch(API_BASE + '/ai/generate-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, tone, length, language: lang, currentMessage, action })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Generation failed');

    const messages = data.messages || [];
    if (!messages.length) {
      if (resultsEl) resultsEl.innerHTML = '<div class="ai-compose-empty">No suggestions generated. Try a different prompt.</div>';
      return;
    }

    if (resultsEl) {
      resultsEl.innerHTML = '<div class="ai-results-title">' + (action === 'refine' ? 'Refined variations' : 'Generated messages') + '</div>'
        + messages.map(function(msg, i) {
          var chars = msg.length;
          var segs = chars <= 160 ? 1 : Math.ceil(chars / 153);
          return '<div class="ai-result-card" onclick="applySmsAiResult(this)">'
            + '<div class="ai-result-text">' + msg.replace(/</g, '&lt;') + '</div>'
            + '<div class="ai-result-meta">'
            + '<span>' + chars + ' chars &middot; ' + segs + ' segment' + (segs > 1 ? 's' : '') + '</span>'
            + '<button class="btn btn-sm btn-primary ai-result-apply">Use this</button>'
            + '</div>'
            + '</div>';
        }).join('');
    }
  } catch (e) {
    if (resultsEl) resultsEl.innerHTML = '<div class="ai-compose-empty">Error: ' + e.message + '</div>';
  }
}

function applySmsAiResult(card) {
  var textEl = card.querySelector('.ai-result-text');
  if (!textEl) return;
  var text = textEl.textContent;
  var ta = document.getElementById('sms-message-input');
  if (ta) {
    ta.value = text;
    updateSmsContent(text);
  }
  showToast('Message applied', 'success');
}

async function aiComposePush(action) {
  var promptEl = document.getElementById('push-ai-prompt');
  var prompt = promptEl ? promptEl.value.trim() : '';
  var tone = document.getElementById('push-ai-tone')?.value || 'friendly';
  var lang = document.getElementById('push-ai-lang')?.value || 'English';
  var currentTitle = deliveryWizard.data.subject || '';
  var currentBody = deliveryWizard.data.content || '';

  if (action === 'generate' && !prompt) {
    showToast('Please describe what the notification should be about', 'warning');
    return;
  }

  var resultsEl = document.getElementById('push-ai-results');
  if (resultsEl) resultsEl.innerHTML = '<div class="ai-compose-loading"><div class="spinner-sm"></div> Generating notifications...</div>';

  try {
    var resp = await fetch(API_BASE + '/ai/generate-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, tone, language: lang, currentTitle, currentBody, action })
    });
    var data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Generation failed');

    var notifications = data.notifications || [];
    if (!notifications.length) {
      if (resultsEl) resultsEl.innerHTML = '<div class="ai-compose-empty">No suggestions generated. Try a different prompt.</div>';
      return;
    }

    if (resultsEl) {
      resultsEl.innerHTML = '<div class="ai-results-title">' + (action === 'refine' ? 'Refined variations' : 'Generated notifications') + '</div>'
        + notifications.map(function(n, i) {
          return '<div class="ai-result-card" onclick="applyPushAiResult(' + i + ')" data-title="' + (n.title || '').replace(/"/g, '&quot;') + '" data-body="' + (n.body || '').replace(/"/g, '&quot;') + '">'
            + '<div class="ai-result-push-title">' + (n.title || '').replace(/</g, '&lt;') + '</div>'
            + '<div class="ai-result-text">' + (n.body || '').replace(/</g, '&lt;') + '</div>'
            + '<div class="ai-result-meta">'
            + '<span>Title: ' + (n.title || '').length + '/65 &middot; Body: ' + (n.body || '').length + '/240</span>'
            + '<button class="btn btn-sm btn-primary ai-result-apply">Use this</button>'
            + '</div>'
            + '</div>';
        }).join('');
    }
  } catch (e) {
    if (resultsEl) resultsEl.innerHTML = '<div class="ai-compose-empty">Error: ' + e.message + '</div>';
  }
}

function applyPushAiResult(index) {
  var cards = document.querySelectorAll('#push-ai-results .ai-result-card');
  var card = cards[index];
  if (!card) return;
  var title = card.dataset.title || '';
  var body = card.dataset.body || '';
  var titleInput = document.getElementById('push-title-input');
  var bodyInput = document.getElementById('push-body-input');
  if (titleInput) { titleInput.value = title; updatePushContent('subject', title); }
  if (bodyInput) { bodyInput.value = body; updatePushContent('content', body); }
  rerenderPushPreview();
  showToast('Notification applied', 'success');
}

function sendTestSms() {
  const num = document.getElementById('sms-test-number');
  const phone = num ? num.value.trim() : '';
  if (!phone) { showToast('Enter a phone number', 'warning'); return; }
  showToast('Test SMS sent to ' + phone, 'success');
}

function sendTestPush() {
  const el = document.getElementById('push-test-target');
  const target = el ? el.value.trim() : '';
  if (!target) { showToast('Enter a device token or email', 'warning'); return; }
  showToast('Test push notification sent to ' + target, 'success');
}

function updateProofEmails(value) {
  const emails = value.split(',').map(v => v.trim()).filter(Boolean);
  deliveryWizard.data.proof_emails = emails;
}

// ── Client-side personalization merge ──
function clientMergePersonalization(text, profile) {
  if (!text || !profile) return text;
  return text.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, entity, field) => {
    if (profile[field] !== undefined && profile[field] !== null) return String(profile[field]);
    return match;
  });
}

// ── Test Profile (contact) picker for proof and preview personalization ──
let _testProfileDebounce = null;
async function searchTestProfiles(query) {
  clearTimeout(_testProfileDebounce);
  if (!query || query.length < 2) {
    deliveryWizard.testProfileSearch = [];
    renderTestProfileResults();
    return;
  }
  _testProfileDebounce = setTimeout(async () => {
    try {
      const resp = await fetch(`${API_BASE}/contacts?search=${encodeURIComponent(query)}&limit=10`);
      const data = await resp.json();
      deliveryWizard.testProfileSearch = data.contacts || data || [];
      renderTestProfileResults();
    } catch (e) {
      deliveryWizard.testProfileSearch = [];
      renderTestProfileResults();
    }
  }, 300);
}

function renderTestProfileResults() {
  const list = document.getElementById('test-profile-results');
  if (!list) return;
  const results = deliveryWizard.testProfileSearch;
  if (!results.length) {
    list.innerHTML = '';
    list.classList.remove('open');
    return;
  }
  list.innerHTML = results.map(c => `
    <div class="test-profile-item" onclick="selectTestProfile(${c.id})">
      <span class="test-profile-name">${c.first_name || ''} ${c.last_name || ''}</span>
      <span class="test-profile-email">${c.email || ''}</span>
    </div>
  `).join('');
  list.classList.add('open');
}

function selectTestProfile(contactId) {
  const contact = deliveryWizard.testProfileSearch.find(c => c.id === contactId);
  if (!contact) return;
  deliveryWizard.testProfile = contact;
  deliveryWizard.testProfileSearch = [];
  // Re-render step 4 to update the preview with personalization
  renderDeliveryStepContent();
}

function clearTestProfile() {
  deliveryWizard.testProfile = null;
  renderDeliveryStepContent();
}

// Build the test profile picker HTML
function buildTestProfilePickerHtml() {
  const tp = deliveryWizard.testProfile;
  const selectedHtml = tp
    ? `<div class="test-profile-selected">
         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
         <span class="test-profile-selected-name">${tp.first_name || ''} ${tp.last_name || ''}</span>
         <span class="test-profile-selected-email">(${tp.email || ''})</span>
         <button class="test-profile-clear" onclick="clearTestProfile()" title="Clear">&times;</button>
       </div>`
    : '';
  return `
    <div class="form-group">
      <label class="form-label">Test Profile (for personalization)</label>
      <div class="test-profile-picker">
        ${selectedHtml}
        <input type="text" class="form-input" placeholder="Search contacts by name or email..." 
               oninput="searchTestProfiles(this.value)" 
               value=""
               ${tp ? 'style="display:none"' : ''}>
        <div class="test-profile-results" id="test-profile-results"></div>
      </div>
      <span class="form-helper">Select a contact to replace personalization tokens in the preview and proof email</span>
    </div>
  `;
}

async function goBackToWorkflow() {
  const from = deliveryWizard.fromWorkflow;
  if (!from || !from.workflowId) {
    loadDeliveries();
    return;
  }
  if (!deliveryWizard.deliveryId) {
    await saveDeliveryDraft();
    if (!deliveryWizard.deliveryId) {
      showToast('Save the delivery first, then use Back to Workflow', 'warning');
      return;
    }
  }
  const payload = {
    workflowId: from.workflowId,
    nodeId: from.nodeId,
    deliveryId: deliveryWizard.deliveryId,
    deliveryName: (deliveryWizard.data && deliveryWizard.data.name) || ''
  };
  try {
    localStorage.setItem('workflowDeliverySelection', JSON.stringify(payload));
    const base = window.location.pathname.replace(/\/index\.html$/, '') || '';
    window.location.href = `${base}/orchestration.html?workflowId=${encodeURIComponent(from.workflowId)}`;
  } catch (e) {
    showToast('Could not return to workflow', 'error');
  }
}

async function saveDeliveryDraft() {
  // Capture folder selection from form if on step 1
  if (typeof getSelectedFolderId === 'function') {
    const fid = getSelectedFolderId('delivery-folder-id');
    if (fid !== undefined) deliveryWizard.folder_id = fid;
  }
  const contentBlocks = deliveryWizard.data.ab_test_enabled ? deliveryWizard.blocksByVariant : deliveryWizard.blocks;
  const htmlOutput = deliveryWizard.data.ab_test_enabled ? {
    A: generateEmailHtml(deliveryWizard.blocksByVariant.A || []),
    B: generateEmailHtml(deliveryWizard.blocksByVariant.B || [])
  } : (deliveryWizard.data.html_output || generateEmailHtml(deliveryWizard.blocks));
  const payload = {
    ...deliveryWizard.data,
    folder_id: deliveryWizard.folder_id || null,
    status: 'draft',
    wizard_step: deliveryWizard.currentStep,
    last_saved_step: deliveryWizard.currentStep,
    content_blocks: contentBlocks,
    html_output: htmlOutput,
    proof_emails: deliveryWizard.data.proof_emails || [],
    draft_state: {
      ...deliveryWizard.data,
      content_blocks: contentBlocks,
      html_output: htmlOutput,
    proof_emails: deliveryWizard.data.proof_emails || []
    }
  };
  
  try {
    showLoading();
    const isEdit = !!deliveryWizard.deliveryId;
    const url = isEdit ? `/api/deliveries/${deliveryWizard.deliveryId}` : '/api/deliveries';
    const method = isEdit ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save delivery');
    deliveryWizard.deliveryId = data.id || deliveryWizard.deliveryId;
    showToast('Draft saved', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function publishDelivery() {
  if (!deliveryWizard.deliveryId) {
    await saveDeliveryDraft();
  }
  if (!deliveryWizard.deliveryId) return;
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${deliveryWizard.deliveryId}/publish`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to publish delivery');
    showToast('Delivery published', 'success');
    loadDeliveries();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function sendProofEmails() {
  if (!deliveryWizard.deliveryId) {
    await saveDeliveryDraft();
  }
  if (!deliveryWizard.deliveryId) return;
  const proofList = deliveryWizard.data.proof_emails || [];
  if (proofList.length === 0) {
    showToast('Enter at least one email address for proof', 'warning');
    return;
  }
  try {
    showLoading();
    const payload = { emails: proofList };
    // Include test profile for personalization if selected
    if (deliveryWizard.testProfile) {
      payload.test_profile_id = deliveryWizard.testProfile.id;
    }
    const response = await fetch(`/api/deliveries/${deliveryWizard.deliveryId}/proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to send proof emails');
    if (data.provider === 'brevo') {
      if (data.sent > 0) {
        showToast(`Proof email sent to ${data.sent} recipient(s) via Brevo`, 'success');
      } else {
        showToast(data.message || 'Failed to send proof — check Brevo configuration', 'error');
      }
    } else {
      showToast(data.message || 'Proof emails saved', 'success');
    }
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function insertTokenToSubject(token) {
  deliveryWizard.data.subject = `${deliveryWizard.data.subject || ''}${token}`;
  renderDeliveryWizard();
}

function getSelectedDeliveryAudienceLabel() {
  const d = deliveryWizard.data || {};
  const audiences = deliveryWizard.lists.audiences || [];
  const segments = deliveryWizard.lists.segments || [];
  const selectedAudience = audiences.find(a => String(a.id) === String(d.audience_id));
  const selectedSegment = segments.find(s => String(s.id) === String(d.segment_id));
  if (selectedAudience && selectedSegment) {
    return `${selectedAudience.name} + ${selectedSegment.name}`;
  }
  if (selectedAudience) return selectedAudience.name;
  if (selectedSegment) return selectedSegment.name;
  return 'General audience';
}

async function generateSubjectForDelivery() {
  const output = document.getElementById('delivery-subject-suggestions');
  if (!output) return;
  const productName = deliveryWizard.data.name || 'Campaign';
  const targetAudience = getSelectedDeliveryAudienceLabel();
  try {
    showLoading();
    const response = await fetch(`/api/ai/generate-subject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, targetAudience, count: 5 })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to generate subject lines');
    let html = '<h4>Suggested subject lines</h4>';
    data.subjects.forEach((subject, i) => {
      html += `<div class="ai-output-item ai-output-clickable" onclick="applyDeliverySubject('${subject.replace(/'/g, "\\'")}')">${i + 1}. ${subject}</div>`;
    });
    if (data.source === 'mock') {
      html += `<p class="ai-output-note">Note: ${data.message}</p>`;
    }
    output.innerHTML = html;
    output.classList.remove('hidden');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function applyDeliverySubject(subject) {
  const input = document.getElementById('delivery-subject-input');
  if (input) {
    input.value = subject;
  }
  updateDeliveryField('subject', subject);
}

function applyPersonalizationToken(selectId, inputId, field) {
  const select = document.getElementById(selectId);
  const input = document.getElementById(inputId);
  if (!select || !input || !select.value) return;
  const token = select.value;
  input.value = `${input.value || ''}${token}`;
  const targetField = field || (inputId === 'delivery-subject-input' ? 'subject' : null);
  if (targetField) updateDeliveryField(targetField, input.value);
  select.value = '';
}

async function openEmailEditorPage() {
  // Always save the latest wizard state (including any applied template)
  // before opening the editor, so the editor loads the current content.
    await saveDeliveryDraft();
  if (!deliveryWizard.deliveryId) {
    showToast('Save the delivery before editing content.', 'warning');
    return;
  }
  const url = `/email-designer.html?deliveryId=${encodeURIComponent(deliveryWizard.deliveryId)}&return=modal&step=3`;
  if (typeof window.openEmailEditorModal === 'function') {
    window.openEmailEditorModal(url, deliveryWizard.deliveryId);
    return;
  }
  window.location.href = url;
}

function applyTemplateToEmail() {
  const select = document.getElementById('delivery-template-select');
  if (!select || !select.value) return;
  const template = deliveryWizard.lists.templates.find(t => String(t.id) === String(select.value));
  if (!template) return;
  deliveryWizard.data.subject = template.subject || '';
  if (Array.isArray(template.blocks)) {
    deliveryWizard.blocks = template.blocks;
  }
  if (template.html) {
    deliveryWizard.data.html_output = template.html;
  }
  renderDeliveryWizard();
}

function _dwRenderTemplateCards(templates) {
  const catColors = { onboarding: '#2563EB', promotional: '#DC2626', newsletter: '#7C3AED', transactional: '#059669', event: '#D97706', retention: '#0891B2', custom: '#6B7280' };
  const catLabels = { onboarding: 'Onboarding', promotional: 'Promotional', newsletter: 'Newsletter', transactional: 'Transactional', event: 'Event', retention: 'Retention', custom: 'Custom' };

  if (!templates.length) {
    return '<div style="padding:24px;text-align:center;color:#9ca3af;">No templates available</div>';
  }

  return templates.map(t => {
    const color = catColors[t.category] || '#6B7280';
    const label = catLabels[t.category] || t.category || 'Custom';
    return `
      <div class="dw-tmpl-card" onclick="_dwApplyTemplate(${t.id})">
        <div class="dw-tmpl-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </div>
        <div class="dw-tmpl-card-info">
          <span class="dw-tmpl-cat" style="color:${color};">${label}</span>
          <div class="dw-tmpl-name">${t.name || 'Untitled'}</div>
          <div class="dw-tmpl-desc">${t.description || ''}</div>
        </div>
        <button class="btn btn-primary btn-sm dw-tmpl-use" onclick="event.stopPropagation();_dwApplyTemplate(${t.id})">Use</button>
      </div>
    `;
  }).join('');
}

function _dwSwitchTemplateTab(btn, tab) {
  const allTabs = btn.parentElement.querySelectorAll('.dw-tmpl-tab');
  allTabs.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const templates = deliveryWizard.lists.templates || [];
  const filtered = tab === 'sample' ? templates.filter(t => t.sample) : templates.filter(t => !t.sample);
  const grid = document.getElementById('dw-template-grid');
  if (grid) grid.innerHTML = _dwRenderTemplateCards(filtered);
}

async function _dwApplyTemplate(id) {
  try {
    showLoading();
    const resp = await fetch(`${API_BASE}/email-templates/${id}`);
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to load template');
    deliveryWizard.data.subject = data.subject || '';
    if (Array.isArray(data.blocks)) {
      deliveryWizard.blocks = data.blocks;
    }
    if (data.html) {
      deliveryWizard.data.html_output = data.html;
    }
    showToast(`Template "${data.name}" applied`, 'success');
    renderDeliveryWizard();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function showAbTestingHelp() {
  const message = `
    A/B testing sends two variants to a split audience.
    The winner is chosen by the selected rule (open or click rate),
    and can be applied to the remaining audience.
  `.replace(/\s+/g, ' ').trim();
  showToast(message, 'info');
}

function addAbWeightedMetric() {
  const metricEl = document.getElementById('ab-weighted-metric');
  const weightEl = document.getElementById('ab-weighted-weight');
  if (!metricEl || !weightEl) return;
  const metric = metricEl.value;
  const weight = Math.max(1, Math.min(100, parseInt(weightEl.value, 10) || 0));
  if (!metric || !weight) return;
  const list = deliveryWizard.data.ab_weighted_metrics || [];
  const existing = list.find(item => item.metric === metric);
  if (existing) {
    existing.weight = weight;
  } else {
    list.push({ metric, weight });
  }
  deliveryWizard.data.ab_weighted_metrics = list;
  renderAbWeightedSummary(list);
}

function removeAbWeightedMetric(metric) {
  const list = (deliveryWizard.data.ab_weighted_metrics || []).filter(item => item.metric !== metric);
  deliveryWizard.data.ab_weighted_metrics = list;
  renderAbWeightedSummary(list);
}

function renderAbWeightedSummary(list) {
  const container = document.getElementById('ab-weighted-summary');
  const items = (list || []).map(item => `
    <div class="ab-weighted-item">
      <span>${formatAbMetric(item.metric)}</span>
      <span>${item.weight}%</span>
      <button class="btn btn-ghost btn-sm" onclick="removeAbWeightedMetric('${item.metric}')">Remove</button>
    </div>
  `).join('');
  const total = (list || []).reduce((sum, item) => sum + (item.weight || 0), 0);
  const html = `
    ${items || '<div class="ab-weighted-empty">Add metrics to create a weighted score.</div>'}
    <div class="ab-weighted-total">Total weight: ${total}%</div>
  `;
  if (container) container.innerHTML = html;
  return html;
}

function formatAbMetric(metric) {
  const map = {
    open_rate: 'Open rate',
    click_rate: 'Click rate',
    delivered_rate: 'Delivered rate',
    ctor: 'Click-to-open rate',
    conversion_rate: 'Conversion rate',
    revenue: 'Revenue',
    unsubscribe_rate: 'Unsubscribe rate',
    bounce_rate: 'Bounce rate',
    spam_rate: 'Spam complaint rate'
  };
  return map[metric] || metric;
}

function addAbGuardrail() {
  const metricEl = document.getElementById('ab-guardrail-metric');
  const operatorEl = document.getElementById('ab-guardrail-operator');
  const valueEl = document.getElementById('ab-guardrail-value');
  if (!metricEl || !operatorEl || !valueEl) return;
  const metric = metricEl.value;
  const operator = operatorEl.value;
  const value = Math.max(0, Math.min(100, parseFloat(valueEl.value)));
  if (!metric || Number.isNaN(value)) return;
  const list = deliveryWizard.data.ab_guardrails || [];
  const existing = list.find(item => item.metric === metric);
  if (existing) {
    existing.operator = operator;
    existing.value = value;
  } else {
    list.push({ metric, operator, value });
  }
  deliveryWizard.data.ab_guardrails = list;
  renderAbGuardrailSummary(list);
}

function removeAbGuardrail(metric) {
  const list = (deliveryWizard.data.ab_guardrails || []).filter(item => item.metric !== metric);
  deliveryWizard.data.ab_guardrails = list;
  renderAbGuardrailSummary(list);
}

function renderAbGuardrailSummary(list) {
  const container = document.getElementById('ab-guardrail-summary');
  const items = (list || []).map(item => `
    <div class="ab-guardrail-item">
      <span>${formatAbMetric(item.metric)} ${item.operator} ${item.value}%</span>
      <button class="btn btn-ghost btn-sm" onclick="removeAbGuardrail('${item.metric}')">Remove</button>
    </div>
  `).join('');
  const html = items || '<div class="ab-guardrail-empty">No guardrails set.</div>';
  if (container) container.innerHTML = html;
  return html;
}

async function saveTemplateFromEmail() {
  // Show a save-as-template modal
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'dw-save-template-modal';
  overlay.innerHTML = `
    <div class="modal" style="max-width:440px;">
      <div class="modal-header">
        <h3>Save as content template</h3>
        <button class="modal-close" onclick="document.getElementById('dw-save-template-modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label form-label-required">Template name</label>
          <input class="form-input" id="dw-save-tmpl-name" placeholder="e.g. Welcome Email v2">
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input class="form-input" id="dw-save-tmpl-desc" placeholder="Brief description">
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-input" id="dw-save-tmpl-cat">
            <option value="custom">Custom</option>
            <option value="onboarding">Onboarding</option>
            <option value="promotional">Promotional</option>
            <option value="newsletter">Newsletter</option>
            <option value="transactional">Transactional</option>
            <option value="event">Event</option>
            <option value="retention">Retention</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('dw-save-template-modal').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="_dwDoSaveTemplate()">Save template</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('dw-save-tmpl-name').focus();
}

async function _dwDoSaveTemplate() {
  const name = document.getElementById('dw-save-tmpl-name')?.value?.trim();
  if (!name) { showToast('Please enter a template name', 'warning'); return; }
  const description = document.getElementById('dw-save-tmpl-desc')?.value?.trim() || '';
  const category = document.getElementById('dw-save-tmpl-cat')?.value || 'custom';

  const payload = {
    name,
    description,
    category,
    subject: deliveryWizard.data.subject || '',
    blocks: getCurrentBlocks(),
    html: generateEmailHtml(getCurrentBlocks()),
    status: 'published'
  };
  try {
    showLoading();
    const response = await fetch('/api/email-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save template');
    document.getElementById('dw-save-template-modal')?.remove();
    showToast(`Template "${name}" saved!`, 'success');
    await loadDeliveryLists();
    renderDeliveryWizard();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function runDeliverabilityChecks(subject, html) {
  const checks = [];
  const spamWords = ['free', 'winner', 'urgent', 'guarantee'];
  checks.push({ ok: !!subject, message: subject ? 'Subject present' : 'Subject missing' });
  const hasUnsub = html.toLowerCase().includes('unsubscribe');
  checks.push({ ok: hasUnsub, message: hasUnsub ? 'Unsubscribe link present' : 'Unsubscribe link missing' });
  const hasImages = html.toLowerCase().includes('<img');
  checks.push({ ok: hasImages, message: hasImages ? 'Contains images' : 'No images detected' });
  const spamHit = spamWords.find(w => subject.toLowerCase().includes(w));
  checks.push({ ok: !spamHit, message: !spamHit ? 'No common spam words detected' : `Spam word detected: ${spamHit}` });
  return checks;
}

// Email designer helpers
function initEmailDesigner() {
  const canvas = document.getElementById('email-designer-canvas');
  if (!canvas) return;
  
  document.querySelectorAll('.email-block-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.dataset.block);
    });
  });
  
  canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    addEmailBlock(type);
  });
  
  renderEmailBlocks();
}

function addEmailBlock(type) {
  const id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const base = { id, type };
  switch (type) {
    case 'text':
      base.content = 'Add your text here';
      break;
    case 'image':
      base.src = '';
      base.alt = 'Image';
      break;
    case 'button':
      base.text = 'Click me';
      base.url = 'https://example.com';
      break;
    case 'divider':
      base.thickness = 1;
      break;
    case 'spacer':
      base.height = 20;
      break;
    case 'html':
      base.html = '<div>Custom HTML</div>';
      break;
  }
  if (deliveryWizard.data.ab_test_enabled) {
    deliveryWizard.blocksByVariant[deliveryWizard.currentVariant] = deliveryWizard.blocksByVariant[deliveryWizard.currentVariant] || [];
    deliveryWizard.blocksByVariant[deliveryWizard.currentVariant].push(base);
  } else {
    deliveryWizard.blocks.push(base);
  }
  renderEmailBlocks();
}

function updateEmailBlock(id, field, value) {
  const blocks = getCurrentBlocks();
  const block = blocks.find(b => b.id === id);
  if (!block) return;
  block[field] = value;
  renderEmailBlocks();
}

function moveEmailBlock(id, direction) {
  const blocks = getCurrentBlocks();
  const idx = blocks.findIndex(b => b.id === id);
  if (idx === -1) return;
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= blocks.length) return;
  const temp = blocks[idx];
  blocks[idx] = blocks[swapIdx];
  blocks[swapIdx] = temp;
  renderEmailBlocks();
}

function deleteEmailBlock(id) {
  if (deliveryWizard.data.ab_test_enabled) {
    deliveryWizard.blocksByVariant[deliveryWizard.currentVariant] = (deliveryWizard.blocksByVariant[deliveryWizard.currentVariant] || []).filter(b => b.id !== id);
  } else {
    deliveryWizard.blocks = deliveryWizard.blocks.filter(b => b.id !== id);
  }
  renderEmailBlocks();
}

function renderEmailBlocks() {
  const canvas = document.getElementById('email-designer-canvas');
  if (!canvas) return;
  const blocks = getCurrentBlocks();
  if (!blocks.length) {
    canvas.innerHTML = '<div class="email-canvas-empty">Drag blocks to build your email</div>';
    return;
  }
  canvas.innerHTML = blocks.map(block => {
    let editor = '';
    if (block.type === 'text') {
      editor = `<textarea class="form-input" rows="3" oninput="updateEmailBlock('${block.id}','content', this.value)">${block.content || ''}</textarea>`;
    } else if (block.type === 'image') {
      editor = `
        <input class="form-input" type="text" placeholder="Image URL" value="${block.src || ''}" oninput="updateEmailBlock('${block.id}','src', this.value)">
        <input class="form-input" type="text" placeholder="Alt text" value="${block.alt || ''}" oninput="updateEmailBlock('${block.id}','alt', this.value)">
        <div class="form-inline-actions">
          <button class="btn btn-sm btn-secondary" onclick="openAssetPicker('${block.id}')">Choose from assets</button>
        </div>
      `;
    } else if (block.type === 'button') {
      editor = `
        <input class="form-input" type="text" placeholder="Button text" value="${block.text || ''}" oninput="updateEmailBlock('${block.id}','text', this.value)">
        <input class="form-input" type="text" placeholder="URL" value="${block.url || ''}" oninput="updateEmailBlock('${block.id}','url', this.value)">
      `;
    } else if (block.type === 'divider') {
      editor = `<input class="form-input" type="number" min="1" value="${block.thickness || 1}" oninput="updateEmailBlock('${block.id}','thickness', this.value)">`;
    } else if (block.type === 'spacer') {
      editor = `<input class="form-input" type="number" min="4" value="${block.height || 20}" oninput="updateEmailBlock('${block.id}','height', this.value)">`;
    } else if (block.type === 'html') {
      editor = `<textarea class="form-input" rows="3" oninput="updateEmailBlock('${block.id}','html', this.value)">${block.html || ''}</textarea>`;
    }
    return `
      <div class="email-block">
        <div class="email-block-header">
          <strong>${block.type.toUpperCase()}</strong>
          <div class="email-block-actions">
            <button class="btn btn-sm btn-secondary" onclick="moveEmailBlock('${block.id}','up')">↑</button>
            <button class="btn btn-sm btn-secondary" onclick="moveEmailBlock('${block.id}','down')">↓</button>
            <button class="btn btn-sm btn-secondary" onclick="deleteEmailBlock('${block.id}')">${_afIco('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 14)}</button>
          </div>
        </div>
        <div class="email-block-body">${editor}</div>
      </div>
    `;
  }).join('');
  
  deliveryWizard.data.html_output = generateEmailHtml(blocks);
}

function generateEmailHtml(blocks) {
  const html = blocks.map(block => {
    if (block.type === 'text') {
      return `<p style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">${block.content || ''}</p>`;
    }
    if (block.type === 'image') {
      return `<img src="${block.src || ''}" alt="${block.alt || ''}" style="max-width: 100%; display: block;">`;
    }
    if (block.type === 'button') {
      return `<a href="${block.url || '#'}" style="display:inline-block;padding:10px 16px;background:#1473E6;color:#fff;border-radius:4px;text-decoration:none;">${block.text || 'Button'}</a>`;
    }
    if (block.type === 'divider') {
      return `<hr style="border:none;border-top:${block.thickness || 1}px solid #E1E1E1;">`;
    }
    if (block.type === 'spacer') {
      return `<div style="height:${block.height || 20}px;"></div>`;
    }
    if (block.type === 'html') {
      return block.html || '';
    }
    return '';
  }).join('');
  
  return `<div style="max-width:640px;margin:0 auto;">${html}</div>`;
}

async function openAssetPicker(blockId) {
  const modal = document.getElementById('asset-picker-modal');
  if (!modal) {
    createAssetPickerModal();
  }
  const list = document.getElementById('asset-picker-list');
  if (!list) return;
  list.innerHTML = 'Loading assets...';
  try {
    const response = await fetch('/api/assets?type=image');
    const data = await response.json();
    const assets = data.assets || [];
    list.innerHTML = assets.map(a => `
      <div class="asset-item" onclick="selectAssetForBlock('${blockId}', '${a.url}')">
        <img src="${a.url}" alt="${a.name}">
        <div class="asset-name">${a.name}</div>
      </div>
    `).join('') || '<div class="empty-state">No assets found</div>';
    document.getElementById('asset-picker-modal').classList.remove('hidden');
  } catch (error) {
    showToast('Failed to load assets', 'error');
  }
}

function selectAssetForBlock(blockId, url) {
  updateEmailBlock(blockId, 'src', url);
  closeAssetPicker();
}

function closeAssetPicker() {
  const modal = document.getElementById('asset-picker-modal');
  if (modal) modal.classList.add('hidden');
}

function createAssetPickerModal() {
  const modal = document.createElement('div');
  modal.id = 'asset-picker-modal';
  modal.className = 'asset-picker-modal hidden';
  modal.innerHTML = `
    <div class="asset-picker-content">
      <div class="asset-picker-header">
        <h3>Asset Library</h3>
        <button class="btn btn-sm btn-secondary" onclick="closeAssetPicker()">${_afIco('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 14)}</button>
      </div>
      <div id="asset-picker-list" class="asset-picker-grid"></div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function sendDelivery(id) {
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${id}/send`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to send delivery');
    const providerLabel = data.provider === 'brevo' ? 'via Brevo' : '(simulated)';
    const detail = data.sent !== undefined ? ` — ${data.sent} sent` : '';
    showToast(`Delivery sent ${providerLabel}${detail}`, 'success');
    loadDeliveries();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

// ── Brevo Email Configuration ─────────────────────────────────
async function _refreshSendGridBadge() {
  try {
    const resp = await fetch('/api/deliveries/email-provider/status');
    const status = await resp.json();
    const badge = document.getElementById('sendgrid-status-badge');
    if (!badge) return;
    if (status.has_credentials && status.enabled) {
      badge.innerHTML = '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:#dcfce7;color:#166534;border-radius:9999px;font-size:11px;font-weight:600"><span style="width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block"></span>Brevo Active</span>';
    } else if (status.has_credentials && !status.enabled) {
      badge.innerHTML = '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:#f3e8ff;color:#6b21a8;border-radius:9999px;font-size:11px;font-weight:600"><span style="width:6px;height:6px;border-radius:50%;background:#a855f7;display:inline-block"></span>Brevo Paused</span>';
    } else {
      badge.innerHTML = '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:#fef3c7;color:#92400e;border-radius:9999px;font-size:11px;font-weight:600"><span style="width:6px;height:6px;border-radius:50%;background:#f59e0b;display:inline-block"></span>Simulated</span>';
    }
  } catch (e) { /* ignore */ }
}

function openSendGridConfig() {
  fetch('/api/deliveries/email-provider/status')
    .then(r => r.json())
    .then(status => {
      const hasCreds = status.has_credentials;
      const isEnabled = status.enabled;
      const isActive = hasCreds && isEnabled;
      const isPaused = hasCreds && !isEnabled;

      let statusBg, statusHtml;
      if (isActive) {
        statusBg = '#dcfce7';
        statusHtml = '<strong style="color:#166534">Active</strong> — Emails will be sent via Brevo SMTP from <strong>' + status.from_email + '</strong>';
      } else if (isPaused) {
        statusBg = '#f3e8ff';
        statusHtml = '<strong style="color:#6b21a8">Paused</strong> — Credentials are saved but sending is disabled. Emails will be simulated.';
      } else {
        statusBg = '#fef3c7';
        statusHtml = '<strong style="color:#92400e">Not configured</strong> — Emails are simulated. Enter your Brevo SMTP credentials below to enable real sending.';
      }

      const overlay = document.createElement('div');
      overlay.id = 'brevo-config-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;justify-content:center';
      overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
      overlay.innerHTML = `
        <div style="background:#fff;border-radius:12px;padding:24px;width:500px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.2)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3 style="margin:0;font-size:16px">Brevo Email Configuration</h3>
            <button class="btn btn-icon" onclick="document.getElementById('brevo-config-overlay').remove()">&times;</button>
          </div>
          <div style="margin-bottom:12px;padding:10px;border-radius:8px;background:${statusBg};font-size:13px">
            ${statusHtml}
          </div>
          ${hasCreds ? `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;margin-bottom:12px;border-radius:8px;border:1px solid ${isEnabled ? '#bbf7d0' : '#e9d5ff'};background:${isEnabled ? '#f0fdf4' : '#faf5ff'}">
            <div>
              <div style="font-size:13px;font-weight:600;color:#374151">Enable live sending</div>
              <div style="font-size:11px;color:#6b7280;margin-top:2px">${isEnabled ? 'Emails are sent via Brevo (uses your daily quota)' : 'Sending is paused — emails will be simulated'}</div>
            </div>
            <label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer">
              <input type="checkbox" id="brevo-enabled-toggle" ${isEnabled ? 'checked' : ''} onchange="toggleBrevoEnabled(this.checked)" style="opacity:0;width:0;height:0">
              <span style="position:absolute;inset:0;border-radius:12px;background:${isEnabled ? '#22c55e' : '#d1d5db'};transition:background 0.2s"></span>
              <span style="position:absolute;top:2px;left:${isEnabled ? '22px' : '2px'};width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:left 0.2s"></span>
            </label>
          </div>
          ` : ''}
          <div style="font-size:12px;color:#6b7280;margin-bottom:12px;padding:8px;background:#f0f9ff;border-radius:6px;border:1px solid #bae6fd">
            <strong>How to get your Brevo SMTP key:</strong><br>
            1. Sign up free at <a href="https://app.brevo.com" target="_blank" style="color:#2563eb">app.brevo.com</a> (300 emails/day)<br>
            2. Go to <a href="https://app.brevo.com/settings/keys/smtp" target="_blank" style="color:#2563eb">Settings &rarr; SMTP & API</a><br>
            3. Copy the SMTP Key and your login email
          </div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div>
              <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;color:#374151">SMTP Key *</label>
              <input type="password" id="brevo-smtp-key" class="form-input" placeholder="xsmtpsib-..." value="${hasCreds ? '••••••••••••••••••' : ''}" style="width:100%">
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;color:#374151">SMTP Login (Brevo account email) *</label>
              <input type="email" id="brevo-smtp-login" class="form-input" placeholder="you@example.com" value="${status.smtp_login || ''}" style="width:100%">
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;color:#374151">From Email * (sender address shown to recipients)</label>
              <input type="email" id="brevo-from-email" class="form-input" placeholder="marketing@yourdomain.com" value="${status.from_email || ''}" style="width:100%">
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;color:#374151">From Name</label>
              <input type="text" id="brevo-from-name" class="form-input" placeholder="CRM Marketing" value="${status.from_name || 'CRM Marketing'}" style="width:100%">
            </div>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">
            <button class="btn btn-secondary" onclick="document.getElementById('brevo-config-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" id="brevo-save-btn" onclick="saveBrevoConfig()">Save & Connect</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
    })
    .catch(() => showToast('Failed to load email provider status', 'error'));
}

async function saveBrevoConfig() {
  const smtpKey = document.getElementById('brevo-smtp-key').value.trim();
  const smtpLogin = document.getElementById('brevo-smtp-login').value.trim();
  const fromEmail = document.getElementById('brevo-from-email').value.trim();
  const fromName = document.getElementById('brevo-from-name').value.trim();

  if (!fromEmail) { showToast('From Email is required', 'error'); return; }
  if (!smtpLogin) { showToast('SMTP Login is required', 'error'); return; }
  if (!smtpKey && !smtpKey.startsWith('••')) { showToast('SMTP Key is required', 'error'); return; }

  const body = { from_email: fromEmail, from_name: fromName, smtp_login: smtpLogin };
  if (smtpKey && !smtpKey.startsWith('••')) body.smtp_key = smtpKey;

  const btn = document.getElementById('brevo-save-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Connecting...'; }

  try {
    const resp = await fetch('/api/deliveries/email-provider/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || data.message || 'Failed to configure');
    document.getElementById('brevo-config-overlay')?.remove();
    if (data.verified) {
      showToast('Brevo SMTP connected and verified!', 'success');
    } else if (data.configured) {
      showToast('Brevo configured — SMTP verify pending: ' + (data.verify_error || 'will verify on first send'), 'success');
    } else {
      showToast('Configuration saved', 'success');
    }
    _refreshSendGridBadge();
  } catch (err) {
    showToast(err.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Save & Connect'; }
  }
}

async function toggleBrevoEnabled(enabled) {
  try {
    const resp = await fetch('/api/deliveries/email-provider/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to toggle');
    showToast(data.message, 'success');
    _refreshSendGridBadge();
    // Re-open the dialog to refresh its state
    document.getElementById('brevo-config-overlay')?.remove();
    openSendGridConfig();
  } catch (err) {
    showToast(err.message, 'error');
    // Revert the checkbox
    const toggle = document.getElementById('brevo-enabled-toggle');
    if (toggle) toggle.checked = !enabled;
  }
}

async function pauseDelivery(id) {
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${id}/pause`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to pause delivery');
    showToast('Delivery paused', 'success');
    loadDeliveries();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function resumeDelivery(id) {
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${id}/resume`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to resume delivery');
    showToast('Delivery resumed', 'success');
    loadDeliveries();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function stopDelivery(id) {
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${id}/stop`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to stop delivery');
    showToast('Delivery stopped', 'success');
    loadDeliveries();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function approveDelivery(id) {
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${id}/approve`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to approve delivery');
    showToast('Delivery approved', 'success');
    loadDeliveries();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function showDeliveryReport(id, fromWorkflowId) {
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${id}/report`);
    const rpt = await response.json();
    if (!response.ok) throw new Error(rpt.error || 'Failed to load report');

    const d = rpt.delivery;
    const m = rpt.metrics;
    const r = rpt.rates;
    const ch = d.channel_key; // email | sms | push
    const cd = rpt.channel_data || {};

    const channelIcon =
      ch === 'email' ? _afIco('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>') :
      ch === 'sms' ? _afIco('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>') :
      _afIco('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>');

    const statusBadge = '<span class="badge badge-' + ({completed:'success','in-progress':'info',draft:'secondary',scheduled:'warning',paused:'warning',stopped:'danger',failed:'danger'}[d.status] || 'secondary') + '">' + d.status + '</span>';

    const backAction = fromWorkflowId
      ? `showWorkflowReport(${fromWorkflowId})`
      : `loadDeliveries()`;
    const backTitle = fromWorkflowId ? 'Back to Workflow Report' : 'Back to Deliveries';
    const wfBackBtn = fromWorkflowId
      ? `<button class="btn btn-secondary btn-sm" onclick="showWorkflowReport(${fromWorkflowId})" style="display:inline-flex;align-items:center;gap:4px">${BACK_CHEVRON} Workflow Report</button>`
      : '';

    // ── Header ──
    let html = `
    <div class="rpt-page">
      <div class="rpt-header card">
        <div class="rpt-header-left">
          <button class="btn-back" onclick="${backAction}" title="${backTitle}">${BACK_CHEVRON}</button>
          <div>
            <div class="rpt-header-title">${channelIcon} ${d.name}</div>
            <div class="rpt-header-sub">${d.channel} Delivery Report ${statusBadge} ${d.sent_at ? '&middot; Sent ' + new Date(d.sent_at).toLocaleString() : ''}</div>
          </div>
        </div>
        <div class="rpt-header-actions">
          ${wfBackBtn}
          <button class="btn btn-primary btn-sm" onclick="showDeliveryHeatmap(${id}${fromWorkflowId ? ', ' + fromWorkflowId : ''})">
            ${_afIco('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>', 14)} Hotclicks
          </button>
          <button class="btn btn-secondary btn-sm" onclick="exportDeliveryCSV(${id})">
            ${_afIco('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>', 14)} Export CSV
          </button>
        </div>
      </div>

    <!-- Tab Nav – Adobe Campaign v8 style -->
    <div class="rpt-tabs">
      <button class="rpt-tab active" data-tab="summary" onclick="switchDeliveryReportTab(this,'summary')">
        ${_afIco('<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>', 14)} Delivery Summary
      </button>
      <button class="rpt-tab" data-tab="tracking" onclick="switchDeliveryReportTab(this,'tracking')">
        ${_afIco('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>', 14)} Tracking Indicators
      </button>`;

    if (ch === 'email') {
      html += `<button class="rpt-tab" data-tab="urls" onclick="switchDeliveryReportTab(this,'urls')">
        ${_afIco('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>', 14)} URLs &amp; Click Streams
      </button>
      <button class="rpt-tab" data-tab="user-activities" onclick="switchDeliveryReportTab(this,'user-activities')">
        ${_afIco('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>', 14)} User Activities
      </button>`;
    }

    html += `<button class="rpt-tab" data-tab="non-deliverables" onclick="switchDeliveryReportTab(this,'non-deliverables')">
        ${_afIco('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>', 14)} Non-deliverables
      </button>
      <button class="rpt-tab" data-tab="throughput" onclick="switchDeliveryReportTab(this,'throughput')">
        ${_afIco('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>', 14)} Throughput
      </button>
    </div>`;

    // ═══════ TAB: Delivery Summary ═══════
    html += '<div class="rpt-tab-content" id="rpt-tab-summary">';

    // KPI row – common for all channels
    html += '<div class="rpt-section-title">Delivery Overview</div><div class="rpt-kpi-grid">';

    // KPIs depend on channel
    if (ch === 'email') {
      html += _rptKpi('Sent', m.sent, 'Total processed', '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>');
      html += _rptKpi('Delivered', m.delivered, r.delivery_rate + '% rate', '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>');
      html += _rptKpi('Total Opens', m.opens, r.open_rate + '% open rate', '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>');
      html += _rptKpi('Total Clicks', m.clicks, r.click_rate + '% CTR', '<path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/>');
      html += _rptKpi('CTOR', r.ctor + '%', 'Click-to-Open', '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>');
      html += _rptKpi('Bounced', m.bounced, r.bounce_rate + '% bounce', '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>');
      html += _rptKpi('Unsubscribed', m.unsubscribed, r.unsubscribe_rate + '%', '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" x2="16" y1="11" y2="11"/>');
    } else if (ch === 'sms') {
      html += _rptKpi('Total Sent', m.sent, 'Messages processed', '<path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/>');
      html += _rptKpi('Delivered', m.delivered, r.delivery_rate + '% success', '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>');
      html += _rptKpi('Click-through', m.clicks, r.click_rate + '% CTR', '<path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/>');
      html += _rptKpi('Errors', m.errors, r.error_rate + '% error rate', '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>');
      html += _rptKpi('Opt-outs', cd.opt_outs || 0, '', '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" x2="16" y1="11" y2="11"/>');
      html += _rptKpi('Total Cost', '$' + (cd.total_cost || 0).toFixed(2), '$' + (cd.avg_cost_per_sms || 0).toFixed(3) + '/msg', '<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>');
    } else { // push
      html += _rptKpi('Sent', m.sent, 'Messages processed', '<path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/>');
      html += _rptKpi('Delivered', m.delivered, r.delivery_rate + '% rate', '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>');
      html += _rptKpi('Impressions', cd.impressions || 0, '', '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>');
      html += _rptKpi('Direct Opens', cd.direct_opens || 0, r.click_rate + '% open rate', '<path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/>');
      html += _rptKpi('Dismissals', cd.dismissals || 0, '', '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>');
      html += _rptKpi('Errors', m.errors, r.error_rate + '%', '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>');
    }
    html += '</div>';

    // Engagement Timeline (in summary – Adobe Campaign v8 style)
    html += '<div class="rpt-section-title">Delivery Statistics</div>';
    html += '<div class="card"><div class="card-body"><canvas id="drpt-engagement-chart" style="max-height:280px;width:100%"></canvas></div></div>';

    // Targeted population (Adobe Campaign v8: Initial target population)
    html += `<div class="rpt-section-title">Initial Target Population</div>
      <div class="rpt-stats-table">
        <table><thead><tr><th></th><th>Count</th><th>Percentage</th></tr></thead><tbody>
          <tr><td>Initial target</td><td>${(rpt.summary.targeted || 0).toLocaleString()}</td><td>100%</td></tr>
          <tr><td>Messages to deliver</td><td>${(rpt.summary.to_deliver || 0).toLocaleString()}</td><td>${rpt.summary.targeted > 0 ? ((rpt.summary.to_deliver / rpt.summary.targeted) * 100).toFixed(1) : 0}%</td></tr>
          <tr><td>Exclusions</td><td>${(rpt.summary.excluded || 0).toLocaleString()}</td><td>${rpt.summary.targeted > 0 ? ((rpt.summary.excluded / rpt.summary.targeted) * 100).toFixed(1) : 0}%</td></tr>
        </tbody></table>
      </div>`;

    // Overall statistics
    html += `<div class="rpt-section-title">Overall Statistics</div>
      <div class="rpt-stats-table">
        <table><thead><tr><th></th><th>Count</th><th>Percentage</th></tr></thead><tbody>
          <tr class="rpt-row-success"><td>${_afIco('<path d="M20 6 9 17l-5-5"/>',14)} Success</td><td>${m.delivered.toLocaleString()}</td><td>${r.delivery_rate}%</td></tr>
          <tr class="rpt-row-error"><td>${_afIco('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',14)} Errors</td><td>${m.errors.toLocaleString()}</td><td>${r.error_rate}%</td></tr>
          <tr class="rpt-row-warning"><td>New quarantine</td><td>${(rpt.summary.new_quarantine || 0).toLocaleString()}</td><td>${m.sent > 0 ? ((rpt.summary.new_quarantine / m.sent) * 100).toFixed(1) : 0}%</td></tr>
        </tbody></table>
      </div>`;

    // Causes of Exclusion (Adobe Campaign v8 style)
    html += '<div class="rpt-section-title">Causes of Exclusion</div>';
    if (rpt.exclusions && rpt.exclusions.length > 0) {
      html += '<div class="rpt-grid-2"><div class="card"><div class="card-body"><canvas id="drpt-exclusion-chart" style="max-height:240px;width:100%"></canvas></div></div>';
      html += '<div class="rpt-stats-table"><table><thead><tr><th>Reason</th><th>Count</th><th>Percentage</th></tr></thead><tbody>';
      rpt.exclusions.forEach(function(e) { html += '<tr><td>' + e.reason + '</td><td>' + e.count.toLocaleString() + '</td><td>' + e.pct + '%</td></tr>'; });
      html += '</tbody></table></div></div>';
    } else {
      html += '<div style="text-align:center;padding:2rem;color:#94a3b8">No exclusions</div>';
    }

    // Broadcast Statistics (Adobe Campaign v8 – per-domain)
    if (ch === 'email' && rpt.broadcast_stats && rpt.broadcast_stats.length > 0) {
      html += '<div class="rpt-section-title">Broadcast Statistics</div><div class="rpt-stats-table"><table><thead><tr><th>Domain</th><th>Processed</th><th>Delivered</th><th>Hard Bounces</th><th>Soft Bounces</th><th>Opens</th><th>Clicks</th><th>Unsubs</th></tr></thead><tbody>';
      rpt.broadcast_stats.forEach(function(bs) {
        html += '<tr><td><strong>' + bs.domain + '</strong></td><td>' + bs.processed.toLocaleString() + '</td><td>' + bs.delivered_pct + '%</td><td>' + bs.hard_bounces_pct + '%</td><td>' + bs.soft_bounces_pct + '%</td><td>' + bs.opens_pct + '%</td><td>' + bs.clicks_pct + '%</td><td>' + bs.unsubs_pct + '%</td></tr>';
      });
      html += '</tbody></table></div>';
    }

    // Channel specific sections inside summary
    if (ch === 'sms' && cd.carrier_breakdown) {
      html += '<div class="rpt-section-title">Carrier Breakdown</div><div class="rpt-stats-table"><table><thead><tr><th>Carrier</th><th>Delivered</th><th>Share</th></tr></thead><tbody>';
      cd.carrier_breakdown.forEach(function(c) {
        html += '<tr><td>' + c.carrier + '</td><td>' + c.delivered.toLocaleString() + '</td><td>' + c.pct + '%</td></tr>';
      });
      html += '</tbody></table></div>';
    }

    if (ch === 'push' && cd.platform_breakdown) {
      var pb = cd.platform_breakdown;
      html += '<div class="rpt-section-title">Platform Breakdown</div><div class="rpt-stats-table"><table><thead><tr><th>Platform</th><th>Sent</th><th>Delivered</th><th>Opened</th></tr></thead><tbody>';
      html += '<tr><td>' + _afIco('<path d="M12 2a3 3 0 0 0-3 3v1H6a2 2 0 0 0-2 2v12a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V8a2 2 0 0 0-2-2h-3V5a3 3 0 0 0-3-3Z"/>',14) + ' iOS</td><td>' + (pb.ios.sent || 0).toLocaleString() + '</td><td>' + (pb.ios.delivered || 0).toLocaleString() + '</td><td>' + (pb.ios.opened || 0).toLocaleString() + '</td></tr>';
      html += '<tr><td>' + _afIco('<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',14) + ' Android</td><td>' + (pb.android.sent || 0).toLocaleString() + '</td><td>' + (pb.android.delivered || 0).toLocaleString() + '</td><td>' + (pb.android.opened || 0).toLocaleString() + '</td></tr>';
      html += '</tbody></table></div>';
    }

    if (ch === 'push' && cd.action_button_clicks && cd.action_button_clicks.length > 0) {
      html += '<div class="rpt-section-title">Action Button Performance</div><div class="rpt-stats-table"><table><thead><tr><th>Button</th><th>Clicks</th></tr></thead><tbody>';
      cd.action_button_clicks.forEach(function(b) { html += '<tr><td>' + b.button + '</td><td>' + b.clicks.toLocaleString() + '</td></tr>'; });
      html += '</tbody></table></div>';
    }

    html += '</div>'; // end summary tab

    // ═══════ TAB: Tracking Indicators (Adobe Campaign v8) ═══════
    html += '<div class="rpt-tab-content" id="rpt-tab-tracking" style="display:none">';

    // Delivery Statistics KPIs
    html += '<div class="rpt-section-title">Delivery Statistics</div>';
    html += '<div class="rpt-kpi-grid rpt-kpi-sm">';
    html += _rptKpi('Success', m.delivered.toLocaleString(), r.delivery_rate + '% of sent', '<path d="M20 6 9 17l-5-5"/>');
    html += _rptKpi('Distinct Opens', (cd.unique_opens || Math.round(m.opens * 0.72)).toLocaleString(), '', '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>');
    html += _rptKpi('Opens', m.opens.toLocaleString(), r.open_rate + '% open rate', '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>');
    html += _rptKpi('Opt-out Clicks', m.unsubscribed.toLocaleString(), r.unsubscribe_rate + '%', '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" x2="16" y1="11" y2="11"/>');
    html += _rptKpi('Mirror Link', (cd.mirror_page || Math.round(m.opens * 0.03)).toLocaleString(), '', '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/>');
    html += _rptKpi('Forwards', (cd.forwards || Math.round(m.opens * 0.02)).toLocaleString(), 'Estimation', '<path d="m22 2-7 20-4-9-9-4 20-7z"/>');
    html += '</div>';

    // Open and click-through rate table (Adobe Campaign v8)
    if (rpt.open_click_rate) {
      const ocr = rpt.open_click_rate;
      html += '<div class="rpt-section-title">Open and Click-through Rate</div>';
      html += '<div class="rpt-stats-table"><table><thead><tr><th>Metric</th><th>Value</th><th>Percentage</th></tr></thead><tbody>';
      html += '<tr><td>Sent</td><td>' + ocr.sent.toLocaleString() + '</td><td>—</td></tr>';
      html += '<tr><td>Complaints</td><td>' + ocr.complaints.toLocaleString() + '</td><td>' + (ocr.sent > 0 ? ((ocr.complaints / ocr.sent) * 100).toFixed(2) : 0) + '%</td></tr>';
      html += '<tr><td>Opens</td><td>' + ocr.opens.toLocaleString() + '</td><td>' + r.open_rate + '%</td></tr>';
      html += '<tr><td>Clicks</td><td>' + ocr.clicks.toLocaleString() + '</td><td>' + r.click_rate + '%</td></tr>';
      html += '<tr class="rpt-row-highlight"><td><strong>Raw Reactivity</strong></td><td>—</td><td><strong>' + ocr.raw_reactivity + '%</strong></td></tr>';
      html += '</tbody></table></div>';
    }

    // Tracking Statistics chart
    html += '<div class="rpt-section-title">Tracking Statistics</div>';
    html += '<div class="card"><div class="card-body"><canvas id="drpt-tracking-stats-chart" style="max-height:280px;width:100%"></canvas></div></div>';

    if (ch === 'email') {
      // Breakdown of Opens (Adobe Campaign v8)
      html += '<div class="rpt-section-title">Breakdown of Opens</div>';
      html += '<div class="rpt-grid-3">';

      // By Device
      html += '<div><div class="rpt-sub-title">By Device</div><div class="card"><div class="card-body"><canvas id="drpt-device-chart" style="max-height:200px;width:100%"></canvas></div></div>';
      if (cd.device_breakdown) {
        html += '<div class="rpt-mini-table"><table><tbody>';
        html += '<tr><td>Desktop</td><td>' + (cd.device_breakdown.desktop || 0).toLocaleString() + '</td><td>' + (m.opens > 0 ? ((cd.device_breakdown.desktop / m.opens) * 100).toFixed(1) : 0) + '%</td></tr>';
        html += '<tr><td>Mobile</td><td>' + (cd.device_breakdown.mobile || 0).toLocaleString() + '</td><td>' + (m.opens > 0 ? ((cd.device_breakdown.mobile / m.opens) * 100).toFixed(1) : 0) + '%</td></tr>';
        html += '<tr><td>Tablet</td><td>' + (cd.device_breakdown.tablet || 0).toLocaleString() + '</td><td>' + (m.opens > 0 ? ((cd.device_breakdown.tablet / m.opens) * 100).toFixed(1) : 0) + '%</td></tr>';
        html += '</tbody></table></div>';
      }
      html += '</div>';

      // By OS
      html += '<div><div class="rpt-sub-title">By OS</div><div class="card"><div class="card-body"><canvas id="drpt-os-chart" style="max-height:200px;width:100%"></canvas></div></div>';
      if (rpt.os_breakdown && rpt.os_breakdown.length > 0) {
        html += '<div class="rpt-mini-table"><table><tbody>';
        rpt.os_breakdown.forEach(function(o) { html += '<tr><td>' + o.os + '</td><td>' + o.count.toLocaleString() + '</td><td>' + o.pct + '%</td></tr>'; });
        html += '</tbody></table></div>';
      }
      html += '</div>';

      // By Browser
      html += '<div><div class="rpt-sub-title">By Browser</div><div class="card"><div class="card-body"><canvas id="drpt-browser-chart" style="max-height:200px;width:100%"></canvas></div></div>';
      if (rpt.browser_breakdown && rpt.browser_breakdown.length > 0) {
        html += '<div class="rpt-mini-table"><table><tbody>';
        rpt.browser_breakdown.forEach(function(b) { html += '<tr><td>' + b.browser + '</td><td>' + b.count.toLocaleString() + '</td><td>' + b.pct + '%</td></tr>'; });
        html += '</tbody></table></div>';
      }
      html += '</div>';
      html += '</div>'; // end rpt-grid-3

      // Mail Client
      html += '<div class="rpt-section-title">Mail Client</div><div class="rpt-stats-table"><table><thead><tr><th>Client</th><th>Share</th></tr></thead><tbody>';
      (cd.mail_clients || []).forEach(function(c) { html += '<tr><td>' + c.client + '</td><td><div class="rpt-bar-row"><div class="rpt-bar" style="width:' + c.pct + '%"></div><span>' + c.pct + '%</span></div></td></tr>'; });
      html += '</tbody></table></div>';

      // Geo
      html += '<div class="rpt-section-title">Geographic Performance</div><div class="rpt-stats-table"><table><thead><tr><th>Country</th><th>Opens</th><th>Clicks</th></tr></thead><tbody>';
      (cd.geo_breakdown || []).forEach(function(g) { html += '<tr><td><strong>' + g.country + '</strong></td><td>' + g.opens.toLocaleString() + '</td><td>' + g.clicks.toLocaleString() + '</td></tr>'; });
      html += '</tbody></table></div>';
    }

    // Recipients
    html += '<div class="rpt-section-title">Recipients</div>';
    html += '<div class="rpt-recip-tabs"><button class="rpt-recip-tab active" onclick="switchDrptRecipTab(this,\'engaged\')">Engaged</button><button class="rpt-recip-tab" onclick="switchDrptRecipTab(this,\'non-engaged\')">Non-Engaged</button><button class="rpt-recip-tab" onclick="switchDrptRecipTab(this,\'bounced\')">Bounced</button></div>';

    // Engaged
    html += '<div class="rpt-recip-content" id="drpt-engaged"><div class="rpt-stats-table"><table><thead><tr><th>Recipient</th><th>' + (ch === 'sms' ? 'Phone' : 'Email') + '</th><th>Sent</th>';
    if (ch === 'email') html += '<th>Opened</th><th>Clicked</th>';
    if (ch === 'sms') html += '<th>Delivered</th><th>Clicked</th>';
    if (ch === 'push') html += '<th>Delivered</th><th>Opened</th>';
    html += '<th>Engagement</th></tr></thead><tbody>';
    rpt.recipients.top_engaged.forEach(function(rc) {
      var engLabel = rc.engagement_score >= 3 ? '<span class="badge badge-success">High</span>' : rc.engagement_score >= 1 ? '<span class="badge badge-info">Medium</span>' : '<span class="badge badge-secondary">Low</span>';
      html += '<tr><td><strong>' + rc.name + '</strong></td><td>' + (ch === 'sms' ? (rc.phone || rc.email) : rc.email) + '</td><td>' + (rc.sent_at ? new Date(rc.sent_at).toLocaleDateString() : '-') + '</td>';
      if (ch === 'email') html += '<td>' + (rc.opened_at ? new Date(rc.opened_at).toLocaleString() : '-') + '</td><td>' + (rc.clicked_at ? new Date(rc.clicked_at).toLocaleString() : '-') + '</td>';
      if (ch === 'sms' || ch === 'push') html += '<td>' + (rc.opened_at ? new Date(rc.opened_at).toLocaleString() : 'Yes') + '</td><td>' + (rc.clicked_at ? new Date(rc.clicked_at).toLocaleString() : '-') + '</td>';
      html += '<td>' + engLabel + '</td></tr>';
    });
    if (rpt.recipients.top_engaged.length === 0) html += '<tr><td colspan="6" style="text-align:center;padding:1.5rem;color:#94a3b8">No engaged recipients yet</td></tr>';
    html += '</tbody></table></div></div>';

    // Non-engaged
    html += '<div class="rpt-recip-content" id="drpt-non-engaged" style="display:none"><div class="rpt-stats-table"><table><thead><tr><th>Recipient</th><th>' + (ch === 'sms' ? 'Phone' : 'Email') + '</th><th>Sent</th><th>Status</th></tr></thead><tbody>';
    rpt.recipients.non_engaged.forEach(function(rc) {
      html += '<tr><td><strong>' + rc.name + '</strong></td><td>' + (ch === 'sms' ? (rc.phone || rc.email) : rc.email) + '</td><td>' + (rc.sent_at ? new Date(rc.sent_at).toLocaleDateString() : '-') + '</td><td><span class="badge badge-secondary">No interaction</span></td></tr>';
    });
    if (rpt.recipients.non_engaged.length === 0) html += '<tr><td colspan="4" style="text-align:center;padding:1.5rem;color:#94a3b8">All recipients engaged!</td></tr>';
    html += '</tbody></table></div></div>';

    // Bounced
    html += '<div class="rpt-recip-content" id="drpt-bounced" style="display:none"><div class="rpt-stats-table"><table><thead><tr><th>Recipient</th><th>' + (ch === 'sms' ? 'Phone' : 'Email') + '</th><th>Sent</th><th>Bounce Type</th></tr></thead><tbody>';
    rpt.recipients.bounced.forEach(function(rc) {
      html += '<tr><td><strong>' + rc.name + '</strong></td><td>' + (ch === 'sms' ? (rc.phone || rc.email) : rc.email) + '</td><td>' + (rc.sent_at ? new Date(rc.sent_at).toLocaleDateString() : '-') + '</td><td><span class="badge badge-danger">' + rc.bounce_type + '</span></td></tr>';
    });
    if (rpt.recipients.bounced.length === 0) html += '<tr><td colspan="4" style="text-align:center;padding:1.5rem;color:#94a3b8">No bounces</td></tr>';
    html += '</tbody></table></div></div>';
    html += '</div>'; // end tracking tab

    // ═══════ TAB: URLs & Click Streams (email only – Adobe Campaign v8) ═══════
    if (ch === 'email') {
      html += '<div class="rpt-tab-content" id="rpt-tab-urls" style="display:none">';

      // Reactivity KPIs
      const uniqueClicks = cd.unique_clicks || Math.round(m.clicks * 0.68);
      const reactivity = (cd.unique_opens || m.opens) > 0 ? ((uniqueClicks / (cd.unique_opens || m.opens)) * 100).toFixed(2) : '0.00';
      html += '<div class="rpt-kpi-grid rpt-kpi-sm">';
      html += _rptKpi('Reactivity', reactivity + '%', 'Clicks / Opens', '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>');
      html += _rptKpi('Distinct Clicks', uniqueClicks.toLocaleString(), '', '<path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/>');
      html += _rptKpi('Clicks', m.clicks.toLocaleString(), 'Total cumulated', '<path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/>');
      html += '</div>';

      // Top 10 Most Visited Links
      html += '<div class="rpt-section-title">Top 10 Most Visited Links</div>';
      if (cd.top_links && cd.top_links.length > 0) {
        html += '<div class="rpt-stats-table"><table><thead><tr><th>Link</th><th>Clicks</th><th>Percentage</th></tr></thead><tbody>';
        cd.top_links.forEach(function(lk, idx) {
          html += '<tr><td><span class="rpt-link-rank">' + (idx + 1) + '</span> ' + lk.url + '</td><td>' + lk.clicks.toLocaleString() + '</td><td><div class="rpt-bar-row"><div class="rpt-bar" style="width:' + lk.percentage + '%"></div><span>' + lk.percentage + '%</span></div></td></tr>';
        });
        html += '</tbody></table></div>';
      } else {
        html += '<div style="text-align:center;padding:2rem;color:#94a3b8">No link data available</div>';
      }

      // Breakdown of clicks over time
      html += '<div class="rpt-section-title">Breakdown of Clicks Over Time</div>';
      html += '<div class="card"><div class="card-body"><canvas id="drpt-clicks-over-time-chart" style="max-height:240px;width:100%"></canvas></div></div>';
      html += '</div>'; // end urls tab
    }

    // ═══════ TAB: User Activities (email only – Adobe Campaign v8) ═══════
    if (ch === 'email') {
      html += '<div class="rpt-tab-content" id="rpt-tab-user-activities" style="display:none">';
      html += '<div class="rpt-section-title">User Activities</div>';
      html += '<div class="rpt-time-selector">';
      html += '<button class="rpt-time-btn active" onclick="switchUserActivityPeriod(this,\'24h\')">Last 24 hours</button>';
      html += '<button class="rpt-time-btn" onclick="switchUserActivityPeriod(this,\'6h\')">Last 6 hours</button>';
      html += '<button class="rpt-time-btn" onclick="switchUserActivityPeriod(this,\'1h\')">Last hour</button>';
      html += '</div>';
      html += '<div class="card"><div class="card-body"><canvas id="drpt-user-activities-chart" style="max-height:300px;width:100%"></canvas></div></div>';
      html += '<div class="rpt-grid-2" style="margin-top:16px">';
      html += '<div class="rpt-kpi-grid rpt-kpi-sm">';
      html += _rptKpi('Total Opens', m.opens.toLocaleString(), '', '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>');
      html += _rptKpi('Total Clicks', m.clicks.toLocaleString(), '', '<path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/>');
      html += '</div></div>';
      html += '</div>'; // end user activities tab
    }

    // ═══════ TAB: Non-deliverables (Adobe Campaign v8) ═══════
    html += '<div class="rpt-tab-content" id="rpt-tab-non-deliverables" style="display:none">';

    // Breakdown of errors per type
    html += '<div class="rpt-section-title">Breakdown of Errors per Type</div>';
    if (rpt.non_deliverables && rpt.non_deliverables.errors_by_type && rpt.non_deliverables.errors_by_type.length > 0) {
      html += '<div class="rpt-grid-2"><div class="card"><div class="card-body"><canvas id="drpt-errors-type-chart" style="max-height:240px;width:100%"></canvas></div></div>';
      html += '<div class="rpt-stats-table"><table><thead><tr><th>Error Type</th><th>Count</th><th>Percentage</th></tr></thead><tbody>';
      rpt.non_deliverables.errors_by_type.forEach(function(e) {
        html += '<tr><td>' + e.type + '</td><td>' + e.count.toLocaleString() + '</td><td>' + e.pct + '%</td></tr>';
      });
      html += '</tbody></table></div></div>';
    } else {
      html += '<div style="text-align:center;padding:2rem;color:#94a3b8">No delivery errors</div>';
    }

    // Breakdown of errors per domain
    html += '<div class="rpt-section-title">Breakdown of Errors per Domain</div>';
    if (rpt.non_deliverables && rpt.non_deliverables.errors_by_domain && rpt.non_deliverables.errors_by_domain.length > 0) {
      html += '<div class="rpt-grid-2"><div class="card"><div class="card-body"><canvas id="drpt-errors-domain-chart" style="max-height:240px;width:100%"></canvas></div></div>';
      html += '<div class="rpt-stats-table rpt-compact-table"><table><thead><tr><th>Domain</th><th title="User Unknown">Unknown</th><th title="Invalid Domain">Invalid</th><th title="Mailbox Full">Full</th><th>Refused</th><th title="Unreachable">Unreach.</th><th>Total</th></tr></thead><tbody>';
      rpt.non_deliverables.errors_by_domain.forEach(function(e) {
        html += '<tr><td><strong>' + e.domain + '</strong></td><td>' + e.user_unknown + '</td><td>' + e.invalid_domain + '</td><td>' + e.mailbox_full + '</td><td>' + e.refused + '</td><td>' + e.unreachable + '</td><td><strong>' + e.total + '</strong></td></tr>';
      });
      html += '</tbody></table></div></div>';
    } else {
      html += '<div style="text-align:center;padding:2rem;color:#94a3b8">No domain-level error data</div>';
    }

    // Error categories for SMS & Push
    if ((ch === 'sms' || ch === 'push') && cd.error_categories && cd.error_categories.length > 0) {
      html += '<div class="rpt-section-title">Error Breakdown</div><div class="rpt-stats-table"><table><thead><tr><th>Error Type</th><th>Count</th><th>Share</th></tr></thead><tbody>';
      cd.error_categories.forEach(function(e) { html += '<tr><td>' + e.reason + '</td><td>' + e.count.toLocaleString() + '</td><td>' + e.pct + '%</td></tr>'; });
      html += '</tbody></table></div>';
    }
    html += '</div>'; // end non-deliverables tab

    // ═══════ TAB: Throughput ═══════
    html += '<div class="rpt-tab-content" id="rpt-tab-throughput" style="display:none">';
    html += '<div class="rpt-section-title">Delivery Throughput</div>';
    html += '<div class="card"><div class="card-body"><canvas id="drpt-throughput-chart" style="max-height:280px;width:100%"></canvas></div></div>';
    html += '</div>'; // end throughput tab

    html += '</div>'; // end rpt-page

    document.getElementById('content').innerHTML = html;

    // Store report data globally for deferred chart rendering and user activities period switching
    window._drptData = rpt;
    window._drptChannel = ch;
    window._drptChartsDrawn = {};

    // Draw only the summary tab charts immediately (visible tab)
    setTimeout(function() {
      _drawDrptSummaryCharts();
    }, 100);

  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

// ── Delivery report helpers ──
function _rptKpi(title, value, sub, iconPath) {
  return '<div class="rpt-kpi"><div class="rpt-kpi-header"><span class="rpt-kpi-title">' + title + '</span><span class="rpt-kpi-icon">' + _afIco(iconPath, 16) + '</span></div><div class="rpt-kpi-value">' + value + '</div>' + (sub ? '<div class="rpt-kpi-sub">' + sub + '</div>' : '') + '</div>';
}

function switchDeliveryReportTab(btn, tab) {
  document.querySelectorAll('.rpt-tab').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  document.querySelectorAll('.rpt-tab-content').forEach(function(c) { c.style.display = 'none'; });
  var el = document.getElementById('rpt-tab-' + tab);
  if (el) el.style.display = 'block';
  // Deferred chart rendering – draw charts when tab becomes visible
  setTimeout(function() { _drawDrptTabCharts(tab); }, 50);
}

function _drawDrptSummaryCharts() {
  var rpt = window._drptData;
  var ch = window._drptChannel;
  if (!rpt) return;
  _drawDrptEngagementChart(rpt.engagement_timeline, ch);
  if (rpt.exclusions && rpt.exclusions.length > 0) _drawDrptExclusionChart(rpt.exclusions);
  window._drptChartsDrawn.summary = true;
}

function _drawDrptTabCharts(tab) {
  var rpt = window._drptData;
  var ch = window._drptChannel;
  if (!rpt || !window._drptChartsDrawn) return;
  if (window._drptChartsDrawn[tab]) return;

  if (tab === 'summary' && !window._drptChartsDrawn.summary) {
    _drawDrptSummaryCharts();
  }
  if (tab === 'tracking') {
    _drawDrptTrackingStatsChart(rpt.engagement_timeline, ch);
    var cd = rpt.channel_data || {};
    if (ch === 'email') {
      if (cd.device_breakdown) _drawDrptDeviceChart(cd.device_breakdown);
      if (rpt.os_breakdown) _drawDrptDonutChart('drpt-os-chart', rpt.os_breakdown.map(function(o) { return o.os; }), rpt.os_breakdown.map(function(o) { return o.count; }));
      if (rpt.browser_breakdown) _drawDrptDonutChart('drpt-browser-chart', rpt.browser_breakdown.map(function(b) { return b.browser; }), rpt.browser_breakdown.map(function(b) { return b.count; }));
    }
    window._drptChartsDrawn.tracking = true;
  }
  if (tab === 'urls') {
    if (rpt.clicks_over_time) _drawDrptClicksOverTimeChart(rpt.clicks_over_time);
    window._drptChartsDrawn.urls = true;
  }
  if (tab === 'user-activities') {
    if (rpt.user_activities) _drawDrptUserActivitiesChart(rpt.user_activities, '24h');
    window._drptChartsDrawn['user-activities'] = true;
  }
  if (tab === 'non-deliverables') {
    if (rpt.non_deliverables) {
      if (rpt.non_deliverables.errors_by_type && rpt.non_deliverables.errors_by_type.length > 0) _drawDrptErrorsTypeChart(rpt.non_deliverables.errors_by_type);
      if (rpt.non_deliverables.errors_by_domain && rpt.non_deliverables.errors_by_domain.length > 0) _drawDrptErrorsDomainChart(rpt.non_deliverables.errors_by_domain);
    }
    window._drptChartsDrawn['non-deliverables'] = true;
  }
  if (tab === 'throughput') {
    _drawDrptThroughputChart(rpt.throughput);
    window._drptChartsDrawn.throughput = true;
  }
}

function switchDrptRecipTab(btn, tab) {
  document.querySelectorAll('.rpt-recip-tab').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  document.querySelectorAll('.rpt-recip-content').forEach(function(c) { c.style.display = 'none'; });
  var el = document.getElementById('drpt-' + tab);
  if (el) el.style.display = 'block';
}

function exportDeliveryCSV(id) {
  showToast('CSV export not yet implemented', 'info');
}

/* ══════════════════════════════════════════════════════
   DELIVERY HEATMAP PAGE
   ══════════════════════════════════════════════════════ */

async function showDeliveryHeatmap(id, fromWorkflowId) {
  const content = document.getElementById('content');
  showLoading();
  try {
    const [hm, del] = await Promise.all([
      fetch(`/api/deliveries/${id}/heatmap`).then(r => r.json()),
      fetch(`/api/deliveries/${id}`).then(r => r.json())
    ]);
    const ch = (hm.channel || 'email').toLowerCase();
    const channelIcon = ch === 'email'
      ? _afIco('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>')
      : ch === 'sms'
      ? _afIco('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>')
      : _afIco('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>');

    const hmBackArgs = fromWorkflowId ? `${id}, ${fromWorkflowId}` : `${id}`;
    content.innerHTML = `
      <div style="margin-bottom:12px;display:flex;gap:8px">
        <button class="btn btn-secondary btn-sm" onclick="showDeliveryReport(${hmBackArgs})" style="display:inline-flex;align-items:center;gap:4px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to Delivery Report
        </button>
        ${fromWorkflowId ? `<button class="btn btn-secondary btn-sm" onclick="showWorkflowReport(${fromWorkflowId})" style="display:inline-flex;align-items:center;gap:4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg> Workflow Report</button>` : ''}
      </div>

      <div class="hm-page-header">
        <div class="hm-page-title">${channelIcon} ${hm.delivery_name} — Heatmap Analytics</div>
        <div style="display:flex;gap:8px;font-size:12px;color:var(--text-secondary)">
          <span class="badge badge-info">${hm.total_sent?.toLocaleString()} sent</span>
          <span class="badge badge-success">${hm.total_opens?.toLocaleString()} opens</span>
          <span class="badge badge-primary">${hm.total_clicks?.toLocaleString()} clicks</span>
        </div>
      </div>

      <div class="hm-page-tabs">
        <button class="hm-page-tab active" onclick="switchDeliveryHmTab(this,'engagement')">Engagement Heatmap</button>
        ${ch === 'email' ? '<button class="hm-page-tab" onclick="switchDeliveryHmTab(this,\'clicks\')">Click Map</button>' : ''}
        <button class="hm-page-tab" onclick="switchDeliveryHmTab(this,'devices')">Devices & Geo</button>
        <button class="hm-page-tab" onclick="switchDeliveryHmTab(this,'ai')">AI Insights</button>
      </div>

      <!-- Engagement Heatmap Tab -->
      <div id="dhm-tab-engagement" class="dhm-tab-content">
        <div class="hm-section">
          <div id="dhm-engagement-grid" style="position:relative"></div>
        </div>
        <div class="hm-grid-2col">
          <div class="hm-section">
            <div id="dhm-hour-bars"></div>
          </div>
          <div class="hm-section">
            <div id="dhm-day-bars"></div>
          </div>
        </div>
      </div>

      <!-- Click Map Tab -->
      <div id="dhm-tab-clicks" class="dhm-tab-content" style="display:none">
        <div class="hm-section">
          <div id="dhm-click-zones"></div>
        </div>
      </div>

      <!-- Devices & Geo Tab -->
      <div id="dhm-tab-devices" class="dhm-tab-content" style="display:none">
        <div class="hm-grid-2col">
          <div class="hm-section">
            <div id="dhm-devices"></div>
          </div>
          <div class="hm-section">
            <div id="dhm-geo"></div>
          </div>
        </div>
      </div>

      <!-- AI Insights Tab -->
      <div id="dhm-tab-ai" class="dhm-tab-content" style="display:none">
        <div class="hm-section" style="background:transparent;border:none;padding:0">
          <div id="dhm-ai-recs"></div>
        </div>
      </div>
    `;

    // Render components
    const HC = window.HeatmapComponent;
    if (HC) {
      HC.renderHeatmapGrid('dhm-engagement-grid', hm.engagement_heatmap.grid, {
        title: 'Opens by Hour & Day of Week',
        palette: 'blue',
        valueKey: 'opens',
        maxVal: hm.engagement_heatmap.max,
        days: hm.engagement_heatmap.days,
        hours: hm.engagement_heatmap.hours
      });
      HC.renderBarSpark('dhm-hour-bars',
        hm.engagement_heatmap.hours.map(h => h + ':00'),
        hm.hour_totals,
        { title: 'Hourly Distribution', palette: 'purple' }
      );
      HC.renderBarSpark('dhm-day-bars',
        hm.engagement_heatmap.days,
        hm.day_totals,
        { title: 'Daily Distribution', palette: 'green' }
      );
      if (ch === 'email') {
        HC.renderClickZones('dhm-click-zones', hm.click_zones);
      }
      HC.renderDeviceHeatmap('dhm-devices', hm.device_heatmap);
      HC.renderGeoHeatmap('dhm-geo', hm.geo_heatmap);
      HC.renderAIRecommendations('dhm-ai-recs', hm.ai_recommendations);
    }
  } catch (e) {
    showToast('Failed to load heatmap: ' + e.message, 'error');
  } finally {
    hideLoading();
  }
}

function switchDeliveryHmTab(btn, tab) {
  document.querySelectorAll('.hm-page-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.dhm-tab-content').forEach(c => c.style.display = 'none');
  const el = document.getElementById('dhm-tab-' + tab);
  if (el) el.style.display = 'block';
}

// ══════════════════════════════════════════════════════
// AGGREGATE DELIVERY HEATMAP — Cross-delivery analytics
// ══════════════════════════════════════════════════════

// Store current aggregate heatmap filters
let _aggHmSource = 'all';

async function showAggregateDeliveryHeatmap(channel, source) {
  const content = document.getElementById('content');
  showLoading();
  const ch = channel || 'all';
  const src = source || _aggHmSource || 'all';
  _aggHmSource = src;
  try {
    const resp = await fetch('/api/deliveries/heatmap/aggregate?channel=' + ch + '&source=' + src);
    const data = await resp.json();

    const srcCounts = data.source_counts || { all: 0, standalone: 0, workflow: 0 };

    if (data.deliveries_count === 0) {
      const sourceLabel = src === 'standalone' ? 'standalone' : src === 'workflow' ? 'workflow-linked' : '';
      content.innerHTML = `<div class="card" style="padding:40px;text-align:center">
        <h3>No ${sourceLabel} deliveries found${ch !== 'all' ? ' for channel: ' + ch : ''}</h3>
        <p style="color:#6b7280;margin:12px 0">${src !== 'all' ? 'Try switching the source filter.' : 'Create some deliveries first to see aggregate heatmap data.'}</p>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:12px">
          ${src !== 'all' ? '<button class="btn btn-primary btn-sm" onclick="showAggregateDeliveryHeatmap(\'' + ch + '\', \'all\')">Show All</button>' : ''}
          <button class="btn btn-secondary btn-sm" onclick="loadDeliveries()">Back to Deliveries</button>
        </div>
      </div>`;
      return;
    }

    const HC = window.HeatmapComponent;

    // Channel tabs
    const channels = ['all', 'email', 'sms', 'push'];
    const channelLabels = { all: 'All Channels', email: 'Email', sms: 'SMS', push: 'Push' };
    const channelTabs = channels.map(c =>
      `<button class="hm-page-tab ${c === ch ? 'active' : ''}" onclick="showAggregateDeliveryHeatmap('${c}', '${src}')">${channelLabels[c]}</button>`
    ).join('');

    // Source filter tabs
    const sourceLabels = {
      all: 'All (' + srcCounts.all + ')',
      standalone: 'Standalone (' + srcCounts.standalone + ')',
      workflow: 'Workflow-linked (' + srcCounts.workflow + ')'
    };
    const sourceTabs = ['all', 'standalone', 'workflow'].map(s =>
      `<button class="hm-page-tab ${s === src ? 'active' : ''}" onclick="showAggregateDeliveryHeatmap('${ch}', '${s}')" style="font-size:12px">${s === 'standalone' ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:3px"><path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/></svg>' : s === 'workflow' ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:3px"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><path d="M6 9v3a1 1 0 0 0 1 1h3"/><path d="M18 9v3a1 1 0 0 1-1 1h-3"/></svg>' : ''}${sourceLabels[s]}</button>`
    ).join('');

    // Channel summary cards
    const byChannel = data.by_channel || {};
    const channelCards = Object.entries(byChannel).map(([name, stats]) => `
      <div class="agg-channel-card">
        <div class="agg-channel-icon">${name === 'Email' ? '&#9993;' : name === 'SMS' ? '&#128172;' : '&#128276;'}</div>
        <div class="agg-channel-name">${name}</div>
        <div class="agg-channel-stats">
          <span>${stats.count} deliveries</span>
          <span>${(stats.sent || 0).toLocaleString()} sent</span>
          <span>${stats.sent ? ((stats.opens / stats.sent) * 100).toFixed(1) : 0}% open rate</span>
        </div>
      </div>
    `).join('');

    // Performance table
    const perfRows = (data.delivery_performance || []).slice(0, 20).map((d, i) => {
      const orClass = parseFloat(d.open_rate) > 25 ? 'agg-perf-high' : parseFloat(d.open_rate) < 10 ? 'agg-perf-low' : '';
      const srcBadge = d.is_workflow_linked
        ? '<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;padding:2px 7px;border-radius:10px;background:#ede9fe;color:#6d28d9;white-space:nowrap"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><path d="M6 9v3a1 1 0 0 0 1 1h3"/><path d="M18 9v3a1 1 0 0 1-1 1h-3"/></svg>Workflow</span>'
        : '<span style="font-size:10px;padding:2px 7px;border-radius:10px;background:#f0fdf4;color:#15803d;white-space:nowrap">Standalone</span>';
      return `<tr class="${orClass}">
        <td>${i + 1}</td>
        <td><a href="#" onclick="showDeliveryHeatmap(${d.id});return false" style="color:#4f46e5;text-decoration:none;font-weight:500">${d.name}</a></td>
        <td>${d.channel}</td>
        <td>${srcBadge}</td>
        <td>${d.status}</td>
        <td>${d.sent.toLocaleString()}</td>
        <td>${d.opens.toLocaleString()}</td>
        <td><strong>${d.open_rate}%</strong></td>
        <td><strong>${d.click_rate}%</strong></td>
      </tr>`;
    }).join('');

    content.innerHTML = `
      <div class="hm-page-header">
        <div>
          <button class="btn btn-secondary btn-sm" onclick="loadDeliveries()" style="margin-bottom:8px">&larr; Back to Deliveries</button>
          <h2 style="margin:0;font-size:20px;font-weight:700">Cross-Delivery Engagement Heatmap</h2>
          <p style="margin:4px 0 0;color:#6b7280;font-size:13px">Aggregate analytics across ${data.deliveries_count} ${src !== 'all' ? (src === 'standalone' ? 'standalone' : 'workflow-linked') + ' ' : ''}deliveries &bull; ${data.total_sent.toLocaleString()} total sent</p>
        </div>
      </div>

      <!-- Channel filter tabs -->
      <div class="hm-page-tabs" style="margin-bottom:8px">${channelTabs}</div>

      <!-- Source filter tabs -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <span style="font-size:12px;color:#6b7280;font-weight:500">Source:</span>
        <div class="hm-page-tabs" style="margin:0">${sourceTabs}</div>
      </div>

      <!-- KPI summary -->
      <div class="agg-kpi-row">
        <div class="agg-kpi-card">
          <div class="agg-kpi-value">${data.deliveries_count}</div>
          <div class="agg-kpi-label">Deliveries</div>
        </div>
        <div class="agg-kpi-card">
          <div class="agg-kpi-value">${data.total_sent.toLocaleString()}</div>
          <div class="agg-kpi-label">Total Sent</div>
        </div>
        <div class="agg-kpi-card">
          <div class="agg-kpi-value">${data.total_opens.toLocaleString()}</div>
          <div class="agg-kpi-label">Total Opens</div>
        </div>
        <div class="agg-kpi-card">
          <div class="agg-kpi-value">${data.avg_open_rate}%</div>
          <div class="agg-kpi-label">Avg Open Rate</div>
        </div>
        <div class="agg-kpi-card">
          <div class="agg-kpi-value">${data.avg_click_rate}%</div>
          <div class="agg-kpi-label">Avg CTOR</div>
        </div>
      </div>

      ${Object.keys(byChannel).length > 1 ? `
      <!-- Channel breakdown -->
      <div class="agg-channel-row">${channelCards}</div>
      ` : ''}

      <!-- Content tabs -->
      <div class="hm-page-tabs" style="margin:20px 0 0">
        <button class="hm-page-tab active" onclick="switchAggHmTab(this, 'engagement')">Engagement Heatmap</button>
        <button class="hm-page-tab" onclick="switchAggHmTab(this, 'devices')">Devices & Geo</button>
        <button class="hm-page-tab" onclick="switchAggHmTab(this, 'performance')">Delivery Comparison</button>
        <button class="hm-page-tab" onclick="switchAggHmTab(this, 'ai')">AI Insights</button>
      </div>

      <!-- Tab: Engagement -->
      <div id="agg-tab-engagement" class="agg-tab-content" style="display:block">
        <div class="card" style="padding:20px;margin-top:12px">
          <h4 style="margin:0 0 4px;font-size:15px;font-weight:600">Engagement by Hour & Day of Week</h4>
          <p style="margin:0 0 16px;color:#6b7280;font-size:12px">Aggregated opens across all ${data.deliveries_count} deliveries. Darker cells = higher engagement.</p>
          <div id="agg-eng-grid"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px">
          <div class="card" style="padding:20px">
            <h4 style="margin:0 0 12px;font-size:14px;font-weight:600">Opens by Hour</h4>
            <div id="agg-hour-bars"></div>
          </div>
          <div class="card" style="padding:20px">
            <h4 style="margin:0 0 12px;font-size:14px;font-weight:600">Opens by Day</h4>
            <div id="agg-day-bars"></div>
          </div>
        </div>
      </div>

      <!-- Tab: Devices & Geo -->
      <div id="agg-tab-devices" class="agg-tab-content" style="display:none">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px">
          <div class="card" style="padding:20px">
            <h4 style="margin:0 0 12px;font-size:14px;font-weight:600">Device Breakdown</h4>
            <div id="agg-device-grid"></div>
          </div>
          <div class="card" style="padding:20px">
            <h4 style="margin:0 0 12px;font-size:14px;font-weight:600">Geographic Distribution</h4>
            <div id="agg-geo-table"></div>
          </div>
        </div>
      </div>

      <!-- Tab: Delivery Comparison -->
      <div id="agg-tab-performance" class="agg-tab-content" style="display:none">
        <div class="card" style="padding:20px;margin-top:12px">
          <h4 style="margin:0 0 4px;font-size:15px;font-weight:600">Delivery Performance Ranking</h4>
          <p style="margin:0 0 16px;color:#6b7280;font-size:12px">Sorted by open rate. Click a delivery name to view its individual heatmap.</p>
          <div style="overflow-x:auto">
            <table class="data-table" style="width:100%;font-size:13px">
              <thead><tr>
                <th>#</th><th>Delivery</th><th>Channel</th><th>Source</th><th>Status</th>
                <th>Sent</th><th>Opens</th><th>Open Rate</th><th>CTOR</th>
              </tr></thead>
              <tbody>${perfRows}</tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab: AI Insights -->
      <div id="agg-tab-ai" class="agg-tab-content" style="display:none">
        <div class="card" style="padding:20px;margin-top:12px">
          <h4 style="margin:0 0 4px;font-size:15px;font-weight:600">AI Recommendations</h4>
          <p style="margin:0 0 16px;color:#6b7280;font-size:12px">Cross-delivery insights powered by aggregated engagement data.</p>
          <div id="agg-ai-recs"></div>
        </div>
      </div>
    `;

    // Render visualizations
    if (HC) {
      HC.renderHeatmapGrid('agg-eng-grid', data.engagement_heatmap.grid, {
        title: 'Opens by Hour & Day of Week',
        palette: 'blue',
        valueKey: 'opens',
        maxVal: data.engagement_heatmap.max,
        days: data.engagement_heatmap.days,
        hours: data.engagement_heatmap.hours
      });
      HC.renderBarSpark('agg-hour-bars',
        data.engagement_heatmap.hours.map(h => h + ':00'),
        data.hour_totals,
        { title: 'Hourly Distribution', palette: 'purple' }
      );
      HC.renderBarSpark('agg-day-bars',
        data.engagement_heatmap.days,
        data.day_totals,
        { title: 'Daily Distribution', palette: 'green' }
      );
      HC.renderDeviceHeatmap('agg-device-grid', data.device_heatmap);
      HC.renderGeoHeatmap('agg-geo-table', data.geo_heatmap);
      HC.renderAIRecommendations('agg-ai-recs', data.ai_recommendations);
    }
  } catch (err) {
    content.innerHTML = `<div class="card" style="padding:40px;text-align:center">
      <h3>Error loading aggregate heatmap</h3>
      <p style="color:#ef4444;margin:12px 0">${err.message}</p>
      <button class="btn btn-secondary" onclick="loadDeliveries()">Back to Deliveries</button>
    </div>`;
  } finally {
    hideLoading();
  }
}

function switchAggHmTab(btn, tab) {
  document.querySelectorAll('.hm-page-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.agg-tab-content').forEach(c => c.style.display = 'none');
  const el = document.getElementById('agg-tab-' + tab);
  if (el) el.style.display = 'block';
}

// ── Chart drawing functions ──
function _drawDrptEngagementChart(timeline, channel) {
  var canvas = document.getElementById('drpt-engagement-chart');
  if (!canvas || !timeline || timeline.length === 0) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.parentElement.clientWidth;
  var h = 280;
  canvas.width = w; canvas.height = h;
  var pad = 50;
  var cw = w - pad * 2, ch2 = h - pad * 2;
  var maxO = Math.max(1, ...timeline.map(function(d) { return d.opens; }));
  var maxC = Math.max(1, ...timeline.map(function(d) { return d.clicks; }));
  var maxV = Math.max(maxO, maxC);
  var spacing = cw / (timeline.length - 1 || 1);

  // Axes
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();

  // Area fill – opens
  ctx.fillStyle = 'rgba(59,130,246,0.08)';
  ctx.beginPath(); ctx.moveTo(pad, h - pad);
  timeline.forEach(function(d, i) { ctx.lineTo(pad + i * spacing, h - pad - (d.opens / maxV) * ch2); });
  ctx.lineTo(pad + (timeline.length - 1) * spacing, h - pad);
  ctx.closePath(); ctx.fill();

  // Line – opens
  ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  timeline.forEach(function(d, i) { var x = pad + i * spacing, y = h - pad - (d.opens / maxV) * ch2; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.stroke();

  // Line – clicks
  ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  timeline.forEach(function(d, i) { var x = pad + i * spacing, y = h - pad - (d.clicks / maxV) * ch2; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.stroke();

  // Y labels
  ctx.fillStyle = '#94a3b8'; ctx.font = '11px system-ui'; ctx.textAlign = 'right';
  for (var i = 0; i <= 5; i++) {
    var val = Math.round((maxV / 5) * i);
    ctx.fillText(val.toString(), pad - 8, h - pad - (ch2 / 5) * i + 4);
  }
  // X labels
  ctx.textAlign = 'center';
  timeline.forEach(function(d, i) { if (i % 6 === 0) ctx.fillText(d.hour + 'h', pad + i * spacing, h - pad + 18); });
  // Legend
  ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'left';
  ctx.fillStyle = '#3b82f6'; ctx.fillText('● Opens', w - 160, 24);
  ctx.fillStyle = '#10b981'; ctx.fillText('● Clicks', w - 160, 42);
}

function _drawDrptThroughputChart(throughput) {
  var canvas = document.getElementById('drpt-throughput-chart');
  if (!canvas || !throughput || throughput.length === 0) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.parentElement.clientWidth;
  var h = 280;
  canvas.width = w; canvas.height = h;
  var pad = 50;
  var cw = w - pad * 2, ch2 = h - pad * 2;
  var maxM = Math.max(1, ...throughput.map(function(d) { return d.messages; }));
  var barW = Math.max(8, (cw / throughput.length) - 6);

  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();

  throughput.forEach(function(d, i) {
    var x = pad + (i + 0.5) * (cw / throughput.length) - barW / 2;
    var barH = (d.messages / maxM) * ch2;
    var grad = ctx.createLinearGradient(x, h - pad - barH, x, h - pad);
    grad.addColorStop(0, '#3b82f6');
    grad.addColorStop(1, '#93c5fd');
    ctx.fillStyle = grad;
    var r2 = 4;
    ctx.beginPath();
    ctx.moveTo(x + r2, h - pad - barH);
    ctx.lineTo(x + barW - r2, h - pad - barH);
    ctx.quadraticCurveTo(x + barW, h - pad - barH, x + barW, h - pad - barH + r2);
    ctx.lineTo(x + barW, h - pad);
    ctx.lineTo(x, h - pad);
    ctx.lineTo(x, h - pad - barH + r2);
    ctx.quadraticCurveTo(x, h - pad - barH, x + r2, h - pad - barH);
    ctx.closePath();
    ctx.fill();
    // Label
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(d.hour + 'h', x + barW / 2, h - pad + 16);
    if (d.messages > 0) {
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 10px system-ui';
      ctx.fillText(d.messages.toLocaleString(), x + barW / 2, h - pad - barH - 6);
    }
  });
  // Y labels
  ctx.fillStyle = '#94a3b8'; ctx.font = '11px system-ui'; ctx.textAlign = 'right';
  for (var i = 0; i <= 4; i++) {
    ctx.fillText(Math.round((maxM / 4) * i).toLocaleString(), pad - 8, h - pad - (ch2 / 4) * i + 4);
  }
  ctx.fillStyle = '#64748b'; ctx.font = '11px system-ui'; ctx.textAlign = 'center';
  ctx.fillText('Messages / hour', w / 2, 20);
}

function _drawDrptDeviceChart(breakdown) {
  var canvas = document.getElementById('drpt-device-chart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.parentElement.clientWidth; var h = 240;
  canvas.width = w; canvas.height = h;
  var cx = w / 2, cy = h / 2 - 10, rad = Math.min(w, h) / 3;
  var devices = [
    { label: 'Desktop', value: breakdown.desktop, color: '#3b82f6' },
    { label: 'Mobile', value: breakdown.mobile, color: '#10b981' },
    { label: 'Tablet', value: breakdown.tablet, color: '#f59e0b' },
    { label: 'Other', value: breakdown.other, color: '#94a3b8' }
  ];
  var total = devices.reduce(function(s, d) { return s + d.value; }, 0);
  if (total === 0) { ctx.fillStyle = '#94a3b8'; ctx.font = '13px system-ui'; ctx.textAlign = 'center'; ctx.fillText('No data', cx, cy); return; }
  var start = -Math.PI / 2;
  devices.forEach(function(dv) {
    var slice = (dv.value / total) * Math.PI * 2;
    ctx.fillStyle = dv.color;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, rad, start, start + slice); ctx.closePath(); ctx.fill();
    if (dv.value > 0) {
      var mid = start + slice / 2;
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(Math.round((dv.value / total) * 100) + '%', cx + Math.cos(mid) * rad * 0.65, cy + Math.sin(mid) * rad * 0.65 + 4);
    }
    start += slice;
  });
  // Legend
  devices.forEach(function(dv, i) {
    var lx = 12, ly = h - 50 + i * 16;
    ctx.fillStyle = dv.color; ctx.fillRect(lx, ly, 10, 10);
    ctx.fillStyle = '#1e293b'; ctx.font = '11px system-ui'; ctx.textAlign = 'left';
    ctx.fillText(dv.label + ': ' + dv.value.toLocaleString(), lx + 16, ly + 9);
  });
}

// ── Rounded rect helper (cross-browser) ──
function _fillRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

// ── Generic donut chart (for OS and Browser breakdowns) ──
function _drawDrptDonutChart(canvasId, labels, values) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.parentElement.clientWidth; var h = 200;
  canvas.width = w; canvas.height = h;
  var cx = w / 2, cy = h / 2 - 5, outerRad = Math.min(w, h) / 3, innerRad = outerRad * 0.55;
  var colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#94a3b8'];
  var total = values.reduce(function(s, v) { return s + v; }, 0);
  if (total === 0) { ctx.fillStyle = '#94a3b8'; ctx.font = '13px system-ui'; ctx.textAlign = 'center'; ctx.fillText('No data', cx, cy); return; }
  var start = -Math.PI / 2;
  values.forEach(function(val, i) {
    var slice = (val / total) * Math.PI * 2;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(start) * innerRad, cy + Math.sin(start) * innerRad);
    ctx.arc(cx, cy, outerRad, start, start + slice);
    ctx.arc(cx, cy, innerRad, start + slice, start, true);
    ctx.closePath(); ctx.fill();
    if (val > 0 && slice > 0.25) {
      var mid = start + slice / 2;
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(Math.round((val / total) * 100) + '%', cx + Math.cos(mid) * (outerRad + innerRad) / 2, cy + Math.sin(mid) * (outerRad + innerRad) / 2 + 4);
    }
    start += slice;
  });
}

// ── Tracking Statistics chart (opens + clicks over time) ──
function _drawDrptTrackingStatsChart(timeline, channel) {
  var canvas = document.getElementById('drpt-tracking-stats-chart');
  if (!canvas || !timeline || timeline.length === 0) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.parentElement.clientWidth; var h = 280;
  canvas.width = w; canvas.height = h;
  var pad = 50;
  var cw = w - pad * 2, ch2 = h - pad * 2;
  var maxV = Math.max(1, ...timeline.map(function(d) { return Math.max(d.opens || 0, d.clicks || 0); }));
  var spacing = cw / (timeline.length - 1 || 1);

  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();

  // Bars – opens
  var barW = Math.max(3, spacing * 0.3);
  timeline.forEach(function(d, i) {
    var x = pad + i * spacing - barW;
    var barH = (d.opens / maxV) * ch2;
    ctx.fillStyle = 'rgba(59,130,246,0.5)';
    ctx.fillRect(x, h - pad - barH, barW, barH);
  });
  // Bars – clicks
  timeline.forEach(function(d, i) {
    var x = pad + i * spacing;
    var barH = (d.clicks / maxV) * ch2;
    ctx.fillStyle = 'rgba(16,185,129,0.5)';
    ctx.fillRect(x, h - pad - barH, barW, barH);
  });

  ctx.fillStyle = '#94a3b8'; ctx.font = '11px system-ui'; ctx.textAlign = 'right';
  for (var i = 0; i <= 5; i++) ctx.fillText(Math.round((maxV / 5) * i).toString(), pad - 8, h - pad - (ch2 / 5) * i + 4);
  ctx.textAlign = 'center';
  timeline.forEach(function(d, i) { if (i % 6 === 0) ctx.fillText(d.hour + 'h', pad + i * spacing, h - pad + 18); });
  ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'left';
  ctx.fillStyle = '#3b82f6'; ctx.fillText('■ Opens', w - 160, 24);
  ctx.fillStyle = '#10b981'; ctx.fillText('■ Clicks', w - 160, 42);
}

// ── Exclusion chart (horizontal bar) ──
function _drawDrptExclusionChart(exclusions) {
  var canvas = document.getElementById('drpt-exclusion-chart');
  if (!canvas || !exclusions || exclusions.length === 0) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.parentElement.clientWidth; var h = 240;
  canvas.width = w; canvas.height = h;
  var pad = {top: 20, right: 20, bottom: 20, left: 140};
  var ch2 = h - pad.top - pad.bottom;
  var maxV = Math.max(1, ...exclusions.map(function(e) { return e.count; }));
  var barH = Math.min(24, ch2 / exclusions.length - 4);
  var colors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#94a3b8'];

  exclusions.forEach(function(e, i) {
    var y = pad.top + i * (ch2 / exclusions.length) + (ch2 / exclusions.length - barH) / 2;
    var barW = (e.count / maxV) * (w - pad.left - pad.right);
    ctx.fillStyle = colors[i % colors.length];
    _fillRoundRect(ctx, pad.left, y, barW, barH, 3);
    ctx.fillStyle = '#334155'; ctx.font = '11px system-ui'; ctx.textAlign = 'right';
    ctx.fillText(e.reason, pad.left - 8, y + barH / 2 + 4);
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'left';
    ctx.fillText(e.count.toLocaleString(), pad.left + barW + 6, y + barH / 2 + 4);
  });
}

// ── Clicks over time chart ──
function _drawDrptClicksOverTimeChart(clicksData) {
  var canvas = document.getElementById('drpt-clicks-over-time-chart');
  if (!canvas || !clicksData || clicksData.length === 0) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.parentElement.clientWidth; var h = 240;
  canvas.width = w; canvas.height = h;
  var pad = 50;
  var cw = w - pad * 2, ch2 = h - pad * 2;
  var maxV = Math.max(1, ...clicksData.map(function(d) { return d.clicks; }));
  var barW = Math.max(8, (cw / clicksData.length) - 4);

  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();

  clicksData.forEach(function(d, i) {
    var x = pad + (i + 0.5) * (cw / clicksData.length) - barW / 2;
    var barH2 = (d.clicks / maxV) * ch2;
    var grad = ctx.createLinearGradient(x, h - pad - barH2, x, h - pad);
    grad.addColorStop(0, '#10b981'); grad.addColorStop(1, '#6ee7b7');
    ctx.fillStyle = grad;
    _fillRoundRect(ctx, x, h - pad - barH2, barW, barH2, 3);
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(d.hour + 'h', x + barW / 2, h - pad + 16);
  });
  ctx.fillStyle = '#94a3b8'; ctx.font = '11px system-ui'; ctx.textAlign = 'right';
  for (var i = 0; i <= 4; i++) ctx.fillText(Math.round((maxV / 4) * i).toString(), pad - 8, h - pad - (ch2 / 4) * i + 4);
}

// ── User Activities chart ──
function _drawDrptUserActivitiesChart(activities, period) {
  var canvas = document.getElementById('drpt-user-activities-chart');
  if (!canvas || !activities || activities.length === 0) return;
  var data = activities;
  if (period === '6h') data = activities.slice(0, 6);
  else if (period === '1h') data = activities.slice(0, 1).length > 0 ? [{hour:0,opens:activities[0].opens,clicks:activities[0].clicks}] : [];
  if (data.length === 0) return;

  var ctx = canvas.getContext('2d');
  var w = canvas.parentElement.clientWidth; var h = 300;
  canvas.width = w; canvas.height = h;
  var pad = 50;
  var cw = w - pad * 2, ch2 = h - pad * 2;
  var maxV = Math.max(1, ...data.map(function(d) { return Math.max(d.opens, d.clicks); }));
  var spacing = data.length > 1 ? cw / (data.length - 1) : cw;

  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();

  // Area – opens
  ctx.fillStyle = 'rgba(59,130,246,0.1)';
  ctx.beginPath(); ctx.moveTo(pad, h - pad);
  data.forEach(function(d, i) { ctx.lineTo(pad + i * spacing, h - pad - (d.opens / maxV) * ch2); });
  ctx.lineTo(pad + (data.length - 1) * spacing, h - pad);
  ctx.closePath(); ctx.fill();

  // Line – opens
  ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  data.forEach(function(d, i) { var x = pad + i * spacing, y = h - pad - (d.opens / maxV) * ch2; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.stroke();

  // Area – clicks
  ctx.fillStyle = 'rgba(16,185,129,0.1)';
  ctx.beginPath(); ctx.moveTo(pad, h - pad);
  data.forEach(function(d, i) { ctx.lineTo(pad + i * spacing, h - pad - (d.clicks / maxV) * ch2); });
  ctx.lineTo(pad + (data.length - 1) * spacing, h - pad);
  ctx.closePath(); ctx.fill();

  // Line – clicks
  ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  data.forEach(function(d, i) { var x = pad + i * spacing, y = h - pad - (d.clicks / maxV) * ch2; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.stroke();

  // Dots
  data.forEach(function(d, i) {
    var x = pad + i * spacing;
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath(); ctx.arc(x, h - pad - (d.opens / maxV) * ch2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(x, h - pad - (d.clicks / maxV) * ch2, 3, 0, Math.PI * 2); ctx.fill();
  });

  ctx.fillStyle = '#94a3b8'; ctx.font = '11px system-ui'; ctx.textAlign = 'right';
  for (var i = 0; i <= 5; i++) ctx.fillText(Math.round((maxV / 5) * i).toString(), pad - 8, h - pad - (ch2 / 5) * i + 4);
  ctx.textAlign = 'center';
  data.forEach(function(d, i) { if (data.length <= 6 || i % Math.ceil(data.length / 12) === 0) ctx.fillText(d.hour + 'h', pad + i * spacing, h - pad + 18); });
  ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'left';
  ctx.fillStyle = '#3b82f6'; ctx.fillText('● Opens', w - 160, 24);
  ctx.fillStyle = '#10b981'; ctx.fillText('● Clicks', w - 160, 42);
}

function switchUserActivityPeriod(btn, period) {
  document.querySelectorAll('.rpt-time-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  if (window._drptData && window._drptData.user_activities) {
    _drawDrptUserActivitiesChart(window._drptData.user_activities, period);
  }
}

// ── Errors by type chart (donut) ──
function _drawDrptErrorsTypeChart(errorsByType) {
  _drawDrptDonutChart('drpt-errors-type-chart',
    errorsByType.map(function(e) { return e.type; }),
    errorsByType.map(function(e) { return e.count; })
  );
}

// ── Errors by domain chart (stacked horizontal bar) ──
function _drawDrptErrorsDomainChart(errorsByDomain) {
  var canvas = document.getElementById('drpt-errors-domain-chart');
  if (!canvas || !errorsByDomain || errorsByDomain.length === 0) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.parentElement.clientWidth; var h = 240;
  canvas.width = w; canvas.height = h;
  var pad = {top: 20, right: 20, bottom: 20, left: 120};
  var ch2 = h - pad.top - pad.bottom;
  var maxV = Math.max(1, ...errorsByDomain.map(function(e) { return e.total; }));
  var barH = Math.min(28, ch2 / errorsByDomain.length - 4);
  var errColors = {user_unknown: '#ef4444', invalid_domain: '#f97316', mailbox_full: '#f59e0b', refused: '#eab308', unreachable: '#94a3b8'};
  var errKeys = ['user_unknown', 'invalid_domain', 'mailbox_full', 'refused', 'unreachable'];

  errorsByDomain.forEach(function(e, i) {
    var y = pad.top + i * (ch2 / errorsByDomain.length) + (ch2 / errorsByDomain.length - barH) / 2;
    var xOff = pad.left;
    errKeys.forEach(function(key) {
      var val = e[key] || 0;
      var segW = (val / maxV) * (w - pad.left - pad.right);
      ctx.fillStyle = errColors[key];
      ctx.fillRect(xOff, y, segW, barH);
      xOff += segW;
    });
    ctx.fillStyle = '#334155'; ctx.font = '11px system-ui'; ctx.textAlign = 'right';
    ctx.fillText(e.domain, pad.left - 8, y + barH / 2 + 4);
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'left';
    ctx.fillText(e.total.toString(), xOff + 6, y + barH / 2 + 4);
  });
}

async function editDelivery(id) {
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load delivery');
    showDeliveryForm(data);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function deleteDelivery(id) {
  if (!confirm('Delete this delivery?')) return;
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete delivery');
    showToast('Delivery deleted', 'success');
    loadDeliveries();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function duplicateDelivery(id) {
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load delivery');
    const copy = {
      ...data,
      id: null,
      name: `${data.name} (Copy)`,
      status: 'draft',
      sent: 0,
      delivered: 0,
      opens: 0,
      clicks: 0,
      sent_at: null,
      approved_at: null,
      last_saved_step: 1,
      wizard_step: 1
    };
    showDeliveryForm(copy);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

// Transactional Messages View
async function loadTransactionalMessages() {
  showLoading();
  try {
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${_afIco('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', 16)} Transactional Messages</h3>
          <div class="card-subtitle">Event-triggered messages (order confirmations, password resets, etc.)</div>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Event Type</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Total Sent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colspan="7" style="text-align: center; padding: var(--spacing-700);">
                  <div style="font-size: 3rem; margin-bottom: var(--spacing-300);">${_afIco('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', 48)}</div>
                  <h3>No transactional messages configured</h3>
                  <p style="color: var(--text-secondary); margin-bottom: var(--spacing-400);">Set up automated messages triggered by customer events</p>
                  <button class="btn btn-primary" onclick="showToast('Transactional message setup coming soon!', 'info')">${_afIco('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>', 14)} Create Transactional Message</button>
                </td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    document.getElementById('content').innerHTML = content;
  } catch (error) {
    showError('Failed to load Transactional Messages');
  } finally {
    hideLoading();
  }
}

// Event History View
async function loadEventHistory() {
  showLoading();
  try {
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${_afIco('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>', 16)} Event History</h3>
          <div class="card-subtitle">Track all system events and triggers</div>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event Type</th>
                  <th>Source</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colspan="6" style="text-align: center; padding: var(--spacing-700);">
                  <div style="font-size: 3rem; margin-bottom: var(--spacing-300);">${_afIco('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>', 48)}</div>
                  <h3>No events recorded</h3>
                  <p style="color: var(--text-secondary);">System events will appear here as they occur</p>
                </td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    document.getElementById('content').innerHTML = content;
  } catch (error) {
    showError('Failed to load Event History');
  } finally {
    hideLoading();
  }
}

// ═══════════════════════════════════════════════════════════════
// Content Templates View (Adobe Campaign / AJO style)
// ═══════════════════════════════════════════════════════════════

const _ctCategoryLabels = {
  onboarding: 'Onboarding',
  promotional: 'Promotional',
  newsletter: 'Newsletter',
  transactional: 'Transactional',
  event: 'Event',
  retention: 'Retention',
  custom: 'Custom'
};

const _ctCategoryColors = {
  onboarding: '#2563EB',
  promotional: '#DC2626',
  newsletter: '#7C3AED',
  transactional: '#059669',
  event: '#D97706',
  retention: '#0891B2',
  custom: '#6B7280'
};

window._contentListViewMode = window._contentListViewMode || {};

function setContentViewMode(viewKey, mode) {
  window._contentListViewMode[viewKey] = mode;
  if (viewKey === 'content-templates') _renderContentTemplatesPage();
  else if (viewKey === 'landing-pages') loadLandingPages();
  else if (viewKey === 'fragments') loadFragments();
  else if (viewKey === 'assets') loadAssets();
  else if (viewKey === 'brands') loadBrands();
  else if (viewKey === 'email-themes') loadEmailThemes();
}

let _ctState = {
  templates: [],
  filter: 'all',
  categoryFilter: '',
  search: ''
};

function updateCtFilter(key, value) {
  if (key === 'filter') _ctState.filter = value;
  else if (key === 'category') _ctState.categoryFilter = value;
  else if (key === 'search') _ctState.search = value;

  if (key === 'search') {
    if (typeof debounce === 'function') {
      debounce('ctSearch', () => _renderContentTemplatesPage(), 300);
    } else {
      _renderContentTemplatesPage();
    }
  } else {
    _renderContentTemplatesPage();
  }
}

function clearCtFilters() {
  _ctState.filter = 'all';
  _ctState.categoryFilter = '';
  _ctState.search = '';
  _renderContentTemplatesPage();
}

async function loadContentTemplates() {
  showLoading();
  try {
    if (typeof ensureAllFoldersLoaded === 'function') await ensureAllFoldersLoaded();
    const resp = await fetch(`${API_BASE}/email-templates`);
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to load templates');
    _ctState.templates = data.templates || [];
    _renderContentTemplatesPage();
  } catch (error) {
    showError('Failed to load Content Templates: ' + error.message);
  } finally {
    hideLoading();
  }
}

function _renderContentTemplatesPage() {
  let templates = _ctState.templates;

  if (_ctState.filter === 'sample') templates = templates.filter(t => t.sample);
  if (_ctState.filter === 'saved') templates = templates.filter(t => !t.sample);
  if (_ctState.categoryFilter) templates = templates.filter(t => t.category === _ctState.categoryFilter);
  if (_ctState.search) {
    const q = _ctState.search.toLowerCase();
    templates = templates.filter(t =>
      (t.name || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    );
  }

  if (typeof applyFolderFilter === 'function') {
    templates = applyFolderFilter('content-templates', templates);
  }

  if (!currentTableSort.column) {
    currentTableSort.column = 'updated_at';
    currentTableSort.direction = 'desc';
  }
  templates = applySorting(templates, currentTableSort.column);

  const allCats = {};
  _ctState.templates.forEach(t => {
    const cat = t.category || 'custom';
    allCats[cat] = (allCats[cat] || 0) + 1;
  });
  const categoryOptions = [
    { value: '', label: 'All categories' },
    ...Object.keys(allCats).map(cat => ({ value: cat, label: `${_ctCategoryLabels[cat] || cat} (${allCats[cat]})` }))
  ];

  const ctViewMode = window._contentListViewMode['content-templates'] || 'list';

  const filterTags = [];
  if (_ctState.filter !== 'all') filterTags.push({ key: 'filter', label: 'Type', value: _ctState.filter === 'sample' ? 'Sample' : 'Saved' });
  if (_ctState.categoryFilter) filterTags.push({ key: 'category', label: 'Category', value: _ctCategoryLabels[_ctState.categoryFilter] || _ctState.categoryFilter });
  if (_ctState.search) filterTags.push({ key: 'search', label: 'Search', value: _ctState.search });

  const columns = [
    { id: 'name', label: 'Name' },
    { id: 'category', label: 'Category' },
    { id: 'subject', label: 'Subject' },
    { id: 'status', label: 'Status' },
    { id: 'updated_at', label: 'Modified' }
  ];

  const tableRows = templates.map(t => {
    const catColor = _ctCategoryColors[t.category] || '#6B7280';
    const catLabel = _ctCategoryLabels[t.category] || t.category || 'Custom';
    const modified = t.updated_at ? new Date(t.updated_at).toLocaleDateString() : '—';
    const sampleBadge = t.sample ? ' <span class="ct-badge-sample">Sample</span>' : '';

    return `
      <tr>
        <td data-column-id="name">${createTableLink((t.name || 'Untitled') + sampleBadge, `_ctEditTemplate(${t.id})`)}<div class="table-subtext">${t.description || ''}</div></td>
        <td data-column-id="category"><span class="ct-cat-badge" style="background:${catColor}15; color:${catColor}; border:1px solid ${catColor}30">${catLabel}</span></td>
        <td data-column-id="subject">${t.subject || '—'}</td>
        <td data-column-id="status">${createStatusIndicator(t.status || 'draft', t.status || 'draft')}</td>
        <td data-column-id="updated_at">${modified}</td>
        <td>${createActionMenu(t.id, [
          { icon: _afIco('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>', 14), label: 'Edit', onclick: `_ctEditTemplate(${t.id})` },
          { icon: _afIco('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>', 14), label: 'Duplicate', onclick: `_ctDuplicateTemplate(${t.id})` },
          { divider: true },
          { icon: _afIco('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', 14), label: 'Delete', onclick: `_ctDeleteTemplate(${t.id}, '${(t.name || '').replace(/'/g, "\\'")}')`, danger: true }
        ])}</td>
      </tr>
    `;
  }).join('');

  let content = `
    <div class="card">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
        <div>
          <h3 class="card-title">${_afIco('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>', 16)} Content Templates</h3>
          <div class="card-subtitle">Design reusable email templates for consistent brand messaging</div>
        </div>
        ${typeof getFolderToggleButtonHtml === 'function' ? getFolderToggleButtonHtml('content-templates') : ''}
      </div>
      ${createTableToolbar({
        resultCount: templates.length,
        totalCount: _ctState.templates.length,
        showColumnSelector: true,
        showViewModeToggle: true,
        viewMode: ctViewMode,
        viewKeyForMode: 'content-templates',
        columns,
        viewKey: 'content-templates',
        showSearch: true,
        searchPlaceholder: 'Search templates...',
        searchValue: _ctState.search || '',
        onSearch: 'updateCtFilter("search", this.value)',
        filterTags,
        onClearTag: 'clearCtFilters',
        filters: [
          {
            type: 'select',
            label: 'Source',
            value: _ctState.filter,
            onChange: 'updateCtFilter("filter", this.value)',
            options: [
              { value: 'all', label: 'All templates' },
              { value: 'sample', label: 'Sample templates' },
              { value: 'saved', label: 'Saved templates' }
            ]
          },
          {
            type: 'select',
            label: 'Category',
            value: _ctState.categoryFilter,
            onChange: 'updateCtFilter("category", this.value)',
            options: categoryOptions
          }
        ]
      })}
      ${ctViewMode === 'grid'
    ? `<div class="ct-grid" id="content-templates-grid">${templates.length ? templates.map(t => _ctRenderCard(t)).join('') : '<div class="empty-state" style="grid-column:1/-1;padding:3rem;text-align:center;color:#6B7280">No templates found</div>'}</div>`
    : `<div class="data-table-container">
        <table class="data-table" data-view="content-templates">
          <thead>
            <tr>
              ${createSortableHeader('name', 'Name', currentTableSort)}
              <th data-column-id="category">Category</th>
              <th data-column-id="subject">Subject</th>
              ${createSortableHeader('status', 'Status', currentTableSort)}
              ${createSortableHeader('updated_at', 'Modified', currentTableSort)}
              <th style="width: 50px;"></th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="6" style="text-align:center; padding: 2rem; color: #6B7280;">No templates found</td></tr>'}
          </tbody>
        </table>
      </div>`
  }
    </div>
  `;
  if (typeof wrapWithFolderSidebarHtml === 'function') {
    content = wrapWithFolderSidebarHtml('content-templates', 'content_templates', content);
  }
  document.getElementById('content').innerHTML = content;
  if (ctViewMode === 'grid') setTimeout(() => _ctPopulateIframePreviews(), 50);
  applyColumnVisibility('content-templates');
  if (typeof initListFolderTree === 'function') {
    initListFolderTree('content-templates', 'content_templates', _renderContentTemplatesPage);
  }
}

function _ctPopulateIframePreviews() {
  document.querySelectorAll('.ct-card-iframe').forEach(iframe => {
    const html = decodeURIComponent(iframe.dataset.html || '');
    if (!html) return;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(`<!DOCTYPE html><html><head><style>body{margin:0;padding:0;overflow:hidden;pointer-events:none;transform-origin:top left;transform:scale(0.35);width:286%;font-family:Arial,sans-serif;}</style></head><body>${html}</body></html>`);
      doc.close();
    } catch (e) { /* cross-origin safety */ }
  });
}

function _ctRenderCard(t) {
  const catColor = _ctCategoryColors[t.category] || '#6B7280';
  const catLabel = _ctCategoryLabels[t.category] || t.category || 'Custom';
  const modified = t.updated_at ? new Date(t.updated_at).toLocaleDateString() : '—';
  const statusBadge = t.status === 'published'
    ? '<span class="ct-status ct-status-published">Published</span>'
    : '<span class="ct-status ct-status-draft">Draft</span>';
  const sampleBadge = t.sample ? '<span class="ct-badge-sample">Sample</span>' : '';

  // Build preview: iframe if html exists, fallback to icon
  let previewInner;
  if (t.html) {
    const iframeId = `ct-preview-${t.id}`;
    previewInner = `<iframe id="${iframeId}" class="ct-card-iframe" scrolling="no" sandbox="allow-same-origin" data-html="${encodeURIComponent(t.html)}"></iframe>`;
  } else {
    previewInner = `<div class="ct-card-preview-inner">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    </div>`;
  }

  return `
    <div class="ct-card" onclick="_ctEditTemplate(${t.id})">
      <div class="ct-card-preview">${previewInner}</div>
      <div class="ct-card-body">
        <div class="ct-card-top-row">
          <span class="ct-cat-badge" style="background:${catColor}15; color:${catColor}; border:1px solid ${catColor}30">${catLabel}</span>
          ${sampleBadge}
          ${statusBadge}
        </div>
        <div class="ct-card-name">${t.name || 'Untitled'}</div>
        <div class="ct-card-desc">${t.description || ''}</div>
        <div class="ct-card-meta">Modified ${modified}</div>
      </div>
      <div class="ct-card-actions" onclick="event.stopPropagation()">
        <button class="btn btn-icon btn-sm" onclick="_ctEditTemplate(${t.id})" title="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn btn-icon btn-sm" onclick="_ctDuplicateTemplate(${t.id})" title="Duplicate">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <button class="btn btn-icon btn-sm" onclick="_ctDeleteTemplate(${t.id}, '${(t.name || '').replace(/'/g, "\\'")}')" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  `;
}

// Kept for backwards compat
function _ctSetFilter(filter) { updateCtFilter('filter', filter); }
function _ctSetCategory(cat) { updateCtFilter('category', cat); }
function _ctSetSearch(val) { updateCtFilter('search', val); }

function _ctCreateTemplate() {
  // Open a modal to get name, description, and category
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'ct-create-modal';
  overlay.innerHTML = `
    <div class="modal" style="max-width:480px;">
      <div class="modal-header">
        <h3>Create content template</h3>
        <button class="modal-close" onclick="document.getElementById('ct-create-modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label form-label-required">Template name</label>
          <input class="form-input" id="ct-new-name" placeholder="e.g. Welcome Email">
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input class="form-input" id="ct-new-desc" placeholder="Brief description of the template">
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-input" id="ct-new-category">
            <option value="custom">Custom</option>
            <option value="onboarding">Onboarding</option>
            <option value="promotional">Promotional</option>
            <option value="newsletter">Newsletter</option>
            <option value="transactional">Transactional</option>
            <option value="event">Event</option>
            <option value="retention">Retention</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Start from</label>
          <div class="ct-start-options">
            <label class="ct-start-option">
              <input type="radio" name="ct-start" value="scratch" checked onchange="_ctToggleImportField()">
              <span>Design from scratch</span>
            </label>
            <label class="ct-start-option">
              <input type="radio" name="ct-start" value="existing" onchange="_ctToggleImportField()">
              <span>Use existing template</span>
            </label>
            <label class="ct-start-option">
              <input type="radio" name="ct-start" value="import" onchange="_ctToggleImportField()">
              <span>Import HTML (file or zip)</span>
            </label>
          </div>
        </div>
        <div class="form-group" id="ct-import-field" style="display:none">
          <label class="form-label form-label-required">Upload HTML or ZIP file</label>
          <input type="file" class="form-input" id="ct-import-file" accept=".html,.htm,.zip">
          <span class="form-helper">Upload a .html file or a .zip containing an HTML file and images folder.</span>
          <div id="ct-import-status" style="display:none;margin-top:6px;padding:8px 12px;border-radius:6px;font-size:12px"></div>
        </div>
        <div id="ct-folder-picker-container"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('ct-create-modal').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="_ctDoCreate()">Create</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('ct-new-name').focus();
  if (typeof ensureFolderPickerData === 'function' && typeof folderPickerHtml === 'function') {
    ensureFolderPickerData('content_templates').then(() => {
      const fpContainer = document.getElementById('ct-folder-picker-container');
      if (fpContainer) {
        const defaultFolder = typeof getDefaultFolderForEntity === 'function' ? getDefaultFolderForEntity('content_templates') : null;
        fpContainer.innerHTML = folderPickerHtml('ct-folder-id', 'content_templates', defaultFolder);
      }
    });
  }
}

function _ctToggleImportField() {
  const startMode = document.querySelector('input[name="ct-start"]:checked')?.value || 'scratch';
  const importField = document.getElementById('ct-import-field');
  if (importField) importField.style.display = startMode === 'import' ? 'block' : 'none';
}

async function _ctDoCreate() {
  const name = document.getElementById('ct-new-name').value.trim();
  if (!name) { showToast('Please enter a template name', 'warning'); return; }
  const description = document.getElementById('ct-new-desc').value.trim();
  const category = document.getElementById('ct-new-category').value;
  const startMode = document.querySelector('input[name="ct-start"]:checked')?.value || 'scratch';

  try {
    showLoading();

    let importedHtml = '';
    let importedBlocks = [];

    // If importing, process the file first
    if (startMode === 'import') {
      const fileInput = document.getElementById('ct-import-file');
      const file = fileInput?.files?.[0];
      if (!file) { showToast('Please select an HTML or ZIP file to import', 'warning'); hideLoading(); return; }

      const statusDiv = document.getElementById('ct-import-status');
      if (statusDiv) {
        statusDiv.style.display = 'block';
        statusDiv.style.background = '#eef2ff';
        statusDiv.style.color = '#3730a3';
        statusDiv.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite;vertical-align:-2px;margin-right:6px"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Processing file...';
      }

      const formData = new FormData();
      formData.append('file', file);
      const importResp = await fetch(`${API_BASE}/email-templates/import-html`, {
        method: 'POST',
        body: formData
      });
      const importData = await importResp.json();
      if (!importResp.ok) throw new Error(importData.error || 'Failed to process uploaded file');

      importedHtml = importData.html || '';
      const assetCount = importData.asset_count || 0;

      if (statusDiv) {
        statusDiv.style.background = '#dcfce7';
        statusDiv.style.color = '#166534';
        statusDiv.innerHTML = '&#10003; File processed. HTML extracted' + (assetCount > 0 ? ' with ' + assetCount + ' images' : '') + '.';
      }

      // Wrap imported HTML as a single raw block
      if (importedHtml) {
        importedBlocks = [{ id: 'block-' + Date.now(), type: 'html', html: importedHtml }];
      }
    }

    // Create the template
    const ctFolderId = typeof getSelectedFolderId === 'function' ? getSelectedFolderId('ct-folder-id') : null;
    const resp = await fetch(`${API_BASE}/email-templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        category,
        status: 'draft',
        html: importedHtml,
        blocks: importedBlocks,
        folder_id: ctFolderId || null
      })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to create template');
    document.getElementById('ct-create-modal')?.remove();
    // Open the email editor for this template
    _ctEditTemplate(data.id);
  } catch (error) {
    const statusDiv = document.getElementById('ct-import-status');
    if (statusDiv) {
      statusDiv.style.display = 'block';
      statusDiv.style.background = '#fef2f2';
      statusDiv.style.color = '#991b1b';
      statusDiv.textContent = error.message;
    }
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function _ctEditTemplate(id) {
  // Open the email editor in template mode
  window.open(`/email-designer.html?templateId=${id}`, '_blank');
}

async function _ctDuplicateTemplate(id) {
  try {
    showLoading();
    const resp = await fetch(`${API_BASE}/email-templates/${id}/duplicate`, { method: 'POST' });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to duplicate');
    showToast(`Template duplicated as "${data.name}"`, 'success');
    loadContentTemplates();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function _ctDeleteTemplate(id, name) {
  if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return;
  try {
    showLoading();
    const resp = await fetch(`${API_BASE}/email-templates/${id}`, { method: 'DELETE' });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to delete');
    showToast('Template deleted', 'success');
    loadContentTemplates();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

// Landing Pages View
let lpFilters = { search: '', status: 'all' };

function updateLpFilter(key, value) {
  lpFilters[key] = value;
  if (key === 'search') {
    if (typeof debounce === 'function') {
      debounce('lpSearch', () => loadLandingPages(), 300);
    } else {
      loadLandingPages();
    }
  } else {
    loadLandingPages();
  }
}

function clearLpFilters() {
  lpFilters = { search: '', status: 'all' };
  loadLandingPages();
}

async function loadLandingPages() {
  showLoading();
  try {
    if (typeof ensureAllFoldersLoaded === 'function') await ensureAllFoldersLoaded();
    const response = await fetch(`${API_BASE}/landing-pages`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load landing pages');
    const allPages = data.pages || [];
    window.landingPagesCache = allPages;

    let filtered = allPages.filter(page => {
      if (lpFilters.status !== 'all' && page.status !== lpFilters.status) return false;
      if (lpFilters.search) {
        const s = lpFilters.search.toLowerCase();
        if (!(page.name || '').toLowerCase().includes(s) && !(page.slug || '').toLowerCase().includes(s)) return false;
      }
      return true;
    });

    if (typeof applyFolderFilter === 'function') {
      filtered = applyFolderFilter('landing-pages', filtered);
    }

    if (!currentTableSort.column) {
      currentTableSort.column = 'updated_at';
      currentTableSort.direction = 'desc';
    }
    filtered = applySorting(filtered, currentTableSort.column);

    const lpViewMode = window._contentListViewMode['landing-pages'] || 'list';

    const filterTags = [];
    if (lpFilters.status !== 'all') filterTags.push({ key: 'status', label: 'Status', value: lpFilters.status });
    if (lpFilters.search) filterTags.push({ key: 'search', label: 'Search', value: lpFilters.search });

    const columns = [
      { id: 'name', label: 'Name' },
      { id: 'type', label: 'Type' },
      { id: 'status', label: 'Status' },
      { id: 'updated_at', label: 'Last Updated' },
      { id: 'owner', label: 'Owner' },
      { id: 'tags', label: 'Tags/Folder' }
    ];

    const lpCard = page => {
      const updated = page.updated_at || page.created_at || '';
      return `<div class="inventory-card" onclick="editLandingPage(${page.id})">
        <div class="inventory-card-preview"><span class="inventory-card-icon">${_afIco('<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>', 32)}</span></div>
        <div class="inventory-card-body">
          <div class="inventory-card-name">${page.name || 'Untitled'}</div>
          <div class="inventory-card-meta">${page.slug || '—'} · ${page.status || 'draft'}</div>
          <div class="inventory-card-meta">${updated ? new Date(updated).toLocaleDateString() : '—'}</div>
        </div>
      </div>`;
    };

    const tableRows = filtered.map(page => {
      const typeLabel = page.type || page.channel || page.page_type || 'Landing Page';
      const tagLabel = Array.isArray(page.tags) && page.tags.length ? page.tags.join(', ') : '';
      const folderLabel = page.folder || '';
      const taxonomy = [folderLabel, tagLabel].filter(Boolean).join(' · ') || '—';
      const updated = page.updated_at || page.created_at || '';
      return `
        <tr>
          <td data-column-id="name">${createTableLink(page.name || 'Untitled', `editLandingPage(${page.id})`)}<div class="table-subtext">${page.slug || '—'}</div></td>
          <td data-column-id="type">${typeLabel}</td>
          <td data-column-id="status">${createStatusIndicator(page.status || 'draft', page.status || 'draft')}</td>
          <td data-column-id="updated_at">${updated ? new Date(updated).toLocaleDateString() : '—'}</td>
          <td data-column-id="owner">${page.updated_by || page.created_by || 'System'}</td>
          <td data-column-id="tags">${taxonomy}</td>
          <td>${createActionMenu(page.id, [
            { icon: _afIco('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>', 14), label: 'Edit', onclick: `editLandingPage(${page.id})` },
            { icon: _afIco('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>', 14), label: 'Duplicate', onclick: `duplicateLandingPage(${page.id})` },
            { divider: true },
            { icon: _afIco(page.status === 'published' ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>' : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>', 14), label: page.status === 'published' ? 'Unpublish' : 'Publish', onclick: `toggleLandingPageStatus(${page.id})` },
            { divider: true },
            { icon: _afIco('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', 14), label: 'Delete', onclick: `deleteLandingPage(${page.id})`, danger: true }
          ])}</td>
        </tr>
      `;
    }).join('');

    let content = `
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
          <div>
            <h3 class="card-title">${_afIco('<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>', 16)} Landing Pages</h3>
            <div class="card-subtitle">Create and manage web landing pages</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            ${typeof getFolderToggleButtonHtml === 'function' ? getFolderToggleButtonHtml('landing-pages') : ''}
            <button class="btn btn-primary" onclick="createLandingPage()">+ Create landing page</button>
          </div>
        </div>
        ${createTableToolbar({
          resultCount: filtered.length,
          totalCount: allPages.length,
          showColumnSelector: true,
          showViewModeToggle: true,
          viewMode: lpViewMode,
          viewKeyForMode: 'landing-pages',
          columns,
          viewKey: 'landing-pages',
          showSearch: true,
          searchPlaceholder: 'Search landing pages...',
          searchValue: lpFilters.search || '',
          onSearch: 'updateLpFilter("search", this.value)',
          filterTags,
          onClearTag: 'clearLpFilters',
          filters: [
            {
              type: 'select',
              label: 'Status',
              value: lpFilters.status,
              onChange: 'updateLpFilter("status", this.value)',
              options: [
                { value: 'all', label: 'All statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' }
              ]
            }
          ]
        })}
        ${lpViewMode === 'grid'
          ? `<div class="inventory-grid">${filtered.length ? filtered.map(lpCard).join('') : '<div class="empty-state" style="grid-column:1/-1;padding:3rem;text-align:center;color:#6B7280">No landing pages found</div>'}</div>`
          : `<div class="data-table-container">
          <table class="data-table" data-view="landing-pages">
            <thead>
              <tr>
                ${createSortableHeader('name', 'Name', currentTableSort)}
                ${createSortableHeader('type', 'Type', currentTableSort)}
                ${createSortableHeader('status', 'Status', currentTableSort)}
                ${createSortableHeader('updated_at', 'Last Updated', currentTableSort)}
                <th data-column-id="owner">Owner</th>
                <th data-column-id="tags">Tags/Folder</th>
                <th style="width: 50px;"></th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="7" style="text-align:center; padding: 2rem; color: #6B7280;">No landing pages found</td></tr>'}
            </tbody>
          </table>
        </div>`
        }
      </div>
    `;
    if (typeof wrapWithFolderSidebarHtml === 'function') {
      content = wrapWithFolderSidebarHtml('landing-pages', 'landing_pages', content);
    }
    document.getElementById('content').innerHTML = content;
    applyColumnVisibility('landing-pages');
    if (typeof initListFolderTree === 'function') {
      initListFolderTree('landing-pages', 'landing_pages', loadLandingPages);
    }
  } catch (error) {
    showError('Failed to load Landing Pages');
  } finally {
    hideLoading();
  }
}

function createLandingPage() {
  if (typeof window.openLandingPageEditorModal === 'function') {
    window.openLandingPageEditorModal();
  } else {
    openLandingPageEditor();
  }
}

function editLandingPage(id) {
  if (typeof window.openLandingPageEditorModal === 'function') {
    window.openLandingPageEditorModal(id);
  } else {
    openLandingPageEditor(id);
  }
}

async function duplicateLandingPage(id) {
  const page = (window.landingPagesCache || []).find(p => String(p.id) === String(id));
  if (!page) return;
  const toSlug = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const baseName = page.name || 'Landing Page';
  const copyName = `Copy of ${baseName}`;
  const slugBase = page.slug ? `${page.slug}-copy` : toSlug(copyName);
  const payload = {
    name: copyName,
    slug: slugBase,
    status: 'draft',
    version: 1,
    content_blocks: Array.isArray(page.content_blocks) ? page.content_blocks : [],
    html_output: page.html_output || '',
    body_style: page.body_style || null,
    tags: Array.isArray(page.tags) ? page.tags : [],
    folder: page.folder || '',
    created_by: page.updated_by || page.created_by || 'System'
  };
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/landing-pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to duplicate landing page');
    window.landingPagesCache = [data, ...(window.landingPagesCache || [])];
    loadLandingPages();
    showToast('Landing page duplicated', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function toggleLandingPageStatus(id) {
  const page = (window.landingPagesCache || []).find(p => String(p.id) === String(id));
  if (!page) return;
  const nextStatus = page.status === 'published' ? 'draft' : 'published';
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/landing-pages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update landing page');
    window.landingPagesCache = (window.landingPagesCache || []).map(p => p.id === id ? data : p);
    loadLandingPages();
    showToast(`Landing page ${nextStatus}`, 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function openLandingPageEditor(pageId = null) {
  const url = pageId
    ? `/email-designer.html?landingPageId=${encodeURIComponent(pageId)}&landingPageMode=1&return=app`
    : `/email-designer.html?landingPageMode=1&return=app`;
  window.location.href = url;
}

async function deleteLandingPage(id) {
  const page = (window.landingPagesCache || []).find(p => String(p.id) === String(id));
  if (!confirm(`Delete landing page "${page?.name || id}"? This cannot be undone.`)) return;
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/landing-pages/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete landing page');
    showToast('Landing page deleted', 'success');
    loadLandingPages();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

// Fragments View
let fragFilters = { search: '', status: 'all', type: 'all' };

function updateFragFilter(key, value) {
  fragFilters[key] = value;
  if (key === 'search') {
    if (typeof debounce === 'function') {
      debounce('fragSearch', () => loadFragments(), 300);
    } else {
      loadFragments();
    }
  } else {
    loadFragments();
  }
}

function clearFragFilters() {
  fragFilters = { search: '', status: 'all', type: 'all' };
  loadFragments();
}

async function loadFragments() {
  showLoading();
  try {
    if (typeof ensureAllFoldersLoaded === 'function') await ensureAllFoldersLoaded();
    const response = await fetch(`${API_BASE}/fragments`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load fragments');
    const allFragments = data.fragments || data || [];
    window.fragmentsCache = allFragments;

    let filtered = allFragments.filter(fragment => {
      if (fragFilters.status !== 'all' && fragment.status !== fragFilters.status) return false;
      if (fragFilters.type !== 'all' && fragment.type !== fragFilters.type) return false;
      if (fragFilters.search) {
        const s = fragFilters.search.toLowerCase();
        if (!(fragment.name || '').toLowerCase().includes(s)) return false;
      }
      return true;
    });

    if (typeof applyFolderFilter === 'function') {
      filtered = applyFolderFilter('fragments', filtered);
    }

    if (!currentTableSort.column) {
      currentTableSort.column = 'updated_at';
      currentTableSort.direction = 'desc';
    }
    filtered = applySorting(filtered, currentTableSort.column);

    const fragViewMode = window._contentListViewMode['fragments'] || 'list';

    const filterTags = [];
    if (fragFilters.status !== 'all') filterTags.push({ key: 'status', label: 'Status', value: fragFilters.status });
    if (fragFilters.type !== 'all') filterTags.push({ key: 'type', label: 'Type', value: fragFilters.type });
    if (fragFilters.search) filterTags.push({ key: 'search', label: 'Search', value: fragFilters.search });

    const columns = [
      { id: 'name', label: 'Name' },
      { id: 'type', label: 'Type' },
      { id: 'status', label: 'Status' },
      { id: 'updated_at', label: 'Last Updated' },
      { id: 'owner', label: 'Owner' },
      { id: 'tags', label: 'Tags/Folder' }
    ];

    const fragCard = f => {
      const updated = f.updated_at || f.created_at || '';
      return `<div class="inventory-card" onclick="editFragment(${f.id}, '${f.type || 'email'}')">
        <div class="inventory-card-preview"><span class="inventory-card-icon">${_afIco('<path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>', 32)}</span></div>
        <div class="inventory-card-body">
          <div class="inventory-card-name">${f.name || 'Untitled'}</div>
          <div class="inventory-card-meta">${f.type || 'email'} · ${f.status || 'draft'}</div>
          <div class="inventory-card-meta">${updated ? new Date(updated).toLocaleDateString() : '—'}</div>
        </div>
      </div>`;
    };

    const tableRows = filtered.map(fragment => {
      const updated = fragment.updated_at || fragment.created_at || '';
      const tagLabel = Array.isArray(fragment.tags) && fragment.tags.length ? fragment.tags.join(', ') : '';
      const folderLabel = fragment.folder || '';
      const taxonomy = [folderLabel, tagLabel].filter(Boolean).join(' · ') || '—';
      return `
        <tr>
          <td data-column-id="name">${createTableLink(fragment.name || 'Untitled', `editFragment(${fragment.id}, '${fragment.type || 'email'}')`)}</td>
          <td data-column-id="type">${fragment.type || 'email'}</td>
          <td data-column-id="status">${createStatusIndicator(fragment.status || 'draft', fragment.status || 'draft')}</td>
          <td data-column-id="updated_at">${updated ? new Date(updated).toLocaleDateString() : '—'}</td>
          <td data-column-id="owner">${fragment.updated_by || fragment.created_by || 'System'}</td>
          <td data-column-id="tags">${taxonomy}</td>
          <td>${createActionMenu(fragment.id, [
            { icon: _afIco('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>', 14), label: 'Edit', onclick: `editFragment(${fragment.id}, '${fragment.type || 'email'}')` },
            { divider: true },
            { icon: _afIco('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', 14), label: 'Delete', onclick: `deleteFragment(${fragment.id})`, danger: true }
          ])}</td>
        </tr>
      `;
    }).join('');

    let content = `
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
          <div>
            <h3 class="card-title">${_afIco('<path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>', 16)} Fragments</h3>
            <div class="card-subtitle">Reusable content blocks (headers, footers, disclaimers)</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            ${typeof getFolderToggleButtonHtml === 'function' ? getFolderToggleButtonHtml('fragments') : ''}
            <button class="btn btn-primary" onclick="createFragment()">+ Create fragment</button>
          </div>
        </div>
        ${createTableToolbar({
          resultCount: filtered.length,
          totalCount: allFragments.length,
          showColumnSelector: true,
          showViewModeToggle: true,
          viewMode: fragViewMode,
          viewKeyForMode: 'fragments',
          columns,
          viewKey: 'fragments',
          showSearch: true,
          searchPlaceholder: 'Search fragments...',
          searchValue: fragFilters.search || '',
          onSearch: 'updateFragFilter("search", this.value)',
          filterTags,
          onClearTag: 'clearFragFilters',
          filters: [
            {
              type: 'select',
              label: 'Status',
              value: fragFilters.status,
              onChange: 'updateFragFilter("status", this.value)',
              options: [
                { value: 'all', label: 'All statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' }
              ]
            },
            {
              type: 'select',
              label: 'Type',
              value: fragFilters.type,
              onChange: 'updateFragFilter("type", this.value)',
              options: [
                { value: 'all', label: 'All types' },
                { value: 'landing', label: 'Landing' },
                { value: 'email', label: 'Email' }
              ]
            }
          ]
        })}
        ${fragViewMode === 'grid'
          ? `<div class="inventory-grid">${filtered.length ? filtered.map(fragCard).join('') : '<div class="empty-state" style="grid-column:1/-1;padding:3rem;text-align:center;color:#6B7280">No fragments found</div>'}</div>`
          : `<div class="data-table-container">
          <table class="data-table" data-view="fragments">
            <thead>
              <tr>
                ${createSortableHeader('name', 'Name', currentTableSort)}
                ${createSortableHeader('type', 'Type', currentTableSort)}
                ${createSortableHeader('status', 'Status', currentTableSort)}
                ${createSortableHeader('updated_at', 'Last Updated', currentTableSort)}
                <th data-column-id="owner">Owner</th>
                <th data-column-id="tags">Tags/Folder</th>
                <th style="width: 50px;"></th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="7" style="text-align:center; padding: 2rem; color: #6B7280;">No fragments found</td></tr>'}
            </tbody>
          </table>
        </div>`
        }
      </div>
    `;
    if (typeof wrapWithFolderSidebarHtml === 'function') {
      content = wrapWithFolderSidebarHtml('fragments', 'fragments', content);
    }
    document.getElementById('content').innerHTML = content;
    applyColumnVisibility('fragments');
    if (typeof initListFolderTree === 'function') {
      initListFolderTree('fragments', 'fragments', loadFragments);
    }
  } catch (error) {
    showError('Failed to load Fragments');
  } finally {
    hideLoading();
  }
}

function createFragment() {
  const type = document.getElementById('fragment-type-filter')?.value || 'landing';
  openFragmentEditor(null, type === 'all' ? 'landing' : type);
}

function editFragment(id, type = 'email') {
  openFragmentEditor(id, type);
}

function openFragmentEditor(fragmentId = null, fragmentType = 'landing') {
  const params = new URLSearchParams({ fragmentMode: '1', fragmentType });
  if (fragmentId) params.set('fragmentId', fragmentId);
  window.location.href = `/email-designer.html?${params.toString()}`;
}

async function deleteFragment(id) {
  const frag = (window.fragmentsCache || []).find(f => String(f.id) === String(id));
  if (!confirm(`Delete fragment "${frag?.name || id}"? This cannot be undone.`)) return;
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/fragments/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete fragment');
    showToast('Fragment deleted', 'success');
    loadFragments();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

// Brands View
async function loadBrands() {
  showLoading();
  try {
    if (typeof ensureAllFoldersLoaded === 'function') await ensureAllFoldersLoaded();
    const brandsResp = await fetch('/api/brands');
    const brandsData = await brandsResp.json();
    let brands = brandsData.brands || [];
    if (typeof applyFolderFilter === 'function') brands = applyFolderFilter('brands', brands);

    const brandsViewMode = window._contentListViewMode['brands'] || 'list';

    const columns = [
      { id: 'id', label: 'ID' },
      { id: 'name', label: 'Brand Name' },
      { id: 'sender', label: 'Sender' },
      { id: 'website', label: 'Website' },
      { id: 'default', label: 'Default' },
      { id: 'status', label: 'Status' }
    ];

    const brandCard = b => {
      const email = b.email || {};
      const sender = email.from_name ? `${email.from_name}` : (email.from_email || '—');
      return `<div class="inventory-card" onclick="editBrand(${b.id})">
        <div class="inventory-card-preview" style="background:${(b.colors && b.colors.primary) || '#6366f1'};color:#fff;display:flex;align-items:center;justify-content:center;">
          <span class="inventory-card-icon" style="color:#fff;opacity:0.9">${_afIco('<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>', 40)}</span>
        </div>
        <div class="inventory-card-body">
          <div class="inventory-card-name">${b.name || 'Untitled'}</div>
          <div class="inventory-card-meta">${sender}</div>
          <div class="inventory-card-meta">${b.status || 'active'}${b.is_default ? ' · Default' : ''}</div>
        </div>
      </div>`;
    };

    const tableRows = brands.map(b => {
      const email = b.email || {};
      const senderInfo = email.from_name ? `${email.from_name} &lt;${email.from_email || ''}&gt;` : (email.from_email || '—');
      const defaultBadge = b.is_default ? '<span class="status-badge" style="background:#dbeafe;color:#1d4ed8;font-size:11px">Default</span>' : '';
      return `<tr>
        <td data-column-id="id">${b.id}</td>
        <td data-column-id="name">${createTableLink(b.name || 'Untitled', `editBrand(${b.id})`)}</td>
        <td data-column-id="sender" style="font-size:13px">${senderInfo}</td>
        <td data-column-id="website"><a href="${b.website_url || '#'}" target="_blank" style="color:var(--primary-color);text-decoration:none">${b.website_url || '—'}</a></td>
        <td data-column-id="default">${defaultBadge}</td>
        <td data-column-id="status">${createStatusIndicator(b.status || 'active', b.status || 'active')}</td>
        <td>${createActionMenu(b.id, [
          { icon: _afIco('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>', 14), label: 'Edit', onclick: `editBrand(${b.id})` },
          { divider: true },
          { icon: _afIco('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', 14), label: 'Delete', onclick: `deleteBrand(${b.id})`, danger: true }
        ])}</td>
      </tr>`;
    }).join('');

    let content = `
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
          <div>
            <h3 class="card-title">${_afIco('<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>', 20)} Brands</h3>
            <div class="card-subtitle">Manage brand identities and configurations</div>
          </div>
          ${typeof getFolderToggleButtonHtml === 'function' ? getFolderToggleButtonHtml('brands') : ''}
        </div>
        ${createTableToolbar({
          resultCount: brands.length,
          totalCount: brands.length,
          showColumnSelector: true,
          showViewModeToggle: true,
          viewMode: brandsViewMode,
          viewKeyForMode: 'brands',
          columns,
          viewKey: 'brands',
          showSearch: true,
          searchPlaceholder: 'Search brands...'
        })}
        ${brandsViewMode === 'grid'
          ? `<div class="inventory-grid">${brands.length ? brands.map(brandCard).join('') : '<div class="empty-state" style="grid-column:1/-1;padding:3rem;text-align:center;color:#6B7280">No brands configured</div>'}</div>`
          : `<div class="data-table-container">
          <table class="data-table" data-view="brands">
            <thead>
              <tr>
                ${createSortableHeader('id', 'ID', currentTableSort)}
                ${createSortableHeader('name', 'Brand Name', currentTableSort)}
                <th data-column-id="sender">Sender</th>
                <th data-column-id="website">Website</th>
                <th data-column-id="default">Default</th>
                ${createSortableHeader('status', 'Status', currentTableSort)}
                <th style="width: 50px;"></th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="7" style="text-align:center; padding: 2rem; color: #6B7280;">No brands configured. Set up brand configurations for multi-brand campaigns.</td></tr>'}
            </tbody>
          </table>
        </div>`
        }
      </div>
    `;
    if (typeof wrapWithFolderSidebarHtml === 'function') {
      content = wrapWithFolderSidebarHtml('brands', 'brands', content);
    }
    document.getElementById('content').innerHTML = content;
    applyColumnVisibility('brands');
    if (typeof initListFolderTree === 'function') {
      initListFolderTree('brands', 'brands', loadBrands);
    }
  } catch (error) {
    showError('Failed to load Brands');
  } finally {
    hideLoading();
  }
}

// ── Email themes (Adobe Journey Optimizer–style apply-themes-to-email) ──
async function loadEmailThemes() {
  showLoading();
  try {
    const resp = await fetch(`${API_BASE}/email-themes`);
    const data = await resp.json();
    const themes = data.themes || [];
    const rows = themes.map(t => `
      <tr>
        <td>${_escapeHtml(t.name || 'Untitled theme')}</td>
        <td style="max-width:200px;color:#6B7280;font-size:13px">${_escapeHtml((t.description || '').slice(0, 80))}${(t.description || '').length > 80 ? '…' : ''}</td>
        <td>${t.updated_at ? new Date(t.updated_at).toLocaleDateString() : '—'}</td>
        <td>
          ${createActionMenu(t.id, [
            { icon: _afIco('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>', 14), label: 'Edit', onclick: `openThemeModal(${t.id})` },
            { divider: true },
            { icon: _afIco('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', 14), label: 'Delete', onclick: `deleteEmailTheme(${t.id}, '${(t.name || '').replace(/'/g, "\\'")}')`, danger: true }
          ])}
        </td>
      </tr>
    `).join('');
    const content = `
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <h3 class="card-title">${_afIco('<circle cx="13.5" cy="6.5" r="2.5"/><path d="M17 2H7a5 5 0 00-5 5v10a5 5 0 005 5h10a5 5 0 005-5V7a5 5 0 00-5-5z"/>', 20)} Email themes</h3>
            <div class="card-subtitle">Reusable styling for email content. Apply themes in the Email Designer to keep brand consistency.</div>
          </div>
          <button class="btn btn-primary" onclick="openThemeModal(null)">+ Create theme</button>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr><th>Name</th><th>Description</th><th>Updated</th><th style="width:80px"></th></tr>
              </thead>
              <tbody>
                ${themes.length ? rows : '<tr><td colspan="4" style="text-align:center;padding:2rem;color:#6B7280">No themes yet. Create one to apply to email templates and deliveries.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    document.getElementById('content').innerHTML = content;
  } catch (error) {
    showError('Failed to load email themes');
  } finally {
    hideLoading();
  }
}

function _escapeHtml(s) {
  if (s == null) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function openThemeModal(themeId) {
  const modal = document.getElementById('email-theme-modal');
  if (!modal) {
    const m = document.createElement('div');
    m.id = 'email-theme-modal';
    m.className = 'modal-overlay hidden';
    m.innerHTML = '<div class="modal email-theme-modal-inner"><div class="modal-header"><h3 id="email-theme-modal-title">Theme</h3><button type="button" class="modal-close" onclick="closeThemeModal()">&times;</button></div><div class="modal-body" id="email-theme-modal-body"></div><div class="modal-footer"><button type="button" class="btn btn-secondary" onclick="closeThemeModal()">Cancel</button><button type="button" class="btn btn-primary" onclick="saveEmailTheme()">Save</button></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m) closeThemeModal(); });
  }
  const titleEl = document.getElementById('email-theme-modal-title');
  const bodyEl = document.getElementById('email-theme-modal-body');
  if (titleEl) titleEl.textContent = themeId ? 'Edit theme' : 'Create theme';
  if (bodyEl) bodyEl.innerHTML = '<div style="padding:1rem;color:#6B7280">Loading…</div>';
  document.getElementById('email-theme-modal').classList.remove('hidden');
  window._editingThemeId = themeId;
  if (themeId) {
    fetch(`${API_BASE}/email-themes/${themeId}`)
      .then(r => r.json())
      .then(theme => { _renderThemeForm(bodyEl, theme); })
      .catch(() => { bodyEl.innerHTML = '<p style="color:#dc2626">Failed to load theme.</p>'; });
  } else {
    _renderThemeForm(bodyEl, { name: '', description: '', body: {}, colors: {}, typography: {}, components: {} });
  }
}

const THEME_PRESET_KEYS = ['default', 'ocean', 'forest', 'sunset', 'plum', 'slate'];

function _renderThemeForm(container, theme) {
  const b = theme.body || {};
  const c = theme.colors || {};
  const comp = theme.components || {};
  const btn = comp.button || {};
  const div = comp.divider || {};
  const txt = comp.text || {};
  const ty = theme.typography || {};
  const h1 = ty.heading1 || {};
  const h2 = ty.heading2 || {};
  const h3 = ty.heading3 || {};
  const variants = Array.isArray(theme.variants) ? theme.variants : [];
  const variantsHtml = variants.map((v, i) => `
    <div class="form-group" style="display:flex;align-items:center;gap:8px;">
      <span style="flex:1;font-size:12px;">${_escapeHtml(v.name || 'Variant ' + (i + 1))}</span>
      <button type="button" class="btn btn-sm btn-ghost" onclick="removeThemeVariant(${i})">Remove</button>
    </div>
  `).join('');
  container.innerHTML = `
    <div class="form-section compact-form" style="max-height:60vh;overflow-y:auto">
      <div class="form-group">
        <label class="form-label">Name</label>
        <input type="text" class="form-input" id="theme-name" value="${_escapeHtml(theme.name || '')}" placeholder="e.g. Brand Primary">
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <input type="text" class="form-input" id="theme-desc" value="${_escapeHtml(theme.description || '')}" placeholder="Optional">
      </div>
      <details class="inspector-section" open><summary>Preset</summary>
        <div class="inspector-fields">
          <div class="form-group">
            <label class="form-label">Apply preset</label>
            <select class="form-input" id="theme-preset-select" onchange="applyThemePreset(this.value)">
              <option value="">— None —</option>
              ${THEME_PRESET_KEYS.map(k => `<option value="${k}">${k.charAt(0).toUpperCase() + k.slice(1)}</option>`).join('')}
            </select>
          </div>
        </div>
      </details>
      <details class="inspector-section" open><summary>Body</summary>
        <div class="form-group"><label class="form-label">Background</label><div class="color-input-row"><input type="color" class="form-input form-color" id="theme-body-bg" value="${b.backgroundColor || '#ffffff'}"><input type="text" class="form-input form-color-hex" value="${b.backgroundColor || '#ffffff'}" maxlength="7" oninput="document.getElementById('theme-body-bg').value=this.value"></div></div>
        <div class="form-group"><label class="form-label">Viewport color</label><div class="color-input-row"><input type="color" class="form-input form-color" id="theme-viewport" value="${b.viewportColor || '#f0f0f0'}"><input type="text" class="form-input form-color-hex" value="${b.viewportColor || '#f0f0f0'}" maxlength="7" oninput="document.getElementById('theme-viewport').value=this.value"></div></div>
        <div class="form-group"><label class="form-label">Max width</label><input type="number" class="form-input" id="theme-maxWidth" value="${parseInt(b.maxWidth || '640', 10)}"></div>
        <div class="form-group"><label class="form-label">Font family</label><input type="text" class="form-input" id="theme-body-font" value="${_escapeHtml(b.fontFamily || 'Arial, sans-serif')}"></div>
      </details>
      <details class="inspector-section"><summary>Colors</summary>
        <div class="form-group"><label class="form-label">Primary</label><div class="color-input-row"><input type="color" class="form-input form-color" id="theme-color-primary" value="${c.primary || '#1473E6'}"><input type="text" class="form-input form-color-hex" value="${c.primary || '#1473E6'}" maxlength="7" oninput="document.getElementById('theme-color-primary').value=this.value"></div></div>
        <div class="form-group"><label class="form-label">Text</label><div class="color-input-row"><input type="color" class="form-input form-color" id="theme-color-text" value="${c.text || '#1f2933'}"><input type="text" class="form-input form-color-hex" value="${c.text || '#1f2933'}" maxlength="7" oninput="document.getElementById('theme-color-text').value=this.value"></div></div>
        <div class="form-group"><label class="form-label">Text muted</label><div class="color-input-row"><input type="color" class="form-input form-color" id="theme-color-muted" value="${c.textMuted || '#6B7280'}"><input type="text" class="form-input form-color-hex" value="${c.textMuted || '#6B7280'}" maxlength="7" oninput="document.getElementById('theme-color-muted').value=this.value"></div></div>
      </details>
      <details class="inspector-section"><summary>Typography (headings)</summary>
        <div class="form-group"><label class="form-label">H1 size</label><input type="text" class="form-input" id="theme-h1-size" value="${h1.fontSize || '28px'}"></div>
        <div class="form-group"><label class="form-label">H2 size</label><input type="text" class="form-input" id="theme-h2-size" value="${h2.fontSize || '22px'}"></div>
        <div class="form-group"><label class="form-label">H3 size</label><input type="text" class="form-input" id="theme-h3-size" value="${h3.fontSize || '18px'}"></div>
      </details>
      <details class="inspector-section"><summary>Button default</summary>
        <div class="form-group"><label class="form-label">Background</label><div class="color-input-row"><input type="color" class="form-input form-color" id="theme-btn-bg" value="${btn.backgroundColor || '#1473E6'}"><input type="text" class="form-input form-color-hex" value="${btn.backgroundColor || '#1473E6'}" maxlength="7" oninput="document.getElementById('theme-btn-bg').value=this.value"></div></div>
        <div class="form-group"><label class="form-label">Text color</label><div class="color-input-row"><input type="color" class="form-input form-color" id="theme-btn-color" value="${btn.color || '#ffffff'}"><input type="text" class="form-input form-color-hex" value="${btn.color || '#ffffff'}" maxlength="7" oninput="document.getElementById('theme-btn-color').value=this.value"></div></div>
        <div class="form-group"><label class="form-label">Border radius</label><input type="text" class="form-input" id="theme-btn-radius" value="${btn.borderRadius || '6px'}"></div>
        <div class="form-group"><label class="form-label">Padding</label><input type="text" class="form-input" id="theme-btn-padding" value="${btn.padding || '12px 24px'}"></div>
      </details>
      <details class="inspector-section"><summary>Divider / Text defaults</summary>
        <div class="form-group"><label class="form-label">Divider color</label><div class="color-input-row"><input type="color" class="form-input form-color" id="theme-divider-color" value="${div.borderColor || '#E5E7EB'}"><input type="text" class="form-input form-color-hex" value="${div.borderColor || '#E5E7EB'}" maxlength="7" oninput="document.getElementById('theme-divider-color').value=this.value"></div></div>
        <div class="form-group"><label class="form-label">Text font size</label><input type="text" class="form-input" id="theme-text-size" value="${txt.fontSize || '14px'}"></div>
      </details>
      <details class="inspector-section"><summary>Color variants (e.g. Dark)</summary>
        <div class="inspector-fields">
          ${variantsHtml}
          <button type="button" class="btn btn-secondary btn-sm" onclick="addThemeDarkVariant()">Add Dark variant</button>
        </div>
      </details>
    </div>
  `;
  window._themeFormVariants = variants;
}

function applyThemePreset(key) {
  if (!key) return;
  fetch(`${API_BASE}/email-themes/presets/list`)
    .then(r => r.json())
    .then(data => {
      const preset = data.presets && data.presets[key];
      if (!preset) return;
      const setColor = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; const hex = el && el.nextElementSibling; if (hex && val) hex.value = val; };
      const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
      if (preset.body) {
        setColor('theme-body-bg', preset.body.backgroundColor);
        setColor('theme-viewport', preset.body.viewportColor);
      }
      if (preset.colors) {
        setColor('theme-color-primary', preset.colors.primary);
        setColor('theme-color-text', preset.colors.text);
        setColor('theme-color-muted', preset.colors.textMuted || '#6B7280');
      }
      if (preset.button) {
        setColor('theme-btn-bg', preset.button.backgroundColor);
        setColor('theme-btn-color', preset.button.color);
      }
      if (preset.divider) setColor('theme-divider-color', preset.divider.borderColor);
    })
    .catch(() => {});
}

function addThemeDarkVariant() {
  const variants = (window._themeFormVariants || []).slice();
  const dark = {
    name: 'Dark',
    body: { backgroundColor: '#1e293b', viewportColor: '#0f172a' },
    colors: { primary: '#38bdf8', secondary: '#94a3b8', text: '#f1f5f9', textMuted: '#94a3b8' },
    components: { button: { backgroundColor: '#38bdf8', color: '#0f172a' }, divider: { borderColor: '#475569' }, text: { color: '#f1f5f9' } }
  };
  variants.push(dark);
  window._themeFormVariants = variants;
  const bodyEl = document.getElementById('email-theme-modal-body');
  const current = collectThemeFormData();
  if (bodyEl) _renderThemeForm(bodyEl, { ...current, variants });
}

function removeThemeVariant(index) {
  const variants = (window._themeFormVariants || []).slice();
  variants.splice(index, 1);
  window._themeFormVariants = variants;
  const bodyEl = document.getElementById('email-theme-modal-body');
  const current = collectThemeFormData();
  if (bodyEl) _renderThemeForm(bodyEl, { ...current, variants });
}

function closeThemeModal() {
  const m = document.getElementById('email-theme-modal');
  if (m) m.classList.add('hidden');
  window._editingThemeId = null;
}

function collectThemeFormData() {
  const hex = (id) => (document.getElementById(id) && document.getElementById(id).value) || '';
  const val = (id) => (document.getElementById(id) && document.getElementById(id).value) || '';
  return {
    name: val('theme-name') || 'Untitled theme',
    description: val('theme-desc') || '',
    body: {
      backgroundColor: hex('theme-body-bg') || document.querySelector('#theme-body-bg')?.value || '#ffffff',
      viewportColor: hex('theme-viewport') || document.querySelector('#theme-viewport')?.value || '#f0f0f0',
      padding: '24px',
      maxWidth: String(val('theme-maxWidth') || 640),
      widthUnit: 'px',
      align: 'center',
      fontFamily: val('theme-body-font') || 'Arial, sans-serif'
    },
    colors: {
      primary: hex('theme-color-primary') || document.querySelector('#theme-color-primary')?.value || '#1473E6',
      secondary: '#6B7280',
      text: hex('theme-color-text') || document.querySelector('#theme-color-text')?.value || '#1f2933',
      textMuted: hex('theme-color-muted') || document.querySelector('#theme-color-muted')?.value || '#6B7280'
    },
    typography: {
      fontFamily: 'Arial, sans-serif',
      fontSizeBase: '14px',
      heading1: { fontSize: val('theme-h1-size') || '28px', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' },
      heading2: { fontSize: val('theme-h2-size') || '22px', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' },
      heading3: { fontSize: val('theme-h3-size') || '18px', fontFamily: 'Arial, sans-serif', fontWeight: '600' }
    },
    components: {
      button: {
        backgroundColor: hex('theme-btn-bg') || document.querySelector('#theme-btn-bg')?.value || '#1473E6',
        color: hex('theme-btn-color') || document.querySelector('#theme-btn-color')?.value || '#ffffff',
        borderRadius: val('theme-btn-radius') || '6px',
        padding: val('theme-btn-padding') || '12px 24px',
        fontFamily: 'Arial, sans-serif'
      },
      divider: { borderColor: hex('theme-divider-color') || document.querySelector('#theme-divider-color')?.value || '#E5E7EB', thickness: 1 },
      text: { color: '#1f2933', fontFamily: 'Arial, sans-serif', fontSize: val('theme-text-size') || '14px', lineHeight: '1.5' }
    },
    variants: window._themeFormVariants || []
  };
}

async function saveEmailTheme() {
  const id = window._editingThemeId;
  const payload = collectThemeFormData();
  try {
    if (id) {
      await fetch(`${API_BASE}/email-themes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      showToast('Theme updated');
    } else {
      await fetch(`${API_BASE}/email-themes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      showToast('Theme created');
    }
    closeThemeModal();
    loadEmailThemes();
  } catch (e) {
    showToast('Failed to save theme', 'error');
  }
}

async function deleteEmailTheme(id, name) {
  if (!confirm(`Delete theme "${name || id}"?`)) return;
  try {
    await fetch(`${API_BASE}/email-themes/${id}`, { method: 'DELETE' });
    showToast('Theme deleted');
    loadEmailThemes();
  } catch (e) {
    showToast('Failed to delete theme', 'error');
  }
}

async function editBrand(id) {
  try {
    const resp = await fetch(`/api/brands/${id}`);
    const brand = await resp.json();
    _renderBrandForm(brand, id);
  } catch (error) {
    showToast('Error loading brand', 'error');
  }
}

function createBrand() {
  _renderBrandForm({}, null);
}

function _v(obj, path) {
  return path.split('.').reduce((o, k) => (o || {})[k], obj) || '';
}

function _renderBrandForm(b, id) {
  const isEdit = id !== null;
  const _s = (field, opts) => opts.map(o => `<option value="${o.value}" ${_v(b, field) === o.value ? 'selected' : ''}>${o.label}</option>`).join('');
  const tagIcon = _afIco('<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>', 18);
  const mailIcon = _afIco('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>', 18);
  const globeIcon = _afIco('<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>', 18);
  const shareIcon = _afIco('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>', 18);
  const shieldIcon = _afIco('<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>', 18);
  const paletteIcon = _afIco('<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.75 1.5-1.5 0-.39-.15-.74-.39-1.04-.23-.29-.38-.63-.38-1.02 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.17-4.49-9-10-9z"/>', 18);
  const saveIcon = _afIco('<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>', 14);
  const colorInput = (id, label, val) => `<div class="form-group"><label class="form-label">${label}</label><div style="display:flex;gap:8px;align-items:center"><input type="color" id="${id}" value="${val || '#2563eb'}" style="width:40px;height:34px;padding:2px;border:1px solid var(--border-default);border-radius:var(--radius-sm);cursor:pointer"><input type="text" class="form-input" value="${val || ''}" placeholder="#hex" style="flex:1" oninput="document.getElementById('${id}').value=this.value" onchange="document.getElementById('${id}').value=this.value"></div></div>`;

  const content = `
    <div class="form-container">
      <form id="brand-form" onsubmit="saveBrand(event, ${id})">

        <div class="form-section">
          <h3 class="form-section-title">${tagIcon} Brand Identity</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label form-label-required">Brand Name</label>
              <input type="text" class="form-input" id="brand-name" value="${_v(b,'name')}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-input" id="brand-status">
                ${_s('status', [{value:'active',label:'Active'},{value:'draft',label:'Draft'},{value:'archived',label:'Archived'}])}
              </select>
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Description</label>
              <textarea class="form-input" id="brand-description" rows="2" placeholder="Purpose and usage context for this brand">${_v(b,'description')}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Website URL</label>
              <input type="url" class="form-input" id="brand-website" value="${_v(b,'website_url')}" placeholder="https://www.example.com">
            </div>
            <div class="form-group">
              <label class="form-label">Logo URL</label>
              <input type="text" class="form-input" id="brand-logo" value="${_v(b,'logo_url')}" placeholder="/uploads/logo.png">
            </div>
            <div class="form-group">
              <label class="form-label">Default Brand</label>
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="brand-is-default" ${b.is_default ? 'checked' : ''}> Use as default brand for new deliveries</label>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="form-section-title">${mailIcon} Email Configuration</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Sender Email</label>
              <input type="email" class="form-input" id="brand-email-from" value="${_v(b,'email.from_email')}" placeholder="hello@brand.com">
            </div>
            <div class="form-group">
              <label class="form-label">Sender Name</label>
              <input type="text" class="form-input" id="brand-email-from-name" value="${_v(b,'email.from_name')}" placeholder="Brand Name">
            </div>
            <div class="form-group">
              <label class="form-label">Reply-To Email</label>
              <input type="email" class="form-input" id="brand-email-reply" value="${_v(b,'email.reply_to_email')}" placeholder="support@brand.com">
            </div>
            <div class="form-group">
              <label class="form-label">Reply-To Name</label>
              <input type="text" class="form-input" id="brand-email-reply-name" value="${_v(b,'email.reply_to_name')}" placeholder="Support Team">
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">BCC Email</label>
              <input type="email" class="form-input" id="brand-email-bcc" value="${_v(b,'email.bcc_email')}" placeholder="archive@brand.com (optional, for compliance archiving)">
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Default Email Header HTML</label>
              <textarea class="form-input" id="brand-email-header" rows="3" placeholder="<div>Header HTML for all emails using this brand</div>">${_v(b,'email.email_header')}</textarea>
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Default Email Footer HTML</label>
              <textarea class="form-input" id="brand-email-footer" rows="3" placeholder="<div>Footer HTML — use {{unsubscribe_url}} for unsubscribe link</div>">${_v(b,'email.email_footer')}</textarea>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="form-section-title">${globeIcon} Landing Pages</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Default Landing Page URL</label>
              <input type="url" class="form-input" id="brand-lp-default" value="${_v(b,'landing_pages.default_url')}" placeholder="https://www.brand.com">
            </div>
            <div class="form-group">
              <label class="form-label">Mirror Page URL</label>
              <input type="url" class="form-input" id="brand-lp-mirror" value="${_v(b,'landing_pages.mirror_page_url')}" placeholder="https://mirror.brand.com">
            </div>
            <div class="form-group">
              <label class="form-label">Unsubscription Page URL</label>
              <input type="url" class="form-input" id="brand-lp-unsub" value="${_v(b,'landing_pages.unsubscription_url')}" placeholder="https://www.brand.com/unsubscribe">
            </div>
            <div class="form-group">
              <label class="form-label">Favicon URL</label>
              <input type="text" class="form-input" id="brand-lp-favicon" value="${_v(b,'landing_pages.favicon_url')}" placeholder="https://www.brand.com/favicon.ico">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="form-section-title">${shareIcon} Social Media Links</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Facebook</label>
              <input type="url" class="form-input" id="brand-social-facebook" value="${_v(b,'social.facebook')}" placeholder="https://facebook.com/brand">
            </div>
            <div class="form-group">
              <label class="form-label">Instagram</label>
              <input type="url" class="form-input" id="brand-social-instagram" value="${_v(b,'social.instagram')}" placeholder="https://instagram.com/brand">
            </div>
            <div class="form-group">
              <label class="form-label">X (Twitter)</label>
              <input type="url" class="form-input" id="brand-social-twitter" value="${_v(b,'social.twitter')}" placeholder="https://x.com/brand">
            </div>
            <div class="form-group">
              <label class="form-label">LinkedIn</label>
              <input type="url" class="form-input" id="brand-social-linkedin" value="${_v(b,'social.linkedin')}" placeholder="https://linkedin.com/company/brand">
            </div>
            <div class="form-group">
              <label class="form-label">YouTube</label>
              <input type="url" class="form-input" id="brand-social-youtube" value="${_v(b,'social.youtube')}" placeholder="https://youtube.com/@brand">
            </div>
            <div class="form-group">
              <label class="form-label">TikTok</label>
              <input type="url" class="form-input" id="brand-social-tiktok" value="${_v(b,'social.tiktok')}" placeholder="https://tiktok.com/@brand">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="form-section-title">${paletteIcon} Brand Colors &amp; Typography</h3>
          <div class="form-grid">
            ${colorInput('brand-color-primary', 'Primary Color', _v(b,'colors.primary'))}
            ${colorInput('brand-color-secondary', 'Secondary Color', _v(b,'colors.secondary'))}
            ${colorInput('brand-color-accent', 'Accent Color', _v(b,'colors.accent'))}
            ${colorInput('brand-color-text', 'Text Color', _v(b,'colors.text'))}
            ${colorInput('brand-color-bg', 'Background Color', _v(b,'colors.background'))}
            <div class="form-group">
              <label class="form-label">Heading Font</label>
              <input type="text" class="form-input" id="brand-font-heading" value="${_v(b,'typography.heading_font')}" placeholder="Inter, sans-serif">
            </div>
            <div class="form-group">
              <label class="form-label">Body Font</label>
              <input type="text" class="form-input" id="brand-font-body" value="${_v(b,'typography.body_font')}" placeholder="Inter, sans-serif">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="form-section-title">${shieldIcon} Legal &amp; Compliance</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Company Legal Name</label>
              <input type="text" class="form-input" id="brand-legal-company" value="${_v(b,'legal.company_name')}" placeholder="Company Inc.">
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="text" class="form-input" id="brand-legal-phone" value="${_v(b,'legal.phone')}" placeholder="+1 (555) 000-0000">
            </div>
            <div class="form-group">
              <label class="form-label">Address Line 1</label>
              <input type="text" class="form-input" id="brand-legal-addr1" value="${_v(b,'legal.address_line1')}" placeholder="123 Main Street">
            </div>
            <div class="form-group">
              <label class="form-label">Address Line 2</label>
              <input type="text" class="form-input" id="brand-legal-addr2" value="${_v(b,'legal.address_line2')}" placeholder="Suite 100">
            </div>
            <div class="form-group">
              <label class="form-label">City</label>
              <input type="text" class="form-input" id="brand-legal-city" value="${_v(b,'legal.city')}" placeholder="San Francisco">
            </div>
            <div class="form-group">
              <label class="form-label">State / Region</label>
              <input type="text" class="form-input" id="brand-legal-state" value="${_v(b,'legal.state')}" placeholder="CA">
            </div>
            <div class="form-group">
              <label class="form-label">ZIP / Postal Code</label>
              <input type="text" class="form-input" id="brand-legal-zip" value="${_v(b,'legal.zip')}" placeholder="94105">
            </div>
            <div class="form-group">
              <label class="form-label">Country</label>
              <input type="text" class="form-input" id="brand-legal-country" value="${_v(b,'legal.country')}" placeholder="United States">
            </div>
            <div class="form-group">
              <label class="form-label">Privacy Policy URL</label>
              <input type="url" class="form-input" id="brand-legal-privacy" value="${_v(b,'legal.privacy_policy_url')}" placeholder="https://brand.com/privacy">
            </div>
            <div class="form-group">
              <label class="form-label">Terms &amp; Conditions URL</label>
              <input type="url" class="form-input" id="brand-legal-terms" value="${_v(b,'legal.terms_url')}" placeholder="https://brand.com/terms">
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Copyright Text</label>
              <input type="text" class="form-input" id="brand-legal-copyright" value="${_v(b,'legal.copyright_text')}" placeholder="© 2026 Company Inc. All rights reserved.">
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="loadBrands()">Cancel</button>
          <button type="submit" class="btn btn-primary">${saveIcon} ${isEdit ? 'Save Brand' : 'Create Brand'}</button>
        </div>
      </form>
    </div>`;
  document.getElementById('content').innerHTML = content;
}

async function saveBrand(event, id = null) {
  event.preventDefault();
  const _val = (elId) => (document.getElementById(elId) || {}).value || '';
  const data = {
    name: _val('brand-name'),
    description: _val('brand-description'),
    website_url: _val('brand-website'),
    logo_url: _val('brand-logo'),
    status: _val('brand-status'),
    is_default: document.getElementById('brand-is-default')?.checked || false,
    email: {
      from_email: _val('brand-email-from'),
      from_name: _val('brand-email-from-name'),
      reply_to_email: _val('brand-email-reply'),
      reply_to_name: _val('brand-email-reply-name'),
      bcc_email: _val('brand-email-bcc'),
      email_header: _val('brand-email-header'),
      email_footer: _val('brand-email-footer')
    },
    landing_pages: {
      default_url: _val('brand-lp-default'),
      mirror_page_url: _val('brand-lp-mirror'),
      unsubscription_url: _val('brand-lp-unsub'),
      favicon_url: _val('brand-lp-favicon')
    },
    social: {
      facebook: _val('brand-social-facebook'),
      instagram: _val('brand-social-instagram'),
      twitter: _val('brand-social-twitter'),
      linkedin: _val('brand-social-linkedin'),
      youtube: _val('brand-social-youtube'),
      tiktok: _val('brand-social-tiktok')
    },
    colors: {
      primary: _val('brand-color-primary'),
      secondary: _val('brand-color-secondary'),
      accent: _val('brand-color-accent'),
      text: _val('brand-color-text'),
      background: _val('brand-color-bg')
    },
    typography: {
      heading_font: _val('brand-font-heading'),
      body_font: _val('brand-font-body')
    },
    legal: {
      company_name: _val('brand-legal-company'),
      phone: _val('brand-legal-phone'),
      address_line1: _val('brand-legal-addr1'),
      address_line2: _val('brand-legal-addr2'),
      city: _val('brand-legal-city'),
      state: _val('brand-legal-state'),
      zip: _val('brand-legal-zip'),
      country: _val('brand-legal-country'),
      privacy_policy_url: _val('brand-legal-privacy'),
      terms_url: _val('brand-legal-terms'),
      copyright_text: _val('brand-legal-copyright')
    }
  };
  try {
    const url = id ? `/api/brands/${id}` : '/api/brands';
    const method = id ? 'PUT' : 'POST';
    const resp = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!resp.ok) throw new Error((await resp.json()).error || 'Failed to save');
    showToast(`Brand ${id ? 'updated' : 'created'} successfully`, 'success');
    loadBrands();
  } catch (error) {
    showToast(`Error: ${error.message}`, 'error');
  }
}

async function deleteBrand(id) {
  if (!confirm('Delete this brand?')) return;
  try {
    const resp = await fetch(`/api/brands/${id}`, { method: 'DELETE' });
    if (!resp.ok) throw new Error('Failed to delete');
    showToast('Brand deleted', 'success');
    loadBrands();
  } catch (error) {
    showToast('Error deleting brand', 'error');
  }
}

// Subscription Services View
async function loadSubscriptionServices() {
  showLoading();
  try {
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${_afIco('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>', 16)} Subscription Services</h3>
          <div class="card-subtitle">Manage subscription lists and preferences</div>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Service Name</th>
                  <th>Type</th>
                  <th>Subscribers</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colspan="6" style="text-align: center; padding: var(--spacing-700);">
                  <div style="font-size: 3rem; margin-bottom: var(--spacing-300);">${_afIco('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>', 48)}</div>
                  <h3>No subscription services</h3>
                  <p style="color: var(--text-secondary); margin-bottom: var(--spacing-400);">Create subscription lists for newsletter management</p>
                  <button class="btn btn-primary" onclick="showToast('Subscription manager coming soon!', 'info')">${_afIco('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>', 14)} Create Service</button>
                </td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    document.getElementById('content').innerHTML = content;
  } catch (error) {
    showError('Failed to load Subscription Services');
  } finally {
    hideLoading();
  }
}

// Predefined Filters View
async function loadPredefinedFilters() {
  showLoading();
  try {
    const response = await fetch('/api/predefined-filters');
    const data = await response.json();
    const filters = data.filters || [];
    
    const tableRows = filters.map(f => `
      <tr>
        <td data-column-id="id">${f.id}</td>
        <td data-column-id="name">${createTableLink(f.name, `editPredefinedFilter(${f.id})`)}</td>
        <td data-column-id="entity_type">${f.entity_type}</td>
        <td data-column-id="conditions"><code>${JSON.stringify(f.conditions || {})}</code></td>
        <td data-column-id="usage_count">${f.usage_count || 0}</td>
        <td>${createActionMenu(f.id, [
          {icon: _afIco('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>', 14), label: 'Edit', onclick: `editPredefinedFilter(${f.id})`},
          {divider: true},
          {icon: _afIco('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', 14), label: 'Delete', onclick: `deletePredefinedFilter(${f.id})`, danger: true}
        ])}</td>
      </tr>
    `).join('');
    
    const columns = [
      { id: 'id', label: 'ID' },
      { id: 'name', label: 'Filter Name' },
      { id: 'entity_type', label: 'Entity Type' },
      { id: 'conditions', label: 'Conditions' },
      { id: 'usage_count', label: 'Usage Count' }
    ];
    
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${_afIco('<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>', 16)} Predefined Filters</h3>
          <button class="btn btn-primary" onclick="showPredefinedFilterForm()">+ Create Filter</button>
        </div>
        
        ${createTableToolbar({
          resultCount: filters.length,
          totalCount: filters.length,
          showColumnSelector: true,
          columns,
          viewKey: 'predefined-filters'
        })}
        
        <div class="data-table-container">
          <table class="data-table" data-view="predefined-filters">
            <thead>
              <tr>
                ${createSortableHeader('id', 'ID', currentTableSort)}
                ${createSortableHeader('name', 'Filter Name', currentTableSort)}
                ${createSortableHeader('entity_type', 'Entity Type', currentTableSort)}
                <th data-column-id="conditions">Conditions</th>
                ${createSortableHeader('usage_count', 'Usage Count', currentTableSort)}
                <th style="width: 50px;"></th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #6B7280;">No predefined filters found</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
    document.getElementById('content').innerHTML = content;
    applyColumnVisibility('predefined-filters');
  } catch (error) {
    showError('Failed to load Predefined Filters');
  } finally {
    hideLoading();
  }
}

// Asset Library View
let assetsSearch = '';
let assetsType = 'all';

function updateAssetsSearch(value) {
  assetsSearch = value || '';
  if (typeof debounce === 'function') {
    debounce('assetsSearch', () => loadAssets(), 300);
  } else {
    loadAssets();
  }
}

function updateAssetsType(value) {
  assetsType = value || 'all';
  loadAssets();
}

async function loadAssets() {
  showLoading();
  try {
    if (typeof ensureAllFoldersLoaded === 'function') await ensureAllFoldersLoaded();
    const query = new URLSearchParams();
    if (assetsType !== 'all') query.set('type', assetsType);
    if (assetsSearch) query.set('search', assetsSearch);
    const response = await fetch(`/api/assets?${query.toString()}`);
    const data = await response.json();
    let assets = data.assets || [];

    if (typeof applyFolderFilter === 'function') {
      assets = applyFolderFilter('assets', assets);
    }
    const deliveriesResp = await fetch('/api/deliveries');
    const deliveriesData = await deliveriesResp.json();
    const deliveries = deliveriesData.deliveries || deliveriesData || [];
    
    const deliveryContent = deliveries.map(d => ({
      id: d.id,
      name: d.name,
      content: `${JSON.stringify(d.content_blocks || '')} ${d.content || ''}`
    }));
    
    const assetUsage = new Map();
    const ensureAssetUsage = (id) => {
      if (!assetUsage.has(id)) {
        assetUsage.set(id, { deliveries: [] });
      }
      return assetUsage.get(id);
    };
    const addUniqueUsage = (list, item) => {
      if (!list.some(existing => existing.id === item.id)) {
        list.push(item);
      }
    };
    
    assets.forEach(asset => {
      const assetUrl = String(asset.url || '');
      if (!assetUrl) return;
      deliveryContent.forEach(delivery => {
        if (delivery.content.includes(assetUrl)) {
          const usage = ensureAssetUsage(asset.id);
          addUniqueUsage(usage.deliveries, { id: delivery.id, name: delivery.name });
        }
      });
    });
    
    const assetsViewMode = window._contentListViewMode['assets'] || 'list';

    const assetCard = a => {
      const isImg = a.type === 'image' && a.url;
      const imgAlt = (a.name || '').replace(/"/g, '&quot;');
      const imgUrl = (a.url || '').replace(/"/g, '&quot;');
      const docIcon = `<span class="inventory-card-icon">${_afIco('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>', 32)}</span>`;
      const preview = isImg
        ? `<img src="${imgUrl}" alt="${imgAlt}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><span class="inventory-card-icon inventory-card-img-fallback" style="display:none;width:100%;height:100%;align-items:center;justify-content:center;background:var(--bg-secondary,#f1f5f9);">${_afIco('<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>', 32)}</span>`
        : docIcon;
      const urlEsc = (a.url || '').replace(/'/g, "&#39;");
      return `<div class="inventory-card" onclick="copyAssetUrl('${urlEsc}'); showToast('URL copied', 'success')">
        <div class="inventory-card-preview inventory-card-preview-asset">${preview}</div>
        <div class="inventory-card-body">
          <div class="inventory-card-name">${a.name}</div>
          <div class="inventory-card-meta">${a.type || 'file'} · ${(a.size / 1024).toFixed(1)} KB</div>
        </div>
      </div>`;
    };

    const rows = assets.map(a => {
      const usage = assetUsage.get(a.id) || { deliveries: [] };
      const usedInItems = [
        ...usage.deliveries.map(d => ({ label: `Delivery: ${d.name}`, onclick: `editDelivery(${d.id})` }))
      ];
      const previewCell = a.type === 'image' && a.url
        ? `<td data-column-id="preview"><img src="${(a.url || '').replace(/"/g, '&quot;')}" alt="${(a.name || '').replace(/"/g, '&quot;')}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;" onerror="this.onerror=null;this.src='';this.style.background='var(--bg-secondary,#f1f5f9)';this.alt=''"></td>`
        : `<td data-column-id="preview"><span class="inventory-card-icon" style="display:inline-flex;width:40px;height:40px;align-items:center;justify-content:center;background:var(--bg-secondary,#f1f5f9);border-radius:4px;">${_afIco('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>', 20)}</span></td>`;
      return `
        <tr>
          ${previewCell}
          <td data-column-id="name">${a.name}</td>
          <td data-column-id="type">${a.type}</td>
          <td data-column-id="size">${(a.size / 1024).toFixed(1)} KB</td>
          <td data-column-id="tags">${Array.isArray(a.tags) ? a.tags.join(', ') : (a.tags || '-')}</td>
          <td data-column-id="used_in">${renderUsedInList(usedInItems)}</td>
          <td data-column-id="created_at">${new Date(a.created_at || Date.now()).toLocaleString()}</td>
          <td>${createActionMenu(a.id, [
            { icon: _afIco('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>', 14), label: 'Copy URL', onclick: `copyAssetUrl("${a.url}")`},
            { divider: true },
            { icon: _afIco('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', 14), label: 'Delete', onclick: `deleteAsset(${a.id})`, danger: true }
          ])}</td>
        </tr>
      `;
    }).join('');
    
    const columns = [
      { id: 'preview', label: 'Preview' },
      { id: 'name', label: 'Name' },
      { id: 'type', label: 'Type' },
      { id: 'size', label: 'Size' },
      { id: 'tags', label: 'Tags' },
      { id: 'used_in', label: 'Used in' },
      { id: 'created_at', label: 'Created at' }
    ];
    
    let content = `
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
          <h3 class="card-title">${_afIco('<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>')} Asset Library</h3>
          <div style="display:flex;gap:8px;align-items:center">
            ${typeof getFolderToggleButtonHtml === 'function' ? getFolderToggleButtonHtml('assets') : ''}
            <label class="btn btn-primary" style="cursor:pointer;">
              + Upload
              <input type="file" id="asset-upload-input" style="display:none;" onchange="uploadAsset(this.files)">
            </label>
          </div>
        </div>
        ${createTableToolbar({
          resultCount: assets.length,
          totalCount: assets.length,
          showColumnSelector: true,
          showViewModeToggle: true,
          viewMode: assetsViewMode,
          viewKeyForMode: 'assets',
          columns,
          viewKey: 'assets',
          showSearch: true,
          searchPlaceholder: 'Search assets...',
          searchValue: assetsSearch || '',
          onSearch: 'updateAssetsSearch(this.value)',
          filterTags: assetsType !== 'all' ? [{ key: 'type', label: 'Type', value: assetsType === 'image' ? 'Images' : 'Files' }] : [],
          onClearTag: 'clearAssetsFilterTag',
          filters: [
            {
              type: 'select',
              label: 'Type',
              value: assetsType,
              onChange: 'updateAssetsType(this.value)',
              options: [
                { value: 'all', label: 'All types' },
                { value: 'image', label: 'Images' },
                { value: 'file', label: 'Files' }
              ]
            }
          ]
        })}
        ${assetsViewMode === 'grid'
          ? `<div class="inventory-grid">${assets.length ? assets.map(assetCard).join('') : '<div class="empty-state" style="grid-column:1/-1;padding:3rem;text-align:center;color:#6B7280">No assets found</div>'}</div>`
          : `<div class="data-table-container">
          <table class="data-table" data-view="assets">
            <thead>
              <tr>
                <th data-column-id="preview">Preview</th>
                ${createSortableHeader('name', 'Name', currentTableSort)}
                ${createSortableHeader('type', 'Type', currentTableSort)}
                <th data-column-id="size">Size</th>
                <th data-column-id="tags">Tags</th>
                <th data-column-id="used_in">Used in</th>
                ${createSortableHeader('created_at', 'Created at', currentTableSort)}
                <th style="width: 50px;"></th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#6B7280;">No assets found</td></tr>'}
            </tbody>
          </table>
        </div>`
        }
      </div>
    `;
    if (typeof wrapWithFolderSidebarHtml === 'function') {
      content = wrapWithFolderSidebarHtml('assets', 'assets', content);
    }
    document.getElementById('content').innerHTML = content;
    applyColumnVisibility('assets');
    if (typeof initListFolderTree === 'function') {
      initListFolderTree('assets', 'assets', loadAssets);
    }
  } catch (error) {
    showError('Failed to load assets');
  } finally {
    hideLoading();
  }
}

function setAssetsTab(tabLabel) {
  assetsType = tabLabel === 'Images' ? 'image' : tabLabel === 'Files' ? 'file' : 'all';
  loadAssets();
}

function clearAssetsFilterTag(key) {
  if (key === 'type') assetsType = 'all';
  loadAssets();
}

async function uploadAsset(files) {
  if (!files || !files.length) return;
  const file = files[0];
  const form = new FormData();
  form.append('file', file);
  const currentFolderId = window['_folderFilter_assets'];
  if (currentFolderId) form.append('folder_id', currentFolderId);
  try {
    showLoading();
    const response = await fetch('/api/assets', { method: 'POST', body: form });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Upload failed');
    showToast('Asset uploaded', 'success');
    loadAssets();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function deleteAsset(id) {
  if (!confirm('Delete this asset?')) return;
  try {
    showLoading();
    const response = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Delete failed');
    showToast('Asset deleted', 'success');
    loadAssets();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function copyAssetUrl(url) {
  navigator.clipboard.writeText(url);
  showToast('Asset URL copied', 'success');
}

function showPredefinedFilterForm(filter = null) {
  const isEdit = !!filter;
  const content = `
    <div class="form-container">
      <form id="predefined-filter-form" onsubmit="handlePredefinedFilterSubmit(event, ${filter?.id || 'null'})">
        <div class="form-section">
          <h3 class="form-section-title">Filter Details</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label form-label-required">Name</label>
              <input type="text" id="filter-name" class="form-input" value="${filter?.name || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label form-label-required">Entity Type</label>
              <select id="filter-entity" class="form-input" required>
                <option value="contacts" ${filter?.entity_type === 'contacts' ? 'selected' : ''}>Contacts</option>
                <option value="workflows" ${filter?.entity_type === 'workflows' ? 'selected' : ''}>Workflows</option>
                <option value="deliveries" ${filter?.entity_type === 'deliveries' ? 'selected' : ''}>Deliveries</option>
                <option value="segments" ${filter?.entity_type === 'segments' ? 'selected' : ''}>Segments</option>
                <option value="audiences" ${filter?.entity_type === 'audiences' ? 'selected' : ''}>Audiences</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Usage Count</label>
              <input type="number" id="filter-usage" class="form-input" value="${filter?.usage_count || 0}" min="0">
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Conditions (JSON)</label>
              <textarea id="filter-conditions" class="form-input" rows="5">${JSON.stringify(filter?.conditions || {}, null, 2)}</textarea>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="loadPredefinedFilters()">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Filter</button>
        </div>
      </form>
    </div>
  `;
  document.getElementById('content').innerHTML = content;
}

async function handlePredefinedFilterSubmit(event, filterId) {
  event.preventDefault();
  let conditions = {};
  try {
    const raw = document.getElementById('filter-conditions').value || '{}';
    conditions = JSON.parse(raw);
  } catch (error) {
    showToast('Invalid JSON in conditions', 'error');
    return;
  }
  
  const payload = {
    name: document.getElementById('filter-name').value,
    entity_type: document.getElementById('filter-entity').value,
    usage_count: parseInt(document.getElementById('filter-usage').value || '0', 10),
    conditions
  };
  
  try {
    showLoading();
    const isEdit = !!filterId;
    const url = isEdit ? `/api/predefined-filters/${filterId}` : '/api/predefined-filters';
    const method = isEdit ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save filter');
    showToast(`Filter ${isEdit ? 'updated' : 'created'} successfully`, 'success');
    loadPredefinedFilters();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function editPredefinedFilter(id) {
  try {
    showLoading();
    const response = await fetch(`/api/predefined-filters/${id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load filter');
    showPredefinedFilterForm(data);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function deletePredefinedFilter(id) {
  if (!confirm('Delete this filter?')) return;
  try {
    showLoading();
    const response = await fetch(`/api/predefined-filters/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete filter');
    showToast('Filter deleted', 'success');
    loadPredefinedFilters();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}
