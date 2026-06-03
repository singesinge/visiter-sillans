/**
 * poi.js — Affichage dynamique d'un point d'intérêt
 * URL param : ?id=poi-XX
 */

/* --- Icônes SVG inline (offline-compatible, Lucide style) --- */
const SVG = {
  leaf:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
  bulb:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  pin:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  book:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  check:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  checkO: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
  award:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`
};

let tousLesPOI = [];
let poiActuel = null;

/* --- Sécurité : échappe les caractères HTML avant insertion dans le DOM --- */
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function initPOI() {
  const id = getPoiIdFromURL();
  if (!id) {
    document.getElementById('poi-content').innerHTML = '<p style="padding:2rem;color:var(--gris);text-align:center;">POI introuvable.</p>';
    return;
  }

  tousLesPOI = await chargerPOI();
  const poi = tousLesPOI.find(p => p.id === id);

  if (!poi) {
    document.getElementById('poi-content').innerHTML = '<p style="padding:2rem;color:var(--gris);text-align:center;">Point d\'intérêt non trouvé.</p>';
    return;
  }

  poiActuel = poi;
  afficherPOI(poi);
}

function afficherPOI(poi) {
  // Header (via textContent — jamais d'innerHTML ici)
  document.getElementById('poi-header-num').textContent = `POI ${String(poi.ordre).padStart(2, '0')}`;
  document.getElementById('poi-header-titre').textContent = poi.titre;
  document.title = `${escapeHTML(poi.titre)} · Visiter Sillans`;

  const visite = estVisite(poi.id);

  // Photo terrain — chemin absolu depuis la racine du site
  const photoHTML = poi.photo
    ? `<div class="poi-photo-wrap">
         <img class="poi-photo" src="/${escapeHTML(poi.photo)}" alt="${escapeHTML(poi.titre)}" loading="lazy" onerror="this.parentElement.style.display='none'">
       </div>`
    : '';

  // Espèces — chaque tag est échappé
  const especesHTML = poi.especes && poi.especes.length
    ? `<div class="poi-section-title"><span class="poi-section-icon" aria-hidden="true">${SVG.leaf}</span>Espèces associées</div>
       <ul class="poi-especes">${poi.especes.map(e => `<li class="poi-espece-tag">${escapeHTML(e)}</li>`).join('')}</ul>`
    : '';

  // Geste éco (conseil) — si présent dans le JSON
  const conseilHTML = poi.conseil
    ? `<div class="poi-conseil">
         <span class="poi-conseil-label"><span class="poi-section-icon" aria-hidden="true">${SVG.bulb}</span>Geste éco</span>
         <p>${escapeHTML(poi.conseil)}</p>
       </div>`
    : '';

  // Navigation prev/next
  const navPrev = poi.ordre > 1
    ? `<button class="btn btn-ghost" onclick="naviguerPOI(-1)">← POI ${poi.ordre - 1}</button>`
    : `<button class="btn btn-ghost" disabled style="opacity:0.3;">← Début</button>`;

  // Sur le dernier POI, le bouton "suivant" redirige vers le QCM
  const navNext = poi.ordre < 14
    ? `<button class="btn btn-secondary" onclick="naviguerPOI(1)">POI ${poi.ordre + 1} →</button>`
    : `<a href="qcm.html" class="btn btn-secondary" style="display:inline-flex;align-items:center;gap:0.5rem;">${SVG.award}Passer le QCM →</a>`;

  // Contenu principal — toutes les chaînes texte sont échappées
  document.getElementById('poi-content').innerHTML = `
    ${photoHTML}

    <div class="poi-numero">POI ${String(poi.ordre).padStart(2, '0')} / 14</div>
    <h1 class="poi-titre">${escapeHTML(poi.titre)}</h1>
    <p class="poi-lieu"><span class="poi-section-icon" aria-hidden="true">${SVG.pin}</span>${escapeHTML(poi.lieu)}</p>

    <span class="badge-theme badge-${escapeHTML(poi.theme)}">${themeLabel(poi.theme)}</span>

    <div class="poi-section-title" style="margin-top:1.25rem;"><span class="poi-section-icon" aria-hidden="true">${SVG.book}</span>Description</div>
    <p>${escapeHTML(poi.description)}</p>

    <div class="poi-section-title"><span class="poi-section-icon" aria-hidden="true">${SVG.search}</span>Pour en savoir plus</div>
    <p>${escapeHTML(poi.contenu)}</p>

    ${especesHTML}

    ${conseilHTML}

    <button
      class="visite-btn ${visite ? 'deja-visite' : ''}"
      id="btn-visite"
      onclick="marquerVisite('${escapeHTML(poi.id)}')"
      ${visite ? 'disabled' : ''}
    >
      <span style="display:inline-flex;align-items:center;gap:0.5rem;">${visite ? SVG.checkO : SVG.check}${visite ? 'Déjà visité' : 'Marquer comme visité'}</span>
    </button>

    <div class="poi-nav-btns">
      ${navPrev}
      ${navNext}
    </div>

    <div style="margin-top:1.25rem;">
      <a href="carte.html" class="btn btn-ghost btn-full" style="font-size:0.875rem;">
        ← Retour à la carte
      </a>
    </div>
  `;
}

function marquerVisite(poiId) {
  marquerPoiVisite(poiId);
  const btn = document.getElementById('btn-visite');
  if (btn) {
    btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:0.5rem;">${SVG.checkO}Déjà visité</span>`;
    btn.classList.add('deja-visite');
    btn.disabled = true;
  }
}

function naviguerPOI(delta) {
  if (!poiActuel) return;
  const nouvelOrdre = poiActuel.ordre + delta;
  const cible = tousLesPOI.find(p => p.ordre === nouvelOrdre);
  if (cible) {
    window.location.href = `poi.html?id=${cible.id}`;
  }
}

document.addEventListener('DOMContentLoaded', initPOI);
