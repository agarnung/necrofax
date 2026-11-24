// A simplified T.30 handshake. It is a deterministic state machine, not a real
// modem: it models the states, the events and the tones that a Group 3 fax
// exchange would use, so the UI can show the line and the tests can prove it.

export const STATES = [
  "IDLE",
  "DIAL",
  "CNG",
  "CED",
  "DIS",
  "DCS",
  "TRAIN",
  "MPS",
  "EOP",
  "DCN",
  "DONE",
  "ERROR",
];

const TRANSITIONS = {
  IDLE: { dial: "DIAL" },
  DIAL: { answer: "CNG" },
  CNG: { ced: "CED" },
  CED: { dis: "DIS" },
  DIS: { dcs: "DCS" },
  DCS: { train: "TRAIN" },
  TRAIN: { page: "MPS" },
  MPS: { eop: "EOP" },
  EOP: { dcn: "DCN" },
  DCN: { done: "DONE" },
};

export const SEQUENCE = [
  { event: "dial", state: "DIAL", delay: 500 },
  { event: "answer", state: "CNG", delay: 500 },
  { event: "ced", state: "CED", delay: 450 },
  { event: "dis", state: "DIS", delay: 450 },
  { event: "dcs", state: "DCS", delay: 400 },
  { event: "train", state: "TRAIN", delay: 600 },
  { event: "page", state: "MPS", delay: 500 },
  { event: "eop", state: "EOP", delay: 350 },
  { event: "dcn", state: "DCN", delay: 300 },
  { event: "done", state: "DONE", delay: 300 },
];

export function transition(state, event) {
  if (event === "stop") return "IDLE";
  if (event === "timeout") return "ERROR";
  if (!STATES.includes(state)) return "ERROR";
  return TRANSITIONS[state]?.[event] || "ERROR";
}

export function run(events = SEQUENCE.map((step) => step.event)) {
  let state = "IDLE";
  const log = [];
  for (const event of events) {
    const next = transition(state, event);
    log.push({ from: state, event, to: next });
    state = next;
    if (state === "ERROR" || state === "IDLE") break;
  }
  return { state, log };
}

export function describe(state) {
  return {
    IDLE: "NO LINE",
    DIAL: "DIALING...",
    CNG: "CALLING...",
    CED: "ANSWERED",
    DIS: "HANDSHAKE",
    DCS: "RECEIVING",
    TRAIN: "TRAINING...",
    MPS: "PAGE 1/1",
    EOP: "END OF PAGE",
    DCN: "DISCONNECT",
    DONE: "FAX RECEIVED",
    ERROR: "LINE ERROR",
  }[state] || "NO LINE";
}

export function tones(state) {
  return {
    IDLE: { frequency: 0, duration: 0 },
    DIAL: { frequency: 350, duration: 120 },
    CNG: { frequency: 1100, duration: 500 },
    CED: { frequency: 2100, duration: 400 },
    DIS: { frequency: 1650, duration: 500 },
    DCS: { frequency: 1200, duration: 300 },
    TRAIN: { frequency: 0, duration: 600 },
    MPS: { frequency: 1650, duration: 250 },
    EOP: { frequency: 2100, duration: 250 },
    DCN: { frequency: 1100, duration: 300 },
    DONE: { frequency: 0, duration: 0 },
    ERROR: { frequency: 0, duration: 0 },
  }[state] || { frequency: 0, duration: 0 };
}
