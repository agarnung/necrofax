# NecroFax — tasks

## Spec

- [x] Write `requirements.md`.
- [x] Write `design.md`.
- [x] Keep `steering/` current before code.

## Data

- [x] Author five original faxes from the other side.
- [x] Author five 16×16 ghost patterns.
- [x] Add `data.test.js` for ids, fax validity and patterns.

## Codec

- [x] Implement CRC32.
- [x] Implement run-length bitmap encode/decode.
- [x] Implement the frame format and `encodeFax`/`decodeFax`.
- [x] Reject bad magic, CRC mismatch, trailing bytes and bad runs.
- [x] Add `codec.test.js`.

## Handshake

- [x] Implement the state machine and the invalid event guard.
- [x] Implement the timeout and stop transitions.
- [x] Add the tone table and LCD descriptions.
- [x] Add `handshake.test.js`.

## Fax and archive

- [x] Implement the document model, reply, sent fax and search.
- [x] Implement the archive with a storage adapter.
- [x] Add `fax.test.js` and `archive.test.js`.

## Interface

- [x] Build the fax machine, LCD, keypad and action buttons.
- [x] Render the thermal paper with header, body, ghost bitmap and footer.
- [x] Add the archive drawer and reply dialog.
- [x] Add the initial received fax and the demo query parameters.
- [x] Add `prefers-reduced-motion` and responsive breakpoints.

## Kiro

- [x] Add `.kiro/specs/necrofax/`.
- [x] Add `.kiro/steering/product.md`, `tech.md`, `structure.md`.
- [x] Add `.kiro/hooks/on-save-tests.kiro.hook`.
- [x] Add `.kiro/hooks/on-save-syntax.kiro.hook`.
- [x] Add `.kiro/README.md`.

## Submission

- [x] Add `README.md`, `LICENSE`, `docs/PROTOCOL.md`, `docs/VIDEO.md`,
      `docs/SLIDES.md`, `docs/slides.html`, `docs/YOUTUBE.md`,
      `docs/STORYBOARD.md`.
- [x] Render the demo video: `video-edit/necrofax-demo.mp4` (2:01, 1080p, voice and separate subtitles).
- [ ] Upload the demo video to YouTube as public.
- [x] Create the public GitHub repository: https://github.com/agarnung/necrofax.
- [ ] Push the local repository and add the `kiroween` topic.
- [ ] Submit on Devpost before 4-dic-2026, 14:00 PST.
- [x] Add `SUBMISSION.md`, `KIRO.md`, `CHECKLIST-ALEJANDRO.md` and the Pages workflow.

## Verification

- [x] `npm test` passes 34 tests.
- [x] `npm run serve` serves the app.
- [x] Manual check: receive, read, reply, send, archive, search, mute,
      keyboard and reduced motion.
