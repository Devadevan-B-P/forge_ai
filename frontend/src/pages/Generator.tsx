import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Sparkles, RotateCcw, Download, FileText, LogOut } from "lucide-react";
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

  // Frontend Selection
  if (config.frontend === "NextJS") {
    stack.push({ name: "Next.js SSR & Server Actions", cat: "Frontend" });
  } else {
    stack.push({ name: "React Client Single Page App", cat: "Frontend" });
  }

  // Backend Selection
  if (config.backend === "FastAPI") {
    stack.push({ name: "FastAPI REST API Host (Python)", cat: "Backend" });
  } else {
    stack.push({ name: "Express.js API Router (Node.js)", cat: "Backend" });
  }

  // Database Selection
  if (config.database === "PostgreSQL") {
    stack.push({ name: "PostgreSQL Relational DB", cat: "Database" });
  } else if (config.database === "MongoDB") {
    stack.push({ name: "MongoDB NoSQL Database", cat: "Database" });
  } else {
    stack.push({ name: "MySQL Relational Database", cat: "Database" });
  }

  // Smart User Context / Keyword Parsing
  if (
    text.includes("auth") ||
    text.includes("login") ||
    text.includes("user") ||
    text.includes("member") ||
    text.includes("signup") ||
    text.includes("profile")
  ) {
    stack.push({ name: "JWT Token-based Auth / bcrypt", cat: "Security" });
  }

  if (
    text.includes("payment") ||
    text.includes("stripe") ||
    text.includes("checkout") ||
    text.includes("buy") ||
    text.includes("store") ||
    text.includes("ecommerce") ||
    text.includes("cart") ||
    text.includes("shop")
  ) {
    stack.push({ name: "Stripe Webhooks & Checkout API", cat: "Payments" });
  }

  if (
    text.includes("cache") ||
    text.includes("speed") ||
    text.includes("realtime") ||
    text.includes("chat") ||
    text.includes("redis") ||
    text.includes("socket") ||
    text.includes("message")
  ) {
    stack.push({ name: "Redis In-Memory Cache & Broker", cat: "Caching" });
  }

  if (
    text.includes("search") ||
    text.includes("find") ||
    text.includes("filter") ||
    text.includes("query") ||
    text.includes("lookup")
  ) {
    stack.push({ name: "Elasticsearch Full-Text Node", cat: "Search" });
  }

  if (
    text.includes("upload") ||
    text.includes("file") ||
    text.includes("image") ||
    text.includes("photo") ||
    text.includes("video") ||
    text.includes("media") ||
    text.includes("pdf")
  ) {
    stack.push({ name: "AWS S3 / Cloud Storage Assets", cat: "Storage" });
  }

  if (
    text.includes("worker") ||
    text.includes("async") ||
    text.includes("queue") ||
    text.includes("email") ||
    text.includes("notify") ||
    text.includes("background")
  ) {
    stack.push({ name: "Celery & RabbitMQ Worker System", cat: "Queues" });
  }

  // Deployments Selection
  if (config.architectureStyle === "Microservices") {
    stack.push({ name: "Kubernetes Cluster / Helm", cat: "Deployment" });
  } else if (config.architectureStyle === "Serverless") {
    stack.push({ name: "AWS Lambda / API Gateway", cat: "Deployment" });
  } else {
    stack.push({ name: "Docker Compose Environment", cat: "Deployment" });
  }

  // Cloud Provider
  if (config.cloudProvider === "AWS") {
    stack.push({ name: "Amazon Web Services Hosting", cat: "Cloud" });
  } else if (config.cloudProvider === "Azure") {
    stack.push({ name: "Microsoft Azure Hosting", cat: "Cloud" });
  } else {
    stack.push({ name: "Google Cloud Platform Hosting", cat: "Cloud" });
  }

  return stack;
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
  
  // Caching Generated Schemas and Code Snippets client-side
  const [cachedSql, setCachedSql] = useState<string | null>(null);
  const [cachedApiCodes, setCachedApiCodes] = useState<Record<string, string>>({});
  
  const typingTimeoutRef = useRef<number | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

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

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    if (!val.trim()) {
      setTypingState("empty");
    } else {
      setTypingState("typing");
      typingTimeoutRef.current = window.setTimeout(() => {
        setTypingState("idle");
      }, 750);
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
      // Clear caching states upon successful blueprint generation
      setCachedSql(null);
      setCachedApiCodes({});
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

  const handleExportPrd = () => {
    if (!blueprint) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;

    let y = 20;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = 20;
      }
    };

    const addText = (text: string, size = 10, isBold = false, color = "#334155") => {
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.setFontSize(size);
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      doc.setTextColor(r, g, b);

      const lines = doc.splitTextToSize(text, contentWidth);
      const lineHeight = size * 0.45; // mm per line

      lines.forEach((line: string) => {
        checkPageBreak(lineHeight);
        doc.text(line, margin, y);
        y += lineHeight;
      });
      y += 1.8; // spacing between paragraphs
    };

    const addHeading = (level: 1 | 2 | 3, text: string) => {
      const size = level === 1 ? 14 : level === 2 ? 11 : 9.5;
      const color = level === 1 ? "#1e293b" : level === 2 ? "#7c3aed" : "#0f172a";
      
      // Prevent orphan headings by checking a larger threshold
      const threshold = level === 1 ? 32 : level === 2 ? 22 : 16;
      checkPageBreak(threshold);
      
      y += level === 1 ? 5 : level === 2 ? 3.5 : 2;
      addText(text, size, true, color);
      
      if (level === 1) {
        doc.setDrawColor(124, 92, 255); // #7c5cff Accent
        doc.setLineWidth(0.4);
        doc.line(margin, y, margin + 40, y);
        y += 5.5; // Spacing under the underline
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
        if (index === 0) {
          doc.text("•", margin, y);
          doc.text(line, margin + 5, y);
        } else {
          doc.text(line, margin + 5, y);
        }
        y += lineHeight;
      });
      y += 1.5; // bullet item spacing
    };

    // Cleanly extract a product name from the idea description
    const extractProductName = (ideaStr: string) => {
      const clean = ideaStr.trim();
      const splitters = [" where ", " to ", " that ", " for "];
      for (const splitter of splitters) {
        const idx = clean.toLowerCase().indexOf(splitter);
        if (idx > 0) {
          const part = clean.slice(0, idx).trim();
          return part.charAt(0).toUpperCase() + part.slice(1);
        }
      }
      const words = clean.split(" ");
      const fallback = words.slice(0, Math.min(5, words.length)).join(" ");
      return fallback.charAt(0).toUpperCase() + fallback.slice(1);
    };

    const productName = extractProductName(idea);

    // --- Title / Cover Header ---
    addText("PRODUCT REQUIREMENTS DOCUMENT (PRD)", 9, true, "#7c3aed");
    y += 1.5;
    addText(productName + " Specification", 20, true, "#1e293b");
    y += 3;
    addText("Generated dynamically by Forge AI software architect solution.", 9.5, false, "#64748b");
    y += 6;

    // --- 1. Executive Summary ---
    addHeading(1, "1. Executive Summary");
    addBullet("Product Name: " + productName);
    addBullet("Vision: To establish an automated, scalable, and resilient platform for: " + idea);
    addBullet("Problem: Engineering manual system setups is prone to latency issues, design errors, and dependency mismatches.");
    addBullet("Solution: A fully designed architecture stack featuring: " + Object.keys(blueprint.techStack).map(k => blueprint.techStack[k].join(", ")).join("; "));
    addBullet("Target Users: End-consumers, administrative roles, and system operators.");
    addBullet("Success Metrics: 99.9% API uptime, sub-150ms request latency, and zero data leakage.");

    // --- 2. Problem Statement ---
    addHeading(1, "2. Problem Statement");
    addText("Current legacy environments face the following challenges:", 9.5, true, "#1e293b");
    addBullet("High initial development cost and setup times for " + productName + " applications.");
    addBullet("Lack of unified architectural blueprints, resulting in mismatched APIs and database schemas.");
    addBullet("High technical debt when shifting from development to cloud hosting environments.");

    // --- 3. User Personas & User Stories ---
    addHeading(1, "3. User Personas & User Stories");
    addHeading(2, "Primary Persona");
    addText("The primary actor of the system is the consumer seeking core workflow operations.", 9.5, false);
    addHeading(2, "Key User Stories");
    if (blueprint.features.user && blueprint.features.user.length > 0) {
      blueprint.features.user.slice(0, 3).forEach((f) => addBullet("As a User, I want to: " + f));
    }
    if (blueprint.features.admin && blueprint.features.admin.length > 0) {
      blueprint.features.admin.slice(0, 2).forEach((f) => addBullet("As an Admin, I want to: " + f));
    }

    // --- 4. Product Scope ---
    addHeading(1, "4. Product Scope");
    addHeading(2, "In-Scope (Core Features)");
    if (blueprint.features.user) blueprint.features.user.forEach((f) => addBullet(f));
    if (blueprint.features.admin) blueprint.features.admin.forEach((f) => addBullet("Admin: " + f));
    if (blueprint.features.system) blueprint.features.system.forEach((f) => addBullet("System: " + f));
    addHeading(2, "Out of Scope");
    addBullet("Support for unsupported databases, legacy systems integrations, or manual hosting environments.");

    // --- 5. Functional Requirements ---
    addHeading(1, "5. Functional Requirements");
    if (blueprint.apis && blueprint.apis.length > 0) {
      blueprint.apis.slice(0, 4).forEach((api) => {
        addHeading(3, `Endpoint: ${api.method} ${api.route}`);
        addText(`Description: ${api.description}`, 9, false, "#475569");
        addText(`Auth Required: ${api.authRequired ? "Yes" : "No"}`, 9, false, "#475569");
      });
    }

    // --- 6. Non-Functional Requirements ---
    addHeading(1, "6. Non-Functional Requirements");
    addHeading(2, "Performance & Scalability");
    if (blueprint.scalability) {
      blueprint.scalability.forEach((s) => addBullet(s));
    }
    addHeading(2, "Security & Reliability");
    if (blueprint.security) {
      blueprint.security.forEach((s) => addBullet(s));
    }

    // --- 7. UX & Design Requirements ---
    addHeading(1, "7. UX & Design Requirements");
    addBullet("Responsive layout supporting desktop, tablet, and mobile breakpoints.");
    addBullet("Futuristic visual theme featuring deep dark backgrounds and neon highlights.");
    addBullet("Smooth transition animations and instant action response rates.");

    // --- 8. Technical Architecture ---
    addHeading(1, "8. Technical Architecture");
    addHeading(2, "Core Technologies");
    if (blueprint.techStack) {
      Object.keys(blueprint.techStack).forEach((layer) => {
        addBullet(`${layer}: ${blueprint.techStack[layer].join(", ")}`);
      });
    }
    addHeading(2, "Database Tables");
    if (blueprint.database?.tables) {
      blueprint.database.tables.forEach((table) => {
        addBullet(`Table: ${table.name} (Columns: ${table.columns.map(c => c.name).join(", ")})`);
      });
    }

    // --- 9. Acceptance Criteria & Testing ---
    addHeading(1, "9. Acceptance Criteria & Testing");
    addBullet("Definition of Done: Code compiles successfully, tests pass, and container hosts are configured.");
    addBullet("All endpoints must validate input payloads and return standard JSON error status codes on failures.");
    addBullet("Security checks must restrict unauthorized requests.");

    // --- 10. Success Metrics & Roadmap ---
    addHeading(1, "10. Success Metrics & Roadmap");
    addHeading(2, "Milestones");
    if (blueprint.timeline) {
      blueprint.timeline.forEach((t) => {
        addBullet(`Phase: ${t.phase} - ${t.description} (${t.days} Days)`);
      });
    }
    addHeading(2, "Future Enhancements");
    if (blueprint.futureEnhancements) {
      blueprint.futureEnhancements.forEach((e) => addBullet(e));
    }

    doc.save("product_requirements_document.pdf");
  };

  const simulatedStack = getSimulatedStack(idea, config);

  return (
    <div className="page-enter min-h-screen px-4 sm:px-8 py-8 max-w-6xl mx-auto">
      {/* Header Branding */}
      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <span className="font-display text-lg font-semibold tracking-tight text-slate-400 group-hover:text-white transition">
            forge<span className="text-accent2">ai</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:block">
            {user?.email}
          </span>
          <button
            onClick={() => { logout(); navigate("/auth"); }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full liquid-glass text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Grid Layout containing Main Panel (left) and Live Architecture Preview (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mb-8">
        
        {/* Left main config area */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          
          {/* Enormous prompt box */}
          <div className="glass rounded-2xl p-6 min-h-[240px] flex flex-col justify-between border border-white/10 relative">
            <textarea
              value={idea}
              onChange={(e) => handleIdeaChange(e.target.value)}
              placeholder={
                "Describe your application.\nExample: I want to build a food delivery app where users can order food, restaurants can manage menus, and delivery agents can track deliveries."
              }
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleGenerate();
              }}
              className="w-full bg-transparent resize-none focus:outline-none text-slate-200 placeholder:text-slate-600 text-base flex-1 min-h-[150px] font-sans leading-relaxed"
            />
            
            <div className="flex justify-between items-center mt-3 flex-wrap gap-2 pt-3 border-t border-white/5">
              {/* Dynamic AI Status Animation */}
              <div>
                {typingState === "empty" && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    AI is ready
                  </span>
                )}
                {typingState === "typing" && (
                  <span className="flex items-center gap-2 text-xs text-accent2 font-medium">
                    <Loader2 size={12} className="animate-spin text-accent2 shrink-0" />
                    <span>Analyzing requirements...</span>
                    <span className="font-mono text-[9px] tracking-tighter opacity-80 animate-pulse">██████████</span>
                  </span>
                )}
                {typingState === "idle" && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <span className="w-1 h-3.5 bg-accent2 animate-blink shrink-0" />
                    Requirements ready
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-600">⌘/Ctrl + Enter to generate</p>
            </div>
          </div>

          {/* Try ideas suggestions */}
          {!blueprint && !loading && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-slate-500 self-center mr-1">Try:</span>
              {EXAMPLE_IDEAS.map((ex) => (
                <button
                  key={ex}
                  onClick={() => handleIdeaChange(ex)}
                  className="text-xs px-3 py-1.5 rounded-full liquid-glass text-slate-300 hover:text-accent2 hover:bg-white/5 transition"
                >
                  {ex.split(" ").slice(0, 5).join(" ")}...
                </button>
              ))}
            </div>
          )}

          {/* Config selection chips panel */}
          <div>
            <ConfigPanel config={config} onChange={setConfig} />
          </div>

          {/* Error and generate button block */}
          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex items-center gap-3 mt-1 flex-wrap">
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
                <button
                  onClick={handleExportPrd}
                  className="flex items-center gap-2 px-4 py-3 rounded-full bg-accent2/20 border border-accent2/45 text-sm text-accent2 hover:bg-accent2/30 transition shadow-glow"
                >
                  <FileText size={15} />
                  Download PRD (PDF)
                </button>
              </>
            )}
          </div>

        </div>

        {/* Right side live stack preview */}
        <div className="lg:col-span-1 sticky top-8">
          <div className="glass rounded-2xl p-5 flex flex-col gap-4 border border-white/10">
            <div>
              <h3 className="text-xs font-semibold text-accent2 uppercase tracking-wider">
                Live Architecture Preview
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                Visualizing configuration and requirements map in real-time.
              </p>
            </div>

            <div className="flex flex-col gap-2 min-h-[300px] justify-start mt-2">
              {simulatedStack.map((item, idx) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg bg-white/5 border border-white/5 animate-fade-in transition-all duration-200"
                  style={{ animationDelay: `${idx * 0.03}s` }}
                >
                  <span className="text-emerald-400 font-bold shrink-0 text-xs">✓</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-slate-200 truncate">{item.name}</p>
                  </div>
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/10 text-slate-400 uppercase font-mono shrink-0">
                    {item.cat}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Main scroll output result page */}
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
            <OutputTabs
              bp={blueprint}
              config={config}
              cachedSql={cachedSql}
              setCachedSql={setCachedSql}
              cachedApiCodes={cachedApiCodes}
              setCachedApiCodes={setCachedApiCodes}
            />
          </>
        )}
      </div>
    </div>
  );
}
