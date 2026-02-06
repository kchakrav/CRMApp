const blocks = [];

function initDesigner() {
  const canvas = document.getElementById('canvas');
  document.querySelectorAll('.block-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.dataset.block);
    });
  });
  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    addBlock(type);
  });
  renderBlocks();
}

function addBlock(type) {
  const id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const block = { id, type };
  if (type === 'text') block.content = 'Add your text here';
  if (type === 'image') { block.src = 'https://via.placeholder.com/600x200'; block.alt = 'Image'; }
  if (type === 'button') { block.text = 'Click me'; block.url = 'https://example.com'; }
  if (type === 'divider') block.thickness = 1;
  if (type === 'spacer') block.height = 20;
  if (type === 'html') block.html = '<div>Custom HTML</div>';
  blocks.push(block);
  renderBlocks();
}

function updateBlock(id, field, value) {
  const block = blocks.find(b => b.id === id);
  if (!block) return;
  block[field] = value;
  renderBlocks();
}

function deleteBlock(id) {
  const idx = blocks.findIndex(b => b.id === id);
  if (idx === -1) return;
  blocks.splice(idx, 1);
  renderBlocks();
}

function renderBlocks() {
  const canvas = document.getElementById('canvas');
  if (!blocks.length) {
    canvas.innerHTML = '<div class="email-canvas-empty">Drag blocks to build your email</div>';
    updatePreview();
    return;
  }
  canvas.innerHTML = blocks.map(block => {
    let editor = '';
    if (block.type === 'text') {
      editor = `<textarea rows="3" oninput="updateBlock('${block.id}','content', this.value)">${block.content || ''}</textarea>`;
    } else if (block.type === 'image') {
      editor = `
        <input type="text" placeholder="Image URL" value="${block.src || ''}" oninput="updateBlock('${block.id}','src', this.value)">
        <input type="text" placeholder="Alt text" value="${block.alt || ''}" oninput="updateBlock('${block.id}','alt', this.value)">
      `;
    } else if (block.type === 'button') {
      editor = `
        <input type="text" placeholder="Button text" value="${block.text || ''}" oninput="updateBlock('${block.id}','text', this.value)">
        <input type="text" placeholder="URL" value="${block.url || ''}" oninput="updateBlock('${block.id}','url', this.value)">
      `;
    } else if (block.type === 'divider') {
      editor = `<input type="number" min="1" value="${block.thickness || 1}" oninput="updateBlock('${block.id}','thickness', this.value)">`;
    } else if (block.type === 'spacer') {
      editor = `<input type="number" min="4" value="${block.height || 20}" oninput="updateBlock('${block.id}','height', this.value)">`;
    } else if (block.type === 'html') {
      editor = `<textarea rows="3" oninput="updateBlock('${block.id}','html', this.value)">${block.html || ''}</textarea>`;
    }
    return `
      <div class="email-block">
        <div class="email-block-header">
          <strong>${block.type.toUpperCase()}</strong>
          <button class="btn btn-secondary" onclick="deleteBlock('${block.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
        </div>
        <div class="email-block-body">${editor}</div>
      </div>
    `;
  }).join('');
  updatePreview();
}

function generateHtml() {
  const html = blocks.map(block => {
    if (block.type === 'text') {
      return `<p style="font-family: Arial, sans-serif; font-size: 14px;">${block.content || ''}</p>`;
    }
    if (block.type === 'image') {
      return `<img src="${block.src || ''}" alt="${block.alt || ''}" style="max-width: 100%; display:block;">`;
    }
    if (block.type === 'button') {
      return `<a href="${block.url || '#'}" style="display:inline-block;padding:10px 16px;background:#1473E6;color:#fff;text-decoration:none;border-radius:4px;">${block.text || 'Button'}</a>`;
    }
    if (block.type === 'divider') {
      return `<hr style="border:none;border-top:${block.thickness || 1}px solid #e1e1e1;">`;
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

function updatePreview() {
  const preview = document.getElementById('preview');
  preview.innerHTML = generateHtml();
}

function saveDraft() {
  localStorage.setItem('emailDesignerBlocks', JSON.stringify(blocks));
  alert('Draft saved');
}

function loadDraft() {
  const raw = localStorage.getItem('emailDesignerBlocks');
  if (!raw) return;
  const data = JSON.parse(raw);
  blocks.splice(0, blocks.length, ...data);
  renderBlocks();
}

function downloadHtml() {
  const html = generateHtml();
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'email.html';
  a.click();
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', initDesigner);
