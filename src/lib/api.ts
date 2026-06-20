import { mockGet, mockPost, mockPatch } from "./mock-api";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Global mock mode flag — other components can read this
let _mockMode = false;
const listeners = new Set<() => void>();

export const mockMode = {
  get active() { return _mockMode; },
  subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
};

function setMockMode() {
  if (!_mockMode) {
    _mockMode = true;
    listeners.forEach((fn) => fn());
  }
}

function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError && (e.message.includes("fetch") || e.message.includes("network") || e.message.includes("Failed"));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (_mockMode) {
    return handleMock<T>(path, init);
  }

  try {
    const res = await fetch(`${BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init?.headers },
      ...init,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw Object.assign(new Error(body.error || res.statusText), { status: res.status });
    }
    return res.json();
  } catch (e) {
    if (isNetworkError(e)) {
      setMockMode();
      return handleMock<T>(path, init);
    }
    throw e;
  }
}

function handleMock<T>(path: string, init?: RequestInit): T {
  const method = init?.method?.toUpperCase() ?? "GET";
  const body = init?.body ? JSON.parse(init.body as string) : undefined;

  if (method === "POST") return mockPost<T>(path, body);
  if (method === "PATCH") return mockPatch<T>(path, body);
  return mockGet<T>(path);
}

export const api = {
  get:   <T>(path: string) => request<T>(path),
  post:  <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};
