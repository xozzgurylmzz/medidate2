/* MedipolDate – ön uç (bağımlılıksız, tek dosya) */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Lucide tarzı çizgi ikonlar (ISC) – inline SVG
  const ICONS = {
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    dice: '<rect width="18" height="18" x="3" y="3" rx="4"/><path d="M16 8h.01M8 8h.01M8 16h.01M16 16h.01M12 12h.01"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    eyeOff: '<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
    sparkles: '<path d="M9.94 14.34 8 20l-1.94-5.66L1 12l5.06-1.94L8 4l1.94 6.06L15 12Z"/><path d="M19 3v4M21 5h-4M19 17v4M21 19h-4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    heartOff: '<path d="M16.5 3A5.5 5.5 0 0 1 22 8.5c0 2.3-1.5 4.05-3 5.5"/><path d="M2 8.5a5.5 5.5 0 0 1 9.5-3.8L12 5l.5-.3"/><path d="m2 2 20 20"/><path d="M5.3 13.9 12 20.6l2.5-2.5"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    cap: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    ghost: '<path d="M9 10h.01M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 3 2.5-3 2.5 3 2.5-3 3 3V10a8 8 0 0 0-8-8z"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    refresh: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
  };
  const ic = (name, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  const state = {
    meta: null, user: null, view: null, authMode: 'login',
    candidates: [], discoverLoading: false, matches: [], chat: null, socket: null, typingTimer: null,
  };

  // ------------------------------------------------------------ API
  async function api(path, opts = {}) {
    const res = await fetch('/api' + path, {
      method: opts.method || (opts.body ? 'POST' : 'GET'),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 && state.user) { state.user = null; showView('auth'); }
      throw new Error(data.error || 'Bir şeyler ters gitti.');
    }
    return data;
  }

  // ------------------------------------------------------------ yardımcılar
  function toast(msg, kind = '') {
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML = `${kind === 'err' ? ic('alert', 'sm') : kind === 'ok' ? ic('check', 'sm') : ic('info', 'sm')}<span>${esc(msg)}</span>`;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }
  function openModal(html, { center = false } = {}) {
    const host = $('#modal');
    host.className = 'modal-host' + (center ? ' center' : '');
    host.innerHTML = `<div class="sheet">${html}</div>`;
    host.hidden = false;
    host.onclick = (e) => { if (e.target === host) closeModal(); };
    return host.firstElementChild;
  }
  function closeModal() { const host = $('#modal'); host.hidden = true; host.innerHTML = ''; }
  function confirmSheet(title, text, okLabel, danger = false) {
    return new Promise((resolve) => {
      const el = openModal(`
        <div class="sheet-title">${esc(title)}</div>
        <p class="muted" style="margin:0 0 16px">${esc(text)}</p>
        <div class="row">
          <button class="btn grow" data-x="no">Vazgeç</button>
          <button class="btn grow ${danger ? 'btn-danger' : 'btn-primary'}" data-x="yes">${esc(okLabel)}</button>
        </div>`, { center: true });
      el.onclick = (e) => { const b = e.target.closest('[data-x]'); if (!b) return; closeModal(); resolve(b.dataset.x === 'yes'); };
    });
  }
  const fmtTime = (ts) => {
    const d = new Date(ts); const today = new Date();
    if (d.toDateString() === today.toDateString()) return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
  };
  const displayName = (p) => p.first_name ? `${p.first_name}${p.last_name ? ' ' + p.last_name : ''}` : p.nickname;
  const intentLabel = (id) => (state.meta.intents.find((i) => i.id === id) || {}).label || '';
  const socialDef = (id) => state.meta.socials.find((s) => s.id === id) || { id, label: id };
  const avatarHTML = (p, cls = '') => `<div class="avatar ${cls}" style="background:${esc(p.avatar_color)}"><img src="/avatars/${esc(p.avatar)}.svg" alt="" draggable="false"></div>`;
  const siconHTML = (id, cls = 'brand') => `<span class="sicon ${cls}"><img src="/icons/${esc(id)}.svg" alt="${esc(socialDef(id).label)}"></span>`;
  function socialLink(platform, handle) {
    const h = encodeURIComponent(handle);
    const map = {
      instagram: `https://instagram.com/${h}`, x: `https://x.com/${h}`, snapchat: `https://snapchat.com/add/${h}`,
      tiktok: `https://tiktok.com/@${h}`, telegram: `https://t.me/${h}`,
    };
    return map[platform] || null;
  }

  // ------------------------------------------------------------ görünüm yönetimi
  function showView(name) {
    state.view = name;
    $$('.view').forEach((v) => v.classList.toggle('active', v.dataset.view === name));
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    const loggedIn = !!state.user;
    $('#topbar').hidden = !loggedIn || name === 'chat';
    $('#tabbar').hidden = !loggedIn || name === 'chat' || !state.user?.profile_done;
    $('#app').classList.toggle('has-tabbar', !$('#tabbar').hidden);
    window.scrollTo(0, 0);
    ({ auth: renderAuth, profile: renderProfile, discover: renderDiscover, matches: renderMatches, chat: renderChat })[name]?.();
  }
  $('#tabbar').addEventListener('click', (e) => { const t = e.target.closest('.tab'); if (t) showView(t.dataset.tab); });

  function updateUnreadBadge() {
    const n = state.matches.reduce((s, m) => s + (m.unread || 0), 0);
    const b = $('#unread-badge'); b.hidden = !n; b.textContent = n > 99 ? '99+' : n;
  }

  // ------------------------------------------------------------ giriş / kayıt
  function renderAuth() {
    const v = $('[data-view="auth"]');
    const m = state.authMode;
    const collage = ['a07', 'a12', 'a03', 'a21', 'a30'].map((a, i) =>
      `<div class="avatar" style="background:${state.meta.avatarColors[(i * 3) % state.meta.avatarColors.length]}"><img src="/avatars/${a}.svg" alt=""></div>`).join('');
    v.innerHTML = `
      <div class="auth-hero">
        <div class="collage">${collage}</div>
        <div class="eyebrow">${ic('cap')} Ankara Medipol'e özel</div>
        <h1>Medipol<em>Date</em></h1>
        <p>Fotoğrafsız, anonim ve sadece kampüs. Tanış, eşleş, sohbet et.</p>
      </div>
      <div class="auth-tabs">
        <button class="${m === 'login' ? 'on' : ''}" data-mode="login">Giriş yap</button>
        <button class="${m === 'register' ? 'on' : ''}" data-mode="register">Kayıt ol</button>
      </div>
      <form class="card stack" id="a-form" autocomplete="on">
        <label class="field">Kullanıcı adı
          <input class="input" id="a-user" placeholder="ornek_kullanici" required autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="24">
        </label>
        <label class="field">Şifre
          <input class="input" id="a-pass" type="password" minlength="8" placeholder="En az 8 karakter" required autocomplete="${m === 'login' ? 'current-password' : 'new-password'}">
        </label>
        ${m === 'register' ? `<label class="field">Şifre (tekrar)<input class="input" id="a-pass2" type="password" minlength="8" required autocomplete="new-password" placeholder="Aynı şifre"></label>
        <div class="small muted">Kullanıcı adın sadece giriş için; kimseye gösterilmez. E-posta gerekmez.</div>` : ''}
        <div class="error" id="a-err"></div>
        <button class="btn btn-primary btn-block" type="submit">${m === 'login' ? 'Giriş yap' : 'Hesap oluştur'}</button>
      </form>
      ${m === 'register' ? `
      <div class="features">
        <div class="feature"><span class="fi warm">${ic('eyeOff')}</span><div><b>Fotoğraf yok, tamamen anonim</b>Bir avatar ve takma adla görünürsün. İsim, yaş ve bölüm isteğe bağlı.</div></div>
        <div class="feature"><span class="fi">${ic('sparkles')}</span><div><b>Sana uygun kişiler</b>İlgi alanların, niyetin ve cevapların eşleşmeleri belirler.</div></div>
        <div class="feature"><span class="fi warm">${ic('lock')}</span><div><b>Sosyal medyan sende kalır</b>Eşleştikten sonra, sohbette istediğin anda sen paylaşırsın.</div></div>
      </div>` : ''}`;

    $$('[data-mode]', v).forEach((b) => b.onclick = () => { state.authMode = b.dataset.mode; renderAuth(); });
    const err = (msg) => { $('#a-err', v).textContent = msg || ''; };
    const form = $('#a-form', v);
    form.onsubmit = async (e) => {
      e.preventDefault(); err('');
      const username = $('#a-user', v).value.trim().toLowerCase(); const password = $('#a-pass', v).value;
      if (m === 'register') {
        if (!/^[a-z0-9_.]{3,24}$/.test(username)) return err('Kullanıcı adı 3-24 karakter; küçük harf, rakam, nokta ve alt çizgi.');
        if (password !== $('#a-pass2', v).value) return err('Şifreler eşleşmiyor.');
      }
      const btn = $('button[type=submit]', form); btn.disabled = true;
      try {
        const r = await api(m === 'login' ? '/auth/login' : '/auth/register', { body: { username, password } });
        await onLoggedIn(r.user);
      } catch (ex) { err(ex.message); } finally { btn.disabled = false; }
    };
  }

  async function onLoggedIn(user) {
    state.user = user;
    connectSocket();
    renderTopbar();
    if (!user.profile_done) { showView('profile'); toast('Hoş geldin! Önce anonim profilini oluştur.'); }
    else { await loadMatches(); showView('discover'); }
  }

  function renderTopbar() {
    $('#topbar-right').innerHTML = state.user ? `<button class="btn btn-ghost btn-sm" id="logout">${ic('logout', 'sm')} Çıkış</button>` : '';
    const lo = $('#logout'); if (lo) lo.onclick = logout;
  }
  async function logout() {
    try { await api('/auth/logout', { method: 'POST', body: {} }); } catch { /* yok say */ }
    state.user = null; state.matches = []; state.candidates = []; state.chat = null;
    if (state.socket) { state.socket.disconnect(); state.socket = null; }
    state.authMode = 'login'; renderTopbar(); showView('auth');
  }

  // ------------------------------------------------------------ profil düzenleme
  function renderProfile() {
    const v = $('[data-view="profile"]');
    const M = state.meta; const u = state.user;
    const d = {
      nickname: u.nickname || '', avatar: u.avatar, avatar_color: u.avatar_color,
      first_name: u.first_name || '', last_name: u.last_name || '', age: u.age ?? '', department: u.department || '',
      gender: u.gender || '', looking_for: u.looking_for || 'herkes', intent: u.intent || '', bio: u.bio || '',
      interests: [...(u.interests || [])], prompts: [...(u.prompts || [])], socials: { ...(u.socials || {}) },
    };
    while (d.prompts.length < 3) d.prompts.push({ q: '', a: '' });
    const onboarding = !u.profile_done;

    v.innerHTML = `
      <div class="stack" style="padding-top:8px">
        ${onboarding ? `<div class="card hero-card"><h2>Anonim profilini oluştur</h2><p>Sadece cinsiyet zorunlu. Ne kadar doldurursan eşleşmeler o kadar isabetli olur. Fotoğraf yok, kullanıcı adın kimseye görünmez.</p></div>` : ''}

        <div class="card stack">
          <h3>${ic('ghost')} Anonim kimliğin</h3>
          <div class="profile-head">
            ${avatarHTML(d, 'lg')}
            <div class="row" style="width:100%">
              <input class="input grow" id="p-nick" maxlength="30" placeholder="Takma ad" value="${esc(d.nickname)}">
              <button class="btn btn-icon" id="p-nick-rand" title="Rastgele takma ad">${ic('dice')}</button>
            </div>
          </div>
          <div class="section-title">Avatar</div>
          <div class="avatar-grid" id="p-avatar">${M.avatars.map((a) => `<button type="button" data-a="${a}" class="${a === d.avatar ? 'on' : ''}" style="background:${esc(d.avatar_color)}"><img src="/avatars/${a}.svg" alt="" loading="lazy"></button>`).join('')}</div>
          <div class="section-title">Renk</div>
          <div class="color-row" id="p-color">${M.avatarColors.map((c) => `<button type="button" data-c="${c}" style="background:${c}" class="${c === d.avatar_color ? 'on' : ''}" aria-label="${c}"></button>`).join('')}</div>
        </div>

        <div class="card stack">
          <h3>${ic('user')} Hakkında <span class="opt">isteğe bağlı alanlar</span></h3>
          <div class="row">
            <label class="field grow">Ad<input class="input" id="p-first" maxlength="40" value="${esc(d.first_name)}" placeholder="Boş bırakabilirsin"></label>
            <label class="field grow">Soyad<input class="input" id="p-last" maxlength="40" value="${esc(d.last_name)}" placeholder="Boş bırakabilirsin"></label>
          </div>
          <div class="row">
            <label class="field" style="width:96px">Yaş<input class="input" id="p-age" type="number" min="17" max="80" value="${esc(d.age)}" placeholder="—"></label>
            <label class="field grow">Bölüm<input class="input" id="p-dept" list="dept-list" maxlength="80" value="${esc(d.department)}" placeholder="Seç ya da yaz"><datalist id="dept-list">${M.departments.map((x) => `<option value="${esc(x)}">`).join('')}</datalist></label>
          </div>
          <label class="field">Cinsiyetin <span class="req">* zorunlu</span>
            <div class="seg" id="p-gender">${M.genders.map((g) => `<button type="button" data-v="${g.id}" class="${d.gender === g.id ? 'on' : ''}">${esc(g.label)}</button>`).join('')}</div>
          </label>
          <label class="field">Kimlerle eşleşmek istersin?
            <div class="seg neutral" id="p-look">${M.lookingFor.map((g) => `<button type="button" data-v="${g.id}" class="${d.looking_for === g.id ? 'on' : ''}">${esc(g.label)}</button>`).join('')}</div>
          </label>
        </div>

        <div class="card stack">
          <h3>${ic('sparkles')} Ne arıyorsun?</h3>
          <div class="pills" id="p-intent">${M.intents.map((i) => `<button type="button" class="pill ${d.intent === i.id ? 'on' : ''}" data-v="${i.id}">${esc(i.label)}</button>`).join('')}</div>
          <label class="field">Kendini anlat
            <textarea class="input" id="p-bio" maxlength="400" placeholder="Seni sen yapan şey ne? Kartında görünür.">${esc(d.bio)}</textarea>
            <div class="counter" id="p-bio-count"></div>
          </label>
        </div>

        <div class="card stack">
          <h3>${ic('heart')} İlgi alanların <span class="opt">en fazla 12</span></h3>
          <div class="muted small">Ortak ilgi alanı olan kişiler sana daha önce gösterilir.</div>
          <div class="pills" id="p-interests">${M.interests.map((i) => `<button type="button" class="pill ${d.interests.includes(i) ? 'on' : ''}" data-v="${esc(i)}">${esc(i)}</button>`).join('')}</div>
        </div>

        <div class="card stack">
          <h3>${ic('chat')} Sorular <span class="opt">en fazla 3</span></h3>
          <div class="muted small">Bir soru seç, kısa ve samimi cevapla. Kartında öne çıkar.</div>
          ${d.prompts.map((p, i) => `
            <div class="prompt-row">
              <select class="input" data-pi="${i}"><option value="">Soru seç…</option>${M.prompts.map((q) => `<option value="${esc(q)}" ${p.q === q ? 'selected' : ''}>${esc(q)}</option>`).join('')}</select>
              <input class="input" data-pa="${i}" maxlength="200" placeholder="Cevabın" value="${esc(p.a)}">
            </div>`).join('')}
        </div>

        <div class="card stack">
          <h3>${ic('lock')} Sosyal medya hesapların</h3>
          <div class="note">${ic('shield', 'sm')}<span>Bunlar <b>asla</b> profilinde görünmez. Sadece eşleştiğin biriyle sohbet ederken, sen “Paylaş”a basarsan o kişiye gider.</span></div>
          ${M.socials.map((s) => `<div class="social-row">${siconHTML(s.id, '')}<input class="input" data-s="${s.id}" maxlength="60" placeholder="${esc(s.label)} – ${esc(s.placeholder)}" value="${esc(d.socials[s.id] || '')}"></div>`).join('')}
        </div>

        <div class="sticky-save"><button class="btn btn-primary btn-block" id="p-save">${onboarding ? 'Profili kaydet ve keşfetmeye başla' : 'Kaydet'}</button></div>
        <div class="error center" id="p-err"></div>

        ${onboarding ? '' : `
        <div class="card stack">
          <h3>${ic('user')} Hesap</h3>
          <div class="muted small">Kullanıcı adı: <b>${esc(u.username)}</b></div>
          <div class="row">
            <button class="btn grow" id="p-logout">${ic('logout', 'sm')} Çıkış yap</button>
            <button class="btn btn-danger grow" id="p-delete">${ic('trash', 'sm')} Hesabı sil</button>
          </div>
        </div>`}
      </div>`;

    const head = $('.profile-head .avatar', v);
    const refreshHead = () => {
      head.style.background = d.avatar_color; $('img', head).src = `/avatars/${d.avatar}.svg`;
      $$('#p-avatar button', v).forEach((b) => { b.style.background = d.avatar_color; });
    };
    $('#p-nick', v).oninput = (e) => { d.nickname = e.target.value; };
    $('#p-nick-rand', v).onclick = () => {
      const adj = ['Gizemli', 'Neşeli', 'Sessiz', 'Meraklı', 'Uykulu', 'Cesur', 'Hayalperest', 'Sabahçı', 'Esprili', 'Romantik', 'Sakin', 'Çılgın'];
      const noun = ['Panda', 'Penguen', 'Tilki', 'Kedi', 'Baykuş', 'Yunus', 'Koala', 'Kaplan', 'Kirpi', 'Ahtapot', 'Flamingo', 'Rakun'];
      d.nickname = `${adj[Math.random() * adj.length | 0]} ${noun[Math.random() * noun.length | 0]}`; $('#p-nick', v).value = d.nickname;
    };
    $('#p-avatar', v).onclick = (e) => { const b = e.target.closest('button'); if (!b) return; d.avatar = b.dataset.a; $$('button', e.currentTarget).forEach((x) => x.classList.toggle('on', x === b)); refreshHead(); };
    $('#p-color', v).onclick = (e) => { const b = e.target.closest('button'); if (!b) return; d.avatar_color = b.dataset.c; $$('button', e.currentTarget).forEach((x) => x.classList.toggle('on', x === b)); refreshHead(); };
    const seg = (id, key) => { $(id, v).onclick = (e) => { const b = e.target.closest('button'); if (!b) return; d[key] = b.dataset.v; $$('button', e.currentTarget).forEach((x) => x.classList.toggle('on', x === b)); }; };
    seg('#p-gender', 'gender'); seg('#p-look', 'looking_for');
    $('#p-intent', v).onclick = (e) => { const b = e.target.closest('button'); if (!b) return; d.intent = d.intent === b.dataset.v ? '' : b.dataset.v; $$('button', e.currentTarget).forEach((x) => x.classList.toggle('on', x.dataset.v === d.intent)); };
    const bioCount = () => { $('#p-bio-count', v).textContent = `${d.bio.length}/400`; };
    $('#p-bio', v).oninput = (e) => { d.bio = e.target.value; bioCount(); }; bioCount();
    $('#p-interests', v).onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const val = b.dataset.v; const i = d.interests.indexOf(val);
      if (i >= 0) d.interests.splice(i, 1);
      else if (d.interests.length >= 12) return toast('En fazla 12 ilgi alanı seçebilirsin.');
      else d.interests.push(val);
      b.classList.toggle('on', d.interests.includes(val));
    };
    $$('[data-pi]', v).forEach((s) => s.onchange = (e) => { d.prompts[+e.target.dataset.pi].q = e.target.value; });
    $$('[data-pa]', v).forEach((s) => s.oninput = (e) => { d.prompts[+e.target.dataset.pa].a = e.target.value; });
    $$('[data-s]', v).forEach((s) => s.oninput = (e) => { d.socials[e.target.dataset.s] = e.target.value; });
    const simple = { '#p-first': 'first_name', '#p-last': 'last_name', '#p-age': 'age', '#p-dept': 'department' };
    for (const [sel, key] of Object.entries(simple)) $(sel, v).oninput = (e) => { d[key] = e.target.value; };

    $('#p-save', v).onclick = async () => {
      const btn = $('#p-save', v); const errEl = $('#p-err', v); errEl.textContent = '';
      if (!d.gender) { errEl.textContent = 'Cinsiyet seçimi zorunlu.'; $('#p-gender', v).scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      btn.disabled = true;
      try {
        const body = { ...d, prompts: d.prompts.filter((p) => p.q && p.a.trim()) };
        const r = await api('/profile', { method: 'PUT', body });
        const first = !state.user.profile_done;
        state.user = r.user;
        toast('Profil kaydedildi.', 'ok');
        if (first) { await loadMatches(); showView('discover'); } else { state.candidates = []; }
      } catch (ex) { errEl.textContent = ex.message; } finally { btn.disabled = false; }
    };
    const lo = $('#p-logout', v); if (lo) lo.onclick = logout;
    const del = $('#p-delete', v); if (del) del.onclick = async () => {
      if (!await confirmSheet('Hesabı sil', 'Profilin, eşleşmelerin ve mesajların kalıcı olarak silinir. Bu işlem geri alınamaz.', 'Evet, sil', true)) return;
      try { await api('/me', { method: 'DELETE' }); toast('Hesabın silindi.'); state.user = null; if (state.socket) state.socket.disconnect(); state.socket = null; renderTopbar(); showView('auth'); }
      catch (ex) { toast(ex.message, 'err'); }
    };
  }

  // ------------------------------------------------------------ profil kartı (ortak)
  function profileCardHTML(p, shared = []) {
    const name = displayName(p);
    const subBits = [];
    if (p.first_name) subBits.push(`“${p.nickname}”`);
    if (p.age) subBits.push(`${p.age}`);
    if (p.department) subBits.push(p.department);
    const sharedSet = new Set(shared);
    const interests = p.interests || [];
    const prompts = p.prompts || [];
    return `
      <div class="card-hero" style="background:linear-gradient(160deg, ${esc(p.avatar_color)}, color-mix(in srgb, ${esc(p.avatar_color)} 45%, #12101c))">
        ${shared.length ? `<span class="shared-count">${ic('sparkles')} ${shared.length} ortak ilgi</span>` : ''}
        ${p.intent ? `<span class="badge">${esc(intentLabel(p.intent))}</span>` : ''}
        ${avatarHTML(p, 'xl')}
        <div class="name">${esc(name)}</div>
        ${subBits.length ? `<div class="sub">${esc(subBits.join(' · '))}</div>` : ''}
      </div>
      <div class="card-body">
        ${p.bio ? `<div><div class="section-title">Hakkında</div><div class="bio">${esc(p.bio)}</div></div>` : ''}
        ${interests.length ? `<div><div class="section-title">İlgi alanları</div><div class="pills">${interests.map((i) => `<span class="pill ${sharedSet.has(i) ? 'shared' : ''}">${sharedSet.has(i) ? ic('check', 'sm') : ''}${esc(i)}</span>`).join('')}</div></div>` : ''}
        ${prompts.map((q) => `<div class="qa"><div class="q">${esc(q.q)}</div><div class="a">${esc(q.a)}</div></div>`).join('')}
        ${!p.bio && !interests.length && !prompts.length ? `<div class="muted center" style="padding:20px 0">Bu kişi gizemli kalmayı seçmiş.</div>` : ''}
      </div>`;
  }

  // ------------------------------------------------------------ keşfet
  async function loadCandidates() {
    if (state.discoverLoading) return;
    state.discoverLoading = true;
    try {
      const r = await api('/discover');
      const ids = new Set(state.candidates.map((c) => c.id));
      for (const c of r.candidates) if (!ids.has(c.id)) state.candidates.push(c);
    } catch (ex) { toast(ex.message, 'err'); }
    finally { state.discoverLoading = false; }
  }

  async function renderDiscover() {
    const v = $('[data-view="discover"]');
    if (!state.user.profile_done) return showView('profile');
    if (!state.candidates.length) {
      v.innerHTML = `<div class="spinner"></div>`;
      await loadCandidates();
      if (state.view !== 'discover') return;
    }
    renderDeck();
  }

  function renderDeck() {
    const v = $('[data-view="discover"]');
    if (!state.candidates.length) {
      v.innerHTML = `<div class="empty"><div class="glyph">${ic('ghost')}</div><h2>Şimdilik kimse yok</h2><p>Yeni öğrenciler katıldıkça burada görünecek. Profilini zenginleştirmek eşleşme şansını artırır.</p><button class="btn btn-primary" id="d-refresh">${ic('refresh', 'sm')} Yenile</button></div>`;
      $('#d-refresh', v).onclick = async () => { await loadCandidates(); renderDeck(); };
      return;
    }
    const top3 = state.candidates.slice(0, 3);
    v.innerHTML = `
      <div class="deck-wrap">
        <div class="deck" id="deck">
          ${top3.map((c, i) => `
            <article class="swipe-card ${i === 1 ? 'behind' : i === 2 ? 'behind2' : ''}" data-id="${c.id}" style="z-index:${10 - i}">
              ${i === 0 ? `<div class="stamp like">BEĞEN</div><div class="stamp nope">GEÇ</div>` : ''}
              ${profileCardHTML(c, c.sharedInterests)}
            </article>`).reverse().join('')}
        </div>
        <div class="deck-actions">
          <button class="btn btn-icon pass" id="d-pass" title="Geç">${ic('x')}</button>
          <button class="btn btn-icon more" id="d-more" title="Daha fazla">${ic('more')}</button>
          <button class="btn btn-icon like" id="d-like" title="Beğen">${ic('heart')}</button>
        </div>
      </div>`;
    attachSwipe($(`.swipe-card[data-id="${top3[0].id}"]`, v));
    $('#d-pass', v).onclick = () => decide('pass');
    $('#d-like', v).onclick = () => decide('like');
    $('#d-more', v).onclick = () => {
      const c = state.candidates[0];
      const el = openModal(`<div class="sheet-title">${esc(displayName(c))}</div><div class="list">
        <button class="btn" data-x="report">${ic('flag', 'sm')} Şikayet et</button>
        <button class="btn btn-danger" data-x="block">${ic('ban', 'sm')} Engelle</button>
        <button class="btn btn-ghost" data-x="close">Kapat</button></div>`);
      el.onclick = async (e) => {
        const b = e.target.closest('[data-x]'); if (!b) return; closeModal();
        if (b.dataset.x === 'report') return reportUser(c);
        if (b.dataset.x === 'block') { if (await confirmSheet('Engelle', 'Bu kişi seni bir daha göremez, sen de onu.', 'Engelle', true)) { await api('/block', { body: { userId: c.id } }); state.candidates.shift(); renderDeck(); toast('Engellendi.'); } }
      };
    };
  }

  function attachSwipe(card) {
    if (!card) return;
    let startX = 0, startY = 0, dx = 0, dy = 0, active = false;
    const like = $('.stamp.like', card), nope = $('.stamp.nope', card);
    card.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      active = true; startX = e.clientX; startY = e.clientY; dx = dy = 0;
      card.classList.add('dragging'); card.setPointerCapture(e.pointerId);
    });
    card.addEventListener('pointermove', (e) => {
      if (!active) return;
      dx = e.clientX - startX; dy = e.clientY - startY;
      card.style.transform = `translate(${dx}px, ${dy * 0.4}px) rotate(${dx / 18}deg)`;
      const k = Math.min(Math.abs(dx) / 110, 1);
      like.style.opacity = dx > 0 ? k : 0; nope.style.opacity = dx < 0 ? k : 0;
    });
    const end = () => {
      if (!active) return; active = false; card.classList.remove('dragging');
      if (Math.abs(dx) > 110) decide(dx > 0 ? 'like' : 'pass');
      else { card.style.transform = ''; like.style.opacity = 0; nope.style.opacity = 0; }
    };
    card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
  }

  let deciding = false;
  async function decide(action) {
    if (deciding || !state.candidates.length) return;
    deciding = true;
    const c = state.candidates[0];
    const card = $(`.swipe-card[data-id="${c.id}"]`);
    if (card) { card.classList.remove('dragging'); card.style.transform = ''; card.classList.add(action === 'like' ? 'fly-right' : 'fly-left'); }
    try {
      const r = await api('/swipe', { body: { to: c.id, action } });
      state.candidates.shift();
      setTimeout(() => { renderDeck(); deciding = false; }, 220);
      if (state.candidates.length < 3) loadCandidates().then(() => { if (state.view === 'discover' && state.candidates.length <= 2) renderDeck(); });
      if (r.matched) { await loadMatches(); showMatchModal(r.match); }
    } catch (ex) { deciding = false; toast(ex.message, 'err'); renderDeck(); }
  }

  function showMatchModal(match) {
    const other = match.user;
    const el = openModal(`
      <div class="match-modal">
        ${ic('sparkles', 'lg sparkle')}
        <h2>Eşleştiniz!</h2>
        <div class="pair">${avatarHTML(state.user, 'lg')}${avatarHTML(other, 'lg')}</div>
        <p class="muted">Sen ve <b>${esc(displayName(other))}</b> birbirinizi beğendiniz. Sohbete başla, hazır hissettiğinde sosyal medyanı paylaş.</p>
        <div class="stack">
          <button class="btn btn-primary btn-block" data-x="chat">${ic('chat', 'sm')} Mesaj gönder</button>
          <button class="btn btn-block" data-x="close">Keşfetmeye devam et</button>
        </div>
      </div>`, { center: true });
    el.onclick = (e) => { const b = e.target.closest('[data-x]'); if (!b) return; closeModal(); if (b.dataset.x === 'chat') openChat(match.matchId); };
  }

  async function reportUser(p) {
    const el = openModal(`<div class="sheet-title">Şikayet et: ${esc(displayName(p))}</div>
      <div class="stack"><textarea class="input" id="r-reason" maxlength="500" placeholder="Ne oldu? (taciz, sahte hesap, uygunsuz içerik…)"></textarea>
      <button class="btn btn-primary" data-x="send">${ic('flag', 'sm')} Gönder</button></div>`);
    el.onclick = async (e) => {
      const b = e.target.closest('[data-x]'); if (!b) return;
      try { await api('/report', { body: { userId: p.id, reason: $('#r-reason', el).value } }); closeModal(); toast('Şikayetin alındı, teşekkürler.', 'ok'); }
      catch (ex) { toast(ex.message, 'err'); }
    };
  }

  // ------------------------------------------------------------ eşleşmeler
  async function loadMatches() {
    try { state.matches = (await api('/matches')).matches; updateUnreadBadge(); }
    catch (ex) { toast(ex.message, 'err'); }
  }

  async function renderMatches() {
    const v = $('[data-view="matches"]');
    v.innerHTML = `<div class="spinner"></div>`;
    await loadMatches();
    if (state.view !== 'matches') return;
    if (!state.matches.length) {
      v.innerHTML = `<div class="empty"><div class="glyph">${ic('chat')}</div><h2>Henüz eşleşmen yok</h2><p>Keşfet'te beğendiğin biri seni de beğenince burada görünür.</p><button class="btn btn-primary" id="m-go">Keşfet'e git</button></div>`;
      $('#m-go', v).onclick = () => showView('discover'); return;
    }
    const fresh = state.matches.filter((m) => !m.lastMessage || m.lastMessage.type === 'system');
    v.innerHTML = `<div class="stack" style="padding-top:8px">
      <div class="section-head"><h2>Sohbet</h2></div>
      ${fresh.length ? `<div><div class="section-title">Yeni eşleşmeler</div><div class="new-row">${fresh.map((m) => `<button data-id="${m.matchId}">${avatarHTML(m.user)}<span>${esc(displayName(m.user))}</span></button>`).join('')}</div></div>` : ''}
      <div class="match-list">${state.matches.map((m) => {
        const lm = m.lastMessage;
        let preview = 'Yeni eşleşme – ilk mesajı sen at!';
        if (lm) preview = lm.type === 'social' ? (lm.mine ? 'Sosyal medya paylaştın' : 'Sosyal medya paylaştı') : lm.type === 'system' ? lm.body : (lm.mine ? 'Sen: ' : '') + lm.body;
        return `<button class="match-item" data-id="${m.matchId}">
          ${avatarHTML(m.user)}
          <div class="meta"><div class="name">${esc(displayName(m.user))} ${m.user.online ? '<span class="dot" title="Çevrimiçi"></span>' : ''}</div><div class="preview ${m.unread ? 'unread' : ''}">${esc(preview)}</div></div>
          <div class="stack" style="align-items:flex-end;gap:4px"><span class="time">${fmtTime(lm ? lm.at : m.matchedAt)}</span>${m.unread ? `<span class="badge-count">${m.unread}</span>` : ''}</div>
        </button>`;
      }).join('')}</div></div>`;
    $$('[data-id]', v).forEach((b) => b.onclick = () => openChat(+b.dataset.id));
  }

  // ------------------------------------------------------------ sohbet
  async function openChat(matchId) {
    state.chat = { matchId, messages: [], other: null, shared: {}, hasMore: false, loading: true };
    showView('chat');
    try {
      const r = await api(`/matches/${matchId}/messages`);
      Object.assign(state.chat, { messages: r.messages, other: r.other, shared: r.shared, hasMore: r.hasMore, loading: false });
      const m = state.matches.find((x) => x.matchId === matchId); if (m) { m.unread = 0; updateUnreadBadge(); }
      renderChat(); scrollChatBottom();
    } catch (ex) { toast(ex.message, 'err'); showView('matches'); }
  }

  function renderChat() {
    const v = $('[data-view="chat"]');
    const c = state.chat; if (!c) return showView('matches');
    if (c.loading) { v.innerHTML = `<div class="chat"><div class="spinner"></div></div>`; return; }
    const o = c.other; const me = state.user.id;
    const sharedByThem = c.shared[o.id] || {}; const sharedByMe = c.shared[me] || {};
    const sharedBar = Object.keys(sharedByThem).length || Object.keys(sharedByMe).length ? `
      <div class="shared-bar">
        <span class="lbl">Paylaşılan hesaplar</span>
        ${Object.entries(sharedByThem).map(([p, h]) => { const l = socialLink(p, h); return `<span class="pill">${siconHTML(p, 'brand sm')} ${l ? `<a href="${esc(l)}" target="_blank" rel="noopener">${esc(h)}</a>` : esc(h)}</span>`; }).join('')}
        ${Object.entries(sharedByMe).map(([p, h]) => `<span class="pill muted" title="Sen paylaştın">${siconHTML(p, 'sm')} ${esc(h)} ${ic('check', 'sm')}</span>`).join('')}
      </div>` : '';
    v.innerHTML = `
      <div class="chat">
        <div class="chat-head">
          <button class="btn btn-ghost btn-icon" id="c-back" title="Geri">${ic('back')}</button>
          ${avatarHTML(o)}
          <div class="grow">
            <div class="name">${esc(displayName(o))}</div>
            <div class="status" id="c-status">${o.online ? '<span class="dot"></span> Çevrimiçi' : o.last_seen ? 'Son görülme ' + fmtTime(o.last_seen) : ''}</div>
          </div>
          <button class="btn btn-ghost btn-icon" id="c-profile" title="Profili gör">${ic('user')}</button>
          <button class="btn btn-ghost btn-icon" id="c-menu" title="Daha fazla">${ic('more')}</button>
        </div>
        ${sharedBar}
        <div class="chat-body" id="c-body">
          ${c.hasMore ? `<button class="btn btn-sm load-more" id="c-more">Önceki mesajlar</button>` : ''}
          ${c.messages.map(messageHTML).join('')}
        </div>
        <div class="typing" id="c-typing"></div>
        <div class="chat-compose">
          <button class="btn btn-icon" id="c-share" title="Sosyal medya paylaş">${ic('link')}</button>
          <textarea class="input" id="c-input" rows="1" placeholder="Mesaj yaz…" maxlength="1000"></textarea>
          <button class="btn btn-icon send" id="c-send" title="Gönder">${ic('send')}</button>
        </div>
      </div>`;
    $('#c-back', v).onclick = () => { state.chat = null; showView('matches'); };
    $('#c-profile', v).onclick = () => {
      const mine = new Set(state.user.interests || []);
      openModal(`<div class="profile-view">${profileCardHTML(o, (o.interests || []).filter((i) => mine.has(i)))}</div>`);
    };
    $('#c-menu', v).onclick = () => {
      const el = openModal(`<div class="sheet-title">${esc(displayName(o))}</div><div class="list">
        <button class="btn" data-x="unmatch">${ic('heartOff', 'sm')} Eşleşmeyi kaldır</button>
        <button class="btn" data-x="report">${ic('flag', 'sm')} Şikayet et</button>
        <button class="btn btn-danger" data-x="block">${ic('ban', 'sm')} Engelle</button>
        <button class="btn btn-ghost" data-x="close">Kapat</button></div>`);
      el.onclick = async (e) => {
        const b = e.target.closest('[data-x]'); if (!b) return; closeModal();
        try {
          if (b.dataset.x === 'unmatch' && await confirmSheet('Eşleşmeyi kaldır', 'Sohbet ikiniz için de kapanır.', 'Kaldır', true)) { await api(`/matches/${c.matchId}`, { method: 'DELETE' }); state.chat = null; toast('Eşleşme kaldırıldı.'); showView('matches'); }
          if (b.dataset.x === 'block' && await confirmSheet('Engelle', 'Eşleşme kaldırılır ve bu kişi seni bir daha göremez.', 'Engelle', true)) { await api('/block', { body: { userId: o.id } }); state.chat = null; toast('Engellendi.'); showView('matches'); }
          if (b.dataset.x === 'report') reportUser(o);
        } catch (ex) { toast(ex.message, 'err'); }
      };
    };
    const input = $('#c-input', v);
    const autosize = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; };
    input.oninput = () => { autosize(); if (state.socket) state.socket.emit('typing', c.matchId); };
    input.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
    $('#c-send', v).onclick = sendMessage;
    $('#c-share', v).onclick = openShareSheet;
    const more = $('#c-more', v);
    if (more) more.onclick = async () => {
      const oldest = c.messages[0]?.id; if (!oldest) return;
      const r = await api(`/matches/${c.matchId}/messages?before=${oldest}`);
      c.messages = [...r.messages, ...c.messages]; c.hasMore = r.hasMore;
      const body = $('#c-body'); const prevH = body.scrollHeight; renderChat(); const nb = $('#c-body'); nb.scrollTop = nb.scrollHeight - prevH;
    };
    setTimeout(() => input.focus({ preventScroll: true }), 50);
  }

  function messageHTML(m) {
    const mine = m.sender_id === state.user.id;
    if (m.type === 'system') return `<div class="msg system">${esc(m.body)}</div>`;
    if (m.type === 'social') {
      let p = {}; try { p = JSON.parse(m.body); } catch { /* yok */ }
      const d = socialDef(p.platform); const link = socialLink(p.platform, p.handle || '');
      return `<div class="msg social ${mine ? 'mine' : 'theirs'}">${siconHTML(p.platform)}<div><div class="title">${mine ? 'Paylaştın' : 'Seninle paylaştı'} · ${esc(d.label)}</div><div class="handle">${link ? `<a href="${esc(link)}" target="_blank" rel="noopener">@${esc(p.handle)}</a>` : esc(p.handle)}</div></div></div>`;
    }
    return `<div class="msg ${mine ? 'mine' : 'theirs'}">${esc(m.body)}<span class="time">${fmtTime(m.created_at)}</span></div>`;
  }
  function scrollChatBottom() { const b = $('#c-body'); if (b) b.scrollTop = b.scrollHeight; }
  function appendMessage(m) {
    const body = $('#c-body'); if (!body) return;
    const nearBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 120;
    body.insertAdjacentHTML('beforeend', messageHTML(m));
    if (nearBottom || m.sender_id === state.user.id) scrollChatBottom();
  }

  async function sendMessage() {
    const c = state.chat; const input = $('#c-input'); if (!c || !input) return;
    const body = input.value.trim(); if (!body) return;
    input.value = ''; input.style.height = 'auto';
    try { await api(`/matches/${c.matchId}/messages`, { body: { body } }); }
    catch (ex) { toast(ex.message, 'err'); input.value = body; }
  }

  function openShareSheet() {
    const c = state.chat; const socials = state.user.socials || {};
    const already = c.shared[state.user.id] || {};
    const entries = state.meta.socials.filter((s) => socials[s.id]);
    const el = openModal(`
      <div class="sheet-title">Sosyal medyanı paylaş</div>
      <p class="muted small" style="margin:0 0 12px">Seçtiğin hesap sadece <b>${esc(displayName(c.other))}</b> ile bu sohbette paylaşılır. Dilediğin zaman, dilediğin kadarını.</p>
      <div class="list">
        ${entries.map((s) => `<button class="btn" data-p="${s.id}" ${already[s.id] ? 'disabled' : ''}>${siconHTML(s.id, 'brand sm')} <span class="grow" style="text-align:left">${esc(s.label)} · @${esc(socials[s.id])}</span> ${already[s.id] ? ic('check', 'sm') : ''}</button>`).join('')}
        ${entries.length ? '' : `<div class="note">${ic('info', 'sm')}<span>Henüz kayıtlı hesabın yok. Aşağıdan hemen ekleyip paylaşabilirsin.</span></div>`}
        <div class="divider"></div>
        <div class="row">
          <select class="input" id="sh-platform" style="width:150px">${state.meta.socials.map((s) => `<option value="${s.id}">${esc(s.label)}</option>`).join('')}</select>
          <input class="input grow" id="sh-handle" maxlength="60" placeholder="kullaniciadi">
          <button class="btn btn-primary btn-sm" data-new="1">Paylaş</button>
        </div>
        <div class="muted small">Yeni girdiğin hesap profiline de kaydedilir (yine gizli kalır).</div>
      </div>`);
    el.onclick = async (e) => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      let platform = b.dataset.p, handle;
      if (b.dataset.new) { platform = $('#sh-platform', el).value; handle = $('#sh-handle', el).value.trim(); if (!handle) return toast('Kullanıcı adını yaz.'); }
      if (!platform) return;
      try {
        await api(`/matches/${c.matchId}/share`, { body: { platform, handle } });
        if (handle) { state.user.socials = { ...(state.user.socials || {}), [platform]: handle.replace(/^@/, '') }; }
        closeModal(); toast('Paylaşıldı.', 'ok');
      } catch (ex) { toast(ex.message, 'err'); }
    };
  }

  // ------------------------------------------------------------ socket.io
  function connectSocket() {
    if (state.socket) return;
    const s = io({ withCredentials: true });
    state.socket = s;
    s.on('message', ({ matchId, message }) => {
      const c = state.chat;
      if (c && c.matchId === matchId) {
        c.messages.push(message);
        if (message.type === 'social') { let p = {}; try { p = JSON.parse(message.body); } catch { /* yok */ } (c.shared[message.sender_id] ||= {})[p.platform] = p.handle; renderChat(); scrollChatBottom(); }
        else appendMessage(message);
        const t = $('#c-typing'); if (t) t.textContent = '';
        if (message.sender_id !== state.user.id) api(`/matches/${matchId}/read`, { body: {} }).catch(() => {});
      } else if (message.sender_id !== state.user.id) {
        const m = state.matches.find((x) => x.matchId === matchId);
        if (m) { m.unread = (m.unread || 0) + 1; updateUnreadBadge(); if (state.view === 'matches') renderMatches(); }
        else loadMatches().then(() => { if (state.view === 'matches') renderMatches(); });
        toast('Yeni mesaj');
      }
    });
    s.on('match', async (m) => { await loadMatches(); showMatchModal(m); });
    s.on('unmatch', ({ matchId }) => {
      if (state.chat && state.chat.matchId === matchId) { state.chat = null; toast('Eşleşme kaldırıldı.'); showView('matches'); }
      else loadMatches().then(() => { if (state.view === 'matches') renderMatches(); });
    });
    s.on('typing', ({ matchId }) => {
      if (!state.chat || state.chat.matchId !== matchId) return;
      const t = $('#c-typing'); if (!t) return; t.textContent = 'yazıyor…';
      clearTimeout(state.typingTimer); state.typingTimer = setTimeout(() => { t.textContent = ''; }, 1800);
    });
    s.on('presence', ({ userId, online }) => {
      const m = state.matches.find((x) => x.user.id === userId); if (m) m.user.online = online;
      if (state.chat && state.chat.other && state.chat.other.id === userId) { state.chat.other.online = online; const st = $('#c-status'); if (st) st.innerHTML = online ? '<span class="dot"></span> Çevrimiçi' : 'Son görülme az önce'; }
      else if (state.view === 'matches') renderMatches();
    });
  }

  // ------------------------------------------------------------ başlat
  (async () => {
    try { state.meta = await api('/meta'); }
    catch { document.body.innerHTML = '<p style="padding:24px">Sunucuya ulaşılamıyor.</p>'; return; }
    try {
      const r = await api('/me');
      await onLoggedIn(r.user);
    } catch { showView('auth'); }
  })();
})();
