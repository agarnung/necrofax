import { faxes, sampleReply } from "./data.js";
import {
  faxDocument,
  replyFax,
  searchFaxes,
  sentFax,
  stamp,
} from "./fax.js";
import { decodeFax, encodeFax } from "./codec.js";
import { SEQUENCE, describe, tones, transition } from "./handshake.js";
import { localStorageArchive } from "./archive.js";

const $ = (selector) => document.querySelector(selector);

const state = {
  faxes: [],
  current: null,
  dial: "",
  muted: true,
  timers: [],
  audio: null,
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setStatus(text) {
  $("#status").textContent = text;
}

function setLCD(line, sub = "") {
  $("#lcd-line").textContent = line;
  if (sub) $("#lcd-sub").textContent = sub;
}

function setLine(text) {
  const led = $("#line-led");
  led.textContent = text;
  led.classList.toggle("live", text !== "NO LINE");
}

function setWave(active) {
  $(".lcd-wave").classList.toggle("active", active);
}

function setLED(on) {
  $("#led").classList.toggle("on", on);
}

function clearTimers() {
  for (const timer of state.timers) clearTimeout(timer);
  state.timers = [];
}

function formatDial() {
  const digits = state.dial.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}`;
}

function updateDial() {
  const text = formatDial();
  if (text) {
    setLCD(`DIAL ${text}`, "PRESS SEND");
    setStatus("DIALING");
  } else {
    setLCD("NO LINE", stamp(new Date()));
    setStatus("READY");
  }
}

function ensureAudio() {
  try {
    if (!state.audio) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return null;
      state.audio = new Context();
    }
    if (state.audio.state === "suspended") state.audio.resume();
    return state.audio;
  } catch {
    return null;
  }
}

function playTone(tone) {
  if (state.muted || !tone || !tone.frequency) return;
  const context = ensureAudio();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  oscillator.type = "sine";
  oscillator.frequency.value = tone.frequency;
  gain.gain.setValueAtTime(0.035, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.duration / 1000);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + tone.duration / 1000);
}

function drawGhost(bitmap) {
  const canvas = $("#ghost");
  if (!canvas) return;
  const scale = 3;
  canvas.width = bitmap[0].length * scale;
  canvas.height = bitmap.length * scale;
  const context = canvas.getContext("2d");
  context.fillStyle = "#f6f0dc";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#1b1a16";
  for (let row = 0; row < bitmap.length; row += 1) {
    for (let column = 0; column < bitmap[row].length; column += 1) {
      if (!bitmap[row][column]) continue;
      context.beginPath();
      context.arc(
        column * scale + scale / 2,
        row * scale + scale / 2,
        1.15,
        0,
        Math.PI * 2
      );
      context.fill();
    }
  }
}

function renderPaper(fax) {
  const document = faxDocument(fax);
  const encoded = encodeFax(document);
  const decoded = decodeFax(encoded);
  const paper = $("#paper");
  $("#paper-inner").innerHTML = `
    <div class="fax-head"><b>NECROFAX</b><span>GROUP 3</span></div>
    <div class="fax-meta">
      <div><span>FROM</span> ${escapeHtml(decoded.from)}</div>
      <div><span>TO</span> ${escapeHtml(decoded.to)}</div>
      <div><span>DATE</span> ${escapeHtml(decoded.date)}</div>
      <div><span>PAGE</span> ${decoded.page}/${decoded.pages}</div>
    </div>
    <div class="fax-body">
      <div class="fax-lines">${decoded.lines
        .map((line) => `<span class="line">${escapeHtml(line)}</span>`)
        .join("")}</div>
      <div class="ghost-wrap">
        <canvas id="ghost" aria-label="Ghost image"></canvas>
        <span class="ghost-label">${escapeHtml(fax.ghost).toUpperCase()}</span>
      </div>
    </div>
    <div class="fax-foot">
      <span>THE LINE IS STILL OPEN.</span>
      <span>${encoded.length} BYTES · CRC OK</span>
    </div>
  `;
  drawGhost(decoded.bitmap);
  paper.classList.remove("printing");
  void paper.offsetWidth;
  paper.classList.add("printing");
  $("#counter").textContent = `${decoded.page}/${decoded.pages}`;
  state.current = fax;
  state.faxes = [...state.faxes.filter((item) => item.id !== fax.id), fax];
  archive.add(fax);
  renderArchive();
}

function printFax(fax) {
  setStatus("PRINTING");
  renderPaper(fax);
  const timer = setTimeout(() => setStatus("READY"), 900);
  state.timers.push(timer);
}

function runHandshake(fax) {
  clearTimers();
  let currentState = "IDLE";
  setLED(true);
  setLine("CALLING...");
  setStatus("DIALLING");

  const step = (index) => {
    if (index >= SEQUENCE.length) {
      setWave(false);
      setLED(false);
      setLCD("FAX RECEIVED", stamp(new Date()));
      setLine("LINE OPEN");
      setStatus("RECEIVED");
      printFax(fax);
      return;
    }
    const { event, state: expected, delay } = SEQUENCE[index];
    const next = transition(currentState, event);
    if (next !== expected) {
      setWave(false);
      setLED(false);
      setLCD("LINE ERROR", "HANG UP AND TRY AGAIN");
      setLine("NO LINE");
      setStatus("ERROR");
      return;
    }
    currentState = next;
    setLCD(describe(next), `PAGE ${fax.page}/${fax.pages}`);
    setWave(true);
    playTone(tones(next));
    const timer = setTimeout(() => step(index + 1), delay);
    state.timers.push(timer);
  };

  const timer = setTimeout(() => step(0), 350);
  state.timers.push(timer);
}

function stopHandshake() {
  clearTimers();
  setWave(false);
  setLED(false);
  setLCD("STOPPED", stamp(new Date()));
  setLine("NO LINE");
  setStatus("STOPPED");
}

function receiveFax(fax) {
  runHandshake(fax);
}

function sendFax() {
  const number = formatDial() || "000-0000";
  if (!/^\d{3}-\d{4}$/.test(number)) {
    setLCD("BAD NUMBER", "USE 000-0000");
    return;
  }
  const fax = sentFax(number, "PLEASE PICK UP.", new Date());
  state.dial = "";
  updateDial();
  runHandshake(fax);
}

function openReply() {
  if (!state.current) {
    setLCD("NO FAX", "NOTHING TO REPLY TO");
    return;
  }
  const dialog = $("#reply-dialog");
  $("#reply-text").value = "";
  dialog.showModal();
  $("#reply-text").focus();
}

function submitReply() {
  const text = $("#reply-text").value.trim();
  if (!text || !state.current) return;
  const fax = replyFax(state.current, text);
  $("#reply-dialog").close();
  runHandshake(fax);
}

function renderArchive() {
  const query = $("#archive-search").value;
  const list = query
    ? searchFaxes(archive.list(), query)
    : archive.list();
  const box = $("#archive-list");
  if (!list.length) {
    box.innerHTML = `<p class="muted">No faxes.</p>`;
    return;
  }
  box.innerHTML = list
    .map(
      (fax) =>
        `<button class="archive-item" data-id="${escapeHtml(fax.id)}">
          <b>${escapeHtml(fax.from)}</b>
          <span>${escapeHtml(fax.date)} · ${escapeHtml(fax.number)}</span>
        </button>`
    )
    .join("");
  box.querySelectorAll(".archive-item").forEach((button) => {
    button.addEventListener("click", () => {
      const fax = archive.get(button.dataset.id);
      if (fax) printFax(fax);
    });
  });
}

function toggleArchive() {
  $("#archive-drawer").classList.toggle("hidden");
  renderArchive();
}

function reprint(id) {
  const fax = archive.get(id);
  if (fax) printFax(fax);
}

function toggleMute() {
  state.muted = !state.muted;
  const button = $("#mute");
  button.classList.toggle("active", !state.muted);
  button.textContent = state.muted ? "MUTE" : "SOUND";
  setStatus(state.muted ? "MUTED" : "SOUND ON");
  if (!state.muted) {
    playTone({ frequency: 1650, duration: 180 });
  }
}

function pressKey(key) {
  if (state.dial.replace(/\D/g, "").length >= 7) return;
  state.dial += key;
  updateDial();
}

const archive = localStorageArchive();

$("#keypad").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button) pressKey(button.dataset.key);
});

$("#send").addEventListener("click", sendFax);
$("#reply").addEventListener("click", openReply);
$("#archive").addEventListener("click", toggleArchive);
$("#stop").addEventListener("click", stopHandshake);
$("#mute").addEventListener("click", toggleMute);

$("#cancel-reply").addEventListener("click", () => {
  $("#reply-dialog").close();
});

$("#reply-form").addEventListener("submit", (event) => {
  event.preventDefault();
  submitReply();
});

$("#close-archive").addEventListener("click", toggleArchive);

$("#archive-search").addEventListener("input", renderArchive);

function boot() {
  state.faxes = archive.seed(faxes);
  state.current = null;
  $("#paper-inner").innerHTML = `<p class="paper-empty">AWAITING TRANSMISSION</p>`;
  setLCD("NO LINE", stamp(new Date()));
  setLine("NO LINE");
  setStatus("READY");
  renderArchive();
  const timer = setTimeout(() => receiveFax(state.faxes[0]), 900);
  state.timers.push(timer);
  const params = new URLSearchParams(window.location.search);
  const demo = params.get("demo");
  if (!demo) return;
  setTimeout(() => {
    if (demo === "archive") toggleArchive();
    if (demo === "reply") openReply();
    if (demo === "sent") {
      state.dial = "0131313";
      sendFax();
    }
  }, 6800);
}

boot();
