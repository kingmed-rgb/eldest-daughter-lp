"""Builds orders.csv for the "Road to $10k" dashboard from the private order report.
Usage: python3 build_orders.py report.json orders.csv
report.json = GET https://www.eldestdaughtercore.com/api/order-products?token=<BACKFILL_TOKEN> (token lives in Vercel env).
No buyer names or emails go into the CSV."""
import csv, json, sys

SOURCES = {'tiktok': 'TikTok', 'instagram': 'Instagram', 'facebook': 'Facebook', 'meta': 'Meta ad', 'google': 'Google',
           'pinterest': 'Pinterest', 'threads': 'Threads', 'youtube': 'YouTube', 'email': 'Email', 'direct': 'Direct / unknown',
           'unknown': 'Direct / unknown'}

def main(src, out):
    d = json.load(open(src))
    rows = []
    for x in sorted(d['list'], key=lambda x: x['date']):
        ps = [p.lower() for p in x['products']]
        addons = sum(1 for p in ps if 'journal' in p or ('poems' in p and 'workbook' not in p)) + sum(1 for p in ps if '+ poems' in p)
        if any('paperback' in p for p in ps): main = 'Paperback'
        elif any('audiobook' in p for p in ps): main = 'Audiobook'
        elif any('bundle' in p for p in ps): main = 'Healing bundle (old)'
        elif any('síndrome' in p for p in ps): main = 'Ebook (Spanish)'
        elif any('workbook' in p for p in ps): main = 'Ebook (English)'
        else: main = 'Other'
        s = (x.get('source') or '').lower()
        source = SOURCES.get(s, s.capitalize() if s else 'Not tracked yet')
        rows.append(dict(date=x['date'], amount=x['amount'], language='Spanish' if x['lang'] == 'es' else 'English',
                         product=main, add_ons=addons, checkout='Payment link' if x['payment_link'] else 'Site checkout',
                         source=source, campaign=x.get('campaign') or ''))
    with open(out, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
    print(len(rows), 'orders', round(sum(r['amount'] for r in rows), 2))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
