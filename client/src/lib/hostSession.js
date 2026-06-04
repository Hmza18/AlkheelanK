const KEY = "alkheelank.host";

/** Persist host PIN + token so a refreshed host tab can restore the lobby/game. */
export function saveHostSession({ pin, hostToken }) {
  if (!pin || !hostToken) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ pin, hostToken }));
  } catch {
    /* ignore */
  }
}

export function loadHostSession() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s?.pin || !s?.hostToken) return null;
    return s;
  } catch {
    return null;
  }
}

export function clearHostSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
