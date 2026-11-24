# NecroFax — requirements

## One-line pitch

A fax machine for the other side: a dead technology revived in the browser, with a
real frame codec, a simplified T.30 handshake and a thermal-paper fax that prints
from a queue of original ghost stories.

## Category

**Resurrection** — the fax machine is the dead technology. The app does not wrap a
modern UI in a fax skin: it implements a frame format, a handshake state machine
and a thermal-paper render, and it runs locally.

## User stories

1. **Receive.** As a visitor, I want a fax to arrive and print on thermal paper,
   so I understand the product in the first ten seconds.
2. **Read.** As a visitor, I want to read the fax and see the ghost image, so the
   fax feels like a physical object.
3. **Reply.** As a visitor, I want to reply to the fax, so the exchange is a
   conversation with the other side.
4. **Send.** As a visitor, I want to dial a number and send a fax, so I can use the
   machine rather than only watch it.
5. **Archive.** As a visitor, I want an archive of every fax, so I can reprint one.
6. **Search.** As a visitor, I want to search the archive by sender, number or text.
7. **Sound.** As a visitor, I want to hear the line, so the handshake feels real.
8. **Keyboard.** As a keyboard user, I want every control reachable and labelled.
9. **Reduced motion.** As a visitor who prefers reduced motion, I want the paper
   feed, LED and wave animations to stop.

## Acceptance criteria

- On load, after a short delay, a fax prints: header, meta, body lines, ghost
  bitmap, footer with byte count and `CRC OK`.
- The frame survives `encodeFax` / `decodeFax` byte-for-byte; a corrupt frame is
  rejected by CRC; a bad magic is rejected.
- The handshake reaches `DONE` in the documented order and `ERROR` on an invalid
  event or timeout; `STOP` returns to `IDLE`.
- `REPLY` opens a dialog and the reply swaps sender and receiver.
- `SEND` validates `000-0000` and prints a sent fax.
- `ARCHIVE` lists the faxes, searches them and reprints one.
- `MUTE` toggles the line tone; the first fax is silent.
- `npm test` passes 34 tests.
- No network, no accounts, no third-party assets, no real data.

## Non-goals

- No real telephone line, no real fax transmission, no T.4/T.30 compliance.
- No LLM generation at runtime.
- No server and no multi-user archive.
