"""Shared brand pieces for every Anna Celestina page (product page v4, home page v5).
Header, footer, announcement bar and their CSS live here once, so the pages can't drift apart.
Each page's build.py calls these and swaps the result into its @@ANN@@ / @@HEADER@@ / @@FOOTER@@ / @@BRAND_CSS@@ tokens."""

BAG = ('<svg viewBox="0 0 24 24"><path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z"/>'
       '<path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>')

ANN = ('<div class="ac-ann ac-tk" role="region" aria-label="Announcements"><div class="ac-tk-track">'
       '<div class="ac-tk-g"><span class="ac-tk-i">Black Friday sale: 67% off</span><span class="ac-tk-i">Over 10,000 happy readers</span><span class="ac-tk-i">14-day money-back guarantee</span><span class="ac-tk-i">Black Friday sale: 67% off</span><span class="ac-tk-i">Over 10,000 happy readers</span><span class="ac-tk-i">14-day money-back guarantee</span></div><div class="ac-tk-g" aria-hidden="true"><span class="ac-tk-i">Black Friday sale: 67% off</span><span class="ac-tk-i">Over 10,000 happy readers</span><span class="ac-tk-i">14-day money-back guarantee</span><span class="ac-tk-i">Black Friday sale: 67% off</span><span class="ac-tk-i">Over 10,000 happy readers</span><span class="ac-tk-i">14-day money-back guarantee</span></div>'
       '</div></div>')


def header(home, product, email, cart_drawer):
    """cart_drawer=True: the bag opens this page's cart drawer (product page).
    False: the bag goes to the workbook page (pages without a cart)."""
    if cart_drawer:
        bag = (f'<button type="button" class="ac-bag" data-open-cart aria-label="Open cart">{BAG}'
               '<span class="ac-count" data-hdr-count hidden>0</span></button>')
    else:
        bag = f'<a class="ac-bag" href="{product}" aria-label="Get the workbook">{BAG}</a>'
    menu = ('<button type="button" class="ac-menu" aria-label="Open menu" aria-expanded="false" aria-controls="ac-nav">'
            '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>')
    # tiny inline script: opens/closes the phone menu; works on every page that uses this header
    js = ('<script>(function(){var h=document.currentScript.parentNode,b=h.querySelector(".ac-menu");'
          'function set(o){h.classList.toggle("open",o);b.setAttribute("aria-expanded",o);b.setAttribute("aria-label",o?"Close menu":"Open menu")}'
          'b.addEventListener("click",function(){set(!h.classList.contains("open"))});'
          'h.querySelectorAll(".ac-nav a").forEach(function(a){a.addEventListener("click",function(){set(false)})});'
          'document.addEventListener("keydown",function(e){if(e.key==="Escape")set(false)});})();</script>')
    return (f'<header class="ac-hdr"><div class="ac-hdr-in">{menu}'
            f'<a class="ac-logo" href="{home}">ANNA CELESTINA</a>'
            f'<nav class="ac-nav" id="ac-nav"><a href="{home}">Home</a><a href="{product}">The Workbook</a>'
            f'<a href="mailto:{email}">Contact</a></nav>{bag}</div>{js}</header>')


REVEAL_JS = ('<script>(function(){if(!("IntersectionObserver" in window)||matchMedia("(prefers-reduced-motion: reduce)").matches)return;'
             'var sel=".pd section h2,.pd .story p,.pd .story .sp,.pd .disc li,.pd .st,.pd .toc3 details,.ac-revs article,.ac-guar,.pd .faq details,'
             '.hm-title,.hm-sub,.hm-feat,.hm-book,.hm-about>img,.hm-about h2,.hm-about p,.hm-quotes figure,.hm-letters>*,.ac-foot-in>div";'
             'var els=[].slice.call(document.querySelectorAll(sel));if(!els.length)return;document.documentElement.classList.add("ac-anim");'
             'var io=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{rootMargin:"0px 0px -8% 0px",threshold:.08});'
             'els.forEach(function(el){var sib=el.parentElement?[].indexOf.call(el.parentElement.children,el):0;el.style.transitionDelay=(Math.min(sib,4)*70)+"ms";el.classList.add("rv");io.observe(el)});'
             '})();</script>')


def footer(home, product, email, policy_links):
    return (f'<footer class="ac-foot"><div class="ac-foot-in">'
            f'<div class="ac-fb"><a class="ac-logo" href="{home}">ANNA CELESTINA</a>'
            f'<p>Workbooks, poems and journals for the daughter who became the responsible one.</p></div>'
            f'<div class="ac-links"><h4>Books</h4><a href="{product}">The Eldest Daughter Workbook</a>'
            f'<a href="{home}products/dear-angry-eldest-daughter">Dear Angry Eldest Daughter</a>'
            f'<a href="{home}products/the-eldest-daughter-journal">The Eldest Daughter Journal</a></div>'
            f'<div class="ac-links"><h4>Help</h4><a href="mailto:{email}">Contact</a>{policy_links}</div>'
            f'</div>'
            f'<div class="ac-foot-base"><div class="ac-pay">@@PAYMENTS@@</div>'
            f'<p class="ac-legal">© @@YEAR@@ Anna Celestina. All rights reserved. <i>The Eldest Daughter Workbook</i> and all books on this site, '
            f'including their text, exercises and illustrations, are original works by Anna Celestina. No part may be copied, '
            f'reproduced, shared or resold without written permission.</p></div></footer>' + REVEAL_JS)


CSS = """
/* html prefix: beats page-level resets like .pd *{padding:0}
   ===== shared brand: announcement, header, footer (shared/brand.py) ===== */
html .ac-ann{background:#0b0909;color:#fbf7f2;text-align:center;font:600 12.5px/1.4 'Inter',system-ui,sans-serif;padding:8px 12px;letter-spacing:.02em}
html .ac-hdr{background:#fbf7f2;border-bottom:1px solid #e8dfd6}
html .ac-hdr-in{max-width:1120px;margin:0 auto;padding:0 20px;height:62px;display:flex;align-items:center;gap:24px}
html .ac-logo{font-family:'Space Grotesk','Inter',sans-serif;font-weight:700;letter-spacing:.22em;font-size:16px;color:#1f1a17;text-decoration:none;white-space:nowrap}
html .ac-nav{display:flex;gap:24px;margin-left:auto}
html .ac-nav a{font:500 14px/1 'Inter',sans-serif;color:#6b625c;text-decoration:none}
html .ac-nav a:hover{color:#1f1a17}
html .ac-bag{position:relative;background:none;border:0;width:42px;height:42px;display:grid;place-items:center;cursor:pointer;margin-right:-8px;color:#1f1a17}
html .ac-bag svg{width:24px;height:24px;fill:none;stroke:#1f1a17;stroke-width:1.7;stroke-linejoin:round}
html .ac-count{position:absolute;top:2px;right:0;min-width:18px;height:18px;border-radius:9px;background:#6e1a2b;color:#fff;font:700 11px/18px 'Inter',sans-serif;text-align:center;padding:0 4px}
html .ac-foot{border-top:1px solid #e8dfd6;padding:44px 0 30px;font:400 14px/1.6 'Inter',sans-serif;color:#6b625c;background:#fbf7f2}
html .ac-foot-in{max-width:1120px;margin:0 auto;padding:0 20px;display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:30px}
html .ac-foot h4{color:#1f1a17;font-size:14px;margin:0 0 10px}
html .ac-foot p{margin:8px 0 0}
html .ac-foot a{color:inherit}
html .ac-links a{display:block;text-decoration:none;margin-bottom:6px}
html .ac-links a:hover{color:#1f1a17}
html .ac-legal{max-width:760px;margin:30px auto 0!important;padding:0 20px;text-align:center;font-size:12px}
@media(max-width:860px){html .ac-foot-in{grid-template-columns:1fr;text-align:center}}
@media(max-width:560px){html .ac-ann span{display:none}html .ac-hide-sm{display:none}html .ac-hdr-in{gap:14px}html .ac-logo{font-size:14px;letter-spacing:.16em}html .ac-nav{gap:14px}}
"""


def apply(src, cart_drawer):
    """Swap the brand tokens into a page source. Leaves @@HOME@@ / @@PRODUCT@@ / @@EMAIL@@ / @@FOOTER_LINKS@@
    for the page's own build to fill (liquid for the section, '#' for the preview)."""
    for tok in ("@@ANN@@", "@@HEADER@@", "@@FOOTER@@", "@@BRAND_CSS@@"):  # @@REVIEWS@@ / @@GUARANTEE@@ are optional
        assert tok in src, f"page source is missing {tok}"
    assert src.count("</style>") == 1, "page must have exactly one <style> block"
    src = src.replace("</style>", TYPE_CSS + TYPE2_CSS + FIX_CSS + "</style>")
    return (src.replace("@@ANN@@", ANN).replace("@@REVIEWS@@", reviews())
               .replace("@@GUARANTEE@@", guarantee("@@GUAR_CTA@@", "@@EMAIL@@"))
               .replace("@@HEADER@@", header("@@HOME@@", "@@PRODUCT@@", "@@EMAIL@@", cart_drawer))
               .replace("@@FOOTER@@", footer("@@HOME@@", "@@PRODUCT@@", "@@EMAIL@@", "@@FOOTER_LINKS@@"))
               .replace("@@BRAND_CSS@@", CSS))


# ---------- reviews: one list, one card design, used on every page ----------
REVIEWS = [
    ("Priya M.", "Mumbai", "I didn’t plan on getting personally attacked today, but here we are 😭 Every single page felt too close to home. If you know, you know."),
    ("Fatima Zahra", "Casablanca", "Everyone always expected something from me. Needed something from me. I could never rest. This workbook finally gave me permission to."),
    ("Zara", "London", "Reading this felt like someone finally handed me back to myself. Honestly didn’t expect a workbook to hit this hard."),
    ("Renée L.", "Paris", "Confusing being loved with being useful. Ouch. I had to put it down for a minute and just sit with that. Chapter 3 absolutely wrecked me."),
    ("Yara Al-Hassan", "Beirut", "I finally had words for why rest felt impossible. It felt like someone understood the part of me I always hide."),
    ("Leila", "Dubai", "The prompts were direct without being harsh. I cried, but in the way that makes space afterward."),
    ("Nora", "Sydney", "I kept stopping because every page felt too accurate. In a good way. I felt so seen without feeling judged 🤍"),
    ("Adaeze O.", "Accra", "Called me out and made me cry. Described me to a T. I sent it to every eldest daughter I know."),
    ("Claire Dubois", "Brussels", "It gave me language for the guilt. I didn’t know how much I needed that until I wrote it down. Highly recommend 🌱"),
]


def reviews():
    return '<div class="ac-revs">' + ''.join(
        f'<article><header><span class="ac-av">{n[0]}</span><div><b>{n}</b><small>{c}</small></div></header>'
        f'<span class="ac-stars" aria-label="5 stars">★★★★★</span><p>{t}</p></article>' for n, c, t in REVIEWS) + '</div>'


REVIEWS_CSS = """
/* shared reviews band + cards */
html .ac-wall{background:#0b0909;padding:64px 0}
html .ac-revs{columns:3 280px;column-gap:14px;margin-top:40px}
html .ac-revs article{break-inside:avoid;background:#fff;color:#1f1a17;border:0;border-radius:10px;padding:18px 20px;margin:0 0 14px}
html .ac-revs header{display:flex;gap:10px;align-items:center;margin:0 0 10px}
html .ac-av{flex:none;width:38px;height:38px;border-radius:50%;background:#6e1a2b;color:#fff;display:grid;place-items:center;font:800 15px/1 'Inter',sans-serif}
html .ac-revs b{display:block;font:700 14.5px/1.3 'Inter',sans-serif}
html .ac-revs small{display:block;font:400 12.5px/1.3 'Inter',sans-serif;color:#6b625c}
html .ac-stars{display:block;color:#6e1a2b;letter-spacing:2px;font-size:14px;margin:0 0 6px}
html .ac-revs p{font:400 15px/1.55 'Inter',sans-serif;color:#1f1a17;margin:0}
@media(max-width:900px){html .ac-wall{padding:52px 0}}
"""
CSS = CSS + REVIEWS_CSS


# ---------- guarantee card: same on every page ----------
def guarantee(cta_href, email):
    return (f'<section class="ac-guar-sec"><div class="ac-guar">'
            f'<p class="ac-guar-k">14-day money-back guarantee</p>'
            f'<h2>If it doesn’t help, you don’t pay</h2>'
            f'<p>Do the first chapter tonight. If it doesn’t feel right, <a href="mailto:{email}">email me</a> within 14 days and I’ll refund you in full. '
            f'You don’t have to justify it.</p>'
            f'<p class="ac-sign">— Anna</p>'
            f'<a class="ac-btn" href="{cta_href}">Try it tonight, risk-free <span>→</span></a></div></section>')


GUAR_CSS = """
/* shared guarantee card + button */
html .ac-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;background:#6e1a2b;color:#fff;text-decoration:none;font:800 14px/1 'Inter',sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:17px 26px;border-radius:4px;transition:background .15s}
html .ac-btn:hover{background:#561322}
html .ac-guar-sec{background:#f3ece4;padding:64px 20px}
html .ac-guar{display:grid;grid-template-columns:1fr auto;gap:40px;align-items:center;max-width:900px;margin:0 auto;background:#fff;border:1px solid #e8dfd6;border-radius:10px;padding:40px 44px;box-shadow:0 30px 60px -40px rgba(0,0,0,.3)}
html .ac-guar h2{font:700 clamp(24px,3.4vw,34px)/1 'Space Grotesk','Inter',sans-serif;text-transform:uppercase;letter-spacing:-.02em;color:#1f1a17;margin:0}
html .ac-guar h2 em{font-style:normal;color:#6e1a2b}
html .ac-guar p{font:400 16px/1.6 'Inter',sans-serif;color:#3d3632;margin:12px 0 22px}
html .ac-seal{width:170px;height:170px;border-radius:50%;background:#0b0909;color:#fff;display:grid;place-items:center;align-content:center;text-align:center;outline:3px dashed rgba(255,255,255,.35);outline-offset:-12px;font-family:'Inter',sans-serif}
html .ac-seal b{font:700 40px/1 'Space Grotesk',sans-serif}
html .ac-seal span{font-size:12px;letter-spacing:.14em;text-transform:uppercase;margin-top:4px}
html .ac-seal i{font-style:normal;font-size:12px;color:#c1bdb7;font-weight:700;margin-top:4px;letter-spacing:.1em;text-transform:uppercase}
@media(max-width:860px){html .ac-guar{grid-template-columns:1fr;text-align:center;padding:32px 24px;gap:24px}html .ac-seal{order:-1;margin:0 auto;width:140px;height:140px}html .ac-seal b{font-size:32px}}
@media(max-width:900px){html .ac-guar-sec{padding:52px 20px}}
@media(max-width:560px){html .ac-guar .ac-btn{width:100%;padding:18px 16px}}
"""
CSS = CSS + GUAR_CSS

CALM_CSS = """
/* calmer: light reviews band, single-color titles, readable buttons */
html body .ac-wall{background:#f3ece4}
html body .ac-wall h2{color:#1f1a17}
html body .ac-wall h2 em{color:inherit}
html body .ac-revs article{border:1px solid #e8dfd6}
html body .ac-guar h2 em{color:inherit}
html body .ac-btn,html body .ac-btn:visited,html body .ac-btn:hover{color:#fff}
"""
CSS = CSS + CALM_CSS


# ---------- one type system for every page: 2 fonts, 7 sizes, 2 weights ----------
# Space Grotesk 700 = headings + every button. Inter 400/700 = everything else.
# Sizes: 12 labels · 14 small · 16 body · 18 card titles · 26/40 section headings · 32/48 hero + big numbers.
TYPE_CSS = """
/* ===== type system (shared/brand.py TYPE_CSS): placed last so it wins ===== */
html body :is(.pd,.hm) :is(button,input,select,textarea){font-family:'Inter',system-ui,sans-serif}
/* buttons: all Space Grotesk Bold, like Add to cart */
html body :is(.pd .btn,.hm-btn,.ac-btn,.pd .btn-buy,.pd .btn-co,.pd .sbar .btn){font-family:'Space Grotesk','Inter',sans-serif!important;font-weight:700!important;font-size:16px!important;letter-spacing:.12em!important;text-transform:uppercase}
html body :is(.pd .sbar .btn,.pd .up-card .btn,.pd .cart-empty .btn){font-size:14px!important}
html body .pd .plus{font-family:'Space Grotesk','Inter',sans-serif;font-weight:700;font-size:20px}
/* section headings */
html body :is(.pd .mega,.hm-h,.ac-wall h2,.ac-guar h2){font-size:26px!important;font-weight:700}
@media(min-width:760px){html body :is(.pd .mega,.hm-h,.ac-wall h2,.ac-guar h2){font-size:40px!important}}
html body .pd .buy-head h1{font-size:26px!important;font-weight:700}
html body .hm-hero h1{font-size:32px!important;font-weight:700}
@media(min-width:760px){html body .hm-hero h1{font-size:48px!important}}
html body :is(.pd .st>b,.ac-seal b){font-size:32px!important;font-weight:700}
/* card titles 18 bold */
html body :is(.pd .bn h3,.pd .st h4,.pd .alt-card h3,.pd .card-foot b,.pd .ci b,.pd .up-card b,.hm-card h3,.hm-row h3,.hm-tool h3,.pd .rq blockquote,.pd .cart-head h3){font-size:18px!important;font-weight:700!important;font-family:'Inter',sans-serif!important;text-transform:none!important;letter-spacing:0!important}
html body .pd .cart-head h3{font-family:'Space Grotesk','Inter',sans-serif!important;text-transform:uppercase!important}
/* 16 body */
html body :is(.pd .mega-sub,.hm-sub,.hm-p,.pd .buy-sub,.pd .au2 p,.pd .alt-card p,.pd .faq summary,.pd .faq details p,.hm-faq summary,.hm-faq details p,.ac-revs p,.ac-guar p,.pd .toc2 li,.pd .toc-plus,.hm-checks li,.hm-hero-txt>p,.hm-dark p,.pd .fmt b,.pd .ed-row,.pd .card-back p,.pd .card-back q,.pd .cmp-r span,.pd .ex li,.pd .toc-h,.pd .pl-top b){font-size:16px!important}
html body :is(.pd .faq summary,.hm-faq summary,.pd .fmt b,.pd .toc-h,.pd .card-back q,.pd .pl-top b){font-weight:700!important}
html body .pd .card-back q{font-family:'Inter',sans-serif!important}
/* 14 small */
html body :is(.pd .bn p,.pd .st p,.hm-card p,.hm-row p,.hm-tool p,.pd .fmt small,.pd .pt span,.pd .pt b,.pd .under-buy,.pd .pay,.ac-foot,.ac-foot p,.ac-foot a,.ac-foot h4,.ac-revs b,.ac-revs small,.pd .rq figcaption,.pd .rq figcaption b,.pd .inside-q,.pd .ci small,.pd .ci-rm,.pd .up-card p,.pd .cart-trust,.pd .sbar-t,.pd .sbar-t span,.pd .card-foot small,.pd .card-back ul,.ac-nav a,.pd .pr,.pd .fmt .pr,.pd .ci-pr,.pd .pl-time,.hm-hero-txt small,.hm-dark small,.ac-legal,.pd .cart-empty p){font-size:14px!important}
html body :is(.pd .fmt .pr,.pd .pr,.pd .pt b,.ac-revs b,.pd .rq figcaption b,.ac-foot h4,.pd .ci-pr,.pd .sbar-t b){font-weight:700!important}
html body .pd .fmt .pr{font-size:16px!important}
/* 12 labels, bold caps */
html body :is(.pd .k,.hm-tag,.pd .ex h4,.pd .cmp-h span,.pd .inside-k,.pd .fmt .tag,.ac-ann,.pd .card-foot .k,.pd .card-back h5,.pd .pt b i,.pd .up-card .kind,.pd .up-badge,.ac-seal span,.ac-seal i,.ac-count,.pd .hdr-count,.pd .cart-head sup){font-size:12px!important;font-weight:700!important;font-family:'Inter',sans-serif!important}
html body :is(.ac-av,.pd .rq-av,.hm-av){font-size:14px!important;font-weight:700!important}
html body .ac-stars,html body .pd .rq-stars,html body .pd .inside-q .stars{font-size:14px!important}
/* closing heading: normal wrapping (no balance), fluid size, never wider than its box */
html body .hm-dark h2{font-size:clamp(26px,3.6vw,40px)!important;text-wrap:wrap!important;max-width:min(100%,760px)!important;overflow-wrap:break-word;padding:0 4px}
/* contents list: solid green check circles, same as every other check on the site */
html body .pd .toc2 li::before{content:"✓"!important;border:0!important;background:#16a34a!important;background-image:none!important;color:#fff!important;font:700 12px/20px 'Inter',sans-serif!important;text-align:center;margin-top:1px!important}
/* check icons: standard green on purpose, like the gold stars */
html body .pd .toc2 li::before{border-color:#16a34a!important;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M6 10.2l2.6 2.6L14 7.4' fill='none' stroke='%2316a34a' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")!important}
html body :is(.pd .cmp-r span:last-child,.hm-checks li,.pd .ba .aft li)::before{background:#16a34a!important;color:#fff!important}
html body .pd .acc-b ul.yes li::before{color:#16a34a!important}
/* review stars: gold on purpose, the only colour outside the palette */
html body :is(.ac-stars,.pd .rq-stars,.pd .inside-q .stars,.hm-stars){color:#e3a008!important}
/* only two weights: 400 and 700 */
html body :is(.ac-nav a,.hm-checks li){font-weight:400!important}
/* warm palette: headings in sentence case (calmer than ALL CAPS); logo, buttons and small labels stay caps */
html body :is(.pd .mega,.hm-h,.ac-wall h2,.ac-guar h2,.hm-dark h2,.pd .buy-head h1,.hm-hero h1){text-transform:none!important;letter-spacing:-.01em!important;line-height:1.1!important}
html body .pd .ed-row b{font-size:16px!important;font-weight:700!important}
html body :is(.pd .pay b,.pd .cmp-r span:last-child){font-weight:700!important}
"""


# ---------- type system v2: strict roles (overrides TYPE_CSS; html:root body = higher priority) ----------
# Titles (H1-H4) = Space Grotesk 700. Text = Inter 400/700.
#   H1 32 / 40 desktop · H2 26 / 32 · H3 20 · H4 17 · body 16 · small 14 · label 12 caps · display numbers 32
# Lists: one bullet everywhere = 20px green check circle.
TYPE2_CSS = """
/* ===== type system v2 (shared/brand.py TYPE2_CSS) ===== */
html:root body :is(.pd .buy-head h1,.hm-hero h1){font:700 32px/1.1 'Space Grotesk','Inter',sans-serif!important;letter-spacing:-.01em!important;text-transform:none!important;white-space:normal!important}
html:root body :is(.pd .mega,.pd .story h2,.hm-h,.ac-wall h2,.ac-guar h2,.hm-dark h2){font:700 26px/1.15 'Space Grotesk','Inter',sans-serif!important;letter-spacing:-.01em!important;text-transform:none!important}
html:root body :is(.pd .story h3,.pd .toc-h,.pd .story .pull,.pd .cart-head h3,.hm-letter p){font:700 20px/1.3 'Space Grotesk','Inter',sans-serif!important;letter-spacing:0!important;text-transform:none!important}
html:root body :is(.pd .st h4,.pd .bn h3,.pd .alt-card h3,.pd .card-foot b,.pd .ci b,.pd .up-card b,.pd .faq summary,.hm-card h3,.hm-row h3,.hm-tool h3,.hm-faq summary,.ac-foot h4){font:700 17px/1.3 'Space Grotesk','Inter',sans-serif!important;letter-spacing:0!important;text-transform:none!important}
@media(min-width:760px){
  html:root body :is(.pd .buy-head h1,.hm-hero h1){font-size:40px!important}
  html:root body :is(.pd .mega,.pd .story h2,.hm-h,.ac-wall h2,.ac-guar h2,.hm-dark h2){font-size:32px!important}
}
/* body text: Inter 16, bold variants stay 16 */
html:root body :is(.pd .story p,.pd .story .lead,.pd .story .pain-turn,.pd .buy-sub,.pd .mega-sub,.hm-sub,.hm-p,.hm-hero-txt>p,.hm-dark p,.ac-revs p,.ac-guar p,.pd .faq details p,.hm-faq details p,.pd .toc2 li,.pd .story .disc li,.pd .story .pain li,.hm-checks li){font-family:'Inter',sans-serif!important;font-size:16px!important;line-height:1.6!important}
html:root body :is(.pd .story .lead,.pd .story .pain-turn){font-weight:700!important}
html:root body .pd .story .lead em{font-style:normal}
/* labels: Inter 12 bold caps */
html:root body :is(.pd .k,.pd .inside-k,.hm-tag,.pd .cmp-h span){font:700 12px/1.4 'Inter',sans-serif!important;letter-spacing:.12em!important;text-transform:uppercase!important}
/* every button the same size */
html:root body :is(.pd .btn,.hm-btn,.ac-btn,.pd .btn-buy,.pd .btn-co,.pd .sbar .btn){font-size:16px!important}

/* one bullet style for every list: green check circle */
html:root body :is(.pd .toc2 li,.pd .story .disc li,.pd .story .pain li,.hm-checks li){display:flex!important;gap:12px!important;align-items:flex-start;position:static!important;padding-left:0!important}
html:root body :is(.pd .toc2 li,.pd .story .disc li,.pd .story .pain li,.hm-checks li)::before{content:"✓"!important;position:static!important;flex:none!important;width:20px!important;height:20px!important;border:0!important;border-radius:50%!important;background:#16a34a!important;background-image:none!important;color:#fff!important;font:700 12px/20px 'Inter',sans-serif!important;text-align:center!important;margin-top:3px!important;display:block!important}
html:root body :is(.pd .toc2,.pd .story .disc,.pd .story .pain,.hm-checks){gap:10px!important}
/* story copy: plain reading text only. No box, no bold paragraphs, no quote bars.
   Styles left: H2 title, body text, one H3, one check list, one button. */
html:root body .pd .story .pain{background:none!important;border:0!important;padding:0!important;margin:16px 0 0!important;gap:2px!important}
html:root body .pd .story .pain li{display:block!important}
html:root body .pd .story .pain li::before{content:none!important;display:none!important}
html:root body :is(.pd .story .lead,.pd .story .pain-turn,.pd .story .pull){font:400 16px/1.6 'Inter',sans-serif!important;border:0!important;padding:0!important;margin:16px 0 0!important}
/* ===== spacing: one rhythm for every section on both pages =====
   section padding 56 phone / 72 desktop · heading→content 28 · backgrounds alternate */
html:root body :is(.pd .sec,.hm-sec,.ac-wall,.ac-guar-sec){padding-top:56px!important;padding-bottom:56px!important}
@media(min-width:760px){html:root body :is(.pd .sec,.hm-sec,.ac-wall,.ac-guar-sec){padding-top:72px!important;padding-bottom:72px!important}}
html:root body .pd .hero{padding-bottom:48px!important}
html:root body .pd .story{border-top:1px solid #e8dfd6}
/* product: white story · sand inside · white reviews · sand guarantee · white FAQ */
html:root body .ac-wall{background:#fbf7f2!important}
html:root body .ac-guar-sec{background:#f3ece4!important}
html:root body :is(#inside .sp,.pd .stats,.ac-revs,.pd .faq,.hm-faq,.ac-guar){margin-top:24px!important}
html:root body #inside .stats{margin-top:24px!important}
html:root body :is(.pd .mega-sub,.hm-sub){margin-top:12px!important}
html:root body :is(.pd .toc-h){margin-top:40px!important}
html:root body :is(.pd .btn-wide){margin-top:32px!important}
/* buttons: sentence case, normal spacing (logo and small labels keep their caps) */
html:root body :is(.pd .btn,.hm-btn,.ac-btn,.pd .btn-buy,.pd .btn-co,.pd .sbar .btn,.pd .up-card .btn){text-transform:none!important;letter-spacing:.01em!important}
/* ===== footer (warm sand, 3 columns, payment logos, copyright) ===== */
html:root body .ac-foot{background:#f3ece4!important;border-top:0!important;padding:56px 0 28px!important;color:#6b625c}
html:root body .ac-foot-in{grid-template-columns:1.4fr 1fr 1fr!important;gap:32px!important}
html:root body .ac-fb p{font-size:14px;margin-top:12px;max-width:320px}
html:root body .ac-foot h4{font:700 17px/1.3 'Space Grotesk','Inter',sans-serif!important;color:#1f1a17;margin:0 0 12px}
html:root body .ac-links a{font-size:14px;color:#6b625c;text-decoration:none;margin-bottom:8px;display:block}
html:root body .ac-links a:hover{color:#1f1a17}
html:root body .ac-foot-base{max-width:1080px;margin:40px auto 0;padding:24px 20px 0;border-top:1px solid #e0d6cc;display:flex;flex-direction:column;align-items:center;gap:14px}
html:root body .ac-legal{margin:0!important;padding:0!important;max-width:720px;font-size:12px!important;line-height:1.6;text-align:center;color:#6b625c}
html:root body .ac-pay{display:flex;flex-wrap:wrap;justify-content:center;gap:6px}
html:root body .ac-pay svg{width:38px;height:24px;display:block}
@media(max-width:760px){html:root body .ac-foot-in{grid-template-columns:1fr 1fr!important;text-align:left!important}html:root body .ac-fb{grid-column:1/-1}}
/* guarantee in Anna's voice */
html:root body .ac-guar .ac-sign{font:700 16px/1.4 'Space Grotesk','Inter',sans-serif;color:#1f1a17;margin:-6px 0 22px}
/* ===== scroll reveal: sections fade up as they come into view ===== */
html.ac-anim .rv{opacity:0;transform:translateY(18px);transition:opacity .6s ease,transform .6s cubic-bezier(.2,.7,.2,1)}
html.ac-anim .rv.in{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){html.ac-anim .rv{opacity:1;transform:none;transition:none}}
/* ===== no sideways scrolling anywhere ===== */
html,body{overflow-x:hidden;max-width:100%}
@supports (overflow:clip){html,body{overflow-x:clip}}
/* ===== header: desktop = logo left, links, bag right · phone = menu left, logo centre, bag right ===== */
html:root body .ac-hdr{position:relative;z-index:40}
html:root body .ac-menu{display:none;background:none;border:0;width:42px;height:42px;place-items:center;cursor:pointer;margin-left:-8px;color:#1f1a17}
html:root body .ac-menu svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}
html:root body .ac-hide-sm{display:inline!important}
@media(max-width:760px){
  html:root body .ac-hdr-in{display:grid!important;grid-template-columns:42px 1fr 42px;gap:0!important;height:58px}
  html:root body .ac-menu{display:grid}
  html:root body .ac-logo{justify-self:center;text-align:center;font-size:15px;letter-spacing:.18em}
  html:root body .ac-bag{justify-self:end;margin-right:-8px}
  html:root body .ac-nav{display:none!important;position:absolute;left:0;right:0;top:100%;flex-direction:column;gap:0!important;margin:0!important;background:#fbf7f2;border-bottom:1px solid #e8dfd6;box-shadow:0 16px 24px -18px rgba(31,26,23,.35);padding:6px 20px 12px}
  html:root body .ac-hdr.open .ac-nav{display:flex!important}
  html:root body .ac-nav a{display:block!important;font-size:16px!important;color:#1f1a17!important;padding:14px 0;border-top:1px solid #e8dfd6}
  html:root body .ac-nav a:first-child{border-top:0}
}
"""


# ---------- spacing + line-height system (applied LAST so nothing overrides it) ----------
# heading → subtitle 12 · heading/subtitle → content 24 · paragraph → paragraph 16
# line-height: 16px text 1.6 · 14px text 1.5 · 12px text 1.4 · logo 15px everywhere
FIX_CSS = """
/* ===== spacing + line-height system (shared/brand.py FIX_CSS, last in the cascade) ===== */
html:root body .pd .hero{padding-bottom:24px!important}
html:root body .pd .story{padding-top:32px!important}
@media(min-width:760px){html:root body .pd .hero{padding-bottom:32px!important}html:root body .pd .story{padding-top:40px!important}}
html:root body :is(.pd section,.ac-wall,.ac-guar,.hm-sec) :is(h1,h2){margin-bottom:0!important}
html:root body :is(.pd .mega-sub,.hm-sub){margin-top:12px!important}
html:root body :is(.pd section,.ac-wall,.ac-guar,.hm-sec) :is(h1,h2) + :not(.mega-sub):not(.hm-sub){margin-top:24px!important}
html:root body :is(.pd .mega-sub,.hm-sub) + *{margin-top:24px!important}
html:root body :is(.pd .story p + p,.pd .story .sp + h3,.hm-about p + p,.ac-guar p + p){margin-top:16px!important}
html:root body .pd .story .disc + p{margin-top:24px!important}
html:root body :is(.pd .fmt small,.pd .ci small,.pd .pt span,.pd .pt b,.pd .inside-q,.pd .under-buy,.pd .st p,.pd .bn p,.ac-revs b,.ac-revs small,.hm-book p,.hm-quotes blockquote,.ac-foot p,.ac-links a,.pd .faq details p){line-height:1.5!important}
html:root body :is(.pd .k,.pd .inside-k,.hm-tag,.pd .tn,.pd .fmt .tag,.pd .fmt .pr s,.pd .fmt .pr .save,.pd .sb-o b,.pd .sb-o span,.hm-quotes figcaption,.hm-fine,.ac-legal,.ac-ann,.pay>span){line-height:1.4!important}
html:root body :is(.pd .faq details p,.pd .toc3 details p){line-height:1.6!important}
html:root body .ac-logo{font-size:15px!important;letter-spacing:.18em!important}
html:root body .ac-foot .ac-logo{font-size:15px!important}
html:root body .ac-legal,html:root body .ac-legal i{font-size:12px!important;line-height:1.4!important}
html:root body .pd .fmt .tag{line-height:1.4!important}

/* guarantee: plain centred block on the sand band, no card, no seal */
html:root body .ac-guar{display:block!important;max-width:600px!important;margin:0 auto!important;background:none!important;border:0!important;box-shadow:none!important;padding:0!important;text-align:center}
html:root body .ac-guar .ac-guar-k{font:700 12px/1.4 'Inter',sans-serif!important;letter-spacing:.12em;text-transform:uppercase;color:#6b625c!important;margin:0 0 12px!important}
html:root body .ac-guar .ac-guar-k + h2{margin-top:0!important}
html:root body .ac-guar a:not(.ac-btn){color:#1f1a17;text-decoration:underline;text-underline-offset:2px}
html:root body .ac-guar .ac-sign{margin:16px 0 0!important}
html:root body .ac-guar .ac-btn{margin-top:24px}
@media(max-width:560px){html:root body .ac-guar .ac-btn{width:100%}}

/* announcement ticker: scrolls right to left, seamless loop, still for reduced motion */
html:root body .ac-tk{overflow:hidden;padding:8px 0!important;text-align:left!important}
html:root body .ac-tk-track{display:flex;width:max-content;animation:ac-tk 32s linear infinite}
html:root body .ac-tk:hover .ac-tk-track{animation-play-state:paused}
html:root body .ac-tk-g{display:flex;flex:none}
html:root body .ac-tk-i{display:inline-flex!important;align-items:center;white-space:nowrap;padding:0 28px}
html:root body .ac-tk-i::after{content:"";width:4px;height:4px;border-radius:50%;background:currentColor;opacity:.5;margin-left:56px;margin-right:-28px}
@keyframes ac-tk{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media(prefers-reduced-motion:reduce){html:root body .ac-tk-track{animation:none}html:root body .ac-tk{text-align:center!important}html:root body .ac-tk-g[aria-hidden]{display:none}html:root body .ac-tk-track{width:auto;justify-content:center}html:root body .ac-tk-g .ac-tk-i:nth-child(n+4){display:none!important}}

/* button hover: colour inverse. Wine fill wipes out to warm white, text and outline turn wine. Press-in on tap. */
html:root body :is(.pd .btn-red,.ac-btn,.hm-btn){background-image:linear-gradient(#fbf7f2,#fbf7f2)!important;background-repeat:no-repeat!important;background-position:left center!important;background-size:0% 100%!important;
  transition:background-size .35s cubic-bezier(.2,.8,.2,1),color .25s,box-shadow .25s,transform .15s!important}
html:root body :is(.pd .btn-red,.ac-btn,.hm-btn) span{display:inline-block;transition:transform .25s cubic-bezier(.2,.8,.2,1)}
html:root body :is(.pd .btn-red,.ac-btn,.hm-btn) svg{transition:stroke .25s,fill .25s}
@media(hover:hover){
  html:root body :is(.pd .btn-red,.ac-btn,.hm-btn):hover{background-color:#6e1a2b!important;background-size:100% 100%!important;color:#6e1a2b!important;box-shadow:inset 0 0 0 2px #6e1a2b!important}
  html:root body :is(.pd .btn-red,.ac-btn,.hm-btn):hover span{transform:translateX(4px);color:inherit!important}
  html:root body :is(.pd .btn-red,.ac-btn,.hm-btn):hover svg{stroke:#6e1a2b!important}
}
html:root body :is(.pd .btn-red,.ac-btn,.hm-btn):active{transform:scale(.98)!important}
/* Add to cart: simple loading state (wine cover + small spinner) while the cart opens */
html:root body .pd .btn-buy{position:relative;overflow:hidden}
html:root body .pd .btn-buy.is-loading{pointer-events:none}
html:root body .pd .btn-buy.is-loading::before{content:"";position:absolute;inset:0;z-index:2;background:#6e1a2b;border-radius:inherit}
html:root body .pd .btn-buy.is-loading::after{content:"";position:absolute;z-index:3;left:50%;top:50%;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;animation:ac-spin .7s linear infinite}
@keyframes ac-spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){
  html:root body :is(.pd .btn-red,.ac-btn,.hm-btn){transition:none!important;transform:none!important}
}
"""
