import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../../public/promo-tracking.js', import.meta.url), 'utf8');
function setup({ hostname = 'app.readyscore.id', query = '', dnt = '0', storageThrows = false } = {}) {
  const calls = [], records = new Map(), links = [{ href: 'https://app.readyscore.id/checkout/promo' }];
  const script = { getAttribute: name => name === 'data-pixel-id' ? '1600994505022613' : null };
  const context = { window: { dispatchEvent() {} }, document: { currentScript: script, createElement: () => ({}), head: { appendChild() {} }, querySelectorAll: () => links }, navigator: { doNotTrack: dnt }, location: { hostname, search: query, href: `https://${hostname}/${query}` }, localStorage: { getItem: k => { if (storageThrows) throw Error('blocked'); return records.get(k) ?? null; }, setItem: (k, v) => { if (storageThrows) throw Error('blocked'); records.set(k, v); } }, URL, URLSearchParams, Set, Date, Event: class Event {} };
  vm.runInNewContext(source, context);
  if (context.window.fbq) context.window.fbq.callMethod = (...args) => calls.push(args);
  return { tracker: context.window.ReadyScorePromo, calls, context, records, links };
}
test('checkout preserves only safe campaign fields, never contact details or arbitrary destinations', () => {
  const { tracker, links } = setup({ query: '?utm_source=instagram&ad_id=123&email=private%40example.test&utm_campaign=bad%40email.test&fbclid=Iwx_test' });
  assert.deepEqual(JSON.parse(JSON.stringify(tracker.attribution())), { utm_source: 'instagram', ad_id: '123', fbclid: 'Iwx_test' });
  assert.equal(new URL(links[0].href).searchParams.get('utm_source'), 'instagram');
  assert.equal(new URL(links[0].href).searchParams.has('email'), false);
  assert.equal(tracker.checkoutUrl('https://example.test/'), 'https://example.test/');
});
test('purchase event is deduplicated and its value cannot be changed by caller data', () => {
  const { tracker, calls } = setup();
  tracker.track('Purchase', 'rs-purchase-example', 249000);
  tracker.track('Purchase', 'rs-purchase-example', 249000);
  tracker.track('Purchase', 'rs-purchase-other', 1);
  tracker.track('CustomerEmail', 'private@example.test');
  assert.equal(calls.length, 1);
  assert.equal(calls[0][2], 'Purchase');
  assert.equal(calls[0][3].value, 249000);
  assert.deepEqual(Object.keys(calls[0][3]).sort(), ['content_ids', 'content_type', 'currency', 'value']);
  assert.equal(calls[0][4].eventID, 'rs-purchase-example');
});
test('storage restrictions do not break checkout; local preview and Do Not Track never load Meta', () => {
  assert.doesNotThrow(() => setup({ storageThrows: true }).tracker.attribution());
  assert.equal(setup({ hostname: 'localhost' }).context.window.fbq, undefined);
  assert.equal(setup({ dnt: '1' }).context.window.fbq, undefined);
});
