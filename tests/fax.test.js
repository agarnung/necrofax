import assert from "node:assert/strict";
import test from "node:test";

import { faxes } from "../app/data.js";
import {
  buildBitmap,
  faxDocument,
  faxLines,
  replyFax,
  searchFaxes,
  sentFax,
  stamp,
  validateFax,
} from "../app/fax.js";

test("buildBitmap rejects an empty pattern", () => {
  assert.throws(() => buildBitmap([]), /non-empty/);
});

test("buildBitmap scales a single pixel", () => {
  const bitmap = buildBitmap(["#."], 2);
  assert.deepEqual(bitmap, [
    [1, 1, 0, 0],
    [1, 1, 0, 0],
  ]);
});

test("faxLines prefix the body and keep the order", () => {
  const lines = faxLines(faxes[0]);
  assert.deepEqual(lines, faxes[0].lines.map((line) => `> ${line}`));
});

test("faxDocument carries the bitmap and lines", () => {
  const document = faxDocument(faxes[0]);
  assert.equal(document.from, faxes[0].from);
  assert.equal(document.to, faxes[0].to);
  assert.equal(document.bitmap.length, 64);
  assert.equal(document.lines.length, faxes[0].lines.length);
});

test("replyFax swaps the sender and the receiver", () => {
  const reply = replyFax(faxes[0], "I received your fax.", new Date("2026-10-31T23:59:00Z"));
  assert.equal(reply.from, faxes[0].to);
  assert.equal(reply.to, faxes[0].from);
  assert.equal(reply.number, faxes[0].number);
  assert.equal(reply.lines[0], "I RECEIVED YOUR FAX.");
  assert.match(reply.date, /31 OCT 2026 23:59/);
});

test("replyFax rejects an empty reply", () => {
  assert.throws(() => replyFax(faxes[0], "  "), /empty/);
});

test("sentFax validates the number and upper-cases the message", () => {
  const fax = sentFax("013-1313", "please pick up", new Date("2026-10-31T23:59:00Z"));
  assert.equal(fax.number, "013-1313");
  assert.equal(fax.lines[0], "PLEASE PICK UP");
  assert.throws(() => sentFax("13", "hello"), /000-0000/);
  assert.throws(() => sentFax("013-1313", " "), /empty/);
});

test("validateFax rejects a bad fax", () => {
  assert.throws(() => validateFax(null), /object/);
  assert.throws(() => validateFax({ ...faxes[0], from: "" }), /from/);
  assert.throws(() => validateFax({ ...faxes[0], lines: [] }), /lines/);
  assert.throws(() => validateFax({ ...faxes[0], ghost: "nope" }), /ghost/);
});

test("searchFaxes matches a sender, a line or a number", () => {
  assert.equal(searchFaxes(faxes, "other side").length, 1);
  assert.equal(searchFaxes(faxes, "well").length, 1);
  assert.equal(searchFaxes(faxes, "013-1313").length, 1);
  assert.equal(searchFaxes(faxes, "   ").length, faxes.length);
  assert.equal(searchFaxes(faxes, "zzzz").length, 0);
});

test("stamp formats a UTC date", () => {
  assert.equal(stamp(new Date("2026-10-31T23:59:00Z")), "31 OCT 2026 23:59");
});
