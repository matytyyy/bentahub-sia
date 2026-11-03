// Ijan: shared frontend core. Each member's screen file calls Screens.register({...}).
// Uses GET / POST / PUT / PATCH / DELETE, shows a spinner while loading and an error box on failure.
const Screens = (() => {
  const screens = [];
  let current = null, editingRow = null, pending = 0;
  let token = sessionStorage.getItem('token');
  let me = JSON.parse(sessionStorage.getItem('me') || 'null');
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function setLoading(on) { pending += on ? 1 : -1; $('loader').classList.toggle('hidden', pending <= 0); }
  function showError(msg) { const b = $('errorBox'); b.textContent = msg || ''; b.classList.toggle('hidden', !msg); }
  function toast(msg, ok = true) {
    const t = $('toast');
    t.textContent = msg;
    t.className = 'fixed bottom-4 left-4 px-4 py-2 rounded shadow text-white ' + (ok ? 'bg-teal-700' : 'bg-red-700');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.add('hidden'), 3500);
  }
  function showLog(method, path, status, json) {
    $('logLine').textContent = `${method} ${path}  ->  ${status}`;
    $('logBody').textContent = JSON.stringify(json, null, 2);
  }

  async function api(method, path, body) {
    setLoading(true);
    let status = null;
    try {
      const res = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
      status = res.status;
      const json = await res.json().catch(() => ({ success: false, error: 'Server sent an unreadable response' }));
      showLog(method, path, status, json);
      if (!res.ok) throw new Error(`${status} - ${json.error || 'Request failed'}`);
      return json;
    } catch (e) {
      if (status === null) { showLog(method, path, 'NETWORK ERROR', { error: e.message }); throw new Error('Network error: is the server running?'); }
      throw e;
    } finally { setLoading(false); }
  }

  function renderTable(rows, actionsFor) {
    const t = $('table');
    if (!rows || !rows.length) { t.innerHTML = '<tbody><tr><td class="p-4 text-stone-500">No records yet. Use the form above to add one.</td></tr></tbody>'; return; }
    const cols = Object.keys(rows[0]);
    const head = cols.map((c) => `<th class="text-left px-3 py-2 bg-stone-100 font-semibold whitespace-nowrap">${esc(c)}</th>`).join('') + (actionsFor ? '<th class="bg-stone-100"></th>' : '');
    const body = rows.map((r, i) => '<tr class="border-t border-stone-100">' +
      cols.map((c) => `<td class="px-3 py-2 whitespace-nowrap">${r[c] === null || r[c] === undefined ? '<span class="text-stone-400">-</span>' : esc(r[c])}</td>`).join('') +
      (actionsFor ? `<td class="px-3 py-2 whitespace-nowrap space-x-2">${actionsFor(r, i)}</td>` : '') + '</tr>').join('');
    t.innerHTML = `<thead><tr>${head}</tr></thead><tbody>${body}</tbody>`;
  }

  const itemPath = (s, row) => `${s.itemBase || s.base}/${row[s.idKey || 'id']}`;

  function rowButtons(s, row, i) {
    const btn = (cls, label, act) => `<button data-act="${act}" data-i="${i}" class="${cls} underline">${esc(label)}</button>`;
    let out = '';
    (s.rowActions || []).forEach((a, k) => { if (!a.show || a.show(row)) out += btn('text-teal-800', a.label, 'row' + k); });
    if (s.editable !== false) out += btn('text-stone-700', 'Edit', 'edit');
    if (s.deletable !== false) out += btn('text-red-700', s.deleteLabel || 'Delete', 'del');
    return out;
  }

  let rowsCache = [];
  async function loadList(s, path, label, editable) {
    showError('');
    $('tableTitle').textContent = label;
    try {
      const json = await api('GET', path || s.base);
      rowsCache = Array.isArray(json.data) ? json.data : [json.data];
      renderTable(rowsCache, editable ? (r, i) => rowButtons(s, r, i) : null);
    } catch (e) { renderTable([]); showError(e.message); }
  }

  function buildForm(s, row) {
    editingRow = row || null;
    const f = $('form');
    if (s.readOnly) { f.classList.add('hidden'); return; }
    f.classList.remove('hidden');
    const fields = s.fields.filter((x) => (row ? !x.createOnly : !x.editOnly));
    f.innerHTML = fields.map((x) => {
      let val = row && row[x.name] !== undefined && row[x.name] !== null ? String(row[x.name]) : '';
      if (x.type === 'datetime-local') val = val.replace(' ', 'T').slice(0, 16);
      const common = `name="${x.name}" ${x.required && !row ? 'required' : ''} class="mt-1 w-full border border-stone-300 rounded px-2 py-1"`;
      let input;
      if (x.type === 'textarea') input = `<textarea ${common} rows="2">${esc(val)}</textarea>`;
      else if (x.type === 'select') input = `<select ${common}>${x.options.map((o) => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
      else input = `<input ${common} type="${x.type || 'text'}" ${x.type === 'number' ? 'step="any"' : ''} value="${esc(val)}">`;
      return `<label class="text-sm">${esc(x.label)}${input}</label>`;
    }).join('') + `<div class="sm:col-span-2 flex gap-2">
      <button class="bg-teal-700 hover:bg-teal-800 text-white font-semibold px-4 py-1.5 rounded">${row ? 'Save changes' : 'Create'}</button>
      ${row ? '<button type="button" id="cancelEdit" class="px-4 py-1.5 rounded border border-stone-300">Cancel edit</button>' : ''}</div>`;
    const c = $('cancelEdit'); if (c) c.onclick = () => buildForm(s, null);
  }

  async function submitForm(ev) {
    ev.preventDefault();
    const s = current, body = {};
    new FormData($('form')).forEach((v, k) => {
      if (v === '') return;
      const def = s.fields.find((x) => x.name === k);
      body[k] = def && def.type === 'number' ? Number(v) : v;
    });
    showError('');
    try {
      if (editingRow) await api('PUT', itemPath(s, editingRow), body);
      else await api('POST', s.createPath || s.base, body);
      toast(editingRow ? 'Changes saved' : 'Created');
      buildForm(s, null);
      await loadList(s, s.base, s.listLabel || 'All records', true);
    } catch (e) { showError(e.message); toast(e.message, false); }
  }

  async function onTableClick(ev) {
    const b = ev.target.closest('button[data-act]'); if (!b) return;
    const s = current, row = rowsCache[Number(b.dataset.i)], act = b.dataset.act;
    try {
      if (act === 'edit') { buildForm(s, row); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      if (act === 'del') {
        if (!confirm(`${s.deleteLabel || 'Delete'} this record?`)) return;
        await api('DELETE', itemPath(s, row)); toast('Done');
      } else {
        const a = s.rowActions[Number(act.slice(3))];
        await api(a.method, a.path(row), a.body ? a.body(row) : undefined); toast(a.label + ' - done');
      }
      await loadList(s, s.base, s.listLabel || 'All records', true);
    } catch (e) { showError(e.message); toast(e.message, false); }
  }

  function select(id) {
    current = screens.find((x) => x.id === id) || screens[0];
    if (!current) return;
    const s = current;
    document.querySelectorAll('#tabs button').forEach((t) => {
      const on = t.dataset.id === s.id;
      t.className = 'px-3 py-2 rounded-t ' + (on ? 'bg-stone-50 text-teal-900 font-semibold' : 'text-teal-100 hover:bg-teal-700');
    });
    $('screenTitle').textContent = `${s.title} (owner: ${s.owner})`;
    $('screenHint').textContent = s.hint || '';
    showError('');
    const tb = $('toolbar'); tb.innerHTML = '';
    const mk = (label, fn) => { const b = document.createElement('button'); b.textContent = label; b.className = 'border border-teal-700 text-teal-900 px-3 py-1 rounded hover:bg-teal-50 text-sm'; b.onclick = fn; tb.appendChild(b); };
    mk(s.listLabel || 'Load list', () => loadList(s, s.base, s.listLabel || 'All records', true));
    (s.reports || []).forEach((r) => mk(r.label, () => loadList(s, r.path, r.label, false)));
    (s.tools || []).forEach((t) => mk(t.label, async () => {
      try { await api(t.method, t.path, t.body); toast(t.label + ' - done'); await loadList(s, s.base, s.listLabel || 'All records', true); }
      catch (e) { showError(e.message); toast(e.message, false); }
    }));
    buildForm(s, null);
    renderTable([]); $('tableTitle').textContent = '';
    if (token) loadList(s, s.base, s.listLabel || 'All records', true);
    else showError('Please log in first (try ijan / password123).');
  }

  function updateAuthUi() {
    $('loginForm').classList.toggle('hidden', !!token);
    $('whoami').classList.toggle('hidden', !token);
    if (me) $('whoText').textContent = `${me.full_name} (${me.roles.join(', ')})`;
  }

  return {
    register(cfg) { screens.push(cfg); },
    api, toast,
    start() {
      const tabs = $('tabs');
      screens.forEach((s) => { const b = document.createElement('button'); b.dataset.id = s.id; b.textContent = s.title; b.onclick = () => select(s.id); tabs.appendChild(b); });
      $('form').addEventListener('submit', submitForm);
      $('table').addEventListener('click', onTableClick);
      $('loginForm').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        try {
          const json = await api('POST', '/api/auth/login', { username: $('loginUser').value, password: $('loginPass').value });
          token = json.token; me = json.data;
          sessionStorage.setItem('token', token); sessionStorage.setItem('me', JSON.stringify(me));
          updateAuthUi(); toast('Logged in'); select(current ? current.id : undefined);
        } catch (e) { showError(e.message); toast(e.message, false); }
      });
      $('logoutBtn').onclick = () => { token = null; me = null; sessionStorage.clear(); updateAuthUi(); select(current ? current.id : undefined); };
      updateAuthUi(); select(screens[0] && screens[0].id);
    }
  };
})();
