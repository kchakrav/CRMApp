const API_BASE = '/api';

const editorState = {
  deliveryId: null,
  landingPageId: null,
  landingPageMode: false,
  landingPage: null,
  fragmentId: null,
  fragmentMode: false,
  fragment: null,
  fragmentType: 'email',
  delivery: null,
  blocks: [],
  audiences: [],
  segments: [],
  activeMode: 'components',
  htmlOverride: '',
  simulateContent: true,
  personalizationTarget: null,
  personalizationTables: [],
  selectedBlockId: null,
  activeTab: 'settings',
  componentView: 'list',
  previewTab: 'actual',
  previewDevice: 'desktop',
  rightPanelOpen: true,
  previewMode: false,
  aiPanelOpen: false,
  aiTarget: 'body',
  aiTargetManual: false,
  aiSubpanel: null,
  textSelection: null,
  bodyStyle: {
    backgroundColor: '#ffffff',
    padding: '24px',
    maxWidth: '640px',
    align: 'center'
  },
  history: [],
  historyIndex: -1,
  historyLocked: false,
  pendingImageBlockId: null,
  importAssets: null,
  canvasInitialized: false,
  dropIndicator: null,
  fragments: [],
  fragmentSearch: '',
  assets: [],
  assetSearch: ''
};

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  editorState.deliveryId = parseInt(params.get('deliveryId'), 10);
  editorState.landingPageId = parseInt(params.get('landingPageId'), 10);
  editorState.landingPageMode = params.get('landingPageMode') === '1' || !Number.isNaN(editorState.landingPageId);
  editorState.fragmentId = parseInt(params.get('fragmentId'), 10);
  editorState.fragmentMode = params.get('fragmentMode') === '1' || !Number.isNaN(editorState.fragmentId);
  editorState.fragmentType = params.get('fragmentType') || (editorState.landingPageMode ? 'landing' : 'email');
  initRail();
  setDevicePreview(editorState.previewDevice, { silent: true });
  loadEditorData();
  const simulateBtn = document.getElementById('simulate-content-btn');
  if (simulateBtn) simulateBtn.textContent = 'Simulated';
  // Failsafe: clear loading if stuck
  setTimeout(() => {
    const loading = document.getElementById('loading');
    if (loading && !loading.classList.contains('hidden')) {
      showToast('Editor is taking too long to load.', 'warning');
      hideLoading();
    }
  }, 12000);
  document.addEventListener('click', (event) => {
    const dropdown = document.getElementById('email-more-dropdown');
    if (!dropdown) return;
    const menu = event.target.closest('.email-more-menu');
    if (!menu) dropdown.classList.add('hidden');
    if (!event.target.closest('.email-inline-toolbar') && !event.target.closest('.email-block')) {
      hideInlineToolbar();
    }
  });
});

window.addEventListener('error', (event) => {
  showToast(event?.message || 'Unexpected error', 'error');
  hideLoading();
});

window.addEventListener('unhandledrejection', (event) => {
  showToast(event?.reason?.message || 'Unexpected error', 'error');
  hideLoading();
});

function pushHistory() {
  if (editorState.historyLocked) return;
  const snapshot = {
    blocks: JSON.parse(JSON.stringify(editorState.blocks)),
    bodyStyle: JSON.parse(JSON.stringify(editorState.bodyStyle)),
    htmlOverride: editorState.htmlOverride || ''
  };
  if (editorState.historyIndex < editorState.history.length - 1) {
    editorState.history = editorState.history.slice(0, editorState.historyIndex + 1);
  }
  editorState.history.push(snapshot);
  editorState.historyIndex = editorState.history.length - 1;
}

function restoreHistory(index) {
  const snapshot = editorState.history[index];
  if (!snapshot) return;
  editorState.historyLocked = true;
  editorState.blocks = JSON.parse(JSON.stringify(snapshot.blocks));
  editorState.bodyStyle = JSON.parse(JSON.stringify(snapshot.bodyStyle));
  editorState.htmlOverride = snapshot.htmlOverride || '';
  editorState.historyIndex = index;
  renderEmailBlocks();
  editorState.historyLocked = false;
}

function undoEditor() {
  if (editorState.historyIndex <= 0) return;
  restoreHistory(editorState.historyIndex - 1);
}

function redoEditor() {
  if (editorState.historyIndex >= editorState.history.length - 1) return;
  restoreHistory(editorState.historyIndex + 1);
}

function initRail() {
  document.querySelectorAll('.email-rail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (!mode) return;
      setActiveMode(mode);
    });
  });
}

function setActiveMode(mode) {
  editorState.activeMode = mode;
  document.querySelectorAll('.email-rail-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  renderLeftPanel(mode);
  if (mode === 'components') {
    initEmailDesigner();
  }
}

async function loadEditorData() {
  try {
    showLoading();
    const fragmentType = editorState.fragmentType || (editorState.landingPageMode ? 'landing' : 'email');
    const [fragmentsRes, segmentsRes, audiencesRes, assetsRes] = await Promise.all([
      fetchWithTimeout(`${API_BASE}/fragments?type=${encodeURIComponent(fragmentType)}`),
      fetchWithTimeout(`${API_BASE}/segments`),
      fetchWithTimeout(`${API_BASE}/audiences`),
      fetchWithTimeout(`${API_BASE}/assets`)
    ]);
    const fragmentsPayload = await fragmentsRes.json();
    editorState.fragments = fragmentsPayload.fragments || fragmentsPayload || [];
    editorState.segments = (await segmentsRes.json()).segments || [];
    editorState.audiences = (await audiencesRes.json()).audiences || [];
    const assetsPayload = await assetsRes.json();
    editorState.assets = assetsPayload.assets || [];

    if (editorState.fragmentMode) {
      if (Number.isNaN(editorState.fragmentId)) {
        editorState.fragment = {
          id: null,
          name: 'New Fragment',
          type: fragmentType,
          status: 'draft',
          version: 1,
          blocks: []
        };
      } else {
        const fragmentRes = await fetchWithTimeout(`${API_BASE}/fragments/${editorState.fragmentId}`);
        const fragment = await fragmentRes.json();
        if (!fragmentRes.ok) throw new Error(fragment.error || 'Failed to load fragment');
        editorState.fragment = fragment;
      }
      editorState.blocks = Array.isArray(editorState.fragment.blocks) ? editorState.fragment.blocks : [];
      document.getElementById('email-editor-delivery-name').textContent = editorState.fragment?.name || 'Fragment';
      setValue('delivery-subject-input', '');
      setValue('delivery-preheader-input', '');
      setValue('delivery-document-title-input', '');
      setValue('delivery-document-language-input', '');
      applyFragmentUI();
    } else if (editorState.landingPageMode) {
      if (Number.isNaN(editorState.landingPageId)) {
        editorState.landingPage = {
          id: null,
          name: 'New Landing Page',
          slug: '',
          status: 'draft',
          version: 1,
          content_blocks: [],
          body_style: editorState.bodyStyle
        };
      } else {
        const pageRes = await fetchWithTimeout(`${API_BASE}/landing-pages/${editorState.landingPageId}`);
        const page = await pageRes.json();
        if (!pageRes.ok) throw new Error(page.error || 'Failed to load landing page');
        editorState.landingPage = page;
      }
      editorState.blocks = Array.isArray(editorState.landingPage.content_blocks) ? editorState.landingPage.content_blocks : [];
      refreshFragmentReferences();
      editorState.bodyStyle = editorState.landingPage.body_style || editorState.bodyStyle;
      document.getElementById('email-editor-delivery-name').textContent = editorState.landingPage?.name || 'Landing Page';
      hydrateLandingPageFields(editorState.landingPage);
      setupLandingPageNameListener();
      applyLandingPageUI(true);
    } else {
      if (!editorState.deliveryId || Number.isNaN(editorState.deliveryId)) {
        showToast('Missing delivery id', 'error');
        return;
      }
      const deliveryRes = await fetchWithTimeout(`${API_BASE}/deliveries/${editorState.deliveryId}`);
      const delivery = await deliveryRes.json();
      if (!deliveryRes.ok) throw new Error(delivery.error || 'Failed to load delivery');
      editorState.delivery = delivery;
      editorState.blocks = Array.isArray(delivery.content_blocks) ? delivery.content_blocks : [];
      refreshFragmentReferences();
      hydrateFormFields(delivery);
      document.getElementById('email-editor-delivery-name').textContent = delivery.name || 'Untitled delivery';
      applyLandingPageUI(false);
    }
    renderLeftPanel(editorState.activeMode);
    initEmailDesigner();
    pushHistory();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function refreshFragmentReferences() {
  const fragments = Array.isArray(editorState.fragments) ? editorState.fragments : [];
  const fragmentMap = new Map(fragments.map(fragment => [String(fragment.id), fragment]));
  const updateBlocks = (blocks = []) => {
    blocks.forEach(block => {
      if (block.type === 'fragment') {
        const latest = fragmentMap.get(String(block.fragmentId));
        if (latest) {
          block.fragmentName = latest.name;
          block.fragmentStatus = latest.status || 'draft';
          block.fragmentVersion = latest.version || block.fragmentVersion || 1;
          block.fragmentBlocks = Array.isArray(latest.blocks) ? latest.blocks : [];
          block.fragmentHtml = latest.html || '';
        }
        return;
      }
      if (block.type === 'structure') {
        (block.columns || []).forEach(col => updateBlocks(col.blocks || []));
      }
      if (block.type === 'container') {
        (block.columns || []).forEach(col => updateBlocks(col.blocks || []));
      }
    });
  };
  updateBlocks(editorState.blocks);
}

async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

function hydrateFormFields(delivery) {
  setValue('delivery-subject-input', delivery.subject || '');
  setValue('delivery-preheader-input', delivery.preheader || '');
  setValue('delivery-document-title-input', delivery.document_title || '');
  setValue('delivery-document-language-input', delivery.document_language || '');
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function renderLeftPanel(mode) {
  const panel = document.getElementById('email-left-panel');
  if (!panel) return;
  panel.innerHTML = getPanelContent(mode);
  if (mode === 'components') {
    panel.querySelectorAll('.email-block-item, .component-card').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        const payload = {
          kind: 'new',
          type: item.dataset.block,
          variant: item.dataset.variant || ''
        };
        e.dataTransfer.setData('text/plain', JSON.stringify(payload));
      });
    });
    panel.querySelectorAll('.component-list-item').forEach(item => {
      item.addEventListener('click', () => {
        panel.querySelectorAll('.component-list-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
      });
    });
  }
  if (mode === 'structure') {
    panel.querySelectorAll('.nav-tree-item[data-block-id]').forEach(item => {
      item.addEventListener('click', () => {
        panel.querySelectorAll('.nav-tree-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        editorState.selectedBlockId = item.dataset.blockId;
        document.querySelectorAll('.email-block').forEach(block => block.classList.remove('selected'));
        const selected = document.querySelector(`.email-block[data-block-id="${editorState.selectedBlockId}"]`);
        if (selected) selected.classList.add('selected');
        renderStylesPanel();
        switchEditorTab('styles');
        scrollToBlock(editorState.selectedBlockId);
      });
    });
  }
  if (mode === 'fragments') {
    const searchInput = panel.querySelector('#fragment-search-input');
    if (searchInput) {
      searchInput.value = editorState.fragmentSearch || '';
      searchInput.addEventListener('input', () => {
        editorState.fragmentSearch = searchInput.value;
        renderFragmentPanelList();
      });
    }
    renderFragmentPanelList();
    attachFragmentItemHandlers();
  }
}

function getPanelContent(mode) {
  if (mode === 'fragments') {
    return `
      <div class="editor-panel-header">
        <span>Fragments</span>
        <div class="editor-panel-actions">
          <button class="btn btn-sm btn-secondary" type="button" onclick="openFragmentLibrary()">Open library</button>
        </div>
      </div>
      <div class="editor-panel-search">
        <input type="text" class="form-input" id="fragment-search-input" placeholder="Search fragments">
      </div>
      <div class="editor-panel-section">
        <div class="designer-section-title">Library</div>
        <div id="fragment-list"></div>
      </div>
    `;
  }
  if (mode === 'structure') {
    return `
      <div class="editor-panel-header">
        <span>Navigation tree</span>
      </div>
      <div class="nav-tree">
        <div class="nav-tree-item active">Body</div>
        ${renderStructureTree(editorState.blocks || [])}
      </div>
    `;
  }
  if (mode === 'links') {
    const links = getTrackedLinks();
    return `
      <div class="editor-panel-header">
        <span>Tracked URLs</span>
        <div class="editor-panel-actions">
          <button class="btn btn-sm btn-secondary" type="button">Export</button>
        </div>
      </div>
      <div class="tracked-url-header">
        <span>Tracked URL</span>
        <span>Tracking</span>
      </div>
      <div class="tracked-url-table">
        ${links.length ? links.map(link => renderTrackedUrl(link.label, link.url, true)).join('') : '<div class="empty-state">No links detected.</div>'}
      </div>
    `;
  }
  if (mode === 'assets') {
    return renderAssetsPanel();
  }
  if (mode === 'conditional') {
    return renderConditionalPanel();
  }
  const view = editorState.componentView === 'list' ? 'list' : 'cards';
  return `
    <div class="editor-panel-header">
      <span>Components</span>
      <div class="editor-panel-actions component-view-toggle">
        <button class="btn btn-sm btn-secondary" type="button" onclick="setActiveMode('fragments')">Insert <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin:0 2px;"><path d="m9 18 6-6-6-6"/></svg> Fragment</button>
        <button class="btn btn-icon ${view === 'cards' ? 'active' : ''}" type="button" title="Cards view" aria-label="Cards view" onclick="setComponentView('cards')">▦</button>
        <button class="btn btn-icon ${view === 'list' ? 'active' : ''}" type="button" title="List view" aria-label="List view" onclick="setComponentView('list')">≣</button>
      </div>
    </div>
    <div class="editor-panel-search">
      <input type="text" class="form-input" placeholder="Search components">
    </div>
    <div class="editor-panel-section">
      <div class="designer-section-title">Structures</div>
      ${view === 'cards' ? renderStructureCards() : renderStructureList()}
    </div>
    <div class="editor-panel-section">
      <div class="designer-section-title">Contents</div>
      ${view === 'cards' ? renderContentCards() : renderContentList()}
    </div>
  `;
}

function renderFragmentItem(fragment) {
  const name = fragment?.name || 'Untitled fragment';
  const status = fragment?.status || 'Draft';
  const type = fragment?.type || 'email';
  const folder = fragment?.folder ? ` · ${fragment.folder}` : '';
  return `
    <div class="email-fragment-item" draggable="true" data-fragment-id="${fragment?.id || ''}">
      <div class="email-fragment-main">
        <div class="email-fragment-title">${name}</div>
        <div class="email-fragment-meta">${type.toUpperCase()} · ${status} · Locked${folder}</div>
      </div>
      <div class="email-fragment-actions">
        <button class="btn btn-sm btn-secondary" type="button" onclick="addFragmentBlock('${fragment?.id || ''}')">Insert</button>
        <button class="btn btn-sm btn-ghost" type="button" onclick="openFragmentEditorFromBlock('${fragment?.id || ''}', '${fragment?.type || ''}')">Edit</button>
      </div>
    </div>
  `;
}

function renderFragmentPanelList() {
  const list = document.getElementById('fragment-list');
  if (!list) return;
  const fragments = Array.isArray(editorState.fragments) ? editorState.fragments.slice() : [];
  const query = (editorState.fragmentSearch || '').toLowerCase();
  const filtered = fragments.filter(fragment => {
    if (!query) return true;
    const name = (fragment.name || '').toLowerCase();
    const status = (fragment.status || '').toLowerCase();
    const type = (fragment.type || '').toLowerCase();
    const tags = Array.isArray(fragment.tags) ? fragment.tags.join(' ').toLowerCase() : '';
    const folder = (fragment.folder || '').toLowerCase();
    return name.includes(query) || status.includes(query) || type.includes(query) || tags.includes(query) || folder.includes(query);
  });
  list.innerHTML = filtered.length
    ? filtered.map(fragment => renderFragmentItem(fragment)).join('')
    : '<div class="empty-state">No fragments found.</div>';
}

function attachFragmentItemHandlers() {
  document.querySelectorAll('.email-fragment-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      const payload = {
        kind: 'fragment',
        fragmentId: item.dataset.fragmentId
      };
      e.dataTransfer.setData('text/plain', JSON.stringify(payload));
    });
  });
}

function renderAssetCard(name, meta) {
  return `
    <div class="asset-card">
      <div class="asset-thumb">
        <div class="asset-thumb-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg></div>
      </div>
      <div class="asset-title">${name}</div>
      <div class="asset-meta">${meta.toUpperCase()}</div>
    </div>
  `;
}

function renderAssetsPanel() {
  const query = (editorState.assetSearch || '').toLowerCase();
  const assets = Array.isArray(editorState.assets) ? editorState.assets.slice() : [];
  const filtered = assets.filter(asset => {
    if (!query) return true;
    const name = (asset.name || asset.filename || '').toLowerCase();
    const tags = Array.isArray(asset.tags) ? asset.tags.join(' ').toLowerCase() : '';
    return name.includes(query) || tags.includes(query);
  });
  return `
    <div class="asset-toolbar">
      <button class="asset-pill active" type="button">Assets</button>
      <button class="asset-pill" type="button">Collections</button>
    </div>
    <div class="asset-header">
      <div class="asset-header-title">Files</div>
      <button class="btn btn-icon" type="button" title="More">⋯</button>
    </div>
    <div class="asset-search-row">
      <div class="asset-search">
        <span class="asset-search-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></span>
        <input type="text" class="form-input" placeholder="Search assets" value="${editorState.assetSearch || ''}" oninput="updateAssetSearch(this.value)">
      </div>
      <button class="btn btn-icon" type="button" title="Filter">⏷</button>
    </div>
    <div class="asset-view-row">
      <button class="btn btn-icon active" type="button" title="Grid view">▦</button>
    </div>
    <div class="asset-grid">
      ${filtered.length ? filtered.map(asset => renderAssetItem(asset)).join('') : '<div class="empty-state">No assets found.</div>'}
    </div>
  `;
}

function renderAssetItem(asset) {
  const name = asset?.name || asset?.filename || 'Asset';
  const typeLabel = asset?.type || 'file';
  const url = asset?.url || asset?.path || '';
  const isImage = typeLabel === 'image' || (asset?.mime_type || '').startsWith('image/');
  const thumb = isImage && url
    ? `<div class="asset-thumb" style="background-image:url('${url}'); background-size: cover; background-position: center;"></div>`
    : `<div class="asset-thumb"><div class="asset-thumb-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg></div></div>`;
  return `
    <div class="asset-card" onclick="copyAssetUrlToClipboard('${url}')">
      ${thumb}
      <div class="asset-title">${name}</div>
      <div class="asset-meta">${typeLabel.toUpperCase()}</div>
    </div>
  `;
}

function updateAssetSearch(value) {
  editorState.assetSearch = value || '';
  if (editorState.activeMode === 'assets') {
    renderLeftPanel('assets');
  }
}

function copyAssetUrlToClipboard(url) {
  if (!url) return;
  navigator.clipboard.writeText(url);
  showToast('Asset URL copied', 'success');
}

function renderConditionalPanel() {
  return `
    <div class="editor-panel-header">
      <span>Conditional content</span>
    </div>
    <div class="editor-panel-section">
      <div class="empty-state">Conditional content setup is coming soon.</div>
    </div>
  `;
}

function renderConditionalItem(title, status) {
  return `
    <div class="email-fragment-item">
      <div class="email-fragment-title">${title}</div>
      <div class="email-fragment-meta">${String(status || 'draft').toUpperCase()}</div>
    </div>
  `;
}

function renderTrackedUrl(label, url, enabled) {
  return `
    <div class="tracked-url-row">
      <div>
        <div class="tracked-url-label">${label}</div>
        <div class="tracked-url-value">${url}</div>
      </div>
      <div class="tracked-url-actions">
        <span class="tracked-url-status">${enabled ? 'Enabled' : 'Disabled'}</span>
        <button class="btn btn-sm btn-secondary" type="button">✎</button>
      </div>
    </div>
  `;
}

function getTrackedLinks() {
  const html = editorState.htmlOverride || generateEmailHtml(editorState.blocks);
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const anchors = Array.from(doc.querySelectorAll('a[href]'));
  const links = anchors.map((a, idx) => ({
    url: a.getAttribute('href') || '#',
    label: (a.textContent || '').trim() || `Link ${idx + 1}`
  }));
  const unique = new Map();
  links.forEach(link => {
    const key = `${link.url}::${link.label}`;
    if (!unique.has(key)) unique.set(key, link);
  });
  return Array.from(unique.values());
}

function setComponentView(view) {
  editorState.componentView = view;
  renderLeftPanel('components');
}

function renderStructureList() {
  const items = [
    { label: '1:1 column', variant: '1-1' },
    { label: '1:2 column Left', variant: '1-2-left' },
    { label: '1:3 column Left', variant: '1-3-left' },
    { label: '2:1 column Right', variant: '2-1-right' },
    { label: '2:2 column', variant: '2-2' },
    { label: '3:1 column Right', variant: '3-1-right' },
    { label: '3:3 column', variant: '3-3' },
    { label: '4:4 column', variant: '4-4' },
    { label: 'n:n column', variant: 'n-n' }
  ];
  return items.map(item => `
    <div class="email-block-item component-list-item" draggable="true" data-block="structure" data-variant="${item.variant}">
      <span class="component-list-handle" aria-hidden="true">⋮⋮</span>
      <span class="component-list-icon">
        <span class="component-list-thumb component-structure-thumb" data-variant="${item.variant}"></span>
      </span>
      <span class="component-list-label">${item.label}</span>
    </div>
  `).join('');
}

function renderContentList() {
  const items = [
    { label: 'Container', type: 'container', icon: '▣' },
    { label: 'Button', type: 'button', icon: '⬭' },
    { label: 'Text', type: 'text', icon: 'T' },
    { label: 'Form', type: 'form', icon: '⌂' },
    { label: 'Embed', type: 'embed', icon: '⧉' },
    { label: 'Divider', type: 'divider', icon: '━' },
    { label: 'Spacer', type: 'spacer', icon: '↕' },
    { label: 'HTML', type: 'html', icon: '</>' },
    { label: 'Image', type: 'image', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>' },
    { label: 'Social', type: 'social', icon: '⤴' }
  ];
  return items.map(item => `
    <div class="email-block-item component-list-item" draggable="true" data-block="${item.type}">
      <span class="component-list-handle" aria-hidden="true">⋮⋮</span>
      <span class="component-list-icon component-list-text">${item.icon}</span>
      <span class="component-list-label">${item.label}</span>
    </div>
  `).join('');
}

function renderStructureCards() {
  const items = [
    { label: '1:1 column', variant: '1-1' },
    { label: '1:2 column Left', variant: '1-2-left' },
    { label: '1:3 column Left', variant: '1-3-left' },
    { label: '2:1 column Right', variant: '2-1-right' },
    { label: '2:2 column', variant: '2-2' },
    { label: '3:1 column Right', variant: '3-1-right' },
    { label: '3:3 column', variant: '3-3' },
    { label: '4:4 column', variant: '4-4' },
    { label: 'n:n column', variant: 'n-n' }
  ];
  return `
    <div class="component-card-grid">
      ${items.map(item => `
        <div class="component-card" draggable="true" data-block="structure" data-variant="${item.variant}">
          <div class="component-card-thumb component-structure-thumb" data-variant="${item.variant}"></div>
          <div class="component-card-label">${item.label}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderContentCards() {
  const items = [
    { label: 'Container', type: 'container', icon: '⬚' },
    { label: 'Button', type: 'button', icon: '⬭' },
    { label: 'Text', type: 'text', icon: 'T' },
    { label: 'Form', type: 'form', icon: '⌂' },
    { label: 'Embed', type: 'embed', icon: '⧉' },
    { label: 'Divider', type: 'divider', icon: '━' },
    { label: 'HTML', type: 'html', icon: '</>' },
    { label: 'Image', type: 'image', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>' },
    { label: 'Social', type: 'social', icon: '⤴' },
    { label: 'Offer decision', type: 'offer', icon: '☆' },
    { label: 'Grid', type: 'grid', icon: '▦' }
  ];
  return `
    <div class="component-card-grid">
      ${items.map(item => `
        <div class="component-card" draggable="true" data-block="${item.type}">
          <div class="component-card-thumb component-content-thumb">
            <div class="component-card-icon">${item.icon}</div>
          </div>
          <div class="component-card-label">${item.label}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function initEmailDesigner() {
  const canvas = document.getElementById('email-designer-actual');
  if (!canvas) return;
  if (editorState.canvasInitialized) {
    renderEmailBlocks();
    return;
  }
  editorState.canvasInitialized = true;
  canvas.addEventListener('dragover', (e) => {
    if (e.target.closest('.structure-drop, .container-drop')) return;
    e.preventDefault();
    const container = getCanvasContainer();
    if (!container) return;
    const index = getDropIndex(container, e.clientY);
    showDropIndicator(container, index);
  });
  canvas.addEventListener('drop', (e) => {
    if (e.target.closest('.structure-drop, .container-drop')) return;
    e.preventDefault();
    const container = getCanvasContainer();
    if (!container) return;
    const index = getDropIndex(container, e.clientY);
    const payload = parseDragPayload(e);
    clearDropIndicator();
    if (payload) {
      handleDropToContainer(editorState.blocks, index, payload);
    }
  });
  canvas.addEventListener('dragleave', () => {
    clearDropIndicator();
  });
  renderEmailBlocks();
}

function createBlock(type, variant = '') {
  const id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const base = { id, type };
  if (type === 'text') base.content = 'Add your text here';
  if (type === 'image') {
    base.src = 'https://via.placeholder.com/600x200';
    base.alt = 'Image';
  }
  if (type === 'button') {
    base.text = 'Click me';
    base.url = 'https://example.com';
  }
  if (type === 'divider') base.thickness = 1;
  if (type === 'spacer') base.height = 20;
  if (type === 'html') base.html = '<div>Custom HTML</div>';
  if (type === 'form') {
    base.formTitle = 'Contact us';
    base.submitLabel = 'Submit';
    base.actionUrl = '';
  }
  if (type === 'embed') {
    base.embedUrl = '';
    base.embedCode = '';
  }
  if (type === 'structure') {
    base.variant = variant || '1-1';
    const columns = getStructureColumns(base.variant).length;
    base.columns = Array.from({ length: columns }).map((_, idx) => ({
      id: `${base.id}-col-${idx}`,
      blocks: []
    }));
  }
  if (type === 'container') {
    base.columns = [
      {
        id: `${base.id}-col-0`,
        blocks: []
      }
    ];
  }
  if (type === 'social') {
    base.links = {
      facebook: '',
      twitter: '',
      linkedin: ''
    };
  }
  return base;
}

function addEmailBlock(type, variant = '', targetContainer = null, insertIndex = null) {
  let resolvedVariant = variant;
  if (type === 'structure' && variant === 'n-n') {
    const raw = prompt('How many columns? (2-6)', '4');
    const parsed = parseInt(raw || '4', 10);
    const count = Number.isNaN(parsed) ? 4 : Math.min(Math.max(parsed, 2), 6);
    resolvedVariant = `n-${count}`;
  }
  const block = createBlock(type, resolvedVariant);
  const container = targetContainer || editorState.blocks;
  const index = Number.isInteger(insertIndex) ? insertIndex : container.length;
  container.splice(Math.max(0, Math.min(index, container.length)), 0, block);
  editorState.selectedBlockId = block.id;
  renderEmailBlocks();
  switchEditorTab('settings');
  pushHistory();
  return block;
}

function addFragmentBlock(fragmentId, targetContainer = null, insertIndex = null) {
  const fragment = (editorState.fragments || []).find(f => String(f.id) === String(fragmentId));
  if (!fragment) {
    showToast('Fragment not found', 'error');
    return null;
  }
  const block = {
    id: `fragment-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'fragment',
    fragmentId: fragment.id,
    fragmentName: fragment.name,
    fragmentStatus: fragment.status || 'draft',
    fragmentVersion: fragment.version || 1,
    fragmentRefMode: 'latest',
    fragmentType: fragment.type || editorState.fragmentType || 'landing',
    fragmentBlocks: Array.isArray(fragment.blocks) ? fragment.blocks : [],
    fragmentHtml: fragment.html || '',
    fragmentLocked: true
  };
  const container = targetContainer || editorState.blocks;
  const index = Number.isInteger(insertIndex) ? insertIndex : container.length;
  container.splice(Math.max(0, Math.min(index, container.length)), 0, block);
  editorState.selectedBlockId = block.id;
  renderEmailBlocks();
  pushHistory();
  return block;
}

function updateEmailBlock(id, field, value) {
  const context = findBlockContext(id);
  if (!context?.block) return;
  context.block[field] = value;
  renderEmailBlocks();
  pushHistory();
}

function updateEmailBlockLive(id, field, value) {
  const context = findBlockContext(id);
  if (!context?.block) return;
  context.block[field] = value;
}

function updateEmailBlockLivePreview(id, field, value) {
  updateEmailBlockLive(id, field, value);
  renderEmailBlocks({ skipStylesPanel: true });
}

function updateEmailBlockCommit(id, field, value) {
  updateEmailBlock(id, field, value);
}

function moveEmailBlock(id, direction) {
  const context = findBlockContext(id);
  if (!context) return;
  const idx = context.container.findIndex(b => b.id === id);
  if (idx === -1) return;
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= context.container.length) return;
  const temp = context.container[idx];
  context.container[idx] = context.container[swapIdx];
  context.container[swapIdx] = temp;
  renderEmailBlocks();
  pushHistory();
}

function deleteEmailBlock(id) {
  const context = findBlockContext(id);
  if (!context) return;
  const filtered = context.container.filter(b => b.id !== id);
  if (context.parentColumn) {
    context.parentColumn.blocks = filtered;
  } else {
    editorState.blocks = filtered;
  }
  renderEmailBlocks();
  pushHistory();
}

function detachFragment(blockId) {
  const context = findBlockContext(blockId);
  if (!context || context.block?.type !== 'fragment') return;
  const fragmentBlocks = Array.isArray(context.block.fragmentBlocks) ? context.block.fragmentBlocks : [];
  const insertIndex = context.container.findIndex(b => b.id === blockId);
  const filtered = context.container.filter(b => b.id !== blockId);
  const detached = fragmentBlocks.map(block => ({ ...block, id: `${block.id || 'block'}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }));
  const nextContainer = [
    ...filtered.slice(0, Math.max(insertIndex, 0)),
    ...detached,
    ...filtered.slice(Math.max(insertIndex, 0))
  ];
  if (context.parentColumn) {
    context.parentColumn.blocks = nextContainer;
  } else {
    editorState.blocks = nextContainer;
  }
  editorState.selectedBlockId = detached[0]?.id || null;
  renderEmailBlocks();
  pushHistory();
}

function getFragmentFromLibrary(fragmentId) {
  return (editorState.fragments || []).find(f => String(f.id) === String(fragmentId));
}

function updateFragmentBlock(blockId) {
  const context = findBlockContext(blockId);
  if (!context || context.block?.type !== 'fragment') return;
  const fragment = getFragmentFromLibrary(context.block.fragmentId);
  if (!fragment) {
    showToast('Fragment not found in library', 'error');
    return;
  }
  context.block.fragmentName = fragment.name;
  context.block.fragmentStatus = fragment.status || 'draft';
  context.block.fragmentVersion = fragment.version || 1;
  context.block.fragmentType = fragment.type || context.block.fragmentType;
  context.block.fragmentBlocks = Array.isArray(fragment.blocks) ? fragment.blocks : [];
  context.block.fragmentHtml = fragment.html || '';
  context.block.fragmentLocked = true;
  renderEmailBlocks();
  pushHistory();
}

function renderEmailBlocks(options = {}) {
  const { skipStylesPanel = false } = options;
  const actualCanvas = document.getElementById('email-designer-actual');
  const simulatedCanvas = document.getElementById('email-designer-simulated');
  const canvasShell = document.querySelector('.email-designer-canvas');
  if (!actualCanvas || !simulatedCanvas) return;
  const bodyStyle = editorState.bodyStyle || {};
  actualCanvas.style.background = bodyStyle.viewportColor || '#f0f0f0';
  simulatedCanvas.style.background = bodyStyle.viewportColor || '#f0f0f0';
  if (!editorState.blocks.length) {
    if (canvasShell) canvasShell.classList.add('is-empty');
    actualCanvas.innerHTML = `
      <div class="email-canvas-empty-state">
        <div class="email-canvas-empty-icon" aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="10" y="14" width="26" height="32" rx="3"></rect>
            <rect x="30" y="22" width="24" height="28" rx="3"></rect>
            <line x1="16" y1="24" x2="28" y2="24"></line>
            <line x1="16" y1="30" x2="28" y2="30"></line>
            <rect x="18" y="36" width="10" height="8" rx="1"></rect>
            <rect x="34" y="32" width="12" height="8" rx="1"></rect>
            <rect x="48" y="32" width="6" height="8" rx="1"></rect>
          </svg>
        </div>
        <div class="email-canvas-empty-title">There's nothing in there.</div>
        <div class="email-canvas-empty-subtitle">Drag & drop your components and start building your email</div>
      </div>
    `;
    simulatedCanvas.innerHTML = `
      <div class="email-canvas-empty-state">
        <div class="email-canvas-empty-title">No preview yet.</div>
        <div class="email-canvas-empty-subtitle">Add content to see the simulated preview.</div>
      </div>
    `;
    syncBodyWidthControls();
    return;
  }
  if (canvasShell) canvasShell.classList.remove('is-empty');
  const bodyAlign = bodyStyle.align === 'left' ? 'flex-start' : bodyStyle.align === 'right' ? 'flex-end' : 'center';
  const bodyWrapperStart = `
    <div class="email-body-preview" style="background:${bodyStyle.backgroundColor}; background-image:${bodyStyle.backgroundImage ? `url(${bodyStyle.backgroundImage})` : 'none'}; border:${bodyStyle.border || 'none'}; padding:${bodyStyle.padding}; display:flex; justify-content:${bodyAlign};">
      <div class="email-body-inner" style="width:100%; max-width:${bodyStyle.maxWidth};">
  `;
  const bodyWrapperEnd = `
      </div>
    </div>
  `;
  actualCanvas.innerHTML = bodyWrapperStart + editorState.blocks.map(block => renderBlock(block)).join('') + bodyWrapperEnd;
  simulatedCanvas.innerHTML = `
    <div class="email-live-preview">
      <div class="email-live-preview-header">Preview (simulated)</div>
      <div class="email-live-preview-body">${generateEmailHtml(editorState.blocks)}</div>
    </div>
  `;
  attachStructureDropzones();
  attachBlockDragHandlers();
  attachBlockSelectionHandlers();
  if (!skipStylesPanel) {
    renderStylesPanel();
  }
  syncBodyWidthControls();
  if (editorState.activeMode === 'structure') {
    renderLeftPanel('structure');
  }
}

function renderStructureTree(blocks, level = 0) {
  if (!blocks.length) {
    return `<div class="nav-tree-item nav-tree-empty" style="margin-left:${level * 12}px;">No blocks yet</div>`;
  }
  return blocks.map(block => {
    const label = block.type === 'structure'
      ? `Structure (${getStructureColumns(block.variant || '1-1').length} cols)`
      : block.type.charAt(0).toUpperCase() + block.type.slice(1);
    const indent = `style="margin-left:${level * 12}px;"`;
    const activeClass = editorState.selectedBlockId === block.id ? 'active' : '';
    const dataAttr = `data-block-id="${block.id}"`;
    if (block.type === 'structure') {
      const cols = block.columns || [];
      const nested = cols.map(col => renderStructureTree(col.blocks || [], level + 1)).join('');
      return `<div class="nav-tree-item ${activeClass}" ${dataAttr} ${indent}>${label}</div>${nested}`;
    }
    if (block.type === 'container') {
      const nested = renderStructureTree(block.columns?.[0]?.blocks || [], level + 1);
      return `<div class="nav-tree-item ${activeClass}" ${dataAttr} ${indent}>${label}</div>${nested}`;
    }
    return `<div class="nav-tree-item ${activeClass}" ${dataAttr} ${indent}>${label}</div>`;
  }).join('');
}

function generateEmailHtml(blocks) {
  const bodyStyle = editorState.bodyStyle || {};
  const bodyAlign = bodyStyle.align === 'left' ? 'flex-start' : bodyStyle.align === 'right' ? 'flex-end' : 'center';
  const inner = blocks.map(block => {
    if (block.type === 'text') {
      return renderBlockHtml(block);
    }
    if (block.type === 'image') {
      return renderBlockHtml(block);
    }
    if (block.type === 'button') {
      return renderBlockHtml(block);
    }
    if (block.type === 'divider') {
      return renderBlockHtml(block);
    }
    if (block.type === 'spacer') {
      return renderBlockHtml(block);
    }
    if (block.type === 'html') {
      return renderBlockHtml(block);
    }
    if (block.type === 'structure') {
      return renderStructureHtml(block);
    }
    if (block.type === 'container') {
      return renderContainerHtml(block);
    }
    if (block.type === 'social') {
      return renderSocialHtml(block);
    }
    return '';
  }).join('');
  return `
    <div style="background:${bodyStyle.backgroundColor}; background-image:${bodyStyle.backgroundImage ? `url(${bodyStyle.backgroundImage})` : 'none'}; border:${bodyStyle.border || 'none'}; padding:${bodyStyle.padding}; display:flex; justify-content:${bodyAlign};">
      <div style="width:100%; max-width:${bodyStyle.maxWidth};">${inner}</div>
    </div>
  `;
}

function getStructureColumns(variant) {
  if (/^n-\d+$/i.test(variant)) {
    const count = Math.min(Math.max(parseInt(variant.split('-')[1], 10) || 4, 2), 6);
    return Array.from({ length: count }).map(() => 1);
  }
  if (variant === '1-1') return [1];
  if (['1-2-left', '2-1-right', '2-2', '1-2-right'].includes(variant)) return [1, 1];
  if (['1-3-left', '3-1-right', '1-3', '3-3'].includes(variant)) return [1, 1, 1];
  if (variant === '4-4') return [1, 1, 1, 1];
  if (variant === 'n-n') return [1, 1, 1, 1];
  return [1];
}

function getStructureWidths(variant) {
  if (/^n-\d+$/i.test(variant)) {
    const count = Math.min(Math.max(parseInt(variant.split('-')[1], 10) || 4, 2), 6);
    const width = `${Math.floor(100 / count)}%`;
    return Array.from({ length: count }).map(() => width);
  }
  if (variant === '1-2-left') return ['67%', '33%'];
  if (variant === '1-3-left') return ['75%', '25%'];
  if (variant === '2-1-right') return ['33%', '67%'];
  if (variant === '3-1-right') return ['25%', '75%'];
  if (variant === '1-2-right') return ['33%', '67%'];
  if (variant === '2-2') return ['50%', '50%'];
  if (variant === '3-3') return ['33%', '33%', '33%'];
  if (variant === '4-4' || variant === 'n-n') return ['25%', '25%', '25%', '25%'];
  if (variant === '1-3') return ['33%', '33%', '33%'];
  return ['100%'];
}

function renderStructureHtml(block) {
  const cols = getStructureColumns(block.variant || '1-1');
  const widths = getStructureWidths(block.variant || '1-1');
  const style = block.style || {};
  const gap = style.columnGap ? `${style.columnGap}px` : '8px';
  const columns = cols.map((_, idx) => {
    const width = widths[idx] || `${Math.floor(100 / cols.length)}%`;
    const colBlocks = (block.columns?.[idx]?.blocks || []).map(renderBlockHtml).join('');
    const colStyle = block.columns?.[idx]?.style || {};
    const colBorder = colStyle.border || style.border || '1px dashed #E5E7EB';
    const colPadding = colStyle.padding || style.padding || '8px';
    const colBg = colStyle.backgroundColor || style.backgroundColor || 'transparent';
    const colRadius = colStyle.borderRadius || style.borderRadius || '0px';
    return `<div style="flex:${width}; min-height:40px; border:${colBorder}; margin:4px; padding:${colPadding}; background:${colBg}; border-radius:${colRadius};">${colBlocks}</div>`;
  }).join('');
  return `<div style="display:flex; gap:${gap}; padding:8px 0;">${columns}</div>`;
}

function renderBlockContent(block) {
  if (block.type === 'fragment') {
    const typeLabel = block.fragmentType ? block.fragmentType.toUpperCase() : 'FRAGMENT';
    return `
      <div class="email-block-preview fragment-preview">
        <div class="fragment-label">Fragment: ${block.fragmentName || 'Untitled'}</div>
        <div class="fragment-meta">
          ${typeLabel} · v${block.fragmentVersion || 1} · ${block.fragmentStatus || 'draft'}
          <span class="fragment-lock">Locked</span>
        </div>
        <div class="fragment-actions">
          <button class="btn btn-sm btn-secondary" type="button" onclick="openFragmentEditorFromBlock('${block.fragmentId}', '${block.fragmentType || ''}')">Edit source</button>
          <button class="btn btn-sm btn-ghost" type="button" onclick="detachFragment('${block.id}')">Detach</button>
        </div>
      </div>
    `;
  }
  if (block.type === 'structure') {
    const cols = getStructureColumns(block.variant || '1-1');
    return `
      <div class="structure-columns" data-structure-id="${block.id}" data-variant="${block.variant || '1-1'}">
        ${cols.map((_, idx) => {
          const col = block.columns?.[idx];
          const colStyle = col?.style || {};
          const colStyleAttr = `
            background:${colStyle.backgroundColor || 'transparent'};
            border:${colStyle.border || '1px dashed #E5E7EB'};
            border-radius:${colStyle.borderRadius || '0px'};
            padding:${colStyle.padding || '8px'};
          `;
          const inner = (col?.blocks || []).map(renderBlock).join('');
          return `
            <div class="structure-column">
              <div class="structure-drop" data-structure-id="${block.id}" data-column-index="${idx}" style="${colStyleAttr}">
                ${inner || '<div class="structure-empty">Drop content here</div>'}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  if (block.type === 'container') {
    const inner = (block.columns?.[0]?.blocks || []).map(renderBlock).join('');
    return `
      <div class="container-drop" data-structure-id="${block.id}" data-column-index="0">
        ${inner || '<div class="structure-empty">Drop content here</div>'}
      </div>
    `;
  }
  return `<div class="email-block-preview">${renderBlockHtml(block)}</div>`;
}

function renderBlock(block) {
  const activeClass = editorState.selectedBlockId === block.id ? 'selected' : '';
  return `
    <div class="email-block ${block.type === 'structure' ? 'email-structure-block' : ''} ${activeClass}" data-block-id="${block.id}">
      ${renderBlockContent(block)}
    </div>
  `;
}

function renderBlockHtml(block) {
  if (block.type === 'fragment') {
    return renderFragmentHtml(block);
  }
  if (block.type === 'text') {
    const displayText = getSimulatedText(block.content || '');
    const style = block.style || {};
    const styleAttr = `
      font-family: ${style.fontFamily || 'Arial, sans-serif'};
      font-size: ${style.fontSize || '14px'};
      line-height: ${style.lineHeight || '1.5'};
      font-weight: ${style.fontWeight || 'normal'};
      font-style: ${style.fontStyle || 'normal'};
      text-decoration: ${style.textDecoration || 'none'};
      text-align: ${style.textAlign || 'left'};
      color: ${style.color || '#1f2933'};
      background: ${style.backgroundColor || 'transparent'};
      border-radius: ${style.borderRadius || '0px'};
      padding: ${style.padding || '0px'};
    `;
    return `<p style="${styleAttr}">${displayText}</p>`;
  }
  if (block.type === 'image') {
    const displaySrc = getSimulatedImage(block.src || '');
    const displayAlt = block.alt || (editorState.simulateContent ? 'Lifestyle image' : '');
    const align = block.style?.textAlign || 'left';
    const img = `<img src="${displaySrc}" alt="${displayAlt}" style="max-width: 100%; display: inline-block;">`;
    const linked = block.link ? `<a href="${block.link}" style="text-decoration:none;">${img}</a>` : img;
    return `<div style="text-align:${align};">${linked}</div>`;
  }
  if (block.type === 'button') {
    const displayText = getSimulatedValue(block.text || '', 'Shop now');
    const displayUrl = getSimulatedValue(block.url || '', '#');
    const style = block.style || {};
    const align = style.textAlign || 'left';
    const button = `<a href="${displayUrl}" style="display:inline-block;padding:${style.padding || '10px 16px'};background:${style.buttonColor || '#1473E6'};color:${style.color || '#fff'};border-radius:${style.borderRadius || '4px'};text-decoration:none;">${displayText}</a>`;
    return `<div style="text-align:${align};">${button}</div>`;
  }
  if (block.type === 'form') {
    const title = getSimulatedValue(block.formTitle || '', 'Contact us');
    const submit = getSimulatedValue(block.submitLabel || '', 'Submit');
    const action = block.actionUrl || '#';
    return `
      <form action="${action}" method="post" style="display:flex;flex-direction:column;gap:8px;">
        <strong>${title}</strong>
        <input type="text" placeholder="Your name" style="padding:8px;border:1px solid #E1E1E1;border-radius:4px;">
        <input type="email" placeholder="Email address" style="padding:8px;border:1px solid #E1E1E1;border-radius:4px;">
        <button type="submit" style="padding:10px 16px;background:#1473E6;color:#fff;border:none;border-radius:4px;">${submit}</button>
      </form>
    `;
  }
  if (block.type === 'embed') {
    if (block.embedCode) return block.embedCode;
    if (block.embedUrl) {
      return `<iframe src="${block.embedUrl}" style="width:100%;min-height:240px;border:0;" loading="lazy"></iframe>`;
    }
    return '<div style="padding:16px;border:1px dashed #CBD2D9;border-radius:6px;">Embed content</div>';
  }
  if (block.type === 'divider') {
    const style = block.style || {};
    const thickness = style.thickness || block.thickness || 1;
    const color = style.borderColor || '#E1E1E1';
    return `<hr style="border:none;border-top:${thickness}px solid ${color};">`;
  }
  if (block.type === 'spacer') {
    const style = block.style || {};
    const height = style.height || block.height || 20;
    return `<div style="height:${height}px;"></div>`;
  }
  if (block.type === 'html') {
    return getSimulatedValue(block.html || '', '<div>Sample HTML block</div>');
  }
  if (block.type === 'structure') {
    return renderStructureHtml(block);
  }
  if (block.type === 'container') {
    return renderContainerHtml(block);
  }
  if (block.type === 'social') {
    return renderSocialHtml(block);
  }
  return '';
}

function renderFragmentHtml(block) {
  if (block.fragmentHtml) return block.fragmentHtml;
  const blocks = Array.isArray(block.fragmentBlocks) ? block.fragmentBlocks : [];
  return blocks.map(renderBlockHtml).join('');
}

function attachStructureDropzones() {
  document.querySelectorAll('.structure-drop, .container-drop').forEach(zone => {
    zone.addEventListener('dragover', (e) => e.preventDefault());
    zone.addEventListener('dragenter', () => zone.classList.add('drop-active'));
    zone.addEventListener('dragleave', () => zone.classList.remove('drop-active'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove('drop-active');
      const raw = e.dataTransfer.getData('text/plain');
      if (!raw) return;
      const payload = parseDragPayload(e);
      if (!payload) return;
      if (payload.kind === 'new' && payload.type === 'structure') return;
      const structureId = zone.dataset.structureId;
      const columnIndex = parseInt(zone.dataset.columnIndex, 10);
      const container = getStructureColumnContainer(structureId, columnIndex);
      if (!container) return;
      const index = getDropIndex(zone, e.clientY);
      clearDropIndicator();
      handleDropToContainer(container, index, payload);
    });
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      const index = getDropIndex(zone, e.clientY);
      showDropIndicator(zone, index);
    });
    zone.addEventListener('dragleave', () => {
      clearDropIndicator();
    });
  });
}

function addBlockToStructure(structureId, columnIndex, type, variant = '') {
  const structure = findBlockById(structureId);
  if (!structure || (structure.type !== 'structure' && structure.type !== 'container')) return;
  const column = structure.columns?.[columnIndex];
  if (!column) return;
  addEmailBlock(type, variant, column.blocks, column.blocks.length);
}

function getStructureColumnContainer(structureId, columnIndex) {
  const structure = findBlockById(structureId);
  if (!structure || (structure.type !== 'structure' && structure.type !== 'container')) return null;
  const column = structure.columns?.[columnIndex];
  return column?.blocks || null;
}

function updateSocialLink(id, field, value) {
  const context = findBlockContext(id);
  if (!context?.block || context.block.type !== 'social') return;
  context.block.links = {
    ...(context.block.links || {}),
    [field]: value
  };
  renderEmailBlocks();
}

function updateSocialLinkLive(id, field, value) {
  const context = findBlockContext(id);
  if (!context?.block || context.block.type !== 'social') return;
  context.block.links = {
    ...(context.block.links || {}),
    [field]: value
  };
}

function updateSocialLinkLivePreview(id, field, value) {
  updateSocialLinkLive(id, field, value);
  renderEmailBlocks({ skipStylesPanel: true });
}

function updateSocialLinkCommit(id, field, value) {
  updateSocialLink(id, field, value);
}

async function openAssetPickerForImage(blockId) {
  editorState.pendingImageBlockId = blockId;
  const modal = document.getElementById('asset-picker-modal');
  const list = document.getElementById('asset-picker-list');
  if (!modal || !list) {
    showToast('Asset picker not available', 'error');
    return;
  }
  modal.classList.remove('hidden');
  list.innerHTML = '<div>Loading assets...</div>';
  try {
    const response = await fetch(`${API_BASE}/assets`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load assets');
    const assets = data.assets || [];
    if (!assets.length) {
      list.innerHTML = '<div>No assets found.</div>';
      return;
    }
    list.innerHTML = assets.map(asset => `
      <div class="asset-card" onclick="selectAssetForImage('${asset.url || asset.path || ''}')">
        <div class="asset-thumb" style="background-image:url('${asset.url || asset.path || ''}'); background-size: cover;"></div>
        <div class="asset-title">${asset.name || asset.filename || 'Asset'}</div>
      </div>
    `).join('');
  } catch (error) {
    list.innerHTML = `<div>${error.message}</div>`;
  }
}

function closeAssetPicker() {
  const modal = document.getElementById('asset-picker-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  editorState.pendingImageBlockId = null;
}

function selectAssetForImage(url) {
  const context = findBlockContext(editorState.pendingImageBlockId);
  if (!context?.block || context.block.type !== 'image') return;
  context.block.src = url;
  renderEmailBlocks();
  closeAssetPicker();
}

function renderContainerHtml(block) {
  const inner = (block.columns?.[0]?.blocks || []).map(renderBlockHtml).join('');
  return `<div style="border:1px solid #E5E7EB; padding:12px; border-radius:6px;">${inner}</div>`;
}

function renderSocialHtml(block) {
  const links = block.links || {};
  const style = block.style || {};
  const fontSize = style.iconSize ? `${style.iconSize}px` : '14px';
  const displayLinks = editorState.simulateContent ? {
    facebook: links.facebook || 'https://facebook.com/brand',
    twitter: links.twitter || 'https://twitter.com/brand',
    linkedin: links.linkedin || 'https://linkedin.com/company/brand'
  } : links;
  const items = Object.entries(links)
    .filter(([, url]) => url)
    .map(([name, url]) => `<a href="${url}" style="margin-right:8px; text-decoration:none; font-size:${fontSize};">${name}</a>`)
    .join('');
  const simulatedItems = Object.entries(displayLinks)
    .filter(([, url]) => url)
    .map(([name, url]) => `<a href="${url}" style="margin-right:8px; text-decoration:none; font-size:${fontSize};">${name}</a>`)
    .join('');
  return `<div>${editorState.simulateContent ? simulatedItems : items}</div>`;
}

function toggleSimulateContent() {
  editorState.simulateContent = !editorState.simulateContent;
  const button = document.getElementById('simulate-content-btn');
  if (button) {
    button.textContent = editorState.simulateContent ? 'Simulated' : 'Simulate Content';
  }
  renderEmailBlocks();
}

function openSimulatePreview() {
  editorState.simulateContent = true;
  const modal = document.getElementById('email-simulate-modal');
  const body = document.getElementById('email-simulate-body');
  if (!modal || !body) return;
  body.innerHTML = `
    <div class="email-preview-card">
      ${generateEmailHtml(editorState.blocks)}
    </div>
  `;
  modal.classList.remove('hidden');
}

function closeSimulatePreview() {
  const modal = document.getElementById('email-simulate-modal');
  if (!modal) return;
  modal.classList.add('hidden');
}

function getSimulatedValue(value, fallback) {
  if (value) return value;
  return editorState.simulateContent ? fallback : value;
}

function getSimulatedText(value) {
  if (value) return value;
  return editorState.simulateContent
    ? 'Sample copy goes here. Personalize and adjust to match your audience.'
    : value;
}

function getSimulatedImage(value) {
  if (value) return value;
  return editorState.simulateContent ? 'https://via.placeholder.com/640x360?text=Image' : value;
}

function findBlockById(id) {
  return findBlockContext(id)?.block || null;
}

function findBlockContext(id, blocks = editorState.blocks, parentColumn = null) {
  for (const block of blocks) {
    if (block.id === id) {
      return { block, container: blocks, parentColumn };
    }
    if (block.type === 'structure' || block.type === 'container') {
      for (const column of block.columns || []) {
        const found = findBlockContext(id, column.blocks || [], column);
        if (found) return found;
      }
    }
  }
  return null;
}

async function saveDeliveryContent() {
  if (editorState.fragmentMode) {
    await saveFragmentContent();
    return;
  }
  if (editorState.landingPageMode) {
    await saveLandingPageContent();
    return;
  }
  if (!editorState.delivery) return;
  const payload = {
    subject: getValue('delivery-subject-input'),
    preheader: getValue('delivery-preheader-input'),
    document_title: getValue('delivery-document-title-input'),
    document_language: getValue('delivery-document-language-input'),
    content_blocks: editorState.blocks,
    html_output: editorState.htmlOverride || generateEmailHtml(editorState.blocks),
    last_saved_step: 3,
    wizard_step: 3
  };
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/deliveries/${editorState.deliveryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save delivery');
    editorState.delivery = data;
    showToast('Delivery saved', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function saveFragmentContent() {
  try {
    showLoading();
    const payload = {
      name: editorState.fragment?.name || 'Fragment',
      type: editorState.fragmentType || 'email',
      status: editorState.fragment?.status || 'draft',
      version: editorState.fragment?.version || 1,
      blocks: editorState.blocks,
      html: editorState.htmlOverride || generateEmailHtml(editorState.blocks)
    };
    let response;
    if (editorState.fragmentId) {
      response = await fetch(`${API_BASE}/fragments/${editorState.fragmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      response = await fetch(`${API_BASE}/fragments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save fragment');
    editorState.fragmentId = data.id;
    editorState.fragment = data;
    showToast('Fragment saved', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function saveLandingPageContent() {
  try {
    showLoading();
    const payload = {
      name: getValue('landing-page-name-input') || editorState.landingPage?.name || 'Landing Page',
      slug: getValue('landing-page-slug-input') || '',
      status: getValue('landing-page-status-input') || 'draft',
      version: editorState.landingPage?.version || 1,
      content_blocks: editorState.blocks,
      html_output: editorState.htmlOverride || generateEmailHtml(editorState.blocks),
      body_style: editorState.bodyStyle
    };
    const method = editorState.landingPageId ? 'PUT' : 'POST';
    const endpoint = editorState.landingPageId
      ? `${API_BASE}/landing-pages/${editorState.landingPageId}`
      : `${API_BASE}/landing-pages`;
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save landing page');
    editorState.landingPage = data;
    editorState.landingPageId = data.id;
    showToast('Landing page saved', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function hydrateLandingPageFields(page) {
  setValue('landing-page-name-input', page?.name || '');
  setValue('landing-page-slug-input', page?.slug || '');
  setValue('landing-page-status-input', page?.status || 'draft');
}

function applyLandingPageUI(isLanding) {
  const deliverySettings = document.getElementById('email-delivery-settings');
  const landingSettings = document.getElementById('landing-page-settings');
  const title = document.querySelector('.email-editor-title span');
  const backBtn = document.querySelector('.email-editor-toolbar .btn-back.preview-keep');
  if (deliverySettings) deliverySettings.classList.toggle('hidden', isLanding);
  if (landingSettings) landingSettings.classList.toggle('hidden', !isLanding);
  if (title) title.textContent = isLanding ? 'Landing Page Designer' : 'Email Designer';
  if (backBtn) backBtn.title = isLanding ? 'Back to Landing Pages' : 'Back to Delivery';
}

function setupLandingPageNameListener() {
  const input = document.getElementById('landing-page-name-input');
  if (!input || input.dataset.bound === 'true') return;
  input.dataset.bound = 'true';
  input.addEventListener('input', (event) => {
    const value = event.target.value.trim();
    const title = value || 'Landing Page';
    const titleEl = document.getElementById('email-editor-delivery-name');
    if (titleEl) titleEl.textContent = title;
  });
}

function applyFragmentUI() {
  const deliverySettings = document.getElementById('email-delivery-settings');
  const landingSettings = document.getElementById('landing-page-settings');
  if (deliverySettings) deliverySettings.classList.add('hidden');
  if (landingSettings) landingSettings.classList.add('hidden');
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function toggleEmailMoreMenu() {
  const dropdown = document.getElementById('email-more-dropdown');
  if (!dropdown) return;
  dropdown.classList.toggle('hidden');
}

function resetEmailEditor() {
  if (!confirm('Reset email content?')) return;
  editorState.blocks = [];
  renderEmailBlocks();
  pushHistory();
}

function exportEmailHtml() {
  const html = generateEmailHtml(editorState.blocks);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(editorState.delivery?.name || 'email').replace(/\s+/g, '_')}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function switchToCodeEditor() {
  const modal = document.getElementById('email-code-modal');
  const textarea = document.getElementById('email-code-textarea');
  if (!modal || !textarea) return;
  textarea.value = editorState.htmlOverride || generateEmailHtml(editorState.blocks);
  modal.classList.remove('hidden');
}

function changeEmailDesign() {
  openDesignPicker();
}

function openImportHtml() {
  const modal = document.getElementById('email-import-modal');
  const textarea = document.getElementById('email-import-textarea');
  const fileInput = document.getElementById('email-import-file');
  if (!modal || !textarea) return;
  textarea.value = '';
  editorState.importAssets = null;
  if (fileInput) fileInput.value = '';
  modal.classList.remove('hidden');
}

function closeImportHtml() {
  const modal = document.getElementById('email-import-modal');
  if (!modal) return;
  modal.classList.add('hidden');
}

function handleImportFileChange(input) {
  const file = input?.files?.[0];
  if (!file) return;
  const textarea = document.getElementById('email-import-textarea');
  if (!textarea) return;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'zip') {
    importZipFile(file, textarea);
    return;
  }
  editorState.importAssets = null;
  const reader = new FileReader();
  reader.onload = () => {
    textarea.value = String(reader.result || '');
  };
  reader.onerror = () => {
    showToast('Failed to read the file.', 'error');
  };
  reader.readAsText(file);
}

async function importZipFile(file, textarea) {
  if (!window.JSZip) {
    showToast('Zip support failed to load. Please try again.', 'error');
    return;
  }
  try {
    showLoading();
    const zip = await JSZip.loadAsync(file);
    const entries = Object.keys(zip.files).map(name => zip.files[name]).filter(entry => !entry.dir);
    const htmlEntry = entries.find(entry => /\.(html?|xhtml)$/i.test(entry.name));
    if (!htmlEntry) {
      throw new Error('No HTML file found in the zip.');
    }
    const html = await htmlEntry.async('text');
    const assets = {};
    for (const entry of entries) {
      if (/\.(png|jpe?g|gif|webp|svg)$/i.test(entry.name)) {
        const blob = await entry.async('blob');
        const url = URL.createObjectURL(blob);
        assets[entry.name] = url;
        const base = entry.name.split('/').pop();
        if (base) assets[base] = url;
      }
    }
    editorState.importAssets = assets;
    textarea.value = html;
    showToast('Zip loaded. HTML extracted.', 'success');
  } catch (error) {
    showToast(error.message || 'Failed to import zip.', 'error');
  } finally {
    hideLoading();
  }
}

function replaceZipAssetPaths(html) {
  if (!editorState.importAssets) return html;
  let result = html;
  Object.entries(editorState.importAssets).forEach(([key, url]) => {
    if (!key) return;
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(["'\\(])(?:\\.?\\/)?${escaped}(["'\\)])`, 'g');
    result = result.replace(pattern, `$1${url}$2`);
  });
  return result;
}

function applyImportHtml() {
  const textarea = document.getElementById('email-import-textarea');
  const rawToggle = document.getElementById('email-import-raw');
  if (!textarea) return;
  const html = replaceZipAssetPaths(textarea.value.trim());
  if (!html) return;
  if (rawToggle && rawToggle.checked) {
    editorState.blocks = [{ id: `block-${Date.now()}`, type: 'html', html }];
    editorState.htmlOverride = html;
  } else {
    const blocks = importHtmlToBlocks(html);
    editorState.blocks = blocks.length ? blocks : [{ id: `block-${Date.now()}`, type: 'html', html }];
    editorState.htmlOverride = '';
  }
  renderEmailBlocks();
  pushHistory();
  closeImportHtml();
  showToast(rawToggle && rawToggle.checked ? 'HTML imported as raw content' : 'HTML imported as editable blocks', 'success');
}

function importHtmlToBlocks(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const nodes = Array.from(doc.body.childNodes);
  if (!nodes.length) return [];

  const newBlockId = () => `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const normalizeText = (text) => (text || '').replace(/\s+/g, ' ').trim();

  const parseInlineStyle = (el) => {
    const styleAttr = el?.getAttribute?.('style') || '';
    const styles = {};
    styleAttr.split(';').forEach(rule => {
      const [rawKey, rawValue] = rule.split(':');
      if (!rawKey || !rawValue) return;
      const key = rawKey.trim().toLowerCase();
      const value = rawValue.trim();
      styles[key] = value;
    });
    return styles;
  };

  const extractTextAlign = (el) => {
    let current = el;
    while (current && current !== document.body) {
      const alignAttr = (current.getAttribute?.('align') || '').toLowerCase();
      if (['left', 'center', 'right', 'justify'].includes(alignAttr)) return alignAttr;
      const inline = parseInlineStyle(current);
      const alignStyle = (inline['text-align'] || '').toLowerCase();
      if (['left', 'center', 'right', 'justify'].includes(alignStyle)) return alignStyle;
      current = current.parentElement;
    }
    return '';
  };

  const createTextBlock = (tag, text, styleOverride = {}) => ({
    id: newBlockId(),
    type: 'text',
    content: text,
    style: {
      textType: tag === 'p' ? 'paragraph' : tag,
      fontSize: tag === 'h1' ? '32px' : tag === 'h2' ? '24px' : tag === 'h3' ? '20px' : '14px',
      lineHeight: '1.5',
      ...styleOverride
    }
  });

  const createStructureBlock = (columns) => {
    const variantMap = { 1: '1-1', 2: '2-2', 3: '3-3', 4: '4-4' };
    const variant = variantMap[columns.length] || 'n-n';
    const id = newBlockId();
    return {
      id,
      type: 'structure',
      variant,
      columns: columns.map((colBlocks, idx) => ({
        id: `${id}-col-${idx}`,
        blocks: colBlocks
      }))
    };
  };

  const parseChildren = (node) => {
    const results = [];
    node.childNodes.forEach(child => {
      results.push(...parseNodeToBlocks(child));
    });
    return results;
  };

  const parseTable = (table) => {
    const rows = Array.from(table.querySelectorAll(':scope > thead > tr, :scope > tbody > tr, :scope > tfoot > tr, :scope > tr'));
    if (!rows.length) return [];
    const blocks = [];
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      if (!cells.length) return;
      const columns = cells.map(cell => {
        const cellBlocks = parseChildren(cell);
        return cellBlocks.length ? cellBlocks : [createTextBlock('p', normalizeText(cell.textContent || ''))].filter(b => b.content);
      });
      blocks.push(createStructureBlock(columns));
    });
    return blocks;
  };

  const parseNodeToBlocks = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = normalizeText(node.textContent);
      const align = extractTextAlign(node.parentElement);
      return text ? [createTextBlock('p', text, align ? { textAlign: align } : {})] : [];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return [];
    const tag = node.tagName.toLowerCase();

    if (tag === 'table') return parseTable(node);
    if (tag === 'p' || tag === 'h1' || tag === 'h2' || tag === 'h3') {
      const text = normalizeText(node.textContent);
      const align = extractTextAlign(node);
      return text ? [createTextBlock(tag, text, align ? { textAlign: align } : {})] : [];
    }
    if (tag === 'img') {
      const align = extractTextAlign(node);
      return [{
        id: newBlockId(),
        type: 'image',
        src: node.getAttribute('src') || '',
        alt: node.getAttribute('alt') || '',
        link: node.getAttribute('href') || '',
        style: align ? { textAlign: align } : {}
      }];
    }
    if (tag === 'a') {
      const img = node.querySelector('img');
      const hasOnlyImg = img && normalizeText(node.textContent || '') === '';
      const align = extractTextAlign(node);
      if (hasOnlyImg) {
        return [{
          id: newBlockId(),
          type: 'image',
          src: img.getAttribute('src') || '',
          alt: img.getAttribute('alt') || '',
          link: node.getAttribute('href') || '',
          style: align ? { textAlign: align } : {}
        }];
      }
      const text = normalizeText(node.textContent) || 'Button';
      return [{
        id: newBlockId(),
        type: 'button',
        text,
        url: node.getAttribute('href') || '#',
        style: align ? { textAlign: align } : {}
      }];
    }
    if (tag === 'hr') {
      return [{ id: newBlockId(), type: 'divider', thickness: 1 }];
    }
    const spacer = node.style && node.style.height ? parseInt(node.style.height, 10) : null;
    if (tag === 'div' && spacer) {
      return [{ id: newBlockId(), type: 'spacer', height: spacer }];
    }

    const childBlocks = parseChildren(node);
    if (childBlocks.length) return childBlocks;

    const text = normalizeText(node.textContent);
    if (text) return [createTextBlock('p', text)];

    return [{
      id: newBlockId(),
      type: 'html',
      html: node.outerHTML
    }];
  };

  const blocks = [];
  nodes.forEach(node => {
    blocks.push(...parseNodeToBlocks(node));
  });
  return blocks;
}
function closeCodeEditor() {
  const modal = document.getElementById('email-code-modal');
  if (!modal) return;
  modal.classList.add('hidden');
}

function applyCodeEditor() {
  const textarea = document.getElementById('email-code-textarea');
  if (!textarea) return;
  editorState.htmlOverride = textarea.value;
  pushHistory();
  showToast('Custom HTML applied. Saving will use this HTML.', 'success');
  closeCodeEditor();
}

async function openDesignPicker() {
  const modal = document.getElementById('email-design-modal');
  const list = document.getElementById('email-template-list');
  if (!modal || !list) return;
  modal.classList.remove('hidden');
  list.innerHTML = '<div>Loading templates...</div>';
  try {
    const response = await fetch(`${API_BASE}/email-templates`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load templates');
    const templates = data.templates || [];
    if (!templates.length) {
      list.innerHTML = '<div>No templates available.</div>';
      return;
    }
    list.innerHTML = templates.map(t => `
      <div class="email-template-item">
        <div>
          <div><strong>${t.name}</strong></div>
          <div class="email-template-meta">Updated: ${t.updated_at ? new Date(t.updated_at).toLocaleDateString() : '—'}</div>
        </div>
        <button class="btn btn-secondary" onclick="applyTemplateFromPicker(${t.id})">Use</button>
      </div>
    `).join('');
  } catch (error) {
    list.innerHTML = `<div>${error.message}</div>`;
  }
}

function closeDesignPicker() {
  const modal = document.getElementById('email-design-modal');
  if (!modal) return;
  modal.classList.add('hidden');
}

async function applyTemplateFromPicker(id) {
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/email-templates/${id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load template');
    editorState.blocks = Array.isArray(data.blocks) ? data.blocks : [];
    editorState.htmlOverride = data.html || '';
    setValue('delivery-subject-input', data.subject || '');
    renderEmailBlocks();
    pushHistory();
    showToast('Template applied', 'success');
    closeDesignPicker();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function saveAsTemplate() {
  const name = prompt('Template name?');
  if (!name) return;
  const payload = {
    name,
    subject: getValue('delivery-subject-input'),
    blocks: editorState.blocks,
    html: generateEmailHtml(editorState.blocks)
  };
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/email-templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save template');
    showToast('Template saved', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function saveAsFragment() {
  const name = prompt('Fragment name?');
  if (!name) return;
  const payload = {
    name,
    type: 'email',
    blocks: editorState.blocks,
    html: generateEmailHtml(editorState.blocks)
  };
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/fragments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save fragment');
    showToast('Fragment saved', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function applyPersonalizationToken(selectId, inputId, field) {
  const select = document.getElementById(selectId);
  const input = document.getElementById(inputId);
  if (!select || !input || !select.value) return;
  input.value = `${input.value || ''}${select.value}`;
  if (field === 'subject') {
    updateSubjectPreview();
  }
  select.value = '';
}

async function openPersonalizationPicker(targetInputId) {
  editorState.personalizationTarget = targetInputId;
  const modal = document.getElementById('email-personalization-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  if (!editorState.personalizationTables.length) {
    await loadPersonalizationTables();
  }
  renderPersonalizationTree(editorState.personalizationTables);
}

function closePersonalizationPicker() {
  const modal = document.getElementById('email-personalization-modal');
  if (!modal) return;
  modal.classList.add('hidden');
}

async function loadPersonalizationTables() {
  try {
    const response = await fetch(`${API_BASE}/query/tables`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load tables');
    editorState.personalizationTables = data.tables || [];
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderPersonalizationTree(tables) {
  const container = document.getElementById('personalization-schema');
  if (!container) return;
  if (!tables.length) {
    container.innerHTML = '<div class="empty-state">No attributes found.</div>';
    return;
  }
  const html = tables.map(table => {
    const columns = (table.fields || []).map(col => `
      <button type="button" class="schema-tree-column" onclick="insertPersonalizationToken('${table.name}', '${col}')">${col}</button>
    `).join('');
    return `
      <div class="schema-tree-table" data-table="${table.name}">
        <button type="button" class="schema-tree-row" onclick="togglePersonalizationTable('${table.name}')">
          <span class="schema-tree-caret">▸</span>
          <span class="schema-tree-name" onclick="event.stopPropagation(); insertPersonalizationToken('${table.name}')">${table.name}</span>
          <span class="schema-tree-count">(${table.count || 0})</span>
        </button>
        <div class="schema-tree-columns" id="personalization-columns-${table.name}">
          ${columns || '<div class="schema-tree-column">No columns</div>'}
        </div>
      </div>
    `;
  }).join('');
  container.innerHTML = html;
}

function togglePersonalizationTable(tableName) {
  const table = document.querySelector(`.schema-tree-table[data-table="${tableName}"]`);
  if (!table) return;
  table.classList.toggle('open');
}

function insertPersonalizationToken(tableName, column) {
  const token = column ? `{{${tableName}.${column}}}` : `{{${tableName}}}`;
  if (editorState.personalizationTarget === 'block-text') {
    insertTokenIntoSelectedBlock(token);
    closePersonalizationPicker();
    return;
  }
  const inputId = editorState.personalizationTarget;
  if (!inputId) return;
  const input = document.getElementById(inputId);
  if (!input) return;
  input.value = `${input.value || ''}${token}`;
  closePersonalizationPicker();
}

function filterPersonalizationTree(query) {
  const q = (query || '').toLowerCase();
  if (!q) {
    renderPersonalizationTree(editorState.personalizationTables);
    return;
  }
  const filtered = editorState.personalizationTables.map(table => {
    const fields = (table.fields || []).filter(f => f.toLowerCase().includes(q));
    const matchesTable = table.name.toLowerCase().includes(q);
    if (matchesTable) return table;
    if (fields.length) return { ...table, fields };
    return null;
  }).filter(Boolean);
  renderPersonalizationTree(filtered);
}

function openPersonalizationPickerForBlock() {
  const context = findBlockContext(editorState.selectedBlockId);
  if (!context || context.block.type !== 'text') return;
  const textarea = document.getElementById('email-block-content-text');
  if (textarea) cacheTextSelection(context.block.id, textarea);
  openPersonalizationPicker('block-text');
}

function insertTokenIntoSelectedBlock(token) {
  const context = findBlockContext(editorState.selectedBlockId);
  if (!context || context.block.type !== 'text') return;
  const content = context.block.content || '';
  const selection = editorState.textSelection;
  if (selection && selection.blockId === context.block.id) {
    const start = Math.max(0, selection.start || 0);
    const end = Math.max(start, selection.end || 0);
    context.block.content = content.slice(0, start) + token + content.slice(end);
  } else {
    context.block.content = `${content}${token}`;
  }
  renderEmailBlocks();
  pushHistory();
}

function cacheTextSelection(blockId, el) {
  if (!el) return;
  editorState.textSelection = {
    blockId,
    start: el.selectionStart ?? 0,
    end: el.selectionEnd ?? 0
  };
}

function attachBlockSelectionHandlers() {
  document.querySelectorAll('.email-block').forEach(block => {
    block.addEventListener('click', (event) => {
      const id = block.dataset.blockId;
      if (!id) return;
      document.querySelectorAll('.email-block').forEach(b => b.classList.remove('selected'));
      block.classList.add('selected');
      editorState.selectedBlockId = id;
      if (editorState.activeMode === 'structure') {
        document.querySelectorAll('.nav-tree-item').forEach(el => el.classList.remove('active'));
        const treeItem = document.querySelector(`.nav-tree-item[data-block-id="${id}"]`);
        if (treeItem) treeItem.classList.add('active');
      }
      renderStylesPanel();
      switchEditorTab('settings');
      scrollToBlock(id);
      event.stopPropagation();
    });
  });
}

function selectBlockById(id) {
  editorState.selectedBlockId = id || null;
  renderEmailBlocks();
  switchEditorTab('styles');
  requestAnimationFrame(() => scrollToBlock(id));
}

function scrollToBlock(id) {
  const container = document.querySelector('.email-editor-center');
  if (!container) return;
  if (!id) {
    container.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const el = document.querySelector(`.email-block[data-block-id="${id}"]`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function attachBlockDragHandlers() {
  document.querySelectorAll('.email-block').forEach(block => {
    const id = block.dataset.blockId;
    if (!id) return;
    block.setAttribute('draggable', 'true');
    block.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'move', blockId: id }));
      e.dataTransfer.effectAllowed = 'move';
      block.classList.add('dragging');
    });
    block.addEventListener('dragend', () => {
      block.classList.remove('dragging');
      clearDropIndicator();
    });
    block.addEventListener('dragover', (e) => {
      if (e.target.closest('.structure-drop, .container-drop')) return;
      e.preventDefault();
      const rect = block.getBoundingClientRect();
      const before = e.clientY < rect.top + rect.height / 2;
      showDropIndicator(block.parentElement, before ? getBlockIndex(block) : getBlockIndex(block) + 1);
    });
    block.addEventListener('drop', (e) => {
      if (e.target.closest('.structure-drop, .container-drop')) return;
      e.preventDefault();
      const container = block.parentElement;
      const rect = block.getBoundingClientRect();
      const before = e.clientY < rect.top + rect.height / 2;
      const index = before ? getBlockIndex(block) : getBlockIndex(block) + 1;
      const payload = parseDragPayload(e);
      clearDropIndicator();
      if (payload) {
        const targetContainer = resolveCanvasContainerFromElement(container) || editorState.blocks;
        handleDropToContainer(targetContainer, index, payload);
      }
    });
  });
}

function getBlockIndex(blockEl) {
  const siblings = Array.from(blockEl.parentElement.querySelectorAll('.email-block'));
  return siblings.indexOf(blockEl);
}

function getCanvasContainer() {
  const inner = document.querySelector('#email-designer-actual .email-body-inner');
  return inner || document.getElementById('email-designer-actual');
}

function resolveCanvasContainerFromElement(el) {
  const inner = document.querySelector('#email-designer-actual .email-body-inner');
  if (inner && (el === inner || inner.contains(el))) return editorState.blocks;
  return null;
}

function parseDragPayload(event) {
  const raw = event.dataTransfer.getData('text/plain');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.blockId) return { kind: 'move', blockId: parsed.blockId };
    if (parsed?.fragmentId) return { kind: 'fragment', fragmentId: parsed.fragmentId };
    if (parsed?.type) return { kind: 'new', type: parsed.type, variant: parsed.variant || '' };
    return null;
  } catch (error) {
    return { kind: 'new', type: raw, variant: '' };
  }
}

function getDropIndex(containerEl, clientY) {
  const blocks = Array.from(containerEl.querySelectorAll('.email-block'));
  for (let i = 0; i < blocks.length; i += 1) {
    const rect = blocks[i].getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) return i;
  }
  return blocks.length;
}

function showDropIndicator(containerEl, index) {
  if (!containerEl) return;
  clearDropIndicator();
  const indicator = document.createElement('div');
  indicator.className = 'email-drop-indicator';
  const blocks = containerEl.querySelectorAll('.email-block');
  if (index >= blocks.length) {
    containerEl.appendChild(indicator);
  } else {
    containerEl.insertBefore(indicator, blocks[index]);
  }
  editorState.dropIndicator = indicator;
}

function clearDropIndicator() {
  if (editorState.dropIndicator && editorState.dropIndicator.parentElement) {
    editorState.dropIndicator.parentElement.removeChild(editorState.dropIndicator);
  }
  editorState.dropIndicator = null;
}

function handleDropToContainer(container, index, payload) {
  if (payload.kind === 'new') {
    addEmailBlock(payload.type, payload.variant, container, index);
    return;
  }
  if (payload.kind === 'fragment') {
    addFragmentBlock(payload.fragmentId, container, index);
    return;
  }
  if (payload.kind === 'move') {
    moveBlockToContainer(payload.blockId, container, index);
  }
}

function moveBlockToContainer(blockId, targetContainer, targetIndex) {
  const context = findBlockContext(blockId);
  if (!context?.block) return;
  const sourceContainer = context.container;
  const sourceIndex = sourceContainer.findIndex(b => b.id === blockId);
  if (sourceIndex === -1) return;
  const [block] = sourceContainer.splice(sourceIndex, 1);
  let insertIndex = targetIndex;
  if (sourceContainer === targetContainer && targetIndex > sourceIndex) {
    insertIndex -= 1;
  }
  targetContainer.splice(Math.max(0, Math.min(insertIndex, targetContainer.length)), 0, block);
  editorState.selectedBlockId = block.id;
  renderEmailBlocks();
  pushHistory();
}

function getBlockLabel(block) {
  if (!block) return 'Body';
  if (block.type === 'structure') {
    const cols = getStructureColumns(block.variant || '1-1').length;
    return `Structure (${cols} cols)`;
  }
  if (block.type === 'container') return 'Container';
  if (block.type === 'text') return 'Text';
  if (block.type === 'image') return 'Image';
  if (block.type === 'button') return 'Button';
  if (block.type === 'divider') return 'Divider';
  if (block.type === 'spacer') return 'Spacer';
  if (block.type === 'html') return 'HTML';
  if (block.type === 'social') return 'Social';
  return block.type ? block.type.charAt(0).toUpperCase() + block.type.slice(1) : 'Element';
}

function getBlockNestedGroups(block) {
  if (!block) return [];
  if (block.type === 'structure' || block.type === 'container') {
    return (block.columns || []).map(col => col.blocks || []);
  }
  return [];
}

function findBlockPath(blocks, targetId, path = []) {
  for (const block of blocks || []) {
    const nextPath = [...path, block];
    if (block.id === targetId) return nextPath;
    const groups = getBlockNestedGroups(block);
    for (const group of groups) {
      const found = findBlockPath(group, targetId, nextPath);
      if (found) return found;
    }
  }
  return null;
}

function renderSettingsBreadcrumb() {
  const container = document.getElementById('email-settings-breadcrumb');
  if (!container) return;
  const path = [{ label: 'Body', id: null }];
  if (editorState.selectedBlockId) {
    const blockPath = findBlockPath(editorState.blocks || [], editorState.selectedBlockId, []);
    if (blockPath && blockPath.length) {
      blockPath.forEach(block => {
        path.push({ label: getBlockLabel(block), id: block.id });
      });
    }
  }
  container.innerHTML = path.map((item, idx) => {
    const isLast = idx === path.length - 1;
    if (isLast) {
      return `<span class="breadcrumb-current">${item.label}</span>`;
    }
    const idAttr = item.id ? item.id : '';
    return `<button class="breadcrumb-link" type="button" data-breadcrumb-id="${idAttr}">${item.label}</button>`;
  }).join('<span class="breadcrumb-sep"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="m9 18 6-6-6-6"/></svg></span>');
  container.querySelectorAll('.breadcrumb-link').forEach(link => {
    link.addEventListener('click', () => {
      const id = link.dataset.breadcrumbId || null;
      selectBlockById(id);
    });
  });
}

function showInlineToolbar(blockEl) {
  const toolbar = document.getElementById('email-inline-toolbar');
  if (!toolbar) return;
  const rect = blockEl.getBoundingClientRect();
  toolbar.style.top = `${rect.top - 36 + window.scrollY}px`;
  toolbar.style.left = `${rect.left + window.scrollX}px`;
  toolbar.classList.remove('hidden');
}

function hideInlineToolbar() {
  const toolbar = document.getElementById('email-inline-toolbar');
  if (!toolbar) return;
  toolbar.classList.add('hidden');
}

function toggleTextStyle(type) {
  const context = findBlockContext(editorState.selectedBlockId);
  if (!context || context.block.type !== 'text') return;
  context.block.style = context.block.style || {};
  if (type === 'bold') {
    context.block.style.fontWeight = context.block.style.fontWeight === '700' ? 'normal' : '700';
  }
  if (type === 'italic') {
    context.block.style.fontStyle = context.block.style.fontStyle === 'italic' ? 'normal' : 'italic';
  }
  if (type === 'underline') {
    context.block.style.textDecoration = context.block.style.textDecoration === 'underline' ? 'none' : 'underline';
  }
  renderEmailBlocks();
}

function updateTextStyle(field, value) {
  const context = findBlockContext(editorState.selectedBlockId);
  if (!context || context.block.type !== 'text') return;
  context.block.style = context.block.style || {};
  context.block.style[field] = field === 'fontSize' ? `${value}px` : value;
  renderEmailBlocks();
}

function switchEditorTab(tab) {
  editorState.activeTab = tab;
  const settings = document.getElementById('email-settings-tab');
  const styles = document.getElementById('email-styles-tab');
  if (settings && styles) {
    settings.classList.toggle('hidden', tab !== 'settings');
    styles.classList.toggle('hidden', tab !== 'styles');
  }
  document.querySelectorAll('.editor-tab').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase() === tab);
  });
}

function switchPreviewTab(tab) {
  editorState.previewTab = tab;
  const actual = document.getElementById('email-designer-actual');
  const simulated = document.getElementById('email-designer-simulated');
  if (!actual || !simulated) return;
  actual.classList.toggle('hidden', tab !== 'actual');
  simulated.classList.toggle('hidden', tab !== 'simulated');
  document.querySelectorAll('.preview-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.previewTab === tab);
  });
}

function setDevicePreview(device, options = {}) {
  editorState.previewDevice = device;
  const canvas = document.querySelector('.email-designer-canvas');
  if (!canvas) return;
  const widths = {
    desktop: '100%',
    tablet: '820px',
    mobile: '420px'
  };
  const width = widths[device] || widths.desktop;
  canvas.style.setProperty('--preview-width', width);
  canvas.classList.toggle('device-preview', device !== 'desktop');
  if (!options.silent) {
    ['desktop', 'tablet', 'mobile'].forEach((key) => {
      const btn = document.getElementById(`preview-${key}-btn`);
      if (btn) btn.classList.toggle('active', key === device);
    });
  }
}

function togglePreviewMode() {
  editorState.previewMode = !editorState.previewMode;
  const root = document.getElementById('email-editor-page');
  const btn = document.getElementById('toggle-preview-btn');
  if (root) root.classList.toggle('preview-mode', editorState.previewMode);
  if (btn) btn.textContent = editorState.previewMode ? 'Exit preview' : 'Preview';
  if (editorState.previewMode) hideInlineToolbar();
}

function toggleRightPanel() {
  if (editorState.aiPanelOpen) {
    closeAiPanel();
    editorState.rightPanelOpen = true;
  } else {
    editorState.rightPanelOpen = !editorState.rightPanelOpen;
  }
  const body = document.getElementById('email-editor-body');
  if (!body) return;
  body.classList.toggle('right-collapsed', !editorState.rightPanelOpen);
}

function toggleAiPanel() {
  if (editorState.aiPanelOpen) {
    closeAiPanel();
  } else {
    openAiPanel();
  }
}

function openAiPanel() {
  editorState.aiPanelOpen = true;
  editorState.rightPanelOpen = true;
  const body = document.getElementById('email-editor-body');
  if (body) {
    body.classList.remove('right-collapsed');
    body.classList.add('ai-panel-open');
  }
  editorState.aiSubpanel = null;
  updateAiSubpanelVisibility();
  updateAiPanelContext();
  updateAiRailState();
}

function closeAiPanel() {
  editorState.aiPanelOpen = false;
  const body = document.getElementById('email-editor-body');
  if (body) body.classList.remove('ai-panel-open');
  updateAiRailState();
}

function updateAiRailState() {
  const aiButton = document.querySelector('.email-right-rail-btn[data-rail="ai"]');
  if (aiButton) aiButton.classList.toggle('active', editorState.aiPanelOpen);
}

function setAiTarget(target, options = {}) {
  editorState.aiTarget = target;
  if (!options.auto) {
    editorState.aiTargetManual = true;
  }
  const container = document.getElementById('email-ai-targets');
  if (!container) return;
  container.querySelectorAll('.ai-target-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === target);
  });
  const modeToggle = document.getElementById('email-ai-mode-toggle');
  if (modeToggle) {
    modeToggle.querySelectorAll('.ai-mode-btn').forEach(btn => {
      const isImage = btn.dataset.mode === 'image';
      btn.classList.toggle('active', isImage ? target === 'image' : target !== 'image');
    });
  }
}

function updateAiPanelContext() {
  const title = document.getElementById('email-ai-section-title');
  const generateBtn = document.getElementById('email-ai-generate-btn');
  const breadcrumb = document.getElementById('email-ai-breadcrumb');
  const textSettings = document.getElementById('email-ai-text-settings');
  const imageSettings = document.getElementById('email-ai-image-settings');
  const referenceSettings = document.getElementById('email-ai-reference-settings');
  const textSummary = document.getElementById('email-ai-text-summary');
  const main = document.getElementById('email-ai-main');
  const context = findBlockContext(editorState.selectedBlockId);
  const block = context?.block;
  const isImage = editorState.aiTarget === 'image' || block?.type === 'image';
  const label = isImage ? 'Generate Image' : block ? 'Generate Content' : 'Generate Email';
  if (title) title.textContent = label;
  if (generateBtn) generateBtn.textContent = 'Generate';
  if (breadcrumb) {
    const baseLabel = block ? getBlockLabel(block) : 'Body';
    breadcrumb.innerHTML = `${baseLabel} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin:0 2px;"><path d="m9 18 6-6-6-6"/></svg> ${label}`;
  }
  if (textSettings) textSettings.classList.toggle('hidden', isImage);
  if (imageSettings) imageSettings.classList.toggle('hidden', !isImage);
  if (referenceSettings) referenceSettings.classList.toggle('hidden', !isImage);
  if (textSummary) textSummary.classList.toggle('hidden', isImage);
  if (main) main.classList.toggle('hidden', isImage);
  const defaultTarget = block?.type === 'image' ? 'image' : block?.type === 'button' ? 'button' : block ? 'body' : 'subject';
  if (editorState.aiTargetManual && editorState.aiTarget !== 'image') {
    editorState.aiTargetManual = false;
  }
  if (!editorState.aiTargetManual) {
    setAiTarget(defaultTarget, { auto: true });
  }
  updateAiSubpanelVisibility();
}

function openAiSubpanel(type) {
  editorState.aiSubpanel = type;
  updateAiSubpanelVisibility();
}

function closeAiSubpanel() {
  editorState.aiSubpanel = null;
  updateAiSubpanelVisibility();
}

function updateAiSubpanelVisibility() {
  const main = document.getElementById('email-ai-main');
  const textPanel = document.getElementById('email-ai-subpanel-text');
  const refPanel = document.getElementById('email-ai-subpanel-reference');
  const isSubpanel = !!editorState.aiSubpanel;
  if (main) main.classList.toggle('hidden', isSubpanel);
  if (textPanel) textPanel.classList.toggle('hidden', editorState.aiSubpanel !== 'text');
  if (refPanel) refPanel.classList.toggle('hidden', editorState.aiSubpanel !== 'reference');
}

function updateAiSliderValue(id, value) {
  const label = document.getElementById(id);
  if (label) label.textContent = value;
}

function generateAiContent() {
  const promptEl = document.getElementById('email-ai-prompt');
  const prompt = promptEl?.value?.trim() || '';
  if (!prompt) {
    const group = document.getElementById('email-ai-prompt-group');
    const error = document.getElementById('email-ai-prompt-error');
    if (group) group.classList.add('ai-error');
    if (error) error.classList.remove('hidden');
    showToast('Prompt is required.', 'error');
    return;
  }
  const group = document.getElementById('email-ai-prompt-group');
  const error = document.getElementById('email-ai-prompt-error');
  if (group) group.classList.remove('ai-error');
  if (error) error.classList.add('hidden');
  const generated = `Generated: ${prompt}`;
  const applied = applyAiContent(editorState.aiTarget || 'body', generated);
  if (applied) {
    showToast('AI content inserted.', 'success');
  } else {
    showToast('Select a compatible element to insert content.', 'warning');
  }
}

function toggleAiSection(id) {
  const section = document.getElementById(id);
  if (!section) return;
  section.open = !section.open;
  section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function applyAiContent(target, text) {
  if (target === 'subject') {
    const input = document.getElementById('delivery-subject-input');
    if (!input) return false;
    input.value = text;
    return true;
  }
  if (target === 'preheader') {
    const input = document.getElementById('delivery-preheader-input');
    if (!input) return false;
    input.value = text;
    return true;
  }
  const context = findBlockContext(editorState.selectedBlockId);
  if (!context?.block) return false;
  const block = context.block;
  if (target === 'button') {
    if (block.type !== 'button') return false;
    updateEmailBlockCommit(block.id, 'text', text);
    return true;
  }
  if (target === 'image') {
    if (block.type !== 'image') return false;
    updateEmailBlockCommit(block.id, 'alt', text);
    return true;
  }
  if (block.type === 'text') {
    updateEmailBlockCommit(block.id, 'content', text);
    return true;
  }
  if (block.type === 'html') {
    updateEmailBlockCommit(block.id, 'html', text);
    return true;
  }
  if (block.type === 'button') {
    updateEmailBlockCommit(block.id, 'text', text);
    return true;
  }
  return false;
}

function renderBlockContentPanel(block) {
  if (!block) return '';
  if (block.type === 'fragment') {
    return `
      <details class="inspector-section" open>
        <summary>Fragment</summary>
        <div class="inspector-fields">
          <div class="form-group">
            <label class="form-label">Source fragment</label>
            <div class="form-helper">${block.fragmentName || 'Untitled'} (v${block.fragmentVersion || 1})</div>
          </div>
          <div class="form-group">
            <label class="form-label">Reference</label>
            <div class="form-helper">Locked to source fragment</div>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <div class="form-helper">${block.fragmentStatus || 'draft'}</div>
          </div>
          <div class="inline-buttons">
            <button class="btn btn-secondary" type="button" onclick="openFragmentEditorFromBlock('${block.fragmentId}', '${block.fragmentType || ''}')">Edit source</button>
            <button class="btn btn-secondary" type="button" onclick="detachFragment('${block.id}')">Detach</button>
          </div>
          <div class="form-helper">Detach converts this instance to editable local blocks.</div>
        </div>
      </details>
    `;
  }
  if (block.type === 'text') {
    const displayText = block.content || '';
    return `
      <details class="inspector-section" open>
        <summary>Text</summary>
        <div class="inspector-fields">
          <div class="form-group">
            <label class="form-label">Text</label>
            <div class="form-inline-actions">
              <textarea id="email-block-content-text" class="form-input" rows="4" oninput="updateEmailBlockLivePreview('${block.id}','content', this.value); cacheTextSelection('${block.id}', this)" onselect="cacheTextSelection('${block.id}', this)" onkeyup="cacheTextSelection('${block.id}', this)" onclick="cacheTextSelection('${block.id}', this)" onblur="updateEmailBlockCommit('${block.id}','content', this.value)">${displayText}</textarea>
              <button class="btn btn-icon" type="button" title="Add personalization" onclick="openPersonalizationPickerForBlock()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></button>
            </div>
          </div>
        </div>
      </details>
    `;
  }
  if (block.type === 'html') {
    return `
      <details class="inspector-section" open>
        <summary>HTML</summary>
        <div class="inspector-fields">
          <div class="form-group">
            <label class="form-label">HTML</label>
            <textarea class="form-input" rows="6" oninput="updateEmailBlockLivePreview('${block.id}','html', this.value)" onblur="updateEmailBlockCommit('${block.id}','html', this.value)">${block.html || ''}</textarea>
          </div>
        </div>
      </details>
    `;
  }
  if (block.type === 'image') {
    return `
      <details class="inspector-section" open>
        <summary>Image</summary>
        <div class="inspector-fields">
          <div class="form-group">
            <label class="form-label">Image URL</label>
            <div class="form-inline-actions">
              <input class="form-input" type="text" value="${block.src || ''}" oninput="updateEmailBlockLivePreview('${block.id}','src', this.value)" onblur="updateEmailBlockCommit('${block.id}','src', this.value)">
              <button class="btn btn-icon" type="button" title="Choose from assets" onclick="openAssetPickerForImage('${block.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Alt text</label>
            <input class="form-input" type="text" value="${block.alt || ''}" oninput="updateEmailBlockLivePreview('${block.id}','alt', this.value)" onblur="updateEmailBlockCommit('${block.id}','alt', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Link URL</label>
            <input class="form-input" type="text" value="${block.link || ''}" oninput="updateEmailBlockLivePreview('${block.id}','link', this.value)" onblur="updateEmailBlockCommit('${block.id}','link', this.value)">
          </div>
        </div>
      </details>
    `;
  }
  if (block.type === 'button') {
    return `
      <details class="inspector-section" open>
        <summary>Button</summary>
        <div class="inspector-fields">
          <div class="form-group">
            <label class="form-label">Button text</label>
            <input class="form-input" type="text" value="${block.text || ''}" oninput="updateEmailBlockLivePreview('${block.id}','text', this.value)" onblur="updateEmailBlockCommit('${block.id}','text', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">URL</label>
            <input class="form-input" type="text" value="${block.url || ''}" oninput="updateEmailBlockLivePreview('${block.id}','url', this.value)" onblur="updateEmailBlockCommit('${block.id}','url', this.value)">
          </div>
        </div>
      </details>
    `;
  }
  if (block.type === 'form') {
    return `
      <details class="inspector-section" open>
        <summary>Form</summary>
        <div class="inspector-fields">
          <div class="form-group">
            <label class="form-label">Title</label>
            <input class="form-input" type="text" value="${block.formTitle || ''}" oninput="updateEmailBlockLivePreview('${block.id}','formTitle', this.value)" onblur="updateEmailBlockCommit('${block.id}','formTitle', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Action URL</label>
            <input class="form-input" type="text" value="${block.actionUrl || ''}" oninput="updateEmailBlockLivePreview('${block.id}','actionUrl', this.value)" onblur="updateEmailBlockCommit('${block.id}','actionUrl', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Submit label</label>
            <input class="form-input" type="text" value="${block.submitLabel || ''}" oninput="updateEmailBlockLivePreview('${block.id}','submitLabel', this.value)" onblur="updateEmailBlockCommit('${block.id}','submitLabel', this.value)">
          </div>
        </div>
      </details>
    `;
  }
  if (block.type === 'embed') {
    return `
      <details class="inspector-section" open>
        <summary>Embed</summary>
        <div class="inspector-fields">
          <div class="form-group">
            <label class="form-label">Embed URL</label>
            <input class="form-input" type="text" value="${block.embedUrl || ''}" oninput="updateEmailBlockLivePreview('${block.id}','embedUrl', this.value)" onblur="updateEmailBlockCommit('${block.id}','embedUrl', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Embed code</label>
            <textarea class="form-input" rows="5" oninput="updateEmailBlockLivePreview('${block.id}','embedCode', this.value)" onblur="updateEmailBlockCommit('${block.id}','embedCode', this.value)">${block.embedCode || ''}</textarea>
          </div>
        </div>
      </details>
    `;
  }
  if (block.type === 'divider') {
    return `
      <details class="inspector-section" open>
        <summary>Divider</summary>
        <div class="inspector-fields">
          <div class="form-group">
            <label class="form-label">Thickness</label>
            <input class="form-input" type="number" min="1" value="${block.thickness || 1}" oninput="updateEmailBlockLivePreview('${block.id}','thickness', this.value)" onblur="updateEmailBlockCommit('${block.id}','thickness', this.value)">
          </div>
        </div>
      </details>
    `;
  }
  if (block.type === 'spacer') {
    return `
      <details class="inspector-section" open>
        <summary>Spacer</summary>
        <div class="inspector-fields">
          <div class="form-group">
            <label class="form-label">Height</label>
            <input class="form-input" type="number" min="4" value="${block.height || 20}" oninput="updateEmailBlockLivePreview('${block.id}','height', this.value)" onblur="updateEmailBlockCommit('${block.id}','height', this.value)">
          </div>
        </div>
      </details>
    `;
  }
  if (block.type === 'social') {
    return `
      <details class="inspector-section" open>
        <summary>Social</summary>
        <div class="inspector-fields">
          <div class="form-group">
            <label class="form-label">Facebook URL</label>
            <input class="form-input" type="text" value="${block.links?.facebook || ''}" oninput="updateSocialLinkLivePreview('${block.id}','facebook', this.value)" onblur="updateSocialLinkCommit('${block.id}','facebook', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Twitter URL</label>
            <input class="form-input" type="text" value="${block.links?.twitter || ''}" oninput="updateSocialLinkLivePreview('${block.id}','twitter', this.value)" onblur="updateSocialLinkCommit('${block.id}','twitter', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">LinkedIn URL</label>
            <input class="form-input" type="text" value="${block.links?.linkedin || ''}" oninput="updateSocialLinkLivePreview('${block.id}','linkedin', this.value)" onblur="updateSocialLinkCommit('${block.id}','linkedin', this.value)">
          </div>
        </div>
      </details>
    `;
  }
  if (block.type === 'structure' || block.type === 'container') {
    return `
      <details class="inspector-section" open>
        <summary>Structure</summary>
        <div class="inspector-fields">
          <div class="form-helper">Select nested elements to edit their content.</div>
        </div>
      </details>
    `;
  }
  return '';
}

function renderBlockActions(block) {
  if (!block) return '';
  return `
    <div class="inspector-actions">
      <button class="btn btn-icon" type="button" title="Move up" onclick="moveEmailBlock('${block.id}','up')">↑</button>
      <button class="btn btn-icon" type="button" title="Move down" onclick="moveEmailBlock('${block.id}','down')">↓</button>
      <button class="btn btn-icon" type="button" title="Delete" onclick="deleteEmailBlock('${block.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
    </div>
  `;
}

function renderStylesPanel() {
  const container = document.getElementById('email-styles-panel');
  if (!container) return;
  renderSettingsBreadcrumb();
  updateAiPanelContext();
  const context = findBlockContext(editorState.selectedBlockId);
  const block = context?.block;
  const body = editorState.bodyStyle || {};
  const actionSection = block ? renderBlockActions(block) : '';
  if (block?.type === 'fragment') {
    container.innerHTML = `
      <details class="inspector-section" open>
        <summary>Fragment styles</summary>
        <div class="inspector-fields">
          <div class="form-helper">Fragments are locked to their source styles. Detach to edit locally.</div>
        </div>
      </details>
      ${actionSection}
    `;
    return;
  }
  const bodySection = `
    <details class="inspector-section" open>
      <summary>Background</summary>
      <div class="inspector-fields">
        <div class="form-group">
          <label class="form-label">Background color</label>
          <input type="color" class="form-input" value="${body.backgroundColor}" oninput="updateBodyStyleLivePreview('backgroundColor', this.value)" onchange="updateBodyStyle('backgroundColor', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">Viewport color</label>
          <input type="color" class="form-input" value="${body.viewportColor || '#f0f0f0'}" oninput="updateBodyStyleLivePreview('viewportColor', this.value)" onchange="updateBodyStyle('viewportColor', this.value)">
        </div>
      </div>
    </details>
    <details class="inspector-section" open>
      <summary>Text</summary>
      <div class="inspector-fields">
        <div class="form-group">
          <label class="form-label">Font family</label>
          <input type="text" class="form-input" value="${body.fontFamily || 'Arial'}" oninput="updateBodyStyleLivePreview('fontFamily', this.value)" onchange="updateBodyStyle('fontFamily', this.value)">
        </div>
      </div>
    </details>
    <details class="inspector-section" open>
      <summary>Size</summary>
      <div class="inspector-fields">
        <div class="form-group inline">
          <label class="form-label">Width</label>
          <input type="number" class="form-input" value="${parseInt(body.maxWidth || '640', 10)}" oninput="updateBodyStyleLivePreview('maxWidth', this.value + (body.widthUnit || 'px'))" onchange="updateBodyStyle('maxWidth', this.value + (body.widthUnit || 'px'))">
        </div>
        <div class="form-group inline">
          <label class="form-label">Unit</label>
          <select class="form-input" oninput="updateBodyStyleLivePreview('widthUnit', this.value)" onchange="updateBodyStyle('widthUnit', this.value)">
            <option value="px" ${body.widthUnit === 'px' ? 'selected' : ''}>px</option>
            <option value="%" ${body.widthUnit === '%' ? 'selected' : ''}>%</option>
          </select>
        </div>
      </div>
    </details>
    <details class="inspector-section" open>
      <summary>Alignment</summary>
      <div class="inspector-fields">
        <div class="inline-buttons">
          <button class="btn btn-icon ${body.align === 'left' ? 'active' : ''}" type="button" title="Left" onclick="updateBodyStyleLivePreview('align', 'left'); updateBodyStyle('align', 'left')">⟸</button>
          <button class="btn btn-icon ${body.align === 'center' ? 'active' : ''}" type="button" title="Center" onclick="updateBodyStyleLivePreview('align', 'center'); updateBodyStyle('align', 'center')">≡</button>
          <button class="btn btn-icon ${body.align === 'right' ? 'active' : ''}" type="button" title="Right" onclick="updateBodyStyleLivePreview('align', 'right'); updateBodyStyle('align', 'right')">⟹</button>
        </div>
      </div>
    </details>
    <details class="inspector-section">
      <summary>Advanced</summary>
      <div class="inspector-fields">
        <div class="form-group inline">
          <label class="form-label">Custom CSS</label>
          <button class="btn btn-icon" type="button" title="Toggle custom CSS" onclick="toggleBodyCustomCss()">${body.customCssEnabled ? '—' : '+'}</button>
        </div>
        ${body.customCssEnabled ? `
          <textarea class="form-input email-code-textarea" rows="4" placeholder=".container { }" oninput="updateBodyStyleLivePreview('customCss', this.value)" onblur="updateBodyStyle('customCss', this.value)">${body.customCss || ''}</textarea>
        ` : ``}
      </div>
    </details>
  `;
  if (!block) {
    container.innerHTML = bodySection + '<div class="inspector-empty">Select a block to edit styles.</div>';
    return;
  }
  const contentSection = renderBlockContentPanel(block);
  const style = block.style || {};
  const hasMarginSides = !!style.marginTop || !!style.marginRight || !!style.marginBottom || !!style.marginLeft;
  const hasPaddingSides = !!style.paddingTop || !!style.paddingRight || !!style.paddingBottom || !!style.paddingLeft;
  const common = `
    <details class="inspector-section" open>
      <summary>Background</summary>
      <div class="inspector-fields">
        <div class="form-group">
          <label class="form-label">Background color</label>
          <input type="color" class="form-input" value="${style.backgroundColor || '#ffffff'}" oninput="updateBlockStyleLivePreview('${block.id}','backgroundColor', this.value)" onchange="updateBlockStyle('${block.id}','backgroundColor', this.value)">
        </div>
      </div>
    </details>
    <details class="inspector-section" open>
      <summary>Border</summary>
      <div class="inspector-fields">
        <div class="form-group">
          <label class="form-label">Border</label>
          <input type="text" class="form-input" value="${style.border || ''}" oninput="updateBlockStyleLivePreview('${block.id}','border', this.value)" onchange="updateBlockStyle('${block.id}','border', this.value)" placeholder="1px solid #E5E7EB">
        </div>
        <div class="form-group">
          <label class="form-label">Border radius</label>
          <input type="number" class="form-input" value="${parseInt(style.borderRadius || '0', 10)}" oninput="updateBlockStyleLivePreview('${block.id}','borderRadius', this.value + 'px')" onchange="updateBlockStyle('${block.id}','borderRadius', this.value + 'px')">
        </div>
      </div>
    </details>
    <details class="inspector-section">
      <summary>Size</summary>
      <div class="inspector-fields">
        <div class="form-group inline">
          <label class="form-label">Height</label>
          <input type="number" class="form-input" value="${parseInt(style.height || '0', 10) || ''}" oninput="updateBlockStyleLivePreview('${block.id}','height', this.value ? this.value + (style.heightUnit || 'px') : '')" onchange="updateBlockStyle('${block.id}','height', this.value ? this.value + (style.heightUnit || 'px') : '')" placeholder="Auto">
        </div>
        <div class="form-group inline">
          <label class="form-label">Width</label>
          <input type="number" class="form-input" value="${parseInt(style.width || '0', 10) || ''}" oninput="updateBlockStyleLivePreview('${block.id}','width', this.value ? this.value + (style.widthUnit || '%') : '')" onchange="updateBlockStyle('${block.id}','width', this.value ? this.value + (style.widthUnit || '%') : '')" placeholder="Auto">
        </div>
        <div class="form-group inline">
          <label class="form-label">Width unit</label>
          <select class="form-input" oninput="updateBlockStyleLivePreview('${block.id}','widthUnit', this.value)" onchange="updateBlockStyle('${block.id}','widthUnit', this.value)">
            <option value="%" ${style.widthUnit === '%' ? 'selected' : ''}>%</option>
            <option value="px" ${style.widthUnit === 'px' ? 'selected' : ''}>px</option>
          </select>
        </div>
      </div>
    </details>
    <details class="inspector-section">
      <summary>Spacing</summary>
      <div class="inspector-fields">
        <div class="form-group inline">
          <label class="form-label">Margin</label>
          <input type="number" class="form-input" value="${parseInt(style.margin || '0', 10)}" oninput="updateBlockStyleLivePreview('${block.id}','margin', this.value + 'px')" onchange="updateBlockStyle('${block.id}','margin', this.value + 'px')">
        </div>
        <label class="form-checkbox">
          <input type="checkbox" ${hasMarginSides ? 'checked' : ''} onchange="toggleStyleSides('${block.id}','margin', this.checked)">
          Different margin for each side
        </label>
        ${hasMarginSides ? `
          <div class="form-group inline">
            <label class="form-label">Top</label>
            <input type="number" class="form-input" value="${parseInt(style.marginTop || '0', 10)}" oninput="updateBlockStyleLivePreview('${block.id}','marginTop', this.value + 'px')" onchange="updateBlockStyle('${block.id}','marginTop', this.value + 'px')">
          </div>
          <div class="form-group inline">
            <label class="form-label">Right</label>
            <input type="number" class="form-input" value="${parseInt(style.marginRight || '0', 10)}" oninput="updateBlockStyleLivePreview('${block.id}','marginRight', this.value + 'px')" onchange="updateBlockStyle('${block.id}','marginRight', this.value + 'px')">
          </div>
          <div class="form-group inline">
            <label class="form-label">Bottom</label>
            <input type="number" class="form-input" value="${parseInt(style.marginBottom || '0', 10)}" oninput="updateBlockStyleLivePreview('${block.id}','marginBottom', this.value + 'px')" onchange="updateBlockStyle('${block.id}','marginBottom', this.value + 'px')">
          </div>
          <div class="form-group inline">
            <label class="form-label">Left</label>
            <input type="number" class="form-input" value="${parseInt(style.marginLeft || '0', 10)}" oninput="updateBlockStyleLivePreview('${block.id}','marginLeft', this.value + 'px')" onchange="updateBlockStyle('${block.id}','marginLeft', this.value + 'px')">
          </div>
        ` : ''}
        <div class="form-group inline">
          <label class="form-label">Padding</label>
          <input type="number" class="form-input" value="${parseInt(style.padding || '0', 10)}" oninput="updateBlockStyleLivePreview('${block.id}','padding', this.value + 'px')" onchange="updateBlockStyle('${block.id}','padding', this.value + 'px')">
        </div>
        <label class="form-checkbox">
          <input type="checkbox" ${hasPaddingSides ? 'checked' : ''} onchange="toggleStyleSides('${block.id}','padding', this.checked)">
          Different padding for each side
        </label>
        ${hasPaddingSides ? `
          <div class="form-group inline">
            <label class="form-label">Top</label>
            <input type="number" class="form-input" value="${parseInt(style.paddingTop || '0', 10)}" oninput="updateBlockStyleLivePreview('${block.id}','paddingTop', this.value + 'px')" onchange="updateBlockStyle('${block.id}','paddingTop', this.value + 'px')">
          </div>
          <div class="form-group inline">
            <label class="form-label">Right</label>
            <input type="number" class="form-input" value="${parseInt(style.paddingRight || '0', 10)}" oninput="updateBlockStyleLivePreview('${block.id}','paddingRight', this.value + 'px')" onchange="updateBlockStyle('${block.id}','paddingRight', this.value + 'px')">
          </div>
          <div class="form-group inline">
            <label class="form-label">Bottom</label>
            <input type="number" class="form-input" value="${parseInt(style.paddingBottom || '0', 10)}" oninput="updateBlockStyleLivePreview('${block.id}','paddingBottom', this.value + 'px')" onchange="updateBlockStyle('${block.id}','paddingBottom', this.value + 'px')">
          </div>
          <div class="form-group inline">
            <label class="form-label">Left</label>
            <input type="number" class="form-input" value="${parseInt(style.paddingLeft || '0', 10)}" oninput="updateBlockStyleLivePreview('${block.id}','paddingLeft', this.value + 'px')" onchange="updateBlockStyle('${block.id}','paddingLeft', this.value + 'px')">
          </div>
        ` : ''}
      </div>
    </details>
  `;
  container.innerHTML = `
    ${contentSection}
    ${actionSection}
    ${common}
    ${block.type === 'text' ? `
      <details class="inspector-section" open>
        <summary>Text</summary>
        <div class="inspector-fields">
          <div class="form-group">
            <label class="form-label">Text type</label>
            <select class="form-input" oninput="updateBlockStyleLivePreview('${block.id}','textType', this.value)" onchange="updateBlockStyle('${block.id}','textType', this.value)">
              <option value="paragraph" ${style.textType === 'paragraph' ? 'selected' : ''}>Paragraph</option>
              <option value="heading1" ${style.textType === 'heading1' ? 'selected' : ''}>Heading 1</option>
              <option value="heading2" ${style.textType === 'heading2' ? 'selected' : ''}>Heading 2</option>
              <option value="heading3" ${style.textType === 'heading3' ? 'selected' : ''}>Heading 3</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Font family</label>
            <input type="text" class="form-input" value="${style.fontFamily || 'Arial'}" oninput="updateBlockStyleLivePreview('${block.id}','fontFamily', this.value)" onchange="updateBlockStyle('${block.id}','fontFamily', this.value)">
          </div>
          <div class="form-group inline">
            <label class="form-label">Font size</label>
            <input type="number" class="form-input" value="${parseInt(style.fontSize || '14', 10)}" oninput="updateBlockStyleLivePreview('${block.id}','fontSize', this.value + 'px')" onchange="updateBlockStyle('${block.id}','fontSize', this.value + 'px')">
          </div>
          <div class="form-group inline">
            <label class="form-label">Line height</label>
            <input type="text" class="form-input" value="${style.lineHeight || '1.5'}" oninput="updateBlockStyleLivePreview('${block.id}','lineHeight', this.value)" onchange="updateBlockStyle('${block.id}','lineHeight', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Text styles</label>
            <div class="inline-buttons">
              <button class="btn btn-icon ${style.fontWeight === '700' ? 'active' : ''}" type="button" title="Bold" onclick="toggleTextStyle('bold')">B</button>
              <button class="btn btn-icon ${style.fontStyle === 'italic' ? 'active' : ''}" type="button" title="Italic" onclick="toggleTextStyle('italic')">I</button>
              <button class="btn btn-icon ${style.textDecoration === 'underline' ? 'active' : ''}" type="button" title="Underline" onclick="toggleTextStyle('underline')">U</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Text alignment</label>
            <div class="inline-buttons">
              <button class="btn btn-icon ${style.textAlign === 'left' ? 'active' : ''}" type="button" title="Left" onclick="updateBlockStyleLivePreview('${block.id}','textAlign', 'left'); updateBlockStyle('${block.id}','textAlign', 'left')">⟸</button>
              <button class="btn btn-icon ${style.textAlign === 'center' ? 'active' : ''}" type="button" title="Center" onclick="updateBlockStyleLivePreview('${block.id}','textAlign', 'center'); updateBlockStyle('${block.id}','textAlign', 'center')">≡</button>
              <button class="btn btn-icon ${style.textAlign === 'right' ? 'active' : ''}" type="button" title="Right" onclick="updateBlockStyleLivePreview('${block.id}','textAlign', 'right'); updateBlockStyle('${block.id}','textAlign', 'right')">⟹</button>
            </div>
          </div>
          <div class="form-group inline">
            <label class="form-label">Indentation</label>
            <input type="number" class="form-input" value="${parseInt(style.indent || '0', 10)}" oninput="updateBlockStyleLivePreview('${block.id}','indent', this.value + 'px')" onchange="updateBlockStyle('${block.id}','indent', this.value + 'px')">
          </div>
          <div class="form-group">
            <label class="form-label">Font color</label>
            <input type="color" class="form-input" value="${style.color || '#1f2933'}" oninput="updateBlockStyleLivePreview('${block.id}','color', this.value)" onchange="updateBlockStyle('${block.id}','color', this.value)">
          </div>
        </div>
      </details>
    ` : ''}
    ${block.type === 'image' ? `
      <details class="inspector-section">
        <summary>Image</summary>
        <div class="inspector-fields">
          <div class="form-group inline">
            <label class="form-label">Width</label>
            <input type="number" class="form-input" value="${parseInt(style.width || '100', 10)}" oninput="updateBlockStyleLivePreview('${block.id}','width', this.value + '%')" onchange="updateBlockStyle('${block.id}','width', this.value + '%')">
          </div>
          <div class="form-group">
            <label class="form-label">Alignment</label>
            <div class="inline-buttons">
              <button class="btn btn-icon ${style.textAlign === 'left' ? 'active' : ''}" type="button" title="Left" onclick="updateBlockStyleLivePreview('${block.id}','textAlign', 'left'); updateBlockStyle('${block.id}','textAlign', 'left')">⟸</button>
              <button class="btn btn-icon ${style.textAlign === 'center' ? 'active' : ''}" type="button" title="Center" onclick="updateBlockStyleLivePreview('${block.id}','textAlign', 'center'); updateBlockStyle('${block.id}','textAlign', 'center')">≡</button>
              <button class="btn btn-icon ${style.textAlign === 'right' ? 'active' : ''}" type="button" title="Right" onclick="updateBlockStyleLivePreview('${block.id}','textAlign', 'right'); updateBlockStyle('${block.id}','textAlign', 'right')">⟹</button>
            </div>
          </div>
        </div>
      </details>
    ` : ''}
    ${block.type === 'button' ? `
      <details class="inspector-section">
        <summary>Button</summary>
        <div class="inspector-fields">
          <div class="form-group">
            <label class="form-label">Button color</label>
            <input type="color" class="form-input" value="${style.buttonColor || '#1473E6'}" oninput="updateBlockStyleLivePreview('${block.id}','buttonColor', this.value)" onchange="updateBlockStyle('${block.id}','buttonColor', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Text color</label>
            <input type="color" class="form-input" value="${style.color || '#ffffff'}" oninput="updateBlockStyleLivePreview('${block.id}','color', this.value)" onchange="updateBlockStyle('${block.id}','color', this.value)">
          </div>
        </div>
      </details>
    ` : ''}
    ${block.type === 'divider' ? `
      <details class="inspector-section">
        <summary>Divider</summary>
        <div class="inspector-fields">
          <div class="form-group inline">
            <label class="form-label">Thickness</label>
            <input type="number" class="form-input" value="${parseInt(style.thickness || '1', 10)}" oninput="updateBlockStyleLivePreview('${block.id}','thickness', this.value)" onchange="updateBlockStyle('${block.id}','thickness', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Color</label>
            <input type="color" class="form-input" value="${style.borderColor || '#E5E7EB'}" oninput="updateBlockStyleLivePreview('${block.id}','borderColor', this.value)" onchange="updateBlockStyle('${block.id}','borderColor', this.value)">
          </div>
        </div>
      </details>
    ` : ''}
    ${block.type === 'spacer' ? `
      <details class="inspector-section">
        <summary>Spacer</summary>
        <div class="inspector-fields">
          <div class="form-group inline">
            <label class="form-label">Height</label>
            <input type="number" class="form-input" value="${parseInt(style.height || block.height || '20', 10)}" oninput="updateBlockStyleLivePreview('${block.id}','height', this.value)" onchange="updateBlockStyle('${block.id}','height', this.value)">
          </div>
        </div>
      </details>
    ` : ''}
    ${block.type === 'structure' ? `
      <details class="inspector-section">
        <summary>Structure</summary>
        <div class="inspector-fields">
          <div class="form-group inline">
            <label class="form-label">Column gap</label>
            <input type="number" class="form-input" value="${parseInt(style.columnGap || '8', 10)}" oninput="updateBlockStyleLivePreview('${block.id}','columnGap', this.value)" onchange="updateBlockStyle('${block.id}','columnGap', this.value)">
          </div>
        </div>
      </details>
    ` : ''}
    ${block.type === 'container' ? `
      <details class="inspector-section">
        <summary>Container</summary>
        <div class="inspector-fields">
          <div class="form-group inline">
            <label class="form-label">Container padding</label>
            <input type="number" class="form-input" value="${parseInt(style.padding || '12', 10)}" oninput="updateBlockStyleLivePreview('${block.id}','padding', this.value + 'px')" onchange="updateBlockStyle('${block.id}','padding', this.value + 'px')">
          </div>
        </div>
      </details>
    ` : ''}
    ${block.type === 'social' ? `
      <details class="inspector-section">
        <summary>Social</summary>
        <div class="inspector-fields">
          <div class="form-group inline">
            <label class="form-label">Icon size</label>
            <input type="number" class="form-input" value="${parseInt(style.iconSize || '16', 10)}" oninput="updateBlockStyleLivePreview('${block.id}','iconSize', this.value)" onchange="updateBlockStyle('${block.id}','iconSize', this.value)">
          </div>
        </div>
      </details>
    ` : ''}
    ${block.type === 'structure' ? renderStructureColumnStyles(block) : ''}
    ${bodySection}
  `;
}

function updateBodyStyle(field, value) {
  editorState.bodyStyle = editorState.bodyStyle || {};
  editorState.bodyStyle[field] = value;
  if (field === 'widthUnit') {
    const numeric = parseInt(editorState.bodyStyle.maxWidth || '640', 10);
    editorState.bodyStyle.maxWidth = `${numeric}${value}`;
  }
  renderEmailBlocks();
  pushHistory();
  syncBodyWidthControls();
}

function updateBodyStyleLivePreview(field, value) {
  editorState.bodyStyle = editorState.bodyStyle || {};
  editorState.bodyStyle[field] = value;
  if (field === 'widthUnit') {
    const numeric = parseInt(editorState.bodyStyle.maxWidth || '640', 10);
    editorState.bodyStyle.maxWidth = `${numeric}${value}`;
  }
  renderEmailBlocks({ skipStylesPanel: true });
  syncBodyWidthControls();
}

function toggleBodyCustomCss() {
  editorState.bodyStyle.customCssEnabled = !editorState.bodyStyle.customCssEnabled;
  renderStylesPanel();
  pushHistory();
}

function updateBodyWidthFromSlider(value) {
  const numeric = parseInt(value, 10);
  if (!numeric) return;
  editorState.bodyStyle = editorState.bodyStyle || {};
  editorState.bodyStyle.widthUnit = 'px';
  editorState.bodyStyle.maxWidth = `${numeric}px`;
  renderEmailBlocks();
  pushHistory();
  syncBodyWidthControls();
}

function syncBodyWidthControls() {
  const slider = document.getElementById('email-body-width-slider');
  const input = document.getElementById('email-body-width-input');
  if (!slider && !input) return;
  const numeric = parseInt(editorState.bodyStyle?.maxWidth || '640', 10);
  if (slider) slider.value = numeric;
  if (input) input.value = numeric;
}

function renderStructureColumnStyles(block) {
  const cols = block.columns || [];
  if (!cols.length) return '';
  return `
    <details class="inspector-section">
      <summary>Columns</summary>
      <div class="inspector-fields">
        ${cols.map((col, idx) => {
          const style = col.style || {};
          return `
            <details class="inspector-subsection">
              <summary>Column ${idx + 1}</summary>
              <div class="inspector-fields">
                <div class="form-group">
                  <label class="form-label">Background</label>
                  <input type="color" class="form-input" value="${style.backgroundColor || '#ffffff'}" oninput="updateColumnStyleLivePreview('${block.id}', ${idx}, 'backgroundColor', this.value)" onchange="updateColumnStyle('${block.id}', ${idx}, 'backgroundColor', this.value)">
                </div>
                <div class="form-group">
                  <label class="form-label">Border</label>
                  <input type="text" class="form-input" value="${style.border || ''}" oninput="updateColumnStyleLivePreview('${block.id}', ${idx}, 'border', this.value)" onchange="updateColumnStyle('${block.id}', ${idx}, 'border', this.value)" placeholder="1px dashed #E5E7EB">
                </div>
                <div class="form-group">
                  <label class="form-label">Border radius</label>
                  <input type="number" class="form-input" value="${parseInt(style.borderRadius || '0', 10)}" oninput="updateColumnStyleLivePreview('${block.id}', ${idx}, 'borderRadius', this.value + 'px')" onchange="updateColumnStyle('${block.id}', ${idx}, 'borderRadius', this.value + 'px')">
                </div>
                <div class="form-group inline">
                  <label class="form-label">Padding</label>
                  <input type="number" class="form-input" value="${parseInt(style.padding || '8', 10)}" oninput="updateColumnStyleLivePreview('${block.id}', ${idx}, 'padding', this.value + 'px')" onchange="updateColumnStyle('${block.id}', ${idx}, 'padding', this.value + 'px')">
                </div>
              </div>
            </details>
          `;
        }).join('')}
      </div>
    </details>
  `;
}

function updateColumnStyle(blockId, columnIndex, field, value) {
  const context = findBlockContext(blockId);
  if (!context?.block || context.block.type !== 'structure') return;
  const column = context.block.columns?.[columnIndex];
  if (!column) return;
  column.style = column.style || {};
  column.style[field] = value;
  renderEmailBlocks();
  pushHistory();
}

function updateColumnStyleLivePreview(blockId, columnIndex, field, value) {
  const context = findBlockContext(blockId);
  if (!context?.block || context.block.type !== 'structure') return;
  const column = context.block.columns?.[columnIndex];
  if (!column) return;
  column.style = column.style || {};
  column.style[field] = value;
  renderEmailBlocks({ skipStylesPanel: true });
}

function updateBlockStyle(blockId, field, value) {
  const context = findBlockContext(blockId);
  if (!context?.block) return;
  context.block.style = context.block.style || {};
  context.block.style[field] = value;
  renderEmailBlocks();
  pushHistory();
}

function updateBlockStyleLivePreview(blockId, field, value) {
  const context = findBlockContext(blockId);
  if (!context?.block) return;
  context.block.style = context.block.style || {};
  context.block.style[field] = value;
  renderEmailBlocks({ skipStylesPanel: true });
}

function toggleStyleSides(blockId, type, enabled) {
  const context = findBlockContext(blockId);
  if (!context?.block) return;
  context.block.style = context.block.style || {};
  if (!enabled) {
    delete context.block.style[`${type}Top`];
    delete context.block.style[`${type}Right`];
    delete context.block.style[`${type}Bottom`];
    delete context.block.style[`${type}Left`];
  } else {
    context.block.style[`${type}Top`] = context.block.style[`${type}Top`] || '0px';
    context.block.style[`${type}Right`] = context.block.style[`${type}Right`] || '0px';
    context.block.style[`${type}Bottom`] = context.block.style[`${type}Bottom`] || '0px';
    context.block.style[`${type}Left`] = context.block.style[`${type}Left`] || '0px';
  }
  renderEmailBlocks();
  pushHistory();
}

function updateSubjectPreview() {
  // Placeholder for future live preview updates
}

function getSelectedDeliveryAudienceLabel() {
  const d = editorState.delivery || {};
  const selectedAudience = editorState.audiences.find(a => String(a.id) === String(d.audience_id));
  const selectedSegment = editorState.segments.find(s => String(s.id) === String(d.segment_id));
  if (selectedAudience && selectedSegment) return `${selectedAudience.name} + ${selectedSegment.name}`;
  if (selectedAudience) return selectedAudience.name;
  if (selectedSegment) return selectedSegment.name;
  return 'General audience';
}

async function generateSubjectForDelivery() {
  const output = document.getElementById('delivery-subject-suggestions');
  if (!output) return;
  const productName = (editorState.delivery && editorState.delivery.name) || 'Campaign';
  const targetAudience = getSelectedDeliveryAudienceLabel();
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/ai/generate-subject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, targetAudience, count: 5 })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to generate subject lines');
    let html = '<h4>Suggested subject lines</h4>';
    data.subjects.forEach((subject, i) => {
      html += `<div class="ai-output-item ai-output-clickable" onclick="applySubjectFromSuggestion('${subject.replace(/'/g, "\\'")}')">${i + 1}. ${subject}</div>`;
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

function applySubjectFromSuggestion(subject) {
  const input = document.getElementById('delivery-subject-input');
  if (input) input.value = subject;
}

function openFragmentEditorFromBlock(fragmentId, fragmentType = '') {
  if (!fragmentId) return;
  const returnMode = new URLSearchParams(window.location.search).get('return') || 'fragments';
  const params = new URLSearchParams({ fragmentMode: '1', return: returnMode === 'modal' ? 'modal' : 'fragments' });
  params.set('fragmentId', fragmentId);
  if (fragmentType) params.set('fragmentType', fragmentType);
  const url = `/email-designer.html?${params.toString()}`;
  if (returnMode === 'modal' && window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'openFragmentEditor', url }, '*');
    return;
  }
  window.open(url, '_blank');
}

function openFragmentLibrary() {
  window.location.href = '/?view=fragments';
}

function openValidationModal() {
  const existing = document.getElementById('email-validation-modal');
  if (existing) existing.remove();
  const issues = collectValidationIssues();
  const errors = issues.filter(item => item.severity === 'error');
  const warnings = issues.filter(item => item.severity === 'warning');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'email-validation-modal';
  overlay.innerHTML = `
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-header">
        <div class="modal-title">Validation & Preview</div>
        <span class="modal-close" onclick="closeValidationModal()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <div class="form-helper">Errors: ${errors.length} · Warnings: ${warnings.length}</div>
        </div>
        ${issues.length ? `
          <ul style="margin: 0; padding-left: 18px; display: grid; gap: 8px;">
            ${issues.map(item => `<li><strong>${item.severity.toUpperCase()}</strong> — ${item.message}</li>`).join('')}
          </ul>
        ` : `<div class="form-helper">No issues found.</div>`}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" type="button" onclick="closeValidationModal()">Close</button>
        <button class="btn btn-primary" type="button" onclick="openPreviewFromValidation()">Open simulated preview</button>
      </div>
    </div>
  `;
  overlay.addEventListener('click', closeValidationModal);
  document.body.appendChild(overlay);
}

function closeValidationModal() {
  const modal = document.getElementById('email-validation-modal');
  if (modal) modal.remove();
}

function openPreviewFromValidation() {
  switchPreviewTab('simulated');
  closeValidationModal();
}

function collectValidationIssues() {
  const issues = [];
  const blocks = Array.isArray(editorState.blocks) ? editorState.blocks : [];
  const allowed = new Set(['text', 'image', 'button', 'form', 'embed', 'container', 'structure', 'divider', 'spacer', 'html', 'social', 'fragment']);
  if (!blocks.length) {
    issues.push({ severity: 'warning', message: 'Canvas is empty.' });
  }
  const isValidUrl = (value) => {
    if (!value) return false;
    if (value.startsWith('#')) return false;
    if (value.startsWith('/')) return true;
    return /^(https?:\/\/|mailto:|tel:)/i.test(value);
  };
  const hasUnclosedToken = (value) => {
    if (!value) return false;
    if (value.includes('{{}}')) return true;
    const hasOpen = value.includes('{{');
    const hasClose = value.includes('}}');
    return hasOpen && !hasClose;
  };
  const scanBlock = (block) => {
    if (!allowed.has(block.type)) {
      issues.push({ severity: 'error', message: `Unsupported component: ${block.type}` });
    }
    if (block.type === 'button') {
      if (!block.url) {
        issues.push({ severity: 'warning', message: 'Button is missing a destination URL.' });
      } else if (!isValidUrl(block.url)) {
        issues.push({ severity: 'error', message: `Button URL looks invalid: ${block.url}` });
      }
    }
    if (block.type === 'image' && block.link && !isValidUrl(block.link)) {
      issues.push({ severity: 'error', message: `Image link looks invalid: ${block.link}` });
    }
    if (block.type === 'form' && !block.actionUrl) {
      issues.push({ severity: 'warning', message: 'Form action URL is missing.' });
    }
    if (block.type === 'embed' && block.embedUrl && !isValidUrl(block.embedUrl)) {
      issues.push({ severity: 'error', message: `Embed URL looks invalid: ${block.embedUrl}` });
    }
    if (block.type === 'fragment' && block.fragmentStatus !== 'published') {
      issues.push({ severity: 'warning', message: `Fragment "${block.fragmentName || 'Untitled'}" is not published.` });
    }
    const contentFields = ['content', 'html', 'embedCode'];
    contentFields.forEach(field => {
      if (hasUnclosedToken(block[field] || '')) {
        issues.push({ severity: 'warning', message: `Unclosed personalization token in ${block.type} block.` });
      }
    });
    if (block.type === 'structure') {
      (block.columns || []).forEach(col => (col.blocks || []).forEach(scanBlock));
    }
    if (block.type === 'container') {
      (block.columns?.[0]?.blocks || []).forEach(scanBlock);
    }
  };
  blocks.forEach(scanBlock);
  return issues;
}

function goBackToDelivery() {
  const params = new URLSearchParams(window.location.search);
  const returnMode = params.get('return') || 'deliveries';
  const step = params.get('step') || '3';
  if (returnMode === 'modal' && window.parent && window.parent !== window) {
    if (editorState.fragmentMode) {
      window.parent.postMessage({ type: 'closeFragmentEditor' }, '*');
    } else if (editorState.landingPageMode) {
      window.parent.postMessage({ type: 'closeLandingPageEditor', landingPageId: editorState.landingPageId }, '*');
    } else {
      window.parent.postMessage({ type: 'closeEmailEditor', deliveryId: editorState.deliveryId, step: 3 }, '*');
    }
    return;
  }
  if (returnMode === 'fragments') {
    window.location.href = '/?view=fragments';
    return;
  }
  if (editorState.landingPageMode || returnMode === 'landing-pages') {
    window.location.href = '/?view=landing-pages';
    return;
  }
  const url = `/?view=${encodeURIComponent(returnMode)}&deliveryId=${encodeURIComponent(editorState.deliveryId)}&step=${encodeURIComponent(step)}`;
  window.location.href = url;
}

function showLoading() {
  const loading = document.getElementById('loading');
  if (loading) loading.classList.remove('hidden');
}

function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) loading.classList.add('hidden');
}

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
