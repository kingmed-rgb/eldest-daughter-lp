import json, re, sys, os, unicodedata

D = sys.argv[1]; OUT = sys.argv[2]
BRK = '<break time="1.5s" />'

L = {
 'en': dict(
   pdf_pages=json.load(open(f'{D}/en-pages.json')),
   skip={2, 3, 4, 121, 122},               # copyright, contents, bonus letters, review request, letters thank-you
   title='the eldest daughter workbook',
   opening='the eldest daughter workbook. because you carried too much, too soon, and that\'s not your fault. written by anna celestina.',
   howto=('a quick note before we begin. this is a workbook, so you\'ll be invited to pause and write along the way. '
          'keep a notebook or the ebook close. whenever you hear the pause cue, stop the audio, take all the time you need, and press play when you\'re ready.'),
   closing='this was the eldest daughter workbook, by anna celestina. thank you for listening, and for choosing yourself.',
   cues=['pause the audio here, take your time with this, and press play when you\'re ready.',
         'take a moment. pause here, write what comes up, and come back when you\'re ready.',
         'pause here. there\'s no rush. press play when you\'re ready to continue.',
         'stop the audio for a moment and write your answer. come back whenever you\'re ready.'],
   blank='…', money='an amount',
   override={
     37: ('take everything from your list and sort it into four columns: the guilt item; whether it feels heavy or ridiculous; its category; and how you feel about it.\n\n'
          'here are three examples. "i snapped at my sister for interrupting me." heaviest. category: actually my fault. how i feel: i did something wrong, but forgivable.\n\n'
          '"mom was upset i didn\'t call back fast enough." heaviest. category: not my circus. how i feel: why am i taking responsibility for someone else\'s feelings?\n\n'
          '"i said no to going out because i was tired." ridiculous. category: survival tax. how i feel: would i judge a friend for this? no.\n\n'
          'the categories are: actually my fault, real mistakes i can learn from or repair. not my circus, things beyond my control, like other people\'s moods, choices and problems. '
          'and survival tax, coping behaviors i used to protect myself.'),
     38: 'now sort your own list the same way: guilt item, heavy or ridiculous, category, and how you feel about it. @CUE',
     44: ('the rage timeline.\n\nthink back over your life. draw a timeline from childhood to now, and mark the moments where you should have been angry but couldn\'t be. '
          'for each one, write your age, what happened, what you felt, and what you should have said or done. @CUE'),
     89: ('the money leak detector.\n\ntrack all the money you\'ve given to family in the past three months: the date, the amount, the reason and who it was for, and whether it was paid back. '
          'then add it up. how much of your future did you donate? @CUE'),
   }),
 'es': dict(
   pdf_pages=json.load(open(f'{D}/es-pages.json')),
   skip={2, 3, 120, 121},                  # copyright, contents, review request + qr
   title='síndrome de la hija mayor',
   opening='síndrome de la hija mayor. porque cargaste demasiado, demasiado pronto, y no fue tu culpa. escrito por anna celestina.',
   howto=('una nota antes de empezar. este es un libro de ejercicios, así que a lo largo del camino te invitaré a hacer pausas y escribir. '
          'ten a mano una libreta o el ebook. cada vez que escuches la indicación de pausa, detén el audio, tómate todo el tiempo que necesites y vuelve a darle play cuando estés lista.'),
   closing='esto fue síndrome de la hija mayor, de anna celestina. gracias por escuchar, y por elegirte.',
   cues=['pausa el audio aquí, tómate tu tiempo y vuelve a darle play cuando estés lista.',
         'tómate un momento. pausa aquí, escribe lo que surja y regresa cuando estés lista.',
         'haz una pausa aquí. no hay prisa. dale play cuando quieras continuar.',
         'detén el audio un momento y escribe tu respuesta. regresa cuando estés lista.'],
   blank='…', money='una cantidad',
   override={
     36: ('toma todo lo que escribiste y ordénalo en cuatro columnas: el motivo de culpa; si se siente pesado o ridículo; su categoría; y cómo te sientes al respecto.\n\n'
          'aquí tienes tres ejemplos. "le grité a mi hermana porque me interrumpió." más pesado. categoría: realmente fue mi culpa. cómo me siento: hice algo mal, pero se puede perdonar.\n\n'
          '"mamá se enojó porque no le devolví la llamada rápido." más pesado. categoría: no es mi circo. cómo me siento: ¿por qué estoy tomando responsabilidad por los sentimientos de otra persona?\n\n'
          '"dije que no a salir porque estaba cansada." ridículo. categoría: impuesto de supervivencia. cómo me siento: ¿juzgaría a una amiga por esto? no.\n\n'
          'las categorías son: realmente mi culpa, errores reales de los que puedo aprender o que puedo arreglar. no es mi circo, cosas fuera de mi control, como los ánimos, decisiones o problemas de otros. '
          'e impuesto de supervivencia, formas de sobrellevar que usé para protegerme.'),
     37: 'ahora ordena tu propia lista de la misma forma: motivo de culpa, pesado o ridículo, categoría, y cómo te sientes al respecto. @CUE',
     43: ('la línea del tiempo de la rabia.\n\npiensa en tu vida. dibuja una línea del tiempo desde tu infancia hasta ahora y marca los momentos en los que debiste enojarte pero no pudiste. '
          'para cada uno, escribe tu edad, qué pasó, qué sentiste y qué debiste decir o hacer. @CUE'),
     88: ('el detector de fugas de dinero.\n\nlleva la cuenta de todo el dinero que le has dado a tu familia en los últimos tres meses: la fecha, el monto, el motivo y para quién fue, y si te lo devolvieron. '
          'luego súmalo. ¿cuánto de tu futuro regalaste? @CUE'),
   }),
}

def clean_line(s, cfg):
    s = re.sub(r'[\x00-\x08\x0b-\x1f]', '', s.replace('\u00ad', ''))
    s = re.sub(r'\$_{2,}', cfg['money'], s)
    s = re.sub(r'_{2,}', cfg['blank'], s)
    s = re.sub(r'[✴✉✦★☆♡❤]', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    s = re.sub(r'\(e\.g\.,?\s*', '(for example, ', s); s = re.sub(r'\be\.g\.,?\s*', 'for example, ', s)
    s = re.sub(r'\(p\.\s?ej\.,?\s*', '(por ejemplo, ', s); s = re.sub(r'\bp\.\s?ej\.,?\s*', 'por ejemplo, ', s)
    return s

def is_toc_title(s, titles):
    k = re.sub(r'[^a-záéíóúñü ]', '', s.lower()).strip()
    return k in titles

def build(lang):
    cfg = L[lang]; P = cfg['pdf_pages']
    norm = lambda x: re.sub(r'[^a-záéíóúñü]', '', x.lower())
    toc = []
    for l in P[2].splitlines():
        m = re.match(r'\s*(.+?)\s+(\d{1,3})\s*$', l)
        if m: toc.append((m.group(1).strip(), int(m.group(2))))
    starts = {}   # pdf page -> chapter title
    for i, raw in enumerate(P, start=1):
        first = next((x.strip() for x in raw.splitlines() if x.strip()), '')
        for t, pg in toc:
            if first == str(pg) and norm(t)[:12] in norm(raw)[:200]:
                starts[i] = t
    blocks = []   # (kind, text): kind in title / para / item / cue
    cue_i = 0
    def cue():
        nonlocal cue_i
        c = cfg['cues'][cue_i % len(cfg['cues'])]; cue_i += 1
        return c
    for pno, raw in enumerate(P, start=1):
        if pno in cfg['skip']:
            continue
        if pno in cfg['override']:
            txt = cfg['override'][pno]
            for part in txt.split('\n\n'):
                if '@CUE' in part:
                    blocks.append(('para', part.replace(' @CUE', '').replace('@CUE', '').strip())); blocks.append(('cue', cue()))
                else:
                    blocks.append(('para', part.strip()))
            continue
        is_prompt = '✴' in raw
        lines = raw.splitlines()
        if pno in starts:
            want = norm(starts[pno]); got = ''; kept = []
            for k, ln in enumerate(lines):
                cl = clean_line(ln, cfg)
                if not cl or re.fullmatch(r'\d{1,3}', cl): continue
                if want.startswith(norm(got + cl)):
                    got += cl
                    if norm(got) == want:
                        lines = lines[k+1:]; break
                else:
                    break
            blocks.append(('title', starts[pno]))
        cur = []; last_item = None
        def flush():
            if cur:
                blocks.append(('para', ' '.join(cur)))
                cur.clear()
        for ln in lines:
            if not ln.strip():
                continue
            s = clean_line(ln, cfg)
            if not s or re.fullmatch(r'\d{1,3}', s):
                continue
            if s.startswith('❒'):
                flush(); item = s.lstrip('❒ ').strip()
                if item == last_item or item in ('…', ''):
                    continue
                last_item = item; blocks.append(('item', item)); continue
            # continuation of a wrapped checklist item
            if not cur and (not ln[:1].isspace() or (blocks and blocks[-1][1].endswith(','))) and blocks and blocks[-1][0] == 'item' and not re.search(r'[.?!:”"…]$', blocks[-1][1]):
                prev = blocks[-1][1]
                blocks[-1] = ('item', (prev[:-1] + s) if re.search(r'[a-záéíóúñ]-$', prev) else prev + ' ' + s)
                continue
            last_item = None
            # hyphenated line break
            if cur and cur[-1].endswith('-') and re.search(r'[a-záéíóúñ]-$', cur[-1]) and re.match(r'[a-záéíóúñ]', s):
                cur[-1] = cur[-1][:-1] + s
            else:
                cur.append(s)
            stripped = ln.rstrip()
            if re.search(r'[.?!…:”"]$', s) and len(stripped) < 72:
                flush()
        flush()
        if is_prompt:
            blocks.append(('cue', cue()))
    # merge paragraphs split across page breaks (a paragraph that doesn't end a sentence continues on the next)
    merged = []
    for kind, t in blocks:
        if kind == 'para' and merged and merged[-1][0] == 'para' and not re.search(r'[.?!…:”"]$', merged[-1][1]):
            prev = merged[-1][1]
            if prev.endswith('-') and re.match(r'[a-záéíóúñ]', t):
                merged[-1] = ('para', prev[:-1] + t)
            else:
                merged[-1] = ('para', prev + ' ' + t)
        else:
            merged.append((kind, t))
    # chapters
    chapters = [{'title': cfg['title'], 'blocks': [('para', cfg['opening']), ('para', cfg['howto'])]}]
    for kind, t in merged:
        if kind == 'title':
            chapters.append({'title': t, 'blocks': []})
        else:
            chapters[-1]['blocks'].append((kind, t))
    chapters[-1]['blocks'].append(('para', cfg['closing']))
    return chapters

def render(ch, n, lang):
    head = ('chapter' if lang == 'en' else 'capítulo') + f' {n}. ' if n else ''
    out = [head + ch['title'] + '.', BRK]
    for kind, t in ch['blocks']:
        if kind == 'para':
            for a, b in FIX.get(lang, {}).items(): t = t.replace(a, b)
            if not re.search(r'[a-z0-9áéíóúñ]', t, re.I): continue
            if t and not re.search(r'[.?!…:”"]$', t): t += '.'
            out.append(t)
        elif kind == 'item':
            out.append(t if re.search(r'[.?!…:”"]$', t) or re.search(r'\b(and|or|y|o)$', t) else t + '.')
        elif kind == 'cue':
            out.append(BRK + ' ' + t + ' ' + BRK)
    return '\n\n'.join(out)

FIX = {
  'en': {'the childhood split screen draw two columns:': 'the childhood split screen. draw two columns:',
         'their childhood my childhood How do I feel about it?': 'for each column, write how you feel about it.'},
  'es': {'escanea el código QR a continuación para dejar tu reseña:': '',
         'su infancia mi infancia ¿Cómo me siento al respecto?': 'en cada columna, escribe cómo te sientes al respecto.',
         'la infancia en pantalla dividida dibuja dos columnas:': 'la infancia en pantalla dividida. dibuja dos columnas:'},
}
summary = {}
for lang in ('en', 'es'):
    chs = build(lang)
    d = os.path.join(OUT, lang); os.makedirs(d, exist_ok=True)
    for f in os.listdir(d): os.remove(os.path.join(d, f))
    full = []; rows = []
    for n, ch in enumerate(chs):
        txt = render(ch, n, lang)
        slug = re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFKD', ch['title']).encode('ascii', 'ignore').decode().lower()).strip('-')[:50]
        name = f'{n:02d}-{slug}.txt'
        open(os.path.join(d, name), 'w').write(txt + '\n')
        spoken = re.sub(r'<break[^>]*>', '', txt)
        w = len(spoken.split()); c = len(spoken)
        rows.append((name, w, c)); full.append(txt)
    open(os.path.join(OUT, f'{lang}-full-script.txt'), 'w').write(('\n\n' + BRK + '\n\n').join(full) + '\n')
    summary[lang] = rows
json.dump(summary, open(os.path.join(OUT, 'summary.json'), 'w'), indent=1)
for lang, rows in summary.items():
    W = sum(r[1] for r in rows); C = sum(r[2] for r in rows)
    print(f'{lang}: {len(rows)} files | {W} words | {C} characters | ~{W/150:.0f}-{W/140:.0f} min')
    for r in rows: print('   ', r[0], r[1], 'words')
