/* Skills & Agents view loaders */

/* ───── Prompt Refiner ───── */
window._refinePrompt = async function (inputEl, fieldType, contextGetter) {
  const text = inputEl.value || inputEl.textContent || '';
  if (!text.trim()) {
    if (typeof showToast === 'function') showToast('Enter some text first', 'info');
    return;
  }
  const btn = inputEl.parentElement.querySelector('.cmp-refine-btn');
  if (btn) { btn.classList.add('cmp-refine-loading'); btn.disabled = true; }

  try {
    const body = { text: text.trim(), fieldType };
    if (contextGetter) body.context = typeof contextGetter === 'function' ? contextGetter() : contextGetter;

    const r = await fetch('/api/ai/refine-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error('Refine failed');
    const data = await r.json();
    if (data.refined && data.refined !== text.trim()) {
      inputEl.value = data.refined;
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      if (typeof showToast === 'function') showToast('Text refined', 'success');
    } else {
      if (typeof showToast === 'function') showToast('Text already looks good', 'info');
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast('Refine error: ' + err.message, 'error');
  } finally {
    if (btn) { btn.classList.remove('cmp-refine-loading'); btn.disabled = false; }
  }
};

function _refineIcon(fieldType) {
  return `<button type="button" class="cmp-refine-btn" title="Refine with AI" onclick="event.stopPropagation();_refinePrompt(this.parentElement.querySelector(&quot;textarea,input&quot;),&quot;${fieldType}&quot;)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.21 1.21 0 0 0 1.72 0L21.64 5.36a1.21 1.21 0 0 0 0-1.72z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>
  </button>`;
}

const SKILL_CATEGORIES = {
  targeting: { label: 'Targeting' },
  content: { label: 'Content' },
  timing: { label: 'Timing' },
  channel: { label: 'Channel' },
  conversion: { label: 'Conversion' }
};

const SKILL_ACTIONS = ['wait', 'send', 'check', 'filter', 'split', 'enrich', 'target', 'track'];
const ROLE_OPTIONS = ['orchestrator', 'executor', 'reviewer', 'analyst', 'timing', 'content', 'channel', 'targeting', 'conversion'];

function categoryBadge(cat) {
  const label = SKILL_CATEGORIES[cat]?.label || (cat || 'Other');
  return `<span class="sa-chip sa-chip-category">${esc(label)}</span>`;
}

function statusBadge(status) {
  return `<span class="sa-chip sa-chip-status status-${esc(status || 'draft')}">${esc(status || 'draft')}</span>`;
}

function sectionHeader(title, subtitle) {
  return `
    <div class="sa-page-header">
      <h2>${esc(title)}</h2>
      <p>${esc(subtitle)}</p>
    </div>
  `;
}

let agentSkillFilters = { category: 'all', status: 'all', search: '' };
let agentFilters = { status: 'all', search: '', type: 'all' };
let _visibleSkillsForDownload = [];

function sanitizeFilename(name) {
  return String(name || 'skill')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-_\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function downloadTextFile(filename, content, mime = 'text/markdown;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function _wfLabel(id) {
  if (!id) return '-';
  const name = _workflowNameCache[id];
  return name ? `${name} (#${id})` : `Workflow #${id}`;
}

function skillToMarkdown(skill) {
  const lines = [];
  const category = SKILL_CATEGORIES[skill.category]?.label || (skill.category || 'Unknown');
  const status = skill.status || 'draft';
  const sourceWf = skill.source_workflow_id ? _wfLabel(skill.source_workflow_id) : 'Not linked';
  const steps = Array.isArray(skill.steps) ? skill.steps : [];
  const nowIso = new Date().toISOString();
  const safeName = String(skill.name || 'Untitled Skill').replace(/"/g, '\\"');

  lines.push('---');
  lines.push('schema: "skill-v1"');
  lines.push(`name: "${safeName}"`);
  lines.push(`category: "${String(skill.category || 'unknown')}"`);
  lines.push(`status: "${String(status)}"`);
  lines.push(`source_workflow: "${String(sourceWf)}"`);
  lines.push(`generated_at: "${nowIso}"`);
  lines.push('---');
  lines.push('');

  lines.push(`# ${skill.name || 'Untitled Skill'}`);
  lines.push('');
  lines.push('## Purpose');
  lines.push(skill.description || 'No description provided.');
  lines.push('');

  lines.push('## Metadata');
  lines.push(`- Category: ${category}`);
  lines.push(`- Status: ${status}`);
  lines.push(`- Source Workflow: ${sourceWf}`);
  lines.push('');

  lines.push('## Steps');
  if (steps.length === 0) {
    lines.push('- No steps defined.');
  } else {
    steps.forEach((step, idx) => {
      const action = step.action || 'check';
      const channelSuffix = step.channel ? ` [${step.channel}]` : '';
      lines.push(`${idx + 1}. **${action}**${channelSuffix} - ${step.instruction || ''}`);
    });
  }
  lines.push('');

  lines.push('## Inputs');
  if (skill.input_schema && Object.keys(skill.input_schema).length > 0) {
    lines.push('```json');
    lines.push(JSON.stringify(skill.input_schema, null, 2));
    lines.push('```');
  } else {
    lines.push('- No input schema defined.');
  }
  lines.push('');

  lines.push('## Outputs');
  if (skill.output_schema && Object.keys(skill.output_schema).length > 0) {
    lines.push('```json');
    lines.push(JSON.stringify(skill.output_schema, null, 2));
    lines.push('```');
  } else {
    lines.push('- No output schema defined.');
  }
  lines.push('');

  lines.push('## Usage Notes');
  lines.push('- Treat placeholders in steps (for example `{discount}`) as runtime parameters.');
  lines.push('- Keep step order unless your orchestration runtime explicitly supports reordering.');
  lines.push('- Validate required input fields before execution.');
  lines.push('');

  lines.push('## Prompt Snippet');
  lines.push('```text');
  lines.push(`Use skill "${skill.name || 'Untitled Skill'}" to achieve the purpose above.`);
  lines.push('Follow the steps in order, filling placeholders from provided inputs.');
  lines.push('Return structured results matching the output schema.');
  lines.push('```');
  lines.push('');

  return lines.join('\n').trim() + '\n';
}

function agentToMarkdown(agent) {
  const lines = [];
  const sas = Array.isArray(agent.sub_agents) ? agent.sub_agents : [];
  const lns = Array.isArray(agent.logic_nodes) ? agent.logic_nodes : [];
  const nowIso = new Date().toISOString();
  const safeName = String(agent.name || 'Untitled Agent').replace(/"/g, '\\"');

  lines.push('---');
  lines.push('schema: "agent-v1"');
  lines.push(`name: "${safeName}"`);
  lines.push(`status: "${agent.status || 'draft'}"`);
  lines.push(`sub_agents: ${sas.length}`);
  lines.push(`logic_nodes: ${lns.length}`);
  lines.push(`generated_at: "${nowIso}"`);
  lines.push('---');
  lines.push('');
  lines.push(`# ${agent.name || 'Untitled Agent'}`);
  lines.push('');
  lines.push('## Goal');
  lines.push(agent.goal || 'No goal defined.');
  lines.push('');
  lines.push('## Description');
  lines.push(agent.description || 'No description provided.');
  lines.push('');

  lines.push('## Sub-agents');
  if (sas.length === 0) {
    lines.push('- No sub-agents defined.');
  } else {
    sas.forEach((sa, idx) => {
      lines.push(`### ${idx + 1}. ${sa.name || 'Unnamed'} (${sa.role || 'executor'})`);
      lines.push(sa.description || 'No description.');
      if (sa.system_instructions) {
        lines.push('');
        lines.push('**System Instructions:**');
        lines.push('```text');
        lines.push(sa.system_instructions);
        lines.push('```');
      }
      lines.push('');
    });
  }

  if (lns.length > 0) {
    lines.push('## Logic Nodes');
    lns.forEach(n => {
      const meta = LOGIC_NODE_TYPES[n.type] || {};
      lines.push(`- **${meta.label || n.type}** (slot ${n.slot}): ${n.label || 'Unlabeled'}`);
      const c = n.config || {};
      if (n.type === 'condition' && c.expression) {
        lines.push(`  - Expression: \`${c.expression}\``);
        const tSA = c.then_target !== null && c.then_target !== undefined && sas[c.then_target] ? sas[c.then_target].name : 'Continue';
        const eSA = c.else_target !== null && c.else_target !== undefined && sas[c.else_target] ? sas[c.else_target].name : 'Continue';
        lines.push(`  - Then (${c.then_label || 'Yes'}) → ${tSA}`);
        lines.push(`  - Else (${c.else_label || 'No'}) → ${eSA}`);
      }
      if (n.type === 'gate' && c.expression) {
        const fbAction = c.fallback === 'route' && c.fallback_target !== null && sas[c.fallback_target] ? `Route to ${sas[c.fallback_target].name}` : (c.fallback || 'skip');
        lines.push(`  - Guard: \`${c.expression}\` → fallback: ${fbAction}`);
      }
      if (n.type === 'loop') lines.push(`  - ${c.loop_type === 'foreach' ? 'For each: ' + (c.iterator || '...') : 'Count: ' + (c.count || 3)} (max ${c.max_iterations || 10})`);
      if (n.type === 'delay') lines.push(`  - Wait: ${c.duration || 1} ${c.unit || 'hours'}`);
      if (n.type === 'transform' && c.mappings) c.mappings.forEach(m => lines.push(`  - \`${m.from}\` → \`${m.to}\``));
    });
    lines.push('');
  }

  const g = agent.guardrails || {};
  lines.push('## Guardrails');
  lines.push(`- Max messages/day: ${g.max_messages_per_contact_per_day ?? 'Not set'}`);
  const cl = g.channel_limits || {};
  lines.push(`- Channel limits: email=${cl.email ?? '—'}, sms=${cl.sms ?? '—'}, push=${cl.push ?? '—'}`);
  lines.push(`- Require approval: ${g.require_approval ? 'Yes' : 'No'}`);
  if (g.budget_limit) lines.push(`- Budget limit: $${g.budget_limit}`);
  lines.push('');

  return lines.join('\n').trim() + '\n';
}

/* ───── Skills Listing ───── */
window.loadAgentSkills = async function () {
  const content = document.getElementById('content');
  try {
    if (!Object.keys(_workflowNameCache).length) {
      try { const wfs = await (await fetch('/api/workflows')).json(); (Array.isArray(wfs) ? wfs : wfs.workflows || []).forEach(w => { _workflowNameCache[w.id] = w.name || w.campaign_name || ''; }); } catch (_) {}
    }
    const response = await fetch('/api/agent-skills');
    const allSkills = await response.json();

    let skills = allSkills.filter(s => {
      if (agentSkillFilters.category !== 'all' && s.category !== agentSkillFilters.category) return false;
      if (agentSkillFilters.status !== 'all' && (s.status || 'draft') !== agentSkillFilters.status) return false;
      if (agentSkillFilters.search) {
        const q = agentSkillFilters.search.toLowerCase();
        const name = (s.name || '').toLowerCase();
        const desc = (s.description || '').toLowerCase();
        if (!name.includes(q) && !desc.includes(q)) return false;
      }
      return true;
    });

    skills = skills.map(s => ({
      ...s,
      _steps_count: Array.isArray(s.steps) ? s.steps.length : 0
    }));

    if (!currentTableSort.column) {
      currentTableSort.column = 'updated_at';
      currentTableSort.direction = 'desc';
    }
    skills = applySorting(skills, currentTableSort.column || 'updated_at');
    _visibleSkillsForDownload = skills;

    const filterTags = [];
    if (agentSkillFilters.search) filterTags.push({ key: 'search', label: 'Search', value: agentSkillFilters.search });
    if (agentSkillFilters.category !== 'all') filterTags.push({ key: 'category', label: 'Category', value: agentSkillFilters.category });
    if (agentSkillFilters.status !== 'all') filterTags.push({ key: 'status', label: 'Status', value: agentSkillFilters.status });

    const statusMap = { active: 'in-progress', draft: 'draft', archived: 'stopped', paused: 'paused' };
    const skillsViewMode = window._contentListViewMode?.['agent-skills'] || 'grid';
    const rows = skills.map(s => {
      const stepsCount = s._steps_count;
      const actions = [
        { icon: (window.ICONS?.edit || ''), label: 'Edit', onclick: `navigateTo('agent-skills', 'edit', ${s.id})` },
        { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>', label: 'Download .md', onclick: `downloadSkillMarkdown(${s.id})` },
        { divider: true },
        { icon: (window.ICONS?.trash || ''), label: 'Delete', onclick: `deleteSkill(${s.id})`, danger: true }
      ];
      return `
        <tr>
          <td data-column-id="name">${createTableLink(s.name || 'Untitled Skill', `navigateTo('agent-skills', 'edit', ${s.id})`)}<div class="table-subtext">${esc((s.description || '').slice(0, 90))}</div></td>
          <td data-column-id="category">${categoryBadge(s.category)}</td>
          <td data-column-id="status">${createStatusIndicator(statusMap[s.status] || 'draft', s.status || 'draft')}</td>
          <td data-column-id="_steps_count">${stepsCount}</td>
          <td data-column-id="workflow">${_wfLabel(s.source_workflow_id)}</td>
          <td data-column-id="updated_at">${s.updated_at ? new Date(s.updated_at).toLocaleString() : '-'}</td>
          <td data-column-id="created_by">${s.created_by || 'System'}</td>
          <td>${createActionMenu(s.id, actions)}</td>
        </tr>
      `;
    }).join('');

    const skillCards = skills.map(s => {
      const stepsCount = s._steps_count;
      const workflowText = s.source_workflow_id ? _wfLabel(s.source_workflow_id) : 'Workflow: -';
      const updatedText = s.updated_at ? new Date(s.updated_at).toLocaleDateString() : '-';
      return `
        <article class="inventory-card agent-inventory-card" onclick="navigateTo('agent-skills', 'edit', ${s.id})">
          <div class="inventory-icon-actions">
            <button class="inv-icon-btn" onclick="event.stopPropagation(); navigateTo('agent-skills','edit',${s.id})" title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="inv-icon-btn" onclick="event.stopPropagation(); downloadSkillMarkdown(${s.id})" title="Download .md"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
            <button class="inv-icon-btn inv-icon-btn-danger" onclick="event.stopPropagation(); deleteSkill(${s.id})" title="Delete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
          </div>
          <div class="inventory-card-body">
            <div class="inventory-card-name">${esc(s.name || 'Untitled Skill')}</div>
            <div class="inventory-card-meta">${categoryBadge(s.category)} ${statusBadge(s.status || 'draft')}</div>
            <div class="inventory-card-meta">${esc((s.description || '').slice(0, 120)) || 'No description'}</div>
            <div class="inventory-card-meta">${stepsCount} step${stepsCount !== 1 ? 's' : ''} · ${workflowText}</div>
            <div class="inventory-card-meta">Updated: ${updatedText}</div>
          </div>
        </article>
      `;
    }).join('');

    const columns = [
      { id: 'name', label: 'Skill' },
      { id: 'category', label: 'Category' },
      { id: 'status', label: 'Status' },
      { id: '_steps_count', label: 'Steps' },
      { id: 'workflow', label: 'Workflow' },
      { id: 'updated_at', label: 'Last modified' },
      { id: 'created_by', label: 'Created by' }
    ];

    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Skills</h3>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-secondary" onclick="downloadVisibleSkillsMarkdown()">Download All (.md)</button>
            <button class="btn btn-secondary" onclick="navigateTo('workflows', 'list')">View Workflows</button>
          </div>
        </div>
        ${createTableToolbar({
          resultCount: skills.length,
          totalCount: allSkills.length,
          showColumnSelector: true,
          showViewModeToggle: true,
          viewMode: skillsViewMode,
          viewKeyForMode: 'agent-skills',
          columns,
          viewKey: 'agent-skills',
          showSearch: true,
          searchPlaceholder: 'Search skills...',
          searchValue: agentSkillFilters.search || '',
          onSearch: 'updateAgentSkillFilter("search", this.value)',
          filterTags,
          onClearTag: 'clearAgentSkillFilterTag',
          filters: [
            {
              type: 'select',
              label: 'Category',
              value: agentSkillFilters.category,
              onChange: 'updateAgentSkillFilter("category", this.value)',
              options: [{ value: 'all', label: 'All categories' }, ...Object.entries(SKILL_CATEGORIES).map(([k, v]) => ({ value: k, label: v.label }))]
            },
            {
              type: 'select',
              label: 'Status',
              value: agentSkillFilters.status,
              onChange: 'updateAgentSkillFilter("status", this.value)',
              options: [
                { value: 'all', label: 'All statuses' },
                { value: 'active', label: 'Active' },
                { value: 'draft', label: 'Draft' },
                { value: 'archived', label: 'Archived' }
              ]
            }
          ]
        })}
        ${skillsViewMode === 'grid'
          ? `<div class="inventory-grid">${skillCards || '<div class="empty-state" style="grid-column:1/-1;padding:3rem;text-align:center;color:#6B7280">No skills found</div>'}</div>`
          : `<div class="data-table-container">
              <table class="data-table" data-view="agent-skills">
                <thead>
                  <tr>
                    ${createSortableHeader('name', 'Skill', currentTableSort)}
                    ${createSortableHeader('category', 'Category', currentTableSort)}
                    ${createSortableHeader('status', 'Status', currentTableSort)}
                    ${createSortableHeader('_steps_count', 'Steps', currentTableSort)}
                    <th data-column-id="workflow">Workflow</th>
                    ${createSortableHeader('updated_at', 'Last modified', currentTableSort)}
                    ${createSortableHeader('created_by', 'Created by', currentTableSort)}
                    <th style="width:50px;"></th>
                  </tr>
                </thead>
                <tbody>
                  ${rows || '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#6B7280;">No skills found</td></tr>'}
                </tbody>
              </table>
            </div>`
        }
      </div>
    `;
    if (skillsViewMode === 'list') applyColumnVisibility('agent-skills');
  } catch (err) {
    content.innerHTML = `<p class="sa-error">Error loading skills: ${esc(err.message)}</p>`;
  }
};

window.downloadSkillMarkdown = async function (id) {
  try {
    const response = await fetch(`/api/agent-skills/${id}`);
    const skill = await response.json();
    if (!response.ok) throw new Error(skill.error || 'Failed to load skill');
    const markdown = skillToMarkdown(skill);
    const fileName = `${sanitizeFilename(skill.name) || 'skill'}.md`;
    downloadTextFile(fileName, markdown);
    if (typeof showToast === 'function') showToast('Skill markdown downloaded', 'success');
  } catch (err) {
    if (typeof showToast === 'function') showToast('Error downloading skill markdown: ' + err.message, 'error');
  }
};

window.downloadVisibleSkillsMarkdown = function () {
  const skills = Array.isArray(_visibleSkillsForDownload) ? _visibleSkillsForDownload : [];
  if (skills.length === 0) {
    if (typeof showToast === 'function') showToast('No skills available to download', 'warning');
    return;
  }

  const sections = skills.map((skill, i) => {
    const block = skillToMarkdown(skill);
    if (i === skills.length - 1) return block;
    return `${block}\n---\n`;
  });
  const markdown = sections.join('\n');
  const fileName = `skills-export-${new Date().toISOString().slice(0, 10)}.md`;
  downloadTextFile(fileName, markdown);
  if (typeof showToast === 'function') showToast('Skills markdown downloaded', 'success');
};

window.updateAgentSkillFilter = function (key, value) {
  agentSkillFilters[key] = value || 'all';
  if (key === 'search') {
    agentSkillFilters.search = value || '';
    if (typeof debounce === 'function') return debounce('agentSkillsSearch', () => loadAgentSkills(), 350);
  }
  loadAgentSkills();
};

window.clearAgentSkillFilterTag = function (key) {
  if (key === 'search') agentSkillFilters.search = '';
  if (key === 'category') agentSkillFilters.category = 'all';
  if (key === 'status') agentSkillFilters.status = 'all';
  loadAgentSkills();
};

window.clearAgentSkillFilters = function () {
  agentSkillFilters = { category: 'all', status: 'all', search: '' };
  loadAgentSkills();
};

window.deleteSkill = async function (id) {
  if (!confirm('Delete this skill? This cannot be undone.')) return;
  try {
    const r = await fetch(`/api/agent-skills/${id}`, { method: 'DELETE' });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      throw new Error(d.error || 'Delete failed');
    }
    if (typeof showToast === 'function') showToast('Skill deleted', 'success');
    window.loadAgentSkills();
  } catch (e) {
    if (typeof showToast === 'function') showToast(e.message || 'Error deleting skill', 'error');
  }
};

/* ───── Agents Listing ───── */
window.loadAgents = async function () {
  const content = document.getElementById('content');
  try {
    if (!Object.keys(_workflowNameCache).length) {
      try { const wfs = await (await fetch('/api/workflows')).json(); (Array.isArray(wfs) ? wfs : wfs.workflows || []).forEach(w => { _workflowNameCache[w.id] = w.name || w.campaign_name || ''; }); } catch (_) {}
    }
    const response = await fetch('/api/agents');
    const allAgents = await response.json();

    let agents = allAgents.filter(a => {
      if (agentFilters.type !== 'all' && (a.type || 'orchestrator') !== agentFilters.type) return false;
      if (agentFilters.status !== 'all' && (a.status || 'draft') !== agentFilters.status) return false;
      if (agentFilters.search) {
        const q = agentFilters.search.toLowerCase();
        const name = (a.name || '').toLowerCase();
        const goal = (a.goal || '').toLowerCase();
        const desc = (a.description || '').toLowerCase();
        if (!name.includes(q) && !goal.includes(q) && !desc.includes(q)) return false;
      }
      return true;
    });

    agents = agents.map(a => ({
      ...a,
      _sub_agents_count: Array.isArray(a.sub_agents) ? a.sub_agents.length : (Array.isArray(a.child_agents) ? a.child_agents.length : 0)
    }));

    if (!currentTableSort.column) {
      currentTableSort.column = 'updated_at';
      currentTableSort.direction = 'desc';
    }
    agents = applySorting(agents, currentTableSort.column || 'updated_at');

    const filterTags = [];
    if (agentFilters.search) filterTags.push({ key: 'search', label: 'Search', value: agentFilters.search });
    if (agentFilters.status !== 'all') filterTags.push({ key: 'status', label: 'Status', value: agentFilters.status });
    if (agentFilters.type !== 'all') filterTags.push({ key: 'type', label: 'Type', value: agentFilters.type });

    const statusMap = { active: 'in-progress', draft: 'draft', paused: 'paused', archived: 'stopped' };
    const agentsViewMode = window._contentListViewMode?.agents || 'grid';
    const typeBadge = (t) => t === 'agent'
      ? '<span class="inv-type-badge inv-type-agent">Agent</span>'
      : '<span class="inv-type-badge inv-type-orch">Orchestrator</span>';
    const rows = agents.map(a => {
      const aType = a.type || 'orchestrator';
      const childCount = a._sub_agents_count || 0;
      const guardrails = a.guardrails || {};
      const approval = guardrails.require_approval ? 'Yes' : 'No';
      const usedIn = a._used_in != null ? a._used_in : '';
      const actions = [
        { icon: (window.ICONS?.edit || ''), label: 'Edit', onclick: `navigateTo('agents', 'edit', ${a.id})` },
        { divider: true },
        { icon: (window.ICONS?.trash || ''), label: 'Delete', onclick: `deleteAgent(${a.id})`, danger: true }
      ];
      return `
        <tr>
          <td data-column-id="name">${createTableLink(a.name || 'Untitled', `navigateTo('agents', 'edit', ${a.id})`)} ${typeBadge(aType)}<div class="table-subtext">${esc((a.goal || a.description || '').slice(0, 100))}</div></td>
          <td data-column-id="status">${createStatusIndicator(statusMap[a.status] || 'draft', a.status || 'draft')}</td>
          <td data-column-id="_sub_agents_count">${aType === 'orchestrator' ? childCount + ' agent' + (childCount !== 1 ? 's' : '') : (usedIn ? 'Used in ' + usedIn : '-')}</td>
          <td data-column-id="approval">${aType === 'orchestrator' ? approval : '-'}</td>
          <td data-column-id="workflow">${aType === 'orchestrator' ? _wfLabel(a.source_workflow_id) : (a.role || '-')}</td>
          <td data-column-id="updated_at">${a.updated_at ? new Date(a.updated_at).toLocaleString() : '-'}</td>
          <td data-column-id="created_by">${a.created_by || 'System'}</td>
          <td>${createActionMenu(a.id, actions)}</td>
        </tr>
      `;
    }).join('');

    const agentCards = agents.map(a => {
      const aType = a.type || 'orchestrator';
      const childCount = a._sub_agents_count || 0;
      const guardrails = a.guardrails || {};
      const updatedText = a.updated_at ? new Date(a.updated_at).toLocaleDateString() : '-';
      const usedIn = a._used_in != null ? a._used_in : 0;
      const metaLine = aType === 'orchestrator'
        ? `${childCount} agent${childCount !== 1 ? 's' : ''} · Approval: ${guardrails.require_approval ? 'Yes' : 'No'}`
        : `Role: ${esc(a.role || 'executor')}${usedIn > 0 ? ` · Used in ${usedIn} orchestration${usedIn !== 1 ? 's' : ''}` : ''}`;
      const bottomLine = aType === 'orchestrator'
        ? `${a.source_workflow_id ? _wfLabel(a.source_workflow_id) : 'Workflow: -'} · Updated: ${updatedText}`
        : `Updated: ${updatedText}`;
      return `
        <article class="inventory-card agent-inventory-card" onclick="navigateTo('agents', 'edit', ${a.id})">
          <div class="inventory-icon-actions">
            <button class="inv-icon-btn" onclick="event.stopPropagation(); navigateTo('agents','edit',${a.id})" title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="inv-icon-btn" onclick="event.stopPropagation(); _cloneAgent(${a.id})" title="Clone"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
            <button class="inv-icon-btn" onclick="event.stopPropagation(); downloadAgentById(${a.id})" title="Download .md"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
            <button class="inv-icon-btn inv-icon-btn-danger" onclick="event.stopPropagation(); deleteAgent(${a.id})" title="Delete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
          </div>
          <div class="inventory-card-body">
            <div class="inventory-card-name">${esc(a.name || 'Untitled')} ${typeBadge(aType)}</div>
            <div class="inventory-card-meta">${statusBadge(a.status || 'draft')}</div>
            <div class="inventory-card-meta">${esc((a.goal || a.description || '').slice(0, 140)) || 'No description'}</div>
            <div class="inventory-card-meta">${metaLine}</div>
            <div class="inventory-card-meta">${bottomLine}</div>
          </div>
        </article>
      `;
    }).join('');

    const columns = [
      { id: 'name', label: 'Name' },
      { id: 'status', label: 'Status' },
      { id: '_sub_agents_count', label: 'Composition' },
      { id: 'approval', label: 'Approval' },
      { id: 'workflow', label: 'Source / Role' },
      { id: 'updated_at', label: 'Last modified' },
      { id: 'created_by', label: 'Created by' }
    ];

    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Agents</h3>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-secondary" onclick="navigateTo('workflows', 'list')">View Workflows</button>
            <button class="btn btn-primary" onclick="createNewAgentFromScratch()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Agent
            </button>
          </div>
        </div>
        ${createTableToolbar({
          resultCount: agents.length,
          totalCount: allAgents.length,
          showColumnSelector: true,
          showViewModeToggle: true,
          viewMode: agentsViewMode,
          viewKeyForMode: 'agents',
          columns,
          viewKey: 'agents',
          showSearch: true,
          searchPlaceholder: 'Search agents...',
          searchValue: agentFilters.search || '',
          onSearch: 'updateAgentFilter("search", this.value)',
          filterTags,
          onClearTag: 'clearAgentFilterTag',
          filters: [
            {
              type: 'select',
              label: 'Type',
              value: agentFilters.type,
              onChange: 'updateAgentFilter("type", this.value)',
              options: [
                { value: 'all', label: 'All types' },
                { value: 'orchestrator', label: 'Orchestrators' },
                { value: 'agent', label: 'Agents' }
              ]
            },
            {
              type: 'select',
              label: 'Status',
              value: agentFilters.status,
              onChange: 'updateAgentFilter("status", this.value)',
              options: [
                { value: 'all', label: 'All statuses' },
                { value: 'active', label: 'Active' },
                { value: 'draft', label: 'Draft' },
                { value: 'paused', label: 'Paused' },
                { value: 'archived', label: 'Archived' }
              ]
            }
          ]
        })}
        ${agentsViewMode === 'grid'
          ? `<div class="inventory-grid">${agentCards || '<div class="empty-state" style="grid-column:1/-1;padding:3rem;text-align:center;color:#6B7280">No agents found</div>'}</div>`
          : `<div class="data-table-container">
              <table class="data-table" data-view="agents">
                <thead>
                  <tr>
                    ${createSortableHeader('name', 'Name', currentTableSort)}
                    ${createSortableHeader('status', 'Status', currentTableSort)}
                    ${createSortableHeader('_sub_agents_count', 'Composition', currentTableSort)}
                    <th data-column-id="approval">Approval</th>
                    <th data-column-id="workflow">Source / Role</th>
                    ${createSortableHeader('updated_at', 'Last modified', currentTableSort)}
                    ${createSortableHeader('created_by', 'Created by', currentTableSort)}
                    <th style="width:50px;"></th>
                  </tr>
                </thead>
                <tbody>
                  ${rows || '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#6B7280;">No agents found</td></tr>'}
                </tbody>
              </table>
            </div>`
        }
      </div>
    `;
    if (agentsViewMode === 'list') applyColumnVisibility('agents');
  } catch (err) {
    content.innerHTML = `<p class="sa-error">Error loading agents: ${esc(err.message)}</p>`;
  }
};

window.updateAgentFilter = function (key, value) {
  agentFilters[key] = value || 'all';
  if (key === 'search') {
    agentFilters.search = value || '';
    if (typeof debounce === 'function') return debounce('agentsSearch', () => loadAgents(), 350);
  }
  loadAgents();
};

window.clearAgentFilterTag = function (key) {
  if (key === 'search') agentFilters.search = '';
  if (key === 'status') agentFilters.status = 'all';
  if (key === 'type') agentFilters.type = 'all';
  loadAgents();
};

window.clearAgentFilters = function () {
  agentFilters = { status: 'all', search: '', type: 'all' };
  loadAgents();
};

window.downloadAgentById = async function (id) {
  try {
    const r = await fetch(`/api/agents/${id}`);
    if (!r.ok) throw new Error('Failed to load agent');
    const agent = await r.json();
    const md = agentToMarkdown(agent);
    downloadTextFile(`${sanitizeFilename(agent.name) || 'agent'}.md`, md);
    if (typeof showToast === 'function') showToast('Agent markdown downloaded', 'success');
  } catch (err) {
    if (typeof showToast === 'function') showToast('Error downloading agent: ' + err.message, 'error');
  }
};

window.deleteAgent = async function (id) {
  if (!confirm('Delete this agent? This cannot be undone.')) return;
  try {
    const r = await fetch(`/api/agents/${id}`, { method: 'DELETE' });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      throw new Error(d.error || 'Delete failed');
    }
    if (typeof showToast === 'function') showToast('Agent deleted', 'success');
    window.loadAgents();
  } catch (e) {
    if (typeof showToast === 'function') showToast(e.message || 'Error deleting agent', 'error');
  }
};

window.createNewAgentFromScratch = async function () {
  const blankAgent = {
    id: null,
    type: 'orchestrator',
    name: '',
    description: '',
    goal: '',
    sub_agents: [],
    tool_ids: [],
    guardrails: {
      max_messages_per_contact_per_day: 3,
      channel_limits: { email: 2, sms: 1, push: 2 },
      require_approval: true,
      budget_limit: null
    },
    status: 'draft',
    source_workflow_id: null,
    created_by: 'User'
  };
  window.renderAgentEditForm(blankAgent);
};

/* ───── Skill Edit Form ───── */
window.renderSkillEditForm = async function (existingData) {
  const content = document.getElementById('content');
  let skill = existingData;
  if (!skill && window.currentRoute?.id) {
    try {
      const r = await fetch(`/api/agent-skills/${window.currentRoute.id}`);
      skill = await r.json();
    } catch (_) { /* handled below */ }
  }
  if (!skill) {
    content.innerHTML = '<p class="sa-error">Skill not found</p>';
    return;
  }

  const steps = Array.isArray(skill.steps) ? skill.steps : [];
  const catOptions = Object.entries(SKILL_CATEGORIES).map(([k, v]) =>
    `<option value="${k}"${skill.category === k ? ' selected' : ''}>${v.label}</option>`
  ).join('');

  content.innerHTML = `
    <section class="sa-shell sa-form-shell">
      <div class="sa-page-header sa-page-header-row">
        <div>
          <h2>Edit Skill</h2>
          <p>Refine this skill's structure and execution instructions.</p>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <button class="sa-btn sa-btn-secondary" type="button" onclick="downloadSkillMarkdown(${skill.id})">Download .md</button>
          <button class="sa-btn sa-btn-secondary" onclick="navigateTo('agent-skills','list')">Back</button>
        </div>
      </div>
      <form id="skill-edit-form" class="sa-form" onsubmit="handleSkillSave(event, '${skill.id}')">
        <div class="sa-form-grid">
          <div class="sa-field">
            <label>Name</label>
            <input id="skill-name" value="${esc(skill.name)}" required>
          </div>
          <div class="sa-form-grid sa-form-grid-tight">
            <div class="sa-field">
              <label>Category</label>
              <select id="skill-category">${catOptions}</select>
            </div>
            <div class="sa-field">
              <label>Status</label>
              <select id="skill-status">
                <option value="active"${skill.status === 'active' ? ' selected' : ''}>Active</option>
                <option value="draft"${skill.status === 'draft' ? ' selected' : ''}>Draft</option>
                <option value="archived"${skill.status === 'archived' ? ' selected' : ''}>Archived</option>
              </select>
            </div>
          </div>
        </div>

        <div class="sa-field">
          <label>Description</label>
          <div class="cmp-detail-field-wrap">
            <textarea id="skill-description" rows="3">${esc(skill.description || '')}</textarea>
            ${_refineIcon('skill-description')}
          </div>
        </div>

        <section class="sa-section-card">
          <div class="sa-section-header">
            <h3>Steps</h3>
            <button type="button" class="sa-btn sa-btn-secondary" onclick="addSkillStep()">Add Step</button>
          </div>
          <div id="skill-steps-list" class="sa-step-list">${steps.map((s, i) => stepRowHTML(s, i)).join('')}</div>
        </section>

        ${skill.input_schema ? `
          <section class="sa-section-card">
            <h3>Input Schema</h3>
            <pre>${esc(JSON.stringify(skill.input_schema, null, 2))}</pre>
          </section>
        ` : ''}

        ${skill.output_schema ? `
          <section class="sa-section-card">
            <h3>Output Schema</h3>
            <pre>${esc(JSON.stringify(skill.output_schema, null, 2))}</pre>
          </section>
        ` : ''}

        <div class="sa-form-actions">
          <button type="button" class="sa-btn sa-btn-secondary" onclick="navigateTo('agent-skills','list')">Cancel</button>
          <button type="submit" class="sa-btn sa-btn-primary">Save Skill</button>
        </div>
      </form>
    </section>
  `;
  initSkillStepDnD();
};

function stepRowHTML(stepData, index) {
  const action = (stepData.action || 'check').toLowerCase();
  return `
    <div class="sa-step-row" draggable="true">
      <button type="button" class="sa-step-handle" title="Drag to reorder" aria-label="Drag to reorder step">⋮⋮</button>
      <span class="sa-step-index">${index + 1}</span>
      <select class="step-action">
        ${SKILL_ACTIONS.map(a => `<option value="${a}"${action === a ? ' selected' : ''}>${a}</option>`).join('')}
      </select>
      <div class="sa-step-instruction-wrap">
        <input class="step-instruction" value="${esc(stepData.instruction || '')}" placeholder="Instruction for this step">
        <button type="button" class="cmp-refine-btn cmp-refine-btn-inline" title="Refine with AI" onclick="event.stopPropagation();_refinePrompt(this.parentElement.querySelector('input'),'skill-step')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.21 1.21 0 0 0 1.72 0L21.64 5.36a1.21 1.21 0 0 0 0-1.72z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>
        </button>
      </div>
      <select class="step-channel">
        <option value=""${!stepData.channel ? ' selected' : ''}>No channel</option>
        <option value="email"${stepData.channel === 'email' ? ' selected' : ''}>Email</option>
        <option value="sms"${stepData.channel === 'sms' ? ' selected' : ''}>SMS</option>
        <option value="push"${stepData.channel === 'push' ? ' selected' : ''}>Push</option>
      </select>
      <button type="button" class="sa-btn sa-btn-danger sa-btn-icon" onclick="removeSkillStep(this)" title="Remove step" aria-label="Remove step">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18"/>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        </svg>
      </button>
    </div>
  `;
}

window.addSkillStep = function () {
  const list = document.getElementById('skill-steps-list');
  const div = document.createElement('div');
  div.innerHTML = stepRowHTML({ step: 1, action: 'check', instruction: '', channel: '' }, list.querySelectorAll('.sa-step-row').length);
  const row = div.firstElementChild;
  list.appendChild(row);
  initSkillStepDnD();
  const instruction = row.querySelector('.step-instruction');
  if (instruction) instruction.focus();
  renumberSkillSteps();
};

window.removeSkillStep = function (btn) {
  btn.closest('.sa-step-row')?.remove();
  renumberSkillSteps();
};

function renumberSkillSteps() {
  document.querySelectorAll('#skill-steps-list .sa-step-row .sa-step-index').forEach((el, i) => {
    el.textContent = i + 1;
  });
}

function initSkillStepDnD() {
  const list = document.getElementById('skill-steps-list');
  if (!list || list.dataset.dndReady === 'true') return;
  list.dataset.dndReady = 'true';

  let draggedRow = null;
  let armedRow = null;

  // Only arm dragging when user presses the drag handle.
  list.addEventListener('mousedown', (event) => {
    const handle = event.target.closest('.sa-step-handle');
    if (!handle) {
      armedRow = null;
      return;
    }
    armedRow = handle.closest('.sa-step-row');
  });

  list.addEventListener('mouseup', () => {
    armedRow = null;
  });

  list.addEventListener('dragstart', (event) => {
    const row = event.target.closest('.sa-step-row');
    if (!row) return;

    // Block accidental dragging from form fields/buttons and require handle-arm.
    const interactive = event.target.closest('input, select, textarea, button');
    const isHandle = !!event.target.closest('.sa-step-handle');
    if ((!isHandle && interactive) || (armedRow && armedRow !== row)) {
      event.preventDefault();
      return;
    }

    draggedRow = row;
    row.classList.add('dragging');
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      try { event.dataTransfer.setData('text/plain', 'step'); } catch (_) { /* no-op */ }
    }
  });

  list.addEventListener('dragover', (event) => {
    if (!draggedRow) return;
    event.preventDefault();
    const targetRow = event.target.closest('.sa-step-row');
    if (!targetRow || targetRow === draggedRow) return;

    const rect = targetRow.getBoundingClientRect();
    const shouldInsertAfter = (event.clientY - rect.top) > (rect.height / 2);
    const referenceNode = shouldInsertAfter ? targetRow.nextElementSibling : targetRow;

    if (referenceNode !== draggedRow && draggedRow.nextElementSibling !== referenceNode) {
      list.insertBefore(draggedRow, referenceNode);
    }
  });

  list.addEventListener('drop', (event) => {
    if (!draggedRow) return;
    event.preventDefault();
    renumberSkillSteps();
  });

  list.addEventListener('dragend', () => {
    if (draggedRow) draggedRow.classList.remove('dragging');
    draggedRow = null;
    armedRow = null;
    renumberSkillSteps();
  });
}

window.handleSkillSave = async function (e, id) {
  e.preventDefault();
  const stepRows = document.querySelectorAll('#skill-steps-list .sa-step-row');
  const steps = Array.from(stepRows).map((row, i) => {
    const channel = row.querySelector('.step-channel')?.value || '';
    const step = {
      step: i + 1,
      action: row.querySelector('.step-action')?.value || 'check',
      instruction: row.querySelector('.step-instruction')?.value || ''
    };
    if (channel) step.channel = channel;
    return step;
  });

  const body = {
    name: document.getElementById('skill-name').value,
    description: document.getElementById('skill-description').value,
    category: document.getElementById('skill-category').value,
    status: document.getElementById('skill-status').value,
    steps
  };

  try {
    const r = await fetch(`/api/agent-skills/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error('Save failed');
    if (typeof showToast === 'function') showToast('Skill saved', 'success');
    navigateTo('agent-skills', 'list');
  } catch (err) {
    if (typeof showToast === 'function') showToast('Error saving skill: ' + err.message, 'error');
  }
};

/* ═══════════════════════════════════════════════════════════════
   AGENT COMPOSER
   ═══════════════════════════════════════════════════════════════ */

const ROLE_COLORS = {
  orchestrator: { bg: '#EBF5FF', text: '#1D6FDE', border: '#BFD9F7' },
  executor:     { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  reviewer:     { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
  analyst:      { bg: '#F3EEFF', text: '#7C3AED', border: '#D8CCFA' },
  timing:       { bg: '#FFF7ED', text: '#C2410C', border: '#FDBA74' },
  content:      { bg: '#FDF2F8', text: '#BE185D', border: '#F9A8D4' },
  channel:      { bg: '#EBF5FF', text: '#1D6FDE', border: '#BFD9F7' },
  targeting:    { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  conversion:   { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' }
};

/* ───── Logic Node types ───── */
/* ───── Trigger types ───── */
const TRIGGER_TYPES = {
  event: {
    label: 'Event', desc: 'Fires on a customer event',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
    color: '#E68619'
  },
  schedule: {
    label: 'Schedule', desc: 'Runs on a recurring schedule',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    color: '#2680EB'
  },
  segment: {
    label: 'Segment', desc: 'Fires on segment entry/exit',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    color: '#059669'
  },
  api: {
    label: 'API', desc: 'External system calls REST endpoint',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    color: '#7C3AED'
  },
  manual: {
    label: 'Manual', desc: 'User triggers from UI',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
    color: '#DC2626'
  }
};

const TRIGGER_EVENTS = [
  'cart_abandoned', 'purchase_completed', 'signup', 'email_opened', 'email_clicked',
  'page_viewed', 'form_submitted', 'cart_updated', 'order_shipped', 'loyalty_milestone',
  'birthday_approaching', 'subscription_expiring', 'inactivity_detected', 'custom'
];

const TRIGGER_SCHEDULES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'cron', label: 'Custom (cron)' }
];

const LOGIC_NODE_TYPES = {
  condition: {
    label: 'Condition', desc: 'If / else branching',
    color: '#E68619', bg: '#FFF7ED', border: '#FDBA74',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22V12"/><path d="M3 3l9 9"/><path d="M21 3l-9 9"/></svg>'
  },
  loop: {
    label: 'Loop', desc: 'Repeat N times or for each',
    color: '#7C3AED', bg: '#F3EEFF', border: '#D8CCFA',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>'
  },
  parallel: {
    label: 'Parallel', desc: 'Run steps simultaneously',
    color: '#2680EB', bg: '#EBF5FF', border: '#BFD9F7',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 4v16"/><path d="M16 4v16"/><path d="M3 8h6"/><path d="M15 8h6"/><path d="M3 16h6"/><path d="M15 16h6"/></svg>'
  },
  transform: {
    label: 'Transform', desc: 'Map or reshape data',
    color: '#059669', bg: '#ECFDF5', border: '#A7F3D0',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5"/><path d="M21 3l-7 7"/><path d="M8 21H3v-5"/><path d="M3 21l7-7"/></svg>'
  },
  gate: {
    label: 'Gate', desc: 'Proceed only if condition met',
    color: '#DC2626', bg: '#FEF2F2', border: '#FECACA',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
  },
  delay: {
    label: 'Delay', desc: 'Wait before next step',
    color: '#C2410C', bg: '#FFF7ED', border: '#FDBA74',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
  },
  ab_split: {
    label: 'A/B Split', desc: 'Random percentage split',
    color: '#9333EA', bg: '#FAF5FF', border: '#D8B4FE',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M2 12h20"/><text x="6" y="10" font-size="7" fill="currentColor" stroke="none" font-weight="bold">A</text><text x="14" y="17" font-size="7" fill="currentColor" stroke="none" font-weight="bold">B</text></svg>'
  },
  wait_event: {
    label: 'Wait for Event', desc: 'Pause until signal received',
    color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><line x1="12" y1="2" x2="12" y2="4"/></svg>'
  },
  invoke_agent: {
    label: 'Invoke Agent', desc: 'Call another agent',
    color: '#BE185D', bg: '#FDF2F8', border: '#FBCFE8',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 014 4v1h1a3 3 0 013 3v4a3 3 0 01-3 3h-1v1a4 4 0 01-8 0v-1H7a3 3 0 01-3-3v-4a3 3 0 013-3h1V6a4 4 0 014-4z"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/></svg>'
  }
};

const LOGIC_DEFAULTS = {
  condition: { expression: '', then_label: 'Yes', else_label: 'No', then_target: null, else_target: null, description: '' },
  loop: { loop_type: 'count', count: 3, iterator: '', max_iterations: 10, description: '' },
  parallel: { branches: [], wait_mode: 'all', description: '' },
  transform: { mappings: [{ from: '', to: '' }], description: '' },
  gate: { expression: '', fallback: 'skip', fallback_target: null, description: '' },
  delay: { duration: 1, unit: 'hours', description: '' },
  ab_split: { variants: [{ name: 'A', weight: 50, target: null }, { name: 'B', weight: 50, target: null }], description: '' },
  wait_event: { event_type: 'email_open', timeout_duration: 24, timeout_unit: 'hours', timeout_action: 'continue', description: '' },
  invoke_agent: { target_agent_id: null, pass_context: true, wait_for_completion: true, description: '' }
};

let _flowAddOpen = null;

let _simMode = false;
let _simResults = null;
let _simRunning = false;
let _simContacts = [];

let _testMode = false;
let _testResults = null;
let _testRunning = false;

let _probPaletteScope = 'local';
let _probSelectedEdge = null;  // { from_index, to_index }
let _probExpandedAgents = {};  // { agentIndex: true/false }

let _composerState = null;
let _composerSkills = [];
let _composerTools = [];
let _workflowNameCache = {};
let _opsAgentsList = [];
let _composerSelected = null; // { type: 'agent' | 'sub-agent', index?: number }
let _agentDetailTab = 'properties'; // 'properties' | 'triggers'
let _composerDirty = false;
let _composerInitialSnapshot = '';
/** @type {{ role: 'user'|'assistant', content: string, proposal?: object, agent_patch?: object, source?: string, followUps?: string[] }[]} */
let _composerWorkflowChatMessages = [];
let _composerWorkflowChatSending = false;
let _composerWorkflowChatAbort = null;
/** @type {Record<string, Array>} keyed by sub-agent index string */
let _composerSubAgentChatByIndex = {};
let _composerSubAgentChatSendingIdx = null;
let _composerSubAgentChatAbort = null;
let _composerChatExpanded = false;
/** Floating workflow chat drawer open (composer only) */
let _composerFloatChatOpen = false;

function _markComposerDirty() { _composerDirty = true; }
function _composerSnapshot() { return JSON.stringify(_composerState); }

window._composerConfirmLeave = function (dest) {
  if (_composerDirty && _composerInitialSnapshot !== _composerSnapshot()) {
    if (!confirm('You have unsaved changes. Discard and leave?')) return;
  }
  _composerDirty = false;
  navigateTo(dest || 'agents', 'list');
};

function _roleBadgeHTML(role) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.executor;
  return `<span class="cmp-role-badge" style="background:${c.bg};color:${c.text};border-color:${c.border}">${esc(role)}</span>`;
}

function _skillChipHTML(skillId, saIdx) {
  const skill = _composerSkills.find(s => s.id === skillId);
  if (!skill) return '';
  return `<span class="cmp-chip cmp-chip-skill" title="${esc(skill.description || '')}">${esc(skill.name)}<button type="button" onclick="event.stopPropagation();_composerRemoveSkill(${saIdx},${skillId})" class="cmp-chip-x">&times;</button></span>`;
}

function _toolChipHTML(toolId, saIdx) {
  const tool = _composerTools.find(t => t.id === toolId);
  if (!tool) return '';
  const icon = toolIcon ? toolIcon(tool.icon) : '';
  return `<span class="cmp-chip cmp-chip-tool" title="${esc(tool.name + ': ' + (tool.description || ''))}">${icon}<button type="button" onclick="event.stopPropagation();_composerRemoveTool(${saIdx},${toolId})" class="cmp-chip-x">&times;</button></span>`;
}

/* ───── Main entry: replaces renderAgentEditForm ───── */
window.renderAgentEditForm = async function (existingData) {
  const content = document.getElementById('content');
  let agent = existingData;
  if (!agent && window.currentRoute?.id) {
    try { const r = await fetch(`/api/agents/${window.currentRoute.id}`); agent = await r.json(); } catch (_) {}
  }
  if (!agent && !existingData) { content.innerHTML = '<p class="sa-error">Agent not found</p>'; return; }

  if (agent.type === 'agent') {
    return _renderLeafAgentForm(agent);
  }

  _composerState = {
    id: agent.id,
    type: 'orchestrator',
    name: agent.name || '',
    goal: agent.goal || '',
    description: agent.description || '',
    status: agent.status || 'draft',
    source_workflow_id: agent.source_workflow_id || null,
    tool_ids: Array.isArray(agent.tool_ids) ? [...agent.tool_ids] : [],
    sub_agents: (Array.isArray(agent.sub_agents) ? agent.sub_agents : []).map(sa => ({
      id: sa.id || null,
      name: sa.name || '',
      role: sa.role || 'executor',
      description: sa.description || '',
      system_instructions: sa.system_instructions || '',
      skill_ids: Array.isArray(sa.skill_ids) ? [...sa.skill_ids] : [],
      tool_ids: Array.isArray(sa.tool_ids) ? [...sa.tool_ids] : [],
      node_ids: Array.isArray(sa.node_ids) ? [...sa.node_ids] : [],
      output_schema: Array.isArray(sa.output_schema) ? sa.output_schema.map(o => ({...o})) : []
    })),
    logic_nodes: (Array.isArray(agent.logic_nodes) ? agent.logic_nodes : []).map(n => ({
      id: n.id, type: n.type, slot: n.slot ?? 0, label: n.label || '', config: { ...(n.config || {}) }
    })),
    guardrails: {
      max_messages_per_contact_per_day: agent.guardrails?.max_messages_per_contact_per_day ?? agent.guardrails?.max_messages ?? null,
      channel_limits: agent.guardrails?.channel_limits || { email: 2, sms: 1, push: 2 },
      require_approval: agent.guardrails?.require_approval !== false,
      budget_limit: agent.guardrails?.budget_limit ?? null
    },
    triggers: (Array.isArray(agent.triggers) ? agent.triggers : []).map(t => ({...t})),
    probabilistic_config: agent.probabilistic_config || null
  };
  _composerSelected = { type: 'agent' };
  _composerDirty = false;

  try { _composerSkills = await (await fetch('/api/agent-skills')).json(); } catch (_) { _composerSkills = []; }
  try { _composerTools = await (await fetch('/api/agent-tools')).json(); } catch (_) { _composerTools = []; }
  try { _opsAgentsList = await (await fetch('/api/agents')).json(); } catch (_) { _opsAgentsList = []; }
  if (!Object.keys(_workflowNameCache).length) {
    try {
      const wfs = await (await fetch('/api/workflows')).json();
      (Array.isArray(wfs) ? wfs : wfs.workflows || []).forEach(w => { _workflowNameCache[w.id] = w.name || w.campaign_name || ''; });
    } catch (_) {}
  }

  _composerInitialSnapshot = _composerSnapshot();
  _composerWorkflowChatMessages = [];
  _composerWorkflowChatSending = false;
  _composerSubAgentChatByIndex = {};
  _composerSubAgentChatSendingIdx = null;
  _composerFloatChatOpen = false;

  // Auto-expand probabilistic skill chains if this agent has probabilistic_config
  if (_composerState.probabilistic_config) {
    _probSelectedEdge = null;
    _probExpandedAgents = {};
    (_composerState.sub_agents || []).forEach((_, i) => { _probExpandedAgents[i] = true; });
  }

  _renderComposer();
};

/* ───── Leaf agent edit form ───── */
let _leafAgent = null;
let _leafDirty = false;
async function _renderLeafAgentForm(agent) {
  _leafAgent = { ...agent };
  _leafDirty = false;
  try { _composerSkills = await (await fetch('/api/agent-skills')).json(); } catch (_) { _composerSkills = []; }
  try { _composerTools = await (await fetch('/api/agent-tools')).json(); } catch (_) { _composerTools = []; }
  _drawLeafForm();
}

function _drawLeafForm() {
  const content = document.getElementById('content');
  const a = _leafAgent;
  const usedIn = a._used_in || 0;
  const skillChips = (a.skill_ids || []).map(sid => {
    const s = _composerSkills.find(sk => sk.id === sid);
    return s ? `<span class="cmp-chip cmp-chip-skill">${esc(s.name)}<button type="button" onclick="_leafRemoveSkill(${sid})" class="cmp-chip-x">&times;</button></span>` : '';
  }).filter(Boolean).join('') || '<span style="color:#9CA3AF;font-size:12px">No skills assigned</span>';
  const toolChips = (a.tool_ids || []).map(tid => {
    const t = _composerTools.find(tl => tl.id === tid);
    return t ? `<span class="cmp-chip cmp-chip-tool">${esc(t.name)}<button type="button" onclick="_leafRemoveTool(${tid})" class="cmp-chip-x">&times;</button></span>` : '';
  }).filter(Boolean).join('') || '<span style="color:#9CA3AF;font-size:12px">No tools assigned</span>';
  const outputRows = (a.output_schema || []).map((o, i) => `
    <div class="cmp-output-row">
      <input class="cmp-detail-input cmp-detail-input-sm" value="${esc(o.key || '')}" placeholder="key" onchange="_leafUpdateOutput(${i},'key',this.value)" />
      <select class="cmp-detail-input cmp-detail-input-sm" onchange="_leafUpdateOutput(${i},'type',this.value)">
        ${['string','number','boolean','array','object'].map(t => `<option value="${t}"${o.type === t ? ' selected' : ''}>${t}</option>`).join('')}
      </select>
      <input class="cmp-detail-input cmp-detail-input-sm" value="${esc(o.description || '')}" placeholder="description" onchange="_leafUpdateOutput(${i},'description',this.value)" />
      <button type="button" class="inv-icon-btn inv-icon-btn-danger" onclick="_leafRemoveOutput(${i})" title="Remove"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
  `).join('');

  content.innerHTML = `
    <div class="leaf-agent-shell">
      <div class="leaf-agent-header">
        <button type="button" class="cmp-back-btn" onclick="_leafBack()" title="Back to agents">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div style="flex:1;display:flex;align-items:center;gap:10px">
          <span class="inv-type-badge inv-type-agent">Agent</span>
          <span style="font-size:16px;font-weight:600;color:#1F2937">${esc(a.name || 'Untitled Agent')}</span>
          ${usedIn > 0 ? `<span class="leaf-used-in" title="Used in ${usedIn} orchestration(s)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            Used in ${usedIn} orchestration${usedIn !== 1 ? 's' : ''}
          </span>` : ''}
        </div>
        <button type="button" class="btn btn-primary" onclick="_leafSave()">Save</button>
      </div>
      <div class="leaf-agent-body">
        <div class="leaf-section">
          <label class="cmp-detail-label">Name</label>
          <input class="cmp-detail-input" value="${esc(a.name || '')}" onchange="_leafUpdate('name',this.value)" />
          <label class="cmp-detail-label">Role</label>
          <select class="cmp-detail-input" onchange="_leafUpdate('role',this.value)">
            ${['orchestrator','content','timing','analyst','conversion','targeting','channel','executor'].map(r => `<option value="${r}"${a.role === r ? ' selected' : ''}>${r}</option>`).join('')}
          </select>
          <label class="cmp-detail-label">Description</label>
          <textarea class="cmp-detail-input" rows="3" onchange="_leafUpdate('description',this.value)">${esc(a.description || '')}</textarea>
          <label class="cmp-detail-label">System Instructions</label>
          <textarea class="cmp-detail-input" rows="5" onchange="_leafUpdate('system_instructions',this.value)">${esc(a.system_instructions || '')}</textarea>
        </div>
        <div class="leaf-section">
          <label class="cmp-detail-label">Skills</label>
          <div class="cmp-chips-wrap">${skillChips}</div>
          <select class="cmp-detail-input" style="margin-top:6px" onchange="_leafAddSkill(parseInt(this.value));this.value=''">
            <option value="">+ Add skill...</option>
            ${_composerSkills.filter(s => !(a.skill_ids || []).includes(s.id)).map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}
          </select>
          <label class="cmp-detail-label" style="margin-top:12px">Tools</label>
          <div class="cmp-chips-wrap">${toolChips}</div>
          <select class="cmp-detail-input" style="margin-top:6px" onchange="_leafAddTool(parseInt(this.value));this.value=''">
            <option value="">+ Add tool...</option>
            ${_composerTools.filter(t => !(a.tool_ids || []).includes(t.id)).map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}
          </select>
        </div>
        <div class="leaf-section">
          <label class="cmp-detail-label">Output Schema</label>
          ${outputRows || '<div style="color:#9CA3AF;font-size:12px">No outputs defined</div>'}
          <button type="button" class="sa-btn sa-btn-sm" onclick="_leafAddOutput()" style="margin-top:8px">+ Add Output</button>
        </div>
        <div class="leaf-section">
          <label class="cmp-detail-label">Status</label>
          <select class="cmp-detail-input" onchange="_leafUpdate('status',this.value)">
            ${['active','draft','paused'].map(s => `<option value="${s}"${a.status === s ? ' selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
  `;
}

window._leafUpdate = function (field, value) {
  _leafAgent[field] = value;
  _leafDirty = true;
  _drawLeafForm();
};
window._leafAddSkill = function (id) {
  if (!id) return;
  if (!_leafAgent.skill_ids) _leafAgent.skill_ids = [];
  if (!_leafAgent.skill_ids.includes(id)) _leafAgent.skill_ids.push(id);
  _leafDirty = true;
  _drawLeafForm();
};
window._leafRemoveSkill = function (id) {
  _leafAgent.skill_ids = (_leafAgent.skill_ids || []).filter(s => s !== id);
  _leafDirty = true;
  _drawLeafForm();
};
window._leafAddTool = function (id) {
  if (!id) return;
  if (!_leafAgent.tool_ids) _leafAgent.tool_ids = [];
  if (!_leafAgent.tool_ids.includes(id)) _leafAgent.tool_ids.push(id);
  _leafDirty = true;
  _drawLeafForm();
};
window._leafRemoveTool = function (id) {
  _leafAgent.tool_ids = (_leafAgent.tool_ids || []).filter(t => t !== id);
  _leafDirty = true;
  _drawLeafForm();
};
window._leafAddOutput = function () {
  if (!_leafAgent.output_schema) _leafAgent.output_schema = [];
  _leafAgent.output_schema.push({ key: '', type: 'string', description: '' });
  _leafDirty = true;
  _drawLeafForm();
};
window._leafRemoveOutput = function (i) {
  (_leafAgent.output_schema || []).splice(i, 1);
  _leafDirty = true;
  _drawLeafForm();
};
window._leafUpdateOutput = function (i, field, value) {
  if (_leafAgent.output_schema && _leafAgent.output_schema[i]) {
    _leafAgent.output_schema[i][field] = value;
    _leafDirty = true;
  }
};
window._leafSave = async function () {
  const a = _leafAgent;
  if (!a.name || !a.name.trim()) { if (typeof showToast === 'function') showToast('Name is required', 'warning'); return; }
  const body = {
    name: a.name, type: 'agent', role: a.role || 'executor',
    description: a.description || '', system_instructions: a.system_instructions || '',
    skill_ids: a.skill_ids || [], tool_ids: a.tool_ids || [],
    output_schema: a.output_schema || [], status: a.status || 'active'
  };
  const url = a.id ? `/api/agents/${a.id}` : '/api/agents';
  const method = a.id ? 'PUT' : 'POST';
  try {
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('Save failed');
    const saved = await r.json();
    _leafAgent = saved;
    _leafDirty = false;
    _drawLeafForm();
    if (typeof showToast === 'function') showToast('Agent saved', 'success');
  } catch (e) {
    if (typeof showToast === 'function') showToast(e.message, 'error');
  }
};
window._leafBack = function () {
  if (_leafDirty && !confirm('Unsaved changes will be lost. Continue?')) return;
  navigateTo('agents', 'list');
};

function _renderComposer() {
  const content = document.getElementById('content');
  const s = _composerState;

  const statusCls = s.status === 'active' ? 'active' : s.status === 'draft' ? 'draft' : 'paused';
  content.innerHTML = `
    <div class="cmp-shell">
      <div class="cmp-header">
        <div class="cmp-header-left">
          <button type="button" class="cmp-back-btn" onclick="_composerConfirmLeave('agents')" title="Back to agents">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div style="display:flex;flex-direction:column">
            <div style="display:flex;align-items:center;gap:10px">
              <h2 class="cmp-header-title">${esc(s.name || (s.id ? 'Agent Composer' : 'New Agent'))}</h2>
              <span class="cmp-header-status cmp-header-status-${statusCls}">${esc(s.status)}</span>
            </div>
            <span class="cmp-header-sub">${(s.sub_agents || []).length} sub-agents · ${(s.logic_nodes || []).length} logic nodes · ${_composerSkills.length} skills · ${_composerTools.length} tools</span>
          </div>
        </div>
        <div class="cmp-header-actions">
          <button type="button" class="btn btn-secondary" style="border-color:rgba(255,255,255,0.2);color:rgba(255,255,255,0.8);background:transparent" onclick="_composerConfirmLeave('agents')">Cancel</button>
          <button type="button" class="btn ${_simMode ? 'btn-primary' : 'btn-secondary'}" style="${_simMode ? '' : 'border-color:rgba(255,255,255,0.2);color:rgba(255,255,255,0.8);background:transparent'}" onclick="_toggleSimMode()" title="Simulate agent flow (dry run)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            ${_simMode ? 'Exit Simulate' : 'Simulate'}
          </button>
          <button type="button" class="btn ${_testMode ? 'btn-primary' : 'btn-secondary'}" style="${_testMode ? 'background:#7c3aed' : 'border-color:rgba(255,255,255,0.2);color:rgba(255,255,255,0.8);background:transparent'}" onclick="_toggleTestMode()" title="Test agent with AI content generation">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            ${_testMode ? 'Exit Test' : 'Test'}
          </button>
          ${s.id ? `<button type="button" class="btn btn-secondary" style="border-color:rgba(230,134,25,0.4);color:#E68619;background:rgba(230,134,25,0.08)" onclick="_openTriggerModal()" title="Trigger this agent">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Trigger
          </button>` : ''}
          <div class="cmp-more-menu" id="cmp-more-menu">
            <button type="button" class="btn btn-secondary" style="border-color:rgba(255,255,255,0.2);color:rgba(255,255,255,0.8);background:transparent;padding:6px 8px" onclick="this.parentElement.classList.toggle('cmp-more-open')" title="More actions">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
            <div class="cmp-more-dropdown">
              <button onclick="_downloadAgentMarkdown();document.getElementById('cmp-more-menu').classList.remove('cmp-more-open')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download .md</button>
              ${s.id ? `<button onclick="_saveVersion();document.getElementById('cmp-more-menu').classList.remove('cmp-more-open')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Save Version</button>
              <button onclick="_showVersionHistory();document.getElementById('cmp-more-menu').classList.remove('cmp-more-open')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg> Version History</button>
              <button onclick="_cloneAgent();document.getElementById('cmp-more-menu').classList.remove('cmp-more-open')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Clone Agent</button>
              <button onclick="_showRecommendations();document.getElementById('cmp-more-menu').classList.remove('cmp-more-open')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E68619" stroke-width="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg> Recommendations</button>` : ''}
            </div>
          </div>
          <button type="button" class="btn btn-primary" onclick="_composerSave()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            ${s.id ? 'Save Agent' : 'Create Agent'}
          </button>
        </div>
      </div>
      <div class="cmp-body">
        <aside class="cmp-palette ${_paletteCollapsed ? 'cmp-palette-collapsed' : ''}" id="cmp-palette" style="${_paletteWidth ? 'width:' + _paletteWidth + 'px' : ''}">
          <div class="cmp-palette-body">
            <div class="cmp-palette-inner" id="cmp-palette-inner">
              ${_renderPalette()}
            </div>
          </div>
          <button type="button" class="cmp-palette-collapse-btn" onclick="_togglePaletteCollapse()" title="${_paletteCollapsed ? 'Expand palette' : 'Collapse palette'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="${_paletteCollapsed ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'}"/></svg>
          </button>
        </aside>
        <div class="cmp-palette-resize" id="cmp-palette-resize"></div>
        <main class="cmp-canvas" id="cmp-canvas">
          ${_renderCanvas()}
        </main>
        <div class="cmp-details-resize" id="cmp-details-resize"></div>
        <aside class="cmp-details" id="cmp-details" style="${_detailsWidth ? 'width:' + _detailsWidth + 'px' : ''}">
          ${_renderDetails()}
        </aside>
      </div>
      <div class="cmp-float-wf" id="cmp-float-wf">
        <div class="cmp-float-wf-panel ${_composerChatExpanded ? 'cmp-float-wf-panel--tall' : ''}" id="cmp-float-wf-panel" role="dialog" aria-label="Workflow AI" ${_composerFloatChatOpen ? '' : 'hidden'}>
          <div class="cmp-float-wf-panel-top">
            <div class="cmp-float-wf-panel-titles">
              <span class="cmp-chat-title">Workflow AI</span>
              <span class="cmp-chat-scope-label" id="cmp-workflow-chat-scope-label">Full workflow &amp; canvas</span>
            </div>
            <div class="cmp-float-wf-panel-tools">
              <button type="button" class="cmp-chat-icobtn" id="cmp-chat-expand" title="Taller window" aria-label="Taller window">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
              </button>
              <button type="button" class="cmp-chat-icobtn" id="cmp-chat-clear" title="Clear conversation" aria-label="Clear conversation">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
              <button type="button" class="cmp-float-wf-close" id="cmp-float-wf-close" title="Close" aria-label="Close Workflow AI">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
          <div class="cmp-wf-chat-inner" id="cmp-wf-chat-root">
            <div class="cmp-chat-inactive-hint" id="cmp-workflow-chat-inactive" hidden></div>
            <p class="cmp-chat-sub cmp-chat-sub-compact" id="cmp-workflow-chat-sub"><strong>Whole workflow</strong> · <kbd>Enter</kbd> send · <kbd>Shift</kbd>+<kbd>Enter</kbd> new line</p>
            <div class="cmp-chat-starters" id="cmp-chat-starters"></div>
            <div class="cmp-chat-messages" id="cmp-chat-messages"></div>
            <div class="cmp-chat-proposal-wrap" id="cmp-chat-proposal-wrap" hidden>
              <div class="cmp-chat-proposal-preview" id="cmp-chat-proposal-preview"></div>
              <div class="cmp-chat-proposal-actions">
                <button type="button" class="btn btn-primary btn-sm cmp-chat-apply" id="cmp-chat-apply">Apply to canvas</button>
                <span class="cmp-chat-apply-hint" id="cmp-chat-apply-hint"></span>
              </div>
            </div>
            <div class="cmp-chat-input-row">
              <textarea class="cmp-chat-input" id="cmp-chat-input" rows="2" placeholder="Describe or ask about the workflow…" aria-label="Message to workflow assistant"></textarea>
              <div class="cmp-chat-send-col">
                <button type="button" class="btn btn-secondary cmp-chat-stop" id="cmp-chat-stop" hidden>Stop</button>
                <button type="button" class="btn btn-primary cmp-chat-send" id="cmp-chat-send" title="Send (Enter)">Send</button>
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="cmp-float-wf-fab" id="cmp-float-wf-fab" ${_composerFloatChatOpen ? 'hidden' : ''} aria-label="Open Workflow AI" title="Workflow AI — full canvas">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg>
        </button>
      </div>
    </div>
  `;
  _initComposerDragDrop();
  _initPaletteResize();
  _initDetailsResize();
  _initFlowPickerDismiss();
  _initComposerChatPanel();
}

/** Clicks on empty canvas / flow gutters → orchestrator selection so Workflow AI is active. */
function _composerCanvasBackgroundToWorkflow(e) {
  if (!e.target.closest('.cmp-canvas-scroll')) return;
  const ignore = e.target.closest(
    '.cmp-agent-card, .cmp-subagent-card, .cmp-logic-node, .cmp-branch-container, .cmp-parallel-container, .cmp-ab-container, .cmp-branch-sa-card, .cmp-flow-connector, .cmp-guardrails-card, .cmp-flow-picker'
  );
  if (ignore) return;
  if (e.target.closest('button, a, input, textarea, select, [role="button"], [contenteditable="true"]')) return;
  if (_composerSelected?.type === 'agent') return;
  _composerSelected = { type: 'agent' };
  _agentDetailTab = 'properties';
  _refreshComposerView();
}

function _initFlowPickerDismiss() {
  const canvas = document.getElementById('cmp-canvas');
  if (!canvas || canvas.dataset.cmpCanvasUiBound) return;
  canvas.dataset.cmpCanvasUiBound = '1';
  canvas.addEventListener('click', (e) => {
    if (_flowAddOpen !== null && !e.target.closest('.cmp-flow-connector')) {
      _flowAddOpen = null;
      _refreshComposerView();
    }
    _composerCanvasBackgroundToWorkflow(e);
  });
  document.addEventListener('keydown', function _escHandler(e) {
    if (e.key === 'Escape' && _flowAddOpen !== null) {
      _flowAddOpen = null;
      _refreshComposerView();
    }
  });
}

function _mergeComposerLnConfig(type, raw) {
  const base = JSON.parse(JSON.stringify(LOGIC_DEFAULTS[type] || {}));
  if (!raw || typeof raw !== 'object') return base;
  const out = { ...base, ...raw };
  if (type === 'ab_split' && Array.isArray(raw.variants)) {
    out.variants = raw.variants.map((v) => ({
      name: v.name,
      weight: Number(v.weight) || 0,
      target: v.target === null || v.target === undefined || v.target === '' ? null : Number(v.target)
    }));
  }
  if (type === 'parallel' && Array.isArray(raw.branches)) {
    out.branches = raw.branches.map((b) => Number(b)).filter((n) => !Number.isNaN(n));
  }
  if (type === 'transform' && Array.isArray(raw.mappings)) {
    out.mappings = raw.mappings.map((m) => ({ from: m.from || '', to: m.to || '' }));
  }
  return out;
}

function _composerLogicNodeSummary(n) {
  const c = n.config || {};
  if (n.type === 'delay') return `${c.duration || '?'} ${c.unit || 'hours'}`;
  if (n.type === 'ab_split') return (c.variants || []).map((v) => `${v.name}:${v.weight}%`).join(' / ');
  if (n.type === 'parallel') return `${(c.branches || []).length} branches (${c.wait_mode || 'all'})`;
  if (n.type === 'condition') return (c.expression || '').slice(0, 80) || 'if / else';
  if (n.type === 'gate') return (c.expression || '').slice(0, 80) || 'gate';
  if (n.type === 'wait_event') return c.event_type || 'event';
  if (n.type === 'invoke_agent') return c.target_agent_id ? `agent #${c.target_agent_id}` : 'pick agent';
  if (n.type === 'transform') return `${(c.mappings || []).length} mapping(s)`;
  if (n.type === 'loop') return c.loop_type === 'foreach' ? `each ${c.iterator || '?'}` : `×${c.count || 0}`;
  return '';
}

function _composerBuildCanvasSnapshot() {
  const s = _composerState;
  return {
    orchestrator_name: s.name,
    goal: s.goal,
    description: (s.description || '').slice(0, 1500),
    status: s.status,
    orchestrator_tool_ids: [...(s.tool_ids || [])],
    sub_agents: (s.sub_agents || []).map((sa, i) => ({
      index: i,
      name: sa.name,
      role: sa.role,
      description: (sa.description || '').slice(0, 420),
      system_instructions_preview: (sa.system_instructions || '').slice(0, 360),
      skill_ids: [...(sa.skill_ids || [])],
      tool_ids: [...(sa.tool_ids || [])],
      output_keys: (sa.output_schema || []).map((o) => o.key).filter(Boolean)
    })),
    logic_nodes: (s.logic_nodes || []).map((n) => ({
      id: n.id,
      type: n.type,
      slot: n.slot,
      label: n.label,
      summary: _composerLogicNodeSummary(n)
    })),
    triggers: (s.triggers || []).map((t) => ({ type: t.type, enabled: t.enabled !== false })),
    guardrails: s.guardrails || {}
  };
}

function _composerSuggestBuildContext() {
  const s = _composerState;
  return {
    priorSubAgentCount: (s.sub_agents || []).length,
    skills: (_composerSkills || []).map((sk) => ({
      id: sk.id,
      name: sk.name,
      description: (sk.description || '').slice(0, 240)
    })),
    tools: (_composerTools || []).map((t) => ({
      id: t.id,
      name: t.name,
      description: (t.description || '').slice(0, 240)
    })),
    orchestratorAgents: (_opsAgentsList || [])
      .filter((a) => a.type === 'orchestrator' && a.id !== s.id)
      .map((a) => ({ id: a.id, name: a.name })),
    currentAgent: {
      name: s.name,
      goal: s.goal,
      description: (s.description || '').slice(0, 1200),
      sub_agent_count: (s.sub_agents || []).length,
      logic_count: (s.logic_nodes || []).length
    },
    canvas: _composerBuildCanvasSnapshot()
  };
}

function _composerBuildSubAgentFocus(idx) {
  const s = _composerState;
  const sa = s.sub_agents[idx];
  if (!sa) return null;
  const prev = idx > 0 ? s.sub_agents[idx - 1] : null;
  const next = idx < s.sub_agents.length - 1 ? s.sub_agents[idx + 1] : null;
  return {
    index: idx,
    name: sa.name,
    role: sa.role,
    description: sa.description,
    system_instructions: sa.system_instructions,
    skill_ids: [...(sa.skill_ids || [])],
    tool_ids: [...(sa.tool_ids || [])],
    output_schema: (sa.output_schema || []).map((o) => ({ ...o })),
    upstream: prev
      ? { name: prev.name, output_keys: (prev.output_schema || []).map((o) => o.key).filter(Boolean) }
      : null,
    downstream: next ? { name: next.name } : null
  };
}

function _composerSuggestBuildSubAgentContext(idx) {
  const s = _composerState;
  const skills = (_composerSkills || []).map((sk) => ({
    id: sk.id,
    name: sk.name,
    description: (sk.description || '').slice(0, 240)
  }));
  const tools = (_composerTools || []).map((t) => ({
    id: t.id,
    name: t.name,
    description: (t.description || '').slice(0, 240)
  }));
  return {
    skills,
    tools,
    sub_agent_focus: _composerBuildSubAgentFocus(idx),
    canvas_summary: {
      orchestrator_name: s.name,
      goal: (s.goal || '').slice(0, 500),
      sub_agent_count: (s.sub_agents || []).length,
      logic_count: (s.logic_nodes || []).length
    }
  };
}

function _syncWorkflowChatAvailability() {
  const sel = _composerSelected;
  const workflowActive = sel?.type === 'agent';
  const root = document.getElementById('cmp-wf-chat-root');
  const inactive = document.getElementById('cmp-workflow-chat-inactive');
  const label = document.getElementById('cmp-workflow-chat-scope-label');
  const send = document.getElementById('cmp-chat-send');
  const input = document.getElementById('cmp-chat-input');
  const clear = document.getElementById('cmp-chat-clear');
  const starters = document.getElementById('cmp-chat-starters');
  const subEl = document.getElementById('cmp-workflow-chat-sub');
  if (!root) return;
  root.classList.toggle('cmp-wf-chat--muted', !workflowActive);
  if (label) {
    if (workflowActive) {
      label.textContent = 'Full workflow & canvas';
    } else if (sel?.type === 'sub-agent') {
      const sa = _composerState.sub_agents[sel.index];
      const nm = (sa && (sa.name || '').trim()) || `Step ${(sel.index ?? 0) + 1}`;
      label.textContent = `Focused: ${nm.length > 36 ? nm.slice(0, 34) + '…' : nm} — Agent AI in details`;
    } else if (sel?.type === 'logic') {
      const node = (_composerState.logic_nodes || []).find((n) => n.id === sel.id);
      const meta = node ? LOGIC_NODE_TYPES[node.type] : null;
      const typeLb = meta ? meta.label : 'Logic';
      const lb = (node && (node.label || '').trim()) || typeLb;
      const short = lb.length > 28 ? lb.slice(0, 26) + '…' : lb;
      label.textContent = `Focused: ${short} (${typeLb}) — click canvas background for workflow chat`;
    } else {
      label.textContent = 'Inactive';
    }
    label.classList.toggle('cmp-chat-scope-label-inactive', !workflowActive);
  }
  if (inactive) {
    inactive.hidden = workflowActive;
    if (!workflowActive) {
      let t =
        'Click <strong>empty space</strong> on the canvas (not on a card) or the <strong>orchestrator</strong> card to use Workflow AI.';
      if (sel?.type === 'sub-agent') {
        t =
          'You’re editing a <strong>sub-agent</strong> — use <strong>Agent AI</strong> in the right details panel (this step only).';
      } else if (sel?.type === 'logic') {
        const node = (_composerState.logic_nodes || []).find((n) => n.id === sel.id);
        const meta = node ? LOGIC_NODE_TYPES[node.type] : null;
        const typeLb = meta ? meta.label : 'logic';
        t = `You’re editing <strong>${esc(node?.label || typeLb)}</strong> (${typeLb}). Click empty canvas or the orchestrator card for Workflow AI, or a sub-agent card for Agent AI.`;
      }
      inactive.innerHTML = t;
    }
  }
  if (subEl) subEl.classList.toggle('cmp-chat-sub-muted', !workflowActive);
  const dis = !workflowActive;
  if (send) send.disabled = dis || _composerWorkflowChatSending;
  if (input) input.disabled = dis && !_composerWorkflowChatSending;
  if (clear) clear.disabled = dis;
  if (starters && !workflowActive) starters.innerHTML = '';
}

function _composerGetSubAgentChat(idx) {
  const k = String(idx);
  if (!_composerSubAgentChatByIndex[k]) _composerSubAgentChatByIndex[k] = [];
  return _composerSubAgentChatByIndex[k];
}

function _composerAgentPatchPreviewHTML(patch) {
  if (!patch || typeof patch !== 'object') return '';
  const rows = [];
  if (patch.name != null) rows.push(`<li><strong>Name</strong> updated</li>`);
  if (patch.role != null) rows.push(`<li><strong>Role</strong> → ${esc(patch.role)}</li>`);
  if (patch.description != null) rows.push(`<li><strong>Description</strong> updated</li>`);
  if (patch.system_instructions != null) rows.push(`<li><strong>Instructions</strong> updated</li>`);
  if (Array.isArray(patch.skill_ids)) rows.push(`<li><strong>Skills</strong> → ${patch.skill_ids.length} id(s)</li>`);
  if (Array.isArray(patch.tool_ids)) rows.push(`<li><strong>Tools</strong> → ${patch.tool_ids.length} id(s)</li>`);
  if (Array.isArray(patch.output_schema)) rows.push(`<li><strong>Outputs</strong> → ${patch.output_schema.length} field(s)</li>`);
  if (!rows.length) return '<p class="cmp-chat-prev-empty">No structured patch</p>';
  return `<div class="cmp-chat-prev-head"><span class="cmp-chat-prev-badge cmp-chat-prev-badge-merge">Agent</span> suggested edits</div><ul class="cmp-chat-prev-lns">${rows.join('')}</ul>`;
}

function _composerChatFormatReply(text) {
  if (!text) return '';
  let t = esc(text);
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/`([^`]+)`/g, '<code class="cmp-chat-code">$1</code>');
  t = t.replace(/^- (.+)$/gm, '<span class="cmp-chat-li">• $1</span>');
  t = t.replace(/\n/g, '<br/>');
  return t;
}

function _composerProposalPreviewHTML(p) {
  if (!p) return '';
  const sas = p.sub_agents || [];
  const lns = p.logic_nodes || [];
  if (!sas.length && !lns.length) return '';
  const mode = p.replace_flow === false ? 'merge' : 'replace';
  const saList = sas.length
    ? `<ol class="cmp-chat-prev-list">${sas.map((sa, i) => `<li><strong>${esc(sa.name || 'Step ' + (i + 1))}</strong> <span class="cmp-chat-prev-meta">${esc(sa.role || '')}</span></li>`).join('')}</ol>`
    : '<p class="cmp-chat-prev-empty">No new sub-agents (logic-only change)</p>';
  const lnList = lns.length
    ? `<ul class="cmp-chat-prev-lns">${lns.map((n) => `<li><code>${esc(n.type)}</code> <span class="cmp-chat-prev-slot">slot ${n.slot}</span> ${esc(n.label || '')}</li>`).join('')}</ul>`
    : '';
  return `<div class="cmp-chat-prev-head"><span class="cmp-chat-prev-badge cmp-chat-prev-badge-${mode}">${mode === 'merge' ? 'Merge' : 'Replace'}</span> preview</div>${saList}${lnList ? `<div class="cmp-chat-prev-ln-title">Logic</div>${lnList}` : ''}`;
}

function _composerChatPaintWorkflow() {
  const el = document.getElementById('cmp-chat-messages');
  const wrap = document.getElementById('cmp-chat-proposal-wrap');
  const prev = document.getElementById('cmp-chat-proposal-preview');
  const applyBtn = document.getElementById('cmp-chat-apply');
  const hint = document.getElementById('cmp-chat-apply-hint');
  const starters = document.getElementById('cmp-chat-starters');
  if (!el) return;
  let lastProposal = null;
  let lastSource = '';
  const msgs = _composerWorkflowChatMessages;
  const parts = msgs.map((m, i) => {
    const cls = m.role === 'user' ? 'cmp-chat-bubble cmp-chat-user' : 'cmp-chat-bubble cmp-chat-assistant';
    if (m.role === 'assistant' && m.proposal && (m.proposal.sub_agents || []).length + (m.proposal.logic_nodes || []).length > 0) {
      lastProposal = m.proposal;
      lastSource = m.source || '';
    }
    const body = m.role === 'assistant' ? _composerChatFormatReply(m.content || '') : esc(m.content || '').replace(/\n/g, '<br/>');
    let fu = '';
    if (m.role === 'assistant' && Array.isArray(m.followUps) && m.followUps.length) {
      fu = `<div class="cmp-chat-followups">${m.followUps.map((q, qi) => `<button type="button" class="cmp-chat-chip" data-cq="${qi}">${esc(q)}</button>`).join('')}</div>`;
    }
    return `<div class="${cls}" data-msg-idx="${i}"><div class="cmp-chat-bubble-body">${body}</div>${fu}</div>`;
  }).join('');
  const typing = _composerWorkflowChatSending
    ? `<div class="cmp-chat-bubble cmp-chat-assistant cmp-chat-typing"><span class="cmp-chat-dot"></span><span class="cmp-chat-dot"></span><span class="cmp-chat-dot"></span><span class="cmp-chat-typing-label">Thinking…</span></div>`
    : '';
  const showEmpty = msgs.length === 0 && !_composerWorkflowChatSending;
  const emptyRow = showEmpty
    ? '<p class="cmp-chat-messages-empty-hint">Ask below or scroll suggestions →</p>'
    : '';
  el.classList.toggle('cmp-chat-messages--empty', showEmpty);
  el.innerHTML = emptyRow + parts + typing;
  el.querySelectorAll('.cmp-chat-chip').forEach((btn) => {
    const idx = parseInt(btn.dataset.cq, 10);
    const bubble = btn.closest('.cmp-chat-bubble');
    const midx = bubble ? parseInt(bubble.dataset.msgIdx, 10) : -1;
    const msg = midx >= 0 ? msgs[midx] : null;
    const q = msg && msg.followUps ? msg.followUps[idx] : btn.textContent;
    btn.onclick = () => {
      const ta = document.getElementById('cmp-chat-input');
      if (ta) ta.value = q;
      window._composerChatSend();
    };
  });
  el.scrollTop = el.scrollHeight;

  const wfActive = _composerSelected?.type === 'agent';
  if (starters && wfActive) {
    if (msgs.length === 0) {
      starters.innerHTML = `
        <span class="cmp-chat-starters-label">Try</span>
        <button type="button" class="cmp-chat-chip cmp-chat-chip-muted" data-starter="1" title="Explain how slots and logic nodes work">Slots &amp; logic</button>
        <button type="button" class="cmp-chat-chip cmp-chat-chip-muted" data-starter="2" title="Design A/B test + compliance reviewer">A/B + compliance</button>
        <button type="button" class="cmp-chat-chip cmp-chat-chip-muted" data-starter="3" title="Merge a delay before last step">Delay before last step</button>
      `;
      starters.querySelectorAll('[data-starter]').forEach((b) => {
        b.onclick = () => {
          const ta = document.getElementById('cmp-chat-input');
          const texts = {
            1: 'Explain how slots and logic nodes work on this canvas.',
            2: 'Design an orchestrator with A/B testing and a compliance reviewer before publish.',
            3: 'Merge into my current workflow: add a 24-hour delay at the slot just before the last sub-agent. Do not remove existing sub-agents.'
          };
          if (ta) ta.value = texts[b.dataset.starter] || '';
          window._composerChatSend();
        };
      });
    } else starters.innerHTML = '';
  }

  const hasApply = lastProposal && ((lastProposal.sub_agents || []).length > 0 || (lastProposal.logic_nodes || []).length > 0);
  if (wrap && prev && applyBtn && hint) {
    if (hasApply) {
      wrap.removeAttribute('hidden');
      prev.innerHTML = _composerProposalPreviewHTML(lastProposal);
      const isMerge = lastProposal.replace_flow === false;
      applyBtn.textContent = isMerge ? 'Merge into canvas' : 'Apply to canvas';
      const n = (lastProposal.sub_agents || []).length;
      const l = (lastProposal.logic_nodes || []).length;
      hint.textContent = isMerge
        ? `${lastSource === 'mock' ? 'Demo: ' : ''}Appends ${n} sub-agent(s) and ${l} logic node(s).`
        : `${lastSource === 'mock' ? 'Demo mode (set OPENAI_API_KEY for live AI). ' : ''}${n} sub-agent(s), ${l} logic node(s).`;
    } else {
      wrap.setAttribute('hidden', '');
      prev.innerHTML = '';
      hint.textContent = '';
    }
  }
  _syncWorkflowChatAvailability();
}

function _composerChatPaintSubAgent(idx) {
  const el = document.getElementById('cmp-sa-chat-messages');
  const wrap = document.getElementById('cmp-sa-chat-patch-wrap');
  const prev = document.getElementById('cmp-sa-chat-patch-preview');
  const applyBtn = document.getElementById('cmp-sa-chat-apply');
  const hint = document.getElementById('cmp-sa-chat-hint');
  const starters = document.getElementById('cmp-sa-chat-starters');
  if (!el) return;
  const msgs = _composerGetSubAgentChat(idx);
  let lastPatch = null;
  let lastSource = '';
  const parts = msgs.map((m, i) => {
    const cls = m.role === 'user' ? 'cmp-chat-bubble cmp-chat-user' : 'cmp-chat-bubble cmp-chat-assistant';
    if (m.role === 'assistant' && m.agent_patch && Object.keys(m.agent_patch).length) {
      lastPatch = m.agent_patch;
      lastSource = m.source || '';
    }
    const body = m.role === 'assistant' ? _composerChatFormatReply(m.content || '') : esc(m.content || '').replace(/\n/g, '<br/>');
    let fu = '';
    if (m.role === 'assistant' && Array.isArray(m.followUps) && m.followUps.length) {
      fu = `<div class="cmp-chat-followups">${m.followUps.map((q, qi) => `<button type="button" class="cmp-chat-chip cmp-sa-fu" data-sa-fu="${qi}" data-sa-idx="${idx}">${esc(q)}</button>`).join('')}</div>`;
    }
    return `<div class="${cls}" data-sa-msg-idx="${i}"><div class="cmp-chat-bubble-body">${body}</div>${fu}</div>`;
  }).join('');
  const typing =
    _composerSubAgentChatSendingIdx === idx
      ? `<div class="cmp-chat-bubble cmp-chat-assistant cmp-chat-typing"><span class="cmp-chat-dot"></span><span class="cmp-chat-dot"></span><span class="cmp-chat-dot"></span><span class="cmp-chat-typing-label">Thinking…</span></div>`
      : '';
  const saEmpty = msgs.length === 0 && _composerSubAgentChatSendingIdx !== idx;
  el.classList.toggle('cmp-chat-messages--empty', saEmpty);
  el.innerHTML = (saEmpty ? '<p class="cmp-chat-messages-empty-hint">Chat about this step below</p>' : '') + parts + typing;
  el.querySelectorAll('.cmp-sa-fu').forEach((btn) => {
    const qi = parseInt(btn.dataset.saFu, 10);
    const midx = parseInt(btn.closest('.cmp-chat-bubble')?.dataset.saMsgIdx, 10);
    const msg = midx >= 0 ? msgs[midx] : null;
    const q = msg && msg.followUps ? msg.followUps[qi] : btn.textContent;
    btn.onclick = () => {
      const ta = document.getElementById('cmp-sa-chat-input');
      if (ta) ta.value = q;
      window._composerSubAgentChatSend(idx);
    };
  });
  el.scrollTop = el.scrollHeight;

  if (starters && msgs.length === 0) {
    starters.innerHTML = `
      <span class="cmp-chat-starters-label">Try</span>
      <button type="button" class="cmp-chat-chip cmp-chat-chip-muted" data-sa-starter="1" title="Improve system instructions for clarity">Clearer instructions</button>
      <button type="button" class="cmp-chat-chip cmp-chat-chip-muted" data-sa-starter="2" title="Suggest output fields for downstream steps">Output fields</button>
    `;
    starters.querySelectorAll('[data-sa-starter]').forEach((b) => {
      b.onclick = () => {
        const ta = document.getElementById('cmp-sa-chat-input');
        const t = {
          1: 'Rewrite my system instructions to be clearer and more actionable; keep the same intent.',
          2: 'Suggest output_schema keys and types that the next step in the flow would need.'
        };
        if (ta) ta.value = t[b.dataset.saStarter] || '';
        window._composerSubAgentChatSend(idx);
      };
    });
  } else if (starters && msgs.length > 0) starters.innerHTML = '';

  if (wrap && prev && applyBtn && hint) {
    if (lastPatch && Object.keys(lastPatch).length) {
      wrap.removeAttribute('hidden');
      prev.innerHTML = _composerAgentPatchPreviewHTML(lastPatch);
      applyBtn.disabled = false;
      hint.textContent = lastSource === 'mock' ? 'Demo suggestion.' : 'Applies fields below to this sub-agent.';
    } else {
      wrap.setAttribute('hidden', '');
      prev.innerHTML = '';
      hint.textContent = '';
    }
  }
}

function _initComposerChatPanel() {
  _composerChatPaintWorkflow();
  const sendBtn = document.getElementById('cmp-chat-send');
  const stopBtn = document.getElementById('cmp-chat-stop');
  const input = document.getElementById('cmp-chat-input');
  const applyBtn = document.getElementById('cmp-chat-apply');
  const clearBtn = document.getElementById('cmp-chat-clear');
  const expandBtn = document.getElementById('cmp-chat-expand');
  if (sendBtn) sendBtn.onclick = () => window._composerChatSend();
  if (stopBtn) stopBtn.onclick = () => window._composerWorkflowChatStop();
  if (applyBtn) applyBtn.onclick = () => window._composerApplyChatProposal();
  if (clearBtn) clearBtn.onclick = () => window._composerChatClear();
  if (expandBtn) expandBtn.onclick = () => window._composerChatToggleExpand();
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        window._composerChatSend();
      }
    });
  }
  const fab = document.getElementById('cmp-float-wf-fab');
  const closeBtn = document.getElementById('cmp-float-wf-close');
  if (fab) fab.onclick = () => window._composerOpenFloatWfChat();
  if (closeBtn) closeBtn.onclick = () => window._composerCloseFloatWfChat();
  if (!window.__cmpFloatWfEscBound) {
    window.__cmpFloatWfEscBound = true;
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !_composerFloatChatOpen) return;
      const p = document.getElementById('cmp-float-wf-panel');
      if (!p || p.hasAttribute('hidden')) return;
      window._composerCloseFloatWfChat();
    });
  }
}

function _initSubAgentChatPanel(idx) {
  _composerChatPaintSubAgent(idx);
  const sendBtn = document.getElementById('cmp-sa-chat-send');
  const stopBtn = document.getElementById('cmp-sa-chat-stop');
  const input = document.getElementById('cmp-sa-chat-input');
  const applyBtn = document.getElementById('cmp-sa-chat-apply');
  const clearBtn = document.getElementById('cmp-sa-chat-clear');
  if (sendBtn) sendBtn.onclick = () => window._composerSubAgentChatSend(idx);
  if (stopBtn) stopBtn.onclick = () => window._composerSubAgentChatStop();
  if (applyBtn) applyBtn.onclick = () => window._composerApplySubAgentChatPatch(idx);
  if (clearBtn) clearBtn.onclick = () => {
    delete _composerSubAgentChatByIndex[String(idx)];
    window._composerSubAgentChatStop();
    _composerChatPaintSubAgent(idx);
  };
  if (input) {
    input.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        window._composerSubAgentChatSend(idx);
      }
    };
  }
}

window._composerChatClear = function () {
  _composerWorkflowChatMessages = [];
  _composerWorkflowChatSending = false;
  window._composerWorkflowChatStop();
  _composerChatPaintWorkflow();
};

window._composerWorkflowChatStop = function () {
  if (_composerWorkflowChatAbort) {
    try {
      _composerWorkflowChatAbort.abort();
    } catch (_) {}
    _composerWorkflowChatAbort = null;
  }
};

window._composerSubAgentChatStop = function () {
  if (_composerSubAgentChatAbort) {
    try {
      _composerSubAgentChatAbort.abort();
    } catch (_) {}
    _composerSubAgentChatAbort = null;
  }
  _composerSubAgentChatSendingIdx = null;
};

window._composerOpenFloatWfChat = function () {
  _composerFloatChatOpen = true;
  const panel = document.getElementById('cmp-float-wf-panel');
  const fab = document.getElementById('cmp-float-wf-fab');
  if (panel) panel.removeAttribute('hidden');
  if (fab) fab.setAttribute('hidden', '');
  const input = document.getElementById('cmp-chat-input');
  if (input) setTimeout(() => input.focus(), 50);
};

window._composerCloseFloatWfChat = function () {
  _composerFloatChatOpen = false;
  const panel = document.getElementById('cmp-float-wf-panel');
  const fab = document.getElementById('cmp-float-wf-fab');
  if (panel) panel.setAttribute('hidden', '');
  if (fab) fab.removeAttribute('hidden');
};

window._composerChatToggleExpand = function () {
  _composerChatExpanded = !_composerChatExpanded;
  const panel = document.getElementById('cmp-float-wf-panel');
  if (panel) panel.classList.toggle('cmp-float-wf-panel--tall', _composerChatExpanded);
};

window._composerChatSend = async function () {
  if (_composerSelected?.type !== 'agent') return;
  const input = document.getElementById('cmp-chat-input');
  const sendBtn = document.getElementById('cmp-chat-send');
  const stopBtn = document.getElementById('cmp-chat-stop');
  const text = ((input && input.value) || '').trim();
  if (!text || _composerWorkflowChatSending) return;
  window._composerWorkflowChatStop();
  _composerWorkflowChatAbort = new AbortController();
  _composerWorkflowChatMessages.push({ role: 'user', content: text });
  if (input) input.value = '';
  _composerWorkflowChatSending = true;
  if (sendBtn) sendBtn.disabled = true;
  if (stopBtn) stopBtn.hidden = false;
  _composerChatPaintWorkflow();

  const history = _composerWorkflowChatMessages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-18)
    .map((m) => ({ role: m.role, content: m.content }));

  try {
    const r = await fetch('/api/ai/composer-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: _composerWorkflowChatAbort.signal,
      body: JSON.stringify({
        scope: 'workflow',
        message: text,
        history,
        context: _composerSuggestBuildContext()
      })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Request failed');
    const reply = typeof data.reply === 'string' ? data.reply : 'Here is a suggested workflow.';
    let proposal = data.proposal && typeof data.proposal === 'object' ? data.proposal : null;
    const hasSa = proposal && Array.isArray(proposal.sub_agents) && proposal.sub_agents.length > 0;
    const hasLn = proposal && Array.isArray(proposal.logic_nodes) && proposal.logic_nodes.length > 0;
    if (proposal && !hasSa && !hasLn) proposal = null;
    if (proposal && !hasSa && proposal.replace_flow !== false) proposal = null;
    const followUps = Array.isArray(data.follow_ups) ? data.follow_ups.filter(Boolean).slice(0, 4) : [];
    _composerWorkflowChatMessages.push({
      role: 'assistant',
      content: reply,
      proposal,
      source: data.source || '',
      followUps
    });
  } catch (e) {
    if (e.name === 'AbortError') {
      _composerWorkflowChatMessages.push({ role: 'assistant', content: 'Stopped.', proposal: null, followUps: [] });
    } else {
      _composerWorkflowChatMessages.push({
        role: 'assistant',
        content: `Could not reach the assistant: ${esc(e.message || 'error')}. Check your connection and try again.`,
        proposal: null,
        followUps: []
      });
    }
  } finally {
    _composerWorkflowChatSending = false;
    _composerWorkflowChatAbort = null;
    if (sendBtn) sendBtn.disabled = false;
    if (stopBtn) stopBtn.hidden = true;
    _composerChatPaintWorkflow();
  }
};

window._composerSubAgentChatSend = async function (idx) {
  const input = document.getElementById('cmp-sa-chat-input');
  const sendBtn = document.getElementById('cmp-sa-chat-send');
  const stopBtn = document.getElementById('cmp-sa-chat-stop');
  const text = ((input && input.value) || '').trim();
  if (!text || _composerSubAgentChatSendingIdx !== null) return;
  if (!_composerState.sub_agents[idx]) return;
  window._composerSubAgentChatStop();
  _composerSubAgentChatAbort = new AbortController();
  const msgs = _composerGetSubAgentChat(idx);
  msgs.push({ role: 'user', content: text });
  if (input) input.value = '';
  _composerSubAgentChatSendingIdx = idx;
  if (sendBtn) sendBtn.disabled = true;
  if (stopBtn) stopBtn.hidden = false;
  _composerChatPaintSubAgent(idx);

  const history = msgs
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-18)
    .map((m) => ({ role: m.role, content: m.content }));

  try {
    const r = await fetch('/api/ai/composer-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: _composerSubAgentChatAbort.signal,
      body: JSON.stringify({
        scope: 'sub_agent',
        sub_agent_index: idx,
        message: text,
        history,
        context: _composerSuggestBuildSubAgentContext(idx)
      })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Request failed');
    const reply = typeof data.reply === 'string' ? data.reply : 'Suggestion ready.';
    const agent_patch = data.agent_patch && typeof data.agent_patch === 'object' ? data.agent_patch : null;
    const followUps = Array.isArray(data.follow_ups) ? data.follow_ups.filter(Boolean).slice(0, 4) : [];
    msgs.push({
      role: 'assistant',
      content: reply,
      agent_patch: agent_patch && Object.keys(agent_patch).length ? agent_patch : null,
      source: data.source || '',
      followUps
    });
  } catch (e) {
    if (e.name === 'AbortError') {
      msgs.push({ role: 'assistant', content: 'Stopped.', agent_patch: null, followUps: [] });
    } else {
      msgs.push({
        role: 'assistant',
        content: `Could not reach the assistant: ${esc(e.message || 'error')}.`,
        agent_patch: null,
        followUps: []
      });
    }
  } finally {
    _composerSubAgentChatSendingIdx = null;
    _composerSubAgentChatAbort = null;
    if (sendBtn) sendBtn.disabled = false;
    if (stopBtn) stopBtn.hidden = true;
    _composerChatPaintSubAgent(idx);
  }
};

window._composerApplySubAgentChatPatch = function (idx) {
  const msgs = _composerGetSubAgentChat(idx);
  let patch = null;
  for (let j = msgs.length - 1; j >= 0; j--) {
    if (msgs[j].role === 'assistant' && msgs[j].agent_patch) {
      patch = msgs[j].agent_patch;
      break;
    }
  }
  if (!patch || typeof patch !== 'object') {
    if (typeof showToast === 'function') showToast('No suggestion to apply', 'warning');
    return;
  }
  const sa = _composerState.sub_agents[idx];
  if (!sa) return;
  if (patch.name != null) sa.name = String(patch.name);
  if (patch.role != null && ROLE_OPTIONS.includes(patch.role)) sa.role = patch.role;
  if (patch.description != null) sa.description = String(patch.description);
  if (patch.system_instructions != null) sa.system_instructions = String(patch.system_instructions);
  if (Array.isArray(patch.skill_ids)) sa.skill_ids = [...patch.skill_ids];
  if (Array.isArray(patch.tool_ids)) sa.tool_ids = [...patch.tool_ids];
  if (Array.isArray(patch.output_schema)) sa.output_schema = patch.output_schema.map((o) => ({ ...o }));
  _markComposerDirty();
  _refreshComposerView();
  if (typeof showToast === 'function') showToast('Agent updated from AI suggestion', 'success');
};

window._composerApplyChatProposal = function () {
  let proposal = null;
  for (let i = _composerWorkflowChatMessages.length - 1; i >= 0; i--) {
    const m = _composerWorkflowChatMessages[i];
    if (m.role === 'assistant' && m.proposal) {
      proposal = m.proposal;
      break;
    }
  }
  const hasSa = proposal && (proposal.sub_agents || []).length > 0;
  const hasLn = proposal && (proposal.logic_nodes || []).length > 0;
  if (!proposal || (!hasSa && !hasLn)) {
    if (typeof showToast === 'function') showToast('No proposal to apply', 'warning');
    return;
  }
  const s = _composerState;
  const mapNewLogicNodes = (logicList, freshIds) => {
    const seen = freshIds ? new Set() : new Set((s.logic_nodes || []).map((n) => n.id));
    return (logicList || []).map((ln, i) => {
      let id = ln.id && String(ln.id).length ? String(ln.id) : `ln_${Date.now()}_${i}`;
      while (seen.has(id)) id = `ln_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      seen.add(id);
      const maxSlot = s.sub_agents.length;
      let slot = parseInt(ln.slot, 10);
      if (Number.isNaN(slot)) slot = 0;
      slot = Math.max(0, Math.min(slot, maxSlot));
      const t = ln.type;
      if (!LOGIC_NODE_TYPES[t]) return null;
      return {
        id,
        type: t,
        slot,
        label: ln.label || LOGIC_NODE_TYPES[t].label || t,
        config: _mergeComposerLnConfig(t, ln.config)
      };
    }).filter(Boolean);
  };

  if (proposal.replace_flow !== false) {
    if (proposal.name != null && String(proposal.name).trim()) s.name = String(proposal.name).trim();
    if (proposal.goal != null) s.goal = proposal.goal;
    if (proposal.description != null) s.description = proposal.description;
    s.sub_agents = (proposal.sub_agents || []).map((sa, j) => ({
      id: sa.id != null ? sa.id : null,
      name: sa.name || `Sub-agent ${j + 1}`,
      role: sa.role || 'executor',
      description: sa.description || '',
      system_instructions: sa.system_instructions || '',
      skill_ids: Array.isArray(sa.skill_ids) ? [...sa.skill_ids] : [],
      tool_ids: Array.isArray(sa.tool_ids) ? [...sa.tool_ids] : [],
      node_ids: Array.isArray(sa.node_ids) ? [...sa.node_ids] : [],
      output_schema: Array.isArray(sa.output_schema) ? sa.output_schema.map((o) => ({ ...o })) : []
    }));
    s.logic_nodes = mapNewLogicNodes(proposal.logic_nodes || [], true);
  } else {
    if (proposal.goal != null) s.goal = proposal.goal;
    if (proposal.description != null) s.description = proposal.description;
    const addSas = (proposal.sub_agents || []).map((sa, j) => ({
      id: sa.id != null ? sa.id : null,
      name: sa.name || `Sub-agent ${s.sub_agents.length + j + 1}`,
      role: sa.role || 'executor',
      description: sa.description || '',
      system_instructions: sa.system_instructions || '',
      skill_ids: Array.isArray(sa.skill_ids) ? [...sa.skill_ids] : [],
      tool_ids: Array.isArray(sa.tool_ids) ? [...sa.tool_ids] : [],
      node_ids: Array.isArray(sa.node_ids) ? [...sa.node_ids] : [],
      output_schema: Array.isArray(sa.output_schema) ? sa.output_schema.map((o) => ({ ...o })) : []
    }));
    s.sub_agents = [...(s.sub_agents || []), ...addSas];
    const appendLns = mapNewLogicNodes(proposal.logic_nodes || [], false);
    s.logic_nodes = [...(s.logic_nodes || []), ...appendLns];
  }
  _flowAddOpen = null;
  _composerSelected = { type: 'agent' };
  _markComposerDirty();
  _refreshComposerView();
  const ok = proposal.replace_flow === false ? 'Changes merged into canvas' : 'Workflow applied to canvas';
  if (typeof showToast === 'function') showToast(ok, 'success');
};

/* ───── Palette ───── */
let _paletteTab = 'agents';
let _paletteCollapsed = false;
let _paletteWidth = 0;
let _detailsWidth = 0;

window._togglePaletteCollapse = function () {
  _paletteCollapsed = !_paletteCollapsed;
  const palette = document.getElementById('cmp-palette');
  if (!palette) return;
  palette.classList.toggle('cmp-palette-collapsed', _paletteCollapsed);
  const btn = palette.querySelector('.cmp-palette-collapse-btn svg path');
  if (btn) btn.setAttribute('d', _paletteCollapsed ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6');
  btn?.closest('button')?.setAttribute('title', _paletteCollapsed ? 'Expand palette' : 'Collapse palette');
};

function _initPaletteResize() {
  const handle = document.getElementById('cmp-palette-resize');
  const palette = document.getElementById('cmp-palette');
  if (!handle || !palette) return;

  let startX, startW;
  const onMouseMove = (e) => {
    const newW = Math.max(200, Math.min(600, startW + (e.clientX - startX)));
    palette.style.width = newW + 'px';
    _paletteWidth = newW;
  };
  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    handle.classList.remove('cmp-palette-resize-active');
  };

  handle.addEventListener('mousedown', (e) => {
    if (_paletteCollapsed) return;
    e.preventDefault();
    startX = e.clientX;
    startW = palette.offsetWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    handle.classList.add('cmp-palette-resize-active');
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

function _initDetailsResize() {
  const handle = document.getElementById('cmp-details-resize');
  const panel = document.getElementById('cmp-details');
  if (!handle || !panel) return;

  let startX, startW;
  const onMouseMove = (e) => {
    const newW = Math.max(240, Math.min(600, startW - (e.clientX - startX)));
    panel.style.width = newW + 'px';
    _detailsWidth = newW;
  };
  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    handle.classList.remove('cmp-details-resize-active');
  };

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startX = e.clientX;
    startW = panel.offsetWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    handle.classList.add('cmp-details-resize-active');
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

function _renderPalette() {
  const wfId = _composerState?.source_workflow_id;
  const hasProb = !!_composerState?.probabilistic_config;
  const isProbLocal = hasProb && _probPaletteScope === 'local' && wfId;

  const filteredSkills = isProbLocal
    ? _composerSkills.filter(s => s.source_workflow_id === wfId)
    : _composerSkills;

  const skillsByCategory = {};
  filteredSkills.forEach(s => {
    const cat = s.category || 'other';
    if (!skillsByCategory[cat]) skillsByCategory[cat] = [];
    skillsByCategory[cat].push(s);
  });
  const toolsByCategory = {};
  _composerTools.forEach(t => {
    const cat = t.category || 'utility';
    if (!toolsByCategory[cat]) toolsByCategory[cat] = [];
    toolsByCategory[cat].push(t);
  });

  const subAgentTile = `
    <div class="cmp-palette-tile cmp-palette-tile-add" draggable="true" data-cmp-drag="new-subagent" onclick="_composerAddSubAgent()">
      <span class="cmp-palette-icon cmp-palette-icon-add"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span>
      <span class="cmp-palette-info"><span class="cmp-palette-name">New Agent</span><span class="cmp-palette-meta">Create and add to flow</span></span>
    </div>
  `;

  const skillCount = filteredSkills.length;
  const toolCount = _composerTools.length;
  const logicCount = Object.keys(LOGIC_NODE_TYPES).length;
  const availableAgents = (_opsAgentsList || []).filter(a => {
    if (a.type !== 'agent') return false;
    if (_composerState && a.id === _composerState.id) return false;
    if (isProbLocal) return a.source_workflow_id === wfId || (_composerState?.sub_agents || []).some(sa => sa.id === a.id);
    return true;
  });
  const agentTabCount = availableAgents.length;
  const activeTab = _paletteTab;

  const tabs = `
    <div class="cmp-palette-tabs">
      <button class="cmp-palette-tab ${activeTab === 'agents' ? 'cmp-palette-tab-active' : ''}" onclick="_switchPaletteTab('agents')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Agents <span class="cmp-palette-tab-count">${agentTabCount}</span>
      </button>
      <button class="cmp-palette-tab ${activeTab === 'skills' ? 'cmp-palette-tab-active' : ''}" onclick="_switchPaletteTab('skills')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        Skills <span class="cmp-palette-tab-count">${skillCount}</span>
      </button>
      <button class="cmp-palette-tab ${activeTab === 'tools' ? 'cmp-palette-tab-active' : ''}" onclick="_switchPaletteTab('tools')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        Tools <span class="cmp-palette-tab-count">${toolCount}</span>
      </button>
      <button class="cmp-palette-tab ${activeTab === 'logic' ? 'cmp-palette-tab-active' : ''}" onclick="_switchPaletteTab('logic')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22V12"/><path d="M3 3l9 9"/><path d="M21 3l-9 9"/></svg>
        Logic <span class="cmp-palette-tab-count">${logicCount}</span>
      </button>
    </div>
  `;

  const searchPlaceholder = activeTab === 'agents' ? 'Search agents...' : activeTab === 'skills' ? 'Search skills...' : activeTab === 'tools' ? 'Search tools...' : 'Search logic...';
  const search = (activeTab !== 'logic') ? `<input type="text" class="cmp-palette-search" placeholder="${searchPlaceholder}" oninput="_filterPalette(this.value)" />` : '';

  let content = '';
  if (activeTab === 'agents') {
    const currentChildIds = (_composerState?.sub_agents || []).map(sa => sa.id).filter(Boolean);
    const byRole = {};
    availableAgents.forEach(a => {
      const r = a.role || 'executor';
      if (!byRole[r]) byRole[r] = [];
      byRole[r].push(a);
    });
    if (Object.keys(byRole).length === 0) {
      content = '<div class="cmp-palette-empty">No agents available</div>';
    } else {
      content = Object.entries(byRole).map(([role, agents], idx) => {
        const roleColor = ROLE_COLORS[role] || ROLE_COLORS.executor;
        const items = agents.map(a => {
          const alreadyAdded = currentChildIds.includes(a.id);
          return `
            <div class="cmp-pal-item${alreadyAdded ? ' cmp-pal-item-added' : ''}" data-cmp-search="${esc((a.name + ' ' + a.description + ' ' + role).toLowerCase())}"
                 onclick="${alreadyAdded ? '' : `_addExistingAgent(${a.id})`}" title="${alreadyAdded ? 'Already in flow' : 'Click to add to flow'}">
              <div class="cmp-pal-item-name">${esc(a.name)}${alreadyAdded ? ' <span style="color:#9CA3AF;font-size:9px">✓ in flow</span>' : ''}</div>
              <div class="cmp-pal-item-meta">${esc((a.description || '').slice(0, 60))}</div>
            </div>
          `;
        }).join('');
        return `
          <div class="cmp-pal-accordion${idx === 0 ? ' cmp-pal-open' : ''}" data-group="agents">
            <button type="button" class="cmp-pal-accordion-header" onclick="_togglePaletteGroup(this)">
              <span class="cmp-pal-accordion-dot" style="background:${roleColor.bg};border:1px solid ${roleColor.border}"></span>
              <span class="cmp-pal-accordion-label">${esc(role)}</span>
              <span class="cmp-pal-accordion-count">${agents.length}</span>
              <svg class="cmp-pal-accordion-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div class="cmp-pal-accordion-body">${items}</div>
          </div>
        `;
      }).join('');
    }
  } else if (activeTab === 'skills') {
    const catEntries = Object.entries(skillsByCategory);
    if (catEntries.length === 0) {
      content = '<div class="cmp-palette-empty">No skills available</div>';
    } else {
      content = catEntries.map(([cat, skills], idx) => {
        const label = SKILL_CATEGORIES[cat]?.label || cat;
        const color = SKILL_CATEGORIES[cat]?.color || '#6B7280';
        const items = skills.map(s => `
          <div class="cmp-pal-item" draggable="true" data-cmp-drag="skill" data-cmp-id="${s.id}" data-cmp-search="${esc((s.name + ' ' + s.description + ' ' + cat).toLowerCase())}">
            <div class="cmp-pal-item-name">${esc(s.name)}</div>
            <div class="cmp-pal-item-meta">${(s.steps || []).length} steps</div>
          </div>
        `).join('');
        return `
          <div class="cmp-pal-accordion${idx === 0 ? ' cmp-pal-open' : ''}" data-group="skills">
            <button type="button" class="cmp-pal-accordion-header" onclick="_togglePaletteGroup(this)">
              <span class="cmp-pal-accordion-dot" style="background:${color}"></span>
              <span class="cmp-pal-accordion-label">${esc(label)}</span>
              <span class="cmp-pal-accordion-count">${skills.length}</span>
              <svg class="cmp-pal-accordion-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div class="cmp-pal-accordion-body">${items}</div>
          </div>
        `;
      }).join('');
    }
  } else if (activeTab === 'tools') {
    const catEntries = Object.entries(toolsByCategory);
    if (catEntries.length === 0) {
      content = '<div class="cmp-palette-empty">No tools available</div>';
    } else {
      content = catEntries.map(([cat, tools], idx) => {
        const label = TOOL_CATEGORIES[cat]?.label || cat;
        const color = TOOL_CATEGORIES[cat]?.color || '#6B7280';
        const items = tools.map(t => {
          const icon = toolIcon ? toolIcon(t.icon) : '';
          return `
            <div class="cmp-pal-item" draggable="true" data-cmp-drag="tool" data-cmp-id="${t.id}" data-cmp-search="${esc((t.name + ' ' + t.description + ' ' + cat).toLowerCase())}">
              <span class="cmp-pal-item-icon">${icon}</span>
              <div class="cmp-pal-item-name">${esc(t.name)}</div>
              <div class="cmp-pal-item-meta">${t.type === 'platform' ? 'Platform' : 'Custom'}</div>
            </div>
          `;
        }).join('');
        return `
          <div class="cmp-pal-accordion${idx === 0 ? ' cmp-pal-open' : ''}" data-group="tools">
            <button type="button" class="cmp-pal-accordion-header" onclick="_togglePaletteGroup(this)">
              <span class="cmp-pal-accordion-dot" style="background:${color}"></span>
              <span class="cmp-pal-accordion-label">${esc(label)}</span>
              <span class="cmp-pal-accordion-count">${tools.length}</span>
              <svg class="cmp-pal-accordion-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div class="cmp-pal-accordion-body">${items}</div>
          </div>
        `;
      }).join('');
    }
  } else {
    content = Object.entries(LOGIC_NODE_TYPES).map(([type, meta]) => `
      <div class="cmp-pal-logic-item" onclick="_composerQuickAddLogic('${type}')">
        <span class="cmp-pal-logic-icon" style="background:${meta.bg};color:${meta.color};border-color:${meta.border}">${meta.icon}</span>
        <div class="cmp-pal-logic-info">
          <div class="cmp-pal-item-name">${esc(meta.label)}</div>
          <div class="cmp-pal-item-meta">${esc(meta.desc)}</div>
        </div>
      </div>
    `).join('');
    content += '<div class="cmp-palette-empty" style="font-size:11px;padding:8px">Click a node to add it after the last sub-agent, or use the <strong>+</strong> buttons on the canvas.</div>';
  }

  const scopeToggle = hasProb ? `
    <div class="cmp-prob-scope-toggle">
      <button class="cmp-prob-scope-btn ${_probPaletteScope === 'local' ? 'cmp-prob-scope-active' : ''}" onclick="_switchProbPaletteScope('local')">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
        Local
      </button>
      <button class="cmp-prob-scope-btn ${_probPaletteScope === 'global' ? 'cmp-prob-scope-active' : ''}" onclick="_switchProbPaletteScope('global')">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
        Global
      </button>
    </div>
  ` : '';

  return `
    ${subAgentTile}
    ${scopeToggle}
    ${tabs}
    ${search}
    <div class="cmp-pal-content">${content}</div>
  `;
}

window._switchPaletteTab = function (tab) {
  _paletteTab = tab;
  const inner = document.getElementById('cmp-palette-inner');
  if (inner) { inner.innerHTML = _renderPalette(); _initComposerDragDrop(); }
};

window._togglePaletteGroup = function (headerEl) {
  const accordion = headerEl.closest('.cmp-pal-accordion');
  if (!accordion) return;
  accordion.classList.toggle('cmp-pal-open');
};

window._downloadAgentMarkdown = function () {
  if (!_composerState) return;
  const md = agentToMarkdown(_composerState);
  const fileName = `${sanitizeFilename(_composerState.name) || 'agent'}.md`;
  downloadTextFile(fileName, md);
  if (typeof showToast === 'function') showToast('Agent markdown downloaded', 'success');
};

window._composerQuickAddLogic = function (type) {
  const slot = _composerState.sub_agents.length;
  _insertLogicNode(slot, type);
};

window._filterPalette = function (query) {
  const q = (query || '').toLowerCase();
  document.querySelectorAll('.cmp-pal-item[data-cmp-search]').forEach(item => {
    item.style.display = !q || item.dataset.cmpSearch.includes(q) ? '' : 'none';
  });
  document.querySelectorAll('.cmp-pal-accordion').forEach(acc => {
    const visible = acc.querySelectorAll('.cmp-pal-item:not([style*="display: none"])');
    if (q) {
      acc.classList.toggle('cmp-pal-open', visible.length > 0);
      acc.style.display = visible.length > 0 ? '' : 'none';
    } else {
      acc.style.display = '';
    }
  });
};

/* ───── Canvas (center) ───── */
function _renderCanvas() {
  const s = _composerState;
  const selectedAgent = _composerSelected?.type === 'agent';
  const lnCount = (s.logic_nodes || []).length;
  const isBlank = !s.goal && s.sub_agents.length === 0 && lnCount === 0;

  const agentCard = `
    <div class="cmp-agent-card ${selectedAgent ? 'cmp-selected' : ''}" onclick="_composerSelect('agent')">
      <div class="cmp-agent-card-top">
        <div class="cmp-agent-card-identity">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 014 4v1h1a3 3 0 013 3v4a3 3 0 01-3 3h-1v1a4 4 0 01-8 0v-1H7a3 3 0 01-3-3v-4a3 3 0 013-3h1V6a4 4 0 014-4z"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/></svg>
          <div>
            <div class="cmp-agent-card-name">${esc(s.name || 'Untitled Agent')}</div>
            <div class="cmp-agent-card-goal">${esc(s.goal || 'Click here to define a goal for this agent')}</div>
          </div>
        </div>
        <div class="cmp-agent-card-badges">
          <span class="cmp-status-badge cmp-status-${esc(s.status)}">${esc(s.status)}</span>
          <span class="cmp-count-badge">${s.sub_agents.length} agent${s.sub_agents.length !== 1 ? 's' : ''}${lnCount > 0 ? ` · ${lnCount} logic` : ''}</span>
        </div>
      </div>
      ${isBlank ? `
        <div class="cmp-agent-getting-started">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          <span>Click + below to add agents and logic nodes, or browse the Agents tab in the palette</span>
        </div>
      ` : ''}
      ${s.tool_ids.length > 0 ? `<div class="cmp-agent-tools-row">Agent tools: ${s.tool_ids.map(id => { const t = _composerTools.find(x => x.id === id); return t ? `<span class="cmp-chip cmp-chip-tool-sm" title="${esc(t.name)}">${toolIcon ? toolIcon(t.icon) : ''}</span>` : ''; }).join('')}</div>` : ''}
      ${(s.triggers || []).length > 0 ? `<div class="cmp-agent-triggers-row">${(s.triggers || []).filter(t => t.enabled !== false).map(t => { const m = TRIGGER_TYPES[t.type]; return m ? `<span class="cmp-trigger-pill" style="--trigger-color:${m.color}" title="${esc(m.label + ': ' + (t.event_name || t.frequency || t.segment_name || t.type))}">${m.icon} ${esc(m.label)}</span>` : ''; }).join('')}${(s.triggers || []).some(t => t.enabled === false) ? `<span class="cmp-trigger-pill cmp-trigger-pill-off" title="Disabled triggers">+${(s.triggers || []).filter(t => t.enabled === false).length} off</span>` : ''}</div>` : ''}
    </div>
  `;

  const logicNodes = s.logic_nodes || [];
  const maxSlot = s.sub_agents.length;
  logicNodes.forEach(n => { if (n.slot > maxSlot) n.slot = maxSlot; });

  // Build a set of sub-agent indices consumed by branch containers (condition & parallel)
  const branchedIndices = new Set();
  const branchConditions = [];
  const branchParallels = [];
  const branchABSplits = [];

  logicNodes.filter(n => n.type === 'condition').forEach(cond => {
    const c = cond.config || {};
    const thenT = (c.then_target !== null && c.then_target !== undefined) ? c.then_target : -1;
    const elseT = (c.else_target !== null && c.else_target !== undefined) ? c.else_target : -1;
    if (thenT >= 0 && elseT >= 0 && thenT !== elseT) {
      const lo = Math.min(thenT, elseT);
      const hi = Math.max(thenT, elseT);
      for (let k = lo; k <= hi; k++) branchedIndices.add(k);
      branchConditions.push({ node: cond, thenT, elseT, lo, hi });
    }
  });

  logicNodes.filter(n => n.type === 'parallel').forEach(par => {
    const branches = Array.isArray(par.config?.branches) ? par.config.branches : [];
    if (branches.length >= 2) {
      branches.forEach(i => branchedIndices.add(i));
      branchParallels.push({ node: par, branches });
    }
  });

  logicNodes.filter(n => n.type === 'ab_split').forEach(ab => {
    const variants = Array.isArray(ab.config?.variants) ? ab.config.variants : [];
    const targets = variants.map(v => v.target).filter(t => t !== null && t !== undefined);
    if (targets.length >= 2) {
      targets.forEach(i => branchedIndices.add(i));
      branchABSplits.push({ node: ab, variants: ab.config.variants, targets });
    }
  });

  let flowHTML = '';
  const nodesAtSlot0 = logicNodes.filter(n => n.slot === 0);
  const flowStartsEmpty = s.sub_agents.length === 0 && nodesAtSlot0.length === 0;
  if (flowStartsEmpty) {
    flowHTML += _renderFlowConnector(0);
  }

  for (let slot = 0; slot <= maxSlot; slot++) {
    const nodesAtSlot = logicNodes.filter(n => n.slot === slot);
    const hasSA = slot < s.sub_agents.length && !branchedIndices.has(slot);
    const hasNodes = nodesAtSlot.length > 0;

    for (const node of nodesAtSlot) {
      flowHTML += _renderFlowLine();

      const bc = branchConditions.find(b => b.node.id === node.id);
      const bp = branchParallels.find(b => b.node.id === node.id);
      const ba = branchABSplits.find(b => b.node.id === node.id);
      if (bc) {
        flowHTML += _renderBranchContainer(bc);
      } else if (bp) {
        flowHTML += _renderParallelContainer(bp);
      } else if (ba) {
        flowHTML += _renderABSplitContainer(ba);
      } else {
        flowHTML += _renderLogicNodeCard(node);
      }
    }

    if (hasSA || hasNodes) {
      flowHTML += _renderFlowConnector(slot);
    }

    if (hasSA) {
      flowHTML += _renderSubAgentFlowCard(s.sub_agents[slot], slot);
    }
  }

  // After the last sub-agent, slot === sub_agents.length has no hasSA, so no connector runs there
  // unless logic nodes exist at that slot. Always offer a trailing + to extend the flow.
  if (!flowStartsEmpty) {
    const endSlot = s.sub_agents.length;
    const hasNodesAtEndSlot = logicNodes.some(n => n.slot === endSlot);
    if (!hasNodesAtEndSlot) {
      flowHTML += _renderFlowConnector(endSlot);
    }
  }

  const g = s.guardrails;
  const guardrailsCard = `
    <div class="cmp-guardrails-card" onclick="_composerSelect('agent')">
      <div class="cmp-guardrails-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Guardrails
      </div>
      <div class="cmp-guardrails-row">
        <div class="cmp-guardrail-item"><span class="cmp-guardrail-val">${g.max_messages_per_contact_per_day ?? '—'}</span><span class="cmp-guardrail-lbl">max msg/day</span></div>
        <div class="cmp-guardrail-item"><span class="cmp-guardrail-val">${g.channel_limits?.email ?? '—'}</span><span class="cmp-guardrail-lbl">email</span></div>
        <div class="cmp-guardrail-item"><span class="cmp-guardrail-val">${g.channel_limits?.sms ?? '—'}</span><span class="cmp-guardrail-lbl">sms</span></div>
        <div class="cmp-guardrail-item"><span class="cmp-guardrail-val">${g.channel_limits?.push ?? '—'}</span><span class="cmp-guardrail-lbl">push</span></div>
        <div class="cmp-guardrail-item"><span class="cmp-guardrail-val">${g.require_approval ? 'Yes' : 'No'}</span><span class="cmp-guardrail-lbl">approval</span></div>
      </div>
    </div>
  `;

  const wfRef = s.source_workflow_id
    ? `<div class="cmp-workflow-ref"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/></svg> Derived from ${esc(_wfLabel(s.source_workflow_id))}</div>`
    : '';

  return `
    <div class="cmp-canvas-scroll">
      ${wfRef}
      ${agentCard}
      <div class="cmp-flow" id="cmp-flow">
        ${flowHTML}
      </div>
      <div class="cmp-flow-line-short"></div>
      ${guardrailsCard}
    </div>
  `;
}

function _renderFlowLine() {
  return '<div class="cmp-flow-line"></div>';
}

function _renderFlowConnector(slot) {
  const isOpen = _flowAddOpen === slot;
  const pickerItems = Object.entries(LOGIC_NODE_TYPES).map(([type, meta]) =>
    `<button class="cmp-flow-pick" onclick="event.stopPropagation();_insertLogicNode(${slot},'${type}')" title="${esc(meta.label)}: ${esc(meta.desc)}">
      <span class="cmp-flow-pick-icon" style="color:${meta.color}">${meta.icon}</span>
      <span class="cmp-flow-pick-label">${esc(meta.label)}</span>
    </button>`
  ).join('');

  return `
    <div class="cmp-flow-connector ${isOpen ? 'cmp-flow-open' : ''}" data-flow-slot="${slot}">
      <div class="cmp-flow-line"></div>
      <button class="cmp-flow-add-btn" onclick="event.stopPropagation();_toggleFlowAdd(${slot})" title="Add agent or logic node">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      ${isOpen ? `
        <div class="cmp-flow-picker">
          ${pickerItems}
          <span class="cmp-flow-pick-divider"></span>
          <button class="cmp-flow-pick cmp-flow-pick-sa" onclick="event.stopPropagation();_insertSubAgentAt(${slot})" title="Add a new agent at this position">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            <span class="cmp-flow-pick-label">New agent</span>
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

function _isLogicNodeIncomplete(node) {
  const c = node.config || {};
  if (node.type === 'condition' && !c.expression) return true;
  if (node.type === 'gate' && !c.expression) return true;
  if (node.type === 'loop' && c.loop_type === 'foreach' && !c.iterator) return true;
  if (node.type === 'transform' && (!c.mappings || c.mappings.length === 0 || c.mappings.every(m => !m.from && !m.to))) return true;
  if (node.type === 'parallel' && (!c.branches || c.branches.length < 2)) return true;
  if (node.type === 'ab_split') {
    const v = c.variants || [];
    if (v.length < 2) return true;
    if (v.reduce((s, x) => s + (x.weight || 0), 0) !== 100) return true;
  }
  if (node.type === 'wait_event' && !c.event_type) return true;
  if (node.type === 'invoke_agent' && !c.target_agent_id) return true;
  return false;
}

function _renderForkSVG(count, color) {
  const w = 200;
  const h = 36;
  const pad = 20;
  const gap = (w - 2 * pad) / (count - 1 || 1);
  let lines = `<line x1="${w/2}" y1="0" x2="${w/2}" y2="12" stroke="${color}" stroke-width="2"/>`;
  lines += `<line x1="${pad}" y1="12" x2="${w - pad}" y2="12" stroke="${color}" stroke-width="2"/>`;
  lines += `<circle cx="${w/2}" cy="12" r="3.5" fill="${color}"/>`;
  for (let i = 0; i < count; i++) {
    const x = count === 1 ? w / 2 : pad + i * gap;
    lines += `<line x1="${x}" y1="12" x2="${x}" y2="30" stroke="${color}" stroke-width="2"/>`;
    lines += `<polygon points="${x-4},30 ${x},36 ${x+4},30" fill="${color}"/>`;
  }
  return `<svg class="cmp-fork-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${lines}</svg>`;
}

function _renderJoinSVG(count, color, label) {
  const w = 200;
  const h = 36;
  const pad = 20;
  const gap = (w - 2 * pad) / (count - 1 || 1);
  let lines = '';
  for (let i = 0; i < count; i++) {
    const x = count === 1 ? w / 2 : pad + i * gap;
    lines += `<line x1="${x}" y1="0" x2="${x}" y2="22" stroke="${color}" stroke-width="2"/>`;
  }
  lines += `<line x1="${pad}" y1="22" x2="${w - pad}" y2="22" stroke="${color}" stroke-width="2"/>`;
  lines += `<circle cx="${w/2}" cy="22" r="3.5" fill="${color}"/>`;
  lines += `<line x1="${w/2}" y1="22" x2="${w/2}" y2="36" stroke="${color}" stroke-width="2"/>`;
  return `<div class="cmp-join-wrap"><svg class="cmp-fork-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${lines}</svg><span class="cmp-join-label" style="color:${color}">${label} →</span></div>`;
}

function _renderBranchContainer(bc) {
  const { node, thenT, elseT } = bc;
  const c = node.config || {};
  const sas = _composerState.sub_agents || [];
  const isSelected = _composerSelected?.type === 'logic' && _composerSelected?.id === node.id;
  const meta = LOGIC_NODE_TYPES.condition;

  const thenLabel = c.then_label || 'Yes';
  const elseLabel = c.else_label || 'No';

  // Determine which side has the exclusive sub-agents and which is the "skip" side
  const lo = Math.min(thenT, elseT);
  const hi = Math.max(thenT, elseT);
  const thenIsLo = thenT <= elseT;

  // Collect exclusive sub-agents (between lo and hi) — these only run on one branch
  const exclusiveIndices = [];
  for (let i = lo; i < hi; i++) exclusiveIndices.push(i);

  // Build the then-side and else-side sub-agent preview cards
  const buildBranchCards = (indices) => {
    if (indices.length === 0) return '<div class="cmp-branch-empty">Continue to next step</div>';
    return indices.map(i => {
      const sa = sas[i];
      if (!sa) return '';
      const skillCount = (sa.skill_ids || []).length;
      const instrPreview = (sa.system_instructions || '').slice(0, 60);
      return `<div class="cmp-branch-sa-card" onclick="_composerSelect('sub-agent',${i})">
        <div class="cmp-branch-sa-header">
          <span class="cmp-sa-seq">${i + 1}</span>
          ${_roleBadgeHTML(sa.role)}
          <button type="button" class="cmp-remove-btn" onclick="event.stopPropagation();_composerRemoveSubAgent(${i})" title="Remove">&times;</button>
        </div>
        <div class="cmp-branch-sa-name">${esc(sa.name || 'Unnamed')}</div>
        <div class="cmp-branch-sa-desc">${esc(sa.description || 'No description')}</div>
        ${skillCount > 0 ? `<div class="cmp-branch-sa-skills">${skillCount} skill${skillCount !== 1 ? 's' : ''} attached</div>` : ''}
        ${instrPreview ? `<div class="cmp-branch-sa-instr">${esc(instrPreview)}...</div>` : ''}
      </div>`;
    }).join('');
  };

  // Then side: show sub-agents from thenT up to (but not including) elseT
  // Else side: show sub-agents from elseT up to (but not including) thenT
  // If one side has no exclusive sub-agents, show the convergence sub-agent as a preview
  let thenIndices, elseIndices;
  if (thenIsLo) {
    thenIndices = exclusiveIndices;
    elseIndices = elseT < sas.length ? [elseT] : [];
  } else {
    thenIndices = thenT < sas.length ? [thenT] : [];
    elseIndices = exclusiveIndices;
  }
  const thenCards = buildBranchCards(thenIndices);
  const elseCards = buildBranchCards(elseIndices);

  // Logic nodes that sit between the exclusive sub-agents (rare but handle)
  const logicNodes = _composerState.logic_nodes || [];
  const exclusiveLNs = logicNodes.filter(n => n.id !== node.id && n.slot >= lo && n.slot < hi);
  const exclusiveLNHTML = exclusiveLNs.map(n => `<div class="cmp-branch-ln-mini">${(LOGIC_NODE_TYPES[n.type] || {}).icon || ''} ${esc(n.label || n.type)}</div>`).join('');

  let detail = c.expression ? `If ${c.expression}` : '';

  return `
    <div class="cmp-branch-container ${isSelected ? 'cmp-selected' : ''}" onclick="_composerSelect('logic','${node.id}')">
      <div class="cmp-branch-condition-card" style="--ln-color:${meta.color};--ln-bg:${meta.bg};--ln-border:${meta.border}">
        <span class="cmp-ln-handle" draggable="true" title="Drag to reposition">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="4" r="2"/><circle cx="16" cy="4" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="20" r="2"/><circle cx="16" cy="20" r="2"/></svg>
        </span>
        <span class="cmp-logic-icon">${meta.icon}</span>
        <div class="cmp-logic-body">
          <span class="cmp-logic-type">CONDITION</span>
          <span class="cmp-logic-label">${esc(node.label || detail || 'Configure condition')}</span>
        </div>
        <button type="button" class="cmp-remove-btn" onclick="event.stopPropagation();_removeLogicNode('${node.id}')" title="Remove">&times;</button>
      </div>

      ${_renderForkSVG(2, '#D97706')}

      <div class="cmp-branch-sides">
        <div class="cmp-branch-side cmp-branch-then-side">
          <div class="cmp-branch-label cmp-branch-label-then">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            ${esc(thenLabel)}
          </div>
          ${thenCards}
          ${thenIsLo && exclusiveLNHTML ? `<div class="cmp-branch-extra-ln">${exclusiveLNHTML}</div>` : ''}
        </div>
        <div class="cmp-branch-side cmp-branch-else-side">
          <div class="cmp-branch-label cmp-branch-label-else">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ${esc(elseLabel)}
          </div>
          ${elseCards}
          ${!thenIsLo && exclusiveLNHTML ? `<div class="cmp-branch-extra-ln">${exclusiveLNHTML}</div>` : ''}
        </div>
      </div>
    </div>
  `;
}

function _renderParallelContainer(bp) {
  const { node, branches } = bp;
  const c = node.config || {};
  const sas = _composerState.sub_agents || [];
  const isSelected = _composerSelected?.type === 'logic' && _composerSelected?.id === node.id;
  const meta = LOGIC_NODE_TYPES.parallel;
  const waitMode = c.wait_mode || 'all';
  const waitLabel = waitMode === 'any' ? 'Race — first to finish' : 'Join — wait for all';

  const branchCards = branches.map(i => {
    const sa = sas[i];
    if (!sa) return '';
    const skillCount = (sa.skill_ids || []).length;
    const instrPreview = (sa.system_instructions || '').slice(0, 60);
    return `<div class="cmp-parallel-branch-col">
      <div class="cmp-branch-sa-card" onclick="event.stopPropagation();_composerSelect('sub-agent',${i})">
        <div class="cmp-branch-sa-header">
          <span class="cmp-sa-seq">${i + 1}</span>
          ${_roleBadgeHTML(sa.role)}
          <button type="button" class="cmp-remove-btn" onclick="event.stopPropagation();_composerRemoveSubAgent(${i})" title="Remove">&times;</button>
        </div>
        <div class="cmp-branch-sa-name">${esc(sa.name || 'Unnamed')}</div>
        <div class="cmp-branch-sa-desc">${esc(sa.description || 'No description')}</div>
        ${skillCount > 0 ? `<div class="cmp-branch-sa-skills">${skillCount} skill${skillCount !== 1 ? 's' : ''} attached</div>` : ''}
        ${instrPreview ? `<div class="cmp-branch-sa-instr">${esc(instrPreview)}...</div>` : ''}
      </div>
    </div>`;
  }).join('');

  return `
    <div class="cmp-parallel-container ${isSelected ? 'cmp-selected' : ''}" onclick="_composerSelect('logic','${node.id}')">
      <div class="cmp-parallel-header-card" style="--ln-color:${meta.color};--ln-bg:${meta.bg};--ln-border:${meta.border}">
        <span class="cmp-ln-handle" draggable="true" title="Drag to reposition">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="4" r="2"/><circle cx="16" cy="4" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="20" r="2"/><circle cx="16" cy="20" r="2"/></svg>
        </span>
        <span class="cmp-logic-icon">${meta.icon}</span>
        <div class="cmp-logic-body">
          <span class="cmp-logic-type">PARALLEL</span>
          <span class="cmp-logic-label">${esc(node.label || c.description || 'Run sub-agents simultaneously')}</span>
        </div>
        <span class="cmp-parallel-wait-mode">${esc(waitLabel)}</span>
        <button type="button" class="cmp-remove-btn" onclick="event.stopPropagation();_removeLogicNode('${node.id}')" title="Remove">&times;</button>
      </div>

      ${_renderForkSVG(branches.length, '#2680EB')}

      <div class="cmp-parallel-branches-grid" style="grid-template-columns:repeat(${branches.length},1fr)">
        ${branchCards}
      </div>

      ${_renderJoinSVG(branches.length, '#2680EB', waitMode === 'any' ? 'Any completes' : 'All complete')}
    </div>
  `;
}

function _renderABSplitContainer(ba) {
  const { node, variants, targets } = ba;
  const sas = _composerState.sub_agents || [];
  const isSelected = _composerSelected?.type === 'logic' && _composerSelected?.id === node.id;
  const meta = LOGIC_NODE_TYPES.ab_split;

  const validVariants = variants.filter(v => v.target !== null && v.target !== undefined);
  const branchCards = validVariants.map(v => {
    const sa = sas[v.target];
    if (!sa) return '';
    const skillCount = (sa.skill_ids || []).length;
    const instrPreview = (sa.system_instructions || '').slice(0, 60);
    return `<div class="cmp-parallel-branch-col">
      <div class="cmp-branch-label cmp-branch-label-ab">
        <strong>${esc(v.name)}</strong> — ${v.weight}%
      </div>
      <div class="cmp-branch-sa-card" onclick="event.stopPropagation();_composerSelect('sub-agent',${v.target})">
        <div class="cmp-branch-sa-header">
          <span class="cmp-sa-seq">${v.target + 1}</span>
          ${_roleBadgeHTML(sa.role)}
        </div>
        <div class="cmp-branch-sa-name">${esc(sa.name || 'Unnamed')}</div>
        <div class="cmp-branch-sa-desc">${esc(sa.description || 'No description')}</div>
        ${skillCount > 0 ? `<div class="cmp-branch-sa-skills">${skillCount} skill${skillCount !== 1 ? 's' : ''} attached</div>` : ''}
        ${instrPreview ? `<div class="cmp-branch-sa-instr">${esc(instrPreview)}...</div>` : ''}
      </div>
    </div>`;
  }).join('');

  const weightSummary = validVariants.map(v => `${v.name}: ${v.weight}%`).join(' / ');

  return `
    <div class="cmp-ab-container ${isSelected ? 'cmp-selected' : ''}" onclick="_composerSelect('logic','${node.id}')">
      <div class="cmp-ab-header-card" style="--ln-color:${meta.color};--ln-bg:${meta.bg};--ln-border:${meta.border}">
        <span class="cmp-ln-handle" draggable="true" title="Drag to reposition">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="4" r="2"/><circle cx="16" cy="4" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="20" r="2"/><circle cx="16" cy="20" r="2"/></svg>
        </span>
        <span class="cmp-logic-icon">${meta.icon}</span>
        <div class="cmp-logic-body">
          <span class="cmp-logic-type">A/B SPLIT</span>
          <span class="cmp-logic-label">${esc(node.label || weightSummary || 'Configure split')}</span>
        </div>
        <button type="button" class="cmp-remove-btn" onclick="event.stopPropagation();_removeLogicNode('${node.id}')" title="Remove">&times;</button>
      </div>

      ${_renderForkSVG(validVariants.length, '#9333EA')}

      <div class="cmp-parallel-branches-grid" style="grid-template-columns:repeat(${validVariants.length},1fr)">
        ${branchCards}
      </div>

      ${_renderJoinSVG(validVariants.length, '#9333EA', 'Winner or all complete')}
    </div>
  `;
}

function _renderLogicNodeCard(node) {
  const meta = LOGIC_NODE_TYPES[node.type] || LOGIC_NODE_TYPES.condition;
  const isSelected = _composerSelected?.type === 'logic' && _composerSelected?.id === node.id;
  const incomplete = _isLogicNodeIncomplete(node);
  let detail = '';
  const c = node.config || {};
  if (node.type === 'condition' && c.expression) detail = `If ${c.expression}`;
  else if (node.type === 'loop') detail = c.loop_type === 'foreach' ? `For each ${c.iterator || '...'}` : `Repeat ${c.count || 3}×`;
  else if (node.type === 'gate' && c.expression) detail = `Require: ${c.expression}`;
  else if (node.type === 'delay') detail = `Wait ${c.duration || 1} ${c.unit || 'hours'}`;
  else if (node.type === 'transform') detail = `${(c.mappings || []).length} mapping(s)`;
  else if (node.type === 'parallel') {
    const branchCount = (c.branches || []).length;
    detail = branchCount > 0 ? `${branchCount} sub-agent${branchCount !== 1 ? 's' : ''} in parallel` : 'Select sub-agents to parallelize';
  }
  else if (node.type === 'ab_split') {
    const variants = c.variants || [];
    detail = variants.length > 0 ? variants.map(v => `${v.name}: ${v.weight}%`).join(' / ') : 'Configure split';
  }
  else if (node.type === 'wait_event') {
    const evt = (c.event_type || 'event').replace(/_/g, ' ');
    detail = `Wait for ${evt}`;
    if (c.timeout_duration) detail += ` (timeout: ${c.timeout_duration} ${c.timeout_unit || 'hours'})`;
  }
  else if (node.type === 'invoke_agent') {
    if (c.target_agent_id) {
      const targetAgent = (_opsAgentsList || []).find(a => a.id === c.target_agent_id);
      detail = targetAgent ? `→ ${targetAgent.name}` : `→ Agent #${c.target_agent_id}`;
    } else {
      detail = 'Select target agent';
    }
  }

  const sas = _composerState.sub_agents;
  const _saName = idx => (idx !== null && idx !== undefined && sas[idx]) ? sas[idx].name || `Sub-agent ${idx + 1}` : null;
  const _arrow = '→';

  let branchHTML = '';
  if (node.type === 'condition') {
    const thenLbl = c.then_label || 'Yes';
    const elseLbl = c.else_label || 'No';
    const thenSA = _saName(c.then_target);
    const elseSA = _saName(c.else_target);
    branchHTML = `
      <div class="cmp-logic-branches">
        <span class="cmp-logic-branch cmp-logic-branch-then">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          ${esc(thenLbl)}${thenSA ? ` <span class="cmp-branch-target">${_arrow} ${esc(thenSA)}</span>` : ''}
        </span>
        <span class="cmp-logic-branch cmp-logic-branch-else">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ${esc(elseLbl)}${elseSA ? ` <span class="cmp-branch-target">${_arrow} ${esc(elseSA)}</span>` : ''}
        </span>
      </div>
    `;
  } else if (node.type === 'gate') {
    const fb = c.fallback || 'skip';
    const fbLabel = fb === 'stop' ? 'Stop' : fb === 'alert' ? 'Alert & continue' : fb === 'route' ? 'Route' : 'Skip';
    const fbSA = fb === 'route' ? _saName(c.fallback_target) : null;
    branchHTML = `
      <div class="cmp-logic-branches">
        <span class="cmp-logic-branch cmp-logic-branch-then"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Pass</span>
        <span class="cmp-logic-branch cmp-logic-branch-else">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ${esc(fbLabel)}${fbSA ? ` <span class="cmp-branch-target">${_arrow} ${esc(fbSA)}</span>` : ''}
        </span>
      </div>
    `;
  } else if (node.type === 'parallel') {
    const branches = (c.branches || []);
    if (branches.length > 0) {
      const waitLabel = c.wait_mode === 'any' ? 'Race (any)' : 'Join (all)';
      const branchPills = branches.map(i => {
        const name = _saName(i);
        return name ? `<span class="cmp-parallel-pill">${esc(name)}</span>` : null;
      }).filter(Boolean).join('');
      branchHTML = `
        <div class="cmp-logic-branches cmp-parallel-branches">
          ${branchPills}
          <span class="cmp-parallel-wait-badge">${esc(waitLabel)}</span>
        </div>
      `;
    }
  } else if (node.type === 'ab_split') {
    const variants = (c.variants || []);
    if (variants.length > 0) {
      const pills = variants.map(v => {
        const saName = _saName(v.target);
        return `<span class="cmp-ab-pill" style="background:${v.weight > 0 ? '#FAF5FF' : '#F3F4F6'};border-color:${v.weight > 0 ? '#D8B4FE' : '#E5E7EB'}">
          <strong>${esc(v.name)}</strong> ${v.weight}%${saName ? ` <span class="cmp-branch-target">${_arrow} ${esc(saName)}</span>` : ''}
        </span>`;
      }).join('');
      branchHTML = `<div class="cmp-logic-branches cmp-parallel-branches">${pills}</div>`;
    }
  }

  return `
    <div class="cmp-logic-node ${isSelected ? 'cmp-selected' : ''} ${incomplete ? 'cmp-logic-incomplete' : ''}" style="--ln-color:${meta.color};--ln-bg:${meta.bg};--ln-border:${meta.border}" data-ln-id="${node.id}" onclick="_composerSelect('logic','${node.id}')">
      <span class="cmp-ln-handle" draggable="true" title="Drag to reposition">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="4" r="2"/><circle cx="16" cy="4" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="20" r="2"/><circle cx="16" cy="20" r="2"/></svg>
      </span>
      <span class="cmp-logic-icon">${meta.icon}</span>
      <div class="cmp-logic-body">
        <span class="cmp-logic-type">${esc(meta.label)}${incomplete ? ' <span class="cmp-logic-warn" title="Needs configuration">●</span>' : ''}</span>
        <span class="cmp-logic-label">${esc(node.label || detail || meta.desc)}</span>
        ${branchHTML}
      </div>
      <button type="button" class="cmp-remove-btn" onclick="event.stopPropagation();_removeLogicNode('${node.id}')" title="Remove">&times;</button>
    </div>
  `;
}

function _renderSubAgentFlowCard(sa, i) {
  const isSelected = _composerSelected?.type === 'sub-agent' && _composerSelected?.index === i;
  const skillChips = (sa.skill_ids || []).map(sid => _skillChipHTML(sid, i)).join('');
  const toolChips = (sa.tool_ids || []).map(tid => _toolChipHTML(tid, i)).join('');
  const instrPreview = (sa.system_instructions || '').slice(0, 80);

  const pc = _composerState?.probabilistic_config;
  let probSkillChainHTML = '';
  let probEdgesHTML = '';

  if (pc) {
    const chain = pc.skill_chains?.[String(i)] || [];
    const isExpanded = _probExpandedAgents[i];
    const allSkills = _composerSkills || [];

    if (chain.length > 0) {
      probSkillChainHTML = `
        <div class="cmp-prob-chain-toggle">
          <button class="cmp-prob-expand-btn" onclick="event.stopPropagation();_probToggleAgent(${i})" title="${isExpanded ? 'Collapse' : 'Expand'} skill chain">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="${isExpanded ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6'}"/></svg>
            <span style="font-size:10px;margin-left:3px">Skill chain (${chain.length})</span>
          </button>
        </div>
        ${isExpanded ? `<div class="cmp-prob-skill-chain">
          ${chain.map((sid, si) => {
            const sk = allSkills.find(x => x.id === sid);
            const name = sk ? esc(sk.name) : 'Skill #' + sid;
            const nodeIds = sk?.node_ids?.length ? '<span class="cmp-prob-trace-tag" title="From nodes: ' + (sk.node_ids || []).join(', ') + '">nodes: ' + sk.node_ids.length + '</span>' : '';
            return '<div class="cmp-prob-skill-node"><span class="cmp-prob-skill-name">' + name + '</span>' + nodeIds +
              '<span class="cmp-prob-skill-actions">' +
              (si > 0 ? '<button class="cmp-prob-skill-move" onclick="event.stopPropagation();_probReorderSkill(' + i + ',' + sid + ',-1)" title="Move up">&uarr;</button>' : '') +
              (si < chain.length - 1 ? '<button class="cmp-prob-skill-move" onclick="event.stopPropagation();_probReorderSkill(' + i + ',' + sid + ',1)" title="Move down">&darr;</button>' : '') +
              '</span></div>' +
              (si < chain.length - 1 ? '<div class="cmp-prob-skill-arrow"><svg width="10" height="14" viewBox="0 0 10 14"><path d="M5 0 L5 10 L2 7 M5 10 L8 7" stroke="#94A3B8" fill="none" stroke-width="1.5"/></svg></div>' : '');
          }).join('')}
        </div>` : ''}
      `;
    }

    const outEdges = (pc.edges || []).filter(e => e.from_index === i);
    if (outEdges.length > 0 || _composerState.sub_agents.length > 1) {
      const sas = _composerState.sub_agents || [];
      probEdgesHTML = `<div class="cmp-prob-edges">
        ${outEdges.map(e => {
          const targetName = sas[e.to_index]?.name || 'Agent ' + (e.to_index + 1);
          const prob = e.probability;
          const tier = prob >= 80 ? 'high' : prob >= 50 ? 'mid' : 'low';
          const isEdgeSelected = _probSelectedEdge && _probSelectedEdge.from_index === e.from_index && _probSelectedEdge.to_index === e.to_index;
          return '<div class="cmp-prob-edge-badge cmp-prob-' + tier + (isEdgeSelected ? ' cmp-prob-edge-selected' : '') + '" onclick="event.stopPropagation();_probSelectEdge(' + e.from_index + ',' + e.to_index + ')">' +
            '<span class="cmp-prob-edge-label">' + esc(e.label || 'transition') + '</span>' +
            '<span class="cmp-prob-edge-pct">' + prob + '%</span>' +
            '<span class="cmp-prob-edge-target">&rarr; ' + esc(targetName) + '</span></div>';
        }).join('')}
        <button class="cmp-prob-add-edge-btn" onclick="event.stopPropagation();_probAddEdge(${i})" title="Add a branch">+ path</button>
      </div>`;
    }
  }

  return `
    <div class="cmp-subagent-card ${isSelected ? 'cmp-selected' : ''}" data-sa-idx="${i}" onclick="_composerSelect('sub-agent',${i})">
      <div class="cmp-subagent-header">
        <div class="cmp-subagent-header-left">
          <span class="cmp-sa-handle" draggable="true" title="Drag to reorder">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="4" r="2"/><circle cx="16" cy="4" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="20" r="2"/><circle cx="16" cy="20" r="2"/></svg>
          </span>
          <span class="cmp-sa-seq">${i + 1}</span>
          ${_roleBadgeHTML(sa.role)}
          ${sa.id ? '<span class="cmp-sa-shared-badge" title="Reusable — shared across orchestrations"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>' : ''}
        </div>
        <button type="button" class="cmp-remove-btn" onclick="event.stopPropagation();_composerRemoveSubAgent(${i})" title="Remove from flow">&times;</button>
      </div>
      <div class="cmp-subagent-name">${esc(sa.name || 'Unnamed')}</div>
      <div class="cmp-subagent-desc">${esc(sa.description || 'No description')}</div>
      ${skillChips || toolChips ? `
        <div class="cmp-subagent-resources">
          ${skillChips ? `<div class="cmp-resource-row"><span class="cmp-resource-label">Skills</span>${skillChips}</div>` : ''}
          ${toolChips ? `<div class="cmp-resource-row"><span class="cmp-resource-label">Tools</span>${toolChips}</div>` : ''}
        </div>
      ` : '<div class="cmp-subagent-drop-hint">Drag skills or tools here</div>'}
      ${instrPreview ? `<div class="cmp-subagent-instr">${esc(instrPreview)}${sa.system_instructions.length > 80 ? '...' : ''}</div>` : ''}
      ${(sa.output_schema || []).length > 0 ? `
        <div class="cmp-sa-outputs-row">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/></svg>
          ${sa.output_schema.map(o => `<span class="cmp-sa-output-pill" title="${esc(o.description || '')}">${esc(o.key)} <span class="cmp-sa-output-type">${esc(o.type)}</span></span>`).join('')}
        </div>
      ` : ''}
      ${probSkillChainHTML}
      ${probEdgesHTML}
    </div>
  `;
}

/* ───── Triggers UI ───── */
function _renderTriggersUI(triggers) {
  const cards = triggers.map((t, ti) => {
    const meta = TRIGGER_TYPES[t.type] || TRIGGER_TYPES.manual;
    let configHTML = '';

    if (t.type === 'event') {
      configHTML = `
        <select class="cmp-detail-input cmp-detail-input-sm" onchange="_updateTrigger(${ti},'event_name',this.value)">
          ${TRIGGER_EVENTS.map(e => `<option value="${e}"${t.event_name === e ? ' selected' : ''}>${e.replace(/_/g, ' ')}</option>`).join('')}
        </select>
        ${t.event_name === 'custom' ? `<input class="cmp-detail-input cmp-detail-input-sm" value="${esc(t.custom_event || '')}" placeholder="Custom event name" onchange="_updateTrigger(${ti},'custom_event',this.value)" style="margin-top:4px" />` : ''}
      `;
    } else if (t.type === 'schedule') {
      configHTML = `
        <select class="cmp-detail-input cmp-detail-input-sm" onchange="_updateTrigger(${ti},'frequency',this.value)">
          ${TRIGGER_SCHEDULES.map(s => `<option value="${s.value}"${t.frequency === s.value ? ' selected' : ''}>${s.label}</option>`).join('')}
        </select>
        ${t.frequency === 'cron' ? `<input class="cmp-detail-input cmp-detail-input-sm" value="${esc(t.cron || '')}" placeholder="0 9 * * *" onchange="_updateTrigger(${ti},'cron',this.value)" style="margin-top:4px" />` : ''}
        <div class="cmp-trigger-time-row">
          <input type="time" class="cmp-detail-input cmp-detail-input-sm" value="${esc(t.time || '09:00')}" onchange="_updateTrigger(${ti},'time',this.value)" />
          ${t.frequency === 'weekly' ? `<select class="cmp-detail-input cmp-detail-input-sm" onchange="_updateTrigger(${ti},'day_of_week',this.value)">
            ${['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d => `<option value="${d}"${t.day_of_week === d ? ' selected' : ''}>${d}</option>`).join('')}
          </select>` : ''}
        </div>
      `;
    } else if (t.type === 'segment') {
      configHTML = `
        <input class="cmp-detail-input cmp-detail-input-sm" value="${esc(t.segment_name || '')}" placeholder="Segment name or ID" onchange="_updateTrigger(${ti},'segment_name',this.value)" />
        <select class="cmp-detail-input cmp-detail-input-sm" onchange="_updateTrigger(${ti},'condition',this.value)" style="margin-top:4px">
          <option value="enters"${(t.condition || 'enters') === 'enters' ? ' selected' : ''}>Contact enters segment</option>
          <option value="exits"${t.condition === 'exits' ? ' selected' : ''}>Contact exits segment</option>
        </select>
      `;
    } else if (t.type === 'api') {
      const endpoint = _composerState.id ? `/api/agents/${_composerState.id}/trigger` : '/api/agents/{id}/trigger';
      configHTML = `
        <div class="cmp-trigger-api-info">
          <label class="cmp-detail-label-sm">Endpoint</label>
          <code class="cmp-trigger-endpoint">POST ${endpoint}</code>
          <label class="cmp-detail-label-sm" style="margin-top:4px">Auth key</label>
          <input class="cmp-detail-input cmp-detail-input-sm" value="${esc(t.api_key || '')}" placeholder="Optional API key" onchange="_updateTrigger(${ti},'api_key',this.value)" />
        </div>
      `;
    } else if (t.type === 'manual') {
      configHTML = `<div class="cmp-trigger-manual-hint">Triggered from the agent detail page or via the inventory actions</div>`;
    }

    return `
      <div class="cmp-trigger-card">
        <div class="cmp-trigger-card-header">
          <span class="cmp-trigger-icon" style="color:${meta.color}">${meta.icon}</span>
          <span class="cmp-trigger-type">${esc(meta.label)}</span>
          <label class="cmp-trigger-toggle"><input type="checkbox" ${t.enabled !== false ? 'checked' : ''} onchange="_updateTrigger(${ti},'enabled',this.checked)" /> <span class="cmp-trigger-toggle-label">${t.enabled !== false ? 'On' : 'Off'}</span></label>
          <button type="button" class="cmp-chip-x" onclick="_removeTrigger(${ti})" title="Remove">&times;</button>
        </div>
        <div class="cmp-trigger-card-body">${configHTML}</div>
      </div>
    `;
  }).join('');

  const addBtns = Object.entries(TRIGGER_TYPES).map(([type, meta]) =>
    `<button type="button" class="cmp-trigger-add-btn" onclick="_addTrigger('${type}')" title="${esc(meta.desc)}">
      <span style="color:${meta.color}">${meta.icon}</span> ${esc(meta.label)}
    </button>`
  ).join('');

  return `
    <div class="cmp-triggers-list">${cards || '<div class="cmp-trigger-empty">No triggers configured</div>'}</div>
    <div class="cmp-trigger-add-row">${addBtns}</div>
  `;
}

window._addTrigger = function (type) {
  if (!Array.isArray(_composerState.triggers)) _composerState.triggers = [];
  const defaults = {
    event: { type: 'event', event_name: 'cart_abandoned', enabled: true },
    schedule: { type: 'schedule', frequency: 'daily', time: '09:00', enabled: true },
    segment: { type: 'segment', segment_name: '', condition: 'enters', enabled: true },
    api: { type: 'api', api_key: '', enabled: true },
    manual: { type: 'manual', enabled: true }
  };
  _composerState.triggers.push(defaults[type] || { type, enabled: true });
  _markComposerDirty();
  _refreshComposerView();
};

window._removeTrigger = function (idx) {
  if (!Array.isArray(_composerState.triggers)) return;
  _composerState.triggers.splice(idx, 1);
  _markComposerDirty();
  _refreshComposerView();
};

window._updateTrigger = function (idx, field, value) {
  if (!_composerState.triggers?.[idx]) return;
  _composerState.triggers[idx][field] = value;
  _markComposerDirty();
  _refreshComposerView();
};

/* ───── Trigger modal (external trigger) ───── */
let _triggerModalOpen = false;
let _triggerResult = null;
let _triggerRunning = false;

window._openTriggerModal = function () {
  _triggerModalOpen = true;
  _triggerResult = null;
  _triggerRunning = false;
  _renderTriggerModal();
};

window._closeTriggerModal = function () {
  _triggerModalOpen = false;
  _triggerResult = null;
  _triggerRunning = false;
  const el = document.getElementById('trigger-modal-overlay');
  if (el) el.remove();
};

window._fireTrigger = async function () {
  const s = _composerState;
  if (!s.id) return;
  _triggerRunning = true;
  _triggerResult = null;
  _renderTriggerModal();

  const trigType = document.getElementById('trg-type')?.value || 'manual';
  const contactMode = document.getElementById('trg-contact-mode')?.value || 'random';
  const contactId = document.getElementById('trg-contact-id')?.value || '';
  const eventDataRaw = document.getElementById('trg-event-data')?.value || '';

  const body = { trigger_type: trigType };
  if (contactMode === 'specific' && contactId) body.contact_id = parseInt(contactId);
  if (eventDataRaw.trim()) {
    try { body.event_data = JSON.parse(eventDataRaw); } catch (_) { body.event_data = { raw: eventDataRaw }; }
  }

  try {
    const r = await fetch(`/api/agents/${s.id}/trigger`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Trigger failed');
    _triggerResult = { success: true, data };
  } catch (err) {
    _triggerResult = { success: false, error: err.message };
  }
  _triggerRunning = false;
  _renderTriggerModal();
};

function _renderTriggerModal() {
  let el = document.getElementById('trigger-modal-overlay');
  if (!_triggerModalOpen) { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement('div');
    el.id = 'trigger-modal-overlay';
    el.className = 'trg-modal-overlay';
    document.body.appendChild(el);
  }

  const s = _composerState;
  const agentId = s.id;
  const webhookUrl = `${window.location.origin}/api/agents/${agentId}/trigger`;
  const curlExample = `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"trigger_type":"api","contact_id":1,"event_data":{"source":"external"}}'`;

  let resultHTML = '';
  if (_triggerRunning) {
    resultHTML = `<div class="trg-result trg-result-running">
      <div class="trg-spinner"></div> Running agent...
    </div>`;
  } else if (_triggerResult) {
    if (_triggerResult.success) {
      const d = _triggerResult.data;
      const exec = d.executions?.[0];
      const sim = exec?.simulation;
      resultHTML = `<div class="trg-result trg-result-success">
        <div class="trg-result-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Triggered successfully
        </div>
        <div class="trg-result-details">
          <div class="trg-result-row"><span>Contact</span><strong>${esc(exec?.contact?.name || 'Random')}</strong></div>
          <div class="trg-result-row"><span>Email</span><span>${esc(exec?.contact?.email || '-')}</span></div>
          <div class="trg-result-row"><span>Sub-agents run</span><span>${sim?.summary?.sub_agents_executed || 0} / ${sim?.summary?.sub_agents_total || 0}</span></div>
          <div class="trg-result-row"><span>Logic nodes</span><span>${sim?.summary?.logic_nodes_processed || 0}</span></div>
          <div class="trg-result-row"><span>Guardrails</span><span>${sim?.summary?.guardrails_passed ? 'Passed' : 'Failed'}</span></div>
          <div class="trg-result-row"><span>Channels</span><span>${(sim?.summary?.channels_used || []).join(', ') || '-'}</span></div>
        </div>
      </div>`;
    } else {
      resultHTML = `<div class="trg-result trg-result-error">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        ${esc(_triggerResult.error)}
      </div>`;
    }
  }

  el.innerHTML = `
    <div class="trg-modal" onclick="event.stopPropagation()">
      <div class="trg-modal-header">
        <div class="trg-modal-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E68619" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Trigger Agent
        </div>
        <button type="button" class="trg-close" onclick="_closeTriggerModal()">&times;</button>
      </div>

      <div class="trg-modal-body">
        <div class="trg-section">
          <label class="trg-label">Trigger type</label>
          <select id="trg-type" class="trg-input">
            <option value="manual">Manual</option>
            <option value="event">Event</option>
            <option value="api">API</option>
            <option value="schedule">Schedule</option>
            <option value="segment">Segment</option>
          </select>
        </div>

        <div class="trg-section">
          <label class="trg-label">Contact</label>
          <select id="trg-contact-mode" class="trg-input" onchange="document.getElementById('trg-contact-id-wrap').style.display=this.value==='specific'?'block':'none'">
            <option value="random">Random contact</option>
            <option value="specific">Specific contact ID</option>
          </select>
          <div id="trg-contact-id-wrap" style="display:none;margin-top:6px">
            <input id="trg-contact-id" class="trg-input" type="number" placeholder="Contact ID" min="1" />
          </div>
        </div>

        <div class="trg-section">
          <label class="trg-label">Event data <span class="trg-hint">(optional JSON)</span></label>
          <textarea id="trg-event-data" class="trg-input trg-textarea" rows="3" placeholder='{"cart_value": 85, "source": "checkout"}'></textarea>
        </div>

        ${resultHTML}

        <button type="button" class="trg-fire-btn" onclick="_fireTrigger()" ${_triggerRunning ? 'disabled' : ''}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          ${_triggerRunning ? 'Triggering...' : 'Fire Trigger'}
        </button>

        <div class="trg-divider"></div>

        <div class="trg-webhook-section">
          <div class="trg-webhook-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            Webhook URL
          </div>
          <div class="trg-webhook-url-row">
            <code class="trg-webhook-url">${esc(webhookUrl)}</code>
            <button type="button" class="trg-copy-btn" onclick="_copyWebhook('${esc(webhookUrl)}')" title="Copy URL">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>

          <label class="trg-label" style="margin-top:10px">Example cURL</label>
          <div class="trg-curl-wrap">
            <pre class="trg-curl" id="trg-curl-text">${esc(curlExample)}</pre>
            <button type="button" class="trg-copy-btn trg-copy-curl" onclick="_copyCurl()" title="Copy cURL">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>

          <label class="trg-label" style="margin-top:10px">Request body schema</label>
          <pre class="trg-schema">{
  "trigger_type": "event|schedule|segment|api|manual",
  "contact_id": 123,            // optional — omit for random
  "segment_name": "VIP",        // optional — for segment triggers
  "event_data": { ... }         // optional — custom payload
}</pre>
        </div>
      </div>
    </div>
  `;
  el.onclick = _closeTriggerModal;
}

window._copyWebhook = function (text) {
  navigator.clipboard.writeText(text).then(() => {
    if (typeof showToast === 'function') showToast('Copied to clipboard', 'success');
  });
};

window._copyCurl = function () {
  const el = document.getElementById('trg-curl-text');
  if (el) _copyWebhook(el.textContent);
};

/* ───── Details panel (right) ───── */
function _renderDetails() {
  if (_testMode) return _renderTestPanel();
  if (_simMode) return _renderSimPanel();
  const s = _composerState;

  // Probability edge detail takes priority when selected
  if (_probSelectedEdge && s?.probabilistic_config) {
    return _renderProbEdgeDetail();
  }

  if (!_composerSelected) {
    if (s?.probabilistic_config) return _renderProbOverview();
    return '<div class="cmp-details-empty">Select an element to edit</div>';
  }

  if (_composerSelected.type === 'agent') {
    const g = s.guardrails;
    const trigCount = (s.triggers || []).filter(t => t.enabled !== false).length;
    const tab = _agentDetailTab || 'properties';

    const agentToolOptions = _composerTools.map(t => {
      const checked = s.tool_ids.includes(t.id) ? ' checked' : '';
      const icon = toolIcon ? toolIcon(t.icon) : '';
      return `<label class="cmp-detail-tool-cb"><input type="checkbox" data-tool-id="${t.id}"${checked} onchange="_composerToggleAgentTool(${t.id},this.checked)" />${icon}<span>${esc(t.name)}</span></label>`;
    }).join('');

    const tabBar = `
      <div class="cmp-detail-tabs">
        <button type="button" class="cmp-detail-tab ${tab === 'properties' ? 'cmp-detail-tab-active' : ''}" onclick="_switchAgentTab('properties')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Properties
        </button>
        <button type="button" class="cmp-detail-tab ${tab === 'triggers' ? 'cmp-detail-tab-active' : ''}" onclick="_switchAgentTab('triggers')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Triggers ${trigCount > 0 ? `<span class="cmp-detail-tab-badge">${trigCount}</span>` : ''}
        </button>
      </div>
    `;

    let panelBody = '';
    if (tab === 'properties') {
      panelBody = `
        <label class="cmp-detail-label">Name</label>
        <input class="cmp-detail-input" value="${esc(s.name)}" onchange="_composerUpdateAgent('name',this.value)" />
        <label class="cmp-detail-label">Goal</label>
        <div class="cmp-detail-field-wrap">
          <textarea class="cmp-detail-input" rows="2" onchange="_composerUpdateAgent('goal',this.value)">${esc(s.goal)}</textarea>
          ${_refineIcon('agent-goal')}
        </div>
        <label class="cmp-detail-label">Description</label>
        <div class="cmp-detail-field-wrap">
          <textarea class="cmp-detail-input" rows="3" onchange="_composerUpdateAgent('description',this.value)">${esc(s.description)}</textarea>
          ${_refineIcon('agent-description')}
        </div>
        <label class="cmp-detail-label">Status</label>
        <select class="cmp-detail-input" onchange="_composerUpdateAgent('status',this.value)">
          ${['draft','active','paused','archived'].map(st => `<option value="${st}"${st === s.status ? ' selected' : ''}>${st}</option>`).join('')}
        </select>
        <div class="cmp-detail-divider"></div>
        <label class="cmp-detail-label">Agent-level Tools</label>
        <div class="cmp-detail-tools-list">${agentToolOptions || '<span class="cmp-palette-empty">No tools available</span>'}</div>
        <div class="cmp-detail-divider"></div>
        <label class="cmp-detail-label">Guardrails</label>
        <div class="cmp-detail-guard-grid">
          <div><label class="cmp-detail-label-sm">Max msg/day</label><input type="number" class="cmp-detail-input cmp-detail-input-sm" value="${g.max_messages_per_contact_per_day ?? ''}" min="0" onchange="_composerUpdateGuardrail('max_messages_per_contact_per_day',this.value?parseInt(this.value):null)" /></div>
          <div><label class="cmp-detail-label-sm">Email/day</label><input type="number" class="cmp-detail-input cmp-detail-input-sm" value="${g.channel_limits?.email ?? ''}" min="0" onchange="_composerUpdateChannelLimit('email',this.value?parseInt(this.value):0)" /></div>
          <div><label class="cmp-detail-label-sm">SMS/day</label><input type="number" class="cmp-detail-input cmp-detail-input-sm" value="${g.channel_limits?.sms ?? ''}" min="0" onchange="_composerUpdateChannelLimit('sms',this.value?parseInt(this.value):0)" /></div>
          <div><label class="cmp-detail-label-sm">Push/day</label><input type="number" class="cmp-detail-input cmp-detail-input-sm" value="${g.channel_limits?.push ?? ''}" min="0" onchange="_composerUpdateChannelLimit('push',this.value?parseInt(this.value):0)" /></div>
        </div>
        <label class="cmp-detail-toggle"><input type="checkbox" ${g.require_approval ? 'checked' : ''} onchange="_composerUpdateGuardrail('require_approval',this.checked)" /> Require approval</label>
      `;
    } else {
      panelBody = `
        <div class="cmp-trigger-tab-intro">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E68619" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <span>Define how this agent gets activated</span>
        </div>
        ${_renderTriggersUI(s.triggers || [])}
      `;
    }

    return `
      ${tabBar}
      <div class="cmp-details-body">${panelBody}</div>
    `;
  }

  if (_composerSelected.type === 'sub-agent') {
    const i = _composerSelected.index;
    const sa = s.sub_agents[i];
    if (!sa) return '<div class="cmp-details-empty">Sub-agent not found</div>';

    const skillList = (sa.skill_ids || []).map(sid => {
      const skill = _composerSkills.find(x => x.id === sid);
      return skill ? `<div class="cmp-detail-resource-row"><span>${esc(skill.name)}</span><button type="button" class="cmp-chip-x" onclick="_composerRemoveSkill(${i},${sid})">&times;</button></div>` : '';
    }).join('');

    const toolList = (sa.tool_ids || []).map(tid => {
      const tool = _composerTools.find(x => x.id === tid);
      return tool ? `<div class="cmp-detail-resource-row"><span>${toolIcon ? toolIcon(tool.icon) : ''} ${esc(tool.name)}</span><button type="button" class="cmp-chip-x" onclick="_composerRemoveTool(${i},${tid})">&times;</button></div>` : '';
    }).join('');

    // Build upstream variables from prior sub-agents
    const upstreamVars = [];
    for (let u = 0; u < i; u++) {
      const uSa = s.sub_agents[u];
      const uOutputs = uSa.output_schema || [];
      if (uOutputs.length > 0) {
        uOutputs.forEach(o => {
          upstreamVars.push({ agent: uSa.name || `Sub-agent ${u+1}`, key: o.key, type: o.type, desc: o.description || '' });
        });
      }
    }
    const varInsertBtns = upstreamVars.length > 0 ? upstreamVars.map(v =>
      `<button type="button" class="cmp-var-pill" onclick="_insertVarRef(${i},'${esc(v.agent)}.${esc(v.key)}')" title="${esc(v.desc || v.type)}">
        <span class="cmp-var-agent">${esc(v.agent)}</span>.<span class="cmp-var-key">${esc(v.key)}</span>
        <span class="cmp-var-type">${esc(v.type)}</span>
      </button>`
    ).join('') : '';

    const varSection = upstreamVars.length > 0 ? `
      <div class="cmp-upstream-vars">
        <label class="cmp-detail-label-sm" style="color:#9CA3AF;display:flex;align-items:center;gap:4px">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/></svg>
          Available upstream data — click to insert
        </label>
        <div class="cmp-var-pills">${varInsertBtns}</div>
      </div>
    ` : '';

    // Output schema editor
    const outputs = sa.output_schema || [];
    const outputRows = outputs.map((o, oi) => `
      <div class="cmp-output-row">
        <input class="cmp-detail-input cmp-detail-input-sm cmp-output-key" value="${esc(o.key || '')}" placeholder="key" onchange="_updateSAOutput(${i},${oi},'key',this.value)" />
        <select class="cmp-detail-input cmp-detail-input-sm cmp-output-type" onchange="_updateSAOutput(${i},${oi},'type',this.value)">
          ${['string','number','boolean','array','object'].map(t => `<option value="${t}"${o.type === t ? ' selected' : ''}>${t}</option>`).join('')}
        </select>
        <input class="cmp-detail-input cmp-detail-input-sm cmp-output-desc" value="${esc(o.description || '')}" placeholder="description" onchange="_updateSAOutput(${i},${oi},'description',this.value)" />
        <button type="button" class="cmp-chip-x" onclick="_removeSAOutput(${i},${oi})">&times;</button>
      </div>
    `).join('');

    const sharedNotice = sa.id ? `
      <div class="cmp-shared-notice">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        <span>Reusable agent — changes apply everywhere this agent is used</span>
      </div>
    ` : '';

    return `
      <div class="cmp-details-header">Agent Properties</div>
      <div class="cmp-details-body">
        ${sharedNotice}
        <label class="cmp-detail-label">Name</label>
        <input class="cmp-detail-input" value="${esc(sa.name)}" onchange="_composerUpdateSA(${i},'name',this.value)" />
        <label class="cmp-detail-label">Role</label>
        <select class="cmp-detail-input" onchange="_composerUpdateSA(${i},'role',this.value)">
          ${ROLE_OPTIONS.map(r => `<option value="${r}"${r === sa.role ? ' selected' : ''}>${r}</option>`).join('')}
        </select>
        <label class="cmp-detail-label">Description</label>
        <div class="cmp-detail-field-wrap">
          <textarea class="cmp-detail-input" rows="2" onchange="_composerUpdateSA(${i},'description',this.value)">${esc(sa.description)}</textarea>
          ${_refineIcon('subagent-description')}
        </div>
        <label class="cmp-detail-label">System Instructions</label>
        <div class="cmp-detail-field-wrap">
          <textarea class="cmp-detail-input cmp-sa-instructions" id="sa-instructions-${i}" rows="5" onchange="_composerUpdateSA(${i},'system_instructions',this.value)">${esc(sa.system_instructions)}</textarea>
          ${_refineIcon('subagent-instructions')}
        </div>
        ${varSection}
        <div class="cmp-detail-divider"></div>
        <label class="cmp-detail-label">
          Outputs <span class="cmp-detail-count">${outputs.length}</span>
          <span class="cmp-detail-hint-inline">Define what this sub-agent produces</span>
        </label>
        <div class="cmp-output-schema">
          ${outputs.length > 0 ? `<div class="cmp-output-header-row">
            <span class="cmp-output-col-hdr">Key</span>
            <span class="cmp-output-col-hdr">Type</span>
            <span class="cmp-output-col-hdr">Description</span>
            <span></span>
          </div>` : ''}
          ${outputRows}
          <button type="button" class="sa-btn sa-btn-secondary" style="font-size:11px;margin-top:4px" onclick="_addSAOutput(${i})">+ Add output</button>
        </div>
        <div class="cmp-detail-divider"></div>
        <label class="cmp-detail-label">Attached Skills <span class="cmp-detail-count">${(sa.skill_ids||[]).length}</span></label>
        <div class="cmp-detail-resource-list">${skillList || '<span class="cmp-detail-hint">Drag skills from palette</span>'}</div>
        <label class="cmp-detail-label">Attached Tools <span class="cmp-detail-count">${(sa.tool_ids||[]).length}</span></label>
        <div class="cmp-detail-resource-list">${toolList || '<span class="cmp-detail-hint">Drag tools from palette</span>'}</div>
        ${_renderProbSkillChainEditor(i, s)}
        <div class="cmp-detail-divider"></div>
        <div class="cmp-sa-chat" id="cmp-sa-chat" aria-label="Agent AI for this step">
          <div class="cmp-sa-chat-head">
            <span class="cmp-sa-chat-badge">Agent AI</span>
            <span class="cmp-sa-chat-scope">This sub-agent only — not the whole workflow</span>
            <div class="cmp-sa-chat-head-actions">
              <button type="button" class="cmp-chat-icobtn" id="cmp-sa-chat-clear" title="Clear this thread" aria-label="Clear agent chat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
          <p class="cmp-sa-chat-sub">Refine instructions, outputs, and skills for <strong>${esc(sa.name || 'this agent')}</strong>. Workflow graph changes stay in <strong>Workflow AI</strong> (left).</p>
          <div class="cmp-chat-starters" id="cmp-sa-chat-starters"></div>
          <div class="cmp-chat-messages cmp-sa-chat-messages" id="cmp-sa-chat-messages"></div>
          <div class="cmp-chat-proposal-wrap cmp-sa-chat-patch-wrap" id="cmp-sa-chat-patch-wrap" hidden>
            <div class="cmp-chat-proposal-preview" id="cmp-sa-chat-patch-preview"></div>
            <div class="cmp-chat-proposal-actions">
              <button type="button" class="btn btn-primary btn-sm" id="cmp-sa-chat-apply">Apply to this agent</button>
              <span class="cmp-chat-apply-hint" id="cmp-sa-chat-hint"></span>
            </div>
          </div>
          <div class="cmp-chat-input-row">
            <textarea class="cmp-chat-input" id="cmp-sa-chat-input" rows="2" placeholder="Ask about this agent or request edits…" aria-label="Agent AI message"></textarea>
            <div class="cmp-chat-send-col">
              <button type="button" class="btn btn-secondary cmp-chat-stop" id="cmp-sa-chat-stop" hidden>Stop</button>
              <button type="button" class="btn btn-primary cmp-chat-send" id="cmp-sa-chat-send">Send</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (_composerSelected.type === 'logic') {
    const node = (s.logic_nodes || []).find(n => n.id === _composerSelected.id);
    if (!node) return '<div class="cmp-details-empty">Logic node not found</div>';
    const meta = LOGIC_NODE_TYPES[node.type] || {};
    const c = node.config || {};
    const nid = node.id;

    const saOptions = s.sub_agents.map((sa, si) =>
      `<option value="${si}">${esc(sa.name || 'Sub-agent ' + (si + 1))}</option>`
    ).join('');
    const _saSelect = (field, current) => `
      <select class="cmp-detail-input cmp-detail-input-sm cmp-route-select" onchange="_updateLogicNode('${nid}','${field}',this.value===''?null:parseInt(this.value))">
        <option value=""${current === null || current === undefined ? ' selected' : ''}>Continue (next step)</option>
        ${s.sub_agents.map((sa, si) => `<option value="${si}"${current === si ? ' selected' : ''}>${esc(sa.name || 'Sub-agent ' + (si + 1))}</option>`).join('')}
      </select>
    `;

    let configFields = '';
    if (node.type === 'condition') {
      configFields = `
        <label class="cmp-detail-label">Expression</label>
        <div class="cmp-detail-field-wrap">
          <textarea class="cmp-detail-input" rows="2" placeholder="e.g. cart_value > 100" onchange="_updateLogicNode('${nid}','expression',this.value)">${esc(c.expression || '')}</textarea>
          ${_refineIcon('skill-step')}
        </div>
        <div class="cmp-detail-divider"></div>
        <label class="cmp-detail-label" style="display:flex;align-items:center;gap:5px">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Then branch
        </label>
        <div class="cmp-detail-two-col">
          <div><label class="cmp-detail-label-sm">Label</label><input class="cmp-detail-input cmp-detail-input-sm" value="${esc(c.then_label || 'Yes')}" onchange="_updateLogicNode('${nid}','then_label',this.value)" /></div>
          <div><label class="cmp-detail-label-sm">Route to</label>${_saSelect('then_target', c.then_target)}</div>
        </div>
        <label class="cmp-detail-label" style="display:flex;align-items:center;gap:5px;margin-top:8px">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Else branch
        </label>
        <div class="cmp-detail-two-col">
          <div><label class="cmp-detail-label-sm">Label</label><input class="cmp-detail-input cmp-detail-input-sm" value="${esc(c.else_label || 'No')}" onchange="_updateLogicNode('${nid}','else_label',this.value)" /></div>
          <div><label class="cmp-detail-label-sm">Route to</label>${_saSelect('else_target', c.else_target)}</div>
        </div>
      `;
    } else if (node.type === 'loop') {
      configFields = `
        <label class="cmp-detail-label">Loop type</label>
        <select class="cmp-detail-input" onchange="_updateLogicNode('${nid}','loop_type',this.value)">
          <option value="count"${c.loop_type === 'count' ? ' selected' : ''}>Fixed count</option>
          <option value="foreach"${c.loop_type === 'foreach' ? ' selected' : ''}>For each item</option>
        </select>
        ${c.loop_type === 'foreach' ? `
          <label class="cmp-detail-label">Iterator</label>
          <input class="cmp-detail-input" value="${esc(c.iterator || '')}" placeholder="e.g. cart_items" onchange="_updateLogicNode('${nid}','iterator',this.value)" />
        ` : `
          <label class="cmp-detail-label">Count</label>
          <input type="number" class="cmp-detail-input" value="${c.count || 3}" min="1" max="100" onchange="_updateLogicNode('${nid}','count',parseInt(this.value)||1)" />
        `}
        <label class="cmp-detail-label">Max iterations</label>
        <input type="number" class="cmp-detail-input" value="${c.max_iterations || 10}" min="1" max="1000" onchange="_updateLogicNode('${nid}','max_iterations',parseInt(this.value)||10)" />
      `;
    } else if (node.type === 'parallel') {
      const branches = Array.isArray(c.branches) ? c.branches : [];
      const sas = _composerState.sub_agents || [];
      const saCheckboxes = sas.map((sa, i) => {
        const checked = branches.includes(i) ? 'checked' : '';
        return `<label class="cmp-parallel-sa-option">
          <input type="checkbox" ${checked} onchange="_toggleParallelBranch('${nid}',${i},this.checked)" />
          <span class="cmp-parallel-sa-idx">${i + 1}</span>
          <span class="cmp-parallel-sa-name">${esc(sa.name || 'Untitled')}</span>
          ${sa.role ? `<span class="cmp-parallel-sa-role">${esc(sa.role)}</span>` : ''}
        </label>`;
      }).join('');

      configFields = `
        <label class="cmp-detail-label">Sub-agents to run in parallel</label>
        <div class="cmp-parallel-sa-list">${saCheckboxes || '<span style="font-size:11px;color:#9CA3AF">No sub-agents available</span>'}</div>
        ${branches.length < 2 ? '<div class="cmp-parallel-hint">Select at least 2 sub-agents to run in parallel</div>' : ''}
        <div class="cmp-detail-divider"></div>
        <label class="cmp-detail-label">Wait mode</label>
        <select class="cmp-detail-input" onchange="_updateLogicNode('${nid}','wait_mode',this.value)">
          <option value="all"${(c.wait_mode || 'all') === 'all' ? ' selected' : ''}>Wait for all (join)</option>
          <option value="any"${c.wait_mode === 'any' ? ' selected' : ''}>Continue when any completes (race)</option>
        </select>
        <div class="cmp-detail-divider"></div>
        <label class="cmp-detail-label">Description</label>
        <textarea class="cmp-detail-input" rows="2" placeholder="e.g. Send review request and cross-sell simultaneously" onchange="_updateLogicNode('${nid}','description',this.value)">${esc(c.description || '')}</textarea>
      `;
    } else if (node.type === 'transform') {
      const mappings = Array.isArray(c.mappings) ? c.mappings : [];

      // Gather available upstream output keys
      const upstreamKeys = [];
      const sas = _composerState.sub_agents || [];
      for (let u = 0; u < sas.length; u++) {
        if (u >= node.slot) break;
        (sas[u].output_schema || []).forEach(o => {
          if (o.key) upstreamKeys.push({ label: `${sas[u].name || 'SA-'+(u+1)}.${o.key}`, type: o.type });
        });
      }
      // Gather downstream expected inputs (next sub-agents after this node)
      const downstreamKeys = [];
      for (let d = node.slot; d < sas.length; d++) {
        const dSa = sas[d];
        const refs = (dSa.system_instructions || '').match(/\{\{([^}]+)\}\}/g) || [];
        refs.forEach(r => { downstreamKeys.push(r.replace(/[{}]/g, '')); });
      }

      const upstreamHint = upstreamKeys.length > 0 ? `
        <div class="cmp-transform-ctx">
          <label class="cmp-detail-label-sm" style="color:#059669">Available upstream data</label>
          <div class="cmp-var-pills">${upstreamKeys.map(k => `<span class="cmp-var-pill cmp-var-pill-static"><span class="cmp-var-key">${esc(k.label)}</span><span class="cmp-var-type">${esc(k.type)}</span></span>`).join('')}</div>
        </div>
      ` : '';

      const mappingRows = mappings.map((m, mi) => `
        <div class="cmp-detail-mapping-row">
          <div class="cmp-mapping-input-wrap">
            <input class="cmp-detail-input cmp-detail-input-sm" value="${esc(m.from || '')}" placeholder="source (e.g. AgentName.key)" onchange="_updateLogicMapping('${nid}',${mi},'from',this.value)" list="transform-upstream-${nid}" />
          </div>
          <span class="cmp-mapping-arrow">→</span>
          <div class="cmp-mapping-input-wrap">
            <input class="cmp-detail-input cmp-detail-input-sm" value="${esc(m.to || '')}" placeholder="target key" onchange="_updateLogicMapping('${nid}',${mi},'to',this.value)" />
          </div>
          <button type="button" class="cmp-chip-x" onclick="_removeLogicMapping('${nid}',${mi})">&times;</button>
        </div>
      `).join('');
      const datalist = upstreamKeys.length > 0 ? `<datalist id="transform-upstream-${nid}">${upstreamKeys.map(k => `<option value="${esc(k.label)}">`).join('')}</datalist>` : '';
      configFields = `
        ${upstreamHint}
        <label class="cmp-detail-label">Data mappings</label>
        ${mappingRows}
        ${datalist}
        <button type="button" class="sa-btn sa-btn-secondary" style="font-size:11px;margin-top:4px" onclick="_addLogicMapping('${nid}')">+ Add mapping</button>
      `;
    } else if (node.type === 'gate') {
      configFields = `
        <label class="cmp-detail-label">Condition</label>
        <div class="cmp-detail-field-wrap">
          <textarea class="cmp-detail-input" rows="2" placeholder="e.g. opt_in == true" onchange="_updateLogicNode('${nid}','expression',this.value)">${esc(c.expression || '')}</textarea>
          ${_refineIcon('skill-step')}
        </div>
        <div class="cmp-detail-divider"></div>
        <label class="cmp-detail-label">If not met — action</label>
        <select class="cmp-detail-input" onchange="_updateLogicNode('${nid}','fallback',this.value)">
          <option value="skip"${c.fallback === 'skip' ? ' selected' : ''}>Skip remaining steps</option>
          <option value="stop"${c.fallback === 'stop' ? ' selected' : ''}>Stop agent entirely</option>
          <option value="alert"${c.fallback === 'alert' ? ' selected' : ''}>Alert & continue</option>
          <option value="route"${c.fallback === 'route' ? ' selected' : ''}>Route to sub-agent</option>
        </select>
        ${c.fallback === 'route' ? `
          <label class="cmp-detail-label-sm" style="margin-top:6px">Route to</label>
          ${_saSelect('fallback_target', c.fallback_target)}
        ` : ''}
      `;
    } else if (node.type === 'delay') {
      configFields = `
        <div class="cmp-detail-two-col">
          <div><label class="cmp-detail-label-sm">Duration</label><input type="number" class="cmp-detail-input cmp-detail-input-sm" value="${c.duration || 1}" min="0" onchange="_updateLogicNode('${nid}','duration',parseInt(this.value)||1)" /></div>
          <div><label class="cmp-detail-label-sm">Unit</label><select class="cmp-detail-input cmp-detail-input-sm" onchange="_updateLogicNode('${nid}','unit',this.value)">
            ${['minutes','hours','days'].map(u => `<option value="${u}"${c.unit === u ? ' selected' : ''}>${u}</option>`).join('')}
          </select></div>
        </div>
      `;
    } else if (node.type === 'ab_split') {
      const variants = Array.isArray(c.variants) ? c.variants : [];
      const variantRows = variants.map((v, vi) => `
        <div class="cmp-ab-variant-row">
          <input class="cmp-detail-input cmp-detail-input-sm cmp-ab-name" value="${esc(v.name || String.fromCharCode(65 + vi))}" maxlength="10" placeholder="Name" onchange="_updateABVariant('${nid}',${vi},'name',this.value)" />
          <div class="cmp-ab-weight-wrap">
            <input type="range" class="cmp-ab-slider" min="0" max="100" value="${v.weight || 0}" oninput="_updateABVariant('${nid}',${vi},'weight',parseInt(this.value));this.nextElementSibling.textContent=this.value+'%'" />
            <span class="cmp-ab-weight-val">${v.weight || 0}%</span>
          </div>
          <div><label class="cmp-detail-label-sm">Route to</label>
            <select class="cmp-detail-input cmp-detail-input-sm cmp-route-select" onchange="_updateABVariant('${nid}',${vi},'target',this.value===''?null:parseInt(this.value))">
              <option value=""${v.target === null || v.target === undefined ? ' selected' : ''}>Continue (next step)</option>
              ${s.sub_agents.map((sa, si) => `<option value="${si}"${v.target === si ? ' selected' : ''}>${esc(sa.name || 'Sub-agent ' + (si + 1))}</option>`).join('')}
            </select>
          </div>
          ${variants.length > 2 ? `<button type="button" class="cmp-chip-x" onclick="_removeABVariant('${nid}',${vi})" title="Remove">&times;</button>` : ''}
        </div>
      `).join('');
      const totalWeight = variants.reduce((s, v) => s + (v.weight || 0), 0);
      configFields = `
        <label class="cmp-detail-label">Variants</label>
        <div class="cmp-ab-variants">${variantRows}</div>
        ${totalWeight !== 100 ? `<div class="cmp-parallel-hint">Weights must sum to 100% (currently ${totalWeight}%)</div>` : ''}
        <button type="button" class="sa-btn sa-btn-secondary" style="font-size:11px;margin-top:6px" onclick="_addABVariant('${nid}')">+ Add variant</button>
      `;
    } else if (node.type === 'wait_event') {
      const eventTypes = ['email_open','email_click','purchase','cart_update','page_view','form_submit','app_open','custom'];
      configFields = `
        <label class="cmp-detail-label">Event to wait for</label>
        <select class="cmp-detail-input" onchange="_updateLogicNode('${nid}','event_type',this.value)">
          ${eventTypes.map(e => `<option value="${e}"${c.event_type === e ? ' selected' : ''}>${e.replace(/_/g,' ')}</option>`).join('')}
        </select>
        ${c.event_type === 'custom' ? `
          <label class="cmp-detail-label">Custom event name</label>
          <input class="cmp-detail-input" value="${esc(c.custom_event || '')}" placeholder="e.g. loyalty_upgrade" onchange="_updateLogicNode('${nid}','custom_event',this.value)" />
        ` : ''}
        <div class="cmp-detail-divider"></div>
        <label class="cmp-detail-label">Timeout</label>
        <div class="cmp-detail-two-col">
          <div><label class="cmp-detail-label-sm">Duration</label><input type="number" class="cmp-detail-input cmp-detail-input-sm" value="${c.timeout_duration || 24}" min="1" onchange="_updateLogicNode('${nid}','timeout_duration',parseInt(this.value)||24)" /></div>
          <div><label class="cmp-detail-label-sm">Unit</label><select class="cmp-detail-input cmp-detail-input-sm" onchange="_updateLogicNode('${nid}','timeout_unit',this.value)">
            ${['minutes','hours','days'].map(u => `<option value="${u}"${(c.timeout_unit || 'hours') === u ? ' selected' : ''}>${u}</option>`).join('')}
          </select></div>
        </div>
        <label class="cmp-detail-label">If event not received</label>
        <select class="cmp-detail-input" onchange="_updateLogicNode('${nid}','timeout_action',this.value)">
          <option value="continue"${(c.timeout_action || 'continue') === 'continue' ? ' selected' : ''}>Continue to next step</option>
          <option value="skip"${c.timeout_action === 'skip' ? ' selected' : ''}>Skip remaining steps</option>
          <option value="route"${c.timeout_action === 'route' ? ' selected' : ''}>Route to sub-agent</option>
        </select>
        ${c.timeout_action === 'route' ? `
          <label class="cmp-detail-label-sm" style="margin-top:6px">Route to</label>
          ${_saSelect('timeout_target', c.timeout_target)}
        ` : ''}
      `;
    } else if (node.type === 'invoke_agent') {
      const allAgents = _opsAgentsList || [];
      configFields = `
        <label class="cmp-detail-label">Target Agent</label>
        <select class="cmp-detail-input" onchange="_updateLogicNode('${nid}','target_agent_id',this.value?parseInt(this.value):null)">
          <option value="">Select an agent...</option>
          ${allAgents.filter(a => a.id !== _composerState.id).map(a => `<option value="${a.id}"${c.target_agent_id === a.id ? ' selected' : ''}>${esc(a.name)}</option>`).join('')}
        </select>
        ${c.target_agent_id ? `<div class="cmp-invoke-agent-info" id="cmp-invoke-info-${nid}"></div>` : ''}
        <div class="cmp-detail-divider"></div>
        <label class="cmp-detail-toggle"><input type="checkbox" ${c.pass_context !== false ? 'checked' : ''} onchange="_updateLogicNode('${nid}','pass_context',this.checked)" /> Pass upstream data context</label>
        <label class="cmp-detail-toggle"><input type="checkbox" ${c.wait_for_completion !== false ? 'checked' : ''} onchange="_updateLogicNode('${nid}','wait_for_completion',this.checked)" /> Wait for completion</label>
      `;
      if (c.target_agent_id) {
        setTimeout(() => _loadInvokeAgentInfo(nid, c.target_agent_id), 100);
      }
    }

    // Expression builder for condition and gate
    const exprBuilder = (node.type === 'condition' || node.type === 'gate') ? `
      <div class="cmp-expr-builder">
        <label class="cmp-detail-label-sm" style="color:#9CA3AF;margin-top:6px">Quick build</label>
        <div class="cmp-expr-row">
          <select class="cmp-detail-input cmp-detail-input-sm cmp-expr-field" id="expr-field-${nid}">
            <option value="">Field...</option>
            ${['cart_value','order_value','lifetime_value','total_purchases','engagement_score','loyalty_tier','email_opt_in','sms_opt_in','days_since_last_order'].map(f => `<option value="${f}">${f.replace(/_/g,' ')}</option>`).join('')}
          </select>
          <select class="cmp-detail-input cmp-detail-input-sm cmp-expr-op" id="expr-op-${nid}">
            ${['>','<','>=','<=','==','!='].map(op => `<option value="${op}">${op}</option>`).join('')}
          </select>
          <input class="cmp-detail-input cmp-detail-input-sm cmp-expr-val" id="expr-val-${nid}" placeholder="value" />
          <button type="button" class="sa-btn sa-btn-primary" style="font-size:10px;padding:3px 8px" onclick="_applyExprBuilder('${nid}','${node.type === 'gate' ? 'gate' : 'condition'}')">Apply</button>
        </div>
      </div>
    ` : '';

    // Description field for all types
    const descField = `
      <div class="cmp-detail-divider"></div>
      <label class="cmp-detail-label">Notes</label>
      <textarea class="cmp-detail-input" rows="2" placeholder="Optional description or notes" onchange="_updateLogicNode('${nid}','description',this.value)">${esc(c.description || '')}</textarea>
    `;

    return `
      <div class="cmp-details-header" style="border-left: 3px solid ${meta.color || '#6B7280'}">${esc(meta.label)} Properties</div>
      <div class="cmp-details-body">
        <label class="cmp-detail-label">Label</label>
        <input class="cmp-detail-input" value="${esc(node.label)}" onchange="_updateLogicNode('${nid}','label',this.value)" />
        <div class="cmp-detail-divider"></div>
        ${configFields}
        ${exprBuilder}
        ${descField}
        <div class="cmp-detail-divider"></div>
        <label class="cmp-detail-label-sm" style="color:#9CA3AF">Position: slot ${node.slot} · Type: ${esc(node.type)}</label>
      </div>
    `;
  }

  return '<div class="cmp-details-empty">Select an element to edit</div>';
}

/* ───── Simulation ───── */
window._toggleSimMode = function () {
  _simMode = !_simMode;
  if (_simMode) { _testMode = false; _testResults = null; _testRunning = false; }
  if (_simMode && _simContacts.length === 0) {
    fetch('/api/contacts?limit=50').then(r => r.json()).then(data => {
      _simContacts = (Array.isArray(data) ? data : data.contacts || []).slice(0, 50);
      _refreshComposerView();
    }).catch(() => {});
  }
  _simResults = null;
  _simRunning = false;
  _renderComposer();
};

window._runSimulation = function () {
  if (!_composerState?.id) {
    if (typeof showToast === 'function') showToast('Save the agent first before simulating', 'error');
    return;
  }
  const sel = document.getElementById('sim-contact-select');
  const contactId = sel ? sel.value : '';
  _simRunning = true;
  _simResults = null;
  _refreshComposerView();

  fetch(`/api/agents/${_composerState.id}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contactId ? { contact_id: parseInt(contactId) } : {})
  })
    .then(r => r.json())
    .then(data => {
      _simRunning = false;
      _simResults = data;
      _refreshComposerView();
      _animateTimeline();
    })
    .catch(err => {
      _simRunning = false;
      if (typeof showToast === 'function') showToast('Simulation failed: ' + err.message, 'error');
      _refreshComposerView();
    });
};

function _animateTimeline() {
  const items = document.querySelectorAll('.sim-step');
  items.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 80 * i);
  });
}

const SIM_ICONS = {
  start: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  end: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
  'sub-agent': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
  condition: LOGIC_NODE_TYPES.condition.icon,
  gate: LOGIC_NODE_TYPES.gate.icon,
  loop: LOGIC_NODE_TYPES.loop.icon,
  delay: LOGIC_NODE_TYPES.delay.icon,
  transform: LOGIC_NODE_TYPES.transform.icon,
  parallel: LOGIC_NODE_TYPES.parallel.icon,
  ab_split: LOGIC_NODE_TYPES.ab_split.icon,
  wait_event: LOGIC_NODE_TYPES.wait_event.icon
};

const SIM_STATUS = {
  executed: { cls: 'sim-ok', label: 'Executed', icon: '✓' },
  passed: { cls: 'sim-ok', label: 'Passed', icon: '✓' },
  then: { cls: 'sim-then', label: 'Then', icon: '✓' },
  else: { cls: 'sim-else', label: 'Else', icon: '✗' },
  failed: { cls: 'sim-fail', label: 'Failed', icon: '✗' },
  waiting: { cls: 'sim-wait', label: 'Waiting', icon: '⏱' },
  skipped: { cls: 'sim-skip', label: 'Skipped', icon: '⊘' },
  stopped: { cls: 'sim-fail', label: 'Stopped', icon: '■' },
  received: { cls: 'sim-ok', label: 'Received', icon: '✓' },
  timeout: { cls: 'sim-else', label: 'Timeout', icon: '⏱' }
};

function _renderSimPanel() {
  const s = _composerState;
  const contactOptions = _simContacts.map(c =>
    `<option value="${c.id}">${esc((c.first_name || '') + ' ' + (c.last_name || ''))} — ${esc(c.email || '')} (${c.loyalty_tier || 'standard'})</option>`
  ).join('');

  let body = '';
  if (_simRunning) {
    body = '<div class="sim-running"><div class="sim-spinner"></div><span>Running simulation...</span></div>';
  } else if (_simResults && _simResults.timeline) {
    const r = _simResults;
    const tl = r.timeline.map(step => {
      const st = SIM_STATUS[step.status] || SIM_STATUS.executed;
      const icon = SIM_ICONS[step.type] || SIM_ICONS.start;
      let extra = '';
      if (step.type === 'condition') {
        extra = `<div class="sim-step-eval">${esc(step.detail)}</div>
          <div class="sim-step-branch">Branch: <span class="sim-branch-pill sim-branch-${step.branch}">${esc(step.branch_label || step.branch)}</span>
          ${step.routed_to ? `<span class="sim-route">→ ${esc(step.routed_to)}</span>` : ''}</div>`;
      } else if (step.type === 'gate') {
        extra = `<div class="sim-step-eval">${esc(step.detail)}</div>
          ${step.fallback ? `<div class="sim-step-fb">Fallback: ${esc(step.fallback)}${step.routed_to ? ' → ' + esc(step.routed_to) : ''}</div>` : ''}`;
      } else if (step.type === 'sub-agent') {
        const skillNames = (step.skills_used || []).map(sk => sk.name).join(', ');
        const outputKeys = step.output_keys || [];
        const resolvedVars = step.resolved_vars || [];
        extra = `${step.role ? `<div class="sim-step-role">${esc(step.role)}</div>` : ''}
          ${skillNames ? `<div class="sim-step-skills">Skills: ${esc(skillNames)}</div>` : ''}
          ${step.channel ? `<div class="sim-step-channel">Channel: <strong>${esc(step.channel)}</strong></div>` : ''}
          ${resolvedVars.length > 0 ? `<div class="sim-step-data-in"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2680EB" stroke-width="2"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg> Receives: ${resolvedVars.map(v => `<span class="sim-data-pill sim-data-in-pill">${esc(v.ref)}</span>`).join('')}</div>` : ''}
          ${outputKeys.length > 0 ? `<div class="sim-step-data-out"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/></svg> Produces: ${outputKeys.map(k => `<span class="sim-data-pill sim-data-out-pill">${esc(k)}</span>`).join('')}</div>` : ''}`;
      } else if (step.type === 'delay') {
        extra = `<div class="sim-step-dur">${esc(step.duration_display || step.detail)}</div>`;
      } else if (step.type === 'loop') {
        extra = `<div class="sim-step-eval">${esc(step.detail)}</div>`;
      } else if (step.type === 'transform') {
        extra = `<div class="sim-step-eval">${esc(step.detail)}</div>`;
      } else if (step.type === 'parallel') {
        const bPills = (step.branches || []).map(b => `<span class="sim-branch-pill sim-branch-then">${esc(b)}</span>`).join('');
        extra = bPills ? `<div class="sim-step-branch">${bPills}</div><div class="sim-step-eval">${esc(step.wait_mode === 'any' ? 'Race — continue when any completes' : 'Join — wait for all to complete')}</div>` : '';
      } else if (step.type === 'ab_split') {
        const vPills = (step.variants || []).map(v => `<span class="sim-branch-pill" style="background:${v.name === step.chosen_variant ? '#FAF5FF' : '#F3F4F6'};color:${v.name === step.chosen_variant ? '#9333EA' : '#6B7280'};border-color:${v.name === step.chosen_variant ? '#D8B4FE' : '#E5E7EB'}">${esc(v.name)} ${v.weight}%</span>`).join('');
        extra = `<div class="sim-step-branch">${vPills}</div>`;
        if (step.routed_to) extra += `<div class="sim-step-eval">Routed to: <strong>${esc(step.routed_to)}</strong></div>`;
      } else if (step.type === 'wait_event') {
        const evtLabel = (step.event_type || '').replace(/_/g, ' ');
        const statusIcon = step.status === 'received' ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
        extra = `<div class="sim-step-eval">${statusIcon} ${esc(evtLabel)} — ${esc(step.status === 'received' ? 'Event received' : 'Timed out after ' + step.timeout)}</div>`;
        if (step.timeout_action && step.status === 'timeout') extra += `<div class="sim-step-eval" style="font-size:10px;color:#9CA3AF">Action: ${esc(step.timeout_action)}</div>`;
      } else if (step.type === 'invoke_agent') {
        const agentName = step.target_agent || `Agent #${step.target_agent_id || '?'}`;
        const chainIcon = step.status === 'completed' ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2680EB" stroke-width="2.5"><path d="M12 2a4 4 0 014 4v1h1a3 3 0 013 3v4a3 3 0 01-3 3h-1v1a4 4 0 01-8 0v-1H7a3 3 0 01-3-3v-4a3 3 0 013-3h1V6a4 4 0 014-4z"/></svg>';
        extra = `<div class="sim-step-eval">${chainIcon} Invoked: <strong>${esc(agentName)}</strong></div>`;
        if (step.context_passed) extra += `<div class="sim-step-eval" style="font-size:10px;color:#9CA3AF">Context passed to child agent</div>`;
        if (step.child_summary) extra += `<div class="sim-step-eval" style="font-size:10px;color:#6B7280">${esc(step.child_summary)}</div>`;
      }
      return `<div class="sim-step sim-step-${step.type}" style="transition:opacity 0.25s, transform 0.25s">
        <div class="sim-step-dot ${st.cls}">${st.icon}</div>
        <div class="sim-step-body">
          <div class="sim-step-head">
            <span class="sim-step-icon">${icon}</span>
            <span class="sim-step-name">${esc(step.name)}</span>
            <span class="sim-step-badge ${st.cls}">${st.label}</span>
          </div>
          ${extra}
        </div>
      </div>`;
    }).join('');

    const gr = (r.guardrails || []).map(g =>
      `<div class="sim-gr-row ${g.passed ? 'sim-gr-ok' : 'sim-gr-fail'}">
        <span>${g.passed ? '✓' : '✗'}</span> ${esc(g.rule)}${!g.info ? `: <strong>${g.value}</strong>` : ''}
      </div>`
    ).join('');

    const sm = r.summary || {};
    const durStr = sm.estimated_duration_minutes >= 60
      ? `${Math.floor(sm.estimated_duration_minutes / 60)}h ${sm.estimated_duration_minutes % 60}m`
      : sm.estimated_duration_minutes > 0 ? `${sm.estimated_duration_minutes}m` : 'Instant';

    body = `
      <div class="sim-contact-card">
        <strong>${esc(r.contact?.name || 'Unknown')}</strong>
        <span>${esc(r.contact?.email || '')}</span>
        <span class="sim-contact-tier">${esc(r.contact?.loyalty_tier || 'standard')}</span>
        <span>LTV: $${(r.contact?.lifetime_value || 0).toLocaleString()}</span>
      </div>
      <div class="sim-timeline">${tl}</div>
      <div class="sim-section-label">Guardrails</div>
      <div class="sim-guardrails">${gr || '<span class="sim-none">No guardrails configured</span>'}</div>
      <div class="sim-section-label">Summary</div>
      <div class="sim-summary">
        <div class="sim-sum-row"><span>Sub-agents</span><strong>${sm.sub_agents_executed || 0} / ${sm.sub_agents_total || 0}</strong></div>
        <div class="sim-sum-row"><span>Logic nodes</span><strong>${sm.logic_nodes_processed || 0}</strong></div>
        <div class="sim-sum-row"><span>Gates</span><strong>${sm.gates_passed || 0} / ${sm.gates_total || 0} passed</strong></div>
        <div class="sim-sum-row"><span>Branches</span><strong>${(sm.branches_taken || []).join(', ') || '—'}</strong></div>
        <div class="sim-sum-row"><span>Channels</span><strong>${(sm.channels_used || []).join(', ') || '—'}</strong></div>
        <div class="sim-sum-row"><span>Est. duration</span><strong>${durStr}</strong></div>
        <div class="sim-sum-row ${sm.guardrails_passed ? 'sim-gr-ok' : 'sim-gr-fail'}"><span>Guardrails</span><strong>${sm.guardrails_passed ? 'All passed' : sm.guardrail_violations + ' violation(s)'}</strong></div>
      </div>
    `;
  } else {
    body = `<div class="sim-empty">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      <p>Pick a contact and click <strong>Run</strong> to simulate the agent flow</p>
    </div>`;
  }

  return `
    <div class="cmp-details-header sim-header">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      Simulation
    </div>
    <div class="sim-panel-body">
      <div class="sim-controls">
        <select id="sim-contact-select" class="cmp-detail-input sim-contact-sel">
          <option value="">Random contact</option>
          ${contactOptions}
        </select>
        <button class="inv-action-btn inv-action-btn-blue" onclick="_runSimulation()" ${_simRunning || !s?.id ? 'disabled' : ''} title="Run Simulation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
      </div>
      ${!s?.id ? '<div class="sim-warn">Save the agent first to enable simulation</div>' : ''}
      ${body}
    </div>
  `;
}

/* ───── Intelligent Mode — Canvas ───── */
/* Standalone _renderProbCanvas and _renderProbDetails removed — their functionality is now inline in _renderSubAgentFlowCard, _renderDetails, _renderProbEdgeDetail, _renderProbOverview, and _renderProbSkillChainEditor */

/* ───── Intelligent Handlers ───── */

window._probSelectEdge = function (fromIdx, toIdx) {
  if (fromIdx === null || fromIdx === undefined) {
    _probSelectedEdge = null;
  } else {
    _probSelectedEdge = { from_index: fromIdx, to_index: toIdx };
    _composerSelected = null;
  }
  _refreshComposerView();
};

window._probToggleAgent = function (idx) {
  _probExpandedAgents[idx] = !_probExpandedAgents[idx];
  _refreshComposerView();
};

window._probUpdateEdge = function (fromIdx, toIdx, field, value) {
  const s = _composerState;
  if (!s?.probabilistic_config?.edges) return;
  const edge = s.probabilistic_config.edges.find(e => e.from_index === fromIdx && e.to_index === toIdx);
  if (!edge) return;
  if (field === 'probability') edge.probability = Math.max(0, Math.min(100, parseFloat(value) || 0));
  else if (field === 'label') edge.label = value;
  _composerDirty = true;
  _refreshComposerView();
};

window._probBalanceSiblings = function (fromIdx) {
  const s = _composerState;
  if (!s?.probabilistic_config?.edges) return;
  const siblings = s.probabilistic_config.edges.filter(e => e.from_index === fromIdx);
  if (siblings.length === 0) return;
  const each = Math.round((100 / siblings.length) * 100) / 100;
  siblings.forEach((e, i) => {
    e.probability = i === siblings.length - 1 ? +(100 - each * (siblings.length - 1)).toFixed(2) : each;
  });
  _composerDirty = true;
  _refreshComposerView();
};

window._probReorderSkill = function (agentIdx, skillId, direction) {
  const s = _composerState;
  if (!s?.probabilistic_config?.skill_chains) return;
  const key = String(agentIdx);
  const chain = s.probabilistic_config.skill_chains[key];
  if (!chain) return;
  const idx = chain.indexOf(skillId);
  if (idx < 0) return;
  const target = idx + direction;
  if (target < 0 || target >= chain.length) return;
  [chain[idx], chain[target]] = [chain[target], chain[idx]];
  _composerDirty = true;
  _refreshComposerView();
};

window._probAddEdge = function (fromIdx) {
  const s = _composerState;
  if (!s?.probabilistic_config) return;
  const sas = s.sub_agents || [];
  const existing = (s.probabilistic_config.edges || []).filter(e => e.from_index === fromIdx);
  const usedTargets = new Set(existing.map(e => e.to_index));
  let target = -1;
  for (let i = 0; i < sas.length; i++) {
    if (i !== fromIdx && !usedTargets.has(i)) { target = i; break; }
  }
  if (target < 0) {
    if (typeof showToast === 'function') showToast('All agents already connected from this node', 'info');
    return;
  }
  s.probabilistic_config.edges.push({ from_index: fromIdx, to_index: target, probability: 0, label: 'fallback' });
  _probBalanceSiblings(fromIdx);
};

window._probRemoveEdge = function (fromIdx, toIdx) {
  const s = _composerState;
  if (!s?.probabilistic_config?.edges) return;
  s.probabilistic_config.edges = s.probabilistic_config.edges.filter(e => !(e.from_index === fromIdx && e.to_index === toIdx));
  if (_probSelectedEdge && _probSelectedEdge.from_index === fromIdx && _probSelectedEdge.to_index === toIdx) {
    _probSelectedEdge = null;
  }
  _probBalanceSiblings(fromIdx);
};

window._probSave = async function () {
  const s = _composerState;
  if (!s?.id || !s?.probabilistic_config) return;
  try {
    const r = await fetch(`/api/agents/${s.id}/probabilistic`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ probabilistic_config: s.probabilistic_config })
    });
    if (r.ok && typeof showToast === 'function') showToast('Intelligent flow saved', 'success');
  } catch (err) {
    if (typeof showToast === 'function') showToast('Error saving: ' + err.message, 'error');
  }
};

window._switchProbPaletteScope = function (scope) {
  _probPaletteScope = scope;
  const inner = document.getElementById('cmp-palette-inner');
  if (inner) { inner.innerHTML = _renderPalette(); _initComposerDragDrop(); }
};

/* ───── Inline Intelligent Detail Panels ───── */

function _renderProbEdgeDetail() {
  const s = _composerState;
  const pc = s.probabilistic_config;
  const edge = (pc.edges || []).find(e => e.from_index === _probSelectedEdge.from_index && e.to_index === _probSelectedEdge.to_index);
  if (!edge) { _probSelectedEdge = null; return '<div class="cmp-details-empty">Edge not found</div>'; }

  const sas = s.sub_agents || [];
  const fromName = sas[edge.from_index]?.name || 'Agent ' + (edge.from_index + 1);
  const toName = sas[edge.to_index]?.name || 'Agent ' + (edge.to_index + 1);
  const outEdges = (pc.edges || []).filter(e => e.from_index === edge.from_index);
  const sumOut = outEdges.reduce((a, e) => a + (e.probability || 0), 0);

  const siblings = outEdges.filter(e => e.to_index !== edge.to_index).map(e => {
    const tn = sas[e.to_index]?.name || 'Agent ' + (e.to_index + 1);
    return `<div class="cmp-prob-sibling" onclick="_probSelectEdge(${e.from_index},${e.to_index})">
      <span>${esc(e.label || 'transition')}</span>
      <span class="cmp-prob-edge-pct">${e.probability}%</span>
      <span class="cmp-prob-edge-target">&rarr; ${esc(tn)}</span>
    </div>`;
  }).join('');

  return `
    <div class="cmp-details-header" style="display:flex;align-items:center;gap:6px">
      <button type="button" class="cmp-prob-back-btn" onclick="_probSelectEdge(null)" title="Back">&larr;</button>
      Probability Edge
    </div>
    <div class="cmp-details-body">
      <div class="cmp-prob-detail-card">
        <div style="font-size:13px;margin-bottom:8px"><strong>${esc(fromName)}</strong> &rarr; <strong>${esc(toName)}</strong></div>
        <label class="cmp-detail-label">Probability</label>
        <div class="cmp-prob-slider-row">
          <input type="range" class="cmp-prob-slider" min="0" max="100" step="1" value="${edge.probability}" oninput="_probUpdateEdge(${edge.from_index},${edge.to_index},'probability',parseInt(this.value));document.getElementById('prob-val').textContent=this.value+'%'" />
          <span class="cmp-prob-slider-val" id="prob-val">${edge.probability}%</span>
        </div>
        <div class="cmp-prob-sibling-sum ${Math.abs(sumOut - 100) > 0.5 ? 'cmp-prob-sum-warn' : ''}">
          Total from ${esc(fromName)}: ${sumOut.toFixed(1)}%
          ${Math.abs(sumOut - 100) > 0.5 ? ' (should be 100%)' : ''}
        </div>
        <label class="cmp-detail-label" style="margin-top:10px">Outcome label</label>
        <input class="cmp-detail-input" value="${esc(edge.label || '')}" onchange="_probUpdateEdge(${edge.from_index},${edge.to_index},'label',this.value)" placeholder="e.g. success, failure, timeout" />
        <div class="cmp-prob-detail-actions" style="margin-top:12px">
          <button class="btn btn-secondary btn-sm" onclick="_probBalanceSiblings(${edge.from_index})">Balance all paths</button>
          <button class="btn btn-sm" style="background:#EF4444;color:white;border:none" onclick="_probRemoveEdge(${edge.from_index},${edge.to_index})">Remove edge</button>
        </div>
        ${siblings ? `
          <div class="cmp-detail-divider"></div>
          <label class="cmp-detail-label">Other outgoing edges</label>
          <div class="cmp-prob-other-edges">${siblings}</div>
        ` : ''}
      </div>
    </div>
  `;
}

function _renderProbOverview() {
  const s = _composerState;
  const pc = s.probabilistic_config;
  if (!pc) return '<div class="cmp-details-empty">Select an element to edit</div>';

  const sas = s.sub_agents || [];
  const edges = pc.edges || [];
  const chains = pc.skill_chains || {};
  const totalSkills = Object.values(chains).reduce((a, c) => a + c.length, 0);

  return `
    <div class="cmp-details-header">Intelligent Flow</div>
    <div class="cmp-details-body">
      <div class="cmp-prob-overview-grid">
        <div class="cmp-prob-overview-stat"><span class="cmp-prob-overview-val">${sas.length}</span><span class="cmp-prob-overview-label">Agents</span></div>
        <div class="cmp-prob-overview-stat"><span class="cmp-prob-overview-val">${totalSkills}</span><span class="cmp-prob-overview-label">Skills</span></div>
        <div class="cmp-prob-overview-stat"><span class="cmp-prob-overview-val">${edges.length}</span><span class="cmp-prob-overview-label">Edges</span></div>
      </div>
      <p style="font-size:12px;color:#9CA3AF;margin:12px 0">Click an agent card to edit its properties and skill chain. Click a probability badge to adjust transition weights.</p>
      <div class="cmp-prob-detail-actions">
        <button class="btn btn-primary btn-sm" onclick="_probSave()">Save Intelligent Flow</button>
      </div>
    </div>
  `;
}

function _renderProbSkillChainEditor(saIdx, s) {
  const pc = s?.probabilistic_config;
  if (!pc) return '';
  const chain = pc.skill_chains?.[String(saIdx)] || [];
  if (chain.length === 0) return '';

  const allSkills = _composerSkills || [];
  const items = chain.map((sid, ci) => {
    const sk = allSkills.find(x => x.id === sid);
    const name = sk ? esc(sk.name) : 'Skill #' + sid;
    return `<div class="cmp-prob-chain-item">
      <span class="cmp-prob-chain-seq">${ci + 1}</span>
      <span class="cmp-prob-chain-name">${name}</span>
      <span class="cmp-prob-chain-actions">
        ${ci > 0 ? `<button class="cmp-prob-skill-move" onclick="_probReorderSkill(${saIdx},${sid},-1)" title="Move up">&uarr;</button>` : ''}
        ${ci < chain.length - 1 ? `<button class="cmp-prob-skill-move" onclick="_probReorderSkill(${saIdx},${sid},1)" title="Move down">&darr;</button>` : ''}
      </span>
    </div>`;
  }).join('');

  return `
    <div class="cmp-detail-divider"></div>
    <label class="cmp-detail-label">Skill Chain <span class="cmp-detail-count">${chain.length}</span></label>
    <div class="cmp-prob-chain-editor">${items}</div>
  `;
}

/* ───── Test Mode (AI content generation) ───── */
window._toggleTestMode = function () {
  _testMode = !_testMode;
  if (_testMode) {
    _simMode = false;
    if (_simContacts.length === 0) {
      fetch('/api/contacts?limit=50').then(r => r.json()).then(data => {
        _simContacts = (Array.isArray(data) ? data : data.contacts || []).slice(0, 50);
        _refreshComposerView();
      }).catch(() => {});
    }
  }
  _testResults = null;
  _testRunning = false;
  _renderComposer();
};

window._runAgentTest = function () {
  if (!_composerState?.id) {
    if (typeof showToast === 'function') showToast('Save the agent first before testing', 'error');
    return;
  }
  const sel = document.getElementById('test-contact-select');
  const contactId = sel ? sel.value : '';
  _testRunning = true;
  _testResults = null;
  _refreshComposerView();

  fetch(`/api/agents/${_composerState.id}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contactId ? { contact_id: parseInt(contactId) } : {})
  })
    .then(r => r.json())
    .then(data => {
      _testRunning = false;
      if (data.error) {
        if (typeof showToast === 'function') showToast('Test failed: ' + data.error, 'error');
        _refreshComposerView();
        return;
      }
      _testResults = data;
      _refreshComposerView();
      setTimeout(() => {
        document.querySelectorAll('.test-output-card').forEach((el, i) => {
          el.style.opacity = '0';
          el.style.transform = 'translateY(12px)';
          setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 120 * i);
        });
      }, 50);
    })
    .catch(err => {
      _testRunning = false;
      if (typeof showToast === 'function') showToast('Test failed: ' + err.message, 'error');
      _refreshComposerView();
    });
};

function _renderTestPanel() {
  const s = _composerState;
  const contactOptions = _simContacts.map(c =>
    `<option value="${c.id}">${esc((c.first_name || '') + ' ' + (c.last_name || ''))} — ${esc(c.email || '')} (${c.loyalty_tier || 'standard'})</option>`
  ).join('');

  let body = '';
  if (_testRunning) {
    body = `<div class="test-running">
      <div class="test-spinner"></div>
      <span>Generating content with AI...</span>
      <span class="test-running-sub">This may take a moment as each sub-agent produces its output</span>
    </div>`;
  } else if (_testResults && _testResults.outputs) {
    const r = _testResults;
    const aiUsed = r.outputs.some(o => o.output.ai_generated);
    const contactCard = `<div class="test-contact-card">
      <div class="test-contact-info">
        <strong>${esc(r.contact?.name || 'Unknown')}</strong>
        <span>${esc(r.contact?.email || '')}</span>
      </div>
      <div class="test-contact-meta">
        <span class="test-meta-pill">${esc(r.contact?.loyalty_tier || 'standard')}</span>
        <span class="test-meta-pill">LTV $${(r.contact?.lifetime_value || 0).toLocaleString()}</span>
        <span class="test-meta-pill">Score ${r.contact?.engagement_score || 0}</span>
      </div>
    </div>`;

    const outputCards = r.outputs.map(o => {
      const out = o.output;
      const channelIcon = out.channel === 'email'
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 4 12 13 2 4"/></svg>'
        : out.channel === 'sms'
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>'
        : out.channel === 'push'
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>';

      const skillPills = (out.skills_applied || []).map(sk => `<span class="test-skill-pill">${esc(sk)}</span>`).join('');
      const aiLabel = out.ai_generated
        ? '<span class="test-ai-badge test-ai-yes">AI generated</span>'
        : '<span class="test-ai-badge test-ai-mock">Template preview</span>';

      return `<div class="test-output-card" style="transition:opacity 0.3s ease, transform 0.3s ease">
        <div class="test-output-header">
          <div class="test-sa-info">
            <span class="test-sa-name">${esc(o.sub_agent_name)}</span>
            ${o.role ? `<span class="test-sa-role">${esc(o.role)}</span>` : ''}
          </div>
          <div class="test-output-badges">
            <span class="test-channel-badge">${channelIcon} ${esc(out.channel)}</span>
            ${aiLabel}
          </div>
        </div>
        ${skillPills ? `<div class="test-skills-row">${skillPills}</div>` : ''}
        ${o.upstream_data_used ? `<div class="test-data-flow-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2680EB" stroke-width="2"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg> Uses upstream data</div>` : ''}
        ${out.channel !== 'internal' ? `<div class="test-message-preview">
          ${out.subject ? `<div class="test-msg-subject"><strong>Subject:</strong> ${esc(out.subject)}</div>` : ''}
          <div class="test-msg-body">${esc(out.body).replace(/\\n/g, '<br>').replace(/\n/g, '<br>')}</div>
        </div>` : `<div class="test-internal-output">
          <div class="test-msg-body">${esc(out.body).replace(/\\n/g, '<br>').replace(/\n/g, '<br>')}</div>
        </div>`}
        ${o.structured_output ? `<div class="test-structured-output">
          <div class="test-structured-header"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/></svg> Structured output</div>
          <div class="test-structured-data">${Object.entries(o.structured_output).map(([k, v]) =>
            `<div class="test-struct-row"><span class="test-struct-key">${esc(k)}</span><span class="test-struct-val">${esc(typeof v === 'object' ? JSON.stringify(v) : String(v))}</span></div>`
          ).join('')}</div>
        </div>` : ''}
      </div>`;
    }).join('');

    const sim = r.simulation || {};
    const sm = sim.summary || {};
    const durStr = sm.estimated_duration_minutes >= 60
      ? `${Math.floor(sm.estimated_duration_minutes / 60)}h ${sm.estimated_duration_minutes % 60}m`
      : sm.estimated_duration_minutes > 0 ? `${sm.estimated_duration_minutes}m` : 'Instant';

    body = `
      ${contactCard}
      <div class="test-section-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Content Outputs <span class="test-count">${r.outputs.length}</span>
      </div>
      ${outputCards}
      <div class="test-section-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        Flow Summary
      </div>
      <div class="test-summary">
        <div class="test-sum-row"><span>Sub-agents executed</span><strong>${sm.sub_agents_executed || 0} / ${sm.sub_agents_total || 0}</strong></div>
        <div class="test-sum-row"><span>Logic nodes</span><strong>${sm.logic_nodes_processed || 0}</strong></div>
        <div class="test-sum-row"><span>Content outputs</span><strong>${r.outputs.length}</strong></div>
        <div class="test-sum-row"><span>Channels</span><strong>${(sm.channels_used || []).join(', ') || '—'}</strong></div>
        <div class="test-sum-row"><span>Est. duration</span><strong>${durStr}</strong></div>
        <div class="test-sum-row ${sm.guardrails_passed ? 'sim-gr-ok' : 'sim-gr-fail'}"><span>Guardrails</span><strong>${sm.guardrails_passed ? 'All passed ✓' : sm.guardrail_violations + ' violation(s)'}</strong></div>
        <div class="test-sum-row"><span>AI powered</span><strong>${aiUsed ? 'Yes — OpenAI' : 'Templates (no API key)'}</strong></div>
      </div>
    `;
  } else {
    body = `<div class="test-empty">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="1.5">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
      <p>Pick a contact and click <strong>Run Test</strong></p>
      <p class="test-empty-sub">AI will generate actual content for each sub-agent and show you what the customer would receive</p>
    </div>`;
  }

  return `
    <div class="cmp-details-header test-header">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
      Test Agent
    </div>
    <div class="test-panel-body">
      <div class="test-mode-info">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span>Tests the full agent: simulates the flow <em>and</em> generates actual content/messages via AI for each sub-agent</span>
      </div>
      <div class="test-controls">
        <select id="test-contact-select" class="cmp-detail-input test-contact-sel">
          <option value="">Random contact</option>
          ${contactOptions}
        </select>
        <button class="inv-action-btn inv-action-btn-purple" onclick="_runAgentTest()" ${_testRunning || !s?.id ? 'disabled' : ''} title="Run Test">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
      </div>
      ${!s?.id ? '<div class="test-warn">Save the agent first to enable testing</div>' : ''}
      ${body}
    </div>
  `;
}

/* ───── Transform mapping helpers ───── */
window._updateLogicMapping = function (nodeId, idx, field, value) {
  const node = (_composerState.logic_nodes || []).find(n => n.id === nodeId);
  if (!node || !node.config.mappings || !node.config.mappings[idx]) return;
  node.config.mappings[idx][field] = value;
  _markComposerDirty();
  _refreshComposerView();
};
window._addLogicMapping = function (nodeId) {
  const node = (_composerState.logic_nodes || []).find(n => n.id === nodeId);
  if (!node) return;
  if (!Array.isArray(node.config.mappings)) node.config.mappings = [];
  node.config.mappings.push({ from: '', to: '' });
  _markComposerDirty();
  _refreshComposerView();
};
window._removeLogicMapping = function (nodeId, idx) {
  const node = (_composerState.logic_nodes || []).find(n => n.id === nodeId);
  if (!node || !node.config.mappings) return;
  node.config.mappings.splice(idx, 1);
  _markComposerDirty();
  _refreshComposerView();
};

window._updateABVariant = function (nodeId, idx, field, value) {
  const node = (_composerState.logic_nodes || []).find(n => n.id === nodeId);
  if (!node || !Array.isArray(node.config.variants) || !node.config.variants[idx]) return;
  if (field === 'target') value = (value === '' || value === null) ? null : parseInt(value);
  node.config.variants[idx][field] = value;
  _markComposerDirty();
  _refreshComposerView();
};

window._addABVariant = function (nodeId) {
  const node = (_composerState.logic_nodes || []).find(n => n.id === nodeId);
  if (!node) return;
  if (!Array.isArray(node.config.variants)) node.config.variants = [];
  const letter = String.fromCharCode(65 + node.config.variants.length);
  node.config.variants.push({ name: letter, weight: 0, target: null });
  _markComposerDirty();
  _refreshComposerView();
};

window._removeABVariant = function (nodeId, idx) {
  const node = (_composerState.logic_nodes || []).find(n => n.id === nodeId);
  if (!node || !Array.isArray(node.config.variants) || node.config.variants.length <= 2) return;
  node.config.variants.splice(idx, 1);
  _markComposerDirty();
  _refreshComposerView();
};

window._applyExprBuilder = function (nodeId, type) {
  const field = document.getElementById('expr-field-' + nodeId)?.value;
  const op = document.getElementById('expr-op-' + nodeId)?.value;
  const val = document.getElementById('expr-val-' + nodeId)?.value;
  if (!field || !val) return;
  const expr = `${field} ${op} ${val}`;
  _updateLogicNode(nodeId, 'expression', expr);
};

window._toggleParallelBranch = function (nodeId, saIdx, checked) {
  const node = (_composerState.logic_nodes || []).find(n => n.id === nodeId);
  if (!node) return;
  if (!Array.isArray(node.config.branches)) node.config.branches = [];
  if (checked && !node.config.branches.includes(saIdx)) {
    node.config.branches.push(saIdx);
    node.config.branches.sort((a, b) => a - b);
  } else if (!checked) {
    node.config.branches = node.config.branches.filter(i => i !== saIdx);
  }
  _markComposerDirty();
  _refreshComposerView();
};

/* ───── State mutation helpers ───── */
window._composerSelect = function (type, indexOrId) {
  if (type === 'logic') _composerSelected = { type: 'logic', id: indexOrId };
  else if (type === 'agent') _composerSelected = { type: 'agent' };
  else _composerSelected = { type, index: indexOrId };
  if (type !== 'agent') _agentDetailTab = 'properties';
  _flowAddOpen = null;
  _probSelectedEdge = null;
  _refreshComposerView();
};

window._switchAgentTab = function (tab) {
  _agentDetailTab = tab;
  _refreshComposerView();
};

window._toggleFlowAdd = function (slot) {
  _flowAddOpen = _flowAddOpen === slot ? null : slot;
  _refreshComposerView();
};

window._insertLogicNode = function (slot, type) {
  const id = 'ln_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const meta = LOGIC_NODE_TYPES[type];
  if (!_composerState.logic_nodes) _composerState.logic_nodes = [];
  _composerState.logic_nodes.push({
    id, type, slot,
    label: meta ? meta.label : type,
    config: JSON.parse(JSON.stringify(LOGIC_DEFAULTS[type] || {}))
  });
  _flowAddOpen = null;
  _composerSelected = { type: 'logic', id };
  _markComposerDirty();
  _refreshComposerView();
};

window._removeLogicNode = function (id) {
  _composerState.logic_nodes = (_composerState.logic_nodes || []).filter(n => n.id !== id);
  if (_composerSelected?.type === 'logic' && _composerSelected?.id === id) _composerSelected = { type: 'agent' };
  _markComposerDirty();
  _refreshComposerView();
};

async function _loadInvokeAgentInfo(nid, agentId) {
  const el = document.getElementById(`cmp-invoke-info-${nid}`);
  if (!el) return;
  try {
    const agent = await (await fetch(`/api/agents/${agentId}`)).json();
    const saCount = (agent.sub_agents || []).length;
    const logicCount = (agent.logic_nodes || []).length;
    const statusCls = agent.status === 'active' ? 'active' : agent.status === 'draft' ? 'draft' : 'paused';
    el.innerHTML = `
      <div class="cmp-invoke-preview">
        <span class="inv-card-status ${statusCls}">${agent.status || 'draft'}</span>
        <div class="cmp-invoke-preview-row"><strong>${esc(agent.name)}</strong></div>
        ${agent.goal ? `<div class="cmp-invoke-preview-row" style="color:#6B7280;font-size:11px">${esc(agent.goal)}</div>` : ''}
        <div class="cmp-invoke-preview-row" style="font-size:11px;color:#9CA3AF">${saCount} sub-agent${saCount !== 1 ? 's' : ''} · ${logicCount} logic node${logicCount !== 1 ? 's' : ''}</div>
        <button type="button" class="sa-btn sa-btn-sm" onclick="window.currentRoute={view:'agents',id:${agentId}};showPage('agents')" style="margin-top:6px;font-size:10px">Open in Composer</button>
      </div>
    `;
  } catch (_) {
    el.innerHTML = '<div style="color:#EF4444;font-size:11px">Could not load agent info</div>';
  }
}

window._updateLogicNode = function (id, field, value) {
  const node = (_composerState.logic_nodes || []).find(n => n.id === id);
  if (!node) return;
  if (field === 'label') node.label = value;
  else node.config[field] = value;
  _markComposerDirty();
  _refreshComposerView();
};

window._insertSubAgentAt = function (slot) {
  const sa = { name: 'New Agent', role: 'executor', description: '', system_instructions: '', skill_ids: [], tool_ids: [], node_ids: [] };
  _composerState.sub_agents.splice(slot, 0, sa);
  (_composerState.logic_nodes || []).forEach(n => { if (n.slot > slot) n.slot++; });
  _composerSelected = { type: 'sub-agent', index: slot };
  _flowAddOpen = null;
  _markComposerDirty();
  _refreshComposerView();
};

window._composerUpdateAgent = function (field, value) {
  _composerState[field] = value;
  _markComposerDirty();
  _refreshComposerView();
};

window._addSAOutput = function (idx) {
  const sa = _composerState.sub_agents[idx];
  if (!sa) return;
  if (!Array.isArray(sa.output_schema)) sa.output_schema = [];
  sa.output_schema.push({ key: '', type: 'string', description: '' });
  _markComposerDirty();
  _refreshComposerView();
};

window._removeSAOutput = function (idx, oi) {
  const sa = _composerState.sub_agents[idx];
  if (!sa || !Array.isArray(sa.output_schema)) return;
  sa.output_schema.splice(oi, 1);
  _markComposerDirty();
  _refreshComposerView();
};

window._updateSAOutput = function (idx, oi, field, value) {
  const sa = _composerState.sub_agents[idx];
  if (!sa || !Array.isArray(sa.output_schema) || !sa.output_schema[oi]) return;
  sa.output_schema[oi][field] = value;
  _markComposerDirty();
  _refreshComposerView();
};

window._insertVarRef = function (saIdx, varPath) {
  const el = document.getElementById('sa-instructions-' + saIdx);
  if (!el) return;
  const ref = `{{${varPath}}}`;
  const start = el.selectionStart || el.value.length;
  const end = el.selectionEnd || el.value.length;
  el.value = el.value.slice(0, start) + ref + el.value.slice(end);
  _composerUpdateSA(saIdx, 'system_instructions', el.value);
  el.focus();
  el.setSelectionRange(start + ref.length, start + ref.length);
};

window._composerUpdateSA = function (idx, field, value) {
  if (_composerState.sub_agents[idx]) {
    _composerState.sub_agents[idx][field] = value;
    _markComposerDirty();
    _refreshComposerView();
  }
};

window._composerUpdateGuardrail = function (field, value) {
  _composerState.guardrails[field] = value;
  _markComposerDirty();
  _refreshComposerView();
};

window._composerUpdateChannelLimit = function (channel, value) {
  if (!_composerState.guardrails.channel_limits) _composerState.guardrails.channel_limits = {};
  _composerState.guardrails.channel_limits[channel] = value;
  _markComposerDirty();
  _refreshComposerView();
};

window._composerToggleAgentTool = function (toolId, checked) {
  const ids = _composerState.tool_ids;
  if (checked && !ids.includes(toolId)) ids.push(toolId);
  else if (!checked) _composerState.tool_ids = ids.filter(id => id !== toolId);
  _markComposerDirty();
  _refreshComposerView();
};

window._composerAddSubAgent = function () {
  _composerState.sub_agents.push({
    name: 'New Agent', role: 'executor', description: '', system_instructions: '',
    skill_ids: [], tool_ids: [], node_ids: []
  });
  _composerSelected = { type: 'sub-agent', index: _composerState.sub_agents.length - 1 };
  _markComposerDirty();
  _refreshComposerView();
};

window._addExistingAgent = async function (agentId) {
  try {
    const r = await fetch(`/api/agents/${agentId}`);
    const agent = await r.json();
    if (!agent || agent.type !== 'agent') return;
    _composerState.sub_agents.push({
      id: agent.id,
      name: agent.name || '', role: agent.role || 'executor',
      description: agent.description || '', system_instructions: agent.system_instructions || '',
      skill_ids: agent.skill_ids || [], tool_ids: agent.tool_ids || [],
      node_ids: agent.node_ids || [], output_schema: agent.output_schema || []
    });
    _composerSelected = { type: 'sub-agent', index: _composerState.sub_agents.length - 1 };
    _markComposerDirty();
    _refreshComposerView();
    if (typeof showToast === 'function') showToast(`Added "${agent.name}" to flow`, 'success');
  } catch (e) {
    if (typeof showToast === 'function') showToast('Failed to add agent', 'error');
  }
};

window._composerRemoveSubAgent = function (idx) {
  _composerState.sub_agents.splice(idx, 1);
  (_composerState.logic_nodes || []).forEach(n => {
    if (n.slot === idx + 1) n.slot = idx;
    else if (n.slot > idx + 1) n.slot--;
  });
  if (_composerSelected?.type === 'sub-agent') {
    if (_composerSelected.index === idx) _composerSelected = { type: 'agent' };
    else if (_composerSelected.index > idx) _composerSelected.index--;
  }
  _markComposerDirty();
  _refreshComposerView();
};

window._composerRemoveSkill = function (saIdx, skillId) {
  const sa = _composerState.sub_agents[saIdx];
  if (sa) sa.skill_ids = (sa.skill_ids || []).filter(id => id !== skillId);
  _markComposerDirty();
  _refreshComposerView();
};

window._composerRemoveTool = function (saIdx, toolId) {
  const sa = _composerState.sub_agents[saIdx];
  if (sa) sa.tool_ids = (sa.tool_ids || []).filter(id => id !== toolId);
  _markComposerDirty();
  _refreshComposerView();
};

function _refreshComposerView() {
  const canvas = document.getElementById('cmp-canvas');
  const details = document.getElementById('cmp-details');
  if (canvas) canvas.innerHTML = _renderCanvas();
  if (details) details.innerHTML = _renderDetails();
  _initComposerDragDrop();
  _composerChatPaintWorkflow();
  const sel = _composerSelected;
  if (sel?.type === 'sub-agent') {
    _composerChatPaintSubAgent(sel.index);
    _initSubAgentChatPanel(sel.index);
  }
}

/* ───── Drag & Drop ───── */
let _saReorderFrom = null;

function _initComposerDragDrop() {
  // --- Palette → Card drag (skills/tools/new-subagent) ---
  document.querySelectorAll('.cmp-palette-tile[draggable], .cmp-pal-item[draggable]').forEach(tile => {
    tile.addEventListener('dragstart', e => {
      const dragType = tile.dataset.cmpDrag;
      const dragId = tile.dataset.cmpId || '';
      e.dataTransfer.setData('text/plain', JSON.stringify({ dragType, dragId: dragId ? parseInt(dragId) : null }));
      e.dataTransfer.effectAllowed = 'copy';
      tile.classList.add('cmp-dragging');
      document.querySelectorAll('.cmp-subagent-card').forEach(c => c.classList.add('cmp-drop-target'));
    });
    tile.addEventListener('dragend', () => {
      tile.classList.remove('cmp-dragging');
      document.querySelectorAll('.cmp-subagent-card').forEach(c => c.classList.remove('cmp-drop-target', 'cmp-drop-hover'));
    });
  });

  // --- Sub-agent handle → Reorder drag ---
  document.querySelectorAll('.cmp-sa-handle').forEach(handle => {
    handle.addEventListener('dragstart', e => {
      e.stopPropagation();
      const card = handle.closest('.cmp-subagent-card');
      _saReorderFrom = parseInt(card.dataset.saIdx);
      e.dataTransfer.setData('text/plain', JSON.stringify({ dragType: 'reorder-sa', fromIdx: _saReorderFrom }));
      e.dataTransfer.effectAllowed = 'move';
      requestAnimationFrame(() => card.classList.add('cmp-sa-dragging'));
      document.querySelectorAll('.cmp-subagent-card').forEach(c => {
        if (parseInt(c.dataset.saIdx) !== _saReorderFrom) c.classList.add('cmp-reorder-target');
      });
    });
    handle.addEventListener('dragend', () => {
      _saReorderFrom = null;
      document.querySelectorAll('.cmp-subagent-card').forEach(c => {
        c.classList.remove('cmp-sa-dragging', 'cmp-reorder-target', 'cmp-reorder-before', 'cmp-reorder-after');
      });
    });
  });

  // --- Sub-agent card: receive palette drops OR reorder drops ---
  document.querySelectorAll('.cmp-subagent-card').forEach(card => {
    card.addEventListener('dragover', e => {
      e.preventDefault();
      const raw = _saReorderFrom;
      if (raw !== null && raw !== undefined) {
        e.dataTransfer.dropEffect = 'move';
        const rect = card.getBoundingClientRect();
        const before = e.clientY < rect.top + rect.height / 2;
        card.classList.toggle('cmp-reorder-before', before);
        card.classList.toggle('cmp-reorder-after', !before);
      } else {
        e.dataTransfer.dropEffect = 'copy';
        card.classList.add('cmp-drop-hover');
      }
    });
    card.addEventListener('dragleave', () => {
      card.classList.remove('cmp-drop-hover', 'cmp-reorder-before', 'cmp-reorder-after');
    });
    card.addEventListener('drop', e => {
      e.preventDefault();
      card.classList.remove('cmp-drop-hover', 'cmp-reorder-before', 'cmp-reorder-after');
      try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const saIdx = parseInt(card.dataset.saIdx);
        if (isNaN(saIdx)) return;

        if (data.dragType === 'reorder-sa') {
          const fromIdx = data.fromIdx;
          if (fromIdx === saIdx) return;
          const insertAfter = card.classList.contains('cmp-reorder-after');
          const arr = _composerState.sub_agents;
          const [moved] = arr.splice(fromIdx, 1);
          let targetIdx = fromIdx < saIdx ? saIdx - 1 : saIdx;
          if (insertAfter) targetIdx++;
          targetIdx = Math.max(0, Math.min(arr.length, targetIdx));
          arr.splice(targetIdx, 0, moved);
          if (_composerSelected?.type === 'sub-agent') {
            _composerSelected.index = arr.indexOf(moved);
          }
          _saReorderFrom = null;
          _markComposerDirty();
          _refreshComposerView();
          if (typeof showToast === 'function') showToast('Sub-agent reordered', 'success');
          return;
        }

        const sa = _composerState.sub_agents[saIdx];
        if (!sa) return;

        if (data.dragType === 'skill' && data.dragId) {
          if (!sa.skill_ids.includes(data.dragId)) {
            sa.skill_ids.push(data.dragId);
            _composerSelected = { type: 'sub-agent', index: saIdx };
            _markComposerDirty();
            _refreshComposerView();
            if (typeof showToast === 'function') showToast('Skill attached', 'success');
          }
        } else if (data.dragType === 'tool' && data.dragId) {
          if (!sa.tool_ids.includes(data.dragId)) {
            sa.tool_ids.push(data.dragId);
            _composerSelected = { type: 'sub-agent', index: saIdx };
            _markComposerDirty();
            _refreshComposerView();
            if (typeof showToast === 'function') showToast('Tool attached', 'success');
          }
        } else if (data.dragType === 'new-subagent') {
          _composerAddSubAgent();
        }
      } catch (_) {}
    });
  });

  // --- Agent card: receive palette tool drops ---
  const agentCard = document.querySelector('.cmp-agent-card');
  if (agentCard) {
    agentCard.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; agentCard.classList.add('cmp-drop-hover'); });
    agentCard.addEventListener('dragleave', () => agentCard.classList.remove('cmp-drop-hover'));
    agentCard.addEventListener('drop', e => {
      e.preventDefault();
      agentCard.classList.remove('cmp-drop-hover');
      try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (data.dragType === 'tool' && data.dragId && !_composerState.tool_ids.includes(data.dragId)) {
          _composerState.tool_ids.push(data.dragId);
          _composerSelected = { type: 'agent' };
          _markComposerDirty();
          _refreshComposerView();
          if (typeof showToast === 'function') showToast('Tool added to agent', 'success');
        }
      } catch (_) {}
    });
  }

  // --- Logic node handles: drag to reorder ---
  let _lnReorderId = null;
  document.querySelectorAll('.cmp-ln-handle').forEach(handle => {
    const card = handle.closest('.cmp-logic-node');
    if (!card) return;
    handle.addEventListener('dragstart', e => {
      _lnReorderId = card.dataset.lnId;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify({ dragType: 'logic-reorder', lnId: _lnReorderId }));
      requestAnimationFrame(() => card.classList.add('cmp-sa-dragging'));
    });
    handle.addEventListener('dragend', () => {
      _lnReorderId = null;
      card.classList.remove('cmp-sa-dragging');
    });
  });

  // --- Flow connectors: receive drops (palette sub-agent, logic reorder) ---
  document.querySelectorAll('.cmp-flow-connector[data-flow-slot]').forEach(conn => {
    conn.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = _lnReorderId ? 'move' : 'copy';
      conn.classList.add('cmp-flow-drop-hover');
    });
    conn.addEventListener('dragleave', () => conn.classList.remove('cmp-flow-drop-hover'));
    conn.addEventListener('drop', e => {
      e.preventDefault();
      conn.classList.remove('cmp-flow-drop-hover');
      const slot = parseInt(conn.dataset.flowSlot);
      try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (data.dragType === 'logic-reorder' && data.lnId) {
          const node = (_composerState.logic_nodes || []).find(n => n.id === data.lnId);
          if (node && node.slot !== slot) {
            node.slot = slot;
            _markComposerDirty();
            _refreshComposerView();
          }
        } else if (data.dragType === 'new-subagent') {
          _insertSubAgentAt(slot);
        }
      } catch (_) {}
    });
  });
}

/* ───── Save ───── */
window._composerSave = async function () {
  const s = _composerState;
  if (!s.name || !s.name.trim()) {
    if (typeof showToast === 'function') showToast('Please enter an agent name before saving', 'warning');
    return;
  }
  const body = {
    name: s.name,
    goal: s.goal,
    description: s.description,
    status: s.status,
    source_workflow_id: s.source_workflow_id,
    tool_ids: s.tool_ids,
    type: 'orchestrator',
    sub_agents: s.sub_agents.map(sa => ({
      id: sa.id || undefined,
      name: sa.name,
      role: sa.role,
      description: sa.description,
      system_instructions: sa.system_instructions,
      skill_ids: sa.skill_ids || [],
      tool_ids: sa.tool_ids || [],
      node_ids: sa.node_ids || [],
      output_schema: sa.output_schema || []
    })),
    logic_nodes: (s.logic_nodes || []).map(n => ({
      id: n.id, type: n.type, slot: n.slot, label: n.label, config: n.config
    })),
    guardrails: {
      max_messages_per_contact_per_day: s.guardrails.max_messages_per_contact_per_day,
      channel_limits: s.guardrails.channel_limits || {},
      require_approval: s.guardrails.require_approval,
      budget_limit: s.guardrails.budget_limit
    },
    triggers: (s.triggers || []).map(t => ({...t})),
    probabilistic_config: s.probabilistic_config || undefined
  };

  const isNew = !s.id;
  const url = isNew ? '/api/agents' : `/api/agents/${s.id}`;
  const method = isNew ? 'POST' : 'PUT';
  if (isNew) body.created_by = 'User';

  try {
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error('Save failed');
    if (isNew) {
      const created = await r.json();
      _composerState.id = created.id;
    }
    _composerDirty = false;
    if (typeof showToast === 'function') showToast(isNew ? 'Agent created' : 'Agent saved', 'success');
    navigateTo('agents', 'list');
  } catch (err) {
    if (typeof showToast === 'function') showToast('Error saving agent: ' + err.message, 'error');
  }
};

/* ═══════════════════════════════════════════════════════════════
   TOOLS
   ═══════════════════════════════════════════════════════════════ */

const TOOL_CATEGORIES = {
  channel: { label: 'Channel', color: '#2680EB' },
  data: { label: 'Data', color: '#13A10E' },
  content: { label: 'Content', color: '#E68619' },
  integration: { label: 'Integration', color: '#7C3AED' },
  utility: { label: 'Utility', color: '#6B7280' }
};

const TOOL_TYPES = { platform: 'Platform', custom: 'Custom' };
const TOOL_AUTH_TYPES = ['none', 'api_key', 'oauth', 'bearer'];
const TOOL_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const TOOL_PARAM_TYPES = ['string', 'number', 'boolean', 'object', 'array'];

const TOOL_ICONS = {
  email: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
  sms: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  push: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  edit: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  audience: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/></svg>',
  delivery: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  http: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  ai: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>',
  wait: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  condition: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>',
  log: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  slack: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="13" y="2" width="3" height="8" rx="1.5"/><path d="M19 8.5V10h1.5A1.5 1.5 0 1 0 19 8.5"/><rect x="8" y="14" width="3" height="8" rx="1.5"/><path d="M5 15.5V14H3.5A1.5 1.5 0 1 0 5 15.5"/><rect x="14" y="13" width="8" height="3" rx="1.5"/><path d="M15.5 19H14v1.5a1.5 1.5 0 1 0 1.5-1.5"/><rect x="2" y="8" width="8" height="3" rx="1.5"/><path d="M8.5 5H10V3.5A1.5 1.5 0 1 0 8.5 5"/></svg>',
  salesforce: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>',
  tool: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>'
};

function toolIcon(name) {
  return TOOL_ICONS[name] || TOOL_ICONS.tool;
}

function toolCategoryBadge(cat) {
  const c = TOOL_CATEGORIES[cat];
  const label = c ? c.label : (cat || 'Other');
  return `<span class="sa-chip sa-chip-category">${esc(label)}</span>`;
}

function toolTypeBadge(type) {
  const label = TOOL_TYPES[type] || type || 'Custom';
  const cls = type === 'platform' ? 'tool-type-platform' : 'tool-type-custom';
  return `<span class="sa-chip ${cls}">${esc(label)}</span>`;
}

let agentToolFilters = { type: 'all', category: 'all', status: 'all', search: '' };

function updateAgentToolFilter(key, value) {
  agentToolFilters[key] = value;
  if (typeof window.loadAgentTools === 'function') window.loadAgentTools();
}
function clearAgentToolFilterTag(key) {
  if (key === 'search') agentToolFilters.search = '';
  else agentToolFilters[key] = 'all';
  if (typeof window.loadAgentTools === 'function') window.loadAgentTools();
}
window.clearAgentToolFilters = function () {
  agentToolFilters = { type: 'all', category: 'all', status: 'all', search: '' };
  if (typeof window.loadAgentTools === 'function') window.loadAgentTools();
};

window.loadAgentTools = async function () {
  const content = document.getElementById('content');
  try {
    const response = await fetch('/api/agent-tools');
    const allTools = await response.json();

    let tools = allTools.filter(t => {
      if (agentToolFilters.type !== 'all' && t.type !== agentToolFilters.type) return false;
      if (agentToolFilters.category !== 'all' && t.category !== agentToolFilters.category) return false;
      if (agentToolFilters.status !== 'all' && (t.status || 'active') !== agentToolFilters.status) return false;
      if (agentToolFilters.search) {
        const q = agentToolFilters.search.toLowerCase();
        const name = (t.name || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        if (!name.includes(q) && !desc.includes(q)) return false;
      }
      return true;
    });

    tools = tools.map(t => ({
      ...t,
      _param_count: Array.isArray(t.parameters) ? t.parameters.length : 0
    }));

    if (!currentTableSort.column) {
      currentTableSort.column = 'name';
      currentTableSort.direction = 'asc';
    }
    tools = applySorting(tools, currentTableSort.column || 'name');

    const filterTags = [];
    if (agentToolFilters.search) filterTags.push({ key: 'search', label: 'Search', value: agentToolFilters.search });
    if (agentToolFilters.type !== 'all') filterTags.push({ key: 'type', label: 'Type', value: agentToolFilters.type });
    if (agentToolFilters.category !== 'all') filterTags.push({ key: 'category', label: 'Category', value: agentToolFilters.category });
    if (agentToolFilters.status !== 'all') filterTags.push({ key: 'status', label: 'Status', value: agentToolFilters.status });

    const statusMap = { active: 'in-progress', inactive: 'stopped', draft: 'draft' };
    const toolsViewMode = window._contentListViewMode?.['agent-tools'] || 'grid';

    const rows = tools.map(t => {
      const actions = [
        { icon: (window.ICONS?.edit || ''), label: 'Edit', onclick: `navigateTo('agent-tools', 'edit', ${t.id})` },
        { divider: true },
        { icon: (window.ICONS?.trash || ''), label: 'Delete', onclick: `deleteTool(${t.id})`, danger: true }
      ];
      return `
        <tr>
          <td data-column-id="name">
            <div style="display:flex;align-items:center;gap:8px">
              <span class="tool-icon-cell">${toolIcon(t.icon)}</span>
              ${createTableLink(t.name || 'Untitled Tool', `navigateTo('agent-tools', 'edit', ${t.id})`)}
            </div>
            <div class="table-subtext">${esc((t.description || '').slice(0, 90))}</div>
          </td>
          <td data-column-id="type">${toolTypeBadge(t.type)}</td>
          <td data-column-id="category">${toolCategoryBadge(t.category)}</td>
          <td data-column-id="status">${createStatusIndicator(statusMap[t.status] || 'draft', t.status || 'active')}</td>
          <td data-column-id="method"><code>${esc(t.method || 'POST')}</code></td>
          <td data-column-id="_param_count">${t._param_count}</td>
          <td data-column-id="auth_type">${esc(t.auth_type || 'none')}</td>
          <td data-column-id="updated_at">${t.updated_at ? new Date(t.updated_at).toLocaleString() : '-'}</td>
          <td>${createActionMenu(t.id, actions)}</td>
        </tr>
      `;
    }).join('');

    const toolCards = tools.map(t => {
      const paramCount = t._param_count;
      const updatedText = t.updated_at ? new Date(t.updated_at).toLocaleDateString() : '-';
      return `
        <article class="inventory-card agent-inventory-card" onclick="navigateTo('agent-tools', 'edit', ${t.id})">
          <div class="inventory-icon-actions">
            <button class="inv-icon-btn" onclick="event.stopPropagation(); navigateTo('agent-tools','edit',${t.id})" title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="inv-icon-btn inv-icon-btn-danger" onclick="event.stopPropagation(); deleteTool(${t.id})" title="Delete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
          </div>
          <div class="inventory-card-body">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
              <span class="tool-card-icon">${toolIcon(t.icon)}</span>
              <div class="inventory-card-name" style="margin-bottom:0">${esc(t.name || 'Untitled Tool')}</div>
            </div>
            <div class="inventory-card-meta">${toolTypeBadge(t.type)} ${toolCategoryBadge(t.category)} ${statusBadge(t.status || 'active')}</div>
            <div class="inventory-card-meta">${esc((t.description || '').slice(0, 120)) || 'No description'}</div>
            <div class="inventory-card-meta"><code>${esc(t.method || 'POST')}</code> · ${paramCount} param${paramCount !== 1 ? 's' : ''} · Auth: ${esc(t.auth_type || 'none')}</div>
            <div class="inventory-card-meta">Updated: ${updatedText}</div>
          </div>
        </article>
      `;
    }).join('');

    const columns = [
      { id: 'name', label: 'Tool' },
      { id: 'type', label: 'Type' },
      { id: 'category', label: 'Category' },
      { id: 'status', label: 'Status' },
      { id: 'method', label: 'Method' },
      { id: '_param_count', label: 'Params' },
      { id: 'auth_type', label: 'Auth' },
      { id: 'updated_at', label: 'Last modified' }
    ];

    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Tools</h3>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-primary" onclick="createNewTool()">+ New Tool</button>
          </div>
        </div>
        ${createTableToolbar({
          resultCount: tools.length,
          totalCount: allTools.length,
          showColumnSelector: true,
          showViewModeToggle: true,
          viewMode: toolsViewMode,
          viewKeyForMode: 'agent-tools',
          columns,
          viewKey: 'agent-tools',
          showSearch: true,
          searchPlaceholder: 'Search tools...',
          searchValue: agentToolFilters.search || '',
          onSearch: 'updateAgentToolFilter("search", this.value)',
          filterTags,
          onClearTag: 'clearAgentToolFilterTag',
          filters: [
            {
              type: 'select',
              label: 'Type',
              value: agentToolFilters.type,
              onChange: 'updateAgentToolFilter("type", this.value)',
              options: [{ value: 'all', label: 'All types' }, { value: 'platform', label: 'Platform' }, { value: 'custom', label: 'Custom' }]
            },
            {
              type: 'select',
              label: 'Category',
              value: agentToolFilters.category,
              onChange: 'updateAgentToolFilter("category", this.value)',
              options: [{ value: 'all', label: 'All categories' }, ...Object.entries(TOOL_CATEGORIES).map(([k, v]) => ({ value: k, label: v.label }))]
            },
            {
              type: 'select',
              label: 'Status',
              value: agentToolFilters.status,
              onChange: 'updateAgentToolFilter("status", this.value)',
              options: [
                { value: 'all', label: 'All statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'draft', label: 'Draft' }
              ]
            }
          ]
        })}
        ${toolsViewMode === 'grid'
          ? `<div class="inventory-grid">${toolCards || '<div class="empty-state" style="grid-column:1/-1;padding:3rem;text-align:center;color:#6B7280">No tools found</div>'}</div>`
          : `<div class="data-table-container">
              <table class="data-table" data-view="agent-tools">
                <thead>
                  <tr>
                    ${createSortableHeader('name', 'Tool', currentTableSort)}
                    ${createSortableHeader('type', 'Type', currentTableSort)}
                    ${createSortableHeader('category', 'Category', currentTableSort)}
                    ${createSortableHeader('status', 'Status', currentTableSort)}
                    <th data-column-id="method">Method</th>
                    ${createSortableHeader('_param_count', 'Params', currentTableSort)}
                    <th data-column-id="auth_type">Auth</th>
                    ${createSortableHeader('updated_at', 'Last modified', currentTableSort)}
                    <th style="width:50px;"></th>
                  </tr>
                </thead>
                <tbody>
                  ${rows || '<tr><td colspan="9" style="text-align:center;padding:2rem;color:#6B7280;">No tools found</td></tr>'}
                </tbody>
              </table>
            </div>`
        }
      </div>
    `;
    if (toolsViewMode === 'list') applyColumnVisibility('agent-tools');
  } catch (err) {
    content.innerHTML = `<p class="sa-error">Error loading tools: ${esc(err.message)}</p>`;
  }
};

window.deleteTool = async function (id) {
  if (!confirm('Delete this tool?')) return;
  try {
    const r = await fetch(`/api/agent-tools/${id}`, { method: 'DELETE' });
    if (!r.ok) {
      const d = await r.json();
      throw new Error(d.error || 'Delete failed');
    }
    if (typeof showToast === 'function') showToast('Tool deleted', 'success');
    window.loadAgentTools();
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message, 'error');
  }
};

window.createNewTool = function () {
  const blankTool = {
    id: null,
    name: '',
    description: '',
    type: 'custom',
    category: 'integration',
    status: 'draft',
    icon: 'tool',
    endpoint: '',
    method: 'POST',
    headers: {},
    auth_type: 'none',
    timeout_ms: 30000,
    retry_policy: { max_retries: 0, backoff_ms: 1000 },
    parameters: [],
    input_schema: {},
    output_schema: {}
  };
  window.renderToolEditForm(blankTool);
};

/* ───── Tool Edit Form ───── */
window.renderToolEditForm = async function (existingData) {
  const content = document.getElementById('content');
  let tool = existingData;
  if (!tool && window.currentRoute?.id) {
    try {
      const r = await fetch(`/api/agent-tools/${window.currentRoute.id}`);
      tool = await r.json();
    } catch (_) { /* handled below */ }
  }
  if (!tool) {
    content.innerHTML = '<p class="sa-error">Tool not found</p>';
    return;
  }
  const id = tool.id || window.currentRoute?.id;
  const params = Array.isArray(tool.parameters) ? tool.parameters : [];
  const isPlatform = tool.type === 'platform';

  function paramRowHTML(p, idx) {
    return `
      <div class="ate-param" data-idx="${idx}">
        <div class="ate-param-head">
          <div class="ate-param-grid">
            <div class="ate-field">
              <label class="ate-label">Name</label>
              <input type="text" class="ate-input tp-name" value="${esc(p.name || '')}" placeholder="e.g. contact_id" />
            </div>
            <div class="ate-field">
              <label class="ate-label">Type</label>
              <select class="ate-select tp-type">
                ${TOOL_PARAM_TYPES.map(t => `<option value="${t}" ${t === p.type ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
            <label class="ate-req"><input type="checkbox" class="tp-required" ${p.required ? 'checked' : ''} /><span>Required</span></label>
          </div>
          <button type="button" class="ate-icon-btn ate-param-del" title="Remove" onclick="removeToolParam(this)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
        <div class="ate-field ate-field-inline2">
          <div><label class="ate-label">Default</label><input type="text" class="ate-input tp-default" value="${esc(p.default_value || '')}" placeholder="Optional default" /></div>
          <div class="ate-field-grow"><label class="ate-label">Description</label><input type="text" class="ate-input tp-desc" value="${esc(p.description || '')}" placeholder="What this parameter is for" /></div>
        </div>
      </div>
    `;
  }

  const paramRows = params.map((p, i) => paramRowHTML(p, i)).join('');
  const headersJson = typeof tool.headers === 'object' ? JSON.stringify(tool.headers, null, 2) : '{}';
  const inputJson = tool.input_schema && Object.keys(tool.input_schema).length > 0 ? JSON.stringify(tool.input_schema, null, 2) : '{}';
  const outputJson = tool.output_schema && Object.keys(tool.output_schema).length > 0 ? JSON.stringify(tool.output_schema, null, 2) : '{}';
  const advOpen = headersJson.trim() !== '{}' || Object.keys(tool.input_schema || {}).length > 0 || Object.keys(tool.output_schema || {}).length > 0;
  const statusVal = tool.status || 'draft';
  const cfgLocked = isPlatform;

  content.innerHTML = `
    <form class="ate-form" onsubmit="handleToolSave(event, '${id || ''}')">
      <header class="ate-header">
        <div class="ate-header-inner">
          <button type="button" class="ate-back" onclick="navigateTo('agent-tools', 'list')" title="Back to tools">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div class="ate-header-main">
            <div class="ate-title-row">
              <span class="ate-icon-preview" id="ate-icon-preview">${toolIcon(tool.icon || 'tool')}</span>
              <div>
                <h1 class="ate-title">${esc(tool.name || 'New tool')}</h1>
                <p class="ate-subtitle">
                  <span class="ate-pill ate-pill-${isPlatform ? 'platform' : 'custom'}">${isPlatform ? 'Platform' : 'Custom'}</span>
                  <span class="ate-dot">·</span>
                  <span>${id ? 'Saved · #' + id : 'Draft — not saved yet'}</span>
                </p>
              </div>
            </div>
          </div>
          <div class="ate-header-actions">
            <button type="button" class="ate-btn ate-btn-quiet" onclick="navigateTo('agent-tools', 'list')">Cancel</button>
            <button type="submit" class="ate-btn ate-btn-primary">${id ? 'Save' : 'Create tool'}</button>
          </div>
        </div>
      </header>

      <div class="ate-main">
        <div class="ate-container">
          ${isPlatform ? '<div class="ate-banner">Platform tools use shared runtime settings. Change only what your org allows.</div>' : ''}

          <div class="ate-split">
            <section class="ate-card ate-card-overview">
              <div class="ate-card-head">
                <h2 class="ate-card-title">Overview</h2>
                <p class="ate-card-hint">Name and describe how agents should use this tool.</p>
              </div>
              <div class="ate-field">
                <label class="ate-label" for="tool-name">Display name</label>
                <input type="text" class="ate-input ate-input-lg" id="tool-name" value="${esc(tool.name || '')}" placeholder="e.g. Send transactional email" required autocomplete="off" />
              </div>
              <div class="ate-field">
                <label class="ate-label" for="tool-description">Description</label>
                <textarea class="ate-textarea ate-textarea-tall" id="tool-description" rows="5" placeholder="Short summary for builders and AI context">${esc(tool.description || '')}</textarea>
              </div>
              <div class="ate-row4 ate-row4-split">
                <div class="ate-field">
                  <label class="ate-label" for="tool-type">Type</label>
                  <select class="ate-select" id="tool-type" ${id && isPlatform ? 'disabled' : ''}>
                    <option value="platform" ${tool.type === 'platform' ? 'selected' : ''}>Platform</option>
                    <option value="custom" ${tool.type === 'custom' ? 'selected' : ''}>Custom</option>
                  </select>
                </div>
                <div class="ate-field">
                  <label class="ate-label" for="tool-category">Category</label>
                  <select class="ate-select" id="tool-category">
                    ${Object.entries(TOOL_CATEGORIES).map(([k, v]) => `<option value="${k}" ${k === tool.category ? 'selected' : ''}>${v.label}</option>`).join('')}
                  </select>
                </div>
                <div class="ate-field">
                  <label class="ate-label" for="tool-status">Status</label>
                  <select class="ate-select" id="tool-status">
                    <option value="draft" ${statusVal === 'draft' ? 'selected' : ''}>Draft</option>
                    <option value="active" ${statusVal === 'active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${statusVal === 'inactive' ? 'selected' : ''}>Inactive</option>
                  </select>
                </div>
                <div class="ate-field">
                  <label class="ate-label" for="tool-icon">Icon</label>
                  <select class="ate-select" id="tool-icon">
                    ${Object.keys(TOOL_ICONS).map(k => `<option value="${k}" ${k === (tool.icon || 'tool') ? 'selected' : ''}>${k}</option>`).join('')}
                  </select>
                </div>
              </div>
            </section>

            <section class="ate-card ate-card-http">
              <div class="ate-card-head">
                <h2 class="ate-card-title">HTTP connection</h2>
                <p class="ate-card-hint">Where this tool calls out to. Method and URL in one step.</p>
              </div>
              <div class="ate-endpoint-bar ate-endpoint-stacked">
                <select class="ate-select ate-method" id="tool-method" ${cfgLocked ? 'disabled' : ''}>
                  ${TOOL_METHODS.map(m => `<option value="${m}" ${m === (tool.method || 'POST') ? 'selected' : ''}>${m}</option>`).join('')}
                </select>
                <input type="url" class="ate-input ate-endpoint" id="tool-endpoint" value="${esc(tool.endpoint || '')}" placeholder="https://api.example.com/v1/action" ${cfgLocked ? 'readonly' : ''} />
              </div>
              <div class="ate-row3 ate-row3-http">
                <div class="ate-field">
                  <label class="ate-label" for="tool-auth-type">Authentication</label>
                  <select class="ate-select" id="tool-auth-type" ${cfgLocked ? 'disabled' : ''}>
                    ${TOOL_AUTH_TYPES.map(a => `<option value="${a}" ${a === (tool.auth_type || 'none') ? 'selected' : ''}>${a.replace(/_/g, ' ')}</option>`).join('')}
                  </select>
                </div>
                <div class="ate-field">
                  <label class="ate-label" for="tool-timeout">Timeout (ms)</label>
                  <input type="number" class="ate-input" id="tool-timeout" value="${tool.timeout_ms || 30000}" min="0" step="1000" ${cfgLocked ? 'readonly' : ''} />
                </div>
                <div class="ate-field">
                  <label class="ate-label" for="tool-retries">Max retries</label>
                  <input type="number" class="ate-input" id="tool-retries" value="${(tool.retry_policy && tool.retry_policy.max_retries) || 0}" min="0" max="10" ${cfgLocked ? 'readonly' : ''} />
                </div>
              </div>
            </section>
          </div>

          <section class="ate-card">
            <div class="ate-card-head ate-card-head-row">
              <div>
                <h2 class="ate-card-title">Parameters</h2>
                <p class="ate-card-hint">Arguments exposed when an agent invokes this tool.</p>
              </div>
              <button type="button" class="ate-btn ate-btn-outline ate-btn-sm" onclick="addToolParam()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add parameter
              </button>
            </div>
            <div id="tool-params-list" class="ate-params-list">
              ${paramRows || '<div class="ate-empty">No parameters yet — add one when your API needs inputs.</div>'}
            </div>
          </section>

          <details class="ate-details" ${advOpen ? 'open' : ''}>
            <summary class="ate-details-summary">
              <span class="ate-details-chevron"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></span>
              <span>Headers &amp; JSON schemas</span>
              <span class="ate-details-meta">Optional · for power users</span>
            </summary>
            <div class="ate-details-body">
              <div class="ate-field">
                <div class="ate-json-head">
                  <label class="ate-label" for="tool-headers">HTTP headers (JSON)</label>
                  <button type="button" class="ate-link-btn" onclick="formatToolJsonField('tool-headers')">Format JSON</button>
                </div>
                <textarea class="ate-textarea ate-mono" id="tool-headers" rows="4" spellcheck="false" placeholder="{}">${esc(headersJson)}</textarea>
              </div>
              <div class="ate-schema-grid">
                <div class="ate-field">
                  <div class="ate-json-head">
                    <label class="ate-label" for="tool-input-schema">Input schema</label>
                    <button type="button" class="ate-link-btn" onclick="formatToolJsonField('tool-input-schema')">Format</button>
                  </div>
                  <textarea class="ate-textarea ate-mono" id="tool-input-schema" rows="8" spellcheck="false" placeholder="{}">${esc(inputJson)}</textarea>
                </div>
                <div class="ate-field">
                  <div class="ate-json-head">
                    <label class="ate-label" for="tool-output-schema">Output schema</label>
                    <button type="button" class="ate-link-btn" onclick="formatToolJsonField('tool-output-schema')">Format</button>
                  </div>
                  <textarea class="ate-textarea ate-mono" id="tool-output-schema" rows="8" spellcheck="false" placeholder="{}">${esc(outputJson)}</textarea>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </form>
  `;

  const iconSel = document.getElementById('tool-icon');
  const prev = document.getElementById('ate-icon-preview');
  if (iconSel && prev) {
    iconSel.addEventListener('change', () => { prev.innerHTML = toolIcon(iconSel.value); });
  }
  const nameInp = document.getElementById('tool-name');
  const titleEl = document.querySelector('.ate-title');
  if (nameInp && titleEl) {
    nameInp.addEventListener('input', () => {
      const v = nameInp.value.trim();
      titleEl.textContent = v || 'New tool';
    });
  }
};

window.addToolParam = function () {
  const list = document.getElementById('tool-params-list');
  if (!list) return;
  const emptyMsg = list.querySelector('.ate-empty');
  if (emptyMsg) emptyMsg.remove();
  const idx = list.querySelectorAll('.ate-param').length;
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="ate-param" data-idx="${idx}">
      <div class="ate-param-head">
        <div class="ate-param-grid">
          <div class="ate-field">
            <label class="ate-label">Name</label>
            <input type="text" class="ate-input tp-name" value="" placeholder="e.g. contact_id" />
          </div>
          <div class="ate-field">
            <label class="ate-label">Type</label>
            <select class="ate-select tp-type">
              ${TOOL_PARAM_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>
          </div>
          <label class="ate-req"><input type="checkbox" class="tp-required" /><span>Required</span></label>
        </div>
        <button type="button" class="ate-icon-btn ate-param-del" title="Remove" onclick="removeToolParam(this)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      </div>
      <div class="ate-field ate-field-inline2">
        <div><label class="ate-label">Default</label><input type="text" class="ate-input tp-default" value="" placeholder="Optional default" /></div>
        <div class="ate-field-grow"><label class="ate-label">Description</label><input type="text" class="ate-input tp-desc" value="" placeholder="What this parameter is for" /></div>
      </div>
    </div>
  `;
  list.appendChild(div.firstElementChild);
};

window.removeToolParam = function (btn) {
  const row = btn.closest('.ate-param');
  if (row) row.remove();
  const list = document.getElementById('tool-params-list');
  if (list && list.querySelectorAll('.ate-param').length === 0) {
    list.innerHTML = '<div class="ate-empty">No parameters yet — add one when your API needs inputs.</div>';
  }
};

window.formatToolJsonField = function (fieldId) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  try {
    const parsed = JSON.parse(el.value || '{}');
    el.value = JSON.stringify(parsed, null, 2);
    if (typeof showToast === 'function') showToast('JSON formatted', 'success');
  } catch (err) {
    if (typeof showToast === 'function') showToast('Invalid JSON: ' + err.message, 'warning');
  }
};

function safeParseJSON(str, fallback) {
  try { return JSON.parse(str); } catch (_) { return fallback; }
}

window.handleToolSave = async function (e, id) {
  e.preventDefault();

  const toolName = document.getElementById('tool-name').value;
  if (!toolName || !toolName.trim()) {
    if (typeof showToast === 'function') showToast('Please enter a tool name before saving', 'warning');
    return;
  }

  const paramRows = document.querySelectorAll('#tool-params-list .ate-param');
  const parameters = Array.from(paramRows).map(row => ({
    name: row.querySelector('.tp-name')?.value || '',
    type: row.querySelector('.tp-type')?.value || 'string',
    required: !!row.querySelector('.tp-required')?.checked,
    default_value: row.querySelector('.tp-default')?.value || '',
    description: row.querySelector('.tp-desc')?.value || ''
  })).filter(p => p.name);

  const body = {
    name: toolName,
    description: document.getElementById('tool-description').value,
    type: document.getElementById('tool-type').value,
    category: document.getElementById('tool-category').value,
    status: document.getElementById('tool-status').value,
    icon: document.getElementById('tool-icon').value,
    endpoint: document.getElementById('tool-endpoint').value,
    method: document.getElementById('tool-method').value,
    auth_type: document.getElementById('tool-auth-type').value,
    timeout_ms: parseInt(document.getElementById('tool-timeout').value, 10) || 30000,
    retry_policy: {
      max_retries: parseInt(document.getElementById('tool-retries').value, 10) || 0,
      backoff_ms: 1000
    },
    headers: safeParseJSON(document.getElementById('tool-headers').value, {}),
    parameters,
    input_schema: safeParseJSON(document.getElementById('tool-input-schema').value, {}),
    output_schema: safeParseJSON(document.getElementById('tool-output-schema').value, {})
  };

  const isNew = !id || id === 'null' || id === 'undefined';
  const url = isNew ? '/api/agent-tools' : `/api/agent-tools/${id}`;
  const method = isNew ? 'POST' : 'PUT';

  try {
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      throw new Error(d.error || 'Save failed');
    }
    if (typeof showToast === 'function') showToast(isNew ? 'Tool created' : 'Tool saved', 'success');
    navigateTo('agent-tools', 'list');
  } catch (err) {
    if (typeof showToast === 'function') showToast('Error saving tool: ' + err.message, 'error');
  }
};

/* HTML escaping helper */
function esc(str) {
  if (typeof str !== 'string') return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ═══════════════════════════════════════════════════════════════
   AGENT OPERATIONS — Execution History, Approvals, Analytics,
   Contact Journey, Knowledge Base, Audit Trail, Feedback
   ═══════════════════════════════════════════════════════════════ */

let _opsTab = 'history';
let _opsData = {};
/** Feedback tab: selected agent (survives detail refresh after submit). */
let _opsFeedbackSelectedAgentId = null;
let _opsFeedbackSelectedName = '';

const OPS_TABS = [
  { id: 'history', label: 'Executions', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
  { id: 'approvals', label: 'Approvals', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
  { id: 'analytics', label: 'Analytics', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
  { id: 'journey', label: 'Journey', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' },
  { id: 'kb', label: 'Knowledge Base', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' },
  { id: 'audit', label: 'Audit Trail', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
  { id: 'feedback', label: 'Feedback', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' }
];

window.loadAgentOps = async function () {
  const content = document.getElementById('content');
  content.innerHTML = `<div class="ops-shell">
    <div class="ops-tabs">${OPS_TABS.map(t =>
      `<button type="button" class="ops-tab ${_opsTab === t.id ? 'ops-tab-active' : ''}" data-ops-tab="${t.id}" onclick="_switchOpsTab('${t.id}')">${t.icon} ${t.label}</button>`
    ).join('')}</div>
    <div class="ops-body" id="ops-body"><div class="ops-loading">Loading...</div></div>
  </div>`;
  await _loadOpsTab();
};

window._switchOpsTab = async function (tab) {
  _opsTab = tab;
  document.querySelectorAll('.ops-tab').forEach(el => {
    el.classList.toggle('ops-tab-active', el.getAttribute('data-ops-tab') === tab);
  });
  await _loadOpsTab();
};

async function _loadOpsTab() {
  const body = document.getElementById('ops-body');
  if (!body) return;
  body.innerHTML = '<div class="ops-loading"><div class="trg-spinner"></div> Loading...</div>';
  try {
    if (_opsTab === 'history') await _renderOpsHistory(body);
    else if (_opsTab === 'approvals') await _renderOpsApprovals(body);
    else if (_opsTab === 'analytics') await _renderOpsAnalytics(body);
    else if (_opsTab === 'journey') await _renderOpsJourney(body);
    else if (_opsTab === 'kb') await _renderOpsKB(body);
    else if (_opsTab === 'audit') await _renderOpsAudit(body);
    else if (_opsTab === 'feedback') await _renderOpsFeedback(body);
  } catch (e) { body.innerHTML = `<div class="ops-error">Error: ${esc(e.message)}</div>`; }
}

/* ── Execution History ── */
async function _renderOpsHistory(body) {
  const execs = await (await fetch('/api/agents/ops/audit')).json();
  if (!execs.length) { body.innerHTML = '<div class="ops-empty">No executions yet. Trigger or test an agent to see history here.</div>'; return; }
  body.innerHTML = `
    <div class="ops-header-row">
      <h3 class="ops-section-title">Execution History</h3>
      <span class="ops-count">${execs.length} executions</span>
    </div>
    <table class="ops-table">
      <thead><tr><th>Agent</th><th>Type</th><th>Contact</th><th>Steps</th><th>Guardrails</th><th>Date</th></tr></thead>
      <tbody>${execs.map(e => {
        const typeColors = { trigger: '#E68619', test: '#7C3AED', simulate: '#2680EB' };
        return `<tr>
          <td><strong>${esc(e.agent_name || 'Unknown')}</strong></td>
          <td><span class="ops-type-badge" style="background:${typeColors[e.type] || '#6B7280'}20;color:${typeColors[e.type] || '#6B7280'}">${esc(e.type)}</span></td>
          <td>${e.contact_id || '-'}</td>
          <td>${e.timeline_length || 0}</td>
          <td>${e.guardrails_passed ? '<span class="ops-pass">Passed</span>' : '<span class="ops-fail">Failed</span>'}</td>
          <td>${e.created_at ? new Date(e.created_at).toLocaleString() : '-'}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
}

/* ── Approval Queue ── */
async function _renderOpsApprovals(body) {
  const pending = await (await fetch('/api/agents/ops/approvals')).json();
  body.innerHTML = `
    <div class="ops-header-row">
      <h3 class="ops-section-title">Approval Queue</h3>
      <span class="ops-count">${pending.length} pending</span>
    </div>
    ${pending.length === 0 ? '<div class="ops-empty">No pending approvals</div>' :
      pending.map(a => `
        <div class="ops-approval-card">
          <div class="ops-approval-header">
            <strong>${esc(a.agent_name)}</strong>
            <span class="ops-type-badge" style="background:rgba(230,134,25,0.15);color:#E68619">${esc(a.trigger_type || 'manual')}</span>
            <span class="ops-date">${a.created_at ? new Date(a.created_at).toLocaleString() : ''}</span>
          </div>
          <div class="ops-approval-preview">${esc((a.content_preview || '').slice(0, 200))}</div>
          <div class="ops-approval-meta">Requested by: ${esc(a.requested_by || 'System')} ${a.contact_id ? `· Contact #${a.contact_id}` : ''}</div>
          <div class="ops-approval-actions">
            <button class="ops-btn ops-btn-approve" onclick="_handleApproval(${a.id},'approve')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Approve
            </button>
            <button class="ops-btn ops-btn-reject" onclick="_handleApproval(${a.id},'reject')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Reject
            </button>
          </div>
        </div>
      `).join('')}`;
}

window._handleApproval = async function (id, action) {
  try {
    await fetch(`/api/agents/ops/approvals/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reviewer: 'Current User', notes: '' })
    });
    if (typeof showToast === 'function') showToast(`Approval ${action}d`, 'success');
    await _loadOpsTab();
  } catch (e) { if (typeof showToast === 'function') showToast(e.message, 'error'); }
};

/* ── Analytics Dashboard ── */
async function _renderOpsAnalytics(body) {
  const res = await fetch('/api/agents/ops/analytics');
  let d = {};
  try {
    d = await res.json();
  } catch (_) {
    d = {};
  }
  if (!res.ok) {
    body.innerHTML = `<div class="ops-error">${esc(d.error || 'Failed to load analytics')}</div>`;
    return;
  }

  const total = Number(d.total_executions) || 0;
  const passRate = Math.round(Number(d.guardrails_pass_rate) || 0);
  const avgSteps = Math.round(Number(d.avg_timeline_length) || 0);
  const channels = d.channel_distribution && typeof d.channel_distribution === 'object' ? d.channel_distribution : {};
  const chCount = Object.keys(channels).length;
  const byType = d.executions_by_type && typeof d.executions_by_type === 'object' ? d.executions_by_type : {};
  const overTime = Array.isArray(d.executions_over_time) ? d.executions_over_time : [];
  const counts = overTime.map(e => Number(e.count) || 0);
  const maxExec = counts.length ? Math.max(...counts, 1) : 1;
  const topAgents = Array.isArray(d.top_agents) ? d.top_agents : [];
  const maxAgentCount = topAgents.length ? Math.max(...topAgents.map(a => Number(a.count) || 0), 1) : 1;
  const channelTotal = Object.values(channels).reduce((s, x) => s + (Number(x) || 0), 0);

  const typeColors = { trigger: '#E68619', test: '#7C3AED', simulate: '#2680EB' };
  const chColors = { email: '#2680EB', sms: '#059669', push: '#E68619' };

  const typeBars = Object.entries(byType);
  const channelBars = Object.entries(channels);

  const typeChart = typeBars.length === 0
    ? '<p class="ops-chart-empty">No executions yet — run an agent to see breakdown by type.</p>'
    : `<div class="ops-bar-chart">${typeBars.map(([k, v]) => {
      const n = Number(v) || 0;
      const pct = total > 0 ? ((n / total) * 100).toFixed(0) : 0;
      return `<div class="ops-bar-row"><span class="ops-bar-label" title="${esc(k)}">${esc(k)}</span><div class="ops-bar-track"><div class="ops-bar-fill" style="width:${pct}%;background:${typeColors[k] || '#6B7280'}"></div></div><span class="ops-bar-val">${n}</span></div>`;
    }).join('')}</div>`;

  const channelChart = channelBars.length === 0
    ? '<p class="ops-chart-empty">No channel usage recorded yet.</p>'
    : `<div class="ops-bar-chart">${channelBars.map(([k, v]) => {
      const n = Number(v) || 0;
      const pct = channelTotal > 0 ? ((n / channelTotal) * 100).toFixed(0) : 0;
      return `<div class="ops-bar-row"><span class="ops-bar-label" title="${esc(k)}">${esc(k)}</span><div class="ops-bar-track"><div class="ops-bar-fill" style="width:${pct}%;background:${chColors[k] || '#6B7280'}"></div></div><span class="ops-bar-val">${n}</span></div>`;
    }).join('')}</div>`;

  const sparkBars = overTime.length === 0
    ? '<p class="ops-chart-empty">No executions in the last 30 days.</p>'
    : `<div class="ops-sparkline" role="img" aria-label="Executions per day">${overTime.map(e => {
      const c = Number(e.count) || 0;
      const h = Math.max((c / maxExec) * 100, 6);
      return `<div class="ops-spark-bar" style="height:${h}%" title="${esc(e.date)}: ${c}"><span class="ops-spark-tip">${c}</span></div>`;
    }).join('')}</div>`;

  const topChart = topAgents.length === 0
    ? '<p class="ops-chart-empty">No agent runs recorded yet.</p>'
    : `<div class="ops-bar-chart">${topAgents.map(a => {
      const n = Number(a.count) || 0;
      const pct = maxAgentCount > 0 ? ((n / maxAgentCount) * 100).toFixed(0) : 0;
      return `<div class="ops-bar-row"><span class="ops-bar-label" title="${esc(a.name)}">${esc(a.name)}</span><div class="ops-bar-track"><div class="ops-bar-fill" style="width:${pct}%;background:#2680EB"></div></div><span class="ops-bar-val">${n}</span></div>`;
    }).join('')}</div>`;

  body.innerHTML = `
    <div class="ops-analytics">
      <div class="ops-header-row">
        <h3 class="ops-section-title">Agent Analytics</h3>
        <span class="ops-count">${total} execution${total !== 1 ? 's' : ''}</span>
      </div>
      <div class="ops-kpi-grid">
        <div class="ops-kpi-card">
          <div class="ops-kpi-value">${total}</div>
          <div class="ops-kpi-label">Total Executions</div>
        </div>
        <div class="ops-kpi-card">
          <div class="ops-kpi-value">${passRate}%</div>
          <div class="ops-kpi-label">Guardrails Pass Rate</div>
        </div>
        <div class="ops-kpi-card">
          <div class="ops-kpi-value">${avgSteps}</div>
          <div class="ops-kpi-label">Avg Steps / Execution</div>
        </div>
        <div class="ops-kpi-card">
          <div class="ops-kpi-value">${chCount}</div>
          <div class="ops-kpi-label">Channels Used</div>
        </div>
      </div>

      <div class="ops-charts-row">
        <div class="ops-chart-card">
          <h4 class="ops-chart-title">Executions by Type</h4>
          ${typeChart}
        </div>
        <div class="ops-chart-card">
          <h4 class="ops-chart-title">Channel Distribution</h4>
          ${channelChart}
        </div>
      </div>

      <div class="ops-chart-card ops-chart-card--spark">
        <h4 class="ops-chart-title">Executions Over Time (Last 30 Days)</h4>
        ${sparkBars}
      </div>

      <div class="ops-chart-card ops-chart-card--footer">
        <h4 class="ops-chart-title">Top Agents</h4>
        ${topChart}
      </div>
    </div>
  `;
}

/* ── Contact Journey ── */
async function _renderOpsJourney(body) {
  body.innerHTML = `
    <h3 class="ops-section-title">Contact Journey Viewer</h3>
    <div class="ops-journey-search">
      <input type="number" id="ops-journey-cid" class="ops-input" placeholder="Enter Contact ID" min="1" />
      <button class="ops-btn ops-btn-primary" onclick="_loadJourney()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> View Journey
      </button>
    </div>
    <div id="ops-journey-result"></div>
  `;
}

window._loadJourney = async function () {
  const cid = document.getElementById('ops-journey-cid')?.value;
  const result = document.getElementById('ops-journey-result');
  if (!cid) { result.innerHTML = '<div class="ops-empty">Enter a contact ID</div>'; return; }
  result.innerHTML = '<div class="ops-loading"><div class="trg-spinner"></div> Loading journey...</div>';
  try {
    const data = await (await fetch(`/api/agents/ops/journey/${cid}`)).json();
    const contact = await (await fetch(`/api/contacts/${cid}`)).json();
    if (!data.timeline?.length) { result.innerHTML = '<div class="ops-empty">No interactions found for this contact</div>'; return; }
    result.innerHTML = `
      <div class="ops-journey-contact">
        <strong>${esc((contact.first_name || '') + ' ' + (contact.last_name || ''))}</strong>
        <span>${esc(contact.email || '')}</span>
        <span class="ops-type-badge" style="background:rgba(5,150,105,0.15);color:#059669">${esc(contact.loyalty_tier || 'standard')}</span>
      </div>
      <div class="ops-timeline">${data.timeline.map(e => {
        const icons = {
          agent_execution: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2"><path d="M12 2a4 4 0 014 4v1h1a3 3 0 013 3v4a3 3 0 01-3 3h-1v1a4 4 0 01-8 0v-1H7a3 3 0 01-3-3v-4a3 3 0 013-3h1V6a4 4 0 014-4z"/></svg>',
          delivery: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2680EB" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
          contact_event: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E68619" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>'
        };
        return `<div class="ops-timeline-item">
          <div class="ops-timeline-dot">${icons[e.type] || icons.contact_event}</div>
          <div class="ops-timeline-content">
            <div class="ops-timeline-header">
              <span class="ops-timeline-type">${esc(e.type === 'agent_execution' ? (e.agent_name || 'Agent') : e.type === 'delivery' ? 'Delivery' : (e.event_type || 'Event'))}</span>
              <span class="ops-date">${e.date ? new Date(e.date).toLocaleString() : ''}</span>
            </div>
            <div class="ops-timeline-detail">${esc(
              e.type === 'agent_execution' ? `${e.execution_type} · ${e.timeline_length || 0} steps · Guardrails ${e.guardrails_passed ? 'passed' : 'failed'}` :
              e.type === 'delivery' ? `${e.channel || 'email'} · ${e.status || 'sent'}${e.subject ? ' · ' + e.subject : ''}` :
              e.description || e.event_type || ''
            )}</div>
          </div>
        </div>`;
      }).join('')}</div>
    `;
  } catch (e) { result.innerHTML = `<div class="ops-error">${esc(e.message)}</div>`; }
};

/* ── Knowledge Base ── */
const KB_CATS = {
  product_catalog: { label: 'Product Catalog', color: '#2680EB', icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>' },
  brand_guidelines: { label: 'Brand Guidelines', color: '#7C3AED', icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' },
  faq: { label: 'FAQ', color: '#059669', icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
  compliance: { label: 'Compliance', color: '#DC2626', icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
  templates: { label: 'Templates', color: '#E68619', icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>' },
  general: { label: 'General', color: '#6B7280', icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' }
};

async function _renderOpsKB(body) {
  const entries = await (await fetch('/api/agents/ops/knowledge-base')).json();
  body.innerHTML = `
    <div class="ops-header-row">
      <h3 class="ops-section-title">Knowledge Base</h3>
      <button class="ops-btn ops-btn-primary" onclick="_showKBForm()">+ New Entry</button>
    </div>
    <div id="ops-kb-form-area"></div>
    ${entries.length === 0 ? '<div class="ops-empty">No knowledge base entries yet</div>' :
      `<div class="ops-kb-grid">${entries.map(e => {
        const cat = KB_CATS[e.category] || KB_CATS.general;
        const tags = Array.isArray(e.tags) ? e.tags : [];
        return `<div class="ops-kb-card">
          <div class="ops-kb-card-header">
            <span class="ops-kb-cat" style="color:${cat.color}">${cat.icon} ${cat.label}</span>
            <div class="ops-kb-actions">
              <button class="inv-icon-btn" onclick="_editKB(${e.id})" title="Edit"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
              <button class="inv-icon-btn inv-icon-btn-danger" onclick="_deleteKB(${e.id})" title="Delete"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
            </div>
          </div>
          <div class="ops-kb-title">${esc(e.title)}</div>
          <div class="ops-kb-content">${esc((e.content || '').slice(0, 150))}${(e.content || '').length > 150 ? '...' : ''}</div>
          ${tags.length ? `<div class="ops-kb-tags">${tags.map(t => `<span class="ops-kb-tag">${esc(t)}</span>`).join('')}</div>` : ''}
        </div>`;
      }).join('')}</div>`}`;
}

window._showKBForm = function (entry) {
  const area = document.getElementById('ops-kb-form-area');
  if (!area) return;
  const e = entry || {};
  area.innerHTML = `
    <div class="ops-kb-form">
      <input id="kb-title" class="ops-input" value="${esc(e.title || '')}" placeholder="Title" />
      <select id="kb-category" class="ops-input">
        ${Object.entries(KB_CATS).map(([k, v]) => `<option value="${k}"${e.category === k ? ' selected' : ''}>${v.label}</option>`).join('')}
      </select>
      <textarea id="kb-content" class="ops-input" rows="4" placeholder="Content...">${esc(e.content || '')}</textarea>
      <input id="kb-tags" class="ops-input" value="${esc((e.tags || []).join(', '))}" placeholder="Tags (comma separated)" />
      <div class="ops-kb-form-actions">
        <button class="ops-btn ops-btn-primary" onclick="_saveKB(${e.id || 'null'})">${e.id ? 'Update' : 'Create'}</button>
        <button class="ops-btn" onclick="document.getElementById('ops-kb-form-area').innerHTML=''">Cancel</button>
      </div>
    </div>`;
};

window._saveKB = async function (id) {
  const data = {
    title: document.getElementById('kb-title')?.value || '',
    category: document.getElementById('kb-category')?.value || 'general',
    content: document.getElementById('kb-content')?.value || '',
    tags: (document.getElementById('kb-tags')?.value || '').split(',').map(t => t.trim()).filter(Boolean)
  };
  const url = id ? `/api/agents/ops/knowledge-base/${id}` : '/api/agents/ops/knowledge-base';
  await fetch(url, { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (typeof showToast === 'function') showToast(id ? 'Updated' : 'Created', 'success');
  await _loadOpsTab();
};

window._editKB = async function (id) {
  const entries = await (await fetch('/api/agents/ops/knowledge-base')).json();
  const entry = entries.find(e => e.id === id);
  if (entry) _showKBForm(entry);
};

window._deleteKB = async function (id) {
  if (!confirm('Delete this knowledge base entry?')) return;
  await fetch(`/api/agents/ops/knowledge-base/${id}`, { method: 'DELETE' });
  if (typeof showToast === 'function') showToast('Deleted', 'success');
  await _loadOpsTab();
};

/* ── Audit Trail ── */
async function _renderOpsAudit(body) {
  const agents = await (await fetch('/api/agents')).json();
  body.innerHTML = `
    <div class="ops-header-row">
      <h3 class="ops-section-title">Compliance Audit Trail</h3>
      <div class="ops-audit-filters">
        <select id="ops-audit-agent" class="ops-input ops-input-sm" onchange="_filterAudit()">
          <option value="">All agents</option>
          ${agents.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('')}
        </select>
        <select id="ops-audit-type" class="ops-input ops-input-sm" onchange="_filterAudit()">
          <option value="">All types</option>
          <option value="trigger">Trigger</option>
          <option value="test">Test</option>
          <option value="simulate">Simulate</option>
        </select>
      </div>
    </div>
    <div id="ops-audit-body"><div class="ops-loading"><div class="trg-spinner"></div></div></div>
  `;
  await _filterAudit();
};

window._filterAudit = async function () {
  const agentId = document.getElementById('ops-audit-agent')?.value || '';
  const type = document.getElementById('ops-audit-type')?.value || '';
  let url = '/api/agents/ops/audit?';
  if (agentId) url += `agent_id=${agentId}&`;
  if (type) url += `type=${type}&`;
  const data = await (await fetch(url)).json();
  const auditBody = document.getElementById('ops-audit-body');
  if (!auditBody) return;
  if (!data.length) { auditBody.innerHTML = '<div class="ops-empty">No audit records found</div>'; return; }
  auditBody.innerHTML = `
    <table class="ops-table">
      <thead><tr><th>Timestamp</th><th>Agent</th><th>Type</th><th>Contact</th><th>Steps</th><th>Guardrails</th><th>Status</th></tr></thead>
      <tbody>${data.map(e => `<tr>
        <td class="ops-date-cell">${e.created_at ? new Date(e.created_at).toLocaleString() : '-'}</td>
        <td><strong>${esc(e.agent_name || 'Unknown')}</strong></td>
        <td><span class="ops-type-badge" style="background:${e.type === 'trigger' ? 'rgba(230,134,25,0.15)' : e.type === 'test' ? 'rgba(124,58,237,0.15)' : 'rgba(38,128,235,0.15)'};color:${e.type === 'trigger' ? '#E68619' : e.type === 'test' ? '#7C3AED' : '#2680EB'}">${esc(e.type)}</span></td>
        <td>${e.contact_id || '-'}</td>
        <td>${e.timeline_length || 0}</td>
        <td>${e.guardrails_passed ? '<span class="ops-pass">Pass</span>' : '<span class="ops-fail">Fail</span>'}</td>
        <td><span class="ops-type-badge" style="background:rgba(5,150,105,0.15);color:#059669">${esc(e.agent_status || 'active')}</span></td>
      </tr>`).join('')}</tbody>
    </table>`;
};

/* ── Feedback ── */
async function _renderOpsFeedback(body) {
  const agents = await (await fetch('/api/agents')).json();
  const list = Array.isArray(agents) ? agents : [];
  body.innerHTML = `
    <div class="ops-header-row">
      <h3 class="ops-section-title">Agent Feedback</h3>
    </div>
    <div class="ops-feedback-agents">${list.length === 0 ? '<div class="ops-empty" style="margin-top:0">No agents yet. Create an agent to collect feedback.</div>' : list.map(a => `
      <div class="ops-feedback-agent-row" role="button" tabindex="0" data-agent-id="${a.id}"
        onclick='_loadAgentFeedback(${a.id},${JSON.stringify(a.name || 'Untitled')})'
        onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();_loadAgentFeedback(${a.id},${JSON.stringify(a.name || 'Untitled')});}">
        <span>${esc(a.name || 'Untitled')}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
      </div>
    `).join('')}</div>
    <div id="ops-feedback-detail"></div>
  `;
  if (list.length && _opsFeedbackSelectedAgentId != null) {
    const match = list.find(a => Number(a.id) === Number(_opsFeedbackSelectedAgentId));
    if (match) await _loadAgentFeedback(match.id, match.name);
  }
};

window._loadAgentFeedback = async function (agentId, name) {
  const detail = document.getElementById('ops-feedback-detail');
  if (!detail) return;
  _opsFeedbackSelectedAgentId = agentId;
  if (name !== undefined && name !== null && String(name).length) {
    _opsFeedbackSelectedName = String(name);
  }
  const displayName = _opsFeedbackSelectedName || ('Agent #' + agentId);
  document.querySelectorAll('.ops-feedback-agent-row').forEach(el => {
    el.classList.toggle('ops-feedback-agent-row--active', String(el.getAttribute('data-agent-id')) === String(agentId));
  });
  let feedback = [];
  try {
    const res = await fetch(`/api/agents/ops/feedback/${agentId}`);
    const raw = await res.json();
    feedback = Array.isArray(raw) ? raw : [];
  } catch (_) {
    feedback = [];
  }
  const positive = feedback.filter(f => f.feedback_type === 'positive').length;
  const negative = feedback.filter(f => f.feedback_type === 'negative').length;
  const neutral = feedback.filter(f => f.feedback_type === 'neutral').length;
  detail.innerHTML = `
    <div class="ops-feedback-summary">
      <h4>${esc(displayName)}</h4>
      <div class="ops-feedback-stats">
        <span class="ops-fb-stat ops-fb-pos">+${positive}</span>
        <span class="ops-fb-stat ops-fb-neg">-${negative}</span>
        <span class="ops-fb-stat ops-fb-neu">${neutral} neutral</span>
      </div>
    </div>
    <div class="ops-feedback-form">
      <select id="ops-fb-type" class="ops-input ops-input-sm">
        <option value="positive">Positive</option>
        <option value="negative">Negative</option>
        <option value="neutral">Neutral</option>
      </select>
      <input id="ops-fb-notes" class="ops-input" placeholder="Notes..." />
      <button class="ops-btn ops-btn-primary" onclick="_submitFeedback(${agentId})">Submit</button>
    </div>
    ${feedback.length ? `<div class="ops-feedback-list">${feedback.map(f => `
      <div class="ops-feedback-item">
        <span class="ops-fb-stat ${f.feedback_type === 'positive' ? 'ops-fb-pos' : f.feedback_type === 'negative' ? 'ops-fb-neg' : 'ops-fb-neu'}">${f.feedback_type === 'positive' ? '+' : f.feedback_type === 'negative' ? '-' : '~'}</span>
        <span>${esc(f.notes || 'No notes')}</span>
        <span class="ops-date">${f.created_at ? new Date(f.created_at).toLocaleString() : ''}</span>
      </div>
    `).join('')}</div>` : '<div class="ops-empty">No feedback yet</div>'}
  `;
};

window._submitFeedback = async function (agentId) {
  const type = document.getElementById('ops-fb-type')?.value || 'neutral';
  const notes = document.getElementById('ops-fb-notes')?.value || '';
  await fetch('/api/agents/ops/feedback', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_id: agentId, feedback_type: type, notes })
  });
  if (typeof showToast === 'function') showToast('Feedback submitted', 'success');
  _loadAgentFeedback(agentId);
};

/* ═══════════════════════════════════════════════════════════════
   COMPOSER ADDITIONS — Versioning, Clone, KB, Recommendations, Chaining
   ═══════════════════════════════════════════════════════════════ */

/* ── Agent Versioning ── */
window._saveVersion = async function () {
  const s = _composerState;
  if (!s.id) { if (typeof showToast === 'function') showToast('Save the agent first', 'warning'); return; }
  const note = prompt('Version note (optional):') || '';
  try {
    const r = await fetch(`/api/agents/${s.id}/versions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version_note: note })
    });
    const data = await r.json();
    if (typeof showToast === 'function') showToast(`Version ${data.version_number || ''} saved`, 'success');
  } catch (e) { if (typeof showToast === 'function') showToast(e.message, 'error'); }
};

window._showVersionHistory = async function () {
  const s = _composerState;
  if (!s.id) return;
  const versions = await (await fetch(`/api/agents/${s.id}/versions`)).json();
  let el = document.getElementById('version-modal-overlay');
  if (!el) { el = document.createElement('div'); el.id = 'version-modal-overlay'; el.className = 'trg-modal-overlay'; document.body.appendChild(el); }
  el.onclick = () => el.remove();
  el.innerHTML = `
    <div class="trg-modal" style="width:480px" onclick="event.stopPropagation()">
      <div class="trg-modal-header">
        <div class="trg-modal-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2680EB" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Version History</div>
        <button class="trg-close" onclick="document.getElementById('version-modal-overlay').remove()">&times;</button>
      </div>
      <div class="trg-modal-body" style="max-height:60vh;overflow-y:auto">
        ${versions.length === 0 ? '<div class="ops-empty">No versions saved yet</div>' :
          versions.map(v => `
            <div class="ops-version-row">
              <div class="ops-version-info">
                <strong>v${v.version_number}</strong>
                <span class="ops-date">${v.created_at ? new Date(v.created_at).toLocaleString() : ''}</span>
                ${v.version_note ? `<div class="ops-version-note">${esc(v.version_note)}</div>` : ''}
              </div>
              <button class="ops-btn ops-btn-sm" onclick="_restoreVersion(${v.id})">Restore</button>
            </div>
          `).join('')}
      </div>
    </div>`;
};

window._restoreVersion = async function (versionId) {
  if (!confirm('Restore this version? Current changes will be lost.')) return;
  const s = _composerState;
  try {
    await fetch(`/api/agents/${s.id}/versions/${versionId}/restore`, { method: 'POST' });
    document.getElementById('version-modal-overlay')?.remove();
    if (typeof showToast === 'function') showToast('Version restored', 'success');
    navigateTo('agents', 'edit', s.id);
  } catch (e) { if (typeof showToast === 'function') showToast(e.message, 'error'); }
};

/* ── Agent Clone ── */
window._cloneAgent = async function (agentId) {
  const id = agentId || _composerState?.id;
  if (!id) return;
  try {
    const r = await fetch(`/api/agents/${id}/clone`, { method: 'POST' });
    const data = await r.json();
    if (typeof showToast === 'function') showToast(`Cloned as "${data.name}"`, 'success');
    navigateTo('agents', 'edit', data.id);
  } catch (e) { if (typeof showToast === 'function') showToast(e.message, 'error'); }
};

/* ── Recommendations ── */
window._showRecommendations = async function () {
  const s = _composerState;
  if (!s.id) return;
  let el = document.getElementById('recs-modal-overlay');
  if (!el) { el = document.createElement('div'); el.id = 'recs-modal-overlay'; el.className = 'trg-modal-overlay'; document.body.appendChild(el); }
  el.onclick = () => el.remove();
  el.innerHTML = `<div class="trg-modal" style="width:500px" onclick="event.stopPropagation()">
    <div class="trg-modal-header"><div class="trg-modal-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E68619" stroke-width="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg> AI Recommendations</div>
    <button class="trg-close" onclick="document.getElementById('recs-modal-overlay').remove()">&times;</button></div>
    <div class="trg-modal-body"><div class="ops-loading"><div class="trg-spinner"></div> Analyzing agent...</div></div></div>`;

  try {
    const recs = await (await fetch(`/api/agents/${s.id}/recommendations`)).json();
    el.querySelector('.trg-modal-body').innerHTML = recs.length === 0
      ? '<div class="ops-empty">No recommendations at this time</div>'
      : recs.map(r => `
        <div class="ops-rec-card ops-rec-${r.priority}">
          <div class="ops-rec-header">
            <span class="ops-rec-type">${esc(r.type)}</span>
            <span class="ops-rec-priority">${esc(r.priority)}</span>
          </div>
          <div class="ops-rec-title">${esc(r.title)}</div>
          <div class="ops-rec-desc">${esc(r.description)}</div>
          ${r.action ? `<div class="ops-rec-action">${esc(r.action)}</div>` : ''}
        </div>
      `).join('');
  } catch (e) { el.querySelector('.trg-modal-body').innerHTML = `<div class="ops-error">${esc(e.message)}</div>`; }
};
