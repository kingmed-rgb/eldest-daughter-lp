// HTML for "the eldest daughter journal" (en / es). One fixed US Letter page per <section>.
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CSS = `
:root{--pw:8.5in;--ph:11in;--lh:.36in;--rule:#E3BDB8}
@page{size:8.5in 11in;margin:0}
.pg{width:8.5in;height:11in;padding:.8in .85in .75in;display:flex;flex-direction:column;break-after:page;position:relative;background:var(--bg);overflow:hidden}
.pg.full{background:var(--accent);color:var(--bg);padding:0 16%;justify-content:center;align-items:center}
.pg.full h1{font-size:46pt}.pg.full h2{font-size:34pt}.pg.full .sub{font-size:16pt}.pg.full .kicker{font-size:11pt}
.pg .no{position:absolute;bottom:.4in;left:0;right:0;text-align:center;font-size:9pt;color:var(--muted)}
.pg .run{position:absolute;top:.42in;left:.85in;right:.85in;display:flex;justify-content:space-between;font-family:'Fraunces';font-size:8.5pt;letter-spacing:.16em;color:var(--muted)}
h2.t{font-size:24pt;color:var(--accent);line-height:1.15;margin-bottom:8pt}
h2.t.cont{font-size:15pt;color:var(--muted);font-weight:500}
.intro{font-size:11.5pt;line-height:1.6;color:var(--ink);margin-bottom:14pt;max-width:6.4in}
.q{font-family:'Fraunces';font-size:12.5pt;font-weight:500;line-height:1.35;margin:10pt 0 4pt;color:var(--ink)}
.q::before{content:'';display:inline-block;width:5pt;height:5pt;background:var(--accent);transform:rotate(45deg) translateY(-2pt);margin-right:9pt}
.lines{flex:1;min-height:var(--lh);background:linear-gradient(to bottom,transparent calc(100% - 1px),var(--rule) calc(100% - 1px)) 0 0/100% var(--lh) repeat-y}
.block{display:flex;flex-direction:column;flex:1}
.quote{font-family:'Fraunces';font-style:italic;font-size:14pt;color:var(--accent);text-align:center;margin-top:14pt}
.start{font-family:'Fraunces';font-style:italic;font-size:13pt;color:var(--muted);height:var(--lh);line-height:var(--lh)}
table{width:100%;border-collapse:collapse;table-layout:fixed}
th{font-family:'Fraunces';font-weight:600;font-size:10.5pt;letter-spacing:.06em;text-align:left;color:var(--accent);padding:0 8pt 6pt 0;border-bottom:1.5px solid var(--accent)}
td{border-bottom:1px solid var(--rule);padding:0 8pt;vertical-align:middle;font-size:10pt;color:var(--muted)}
td+td,th+th{border-left:1px solid var(--rule);padding-left:9pt}
td.ex{font-style:italic;color:var(--muted);font-size:10pt}
td.opt{text-align:center;letter-spacing:.04em;font-size:9.5pt;color:#9C4F5C}
.tbl{flex:1;display:flex;flex-direction:column}
.tr{display:grid;flex:1;border-bottom:1px solid var(--rule)}
.tr.th,.tr.ex{flex:none}
.tr.th{border-bottom:1.5px solid var(--accent)}
.tr .c{padding:0 9pt;display:flex;align-items:center}
.tr .c+.c{border-left:1px solid var(--rule)}
.tr.th .c{font-family:'Fraunces';font-weight:600;font-size:10.5pt;letter-spacing:.06em;color:var(--accent);padding-bottom:6pt;padding-left:0}
.tr.th .c+.c{padding-left:9pt}
.tr.ex .c{font-style:italic;color:var(--muted);font-size:10pt;height:var(--lh)}
.tr .c.opt{justify-content:center;letter-spacing:.04em;font-size:9.5pt;color:#9C4F5C}
.full .orn{color:inherit}
.letter p{font-size:12.5pt;line-height:1.75;margin-bottom:12pt;max-width:6.2in}
.letter h2{font-family:'Fraunces';font-style:italic;font-weight:400;font-size:24pt;color:var(--accent);margin:.6in 0 22pt}
.letter .sign{font-family:'Fraunces';font-style:italic;font-size:15pt;margin-top:14pt}
.how .item{display:flex;gap:18pt;padding:13pt 0;border-bottom:1px solid var(--rule)}
.how .item b{font-family:'Fraunces';font-weight:600;font-size:12pt;width:2.4in;flex:none;color:var(--accent)}
.how .item span{font-size:11.5pt;line-height:1.55}
.how .foot{font-family:'Fraunces';font-style:italic;font-size:14pt;color:var(--accent);margin-top:28pt}
.toc .row{display:flex;align-items:flex-end;font-size:11.5pt;line-height:1.5;padding:4.5pt 0}
.toc .row .d{flex:1;border-bottom:1px dotted var(--tint3);margin:0 8pt 5pt}
.toc .row .n{color:var(--muted)}
.toc .pt{font-family:'Fraunces';font-size:9pt;letter-spacing:.16em;color:var(--muted);margin:16pt 0 3pt}
.two{flex:1;display:grid;grid-template-columns:1fr 1fr;column-gap:22pt}
.two .col{display:flex;flex-direction:column}
.two .h{font-family:'Fraunces';font-weight:600;font-size:11pt;color:var(--accent);padding-bottom:6pt;border-bottom:1.5px solid var(--accent)}
.two .ex{font-style:italic;color:var(--muted);font-size:10pt;height:var(--lh);line-height:var(--lh);border-bottom:1px solid var(--rule)}
.slips{flex:1;display:grid;grid-template-rows:repeat(4,1fr);gap:14pt}
.slip{border:1.5px dashed var(--tint3);border-radius:10px;padding:12pt 16pt;display:flex;flex-direction:column;justify-content:space-around}
.slip .f{display:flex;align-items:flex-end;gap:8pt;font-size:11pt}
.slip .f span{white-space:nowrap}
.slip .f i{flex:1;border-bottom:1px solid var(--rule);height:14pt}
.slip .f.half{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:8pt}
.slip .k{font-family:'Fraunces';font-size:8pt;letter-spacing:.18em;color:var(--accent)}
.list{flex:1;display:grid;grid-template-columns:1fr 1fr;column-gap:24pt}
.list .col{display:flex;flex-direction:column}
.list .r{flex:1;display:flex;align-items:flex-end;border-bottom:1px solid var(--rule);font-size:9pt;color:var(--tint3);padding-bottom:3pt}
.dhead{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:6pt}
.dhead h2{font-size:22pt;color:var(--accent)}
.dhead .date{font-size:10.5pt;color:var(--muted);display:flex;gap:8pt;align-items:flex-end}
.dhead .date i{display:block;width:1.6in;border-bottom:1px solid var(--rule);height:13pt}
.body{display:flex;align-items:center;gap:12pt;font-family:'Fraunces';font-size:12pt;font-weight:500;margin:14pt 0 2pt}
.body span.o{font-family:'Source Serif 4';font-weight:400;font-size:10.5pt;border:1px solid var(--tint3);border-radius:20px;padding:3pt 11pt;color:var(--muted)}
`;

function render(lang, J) {
  const m = J.meta;
  const pages = [];
  let n = 0;
  const toc = [];
  const add = (html, cls = '', opts = {}) => {
    n++;
    const no = opts.noNumber ? '' : `<div class="no">${n}</div>`;
    const run = opts.run ? `<div class="run"><span>${esc(m.title)}</span><span>${esc(opts.run)}</span></div>` : '';
    pages.push(`<section class="pg ${cls}">${run}${html}${no}</section>`);
    return n;
  };
  let part = '';
  const ex = (pair) => pair ? pair : null;

  // cover + copyright
  add(`<div class="kicker">${esc(m.author)}</div><h1>${esc(m.title)}</h1><div class="orn"><b></b><i></i><b></b></div><div class="sub">${esc(m.sub)}</div>`, 'full', { noNumber: true });
  add(`<div style="flex:1"></div><p style="font-size:9.5pt;line-height:1.6;color:var(--muted);max-width:5in">${esc(m.copyright)}</p><p style="font-size:9.5pt;line-height:1.6;color:var(--muted);max-width:5in;margin-top:8pt">${esc(m.disclaimer)}</p>`, '', { noNumber: true });

  let tocIndex = -1;
  for (const p of J.pages) {
    const run = part;
    if (p.type === 'letter') {
      const at = add(`<div class="letter"><h2>${esc(p.title)}</h2>${p.paras.map((x) => `<p>${esc(x)}</p>`).join('')}<div class="sign">${p.sign}</div></div>`);
      toc.push({ part: null, title: p.title, at });
    } else if (p.type === 'how') {
      add(`<div class="how"><h2 class="t">${esc(p.title)}</h2>${p.items.map(([a, b]) => `<div class="item"><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('')}<div class="foot">${esc(p.foot)}</div></div>`);
    } else if (p.type === 'toc') {
      tocIndex = pages.length; add('TOC');
    } else if (p.type === 'part') {
      part = p.kicker;
      const at = add(`<div class="kicker">${esc(p.kicker)}</div><h2>${esc(p.title)}</h2><div class="orn"><b></b><i></i><b></b></div><div class="sub">${esc(p.sub)}</div>`, 'full', { noNumber: true });
      toc.push({ part: p.kicker + ' · ' + p.title, at });
    } else if (p.type === 'prompts') {
      const qs = p.prompts.map((q) => `<div class="block"><div class="q">${esc(q)}</div><div class="lines"></div></div>`).join('');
      const at = add(`<h2 class="t${p.cont ? ' cont' : ''}">${esc(p.title)}</h2>${p.intro ? `<p class="intro">${esc(p.intro)}</p>` : ''}${qs}${p.quote ? `<div class="quote">${esc(p.quote)}</div>` : ''}`, '', { run });
      if (!p.cont) toc.push({ title: p.title, at });
    } else if (p.type === 'table') {
      const tpl = p.cols.map(([, w]) => w + 'fr').join(' ');
      const cell = (inner, cls = '') => `<div class="c ${cls}">${inner}</div>`;
      const head = `<div class="tr th" style="grid-template-columns:${tpl}">${p.cols.map(([c]) => cell(esc(c))).join('')}</div>`;
      const exRow = p.example ? `<div class="tr ex" style="grid-template-columns:${tpl}">${p.example.map((e) => cell(esc(e))).join('')}</div>` : '';
      const row = `<div class="tr" style="grid-template-columns:${tpl}">${p.cols.map((c, k) => (p.fill && k === p.cols.length - 1) ? cell(esc(p.fill), 'opt') : cell('')).join('')}</div>`;
      const at = add(`<h2 class="t${p.cont ? ' cont' : ''}">${esc(p.title)}</h2>${p.intro ? `<p class="intro">${esc(p.intro)}</p>` : ''}<div class="tbl">${head}${exRow}${row.repeat(p.rows)}</div>`, '', { run });
      if (!p.cont) toc.push({ title: p.title, at });
    } else if (p.type === 'two') {
      const col = (h, e) => `<div class="col"><div class="h">${esc(h)}</div>${e ? `<div class="ex">${esc(e)}</div>` : ''}<div class="lines"></div></div>`;
      const at = add(`<h2 class="t">${esc(p.title)}</h2><p class="intro">${esc(p.intro)}</p><div class="two">${col(p.left, p.example && p.example[0])}${col(p.right, p.example && p.example[1])}</div>`, '', { run });
      toc.push({ title: p.title, at });
    } else if (p.type === 'lined') {
      const at = add(`<h2 class="t">${esc(p.title)}</h2><p class="intro">${esc(p.intro)}</p><div class="start">${esc(p.start)}</div><div class="lines"></div>`, '', { run });
      add(`<div class="lines"></div>`, '', { run });
      toc.push({ title: p.title, at });
    } else if (p.type === 'slips') {
      const [a, b, c, d, e] = p.slip;
      const slip = `<div class="slip"><div class="k">${esc(p.slipLabel || p.title)}</div><div class="f"><span>${esc(a)}</span><i></i></div><div class="f"><span>${esc(b)}</span><i></i></div><div class="f"><i></i></div><div class="f"><span>${esc(c)}</span><i></i></div><div class="f half"><span>${esc(d)}</span><i></i><span>${esc(e)}</span><i></i></div></div>`;
      const at = add(`<h2 class="t">${esc(p.title)}</h2><p class="intro">${esc(p.intro)}</p><div class="slips">${slip.repeat(p.count)}</div>`, '', { run });
      add(`<div class="slips">${slip.repeat(p.count)}</div>`, '', { run });
      toc.push({ title: p.title, at });
    } else if (p.type === 'list') {
      const half = Math.ceil(p.rows / 2);
      const col = (s) => `<div class="col">${Array.from({ length: half }, (_, k) => `<div class="r">${s + k + 1}</div>`).join('')}</div>`;
      const at = add(`<h2 class="t">${esc(p.title)}</h2><p class="intro">${esc(p.intro)}</p><div class="list">${col(0)}${col(half)}</div>`, '', { run });
      toc.push({ title: p.title, at });
    } else if (p.type === 'daily') {
      let first;
      for (let d = 1; d <= p.count; d++) {
        const fields = p.fields.map((f) => `<div class="block"><div class="q">${esc(f)}</div><div class="lines"></div></div>`);
        const body = `<div class="body">${esc(p.body)} ${p.bodyOpts.map((o) => `<span class="o">${esc(o)}</span>`).join('')}</div>`;
        const at = add(`<div class="dhead"><h2>${esc(p.label)} ${d}</h2><div class="date">${esc(m.date)} <i></i></div></div>${fields.slice(0, 2).join('')}${body}${fields.slice(2).join('')}`, '', { run });
        if (d === 1) first = at;
      }
      toc.push({ title: `${p.label} 1–${p.count}`, at: first });
    } else if (p.type === 'weekly') {
      for (let w = 1; w <= p.count; w++) {
        const at = add(`<div class="dhead"><h2>${esc(p.label)} ${w}</h2><div class="date">${esc(m.date)} <i></i></div></div>${p.fields.map((f) => `<div class="block"><div class="q">${esc(f)}</div><div class="lines"></div></div>`).join('')}`, '', { run: part });
        if (w === 1) toc.push({ title: p.tocTitle, at });
      }
    }
  }
  add(`<div class="orn"><b></b><i></i><b></b></div><div class="foot">${esc(m.back)}</div>`, 'full', { noNumber: true });

  const tocHtml = `<h2 class="t">${esc(m.contents)}</h2><div class="toc">${toc.map((r) => r.part
    ? `<div class="pt">${esc(r.part)}</div>`
    : `<div class="row"><span>${esc(r.title)}</span><span class="d"></span><span class="n">${r.at}</span></div>`).join('')}</div>`;
  pages[tocIndex] = pages[tocIndex].replace('TOC', tocHtml);

  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(m.fileTitle)}</title>
<link rel="stylesheet" href="shared.css"><style>${CSS}</style></head><body>${pages.join('\n')}</body></html>`;
}

module.exports = { render, anchors: () => ({}) };
