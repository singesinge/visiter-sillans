/**
 * poi.js — Affichage dynamique d'un point d'intérêt
 * URL param : ?id=poi-XX
 */

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
  document.title = `${escapeHTML(poi.titre)} — Visiter Sillans`;

  const visite = estVisite(poi.id);

  // Photo terrain — chemin absolu depuis la racine du site
  const photoHTML = poi.photo
    ? `<div class="poi-photo-wrap">
         <img class="poi-photo" src="/${escapeHTML(poi.photo)}" alt="${escapeHTML(poi.titre)}" loading="lazy" onerror="this.parentElement.style.display='none'">
       </div>`
    : '';

  // Espèces — chaque tag est échappé
  const especesHTML = poi.especes && poi.especes.length
    ? `<div class="poi-section-title">🌿 Espèces associées</div>
       <ul class="poi-especes">${poi.especes.map(e => `<li class="poi-espece-tag">${escapeHTML(e)}</li>`).join('')}</ul>`
    : '';

  // Geste éco (conseil) — si présent dans le JSON
  const conseilHTML = poi.conseil
    ? `<div class="poi-conseil">
         <span class="poi-conseil-label">💡 Geste éco</span>
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
    : `<a href="qcm.html" class="btn btn-secondary">🎯 Passer le QCM →</a>`;

  // Contenu principal — toutes les chaînes texte sont échappées
  document.getElementById('poi-content').innerHTML = `
    ${photoHTML}

    <div class="poi-numero">POI ${String(poi.ordre).padStart(2, '0')} / 14</div>
    <h1 class="poi-titre">${escapeHTML(poi.titre)}</h1>
    <p class="poi-lieu">📍 ${escapeHTML(poi.lieu)}</p>

    <span class="badge-theme badge-${escapeHTML(poi.theme)}">${themeLabel(poi.theme)}</span>

    <div class="poi-section-title" style="margin-top:1.25rem;">📖 Description</div>
    <p>${escapeHTML(poi.description)}</p>

    <div class="poi-section-title">🔍 Pour en savoir plus</div>
    <p>${escapeHTML(poi.contenu)}</p>

    ${especesHTML}

    ${conseilHTML}

    <button
      class="visite-btn ${visite ? 'deja-visite' : ''}"
      id="btn-visite"
      onclick="marquerVisite('${escapeHTML(poi.id)}')"
      ${visite ? 'disabled' : ''}
    >
      ${visite ? '✅ Déjà visité' : '✔ Marquer comme visité'}
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
    btn.textContent = '✅ Déjà visité';
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
