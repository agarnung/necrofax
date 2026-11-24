import assert from "node:assert/strict";
import test from "node:test";

import { faxes } from "../app/data.js";
import { faxDocument } from "../app/fax.js";
import {
  crc32,
  decodeFax,
  decodeRuns,
  encodeFax,
  encodeRuns,
  frameSize,
} from "../app/codec.js";

test("crc32 matches the standard check value", () => {
  const bytes = new TextEncoder().encode("123456789");
  assert.equal(crc32(bytes), 0xcbf43926);
});

test("encodeRuns and decodeRuns round-trip a bitmap", () => {
  const bitmap = [
    [0, 0, 1, 1],
    [0, 1, 1, 0],
    [1, 0, 0, 1],
  ];
  const runs = encodeRuns(bitmap);
  assert.deepEqual(decodeRuns(runs, 4, 3), bitmap);
  assert.ok(runs.length >= 3);
});

test("decodeRuns rejects a short or overflowing run list", () => {
  assert.throws(() => decodeRuns([{ length: 1, value: 1 }], 4, 1), /fill/);
  assert.throws(() => decodeRuns([{ length: 5, value: 1 }], 4, 1), /overflow/);
});

test("encodeFax and decodeFax round-trip a document", () => {
  const document = faxDocument(faxes[0]);
  const encoded = encodeFax(document);
  assert.ok(encoded.length > 64);
  assert.equal(encoded.length, frameSize(document));
  const decoded = decodeFax(encoded);
  assert.equal(decoded.from, document.from);
  assert.equal(decoded.to, document.to);
  assert.equal(decoded.date, document.date);
  assert.deepEqual(decoded.lines, document.lines);
  assert.deepEqual(decoded.bitmap, document.bitmap);
});

test("decodeFax rejects a bad magic", () => {
  const encoded = encodeFax(faxDocument(faxes[0]));
  encoded[0] = 0;
  assert.throws(() => decodeFax(encoded), /magic/);
});

test("decodeFax rejects a corrupt frame", () => {
  const encoded = encodeFax(faxDocument(faxes[0]));
  encoded[20] ^= 0xff;
  assert.throws(() => decodeFax(encoded), /crc/);
});

test("decodeFax rejects trailing bytes", () => {
  const encoded = encodeFax(faxDocument(faxes[0]));
  const longer = new Uint8Array(encoded.length + 1);
  longer.set(encoded);
  assert.throws(() => decodeFax(longer), /trailing/);
});

test("every sample fax survives the codec", () => {
  for (const fax of faxes) {
    const document = faxDocument(fax);
    const decoded = decodeFax(encodeFax(document));
    assert.deepEqual(decoded.bitmap, document.bitmap);
    assert.deepEqual(decoded.lines, document.lines);
  }
});
