import type { BlueprintConfig } from "../types/blueprint";

const OPTIONS: Record<keyof BlueprintConfig, string[]> = {
  architectureStyle: ["Monolithic", "Microservices", "Serverless"],
  database: ["PostgreSQL", "MongoDB", "MySQL"],
  backend: ["FastAPI", "ExpressJS"],
  frontend: ["React", "NextJS"],
  cloudProvider: ["AWS", "Azure", "GCP"],
  projectSize: ["MVP", "Medium", "Enterprise"],
};

const LABELS: Record<keyof BlueprintConfig, string> = {
  architectureStyle: "Architecture Style",
  database: "Database",
  backend: "Backend",
  frontend: "Frontend",
  cloudProvider: "Cloud Provider",
  projectSize: "Project Size",
};

export default function ConfigPanel({
  config,
  onChange,
}: {
  config: BlueprintConfig;
  onChange: (c: BlueprintConfig) => void;
}) {
  return (
    <div className="glass rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
      {(Object.keys(OPTIONS) as (keyof BlueprintConfig)[]).map((key) => (
        <div key={key}>
          <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1.5">
            {LABELS[key]}
          </label>
          <select
            value={config[key]}
            onChange={(e) => onChange({ ...config, [key]: e.target.value })}
            className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {OPTIONS[key].map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
