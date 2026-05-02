/* ============================================================
   NEARDIS — Main App JS
   Handles routing, global state, shared utilities, data store
   ============================================================ */

'use strict';

// --- GLOBAL STATE ----------------------------------------------
const App = {
  currentPage: 'feed',
  theme: localStorage.getItem('nd-theme') || 'dark',
  user: JSON.parse(localStorage.getItem('nd-user') || 'null') || {
    initials: '',
    name: '',
    email: '',
    location: '',
    loggedIn: false,
    avatar: null
  },
  savedDeals: new Set(JSON.parse(localStorage.getItem('nd-saved') || '[]')),
  viewedDeals: JSON.parse(localStorage.getItem('nd-viewed') || '[]'),
  activeCat: 'all',
  flashFilter: false,
  heatmapOn: false,
  verifyStep: 0,

  saveState() {
    localStorage.setItem('nd-saved', JSON.stringify([...this.savedDeals]));
    localStorage.setItem('nd-viewed', JSON.stringify(this.viewedDeals.slice(0, 20)));
    localStorage.setItem('nd-user', JSON.stringify(this.user));
  }
};

// --- DEALS DATA STORE -------------------------------------------
const Deals = [];

// --- ROUTER ----------------------------------------------------
const Pages = {
  feed: null, map: null, flash: null, route: null,
  bookmarks: null, notifications: null, surprise: null,
  business: null, verify: null, profile: null, settings: null
};

async function loadPage(name) {
  const container = document.getElementById('page-content');

  // If already loaded (cached), just show it
  if (Pages[name]) {
    container.innerHTML = Pages[name];
    container.firstElementChild?.classList.add('page-enter');
    initPageJS(name);
    return;
  }

  container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;flex:1;color:var(--text3);font-size:13px;gap:8px"><div class="live-dot" style="background:var(--accent)"></div>Loading…</div>`;

  try {
    const res = await fetch(`pages/${name}.html`);
    const html = await res.text();
    Pages[name] = html;
    container.innerHTML = html;
    container.firstElementChild?.classList.add('page-enter');
    initPageJS(name);
  } catch (e) {
    container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;flex:1;flex-direction:column;gap:10px;color:var(--text3)"><div style="font-size:40px">??</div><div>Could not load page</div></div>`;
  }
}

function navigate(name) {
  if (App.currentPage === name) return;
  App.currentPage = name;

  // Sidebar active state
  document.querySelectorAll('.nav-item, .bnav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === name);
  });

  loadPage(name);
}

// --- PAGE-SPECIFIC INIT -----------------------------------------
function initPageJS(name) {
  // Each page module init is called if available
  const initFn = window[`init_${name}`];
  if (typeof initFn === 'function') initFn();
}

// --- THEME -----------------------------------------------------
function applyTheme(theme) {
  App.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('nd-theme', theme);
}

function toggleTheme() {
  applyTheme(App.theme === 'dark' ? 'light' : 'dark');
  // Update toggle UI in settings if visible
  const track = document.getElementById('theme-track');
  if (track) track.classList.toggle('on', App.theme === 'light');
}

// --- HELPERS ---------------------------------------------------
function fmtTime(s) {
  if (s <= 0) return 'Expired';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sc = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sc}s`;
  return `${sc}s`;
}

function fmtDist(d) {
  return d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(1)}km`;
}

function fmtPrice(n) {
  return `Rs ${n.toLocaleString()}`;
}

function dealTag(cat) {
  const map = { food:'tag-food', fashion:'tag-fashion', electronics:'tag-electronics', beauty:'tag-beauty', sports:'tag-sports', home:'tag-home' };
  return map[cat] || 'tag-food';
}

// --- DEAL CARD TEMPLATE -----------------------------------------
function dealCardHTML(d, opts = {}) {
  const urgent = d.expiry > 0 && d.expiry < 3600;
  const saved = App.savedDeals.has(d.id);
  const size = opts.large ? 'height:155px;font-size:52px' : '';

  return `
  <div class="deal-card${d.flash ? ' flash glow' : ''}" onclick="openDeal(${d.id})" data-id="${d.id}">
    ${d.flash ? '<div class="flash-badge">? FLASH</div>' : ''}
    <div class="deal-thumb" style="${size}">${d.emoji}
      <div class="deal-disc">-${d.disc}%</div>
    </div>
    <div class="deal-body">
      <div class="deal-shop">${d.shop} <span class="verified">? Verified</span></div>
      <div class="deal-title">${d.title}</div>
      <div class="deal-meta">
        <span class="deal-tag ${dealTag(d.cat)}">${d.cat}</span>
        <span class="deal-dist">?? ${fmtDist(d.dist)}</span>
        ${d.sightings > 0 ? `<span style="font-size:10px;color:var(--text3)">?? ${d.sightings}</span>` : ''}
      </div>
      <div class="deal-timer${urgent ? ' urgent' : ''}" data-timer="${d.id}">? ${fmtTime(d.expiry)}</div>
    </div>
    <div class="deal-footer">
      <span class="worth-it">? ${d.worthit}% worth it</span>
      <button class="bm-btn${saved ? ' saved' : ''}" onclick="toggleSave(event,${d.id})">${saved ? '??' : '??'}</button>
    </div>
  </div>`;
}

// --- SAVE TOGGLE -----------------------------------------------
function toggleSave(e, id) {
  e.stopPropagation();
  if (App.savedDeals.has(id)) {
    App.savedDeals.delete(id);
  } else {
    App.savedDeals.add(id);
  }
  App.saveState();
  // Re-render bm buttons in view
  document.querySelectorAll(`[data-id="${id}"] .bm-btn`).forEach(btn => {
    btn.classList.toggle('saved', App.savedDeals.has(id));
    btn.textContent = App.savedDeals.has(id) ? '??' : '??';
  });
}

// --- DEAL MODAL -------------------------------------------------
function openDeal(id) {
  const d = Deals.find(x => x.id === id);
  if (!d) return;

  // Track viewed
  App.viewedDeals = [id, ...App.viewedDeals.filter(x => x !== id)].slice(0, 20);
  App.saveState();

  const modal = document.getElementById('deal-modal');
  const saved = App.savedDeals.has(id);

  document.getElementById('modal-main').innerHTML = `
    <div style="font-size:80px;text-align:center;padding:24px;background:var(--bg3);border-radius:var(--r);margin-bottom:16px">${d.emoji}</div>
    <div class="deal-shop mb-8">${d.shop} · <span class="verified">? Verified</span></div>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:1px;margin-bottom:10px;line-height:1.1">${d.title}</div>
    <div style="font-size:13px;color:var(--text2);margin-bottom:18px;line-height:1.65">${d.desc}</div>
    <div class="grid-2 mb-16">
      <div style="text-align:center;padding:14px;background:var(--bg3);border-radius:var(--r2)">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:44px;color:var(--accent);letter-spacing:1px">-${d.disc}%</div>
        <div class="text-muted" style="font-size:10px">Discount</div>
      </div>
      <div style="text-align:center;padding:14px;background:var(--bg3);border-radius:var(--r2)">
        <div style="font-size:11px;color:var(--text3);text-decoration:line-through">${fmtPrice(d.orig)}</div>
        <div style="font-size:22px;font-weight:700;margin:3px 0">${fmtPrice(d.price)}</div>
        <div style="font-size:11px;color:var(--green)">Save ${fmtPrice(d.orig - d.price)}</div>
      </div>
    </div>
    <div class="mb-16">
      <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Community Verdict</div>
      <div class="occ-bar" style="height:8px;border-radius:4px"><div class="occ-fill" style="width:${d.worthit}%;background:var(--green)"></div></div>
      <div style="font-size:11px;color:var(--green);margin-top:4px">${d.worthit}% say "Worth it" · ? ${d.rating}</div>
    </div>
    <div class="flex gap-8 flex-wrap">
      <button class="btn btn-primary" onclick="alert('Directions to ${d.shop}!')">?? Get Directions</button>
      <button class="btn btn-ghost" id="modal-save-btn" onclick="modalToggleSave(${d.id})">${saved ? '?? Saved' : '+ Save Deal'}</button>
      ${d.flash ? '<div class="live-badge"><div class="live-dot"></div>FLASH</div>' : ''}
    </div>`;

  document.getElementById('modal-side').innerHTML = `
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">? Time Remaining</div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:38px;font-weight:600;color:var(--accent)" id="mc-timer" data-did="${d.id}">${fmtTime(d.expiry)}</div>
    <div class="text-muted mb-16" style="font-size:10px">Deal expires automatically</div>
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">?? Distance</div>
    <div style="font-size:22px;font-weight:700;margin-bottom:16px">${fmtDist(d.dist)} away</div>
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">?? Sightings (${d.sightings})</div>
    <div class="sighting"><div class="sight-av">??</div><div><div class="sight-text">Confirmed active & in stock</div><div class="sight-time">5 min ago</div></div></div>
    <div class="sighting"><div class="sight-av">??</div><div><div class="sight-text">Queue is short, go now!</div><div class="sight-time">18 min ago</div></div></div>
    <button class="btn btn-ghost w-full mt-8" style="font-size:11px" onclick="alert('Thanks for your sighting!')">+ Add Sighting</button>`;

  modal.classList.add('open');
}

function modalToggleSave(id) {
  App.savedDeals.has(id) ? App.savedDeals.delete(id) : App.savedDeals.add(id);
  App.saveState();
  const btn = document.getElementById('modal-save-btn');
  if (btn) btn.textContent = App.savedDeals.has(id) ? '?? Saved' : '+ Save Deal';
}

function closeDeal() {
  document.getElementById('deal-modal').classList.remove('open');
}

// --- COUNTDOWN ENGINE -------------------------------------------
function startCountdowns() {
  setInterval(() => {
    Deals.forEach(d => {
      if (d.expiry > 0) d.expiry--;
      const urgent = d.expiry > 0 && d.expiry < 3600;

      document.querySelectorAll(`[data-timer="${d.id}"]`).forEach(el => {
        el.textContent = `? ${fmtTime(d.expiry)}`;
        el.className = `deal-timer${urgent ? ' urgent' : ''}`;
      });
    });
    // Modal timer
    const mc = document.getElementById('mc-timer');
    if (mc) {
      const did = parseInt(mc.dataset.did);
      const d = Deals.find(x => x.id === did);
      if (d) mc.textContent = fmtTime(d.expiry);
    }
  }, 1000);
}

// --- TICKER -----------------------------------------------------
function initTicker() {
  const flash = Deals.filter(d => d.flash);
  const html = flash.map(d =>
    `<span class="ticker-item">${d.emoji} <strong style="color:var(--text)">${d.shop}</strong> <span class="ticker-pct">-${d.disc}%</span> · ${d.title} · ${fmtDist(d.dist)}</span>`
  ).join('');
  const el = document.getElementById('ticker');
  if (el) el.innerHTML = html + html;
}

// --- LOGIN / AUTH HELPERS ---------------------------------------
function isLoggedIn() { return App.user.loggedIn; }

function requireLogin(cb) {
  if (!isLoggedIn()) {
    if (confirm('You need to be signed in to do that. Go to Settings to sign in?')) {
      navigate('settings');
    }
    return false;
  }
  cb && cb();
  return true;
}

function loginUser(name, email) {
  const initials = name.trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  App.user = { name, email, initials, loggedIn: true, location: '' };
  App.saveState();
  updateAvatarUI();
}

function logoutUser() {
  App.user = { initials: '', name: '', email: '', location: '', loggedIn: false, avatar: null };
  App.saveState();
  updateAvatarUI();
}

function updateAvatarUI() {
  document.querySelectorAll('.avatar').forEach(av => {
    av.textContent = App.user.loggedIn ? App.user.initials : '??';
  });
}

// --- INIT -------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme
  applyTheme(App.theme);

  // Sidebar nav
  document.querySelectorAll('.nav-item, .bnav-item').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.page));
  });

  // Logo click
  document.querySelector('.logo')?.addEventListener('click', () => navigate('feed'));

  // Avatar click ? settings
  document.querySelectorAll('.avatar').forEach(av => {
    av.addEventListener('click', () => navigate('settings'));
  });

  // Modal close
  document.getElementById('deal-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('deal-modal')) closeDeal();
  });

  // Load deals, then init
  fetch('js/deals.js')
    .then(r => r.text())
    .then(() => {
      initTicker();
      startCountdowns();
      loadPage('feed');
      updateAvatarUI();
    })
    .catch(() => {
      // Deals loaded inline
      initTicker();
      startCountdowns();
      loadPage('feed');
      updateAvatarUI();
    });
});