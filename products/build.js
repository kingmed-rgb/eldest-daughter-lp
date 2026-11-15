// Builds the product PDFs with headless Chromium.
//   node products/build.js poems en      → products/dist/poems-and-letters-en.pdf
//   node products/build.js journal es    → products/dist/the-eldest-daughter-journal-es.pdf
// Two passes: the second fills the contents page with real page numbers.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const [, , product = 'poems', lang = 'en'] = process.argv;
const dir = __dirname;
const mod = require('./' + product + '.js');
const items = JSON.parse(fs.readFileSync(path.join(dir, 'src', `${product}-${lang}.json`), 'utf8'));
const names = { poems: { en: 'dear-angry-eldest-daughter-en', es: 'querida-hija-mayor-enojada-es' }, journal: { en: 'the-eldest-daughter-journal-en', es: 'el-diario-de-la-hija-mayor-es' } };
const out = path.join(dir, 'dist', names[product][lang] + '.pdf');
fs.mkdirSync(path.dirname(out), { recursive: true });

function pagesOf(pdf, anchors) {
  const text = execFileSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf8', maxBuffer: 1 << 26 }).split('\f');
  const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const found = {};
  for (const [id, needle] of Object.entries(anchors)) {
    const n = norm(needle);
    const idx = text.findIndex((pg) => norm(pg).includes(n));
    if (idx >= 0) found[id] = idx + 1;
  }
  return found;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const html = path.join(dir, `_${product}-${lang}.html`);
  const print = async (pages) => {
    fs.writeFileSync(html, mod.render(lang, items, pages));
    await page.goto('file://' + html);
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true, tagged: true, outline: true });
  };
  await print({});
  await print(pagesOf(out, mod.anchors(lang, items)));
  await browser.close();
  fs.unlinkSync(html);
  const info = execFileSync('pdfinfo', [out], { encoding: 'utf8' }).match(/Pages:\s+(\d+)/)[1];
  console.log(out, info, 'pages', Math.round(fs.statSync(out).size / 1024) + ' KB');
})();
