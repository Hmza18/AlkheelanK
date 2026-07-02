/** Kheelan product identity — single source for display name and storage keys. */

export const BRAND = {
  name: "Kheelan",
  tagline: "Turn any room into a game show.",
  description: "Host on the big screen. Everyone plays from their phone. No app.",
  domain: "alkheelan.xyz",
  storagePrefix: "kheelan",
};

const LEGACY_PREFIX = "alkheelank";

/** Session/local key with one-time fallback from pre-rebrand keys. */
export function storageKey(suffix) {
  return `${BRAND.storagePrefix}.${suffix}`;
}

export function readStorage(key, { legacyKey } = {}) {
  try {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key);
    if (raw != null) return raw;
    if (legacyKey) {
      return localStorage.getItem(legacyKey) ?? sessionStorage.getItem(legacyKey);
    }
    return null;
  } catch {
    return null;
  }
}

export function writeStorage(key, value, { session = false } = {}) {
  try {
    const store = session ? sessionStorage : localStorage;
    store.setItem(key, value);
  } catch {
    /* private mode */
  }
}

export function removeStorage(key, { session = false } = {}) {
  try {
    const store = session ? sessionStorage : localStorage;
    store.removeItem(key);
  } catch {
    /* ignore */
  }
}

export { LEGACY_PREFIX };
