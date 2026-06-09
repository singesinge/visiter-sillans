/**
 * qcm.js — Quiz naturaliste (10 questions)
 * Fisher-Yates shuffle + gestion score + niveaux
 */

let questions = [];
let questionIndex = 0;
let score = 0;
let reponduCette = false;

/* --- Fisher-Yates shuffle --- */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function initQCM() {
  const raw = await chargerQCM();
  if (!raw.length) return;

  questions = shuffle(raw).slice(0, 10);
  score = 0;
  questionIndex = 0;
  reponduCette = false;

  document.getElementById('q-total').textContent = questions.length;
  creerDots();
  afficherQuestion();
}

function creerDots() {
  const container = document.getElementById('dots-container');
  container.innerHTML = '';
  questions.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'qcm-dot' + (i === 0 ? ' active' : '');
    dot.id = `dot-${i}`;
    container.appendChild(dot);
  });
}

function afficherQuestion() {
  if (questionIndex >= questions.length) {
    afficherResultat();
    return;
  }

  const q = questions[questionIndex];
  document.getElementById('q-actuelle').textContent = questionIndex + 1;
  document.getElementById('question-texte').textContent = q.question;

  // Mélanger les réponses à chaque affichage
  const repsMelangees = shuffle(q.reponses);
  const container = document.getElementById('reponses-container');
  container.innerHTML = '';

  repsMelangees.forEach(rep => {
    const card = document.createElement('button');
    card.className = 'reponse-card';
    card.textContent = rep.texte;
    card.dataset.correcte = rep.correcte;
    card.onclick = () => choisirReponse(card, rep.correcte, q.explication);
    container.appendChild(card);
  });

  // Reset UI
  document.getElementById('explication').classList.remove('visible');
  document.getElementById('explication-text').textContent = '';
  document.getElementById('btn-suivant').classList.remove('visible');
  reponduCette = false;

  // Dot actif
  document.querySelectorAll('.qcm-dot').forEach((d, i) => {
    d.classList.toggle('active', i === questionIndex);
  });
}

function choisirReponse(card, correcte, explication) {
  if (reponduCette) return;
  reponduCette = true;

  // Révéler toutes les bonnes réponses
  document.querySelectorAll('.reponse-card').forEach(c => {
    c.classList.add('disabled');
    if (c.dataset.correcte === 'true') c.classList.add('selected-correct');
  });

  if (correcte) {
    card.classList.add('selected-correct');
    score++;
  } else {
    card.classList.add('selected-incorrect');
  }

  // Mettre à jour le dot
  const dot = document.getElementById(`dot-${questionIndex}`);
  if (dot) {
    dot.classList.remove('active');
    dot.classList.add(correcte ? 'correct' : 'incorrect');
  }

  // Afficher l'explication
  const explEl = document.getElementById('explication');
  document.getElementById('explication-text').textContent = explication;
  explEl.classList.add('visible');

  // Bouton suivant
  const btnSuiv = document.getElementById('btn-suivant');
  btnSuiv.textContent = questionIndex < questions.length - 1 ? 'Question suivante →' : 'Voir mes résultats';
  btnSuiv.classList.add('visible');
}

function questionSuivante() {
  questionIndex++;
  afficherQuestion();
}

function afficherResultat() {
  document.getElementById('zone-quiz').style.display = 'none';
  const ecran = document.getElementById('score-screen');
  ecran.classList.add('visible');

  const niveau = getNiveauQCM(score);
  sauvegarderScore(score, questions.length);

  document.getElementById('score-nombre').textContent = `${score}/${questions.length}`;
  document.getElementById('score-niveau').textContent = niveau.titre;
  document.getElementById('score-desc').textContent = niveau.desc;

  const total = questions.length;
  const pct = total ? Math.round((score / total) * 100) : 0;

  // Mascotte selon le score : émerveillée si bon score, questionneuse sinon
  const bon = pct >= 60;
  const mascEl = document.getElementById('score-mascotte');
  if (mascEl) {
    mascEl.src = bon ? '../img/mascotte-09.svg' : '../img/mascotte-06.svg';
    mascEl.style.display = '';
  }

  // Accroche dynamique selon le score
  const eyebrow = document.getElementById('score-eyebrow');
  if (eyebrow) {
    let txt = 'Bon début !';
    if (pct === 100)      txt = 'Sans-faute ! ✨';
    else if (pct >= 80)   txt = 'Bravo ! ✨';
    else if (pct >= 60)   txt = 'Bien joué !';
    else if (pct >= 40)   txt = 'Pas mal !';
    eyebrow.textContent = txt;
  }

  // Anneau de progression autour du score
  const ring = document.getElementById('score-ring');
  if (ring) ring.style.setProperty('--pct', pct);

  // Points : un par question, allumés selon le nombre de bonnes réponses
  const dots = document.getElementById('score-dots');
  if (dots) {
    dots.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const s = document.createElement('span');
      if (i < score) s.className = 'on';
      dots.appendChild(s);
    }
  }
}

function relancerQCM() {
  document.getElementById('score-screen').classList.remove('visible');
  document.getElementById('zone-quiz').style.display = 'block';
  initQCM();
}

document.addEventListener('DOMContentLoaded', initQCM);
