import SingleSourceStrategy from './SingleSourceStrategy';
import MultiSourceStrategy from './MultiSourceStrategy';

describe('figure fetch strategies', () => {
  test('single-source cached data is delivered once by the manager', () => {
    const figure = {
      getDataUrl: () => '/data',
      getUpdateFrequency: () => 1,
      setState: jest.fn(),
      onDataReceived: jest.fn(),
      onDataError: jest.fn(),
    };
    const manager = {
      subscribe: jest.fn((url, frequency, callback) => {
        callback({ sequence: 1 }, null);
        return 'subscription';
      }),
      unsubscribe: jest.fn(),
    };

    new SingleSourceStrategy(figure, manager).subscribe();

    expect(figure.onDataReceived).toHaveBeenCalledTimes(1);
  });

  test('multi-source cached data is delivered once by the manager', () => {
    const figure = {
      getUpdateFrequency: () => 1,
      setState: jest.fn(),
      onMultiDataReceived: jest.fn(),
      onMultiDataError: jest.fn(),
    };
    const manager = {
      subscribeMultiple: jest.fn((urls, frequency, callback) => {
        callback({ '/a': { sequence: 1 }, '/b': { sequence: 2 } }, null);
        return 'subscription';
      }),
      unsubscribe: jest.fn(),
    };

    new MultiSourceStrategy(figure, manager, ['/a', '/b']).subscribe();

    expect(figure.onMultiDataReceived).toHaveBeenCalledTimes(1);
  });
});
