import { Component } from "react";

// A render error anywhere below here used to unmount the whole tree and leave a
// blank screen — brutal mid-game (e.g. a bad payload shape on a player's phone
// right after they answered). Catch it, show a calm recovery card, and offer a
// reload: the player's session is persisted, so reloading rejoins the live game
// exactly where they were.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface it for debugging without crashing the app.
    console.error("[ErrorBoundary] caught render error:", error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleDismiss = () => {
    // Best-effort in-place recovery: clear the error and re-render. If the same
    // props throw again the boundary simply re-catches.
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-5 bg-surface px-6 text-center">
          <div className="text-5xl" aria-hidden>
            🔄
          </div>
          <div>
            <h2 className="alkheelank-heading text-2xl">Reconnecting…</h2>
            <p className="mt-2 max-w-xs text-sm text-muted">
              Something hiccuped. Your spot is saved — tap below to jump back into the game.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button type="button" onClick={this.handleReload} className="alkheelank-btn-primary px-8">
              Rejoin the game
            </button>
            <button type="button" onClick={this.handleDismiss} className="alkheelank-btn-ghost px-8 text-sm">
              Try to continue
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
