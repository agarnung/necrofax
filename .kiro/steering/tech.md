# Tech steering

## Stack

- HTML, CSS and ES modules. No framework, no bundler, no CDN, no fonts.
- Node.js only for `node --test`; the app is static.
- `python3 -m http.server 8000 --directory app` (or `npm run serve`) for the demo.
- Web Audio for the line tones; `localStorage` for the archive.

## Constraints

- No network at runtime, no accounts, no telemetry.
- No third-party JavaScript, CSS, images or sounds.
- All faxes and ghosts are original fiction bundled in `app/data.js`.
- `codec.js`, `fax.js`, `handshake.js` and `archive.js` are pure and
  importable from Node; DOM code stays in `app.js`.
- The codec is a Group 3-like frame, not a T.4/T.30 implementation.

## Quality

- `npm test` must pass before a change is done.
- `node --check` on every JavaScript file.
- Every user-visible string is English.
- Accessibility is part of done: labels, live status, dialog focus, reduced motion.

## Files

- `app/data.js` — data only.
- `app/codec.js` — frame, runs, CRC32.
- `app/handshake.js` — states, events, tones.
- `app/fax.js` — document model.
- `app/archive.js` — storage adapter.
- `app/app.js` — state, DOM, audio, timers.
- `app/style.css` — presentation only.
- `tests/*.test.js` — Node test runner.
