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
    <div className="glass rounded-2xl p-5 flex flex-col gap-5 border border-white/10">
      {(Object.keys(OPTIONS) as (keyof BlueprintConfig)[]).map((key) => (
        <div key={key} className="flex flex-col gap-2">
          <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold">
            {LABELS[key]}
          </label>
          <div className="flex flex-wrap gap-2">
            {OPTIONS[key].map((opt) => {
              const isActive = config[key] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange({ ...config, [key]: opt as any })}
                  className={`text-[11px] px-3.5 py-1.5 rounded-full border transition-all duration-200 cursor-pointer font-sans font-medium ${
                    isActive
                      ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-[1.03]"
                      : "bg-transparent text-slate-400 border-white/10 hover:border-white/20 hover:text-slate-200 hover:scale-[1.01]"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
