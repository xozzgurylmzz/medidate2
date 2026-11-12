/* MedipolDate – yönetim paneli */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const ICONS = {
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    ext: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  };
  const ic = (name, cls = 'sm') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  const BRAND = `<div class="brand"><span class="brand-mark"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 5 6.4 5c2 0 3.4 1.1 4.1 2.3L12 9.2l1.5-1.9C14.2 6.1 15.6 5 17.6 5c3.4 0 5.5 3.4 4 6.8C19.5 16.4 12 21 12 21z"/></svg></span><span class="brand-text">Medipol<em>Date</em></span></div>`;

  const GENDER = { kadin: 'Kadın', erkek: 'Erkek' };
  const INTENT = { ciddi: 'Ciddi ilişki', flort: 'Flört', arkadas: 'Arkadaşlık', bilmiyorum: 'Henüz bilmiyorum' };
  const LOOK = { kadin: 'Kadın', erkek: 'Erkek', herkes: 'Herkes' };

  const state = { tab: 'users', filter: 'all', q: '', page: 0, users: [], hasMore: false, reportStatus: 'open', stats: null };

  // ------------------------------------------------------------ yardımcılar
  async function api(path, opts = {}) {
    const res = await fetch('/api/admin' + path, {
      method: opts.method || (opts.body ? 'POST' : 'GET'),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && path !== '/login') { renderLogin(path === '/me' ? '' : 'Oturum süresi doldu, tekrar giriş yap.'); throw new Error('401'); }
    if (!res.ok) throw new Error(data.error || 'Bir şeyler ters gitti.');
    return data;
  }
  function toast(msg, kind = '') {
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML = `${kind === 'err' ? ic('alert') : kind === 'ok' ? ic('check') : ic('info')}<span>${esc(msg)}</span>`;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }
  const fail = (ex) => { if (ex.message !== '401') toast(ex.message, 'err'); };
  function openModal(html, { center = false } = {}) {
    const host = $('#modal');
    host.className = 'modal-host' + (center ? ' center' : '');
    host.innerHTML = `<div class="sheet" style="max-width:${center ? 420 : 640}px">${html}</div>`;
    host.hidden = false;
    host.onclick = (e) => { if (e.target === host) closeModal(); };
    return host.firstElementChild;
  }
  function closeModal() { const host = $('#modal'); host.hidden = true; host.innerHTML = ''; }
  function confirmSheet(title, text, okLabel) {
    return new Promise((resolve) => {
      const el = openModal(`
        <div class="sheet-title">${esc(title)}</div>
        <p class="muted" style="margin:0 0 16px">${esc(text)}</p>
        <div class="row"><button class="btn grow" data-x="no">Vazgeç</button><button class="btn grow btn-danger" data-x="yes">${esc(okLabel)}</button></div>`, { center: true });
      el.onclick = (e) => { const b = e.target.closest('[data-x]'); if (!b) return; closeModal(); resolve(b.dataset.x === 'yes'); };
    });
  }
  const fmtDate = (ts) => ts ? new Date(ts).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const avatar = (av, color, cls = '') => `<div class="avatar ${cls}" style="background:${esc(color)}"><img src="/avatars/${esc(av)}.svg" alt=""></div>`;
  const nameOf = (u) => u.first_name ? `${u.first_name}${u.last_name ? ' ' + u.last_name : ''}` : u.nickname;

  // ------------------------------------------------------------ giriş
  function renderLogin(msg = '') {
    closeModal();
    $('#root').innerHTML = `
      <div class="login-wrap">
        ${BRAND}
        <form class="card stack" id="lf">
          <h2 style="display:flex;align-items:center;gap:8px">${ic('shield', '')} Yönetim girişi</h2>
          <label class="field">Kullanıcı adı<input class="input" id="lu" autocomplete="username" required autocapitalize="none" spellcheck="false"></label>
          <label class="field">Şifre<input class="input" id="lp" type="password" autocomplete="current-password" required></label>
          <div class="error" id="le">${esc(msg)}</div>
          <button class="btn btn-primary btn-block" type="submit">Giriş yap</button>
        </form>
      </div>`;
    const f = $('#lf');
    f.onsubmit = async (e) => {
      e.preventDefault();
      const btn = $('button', f); btn.disabled = true; $('#le').textContent = '';
      try { await api('/login', { body: { username: $('#lu').value, password: $('#lp').value } }); renderShell(); }
      catch (ex) { $('#le').textContent = ex.message; }
      finally { btn.disabled = false; }
    };
    $('#lu').focus();
  }

  // ------------------------------------------------------------ ana iskelet
  function renderShell() {
    $('#root').innerHTML = `
      <header class="admin-top">
        <div class="row">${BRAND}<span class="admin-tag">Yönetim</span></div>
        <div class="right">
          <a class="btn btn-ghost btn-sm" href="/" target="_blank" rel="noopener">${ic('ext')} Siteye git</a>
          <button class="btn btn-sm" id="out">${ic('logout')} Çıkış</button>
        </div>
      </header>
      <section class="stats" id="stats"><div class="spinner"></div></section>
      <div class="seg neutral admin-tabs" id="tabs">
        <button data-t="users" class="${state.tab === 'users' ? 'on' : ''}">Kullanıcılar</button>
        <button data-t="reports" class="${state.tab === 'reports' ? 'on' : ''}">Şikayetler</button>
      </div>
      <section id="panel"></section>`;
    $('#out').onclick = async () => { try { await api('/logout', { body: {} }); } catch { /* yok */ } renderLogin(); };
    $('#tabs').onclick = (e) => {
      const b = e.target.closest('[data-t]'); if (!b) return;
      state.tab = b.dataset.t; $$('#tabs button').forEach((x) => x.classList.toggle('on', x === b)); renderTab();
    };
    loadStats(); renderTab();
  }

  async function loadStats() {
    try {
      const s = state.stats = await api('/stats');
      const tiles = [
        ['Toplam kullanıcı', s.users, `${s.profiles} profil tamamlandı`],
        ['Son 7 gün', s.newUsers7d, 'yeni kayıt'],
        ['Şu an çevrimiçi', s.online, ''],
        ['Cinsiyet', `${s.genders.kadin || 0} / ${s.genders.erkek || 0}`, 'kadın / erkek'],
        ['Aktif eşleşme', s.matches, ''],
        ['Mesaj (24 saat)', s.messages24h, ''],
        ['Açık şikayet', s.openReports, s.openReports ? 'incelenmeyi bekliyor' : 'her şey yolunda', s.openReports > 0],
        ['Banlı', s.banned, 'kullanıcı'],
      ];
      $('#stats').innerHTML = tiles.map(([k, v, sub, hot]) =>
        `<div class="stat ${hot ? 'hot' : ''}"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div>${sub ? `<div class="s">${esc(sub)}</div>` : ''}</div>`).join('');
      const rt = $('#tabs [data-t="reports"]');
      if (rt) rt.textContent = s.openReports ? `Şikayetler (${s.openReports})` : 'Şikayetler';
    } catch (ex) { fail(ex); }
  }

  function renderTab() { (state.tab === 'users' ? renderUsers : renderReports)(); }
  function refresh() { loadStats(); renderTab(); }

  // ------------------------------------------------------------ kullanıcılar
  function renderUsers() {
    $('#panel').innerHTML = `
      <div class="toolbar">
        <input class="input" id="uq" placeholder="Kullanıcı adı, takma ad, isim veya bölüm ara…" value="${esc(state.q)}">
        <div class="seg" id="uf">
          <button data-f="all" class="${state.filter === 'all' ? 'on' : ''}">Tümü</button>
          <button data-f="reported" class="${state.filter === 'reported' ? 'on' : ''}">Şikayetli</button>
          <button data-f="banned" class="${state.filter === 'banned' ? 'on' : ''}">Banlı</button>
        </div>
      </div>
      <div class="rows" id="ulist"><div class="spinner"></div></div>
      <div class="more-row" id="umore"></div>`;
    let t;
    $('#uq').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value.trim(); loadUsers(true); }, 300); };
    $('#uf').onclick = (e) => {
      const b = e.target.closest('[data-f]'); if (!b) return;
      state.filter = b.dataset.f; $$('#uf button').forEach((x) => x.classList.toggle('on', x === b)); loadUsers(true);
    };
    loadUsers(true);
  }

  async function loadUsers(reset) {
    if (reset) { state.page = 0; state.users = []; }
    try {
      const r = await api(`/users?q=${encodeURIComponent(state.q)}&filter=${state.filter}&page=${state.page}`);
      state.users.push(...r.users); state.hasMore = r.hasMore;
      drawUsers();
    } catch (ex) { fail(ex); }
  }

  function userRow(u) {
    const tags = [];
    if (u.banned) tags.push('<span class="tag danger">Banlı</span>');
    if (u.open_reports) tags.push(`<span class="tag warn">${u.open_reports} açık şikayet</span>`);
    if (u.online) tags.push('<span class="tag ok">Çevrimiçi</span>');
    if (!u.profile_done) tags.push('<span class="tag">Profil eksik</span>');
    const bits = [`@${u.username}`];
    if (u.gender) bits.push(GENDER[u.gender] || u.gender);
    if (u.age) bits.push(u.age);
    if (u.department) bits.push(u.department);
    bits.push(`kayıt ${fmtDate(u.created_at)}`);
    bits.push(`${u.match_count} eşleşme`);
    return `
      <div class="urow ${u.banned ? 'is-banned' : ''}" data-id="${u.id}">
        ${avatar(u.avatar, u.avatar_color)}
        <div style="min-width:0">
          <div class="title">${esc(nameOf(u))} ${u.first_name ? `<span class="muted small" style="font-weight:500">“${esc(u.nickname)}”</span>` : ''} ${tags.join('')}</div>
          <div class="sub">${esc(bits.join(' · '))}</div>
        </div>
        <div class="actions">
          <button class="btn btn-sm" data-act="view">${ic('eye')} Detay</button>
          ${u.banned
            ? `<button class="btn btn-sm" data-act="unban">${ic('undo')} Banı kaldır</button>`
            : `<button class="btn btn-sm btn-danger" data-act="ban">${ic('ban')} Banla</button>`}
          <button class="btn btn-sm btn-ghost" data-act="delete" title="Hesabı sil">${ic('trash')}</button>
        </div>
      </div>`;
  }

  function drawUsers() {
    const list = $('#ulist'); if (!list) return;
    list.innerHTML = state.users.length ? state.users.map(userRow).join('')
      : `<div class="empty"><p>Bu filtreyle eşleşen kullanıcı yok.</p></div>`;
    $('#umore').innerHTML = state.hasMore ? `<button class="btn" id="umore-btn">Daha fazla yükle</button>` : '';
    const mb = $('#umore-btn'); if (mb) mb.onclick = () => { state.page++; loadUsers(false); };
    list.onclick = (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const id = Number(b.closest('[data-id]').dataset.id);
      userAction(b.dataset.act, id);
    };
  }

  async function userAction(act, id) {
    const u = state.users.find((x) => x.id === id) || { id, nickname: '#' + id };
    try {
      if (act === 'view') return showUser(id);
      if (act === 'ban') {
        if (!await confirmSheet('Kullanıcıyı banla', `${nameOf(u)} hemen oturumdan atılır, eşleşmeleri kapanır ve bir daha giriş yapamaz. Açık şikayetleri çözüldü sayılır.`, 'Banla')) return;
        await api(`/users/${id}/ban`, { body: { banned: true } }); toast('Kullanıcı banlandı.', 'ok');
      }
      if (act === 'unban') { await api(`/users/${id}/ban`, { body: { banned: false } }); toast('Ban kaldırıldı.', 'ok'); }
      if (act === 'delete') {
        if (!await confirmSheet('Hesabı kalıcı olarak sil', `${nameOf(u)} hesabı, eşleşmeleri ve mesajları kalıcı olarak silinir. Geri alınamaz.`, 'Kalıcı olarak sil')) return;
        await api(`/users/${id}`, { method: 'DELETE' }); toast('Hesap silindi.', 'ok');
      }
      closeModal(); refresh();
    } catch (ex) { fail(ex); }
  }

  async function showUser(id) {
    try {
      const { user: u, reports, messagesSent, flaggedMessages, reportsMade } = await api(`/users/${id}`);
      const rows = [
        ['Kullanıcı adı', '@' + u.username], ['Takma ad', u.nickname],
        ['Ad soyad', [u.first_name, u.last_name].filter(Boolean).join(' ') || '—'],
        ['Cinsiyet', GENDER[u.gender] || '—'], ['Aradığı', LOOK[u.looking_for] || '—'],
        ['Yaş', u.age || '—'], ['Bölüm', u.department || '—'], ['Niyet', INTENT[u.intent] || '—'],
        ['Kayıt', fmtDate(u.created_at)], ['Son görülme', u.online ? 'Şu an çevrimiçi' : fmtDate(u.last_seen)],
        ['Profil doluluğu', `%${u.completeness ?? 0}`], ['Boy', u.height ? `${u.height} cm` : '—'],
        ['Aktif eşleşme', u.match_count], ['Gönderdiği mesaj', messagesSent],
        ['Uyarıya rağmen gönderilen', `${flaggedMessages ?? 0} mesaj`], ['Arkadaş modu', u.friend_mode ? 'Açık' : 'Kapalı'],
        ['Hakkında şikayet', u.report_count], ['Yaptığı şikayet', reportsMade],
      ];
      const el = openModal(`
        <div class="detail-head">${avatar(u.avatar, u.avatar_color, 'lg')}
          <div><div class="sheet-title" style="margin:0">${esc(nameOf(u))}</div>
          <div class="row" style="margin-top:6px;flex-wrap:wrap">${u.banned ? '<span class="tag danger">Banlı</span>' : '<span class="tag ok">Aktif</span>'}${u.open_reports ? `<span class="tag warn">${u.open_reports} açık şikayet</span>` : ''}</div></div>
        </div>
        <dl class="kv">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
        ${u.bio ? `<div class="section-title">Hakkında</div><div class="reason" style="margin:0 0 14px">${esc(u.bio)}</div>` : ''}
        ${u.interests.length ? `<div class="section-title">İlgi alanları</div><div class="pills" style="margin-bottom:14px">${u.interests.map((i) => `<span class="pill">${esc(i)}</span>`).join('')}</div>` : ''}
        ${u.prompts.map((p) => `<div class="qa" style="margin-bottom:8px"><div class="q">${esc(p.q)}</div><div class="a">${esc(p.a)}</div></div>`).join('')}
        <div class="section-title" style="margin-top:14px">Bu kullanıcı hakkındaki şikayetler</div>
        ${reports.length ? reports.map((r) => `
          <div class="urow" style="grid-template-columns:1fr;margin-bottom:8px">
            <div><div class="sub">${esc(r.reporter_nickname)} (@${esc(r.reporter_username)}) · ${fmtDate(r.created_at)} ${r.resolved ? '<span class="tag">Çözüldü</span>' : '<span class="tag warn">Açık</span>'}</div>
            <div class="reason ${r.reason ? '' : 'empty-reason'}">${esc(r.reason || 'Sebep yazılmamış')}</div></div>
          </div>`).join('') : '<div class="muted small" style="margin-bottom:14px">Şikayet yok.</div>'}
        <div class="row" style="margin-top:14px;flex-wrap:wrap">
          ${u.banned ? `<button class="btn grow" data-act="unban">${ic('undo')} Banı kaldır</button>` : `<button class="btn btn-danger grow" data-act="ban">${ic('ban')} Banla</button>`}
          <button class="btn grow" data-act="delete">${ic('trash')} Hesabı sil</button>
          <button class="btn btn-ghost grow" data-act="close">Kapat</button>
        </div>`);
      el.onclick = (e) => {
        const b = e.target.closest('[data-act]'); if (!b) return;
        if (b.dataset.act === 'close') return closeModal();
        if (!state.users.find((x) => x.id === u.id)) state.users.push(u);
        userAction(b.dataset.act, u.id);
      };
    } catch (ex) { fail(ex); }
  }

  // ------------------------------------------------------------ şikayetler
  function renderReports() {
    $('#panel').innerHTML = `
      <div class="toolbar">
        <div class="seg" id="rf">
          <button data-s="open" class="${state.reportStatus === 'open' ? 'on' : ''}">Açık</button>
          <button data-s="resolved" class="${state.reportStatus === 'resolved' ? 'on' : ''}">Çözülen</button>
          <button data-s="all" class="${state.reportStatus === 'all' ? 'on' : ''}">Tümü</button>
        </div>
      </div>
      <div class="rows" id="rlist"><div class="spinner"></div></div>`;
    $('#rf').onclick = (e) => {
      const b = e.target.closest('[data-s]'); if (!b) return;
      state.reportStatus = b.dataset.s; $$('#rf button').forEach((x) => x.classList.toggle('on', x === b)); loadReports();
    };
    loadReports();
  }

  async function loadReports() {
    try {
      const { reports } = await api(`/reports?status=${state.reportStatus}`);
      const list = $('#rlist'); if (!list) return;
      list.innerHTML = reports.length ? reports.map((r) => `
        <div class="urow" data-rid="${r.id}" data-uid="${r.target_id}">
          ${avatar(r.target_avatar, r.target_color)}
          <div style="min-width:0">
            <div class="title">${esc(r.target_first_name || r.target_nickname)} <span class="muted small" style="font-weight:500">@${esc(r.target_username)}</span>
              ${r.target_banned ? '<span class="tag danger">Banlı</span>' : ''} ${r.resolved ? '<span class="tag">Çözüldü</span>' : '<span class="tag warn">Açık</span>'}</div>
            <div class="sub">Şikayet eden: ${esc(r.reporter_nickname)} (@${esc(r.reporter_username)}) · ${fmtDate(r.created_at)}</div>
            <div class="reason ${r.reason ? '' : 'empty-reason'}">${esc(r.reason || 'Sebep yazılmamış')}</div>
          </div>
          <div class="actions">
            <button class="btn btn-sm" data-act="view">${ic('eye')} Kullanıcı</button>
            ${r.target_banned ? '' : `<button class="btn btn-sm btn-danger" data-act="ban">${ic('ban')} Banla</button>`}
            ${r.resolved
              ? `<button class="btn btn-sm" data-act="reopen">${ic('undo')} Yeniden aç</button>`
              : `<button class="btn btn-sm" data-act="resolve">${ic('check')} Çözüldü</button>`}
          </div>
        </div>`).join('')
        : `<div class="empty"><p>${state.reportStatus === 'open' ? 'Açık şikayet yok. Her şey yolunda.' : 'Bu filtrede şikayet yok.'}</p></div>`;
      list.onclick = async (e) => {
        const b = e.target.closest('[data-act]'); if (!b) return;
        const row = b.closest('[data-rid]'); const rid = row.dataset.rid; const uid = Number(row.dataset.uid);
        try {
          if (b.dataset.act === 'view') return showUser(uid);
          if (b.dataset.act === 'ban') return userAction('ban', uid);
          await api(`/reports/${rid}/resolve`, { body: { resolved: b.dataset.act === 'resolve' } });
          toast(b.dataset.act === 'resolve' ? 'Şikayet çözüldü olarak işaretlendi.' : 'Şikayet yeniden açıldı.', 'ok');
          refresh();
        } catch (ex) { fail(ex); }
      };
    } catch (ex) { fail(ex); }
  }

  // ------------------------------------------------------------ başlat
  (async () => {
    try { await api('/me'); renderShell(); }
    catch (ex) { if (ex.message !== '401') renderLogin(ex.message); }
  })();
})();
