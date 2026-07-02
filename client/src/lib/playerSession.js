import { readStorage, removeStorage, storageKey, writeStorage } from "./brand.js";

const KEY = storageKey("player");
const LEGACY_KEY = "alkheelank.player";

/** Persist player identity so refresh/tab-drop can rejoin the same game. */
export function savePlayerSession(session) {
  if (!session?.pin || !session?.pid || !session?.joinToken) return;
  writeStorage(KEY, JSON.stringify(session), { session: true });
}

export function loadPlayerSession() {
  try {
    const raw = readStorage(KEY, { legacyKey: LEGACY_KEY }) ?? sessionStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s?.pin || !s?.pid || !s?.joinToken) return null;
    return s;
  } catch {
    return null;
  }
}

export function clearPlayerSession() {
  removeStorage(KEY, { session: true });
  try {
    sessionStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}
