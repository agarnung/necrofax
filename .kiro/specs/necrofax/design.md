# NecroFax — design

## Architecture

```
app/
  index.html   the machine and the paper
  style.css    beige plastic, green LCD, thermal paper, responsive
  data.js      five original faxes and five 16x16 ghost patterns
  fax.js       document model, ghost bitmap, reply/sent, search
  codec.js     frame format, run-length bitmap, CRC32, encode/decode
  handshake.js T.30-like state machine, tones, sequence
  archive.js   local-first archive with a storage adapter
  app.js       state, LCD, paper, archive, handshake, audio
tests/
  data.test.js, fax.test.js, codec.test.js, handshake.test.js, archive.test.js
```

No framework, no build step, no dependency. `fax.js`, `codec.js`, `handshake.js`
and `archive.js` have no DOM access, so the same modules run in the browser and
under `node --test`.

## Frame format

```
magic "NECROFAX" (8)
version (1)
width (2) | height (2)
from (2 + n) | to (2 + n) | date (2 + n)
page (2) | pages (2)
line count (2) | line (2 + n) each
run count (2) | run (2 + 1) each
crc32 (4) over every previous byte
```

The bitmap is a 1-bit matrix encoded as runs. `encodeFax` and `decodeFax`
round-trip it, `crc32` rejects corruption and the magic rejects another format.
This is deliberately a Group 3-like frame, not a T.4 implementation.

## Handshake

`IDLE → DIAL → CNG → CED → DIS → DCS → TRAIN → MPS → EOP → DCN → DONE`.
`timeout` goes to `ERROR`; `stop` returns to `IDLE`; an invalid event goes to
`ERROR`. Each state has an LCD description and a tone (1100 Hz CNG, 2100 Hz CED,
1650 Hz DIS, 1200 Hz DCS, and so on). The UI advances the sequence with timers
and plays the tone through Web Audio when the line is not muted.

## Document model

`fax.js` turns a fax into `{from, to, date, page, pages, lines, bitmap}`. The ghost
is a 16×16 pattern scaled 4× into a 64×64 bitmap. The paper prints the header,
the meta block, the body lines, the bitmap and the footer.

## UI

Three columns on desktop: the machine (LCD, keypad, SEND/REPLY/ARCHIVE/STOP/MUTE,
speaker), the thermal paper (torn top, ruled paper, dot-matrix ghost), and the
archive drawer. The paper feeds with a short CSS animation; `prefers-reduced-motion`
stops it.

## Accessibility

Every button is native and labelled. The line status is `aria-live="polite"`. The
reply dialog uses `<dialog>` and focuses the textarea. The paper has an accessible
canvas label. Colour is not the only signal: the LCD text, the line text and the
button labels carry the state.

## Local-first

`archive.js` uses `localStorage` when available and an in-memory adapter otherwise.
The app never fetches anything; the faxes are original fiction bundled in `data.js`.

## Tests

34 tests: data integrity, ghost bitmaps, fax lines, reply/sent/search, CRC32,
frame round-trip, corrupt frame, trailing bytes, handshake sequence, invalid event,
timeout/stop, tones, archive add/get/list/search/clear/seed and storage round-trip.
