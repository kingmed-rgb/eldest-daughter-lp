// What we sell, what each order contains, and where each file is downloaded from.
// Shared by the checkout, the webhook email and the thank-you page (files in api/_lib are not endpoints).

const FILES_DIR = 'files/e2b0943418c5d310d9'; // unguessable folder, not indexed (see vercel.json)

const FILES = {
  workbook_en: { label: 'the eldest daughter workbook', url: 'https://drive.google.com/file/d/1uST3jP6d1VloCdCvBEyCtvD2JTofDXpg/view?usp=sharing' },
  poems_en: { label: 'dear angry eldest daughter', url: `https://www.eldestdaughtercore.com/${FILES_DIR}/dear-angry-eldest-daughter-en.pdf` },
  journal_en: { label: 'the eldest daughter journal', url: `https://www.eldestdaughtercore.com/${FILES_DIR}/the-eldest-daughter-journal-en.pdf` },
  ebook_es: { label: 'síndrome de la hija mayor', url: 'https://drive.google.com/uc?export=download&id=11qYyNgbQSvzttHweeHf-WAbHuA7o4Jw9' },
  poems_es: { label: 'querida hija mayor enojada', url: `https://www.hijamayor.com/${FILES_DIR}/querida-hija-mayor-enojada-es.pdf` },
  journal_es: { label: 'el diario de la hija mayor', url: `https://www.hijamayor.com/${FILES_DIR}/el-diario-de-la-hija-mayor-es.pdf` },
};

// Amounts in cents (USD).
const OFFERS = {
  en: {
    main: { name: 'The Eldest Daughter Workbook', amount: 900, files: ['workbook_en'] },
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

module.exports = { FILES, OFFERS, languageOf, filesFor };
