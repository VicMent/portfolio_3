import { Component, type ReactNode } from 'react';

/**
 * Contains a failure to a single window: one bad app shows a recoverable
 * message instead of taking the whole desktop down.
 */
export class WindowErrorBoundary extends Component<
  { children: ReactNode; title: string; onClose: () => void },
  { failed: boolean; message: string }
> {
  state = { failed: false, message: '' };

  static getDerivedStateFromError(error: Error) {
    return { failed: true, message: error.message };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error(`[window] ${this.props.title} crashed:`, error, info);
  }

  componentDidUpdate(prev: { children: ReactNode }) {
    if (prev.children !== this.props.children && this.state.failed) {
      this.setState({ failed: false, message: '' });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p aria-hidden="true" className="text-3xl">⚠️</p>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">This window stopped responding</h2>
        <p className="max-w-sm text-xs text-[var(--text-muted)]">{this.state.message}</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => this.setState({ failed: false, message: '' })}
            className="aero-button rounded px-4 py-1.5 text-xs"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={this.props.onClose}
            className="aero-button-primary rounded px-4 py-1.5 text-xs"
          >
            Close window
          </button>
        </div>
      </div>
    );
  }
}

/**
 * Last line of defence for the shell itself. If the desktop, taskbar or sidebar
 * ever throws, the visitor gets an explanation and a reload instead of a blank
 * page.
 */
export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean; message: string }
> {
  state = { failed: false, message: '' };

  static getDerivedStateFromError(error: Error) {
    return { failed: true, message: error.message };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('[app] shell crashed:', error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1622] p-6">
        <div className="aero-surface w-full max-w-md rounded-2xl p-8 text-center">
          <p aria-hidden="true" className="mb-3 text-4xl">🖥️</p>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">The desktop hit a problem</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Something in the shell failed to start. Reloading usually clears it.
          </p>
          {this.state.message && (
            <pre className="mt-3 overflow-x-auto rounded-lg bg-black/40 p-2 text-left text-[11px] text-[var(--text-muted)]">
              {this.state.message}
            </pre>
          )}
          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="aero-button-primary rounded-lg px-5 py-2 text-sm"
            >
              Reload
            </button>
            <a
              href="mailto:vic.menten@gmail.com"
              className="aero-button rounded-lg px-5 py-2 text-sm"
            >
              Report it
            </a>
          </div>
        </div>
      </div>
    );
  }
}
