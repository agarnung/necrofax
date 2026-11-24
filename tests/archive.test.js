import assert from "node:assert/strict";
import test from "node:test";

import { faxes } from "../app/data.js";
import { createArchive } from "../app/archive.js";

function fakeStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

test("an empty archive lists nothing", () => {
  const archive = createArchive(fakeStorage());
  assert.deepEqual(archive.list(), []);
  assert.equal(archive.get(faxes[0].id), null);
});

test("add, get, list and remove a fax", () => {
  const archive = createArchive(fakeStorage());
  archive.add(faxes[0]);
  archive.add(faxes[1]);
  assert.equal(archive.list().length, 2);
  assert.equal(archive.get(faxes[0].id).from, faxes[0].from);
  archive.remove(faxes[0].id);
  assert.equal(archive.list().length, 1);
  assert.equal(archive.get(faxes[0].id), null);
});

test("adding the same id replaces the fax", () => {
  const archive = createArchive(fakeStorage());
  archive.add(faxes[0]);
  archive.add({ ...faxes[0], from: "UPDATED" });
  assert.equal(archive.list().length, 1);
  assert.equal(archive.get(faxes[0].id).from, "UPDATED");
});

test("search and clear the archive", () => {
  const archive = createArchive(fakeStorage());
  archive.add(faxes[0]);
  archive.add(faxes[1]);
  assert.equal(archive.search("black hollow").length, 1);
  assert.equal(archive.search("   ").length, 2);
  archive.clear();
  assert.deepEqual(archive.list(), []);
});

test("seed only writes when the archive is empty", () => {
  const archive = createArchive(fakeStorage());
  archive.seed(faxes);
  assert.equal(archive.list().length, faxes.length);
  archive.seed([]);
  assert.equal(archive.list().length, faxes.length);
});

test("the archive survives a storage round-trip", () => {
  const storage = fakeStorage();
  const first = createArchive(storage);
  first.add(faxes[0]);
  const second = createArchive(storage);
  assert.equal(second.list().length, 1);
  assert.equal(second.get(faxes[0].id).to, faxes[0].to);
});
