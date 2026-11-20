"""Builds instagram.csv for the "Road to $10k" dashboard: views, reach and posts per day for each account.
Usage: python3 build_instagram.py instagram.csv [days]
Needs the Instagram Graph API token for graph.facebook.com (in Claude cloud sessions the network proxy adds it;
nothing here reads or stores a token)."""
import csv, json, sys, time, urllib.request, urllib.parse, datetime as dt
from concurrent.futures import ThreadPoolExecutor

API = 'https://graph.facebook.com/v21.0/'
ACCOUNTS = {'17841461443740671': '@celestwritings'}

def get(path, **q):
    url = API + path + ('?' + urllib.parse.urlencode(q) if q else '')
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'Authorization': 'Bearer proxy-injected'}), timeout=60) as r:
                return json.load(r)
        except Exception as e:
            if attempt == 3: raise
            time.sleep(2 * (attempt + 1))

def day_metrics(ig, day):
    since = int(dt.datetime.combine(day, dt.time(), dt.timezone.utc).timestamp())
    d = get(ig + '/insights', metric='views,reach', period='day', metric_type='total_value', since=since, until=since + 86400)
    out = {m['name']: m.get('total_value', {}).get('value', 0) for m in d.get('data', [])}
    return day.isoformat(), out.get('views', 0), out.get('reach', 0)

def posts_by_day(ig, first):
    counts, url = {}, None
    d = get(ig + '/media', fields='timestamp', limit=100)
    while True:
        stop = False
        for m in d.get('data', []):
            day = m['timestamp'][:10]
            if day < first.isoformat(): stop = True; break
            counts[day] = counts.get(day, 0) + 1
        nxt = d.get('paging', {}).get('next')
        if stop or not nxt: return counts
        with urllib.request.urlopen(urllib.request.Request(nxt, headers={'Authorization': 'Bearer proxy-injected'}), timeout=60) as r:
            d = json.load(r)

def main(out, days=90):
    today = dt.datetime.now(dt.timezone.utc).date()
    first = today - dt.timedelta(days=days - 1)
    rows = []
    for ig, name in ACCOUNTS.items():
        posts = posts_by_day(ig, first)
        with ThreadPoolExecutor(6) as ex:
            res = list(ex.map(lambda i: day_metrics(ig, first + dt.timedelta(days=i)), range(days)))
        for day, views, reach in res:
            rows.append(dict(date=day, account=name, views=views, reach=reach, posts=posts.get(day, 0)))
    with open(out, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['date', 'account', 'views', 'reach', 'posts']); w.writeheader(); w.writerows(rows)
    for name in ACCOUNTS.values():
        r = [x for x in rows if x['account'] == name]
        print(name, 'views', sum(x['views'] for x in r), 'posts', sum(x['posts'] for x in r))

if __name__ == '__main__':
    main(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 90)
