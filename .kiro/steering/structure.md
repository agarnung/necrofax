# Structure steering

## Layout

```
.
├── app/
│   ├── index.html
│   ├── style.css
│   ├── data.js
│   ├── codec.js
│   ├── handshake.js
│   ├── fax.js
│   ├── archive.js
│   └── app.js
├── tests/
│   ├── data.test.js
│   ├── codec.test.js
│   ├── handshake.test.js
│   ├── fax.test.js
│   └── archive.test.js
├── docs/
├── .kiro/
├── package.json
├── LICENSE
└── README.md
```

## Naming

- Fax ids are kebab-case: `fax-001`.
- Ghosts are singular lowercase: `lady`, `child`, `widow`, `choir`, `crow`.
- Frame constants are upper-case: `MAGIC`, `VERSION`.
- States are upper-case: `IDLE`, `DIAL`, `CNG`, `CED`, `DIS`, `DCS`,
  `TRAIN`, `MPS`, `EOP`, `DCN`, `DONE`, `ERROR`.
- Functions are verbs: `encodeFax`, `decodeFax`, `replyFax`, `sentFax`,
  `searchFaxes`, `transition`, `describe`, `tones`.

## Data flow

`data.js` → `fax.js` (document) → `codec.js` (frame) → `app.js` (paper).
`handshake.js` → `app.js` (LCD, tones). `archive.js` → `app.js` (drawer).
The data never mutates; the only state is in `app.js`.

## Tests

- Pure modules only. No DOM in tests.
- Tests import `app/*.js` and use `node --test`.
