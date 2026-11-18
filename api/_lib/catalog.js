// What we sell, what each order contains, and where each file is downloaded from.
// Shared by the checkout, the webhook email and the thank-you page (files in api/_lib are not endpoints).

const FILES_DIR = 'files/e2b0943418c5d310d9'; // unguessable folder, not indexed (see vercel.json)

const FILES = {
  workbook_en: { kind: 'workbook', img: '/images/offer-workbook.webp', label: 'the eldest daughter workbook', url: `https://www.eldestdaughtercore.com/${FILES_DIR}/the-eldest-daughter-workbook-en.pdf` },
  poems_en: { kind: 'poetry', img: '/images/bump-poems-en.webp', label: 'dear angry eldest daughter', url: `https://www.eldestdaughtercore.com/${FILES_DIR}/dear-angry-eldest-daughter-en.pdf` },
  journal_en: { kind: 'guided journal', img: '/images/bump-journal-en.webp', label: 'the eldest daughter journal', url: `https://www.eldestdaughtercore.com/${FILES_DIR}/the-eldest-daughter-journal-en.pdf` },
  audio_en: { kind: 'audiobook · mp3', img: '/images/offer-workbook-tablet.webp', label: 'the eldest daughter audiobook (plays in any app)', url: `https://www.eldestdaughtercore.com/${FILES_DIR}/the-eldest-daughter-audiobook.mp3` },
  audio_m4b_en: { kind: 'audiobook · m4b', img: '/images/offer-workbook-tablet.webp', label: 'the eldest daughter audiobook (with chapters, for audiobook apps)', url: `https://www.eldestdaughtercore.com/${FILES_DIR}/the-eldest-daughter-audiobook.m4b` },
  ebook_es: { kind: 'libro', img: '/images/sindrome-hija-mayor-3d.webp', label: 'síndrome de la hija mayor', url: `https://www.hijamayor.com/${FILES_DIR}/sindrome-de-la-hija-mayor-es.pdf` },
  poems_es: { kind: 'poesía', img: '/images/bump-poems-es.webp', label: 'querida hija mayor enojada', url: `https://www.hijamayor.com/${FILES_DIR}/querida-hija-mayor-enojada-es.pdf` },
  journal_es: { kind: 'diario guiado', img: '/images/bump-journal-es.webp', label: 'el diario de la hija mayor', url: `https://www.hijamayor.com/${FILES_DIR}/el-diario-de-la-hija-mayor-es.pdf` },
};

// Amounts in cents (USD).
const OFFERS = {
  en: {
    main: { name: 'The Eldest Daughter Workbook (ebook)', amount: 999, files: ['workbook_en'] },
    // audiobook (mp3 + m4b with chapters), ebook included
    audio: { name: 'The Eldest Daughter Workbook (audiobook + ebook)', amount: 1999, files: ['workbook_en', 'audio_en', 'audio_m4b_en'] },
    // printed paperback (printed and shipped by Lulu), ebook and audiobook included
    print: { name: 'The Eldest Daughter Workbook (paperback + ebook + audiobook)', amount: 2999, files: ['workbook_en', 'audio_en', 'audio_m4b_en'] },
    poems: { name: 'Dear Angry Eldest Daughter (poems)', amount: 700, files: ['poems_en'] },
    journal: { name: 'The Eldest Daughter Journal', amount: 700, files: ['journal_en'] },
  },
  es: {
    main: { name: 'Síndrome de la hija mayor', amount: 900, files: ['ebook_es'] },
    poems: { name: 'Querida hija mayor enojada (poemas)', amount: 700, files: ['poems_es'] },
    journal: { name: 'El diario de la hija mayor', amount: 700, files: ['journal_es'] },
  },
};

function languageOf(session) {
  const page = session.metadata && session.metadata.page;
  if (OFFERS[page]) return page;
  if (session.locale && /^es/.test(session.locale)) return 'es';
  if (session.amount_total === 900 && !(session.metadata && session.metadata.items)) return 'es'; // old Spanish payment link
  return 'en';
}

// Which files a paid checkout session unlocks.
function filesFor(session) {
  const lang = languageOf(session);
  const items = session.metadata && session.metadata.items;
  if (items) {
    const keys = items.split(',').filter((k) => OFFERS[lang][k]);
    return { lang, keys, files: keys.flatMap((k) => OFFERS[lang][k].files).map((f) => FILES[f]) };
  }
  // Orders from before the journal bump (or from a payment link):
  // English bought the old bundle (workbook, poems, worksheet → now the journal); Spanish bought the ebook.
  const legacy = lang === 'es' ? ['ebook_es', 'poems_es'] : ['workbook_en', 'poems_en', 'journal_en'];
  return { lang, keys: ['legacy'], files: legacy.map((f) => FILES[f]) };
}

// Printed paperback: printed and shipped by Lulu (Print API), ebook included.
const PRINT_FILES = 'https://www.eldestdaughtercore.com/files/e2b0943418c5d310d9/print/';
const PRINT = {
  enabled: true,                          // on sale (lulu test passed 2026-11-16). false hides it again: page option and checkout
  podPackageId: '0614X0921.BW.STD.PB.080CW444.MXX', // royal 6.14x9.21, b&w standard, perfect bound, 80# white coated, matte
  pageCount: 122,
  interior: PRINT_FILES + 'eds-workbook-interior-royal.pdf',
  cover: PRINT_FILES + 'eds-workbook-cover-royal.pdf',
  title: 'The Eldest Daughter Workbook',
  countries: ['US', 'GB', 'CA', 'AU'],    // where we ship for now
  shippingLevel: 'MAIL',                  // lulu's cheapest tracked option
  productionDelayMinutes: 120,            // window to cancel a mistaken order before printing starts
};

module.exports = { FILES, OFFERS, PRINT, languageOf, filesFor };
