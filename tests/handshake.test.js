import assert from "node:assert/strict";
import test from "node:test";

import {
  SEQUENCE,
  STATES,
  describe,
  run,
  tones,
  transition,
} from "../app/handshake.js";

test("the full sequence reaches DONE", () => {
  const result = run();
  assert.equal(result.state, "DONE");
  assert.equal(result.log.length, SEQUENCE.length);
});

test("every state has a description and a tone", () => {
  for (const state of STATES) {
    assert.ok(describe(state));
    assert.ok(tones(state));
  }
});

test("an invalid event stops in ERROR", () => {
  assert.equal(transition("IDLE", "nonsense"), "ERROR");
  assert.equal(transition("DONE", "dial"), "ERROR");
  assert.equal(transition("NOPE", "dial"), "ERROR");
});

test("timeout and stop always leave the sequence", () => {
  assert.equal(transition("DCS", "timeout"), "ERROR");
  assert.equal(transition("DCS", "stop"), "IDLE");
  assert.equal(transition("DONE", "timeout"), "ERROR");
});

test("a broken sequence stops at the error", () => {
  const result = run(["dial", "answer", "ced", "dis", "wrong"]);
  assert.equal(result.state, "ERROR");
  assert.equal(result.log.at(-1).to, "ERROR");
});

test("the tones match the state", () => {
  assert.deepEqual(tones("CNG"), { frequency: 1100, duration: 500 });
  assert.deepEqual(tones("TRAIN"), { frequency: 0, duration: 600 });
  assert.deepEqual(tones("DONE"), { frequency: 0, duration: 0 });
  assert.deepEqual(tones("NOPE"), { frequency: 0, duration: 0 });
});

test("the sequence is monotonic and complete", () => {
  let state = "IDLE";
  for (const step of SEQUENCE) {
    state = transition(state, step.event);
    assert.equal(state, step.state);
  }
  assert.equal(state, "DONE");
});
