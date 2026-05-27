(function () {
  const API_BASE = '/api';

  const fileInput = document.getElementById('wjv-file');
  const paste = document.getElementById('wjv-paste');
  const btn = document.getElementById('wjv-open');
  const errEl = document.getElementById('wjv-error');
  const statusEl = document.getElementById('wjv-status');

  function showError(msg) {
    errEl.textContent = msg || '';
    errEl.classList.toggle('show', !!msg);
  }

  function setStatus(t) {
    statusEl.textContent = t || '';
  }

  async function readBody() {
    const pasted = (paste.value || '').trim();
    if (pasted) {
      try {
        return JSON.parse(pasted);
      } catch (e) {
        throw new Error('Pasted content is not valid JSON: ' + e.message);
      }
    }
    const f = fileInput.files && fileInput.files[0];
    if (!f) {
      throw new Error('Choose a JSON file or paste JSON.');
    }
    const text = await f.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error('File is not valid JSON: ' + e.message);
    }
  }

  btn.addEventListener('click', async () => {
    showError('');
    setStatus('Parsing…');
    btn.disabled = true;
    try {
      const body = await readBody();
      setStatus('Building graph…');
      const res = await fetch(`${API_BASE}/workflows/preview-json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || res.statusText || 'Preview request failed');
      }
      const payload = {
        title: data.workflowName || 'Workflow preview',
        description: data.workflowDescription || '',
        warnings: data.warnings || [],
        orchestration: data.orchestration || { nodes: [], connections: [] }
      };
      try {
        sessionStorage.setItem('orchestrationPreviewPayload', JSON.stringify(payload));
      } catch (e) {
        throw new Error('Graph is too large for browser storage. Try a smaller export.');
      }
      window.location.href = '/orchestration.html?preview=1';
    } catch (e) {
      setStatus('');
      showError(e.message || String(e));
    } finally {
      btn.disabled = false;
    }
  });
})();
