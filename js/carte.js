/**
 * carte.js — Moteur pan/zoom custom pour la carte SVG de l'ENS Sillans-la-Cascade
 * Remplace complètement Leaflet. Pas de dépendance externe.
 */

/* ============================================================
   CONSTANTES SVG + CALIBRATION GPS
   ============================================================ */

const SVG_W = 1508.72;
const SVG_H = 2915.79;

// Calibration GPS ↔ SVG — limites légèrement élargies pour que les POI
// apparaissent avec une marge confortable par rapport aux bords de la carte.
// Ajuster ces 4 valeurs si la position visuelle des POI ne correspond pas.
const LAT_MAX  = 43.5694;     // nord  → SVG y = 0       (+0.001° de marge)
const LAT_MIN  = 43.5616;     // sud   → SVG y = 2915.79 (-0.001° de marge)
const LNG_MIN  = 6.1771;      // ouest → SVG x = 0       (-0.001° de marge)
const LNG_MAX  = 6.1874;      // est   → SVG x = 1508.72 (+0.001° de marge)
const SVG_Y_TOP = 0;
const SVG_Y_BOT = 2915.79;
const SVG_X_MIN = 0;
const SVG_X_MAX = 1508.72;

// ---------------------------------------------------------------
// TRACÉ RÉEL DU SENTIER — coordonnées GPS issues d'OpenStreetMap
// Chaîne : Ways 117694453 → 302784350↑ → 117694443 → 117694445 (aller)
//          puis 1270670055 → 1276430470 → 302784346 → 302784353 →
//          302784349↑ → 485758352↑ (retour), + village (approx)
// ---------------------------------------------------------------
const TRAIL_COORDS = [
  // === ALLER : village → cascade (POI 1 → 5) ===
  // Way 117694453 — piste principale depuis le village vers le sud
  [43.5669925, 6.1804508],[43.5668478, 6.1806339],[43.5667273, 6.1807016],
  [43.5665376, 6.1807411],[43.5649677, 6.1809423],
  // Way 302784350 inversé — descente du vallon vers POI 3
  [43.5648614, 6.1816449],[43.5647823, 6.1819456],[43.5646988, 6.1822984],
  [43.5645399, 6.1825153],[43.5644804, 6.1828077],[43.5643963, 6.1828047],
  [43.5643725, 6.1826528],[43.5643229, 6.1820481],[43.5642107, 6.1817384],
  [43.5640251, 6.1818218],[43.5638740, 6.1820303],[43.5637747, 6.1821673],
  // Way 117694443 — couloir vers POI 4 (travertin)
  [43.5636776, 6.1822090],[43.5635351, 6.1822864],[43.5634229, 6.1825515],
  [43.5633409, 6.1826885],[43.5632404, 6.1829144],[43.5631107, 6.1832050],
  [43.5630215, 6.1834141],[43.5629443, 6.1835294],[43.5628039, 6.1836831],
  [43.5627489, 6.1835941],
  // Way 117694445 — approche de la cascade (POI 5)
  [43.5627270, 6.1843590],[43.5626862, 6.1843269],[43.5626383, 6.1844470],
  [43.5624807, 6.1841790],

  // === RETOUR : cascade → village (POI 5 → 14) ===
  // Way 1270670055 — sortie cascade vers POI 6
  [43.5627270, 6.1843590],[43.5628427, 6.1843053],[43.5629748, 6.1843916],
  [43.5630200, 6.1845620],[43.5631035, 6.1846620],
  // Way 1276430470 — montée vers POI 7
  [43.5631410, 6.1846086],[43.5632355, 6.1844335],[43.5633256, 6.1843928],
  [43.5635476, 6.1844212],[43.5635731, 6.1844772],[43.5636850, 6.1846073],
  [43.5637357, 6.1847569],
  // Way 302784346 — progression vers POI 8
  [43.5635960, 6.1850848],[43.5635202, 6.1851961],[43.5635063, 6.1852625],
  [43.5635161, 6.1853060],[43.5635741, 6.1856143],[43.5636679, 6.1858673],
  [43.5637787, 6.1859730],[43.5638665, 6.1861758],[43.5639351, 6.1862753],
  [43.5640946, 6.1863445],
  // Way 302784353 — traversée vers le retour (via POI 8)
  [43.5641917, 6.1862174],[43.5642520, 6.1859639],[43.5643307, 6.1860363],
  [43.5644355, 6.1861453],[43.5646067, 6.1862361],[43.5647038, 6.1858083],
  [43.5648856, 6.1858754],[43.5650255, 6.1858995],[43.5650559, 6.1857755],
  [43.5650410, 6.1856420],[43.5649766, 6.1854637],[43.5648486, 6.1848910],
  [43.5647923, 6.1846872],[43.5647806, 6.1845732],[43.5648367, 6.1844047],
  [43.5649169, 6.1843398],[43.5649726, 6.1842644],[43.5650770, 6.1842264],
  // Way 302784349 inversé — remontée côté est vers POI 9
  [43.5652213, 6.1838705],[43.5653296, 6.1836726],[43.5654472, 6.1834761],
  [43.5655949, 6.1833005],[43.5657412, 6.1831912],[43.5659141, 6.1830997],
  [43.5660514, 6.1830428],[43.5663063, 6.1829186],[43.5665840, 6.1827691],
  [43.5668253, 6.1826493],
  // Way 485758352 inversé — remontée vers POI 10, 11
  [43.5668280, 6.1825317],[43.5669106, 6.1824485],[43.5670942, 6.1823386],
  [43.5673135, 6.1821854],[43.5673992, 6.1821043],[43.5674727, 6.1819539],
  [43.5675841, 6.1818593],[43.5676502, 6.1817630],[43.5677653, 6.1816481],
  [43.5678094, 6.1816413],[43.5678522, 6.1816954],[43.5680077, 6.1815501],
  [43.5681767, 6.1814200],[43.5682381, 6.1813655],[43.5683101, 6.1813017],
  [43.5683451, 6.1813679],
  // === VILLAGE : POI 11 → 12 → 13 → 14 → retour POI 1 ===
  // Route de Salernes sud → Rue des Remparts ouest → POI 12
  [43.5682921, 6.1807510],[43.5682295, 6.1802388],
  [43.5682467, 6.1798913],[43.5682598, 6.1795149],
  [43.5682469, 6.1791197],[43.5682307, 6.1789726],
  [43.5681187, 6.1786295],[43.5680712, 6.1784717],
  [43.5679785, 6.1783437],[43.5678871, 6.1782492], // ≈ POI 12

  // Rue Vieille → Rue de la Mairie → POI 13
  [43.5676339, 6.1784620],[43.5676804, 6.1785792],
  [43.5677179, 6.1790216],[43.5676684, 6.1789815],
  [43.5675607, 6.1790767],[43.5675235, 6.1790828],
  [43.5674413, 6.1792980],[43.5674142, 6.1793861], // ≈ POI 13

  // Rue de la Mairie → résidentielle → POI 14 (Grand Rue)
  [43.5675235, 6.1790828],[43.5676684, 6.1789815],
  [43.5677179, 6.1790216],[43.5678108, 6.1790968],
  [43.5679132, 6.1791797],[43.5679659, 6.1792736], // ≈ POI 14

  // Grand Rue sud → retour POI 1
  [43.5679355, 6.1793747],[43.5678546, 6.1795399],
  [43.5677328, 6.1797373],[43.5675094, 6.1800323],
  [43.5673727, 6.1801546],[43.5671903, 6.1802736],
  [43.5670273, 6.1803424],[43.5669629, 6.1804071], // ≈ POI 1
];

// Couleurs par thème
const THEME_COLORS = {
  biodiversite: { bg: '#A6CE39', text: '#2d4a00' },
  geologie:     { bg: '#C4B090', text: '#3d2b0a' },
  histoire:     { bg: '#2CA6A4', text: '#ffffff' },
  securite:     { bg: '#13433F', text: '#ffffff' }
};

const THEME_LABELS = {
  biodiversite: 'Biodiversité',
  geologie:     'Géologie',
  histoire:     'Histoire',
  securite:     'Sécurité'
};

/* ============================================================
   ÉTAT PAN / ZOOM
   ============================================================ */

let panX = 0, panY = 0, zoom = 1, minZoom = 0.1;
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let dragPanX  = 0, dragPanY  = 0;

// Données POI chargées
let poisData = [];

// Éléments DOM
let viewport, mapWrapper, poiOverlay, gpsDot, gpsBtn, popup;

/* ============================================================
   CONVERSION COORDONNÉES
   ============================================================ */

/** GPS → coordonnées pixel sur l'image SVG */
function gpsToSVG(lat, lng) {
  const svgX = SVG_X_MIN + (lng - LNG_MIN) / (LNG_MAX - LNG_MIN) * (SVG_X_MAX - SVG_X_MIN);
  const svgY = SVG_Y_TOP + (LAT_MAX - lat)  / (LAT_MAX - LAT_MIN) * (SVG_Y_BOT - SVG_Y_TOP);
  return { x: svgX, y: svgY };
}

/** Coordonnées SVG → coordonnées écran (applique zoom + pan courants) */
function svgToScreen(svgX, svgY) {
  return {
    sx: svgX * zoom + panX,
    sy: svgY * zoom + panY
  };
}

/* ============================================================
   TRANSFORM
   ============================================================ */

function applyTransform() {
  mapWrapper.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  updateOverlay();
}

/** Contraint le pan pour que l'image ne sorte pas du viewport */
function clampPan(px, py, z) {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const imgW = SVG_W * z;
  const imgH = SVG_H * z;

  // Si l'image est plus grande que le viewport → contraindre ; sinon centrer
  const clampedX = imgW <= vw ? (vw - imgW) / 2 : Math.min(0, Math.max(vw - imgW,  px));
  const clampedY = imgH <= vh ? (vh - imgH) / 2 : Math.min(0, Math.max(vh - imgH,  py));
  return { px: clampedX, py: clampedY };
}

/** Zoom centré sur un point écran (cx, cy) */
function zoomAt(cx, cy, newZoom) {
  newZoom = Math.max(minZoom, Math.min(4, newZoom));
  const scale = newZoom / zoom;
  const newPanX = cx - scale * (cx - panX);
  const newPanY = cy - scale * (cy - panY);
  zoom = newZoom;
  const c = clampPan(newPanX, newPanY, zoom);
  panX = c.px; panY = c.py;
  applyTransform();
}

/** Cadre la vue sur la zone couverte par tous les POI (cadrage mobile) */
function fitToPois(pois) {
  if (!pois.length) return;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  pois.forEach(poi => {
    const { x, y } = gpsToSVG(poi.coords.lat, poi.coords.lng);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });

  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const pad = 1.18; // marge autour des pins
  const bboxW = (maxX - minX) || 1;
  const bboxH = (maxY - minY) || 1;
  const fitZoom = Math.min(vw / (bboxW * pad), vh / (bboxH * pad));

  centerOn((minX + maxX) / 2, (minY + maxY) / 2, fitZoom);
}

/** Centre la carte sur un point SVG avec un zoom optionnel */
function centerOn(svgX, svgY, targetZoom) {
  targetZoom = Math.max(minZoom, Math.min(4, targetZoom ?? zoom));
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const newPanX = vw / 2 - svgX * targetZoom;
  const newPanY = vh / 2 - svgY * targetZoom;
  zoom = targetZoom;
  const c = clampPan(newPanX, newPanY, zoom);
  panX = c.px; panY = c.py;
  applyTransform();
}

/* ============================================================
   OVERLAY MARQUEURS
   ============================================================ */

/** Repositionne tous les marqueurs .poi-pin en coordonnées écran */
function updateOverlay() {
  const pins = poiOverlay.querySelectorAll('.poi-pin');
  pins.forEach(pin => {
    const svgX = parseFloat(pin.dataset.svgX);
    const svgY = parseFloat(pin.dataset.svgY);
    const { sx, sy } = svgToScreen(svgX, svgY);
    pin.style.left = sx + 'px';
    pin.style.top  = sy + 'px';
  });

  // Marqueur GPS si présent
  if (gpsDot && gpsDot.dataset.svgX) {
    const { sx, sy } = svgToScreen(
      parseFloat(gpsDot.dataset.svgX),
      parseFloat(gpsDot.dataset.svgY)
    );
    gpsDot.style.left = sx + 'px';
    gpsDot.style.top  = sy + 'px';
  }

  // Redessine le chemin entre POI
  drawPath();
}

/* ============================================================
   CHEMIN ENTRE POI — Catmull-Rom spline sur canvas
   ============================================================ */

let pathCanvas = null;

/** Dessine le sentier réel (coordonnées OSM) sous forme de Catmull-Rom spline */
function drawPath() {
  if (!pathCanvas) return;

  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  pathCanvas.width  = vw;
  pathCanvas.height = vh;

  const ctx = pathCanvas.getContext('2d');
  ctx.clearRect(0, 0, vw, vh);

  // Convertit les coords GPS réelles → coordonnées écran
  const pts = TRAIL_COORDS.map(([lat, lng]) => {
    const { x, y } = gpsToSVG(lat, lng);
    return svgToScreen(x, y);
  });

  if (pts.length < 2) return;

  // Progression du visiteur : le tracé s'estompe au fur et à mesure des POI
  // visités, sans jamais disparaître (plancher à 30 % de l'opacité initiale).
  let progress = 0;
  if (poisData.length && typeof estVisite === 'function') {
    const visites = poisData.filter(p => estVisite(p.id)).length;
    progress = visites / poisData.length;
  }
  const fade = 1 - progress * 0.7;   // 1 (aucun visité) → 0.3 (tous visités)

  // Construit le path Catmull-Rom → Bezier cubique
  const tension = 0.4;

  function catmullToBezier(p0, p1, p2, p3) {
    return {
      cp1x: p1.sx + (p2.sx - p0.sx) / 6 * tension,
      cp1y: p1.sy + (p2.sy - p0.sy) / 6 * tension,
      cp2x: p2.sx - (p3.sx - p1.sx) / 6 * tension,
      cp2y: p2.sy - (p3.sy - p1.sy) / 6 * tension,
    };
  }

  function buildPath() {
    ctx.beginPath();
    ctx.moveTo(pts[0].sx, pts[0].sy);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];
      const { cp1x, cp1y, cp2x, cp2y } = catmullToBezier(p0, p1, p2, p3);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.sx, p2.sy);
    }
  }

  // 1re passe — ombre sombre (lisibilité sur fond clair comme le beige du village)
  buildPath();
  ctx.strokeStyle = `rgba(30, 50, 30, ${(0.30 * fade).toFixed(3)})`;
  ctx.lineWidth   = 5;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.setLineDash([9, 7]);
  ctx.lineDashOffset = 0;
  ctx.stroke();

  // 2e passe — tiret clair par-dessus (lisibilité sur fond sombre)
  buildPath();
  ctx.strokeStyle = `rgba(255, 252, 240, ${(0.88 * fade).toFixed(3)})`;
  ctx.lineWidth   = 2.5;
  ctx.setLineDash([9, 7]);
  ctx.stroke();

  ctx.setLineDash([]);
}

/** Crée les éléments .poi-pin pour chaque POI */
function renderPins(pois) {
  // Vider l'overlay sauf le gpsDot
  const existingPins = poiOverlay.querySelectorAll('.poi-pin');
  existingPins.forEach(p => p.remove());

  pois.forEach(poi => {
    const { x: svgX, y: svgY } = gpsToSVG(poi.coords.lat, poi.coords.lng);
    const colors = THEME_COLORS[poi.theme] ?? THEME_COLORS.securite;
    const visite = typeof estVisite === 'function' && estVisite(poi.id);
    const isDepart = poi.ordre === 1;

    const pin = document.createElement('div');
    pin.className = 'poi-pin'
      + (isDepart ? ' poi-pin--depart' : '')
      + (visite ? ' poi-pin--visite' : '');
    pin.dataset.svgX  = svgX;
    pin.dataset.svgY  = svgY;
    pin.dataset.poiId = poi.id;
    pin.setAttribute('aria-label', `${isDepart ? 'Départ' : 'POI'} ${poi.ordre}, ${poi.titre}`);
    pin.setAttribute('role', 'button');
    pin.setAttribute('tabindex', '0');

    const bubble = document.createElement('div');
    bubble.className = 'poi-pin__bubble';
    bubble.style.background = colors.bg;
    bubble.style.color       = colors.text;
    // Contenu enveloppé dans un span pour pouvoir le redresser (la goutte du
    // marqueur départ est pivotée à -45°).
    const num = document.createElement('span');
    num.className = 'poi-pin__num';
    num.textContent = poi.ordre;
    bubble.appendChild(num);

    pin.appendChild(bubble);

    // Étiquette « Départ » sous le marqueur 1 pour rendre le point de départ évident
    if (isDepart) {
      const tag = document.createElement('span');
      tag.className = 'poi-pin__depart-label';
      tag.textContent = 'Départ';
      pin.appendChild(tag);
    }

    poiOverlay.appendChild(pin);

    // Clic souris + clavier
    pin.addEventListener('click', e => { e.stopPropagation(); showPopup(poi); });
    pin.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showPopup(poi); }
    });
    // Touch mobile — touchend direct sur le pin (pas de dépendance à la synthèse click)
    let pinTouchMoved = false;
    pin.addEventListener('touchstart', e => { pinTouchMoved = false; }, { passive: true });
    pin.addEventListener('touchmove',  () => { pinTouchMoved = true; },  { passive: true });
    pin.addEventListener('touchend',   e => {
      if (!pinTouchMoved) { e.preventDefault(); e.stopPropagation(); showPopup(poi); }
    });
  });

  updateOverlay();
}

/* ============================================================
   POPUP (mini-fiche)
   ============================================================ */

let popupOpen = false;
let currentPoi = null;

function showPopup(poi) {
  currentPoi = poi;
  const colors = THEME_COLORS[poi.theme] ?? THEME_COLORS.securite;

  document.getElementById('popup-badge').textContent       = THEME_LABELS[poi.theme] ?? poi.theme;
  document.getElementById('popup-badge').style.background  = colors.bg;
  document.getElementById('popup-badge').style.color       = colors.text;
  document.getElementById('popup-num').textContent         = `POI ${poi.ordre} / 14`;
  document.getElementById('popup-titre').textContent       = poi.titre;
  document.getElementById('popup-desc').textContent        = poi.description;

  popup.setAttribute('aria-hidden', 'false');
  popup.classList.add('visible');
  popupOpen = true;

  // Marquer comme visité
  if (typeof marquerPoiVisite === 'function') {
    marquerPoiVisite(poi.id);
    const pin = poiOverlay.querySelector(`[data-poi-id="${poi.id}"]`);
    if (pin) pin.classList.add('poi-pin--visite');
    // Met à jour le fondu du tracé selon la nouvelle progression
    drawPath();
  }
  if (typeof nbVisites === 'function') {
    const prog = document.getElementById('progress-display');
    if (prog) prog.textContent = `${nbVisites()} / 14`;
  }
}

function closePopup() {
  popup.classList.remove('visible');
  popup.setAttribute('aria-hidden', 'true');
  popupOpen = false;
}

/* ============================================================
   SHEET DÉTAIL POI (plein contenu)
   ============================================================ */

let detail, detailOpen = false;
let audioEl = null, audioPlayBtn = null, audioFill = null, audioTimeEl = null, audioRAF = null;

function showDetail(poi) {
  if (!detail) return;
  const colors = THEME_COLORS[poi.theme] ?? THEME_COLORS.securite;

  document.getElementById('detail-badge').textContent      = THEME_LABELS[poi.theme] ?? poi.theme;
  document.getElementById('detail-badge').style.background = colors.bg;
  document.getElementById('detail-badge').style.color      = colors.text;
  document.getElementById('detail-num').textContent        = `POI ${poi.ordre} / 14`;
  document.getElementById('detail-titre').textContent      = poi.titre;
  document.getElementById('detail-desc').textContent       = poi.description;
  document.getElementById('detail-contenu').textContent    = poi.contenu ?? '';

  // Photo
  const photoWrap = document.getElementById('detail-photo-wrap');
  photoWrap.innerHTML = '';
  if (poi.photo) {
    const img = document.createElement('img');
    img.className = 'poi-detail__photo';
    img.src = '../' + poi.photo;
    img.alt = poi.titre;
    img.onerror = () => { photoWrap.innerHTML = '<div class="poi-detail__photo-placeholder"></div>'; };
    photoWrap.appendChild(img);
  } else {
    photoWrap.innerHTML = '<div class="poi-detail__photo-placeholder"></div>';
  }

  // Audio narration
  const audioWrap = document.getElementById('detail-audio-wrap');
  const num = String(poi.ordre).padStart(2, '0');
  const audioSrc = `../audio/poi-${num}.mp3`;
  audioEl.pause();
  audioEl.src = audioSrc;
  audioEl.load();
  resetAudioUI();
  // Affiche le player uniquement si le fichier peut être chargé
  audioEl.onerror = () => { audioWrap.classList.add('hidden'); };
  audioEl.oncanplay = () => { audioWrap.classList.remove('hidden'); };
  audioWrap.classList.add('hidden'); // masqué par défaut jusqu'à canplay

  // Conseil
  const conseilWrap = document.getElementById('detail-conseil-wrap');
  if (poi.conseil) {
    document.getElementById('detail-conseil').textContent = poi.conseil;
    conseilWrap.style.display = '';
  } else {
    conseilWrap.style.display = 'none';
  }

  // Espèces
  const especesWrap = document.getElementById('detail-especes-wrap');
  const especesList = document.getElementById('detail-especes');
  if (poi.especes && poi.especes.length) {
    especesList.innerHTML = poi.especes.map(e => `<li>${e}</li>`).join('');
    especesWrap.style.display = '';
  } else {
    especesWrap.style.display = 'none';
  }

  // Reset scroll
  document.getElementById('detail-scroll').scrollTop = 0;

  detail.setAttribute('aria-hidden', 'false');
  detail.classList.add('visible');
  detailOpen = true;
}

function closeDetail() {
  detail.classList.remove('visible');
  detail.setAttribute('aria-hidden', 'true');
  detailOpen = false;
  if (audioEl) { audioEl.pause(); resetAudioUI(); }
}

/* --- Utilitaires audio --- */
function resetAudioUI() {
  if (audioRAF) { cancelAnimationFrame(audioRAF); audioRAF = null; }
  if (audioFill) audioFill.style.width = '0%';
  if (audioTimeEl) audioTimeEl.textContent = '0:00';
  if (audioPlayBtn) {
    audioPlayBtn.classList.remove('playing');
    document.getElementById('audio-icon-play').style.display  = '';
    document.getElementById('audio-icon-pause').style.display = 'none';
  }
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2,'0')}`;
}

function tickAudio() {
  if (!audioEl || audioEl.paused) return;
  const pct = audioEl.duration ? (audioEl.currentTime / audioEl.duration * 100) : 0;
  audioFill.style.width = pct + '%';
  audioTimeEl.textContent = formatTime(audioEl.currentTime);
  audioRAF = requestAnimationFrame(tickAudio);
}

function initAudioPlayer() {
  audioEl       = document.getElementById('detail-audio');
  audioPlayBtn  = document.getElementById('audio-play-btn');
  audioFill     = document.getElementById('audio-fill');
  audioTimeEl   = document.getElementById('audio-time');
  const bar     = document.getElementById('audio-bar');

  audioPlayBtn.addEventListener('click', () => {
    if (audioEl.paused) {
      audioEl.play().then(() => {
        audioPlayBtn.classList.add('playing');
        document.getElementById('audio-icon-play').style.display  = 'none';
        document.getElementById('audio-icon-pause').style.display = '';
        audioRAF = requestAnimationFrame(tickAudio);
      }).catch(() => {});
    } else {
      audioEl.pause();
      audioPlayBtn.classList.remove('playing');
      document.getElementById('audio-icon-play').style.display  = '';
      document.getElementById('audio-icon-pause').style.display = 'none';
      if (audioRAF) { cancelAnimationFrame(audioRAF); audioRAF = null; }
    }
  });

  audioEl.addEventListener('ended', resetAudioUI);

  // Seek en cliquant sur la barre
  bar.addEventListener('click', e => {
    if (!audioEl.duration) return;
    const rect = bar.getBoundingClientRect();
    audioEl.currentTime = (e.clientX - rect.left) / rect.width * audioEl.duration;
  });
}

/* ============================================================
   ÉVÉNEMENTS SOURIS
   ============================================================ */

function onMouseDown(e) {
  if (e.button !== 0) return;
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragPanX   = panX;
  dragPanY   = panY;
  viewport.classList.add('is-dragging');
  e.preventDefault();
}

function onMouseMove(e) {
  if (!isDragging) return;
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  const c = clampPan(dragPanX + dx, dragPanY + dy, zoom);
  panX = c.px; panY = c.py;
  applyTransform();
}

function onMouseUp() {
  isDragging = false;
  viewport.classList.remove('is-dragging');
}

function onWheel(e) {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 1.12 : 1 / 1.12;
  const rect  = viewport.getBoundingClientRect();
  zoomAt(e.clientX - rect.left, e.clientY - rect.top, zoom * delta);
}

/* ============================================================
   ÉVÉNEMENTS TACTILES
   ============================================================ */

let lastTouchDist = 0;
let lastTapTime   = 0;
let touchMoved    = false;

function getTouchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

function onTouchStart(e) {
  // Si le touch vise un pin POI → ne pas intercepter, laisser le click se propager
  if (e.target.closest('.poi-pin')) return;

  if (e.touches.length === 1) {
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
    dragPanX   = panX;
    dragPanY   = panY;
    isDragging = true;
    touchMoved = false;
  } else if (e.touches.length === 2) {
    isDragging    = false;
    lastTouchDist = getTouchDist(e.touches);
  }
  e.preventDefault();
}

function onTouchMove(e) {
  if (e.touches.length === 1 && isDragging) {
    const dx = e.touches[0].clientX - dragStartX;
    const dy = e.touches[0].clientY - dragStartY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) touchMoved = true;
    const c = clampPan(dragPanX + dx, dragPanY + dy, zoom);
    panX = c.px; panY = c.py;
    applyTransform();
  } else if (e.touches.length === 2) {
    const dist  = getTouchDist(e.touches);
    const scale = dist / lastTouchDist;
    const cx    = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const cy    = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    const rect  = viewport.getBoundingClientRect();
    zoomAt(cx - rect.left, cy - rect.top, zoom * scale);
    lastTouchDist = dist;
  }
  e.preventDefault();
}

function onTouchEnd(e) {
  isDragging = false;

  // Double-tap : zoom in → zoom out (toggle)
  if (e.changedTouches.length === 1 && !touchMoved) {
    const now = Date.now();
    if (now - lastTapTime < 300) {
      const rect = viewport.getBoundingClientRect();
      const cx   = e.changedTouches[0].clientX - rect.left;
      const cy   = e.changedTouches[0].clientY - rect.top;
      const targetZoom = zoom < minZoom * 2.5 ? minZoom * 3 : minZoom;
      zoomAt(cx, cy, targetZoom);
      lastTapTime = 0;
    } else {
      lastTapTime = now;
    }
  }
}

/* ============================================================
   GÉOLOCALISATION
   ============================================================ */

let gpsWatchId  = null;
let gpsTracking = false;

function initGPS() {
  gpsBtn.addEventListener('click', () => {
    if (!('geolocation' in navigator)) {
      alert('La géolocalisation n\'est pas disponible sur cet appareil.');
      return;
    }

    if (!gpsTracking) {
      gpsTracking = true;
      gpsBtn.classList.add('active');

      gpsWatchId = navigator.geolocation.watchPosition(
        pos => {
          const { x: svgX, y: svgY } = gpsToSVG(pos.coords.latitude, pos.coords.longitude);
          gpsDot.dataset.svgX  = svgX;
          gpsDot.dataset.svgY  = svgY;
          gpsDot.style.display = 'block';
          updateOverlay();
          // Recentrer sur la position utilisateur
          centerOn(svgX, svgY, Math.max(zoom, minZoom * 3));
        },
        err => {
          console.warn('GPS erreur :', err.message);
          gpsTracking = false;
          gpsBtn.classList.remove('active');
        },
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    } else {
      // Désactiver le suivi GPS
      gpsTracking = false;
      gpsBtn.classList.remove('active');
      if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
      }
      gpsDot.style.display = 'none';
      delete gpsDot.dataset.svgX;
      delete gpsDot.dataset.svgY;
    }
  });
}

/* ============================================================
   INITIALISATION
   ============================================================ */

async function initCarte() {
  viewport   = document.getElementById('carte-viewport');
  mapWrapper = document.getElementById('map-wrapper');
  poiOverlay = document.getElementById('poi-overlay');
  gpsDot     = document.getElementById('gps-dot');
  popup      = document.getElementById('poi-popup');
  gpsBtn     = document.getElementById('gps-btn');
  pathCanvas = document.getElementById('path-canvas');

  // Le gpsDot est dans l'overlay pour être positionné comme les pins
  poiOverlay.appendChild(gpsDot);

  // minZoom : cover — l'image remplit toujours le viewport (pas de bords verts)
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  minZoom = Math.max(vw / SVG_W, vh / SVG_H);
  zoom    = minZoom;

  // Position initiale centrée (vue d'ensemble)
  const c = clampPan(
    (vw - SVG_W * zoom) / 2,
    (vh - SVG_H * zoom) / 2,
    zoom
  );
  panX = c.px;
  panY = c.py;
  applyTransform();

  // Chargement des POI
  try {
    const data = await fetch('../data/poi.json').then(r => r.json());
    poisData = data.pois ?? [];
  } catch (e) {
    console.error('Impossible de charger poi.json :', e);
    poisData = [];
  }

  renderPins(poisData);

  // Cadrage initial sur l'ensemble des POI (vue mobile)
  fitToPois(poisData);

  // Compteur de progression initial
  if (typeof nbVisites === 'function') {
    const prog = document.getElementById('progress-display');
    if (prog) prog.textContent = `${nbVisites()} / 14`;
  }

  // Événements souris
  viewport.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove',   onMouseMove);
  window.addEventListener('mouseup',     onMouseUp);
  viewport.addEventListener('wheel',     onWheel, { passive: false });

  // Événements tactiles
  viewport.addEventListener('touchstart', onTouchStart, { passive: false });
  viewport.addEventListener('touchmove',  onTouchMove,  { passive: false });
  viewport.addEventListener('touchend',   onTouchEnd,   { passive: false });

  // Fermer la popup en cliquant sur le viewport
  viewport.addEventListener('click', () => { if (popupOpen) closePopup(); });

  // Bouton fermeture popup + swipe bas
  document.getElementById('popup-close-btn').addEventListener('click', closePopup);
  let swipeStartY = 0;
  popup.addEventListener('touchstart', e => { swipeStartY = e.touches[0].clientY; }, { passive: true });
  popup.addEventListener('touchend', e => {
    if (e.changedTouches[0].clientY - swipeStartY > 60) closePopup();
  }, { passive: true });

  // Sheet détail
  detail = document.getElementById('poi-detail');

  // Bouton "Découvrir" ouvre le sheet détail
  document.getElementById('popup-link').addEventListener('click', () => {
    if (currentPoi) { closePopup(); showDetail(currentPoi); }
  });

  // Bouton fermeture détail + swipe bas
  document.getElementById('detail-close-btn').addEventListener('click', closeDetail);
  let detailSwipeY = 0;
  const detailScroll = document.getElementById('detail-scroll');
  detail.addEventListener('touchstart', e => { detailSwipeY = e.touches[0].clientY; }, { passive: true });
  detail.addEventListener('touchend', e => {
    const dy = e.changedTouches[0].clientY - detailSwipeY;
    if (dy > 80 && detailScroll.scrollTop === 0) closeDetail();
  }, { passive: true });

  // Lecteur audio
  initAudioPlayer();

  // GPS
  initGPS();

  // Recalcul au resize
  window.addEventListener('resize', () => {
    const nvw = viewport.clientWidth;
    const nvh = viewport.clientHeight;
    minZoom = Math.max(nvw / SVG_W, nvh / SVG_H);
    fitToPois(poisData);
  });
}

// Lancer après chargement du DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCarte);
} else {
  initCarte();
}
