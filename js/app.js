/**
 * app.js — Fonctions utilitaires globales
 * Chargement des données JSON + enregistrement Service Worker
 */

// Chemin absolu — fonctionne depuis n'importe quel sous-dossier (html/, racine)
const DATA_URL = '/data/poi.json';
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
// Chemin absolu — le SW doit toujours être enregistré depuis la racine
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('Service Worker enregistré'))
      .catch(err => console.warn('SW non disponible :', err));
  });
}
