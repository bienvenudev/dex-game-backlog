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

export const http = {
  get: async <T>(url: string): Promise<T> => {
    const response = await fetch(`${baseUrl}${url}`);
    if (!response.ok) {
      throw new ApiError(response.status, await readErrorMessage(response));
    }
    return response.json();
  },
  patch: async <T>(url: string, body?: unknown): Promise<T> => {
    const response = await fetch(`${baseUrl}${url}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new ApiError(response.status, await readErrorMessage(response));
    }
    return response.json();
  },
};
