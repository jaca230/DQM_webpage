function browserLocation() {
  if (typeof window === 'undefined' || !window.location) {
    return { protocol: 'http:', hostname: '127.0.0.1' };
  }
  return window.location;
}

export function getGatewayBaseUrl() {
  const configured = typeof window !== 'undefined'
    ? window.DQM_CONFIG?.gatewayBaseUrl?.trim()
    : '';
  if (configured) return configured.replace(/\/$/, '');

  const location = browserLocation();
  return `${location.protocol}//${location.hostname}:8000`;
}

export function resolveGatewayUrl(pathOrUrl) {
  if (!pathOrUrl || pathOrUrl === 'None') return pathOrUrl;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, `${getGatewayBaseUrl()}/`).toString();
}
