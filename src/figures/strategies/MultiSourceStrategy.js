import FetchStrategy from './FetchStrategy';

/**
 * MultiSourceStrategy
 *
 * Used when a figure has multiple backend URLs.
 * Delegates to DataFetchManager.subscribeMultiple().
 */
export default class MultiSourceStrategy extends FetchStrategy {
  constructor(fig, dataManager, urls) {
    super(fig, dataManager);
    this.urls = urls;
    this.subscriptionId = null;
  }

  subscribe() {
    const freq = this.fig.getUpdateFrequency();

    this.subscriptionId = this.dataManager.subscribeMultiple(
      this.urls,
      freq,
      (dataMap, errorMap) => {
        if (errorMap) {
          const combinedError = Object.entries(errorMap)
            .map(([url, error]) => `${url}: ${error}`)
            .join('; ');
          this.fig.setState({ error: combinedError, loading: false });
          this.fig.onMultiDataError(errorMap);
        } else {
          this.fig.setState({ error: null, loading: false });
          this.fig.onMultiDataReceived(dataMap);
        }
      }
    );
  }

  unsubscribe() {
    if (this.subscriptionId) {
      this.dataManager.unsubscribe(this.subscriptionId);
      this.subscriptionId = null;
    }
  }
}
