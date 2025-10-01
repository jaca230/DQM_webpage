/**
 * Base FetchStrategy
 * 
 * All fetch strategies must extend this and implement
 *   subscribe(): void
 *   unsubscribe(): void
 */
export default class FetchStrategy {
  constructor(fig, dataManager) {
    this.fig = fig;
    this.dataManager = dataManager;
  }

  subscribe() {
    throw new Error(`${this.constructor.name} must implement subscribe()`);
  }

  unsubscribe() {
    throw new Error(`${this.constructor.name} must implement unsubscribe()`);
  }
}
