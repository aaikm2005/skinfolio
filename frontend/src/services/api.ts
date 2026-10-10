const LOCAL_API_URL = 'http://localhost:8787';

export function resolveApiBaseUrl(configuredUrl: string | undefined, isDevelopment: boolean): string {
  const value = configuredUrl?.trim() || (isDevelopment ? LOCAL_API_URL : '');
  if (!value) throw new Error('Skinfolio API is not configured. Set VITE_API_URL to the backend origin in the frontend Vercel project, then rebuild.');

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('VITE_API_URL must be an absolute http(s) backend origin, for example https://your-backend.vercel.app.');
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') {
    throw new Error('VITE_API_URL must contain only the backend origin, without a path, query, or fragment.');
  }
  if (!isDevelopment && isLoopbackHost(parsed.hostname)) {
    throw new Error('VITE_API_URL points to a local machine, which website visitors cannot reach. Set it to the deployed backend origin in Vercel and rebuild the frontend.');
  }
  return parsed.origin;
}

export function getApiHostnameForDiagnostics(configuredUrl: string | undefined, isDevelopment: boolean): string | null {
  const value = configuredUrl?.trim() || (isDevelopment ? LOCAL_API_URL : '');
  if (!value) return null;
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return host === 'localhost'
    || host.endsWith('.localhost')
    || host === '::1'
    || host === '[::1]'
    || host === '0.0.0.0'
    || /^127(?:\.\d{1,3}){3}$/.test(host);
}

export function buildApiUrl(apiBaseUrl: string, path: `/api/${string}`): string {
  return `${resolveApiBaseUrl(apiBaseUrl, false)}${path}`;
}

export function buildExtractUrl(apiBaseUrl: string): string {
  return buildApiUrl(apiBaseUrl, '/api/extract');
}

export async function requestProductExtraction(
  apiBaseUrl: string,
  file: File,
  contentType: string,
  fetcher: typeof fetch = fetch,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  let response: Response;
  try {
    response = await fetcher(buildExtractUrl(apiBaseUrl), {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body: file,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The extraction request timed out after 2 minutes. Try a smaller, clearer photo.');
    }
    if (error instanceof TypeError) {
      throw new Error('The browser could not reach the API. This can be a network, CORS, TLS, or backend URL failure; check the Network tab for the request details.');
    }
    throw new Error('The extraction request failed before the API returned a response.');
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    if (!response.ok) throw new Error(`The API returned a non-JSON error (HTTP ${response.status}). Check the backend or Vercel Function logs.`);
    throw new Error(`The API returned invalid JSON (HTTP ${response.status}). Check the backend response and Function logs.`);
  }
  if (!response.ok) {
    const category = payload && typeof payload === 'object' && 'category' in payload && typeof payload.category === 'string'
      ? payload.category
      : '';
    const categoryMessage: Record<string, string> = {
      quota: 'Gemini quota or rate limit reached. Wait a moment and try again, or check the Gemini API quota.',
      timeout: 'Gemini took too long to respond. Try again in a moment.',
      provider_configuration: 'Gemini rejected the API credentials or request access. Check the backend Gemini key and model permissions.',
      temporary_api_failure: 'Gemini is temporarily unavailable. Please try again shortly.',
      empty_response: 'Gemini returned an empty response. Try a clearer photo.',
      invalid_json: 'Gemini returned a response Skinfolio could not read. Please retry or enter the product manually.',
      invalid_model_response: 'Gemini returned a response Skinfolio could not read. Please retry or enter the product manually.',
    };
    if (categoryMessage[category]) throw new Error(`${categoryMessage[category]} (HTTP ${response.status})`);
    const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : 'The backend rejected the extraction request.';
    throw new Error(`${message} (HTTP ${response.status})`);
  }
  return payload;
}
