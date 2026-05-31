import { getToken } from "./auth";

const BASE = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

export const api = {
  login: (username: string, password: string) =>
    request<{ access_token: string; refresh_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  invokeAgent: (agent: string, body: unknown) =>
    request(`/api/v1/${agent}/invoke`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  usageSummary: () =>
    request<{ by_agent: Array<{ agent_name: string; total_input: number; total_output: number }> }>(
      "/api/v1/usage/summary"
    ),
};
