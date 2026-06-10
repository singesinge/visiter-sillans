/**
 * proximity.js — Détection de proximité GPS et notifications POI
 *
 * Déclenche une notification Web quand l'utilisateur s'approche à moins
 * de SEUIL_METRES d'un point d'intérêt.
 *
 * ⚠️  Limitations connues :
 *   - iOS Safari : notifications web non supportées hors PWA installée
 *   - Nécessite HTTPS en production (exigence navigateur pour Geolocation + Notifications)
 *   - La notification n'est visible que si l'app est ouverte en premier plan
 */

const SEUIL_METRES  = 50;    // Distance de déclenchement (mètres)
const _dejaNotifie  = new Set(); // POIs déjà notifiés cette session

/* -------------------------------------------------------
   Haversine — distance en mètres entre deux coords GPS
------------------------------------------------------- */
function haversine(lat1, lng1, lat2, lng2) {
  const R    = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a    = Math.sin(dLat / 2) ** 2
             + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
             * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* -------------------------------------------------------
   Point d'entrée — appelé au DOMContentLoaded
------------------------------------------------------- */
async function initProximite() {
  if (!('geolocation' in navigator)) return;

  if (!('Notification' in window)) {
    console.info('[proximity] Notifications non supportées sur ce navigateur.');
    return;
  }

  // Demande de permission si pas encore accordée
  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') return;

  // Chargement des POIs depuis le cache JSON
  const pois = await chargerPOI();
  if (!pois || !pois.length) return;

  // Surveillance continue de la position
  navigator.geolocation.watchPosition(
    position  => _verifierProximite(position, pois),
    err       => console.warn('[proximity] Géoloc :', err.message),
    {
      enableHighAccuracy: true,
      maximumAge: 5000,    // Accepte une position vieille de max 5s
      timeout: 10000
    }
  );
}

/* -------------------------------------------------------
   Vérification pour chaque mise à jour de position
------------------------------------------------------- */
function _verifierProximite(position, pois) {
  const { latitude, longitude } = position.coords;

  pois.forEach(poi => {
    if (_dejaNotifie.has(poi.id)) return; // Déjà notifié cette session

    const dist = haversine(latitude, longitude, poi.coords.lat, poi.coords.lng);
    if (dist > SEUIL_METRES) return;

    _dejaNotifie.add(poi.id);
    _envoyerNotification(poi);
  });
}

/* -------------------------------------------------------
   Création et envoi de la notification
------------------------------------------------------- */
function _envoyerNotification(poi) {
  const num  = String(poi.ordre).padStart(2, '0');
  const body = poi.description.length > 100
    ? poi.description.slice(0, 97) + '…'
    : poi.description;

  const notif = new Notification(`📍 POI ${poi.ordre} · ${poi.titre}`, {
    body,
    icon:      `../img/poi/poi-${num}.jpg`,
    tag:       poi.id,   // Évite les doublons si notif déjà affichée
    renotify:  false,
    silent:    false,
    data:      { poiId: poi.id }
  });

  // Clic sur la notification → ouvre la fiche POI (chemin relatif à html/carte.html)
  notif.onclick = () => {
    window.focus();
    window.location.href = `poi.html?id=${poi.id}`;
  };
}

// Démarrage automatique
document.addEventListener('DOMContentLoaded', initProximite);
