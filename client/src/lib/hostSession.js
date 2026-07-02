import { readStorage, removeStorage, storageKey, writeStorage } from "./brand.js";

const KEY = storageKey("host");
const LEGACY_KEY = "alkheelank.host";

/** Persist host PIN + token so a refreshed host tab can restore the lobby/game. */
export function saveHostSession({ pin, hostToken }) {
  if (!pin || !hostToken) return;
  writeStorage(KEY, JSON.stringify({ pin, hostToken }), { session: true });
}

export function loadHostSession() {
  try {
    const raw = readStorage(KEY, { legacyKey: LEGACY_KEY }) ?? sessionStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s?.pin || !s?.hostToken) return null;
    return s;
  } catch {
    return null;
  }
}

export function clearHostSession() {
  removeStorage(KEY, { session: true });
  try {
    sessionStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}
