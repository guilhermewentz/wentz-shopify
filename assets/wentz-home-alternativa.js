(() => {
  if (customElements.get('wentz-home')) return;
  class WentzHome extends HTMLElement {
    connectedCallback() {
      this.panels = [...this.querySelectorAll('.wentz-home__panel')];
      this.dots = [...this.querySelectorAll('[data-wentz-go]')];
      if (!this.panels.length) return;
      this.controller = new AbortController();
      const signal = this.controller.signal;
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
      this.mobile = matchMedia('(max-width: 699px)');
      this.active = -1;
      this.schedule = () => {
        if (this.frame) return;
        this.frame = requestAnimationFrame(() => { this.frame = 0; this.render(); });
      };
      this.configure = () => {
        this.enhanced = !this.reduced.matches;
        this.classList.toggle('is-enhanced', this.enhanced);
        this.style.setProperty('--wentz-count', this.panels.length);
        this.panels.forEach(panel => {
          panel.inert = false;
          panel.removeAttribute('aria-hidden');
          panel.style.removeProperty('--wentz-opacity');
          panel.style.removeProperty('--wentz-offset');
          panel.classList.remove('is-active', 'is-visible');
        });
        this.active = -1;
        this.render();
      };
      window.addEventListener('scroll', this.schedule, { passive: true, signal });
      window.addEventListener('resize', this.schedule, { passive: true, signal });
      document.addEventListener('visibilitychange', this.schedule, { signal });
      this.reduced.addEventListener('change', this.configure, { signal });
      this.mobile.addEventListener('change', this.schedule, { signal });
      this.dots.forEach(dot => dot.addEventListener('click', () => {
        const top = this.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + Number(dot.dataset.wentzGo) * this.screenHeight(),
          behavior: this.reduced.matches ? 'instant' : 'smooth' });
      }, { signal }));
      // Selecting a block in the theme editor reveals that banner.
      document.addEventListener('shopify:block:select', event => {
        const panel = event.target.closest('.wentz-home__panel');
        const index = this.panels.indexOf(panel);
        if (index < 0) return;
        if (this.enhanced) {
          window.scrollTo({ top: this.getBoundingClientRect().top + window.scrollY + index * this.screenHeight(), behavior: 'instant' });
        } else panel.scrollIntoView({ behavior: 'instant' });
      }, { signal });
      this.configure();
    }
    screenHeight() {
      return this.querySelector('.wentz-home__stage').getBoundingClientRect().height;
    }
    render() {
      const rect = this.getBoundingClientRect();
      const height = this.enhanced ? this.screenHeight() : window.innerHeight;
      const progress = Math.max(0, Math.min(this.panels.length - 1, -rect.top / Math.max(1, height)));
      const base = Math.floor(progress);
      // Hold each composition, then gently crossfade over the final 35% of its scroll.
      const amount = Math.max(0, Math.min(1, (progress - base - .65) / .35));
      const blend = amount * amount * (3 - 2 * amount);
      const active = Math.min(this.panels.length - 1, base + (blend >= .5 ? 1 : 0));
      this.panels.forEach((panel, index) => {
        if (this.enhanced) {
          const opacity = index === base ? 1 - blend : index === base + 1 ? blend : 0;
          panel.style.setProperty('--wentz-opacity', opacity);
          panel.style.setProperty('--wentz-offset', (index === base ? -blend * 10 : (1 - blend) * 10) + 'px');
          panel.classList.toggle('is-visible', opacity > 0);
          panel.classList.toggle('is-active', index === active);
          panel.inert = index !== active;
          panel.setAttribute('aria-hidden', String(index !== active));
        }
        const visible = this.enhanced
          ? index === active && rect.bottom > 0 && rect.top < window.innerHeight
          : panel.getBoundingClientRect().bottom > 0 && panel.getBoundingClientRect().top < window.innerHeight;
        panel.querySelectorAll('video').forEach(video => {
          const isMobileVideo = video.classList.contains('wentz-home__video-mobile');
          const hiddenDesktop = video.classList.contains('has-mobile') && this.mobile.matches;
          const correctSize = isMobileVideo ? this.mobile.matches : !hiddenDesktop;
          if (visible && correctSize && !this.reduced.matches && !document.hidden) {
            if (video.paused) video.play().catch(() => {});
          } else if (!video.paused) video.pause();
        });
      });
      if (active !== this.active) {
        this.dots.forEach((dot, index) => dot.setAttribute('aria-current', String(index === active)));
        this.active = active;
      }
    }
    disconnectedCallback() {
      this.controller?.abort();
      cancelAnimationFrame(this.frame);
      this.querySelectorAll('video').forEach(video => video.pause());
    }
  }
  customElements.define('wentz-home', WentzHome);
})();
