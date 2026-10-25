(function () {
  'use strict';
  if (window.ReadyScorePromo) return;
  var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'campaign_id', 'adset_id', 'ad_id', 'placement', 'site_source_name', 'fbclid'];
  var storageKey = 'readyscore_promo_campaign_v1';
  var ttl = 30 * 24 * 60 * 60 * 1000;
  var current = document.currentScript;
  var pixelId = current && current.getAttribute('data-pixel-id');
  var campaign = {};
  function safe(key, value) {
    if (typeof value !== 'string' || !value.trim() || value.length > (key === 'fbclid' ? 500 : 160)) return '';
    return (key === 'fbclid' ? /^[A-Za-z0-9_-]+$/ : /^[\p{L}\p{N} ._~:+()|-]+$/u).test(value.trim()) ? value.trim() : '';
  }
  try {
    var stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (stored && stored.at > Date.now() - ttl && stored.at <= Date.now()) keys.forEach(function (key) { var value = safe(key, stored.data && stored.data[key]); if (value) campaign[key] = value; });
  } catch (_) { /* Storage is optional, including in private browsers. */ }
  var search = new URLSearchParams(location.search);
  var fresh = {};
  keys.forEach(function (key) { var value = safe(key, search.get(key)); if (value) fresh[key] = value; });
  // A new campaign replaces the previous campaign, rather than mixing unrelated ads.
  if (Object.keys(fresh).length) {
    campaign = fresh;
    try { localStorage.setItem(storageKey, JSON.stringify({ at: Date.now(), data: campaign })); } catch (_) {}
  }
  var enabled = /^(promo|app)\.readyscore\.id$/.test(location.hostname) && /^\d{10,20}$/.test(pixelId || '') && navigator.doNotTrack !== '1';
  var sent = new Set();
  if (enabled) {
    if (!window.fbq) {
      var fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
      fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
      window.fbq = fbq; window._fbq = fbq;
      var script = document.createElement('script'); script.async = true; script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);
    }
    // Disable automatic event detection/advanced matching. No form values or test results.
    window.fbq('set', 'autoConfig', false, pixelId);
    window.fbq('init', pixelId);
    window.fbq('trackSingle', pixelId, 'PageView');
  }
  function track(name, eventId, value) {
    if (!enabled || !['ViewContent', 'InitiateCheckout', 'Purchase'].includes(name)) return;
    if (eventId && !/^[A-Za-z0-9_-]{1,100}$/.test(eventId)) return;
    var id = name + ':' + (eventId || 'page');
    if (sent.has(id)) return;
    if (eventId) { try { if (localStorage.getItem('rs_meta_' + id) === '1') return; } catch (_) {} }
    var data = { content_ids: ['readyscore_paket_lengkap'], content_type: 'product', currency: 'IDR', value: 249000 };
    if (value !== undefined && value !== 249000) return;
    if (eventId) window.fbq('trackSingle', pixelId, name, data, { eventID: eventId });
    else window.fbq('trackSingle', pixelId, name, data);
    sent.add(id);
    if (eventId) { try { localStorage.setItem('rs_meta_' + id, '1'); } catch (_) {} }
  }
  function checkoutUrl(href) {
    var url = new URL(href, location.href);
    if (url.origin !== 'https://app.readyscore.id' || url.pathname !== '/checkout/promo') return url.href;
    keys.forEach(function (key) { if (campaign[key]) url.searchParams.set(key, campaign[key]); });
    return url.href;
  }
  window.ReadyScorePromo = { attribution: function () { return Object.assign({}, campaign); }, track: track, checkoutUrl: checkoutUrl };
  document.querySelectorAll('a[data-checkout]').forEach(function (a) { a.href = checkoutUrl(a.href); });
  if (location.hostname === 'promo.readyscore.id') track('ViewContent');
  window.dispatchEvent(new Event('readyscore-promo-ready'));
}());
