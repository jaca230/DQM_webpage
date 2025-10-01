// src/figures/strategies/NoFetchStrategy.js
export default class NoFetchStrategy {
  constructor(figure) {
    this.figure = figure;
    this.intervalId = null;
  }

  subscribe() {
    // Already active?
    if (this.intervalId) return;

    const freq = this.figure.getUpdateFrequency();
    const intervalMs = Math.max(freq * 1000, 100);

    this.intervalId = setInterval(() => {
      if (typeof this.figure.onLocalTick === 'function') {
        this.figure.onLocalTick();
      } else if (typeof this.figure.updatePlot === 'function') {
        // fallback: re-run updatePlot with no data
        const result = this.figure.updatePlot();
        if (result?.data) {
          this.figure.setState(prev => ({
            data: result.data,
            layout: result.layout || prev.layout,
            revision: prev.revision + 1,
          }));
        }
      }
    }, intervalMs);

    // mark loading done
    this.figure.setState({ loading: false, error: null });
  }

  unsubscribe() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
