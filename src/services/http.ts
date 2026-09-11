const baseUrl = import.meta.env.VITE_API_BASE_URL;

export const http = {
  get: async <T>(url: string): Promise<T> => {
    const response = await fetch(`${baseUrl}${url}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
};
