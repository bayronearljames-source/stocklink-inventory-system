import { STORAGE_KEYS } from "../utils/constants";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Some responses (e.g. 204 No Content) have no JSON body — don't crash on those.
  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body, that's fine
  }

  if (!res.ok) {
    // If the token is missing/expired, the backend's requireAuth middleware
    // will 401. Clear the stale session so the app doesn't keep retrying
    // with a dead token, then let the caller's catch block handle the redirect.
    if (res.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }

    const message = data?.error || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data;
}

export const apiClient = {
  get: (endpoint) => request(endpoint, { method: "GET" }),
  post: (endpoint, body) =>
    request(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: (endpoint, body) =>
    request(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  patch: (endpoint, body) =>
    request(endpoint, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};
