export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiClientError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  isFormData?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (!options.isFormData) headers["Content-Type"] = "application/json";
  if (options.token) headers["Authorization"] = `Bearer ${options.token}`;

  const res = await fetch(`${API_BASE}/api${path}`, {
    method: options.method ?? "GET",
    headers,
    credentials: "include",
    body: options.isFormData ? (options.body as FormData) : options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json() : undefined;

  if (!res.ok) {
    throw new ApiClientError(res.status, payload?.error ?? `Request failed (${res.status})`, payload?.details);
  }
  return payload as T;
}

export const api = {
  get: <T>(path: string, token?: string) => apiRequest<T>(path, { method: "GET", token }),
  post: <T>(path: string, body?: unknown, token?: string) => apiRequest<T>(path, { method: "POST", body, token }),
  postForm: <T>(path: string, body: FormData, token?: string) =>
    apiRequest<T>(path, { method: "POST", body, token, isFormData: true }),
  patch: <T>(path: string, body?: unknown, token?: string) => apiRequest<T>(path, { method: "PATCH", body, token }),
  del: <T>(path: string, token?: string) => apiRequest<T>(path, { method: "DELETE", token }),
};

/** Reads the non-httpOnly CSRF cookie the backend sets alongside the refresh-token cookie (double-submit pattern). */
function readCsrfCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|; )egymotelz_csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** /auth/refresh and /auth/logout authenticate via the httpOnly cookie, not a bearer token — they need the CSRF header instead. */
export const authApi = {
  refresh: () =>
    fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRF-Token": readCsrfCookie() ?? "" },
    }).then(async (res) => {
      const body = await res.json();
      if (!res.ok) throw new ApiClientError(res.status, body?.error ?? "Refresh failed");
      return body as { accessToken: string };
    }),
  logout: () =>
    fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRF-Token": readCsrfCookie() ?? "" },
    }),
};
