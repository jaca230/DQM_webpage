import React from 'react';

const RECOVERY_DELAYS_MS = [100, 250, 500, 1000];

export default class FigureErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, renderAttempt: 0, recoveryAttempts: 0 };
    this.recoveryTimer = null;
    this.settleTimer = null;
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, details) {
    console.error(`Figure ${this.props.figureId} failed to render`, error, details);

    if (
      this.state.recoveryAttempts < RECOVERY_DELAYS_MS.length &&
      !this.recoveryTimer
    ) {
      const delay = RECOVERY_DELAYS_MS[this.state.recoveryAttempts];
      this.recoveryTimer = setTimeout(() => {
        this.recoveryTimer = null;
        this.retry(true);
      }, delay);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.recoveryTimer);
    clearTimeout(this.settleTimer);
  }

  retry = (automatic = false) => {
    clearTimeout(this.recoveryTimer);
    clearTimeout(this.settleTimer);
    this.recoveryTimer = null;

    this.setState((state) => ({
      error: null,
      renderAttempt: state.renderAttempt + 1,
      recoveryAttempts: automatic ? state.recoveryAttempts + 1 : 0,
    }), () => {
      this.settleTimer = setTimeout(() => {
        if (!this.state.error) this.setState({ recoveryAttempts: 0 });
      }, 2000);
    });
  }

  render() {
    if (this.state.error) {
      if (this.state.recoveryAttempts < RECOVERY_DELAYS_MS.length) {
        return (
          <div role="status" style={{ padding: 16, color: '#475569' }}>
            Recovering figure…
          </div>
        );
      }
      return (
        <div role="alert" style={{ padding: 16, color: '#9f1239' }}>
          This figure could not be displayed.
          <button type="button" onClick={() => this.retry(false)} style={{ marginLeft: 10 }}>
            Retry
          </button>
        </div>
      );
    }
    return <React.Fragment key={this.state.renderAttempt}>{this.props.children}</React.Fragment>;
  }
}
