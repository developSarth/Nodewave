/**
 * Nodewave Site Enhancements
 * - Cookie Consent Manager (GDPR / ePrivacy compliant)
 * - Sticky Mobile CTA Bar (< 768px)
 * - Analytics & Telemetry Event Engine
 */

(function () {
  'use strict';

  // ---------- 1. COOKIE CONSENT MANAGER ----------
  const COOKIE_STORAGE_KEY = 'nodewave_cookie_consent';

  function initCookieBanner() {
    const savedConsent = localStorage.getItem(COOKIE_STORAGE_KEY);
    if (savedConsent) {
      if (savedConsent === 'all') {
        initAnalyticsEngine();
      }
      return;
    }

    const banner = document.createElement('aside');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie Consent Notice');
    banner.innerHTML = `
      <div class="cookie-header">
        <span class="cookie-dot" aria-hidden="true"></span>
        <h4>Cookie Preferences</h4>
      </div>
      <p class="cookie-body">
        We use essential cookies to maintain operational security and optional anonymous telemetry to optimize our automation workflows. 
        Read our <a href="/privacy">Privacy Policy</a>.
      </p>
      <div class="cookie-actions">
        <button type="button" class="cookie-btn-accept" id="agy-cookie-accept">Accept All</button>
        <button type="button" class="cookie-btn-decline" id="agy-cookie-decline">Essential Only</button>
      </div>
    `;

    document.body.appendChild(banner);

    // Smooth reveal after brief delay
    setTimeout(() => {
      banner.classList.add('is-visible');
    }, 1200);

    const acceptBtn = banner.querySelector('#agy-cookie-accept');
    const declineBtn = banner.querySelector('#agy-cookie-decline');

    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        localStorage.setItem(COOKIE_STORAGE_KEY, 'all');
        dismissBanner(banner);
        initAnalyticsEngine();
        window.nodewaveTrack('cookie_consent_given', { type: 'all' });
      });
    }

    if (declineBtn) {
      declineBtn.addEventListener('click', () => {
        localStorage.setItem(COOKIE_STORAGE_KEY, 'essential');
        dismissBanner(banner);
        window.nodewaveTrack('cookie_consent_given', { type: 'essential' });
      });
    }
  }

  function dismissBanner(banner) {
    banner.classList.remove('is-visible');
    setTimeout(() => {
      if (banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
    }, 500);
  }

  // ---------- 2. STICKY MOBILE CTA BAR ----------
  function initStickyMobileCTA() {
    // Don't show sticky CTA on /contact or /thank-you
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/contact') || path.includes('/thank-you')) {
      return;
    }

    const bar = document.createElement('div');
    bar.className = 'sticky-mobile-cta';
    bar.setAttribute('role', 'complementary');
    bar.setAttribute('aria-label', 'Quick Action');
    bar.innerHTML = `
      <div class="cta-text">
        <span>Ready to automate?</span>
        <b>Get an Operations Audit</b>
      </div>
      <a href="/contact" class="cta-btn" data-analytics-cta="sticky_mobile_audit">
        Book Audit →
      </a>
    `;

    document.body.appendChild(bar);

    let isFooterVisible = false;
    const footer = document.querySelector('footer');

    if (footer && 'IntersectionObserver' in window) {
      const footerObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isFooterVisible = entry.isIntersecting;
            updateStickyVisibility();
          });
        },
        { rootMargin: '0px 0px 80px 0px', threshold: 0.05 }
      );
      footerObserver.observe(footer);
    }

    function updateStickyVisibility() {
      if (window.innerWidth <= 768 && window.scrollY > 300 && !isFooterVisible) {
        bar.classList.add('is-visible');
      } else {
        bar.classList.remove('is-visible');
      }
    }

    window.addEventListener('scroll', updateStickyVisibility, { passive: true });
    window.addEventListener('resize', updateStickyVisibility, { passive: true });
  }

  // ---------- 3. ANALYTICS & TELEMETRY ENGINE ----------
  window.nodewaveTrack = function (eventName, params = {}) {
    // 1. Google Analytics 4 (gtag) integration if configured
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }

    // 2. Plausible custom event support if present
    if (typeof window.plausible === 'function') {
      window.plausible(eventName, { props: params });
    }

    // 3. Optional Debug logging
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.debug('[Nodewave Analytics]', eventName, params);
    }
  };

  function initAnalyticsEngine() {
    // If GA4 measurement ID is set in window.NODEWAVE_GA_ID or default placeholder
    const gaId = window.NODEWAVE_GA_ID || null;
    if (gaId && !window.gtag) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', gaId, { anonymize_ip: true });
    }

    // Auto-track CTA button interactions
    document.addEventListener('click', (e) => {
      const cta = e.target.closest('[data-analytics-cta], .nav-cta, .btn-primary, .btn-cta');
      if (cta) {
        const label = cta.getAttribute('data-analytics-cta') || cta.textContent.trim();
        const href = cta.getAttribute('href') || '';
        window.nodewaveTrack('cta_click', {
          cta_label: label,
          target_url: href,
          page_location: window.location.pathname
        });
      }
    });

    // Auto-track Scroll Depth Milestones (25%, 50%, 75%, 100%)
    const milestones = { 25: false, 50: false, 75: false, 100: false };
    window.addEventListener(
      'scroll',
      () => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollHeight <= 0) return;
        const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);

        [25, 50, 75, 100].forEach((m) => {
          if (scrollPercent >= m && !milestones[m]) {
            milestones[m] = true;
            window.nodewaveTrack(`scroll_depth_${m}`, { page: window.location.pathname });
          }
        });
      },
      { passive: true }
    );
  }

  // ---------- INITIALIZE ON DOM READY ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initCookieBanner();
      initStickyMobileCTA();
    });
  } else {
    initCookieBanner();
    initStickyMobileCTA();
  }
})();
