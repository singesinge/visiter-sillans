/**
 * app.js — Fonctions utilitaires globales
 * Chargement JSON + SW + burger menu + PWA install banner
 */

// Chemin relatif selon la profondeur de la page (racine vs html/), pour rester
// valide sur GitHub Pages servi depuis un sous-dossier (/visiter-sillans/).
const BASE_REL = location.pathname.includes('/html/') ? '../' : './';
const DATA_URL = BASE_REL + 'data/poi.json';
let _poiData = null;

/* --- Chargement des données --- */

async function chargerDonnees() {
  if (_poiData) return _poiData;
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error('Erreur réseau');
    _poiData = await res.json();
    return _poiData;
  } catch (e) {
    console.error('Impossible de charger poi.json :', e);
    return null;
  }
}

async function chargerPOI() {
  const data = await chargerDonnees();
  return data ? data.pois : [];
}

async function chargerQCM() {
  const data = await chargerDonnees();
  return data ? data.qcm : [];
}

/* --- Utilitaires --- */

function getPoiIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function themeLabel(theme) {
  const labels = {
    biodiversite: 'Biodiversité',
    geologie: 'Géologie',
    histoire: 'Histoire',
    securite: 'Sécurité'
  };
  return labels[theme] || theme;
}

/* --- Service Worker (hors-ligne) --- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(BASE_REL + 'sw.js')
      .then(() => console.log('SW enregistré'))
      .catch(err => console.warn('SW non disponible :', err));
  });
}

/* --- Burger Menu --- */
(function initBurger() {
  function setup() {
    const burgerBtn = document.getElementById('burger-btn');
    const navDrawer = document.getElementById('nav-drawer');
    const navOverlay = document.getElementById('nav-overlay');
    const navClose = document.getElementById('nav-close');
    if (!burgerBtn || !navDrawer) return;

    function openMenu() {
      navDrawer.classList.add('open');
      navOverlay && navOverlay.classList.add('visible');
      burgerBtn.classList.add('open');
      burgerBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      setTimeout(() => navClose && navClose.focus(), 60);
    }
    function closeMenu() {
      navDrawer.classList.remove('open');
      navOverlay && navOverlay.classList.remove('visible');
      burgerBtn.classList.remove('open');
      burgerBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      burgerBtn.focus();
    }

    burgerBtn.addEventListener('click', openMenu);
    navClose && navClose.addEventListener('click', closeMenu);
    navOverlay && navOverlay.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && navDrawer.classList.contains('open')) closeMenu();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();

/* --- PWA Install Banner --- */
(function initPWAInstall() {
  try { if (localStorage.getItem('pwa_dismissed')) return; } catch(e) { return; }
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(showBanner, 5000);
  });

  function showBanner() {
    if (!deferredPrompt || document.getElementById('pwa-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'pwa-banner';
    banner.className = 'pwa-banner';
    banner.setAttribute('role', 'complementary');
    banner.innerHTML =
      '<span class="pwa-banner__icon" aria-hidden="true">📲</span>' +
      '<div class="pwa-banner__text">' +
        '<p class="pwa-banner__title">Installer l\'application</p>' +
        '<p class="pwa-banner__desc">Accès hors connexion, même sans réseau</p>' +
      '</div>' +
      '<button class="pwa-banner__btn" id="pwa-install-btn">Installer</button>' +
      '<button class="pwa-banner__close" id="pwa-dismiss-btn" aria-label="Ignorer">✕</button>';
    document.body.appendChild(banner);
    banner.classList.add('visible');

    document.getElementById('pwa-install-btn').addEventListener('click', async function() {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      banner.remove();
      try { if (outcome === 'accepted') localStorage.setItem('pwa_dismissed', '1'); } catch(e) {}
    });
    document.getElementById('pwa-dismiss-btn').addEventListener('click', function() {
      banner.remove();
      try { localStorage.setItem('pwa_dismissed', '1'); } catch(e) {}
    });
  }

  window.addEventListener('appinstalled', function() {
    deferredPrompt = null;
    const b = document.getElementById('pwa-banner');
    if (b) b.remove();
    try { localStorage.setItem('pwa_dismissed', '1'); } catch(e) {}
  });
})();
