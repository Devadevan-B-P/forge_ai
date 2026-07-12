import axios from "axios";

const client = axios.create({ baseURL: "/api" });

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export async function signup(email: string, password: string, name: string): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>("/auth/signup", { email, password, name });
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>("/auth/login", { email, password });
  return data;
}

export async function fetchMe(token: string): Promise<AuthUser> {
  const { data } = await client.get<AuthUser>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}
