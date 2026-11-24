// Pure fax document model. No DOM, no storage, no audio: the same module runs
// in the browser and under `node --test`.

import { ghostPatterns } from "./data.js";

export const PAPER_WIDTH = 64;
export const PAPER_HEIGHT = 64;
export const PIXEL_SCALE = 4;

export function buildBitmap(pattern, scale = PIXEL_SCALE) {
  if (!Array.isArray(pattern) || pattern.length === 0) {
    throw new Error("ghost pattern must be a non-empty array");
  }
  const height = pattern.length * scale;
  const width = pattern[0].length * scale;
  const bitmap = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => 0),
  );
  pattern.forEach((row, rowIndex) => {
    for (let column = 0; column < row.length; column += 1) {
      if (row[column] !== "#") continue;
      for (let dy = 0; dy < scale; dy += 1) {
        for (let dx = 0; dx < scale; dx += 1) {
          bitmap[rowIndex * scale + dy][column * scale + dx] = 1;
        }
      }
    }
  });
  return bitmap;
}

export function ghostBitmap(name) {
  const pattern = ghostPatterns[name] || ghostPatterns.lady;
  return buildBitmap(pattern);
}

export function stamp(date = new Date()) {
  const months = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  ];
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(date.getUTCDate())} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

export function validateFax(fax) {
  if (!fax || typeof fax !== "object") throw new Error("fax must be an object");
  for (const field of ["id", "from", "to", "number", "date"]) {
    if (typeof fax[field] !== "string" || !fax[field].trim()) {
      throw new Error(`fax.${field} must be a non-empty string`);
    }
  }
  if (!Array.isArray(fax.lines) || fax.lines.length === 0) {
    throw new Error("fax.lines must be a non-empty array");
  }
  if (!ghostPatterns[fax.ghost]) {
    throw new Error(`unknown ghost: ${fax.ghost}`);
  }
  return true;
}

export function faxLines(fax) {
  validateFax(fax);
  return fax.lines.map((line) => `> ${line}`);
}

export function faxDocument(fax) {
  validateFax(fax);
  return {
    from: fax.from,
    to: fax.to,
    date: fax.date,
    page: fax.page,
    pages: fax.pages,
    lines: faxLines(fax),
    bitmap: ghostBitmap(fax.ghost),
  };
}

export function replyFax(fax, message, now = new Date()) {
  const text = String(message || "").trim();
  if (!text) throw new Error("reply must not be empty");
  return {
    id: `${fax.id}-reply-${Date.now()}`,
    from: fax.to,
    to: fax.from,
    number: fax.number,
    date: stamp(now),
    page: 1,
    pages: 1,
    ghost: fax.ghost,
    lines: [
      text.toUpperCase(),
      "DO NOT REPLY AFTER MIDNIGHT.",
    ],
  };
}

export function sentFax(number, message, now = new Date()) {
  const text = String(message || "").trim();
  if (!text) throw new Error("message must not be empty");
  if (!/^\d{3}-\d{4}$/.test(number)) {
    throw new Error("number must look like 000-0000");
  }
  return {
    id: `fax-sent-${Date.now()}`,
    from: "YOU",
    to: number,
    number,
    date: stamp(now),
    page: 1,
    pages: 1,
    ghost: "lady",
    lines: [text.toUpperCase(), "NO ANSWER. THE LINE IS COLD."],
  };
}

export function searchFaxes(list, query) {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return [...list];
  return list.filter((fax) =>
    [fax.id, fax.from, fax.to, fax.number, fax.date, ...fax.lines]
      .join(" ")
      .toLowerCase()
      .includes(needle),
  );
}
