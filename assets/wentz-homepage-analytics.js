(() => {
  const measurementId = 'G-6E3LMQ0L55';
  const header = document.querySelector('.shopify-section--header');
  const footer = '.shopify-section--footer';
  const bannerLinks = [...document.querySelectorAll(
    'main .wentz-banner-link, main a.slideshow__slide'
  )];
  const pathOf = (link) => {
    const url = new URL(link.href, location.href);
    return url.origin === location.origin ? url.pathname : null;
  };
  const clean = (value) => (value || '').replace(/\s+/g, ' ').trim().slice(0, 100);
  const pagePath = location.pathname;
  let send;

  function emit(eventName, fields) {
    if (!window.Shopify?.customerPrivacy?.analyticsProcessingAllowed?.()) return false;
    if (!send) {
      if (typeof window.gtag === 'function') {
        send = (...args) => window.gtag(...args);
      } else {
        const queueName = 'wentzHomepageDataLayer';
        const queue = window[queueName] = window[queueName] || [];
        send = function () { queue.push(arguments); };
        send('js', new Date());
        send('config', measurementId, { send_page_view: false });
        const tag = document.createElement('script');
        tag.async = true;
        tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId + '&l=' + queueName;
        document.head.append(tag);
      }
    }
    send('event', eventName, { ...fields, page_path: pagePath, send_to: measurementId });
    return true;
  }

  const banners = bannerLinks.map((link, index) => {
    const section = link.closest('.shopify-section');
    const slide = link.closest('.slideshow__slide');
    const element = slide || section;
    return {
      element, slide,
      data: {
        banner_id: (slide?.id || section?.id?.split('__').pop() || String(index + 1)).slice(0, 100),
        banner_name: clean(link.getAttribute('aria-label') || element?.querySelector('h1, h2, .h0, .h1')?.textContent || link.textContent),
        banner_position: String(index + 1),
        destination_path: pathOf(link)
      }
    };
  }).filter((banner) => banner.element && banner.data.destination_path);
  const viewed = new Set();
  const intersecting = new Set();
  const rememberView = (banner) => {
    if (!viewed.has(banner) && emit('home_banner_view', banner.data)) viewed.add(banner);
  };
  const recordVisible = () => {
    if (document.visibilityState !== 'visible') return;
    for (const banner of intersecting) {
      if (!banner.slide || banner.slide.classList.contains('is-selected')) rememberView(banner);
    }
  };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      for (const banner of banners) {
        if (banner.element !== entry.target) continue;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) intersecting.add(banner);
        else intersecting.delete(banner);
      }
    }
    recordVisible();
  }, { threshold: 0.5 });
  const slideObserver = new MutationObserver(recordVisible);
  for (const banner of banners) {
    observer.observe(banner.element);
    if (banner.slide) slideObserver.observe(banner.slide, { attributes: true, attributeFilter: ['class'] });
  }
  document.addEventListener('visibilitychange', recordVisible);
  document.addEventListener('visitorConsentCollected', recordVisible);
  window.Shopify?.loadFeatures?.([{ name: 'consent-tracking-api', version: '0.1' }], (error) => {
    if (!error) recordVisible();
  });

  const openStates = new WeakMap();
  const menuControls = 'details[is="mega-menu-disclosure"], navigation-drawer, #header-sidebar-menu button[data-panel^="1-"]';
  if (header) {
    new MutationObserver((changes) => {
      for (const { target } of changes) {
        if (!target.matches(menuControls)) continue;
        const open = target.hasAttribute('open') || target.getAttribute('aria-expanded') === 'true';
        if (openStates.get(target) === open) continue;
        openStates.set(target, open);
        if (!open) continue;
        const label = target.matches('details') ? target.querySelector('summary') :
          target.matches('navigation-drawer') ? header.querySelector('[aria-controls="' + CSS.escape(target.id) + '"]') : target;
        emit('home_menu_open', {
          navigation_area: target.closest('#header-sidebar-menu') ? 'mobile_menu' : 'desktop_menu',
          navigation_label: target.id === 'header-sidebar-menu' ? 'Menu' : clean(label?.textContent).replace(/\s*>$/, '')
        });
      }
    }).observe(header, { subtree: true, attributes: true, attributeFilter: ['open', 'aria-expanded'] });
  }

  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link) return;
    const destination = pathOf(link);
    if (!destination) return;
    const banner = banners.find((item) =>
      item.element.contains(link) && item.data.destination_path === destination
    );
    if (banner) {
      rememberView(banner);
      emit('home_banner_click', banner.data);
      return;
    }
    const area = link.closest('#header-sidebar-menu') ? 'mobile_menu' :
      header?.contains(link) ? 'desktop_menu' : link.closest(footer) ? 'footer' : null;
    if (area) emit('home_navigation_click', {
      navigation_area: area,
      navigation_label: clean(link.getAttribute('aria-label') || link.textContent),
      destination_path: destination
    });
  }, { capture: true, passive: true });
})();
