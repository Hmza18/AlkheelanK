import { sanitizePin } from "../lib/pin.js";

/**
 * Six-digit game PIN field. Keeps raw digits in the value (no spaced display) so
 * mobile browsers never block submit with "match the requested format".
 */
export default function PinInput({
  value,
  onChange,
  id,
  className = "",
  placeholder = "Game PIN",
  autoFocus = false,
}) {
  return (
    <input
      id={id}
      type="text"
      className={`alkheelank-input pin-display ${className}`.trim()}
      inputMode="numeric"
      autoComplete="one-time-code"
      placeholder={placeholder}
      maxLength={6}
      value={sanitizePin(value)}
      onChange={(e) => onChange(sanitizePin(e.target.value))}
      autoFocus={autoFocus}
    />
  );
}
