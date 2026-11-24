import assert from "node:assert/strict";
import test from "node:test";

import { faxes, ghostPatterns } from "../app/data.js";
import { ghostBitmap, validateFax } from "../app/fax.js";

test("every sample fax is valid and has a unique id", () => {
  const ids = new Set(faxes.map((fax) => fax.id));
  assert.equal(ids.size, faxes.length);
  assert.ok(faxes.length >= 5);
  for (const fax of faxes) {
    assert.equal(validateFax(fax), true);
    assert.ok(fax.lines.length >= 3);
    assert.ok(ghostPatterns[fax.ghost]);
  }
});

test("every ghost pattern is a 16 by 16 rectangle", () => {
  for (const pattern of Object.values(ghostPatterns)) {
    assert.equal(pattern.length, 16);
    for (const row of pattern) {
      assert.equal(row.length, 16);
      assert.match(row, /^[.#]{16}$/);
    }
  }
});

test("ghostBitmap scales the pattern and is deterministic", () => {
  const bitmap = ghostBitmap("lady");
  assert.equal(bitmap.length, 64);
  assert.equal(bitmap[0].length, 64);
  assert.deepEqual(ghostBitmap("lady"), bitmap);
  assert.ok(bitmap.flat().some((pixel) => pixel === 1));
  assert.ok(bitmap.flat().some((pixel) => pixel === 0));
});
