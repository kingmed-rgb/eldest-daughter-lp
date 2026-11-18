# makes the tag-free (plain) scripts and the Google Cloud TTS SSML files from the ElevenLabs scripts
import re, html, os, shutil
for lang in ('en', 'es'):
    t = open(f'{lang}-full-script.txt').read()
    plain = re.sub(r'\n*<break time="1\.5s" />\n*', '\n\n', t)
    plain = re.sub(r'<break time="1\.5s" />\s*', '', plain)
    plain = re.sub(r'\n{3,}', '\n\n', plain).strip() + '\n'
    open(f'{lang}-full-script-plain.txt', 'w').write(plain)
    shutil.rmtree(f'{lang}-ssml', ignore_errors=True); os.makedirs(f'{lang}-ssml')
    for f in sorted(os.listdir(lang)):
        body = open(f'{lang}/{f}').read()
        parts = re.split(r'(<break time="1\.5s" />)', body)
        out = ''.join(p if p.startswith('<break') else html.escape(p, quote=False) for p in parts)
        out = re.sub(r'\n\n+', '\n<break time="600ms"/>\n', out.strip())
        chunks = []; cur = ''
        for para in out.split('\n'):
            if len((cur + para).encode()) > 4500: chunks.append(cur); cur = ''
            cur += para + '\n'
        chunks.append(cur)
        for i, c in enumerate(chunks, 1):
            name = f.replace('.txt', '') + (f'-part{i}' if len(chunks) > 1 else '') + '.ssml'
            open(f'{lang}-ssml/{name}', 'w').write('<speak>\n' + c + '</speak>\n')
    print(lang, 'plain words', len(plain.split()), '| tags in plain:', plain.count('<break'), '| ssml files:', len(os.listdir(f'{lang}-ssml')))
