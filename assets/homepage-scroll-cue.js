(() => {
  let cleanup = () => {};
  const init = () => {
    cleanup();
    document.querySelectorAll('.homepage-scroll-cue').forEach(cue => cue.remove());
    const sections = [...document.querySelectorAll('#main > .shopify-section')];
    const controller = new AbortController();
    const { signal } = controller;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const cues = [];
    sections.forEach((section, index) => {
      if (section.classList.contains('shopify-section-group-footer-group')) return;
      const next = sections[index + 1];
      if (!next?.id) return;
      section.querySelectorAll('.content-over-media:has(> .homepage-banner-content)').forEach(media => {
        const cue = document.createElement('button');
        cue.className = 'homepage-scroll-cue';
        cue.type = 'button';
        cue.setAttribute('aria-controls', next.id);
        cue.setAttribute('aria-label', document.documentElement.lang.startsWith('pt') ? 'Rolar para a próxima seção' : 'Scroll to the next section');
        cue.innerHTML = '<svg aria-hidden="true" width="24" height="14" viewBox="0 0 24 14" fill="none"><path d="m3 3 9 8 9-8" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        // Preserve the content as the last child for the theme's existing hover rules.
        media.insertBefore(cue, media.querySelector(':scope > .homepage-banner-content'));
        cue.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          next.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
        }, { signal });
        cues.push({ cue, media });
      });
    });
    cleanup = () => {
      controller.abort();
      cues.forEach(({ cue }) => cue.remove());
    };
  };
  init();
  ['shopify:section:load', 'shopify:section:reorder', 'shopify:section:unload'].forEach(name => {
    document.addEventListener(name, () => requestAnimationFrame(init));
  });
})();
