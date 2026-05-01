/**
 * carte.js — Carte Leaflet interactive avec les 14 POI
 */

const THEME_COLORS = {
  biodiversite: '#A6CE39',
  geologie: '#DCC9B1',
  histoire: '#2CA6A4',
  securite: '#13433F'
};

const THEME_TEXT = {
  biodiversite: '#2d4000',
  geologie: '#4a3a25',
  histoire: '#ffffff',
  securite: '#F7F6F2'
};

let map, userMarker;

async function initCarte() {
  // Initialisation Leaflet — centré sur Sillans-la-Cascade
  map = L.map('map', {
    center: [43.5658, 6.1818],
    zoom: 15,
    zoomControl: true,
    attributionControl: true
  });

  // Fond de carte OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  // Chargement des POI
  const pois = await chargerPOI();
  if (!pois.length) return;

  pois.forEach(poi => ajouterMarqueur(poi));

  // Mise à jour compteur
  mettreAJourCompteur();

  // GPS utilisateur
  activerGPS();
}

function ajouterMarqueur(poi) {
  const visite = estVisite(poi.id);
  const couleur = THEME_COLORS[poi.theme] || '#13433F';
  const textColor = THEME_TEXT[poi.theme] || '#ffffff';

  // Icône personnalisée en forme de pin
  const icon = L.divIcon({
    className: '',
    html: `
      <div style="
        width:36px;height:36px;
        background:${couleur};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        display:flex;align-items:center;justify-content:center;
        opacity:${visite ? 0.5 : 1};
      ">
        <span style="
          transform:rotate(45deg);
          font-family:'Barlow Condensed',sans-serif;
          font-weight:700;font-size:13px;
          color:${textColor};
          line-height:1;
        ">${poi.ordre}</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [10, 36],
    popupAnchor: [8, -38]
  });

  const marker = L.marker([poi.coords.lat, poi.coords.lng], { icon });

  marker.bindPopup(`
    <div class="popup-content">
      <div class="popup-num">POI ${String(poi.ordre).padStart(2,'0')} · ${themeLabel(poi.theme)}</div>
      <div class="popup-titre">${poi.titre}</div>
      <a href="poi.html?id=${poi.id}" class="popup-btn">Découvrir →</a>
    </div>
  `, { maxWidth: 220 });

  marker.addTo(map);
}

function activerGPS() {
  if (!navigator.geolocation) return;

  navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;

      if (!userMarker) {
        const userIcon = L.divIcon({
          className: '',
          html: `<div class="marker-user"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });
        userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      } else {
        userMarker.setLatLng([lat, lng]);
      }
    },
    (err) => console.warn('GPS non disponible :', err.message),
    { enableHighAccuracy: true, maximumAge: 10000 }
  );
}

function mettreAJourCompteur() {
  const el = document.getElementById('progress-display');
  if (el) el.textContent = `${nbVisites()} / 14`;
}

// Démarrage
document.addEventListener('DOMContentLoaded', initCarte);
