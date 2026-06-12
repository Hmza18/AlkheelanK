/** "123456" → "123 456" — input display that mirrors how the host screen shows the PIN. */
export function formatPinInput(pin) {
  return pin.length > 3 ? `${pin.slice(0, 3)} ${pin.slice(3)}` : pin;
}
