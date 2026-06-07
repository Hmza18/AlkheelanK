/** Shared layout shell for host pre-game phases (setup, connecting, lobby). */
export default function HostPregameShell({
  headerLeft,
  headerRight,
  children,
  joinSlot,
  playersSlot,
  footer,
  variant = "default",
}) {
  const isLobby = variant === "lobby";

  return (
    <div className={`alkheelank-screen-host pregame-shell ${isLobby ? "pregame-shell--lobby" : ""}`}>
      <header className="pregame-header">
        <div className="pregame-header__left">{headerLeft}</div>
        <div className="pregame-header__right">{headerRight}</div>
      </header>

      {isLobby ? (
        <>
          <div className="pregame-join-zone">{joinSlot}</div>
          <div className="pregame-players-zone">{playersSlot}</div>
        </>
      ) : (
        <main className="pregame-main">{children}</main>
      )}

      {footer ? <footer className="pregame-cta-zone">{footer}</footer> : null}
    </div>
  );
}

export function PregameHeaderLink({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="pregame-header-link">
      {children}
    </button>
  );
}

export function PregameLogoButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-brand-mid"
      aria-label="Go to homepage"
    >
      {children}
    </button>
  );
}

export function PregameStartButton({ children, disabled, onClick, helperText }) {
  return (
    <div className="pregame-cta-zone__inner">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="pregame-start-btn alkheelank-btn-primary"
      >
        {children}
      </button>
      {disabled && helperText ? (
        <p className="pregame-cta-helper">{helperText}</p>
      ) : null}
    </div>
  );
}
