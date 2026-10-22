export function getApiBaseUrl(): string {
  return process.env.API_URL || "http://84.247.171.243:8000";
}

export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();

  let apiPath = path;
  if (!path.startsWith("/api/")) {
    apiPath = `/api${path.startsWith("/") ? path : `/${path}`}`;
  }

  return `${baseUrl}${apiPath}`;
}

export function getApiHeaders(request: Request): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  return headers;
}

export async function fetchFromExternalApi(
  request: Request,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = getApiHeaders(request);
  const url = buildApiUrl(endpoint);

  console.log("Fetching from external API:", url);

  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  return fetch(url, fetchOptions);
}

export function getQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const urlObj = new URL(url);
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

export function buildUrlWithParams(
  baseUrl: string,
  params: Record<string, string>
): string {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  return url.toString();
}

export function handleApiError(
  error: any,
  defaultMessage: string = "Ocorreu um erro ao processar a requisição"
): Response {
  console.error("API Error:", error);

  const errorMessage = error.message || defaultMessage;
  const status = error.status || 500;

  return new Response(JSON.stringify({ error: errorMessage }), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
