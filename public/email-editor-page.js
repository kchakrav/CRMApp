const API_BASE = '/api';

const editorState = {
  deliveryId: null,
  landingPageId: null,
  landingPageMode: false,
  landingPage: null,
  templateId: null,
  templateMode: false,
  template: null,
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
  previewTestProfile: null,
  previewTestProfileResults: [],
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
  currentDragType: null,
  fragments: [],
  fragmentSearch: '',
  assets: [],
  assetSearch: '',
  offerPlacements: [],
  offerDecisions: [],
  offerDecisionCache: {},
  themes: [],
  brands: [],
  brandAlignmentResult: null,
  appliedThemeId: null,
  appliedThemeVariantIndex: 0,
  canvasDarkMode: false
};

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  editorState.deliveryId = parseInt(params.get('deliveryId'), 10);
  editorState.landingPageId = parseInt(params.get('landingPageId'), 10);
  editorState.landingPageMode = params.get('landingPageMode') === '1' || !Number.isNaN(editorState.landingPageId);
  editorState.templateId = parseInt(params.get('templateId'), 10);
  editorState.templateMode = !Number.isNaN(editorState.templateId);
  editorState.fragmentId = parseInt(params.get('fragmentId'), 10);
  editorState.fragmentMode = params.get('fragmentMode') === '1' || !Number.isNaN(editorState.fragmentId);
  editorState.fragmentType = params.get('fragmentType') || (editorState.landingPageMode ? 'landing' : 'email');
  editorState.offerRepMode = params.get('offerRepMode') === '1';
  editorState.offerId = parseInt(params.get('offerId'), 10);
  editorState.repId = parseInt(params.get('repId'), 10);
  initRail();
  setDevicePreview(editorState.previewDevice, { silent: true });
  try {
    editorState.canvasDarkMode = localStorage.getItem('emailEditorCanvasDarkMode') === 'true';
  } catch (_) {}
  loadEditorData();
  applyCanvasDarkModeUI();
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
    const [fragmentsRes, segmentsRes, audiencesRes, assetsRes, placementsRes, decisionsRes, themesRes] = await Promise.all([
      fetchWithTimeout(`${API_BASE}/fragments?type=${encodeURIComponent(fragmentType)}`),
      fetchWithTimeout(`${API_BASE}/segments`),
      fetchWithTimeout(`${API_BASE}/audiences`),
      fetchWithTimeout(`${API_BASE}/assets`),
      fetchWithTimeout(`${API_BASE}/placements`).catch(() => null),
      fetchWithTimeout(`${API_BASE}/decisions`).catch(() => null),
      fetchWithTimeout(`${API_BASE}/email-themes`).catch(() => null)
    ]);
    const fragmentsPayload = await fragmentsRes.json();
    editorState.fragments = fragmentsPayload.fragments || fragmentsPayload || [];
    editorState.segments = (await segmentsRes.json()).segments || [];
    editorState.audiences = (await audiencesRes.json()).audiences || [];
    const assetsPayload = await assetsRes.json();
    editorState.assets = assetsPayload.assets || [];
    if (placementsRes && placementsRes.ok) {
      const p = await placementsRes.json();
      // Sort: email placements first, then by name
      const allPlacements = p.placements || [];
      allPlacements.sort((a, b) => {
        const aEmail = a.channel === 'email' ? 0 : 1;
        const bEmail = b.channel === 'email' ? 0 : 1;
        if (aEmail !== bEmail) return aEmail - bEmail;
        return (a.name || '').localeCompare(b.name || '');
      });
      editorState.offerPlacements = allPlacements;
    }
    if (decisionsRes && decisionsRes.ok) {
      const d = await decisionsRes.json();
      // Only show live decisions in the email editor; drafts/archived are not usable
      const allDecisions = d.decisions || [];
      editorState.offerDecisions = allDecisions.filter(dec => dec.status === 'live');
      editorState._allOfferDecisions = allDecisions; // keep full list for diagnostics
    }
    if (themesRes && themesRes.ok) {
      const themesData = await themesRes.json();
      editorState.themes = themesData.themes || [];
    } else {
      editorState.themes = [];
    }

    if (editorState.templateMode) {
      // Content template editing mode
      const tmplRes = await fetchWithTimeout(`${API_BASE}/email-templates/${editorState.templateId}`);
      const tmpl = await tmplRes.json();
      if (!tmplRes.ok) throw new Error(tmpl.error || 'Failed to load template');
      editorState.template = tmpl;
      editorState.blocks = Array.isArray(tmpl.blocks) ? tmpl.blocks : [];
      refreshFragmentReferences();
      document.getElementById('email-editor-delivery-name').textContent = tmpl.name || 'Content Template';
      setValue('delivery-subject-input', tmpl.subject || '');
      setValue('delivery-preheader-input', '');
      setValue('delivery-document-title-input', '');
      setValue('delivery-document-language-input', '');
      applyTemplateUI();
    } else if (editorState.fragmentMode) {
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
    } else if (editorState.offerRepMode) {
      // Offer representation editing mode
      if (!Number.isNaN(editorState.repId)) {
        // Editing existing representation
        const repsRes = await fetchWithTimeout(`${API_BASE}/offers/${editorState.offerId}/representations`);
        const repsData = await repsRes.json();
        const allReps = repsData.representations || repsData || [];
        const rep = allReps.find(r => r.id === editorState.repId);
        if (!rep) throw new Error('Representation not found');
        editorState.offerRep = rep;
        editorState.blocks = Array.isArray(rep.blocks) ? rep.blocks : [];
      } else {
        // New representation — start with empty blocks
        editorState.offerRep = { offer_id: editorState.offerId, blocks: [] };
        editorState.blocks = [];
      }
      // Load offer name for the header
      try {
        const offerRes = await fetchWithTimeout(`${API_BASE}/offers/${editorState.offerId}`);
        const offerData = await offerRes.json();
        editorState.offerName = offerData.name || 'Offer';
      } catch (_e) { editorState.offerName = 'Offer'; }
      document.getElementById('email-editor-delivery-name').textContent = `Offer: ${editorState.offerName}`;
      setValue('delivery-subject-input', '');
      setValue('delivery-preheader-input', '');
      setValue('delivery-document-title-input', '');
      setValue('delivery-document-language-input', '');
      applyOfferRepUI();
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
        editorState.currentDragType = item.dataset.block || null;
      });
      item.addEventListener('dragend', () => {
        editorState.currentDragType = null;
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
  const themedBadge = fragment?.theme_compatible ? '<span class="fragment-badge-themed" title="Theme-compatible">Themed</span>' : '';
  return `
    <div class="email-fragment-item" draggable="true" data-fragment-id="${fragment?.id || ''}">
      <div class="email-fragment-main">
        <div class="email-fragment-title">${name} ${themedBadge}</div>
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

function escapeHtmlAttr(s) {
  if (s == null || s === '') return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderAssetItem(asset) {
  const name = asset?.name || asset?.filename || 'Asset';
  const typeLabel = asset?.type || 'file';
  const url = asset?.url || asset?.path || '';
  const isImage = typeLabel === 'image' || (asset?.mime_type || '').startsWith('image/');
  const thumb = isImage && url
    ? `<div class="asset-thumb" style="background-image:url('${url.replace(/"/g, '&quot;')}'); background-size: cover; background-position: center;"></div>`
    : `<div class="asset-thumb"><div class="asset-thumb-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg></div></div>`;
  return `
    <div class="asset-card" draggable="true" data-asset-url="${escapeHtmlAttr(url)}" title="Drag onto image or click to copy URL">
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
    { label: 'Social', type: 'social', icon: '⤴' },
    { label: 'Offer decision', type: 'offer', icon: '☆' }
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
    const isStructureDrag = editorState.currentDragType === 'structure';
    if (!isStructureDrag && e.target.closest('.structure-drop, .container-drop')) return;
    e.preventDefault();
    const container = getCanvasContainer();
    if (!container) return;
    const index = getDropIndex(container, e.clientY);
    showDropIndicator(container, index);
  });
  canvas.addEventListener('drop', (e) => {
    const isStructureDrag = editorState.currentDragType === 'structure';
    if (!isStructureDrag && e.target.closest('.structure-drop, .container-drop')) return;
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
  if (!editorState.assetPickerInitialized) {
    editorState.assetPickerInitialized = true;
    const pickerList = document.getElementById('asset-picker-list');
    if (pickerList) {
      pickerList.addEventListener('click', (e) => {
        const card = e.target.closest('.asset-picker-card');
        if (!card) return;
        const url = card.getAttribute('data-asset-url');
        if (url != null) selectAssetForImage(url);
      });
    }
    const uploadZone = document.getElementById('asset-picker-upload-zone');
    const uploadInput = document.getElementById('asset-picker-file-input');
    const uploadBtn = document.getElementById('asset-picker-upload-btn');
    if (uploadBtn && uploadInput) {
      uploadBtn.addEventListener('click', () => uploadInput.click());
      uploadInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) handleAssetPickerUpload(file);
        uploadInput.value = '';
      });
    }
    if (uploadZone) {
      uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); uploadZone.classList.add('drag-over'); });
      uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
      uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.remove('drag-over');
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('image/')) handleAssetPickerUpload(file);
        else if (file) showToast('Please drop an image file', 'error');
      });
    }
    const leftPanel = document.getElementById('email-left-panel');
    if (leftPanel) {
      leftPanel.addEventListener('dragstart', (e) => {
        const card = e.target.closest('.asset-card[data-asset-url]');
        if (!card) return;
        const url = card.getAttribute('data-asset-url');
        if (url) {
          e.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'asset', url: url }));
          e.dataTransfer.effectAllowed = 'copy';
          editorState.currentDragType = 'asset';
        }
      });
      leftPanel.addEventListener('click', (e) => {
        const card = e.target.closest('.asset-card[data-asset-url]');
        if (!card || card.classList.contains('asset-picker-card')) return;
        const url = card.getAttribute('data-asset-url');
        if (url) copyAssetUrlToClipboard(url);
      });
    }
    document.addEventListener('dragend', () => {
      if (editorState.currentDragType === 'asset') editorState.currentDragType = null;
    });
  }
  renderEmailBlocks();
}

function createBlock(type, variant = '') {
  const id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const base = { id, type };
  if (type === 'text') base.content = 'Add your text here';
  if (type === 'image') {
    base.src = '';
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
  if (type === 'offer') {
    base.decisionId = null;
    base.placementId = null;
    base.offerLabel = '';
    base.offerFallbackHtml = '<div style="padding:24px;text-align:center;color:#616E7C;border:1px dashed #CBD2D9;border-radius:6px;">No offer available</div>';
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
  if (editorState.appliedThemeId && !fragment.theme_compatible) {
    showToast('This fragment is not marked as theme-compatible. Styling may not match your email theme.', 'warning');
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

function duplicateEmailBlock(id) {
  const context = findBlockContext(id);
  if (!context) return;
  const clone = JSON.parse(JSON.stringify(context.block));
  clone.id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  clone.name = (clone.name || clone.type) + ' (copy)';
  // Deep-clone nested block ids for structures
  if (clone.columns) {
    clone.columns.forEach(col => {
      (col.blocks || []).forEach(b => {
        b.id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      });
    });
  }
  const idx = context.container.indexOf(context.block);
  context.container.splice(idx + 1, 0, clone);
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
  const viewportBg = editorState.canvasDarkMode ? '#1a1a2e' : (bodyStyle.viewportColor || '#f0f0f0');
  actualCanvas.style.background = viewportBg;
  simulatedCanvas.style.background = viewportBg;
  if (canvasShell) canvasShell.classList.toggle('canvas-dark-mode', editorState.canvasDarkMode);
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
  const rawSimulatedHtml = generateEmailHtml(editorState.blocks);
  const personalizedHtml = _editorMergePersonalization(rawSimulatedHtml);
  const tp = editorState.previewTestProfile;
  const previewLabel = tp
    ? `Preview — ${tp.first_name || ''} ${tp.last_name || ''}`
    : 'Preview (simulated)';
  simulatedCanvas.innerHTML = `
    <div class="email-live-preview">
      <div class="email-live-preview-header">${previewLabel}</div>
      <div class="email-live-preview-body">${personalizedHtml}</div>
    </div>
  `;
  _resolveOfferBlocksInPreview(simulatedCanvas, tp);
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
    if (block.type === 'offer') {
      return renderBlockHtml(block);
    }
    if (block.type === 'fragment') {
      return renderFragmentHtml(block);
    }
    if (block.type === 'form') {
      return renderBlockHtml(block);
    }
    if (block.type === 'embed') {
      return renderBlockHtml(block);
    }
    return renderBlockHtml(block);
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
  if (block.type === 'offer') {
    const decision = block.decisionId ? editorState.offerDecisions.find(d => d.id === block.decisionId) : null;
    const placement = block.placementId ? editorState.offerPlacements.find(p => p.id === block.placementId) : null;
    const decisionName = decision ? decision.name : 'Not selected';
    const placementName = placement ? placement.name : 'Not selected';
    const channelBadge = placement ? `<span class="offer-block-badge">${(placement.channel || '').toUpperCase()}</span>` : '';
    if (!block.decisionId || !block.placementId) {
      return `
        <div class="email-block-preview offer-decision-preview offer-unconfigured">
          <div class="offer-block-icon-lg">&#9734;</div>
          <div class="offer-block-title">Offer Decision</div>
          <div class="offer-block-subtitle">Select a decision and placement in the settings panel to configure this block.</div>
        </div>`;
    }
    return `
      <div class="email-block-preview offer-decision-preview">
        <div class="offer-block-header">
          <span class="offer-block-icon">&#9734;</span> Offer Decision ${channelBadge}
        </div>
        <div class="offer-block-config">
          <div><strong>Decision:</strong> ${decisionName}</div>
          <div><strong>Placement:</strong> ${placementName}</div>
          <div class="offer-block-hint">Offers will be resolved per-contact at send time.</div>
        </div>
      </div>`;
  }
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
    const displaySrc = block.src || _PLACEHOLDER_IMAGE;
    const displayAlt = block.alt || 'Image';
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
  if (block.type === 'offer') {
    if (block.decisionId && block.placementId) {
      return `<!-- OFFER_BLOCK:decision=${block.decisionId}&placement=${block.placementId} -->${block.offerFallbackHtml || ''}<!-- /OFFER_BLOCK -->`;
    }
    return block.offerFallbackHtml || '';
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
    zone.addEventListener('dragenter', () => {
      if (editorState.currentDragType !== 'structure') zone.classList.add('drop-active');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('drop-active'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove('drop-active');
      const raw = e.dataTransfer.getData('text/plain');
      if (!raw) return;
      const payload = parseDragPayload(e);
      if (!payload) return;
      if (payload.kind === 'new' && payload.type === 'structure') {
        // Structures cannot nest inside other structures, so drop it
        // before or after the parent structure on the main canvas instead
        const structureId = zone.dataset.structureId;
        const context = findBlockContext(structureId);
        if (context) {
          const parentBlock = document.querySelector(`.email-block[data-block-id="${structureId}"]`);
          const idx = context.container.indexOf(context.block);
          let insertIdx = idx + 1;
          if (parentBlock) {
            const rect = parentBlock.getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2) insertIdx = idx;
          }
          clearDropIndicator();
          handleDropToContainer(context.container, insertIdx, payload);
        }
        return;
      }
      const structureId = zone.dataset.structureId;
      const columnIndex = parseInt(zone.dataset.columnIndex, 10);
      const container = getStructureColumnContainer(structureId, columnIndex);
      if (!container) return;
      const index = getDropIndex(zone, e.clientY);
      clearDropIndicator();
      handleDropToContainer(container, index, payload);
    });
    zone.addEventListener('dragover', (e) => {
      if (editorState.currentDragType === 'structure') return;
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

function renderAssetPickerList(assets) {
  if (!assets.length) return '<div>No assets found.</div>';
  const imageAssets = assets.filter(a => (a.type || a.mime_type || '').toLowerCase().startsWith('image') || (a.mime_type || '').startsWith('image/'));
  const listToShow = imageAssets.length ? imageAssets : assets;
  return listToShow.map(asset => {
    const url = asset.url || asset.path || '';
    const safeUrl = escapeHtmlAttr(url);
    return `
      <div class="asset-card asset-picker-card" data-asset-url="${safeUrl}">
        <div class="asset-thumb" style="background-image:url('${url.replace(/'/g, '&#39;')}'); background-size: cover;"></div>
        <div class="asset-title">${(asset.name || asset.filename || 'Asset').replace(/</g, '&lt;')}</div>
      </div>
    `;
  }).join('');
}

async function refreshAssetPickerList() {
  const list = document.getElementById('asset-picker-list');
  if (!list) return;
  try {
    const response = await fetch(`${API_BASE}/assets`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load assets');
    list.innerHTML = renderAssetPickerList(data.assets || []);
  } catch (error) {
    list.innerHTML = `<div>${error.message}</div>`;
  }
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
    list.innerHTML = renderAssetPickerList(data.assets || []);
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

async function handleAssetPickerUpload(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file', 'error');
    return;
  }
  const form = new FormData();
  form.append('file', file);
  try {
    showToast('Uploading…', 'info');
    const res = await fetch(`${API_BASE}/assets`, { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    const url = data.url || data.path || (data.filename ? `/uploads/${data.filename}` : '');
    if (url && editorState.pendingImageBlockId) {
      selectAssetForImage(url);
      showToast('Image uploaded and applied', 'success');
    } else if (url) {
      showToast('Image uploaded', 'success');
      refreshAssetPickerList();
    }
  } catch (err) {
    showToast(err.message || 'Upload failed', 'error');
  }
}

function selectAssetForImage(url) {
  const context = findBlockContext(editorState.pendingImageBlockId);
  if (!context?.block || context.block.type !== 'image') return;
  context.block.src = url;
  renderEmailBlocks();
  closeAssetPicker();
}

async function uploadImageForBlock(blockId) {
  const context = findBlockContext(blockId);
  if (!context?.block || context.block.type !== 'image') return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = false;
  input.onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    const form = new FormData();
    form.append('file', file);
    try {
      showToast('Uploading…', 'info');
      const res = await fetch(`${API_BASE}/assets`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      const url = data.url || data.path || (data.filename ? `/uploads/${data.filename}` : '');
      if (url) {
        context.block.src = url;
        renderEmailBlocks();
        pushHistory();
        showToast('Image uploaded', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Upload failed', 'error');
    }
    input.remove();
  };
  input.click();
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

// Inline SVG placeholder encoded as a data URI — always renders, no external dependency
const _PLACEHOLDER_IMAGE = (() => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <rect fill="#f3f4f6" width="640" height="360"/>
    <g fill="#9ca3af">
      <rect x="280" y="130" width="80" height="60" rx="6"/>
      <circle cx="300" cy="148" r="8" fill="#d1d5db"/>
      <polygon points="285,185 320,155 355,185" fill="#d1d5db"/>
      <polygon points="310,185 335,165 360,185" fill="#e5e7eb"/>
      <text x="320" y="215" font-family="Arial,sans-serif" font-size="14" text-anchor="middle" fill="#9ca3af">Image placeholder</text>
    </g>
  </svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
})();

function getSimulatedImage(value) {
  if (value) return value;
  return editorState.simulateContent ? _PLACEHOLDER_IMAGE : value;
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
  if (editorState.templateMode) {
    await saveTemplateContent();
    return;
  }
  if (editorState.fragmentMode) {
    await saveFragmentContent();
    return;
  }
  if (editorState.landingPageMode) {
    await saveLandingPageContent();
    return;
  }
  if (editorState.offerRepMode) {
    await saveOfferRepContent();
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

async function saveTemplateContent() {
  if (!editorState.template) return;
  const payload = {
    name: editorState.template.name,
    subject: getValue('delivery-subject-input'),
    blocks: editorState.blocks,
    html: editorState.htmlOverride || generateEmailHtml(editorState.blocks),
    status: editorState.template.status || 'draft'
  };
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/email-templates/${editorState.templateId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save template');
    editorState.template = data;
    showToast('Template saved', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function applyTemplateUI() {
  // Hide delivery-specific fields, show template label
  const preheaderGroup = document.getElementById('delivery-preheader-input')?.closest('.form-group');
  if (preheaderGroup) preheaderGroup.style.display = 'none';
  const docTitleGroup = document.getElementById('delivery-document-title-input')?.closest('.form-group');
  if (docTitleGroup) docTitleGroup.style.display = 'none';
  const docLangGroup = document.getElementById('delivery-document-language-input')?.closest('.form-group');
  if (docLangGroup) docLangGroup.style.display = 'none';
  const fragmentSettings = document.getElementById('fragment-settings');
  if (fragmentSettings) fragmentSettings.classList.add('hidden');

  // Update the page title
  const delivName = document.getElementById('email-editor-delivery-name');
  if (delivName) {
    delivName.contentEditable = 'true';
    delivName.addEventListener('blur', () => {
      if (editorState.template) {
        editorState.template.name = delivName.textContent.trim() || editorState.template.name;
      }
    });
  }

  // Add a "Publish" button to the toolbar if not already present
  const toolbar = document.querySelector('.email-editor-actions');
  if (toolbar && !document.getElementById('ct-publish-btn')) {
    const pubBtn = document.createElement('button');
    pubBtn.id = 'ct-publish-btn';
    pubBtn.className = 'btn btn-primary btn-sm';
    pubBtn.style.marginRight = '8px';
    pubBtn.innerHTML = editorState.template?.status === 'published' ? 'Published' : 'Publish';
    pubBtn.onclick = async () => {
      try {
        const resp = await fetch(`${API_BASE}/email-templates/${editorState.templateId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'published',
            blocks: editorState.blocks,
            html: editorState.htmlOverride || generateEmailHtml(editorState.blocks),
            subject: getValue('delivery-subject-input')
          })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Failed to publish');
        editorState.template = data;
        pubBtn.textContent = 'Published';
        showToast('Template published!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
    const saveBtn = toolbar.querySelector('button');
    if (saveBtn) toolbar.insertBefore(pubBtn, saveBtn);
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
      html: editorState.htmlOverride || generateEmailHtml(editorState.blocks),
      theme_compatible: document.getElementById('fragment-theme-compatible') ? document.getElementById('fragment-theme-compatible').checked : !!editorState.fragment?.theme_compatible
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
  const fragmentSettings = document.getElementById('fragment-settings');
  if (deliverySettings) deliverySettings.classList.toggle('hidden', isLanding);
  if (landingSettings) landingSettings.classList.toggle('hidden', !isLanding);
  if (fragmentSettings) fragmentSettings.classList.add('hidden');
  const title = document.querySelector('.email-editor-title span');
  const backBtn = document.querySelector('.email-editor-toolbar .btn-back.preview-keep');
  if (title) title.textContent = isLanding ? 'Landing Page Designer' : 'Email Designer';
  if (backBtn) backBtn.title = isLanding ? 'Back to Landing Pages' : 'Back to Delivery';
}

// ── Offer Representation Mode ──

async function saveOfferRepContent() {
  try {
    showLoading();
    const htmlOutput = editorState.htmlOverride || generateEmailHtml(editorState.blocks);
    const payload = {
      content: htmlOutput,
      blocks: editorState.blocks
    };

    if (!Number.isNaN(editorState.repId) && editorState.repId) {
      // Update existing representation
      const response = await fetch(`${API_BASE}/offers/${editorState.offerId}/representations/${editorState.repId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save representation');
      editorState.offerRep = data;
      showToast('Representation content saved', 'success');
    } else {
      showToast('Content ready — close to continue', 'success');
    }
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function applyOfferRepUI() {
  const deliverySettings = document.getElementById('email-delivery-settings');
  const landingSettings = document.getElementById('landing-page-settings');
  const title = document.querySelector('.email-editor-title span');
  const backBtn = document.querySelector('.email-editor-toolbar .btn-back.preview-keep');
  if (deliverySettings) deliverySettings.classList.add('hidden');
  if (landingSettings) landingSettings.classList.add('hidden');
  if (title) title.textContent = 'Offer Content Designer';
  if (backBtn) backBtn.title = 'Back to Offer';
  // Hide the simulate content button since offers don't have delivery-level simulation
  const simulateBtn = document.getElementById('simulate-content-btn');
  if (simulateBtn) simulateBtn.style.display = 'none';
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
  const fragmentSettings = document.getElementById('fragment-settings');
  if (deliverySettings) deliverySettings.classList.add('hidden');
  if (landingSettings) landingSettings.classList.add('hidden');
  if (fragmentSettings) fragmentSettings.classList.remove('hidden');
  const cb = document.getElementById('fragment-theme-compatible');
  if (cb) cb.checked = !!editorState.fragment?.theme_compatible;
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
  try {
    showLoading();

    // Try client-side JSZip first, fall back to server-side
    if (window.JSZip) {
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
      showToast('Zip loaded. HTML and ' + Object.keys(assets).length + ' images extracted.', 'success');
    } else {
      // Server-side fallback
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch(`${API_BASE}/email-templates/import-html`, {
        method: 'POST',
        body: formData
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Server failed to process zip');
      editorState.importAssets = data.assets || {};
      textarea.value = data.html || '';
      showToast(`Zip processed. HTML extracted with ${data.asset_count || 0} images.`, 'success');
    }
  } catch (error) {
    // Last resort: try server-side if client-side failed for a non-JSZip reason
    if (window.JSZip && error.message !== 'No HTML file found in the zip.') {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const resp = await fetch(`${API_BASE}/email-templates/import-html`, {
          method: 'POST',
          body: formData
        });
        const data = await resp.json();
        if (resp.ok) {
          editorState.importAssets = data.assets || {};
          textarea.value = data.html || '';
          showToast(`Zip processed via server. ${data.asset_count || 0} images extracted.`, 'success');
          return;
        }
      } catch (e) { /* fall through to error toast */ }
    }
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

let _designPickerTemplates = [];
let _designPickerTab = 'sample'; // 'sample' | 'saved'
let _designPickerSearch = '';

async function openDesignPicker() {
  const modal = document.getElementById('email-design-modal');
  const list = document.getElementById('email-template-list');
  if (!modal || !list) return;
  modal.classList.remove('hidden');
  list.innerHTML = '<div style="padding:24px;text-align:center;color:#9ca3af;">Loading templates...</div>';
  try {
    const response = await fetch(`${API_BASE}/email-templates`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load templates');
    _designPickerTemplates = data.templates || [];
    _designPickerTab = 'sample';
    _designPickerSearch = '';
    _renderDesignPickerList();
  } catch (error) {
    list.innerHTML = `<div style="padding:24px;color:#ef4444;">${error.message}</div>`;
  }
}

function _renderDesignPickerList() {
  const list = document.getElementById('email-template-list');
  if (!list) return;

  let templates = _designPickerTemplates;
  if (_designPickerTab === 'sample') templates = templates.filter(t => t.sample);
  else templates = templates.filter(t => !t.sample);

  if (_designPickerSearch) {
    const q = _designPickerSearch.toLowerCase();
    templates = templates.filter(t =>
      (t.name || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q)
    );
  }

  const catColors = { onboarding: '#2563EB', promotional: '#DC2626', newsletter: '#7C3AED', transactional: '#059669', event: '#D97706', retention: '#0891B2', custom: '#6B7280' };
  const catLabels = { onboarding: 'Onboarding', promotional: 'Promotional', newsletter: 'Newsletter', transactional: 'Transactional', event: 'Event', retention: 'Retention', custom: 'Custom' };

  const sampleCount = _designPickerTemplates.filter(t => t.sample).length;
  const savedCount = _designPickerTemplates.filter(t => !t.sample).length;

  const tabs = `
    <div class="dp-tabs">
      <button class="dp-tab ${_designPickerTab === 'sample' ? 'active' : ''}" onclick="_designPickerTab='sample';_renderDesignPickerList()">Sample templates <span class="dp-tab-count">${sampleCount}</span></button>
      <button class="dp-tab ${_designPickerTab === 'saved' ? 'active' : ''}" onclick="_designPickerTab='saved';_renderDesignPickerList()">Saved templates <span class="dp-tab-count">${savedCount}</span></button>
    </div>
    <div style="padding:8px 16px;">
      <input type="text" class="form-input" placeholder="Search templates..." value="${_designPickerSearch}" oninput="_designPickerSearch=this.value;_renderDesignPickerList()" style="font-size:13px;">
    </div>
  `;

  let body;
  if (!templates.length) {
    body = `<div style="padding:48px;text-align:center;color:#9ca3af;">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
      <p style="margin-top:12px;">${_designPickerTab === 'saved' ? 'No saved templates yet. Save a design as template from the editor.' : 'No sample templates available.'}</p>
    </div>`;
  } else {
    body = `<div class="dp-grid">${templates.map(t => {
      const color = catColors[t.category] || '#6B7280';
      const label = catLabels[t.category] || t.category || 'Custom';
      const previewHtml = t.html
        ? `<iframe class="dp-card-iframe" scrolling="no" sandbox="allow-same-origin" data-html="${encodeURIComponent(t.html)}"></iframe>`
        : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;
      return `
        <div class="dp-card" onclick="applyTemplateFromPicker(${t.id})">
          <div class="dp-card-preview">${previewHtml}</div>
          <div class="dp-card-body">
            <span class="dp-card-cat" style="color:${color};">${label}</span>
            <div class="dp-card-name">${t.name || 'Untitled'}</div>
            <div class="dp-card-desc">${t.description || ''}</div>
          </div>
          <div class="dp-card-foot">
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();applyTemplateFromPicker(${t.id})">Use this template</button>
          </div>
        </div>
      `;
    }).join('')}</div>`;
  }

  list.innerHTML = tabs + body;

  // Populate iframe previews
  requestAnimationFrame(() => {
    list.querySelectorAll('.dp-card-iframe').forEach(iframe => {
      const html = decodeURIComponent(iframe.dataset.html || '');
      if (!html) return;
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(`<!DOCTYPE html><html><head><style>body{margin:0;padding:0;overflow:hidden;pointer-events:none;transform-origin:top left;transform:scale(0.3);width:333%;font-family:Arial,sans-serif;}</style></head><body>${html}</body></html>`);
        doc.close();
      } catch (e) { /* cross-origin safety */ }
    });
  });
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
  // Show a modal to collect template name, description, and category
  const overlay = document.createElement('div');
  overlay.className = 'email-modal';
  overlay.id = 'save-template-modal';
  overlay.style.zIndex = '10001';
  overlay.innerHTML = `
    <div class="email-modal-content" style="max-width:440px;">
      <div class="email-modal-header">
        <h3>Save as content template</h3>
        <button class="email-modal-close" onclick="document.getElementById('save-template-modal').remove()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      <div class="email-modal-body" style="padding:16px 20px;">
        <div class="form-group">
          <label class="form-label form-label-required">Template name</label>
          <input class="form-input" id="save-tmpl-name" placeholder="e.g. Welcome Email v2">
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input class="form-input" id="save-tmpl-desc" placeholder="Brief description">
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-input" id="save-tmpl-cat">
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
      <div class="email-modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('save-template-modal').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="_doSaveAsTemplate()">Save template</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('save-tmpl-name').focus();
}

async function _doSaveAsTemplate() {
  const name = document.getElementById('save-tmpl-name')?.value?.trim();
  if (!name) { showToast('Please enter a template name', 'warning'); return; }
  const description = document.getElementById('save-tmpl-desc')?.value?.trim() || '';
  const category = document.getElementById('save-tmpl-cat')?.value || 'custom';

  const payload = {
    name,
    description,
    category,
    subject: getValue('delivery-subject-input'),
    blocks: editorState.blocks,
    html: generateEmailHtml(editorState.blocks),
    status: 'published'
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
    document.getElementById('save-template-modal')?.remove();
    showToast(`Template "${name}" saved!`, 'success');
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
  document.querySelectorAll('.email-block').forEach(blockEl => {
    const id = blockEl.dataset.blockId;
    if (!id) return;
    blockEl.setAttribute('draggable', 'true');
    blockEl.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'move', blockId: id }));
      e.dataTransfer.effectAllowed = 'move';
      blockEl.classList.add('dragging');
    });
    blockEl.addEventListener('dragend', () => {
      blockEl.classList.remove('dragging');
      blockEl.classList.remove('image-drop-over');
      clearDropIndicator();
    });
    blockEl.addEventListener('dragover', (e) => {
      const isAssetDrag = editorState.currentDragType === 'asset';
      const ctx = findBlockContext(id);
      const isImageBlock = ctx?.block?.type === 'image';
      if (isAssetDrag && isImageBlock) {
        e.preventDefault();
        e.stopPropagation();
        blockEl.classList.add('image-drop-over');
        e.dataTransfer.dropEffect = 'copy';
        return;
      }
      blockEl.classList.remove('image-drop-over');
      const isStructureDrag = editorState.currentDragType === 'structure';
      if (!isStructureDrag && e.target.closest('.structure-drop, .container-drop')) return;
      e.preventDefault();
      const rect = blockEl.getBoundingClientRect();
      const before = e.clientY < rect.top + rect.height / 2;
      showDropIndicator(blockEl.parentElement, before ? getBlockIndex(blockEl) : getBlockIndex(blockEl) + 1);
    });
    blockEl.addEventListener('dragleave', () => {
      blockEl.classList.remove('image-drop-over');
    });
    blockEl.addEventListener('drop', (e) => {
      const payload = parseDragPayload(e);
      clearDropIndicator();
      blockEl.classList.remove('image-drop-over');
      if (payload?.kind === 'asset') {
        const ctx = findBlockContext(id);
        if (ctx?.block?.type === 'image') {
          e.preventDefault();
          e.stopPropagation();
          ctx.block.src = payload.url || '';
          renderEmailBlocks();
          pushHistory();
          editorState.currentDragType = null;
          return;
        }
      }
      const isStructureDrag = editorState.currentDragType === 'structure';
      if (!isStructureDrag && e.target.closest('.structure-drop, .container-drop')) return;
      e.preventDefault();
      const container = blockEl.parentElement;
      const rect = blockEl.getBoundingClientRect();
      const before = e.clientY < rect.top + rect.height / 2;
      const index = before ? getBlockIndex(blockEl) : getBlockIndex(blockEl) + 1;
      if (payload) {
        const targetContainer = resolveCanvasContainerFromElement(container) || editorState.blocks;
        handleDropToContainer(targetContainer, index, payload);
      }
    });
  });
}

function getBlockIndex(blockEl) {
  const parent = blockEl.parentElement;
  if (!parent) return 0;
  const siblings = Array.from(parent.children).filter(c => c.classList.contains('email-block'));
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
    if (parsed?.kind === 'asset' && parsed?.url) return { kind: 'asset', url: parsed.url };
    if (parsed?.type) return { kind: 'new', type: parsed.type, variant: parsed.variant || '' };
    return null;
  } catch (error) {
    return { kind: 'new', type: raw, variant: '' };
  }
}

function getTopLevelBlocks(containerEl) {
  if (!containerEl) return [];
  return Array.from(containerEl.children).filter(el => el.classList.contains('email-block'));
}

function getDropIndex(containerEl, clientY) {
  const blocks = getTopLevelBlocks(containerEl);
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
  const blocks = getTopLevelBlocks(containerEl);
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
  if (payload.kind === 'asset') {
    editorState.currentDragType = null;
    const block = createBlock('image', '');
    block.src = payload.url || '';
    block.alt = 'Image';
    container.splice(Math.max(0, Math.min(index, container.length)), 0, block);
    editorState.selectedBlockId = block.id;
    renderEmailBlocks();
    pushHistory();
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
    const key = btn.dataset.editorTab || btn.textContent.toLowerCase().replace(/\s+/g, '-');
    btn.classList.toggle('active', key === tab);
  });
  if (typeof updateThemeRailState === 'function') updateThemeRailState();
}

function extractBodyTextFromBlocks(blocks) {
  if (!Array.isArray(blocks)) return '';
  return blocks.map(block => {
    if (block.type === 'text') return (block.content || '').replace(/\n/g, ' ');
    if (block.type === 'button') return block.text || '';
    if (block.type === 'structure' && block.columns) {
      return block.columns.map(col => extractBodyTextFromBlocks(col.blocks || [])).join(' ');
    }
    if (block.type === 'container' && block.columns?.[0]?.blocks) {
      return extractBodyTextFromBlocks(block.columns[0].blocks);
    }
    return '';
  }).filter(Boolean).join(' ');
}

async function renderBrandAlignmentPanel() {
  const panel = document.getElementById('email-brand-alignment-content');
  if (!panel) return;
  if (!editorState.brands || editorState.brands.length === 0) {
    try {
      const res = await fetch(`${API_BASE}/brands`);
      const data = await res.json();
      editorState.brands = data.brands || [];
    } catch (_) {
      editorState.brands = [];
    }
  }
  const brands = editorState.brands || [];
  const result = editorState.brandAlignmentResult;
  const brandOptions = brands.map(b => `<option value="${b.id}">${(b.name || 'Brand').replace(/</g, '&lt;')}</option>`).join('');
  let resultHtml = '';
  if (result) {
    const scoreColor = result.overallScore >= 80 ? '#059669' : result.overallScore >= 60 ? '#D97706' : '#DC2626';
    const section = (label, data) => {
      if (!data || !data.items || !data.items.length) return '';
      const items = data.items.map(item => {
        const statusClass = item.status === 'fail' ? 'fail' : item.status === 'warning' ? 'warning' : 'pass';
        return `<div class="brand-alignment-item brand-alignment-${statusClass}">
          <div class="brand-alignment-item-title">${(item.guideline || item.category || '').replace(/</g, '&lt;')} <span class="brand-alignment-status">${item.status || ''}</span></div>
          <div class="brand-alignment-item-feedback">${(item.feedback || '').replace(/</g, '&lt;')}</div>
        </div>`;
      }).join('');
      return `<details class="inspector-section brand-alignment-details" open><summary>${label} (${data.score != null ? data.score + '%' : '—'})</summary><div class="brand-alignment-section-items">${items}</div></details>`;
    };
    resultHtml = `
      <div class="brand-alignment-score-card" style="--score-color:${scoreColor}">
        <div class="brand-alignment-score-label">Overall brand alignment</div>
        <div class="brand-alignment-score-value">${result.overallScore != null ? result.overallScore : '—'}%</div>
        ${result.brandName ? `<div class="brand-alignment-score-brand">vs. ${(result.brandName || '').replace(/</g, '&lt;')}</div>` : ''}
      </div>
      ${section('Writing style', result.writingStyle)}
      ${section('Visual content', result.visualContent)}
      ${section('Overall quality', result.overallQuality)}
      <button type="button" class="btn btn-secondary brand-alignment-reeval-btn" onclick="evaluateBrandAlignment();">Re-evaluate score</button>
    `;
  } else {
    resultHtml = '<p class="brand-alignment-empty-copy">Select a brand and click Evaluate score to check your content against brand guidelines.</p>';
  }
  panel.innerHTML = `
    <div class="form-group">
      <label class="form-label">Brand</label>
      <select class="form-input" id="brand-alignment-brand-select">
        <option value="">— Select brand —</option>
        ${brandOptions}
      </select>
    </div>
    <div class="form-group">
      <button type="button" class="btn btn-primary" id="brand-alignment-evaluate-btn" onclick="evaluateBrandAlignment()">Evaluate score</button>
    </div>
    <div id="brand-alignment-result">${resultHtml}</div>
  `;
}

async function evaluateBrandAlignment() {
  const select = document.getElementById('brand-alignment-brand-select');
  const brandId = select && select.value ? select.value : null;
  if (!brandId) {
    showToast('Select a brand first', 'info');
    return;
  }
  const subject = getValue('delivery-subject-input') || '';
  const preheader = getValue('delivery-preheader-input') || '';
  const bodyText = extractBodyTextFromBlocks(editorState.blocks || []);
  const btn = document.getElementById('brand-alignment-evaluate-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Evaluating…'; }
  try {
    const res = await fetch(`${API_BASE}/ai/brand-alignment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId: parseInt(brandId, 10), subject, preheader, bodyText })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Evaluation failed');
    editorState.brandAlignmentResult = data;
    renderBrandAlignmentPanel();
  } catch (e) {
    showToast(e.message || 'Brand alignment evaluation failed', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Evaluate score'; }
  }
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

function applyCanvasDarkModeUI() {
  const toggle = document.getElementById('canvas-dark-mode-toggle');
  const shell = document.getElementById('email-designer-canvas');
  const center = document.getElementById('email-editor-center');
  if (toggle) toggle.setAttribute('aria-checked', editorState.canvasDarkMode ? 'true' : 'false');
  if (shell) shell.classList.toggle('canvas-dark-mode', editorState.canvasDarkMode);
  if (center) center.classList.toggle('canvas-dark-mode', editorState.canvasDarkMode);
  const actual = document.getElementById('email-designer-actual');
  const simulated = document.getElementById('email-designer-simulated');
  const bodyStyle = editorState.bodyStyle || {};
  const viewportBg = editorState.canvasDarkMode ? '#1a1a2e' : (bodyStyle.viewportColor || '#f0f0f0');
  if (actual) actual.style.background = viewportBg;
  if (simulated) simulated.style.background = viewportBg;
}

function toggleCanvasDarkMode() {
  editorState.canvasDarkMode = !editorState.canvasDarkMode;
  try {
    localStorage.setItem('emailEditorCanvasDarkMode', editorState.canvasDarkMode ? 'true' : 'false');
  } catch (_) {}
  applyCanvasDarkModeUI();
}

function togglePreviewMode() {
  editorState.previewMode = !editorState.previewMode;
  const root = document.getElementById('email-editor-page');
  const btn = document.getElementById('toggle-preview-btn');
  if (root) root.classList.toggle('preview-mode', editorState.previewMode);
  if (btn) btn.textContent = editorState.previewMode ? 'Exit preview' : 'Preview';
  if (editorState.previewMode) {
    hideInlineToolbar();
    // Switch to simulated (rendered HTML) view for a clean preview
    switchPreviewTab('simulated');
    renderPreviewTestProfilePanel();
    renderEmailBlocks(); // Ensure the simulated canvas is up to date
  } else {
    // Switch back to the design (actual) view when exiting preview
    switchPreviewTab('actual');
    // Restore the left panel to its previous mode
    renderLeftPanel(editorState.activeMode);
  }
}

// ── Preview Test Profile Panel ──────────────────────────────────
function renderPreviewTestProfilePanel() {
  const panel = document.getElementById('email-left-panel');
  if (!panel) return;
  const tp = editorState.previewTestProfile;
  const selectedHtml = tp
    ? `<div class="preview-tp-selected">
         <div class="preview-tp-selected-info">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
           <div>
             <div class="preview-tp-name">${tp.first_name || ''} ${tp.last_name || ''}</div>
             <div class="preview-tp-email">${tp.email || ''}</div>
           </div>
         </div>
         <button class="preview-tp-clear" onclick="clearPreviewTestProfile()" title="Clear profile">&times;</button>
       </div>`
    : '';

  const fieldPreview = tp ? `
    <div class="preview-tp-fields">
      <div class="preview-tp-fields-title">Profile data</div>
      ${_renderProfileFields(tp)}
    </div>` : '';

  panel.innerHTML = `
    <div class="preview-tp-panel">
      <div class="preview-tp-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>Test Profile</span>
      </div>
      <p class="preview-tp-hint">Select a contact to preview personalization tokens with real data.</p>
      ${selectedHtml}
      ${!tp ? `
        <div class="preview-tp-search-wrap">
          <input type="text" class="form-input preview-tp-search" placeholder="Search by name or email..."
                 oninput="searchPreviewTestProfile(this.value)" id="preview-tp-search-input">
          <div class="preview-tp-results" id="preview-tp-results"></div>
        </div>` : ''}
      ${fieldPreview}
    </div>
  `;
}

function _renderProfileFields(profile) {
  const displayFields = [
    ['first_name', 'First name'],
    ['last_name', 'Last name'],
    ['email', 'Email'],
    ['phone', 'Phone'],
    ['city', 'City'],
    ['state', 'State'],
    ['country', 'Country'],
    ['gender', 'Gender'],
    ['loyalty_tier', 'Loyalty tier'],
    ['language', 'Language'],
    ['source', 'Source']
  ];
  return displayFields
    .filter(([key]) => profile[key])
    .map(([key, label]) => `
      <div class="preview-tp-field">
        <span class="preview-tp-field-label">${label}</span>
        <span class="preview-tp-field-value">${profile[key]}</span>
      </div>`)
    .join('');
}

let _previewTpDebounce = null;
function searchPreviewTestProfile(query) {
  clearTimeout(_previewTpDebounce);
  if (!query || query.length < 2) {
    editorState.previewTestProfileResults = [];
    _renderPreviewTpResults();
    return;
  }
  _previewTpDebounce = setTimeout(async () => {
    try {
      const resp = await fetch(`${API_BASE}/contacts?search=${encodeURIComponent(query)}&limit=10`);
      const data = await resp.json();
      editorState.previewTestProfileResults = data.contacts || data || [];
      _renderPreviewTpResults();
    } catch (e) {
      editorState.previewTestProfileResults = [];
      _renderPreviewTpResults();
    }
  }, 300);
}

function _renderPreviewTpResults() {
  const list = document.getElementById('preview-tp-results');
  if (!list) return;
  const results = editorState.previewTestProfileResults;
  if (!results.length) {
    list.innerHTML = '';
    list.classList.remove('open');
    return;
  }
  list.innerHTML = results.map(c => `
    <div class="preview-tp-result-item" onclick="selectPreviewTestProfile(${c.id})">
      <span class="preview-tp-result-name">${c.first_name || ''} ${c.last_name || ''}</span>
      <span class="preview-tp-result-email">${c.email || ''}</span>
    </div>
  `).join('');
  list.classList.add('open');
}

function selectPreviewTestProfile(contactId) {
  const contact = editorState.previewTestProfileResults.find(c => c.id === contactId);
  if (!contact) return;
  editorState.previewTestProfile = contact;
  editorState.previewTestProfileResults = [];
  renderPreviewTestProfilePanel();
  renderEmailBlocks(); // Re-render with personalization
}

function clearPreviewTestProfile() {
  editorState.previewTestProfile = null;
  editorState.previewTestProfileResults = [];
  renderPreviewTestProfilePanel();
  renderEmailBlocks(); // Re-render without personalization
}

// Client-side merge of personalization tokens for the email editor preview
function _editorMergePersonalization(html) {
  const tp = editorState.previewTestProfile;
  if (!tp || !html) return html;
  return html.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, entity, field) => {
    if (tp[field] !== undefined && tp[field] !== null) return String(tp[field]);
    return match;
  });
}

// Resolve offer block markers in the simulated preview canvas via decision engine
let _offerResolveVersion = 0;
async function _resolveOfferBlocksInPreview(canvas, testProfile) {
  const body = canvas.querySelector('.email-live-preview-body');
  if (!body) return;
  const html = body.innerHTML;
  const offerPattern = /<!-- OFFER_BLOCK:decision=(\d+)&placement=(\d+) -->([\s\S]*?)<!-- \/OFFER_BLOCK -->/g;
  const matches = [...html.matchAll(offerPattern)];
  if (!matches.length) return;

  const contactId = testProfile ? testProfile.id : null;
  const version = ++_offerResolveVersion;

  // Build diagnostic overlay HTML for a failed/empty resolution
  function buildDiagnosticHtml(reason, details) {
    return `<div style="border:2px dashed #e0e0e0;border-radius:8px;padding:16px 20px;margin:8px 0;background:#fafafa;text-align:center">
      <div style="font-size:13px;color:#616161;font-weight:600;margin-bottom:4px">${reason}</div>
      <div style="font-size:11px;color:#9e9e9e;line-height:1.4">${details}</div>
    </div>`;
  }

  const decisionIds = [...new Set(matches.map(m => parseInt(m[1])))];
  const results = {};
  const errors = {};
  await Promise.all(decisionIds.map(async (decId) => {
    try {
      if (!contactId) {
        errors[decId] = 'no_profile';
        return;
      }
      const payload = { context: {}, contact_id: contactId };
      const resp = await fetchWithTimeout(`${API_BASE}/decisions/${decId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        results[decId] = await resp.json();
      } else {
        const errBody = await resp.json().catch(() => ({}));
        errors[decId] = errBody.error || `HTTP ${resp.status}`;
      }
    } catch (e) {
      errors[decId] = e.message || 'Network error';
    }
  }));

  if (_offerResolveVersion !== version) return;

  let resolvedHtml = html;
  for (const match of matches) {
    const [fullMatch, decIdStr, plIdStr, fallback] = match;
    const decId = parseInt(decIdStr);
    const plId = parseInt(plIdStr);
    const simData = results[decId];
    let replacement = null;

    if (errors[decId] === 'no_profile') {
      replacement = buildDiagnosticHtml(
        'Select a test profile to preview offers',
        'Use the "Test profile" dropdown above to choose a contact. Offers are personalized per-contact.'
      );
    } else if (errors[decId]) {
      replacement = buildDiagnosticHtml(
        'Offer resolution failed',
        `Error: ${errors[decId]}<br>Check the readiness panel in the offer block settings.`
      );
    } else if (simData) {
      const placementResult = (simData.placements || []).find(p => p.placement_id === plId);
      if (placementResult?.offers?.length) {
        const topOffer = placementResult.offers[0];
        if (topOffer.content) {
          const c = topOffer.content;
          if (c.content_type === 'html' && c.content) {
            replacement = c.content;
          } else if (c.content_type === 'image' && c.image_url) {
            const link = c.link_url || '#';
            replacement = `<a href="${link}"><img src="${c.image_url}" alt="${topOffer.offer_name || 'Offer'}" style="max-width:100%;height:auto;display:block;"></a>`;
          } else if (c.content_type === 'text' && c.content) {
            replacement = `<div>${c.content}</div>`;
          } else if (c.content_type === 'json') {
            replacement = `<pre style="background:#f5f5f5;padding:12px;border-radius:4px;font-size:12px;overflow:auto">${JSON.stringify(c, null, 2)}</pre>`;
          } else {
            replacement = buildDiagnosticHtml(
              `Offer "${topOffer.offer_name}" resolved but has no renderable content`,
              'The representation for this placement may be empty. Edit the offer and check its representations.'
            );
          }
        } else {
          replacement = buildDiagnosticHtml(
            `Offer "${topOffer.offer_name}" has no content for this placement`,
            'Add a Representation with HTML content for this placement in the Offers section.'
          );
        }
      } else if (placementResult) {
        replacement = buildDiagnosticHtml(
          'No offers qualified for this contact',
          placementResult.fallback_used
            ? 'The fallback offer was used but has no content for this placement.'
            : 'No offers matched the eligibility/constraint rules. Check the offer status and representations.'
        );
      } else {
        replacement = buildDiagnosticHtml(
          'Placement not found in decision response',
          'This placement may not be configured in the selected decision. Check the readiness panel.'
        );
      }
    } else {
      replacement = buildDiagnosticHtml(
        'Could not resolve offers',
        'The decision engine did not return a result. Check the readiness panel for configuration issues.'
      );
    }

    resolvedHtml = resolvedHtml.replace(fullMatch, replacement || fallback);
  }

  if (_offerResolveVersion !== version) return;
  body.innerHTML = resolvedHtml;
}

function toggleRightPanel() {
  if (editorState.aiPanelOpen) {
    closeAiPanel();
    editorState.rightPanelOpen = true;
  } else if (editorState.brandAlignmentPanelOpen) {
    closeBrandAlignmentPanel();
    editorState.rightPanelOpen = true;
  } else {
    editorState.rightPanelOpen = !editorState.rightPanelOpen;
  }
  const body = document.getElementById('email-editor-body');
  if (!body) return;
  body.classList.toggle('right-collapsed', !editorState.rightPanelOpen);
  if (editorState.rightPanelOpen) {
    try {
      const w = parseInt(localStorage.getItem('emailEditorRightWidth'), 10);
      if (w && w >= RIGHT_PANEL_MIN && w <= RIGHT_PANEL_MAX) setRightPanelWidth(w);
    } catch (_) {}
  }
  if (typeof updateThemeRailState === 'function') updateThemeRailState();
  updateRightPanelToggleButton();
}

function toggleRightPanelCollapse() {
  toggleRightPanel();
}

function updateRightPanelToggleButton() {
  const btn = document.getElementById('email-right-panel-toggle');
  if (!btn) return;
  const collapsed = !editorState.rightPanelOpen;
  btn.title = collapsed ? 'Expand panel' : 'Collapse panel';
  btn.setAttribute('aria-label', collapsed ? 'Expand right panel' : 'Collapse right panel');
  btn.classList.toggle('right-panel-collapsed', collapsed);
}

function toggleAiPanel() {
  if (editorState.aiPanelOpen) {
    closeAiPanel();
  } else {
    openAiPanel();
  }
}

function openAiPanel() {
  if (editorState.brandAlignmentPanelOpen) closeBrandAlignmentPanel();
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

function openBrandAlignmentPanel() {
  if (editorState.aiPanelOpen) closeAiPanel();
  editorState.brandAlignmentPanelOpen = true;
  editorState.rightPanelOpen = true;
  const body = document.getElementById('email-editor-body');
  if (body) {
    body.classList.remove('right-collapsed');
    body.classList.add('brand-alignment-panel-open');
  }
  renderBrandAlignmentPanel();
  updateBrandAlignmentRailState();
  updateThemeRailState();
}

function closeBrandAlignmentPanel() {
  editorState.brandAlignmentPanelOpen = false;
  const body = document.getElementById('email-editor-body');
  if (body) body.classList.remove('brand-alignment-panel-open');
  updateBrandAlignmentRailState();
  updateThemeRailState();
}

function toggleBrandAlignmentPanel() {
  if (editorState.brandAlignmentPanelOpen) {
    closeBrandAlignmentPanel();
  } else {
    openBrandAlignmentPanel();
  }
}

function updateBrandAlignmentRailState() {
  const railBtn = document.querySelector('.email-right-rail-btn[data-rail="brand-alignment"]');
  if (railBtn) railBtn.classList.toggle('active', editorState.brandAlignmentPanelOpen);
}

function openThemeFromRail() {
  if (editorState.aiPanelOpen) closeAiPanel();
  if (editorState.brandAlignmentPanelOpen) closeBrandAlignmentPanel();
  editorState.rightPanelOpen = true;
  const body = document.getElementById('email-editor-body');
  if (body) body.classList.remove('right-collapsed');
  switchEditorTab('styles');
  if (typeof renderStylesPanel === 'function') renderStylesPanel();
  updateThemeRailState();
  updateAiRailState();
  updateBrandAlignmentRailState();
}

function updateThemeRailState() {
  const themeRailBtn = document.querySelector('.email-right-rail-btn[data-rail="theme"]');
  if (!themeRailBtn) return;
  const themeActive = editorState.rightPanelOpen && !editorState.aiPanelOpen && !editorState.brandAlignmentPanelOpen && editorState.activeTab === 'styles';
  themeRailBtn.classList.toggle('active', themeActive);
}

function updateAiRailState() {
  const aiButton = document.querySelector('.email-right-rail-btn[data-rail="ai"]');
  if (aiButton) aiButton.classList.toggle('active', editorState.aiPanelOpen);
}

const LEFT_PANEL_MIN = 220;
const LEFT_PANEL_MAX = 480;
const LEFT_PANEL_RAIL = 48;
const LEFT_PANEL_DEFAULT = 260;

function getLeftPanelWidth() {
  const body = document.getElementById('email-editor-body');
  if (!body) return LEFT_PANEL_DEFAULT;
  const v = body.style.getPropertyValue('--email-left-width');
  if (v) return parseInt(v.replace('px', ''), 10) || LEFT_PANEL_DEFAULT;
  return LEFT_PANEL_DEFAULT;
}

function setLeftPanelWidth(px) {
  const body = document.getElementById('email-editor-body');
  if (body) body.style.setProperty('--email-left-width', Math.min(LEFT_PANEL_MAX, Math.max(LEFT_PANEL_MIN, px)) + 'px');
}

function toggleLeftPanelCollapse() {
  const body = document.getElementById('email-editor-body');
  if (!body) return;
  const collapsed = body.classList.toggle('left-collapsed');
  if (collapsed) {
    body.style.setProperty('--email-left-width', LEFT_PANEL_RAIL + 'px');
  } else {
    const w = parseInt(localStorage.getItem('emailEditorLeftWidth'), 10);
    if (w && w >= LEFT_PANEL_MIN && w <= LEFT_PANEL_MAX) setLeftPanelWidth(w);
    else body.style.removeProperty('--email-left-width');
  }
  const btn = document.getElementById('email-left-panel-toggle');
  if (btn) {
    btn.title = collapsed ? 'Expand panel' : 'Collapse panel';
    btn.setAttribute('aria-label', collapsed ? 'Expand left panel' : 'Collapse left panel');
  }
  try {
    localStorage.setItem('emailEditorLeftCollapsed', collapsed ? '1' : '0');
  } catch (_) {}
}

function initLeftPanelResize() {
  const body = document.getElementById('email-editor-body');
  const resizeEl = document.getElementById('email-left-resize');
  if (!body || !resizeEl) return;
  try {
    const collapsed = localStorage.getItem('emailEditorLeftCollapsed');
    if (collapsed === '1') {
      body.classList.add('left-collapsed');
      body.style.setProperty('--email-left-width', LEFT_PANEL_RAIL + 'px');
    } else {
      const w = localStorage.getItem('emailEditorLeftWidth');
      if (w) {
        const n = parseInt(w, 10);
        if (n >= LEFT_PANEL_MIN && n <= LEFT_PANEL_MAX) setLeftPanelWidth(n);
      }
    }
  } catch (_) {}
  const toggleBtn = document.getElementById('email-left-panel-toggle');
  if (toggleBtn) toggleBtn.title = body.classList.contains('left-collapsed') ? 'Expand panel' : 'Collapse panel';

  if (typeof updateRightPanelToggleButton === 'function') updateRightPanelToggleButton();

  let startX = 0, startWidth = 0;
  function onMove(e) {
    if (!body) return;
    const bodyRect = body.getBoundingClientRect();
    const newW = Math.round(Math.min(LEFT_PANEL_MAX, Math.max(LEFT_PANEL_MIN, e.clientX - bodyRect.left)));
    setLeftPanelWidth(newW);
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    try {
      localStorage.setItem('emailEditorLeftWidth', String(getLeftPanelWidth()));
    } catch (_) {}
  }
  resizeEl.addEventListener('mousedown', function (e) {
    if (e.button !== 0 || body.classList.contains('left-collapsed')) return;
    e.preventDefault();
    startX = e.clientX;
    startWidth = getLeftPanelWidth();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

const RIGHT_PANEL_MIN = 280;
const RIGHT_PANEL_MAX = 560;
const RIGHT_PANEL_RAIL = 44;
const RIGHT_PANEL_DEFAULT = 380;

function getRightPanelWidth() {
  const body = document.getElementById('email-editor-body');
  if (!body) return RIGHT_PANEL_DEFAULT;
  const v = body.style.getPropertyValue('--email-right-width');
  if (v) return parseInt(v.replace('px', ''), 10) || RIGHT_PANEL_DEFAULT;
  return RIGHT_PANEL_DEFAULT;
}

function setRightPanelWidth(px) {
  const body = document.getElementById('email-editor-body');
  if (body) body.style.setProperty('--email-right-width', Math.min(RIGHT_PANEL_MAX, Math.max(RIGHT_PANEL_MIN, px)) + 'px');
}

function initRightPanelResize() {
  const body = document.getElementById('email-editor-body');
  const resizeEl = document.getElementById('email-right-resize');
  if (!body || !resizeEl) return;
  try {
    if (!body.classList.contains('right-collapsed')) {
      const w = localStorage.getItem('emailEditorRightWidth');
      if (w) {
        const n = parseInt(w, 10);
        if (n >= RIGHT_PANEL_MIN && n <= RIGHT_PANEL_MAX) setRightPanelWidth(n);
      }
    }
  } catch (_) {}
  function onMove(e) {
    if (!body) return;
    const bodyRect = body.getBoundingClientRect();
    const newW = Math.round(Math.min(RIGHT_PANEL_MAX, Math.max(RIGHT_PANEL_MIN, bodyRect.right - e.clientX)));
    setRightPanelWidth(newW);
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    try {
      localStorage.setItem('emailEditorRightWidth', String(getRightPanelWidth()));
    } catch (_) {}
  }
  resizeEl.addEventListener('mousedown', function (e) {
    if (e.button !== 0 || body.classList.contains('right-collapsed')) return;
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    initLeftPanelResize();
    initRightPanelResize();
  });
} else {
  initLeftPanelResize();
  initRightPanelResize();
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

// ── Email editor helper functions ──

const _webSafeFonts = [
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Courier New, monospace',
  'Verdana, sans-serif',
  'Trebuchet MS, sans-serif',
  'Tahoma, sans-serif',
  'Lucida Sans, sans-serif',
  'Palatino, serif'
];

function _fontFamilyOptions(currentValue) {
  const cv = (currentValue || '').trim();
  const matched = _webSafeFonts.some(f => f === cv);
  return _webSafeFonts.map(f =>
    `<option value="${f}" ${f === cv ? 'selected' : ''}>${f.split(',')[0]}</option>`
  ).join('') + (!matched && cv ? `<option value="${cv}" selected>${cv}</option>` : '');
}

function syncColorHex(colorInput) {
  const hex = colorInput.nextElementSibling;
  if (hex) hex.value = colorInput.value;
}

// SVG icon fragments for alignment buttons
const _alignSVG = {
  left:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>',
  center: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>',
  right:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>'
};
const _actionSVG = {
  moveUp:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>',
  moveDown: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  trash:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
  duplicate:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>'
};

function _colorInputRow(blockId, field, value, defaultVal, fnLP, fnCommit) {
  const v = value || defaultVal;
  return `<div class="color-input-row">
    <input type="color" class="form-input form-color" value="${v}" oninput="${fnLP}('${blockId}','${field}', this.value); syncColorHex(this)" onchange="${fnCommit}('${blockId}','${field}', this.value)">
    <input type="text" class="form-input form-color-hex" value="${v}" maxlength="7" oninput="if(/^#[0-9a-fA-F]{6}$/.test(this.value)){this.previousElementSibling.value=this.value; ${fnLP}('${blockId}','${field}',this.value)}" onblur="if(/^#[0-9a-fA-F]{6}$/.test(this.value)){${fnCommit}('${blockId}','${field}',this.value)}">
  </div>`;
}

function _columnPresetButtons(block) {
  const cols = (block.columns || []).length;
  const presets = {
    1: [['100%']],
    2: [['50%','50%'], ['33%','67%'], ['67%','33%'], ['25%','75%'], ['75%','25%']],
    3: [['33%','33%','34%'], ['25%','50%','25%'], ['50%','25%','25%'], ['25%','25%','50%']],
    4: [['25%','25%','25%','25%']]
  };
  const options = presets[cols] || [];
  if (!options.length) return '<span class="form-helper">N/A</span>';
  const current = (block.columns || []).map(c => c.style?.width || `${Math.round(100/cols)}%`).join(',');
  return options.map(widths => {
    const key = widths.join(',');
    const isActive = key === current;
    const label = widths.map(w => parseInt(w)).join('/');
    return `<button class="btn btn-icon column-preset-btn ${isActive ? 'active' : ''}" type="button" title="${label}" onclick="applyColumnPreset('${block.id}', '${key}')">${label}</button>`;
  }).join('');
}

function applyColumnPreset(blockId, presetKey) {
  const context = findBlockContext(blockId);
  if (!context?.block || context.block.type !== 'structure') return;
  const widths = presetKey.split(',');
  (context.block.columns || []).forEach((col, i) => {
    col.style = col.style || {};
    col.style.width = widths[i] || `${Math.round(100 / widths.length)}%`;
  });
  renderEmailBlocks();
  pushHistory();
}

function renderBlockContentPanel(block) {
  if (!block) return '';
  if (block.type === 'offer') {
    const decisions = editorState.offerDecisions || [];
    const allDecisions = editorState._allOfferDecisions || decisions;
    const placements = editorState.offerPlacements || [];
    const selectedDecision = block.decisionId ? decisions.find(d => d.id === block.decisionId) : null;
    const decisionPlacements = selectedDecision
      ? (selectedDecision.placement_configs || []).map(pc => placements.find(p => p.id === pc.placement_id)).filter(Boolean)
      : placements.filter(p => p.channel === 'email');

    // Check if there are draft decisions but no live ones (guidance)
    const draftCount = allDecisions.filter(d => d.status !== 'live').length;
    const noneAvailableHint = decisions.length === 0 && draftCount > 0
      ? `<div class="offer-diag-hint" style="margin-top:6px;padding:8px 10px;background:#fff3e0;border-radius:6px;font-size:12px;color:#e65100;line-height:1.4">
           <strong>${draftCount} decision(s) exist but are not live.</strong><br>
           Go to <em>Offer Decisioning &gt; Decisions</em> and click <strong>Activate</strong> to make them available here.
         </div>`
      : decisions.length === 0
        ? `<div class="offer-diag-hint" style="margin-top:6px;padding:8px 10px;background:#e3f2fd;border-radius:6px;font-size:12px;color:#1565c0;line-height:1.4">
             No decisions found. Create one in <em>Offer Decisioning &gt; Decisions</em>.<br>
             A decision connects placements, strategies, and offers together.
           </div>`
        : '';

    return `
      <details class="inspector-section" open>
        <summary>Offer Decision</summary>
        <div class="inspector-fields">
          <div class="form-group">
            <label class="form-label">Decision policy</label>
            <select class="form-input" onchange="onOfferDecisionChange('${block.id}', this.value)">
              <option value="">-- Select a decision --</option>
              ${decisions.map(d => `<option value="${d.id}" ${block.decisionId === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}
            </select>
            <div class="form-helper">Only live (activated) decisions are shown.</div>
            ${noneAvailableHint}
          </div>
          <div class="form-group">
            <label class="form-label">Placement</label>
            <select class="form-input" onchange="onOfferPlacementChange('${block.id}', this.value)">
              <option value="">-- Select a placement --</option>
              ${decisionPlacements.map(p => {
                const isEmail = p.channel === 'email';
                const isHtml = p.content_type === 'html' || p.content_type === 'image';
                const recommended = isEmail && isHtml;
                const label = p.name + (recommended ? ' (recommended)' : ' (' + p.channel + ' / ' + p.content_type + ')');
                return `<option value="${p.id}" ${block.placementId === p.id ? 'selected' : ''}>${label}</option>`;
              }).join('')}
            </select>
            ${(() => {
              if (!selectedDecision) return '<div class="form-helper">Select a decision first to see its placements.</div>';
              const selPl = block.placementId ? decisionPlacements.find(p => p.id === block.placementId) : null;
              if (selPl && selPl.channel !== 'email') {
                return '<div class="form-helper" style="color:#e65100;font-weight:500">This is a ' + selPl.channel + ' placement. For email, choose an email-channel placement.</div>';
              }
              if (selPl && selPl.content_type !== 'html' && selPl.content_type !== 'image') {
                return '<div class="form-helper" style="color:#e65100;font-weight:500">Content type "' + selPl.content_type + '" may not render well in email. Use html or image.</div>';
              }
              return '<div class="form-helper">Showing placements configured in this decision.</div>';
            })()}
          </div>
          <div class="form-group">
            <label class="form-label">Fallback HTML</label>
            <textarea class="form-input email-code-textarea" rows="3" placeholder="Shown when no offer qualifies" oninput="updateEmailBlockLivePreview('${block.id}','offerFallbackHtml', this.value)" onblur="updateEmailBlockCommit('${block.id}','offerFallbackHtml', this.value)">${block.offerFallbackHtml || ''}</textarea>
            <div class="form-helper">Displayed when no offers qualify for this contact.</div>
          </div>
        </div>
      </details>
      <details class="inspector-section" open>
        <summary>Readiness Check</summary>
        <div id="offer-readiness-panel-${block.id}" class="inspector-fields" style="min-height:32px">
          ${block.decisionId && block.placementId
            ? '<div style="color:var(--text-secondary);font-size:12px;padding:4px 0">Checking...</div>'
            : '<div style="color:var(--text-secondary);font-size:12px;padding:4px 0">Select a decision and placement to run a readiness check.</div>'}
        </div>
      </details>
    `;
  }
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
            <label class="form-label">HTML code</label>
            <textarea class="form-input email-code-textarea" rows="6" placeholder="<div>Your HTML here…</div>" oninput="updateEmailBlockLivePreview('${block.id}','html', this.value)" onblur="updateEmailBlockCommit('${block.id}','html', this.value)">${block.html || ''}</textarea>
          </div>
          <div class="form-helper">Raw HTML will be rendered inside the email body.</div>
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
              <input class="form-input" type="text" value="${block.src || ''}" placeholder="https://… or choose from assets" oninput="updateEmailBlockLivePreview('${block.id}','src', this.value)" onblur="updateEmailBlockCommit('${block.id}','src', this.value)">
              <button class="btn btn-icon" type="button" title="Choose from assets" onclick="openAssetPickerForImage('${block.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></button>
              <button class="btn btn-icon" type="button" title="Upload from computer" onclick="uploadImageForBlock('${block.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Alt text</label>
            <input class="form-input" type="text" value="${block.alt || ''}" placeholder="Describe the image for accessibility" oninput="updateEmailBlockLivePreview('${block.id}','alt', this.value)" onblur="updateEmailBlockCommit('${block.id}','alt', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Link URL</label>
            <input class="form-input" type="text" value="${block.link || ''}" placeholder="https://…" oninput="updateEmailBlockLivePreview('${block.id}','link', this.value)" onblur="updateEmailBlockCommit('${block.id}','link', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Link target</label>
            <select class="form-input" oninput="updateEmailBlockLivePreview('${block.id}','linkTarget', this.value)" onblur="updateEmailBlockCommit('${block.id}','linkTarget', this.value)">
              <option value="_blank" ${(block.linkTarget || '_blank') === '_blank' ? 'selected' : ''}>New tab</option>
              <option value="_self" ${block.linkTarget === '_self' ? 'selected' : ''}>Same tab</option>
            </select>
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
            <input class="form-input" type="text" value="${block.url || ''}" placeholder="https://…" oninput="updateEmailBlockLivePreview('${block.id}','url', this.value)" onblur="updateEmailBlockCommit('${block.id}','url', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Link target</label>
            <select class="form-input" oninput="updateEmailBlockLivePreview('${block.id}','target', this.value)" onblur="updateEmailBlockCommit('${block.id}','target', this.value)">
              <option value="_blank" ${(block.target || '_blank') === '_blank' ? 'selected' : ''}>New tab</option>
              <option value="_self" ${block.target === '_self' ? 'selected' : ''}>Same tab</option>
            </select>
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
            <input class="form-input" type="text" value="${block.formTitle || ''}" placeholder="Form title" oninput="updateEmailBlockLivePreview('${block.id}','formTitle', this.value)" onblur="updateEmailBlockCommit('${block.id}','formTitle', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Action URL</label>
            <input class="form-input" type="text" value="${block.actionUrl || ''}" placeholder="https://…/submit" oninput="updateEmailBlockLivePreview('${block.id}','actionUrl', this.value)" onblur="updateEmailBlockCommit('${block.id}','actionUrl', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Submit label</label>
            <input class="form-input" type="text" value="${block.submitLabel || ''}" placeholder="Submit" oninput="updateEmailBlockLivePreview('${block.id}','submitLabel', this.value)" onblur="updateEmailBlockCommit('${block.id}','submitLabel', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Method</label>
            <select class="form-input" oninput="updateEmailBlockLivePreview('${block.id}','formMethod', this.value)" onblur="updateEmailBlockCommit('${block.id}','formMethod', this.value)">
              <option value="POST" ${(block.formMethod || 'POST') === 'POST' ? 'selected' : ''}>POST</option>
              <option value="GET" ${block.formMethod === 'GET' ? 'selected' : ''}>GET</option>
            </select>
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
            <input class="form-input" type="text" value="${block.embedUrl || ''}" placeholder="https://youtube.com/embed/…" oninput="updateEmailBlockLivePreview('${block.id}','embedUrl', this.value)" onblur="updateEmailBlockCommit('${block.id}','embedUrl', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Embed code</label>
            <textarea class="form-input" rows="5" placeholder="<iframe src=&quot;…&quot;></iframe>" oninput="updateEmailBlockLivePreview('${block.id}','embedCode', this.value)" onblur="updateEmailBlockCommit('${block.id}','embedCode', this.value)">${block.embedCode || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Aspect ratio</label>
            <select class="form-input" oninput="updateEmailBlockLivePreview('${block.id}','aspectRatio', this.value)" onblur="updateEmailBlockCommit('${block.id}','aspectRatio', this.value)">
              <option value="16:9" ${(block.aspectRatio || '16:9') === '16:9' ? 'selected' : ''}>16:9</option>
              <option value="4:3" ${block.aspectRatio === '4:3' ? 'selected' : ''}>4:3</option>
              <option value="1:1" ${block.aspectRatio === '1:1' ? 'selected' : ''}>1:1</option>
              <option value="auto" ${block.aspectRatio === 'auto' ? 'selected' : ''}>Auto</option>
            </select>
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
          <div class="form-group inline">
            <label class="form-label">Thickness</label>
            <input class="form-input" type="number" min="1" value="${block.thickness || 1}" oninput="updateEmailBlockLivePreview('${block.id}','thickness', this.value)" onblur="updateEmailBlockCommit('${block.id}','thickness', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Style</label>
            <select class="form-input" oninput="updateEmailBlockLivePreview('${block.id}','dividerStyle', this.value)" onblur="updateEmailBlockCommit('${block.id}','dividerStyle', this.value)">
              <option value="solid" ${(block.dividerStyle || 'solid') === 'solid' ? 'selected' : ''}>Solid</option>
              <option value="dashed" ${block.dividerStyle === 'dashed' ? 'selected' : ''}>Dashed</option>
              <option value="dotted" ${block.dividerStyle === 'dotted' ? 'selected' : ''}>Dotted</option>
              <option value="double" ${block.dividerStyle === 'double' ? 'selected' : ''}>Double</option>
            </select>
          </div>
          <div class="form-group inline">
            <label class="form-label">Width %</label>
            <input class="form-input" type="number" min="10" max="100" value="${block.dividerWidth || 100}" oninput="updateEmailBlockLivePreview('${block.id}','dividerWidth', this.value)" onblur="updateEmailBlockCommit('${block.id}','dividerWidth', this.value)">
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
        <summary>Social links</summary>
        <div class="inspector-fields">
          <div class="form-group">
            <label class="form-label">Facebook</label>
            <input class="form-input" type="text" placeholder="https://facebook.com/…" value="${block.links?.facebook || ''}" oninput="updateSocialLinkLivePreview('${block.id}','facebook', this.value)" onblur="updateSocialLinkCommit('${block.id}','facebook', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Twitter / X</label>
            <input class="form-input" type="text" placeholder="https://x.com/…" value="${block.links?.twitter || ''}" oninput="updateSocialLinkLivePreview('${block.id}','twitter', this.value)" onblur="updateSocialLinkCommit('${block.id}','twitter', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">LinkedIn</label>
            <input class="form-input" type="text" placeholder="https://linkedin.com/…" value="${block.links?.linkedin || ''}" oninput="updateSocialLinkLivePreview('${block.id}','linkedin', this.value)" onblur="updateSocialLinkCommit('${block.id}','linkedin', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Instagram</label>
            <input class="form-input" type="text" placeholder="https://instagram.com/…" value="${block.links?.instagram || ''}" oninput="updateSocialLinkLivePreview('${block.id}','instagram', this.value)" onblur="updateSocialLinkCommit('${block.id}','instagram', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">YouTube</label>
            <input class="form-input" type="text" placeholder="https://youtube.com/…" value="${block.links?.youtube || ''}" oninput="updateSocialLinkLivePreview('${block.id}','youtube', this.value)" onblur="updateSocialLinkCommit('${block.id}','youtube', this.value)">
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
      <button class="btn btn-icon" type="button" title="Move up" onclick="moveEmailBlock('${block.id}','up')">${_actionSVG.moveUp}</button>
      <button class="btn btn-icon" type="button" title="Move down" onclick="moveEmailBlock('${block.id}','down')">${_actionSVG.moveDown}</button>
      <button class="btn btn-icon" type="button" title="Duplicate" onclick="duplicateEmailBlock('${block.id}')">${_actionSVG.duplicate}</button>
      <button class="btn btn-icon btn-icon-danger" type="button" title="Delete" onclick="deleteEmailBlock('${block.id}')">${_actionSVG.trash}</button>
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
  if (block?.type === 'offer') {
    const offerContentSection = renderBlockContentPanel(block);
    container.innerHTML = `
      ${offerContentSection}
      ${actionSection}
    `;
    // Auto-run readiness check if decision+placement are already selected
    if (block.decisionId && block.placementId) {
      runOfferReadinessCheck(block.id);
    }
    return;
  }
  const bodySection = `
    <details class="inspector-section" open>
      <summary>Background</summary>
      <div class="inspector-fields">
        <div class="form-group">
          <label class="form-label">Background color</label>
          <div class="color-input-row">
            <input type="color" class="form-input form-color" value="${body.backgroundColor || '#ffffff'}" oninput="updateBodyStyleLivePreview('backgroundColor', this.value); syncColorHex(this)" onchange="updateBodyStyle('backgroundColor', this.value)">
            <input type="text" class="form-input form-color-hex" value="${body.backgroundColor || '#ffffff'}" maxlength="7" oninput="if(/^#[0-9a-fA-F]{6}$/.test(this.value)){this.previousElementSibling.value=this.value; updateBodyStyleLivePreview('backgroundColor',this.value)}" onblur="if(/^#[0-9a-fA-F]{6}$/.test(this.value)){updateBodyStyle('backgroundColor',this.value)}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Viewport color</label>
          <div class="color-input-row">
            <input type="color" class="form-input form-color" value="${body.viewportColor || '#f0f0f0'}" oninput="updateBodyStyleLivePreview('viewportColor', this.value); syncColorHex(this)" onchange="updateBodyStyle('viewportColor', this.value)">
            <input type="text" class="form-input form-color-hex" value="${body.viewportColor || '#f0f0f0'}" maxlength="7" oninput="if(/^#[0-9a-fA-F]{6}$/.test(this.value)){this.previousElementSibling.value=this.value; updateBodyStyleLivePreview('viewportColor',this.value)}" onblur="if(/^#[0-9a-fA-F]{6}$/.test(this.value)){updateBodyStyle('viewportColor',this.value)}">
          </div>
        </div>
      </div>
    </details>
    <details class="inspector-section" open>
      <summary>Text</summary>
      <div class="inspector-fields">
        <div class="form-group">
          <label class="form-label">Font family</label>
          <select class="form-input" oninput="updateBodyStyleLivePreview('fontFamily', this.value)" onchange="updateBodyStyle('fontFamily', this.value)">
            ${_fontFamilyOptions(body.fontFamily || 'Arial, sans-serif')}
          </select>
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
          <button class="btn btn-icon ${body.align === 'left' ? 'active' : ''}" type="button" title="Left" onclick="updateBodyStyleLivePreview('align', 'left'); updateBodyStyle('align', 'left')">${_alignSVG.left}</button>
          <button class="btn btn-icon ${(body.align || 'center') === 'center' ? 'active' : ''}" type="button" title="Center" onclick="updateBodyStyleLivePreview('align', 'center'); updateBodyStyle('align', 'center')">${_alignSVG.center}</button>
          <button class="btn btn-icon ${body.align === 'right' ? 'active' : ''}" type="button" title="Right" onclick="updateBodyStyleLivePreview('align', 'right'); updateBodyStyle('align', 'right')">${_alignSVG.right}</button>
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
    const themes = editorState.themes || [];
    const themeSelectEl = document.getElementById('email-editor-theme-select');
    const currentThemeId = (themeSelectEl && themeSelectEl.value) ? parseInt(themeSelectEl.value, 10) : editorState.appliedThemeId;
    const themeOptions = themes.map(t => `<option value="${t.id}" ${t.id === currentThemeId ? 'selected' : ''}>${(t.name || 'Untitled theme').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</option>`).join('');
    const selectedTheme = currentThemeId ? themes.find(t => t.id === currentThemeId) : null;
    const variants = selectedTheme && selectedTheme.variants && selectedTheme.variants.length ? selectedTheme.variants : [];
    const variantIdx = Math.min(editorState.appliedThemeVariantIndex || 0, Math.max(0, variants.length - 1));
    const variantOptions = variants.map((v, i) => `<option value="${i}" ${i === variantIdx ? 'selected' : ''}>${(v.name || 'Variant ' + (i + 1)).replace(/</g, '&lt;')}</option>`).join('');
    const variantRow = variants.length ? `
        <div class="form-group">
          <label class="form-label">Color variant</label>
          <select class="form-input" id="email-editor-theme-variant-select">${variantOptions}</select>
        </div>
    ` : '';
    const themesSection = `
    <details class="inspector-section" open>
      <summary>Themes</summary>
      <div class="inspector-fields">
        <div class="form-group">
          <label class="form-label">Apply theme</label>
          <select class="form-input" id="email-editor-theme-select" onchange="renderStylesPanel()">
            <option value="">— Select a theme —</option>
            ${themeOptions}
          </select>
        </div>
        ${variantRow}
        <div class="form-group">
          <button type="button" class="btn btn-secondary btn-sm" onclick="applyThemeToEditorById()">Apply theme</button>
        </div>
        <div class="form-group">
          <button type="button" class="btn btn-ghost btn-sm" onclick="generateThemeFromContent()" title="Create a new theme from current body and block styles">Generate theme from content</button>
        </div>
      </div>
    </details>
    `;
    container.innerHTML = themesSection + bodySection + '<div class="inspector-empty">Select a block to edit styles.</div>';
    return;
  }
  const contentSection = renderBlockContentPanel(block);
  const style = block.style || {};
  const hasMarginSides = !!style.marginTop || !!style.marginRight || !!style.marginBottom || !!style.marginLeft;
  const hasPaddingSides = !!style.paddingTop || !!style.paddingRight || !!style.paddingBottom || !!style.paddingLeft;
  const unlockRow = `
    <details class="inspector-section" open>
      <summary>Theme</summary>
      <div class="inspector-fields">
        <label class="form-checkbox">
          <input type="checkbox" ${block.styleUnlocked ? 'checked' : ''} onchange="toggleBlockStyleUnlock('${block.id}', this.checked)">
          Unlock styles (theme won't override)
        </label>
      </div>
    </details>
  `;
  const headingRow = block.type === 'text' ? `
    <details class="inspector-section" open>
      <summary>Heading level</summary>
      <div class="inspector-fields">
        <div class="form-group">
          <select class="form-input" onchange="updateBlockHeadingLevel('${block.id}', this.value)">
            <option value="" ${!block.headingLevel ? 'selected' : ''}>Body text</option>
            <option value="1" ${block.headingLevel === 1 ? 'selected' : ''}>H1</option>
            <option value="2" ${block.headingLevel === 2 ? 'selected' : ''}>H2</option>
            <option value="3" ${block.headingLevel === 3 ? 'selected' : ''}>H3</option>
          </select>
        </div>
      </div>
    </details>
  ` : '';
  const common = `
    ${unlockRow}
    ${headingRow}
    <details class="inspector-section" open>
      <summary>Background</summary>
      <div class="inspector-fields">
        <div class="form-group">
          <label class="form-label">Background color</label>
          ${_colorInputRow(block.id, 'backgroundColor', style.backgroundColor, '#ffffff', 'updateBlockStyleLivePreview', 'updateBlockStyle')}
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
              <option value="paragraph" ${(style.textType || 'paragraph') === 'paragraph' ? 'selected' : ''}>Paragraph</option>
              <option value="heading1" ${style.textType === 'heading1' ? 'selected' : ''}>Heading 1</option>
              <option value="heading2" ${style.textType === 'heading2' ? 'selected' : ''}>Heading 2</option>
              <option value="heading3" ${style.textType === 'heading3' ? 'selected' : ''}>Heading 3</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Font family</label>
            <select class="form-input" oninput="updateBlockStyleLivePreview('${block.id}','fontFamily', this.value)" onchange="updateBlockStyle('${block.id}','fontFamily', this.value)">
              ${_fontFamilyOptions(style.fontFamily || 'Arial, sans-serif')}
            </select>
          </div>
          <div class="form-group inline">
            <label class="form-label">Font size</label>
            <input type="number" class="form-input" value="${parseInt(style.fontSize || '14', 10)}" min="8" oninput="updateBlockStyleLivePreview('${block.id}','fontSize', this.value + 'px')" onchange="updateBlockStyle('${block.id}','fontSize', this.value + 'px')" placeholder="14">
          </div>
          <div class="form-group inline">
            <label class="form-label">Line height</label>
            <input type="text" class="form-input" value="${style.lineHeight || '1.5'}" oninput="updateBlockStyleLivePreview('${block.id}','lineHeight', this.value)" onchange="updateBlockStyle('${block.id}','lineHeight', this.value)" placeholder="1.5">
          </div>
          <div class="form-group inline">
            <label class="form-label">Letter spacing</label>
            <input type="text" class="form-input" value="${style.letterSpacing || 'normal'}" oninput="updateBlockStyleLivePreview('${block.id}','letterSpacing', this.value)" onchange="updateBlockStyle('${block.id}','letterSpacing', this.value)" placeholder="normal">
          </div>
          <div class="form-group">
            <label class="form-label">Text styles</label>
            <div class="inline-buttons">
              <button class="btn btn-icon text-style-btn ${style.fontWeight === '700' ? 'active' : ''}" type="button" title="Bold" onclick="toggleTextStyle('bold')"><strong>B</strong></button>
              <button class="btn btn-icon text-style-btn ${style.fontStyle === 'italic' ? 'active' : ''}" type="button" title="Italic" onclick="toggleTextStyle('italic')"><em>I</em></button>
              <button class="btn btn-icon text-style-btn ${style.textDecoration === 'underline' ? 'active' : ''}" type="button" title="Underline" onclick="toggleTextStyle('underline')"><u>U</u></button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Text transform</label>
            <select class="form-input" oninput="updateBlockStyleLivePreview('${block.id}','textTransform', this.value)" onchange="updateBlockStyle('${block.id}','textTransform', this.value)">
              <option value="none" ${(style.textTransform || 'none') === 'none' ? 'selected' : ''}>None</option>
              <option value="uppercase" ${style.textTransform === 'uppercase' ? 'selected' : ''}>UPPERCASE</option>
              <option value="lowercase" ${style.textTransform === 'lowercase' ? 'selected' : ''}>lowercase</option>
              <option value="capitalize" ${style.textTransform === 'capitalize' ? 'selected' : ''}>Capitalize</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Text alignment</label>
            <div class="inline-buttons">
              <button class="btn btn-icon ${(style.textAlign || 'left') === 'left' ? 'active' : ''}" type="button" title="Left" onclick="updateBlockStyleLivePreview('${block.id}','textAlign', 'left'); updateBlockStyle('${block.id}','textAlign', 'left')">${_alignSVG.left}</button>
              <button class="btn btn-icon ${style.textAlign === 'center' ? 'active' : ''}" type="button" title="Center" onclick="updateBlockStyleLivePreview('${block.id}','textAlign', 'center'); updateBlockStyle('${block.id}','textAlign', 'center')">${_alignSVG.center}</button>
              <button class="btn btn-icon ${style.textAlign === 'right' ? 'active' : ''}" type="button" title="Right" onclick="updateBlockStyleLivePreview('${block.id}','textAlign', 'right'); updateBlockStyle('${block.id}','textAlign', 'right')">${_alignSVG.right}</button>
            </div>
          </div>
          <div class="form-group inline">
            <label class="form-label">Indentation</label>
            <input type="number" class="form-input" value="${parseInt(style.indent || '0', 10)}" min="0" oninput="updateBlockStyleLivePreview('${block.id}','indent', this.value + 'px')" onchange="updateBlockStyle('${block.id}','indent', this.value + 'px')" placeholder="0">
          </div>
          <div class="form-group">
            <label class="form-label">Font color</label>
            ${_colorInputRow(block.id, 'color', style.color, '#1f2933', 'updateBlockStyleLivePreview', 'updateBlockStyle')}
          </div>
        </div>
      </details>
    ` : ''}
    ${block.type === 'image' ? `
      <details class="inspector-section" open>
        <summary>Image</summary>
        <div class="inspector-fields">
          <div class="form-group inline">
            <label class="form-label">Width %</label>
            <input type="number" class="form-input" value="${parseInt(style.width || '100', 10)}" min="10" max="100" oninput="updateBlockStyleLivePreview('${block.id}','width', this.value + '%')" onchange="updateBlockStyle('${block.id}','width', this.value + '%')" placeholder="100">
          </div>
          <div class="form-group inline">
            <label class="form-label">Max height</label>
            <input type="number" class="form-input" value="${parseInt(style.maxHeight || '', 10) || ''}" min="0" oninput="updateBlockStyleLivePreview('${block.id}','maxHeight', this.value ? this.value + 'px' : '')" onchange="updateBlockStyle('${block.id}','maxHeight', this.value ? this.value + 'px' : '')" placeholder="Auto">
          </div>
          <div class="form-group">
            <label class="form-label">Object fit</label>
            <select class="form-input" oninput="updateBlockStyleLivePreview('${block.id}','objectFit', this.value)" onchange="updateBlockStyle('${block.id}','objectFit', this.value)">
              <option value="contain" ${(style.objectFit || 'contain') === 'contain' ? 'selected' : ''}>Contain</option>
              <option value="cover" ${style.objectFit === 'cover' ? 'selected' : ''}>Cover</option>
              <option value="fill" ${style.objectFit === 'fill' ? 'selected' : ''}>Fill</option>
              <option value="none" ${style.objectFit === 'none' ? 'selected' : ''}>None (original)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Alignment</label>
            <div class="inline-buttons">
              <button class="btn btn-icon ${style.textAlign === 'left' ? 'active' : ''}" type="button" title="Left" onclick="updateBlockStyleLivePreview('${block.id}','textAlign', 'left'); updateBlockStyle('${block.id}','textAlign', 'left')">${_alignSVG.left}</button>
              <button class="btn btn-icon ${(style.textAlign || 'center') === 'center' ? 'active' : ''}" type="button" title="Center" onclick="updateBlockStyleLivePreview('${block.id}','textAlign', 'center'); updateBlockStyle('${block.id}','textAlign', 'center')">${_alignSVG.center}</button>
              <button class="btn btn-icon ${style.textAlign === 'right' ? 'active' : ''}" type="button" title="Right" onclick="updateBlockStyleLivePreview('${block.id}','textAlign', 'right'); updateBlockStyle('${block.id}','textAlign', 'right')">${_alignSVG.right}</button>
            </div>
          </div>
        </div>
      </details>
    ` : ''}
    ${block.type === 'button' ? `
      <details class="inspector-section" open>
        <summary>Button</summary>
        <div class="inspector-fields">
          <div class="form-group">
            <label class="form-label">Button color</label>
            <div class="color-input-row">
              <input type="color" class="form-input form-color" value="${style.buttonColor || '#1473E6'}" oninput="updateBlockStyleLivePreview('${block.id}','buttonColor', this.value); syncColorHex(this)" onchange="updateBlockStyle('${block.id}','buttonColor', this.value)">
              <input type="text" class="form-input form-color-hex" value="${style.buttonColor || '#1473E6'}" maxlength="7" oninput="if(/^#[0-9a-fA-F]{6}$/.test(this.value)){this.previousElementSibling.value=this.value; updateBlockStyleLivePreview('${block.id}','buttonColor',this.value)}" onblur="if(/^#[0-9a-fA-F]{6}$/.test(this.value)){updateBlockStyle('${block.id}','buttonColor',this.value)}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Text color</label>
            <div class="color-input-row">
              <input type="color" class="form-input form-color" value="${style.color || '#ffffff'}" oninput="updateBlockStyleLivePreview('${block.id}','color', this.value); syncColorHex(this)" onchange="updateBlockStyle('${block.id}','color', this.value)">
              <input type="text" class="form-input form-color-hex" value="${style.color || '#ffffff'}" maxlength="7" oninput="if(/^#[0-9a-fA-F]{6}$/.test(this.value)){this.previousElementSibling.value=this.value; updateBlockStyleLivePreview('${block.id}','color',this.value)}" onblur="if(/^#[0-9a-fA-F]{6}$/.test(this.value)){updateBlockStyle('${block.id}','color',this.value)}">
            </div>
          </div>
          <div class="form-group inline">
            <label class="form-label">Font size</label>
            <input type="number" class="form-input" value="${parseInt(style.fontSize || '16', 10)}" min="8" oninput="updateBlockStyleLivePreview('${block.id}','fontSize', this.value + 'px')" onchange="updateBlockStyle('${block.id}','fontSize', this.value + 'px')" placeholder="16">
          </div>
          <div class="form-group">
            <label class="form-label">Font family</label>
            <select class="form-input" oninput="updateBlockStyleLivePreview('${block.id}','fontFamily', this.value)" onchange="updateBlockStyle('${block.id}','fontFamily', this.value)">
              ${_fontFamilyOptions(style.fontFamily || 'Arial, sans-serif')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Font weight</label>
            <select class="form-input" oninput="updateBlockStyleLivePreview('${block.id}','fontWeight', this.value)" onchange="updateBlockStyle('${block.id}','fontWeight', this.value)">
              <option value="400" ${(style.fontWeight || '700') === '400' ? 'selected' : ''}>Normal</option>
              <option value="600" ${style.fontWeight === '600' ? 'selected' : ''}>Semi-bold</option>
              <option value="700" ${(style.fontWeight || '700') === '700' ? 'selected' : ''}>Bold</option>
            </select>
          </div>
          <div class="form-group inline">
            <label class="form-label">Border radius</label>
            <input type="number" class="form-input" value="${parseInt(style.btnBorderRadius || '4', 10)}" min="0" oninput="updateBlockStyleLivePreview('${block.id}','btnBorderRadius', this.value + 'px')" onchange="updateBlockStyle('${block.id}','btnBorderRadius', this.value + 'px')" placeholder="4">
          </div>
          <div class="form-group inline">
            <label class="form-label">Padding H</label>
            <input type="number" class="form-input" value="${parseInt(style.btnPaddingH || '24', 10)}" min="0" oninput="updateBlockStyleLivePreview('${block.id}','btnPaddingH', this.value + 'px')" onchange="updateBlockStyle('${block.id}','btnPaddingH', this.value + 'px')" placeholder="24">
          </div>
          <div class="form-group inline">
            <label class="form-label">Padding V</label>
            <input type="number" class="form-input" value="${parseInt(style.btnPaddingV || '12', 10)}" min="0" oninput="updateBlockStyleLivePreview('${block.id}','btnPaddingV', this.value + 'px')" onchange="updateBlockStyle('${block.id}','btnPaddingV', this.value + 'px')" placeholder="12">
          </div>
          <div class="form-group">
            <label class="form-label">Width</label>
            <select class="form-input" oninput="updateBlockStyleLivePreview('${block.id}','btnWidth', this.value)" onchange="updateBlockStyle('${block.id}','btnWidth', this.value)">
              <option value="auto" ${(style.btnWidth || 'auto') === 'auto' ? 'selected' : ''}>Auto</option>
              <option value="100%" ${style.btnWidth === '100%' ? 'selected' : ''}>Full width</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Alignment</label>
            <div class="inline-buttons">
              <button class="btn btn-icon ${style.textAlign === 'left' ? 'active' : ''}" type="button" title="Left" onclick="updateBlockStyleLivePreview('${block.id}','textAlign','left'); updateBlockStyle('${block.id}','textAlign','left')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg></button>
              <button class="btn btn-icon ${(style.textAlign || 'center') === 'center' ? 'active' : ''}" type="button" title="Center" onclick="updateBlockStyleLivePreview('${block.id}','textAlign','center'); updateBlockStyle('${block.id}','textAlign','center')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg></button>
              <button class="btn btn-icon ${style.textAlign === 'right' ? 'active' : ''}" type="button" title="Right" onclick="updateBlockStyleLivePreview('${block.id}','textAlign','right'); updateBlockStyle('${block.id}','textAlign','right')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg></button>
            </div>
          </div>
        </div>
      </details>
    ` : ''}
    ${block.type === 'divider' ? `
      <details class="inspector-section" open>
        <summary>Divider</summary>
        <div class="inspector-fields">
          <div class="form-group inline">
            <label class="form-label">Thickness</label>
            <input type="number" class="form-input" value="${parseInt(style.thickness || '1', 10)}" min="1" oninput="updateBlockStyleLivePreview('${block.id}','thickness', this.value)" onchange="updateBlockStyle('${block.id}','thickness', this.value)" placeholder="1">
          </div>
          <div class="form-group">
            <label class="form-label">Color</label>
            ${_colorInputRow(block.id, 'borderColor', style.borderColor, '#E5E7EB', 'updateBlockStyleLivePreview', 'updateBlockStyle')}
          </div>
          <div class="form-group">
            <label class="form-label">Alignment</label>
            <div class="inline-buttons">
              <button class="btn btn-icon ${style.dividerAlign === 'left' ? 'active' : ''}" type="button" title="Left" onclick="updateBlockStyleLivePreview('${block.id}','dividerAlign','left'); updateBlockStyle('${block.id}','dividerAlign','left')">${_alignSVG.left}</button>
              <button class="btn btn-icon ${(style.dividerAlign || 'center') === 'center' ? 'active' : ''}" type="button" title="Center" onclick="updateBlockStyleLivePreview('${block.id}','dividerAlign','center'); updateBlockStyle('${block.id}','dividerAlign','center')">${_alignSVG.center}</button>
              <button class="btn btn-icon ${style.dividerAlign === 'right' ? 'active' : ''}" type="button" title="Right" onclick="updateBlockStyleLivePreview('${block.id}','dividerAlign','right'); updateBlockStyle('${block.id}','dividerAlign','right')">${_alignSVG.right}</button>
            </div>
          </div>
        </div>
      </details>
    ` : ''}
    ${block.type === 'spacer' ? `
      <details class="inspector-section" open>
        <summary>Spacer</summary>
        <div class="inspector-fields">
          <div class="form-group inline">
            <label class="form-label">Height</label>
            <input type="number" class="form-input" value="${parseInt(style.height || block.height || '20', 10)}" min="4" max="200" oninput="updateBlockStyleLivePreview('${block.id}','height', this.value)" onchange="updateBlockStyle('${block.id}','height', this.value)" placeholder="20">
          </div>
          <div class="form-helper">Vertical spacing between blocks (${parseInt(style.height || block.height || '20', 10)}px)</div>
        </div>
      </details>
    ` : ''}
    ${block.type === 'structure' ? `
      <details class="inspector-section" open>
        <summary>Structure</summary>
        <div class="inspector-fields">
          <div class="form-group">
            <label class="form-label">Column layout</label>
            <div class="inline-buttons column-presets">
              ${_columnPresetButtons(block)}
            </div>
          </div>
          <div class="form-group inline">
            <label class="form-label">Column gap</label>
            <input type="number" class="form-input" value="${parseInt(style.columnGap || '8', 10)}" min="0" oninput="updateBlockStyleLivePreview('${block.id}','columnGap', this.value)" onchange="updateBlockStyle('${block.id}','columnGap', this.value)" placeholder="8">
          </div>
          <div class="form-group">
            <label class="form-label">Vertical align</label>
            <select class="form-input" oninput="updateBlockStyleLivePreview('${block.id}','verticalAlign', this.value)" onchange="updateBlockStyle('${block.id}','verticalAlign', this.value)">
              <option value="top" ${(style.verticalAlign || 'top') === 'top' ? 'selected' : ''}>Top</option>
              <option value="middle" ${style.verticalAlign === 'middle' ? 'selected' : ''}>Middle</option>
              <option value="bottom" ${style.verticalAlign === 'bottom' ? 'selected' : ''}>Bottom</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Stack on mobile</label>
            <select class="form-input" oninput="updateBlockStyleLivePreview('${block.id}','stackOnMobile', this.value)" onchange="updateBlockStyle('${block.id}','stackOnMobile', this.value)">
              <option value="yes" ${(style.stackOnMobile || 'yes') === 'yes' ? 'selected' : ''}>Yes</option>
              <option value="no" ${style.stackOnMobile === 'no' ? 'selected' : ''}>No</option>
            </select>
          </div>
        </div>
      </details>
    ` : ''}
    ${block.type === 'container' ? `
      <details class="inspector-section" open>
        <summary>Container</summary>
        <div class="inspector-fields">
          <div class="form-group inline">
            <label class="form-label">Padding</label>
            <input type="number" class="form-input" value="${parseInt(style.padding || '12', 10)}" min="0" oninput="updateBlockStyleLivePreview('${block.id}','padding', this.value + 'px')" onchange="updateBlockStyle('${block.id}','padding', this.value + 'px')" placeholder="12">
          </div>
          <div class="form-group">
            <label class="form-label">Content align</label>
            <div class="inline-buttons">
              <button class="btn btn-icon ${(style.textAlign || 'left') === 'left' ? 'active' : ''}" type="button" title="Left" onclick="updateBlockStyleLivePreview('${block.id}','textAlign','left'); updateBlockStyle('${block.id}','textAlign','left')">${_alignSVG.left}</button>
              <button class="btn btn-icon ${style.textAlign === 'center' ? 'active' : ''}" type="button" title="Center" onclick="updateBlockStyleLivePreview('${block.id}','textAlign','center'); updateBlockStyle('${block.id}','textAlign','center')">${_alignSVG.center}</button>
              <button class="btn btn-icon ${style.textAlign === 'right' ? 'active' : ''}" type="button" title="Right" onclick="updateBlockStyleLivePreview('${block.id}','textAlign','right'); updateBlockStyle('${block.id}','textAlign','right')">${_alignSVG.right}</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Overflow</label>
            <select class="form-input" oninput="updateBlockStyleLivePreview('${block.id}','overflow', this.value)" onchange="updateBlockStyle('${block.id}','overflow', this.value)">
              <option value="visible" ${(style.overflow || 'visible') === 'visible' ? 'selected' : ''}>Visible</option>
              <option value="hidden" ${style.overflow === 'hidden' ? 'selected' : ''}>Hidden</option>
              <option value="auto" ${style.overflow === 'auto' ? 'selected' : ''}>Auto</option>
            </select>
          </div>
        </div>
      </details>
    ` : ''}
    ${block.type === 'social' ? `
      <details class="inspector-section" open>
        <summary>Social</summary>
        <div class="inspector-fields">
          <div class="form-group inline">
            <label class="form-label">Icon size</label>
            <input type="number" class="form-input" value="${parseInt(style.iconSize || '24', 10)}" min="12" max="64" oninput="updateBlockStyleLivePreview('${block.id}','iconSize', this.value)" onchange="updateBlockStyle('${block.id}','iconSize', this.value)" placeholder="24">
          </div>
          <div class="form-group inline">
            <label class="form-label">Spacing</label>
            <input type="number" class="form-input" value="${parseInt(style.iconSpacing || '8', 10)}" min="0" max="32" oninput="updateBlockStyleLivePreview('${block.id}','iconSpacing', this.value)" onchange="updateBlockStyle('${block.id}','iconSpacing', this.value)" placeholder="8">
          </div>
          <div class="form-group">
            <label class="form-label">Icon style</label>
            <select class="form-input" oninput="updateBlockStyleLivePreview('${block.id}','iconStyle', this.value)" onchange="updateBlockStyle('${block.id}','iconStyle', this.value)">
              <option value="colored" ${(style.iconStyle || 'colored') === 'colored' ? 'selected' : ''}>Colored</option>
              <option value="mono-dark" ${style.iconStyle === 'mono-dark' ? 'selected' : ''}>Mono dark</option>
              <option value="mono-light" ${style.iconStyle === 'mono-light' ? 'selected' : ''}>Mono light</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Alignment</label>
            <div class="inline-buttons">
              <button class="btn btn-icon ${style.textAlign === 'left' ? 'active' : ''}" type="button" title="Left" onclick="updateBlockStyleLivePreview('${block.id}','textAlign','left'); updateBlockStyle('${block.id}','textAlign','left')">${_alignSVG.left}</button>
              <button class="btn btn-icon ${(style.textAlign || 'center') === 'center' ? 'active' : ''}" type="button" title="Center" onclick="updateBlockStyleLivePreview('${block.id}','textAlign','center'); updateBlockStyle('${block.id}','textAlign','center')">${_alignSVG.center}</button>
              <button class="btn btn-icon ${style.textAlign === 'right' ? 'active' : ''}" type="button" title="Right" onclick="updateBlockStyleLivePreview('${block.id}','textAlign','right'); updateBlockStyle('${block.id}','textAlign','right')">${_alignSVG.right}</button>
            </div>
          </div>
        </div>
      </details>
    ` : ''}
    ${block.type === 'structure' ? renderStructureColumnStyles(block) : ''}
    ${bodySection}
  `;
}

function toggleBlockStyleUnlock(blockId, unlocked) {
  const block = editorState.blocks.find(b => b.id === blockId);
  if (!block) return;
  block.styleUnlocked = !!unlocked;
  pushHistory();
  renderStylesPanel();
}

function updateBlockHeadingLevel(blockId, value) {
  const block = editorState.blocks.find(b => b.id === blockId);
  if (!block) return;
  block.headingLevel = value === '' || value == null ? undefined : parseInt(value, 10);
  pushHistory();
  renderEmailBlocks();
  renderStylesPanel();
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

async function applyThemeToEditorById() {
  const select = document.getElementById('email-editor-theme-select');
  const variantSelect = document.getElementById('email-editor-theme-variant-select');
  const id = select && select.value ? parseInt(select.value, 10) : null;
  const variantIndex = variantSelect && variantSelect.value !== '' ? parseInt(variantSelect.value, 10) : 0;
  if (!id) {
    showToast('Select a theme first', 'info');
    return;
  }
  const theme = (editorState.themes || []).find(t => t.id === id);
  if (theme) {
    applyThemeToEditor(theme, variantIndex);
    editorState.appliedThemeId = theme.id;
    editorState.appliedThemeVariantIndex = variantIndex;
    showToast(`Applied theme: ${theme.name || 'Theme'}`);
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/email-themes/${id}`);
    const data = await res.json();
    if (res.ok && data) {
      editorState.themes = editorState.themes || [];
      if (!editorState.themes.some(t => t.id === data.id)) editorState.themes.push(data);
      applyThemeToEditor(data, variantIndex);
      editorState.appliedThemeId = data.id;
      editorState.appliedThemeVariantIndex = variantIndex;
      showToast(`Applied theme: ${data.name || 'Theme'}`);
    } else {
      showToast('Theme not found', 'error');
    }
  } catch (e) {
    showToast('Failed to load theme', 'error');
  }
}

function applyThemeToEditor(theme, variantIndex) {
  if (!theme) return;
  const variant = (theme.variants && theme.variants[variantIndex]) ? theme.variants[variantIndex] : null;
  const body = (variant && variant.body) ? { ...theme.body, ...variant.body } : (theme.body || {});
  const colors = (variant && variant.colors) ? { ...theme.colors, ...variant.colors } : (theme.colors || {});
  const comp = (variant && variant.components) ? { ...theme.components, ...variant.components } : (theme.components || {});
  const typography = theme.typography || {};
  editorState.bodyStyle = editorState.bodyStyle || {};
  editorState.bodyStyle.backgroundColor = body.backgroundColor || editorState.bodyStyle.backgroundColor;
  editorState.bodyStyle.viewportColor = body.viewportColor || editorState.bodyStyle.viewportColor;
  editorState.bodyStyle.padding = body.padding || editorState.bodyStyle.padding;
  editorState.bodyStyle.maxWidth = body.maxWidth != null ? (String(body.maxWidth) + (body.widthUnit || 'px')) : editorState.bodyStyle.maxWidth;
  editorState.bodyStyle.widthUnit = body.widthUnit || editorState.bodyStyle.widthUnit;
  editorState.bodyStyle.align = body.align || editorState.bodyStyle.align;
  editorState.bodyStyle.fontFamily = body.fontFamily || editorState.bodyStyle.fontFamily;
  editorState.blocks.forEach(block => {
    if (block.styleUnlocked) return;
    block.style = block.style || {};
    if (block.type === 'button') {
      const btn = comp.button || {};
      block.style.buttonColor = btn.backgroundColor || block.style.buttonColor || colors.primary;
      block.style.color = btn.color || block.style.color || '#ffffff';
      block.style.borderRadius = btn.borderRadius || block.style.borderRadius;
      block.style.padding = btn.padding || block.style.padding;
    } else if (block.type === 'divider') {
      const div = comp.divider || {};
      block.style.borderColor = div.borderColor || block.style.borderColor;
      if (div.thickness != null) block.thickness = div.thickness;
    } else if (block.type === 'text') {
      const hl = block.headingLevel;
      const headingStyle = (hl === 1 && typography.heading1) ? typography.heading1 : (hl === 2 && typography.heading2) ? typography.heading2 : (hl === 3 && typography.heading3) ? typography.heading3 : null;
      if (headingStyle) {
        block.style.fontSize = headingStyle.fontSize || block.style.fontSize;
        block.style.fontFamily = headingStyle.fontFamily || block.style.fontFamily;
        block.style.fontWeight = headingStyle.fontWeight || block.style.fontWeight;
      }
      const txt = comp.text || {};
      block.style.color = txt.color || block.style.color || colors.text;
      block.style.fontFamily = block.style.fontFamily || txt.fontFamily || typography.fontFamily;
      block.style.fontSize = block.style.fontSize || txt.fontSize || typography.fontSizeBase;
      block.style.lineHeight = txt.lineHeight || block.style.lineHeight;
    }
  });
  renderEmailBlocks();
  pushHistory();
  syncBodyWidthControls();
  renderStylesPanel();
}

async function generateThemeFromContent() {
  const body = editorState.bodyStyle || {};
  const blocks = editorState.blocks || [];
  const firstButton = blocks.find(b => b.type === 'button');
  const firstDivider = blocks.find(b => b.type === 'divider');
  const firstText = blocks.find(b => b.type === 'text');
  const btnStyle = firstButton && firstButton.style ? firstButton.style : {};
  const divStyle = firstDivider && firstDivider.style ? firstDivider.style : {};
  const txtStyle = firstText && firstText.style ? firstText.style : {};
  const theme = {
    name: 'From content ' + new Date().toLocaleDateString(),
    description: 'Generated from current email content',
    body: {
      backgroundColor: body.backgroundColor || '#ffffff',
      viewportColor: body.viewportColor || '#f0f0f0',
      padding: body.padding || '24px',
      maxWidth: String(parseInt(body.maxWidth || '640', 10)),
      widthUnit: body.widthUnit || 'px',
      align: body.align || 'center',
      fontFamily: body.fontFamily || 'Arial, sans-serif'
    },
    colors: {
      primary: btnStyle.buttonColor || '#1473E6',
      secondary: '#6B7280',
      text: txtStyle.color || '#1f2933',
      textMuted: '#6B7280'
    },
    typography: {
      fontFamily: body.fontFamily || 'Arial, sans-serif',
      fontSizeBase: txtStyle.fontSize || '14px',
      heading1: { fontSize: '28px', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' },
      heading2: { fontSize: '22px', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' },
      heading3: { fontSize: '18px', fontFamily: 'Arial, sans-serif', fontWeight: '600' }
    },
    components: {
      button: {
        backgroundColor: btnStyle.buttonColor || '#1473E6',
        color: btnStyle.color || '#ffffff',
        borderRadius: btnStyle.borderRadius || '6px',
        padding: btnStyle.padding || '12px 24px',
        fontFamily: 'Arial, sans-serif'
      },
      divider: { borderColor: divStyle.borderColor || '#E5E7EB', thickness: firstDivider && firstDivider.thickness != null ? firstDivider.thickness : 1 },
      text: {
        color: txtStyle.color || '#1f2933',
        fontFamily: txtStyle.fontFamily || 'Arial, sans-serif',
        fontSize: txtStyle.fontSize || '14px',
        lineHeight: txtStyle.lineHeight || '1.5'
      }
    }
  };
  try {
    const res = await fetch(`${API_BASE}/email-themes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(theme) });
    const created = await res.json();
    if (res.ok && created && created.id) {
      editorState.themes = editorState.themes || [];
      editorState.themes.unshift(created);
      applyThemeToEditor(created);
      showToast('Theme created and applied');
      renderStylesPanel();
    } else {
      showToast('Failed to create theme', 'error');
    }
  } catch (e) {
    showToast('Failed to create theme', 'error');
  }
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
              <summary>Column ${idx + 1} ${style.width ? '(' + style.width + ')' : ''}</summary>
              <div class="inspector-fields">
                <div class="form-group inline">
                  <label class="form-label">Width</label>
                  <input type="text" class="form-input" value="${style.width || ''}" placeholder="auto" oninput="updateColumnStyleLivePreview('${block.id}', ${idx}, 'width', this.value)" onchange="updateColumnStyle('${block.id}', ${idx}, 'width', this.value)">
                </div>
                <div class="form-group">
                  <label class="form-label">Background</label>
                  ${_colorInputRow(block.id + ',' + idx, 'backgroundColor', style.backgroundColor, '#ffffff', 'updateColumnStyleLivePreviewWrap', 'updateColumnStyleWrap')}
                </div>
                <div class="form-group">
                  <label class="form-label">Vertical align</label>
                  <select class="form-input" oninput="updateColumnStyleLivePreview('${block.id}', ${idx}, 'verticalAlign', this.value)" onchange="updateColumnStyle('${block.id}', ${idx}, 'verticalAlign', this.value)">
                    <option value="top" ${(style.verticalAlign || 'top') === 'top' ? 'selected' : ''}>Top</option>
                    <option value="middle" ${style.verticalAlign === 'middle' ? 'selected' : ''}>Middle</option>
                    <option value="bottom" ${style.verticalAlign === 'bottom' ? 'selected' : ''}>Bottom</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Border</label>
                  <input type="text" class="form-input" value="${style.border || ''}" oninput="updateColumnStyleLivePreview('${block.id}', ${idx}, 'border', this.value)" onchange="updateColumnStyle('${block.id}', ${idx}, 'border', this.value)" placeholder="1px solid #E5E7EB">
                </div>
                <div class="form-group inline">
                  <label class="form-label">Radius</label>
                  <input type="number" class="form-input" value="${parseInt(style.borderRadius || '0', 10)}" min="0" oninput="updateColumnStyleLivePreview('${block.id}', ${idx}, 'borderRadius', this.value + 'px')" onchange="updateColumnStyle('${block.id}', ${idx}, 'borderRadius', this.value + 'px')" placeholder="0">
                </div>
                <div class="form-group inline">
                  <label class="form-label">Padding</label>
                  <input type="number" class="form-input" value="${parseInt(style.padding || '8', 10)}" min="0" oninput="updateColumnStyleLivePreview('${block.id}', ${idx}, 'padding', this.value + 'px')" onchange="updateColumnStyle('${block.id}', ${idx}, 'padding', this.value + 'px')" placeholder="8">
                </div>
              </div>
            </details>
          `;
        }).join('')}
      </div>
    </details>
  `;
}

// Wrapper for color-input-row which passes 'blockId,colIdx' as first arg
function updateColumnStyleWrap(compositeId, field, value) {
  const [blockId, colIdx] = compositeId.split(',');
  updateColumnStyle(blockId, parseInt(colIdx, 10), field, value);
}
function updateColumnStyleLivePreviewWrap(compositeId, field, value) {
  const [blockId, colIdx] = compositeId.split(',');
  updateColumnStyleLivePreview(blockId, parseInt(colIdx, 10), field, value);
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

/** Extract a plain-text summary of email content for AI (strip HTML, max length). */
function getEmailContentSummary(blocks) {
  if (!Array.isArray(blocks) || !blocks.length) return '';
  const parts = [];
  const stripHtml = (s) => (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const add = (text, maxLen = 200) => {
    const t = stripHtml(text);
    if (t) parts.push(maxLen ? t.slice(0, maxLen) + (t.length > maxLen ? '…' : '') : t);
  };
  function walk(list) {
    (list || []).forEach(block => {
      if (block.type === 'text') add(block.content, 300);
      if (block.type === 'image') add(block.alt || 'Image', 80);
      if (block.type === 'button') {
        add(block.text, 60);
        if (block.url) add(`(link: ${block.url})`, 80);
      }
      if (block.type === 'form') add(block.formTitle, 80);
      if (block.type === 'html') add(block.html, 150);
      if (block.type === 'social') add('Social links', 20);
      if (block.type === 'offer') add('Offer decision block', 20);
      if (block.type === 'fragment') add(`Fragment: ${block.fragmentName || 'Untitled'}`, 60);
      if (block.type === 'structure' || block.type === 'container') {
        (block.columns || []).forEach(col => walk(col.blocks || []));
      }
    });
  }
  walk(blocks);
  const full = parts.join(' | ');
  return full.length > 1500 ? full.slice(0, 1500) + '…' : full;
}

async function generateSubjectForDelivery() {
  const output = document.getElementById('delivery-subject-suggestions');
  if (!output) return;
  const productName = (editorState.delivery && editorState.delivery.name) || 'Campaign';
  const targetAudience = getSelectedDeliveryAudienceLabel();
  const contentSummary = getEmailContentSummary(editorState.blocks || []);
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/ai/generate-subject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, targetAudience, contentSummary, count: 5 })
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
  const allowed = new Set(['text', 'image', 'button', 'form', 'embed', 'container', 'structure', 'divider', 'spacer', 'html', 'social', 'fragment', 'offer']);
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
    if (block.type === 'offer') {
      if (!block.decisionId) {
        issues.push({ severity: 'error', message: 'Offer block has no decision selected. It will not show any offers.' });
      } else {
        const dec = (editorState.offerDecisions || []).find(d => d.id === block.decisionId);
        if (!dec) {
          const allDec = (editorState._allOfferDecisions || []).find(d => d.id === block.decisionId);
          if (allDec) {
            issues.push({ severity: 'error', message: `Offer decision "${allDec.name}" is ${allDec.status} (not live). Activate it first.` });
          } else {
            issues.push({ severity: 'error', message: 'Selected offer decision no longer exists.' });
          }
        }
      }
      if (!block.placementId) {
        issues.push({ severity: 'warning', message: 'Offer block has no placement selected.' });
      }
      if (!block.offerFallbackHtml) {
        issues.push({ severity: 'warning', message: 'Offer block has no fallback HTML. If no offers qualify, the block will be empty.' });
      }
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
  const returnMode = params.get('return') || '';
  const step = params.get('step') || '3';

  // Modal / iframe mode — send postMessage to parent
  if (returnMode === 'modal' && window.parent && window.parent !== window) {
    if (editorState.offerRepMode) {
      const htmlOutput = editorState.htmlOverride || generateEmailHtml(editorState.blocks);
      window.parent.postMessage({
        type: 'closeOfferRepEditor',
        offerId: editorState.offerId,
        repId: editorState.repId,
        content: htmlOutput,
        blocks: editorState.blocks
      }, '*');
    } else if (editorState.fragmentMode) {
      window.parent.postMessage({ type: 'closeFragmentEditor' }, '*');
    } else if (editorState.landingPageMode) {
      window.parent.postMessage({ type: 'closeLandingPageEditor', landingPageId: editorState.landingPageId }, '*');
    } else if (editorState.templateMode) {
      window.parent.postMessage({ type: 'closeTemplateEditor', templateId: editorState.templateId }, '*');
    } else {
      window.parent.postMessage({ type: 'closeEmailEditor', deliveryId: editorState.deliveryId, step: 3 }, '*');
    }
    return;
  }

  // Route back based on editor mode — each mode goes to its own listing page
  if (editorState.offerRepMode) {
    window.location.href = '/?view=offers';
    return;
  }
  if (editorState.templateMode) {
    window.location.href = '/?view=content-templates';
    return;
  }
  if (editorState.fragmentMode || returnMode === 'fragments') {
    window.location.href = '/?view=fragments';
    return;
  }
  if (editorState.landingPageMode || returnMode === 'landing-pages') {
    window.location.href = '/?view=landing-pages';
    return;
  }

  // Default: back to deliveries
  const view = returnMode || 'deliveries';
  const url = `/?view=${encodeURIComponent(view)}&deliveryId=${encodeURIComponent(editorState.deliveryId)}&step=${encodeURIComponent(step)}`;
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

// ── Offer Decision Block helpers ──

let _readinessCheckVersion = 0;
async function runOfferReadinessCheck(blockId) {
  const context = findBlockContext(blockId);
  if (!context?.block) return;
  const block = context.block;
  const panel = document.getElementById(`offer-readiness-panel-${blockId}`);
  if (!panel) return;

  if (!block.decisionId || !block.placementId) {
    panel.innerHTML = '<div style="color:var(--text-secondary);font-size:12px;padding:4px 0">Select a decision and placement to run a readiness check.</div>';
    return;
  }

  const version = ++_readinessCheckVersion;
  panel.innerHTML = '<div style="color:var(--text-secondary);font-size:12px;padding:4px 0">Checking configuration...</div>';

  try {
    const resp = await fetchWithTimeout(`${API_BASE}/decisions/${block.decisionId}/readiness?placement_id=${block.placementId}`);
    if (_readinessCheckVersion !== version) return;
    if (!resp.ok) {
      panel.innerHTML = '<div style="color:#c62828;font-size:12px">Could not check readiness.</div>';
      return;
    }
    const data = await resp.json();
    const checks = data.checks || [];
    const allOk = checks.every(c => c.ok);

    let html = '';
    if (allOk) {
      html += '<div style="padding:6px 10px;background:#e8f5e9;border-radius:6px;margin-bottom:6px;font-size:12px;color:#2e7d32;font-weight:600">Ready to deliver offers</div>';
    }

    html += '<div class="offer-readiness-checks" style="display:flex;flex-direction:column;gap:4px">';
    for (const check of checks) {
      const icon = check.ok
        ? '<span style="color:#2e7d32;font-weight:700;margin-right:6px">&#10003;</span>'
        : check.severity === 'error'
          ? '<span style="color:#c62828;font-weight:700;margin-right:6px">&#10007;</span>'
          : '<span style="color:#e65100;font-weight:700;margin-right:6px">!</span>';
      const labelColor = check.ok ? 'var(--text-primary)' : check.severity === 'error' ? '#c62828' : '#e65100';
      html += `<div style="font-size:12px;line-height:1.5;display:flex;align-items:flex-start">
        ${icon}<span style="color:${labelColor}">${check.label}${check.fix ? '<br><em style=\"font-weight:400;color:var(--text-secondary)\">' + check.fix + '</em>' : ''}</span>
      </div>`;
    }
    html += '</div>';
    panel.innerHTML = html;
  } catch (e) {
    if (_readinessCheckVersion !== version) return;
    panel.innerHTML = '<div style="color:#c62828;font-size:12px">Readiness check failed.</div>';
  }
}

function onOfferDecisionChange(blockId, decisionIdStr) {
  const decisionId = decisionIdStr ? parseInt(decisionIdStr, 10) : null;
  const context = findBlockContext(blockId);
  if (!context?.block) return;
  context.block.decisionId = decisionId;
  if (decisionId) {
    const decision = editorState.offerDecisions.find(d => d.id === decisionId);
    context.block.offerLabel = decision ? decision.name : '';
    const configs = decision?.placement_configs || [];
    if (configs.length === 1) {
      context.block.placementId = configs[0].placement_id;
    } else if (context.block.placementId) {
      const stillValid = configs.some(pc => pc.placement_id === context.block.placementId);
      if (!stillValid) context.block.placementId = null;
    }
  } else {
    context.block.placementId = null;
    context.block.offerLabel = '';
  }
  renderEmailBlocks();
  switchEditorTab('styles');
  pushHistory();
  runOfferReadinessCheck(blockId);
}

function onOfferPlacementChange(blockId, placementIdStr) {
  const placementId = placementIdStr ? parseInt(placementIdStr, 10) : null;
  const context = findBlockContext(blockId);
  if (!context?.block) return;
  context.block.placementId = placementId;
  renderEmailBlocks();
  switchEditorTab('styles');
  pushHistory();
  runOfferReadinessCheck(blockId);
}

