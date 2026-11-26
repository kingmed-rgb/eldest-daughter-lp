"""Builds the new sales page (served at /workbook) from the Shopify product page design.

Sources (copied from eldest-daughter-shopify/):
  product.src.html  page body, CSS and JS (v4 product page)
  brand.py          announcement bar, header, footer, reviews, guarantee
The Shopify parts are swapped for this site's own: static product data, this site's tracking,
and the Stripe embedded checkout (api/create-checkout-session.js) instead of the Shopify cart.

Edit the sources here, then run from the repo root:  python3 docs/lp-v2/build.py
Output: workbook/index.html (images in images/v2/, fonts in fonts/).
Images under /images are cached for a year: give a changed image a new file name."""
import json, pathlib, re, sys

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE))
import brand

EMAIL = "eldestdaughterbook@gmail.com"
A = lambda name: f"/images/v2/{name}"  # absolute: works at /workbook and /workbook/

src = brand.apply((HERE / "product.src.html").read_text(), cart_drawer=True).replace("@@GUAR_CTA@@", "#top")


def sub(old, new, count=1):
    """Replace exactly `count` occurrences, so a changed source fails loudly instead of silently."""
    global src
    n = src.count(old)
    assert n == count, f"expected {count}x, found {n}x: {old[:70]!r}"
    src = src.replace(old, new)


# ---------- product data (prices match api/_lib/catalog.js) ----------
# variant ids are the checkout's format names; bump ids are the checkout's add-on names
DATA = {"root": "", "preview": False, "product": {"title": "The Eldest Daughter Workbook", "variants": [
    {"id": "digital", "name": "Ebook", "price": "$9.99", "cents": 999, "compare": 2999, "compare_price": "$29.99", "available": True},
    {"id": "audio", "name": "Audiobook", "price": "$19.99", "cents": 1999, "compare": 5999, "compare_price": "$59.99", "available": True},
    {"id": "print", "name": "Paperback", "price": "$29.99", "cents": 2999, "compare": 8999, "compare_price": "$89.99", "available": True}]},
    "bumps": [
    {"id": "poems", "title": "Dear Angry Eldest Daughter", "kind": "Poetry", "price": "$7", "cents": 700, "available": True,
     "image": "/images/bump-poems-en.webp", "pitch": "A 56-page poetry ebook for the anger you were never allowed to show."},
    {"id": "journal", "title": "The Eldest Daughter Journal", "kind": "Journal", "price": "$7", "cents": 700, "available": True,
     "image": "/images/bump-journal-en.webp", "pitch": "A 49-page guided journal for what you carried and what you put down."}]}
IMGS = {"ebook": A("ed-offer-workbook-tablet.webp"), "audio": A("ed-offer-audiobook-combo.webp"),
        "paperback": A("ed-offer-paperback.webp"), "phone": A("ed3-audio-phone.webp")}

src = re.sub(r"@@ASSET:([\w.-]+)@@", lambda m: A(m.group(1)), src)
sub("@@IMGS@@", json.dumps(IMGS))
sub("@@DATA@@", f'<script type="application/json" id="pd-data">{json.dumps(DATA)}</script>')
sub("@@FONTFACE@@",
    "@font-face{font-family:'Space Grotesk';font-weight:500 700;font-display:swap;src:url('/fonts/grotesk.woff2') format('woff2')}\n"
    "@font-face{font-family:'Inter';font-weight:400 800;font-display:swap;src:url('/fonts/inter.woff2') format('woff2')}")
src = src.replace("@@EMAIL@@", EMAIL).replace("@@PAYMENTS@@", "").replace("@@YEAR@@", "2026")
sub("@@FOOTER_LINKS@@", '<a href="/privacy-policy">Privacy policy</a><a href="/terms-of-service">Terms of service</a>')

# ---------- header + footer: one page, so the links jump within it ----------
sub('<a href="@@HOME@@">Home</a><a href="@@PRODUCT@@">The Workbook</a>',
    '<a href="#inside">What’s inside</a><a href="#reviews">Reviews</a><a href="#faq">FAQ</a>')
sub('<a href="@@HOME@@products/dear-angry-eldest-daughter">Dear Angry Eldest Daughter</a>', "")
sub('<a href="@@HOME@@products/the-eldest-daughter-journal">The Eldest Daughter Journal</a>', "")
src = src.replace("@@HOME@@", "#top").replace("@@PRODUCT@@", "#top")
sub('<section class="ac-wall">', '<section class="ac-wall" id="reviews">')
sub('<section class="sec">\n  <div class="wrap narrow">\n    <h2 class="mega small">Got <em>questions?</em>',
    '<section class="sec" id="faq">\n  <div class="wrap narrow">\n    <h2 class="mega small">Got <em>questions?</em>')
sub("<p>Yes. Put their email at checkout or forward them the download. A sister, a friend, your mom.</p>",
    "<p>Yes. Put their email at checkout or forward them the download. A sister, a friend, your mom. "
    "For the paperback, use their address as the shipping address.</p>")
sub("If you choose the paperback, you get both digital editions straight away while it’s printed and shipped.",
    "If you choose the paperback, you get both digital editions straight away while it’s printed and shipped "
    "(free shipping to the US, UK, Canada and Australia).")

# ---------- cart: one copy of each item (the checkout sells quantity 1) ----------
src, n = re.subn(r"<div class=\"qty\">.*?</div>", "", src)
assert n == 1, n
sub("cart.splice(+b.dataset.rm,1); renderCart()",
    "var it=cart[+b.dataset.rm]; if(it&&it.main) cart=[]; else cart.splice(+b.dataset.rm,1); renderCart()")  # add-ons need the workbook
sub("renderCart();\n    buy.classList.add('is-loading');",
    "renderCart(); track('add_to_cart_'+current.id, {value:current.cents/100, items:[{item_id:current.id}]});\n    buy.classList.add('is-loading');")
sub("cart.push({id:b.id,title:b.title,fmt:'',sub:'Instant access · PDF'",
    "track('cart_addon_'+b.id); cart.push({id:b.id,title:b.title,fmt:'',sub:'Instant access · PDF'")

# ---------- checkout: this site's Stripe pop-up instead of /cart/<ids> ----------
old = re.search(r"    var line=cart\.map.*?location\.href=String\(D\.root.*?\n", src, re.S)
assert old, "checkout handler not found"
src = src.replace(old.group(0),
    "    var main=cart.filter(function(it){ return it.main })[0]; if(!main) return;\n"
    "    var has=function(id){ return cart.some(function(it){ return it.id===id }) };\n"
    "    closeCart(); window.EDS_CHECKOUT({format:main.id, poems:has('poems'), journal:has('journal'), total:cartTotal()/100});\n")
sub("  function closeCart(){",
    "  function track(ev,ga){ try{ window.clarity&&clarity('event',ev) }catch(e){} try{ ga&&window.gtag&&gtag('event','add_to_cart',Object.assign({currency:'USD'},ga)) }catch(e){} }\n"
    "  function closeCart(){")

# ---------- page shell ----------
index = (ROOT / "index.html").read_text()
tracking = re.search(r"<script>\n!function\(f,b,e,v.*?\"x7irk4dqm3\"\);\n</script>", index, re.S).group(0)
source = re.search(r"<script>\n/\* where this visitor came from.*?</script>", index, re.S).group(0)
checkout = (HERE / "checkout.html").read_text()
assert "Stripe" in checkout

page = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Eldest Daughter Workbook · Anna Celestina</title>
<meta name="description" content="For the daughter who grew up too fast. Exercises, scripts and prompts to quiet the guilt, stop over-giving, and finally rest without having to earn it. Ebook, audiobook or paperback.">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/favicon.png">
{tracking}
<link rel="preload" as="font" type="font/woff2" href="/fonts/inter.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/fonts/grotesk.woff2" crossorigin>
<link rel="preload" as="image" href="{IMGS['ebook']}">
{source}
<style>html,body{{margin:0;background:#fbf7f2}}html{{scroll-behavior:smooth}}</style>
</head>
<body>
<!-- built by docs/lp-v2/build.py: edit the sources there, not this file -->
{src}
{checkout}
<script>window.va=window.va||function(){{(window.vaq=window.vaq||[]).push(arguments)}};</script>
<script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
"""
left = re.findall(r"@@\w+", page)
assert not left, left
out = ROOT / "workbook" / "index.html"
out.parent.mkdir(exist_ok=True)
out.write_text(page)
print(f"built {out.relative_to(ROOT)} ({len(page)//1024} KB)")
