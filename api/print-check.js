// Private test page for the Lulu paperback. Locked with BACKFILL_TOKEN.
//   ?action=validate                      start Lulu's checks on the interior and cover files
//   ?action=status&interior=ID&cover=ID   read the results of those checks
//   ?action=cost&country=US&zip=10001&state=NY&city=New%20York   exact price for 1 copy
//   ?action=testorder                     create one real print job, then cancel it at once (nothing printed)
//   ?action=job&id=123                    read a print job's status
const crypto = require('crypto');
const { PRINT } = require('./_lib/catalog.js');
const { lulu } = require('./_lib/lulu.js');
const { lineItem } = require('./_lib/print.js');

function tokenOk(given) {
  const want = (process.env.BACKFILL_TOKEN || '').trim();
  if (!want || !given) return false;
  return crypto.timingSafeEqual(crypto.createHash('sha256').update(String(given)).digest(), crypto.createHash('sha256').update(want).digest());
}

// A real business address, used only for the cancelled test order.
const TEST_ADDRESS = { name: 'Print Test', street1: '700 Park Offices Dr', city: 'Research Triangle Park', state_code: 'NC', country_code: 'US', postcode: '27709', phone_number: '9195551234' };

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const q = req.query || {};
  if (!tokenOk(q.token)) return res.status(404).json({ error: 'not found' });

  try {
    if (q.action === 'validate') {
      const interior = await lulu('/validate-interior/', 'POST', { source_url: PRINT.interior, pod_package_id: PRINT.podPackageId });
      const cover = await lulu('/validate-cover/', 'POST', { source_url: PRINT.cover, pod_package_id: PRINT.podPackageId, interior_page_count: PRINT.pageCount });
      return res.status(200).json({ interior, cover });
    }
    if (q.action === 'status') {
      const out = {};
      if (q.interior) out.interior = await lulu('/validate-interior/' + encodeURIComponent(q.interior) + '/');
      if (q.cover) out.cover = await lulu('/validate-cover/' + encodeURIComponent(q.cover) + '/');
      return res.status(200).json(out);
    }
    if (q.action === 'cost') {
      const addr = { street1: '1 Main St', city: q.city || 'New York', state_code: q.state || undefined, country_code: (q.country || 'US').toUpperCase(), postcode: q.zip || '10001', phone_number: '5555555555' };
      const r = await lulu('/print-job-cost-calculations/', 'POST', { line_items: [{ page_count: PRINT.pageCount, pod_package_id: PRINT.podPackageId, quantity: 1 }], shipping_address: addr, shipping_option: q.level || PRINT.shippingLevel });
      return res.status(200).json(r);
    }
    if (q.action === 'testorder') {
      const ref = 'test-' + Date.now();
      const created = await lulu('/print-jobs/', 'POST', {
        external_id: ref, contact_email: 'eldestdaughterbook@gmail.com', line_items: [lineItem(ref)],
        shipping_address: TEST_ADDRESS, shipping_level: PRINT.shippingLevel, production_delay: PRINT.productionDelayMinutes,
      });
      let cancelled = null;
      if (created.ok && created.data && created.data.id) cancelled = await lulu('/print-jobs/' + created.data.id + '/status/', 'PUT', { name: 'CANCELED' });
      return res.status(200).json({ created, cancelled });
    }
    if (q.action === 'job' && q.id) {
      return res.status(200).json(await lulu('/print-jobs/' + encodeURIComponent(q.id) + '/'));
    }
    return res.status(400).json({ error: 'unknown action' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
