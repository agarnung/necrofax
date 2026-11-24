# NecroFax protocol

NecroFax is not a T.4/T.30 implementation. It is a small, transparent,
testable protocol inspired by the shape of a Group 3 fax: a frame, a handshake and
a printed page. This document is the reference for both.

## 1. Frame

All integers are big-endian. A frame is:

| Field | Size | Notes |
|---|---:|---|
| magic | 8 | `NECROFAX` |
| version | 1 | `1` |
| width | 2 | bitmap width in pixels |
| height | 2 | bitmap height in pixels |
| from | 2 + n | UTF-8 string |
| to | 2 + n | UTF-8 string |
| date | 2 + n | UTF-8 string |
| page | 2 | current page |
| pages | 2 | total pages |
| line count | 2 | number of body lines |
| line | 2 + n each | UTF-8 string |
| run count | 2 | number of bitmap runs |
| run | 2 + 1 each | run length + value (0/1) |
| crc32 | 4 | CRC32 over every previous byte |

The bitmap is stored row-major as runs of equal bits. `encodeRuns` and
`decodeRuns` in `app/codec.js` are pure and tested. `decodeFax` rejects:

- a bad magic;
- an unsupported version;
- an empty bitmap;
- a bad run value;
- runs that overflow or do not fill the bitmap;
- trailing bytes;
- a CRC mismatch.

## 2. Handshake

```
IDLE --dial--> DIAL --answer--> CNG --ced--> CED --dis--> DIS
DIS --dcs--> DCS --train--> TRAIN --page--> MPS --eop--> EOP
EOP --dcn--> DCN --done--> DONE
```

- `timeout` from any state goes to `ERROR`.
- `stop` from any state returns to `IDLE`.
- Any other event goes to `ERROR`.

| State | LCD | Tone |
|---|---|---|
| IDLE | NO LINE | — |
| DIAL | DIALING... | 350 Hz |
| CNG | CALLING... | 1100 Hz |
| CED | ANSWERED | 2100 Hz |
| DIS | HANDSHAKE | 1650 Hz |
| DCS | RECEIVING | 1200 Hz |
| TRAIN | TRAINING... | — |
| MPS | PAGE 1/1 | 1650 Hz |
| EOP | END OF PAGE | 2100 Hz |
| DCN | DISCONNECT | 1100 Hz |
| DONE | FAX RECEIVED | — |
| ERROR | LINE ERROR | — |

The tones are generated with Web Audio and are muted by default. The first fax
prints silently; the user can press **MUTE** to hear the line.

## 3. Thermal paper

The paper renders the decoded document:

```
NECROFAX // GROUP 3
------------------------------------
FROM: ...          TO: ...
DATE: ...          PAGE: 1/1
------------------------------------
> line 1
> line 2
...
[ghost bitmap 64×64] [ghost name]
------------------------------------
THE LINE IS STILL OPEN.   <bytes> BYTES · CRC OK
```

The footer reports the encoded frame size, which is the proof that the page on screen
went through the codec.

## 4. Limitations

- The bitmap is 1-bit and the ghost is a 16×16 pattern scaled 4×.
- The handshake is timed by the UI, not by a modem.
- There is no real phone line, no real fax number and no real recipient.
- The archive is local to the browser (`localStorage`), not shared or synced.
