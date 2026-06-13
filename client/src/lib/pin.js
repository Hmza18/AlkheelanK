/** Strip to up to six digits (no spaces or punctuation). */
export function sanitizePin(pin) {
  return String(pin ?? "").replace(/\D/g, "").slice(0, 6);
}

export function isCompletePin(pin) {
  return sanitizePin(pin).length === 6;
}

/** "123456" → "123 456" — input display that mirrors how the host screen shows the PIN. */
export function formatPinInput(pin) {
  const digits = sanitizePin(pin);
  return digits.length > 3 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits;
}
