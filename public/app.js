/* MedipolDate – ön uç (bağımlılıksız, tek dosya) */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const parse = (s, fb = {}) => { try { return JSON.parse(s); } catch { return fb; } };
  const store = {
    get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* yok */ } },
  };

  // Lucide tarzı çizgi ikonlar (ISC) – inline SVG
  const ICONS = {
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    star: '<path d="M11.5 2.3a.6.6 0 0 1 1 0l2.6 5.3 5.8.8a.6.6 0 0 1 .3 1l-4.2 4.1 1 5.8a.6.6 0 0 1-.8.6L12 17.2l-5.2 2.7a.6.6 0 0 1-.8-.6l1-5.8-4.2-4.1a.6.6 0 0 1 .3-1l5.8-.8Z"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    dice: '<rect width="18" height="18" x="3" y="3" rx="4"/><path d="M16 8h.01M8 8h.01M8 16h.01M16 16h.01M12 12h.01"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    eyeOff: '<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    sparkles: '<path d="M9.94 14.34 8 20l-1.94-5.66L1 12l5.06-1.94L8 4l1.94 6.06L15 12Z"/><path d="M19 3v4M21 5h-4M19 17v4M21 19h-4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    heartOff: '<path d="M16.5 3A5.5 5.5 0 0 1 22 8.5c0 2.3-1.5 4.05-3 5.5"/><path d="M2 8.5a5.5 5.5 0 0 1 9.5-3.8L12 5l.5-.3"/><path d="m2 2 20 20"/><path d="M5.3 13.9 12 20.6l2.5-2.5"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    cap: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    ghost: '<path d="M9 10h.01M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 3 2.5-3 2.5 3 2.5-3 3 3V10a8 8 0 0 0-8-8z"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    refresh: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    scale: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10M12 3v18M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
    unlock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    pencil: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  };
  const ic = (name, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  const state = {
    meta: null, user: null, view: null, authMode: 'login',
    mode: store.get('md_mode', 'date') === 'friend' ? 'friend' : 'date',
    candidates: [], discoverLoading: false, limits: null, daily: null, discoverFlags: {},
    lastSwipe: null, matches: [], chat: null, typingSentAt: 0, installPrompt: null,
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
      if (res.status === 401 && state.user) { state.user = null; stopPolling(); closeModal(); renderTopbar(); showView('auth'); }
      const err = new Error(data.error || 'Bir şeyler ters gitti.');
      err.status = res.status; err.data = data;
      throw err;
    }
    return data;
  }

  /** Kırıcı ifade uyarısı (409): "Emin misin?" sorar, onaylanırsa confirmed:true ile tekrar dener. */
  async function withConfirm(fn) {
    try { return await fn(false); } catch (ex) {
      if (!ex.data?.needsConfirm) throw ex;
      const yes = await confirmSheet('Emin misin?', ex.message, 'Yine de gönder', true, 'Düzenle');
      if (!yes) { const e = new Error(''); e.cancelled = true; throw e; }
      return fn(true);
    }
  }
  const fail = (ex) => { if (!ex?.cancelled && ex?.message) toast(ex.message, 'err'); };

  // ------------------------------------------------------------ yardımcılar
  function toast(msg, kind = '') {
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML = `${kind === 'err' ? ic('alert', 'sm') : kind === 'ok' ? ic('check', 'sm') : ic('info', 'sm')}<span>${esc(msg)}</span>`;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), 3400);
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
  function confirmSheet(title, text, okLabel, danger = false, cancelLabel = 'Vazgeç') {
    return new Promise((resolve) => {
      const el = openModal(`
        <div class="sheet-title">${esc(title)}</div>
        <p class="muted" style="margin:0 0 16px">${esc(text)}</p>
        <div class="row">
          <button class="btn grow" data-x="no">${esc(cancelLabel)}</button>
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
  const fmtLeft = (ms) => {
    if (ms <= 0) return 'süre doldu';
    const h = Math.floor(ms / 3600e3);
    return h >= 1 ? `${h} sa` : `${Math.max(1, Math.floor(ms / 60e3))} dk`;
  };
  // Gerçek isim asla gösterilmez; herkes takma adıyla görünür (isim sadece karşılıklı kimlik açılınca, sohbet kartında).
  const displayName = (p) => p?.nickname || '';
  const intentLabel = (id) => (state.meta.intents.find((i) => i.id === id) || {}).label || '';
  const socialDef = (id) => state.meta.socials.find((s) => s.id === id) || { id, label: id };
  const avatarHTML = (p, cls = '') => `<div class="avatar ${cls}" style="--av:${esc(p.avatar_color)}"><img src="/avatars/${esc(p.avatar)}.svg" alt="" draggable="false"></div>`;
  const siconHTML = (id, cls = 'brand') => `<span class="sicon ${cls}"><img src="/icons/${esc(id)}.svg" alt="${esc(socialDef(id).label)}"></span>`;
  function socialLink(platform, handle) {
    const h = encodeURIComponent(handle);
    const map = {
      instagram: `https://instagram.com/${h}`, x: `https://x.com/${h}`, snapchat: `https://snapchat.com/add/${h}`,
      tiktok: `https://tiktok.com/@${h}`, telegram: `https://t.me/${h}`,
    };
    return map[platform] || null;
  }
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

  /** Profil kaydı için mevcut profilden tam gövde oluşturur (tek alan değiştirmek için). */
  function profileBody(patch = {}) {
    const u = state.user;
    return {
      nickname: u.nickname, avatar: u.avatar, avatar_color: u.avatar_color, first_name: u.first_name, last_name: u.last_name,
      age: u.age ?? '', department: u.department, gender: u.gender, looking_for: u.looking_for, intent: u.intent, bio: u.bio,
      interests: u.interests, prompts: u.prompts, socials: u.socials, friend_mode: u.friend_mode, opening_question: u.opening_question,
      ...patch,
    };
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
    const collage = ['f05', 'm03', 'f12', 'm09', 'f20'].map((a, i) =>
      `<div class="avatar" style="--av:${state.meta.avatarColors[(i * 3) % state.meta.avatarColors.length]}"><img src="/avatars/${a}.svg" alt=""></div>`).join('');
    v.innerHTML = `
      <div class="auth-hero">
        <div class="brand" style="margin-bottom:34px"><span class="brand-mark"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 5 6.4 5c2 0 3.4 1.1 4.1 2.3L12 9.2l1.5-1.9C14.2 6.1 15.6 5 17.6 5c3.4 0 5.5 3.4 4 6.8C19.5 16.4 12 21 12 21z"/></svg></span><span class="brand-text">Medipol<em>Date</em></span></div>
        <div class="eyebrow">${ic('cap', 'sm')} Ankara Medipol'e özel</div>
        <h1><span>tanış.</span><span class="blur">eşleş.</span><span>konuş<em>.</em></span></h1>
        <p>Fotoğrafsız ve anonim. Gerçek ismin, sen sohbette açmaya karar verene kadar kimseye görünmez.</p>
        <div class="collage">${collage}</div>
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
        <div class="feature"><span class="fi warm">${ic('eyeOff', 'sm')}</span><div><b>Fotoğraf yok, isim yok</b>Bir çizim avatar ve takma adla görünürsün. Gerçek adın gizli kalır.</div></div>
        <div class="feature"><span class="fi">${ic('unlock', 'sm')}</span><div><b>Hazır olunca birlikte açılın</b>İkiniz de isterseniz isim ve sosyal medya aynı anda açılır.</div></div>
        <div class="feature"><span class="fi">${ic('users', 'sm')}</span><div><b>Flört ya da arkadaşlık</b>İki ayrı mod: kampüste sevgili de, ders arkadaşı da bulabilirsin.</div></div>
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
    startPolling();
    renderTopbar();
    if (user.profile_done) await loadMatches();
    const deep = Number(new URLSearchParams(location.search).get('match'));
    if (deep && user.profile_done) { history.replaceState(null, '', '/'); openChat(deep); return; }
    // Girişten sonra her zaman profil sayfası açılır: doluluk oranı ve eksikler görünür
    showView('profile');
    if (!user.profile_done) toast('Hoş geldin. Önce anonim profilini oluştur.');
  }

  function renderTopbar() {
    $('#topbar-right').innerHTML = state.user ? `<button class="btn btn-ghost btn-sm" id="logout">${ic('logout', 'sm')} Çıkış</button>` : '';
    const lo = $('#logout'); if (lo) lo.onclick = logout;
  }
  async function logout() {
    try { await api('/auth/logout', { method: 'POST', body: {} }); } catch { /* yok say */ }
    state.user = null; state.matches = []; state.candidates = []; state.chat = null; state.lastSwipe = null;
    stopPolling();
    state.authMode = 'login'; renderTopbar(); showView('auth');
  }

  // ------------------------------------------------------------ bildirimler & uygulama kurulumu
  let swReg = null;
  async function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    try { swReg = await navigator.serviceWorker.register('/sw.js'); } catch { swReg = null; }
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data?.type !== 'open' || !state.user) return;
      const id = Number(new URL(e.data.url).searchParams.get('match'));
      if (id) openChat(id);
    });
  }
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); state.installPrompt = e; if (state.view === 'profile') renderProfile(); });

  const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && !!state.meta?.push?.enabled;
  function b64ToUint8(b64) {
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
  }
  async function pushStatus() {
    if (!pushSupported()) return 'unsupported';
    if (Notification.permission === 'denied') return 'denied';
    try {
      const reg = swReg || await navigator.serviceWorker.ready;
      return (await reg.pushManager.getSubscription()) ? 'on' : 'off';
    } catch { return 'off'; }
  }
  async function enablePush() {
    if (!pushSupported()) {
      toast(isIOS() && !isStandalone() ? 'iPhone\'da bildirim için önce siteyi ana ekrana ekle.' : 'Bu tarayıcı bildirimleri desteklemiyor.', 'err');
      return false;
    }
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { toast('Bildirim izni verilmedi.', 'err'); return false; }
    try {
      const reg = swReg || await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(state.meta.push.key) });
      await api('/push/subscribe', { body: { subscription: sub.toJSON() } });
      toast('Bildirimler açıldı.', 'ok');
      return true;
    } catch (ex) { toast(ex.message || 'Bildirimler açılamadı.', 'err'); return false; }
  }
  async function disablePush() {
    try {
      const reg = swReg || await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) { await api('/push/unsubscribe', { body: { endpoint: sub.endpoint } }); await sub.unsubscribe(); }
      toast('Bildirimler kapatıldı.');
    } catch (ex) { fail(ex); }
  }

  // ------------------------------------------------------------ profil doluluğu
  // Sunucudaki hesaplamanın aynısı (server/app.js → SCORE_ITEMS); yazarken canlı güncellenir.
  // Kaydedilince sunucunun hesapladığı değer esas alınır.
  const SCORE_ITEMS = [
    { key: 'gender', label: 'Cinsiyet', pts: 5, sec: 'about', ok: (d) => !!d.gender },
    { key: 'bio', label: 'Kendini anlat', pts: 15, sec: 'bio', ok: (d) => (d.bio || '').trim().length >= 20 },
    { key: 'interests', label: 'En az 5 ilgi alanı', pts: 15, sec: 'interests', ok: (d) => (d.interests || []).length >= 5 },
    { key: 'prompt1', label: '1. soru-cevap', pts: 7, sec: 'prompts', ok: (d) => filledPrompts(d) >= 1 },
    { key: 'prompt2', label: '2. soru-cevap', pts: 7, sec: 'prompts', ok: (d) => filledPrompts(d) >= 2 },
    { key: 'prompt3', label: '3. soru-cevap', pts: 7, sec: 'prompts', ok: (d) => filledPrompts(d) >= 3 },
    { key: 'intent', label: 'Ne aradığın', pts: 6, sec: 'bio', ok: (d) => !!d.intent },
    { key: 'opener', label: 'Açılış sorusu', pts: 6, sec: 'opener', ok: (d) => !!(d.opening_question || '').trim() },
    { key: 'department', label: 'Bölüm', pts: 6, sec: 'about', ok: (d) => !!(d.department || '').trim() },
    { key: 'age', label: 'Yaş', pts: 5, sec: 'about', ok: (d) => !!d.age },
    { key: 'height', label: 'Boy', pts: 5, sec: 'physical', ok: (d) => !!d.height },
    { key: 'body', label: 'Vücut yapısı', pts: 5, sec: 'physical', ok: (d) => !!d.body_type },
    { key: 'socials', label: 'Bir sosyal medya hesabı', pts: 5, sec: 'socials', ok: (d) => Object.values(d.socials || {}).some((v) => (v || '').trim()) },
    { key: 'eyes', label: 'Göz rengi', pts: 3, sec: 'physical', ok: (d) => !!d.eye_color },
    { key: 'hair', label: 'Saç rengi', pts: 3, sec: 'physical', ok: (d) => !!d.hair_color },
  ];
  function filledPrompts(d) { return (d.prompts || []).filter((p) => p.q && (p.a || '').trim()).length; }
  function computeCompleteness(d) {
    let percent = 0; const missing = [];
    for (const it of SCORE_ITEMS) { if (it.ok(d)) percent += it.pts; else missing.push(it); }
    return { percent, missing: missing.sort((a, b) => b.pts - a.pts) };
  }
  const labelOf = (list, id) => (list.find((x) => x.id === id) || {}).label || '';

  // ------------------------------------------------------------ profil sayfası
  function renderProfile() {
    const v = $('[data-view="profile"]');
    const M = state.meta; const u = state.user;
    const d = {
      nickname: u.nickname || '', avatar: u.avatar, avatar_color: u.avatar_color,
      first_name: u.first_name || '', last_name: u.last_name || '', age: u.age ?? '', department: u.department || '',
      gender: u.gender || '', looking_for: u.looking_for || 'herkes', intent: u.intent || '', bio: u.bio || '',
      interests: [...(u.interests || [])], prompts: [...(u.prompts || [])], socials: { ...(u.socials || {}) },
      friend_mode: !!u.friend_mode, opening_question: u.opening_question || '',
      height: u.height ?? '', body_type: u.body_type || '', eye_color: u.eye_color || '', hair_color: u.hair_color || '',
    };
    while (d.prompts.length < 3) d.prompts.push({ q: '', a: '' });
    const onboarding = !u.profile_done;
    let avTab = String(d.avatar).startsWith('m') ? 'm' : String(d.avatar).startsWith('f') ? 'f' : d.gender === 'erkek' ? 'm' : 'f';
    const avList = () => (avTab === 'm' ? M.avatarsMale : M.avatarsFemale);
    const pillGroup = (id, list, val) => `<div class="pills" id="${id}">${list.map((x) => `<button type="button" class="pill ${val === x.id ? 'on' : ''}" data-v="${x.id}">${esc(x.label)}</button>`).join('')}</div>`;

    v.innerHTML = `
      <div class="stack" style="padding-top:6px">
        ${onboarding ? `<div class="card hero-card"><h2>Anonim profilini oluştur</h2><p>Sadece cinsiyet zorunlu. Ne kadar doldurursan keşfette o kadar önde çıkarsın. Fotoğraf ve gerçek isim kimseye görünmez.</p></div>` : ''}

        <div class="card me-hero" id="p-summary"></div>

        <div class="card stack" data-sec="identity">
          <h3>${ic('ghost')} Anonim kimliğin</h3>
          <div class="row">
            <input class="input grow" id="p-nick" maxlength="30" placeholder="Takma ad" value="${esc(d.nickname)}">
            <button class="btn btn-icon" id="p-nick-rand" title="Rastgele takma ad">${ic('dice')}</button>
          </div>
          <div class="row" style="justify-content:space-between;margin-top:4px">
            <div class="section-title" style="margin:0">Avatar</div>
            <div class="seg neutral" id="p-avtab" style="width:180px">
              <button type="button" data-t="f" class="${avTab === 'f' ? 'on' : ''}">Kadın</button>
              <button type="button" data-t="m" class="${avTab === 'm' ? 'on' : ''}">Erkek</button>
            </div>
          </div>
          <div class="avatar-grid" id="p-avatar"></div>
          <div class="section-title" style="margin:6px 0 0">Kâğıt tonu</div>
          <div class="color-row" id="p-color">${M.avatarColors.map((c) => `<button type="button" data-c="${c}" style="background:${c}" class="${c === d.avatar_color ? 'on' : ''}" aria-label="${c}"></button>`).join('')}</div>
        </div>

        <div class="card stack" data-sec="real">
          <h3>${ic('lock')} Gerçek kimliğin <span class="opt">gizli</span></h3>
          <div class="note">${ic('shield', 'sm')}<span>Adın ve soyadın <b>keşfette, eşleşmede ve sohbette görünmez</b>. Sadece bir sohbette <b>karşılıklı kimlik açmayı</b> seçersen o kişiye gösterilir.</span></div>
          <div class="row">
            <label class="field grow">Ad<input class="input" id="p-first" maxlength="40" value="${esc(d.first_name)}" placeholder="İsteğe bağlı"></label>
            <label class="field grow">Soyad<input class="input" id="p-last" maxlength="40" value="${esc(d.last_name)}" placeholder="İsteğe bağlı"></label>
          </div>
        </div>

        <div class="card stack" data-sec="about">
          <h3>${ic('user')} Hakkında</h3>
          <label class="field">Cinsiyetin <span class="req">zorunlu</span>
            <div class="seg" id="p-gender">${M.genders.map((g) => `<button type="button" data-v="${g.id}" class="${d.gender === g.id ? 'on' : ''}">${esc(g.label)}</button>`).join('')}</div>
          </label>
          <div class="row">
            <label class="field" style="width:96px">Yaş<input class="input" id="p-age" type="number" min="17" max="80" value="${esc(d.age)}" placeholder="—"></label>
            <label class="field grow">Bölüm<input class="input" id="p-dept" list="dept-list" maxlength="80" value="${esc(d.department)}" placeholder="Seç ya da yaz"><datalist id="dept-list">${M.departments.map((x) => `<option value="${esc(x)}">`).join('')}</datalist></label>
          </div>
          <label class="field">Flört modunda kimleri görmek istersin?
            <div class="seg neutral" id="p-look">${M.lookingFor.map((g) => `<button type="button" data-v="${g.id}" class="${d.looking_for === g.id ? 'on' : ''}">${esc(g.label)}</button>`).join('')}</div>
          </label>
        </div>

        <div class="card stack" data-sec="physical">
          <h3>${ic('ruler')} Fiziksel özellikler <span class="opt">isteğe bağlı</span></h3>
          <label class="field">Boy
            <div class="input-suffix"><input class="input" id="p-height" type="number" inputmode="numeric" min="${M.heightRange.min}" max="${M.heightRange.max}" value="${esc(d.height)}" placeholder="Ör. 172"><span>cm</span></div>
          </label>
          <div class="field">Vücut yapısı ${pillGroup('p-body', M.bodyTypes, d.body_type)}</div>
          <div class="field">Göz rengi ${pillGroup('p-eyes', M.eyeColors, d.eye_color)}</div>
          <div class="field">Saç rengi ${pillGroup('p-hair', M.hairColors, d.hair_color)}</div>
        </div>

        <div class="card stack" data-sec="bio">
          <h3>${ic('sparkles')} Ne arıyorsun?</h3>
          ${pillGroup('p-intent', M.intents, d.intent)}
          <label class="field">Kendini anlat
            <textarea class="input" id="p-bio" maxlength="400" placeholder="Seni sen yapan şey ne? Kartında görünür.">${esc(d.bio)}</textarea>
            <div class="counter" id="p-bio-count"></div>
          </label>
          <div class="divider"></div>
          <div class="switch-row">
            <div class="txt"><b>Arkadaş modunda da görün</b><span>Ders arkadaşı, sohbet arkadaşı arayanların destesinde de çıkarsın. Bu modda cinsiyet tercihi uygulanmaz.</span></div>
            <label class="switch"><input type="checkbox" id="p-friend" ${d.friend_mode ? 'checked' : ''}><span class="slider"></span></label>
          </div>
        </div>

        <div class="card stack" data-sec="opener">
          <h3>${ic('msg')} Açılış sorusu</h3>
          <div class="muted small">Eşleştiğin herkese ilk mesaj olarak bu soru gider. Karşı taraf cevaplayarak sohbeti başlatır.</div>
          <input class="input" id="p-opener" maxlength="${M.limits.openerMax}" placeholder="Kendi sorunu yaz ya da aşağıdan seç" value="${esc(d.opening_question)}">
          <div class="pills" id="p-opener-sug">${M.openerSuggestions.map((q) => `<button type="button" class="pill" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
        </div>

        <div class="card stack" data-sec="interests">
          <h3>${ic('heart')} İlgi alanların <span class="opt">en fazla 12</span></h3>
          <div class="muted small">Ortak ilgi alanı olan kişiler sana daha önce gösterilir.</div>
          <div class="pills" id="p-interests">${M.interests.map((i) => `<button type="button" class="pill ${d.interests.includes(i) ? 'on' : ''}" data-v="${esc(i)}">${esc(i)}</button>`).join('')}</div>
        </div>

        <div class="card stack" data-sec="prompts">
          <h3>${ic('chat')} Sorular <span class="opt">en fazla 3</span></h3>
          <div class="muted small">Bir soru seç, kısa ve samimi cevapla. İnsanlar tek bir cevabını beğenip yorum yapabilir.</div>
          ${d.prompts.map((p, i) => `
            <div class="prompt-row">
              <select class="input" data-pi="${i}"><option value="">Soru seç…</option>${M.prompts.map((q) => `<option value="${esc(q)}" ${p.q === q ? 'selected' : ''}>${esc(q)}</option>`).join('')}</select>
              <input class="input" data-pa="${i}" maxlength="200" placeholder="Cevabın" value="${esc(p.a)}">
            </div>`).join('')}
        </div>

        <div class="card stack" data-sec="socials">
          <h3>${ic('lock')} Sosyal medya hesapların <span class="opt">gizli</span></h3>
          <div class="note">${ic('shield', 'sm')}<span>Profilinde asla görünmez. Sadece sohbette sen paylaşırsan ya da karşılıklı kimlik açtığınızda o kişiye gider.</span></div>
          ${M.socials.map((s) => `<div class="social-row">${siconHTML(s.id, '')}<input class="input" data-s="${s.id}" maxlength="60" placeholder="${esc(s.label)} – ${esc(s.placeholder)}" value="${esc(d.socials[s.id] || '')}"></div>`).join('')}
        </div>

        <div class="sticky-save"><button class="btn btn-primary btn-block" id="p-save">${onboarding ? 'Profili kaydet ve keşfetmeye başla' : 'Değişiklikleri kaydet'}</button></div>
        <div class="error center" id="p-err"></div>

        ${onboarding ? '' : `
        <div class="card stack" id="p-notify">
          <h3>${ic('bell')} Bildirimler ve uygulama</h3>
          <div class="muted small" id="p-push-status">Kontrol ediliyor…</div>
          <div class="row" style="flex-wrap:wrap" id="p-push-actions"></div>
          <div class="divider"></div>
          <div id="p-install"></div>
        </div>
        <div class="card stack">
          <h3>${ic('user')} Hesap</h3>
          <div class="muted small">Kullanıcı adı: <b style="color:var(--text)">${esc(u.username)}</b></div>
          <div class="row">
            <button class="btn grow" id="p-logout">${ic('logout', 'sm')} Çıkış yap</button>
            <button class="btn btn-danger grow" id="p-delete">${ic('trash', 'sm')} Hesabı sil</button>
          </div>
        </div>`}
      </div>`;

    // --- özet kartı (doluluk halkası + eksikler)
    const updateSummary = () => {
      const c = computeCompleteness(d);
      const lead = c.percent >= 100
        ? 'Profilin tamamen dolu. Keşfette en önde çıkanlardansın.'
        : `Profilin <b>%${c.percent}</b> dolu. Dolu profiller keşfette daha önde çıkar.`;
      $('#p-summary', v).innerHTML = `
        <div class="ring" style="--p:${c.percent}">${avatarHTML(d)}<span class="pct">%${c.percent}</span></div>
        <div class="who"><div class="nick">${esc(d.nickname || 'Takma adın')}</div><div class="lead">${lead}</div></div>
        ${c.missing.length ? `<div class="missing">${c.missing.slice(0, 6).map((m) => `<button type="button" data-sec="${m.sec}"><b>+%${m.pts}</b> ${esc(m.label)}</button>`).join('')}</div>` : ''}`;
    };
    $('#p-summary', v).onclick = (e) => {
      const b = e.target.closest('[data-sec]'); if (!b) return;
      const sec = $(`[data-sec="${b.dataset.sec}"].card`, v);
      if (sec) { sec.scrollIntoView({ behavior: 'smooth', block: 'center' }); sec.classList.remove('flash'); void sec.offsetWidth; sec.classList.add('flash'); }
    };

    // --- avatar
    const renderAvatars = () => {
      $('#p-avatar', v).innerHTML = avList().map((a) => `<button type="button" data-a="${a}" class="${a === d.avatar ? 'on' : ''}" style="--av:${esc(d.avatar_color)}"><img src="/avatars/${a}.svg" alt="" loading="lazy"></button>`).join('');
    };
    renderAvatars();
    $('#p-avtab', v).onclick = (e) => { const b = e.target.closest('[data-t]'); if (!b) return; avTab = b.dataset.t; $$('#p-avtab button', v).forEach((x) => x.classList.toggle('on', x === b)); renderAvatars(); };
    $('#p-avatar', v).onclick = (e) => { const b = e.target.closest('button'); if (!b) return; d.avatar = b.dataset.a; $$('#p-avatar button', v).forEach((x) => x.classList.toggle('on', x === b)); updateSummary(); };
    $('#p-color', v).onclick = (e) => { const b = e.target.closest('button'); if (!b) return; d.avatar_color = b.dataset.c; $$('button', e.currentTarget).forEach((x) => x.classList.toggle('on', x === b)); updateSummary(); };

    $('#p-nick', v).oninput = (e) => { d.nickname = e.target.value; updateSummary(); };
    $('#p-nick-rand', v).onclick = () => {
      const adj = ['Gizemli', 'Neşeli', 'Sessiz', 'Meraklı', 'Uykulu', 'Cesur', 'Hayalperest', 'Sabahçı', 'Esprili', 'Romantik', 'Sakin', 'Çılgın'];
      const noun = ['Panda', 'Penguen', 'Tilki', 'Kedi', 'Baykuş', 'Yunus', 'Koala', 'Kaplan', 'Kirpi', 'Ahtapot', 'Flamingo', 'Rakun'];
      d.nickname = `${adj[Math.random() * adj.length | 0]} ${noun[Math.random() * noun.length | 0]}`; $('#p-nick', v).value = d.nickname; updateSummary();
    };
    const seg = (id, key, after) => { $(id, v).onclick = (e) => { const b = e.target.closest('button'); if (!b) return; d[key] = b.dataset.v; $$('button', e.currentTarget).forEach((x) => x.classList.toggle('on', x === b)); after?.(); updateSummary(); }; };
    seg('#p-gender', 'gender', () => {
      // cinsiyet seçilince avatar sekmesi ona geçer (seçim zorunlu değil)
      avTab = d.gender === 'erkek' ? 'm' : 'f';
      $$('#p-avtab button', v).forEach((x) => x.classList.toggle('on', x.dataset.t === avTab)); renderAvatars();
    });
    seg('#p-look', 'looking_for');
    // tekli seçim, tekrar dokununca temizlenir
    const toggleGroup = (id, key) => { $(id, v).onclick = (e) => { const b = e.target.closest('button'); if (!b) return; d[key] = d[key] === b.dataset.v ? '' : b.dataset.v; $$('button', e.currentTarget).forEach((x) => x.classList.toggle('on', x.dataset.v === d[key])); updateSummary(); }; };
    toggleGroup('#p-intent', 'intent'); toggleGroup('#p-body', 'body_type'); toggleGroup('#p-eyes', 'eye_color'); toggleGroup('#p-hair', 'hair_color');
    const bioCount = () => { $('#p-bio-count', v).textContent = `${d.bio.length}/400`; };
    $('#p-bio', v).oninput = (e) => { d.bio = e.target.value; bioCount(); updateSummary(); }; bioCount();
    $('#p-friend', v).onchange = (e) => { d.friend_mode = e.target.checked; };
    $('#p-opener', v).oninput = (e) => { d.opening_question = e.target.value; updateSummary(); };
    $('#p-opener-sug', v).onclick = (e) => { const b = e.target.closest('[data-q]'); if (!b) return; d.opening_question = b.dataset.q; $('#p-opener', v).value = b.dataset.q; updateSummary(); };
    $('#p-interests', v).onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const val = b.dataset.v; const i = d.interests.indexOf(val);
      if (i >= 0) d.interests.splice(i, 1);
      else if (d.interests.length >= 12) return toast('En fazla 12 ilgi alanı seçebilirsin.');
      else d.interests.push(val);
      b.classList.toggle('on', d.interests.includes(val)); updateSummary();
    };
    $$('[data-pi]', v).forEach((s) => s.onchange = (e) => { d.prompts[+e.target.dataset.pi].q = e.target.value; updateSummary(); });
    $$('[data-pa]', v).forEach((s) => s.oninput = (e) => { d.prompts[+e.target.dataset.pa].a = e.target.value; updateSummary(); });
    $$('[data-s]', v).forEach((s) => s.oninput = (e) => { d.socials[e.target.dataset.s] = e.target.value; updateSummary(); });
    const simple = { '#p-first': 'first_name', '#p-last': 'last_name', '#p-age': 'age', '#p-dept': 'department', '#p-height': 'height' };
    for (const [sel, key] of Object.entries(simple)) $(sel, v).oninput = (e) => { d[key] = e.target.value; updateSummary(); };
    updateSummary();

    $('#p-save', v).onclick = async () => {
      const btn = $('#p-save', v); const errEl = $('#p-err', v); errEl.textContent = '';
      if (!d.gender) { errEl.textContent = 'Cinsiyet seçimi zorunlu.'; $('#p-gender', v).scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      btn.disabled = true;
      try {
        const body = { ...d, prompts: d.prompts.filter((p) => p.q && p.a.trim()), height: d.height === '' ? null : Number(d.height) };
        const r = await api('/profile', { method: 'PUT', body });
        const first = !state.user.profile_done;
        state.user = r.user;
        toast(`Profil kaydedildi. Doluluk %${r.user.completeness?.percent ?? computeCompleteness(d).percent}.`, 'ok');
        state.candidates = [];
        if (first) { await loadMatches(); showView('discover'); } else updateSummary();
      } catch (ex) { errEl.textContent = ex.message; } finally { btn.disabled = false; }
    };
    const lo = $('#p-logout', v); if (lo) lo.onclick = logout;
    const del = $('#p-delete', v); if (del) del.onclick = async () => {
      if (!await confirmSheet('Hesabı sil', 'Profilin, eşleşmelerin ve mesajların kalıcı olarak silinir. Bu işlem geri alınamaz.', 'Evet, sil', true)) return;
      try { await api('/me', { method: 'DELETE' }); toast('Hesabın silindi.'); state.user = null; stopPolling(); renderTopbar(); showView('auth'); }
      catch (ex) { fail(ex); }
    };
    if (!onboarding) renderNotifyCard();
  }

  async function renderNotifyCard() {
    const st = $('#p-push-status'); const acts = $('#p-push-actions'); const inst = $('#p-install');
    if (!st) return;
    const s = await pushStatus();
    if (!$('#p-push-status')) return;
    const texts = {
      on: 'Bildirimler açık. Yeni mesaj ve eşleşmelerde haber vereceğiz.',
      off: 'Yeni eşleşme ve mesajları kaçırmamak için bildirimleri aç.',
      denied: 'Bildirim izni bu tarayıcıda engellenmiş. Tarayıcı ayarlarından site iznini açabilirsin.',
      unsupported: state.meta.push?.enabled
        ? (isIOS() && !isStandalone() ? 'iPhone\'da bildirim almak için önce siteyi ana ekrana ekle (aşağıya bak).' : 'Bu tarayıcı bildirimleri desteklemiyor.')
        : 'Bildirimler sunucuda henüz ayarlanmadı.',
    };
    st.textContent = texts[s];
    acts.innerHTML = s === 'on'
      ? `<button class="btn btn-sm" id="pn-test">${ic('bell', 'sm')} Test bildirimi</button><button class="btn btn-sm btn-ghost" id="pn-off">Kapat</button>`
      : s === 'off' ? `<button class="btn btn-sm btn-primary" id="pn-on">${ic('bell', 'sm')} Bildirimleri aç</button>` : '';
    const on = $('#pn-on'); if (on) on.onclick = async () => { await enablePush(); renderNotifyCard(); };
    const off = $('#pn-off'); if (off) off.onclick = async () => { await disablePush(); renderNotifyCard(); };
    const test = $('#pn-test'); if (test) test.onclick = async () => { try { await api('/push/test', { body: {} }); toast('Test bildirimi gönderildi.', 'ok'); } catch (ex) { fail(ex); } };

    if (isStandalone()) inst.innerHTML = `<div class="muted small">Uygulama olarak açıksın.</div>`;
    else if (state.installPrompt) {
      inst.innerHTML = `<button class="btn btn-sm" id="pn-install">${ic('download', 'sm')} Telefona uygulama olarak yükle</button>`;
      $('#pn-install').onclick = async () => { const p = state.installPrompt; state.installPrompt = null; p.prompt(); await p.userChoice.catch(() => {}); renderNotifyCard(); };
    } else if (isIOS()) inst.innerHTML = `<div class="muted small">Uygulama gibi kullanmak için Safari'de <b>Paylaş</b> düğmesine, sonra <b>Ana Ekrana Ekle</b>'ye dokun.</div>`;
    else inst.innerHTML = `<div class="muted small">Tarayıcı menüsünden <b>Uygulamayı yükle</b> / <b>Ana ekrana ekle</b> ile telefonuna kurabilirsin.</div>`;
  }

  // ------------------------------------------------------------ profil kartı (ortak)
  function profileCardHTML(p, shared = [], { interactive = false } = {}) {
    const M = state.meta;
    const sharedSet = new Set(shared);
    const interests = p.interests || [];
    const prompts = p.prompts || [];
    const likeBtn = (target) => (interactive ? `<button class="part-like" data-like="${esc(target)}" title="Bunu beğen ve yorum yap">${ic('heart')}</button>` : '');
    const lm = p.likedMe;
    const info = [
      `<span>${ic('cap')} ${esc(p.department || 'Ankara Medipol')}</span>`,
      p.age ? `<span>${ic('calendar')} ${esc(p.age)}</span>` : '',
      p.intent ? `<span class="soft">${esc(intentLabel(p.intent))}</span>` : '',
    ].join('');
    const facts = [
      p.height ? ['Boy', `${p.height} cm`] : null,
      p.body_type ? ['Vücut yapısı', labelOf(M.bodyTypes, p.body_type)] : null,
      p.eye_color ? ['Göz', labelOf(M.eyeColors, p.eye_color)] : null,
      p.hair_color ? ['Saç', labelOf(M.hairColors, p.hair_color)] : null,
    ].filter(Boolean);
    const myPct = state.user?.completeness?.percent;
    return `
      <div class="card-hero">
        <div class="chips-top">
          <span>${shared.length ? `<span class="chip-dark accent">${ic('sparkles')} ${shared.length} ortak ilgi</span>` : ''}</span>
          ${interactive ? `<button class="chip-dark" data-act="edit-profile" title="Profilini düzenle">${ic('pencil')} Profilim${myPct != null ? ` %${myPct}` : ''}</button>` : ''}
        </div>
        ${p.topPick ? `<span class="pick-ribbon">${ic('star', 'fill')} Günün en uyumlusu</span>` : ''}
        <div class="avatar-wrap">${avatarHTML(p, 'xl')}${p.online ? '<span class="online" title="Çevrimiçi"></span>' : ''}</div>
        <div class="name">${esc(displayName(p))}</div>
        <div class="info-row">${info}</div>
      </div>
      <div class="card-body">
        ${lm ? `<div class="liked-banner ${lm.super ? 'super' : ''}">
          <div class="lb-title">${lm.super ? `${ic('star', 'fill')} Seni süper beğendi` : `${ic('msg')} Sana yorum yaptı`}</div>
          ${lm.comment ? `${lm.target ? `<div class="lb-quote">“${esc(lm.target)}” için</div>` : ''}<div class="lb-text">${esc(lm.comment)}</div>` : ''}
        </div>` : ''}
        ${p.bio ? `<div class="likeable"><div class="section-title">Hakkında</div><div class="bio">${esc(p.bio)}</div>${likeBtn('Hakkında')}</div>` : ''}
        ${facts.length ? `<div><div class="section-title">Fiziksel</div><div class="facts">${facts.map(([k, val]) => `<div class="fact"><small>${esc(k)}</small><b>${esc(val)}</b></div>`).join('')}</div></div>` : ''}
        ${p.daily?.answer ? `<div class="qa daily likeable"><div class="q">${ic('sun', 'sm')} Günün sorusu: ${esc(state.daily?.question || '')}</div><div class="a">${esc(p.daily.answer)}</div>${likeBtn('Günün sorusu')}</div>` : ''}
        ${p.daily?.locked && interactive ? `<div class="qa locked"><div><div class="q">${ic('lock', 'sm')} Günün sorusunu cevapladı</div><div class="small muted">Görmek için sen de cevapla.</div></div><button class="btn btn-sm" data-act="daily">Cevapla</button></div>` : ''}
        ${interests.length ? `<div><div class="section-title">İlgi alanları</div><div class="pills">${interests.map((i) => `<span class="pill ${sharedSet.has(i) ? 'shared' : ''}">${sharedSet.has(i) ? ic('check', 'sm') : ''}${esc(i)}</span>`).join('')}</div></div>` : ''}
        ${prompts.map((q) => `<div class="qa likeable"><div class="q">${esc(q.q)}</div><div class="a">${esc(q.a)}</div>${likeBtn(q.q)}</div>`).join('')}
        ${!p.bio && !interests.length && !prompts.length && !p.daily?.answer && !facts.length ? `<div class="muted center" style="padding:20px 0">Bu kişi gizemli kalmayı seçmiş.</div>` : ''}
      </div>`;
  }

  // ------------------------------------------------------------ günün sorusu
  async function openDailySheet() {
    let d;
    try { d = await api('/daily'); } catch (ex) { return fail(ex); }
    const el = openModal(`
      <div class="sheet-title" style="display:flex;align-items:center;gap:8px">${ic('sun')} Günün sorusu</div>
      <p style="margin:0 0 12px;font-weight:700;font-size:17px">${esc(d.question)}</p>
      <div class="stack">
        <textarea class="input" id="dq-a" maxlength="${state.meta.limits.dailyAnswerMax}" placeholder="Cevabın (herkesle değil, sadece cevaplayanlarla görünür)">${esc(d.answer || '')}</textarea>
        <div class="muted small">Cevabın kartında ve sohbetlerinde görünür. Başkalarının cevabını görmek için senin de cevaplaman gerekir. Her gün yeni soru.</div>
        <button class="btn btn-primary" id="dq-save">${d.answer ? 'Cevabı güncelle' : 'Cevapla'}</button>
      </div>`);
    $('#dq-a', el).focus();
    $('#dq-save', el).onclick = async () => {
      try {
        await api('/daily', { body: { answer: $('#dq-a', el).value } });
        closeModal(); toast('Cevabın kaydedildi.', 'ok');
        state.daily = { ...(state.daily || {}), question: d.question, answered: true };
        if (state.view === 'discover') { state.candidates = []; renderDiscover(); }
        else if (state.view === 'chat' && state.chat) openChat(state.chat.matchId);
      } catch (ex) { fail(ex); }
    };
  }

  // ------------------------------------------------------------ keşfet
  async function loadCandidates() {
    if (state.discoverLoading) return;
    state.discoverLoading = true;
    try {
      const r = await api('/discover?mode=' + state.mode);
      state.limits = r.limits; state.daily = r.daily;
      state.discoverFlags = { needsFriendMode: !!r.needsFriendMode };
      const ids = new Set(state.candidates.map((c) => c.id));
      for (const c of r.candidates) if (!ids.has(c.id)) state.candidates.push(c);
    } catch (ex) { fail(ex); }
    finally { state.discoverLoading = false; }
  }

  async function renderDiscover() {
    const v = $('[data-view="discover"]');
    if (!state.user.profile_done) return showView('profile');
    if (!state.candidates.length) {
      v.innerHTML = `${discoverHeadHTML()}<div class="spinner"></div>`;
      bindDiscoverHead(v);
      await loadCandidates();
      if (state.view !== 'discover') return;
    }
    renderDeck();
  }

  function discoverHeadHTML() {
    const done = state.daily?.answered;
    return `<div class="discover-head">
      <div class="seg" id="d-mode">
        <button data-m="date" class="${state.mode === 'date' ? 'on' : ''}">${ic('person')} Flört</button>
        <button data-m="friend" class="${state.mode === 'friend' ? 'on' : ''}">${ic('users')} Arkadaş</button>
      </div>
      <button class="daily-pill ${done ? 'done' : ''}" id="d-daily">${ic('sun')} Günün sorusu ${done ? ic('check', 'sm') : '<span class="dot-new"></span>'}</button>
    </div>`;
  }
  function bindDiscoverHead(v) {
    $('#d-mode', v).onclick = (e) => {
      const b = e.target.closest('[data-m]'); if (!b || b.dataset.m === state.mode) return;
      state.mode = b.dataset.m; store.set('md_mode', state.mode);
      state.candidates = []; state.lastSwipe = null; renderDiscover();
    };
    $('#d-daily', v).onclick = openDailySheet;
  }

  function renderDeck() {
    const v = $('[data-view="discover"]');
    const L = state.limits || { likesLeft: 0, superLeft: 0 };
    if (state.discoverFlags.needsFriendMode && state.mode === 'friend') {
      v.innerHTML = `${discoverHeadHTML()}<div class="empty"><div class="glyph">${ic('users')}</div><h2>Arkadaş modu</h2><p>Kampüste ders arkadaşı, kahve arkadaşı, sohbet arkadaşı ara. Flört baskısı yok; cinsiyet tercihi uygulanmaz. Bu modda görünmek için açman yeterli.</p><button class="btn btn-primary" id="d-friend-on">${ic('users', 'sm')} Arkadaş modunu aç</button></div>`;
      bindDiscoverHead(v);
      $('#d-friend-on', v).onclick = async () => {
        try { const r = await api('/profile', { method: 'PUT', body: profileBody({ friend_mode: true }) }); state.user = r.user; state.candidates = []; toast('Arkadaş modu açıldı.', 'ok'); renderDiscover(); }
        catch (ex) { fail(ex); }
      };
      return;
    }
    if (!state.candidates.length) {
      v.innerHTML = `${discoverHeadHTML()}<div class="empty"><div class="glyph">${ic('ghost')}</div><h2>Şimdilik kimse yok</h2><p>Yeni öğrenciler katıldıkça burada görünecek. ${state.mode === 'date' ? 'Arkadaş moduna da göz atabilirsin.' : ''}</p>
        <div class="row"><button class="btn btn-primary" id="d-refresh">${ic('refresh', 'sm')} Yenile</button>${state.lastSwipe ? `<button class="btn" id="d-undo2">${ic('undo', 'sm')} Geri al</button>` : ''}</div></div>`;
      bindDiscoverHead(v);
      $('#d-refresh', v).onclick = async () => { await loadCandidates(); renderDeck(); };
      const u2 = $('#d-undo2', v); if (u2) u2.onclick = undoSwipe;
      return;
    }
    const top3 = state.candidates.slice(0, 3);
    v.innerHTML = `
      ${discoverHeadHTML()}
      <div class="deck-wrap">
        <div class="deck" id="deck">
          ${top3.map((c, i) => `
            <article class="swipe-card ${i === 1 ? 'behind' : i === 2 ? 'behind2' : ''}" data-id="${c.id}" style="z-index:${10 - i}">
              ${i === 0 ? `<div class="stamp like">BEĞEN</div><div class="stamp nope">GEÇ</div><div class="stamp super">SÜPER</div>` : ''}
              ${profileCardHTML(c, c.sharedInterests, { interactive: i === 0 })}
            </article>`).reverse().join('')}
        </div>
        <div class="deck-actions">
          <button class="btn btn-icon small" id="d-undo" title="Geri al" ${state.lastSwipe ? '' : 'disabled'}>${ic('undo')}</button>
          <button class="btn btn-icon pass" id="d-pass" title="Geç">${ic('x')}</button>
          <button class="btn btn-icon super" id="d-super" title="Süper beğen" ${L.superLeft > 0 ? '' : 'disabled'}>${ic('star')}</button>
          <button class="btn btn-icon like" id="d-like" title="Beğen" ${L.likesLeft > 0 ? '' : 'disabled'}>${ic('heart')}</button>
          <button class="btn btn-icon small" id="d-more" title="Daha fazla">${ic('more')}</button>
        </div>
        <div class="limits-line">Bugün <b>${L.likesLeft}</b> beğeni · <b>${L.superLeft}</b> süper beğeni hakkın kaldı</div>
      </div>`;
    bindDiscoverHead(v);
    const topCard = $(`.swipe-card[data-id="${top3[0].id}"]`, v);
    attachSwipe(topCard);
    topCard.addEventListener('click', (e) => {
      const lb = e.target.closest('[data-like]');
      if (lb) return openLikeSheet(top3[0], lb.dataset.like);
      if (e.target.closest('[data-act="daily"]')) openDailySheet();
      if (e.target.closest('[data-act="edit-profile"]')) showView('profile');
    });
    $('#d-pass', v).onclick = () => decide('pass');
    $('#d-like', v).onclick = () => decide('like');
    $('#d-super', v).onclick = () => decide('like', { super: true });
    $('#d-undo', v).onclick = undoSwipe;
    $('#d-more', v).onclick = () => {
      const c = state.candidates[0];
      const el = openModal(`<div class="sheet-title">${esc(displayName(c))}</div><div class="list">
        <button class="btn" data-x="report">${ic('flag', 'sm')} Şikayet et</button>
        <button class="btn btn-danger" data-x="block">${ic('ban', 'sm')} Engelle</button>
        <button class="btn btn-ghost" data-x="close">Kapat</button></div>`);
      el.onclick = async (e) => {
        const b = e.target.closest('[data-x]'); if (!b) return; closeModal();
        if (b.dataset.x === 'report') return reportUser(c);
        if (b.dataset.x === 'block' && await confirmSheet('Engelle', 'Bu kişi seni bir daha göremez, sen de onu.', 'Engelle', true)) {
          try { await api('/block', { body: { userId: c.id } }); state.candidates.shift(); state.lastSwipe = null; renderDeck(); toast('Engellendi.'); } catch (ex) { fail(ex); }
        }
      };
    };
  }

  /** Bir cevabı / biyografiyi beğen ve isteğe bağlı yorum yaz (Hinge). */
  function openLikeSheet(c, target) {
    const L = state.limits || {};
    let quote = '';
    if (target === 'Hakkında') quote = c.bio || '';
    else if (target === 'Günün sorusu') quote = c.daily?.answer || '';
    else quote = (c.prompts || []).find((p) => p.q === target)?.a || '';
    const el = openModal(`
      <div class="sheet-title">${esc(displayName(c))} – ${esc(target)}</div>
      <div class="qa" style="margin-bottom:12px"><div class="a">${esc(quote)}</div></div>
      <div class="stack">
        <textarea class="input" id="lk-c" maxlength="${state.meta.limits.commentMax}" placeholder="Bir yorum ekle (isteğe bağlı). Eşleşirseniz sohbetin ilk mesajı olur."></textarea>
        <div class="row">
          <button class="btn grow super-btn" id="lk-super" ${L.superLeft > 0 ? '' : 'disabled'} style="color:var(--info)">${ic('star', 'sm')} Süper beğen</button>
          <button class="btn btn-primary grow" id="lk-like" ${L.likesLeft > 0 ? '' : 'disabled'}>${ic('heart', 'sm')} Beğen</button>
        </div>
        <div class="muted small center">Bugün ${L.likesLeft} beğeni · ${L.superLeft} süper beğeni hakkın var.</div>
      </div>`);
    $('#lk-c', el).focus();
    const go = (isSuper) => { const comment = $('#lk-c', el).value.trim(); closeModal(); decide('like', { super: isSuper, comment, target }); };
    $('#lk-like', el).onclick = () => go(false);
    $('#lk-super', el).onclick = () => go(true);
  }

  function attachSwipe(card) {
    if (!card) return;
    let startX = 0, startY = 0, dx = 0, dy = 0, active = false;
    const like = $('.stamp.like', card), nope = $('.stamp.nope', card);
    card.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button')) return; // kart içindeki butonlar sürüklemeyi başlatmaz
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
  async function decide(action, opts = {}) {
    if (deciding || !state.candidates.length) return;
    const L = state.limits || {};
    const c = state.candidates[0];
    const card = $(`.swipe-card[data-id="${c.id}"]`);
    const resetCard = () => { if (card) { card.style.transform = ''; card.classList.remove('dragging', 'fly-left', 'fly-right', 'fly-up'); $$('.stamp', card).forEach((s) => { s.style.opacity = 0; }); } };
    if (action === 'like' && L.likesLeft <= 0) { resetCard(); return toast('Bugünkü beğeni hakkın bitti. Gece yarısı yenilenir.', 'err'); }
    if (opts.super && L.superLeft <= 0) { resetCard(); return toast('Bugünkü süper beğenini kullandın.', 'err'); }
    deciding = true;
    try {
      const r = await withConfirm((confirmed) => api('/swipe', {
        body: { to: c.id, action, mode: state.mode, super: !!opts.super, comment: opts.comment || undefined, target: opts.target || undefined, confirmed },
      }));
      if (card) {
        card.classList.remove('dragging'); card.style.transform = '';
        if (opts.super) $('.stamp.super', card).style.opacity = 1;
        card.classList.add(opts.super ? 'fly-up' : action === 'like' ? 'fly-right' : 'fly-left');
      }
      state.limits = r.limits;
      state.lastSwipe = r.matched ? null : { id: c.id, mode: state.mode };
      state.candidates.shift();
      setTimeout(() => { renderDeck(); deciding = false; }, 230);
      if (opts.super) toast('Süper beğeni gönderildi.', 'ok');
      else if (opts.comment) toast('Yorumun gönderildi. Eşleşirseniz sohbetin ilk mesajı olacak.', 'ok');
      if (state.candidates.length < 3) loadCandidates().then(() => { if (state.view === 'discover' && state.candidates.length <= 3) renderDeck(); });
      if (r.matched) { await loadMatches(); showMatchModal(r.match); }
    } catch (ex) {
      deciding = false;
      if (ex.data?.limits) state.limits = ex.data.limits;
      fail(ex); renderDeck();
    }
  }

  async function undoSwipe() {
    const last = state.lastSwipe; if (!last) return;
    try {
      const r = await api('/swipe/undo', { body: { to: last.id, mode: last.mode } });
      state.lastSwipe = null; state.limits = r.limits;
      if (r.candidate && last.mode === state.mode) state.candidates = [r.candidate, ...state.candidates.filter((c) => c.id !== r.candidate.id)];
      toast('Geri alındı.', 'ok');
      renderDeck();
    } catch (ex) { state.lastSwipe = null; fail(ex); renderDeck(); }
  }

  function showMatchModal(match) {
    const other = match.user;
    const friend = match.mode === 'friend';
    const el = openModal(`
      <div class="match-modal">
        <h2>${friend ? 'arkadaşsınız' : 'eşleştiniz'}<em>.</em></h2>
        <div class="pair">${avatarHTML(state.user, 'lg')}${avatarHTML(other, 'lg')}</div>
        <p class="muted">Sen ve <b>${esc(displayName(other))}</b> birbirinizi beğendiniz. ${state.meta.limits.matchHours} saat içinde biri yazmazsa eşleşme sona erer.</p>
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
      catch (ex) { fail(ex); }
    };
  }

  // ------------------------------------------------------------ eşleşmeler
  async function loadMatches() {
    try { state.matches = (await api('/matches')).matches; updateUnreadBadge(); }
    catch (ex) { fail(ex); }
  }

  function gameLabel(p) {
    return ({ ttl: '2 doğru 1 yalan', tot: 'Bu mu o mu', question: `Soru: ${p.q || ''}`, ttl_answer: 'Tahminini yaptı', tot_answer: 'Seçimini yaptı' })[p.kind] || 'Oyun';
  }
  function previewOf(m) {
    const lm = m.lastMessage;
    if (!lm) return 'Yeni eşleşme – ilk mesajı sen at!';
    const who = lm.mine ? 'Sen: ' : '';
    const p = parse(lm.body);
    switch (lm.type) {
      case 'system': return lm.body;
      case 'social': return lm.mine ? 'Sosyal medya paylaştın' : 'Sosyal medya paylaştı';
      case 'opener': return (lm.mine ? 'Açılış sorun: ' : 'Açılış sorusu: ') + (p.q || '');
      case 'comment': return who + (p.comment || '');
      case 'game': return who + gameLabel(p);
      case 'reveal': return p.kind === 'done' ? 'Kimlikler açıldı' : lm.mine ? 'Kimliğini açmaya hazırsın' : 'Kimliğini açmaya hazır';
      default: return who + lm.body;
    }
  }

  async function renderMatches() {
    const v = $('[data-view="matches"]');
    if (!state.matches.length) v.innerHTML = `<div class="spinner"></div>`;
    await loadMatches();
    if (state.view !== 'matches') return;
    if (!state.matches.length) {
      v.innerHTML = `<div class="empty"><div class="glyph">${ic('chat')}</div><h2>Henüz eşleşmen yok</h2><p>Keşfet'te beğendiğin biri seni de beğenince burada görünür.</p><button class="btn btn-primary" id="m-go">Keşfet'e git</button></div>`;
      $('#m-go', v).onclick = () => showView('discover'); return;
    }
    const t = Date.now();
    const fresh = state.matches.filter((m) => m.expiresAt);
    const turn = state.matches.filter((m) => !m.expiresAt && m.yourTurn).sort((a, b) => (a.waitingSince || 0) - (b.waitingSince || 0));
    const rest = state.matches.filter((m) => !m.expiresAt && !m.yourTurn);
    const item = (m) => {
      const lm = m.lastMessage;
      return `<button class="match-item" data-id="${m.matchId}">
        ${avatarHTML(m.user)}
        <div class="meta">
          <div class="name">${esc(displayName(m.user))} ${m.user.online ? '<span class="dot" title="Çevrimiçi"></span>' : ''}
            ${m.mode === 'friend' ? '<span class="tag-mini friend">Arkadaş</span>' : ''} ${m.yourTurn ? '<span class="tag-mini turn">Sıra sende</span>' : ''}</div>
          <div class="preview ${m.unread ? 'unread' : ''}">${esc(previewOf(m))}</div>
        </div>
        <div class="stack" style="align-items:flex-end;gap:4px">
          ${m.expiresAt ? `<span class="timer">${ic('clock')} ${fmtLeft(m.expiresAt - t)}</span>` : `<span class="time">${fmtTime(lm ? lm.at : m.matchedAt)}</span>`}
          ${m.unread ? `<span class="badge-count">${m.unread}</span>` : ''}
        </div>
      </button>`;
    };
    const pushOff = pushSupported() && (await pushStatus()) === 'off';
    if (state.view !== 'matches') return;
    v.innerHTML = `<div class="stack" style="padding-top:8px">
      <div class="page-title">sohbet<span style="color:var(--accent)">.</span></div>
      ${pushOff ? `<div class="card push-card"><span class="fi">${ic('bell')}</span><div class="grow"><b>Yeni mesajları kaçırma</b><div class="small muted">Eşleşmeler ${state.meta.limits.matchHours} saatte düşüyor. Bildirimleri aç, hemen haberin olsun.</div></div><button class="btn btn-sm btn-primary" id="m-push">Aç</button></div>` : ''}
      ${fresh.length ? `<div><div class="section-title">Yeni eşleşmeler · ${state.meta.limits.matchHours} saat içinde yaz</div><div class="new-row">${fresh.map((m) => `<button data-id="${m.matchId}">${avatarHTML(m.user)}<span>${esc(displayName(m.user))}</span><span class="timer">${ic('clock')} ${fmtLeft(m.expiresAt - t)}</span></button>`).join('')}</div></div>` : ''}
      ${turn.length ? `<div><div class="section-title">Sıra sende · ${turn.length}</div><div class="match-list">${turn.map(item).join('')}</div></div>` : ''}
      ${rest.length || fresh.length ? `<div><div class="section-title">Tüm sohbetler</div><div class="match-list">${[...fresh, ...rest].map(item).join('')}</div></div>` : ''}
    </div>`;
    $$('[data-id]', v).forEach((b) => b.onclick = () => openChat(+b.dataset.id));
    const mp = $('#m-push', v); if (mp) mp.onclick = async () => { if (await enablePush()) renderMatches(); };
  }

  // ------------------------------------------------------------ sohbet
  async function openChat(matchId) {
    state.chat = { matchId, messages: [], other: null, shared: {}, info: null, hasMore: false, loading: true };
    showView('chat');
    try {
      const r = await api(`/matches/${matchId}/messages`);
      Object.assign(state.chat, { messages: r.messages, other: r.other, shared: r.shared, info: r.info, hasMore: r.hasMore, loading: false });
      const m = state.matches.find((x) => x.matchId === matchId); if (m) { m.unread = 0; updateUnreadBadge(); }
      renderChat(); scrollChatBottom();
    } catch (ex) { fail(ex); state.chat = null; showView('matches'); }
  }

  function chatStripsHTML(c) {
    const o = c.other; const info = c.info || {};
    const out = [];
    if (info.expiresAt) {
      out.push(`<div class="chat-strip expire">${ic('clock')}<div class="grow">Yeni eşleşme! <b>${fmtLeft(info.expiresAt - Date.now())}</b> içinde kimse yazmazsa sona erer.</div></div>`);
    }
    const rv = info.reveal || {};
    if (!rv.done && rv.theirs && !rv.mine) {
      out.push(`<div class="chat-strip reveal">${ic('unlock')}<div class="grow"><b>${esc(displayName(o))}</b> kimliğini açmaya hazır. Sen de hazırsan ikiniz aynı anda görünürsünüz.</div><button class="btn btn-sm btn-primary" data-act="reveal">Ben de</button></div>`);
    } else if (!rv.done && rv.mine) {
      out.push(`<div class="chat-strip reveal">${ic('unlock')}<div class="grow small">Kimliğini açmaya hazır olduğunu bildirdin. Karşı taraf da hazır olunca seçtiğin bilgiler aynı anda açılır.</div></div>`);
    }
    const d = info.daily;
    if (d && (d.mine || d.theirs || d.theirsLocked)) {
      let inner;
      if (d.theirsLocked) inner = `<b>${esc(displayName(o))}</b> günün sorusunu cevapladı. Görmek için sen de cevapla.`;
      else inner = `<b>${esc(d.question)}</b><div class="daily-answers">${d.mine ? `<div><span>Sen:</span> ${esc(d.mine)}</div>` : ''}${d.theirs ? `<div><span>${esc(displayName(o))}:</span> ${esc(d.theirs)}</div>` : `<div class="muted">${esc(displayName(o))} henüz cevaplamadı.</div>`}</div>`;
      out.push(`<div class="chat-strip">${ic('sun')}<div class="grow small">${inner}</div>${d.theirsLocked ? '<button class="btn btn-sm" data-act="daily">Cevapla</button>' : ''}</div>`);
    }
    const sharedByThem = c.shared[o.id] || {}; const sharedByMe = c.shared[state.user.id] || {};
    if (Object.keys(sharedByThem).length || Object.keys(sharedByMe).length) {
      out.push(`<div class="shared-bar"><span class="lbl">Paylaşılan hesaplar</span>
        ${Object.entries(sharedByThem).map(([p, h]) => { const l = socialLink(p, h); return `<span class="pill">${siconHTML(p, 'brand sm')} ${l ? `<a href="${esc(l)}" target="_blank" rel="noopener">${esc(h)}</a>` : esc(h)}</span>`; }).join('')}
        ${Object.entries(sharedByMe).map(([p, h]) => `<span class="pill muted" title="Sen paylaştın">${siconHTML(p, 'sm')} ${esc(h)} ${ic('check', 'sm')}</span>`).join('')}
      </div>`);
    }
    return out.join('');
  }

  function renderChat() {
    const v = $('[data-view="chat"]');
    const c = state.chat; if (!c) return showView('matches');
    if (c.loading) { v.innerHTML = `<div class="chat"><div class="spinner"></div></div>`; return; }
    const o = c.other;
    const keep = $('#c-input')?.value || '';
    v.innerHTML = `
      <div class="chat">
        <div class="chat-head">
          <button class="btn btn-ghost btn-icon" id="c-back" title="Geri">${ic('back')}</button>
          ${avatarHTML(o)}
          <div class="grow">
            <div class="name">${esc(displayName(o))} ${c.info?.mode === 'friend' ? '<span class="tag-mini friend">Arkadaş</span>' : ''}</div>
            <div class="status" id="c-status">${o.online ? '<span class="dot"></span> Çevrimiçi' : o.last_seen ? 'Son görülme ' + fmtTime(o.last_seen) : ''}</div>
          </div>
          <button class="btn btn-ghost btn-icon" id="c-profile" title="Profili gör">${ic('user')}</button>
          <button class="btn btn-ghost btn-icon" id="c-menu" title="Daha fazla">${ic('more')}</button>
        </div>
        <div id="c-strips">${chatStripsHTML(c)}</div>
        <div class="chat-body" id="c-body">
          ${c.hasMore ? `<button class="btn btn-sm load-more" id="c-more">Önceki mesajlar</button>` : ''}
          ${c.messages.map(messageHTML).join('')}
        </div>
        <div class="typing" id="c-typing"></div>
        <div class="chat-compose">
          <button class="btn btn-icon" id="c-plus" title="Paylaş, kimlik aç, oyun oyna">${ic('plus')}</button>
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
        } catch (ex) { fail(ex); }
      };
    };
    // şerit ve mesaj kartlarındaki düğmeler
    v.querySelector('.chat').addEventListener('click', onChatAction);
    const input = $('#c-input', v);
    input.value = keep;
    const autosize = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; };
    input.oninput = () => {
      autosize();
      if (input.value.trim() && Date.now() - state.typingSentAt > 2500) {
        state.typingSentAt = Date.now();
        api(`/matches/${c.matchId}/typing`, { body: {} }).catch(() => {});
      }
    };
    input.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
    $('#c-send', v).onclick = sendMessage;
    $('#c-plus', v).onclick = openChatActions;
    const more = $('#c-more', v);
    if (more) more.onclick = async () => {
      const oldest = c.messages[0]?.id; if (!oldest) return;
      try {
        const r = await api(`/matches/${c.matchId}/messages?before=${oldest}`);
        c.messages = [...r.messages, ...c.messages]; c.hasMore = r.hasMore;
        const body = $('#c-body'); const prevH = body.scrollHeight; renderChat(); const nb = $('#c-body'); nb.scrollTop = nb.scrollHeight - prevH;
      } catch (ex) { fail(ex); }
    };
    if (window.matchMedia('(min-width: 700px)').matches) setTimeout(() => input.focus({ preventScroll: true }), 50);
  }

  function onChatAction(e) {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act;
    if (act === 'reveal') openRevealSheet();
    else if (act === 'daily') openDailySheet();
    else if (act === 'reply') { const i = $('#c-input'); i.focus(); }
    else if (act === 'answer') answerGame(Number(b.dataset.mid), Number(b.dataset.choice));
  }

  // ---- mesaj çizimi
  const meId = () => state.user.id;
  const nameOf = (uid) => (uid === meId() ? 'Sen' : displayName(state.chat?.other || { nickname: '' }));

  function messageHTML(m) {
    const mine = m.sender_id === meId();
    const side = mine ? 'mine' : 'theirs';
    const p = m.type === 'text' || m.type === 'system' ? null : parse(m.body);
    const time = `<span class="time">${fmtTime(m.created_at)}</span>`;
    switch (m.type) {
      case 'system': return `<div class="msg system" data-mid="${m.id}">${esc(m.body)}</div>`;
      case 'social': {
        const d = socialDef(p.platform); const link = socialLink(p.platform, p.handle || '');
        return `<div class="msg social ${side}" data-mid="${m.id}">${siconHTML(p.platform)}<div><div class="title">${mine ? 'Paylaştın' : 'Seninle paylaştı'} · ${esc(d.label)}</div><div class="handle">${link ? `<a href="${esc(link)}" target="_blank" rel="noopener">@${esc(p.handle)}</a>` : esc(p.handle)}</div></div></div>`;
      }
      case 'comment':
        return `<div class="msg card ${side}" data-mid="${m.id}"><div class="title">${ic('heart')} ${mine ? 'Yorumun' : 'Profiline yorum'}</div>${p.target ? `<div class="quote">${esc(p.target)}</div>` : ''}<div>${esc(p.comment)}</div>${time}</div>`;
      case 'opener': {
        const replied = !mine && state.chat.messages.some((x) => x.sender_id === meId() && x.type === 'text' && x.id > m.id);
        return `<div class="msg card ${side}" data-mid="${m.id}"><div class="title">${ic('msg')} ${mine ? 'Açılış sorun' : 'Açılış sorusu'}</div><div class="q">${esc(p.q)}</div>
          ${!mine && !replied ? '<div class="actions-row"><button class="btn btn-sm btn-primary" data-act="reply">Cevapla</button></div>' : ''}</div>`;
      }
      case 'reveal': return revealHTML(m, p, mine);
      case 'game': return gameHTML(m, p, mine);
      default: return `<div class="msg ${side}" data-mid="${m.id}">${esc(m.body)}${time}</div>`;
    }
  }

  function revealHTML(m, p, mine) {
    if (p.kind === 'request') {
      return `<div class="msg system" data-mid="${m.id}">${ic('unlock', 'sm')} ${mine ? 'Kimliğini açmaya hazır olduğunu bildirdin.' : `${esc(displayName(state.chat.other))} kimliğini açmaya hazır.`}</div>`;
    }
    const people = Object.entries(p.people || {}).sort(([a]) => (Number(a) === meId() ? 1 : -1));
    return `<div class="reveal-card" data-mid="${m.id}"><h4>${ic('unlock')} Kimlikler açıldı</h4><div class="reveal-people">
      ${people.map(([uid, info]) => `<div class="reveal-person"><div class="who">${Number(uid) === meId() ? 'Sen' : esc(state.chat.other.nickname)}</div>
        ${info.name ? `<div class="nm">${esc(info.name)}</div>` : ''}
        ${Object.entries(info.socials || {}).map(([pl, h]) => { const l = socialLink(pl, h); return `<div class="soc">${siconHTML(pl, 'brand sm')} ${l ? `<a href="${esc(l)}" target="_blank" rel="noopener">@${esc(h)}</a>` : esc(h)}</div>`; }).join('')}
      </div>`).join('')}
    </div></div>`;
  }

  function gameHTML(m, p, mine) {
    const side = mine ? 'mine' : 'theirs';
    if (p.kind === 'ttl') {
      const opts = p.statements.map((s, i) => {
        if (!mine && !p.answered) return `<button class="game-opt" data-act="answer" data-mid="${m.id}" data-choice="${i}">${esc(s)}</button>`;
        const isLie = p.lie === i; const picked = p.answered && p.choice === i;
        return `<div class="game-opt ${isLie ? 'lie' : ''} ${picked ? 'picked' : ''}"><span>${esc(s)}</span>${isLie ? '<span class="tag-mini">yalan</span>' : ''}</div>`;
      }).join('');
      let result = '';
      if (p.answered) {
        const text = mine
          ? `${esc(displayName(state.chat.other))} ${p.correct ? 'yalanı buldu!' : 'yanıldı'}`
          : (p.correct ? 'Yalanı buldun!' : 'Yanıldın');
        result = `<div class="game-result ${p.correct ? 'good' : 'meh'}">${text}</div>`;
      }
      else if (mine) result = `<div class="small muted" style="margin-top:6px">Tahmin bekleniyor…</div>`;
      return `<div class="msg card ${side}" data-mid="${m.id}"><div class="title">${ic('dice')} 2 doğru 1 yalan</div>${!mine && !p.answered ? '<div class="small">Hangisi yalan?</div>' : ''}<div class="game-opts">${opts}</div>${result}</div>`;
    }
    if (p.kind === 'tot') {
      const answered = p.answer != null;
      const opts = p.options.map((o, i) => {
        if (!mine && !answered) return `<button class="game-opt" data-act="answer" data-mid="${m.id}" data-choice="${i}">${esc(o)}</button>`;
        const marks = [];
        if (p.senderPick === i) marks.push(mine ? 'Sen' : esc(displayName(state.chat.other)));
        if (answered && p.answer === i) marks.push(mine ? esc(displayName(state.chat.other)) : 'Sen');
        return `<div class="game-opt ${marks.length ? 'picked' : ''}"><span>${esc(o)}</span>${marks.length ? `<span class="small muted">${marks.join(' · ')}</span>` : ''}</div>`;
      }).join('');
      const result = answered ? `<div class="game-result ${p.answer === p.senderPick ? 'good' : 'meh'}">${p.answer === p.senderPick ? 'Aynı seçim!' : 'Farklı seçtiniz, konuşacak konu çıktı'}</div>`
        : mine ? '<div class="small muted" style="margin-top:6px">Seçim bekleniyor…</div>' : '';
      return `<div class="msg card ${side}" data-mid="${m.id}"><div class="title">${ic('scale')} Bu mu o mu?</div><div class="tot-opts">${opts}</div>${result}</div>`;
    }
    if (p.kind === 'question') {
      return `<div class="msg card ${side}" data-mid="${m.id}"><div class="title">${ic('help')} Rastgele soru</div><div class="q">${esc(p.q)}</div>
        <div class="small muted" style="margin-top:4px">İkiniz de cevaplayın!</div></div>`;
    }
    if (p.kind === 'ttl_answer' || p.kind === 'tot_answer') {
      const what = p.kind === 'ttl_answer' ? 'Tahminini' : 'Seçimini';
      const text = mine ? `${what} yaptın` : `${esc(nameOf(m.sender_id))} ${what.toLocaleLowerCase('tr')} yaptı`;
      return `<div class="msg game-line" data-mid="${m.id}">${ic('dice', 'sm')} ${text}</div>`;
    }
    return `<div class="msg ${side}" data-mid="${m.id}">${esc(gameLabel(p))}</div>`;
  }

  function scrollChatBottom() { const b = $('#c-body'); if (b) b.scrollTop = b.scrollHeight; }
  function appendMessage(m) {
    const body = $('#c-body'); if (!body) return;
    const nearBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 140;
    body.insertAdjacentHTML('beforeend', messageHTML(m));
    if (nearBottom || m.sender_id === meId()) scrollChatBottom();
  }
  function refreshMessage(id) {
    const c = state.chat; const m = c?.messages.find((x) => x.id === id);
    const node = $(`#c-body [data-mid="${id}"]`);
    if (m && node) node.outerHTML = messageHTML(m);
  }
  function refreshStrips() { const s = $('#c-strips'); if (s && state.chat) s.innerHTML = chatStripsHTML(state.chat); }

  async function sendMessage() {
    const c = state.chat; const input = $('#c-input'); if (!c || !input) return;
    const body = input.value.trim(); if (!body) return;
    input.value = ''; input.style.height = 'auto';
    state.typingSentAt = 0;
    try {
      const r = await withConfirm((confirmed) => api(`/matches/${c.matchId}/messages`, { body: { body, confirmed } }));
      receiveMessage(c.matchId, r.message);
      // opener "Cevapla" düğmesi kaybolsun, süre şeridi kalksın
      if (c.info) c.info.expiresAt = null;
      refreshStrips();
      c.messages.filter((x) => x.type === 'opener').forEach((x) => refreshMessage(x.id));
    } catch (ex) { input.value = body; fail(ex); }
  }

  // ---- "+" menüsü: paylaş, kimlik aç, oyunlar
  function openChatActions() {
    const rv = state.chat.info?.reveal || {};
    const el = openModal(`<div class="sheet-title">Sohbete ekle</div><div class="list action-list">
      <button class="btn" data-a="share">${ic('link')}<span>Sosyal medya paylaş<small>Tek taraflı: seçtiğin hesabı hemen gönderirsin.</small></span></button>
      <button class="btn" data-a="reveal" ${rv.done ? 'disabled' : ''}>${ic('unlock')}<span>Karşılıklı kimlik açma<small>${rv.done ? 'Kimlikler açıldı.' : rv.mine ? 'Hazırsın; bilgilerini güncelleyebilirsin.' : 'İkiniz de hazır olunca isim ve hesaplar aynı anda açılır.'}</small></span></button>
      <button class="btn" data-a="ttl">${ic('dice')}<span>2 doğru 1 yalan<small>Üç cümle yaz, hangisinin yalan olduğunu tahmin etsin.</small></span></button>
      <button class="btn" data-a="tot">${ic('scale')}<span>Bu mu o mu?<small>İki seçenek, ikiniz de seçin.</small></span></button>
      <button class="btn" data-a="question">${ic('help')}<span>Rastgele soru<small>Sohbet tıkanınca buz kırıcı bir soru.</small></span></button>
    </div>`);
    el.onclick = (e) => {
      const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
      const a = b.dataset.a; closeModal();
      if (a === 'share') openShareSheet();
      else if (a === 'reveal') openRevealSheet();
      else if (a === 'ttl') openTtlSheet();
      else if (a === 'tot') openTotSheet();
      else if (a === 'question') sendGame({ kind: 'question' });
    };
  }

  async function sendGame(body) {
    const c = state.chat;
    try {
      const r = await withConfirm((confirmed) => api(`/matches/${c.matchId}/games`, { body: { ...body, confirmed } }));
      closeModal();
      receiveMessage(c.matchId, r.message);
      if (c.info) { c.info.expiresAt = null; refreshStrips(); }
      return true;
    } catch (ex) { fail(ex); return false; }
  }

  function openTtlSheet() {
    const el = openModal(`
      <div class="sheet-title">${ic('dice')} 2 doğru 1 yalan</div>
      <p class="muted small" style="margin:0 0 12px">Kendin hakkında üç cümle yaz. Birini yalan olarak işaretle; karşı taraf hangisi olduğunu tahmin etsin.</p>
      <div class="stack">
        ${[0, 1, 2].map((i) => `<div class="radio-row"><input class="input" data-st="${i}" maxlength="100" placeholder="${i + 1}. cümle"><label><input type="radio" name="lie" value="${i}" ${i === 2 ? 'checked' : ''}> yalan</label></div>`).join('')}
        <button class="btn btn-primary" id="ttl-send">Gönder</button>
      </div>`);
    $('#ttl-send', el).onclick = () => sendGame({
      kind: 'ttl',
      statements: $$('[data-st]', el).map((x) => x.value.trim()),
      lie: Number($('input[name=lie]:checked', el).value),
    });
  }

  function openTotSheet() {
    const pairs = state.meta.thisOrThat;
    let pick = 0;
    const el = openModal(`
      <div class="sheet-title">${ic('scale')} Bu mu o mu?</div>
      <div class="pills" id="tot-sug" style="margin-bottom:12px">${pairs.map((p, i) => `<button type="button" class="pill" data-i="${i}">${esc(p[0])} / ${esc(p[1])}</button>`).join('')}</div>
      <div class="stack">
        <div class="row"><input class="input grow" id="tot-a" maxlength="40" placeholder="Birinci seçenek"><input class="input grow" id="tot-b" maxlength="40" placeholder="İkinci seçenek"></div>
        <label class="field">Senin seçimin<div class="seg neutral" id="tot-pick"><button type="button" data-p="0" class="on">Birinci</button><button type="button" data-p="1">İkinci</button></div></label>
        <button class="btn btn-primary" id="tot-send">Gönder</button>
      </div>`);
    const setLabels = () => {
      const [b0, b1] = $$('#tot-pick button', el);
      b0.textContent = $('#tot-a', el).value.trim() || 'Birinci'; b1.textContent = $('#tot-b', el).value.trim() || 'İkinci';
    };
    $('#tot-sug', el).onclick = (e) => { const b = e.target.closest('[data-i]'); if (!b) return; const p = pairs[+b.dataset.i]; $('#tot-a', el).value = p[0]; $('#tot-b', el).value = p[1]; setLabels(); };
    $('#tot-a', el).oninput = setLabels; $('#tot-b', el).oninput = setLabels;
    $('#tot-pick', el).onclick = (e) => { const b = e.target.closest('[data-p]'); if (!b) return; pick = +b.dataset.p; $$('#tot-pick button', el).forEach((x) => x.classList.toggle('on', x === b)); };
    $('#tot-send', el).onclick = () => sendGame({ kind: 'tot', options: [$('#tot-a', el).value.trim(), $('#tot-b', el).value.trim()], pick });
  }

  async function answerGame(msgId, choice) {
    const c = state.chat;
    try {
      const r = await api(`/matches/${c.matchId}/games/${msgId}/answer`, { body: { choice } });
      const g = c.messages.find((x) => x.id === msgId); if (g) g.body = r.game.body;
      refreshMessage(msgId);
      receiveMessage(c.matchId, r.message);
    } catch (ex) { fail(ex); }
  }

  function openRevealSheet() {
    const c = state.chat; const u = state.user;
    const socials = state.meta.socials.filter((s) => u.socials?.[s.id]);
    const defName = [u.first_name, u.last_name].filter(Boolean).join(' ');
    const el = openModal(`
      <div class="sheet-title">${ic('unlock')} Karşılıklı kimlik açma</div>
      <p class="muted small" style="margin:0 0 12px">Seçtiğin bilgiler <b>${esc(displayName(c.other))}</b> da hazır olduğunda, ikinize <b>aynı anda</b> gösterilir. O hazır olana kadar hiçbir şey görmez.</p>
      <div class="stack">
        <label class="field">Gerçek adın (isteğe bağlı)<input class="input" id="rv-name" maxlength="60" value="${esc(defName)}" placeholder="Ör. Ayşe Yılmaz"></label>
        ${socials.length ? `<div class="section-title" style="margin:4px 0 0">Açılacak hesaplar</div>${socials.map((s) => `<label class="check-row"><input type="checkbox" data-rs="${s.id}" checked> ${siconHTML(s.id, 'brand sm')} ${esc(s.label)} · @${esc(u.socials[s.id])}</label>`).join('')}`
          : `<div class="note">${ic('info', 'sm')}<span>Profilinde kayıtlı sosyal medya hesabın yok. Profil sayfasından ekleyebilirsin; şimdilik sadece adını açabilirsin.</span></div>`}
        <button class="btn btn-primary" id="rv-go">Hazırım</button>
      </div>`);
    $('#rv-go', el).onclick = async () => {
      try {
        const r = await api(`/matches/${c.matchId}/reveal`, { body: { name: $('#rv-name', el).value.trim(), socials: $$('[data-rs]:checked', el).map((x) => x.dataset.rs) } });
        closeModal();
        c.info.reveal = r.reveal;
        if (r.message) receiveMessage(c.matchId, r.message);
        refreshStrips();
        toast(r.reveal.done ? 'Kimlikler açıldı!' : 'Hazır olduğunu bildirdik. Karşı taraf da hazır olunca açılacak.', 'ok');
      } catch (ex) { fail(ex); }
    };
  }

  function openShareSheet() {
    const c = state.chat; const socials = state.user.socials || {};
    const already = c.shared[state.user.id] || {};
    const entries = state.meta.socials.filter((s) => socials[s.id]);
    const el = openModal(`
      <div class="sheet-title">Sosyal medyanı paylaş</div>
      <p class="muted small" style="margin:0 0 12px">Seçtiğin hesap sadece <b>${esc(displayName(c.other))}</b> ile bu sohbette paylaşılır. Karşılıklı açmak istersen "Karşılıklı kimlik açma"yı kullan.</p>
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
        const r = await api(`/matches/${c.matchId}/share`, { body: { platform, handle } });
        receiveMessage(c.matchId, r.message);
        if (handle) { state.user.socials = { ...(state.user.socials || {}), [platform]: handle.replace(/^@/, '') }; }
        closeModal(); toast('Paylaşıldı.', 'ok');
      } catch (ex) { fail(ex); }
    };
  }

  // ------------------------------------------------------------ canlı güncellemeler (yoklama)
  // Vercel gibi sunucusuz ortamlarda kalıcı bağlantı (WebSocket) olmadığı için
  // istemci birkaç saniyede bir /api/updates'e "yeni bir şey var mı?" diye sorar.
  const poll = { timer: null, cursor: null, known: null, running: false };

  function pollDelay() {
    if (document.hidden) return 30000;
    return state.view === 'chat' ? 2500 : 7000;
  }
  function schedulePoll(ms) { clearTimeout(poll.timer); poll.timer = setTimeout(pollTick, ms); }
  function startPolling() { poll.cursor = null; poll.known = null; schedulePoll(0); }
  function stopPolling() { clearTimeout(poll.timer); poll.timer = null; poll.cursor = null; poll.known = null; }

  async function pollTick() {
    if (!state.user || poll.running) return;
    poll.running = true;
    try {
      const qs = new URLSearchParams();
      if (poll.cursor !== null) qs.set('after', poll.cursor);
      if (state.chat && !state.chat.loading) qs.set('chat', state.chat.matchId);
      handleUpdates(await api('/updates?' + qs));
    } catch { /* ağ hatası: bir sonraki turda tekrar dene */ }
    finally {
      poll.running = false;
      if (state.user) schedulePoll(pollDelay());
    }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && state.user) schedulePoll(300); });

  function handleUpdates(r) {
    const first = poll.cursor === null;
    const current = new Set(r.matchIds);
    if (!first) {
      for (const msg of r.messages) receiveMessage(msg.match_id, msg, { fromPoll: true });
      const removed = [...poll.known].filter((id) => !current.has(id));
      if (removed.length) {
        if (state.chat && removed.includes(state.chat.matchId)) { state.chat = null; toast('Bu eşleşme sona erdi.'); showView('matches'); }
        else loadMatches().then(() => { if (state.view === 'matches') renderMatches(); });
      }
    }
    poll.known = current;
    poll.cursor = Math.max(poll.cursor ?? 0, r.cursor);

    const c = state.chat;
    if (r.chat && c && c.matchId === r.chat.matchId && c.other) {
      c.other.online = r.chat.online; c.other.last_seen = r.chat.last_seen;
      const st = $('#c-status');
      if (st) st.innerHTML = r.chat.online ? '<span class="dot"></span> Çevrimiçi' : r.chat.last_seen ? 'Son görülme ' + fmtTime(r.chat.last_seen) : '';
      const t = $('#c-typing'); if (t) t.textContent = r.chat.typing ? 'yazıyor…' : '';
    }
  }

  /** Yeni bir mesajı (kendi gönderdiğimiz ya da yoklamadan gelen) ekrana işler; aynı mesajı iki kez eklemez. */
  function receiveMessage(matchId, message, { fromPoll = false } = {}) {
    const mine = message.sender_id === meId();
    const c = state.chat;
    if (c && c.matchId === matchId && !c.loading) {
      if (c.messages.some((m) => m.id === message.id)) return;
      c.messages.push(message);
      const p = message.type === 'text' || message.type === 'system' ? null : parse(message.body);
      if (message.type === 'social') {
        (c.shared[message.sender_id] ||= {})[p.platform] = p.handle;
        refreshStrips(); appendMessage(message);
      } else if (message.type === 'reveal') {
        if (p.kind === 'done') {
          c.info.reveal = { mine: true, theirs: true, done: true };
          for (const [uid, info] of Object.entries(p.people || {})) Object.assign((c.shared[uid] ||= {}), info.socials || {});
        } else if (!mine) c.info.reveal = { ...(c.info.reveal || {}), theirs: true };
        refreshStrips(); appendMessage(message);
      } else if (message.type === 'game' && (p.kind === 'ttl_answer' || p.kind === 'tot_answer')) {
        const g = c.messages.find((x) => x.id === p.ref);
        if (g) {
          const gb = parse(g.body);
          if (p.kind === 'ttl_answer') Object.assign(gb, { answered: true, choice: p.choice, correct: p.correct, lie: p.lie });
          else Object.assign(gb, { answer: p.choice, senderPick: p.senderPick });
          g.body = JSON.stringify(gb);
          refreshMessage(g.id);
        }
        appendMessage(message);
      } else appendMessage(message);
      if (!mine) {
        if (c.info?.expiresAt && message.type !== 'opener') { c.info.expiresAt = null; refreshStrips(); }
        const t = $('#c-typing'); if (t) t.textContent = '';
        api(`/matches/${matchId}/read`, { body: {} }).catch(() => {});
      }
      return;
    }
    if (!fromPoll || mine) return;
    const m = state.matches.find((x) => x.matchId === matchId);
    if (message.type === 'system') {
      // karşı taraf beğenimize karşılık verdi: yeni eşleşme
      loadMatches().then(() => {
        const nm = state.matches.find((x) => x.matchId === matchId);
        if (nm) showMatchModal({ matchId, user: nm.user, mode: nm.mode });
        if (state.view === 'matches') renderMatches();
      });
      return;
    }
    if (message.type === 'opener' || message.type === 'comment') return; // eşleşmeyle birlikte gelir
    if (m) { m.unread = (m.unread || 0) + 1; updateUnreadBadge(); if (state.view === 'matches') renderMatches(); }
    else loadMatches().then(() => { if (state.view === 'matches') renderMatches(); });
    toast(message.type === 'reveal' ? 'Biri kimliğini açmaya hazır' : message.type === 'game' ? 'Yeni bir oyun daveti' : 'Yeni mesaj');
  }

  // ------------------------------------------------------------ başlat
  (async () => {
    registerSW();
    try { state.meta = await api('/meta'); }
    catch (ex) {
      document.body.innerHTML = `<div style="max-width:420px;margin:15vh auto;padding:24px;font-family:Inter,sans-serif;color:#f5f4fa;text-align:center">
        <h2 style="margin:0 0 8px">Sunucuya ulaşılamıyor</h2><p style="color:#9a98b0;margin:0">${esc(ex.message)}</p></div>`;
      return;
    }
    try {
      const r = await api('/me');
      await onLoggedIn(r.user);
    } catch { showView('auth'); }
  })();
})();
