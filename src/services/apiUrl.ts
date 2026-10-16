type ApiUrlOptions = {
  configuredUrl?: string;
  development: boolean;
  platform: string;
  hostUri?: string | null;
  webOrigin?: string;
};

export function resolveApiBaseUrl({ configuredUrl, development, platform, hostUri, webOrigin }: ApiUrlOptions): string {
  const explicit = configuredUrl?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  if (development) {
    const source = platform === 'web' ? webOrigin : hostUri;
    if (source) {
      try {
        const url = new URL(source.includes('://') ? source : `http://${source}`);
        // API runs beside Metro, rather than on Metro's port.
        url.protocol = 'http:';
        url.port = '3000';
        url.pathname = '/api';
        url.search = '';
        url.hash = '';
        return url.toString();
      } catch { /* Fall back when the development host is unavailable. */ }
    }
  }

  if (platform === 'web') return '/api';
  return `http://${platform === 'android' ? '10.0.2.2' : 'localhost'}:3000/api`;
}
