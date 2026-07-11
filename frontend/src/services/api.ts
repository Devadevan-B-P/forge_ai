import axios from "axios";
import type { Blueprint, BlueprintConfig } from "../types/blueprint";

const client = axios.create({ baseURL: "/api" });

export async function generateBlueprint(
  idea: string,
  config: BlueprintConfig
): Promise<Blueprint> {
  const { data } = await client.post("/blueprint/generate", { idea, config });
  return data;
}

export async function generateSql(database: unknown, dialect: string) {
  const { data } = await client.post<{ code: string; language: string }>(
    "/generate/sql",
    { database, dialect }
  );
  return data;
}

export async function generateEndpointCode(endpoint: unknown, framework: string) {
  const { data } = await client.post<{ code: string; language: string }>(
    "/generate/endpoint",
    { endpoint, framework }
  );
  return data;
}
