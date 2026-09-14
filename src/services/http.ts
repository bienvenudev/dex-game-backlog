const baseUrl = import.meta.env.VITE_API_BASE_URL;

// Carries the HTTP status so callers can tell a 409 from a 500.
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.message === "string") return body.message;
  } catch {
    // body was empty or not JSON
  }
  return response.statusText || `HTTP ${response.status}`;
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const response = await fetch(`${baseUrl}${url}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }
  // 204 No Content has no body to parse.
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const http = {
  get: <T>(url: string) => request<T>("GET", url),
  post: <T>(url: string, body: unknown) => request<T>("POST", url, body),
  put: <T>(url: string, body: unknown) => request<T>("PUT", url, body),
  patch: <T>(url: string, body?: unknown) => request<T>("PATCH", url, body),
  delete: (url: string) => request<void>("DELETE", url),
};
