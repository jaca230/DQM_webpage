import FetchStrategy from './FetchStrategy';

/**
 * SingleSourceStrategy
 *
 * Used when a figure has exactly one backend data URL.
 * Delegates to DataFetchManager.subscribe().
 */
export default class SingleSourceStrategy extends FetchStrategy {
  constructor(fig, dataManager) {
    super(fig, dataManager);
    this.subscriptionId = null;
  }

  subscribe() {
    const url = this.fig.getDataUrl();
    const freq = this.fig.getUpdateFrequency();

    this.subscriptionId = this.dataManager.subscribe(
      url,
      freq,
      (data, error) => {
        if (error) {
          this.fig.setState({ error, loading: false });
          this.fig.onDataError(error);
        } else {
          this.fig.setState({ error: null, loading: false });
          this.fig.onDataReceived(data);
        }
      }
    );

    // Immediate cached data if available
    const cached = this.dataManager.getCachedData(url);
    if (cached && cached.data !== null) {
      this.fig.setState({ loading: false });
      this.fig.onDataReceived(cached.data);
    } else if (cached && cached.error !== null) {
      this.fig.setState({ loading: false, error: cached.error });
      this.fig.onDataError(cached.error);
    }
  }

  unsubscribe() {
    if (this.subscriptionId) {
      this.dataManager.unsubscribe(this.subscriptionId);
      this.subscriptionId = null;
    }
  }
}
