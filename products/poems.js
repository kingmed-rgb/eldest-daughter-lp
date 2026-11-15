// HTML for "poems & letters" (en / es). Used by build.js.
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const T = {
  en: {
    title: 'poems &amp; letters',
    sub: 'for the eldest daughter',
    author: 'anna celestina',
    fileTitle: 'Poems & Letters for the Eldest Daughter',
    contents: 'contents',
    copyright: '© 2025 anna celestina. all rights reserved.<br>for personal use only. please don’t share or resell this file.',
    disclaimer: 'this book is personal reflection, not therapy or medical advice.',
    open: {
      title: 'dear eldest daughter,',
      paras: [
        'these are the pieces that didn’t fit in the workbook. the workbook asks you to do things. this one only asks you to read.',
        'some of these will feel like someone found your diary. some won’t be about you at all, and that’s fine. skip around. read one before bed. read the same one ten times.',
        'the poems are the roles we were handed. the letters are about where those roles came from, and what they left behind.',
        'you don’t have to do anything with them. let them keep you company.',
      ],
      sign: 'with love,<br>anna',
    },
    parts: [
      { kicker: 'part one', name: 'the roles', sub: 'eleven poems about the jobs we were given', from: 0, to: 11 },
      { kicker: 'part two', name: 'where it started', sub: 'letters about the house you grew up in', from: 11, to: 21 },
      { kicker: 'part three', name: 'what it left behind', sub: 'letters about the woman you became', from: 21, to: 34 },
    ],
    close: {
      title: 'one last letter',
      paras: [
        'if you made it here, you just read a lot of hard things about your own life. that’s not nothing.',
        'none of this means your family didn’t love you. it means you carried more than a child should, and you’re allowed to say so.',
        'you were never just the helper, the old soul, the third parent. you were a kid. some of her is still in you.',
        'go easy on her tonight.',
      ],
      sign: 'anna',
    },
    back: 'eldestdaughtercore.com',
  },
  es: {
    title: 'poemas y cartas',
    sub: 'para la hija mayor',
    author: 'anna celestina',
    fileTitle: 'Poemas y cartas para la hija mayor',
    contents: 'contenido',
    copyright: '© 2025 anna celestina. todos los derechos reservados.<br>solo para uso personal. por favor no compartas ni revendas este archivo.',
    disclaimer: 'este libro es para reflexionar. no es terapia ni consejo médico.',
    open: {
      title: 'querida hija mayor,',
      paras: [
        'estos son los textos que no cupieron en el libro. el libro te pide hacer cosas. este solo te pide leer.',
        'algunos te van a sentir como si alguien hubiera leído tu diario. otros no van a ser sobre ti, y está bien. sáltate los que quieras. lee uno antes de dormir. lee el mismo diez veces.',
        'los poemas son los papeles que nos tocaron. las cartas hablan de dónde salieron esos papeles y de lo que nos dejaron.',
        'no tienes que hacer nada con ellos. deja que te acompañen.',
      ],
      sign: 'con cariño,<br>anna',
    },
    parts: [
      { kicker: 'primera parte', name: 'los papeles', sub: 'once poemas sobre los trabajos que nos dieron', from: 0, to: 11 },
      { kicker: 'segunda parte', name: 'donde empezó', sub: 'cartas sobre la casa en la que creciste', from: 11, to: 21 },
      { kicker: 'tercera parte', name: 'lo que dejó', sub: 'cartas sobre la mujer en la que te convertiste', from: 21, to: 34 },
    ],
    close: {
      title: 'una última carta',
      paras: [
        'si llegaste hasta aquí, acabas de leer muchas cosas difíciles sobre tu propia vida. eso no es poca cosa.',
        'nada de esto significa que tu familia no te quiso. significa que cargaste más de lo que una niña debería cargar, y tienes derecho a decirlo.',
        'nunca fuiste solo la que ayuda, la madura, la tercera mamá. eras una niña. algo de ella sigue en ti.',
        'sé suave con ella esta noche.',
      ],
      sign: 'anna',
    },
    back: 'hijamayor.com',
  },
};

const CSS = `
:root{--pw:5.5in;--ph:8.5in}
@page{size:5.5in 8.5in;margin:.85in .75in .9in .75in;background:#FEF7EC;
  @bottom-center{content:counter(page);font-family:'Source Serif 4';font-size:8.5pt;color:#5E434A}}
@page full{margin:0;@bottom-center{content:none}}
@page plain{@bottom-center{content:none}}
.plain{page:plain}
.poem{break-before:page;padding-top:.35in}
.num{font-family:'Fraunces';font-size:9pt;letter-spacing:.16em;color:var(--muted)}
.poem h2,.letter h2{font-size:17pt;line-height:1.2;margin:6pt 0 18pt;color:var(--accent)}
.poem p{font-size:11pt;line-height:1.72;padding-left:1.2em;text-indent:-1.2em}
.letter{break-before:page;padding-top:.15in}
.letter p{font-size:10.6pt;line-height:1.68;margin-bottom:9pt;hyphens:auto;text-align:left;orphans:3;widows:3}
.letter p.bul{margin:0 0 3pt 14pt;position:relative}
.letter p.bul::before{content:'';position:absolute;left:-11pt;top:.62em;width:4pt;height:4pt;background:var(--accent);transform:rotate(45deg)}
.letter p.punch{font-family:'Fraunces';font-style:italic;font-size:13pt;color:var(--accent);margin-top:12pt}
.toc{break-before:page}
.toc h2{font-size:20pt;margin-bottom:16pt;color:var(--accent)}
.toc .pt{break-after:avoid;font-family:'Fraunces';font-size:8.5pt;letter-spacing:.16em;color:var(--muted);margin:12pt 0 4pt}
.toc .row{display:flex;align-items:flex-end;font-size:9.2pt;line-height:1.45;margin-bottom:2.5pt}
.toc .row span:first-child{max-width:78%}
.toc .row .dots{flex:1;border-bottom:1px dotted #C98F95;margin:0 5pt 4pt}
.toc .row span:last-child{color:var(--muted)}
.copy{display:flex;flex-direction:column;justify-content:flex-end;height:6.5in;font-size:8.5pt;line-height:1.6;color:var(--muted)}
.letterpage{break-before:page;padding-top:.5in}
.letterpage h2{font-family:'Fraunces';font-style:italic;font-weight:400;font-size:18pt;color:var(--accent);margin-bottom:18pt}
.letterpage p{font-size:11.2pt;line-height:1.75;margin-bottom:11pt}
.letterpage .sign{margin-top:18pt;font-family:'Fraunces';font-style:italic;font-size:13pt}
`;

function render(lang, items, pages = {}) {
  const t = T[lang];
  const part = (p) => `<section class="full"><div class="kicker">${p.kicker}</div><h2>${p.name}</h2><div class="orn"><b></b><i></i><b></b></div><div class="sub">${p.sub}</div></section>`;
  const piece = (x, i) => {
    const id = 'p' + i;
    if (x.type === 'poem') {
      return `<article class="poem" id="${id}"><div class="num">${String(i + 1).padStart(2, '0')}</div><h2>${esc(x.title)}</h2>${x.lines.map((l) => `<p>${esc(l)}</p>`).join('')}</article>`;
    }
    const ps = x.paras.map((p, k) => {
      if (/^●\s*/.test(p)) return `<p class="bul">${esc(p.replace(/^●\s*/, ''))}</p>`;
      if (k === x.paras.length - 1 && p.length < 40) return `<p class="punch">${esc(p)}</p>`;
      return `<p>${esc(p)}</p>`;
    }).join('');
    return `<article class="letter" id="${id}"><div class="num">${String(i + 1).padStart(2, '0')}</div><h2>${esc(x.title)}</h2>${ps}</article>`;
  };
  const toc = `<section class="toc plain"><h2>${t.contents}</h2>
    <div class="row"><span>${t.open.title.replace(/,$/, '')}</span><span class="dots"></span><span>${pages.open || ''}</span></div>
    ${t.parts.map((p) => `<div class="pt">${p.kicker} · ${p.name}</div>` + items.slice(p.from, p.to).map((x, j) => {
      const i = p.from + j;
      return `<div class="row"><span>${esc(x.title)}</span><span class="dots"></span><span>${pages['p' + i] || ''}</span></div>`;
    }).join('')).join('')}
    <div class="row" style="margin-top:12pt"><span>${t.close.title}</span><span class="dots"></span><span>${pages.close || ''}</span></div></section>`;
  const letter = (L, id) => `<section class="letterpage" id="${id}"><h2>${L.title}</h2>${L.paras.map((p) => `<p>${p}</p>`).join('')}<div class="sign">${L.sign}</div></section>`;

  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${t.fileTitle}</title>
<link rel="stylesheet" href="shared.css"><style>${CSS}</style></head><body>
<section class="full"><div class="kicker">${t.author}</div><h1>${t.title}</h1><div class="orn"><b></b><i></i><b></b></div><div class="sub">${t.sub}</div></section>
<section class="plain"><div class="copy"><p>${t.copyright}</p><p style="margin-top:8pt">${t.disclaimer}</p></div></section>
${letter(t.open, 'open')}
${toc}
${t.parts.map((p) => part(p) + items.slice(p.from, p.to).map((x, j) => piece(x, p.from + j)).join('')).join('')}
${letter(t.close, 'close')}
<section class="full"><div class="orn"><b></b><i></i><b></b></div><div class="foot">${t.back}</div></section>
</body></html>`;
}

module.exports = { render, T };

// Text that appears only on each piece's first page (used to find page numbers).
module.exports.anchors = (lang, items) => {
  const t = T[lang];
  const a = { open: t.open.paras[0].slice(0, 40), close: t.close.paras[0].slice(0, 40) };
  items.forEach((x, i) => { a['p' + i] = (x.lines ? x.lines[0] : x.paras[0]).slice(0, 38); });
  return a;
};
