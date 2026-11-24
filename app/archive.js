// A local-first archive. In the browser it uses localStorage; in tests it uses
// any object with getItem/setItem. No network, no account, no telemetry.

import { searchFaxes } from "./fax.js";

const KEY = "necrofax.archive.v1";

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

function read(storage) {
  try {
    const raw = storage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(storage, faxes) {
  storage.setItem(KEY, JSON.stringify(faxes));
}

export function createArchive(storage = null) {
  const store = storage || memoryStorage();
  return {
    list() {
      return read(store);
    },
    get(id) {
      return read(store).find((fax) => fax.id === id) || null;
    },
    add(fax) {
      const faxes = read(store).filter((item) => item.id !== fax.id);
      const next = [fax, ...faxes];
      write(store, next);
      return fax;
    },
    remove(id) {
      const next = read(store).filter((fax) => fax.id !== id);
      write(store, next);
      return next;
    },
    clear() {
      write(store, []);
    },
    search(query) {
      return searchFaxes(read(store), query);
    },
    seed(faxes) {
      if (!read(store).length) write(store, faxes);
      return read(store);
    },
  };
}

export function localStorageArchive() {
  try {
    if (typeof localStorage !== "undefined") {
      return createArchive(localStorage);
    }
  } catch {
    // fall through to memory
  }
  return createArchive();
}
