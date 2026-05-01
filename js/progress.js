/**
 * progress.js — Gestion de la progression locale
 * Stockage via localStorage : visites POI + scores QCM
 */

const STORAGE_KEY = 'visiter-sillans-progress';
const QCM_KEY     = 'visiter-sillans-qcm';

/* --- Progression des POI --- */

function getProgression() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { visites: [] };
  } catch (e) {
    return { visites: [] };
  }
}

function sauvegarderProgression(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function marquerPoiVisite(poiId) {
  const prog = getProgression();
  if (!prog.visites.includes(poiId)) {
    prog.visites.push(poiId);
    sauvegarderProgression(prog);
  }
}

function estVisite(poiId) {
  return getProgression().visites.includes(poiId);
}

function nbVisites() {
  return getProgression().visites.length;
}

/* --- Scores QCM --- */

function sauvegarderScore(score, total) {
  const data = {
    score,
    total,
    niveau: getNiveauQCM(score),
    date: new Date().toISOString()
  };
  localStorage.setItem(QCM_KEY, JSON.stringify(data));
  return data;
}

function getDernierScore() {
  try {
    return JSON.parse(localStorage.getItem(QCM_KEY));
  } catch (e) {
    return null;
  }
}

function getNiveauQCM(score) {
  if (score <= 3) return { titre: 'Découvreur', desc: "Belle tentative ! Retentez le quiz après avoir exploré tous les points d'intérêt." };
  if (score <= 6) return { titre: 'Naturaliste en herbe', desc: "Vous commencez à connaître les secrets du sanctuaire. Continuez d'explorer !" };
  if (score <= 9) return { titre: 'Naturaliste', desc: 'Excellent ! Votre connaissance du site est remarquable.' };
  return { titre: 'Gardien du Sanctuaire', desc: "Parfait ! Vous maîtrisez tous les secrets de l'ENS de Sillans-la-Cascade." };
}

/* --- Réinitialisation complète --- */

function resetProgression() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(QCM_KEY);
}
