import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Loader2, Sparkles, RotateCcw, Download, FileText, LogOut,
  Cpu, Zap, ChevronRight,
} from "lucide-react";
import ConfigPanel from "../components/ConfigPanel";
import OutputTabs from "../components/OutputTabs";
import { generateBlueprint } from "../services/api";
import type { Blueprint, BlueprintConfig } from "../types/blueprint";
import { jsPDF } from "jspdf";
import { useAuth } from "../hooks/useAuth";

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

const getSimulatedStack = (idea: string, config: BlueprintConfig) => {
  const stack: { name: string; cat: string }[] = [];
  const text = idea.toLowerCase().trim();

  if (config.frontend === "NextJS") {
    stack.push({ name: "Next.js SSR & Server Actions", cat: "Frontend" });
  } else {
    stack.push({ name: "React Client Single Page App", cat: "Frontend" });
  }

  if (config.backend === "FastAPI") {
    stack.push({ name: "FastAPI REST API Host (Python)", cat: "Backend" });
  } else {
    stack.push({ name: "Express.js API Router (Node.js)", cat: "Backend" });
  }

  if (config.database === "PostgreSQL") {
    stack.push({ name: "PostgreSQL Relational DB", cat: "Database" });
  } else if (config.database === "MongoDB") {
    stack.push({ name: "MongoDB NoSQL Database", cat: "Database" });
  } else {
    stack.push({ name: "MySQL Relational Database", cat: "Database" });
  }

  if (text.includes("auth") || text.includes("login") || text.includes("user") || text.includes("member") || text.includes("signup") || text.includes("profile")) {
    stack.push({ name: "JWT Token-based Auth / bcrypt", cat: "Security" });
  }
  if (text.includes("payment") || text.includes("stripe") || text.includes("checkout") || text.includes("buy") || text.includes("store") || text.includes("ecommerce") || text.includes("cart") || text.includes("shop")) {
    stack.push({ name: "Stripe Webhooks & Checkout API", cat: "Payments" });
  }
  if (text.includes("cache") || text.includes("speed") || text.includes("realtime") || text.includes("chat") || text.includes("redis") || text.includes("socket") || text.includes("message")) {
    stack.push({ name: "Redis In-Memory Cache & Broker", cat: "Caching" });
  }
  if (text.includes("search") || text.includes("find") || text.includes("filter") || text.includes("query") || text.includes("lookup")) {
    stack.push({ name: "Elasticsearch Full-Text Node", cat: "Search" });
  }
  if (text.includes("upload") || text.includes("file") || text.includes("image") || text.includes("photo") || text.includes("video") || text.includes("media") || text.includes("pdf")) {
    stack.push({ name: "AWS S3 / Cloud Storage Assets", cat: "Storage" });
  }
  if (text.includes("worker") || text.includes("async") || text.includes("queue") || text.includes("email") || text.includes("notify") || text.includes("background")) {
    stack.push({ name: "Celery & RabbitMQ Worker System", cat: "Queues" });
  }

  if (config.architectureStyle === "Microservices") {
    stack.push({ name: "Kubernetes Cluster / Helm", cat: "Deployment" });
  } else if (config.architectureStyle === "Serverless") {
    stack.push({ name: "AWS Lambda / API Gateway", cat: "Deployment" });
  } else {
    stack.push({ name: "Docker Compose Environment", cat: "Deployment" });
  }

  if (config.cloudProvider === "AWS") {
    stack.push({ name: "Amazon Web Services Hosting", cat: "Cloud" });
  } else if (config.cloudProvider === "Azure") {
    stack.push({ name: "Microsoft Azure Hosting", cat: "Cloud" });
  } else {
    stack.push({ name: "Google Cloud Platform Hosting", cat: "Cloud" });
  }

  return stack;
};

const CAT_COLOR: Record<string, string> = {
  Frontend: "#5FA9FF",
  Backend: "#7AB8FF",
  Database: "#3DD9A4",
  Security: "#F59E0B",
  Payments: "#A78BFA",
  Caching: "#F97316",
  Search: "#EC4899",
  Storage: "#06B6D4",
  Queues: "#84CC16",
  Deployment: "#9CA3AF",
  Cloud: "#5FA9FF",
};

export default function Generator() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [idea, setIdea] = useState("");
  const [config, setConfig] = useState<BlueprintConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [typingState, setTypingState] = useState<"empty" | "typing" | "idle">("empty");

  const [cachedSql, setCachedSql] = useState<string | null>(null);
  const [cachedApiCodes, setCachedApiCodes] = useState<Record<string, string>>({});

  const typingTimeoutRef = useRef<number | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!loading) return;
    setStepIndex(0);
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, GENERATION_STEPS.length - 1));
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  const handleIdeaChange = (val: string) => {
    setIdea(val);
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    if (!val.trim()) {
      setTypingState("empty");
    } else {
      setTypingState("typing");
      typingTimeoutRef.current = window.setTimeout(() => setTypingState("idle"), 750);
    }
  };

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
      setCachedSql(null);
      setCachedApiCodes({});
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to generate blueprint.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportJson = () => {
    if (!blueprint) return;
    const blob = new Blob([JSON.stringify(blueprint, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "forge-ai-blueprint.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPrd = () => {
    if (!blueprint) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = 210, pageHeight = 297, margin = 20, contentWidth = pageWidth - 2 * margin;
    let y = 20;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin) { doc.addPage(); y = 20; }
    };

    const addText = (text: string, size = 10, isBold = false, color = "#334155") => {
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.setFontSize(size);
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      doc.setTextColor(r, g, b);
      const lines = doc.splitTextToSize(text, contentWidth);
      const lineHeight = size * 0.45;
      lines.forEach((line: string) => { checkPageBreak(lineHeight); doc.text(line, margin, y); y += lineHeight; });
      y += 1.8;
    };

    const addHeading = (level: 1 | 2 | 3, text: string) => {
      const size = level === 1 ? 14 : level === 2 ? 11 : 9.5;
      const color = level === 1 ? "#1e293b" : level === 2 ? "#7c3aed" : "#0f172a";
      const threshold = level === 1 ? 32 : level === 2 ? 22 : 16;
      checkPageBreak(threshold);
      y += level === 1 ? 5 : level === 2 ? 3.5 : 2;
      addText(text, size, true, color);
      if (level === 1) {
        doc.setDrawColor(124, 92, 255);
        doc.setLineWidth(0.4);
        doc.line(margin, y, margin + 40, y);
        y += 5.5;
      }
    };

    const addBullet = (text: string) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(text, contentWidth - 6);
      const lineHeight = 9.5 * 0.45;
      lines.forEach((line: string, index: number) => {
        checkPageBreak(lineHeight);
        if (index === 0) { doc.text("•", margin, y); doc.text(line, margin + 5, y); }
        else { doc.text(line, margin + 5, y); }
        y += lineHeight;
      });
      y += 1.5;
    };

    const extractProductName = (ideaStr: string) => {
      const clean = ideaStr.trim();
      const splitters = [" where ", " to ", " that ", " for "];
      for (const splitter of splitters) {
        const idx = clean.toLowerCase().indexOf(splitter);
        if (idx > 0) { const part = clean.slice(0, idx).trim(); return part.charAt(0).toUpperCase() + part.slice(1); }
      }
      const words = clean.split(" ");
      const fallback = words.slice(0, Math.min(5, words.length)).join(" ");
      return fallback.charAt(0).toUpperCase() + fallback.slice(1);
    };

    const productName = extractProductName(idea);

    addText("PRODUCT SPECIFICATION & REQUIREMENTS (PRD)", 9, true, "#7c3aed");
    y += 1.5;
    addText(productName, 20, true, "#1e293b");
    y += 3;
    addText("Generated dynamically by Forge AI software architect solution.", 9.5, false, "#64748b");
    y += 6;

    // Prompt Analysis Section
    addHeading(1, "Prompt Analysis");
    const pa = blueprint.promptAnalysis || {};
    addBullet("Industry: " + (pa.industry || "N/A"));
    addBullet("Business Type: " + (pa.businessType || "N/A"));
    addBullet("Complexity: " + (pa.complexity || "N/A"));
    addBullet("Expected Users: " + (pa.expectedUsers || "N/A"));
    addBullet("Scale: " + (pa.scale || "N/A"));
    addBullet("Budget: " + (pa.budget || "N/A"));
    addBullet("Cloud Requirements: " + (pa.cloudRequirements || "N/A"));
    addBullet("Compliance: " + (pa.compliance || "N/A"));
    addBullet("Estimated Timeline: " + (pa.estimatedTimeline || "N/A"));
    y += 4;

    // PRD Sections
    const prd = blueprint.prd || {};

    // 1. Document Metadata
    addHeading(1, "1. Document Metadata");
    const dm = prd.documentMetadata || {};
    addBullet("Ownership: " + (dm.ownership || "N/A"));
    addBullet("Deployment Target: " + (dm.deploymentTarget || "N/A"));
    addBullet("Version Status: " + (dm.versionStatus || "N/A"));
    y += 2;

    // 2. Executive Summary & Objectives
    addHeading(1, "2. Executive Summary & Objectives");
    addText(prd.executiveSummary || "N/A", 9.5, false, "#334155");
    y += 2;

    // 3. User Personas & Use Cases
    addHeading(1, "3. User Personas & Use Cases");
    if (prd.userPersonas && prd.userPersonas.length > 0) {
      prd.userPersonas.forEach((p) => {
        addText(p.persona, 10, true, "#0f172a");
        addText(p.description, 9.5, false, "#475569");
        y += 1.5;
      });
    } else {
      addText("N/A", 9.5, false, "#475569");
    }
    y += 2;

    // 4. Functional Requirements & Scope
    addHeading(1, "4. Functional Requirements & Scope");
    if (prd.functionalRequirements && prd.functionalRequirements.length > 0) {
      prd.functionalRequirements.forEach((r) => {
        addBullet(`[Priority: ${r.priority}] ${r.requirement}`);
      });
    } else {
      addText("N/A", 9.5, false, "#475569");
    }
    y += 2;

    // 5. User Experience & Design Links
    addHeading(1, "5. User Experience & Design Links");
    const ux = prd.uxDesign || {};
    addText("Interface Overview:", 9.5, true, "#0f172a");
    addText(ux.interfaceOverview || "N/A", 9.5, false, "#475569");
    y += 1.5;
    addText("Workspace Layout Description:", 9.5, true, "#0f172a");
    addText(ux.layoutDescription || "N/A", 9.5, false, "#475569");
    y += 2;

    // 6. Non-Functional Requirements
    addHeading(1, "6. Non-Functional Requirements");
    if (prd.nonFunctionalRequirements && prd.nonFunctionalRequirements.length > 0) {
      prd.nonFunctionalRequirements.forEach((r) => {
        addBullet(`[${r.type}] ${r.requirement}`);
      });
    } else {
      addText("N/A", 9.5, false, "#475569");
    }
    y += 2;

    // 7. Metrics & Success Criteria
    addHeading(1, "7. Metrics & Success Criteria");
    if (prd.metricsSuccess && prd.metricsSuccess.length > 0) {
      prd.metricsSuccess.forEach((m) => {
        addBullet(`${m.metric} (Target: ${m.target})`);
      });
    } else {
      addText("N/A", 9.5, false, "#475569");
    }
    y += 2;

    // 8. Risks, Dependencies, & Open Questions
    addHeading(1, "8. Risks, Dependencies, & Open Questions");
    if (prd.risksDependencies && prd.risksDependencies.length > 0) {
      prd.risksDependencies.forEach((r) => {
        addText(`Risk: ${r.risk}`, 9.5, true, "#b91c1c");
        addText(`Mitigation: ${r.mitigation}`, 9.5, false, "#475569");
        y += 1.5;
      });
    } else {
      addText("N/A", 9.5, false, "#475569");
    }

    doc.save("product_requirements_document.pdf");
  };

  const simulatedStack = getSimulatedStack(idea, config);

  return (
    <div
      className="min-h-screen text-white"
      style={{ fontFamily: "'Inter', sans-serif", background: "#050505" }}
    >
      {/* Ambient glow blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute rounded-full blur-[160px] opacity-[0.05]" style={{ width: 600, height: 600, background: "#5FA9FF", top: "-10%", left: "30%" }} />
        <div className="absolute rounded-full blur-[120px] opacity-[0.04]" style={{ width: 400, height: 400, background: "#3B82F6", bottom: "5%", right: "10%" }} />
      </div>

      {/* Grain overlay */}
      <div className="grain-overlay fixed inset-0 z-0 pointer-events-none opacity-[0.03]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Top Navigation ── */}
        <header className="flex items-center justify-between mb-12">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(95,169,255,0.12)", border: "1px solid rgba(95,169,255,0.2)" }}
            >
              <Cpu size={15} style={{ color: "#5FA9FF" }} />
            </div>
            <span className="text-[15px] font-semibold tracking-tight" style={{ color: "#9CA3AF" }}>
              forge<span style={{ color: "#5FA9FF" }}>ai</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs hidden sm:block" style={{ color: "#9CA3AF" }}>
              {user?.email}
            </span>
            <button
              onClick={() => { logout(); navigate("/auth"); }}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid #22252B",
                color: "#9CA3AF",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "#33373F"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; (e.currentTarget as HTMLElement).style.borderColor = "#22252B"; }}
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        </header>

        {/* ── Hero heading ── */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#5FA9FF] animate-pulse" />
            <span className="text-xs uppercase tracking-[0.2em] font-semibold" style={{ color: "#5FA9FF" }}>
              AI Blueprint Generator
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-2 leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Describe your app.<br />
            <span style={{ color: "#5FA9FF" }}>We'll architect it.</span>
          </h1>
          <p className="text-sm" style={{ color: "#9CA3AF" }}>
            Generate a full project blueprint — API, database, cloud infra, Docker, and more.
          </p>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mb-8">

          {/* Left: Input + Config */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Idea textarea */}
            <div
              className="rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300"
              style={{ background: "#0E1014", border: "1px solid #22252B" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap size={14} style={{ color: "#5FA9FF" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                  Your Idea
                </span>
              </div>
              <textarea
                value={idea}
                onChange={(e) => handleIdeaChange(e.target.value)}
                placeholder={"Describe your application.\nExample: I want to build a food delivery app where users can order food, restaurants can manage menus, and delivery agents can track deliveries."}
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleGenerate(); }}
                className="w-full bg-transparent resize-none focus:outline-none text-sm leading-relaxed min-h-[140px]"
                style={{ color: "#E2E8F0", caretColor: "#5FA9FF" }}
              />

              <div className="flex justify-between items-center pt-3" style={{ borderTop: "1px solid #22252B" }}>
                <div>
                  {typingState === "empty" && (
                    <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#3DD9A4" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3DD9A4] animate-pulse" />
                      AI ready
                    </span>
                  )}
                  {typingState === "typing" && (
                    <span className="flex items-center gap-2 text-xs font-medium" style={{ color: "#5FA9FF" }}>
                      <Loader2 size={12} className="animate-spin" />
                      Analyzing requirements...
                    </span>
                  )}
                  {typingState === "idle" && (
                    <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#9CA3AF" }}>
                      <span className="w-0.5 h-3 bg-[#5FA9FF] animate-pulse" />
                      Requirements ready
                    </span>
                  )}
                </div>
                <span className="text-[10px]" style={{ color: "#9CA3AF" }}>⌘/Ctrl + Enter to generate</span>
              </div>
            </div>

            {/* Quick idea chips */}
            {!blueprint && !loading && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs self-center mr-1" style={{ color: "#9CA3AF" }}>Try:</span>
                {EXAMPLE_IDEAS.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => handleIdeaChange(ex)}
                    className="text-xs px-3 py-1.5 rounded-full transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #22252B", color: "#9CA3AF" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(95,169,255,0.3)"; (e.currentTarget as HTMLElement).style.color = "#5FA9FF"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#22252B"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}
                  >
                    {ex.split(" ").slice(0, 5).join(" ")}…
                  </button>
                ))}
              </div>
            )}

            {/* Config panel */}
            <ConfigPanel config={config} onChange={setConfig} />

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#FCA5A5" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {error}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 disabled:opacity-60"
                style={{
                  background: loading ? "rgba(95,169,255,0.15)" : "#fff",
                  color: loading ? "#5FA9FF" : "#050505",
                  border: loading ? "1px solid rgba(95,169,255,0.3)" : "1px solid transparent",
                  boxShadow: loading ? "none" : "0 0 30px rgba(255,255,255,0.15)",
                }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {loading ? GENERATION_STEPS[stepIndex] : "Generate Blueprint"}
              </button>

              {blueprint && !loading && (
                <>
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #22252B", color: "#9CA3AF" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}
                  >
                    <RotateCcw size={14} />
                    Regenerate
                  </button>
                  <button
                    onClick={handleExportJson}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #22252B", color: "#9CA3AF" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}
                  >
                    <Download size={14} />
                    Export JSON
                  </button>
                  <button
                    onClick={handleExportPrd}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{ background: "rgba(95,169,255,0.1)", border: "1px solid rgba(95,169,255,0.3)", color: "#5FA9FF" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(95,169,255,0.18)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(95,169,255,0.1)"; }}
                  >
                    <FileText size={14} />
                    Download PRD (PDF)
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right: Live Architecture Preview */}
          <div className="lg:col-span-1 sticky top-8">
            <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "#0E1014", border: "1px solid #22252B" }}>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#5FA9FF" }}>
                  Live Architecture
                </h3>
                <p className="text-[10px] leading-relaxed" style={{ color: "#9CA3AF" }}>
                  Real-time visualization of your stack
                </p>
              </div>

              <div className="flex flex-col gap-1.5 min-h-[280px]">
                {simulatedStack.map((item, idx) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-2.5 py-2 px-3 rounded-lg transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      animationDelay: `${idx * 0.04}s`,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: CAT_COLOR[item.cat] || "#9CA3AF" }} />
                    <p className="text-[11px] font-medium flex-1 min-w-0 truncate" style={{ color: "#E2E8F0" }}>
                      {item.name}
                    </p>
                    <span
                      className="text-[8px] px-1.5 py-0.5 rounded font-mono uppercase shrink-0"
                      style={{ background: `${CAT_COLOR[item.cat]}18` || "rgba(255,255,255,0.06)", color: CAT_COLOR[item.cat] || "#9CA3AF", border: `1px solid ${CAT_COLOR[item.cat]}30` }}
                    >
                      {item.cat}
                    </span>
                  </div>
                ))}
              </div>

              {blueprint && (
                <button
                  onClick={() => outputRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-medium transition-all duration-200"
                  style={{ background: "rgba(95,169,255,0.08)", border: "1px solid rgba(95,169,255,0.2)", color: "#5FA9FF" }}
                >
                  View Blueprint
                  <ChevronRight size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Blueprint Output ── */}
        <div ref={outputRef} className="scroll-mt-8">
          {blueprint && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid #22252B" }}
            >
              {/* Output header */}
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ background: "#0E1014", borderBottom: "1px solid #22252B" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#3DD9A4]" />
                  <p className="text-sm font-medium text-white">Blueprint Generated</p>
                </div>
                <div className="flex flex-wrap gap-1.5 max-w-[60%] justify-end">
                  {Object.values(config).map((v) => (
                    <span
                      key={v}
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(95,169,255,0.1)", border: "1px solid rgba(95,169,255,0.2)", color: "#7AB8FF" }}
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              {/* Idea quote */}
              <div className="px-6 py-3" style={{ background: "#080A0D", borderBottom: "1px solid #22252B" }}>
                <p className="text-xs italic line-clamp-2" style={{ color: "#9CA3AF" }}>"{idea}"</p>
              </div>

              {/* Output tabs */}
              <OutputTabs
                bp={blueprint}
                config={config}
                cachedSql={cachedSql}
                setCachedSql={setCachedSql}
                cachedApiCodes={cachedApiCodes}
                setCachedApiCodes={setCachedApiCodes}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 mb-8 text-center">
          <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
            © {new Date().getFullYear()} Forge AI —{" "}
            <span style={{ color: "#5FA9FF" }}>Made for builders.</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
