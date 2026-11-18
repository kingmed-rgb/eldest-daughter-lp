# audiobook scripts

Ready-to-narrate scripts for the eldest daughter workbook (English) and síndrome de la hija mayor (Spanish),
made from the book files. Not part of the website (docs/ is never published).

| | English | Spanish |
|---|---|---|
| files | `en/` 18 chapters + `en-full-script.txt` | `es/` 17 chapters + `es-full-script.txt` |
| spoken words | ~10,950 | ~11,080 |
| characters (what ElevenLabs bills) | ~63,600 | ~64,600 |
| length | ~73–78 min | ~74–79 min |

## what was changed from the book
- left out: copyright page, table of contents, page numbers, "leave a review" page, QR codes and links
- added: a short spoken opening (title, subtitle, author), a note on how to use the pauses, and a closing line
- every exercise ends with a spoken pause cue (4 variations, so it doesn't sound repetitive), e.g.
  "pause the audio here, take your time with this, and press play when you're ready."
- fill-in tables (guilt sort, rage timeline, money leak detector, childhood split screen) are turned into
  spoken instructions; the guilt-sort examples are read as short examples
- repeated blank lines ("i resent ___ because ___" ×15) are read once; blanks are read as a short pause (…)
- "e.g." is written as "for example" / "por ejemplo"
- the bonus letters page now says the download link is at the end of the ebook (no QR code in audio)

## using it in ElevenLabs
1. Studio → new project → paste one chapter file per chapter (or import the full script and split by "chapter N.").
2. Model: Eleven Multilingual v2 (most natural for long-form; supports the pause tags).
3. Voice: one warm, calm female voice for English; a native Latin American Spanish voice for Spanish.
   Suggested settings to start: stability ~50%, similarity ~75%, style 0–15%, speaker boost on.
4. The `<break time="1.5s" />` tags are pauses; Multilingual v2 reads them as silence (max 3s each).
   If you use a model that doesn't support them, delete the tags; the cue sentences still work.
5. Listen to chapter 1 first, adjust the voice settings, then generate the rest. Regenerate any line that
   sounds off (budget ~30% extra characters for this).
6. Export each chapter as MP3 (44.1 kHz, 128–192 kbps) and keep the file numbers (00, 01, …) as the track order.

The text is lowercase, as in the book. That doesn't change how it's spoken.
