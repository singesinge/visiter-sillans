/**
 * transitions.js — Transitions de page fluides (fade + slide)
 * Intercepte les clics sur liens internes, fade-out avant navigation
 * Le fade-in est géré par l'animation CSS sur body
 */
(function () {
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href) return;
    // Ignorer : ancres, protocoles spéciaux, nouveaux onglets
    if (
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('javascript:') ||
      a.target === '_blank'
    ) return;
    // Ignorer les liens externes
    try {
      const url = new URL(href, window.location.href);
      if (url.hostname !== window.location.hostname) return;
    } catch (_) { return; }

    e.preventDefault();
    document.documentElement.classList.add('page-exit');
    setTimeout(function () { window.location.href = href; }, 220);
  });
})();
