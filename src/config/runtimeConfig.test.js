import { getGatewayBaseUrl, resolveGatewayUrl } from './runtimeConfig';

describe('runtime gateway configuration', () => {
  afterEach(() => {
    delete window.DQM_CONFIG;
  });

  test('uses a deployment-provided gateway', () => {
    window.DQM_CONFIG = { gatewayBaseUrl: 'http://daq-host:9080/' };
    expect(getGatewayBaseUrl()).toBe('http://daq-host:9080');
    expect(resolveGatewayUrl('/api/v1/catalog')).toBe('http://daq-host:9080/api/v1/catalog');
  });

  test('preserves an explicitly configured absolute URL', () => {
    window.DQM_CONFIG = { gatewayBaseUrl: 'http://daq-host:9080' };
    expect(resolveGatewayUrl('https://expert.example/api/data'))
      .toBe('https://expert.example/api/data');
  });
});
