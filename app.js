'use strict';

const App = {
  currentPage: '',
  theme: localStorage.getItem('nd-theme') || 'dark',
  user: JSON.parse(localStorage.getItem('nd-user')) || { loggedIn: false, name: '', initials: '👤' },
  savedDeals: new Set(JSON.parse(localStorage.getItem('nd-saved') || '[]')),
  viewedDeals: JSON.parse(localStorage.getItem('nd-viewed') || '[]'),

  saveState() {
    localStorage.setItem('nd-saved', JSON.stringify([...this.savedDeals]));
    localStorage.setItem('nd-user', JSON.stringify(this.user));
    localStorage.setItem('nd-viewed', JSON.stringify(this.viewedDeals));
  }
};

// Default Deals Data[cite: 7]
const Deals = [
  { id: 1, shop: "Café Example", emoji: "☕", cat: "food", title: "50% Off Coffee", disc: 50, dist: 0.2, expiry: 7200, flash: true, rating: 4.8, worthit: 94, sightings: 12, desc: "Half price espresso drinks.", lat: 36, lng: 18, orig: 600, price: 300 },
  { id: 2, shop: "TechCorner", emoji: "📱", cat: "electronics", title: "3-for-1 Case Bundle", disc: 66, dist: 0.45, expiry: 28800, flash: false, rating: 4.5, worthit: 88, sightings: 5, desc: "Premium cases deal.", lat: 22, lng: 45, orig: 3600, price: 1200 }
];

// Router
async function navigate(name) {
  if (App.currentPage === name) return;
  App.currentPage = name;

  // Update UI Active States
  document.querySelectorAll('.nav-item, .bnav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === name);
  });

  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="loader">Loading...</div>`;

  try {
    // Relative path for GitHub Pages compatibility
    const res = await fetch(`./pages/${name}.html`);
    if (!res.ok) throw new Error('Page not found');
    const html = await res.text();
    container.innerHTML = html;

    // Manually execute scripts found in the injected HTML[cite: 1]
    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      newScript.text = oldScript.text;
      document.body.appendChild(newScript).parentNode.removeChild(newScript);
    });

  } catch (e) {
    container.innerHTML = `<div class="error">Error loading ${name}. Ensure files are in /pages/ folder.</div>`;
  }
}

// Global Utilities[cite: 1]
function fmtTime(s) {
  if (s <= 0) return 'Expired';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function dealCardHTML(d) {
  const saved = App.savedDeals.has(d.id);
  return `
    <div class="deal-card ${d.flash ? 'flash' : ''}" onclick="openDeal(${d.id})">
      <div class="deal-thumb">${d.emoji}<div class="deal-disc">-${d.disc}%</div></div>
      <div class="deal-body">
        <div class="deal-shop">${d.shop}</div>
        <div class="deal-title">${d.title}</div>
        <div class="deal-timer">⏱ ${fmtTime(d.expiry)}</div>
      </div>
      <div class="deal-footer">
        <span class="worth-it">✓ ${d.worthit}%</span>
        <button class="bm-btn ${saved ? 'saved' : ''}" onclick="toggleSave(event, ${d.id})">🔖</button>
      </div>
    </div>`;
}

function toggleSave(e, id) {
  e.stopPropagation();
  App.savedDeals.has(id) ? App.savedDeals.delete(id) : App.savedDeals.add(id);
  App.saveState();
  navigate(App.currentPage); // Refresh view
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.page));
  });
  navigate('feed');
});
