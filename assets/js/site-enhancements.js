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
    // GA4 measurement ID
    const gaId = window.NODEWAVE_GA_ID || 'G-1EXD0W1J2G';
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

  // ---------- 4. VALUE CALCULATOR ENGINE ----------
  function initValueCalculator() {
    const calcSection = document.querySelector('.value-calc-section');
    if (!calcSection) return;

    const hourlyInput = calcSection.querySelector('#calc-hourly');
    const timeInput = calcSection.querySelector('#calc-time');
    const freqInput = calcSection.querySelector('#calc-freq');
    const peopleInput = calcSection.querySelector('#calc-people');

    const hourlyDisp = calcSection.querySelector('#calc-hourly-disp');
    const timeDisp = calcSection.querySelector('#calc-time-disp');
    const freqDisp = calcSection.querySelector('#calc-freq-disp');
    const peopleDisp = calcSection.querySelector('#calc-people-disp');

    const toggleWk = calcSection.querySelector('#calc-toggle-wk');
    const toggleMo = calcSection.querySelector('#calc-toggle-mo');

    const metricMain = calcSection.querySelector('#calc-metric-main');
    const metricHours = calcSection.querySelector('#calc-metric-hours');
    const metricMonth = calcSection.querySelector('#calc-metric-month');

    if (!hourlyInput || !timeInput || !freqInput || !peopleInput) return;

    let isWeekly = true;

    function formatCurrency(val) {
      if (val >= 1000) {
        return '$' + (val / 1000).toFixed(1) + 'k';
      }
      return '$' + Math.round(val).toLocaleString();
    }

    function formatHours(val) {
      if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'k hrs';
      }
      return Math.round(val).toLocaleString() + ' hrs';
    }

    function updateSliderTrack(slider) {
      const min = parseFloat(slider.min) || 0;
      const max = parseFloat(slider.max) || 100;
      const val = parseFloat(slider.value) || 0;
      const percent = ((val - min) / (max - min)) * 100;
      slider.style.background = `linear-gradient(to right, #FF4300 0%, #FF4300 ${percent}%, #E5E2DC ${percent}%, #E5E2DC 100%)`;
    }

    function calculate() {
      const hourly = parseFloat(hourlyInput.value) || 90;
      const time = parseFloat(timeInput.value) || 2;
      const freq = parseFloat(freqInput.value) || 5;
      const people = parseFloat(peopleInput.value) || 3;

      if (hourlyDisp) hourlyDisp.textContent = '$' + hourly;
      if (timeDisp) timeDisp.textContent = (time % 1 === 0 ? time : time.toFixed(1)) + ' hrs';
      if (freqDisp) freqDisp.textContent = freq + '×';
      if (peopleDisp) peopleDisp.textContent = people;

      updateSliderTrack(hourlyInput);
      updateSliderTrack(timeInput);
      updateSliderTrack(freqInput);
      updateSliderTrack(peopleInput);

      const annualTasks = isWeekly ? freq * 52 : freq * 12;
      const totalHours = annualTasks * time * people;
      const hoursFreed = Math.round(totalHours * 0.70);
      const valueFreed = Math.round(hoursFreed * hourly);
      const monthlyValue = Math.round(valueFreed / 12);

      if (metricMain) metricMain.textContent = formatCurrency(valueFreed);
      if (metricHours) metricHours.textContent = formatHours(hoursFreed);
      if (metricMonth) metricMonth.textContent = formatCurrency(monthlyValue);
    }

    [hourlyInput, timeInput, freqInput, peopleInput].forEach((input) => {
      input.addEventListener('input', calculate);
    });

    if (toggleWk && toggleMo) {
      toggleWk.addEventListener('click', () => {
        isWeekly = true;
        toggleWk.classList.add('is-active');
        toggleMo.classList.remove('is-active');
        calculate();
      });

      toggleMo.addEventListener('click', () => {
        isWeekly = false;
        toggleMo.classList.add('is-active');
        toggleWk.classList.remove('is-active');
        calculate();
      });
    }

    calculate();
  }

  // ---------- INITIALIZE ON DOM READY ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initCookieBanner();
      initStickyMobileCTA();
      initValueCalculator();
    });
  } else {
    initCookieBanner();
    initStickyMobileCTA();
    initValueCalculator();
  }
})();

