import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Sparkles, RotateCcw, Download } from "lucide-react";
import ConfigPanel from "../components/ConfigPanel";
import OutputTabs from "../components/OutputTabs";
import { generateBlueprint } from "../services/api";
import type { Blueprint, BlueprintConfig } from "../types/blueprint";

const DEFAULT_CONFIG: BlueprintConfig = {
  architectureStyle: "Monolithic",
  database: "PostgreSQL",
  backend: "FastAPI",
  frontend: "React",
  cloudProvider: "AWS",
  projectSize: "MVP",
};

const EXAMPLE_IDEAS = [
  "A food delivery app where users order food, restaurants manage menus, and delivery agents track deliveries.",
  "A course platform where instructors upload video lessons, students track progress, and admins issue certificates.",
  "A gym booking app where members reserve classes, trainers manage schedules, and admins track memberships.",
  "A peer-to-peer marketplace for renting camera equipment with damage-deposit escrow and reviews.",
];

const GENERATION_STEPS = [
  "Reading your requirements...",
  "Choosing a tech stack...",
  "Designing the database schema...",
  "Mapping out REST endpoints...",
  "Planning the cloud architecture...",
  "Writing the roadmap...",
];

export default function Generator() {
  const [idea, setIdea] = useState("");
  const [config, setConfig] = useState<BlueprintConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Cycle through progress labels while the real request is in flight, since
  // blueprint generation can take 10-30s and a static spinner feels broken.
  // Purely cosmetic — no bearing on the actual response.
  useEffect(() => {
    if (!loading) return;
    setStepIndex(0);
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, GENERATION_STEPS.length - 1));
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async () => {
    if (!idea.trim()) {
      setError("Describe your application idea first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const bp = await generateBlueprint(idea, config);
      setBlueprint(bp);
      setTimeout(
        () => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        100
      );
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to generate blueprint.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportJson = () => {
    if (!blueprint) return;
    const blob = new Blob([JSON.stringify(blueprint, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "forge-ai-blueprint.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen px-4 sm:px-8 py-8 max-w-5xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 mb-8 w-fit group">
        <span className="font-display text-lg font-semibold tracking-tight text-slate-400 group-hover:text-white transition">
          forge<span className="text-accent2">ai</span>
        </span>
      </Link>

      <div className="glass rounded-2xl p-5 mb-3">
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder={
            "Describe your application.\nExample: I want to build a food delivery app where users can order food, restaurants can manage menus, and delivery agents can track deliveries."
          }
          rows={4}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleGenerate();
          }}
          className="w-full bg-transparent resize-none focus:outline-none text-slate-200 placeholder:text-slate-600 text-sm"
        />
        <p className="text-right text-[11px] text-slate-600 mt-1">⌘/Ctrl + Enter to generate</p>
      </div>

      {!blueprint && !loading && (
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="text-xs text-slate-500 self-center mr-1">Try:</span>
          {EXAMPLE_IDEAS.map((ex) => (
            <button
              key={ex}
              onClick={() => setIdea(ex)}
              className="text-xs px-3 py-1.5 rounded-full liquid-glass text-slate-300 hover:text-accent2 hover:bg-white/5 transition"
            >
              {ex.split(" ").slice(0, 5).join(" ")}...
            </button>
          ))}
        </div>
      )}

      <div className="mb-5">
        <ConfigPanel config={config} onChange={setConfig} />
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-medium shadow-glow hover:brightness-110 transition disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {loading ? GENERATION_STEPS[stepIndex] : "Generate Blueprint"}
        </button>

        {blueprint && !loading && (
          <>
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 px-4 py-3 rounded-full liquid-glass text-sm text-slate-300 hover:text-white hover:bg-white/5 transition"
            >
              <RotateCcw size={15} />
              Regenerate
            </button>
            <button
              onClick={handleExportJson}
              className="flex items-center gap-2 px-4 py-3 rounded-full liquid-glass text-sm text-slate-300 hover:text-white hover:bg-white/5 transition"
            >
              <Download size={15} />
              Export JSON
            </button>
          </>
        )}
      </div>

      <div ref={outputRef} className="scroll-mt-6">
        {blueprint && (
          <>
            <div className="mb-4 px-1">
              <p className="text-sm text-slate-400 mb-2 line-clamp-2">"{idea}"</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.values(config).map((v) => (
                  <span
                    key={v}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent2"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
            <OutputTabs bp={blueprint} config={config} />
          </>
        )}
      </div>
    </div>
  );
}
