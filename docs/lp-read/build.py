"""Builds /read: the main article page (index.html) with the strongest parts of the store page (/workbook) added.

Same hook, story, self-check, offer, add-on pop-up and checkout as index.html. Changes:
  1. after the self-check: real workbook pages in a carousel (instead of the single book photo)
  2. "right now / after the workbook" lists -> four number cards (122 pages, 27 exercises, 76 min, 14 days)
  3. offer card: a 1:20 audiobook preview player
  4. a sticky bar with the three editions once the reader is past "what's inside"
Every order from this page is tagged landing=read (index.html sends article, /workbook sends workbook).

index.html stays the source: after changing it, run from the repo root:  python3 docs/lp-read/build.py
Output: read/index.html"""
import pathlib, re

ROOT = pathlib.Path(__file__).parent.parent.parent
src = (ROOT / "index.html").read_text()


def sub(old, new):
    """Replace exactly one occurrence, so a changed index.html fails loudly instead of silently."""
    global src
    n = src.count(old)
    assert n == 1, f"expected 1x, found {n}x: {old[:80]!r}"
    src = src.replace(old, new)


# ---------- paths: the page lives at /read, so make the file links absolute ----------
src = re.sub(r'(src|href)="(images|fonts|pages)/', r'\1="/\2/', src)
src = re.sub(r"url\('fonts/", "url('/fonts/", src)
src = src.replace('href="favicon.png"', 'href="/favicon.png"')

# ---------- tag orders from this page ----------
sub("src:window.EDS_SRC&&EDS_SRC()", "src:Object.assign({},window.EDS_SRC&&EDS_SRC(),{lp:'read'})")
sub('<script>window.va=', "<script>try{window.clarity&&clarity('set','landing','read')}catch(e){}</script>\n<script>window.va=")

# ---------- 1. real pages after the self-check ----------
SPREADS = [("ed5-spread-guilt.webp", "the guilt sort"), ("ed5-spread-c-weight.webp", "the weight you never chose"),
           ("ed5-spread-anger.webp", "the anger translator"), ("ed5-spread-c-started.webp", "where it all started"),
           ("ed5-spread-atm.webp", "the family atm"), ("ed5-spread-c-pretending.webp", "why pretending you're fine isn't working"),
           ("ed5-spread-money.webp", "the money leak detector"), ("ed5-spread-c-sister.webp", "i'm your sister, not your mom"),
           ("ed5-spread-help.webp", "the help allergy test"), ("ed5-spread-c-kid.webp", "becoming the kid you never got to be")]
figs = "".join(
    f'<figure class="sp-f{" on" if i == 0 else ""}"><img src="/images/v2/{f}" alt="workbook pages: {t}" width="1440" height="1128"'
    f'{"" if i < 2 else " loading=\"lazy\""} decoding="async"><figcaption>{t}</figcaption></figure>'
    for i, (f, t) in enumerate(SPREADS))
dots = "".join(f'<button type="button" aria-label="page {i + 1}"{" class=\"on\"" if i == 0 else ""}></button>' for i in range(len(SPREADS)))
sub('''  <figure class="figure figure--book">
    <img src="/images/offer-paperback.webp" alt="the eldest daughter workbook" width="585" height="797" loading="lazy" decoding="async">
  </figure>''',
    f'''  <p class="sp-lead">this is what it looks like inside. real pages, the ones you'll write on:</p>
  <div class="sp" id="sp" tabindex="0" aria-roledescription="carousel" aria-label="pages from the workbook">
    <div class="sp-stage">{figs}</div>
    <div class="sp-dots">{dots}</div>
  </div>''')

# ---------- 2. number cards instead of the before / after lists ----------
ba = re.search(r"  <!-- ===== BEFORE / AFTER ===== -->\n  <div class=\"ba\">.*?\n  </div>\n(?=\n  <div class=\"cta-wrap\">)", src, re.S)
assert ba, "before/after block not found"
src = src.replace(ba.group(0), '''  <!-- ===== IN NUMBERS ===== -->
  <div class="stats">
    <div class="st"><b>122</b><div><h3>pages that finally put words to it</h3><p>the guilt, the anger, the 2am replay. every page names something you thought only you felt, then asks you to do something about it.</p></div></div>
    <div class="st"><b>27</b><div><h3>exercises that change what happens next</h3><p>scripts for the call with mom, a 5-step plan to close the family atm, and a guilt sort that shows you what was never yours to carry.</p></div></div>
    <div class="st"><b>76</b><div><h3>minutes of audio for the hard days</h3><p>press play on the drive home from a family dinner. comes with the audiobook and the paperback.</p></div></div>
    <div class="st"><b>14</b><div><h3>days to try it, risk-free</h3><p>start tonight. if it doesn't land, one email within 14 days gets you a full refund. no questions.</p></div></div>
  </div>
''')

# ---------- 3. audiobook preview in the offer card ----------
sub('''      <li>14-day no-questions-asked money back guarantee.</li>
    </ul>''', '''      <li>14-day no-questions-asked money back guarantee.</li>
    </ul>

    <div class="player" id="player">
      <button type="button" class="pl-btn" id="pl-btn" aria-label="play the audiobook preview"><svg class="i-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><svg class="i-pause" viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg></button>
      <div class="pl-mid"><b>hear the audiobook</b><div class="pl-bar" id="pl-bar"><i id="pl-prog"></i></div></div>
      <span class="pl-time" id="pl-time">0:00 / 1:20</span>
      <audio preload="none" src="/images/v2/ed4-sample.mp3" id="pl-audio"></audio>
    </div>''')

# ---------- 4. sticky edition bar ----------
sub("\n<!-- stripe embedded checkout opens here", '''
<div class="sbar" id="sbar" aria-hidden="true"><div class="sbar-in">
  <div class="sb-opts" role="radiogroup" aria-label="choose your format">
    <button type="button" role="radio" data-f="digital" tabindex="-1"><b>ebook</b><span>$9.99</span></button>
    <button type="button" role="radio" data-f="audio" tabindex="-1"><b>audiobook</b><span>$19.99</span></button>
    <button type="button" role="radio" data-f="print" tabindex="-1"><b>paperback</b><span>$29.99</span></button>
  </div>
  <button type="button" class="sb-go" id="sb-go" tabindex="-1">get it →</button>
</div></div>

<!-- stripe embedded checkout opens here''')

CSS = '''
  /* ===== /read additions (docs/lp-read/build.py) ===== */
  .sp-lead{margin-top:8px}
  .sp{margin:6px -8px 26px;outline:none}
  .sp-stage{display:grid}
  .sp-f{grid-area:1/1;margin:0;opacity:0;transition:opacity .3s ease;pointer-events:none}
  .sp-f.on{opacity:1;pointer-events:auto}
  .sp-f img{width:100%;height:auto;display:block;mix-blend-mode:multiply}
  .sp-f figcaption{text-align:center;font-size:15px;color:var(--muted);margin-top:2px}
  .sp-dots{display:flex;justify-content:center;gap:7px;margin-top:10px}
  .sp-dots button{width:7px;height:7px;border-radius:4px;border:0;padding:0;background:var(--line);cursor:pointer;transition:width .25s,background .25s}
  .sp-dots button.on{width:20px;background:var(--accent)}

  .stats{display:grid;gap:10px;margin:26px 0 20px}
  .st{display:grid;grid-template-columns:84px 1fr;gap:16px;align-items:center;background:#FFFCF6;border-radius:12px;padding:16px 18px;box-shadow:0 1px 2px rgba(43,18,24,.06)}
  .st>b{font-family:var(--serif);font-weight:600;font-size:40px;line-height:1;color:var(--accent);text-align:center;font-variant-numeric:lining-nums}
  .st h3{font-family:var(--serif);font-weight:600;font-size:19px;line-height:1.25;margin:0 0 4px;color:var(--ink)}
  .st p{margin:0!important;font-size:16px;line-height:1.5;color:var(--muted)}
  @media(max-width:380px){.st{grid-template-columns:62px 1fr;gap:12px;padding:14px}.st>b{font-size:32px}}

  .player{display:grid;grid-template-columns:40px 1fr auto;gap:12px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:10px 14px;margin:14px 0 4px;background:#fff}
  .pl-btn{width:40px;height:40px;border-radius:50%;border:0;background:var(--btn);display:grid;place-items:center;cursor:pointer}
  .pl-btn svg{width:17px;height:17px;fill:var(--bg)}
  .pl-btn .i-pause,.player.playing .i-play{display:none}
  .player.playing .i-pause{display:block}
  .pl-mid{min-width:0}
  .pl-mid b{display:block;font-family:var(--body);font-weight:600;font-size:16px;line-height:1.2;margin-bottom:7px}
  .pl-bar{height:5px;border-radius:3px;background:var(--line);cursor:pointer;position:relative}
  .pl-bar i{position:absolute;left:0;top:0;bottom:0;width:0;background:var(--btn);border-radius:3px}
  .pl-time{font-size:14px;color:var(--muted);font-variant-numeric:tabular-nums lining-nums;white-space:nowrap}

  .sbar{position:fixed;left:0;right:0;bottom:0;z-index:40;background:#FFFCF6;box-shadow:0 -6px 24px rgba(43,18,24,.12);padding:10px 12px calc(10px + env(safe-area-inset-bottom));transform:translateY(110%);transition:transform .3s ease}
  .sbar.show{transform:none}
  .sbar-in{max-width:640px;margin:0 auto;display:grid;grid-template-columns:1fr auto;gap:8px;align-items:stretch}
  .sb-opts{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
  .sb-opts button{background:#fff;border:1px solid var(--line);border-radius:10px;padding:6px 2px;font-family:var(--body);text-transform:lowercase;cursor:pointer;color:var(--ink);line-height:1.2}
  .sb-opts button b{display:block;font-weight:600;font-size:14px}
  .sb-opts button span{display:block;font-size:13px;color:var(--muted);font-variant-numeric:lining-nums}
  .sb-opts button.on{border:1.5px solid var(--ink)}
  .sb-go{background:var(--btn);color:var(--bg);border:0;border-radius:10px;padding:0 16px;font-family:var(--body);font-weight:600;font-size:16px;text-transform:lowercase;cursor:pointer;white-space:nowrap}
  @media(max-width:360px){.sb-opts button b{font-size:12.5px}.sb-go{padding:0 11px;font-size:15px}}
  footer{padding-bottom:120px}
</style>
<script>'''
sub("</style>\n<script>\n/* where this visitor came from", CSS + "\n/* where this visitor came from")

JS = '''
<script>
/* /read additions: page carousel, audiobook preview, sticky edition bar */
(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ev(n){ try{ window.clarity&&clarity('event',n) }catch(e){} }

  // pages: change every 2.5 s while on screen; swipe, arrow keys or the dots to move by hand
  var sp=document.getElementById('sp');
  if(sp){ var fs=[].slice.call(sp.querySelectorAll('.sp-f')), ds=[].slice.call(sp.querySelectorAll('.sp-dots button')), si=0, timer=null, touched=false;
    function go(n){ si=(n+fs.length)%fs.length; fs.forEach(function(f,k){ f.classList.toggle('on',k===si); var im=f.querySelector('img'); if(k===(si+1)%fs.length&&im.loading==='lazy') im.loading='eager'; }); ds.forEach(function(d,k){ d.classList.toggle('on',k===si); }); }
    function stop(){ if(timer) clearInterval(timer); timer=null; }
    function play(){ stop(); if(!reduce) timer=setInterval(function(){ go(si+1); },2500); }
    function hand(){ if(!touched){ touched=true; ev('pages_swiped'); } }
    ds.forEach(function(d,k){ d.addEventListener('click',function(){ go(k); hand(); play(); }); });
    var x0=null;
    sp.addEventListener('touchstart',function(e){ x0=e.touches[0].clientX; stop(); },{passive:true});
    sp.addEventListener('touchend',function(e){ if(x0!=null){ var dx=e.changedTouches[0].clientX-x0; if(Math.abs(dx)>40){ go(si+(dx<0?1:-1)); hand(); } x0=null; } play(); });
    sp.addEventListener('keydown',function(e){ if(e.key==='ArrowRight'){ go(si+1); play(); } if(e.key==='ArrowLeft'){ go(si-1); play(); } });
    if('IntersectionObserver' in window) new IntersectionObserver(function(en){ if(en[0].isIntersecting) play(); else stop(); },{rootMargin:'200px 0px'}).observe(sp); else play();
  }

  // audiobook preview
  var pl=document.getElementById('player'), au=document.getElementById('pl-audio'), prog=document.getElementById('pl-prog'), tm=document.getElementById('pl-time'), played=false;
  if(pl){
    function t(s){ s=Math.max(0,Math.floor(s||0)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
    document.getElementById('pl-btn').addEventListener('click',function(){ if(au.paused){ au.play(); if(!played){ played=true; ev('audio_preview_play'); } } else au.pause(); });
    au.addEventListener('play',function(){ pl.classList.add('playing'); });
    au.addEventListener('pause',function(){ pl.classList.remove('playing'); });
    au.addEventListener('ended',function(){ ev('audio_preview_end'); });
    au.addEventListener('timeupdate',function(){ var d=au.duration||80; prog.style.width=(au.currentTime/d*100)+'%'; tm.textContent=t(au.currentTime)+' / '+t(d); });
    document.getElementById('pl-bar').addEventListener('click',function(e){ var r=this.getBoundingClientRect(), d=au.duration||80; au.currentTime=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*d; if(au.paused) au.play(); });
  }

  // sticky bar: from "what's inside" on, hidden while the offer card is on screen
  var bar=document.getElementById('sbar'), inside=document.getElementById('inside'), offer=document.getElementById('offer'), co=document.getElementById('co');
  var opts=[].slice.call(bar.querySelectorAll('.sb-opts button')), fmtBtns=[].slice.call(document.querySelectorAll('.fmt button'));
  function sync(){ var cur=document.querySelector('.fmt button.on'), f=cur?cur.dataset.f:'digital'; opts.forEach(function(o){ var on=o.dataset.f===f; o.classList.toggle('on',on); o.setAttribute('aria-checked',on); }); }
  opts.forEach(function(o){ o.addEventListener('click',function(){ var b=fmtBtns.filter(function(x){ return x.dataset.f===o.dataset.f; })[0]; if(b) b.click(); sync(); ev('sticky_format_'+o.dataset.f); }); });
  fmtBtns.forEach(function(b){ b.addEventListener('click',sync); });
  document.getElementById('sb-go').addEventListener('click',function(){ ev('sticky_get_it'); document.getElementById('offer-cta').click(); });
  sync();
  var tk=false;
  function upd(){ tk=false; var vh=innerHeight, past=inside.getBoundingClientRect().top<vh*0.3, r=offer.getBoundingClientRect(), offerOn=r.top<vh&&r.bottom>0;
    var on=past&&!offerOn&&co.hidden; bar.classList.toggle('show',on); bar.setAttribute('aria-hidden',on?'false':'true'); opts.concat([document.getElementById('sb-go')]).forEach(function(x){ x.tabIndex=on?0:-1; }); }
  addEventListener('scroll',function(){ if(!tk){ tk=true; requestAnimationFrame(upd); } },{passive:true});
  addEventListener('resize',upd); upd();
})();
</script>
'''
sub("\n<script>try{window.clarity&&clarity('set','landing','read')}", JS + "<script>try{window.clarity&&clarity('set','landing','read')}")

# the article title stays the same, so the test measures the new parts, not a new headline
assert "landing','read'" in src and "lp:'read'" in src
out = ROOT / "read" / "index.html"
out.parent.mkdir(exist_ok=True)
out.write_text(src)
print(f"built {out.relative_to(ROOT)} ({len(src)//1024} KB)")
