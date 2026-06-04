const KEY = "alkheelank.player";

/** Persist player identity so refresh/tab-drop can rejoin the same game. */
export function savePlayerSession(session) {
  if (!session?.pin || !session?.pid) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* quota / private mode */
  }
}

export function loadPlayerSession() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s?.pin || !s?.pid) return null;
    return s;
  } catch {
    return null;
  }
}

export function clearPlayerSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
