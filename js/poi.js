/**
 * poi.js — Affichage dynamique d'un point d'intérêt
 * URL param : ?id=poi-XX
 */

let tousLesPOI = [];
let poiActuel = null;

async function initPOI() {
  const id = getPoiIdFromURL();
  if (!id) {
    document.getElementById('poi-content').innerHTML = '<p style="padding:2rem;color:var(--gris);text-align:center;">POI introuvable.</p>';
    return;
  }

  tousLesPOI = await chargerPOI();
  const poi = tousLesPOI.find(p => p.id === id);

  if (!poi) {
    document.getElementById('poi-content').innerHTML = "<p style=\"padding:2rem;color:var(--gris);text-align:center;\">Point d'intérêt non trouvé.</p>";
    return;
  }

  poiActuel = poi;
  afficherPOI(poi);
}

function afficherPOI(poi) {
  // Header
  document.getElementById('poi-header-num').textContent = `POI ${String(poi.ordre).padStart(2, '0')}`;
  document.getElementById('poi-header-titre').textContent = poi.titre;
  document.title = `${poi.titre} — Visiter Sillans`;

  const visite = estVisite(poi.id);

  // Espèces
  const especesHTML = poi.especes && poi.especes.length
    ? `<div class="poi-section-title">🌿 Espèces associées</div>
       <ul class="poi-especes">${poi.especes.map(e => `<li class="poi-espece-tag">${e}</li>`).join('')}</ul>`
    : '';

  // Navigation prev/next
  const navPrev = poi.ordre > 1
    ? `<button class="btn btn-ghost" onclick="naviguerPOI(-1)">← POI ${poi.ordre - 1}</button>`
    : `<button class="btn btn-ghost" disabled style="opacity:0.3;">← Début</button>`;

  const navNext = poi.ordre < 14
    ? `<button class="btn btn-secondary" onclick="naviguerPOI(1)">POI ${poi.ordre + 1} →</button>`
    : `<button class="btn btn-secondary" disabled style="opacity:0.3;">Fin →</button>`;

  document.getElementById('poi-content').innerHTML = `
    <div class="poi-numero">POI ${String(poi.ordre).padStart(2, '0')} / 14</div>
    <h1 class="poi-titre">${poi.titre}</h1>
    <p class="poi-lieu">📍 ${poi.lieu}</p>

    <span class="badge-theme badge-${poi.theme}">${themeLabel(poi.theme)}</span>

    <div class="poi-section-title" style="margin-top:1.25rem;">📖 Description</div>
    <p>${poi.description}</p>

    <div class="poi-section-title">🔍 Pour en savoir plus</div>
    <p>${poi.contenu}</p>

    ${especesHTML}

    <button
      class="visite-btn ${visite ? 'deja-visite' : ''}"
      id="btn-visite"
      onclick="marquerVisite('${poi.id}')"
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
  if (cible) window.location.href = `poi.html?id=${cible.id}`;
}

document.addEventListener('DOMContentLoaded', initPOI);
