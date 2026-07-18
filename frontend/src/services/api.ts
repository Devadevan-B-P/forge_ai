import axios from "axios";
import type { Blueprint, BlueprintConfig } from "../types/blueprint";

const TOKEN_KEY = "forge_ai_token";

const client = axios.create({ baseURL: "/api" });

// Auto-inject JWT on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiry globally
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("forge_ai_user");
      // Redirect to auth if we get a 401 from the server
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(err);
  }
);

export interface HistoryItem {
  id: string;
  idea: string;
  config: BlueprintConfig;
  created_at: string;
  name?: string | null;
  projectName?: string | null;
}

export async function generateBlueprint(
  idea: string,
  config: BlueprintConfig,
  historyId?: string | null
): Promise<{ id: string; blueprint: Blueprint }> {
  const { data } = await client.post<{ id: string; blueprint: Blueprint }>("/blueprint/generate", {
    idea,
    config,
    history_id: historyId,
  });
  return data;
}

export async function fetchHistory(): Promise<HistoryItem[]> {
  const { data } = await client.get<HistoryItem[]>("/history");
  return data;
}

export async function fetchHistoryDetail(
  id: string
): Promise<{
  _id: string;
  idea: string;
  config: BlueprintConfig;
  blueprint: Blueprint;
  created_at: string;
  cachedSql?: string | null;
  cachedApiCodes?: Record<string, string>;
}> {
  const { data } = await client.get<any>(`/history/${id}`);
  return data;
}

export async function deleteHistory(id: string): Promise<{ success: boolean }> {
  const { data } = await client.delete<{ success: boolean }>(`/history/${id}`);
  return data;
}

export async function renameHistory(id: string, name: string): Promise<{ success: boolean }> {
  const { data } = await client.patch<{ success: boolean }>(`/history/${id}/rename`, { name });
  return data;
}

export async function generateSql(database: unknown, dialect: string, historyId?: string | null) {
  const { data } = await client.post<{ code: string; language: string }>(
    "/generate/sql",
    { database, dialect, history_id: historyId }
  );
  return data;
}

export async function generateEndpointCode(
  endpoint: unknown,
  framework: string,
  historyId?: string | null,
  endpointKey?: string | null
) {
  const { data } = await client.post<{ code: string; language: string }>(
    "/generate/endpoint",
    { endpoint, framework, history_id: historyId, endpoint_key: endpointKey }
  );
  return data;
}

export async function sendContactMessage(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const { data } = await client.post<{ success: boolean; message: string }>(
    "/contact/send",
    payload
  );
  return data;
}

export function getErrorMessage(err: any, fallback = "Something went wrong. Please try again."): string {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail.map((d: any) => d.msg || JSON.stringify(d)).join(" ");
  }
  if (typeof err?.response?.data === "string") {
    return err.response.data;
  }
  return err?.message || fallback;
}
