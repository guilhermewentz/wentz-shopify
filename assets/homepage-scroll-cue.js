(() => {
  let cleanup = () => {};
  const init = () => {
    cleanup();
    document.querySelectorAll('.homepage-scroll-cue').forEach(cue => cue.remove());
    const sections = [...document.querySelectorAll('#main > .shopify-section:not(.shopify-section-group-footer-group)')];
    const first = sections[0];
    const media = first?.querySelector('.content-over-media');
    const next = sections[1];
    if (!media || !next?.id) return;
    const controller = new AbortController();
    const { signal } = controller;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const cue = document.createElement('button');
    cue.className = 'homepage-scroll-cue';
    cue.type = 'button';
    cue.setAttribute('aria-controls', next.id);
    cue.setAttribute('aria-label', document.documentElement.lang.startsWith('pt') ? 'Rolar para o próximo banner' : 'Scroll to the next banner');
    cue.innerHTML = '<svg aria-hidden="true" width="18" height="26" viewBox="0 0 18 26" fill="none"><path d="M9 2v20M3 16l6 6 6-6" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    // Keep the original content as the last child, preserving the theme's hover rules.
    const content = media.querySelector(':scope > .homepage-banner-content');
    media.insertBefore(cue, content || null);
    const update = () => {
      const hidden = media.getBoundingClientRect().top < -64;
      cue.classList.toggle('is-dismissed', hidden);
      cue.tabIndex = hidden ? -1 : 0;
      cue.setAttribute('aria-hidden', String(hidden));
    };
    cue.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      next.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
    }, { signal });
    window.addEventListener('scroll', update, { passive: true, signal });
    update();
    cleanup = () => { controller.abort(); cue.remove(); };
  };
  init();
  ['shopify:section:load', 'shopify:section:reorder', 'shopify:section:unload'].forEach(name => {
    document.addEventListener(name, () => requestAnimationFrame(init));
  });
})();
