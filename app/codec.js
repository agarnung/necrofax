// A small Group 3-like fax codec. It is not a T.4/T.30 implementation: it is a
// transparent, testable frame format with a magic header, a 1-bit bitmap encoded
// as runs, a CRC32 and a decoder that refuses corrupt frames.
//
// Frame:
//   magic "NECROFAX" (8) | version (1) | width (2) | height (2)
//   from (2 + n) | to (2 + n) | date (2 + n) | page (2) | pages (2)
//   line count (2) | line (2 + n) each
//   run count (2) | run (2 + 1) each
//   crc32 (4) over every previous byte

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const MAGIC = encoder.encode("NECROFAX");
const VERSION = 1;

export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function encodeRuns(bitmap) {
  if (!Array.isArray(bitmap) || bitmap.length === 0) {
    throw new Error("bitmap must be a non-empty array");
  }
  const width = bitmap[0].length;
  if (!width || bitmap.some((row) => row.length !== width)) {
    throw new Error("bitmap must be rectangular");
  }
  const runs = [];
  let current = bitmap[0][0] ? 1 : 0;
  let length = 0;
  for (const row of bitmap) {
    for (const value of row) {
      const bit = value ? 1 : 0;
      if (bit === current) {
        length += 1;
      } else {
        runs.push({ length, value: current });
        current = bit;
        length = 1;
      }
    }
  }
  runs.push({ length, value: current });
  return runs;
}

export function decodeRuns(runs, width, height) {
  const total = width * height;
  const flat = new Array(total).fill(0);
  let position = 0;
  for (const run of runs) {
    if (position + run.length > total) {
      throw new Error("runs overflow the bitmap");
    }
    for (let offset = 0; offset < run.length; offset += 1) {
      flat[position + offset] = run.value ? 1 : 0;
    }
    position += run.length;
  }
  if (position !== total) {
    throw new Error("runs do not fill the bitmap");
  }
  const bitmap = [];
  for (let row = 0; row < height; row += 1) {
    bitmap.push(flat.slice(row * width, (row + 1) * width));
  }
  return bitmap;
}

function pushUint16(bytes, value) {
  if (!Number.isInteger(value) || value < 0 || value > 0xffff) {
    throw new Error(`uint16 out of range: ${value}`);
  }
  bytes.push((value >>> 8) & 0xff, value & 0xff);
}

function pushString(bytes, value) {
  const encoded = encoder.encode(String(value));
  if (encoded.length > 0xffff) throw new Error("string too long");
  pushUint16(bytes, encoded.length);
  for (const byte of encoded) bytes.push(byte);
}

function pushUint32(bytes, value) {
  bytes.push(
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  );
}

function readUint8(bytes, offset) {
  if (offset >= bytes.length) throw new Error("unexpected end of frame");
  return bytes[offset];
}

function readUint16(bytes, offset) {
  if (offset + 1 >= bytes.length) throw new Error("unexpected end of frame");
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint32(bytes, offset) {
  if (offset + 3 >= bytes.length) throw new Error("unexpected end of frame");
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  );
}

function readString(bytes, offset) {
  const length = readUint16(bytes, offset);
  const start = offset + 2;
  if (start + length > bytes.length) throw new Error("unexpected end of frame");
  return {
    value: decoder.decode(bytes.slice(start, start + length)),
    offset: start + length,
  };
}

export function encodeFax(document) {
  if (!document || !Array.isArray(document.bitmap) || !document.bitmap.length) {
    throw new Error("document.bitmap must be a non-empty array");
  }
  const height = document.bitmap.length;
  const width = document.bitmap[0].length;
  const runs = encodeRuns(document.bitmap);
  const bytes = [];
  for (const byte of MAGIC) bytes.push(byte);
  bytes.push(VERSION);
  pushUint16(bytes, width);
  pushUint16(bytes, height);
  pushString(bytes, document.from);
  pushString(bytes, document.to);
  pushString(bytes, document.date);
  pushUint16(bytes, document.page || 1);
  pushUint16(bytes, document.pages || 1);
  pushUint16(bytes, document.lines.length);
  for (const line of document.lines) pushString(bytes, line);
  pushUint16(bytes, runs.length);
  for (const run of runs) {
    pushUint16(bytes, run.length);
    bytes.push(run.value ? 1 : 0);
  }
  pushUint32(bytes, crc32(bytes));
  return Uint8Array.from(bytes);
}

export function decodeFax(input) {
  const bytes = input instanceof Uint8Array ? input : Uint8Array.from(input);
  if (bytes.length < MAGIC.length + 1) throw new Error("frame too short");
  for (let index = 0; index < MAGIC.length; index += 1) {
    if (bytes[index] !== MAGIC[index]) throw new Error("bad magic");
  }
  const version = readUint8(bytes, MAGIC.length);
  if (version !== VERSION) throw new Error(`unsupported version ${version}`);
  let offset = MAGIC.length + 1;
  const width = readUint16(bytes, offset);
  offset += 2;
  const height = readUint16(bytes, offset);
  offset += 2;
  if (!width || !height) throw new Error("empty bitmap");
  const from = readString(bytes, offset);
  offset = from.offset;
  const to = readString(bytes, offset);
  offset = to.offset;
  const date = readString(bytes, offset);
  offset = date.offset;
  const page = readUint16(bytes, offset);
  offset += 2;
  const pages = readUint16(bytes, offset);
  offset += 2;
  const lineCount = readUint16(bytes, offset);
  offset += 2;
  const lines = [];
  for (let index = 0; index < lineCount; index += 1) {
    const line = readString(bytes, offset);
    lines.push(line.value);
    offset = line.offset;
  }
  const runCount = readUint16(bytes, offset);
  offset += 2;
  const runs = [];
  for (let index = 0; index < runCount; index += 1) {
    const length = readUint16(bytes, offset);
    const value = readUint8(bytes, offset + 2);
    if (value !== 0 && value !== 1) throw new Error("bad run value");
    runs.push({ length, value });
    offset += 3;
  }
  const expected = readUint32(bytes, offset);
  offset += 4;
  if (offset !== bytes.length) throw new Error("trailing bytes");
  const actual = crc32(bytes.slice(0, offset - 4));
  if (actual !== expected) throw new Error("crc mismatch");
  return {
    from: from.value,
    to: to.value,
    date: date.value,
    page,
    pages,
    lines,
    bitmap: decodeRuns(runs, width, height),
  };
}

export function frameSize(document) {
  return encodeFax(document).length;
}
