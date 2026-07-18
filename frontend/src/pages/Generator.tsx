import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Loader2, Sparkles, RotateCcw, Download, FileText, LogOut,
  Cpu, Zap, ChevronRight, Plus, Trash2, FolderCode, Edit2
} from "lucide-react";
import ConfigPanel from "../components/ConfigPanel";
import OutputTabs from "../components/OutputTabs";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import AnimatedContent from "../components/AnimatedContent";
import FadeContent from "../components/FadeContent";
import {
  generateBlueprint,
  getErrorMessage,
  fetchHistory,
  fetchHistoryDetail,
  deleteHistory,
  renameHistory,
  type HistoryItem,
} from "../services/api";
import type { Blueprint, BlueprintConfig } from "../types/blueprint";
import { jsPDF } from "jspdf";
import { useAuth } from "../hooks/useAuth";

function parsePartialJson(partialJson: string) {
  const jsonStr = partialJson.trim();
  if (!jsonStr) return null;

  let stack: string[] = [];
  let inString = false;
  let escaping = false;

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    if (escaping) {
      escaping = false;
      continue;
    }
    if (char === '\\') {
      escaping = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === '{') {
      stack.push('}');
    } else if (char === '[') {
      stack.push(']');
    } else if (char === '}' || char === ']') {
      if (stack.length > 0 && stack[stack.length - 1] === char) {
        stack.pop();
      }
    }
  }

  let closedJson = jsonStr;
  if (inString) closedJson += '"';
  while (stack.length > 0) {
    closedJson += stack.pop();
  }

  try {
    return JSON.parse(closedJson);
  } catch (e) {
    return null;
  }
}

function getFriendlyErrorMessage(msg: string): string {
  const lowercaseMsg = msg.toLowerCase();
  if (lowercaseMsg.includes("rate limit") || lowercaseMsg.includes("429")) {
    return "Unable to contact the AI service due to high traffic volume. Please try again in a few moments.";
  }
  if (lowercaseMsg.includes("groq") || lowercaseMsg.includes("api key") || lowercaseMsg.includes("unauthorized") || lowercaseMsg.includes("forbidden") || lowercaseMsg.includes("failed to start") || lowercaseMsg.includes("failed to initiate")) {
    return "Unable to contact the AI service. Please try again in a few moments.";
  }
  if (lowercaseMsg.includes("json")) {
    return "The system blueprint could not be parsed. Please try generating again.";
  }
  return msg || "Unable to contact the AI service. Please try again in a few moments.";
}

const extractProductName = (ideaStr: string): string => {
  if (!ideaStr) return "Application Blueprint";

  // 1. Try to match explicit Application Name / Project Name patterns (including multiline and colons)
  const nameMatch = ideaStr.match(/(?:Application Name|Project Name|App Name)\s*:?\s*\n*\s*([^\n\r#•*]+)/i);
  if (nameMatch && nameMatch[1].trim()) {
    const candidate = nameMatch[1].trim();
    if (candidate.length > 0 && candidate.length < 60) {
      return candidate;
    }
  }

  // 2. Clean up common system instruction headers to find the actual concept
  let clean = ideaStr.trim();
  
  // Strip common meta-instruction headers
  clean = clean.replace(/^(?:You are|Generate|Please generate|Create|Build)\b[\s\S]*?(?:for the following application:|for this application:|description:|concept:)/i, "");
  clean = clean.replace(/^(?:You are|Generate|Please generate|Create|Build)\b[\s\S]*?(?=(?:Application Name:|Project Name:|App Name:))/i, "");
  clean = clean.trim();

  // If the cleaning left nothing or we still have instructions, fallback to original
  if (!clean) {
    clean = ideaStr.trim();
  }

  // Check nameMatch again on the cleaned text in case it was further down
  const cleanNameMatch = clean.match(/(?:Application Name|Project Name|App Name|Name)\s*:?\s*\n*\s*([^\n\r#•*]+)/i);
  if (cleanNameMatch && cleanNameMatch[1].trim()) {
    const candidate = cleanNameMatch[1].trim();
    if (candidate.length > 0 && candidate.length < 60) {
      return candidate;
    }
  }

  // 3. Try splitter rules on the cleaned text
  const splitters = [" - ", " : ", " similar ", " like ", " where ", " to ", " that ", " for "];
  for (const splitter of splitters) {
    const idx = clean.toLowerCase().indexOf(splitter);
    if (idx > 0) {
      const part = clean.slice(0, idx).trim();
      const partLower = part.toLowerCase();
      const isCommonVerbPhrase = ["i want", "we want", "i need", "we need", "build a", "create a", "design a", "develop a", "i would like", "we would like", "a platform"].includes(partLower);
      // Verify it's a reasonable name length and doesn't contain prompt words
      if (part.length > 2 && part.length < 60 && !part.toLowerCase().includes("you are") && !part.toLowerCase().includes("generate") && !isCommonVerbPhrase) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      }
    }
  }

  // 4. Word-based fallback from the cleaned text
  const words = clean
    .replace(/[#*•_]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 0 && !["you", "are", "generate", "complete", "enterprise-grade", "the", "a", "an"].includes(w.toLowerCase()));
  
  const fallback = words.slice(0, Math.min(5, words.length)).join(" ");
  if (fallback) {
    return fallback.charAt(0).toUpperCase() + fallback.slice(1);
  }
  return "Application Blueprint";
};

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
  const [sidebarMode, setSidebarMode] = useState<"flow" | "list">("flow");
  const [typingState, setTypingState] = useState<"empty" | "typing" | "idle">("empty");

  const [cachedSql, setCachedSql] = useState<string | null>(null);
  const [cachedApiCodes, setCachedApiCodes] = useState<Record<string, string>>({});

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  /** Which AI model is currently being used for streaming generation */
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [stageLabel, setStageLabel] = useState<string | null>(null);

  const typingTimeoutRef = useRef<number | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles: {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
    }[] = [];

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const count = Math.min(60, Math.floor(window.innerWidth / 20));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.5,
          speedX: (Math.random() - 0.5) * 0.15,
          speedY: (Math.random() - 0.5) * 0.15,
          opacity: Math.random() * 0.3 + 0.1,
        });
      }
    };

    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Fetch history list on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchHistory();
        setHistory(data);
      } catch (err) {
        console.error("Failed to load history:", err);
      }
    };
    loadHistory();
  }, []);

  const handleSelectHistory = async (id: string) => {
    // Terminate any running active generation stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHistoryDetail(id);
      setActiveHistoryId(id);
      setIdea(data.idea);
      setConfig(data.config);
      setBlueprint(data.blueprint);
      setCachedSql(data.cachedSql || null);
      setCachedApiCodes(data.cachedApiCodes || {});
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load project details."));
    } finally {
      setLoading(false);
    }
  };

  const handleNewProject = () => {
    // Terminate any running active generation stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setActiveHistoryId(null);
    setIdea("");
    setBlueprint(null);
    setCachedSql(null);
    setCachedApiCodes({});
    setConfig(DEFAULT_CONFIG);
  };

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const handleDeleteHistoryConfirm = async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);

    try {
      await deleteHistory(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      if (activeHistoryId === id) {
        handleNewProject();
      }
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to delete project."));
    }
  };

  const handleStartRename = (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    setEditingHistoryId(id);
    setEditingName(currentName);
  };

  const handleSaveRename = async (id: string) => {
    if (!editingName.trim()) {
      setEditingHistoryId(null);
      return;
    }
    try {
      await renameHistory(id, editingName.trim());
      setHistory((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, name: editingName.trim() } : item
        )
      );
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to rename project."));
    } finally {
      setEditingHistoryId(null);
    }
  };

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

  const handleGenerate = async (isRegenerate: boolean = false) => {
    if (!idea.trim()) {
      setError("Describe your application idea first.");
      return;
    }

    // Terminate any running active generation stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setBlueprint(null);
    setCachedSql(null);
    setCachedApiCodes({});
    setActiveModel(null);
    setStageLabel(null);

    // Scroll to loader section immediately to show the loading screen/progress
    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);

    try {
      const token = localStorage.getItem("forge_ai_token");
      const response = await fetch("/api/blueprint/generate-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          idea,
          config,
          history_id: isRegenerate ? activeHistoryId : null,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to start blueprint streaming.");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response streaming reader available.");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          const jsonStr = trimmed.slice(6);
          let parsed: any;
          try {
            parsed = JSON.parse(jsonStr);
          } catch {
            // Ignore malformed SSE chunk lines (e.g. keep-alive pings)
            continue;
          }

          if (parsed.type === "stage") {
            setStageLabel(parsed.label);
          } else if (parsed.type === "model") {
            // Backend is switching / confirming which model is active
            accumulatedText = "";
            setActiveModel(parsed.name);
            setBlueprint(null);
          } else if (parsed.type === "chunk") {
            accumulatedText += parsed.text;
            const partialBp = parsePartialJson(accumulatedText);
            if (partialBp) {
              setBlueprint(partialBp as any);
            }
          } else if (parsed.type === "done") {
            setBlueprint(parsed.blueprint);
            setActiveHistoryId(parsed.id);
            setStageLabel(null);
          } else if (parsed.type === "error") {
            // Server explicitly reported an error — surface it to the user
            setStageLabel(null);
            throw new Error(parsed.message);
          }
        }
      }

      // Refresh history list upon completion
      const updatedHistory = await fetchHistory();
      setHistory(updatedHistory);
    } catch (e: any) {
      if (e.name === "AbortError") {
        console.log("Generation request aborted.");
        return;
      }
      console.error("[Forge AI] Generation error:", e);
      setError(getFriendlyErrorMessage(e.message || ""));
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
      setStageLabel(null);
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

    let currentFontType = "helvetica";
    let currentFontStyle = "normal";
    let currentFontSize = 10;
    let currentFontColor = [51, 65, 85]; // [R, G, B]

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = 20;
        // Re-apply style state as doc.addPage() resets styles in jsPDF
        doc.setFont(currentFontType, currentFontStyle);
        doc.setFontSize(currentFontSize);
        doc.setTextColor(currentFontColor[0], currentFontColor[1], currentFontColor[2]);
      }
    };

    const addText = (text: string, size = 10, isBold = false, color = "#334155") => {
      currentFontStyle = isBold ? "bold" : "normal";
      currentFontSize = size;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      currentFontColor = [r, g, b];

      doc.setFont(currentFontType, currentFontStyle);
      doc.setFontSize(currentFontSize);
      doc.setTextColor(r, g, b);

      const lines = doc.splitTextToSize(text, contentWidth);
      const lineHeight = size * 0.45;
      lines.forEach((line: string) => {
        checkPageBreak(lineHeight);
        doc.text(line, margin, y);
        y += lineHeight;
      });
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
      currentFontStyle = "normal";
      currentFontSize = 9.5;
      currentFontColor = [51, 65, 85];

      doc.setFont(currentFontType, currentFontStyle);
      doc.setFontSize(currentFontSize);
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
      y += 1.5;
    };

    const productName = blueprint?.promptAnalysis?.projectName || extractProductName(idea);

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

    // 3. User Stories
    addHeading(1, "3. User Stories");
    if (prd.userStories && prd.userStories.length > 0) {
      prd.userStories.forEach((s) => {
        addText(s.persona, 10, true, "#0f172a");
        addText(s.story, 9.5, false, "#475569");
        y += 1.5;
      });
    } else {
      addText("N/A", 9.5, false, "#475569");
    }
    y += 2;

    // 4. Business Rules
    addHeading(1, "4. Business Rules");
    if (prd.businessRules && prd.businessRules.length > 0) {
      prd.businessRules.forEach((r) => {
        addBullet(r.rule);
      });
    } else {
      addText("N/A", 9.5, false, "#475569");
    }
    y += 2;

    // 5. Acceptance Criteria
    addHeading(1, "5. Acceptance Criteria");
    if (prd.acceptanceCriteria && prd.acceptanceCriteria.length > 0) {
      prd.acceptanceCriteria.forEach((ac) => {
        addText(ac.feature, 10, true, "#0f172a");
        ac.criteria?.forEach((crit) => {
          addBullet(crit);
        });
        y += 1;
      });
    } else {
      addText("N/A", 9.5, false, "#475569");
    }
    y += 2;

    // 6. User Experience & Design Links
    addHeading(1, "6. User Experience & Design Links");
    const ux = prd.uxDesign || {};
    addText("Interface Overview:", 9.5, true, "#0f172a");
    addText(ux.interfaceOverview || "N/A", 9.5, false, "#475569");
    y += 1.5;
    addText("Workspace Layout Description:", 9.5, true, "#0f172a");
    addText(ux.layoutDescription || "N/A", 9.5, false, "#475569");
    y += 2;

    // 7. Business Flow
    addHeading(1, "7. Business Flow");
    if (prd.businessFlow && prd.businessFlow.length > 0) {
      prd.businessFlow.forEach((f) => {
        addBullet(f);
      });
    } else {
      addText("N/A", 9.5, false, "#475569");
    }
    y += 2;

    // 8. System Flow
    addHeading(1, "8. System Flow");
    if (prd.systemFlow && prd.systemFlow.length > 0) {
      prd.systemFlow.forEach((f) => {
        addBullet(f);
      });
    } else {
      addText("N/A", 9.5, false, "#475569");
    }
    y += 2;

    doc.save("product_requirements_document.pdf");
  };

  const simulatedStack = getSimulatedStack(idea, config);

  return (
    <div
      className="relative min-h-screen bg-[#000000] text-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Particle background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Grain overlay */}
      <div className="grain-overlay fixed inset-0 z-0 pointer-events-none opacity-[0.03]" />

      {/* Content wrapper without pageEnter to allow native position: sticky on children */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Top Navigation ── */}
        <header className="flex items-center justify-between mb-12 page-enter">
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
              {user?.name || user?.email}
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

        {/* Sidebar + Main Content Flex Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
          {/* LEFT SIDEBAR: Chat History */}
          <aside className="w-full lg:w-64 shrink-0 rounded-2xl p-5 flex flex-col gap-4 bg-[#0E1014] border border-[#22252B] relative z-20 page-enter">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#5FA9FF" }}>
                Projects History
              </h3>
              <p className="text-[10px] leading-relaxed text-[#9CA3AF]">
                Manage your saved blueprints
              </p>
            </div>

            <button
              onClick={handleNewProject}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-medium bg-white text-[#050505] hover:bg-[#7AB8FF] transition-all"
            >
              <Plus size={14} />
              New Project
            </button>

            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
              {history.length === 0 ? (
                <div className="text-center py-6 text-[11px] text-[#9CA3AF]/60 italic">
                  No saved projects yet
                </div>
              ) : (
                history.map((item) => {
                  const isActive = item.id === activeHistoryId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectHistory(item.id)}
                      className={`group flex items-center justify-between gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        isActive
                          ? "bg-[#5FA9FF]/10 border border-[#5FA9FF]/30 text-white"
                          : "bg-white/5 border border-white/5 text-[#9CA3AF] hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FolderCode size={13} className={isActive ? "text-[#5FA9FF]" : "text-[#9CA3AF]"} />
                        {editingHistoryId === item.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => handleSaveRename(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRename(item.id);
                              if (e.key === "Escape") setEditingHistoryId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] font-medium bg-black/40 border border-[#5FA9FF]/50 rounded px-1.5 py-0.5 text-white w-full outline-none focus:border-[#5FA9FF]"
                            autoFocus
                          />
                        ) : (
                          <span className="text-[11px] font-medium truncate flex-1 leading-tight">
                            {item.name || item.projectName || extractProductName(item.idea)}
                          </span>
                        )}
                      </div>
                      {editingHistoryId !== item.id && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => handleStartRename(e, item.id, item.name || item.projectName || extractProductName(item.idea))}
                            className="text-[#9CA3AF]/50 hover:text-[#5FA9FF] p-0.5 rounded transition-colors group-hover:opacity-100 opacity-0"
                            title="Rename project"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteHistory(e, item.id)}
                            className="text-[#9CA3AF]/50 hover:text-red-400 p-0.5 rounded transition-colors"
                            title="Delete project"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* RIGHT CONTENT: Hero + Main Grid + Output + Footer */}
          <div className="flex-1 min-w-0 w-full">

        {/* ── Hero heading ── */}
        <AnimatedContent
          distance={40}
          direction="vertical"
          reverse={false}
          duration={0.8}
          ease="power3.out"
          initialOpacity={0}
          scale={0.98}
        >
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
        </AnimatedContent>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Left: Input + Config */}
          <div className="lg:col-span-2 flex flex-col gap-5 page-enter">

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
                onClick={() => handleGenerate(false)}
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
                    onClick={() => handleGenerate(true)}
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
          <div className="lg:col-span-1">
            <div className="rounded-2xl p-5 flex flex-col gap-4 animate-tab-fade sticky top-8" style={{ background: "#0E1014", border: "1px solid #22252B" }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#5FA9FF" }}>
                    Live Architecture
                  </h3>
                  <p className="text-[10px] leading-relaxed" style={{ color: "#9CA3AF" }}>
                    Real-time visualization of your stack
                  </p>
                </div>
                <div className="flex bg-[#12151C] rounded-lg p-0.5 border border-white/5 shrink-0 select-none">
                  <button
                    onClick={() => setSidebarMode("flow")}
                    className={`text-[8px] uppercase tracking-wider font-semibold px-2 py-1 rounded transition-all duration-200 ${
                      sidebarMode === "flow"
                        ? "bg-[#5FA9FF]/10 text-white font-bold"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Flow
                  </button>
                  <button
                    onClick={() => setSidebarMode("list")}
                    className={`text-[8px] uppercase tracking-wider font-semibold px-2 py-1 rounded transition-all duration-200 ${
                      sidebarMode === "list"
                        ? "bg-[#5FA9FF]/10 text-white font-bold"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>

              {sidebarMode === "flow" ? (
                <div className="flex flex-col items-center gap-0 w-full py-4 min-h-[280px]">
                  {/* 1. Cloud Provider Node */}
                  {simulatedStack.find((n) => n.cat === "Cloud") && (
                    <div className="flex flex-col items-center w-full animate-tab-fade">
                      <div className="px-3 py-1.5 rounded-lg border border-[#5FA9FF]/30 bg-[#5FA9FF]/5 text-center text-[10px] font-semibold text-white max-w-[95%] truncate">
                        🌐 {simulatedStack.find((n) => n.cat === "Cloud")?.name}
                      </div>
                      <div className="w-0.5 h-3 bg-gradient-to-b from-[#5FA9FF]/40 to-transparent" />
                    </div>
                  )}

                  {/* 2. Frontend Node */}
                  {simulatedStack.find((n) => n.cat === "Frontend") && (
                    <div className="flex flex-col items-center w-full animate-tab-fade">
                      <div className="px-3 py-2 rounded-lg border border-[#5FA9FF]/30 bg-[#5FA9FF]/10 text-center text-[10px] font-semibold text-white w-[95%] truncate shadow-[0_0_15px_rgba(95,169,255,0.05)]">
                        💻 {simulatedStack.find((n) => n.cat === "Frontend")?.name}
                      </div>
                      <div className="w-0.5 h-3 bg-white/10" />
                    </div>
                  )}

                  {/* 3. Backend Node */}
                  {simulatedStack.find((n) => n.cat === "Backend") && (
                    <div className="flex flex-col items-center w-full animate-tab-fade">
                      <div className="px-3 py-2 rounded-lg border border-[#7AB8FF]/30 bg-[#7AB8FF]/10 text-center text-[10px] font-semibold text-white w-[95%] truncate shadow-[0_0_15px_rgba(122,184,255,0.05)]">
                        ⚙️ {simulatedStack.find((n) => n.cat === "Backend")?.name}
                      </div>
                    </div>
                  )}

                  {/* Connector line splitting */}
                  <div className="flex justify-between w-full px-[25%] text-[8px] text-white/20 h-2.5 font-mono leading-none select-none animate-tab-fade">
                    <span>┌──</span>
                    <span>┴</span>
                    <span>──┐</span>
                  </div>

                  {/* 4. Split Layer: Database vs Extras */}
                  <div className="w-full grid grid-cols-2 gap-2 px-1 items-stretch animate-tab-fade">
                    {/* Database */}
                    {simulatedStack.find((n) => n.cat === "Database") && (
                      <div className="flex flex-col items-center p-2 rounded-lg border border-[#3DD9A4]/20 bg-[#3DD9A4]/5 justify-center min-h-[56px] min-w-0">
                        <span className="text-[7px] uppercase tracking-wider text-[#3DD9A4]/80 mb-1 font-mono font-bold">Database</span>
                        <span className="text-[9px] font-semibold text-slate-200 text-center line-clamp-2 leading-tight">
                          {simulatedStack.find((n) => n.cat === "Database")?.name.replace(" Relational DB", "").replace(" Relational Database", "").replace(" NoSQL Database", "")}
                        </span>
                      </div>
                    )}

                    {/* Extras Cache/Storage */}
                    <div className="flex flex-col items-center p-2 rounded-lg border border-[#A78BFA]/20 bg-[#A78BFA]/5 justify-center min-h-[56px] min-w-0">
                      {simulatedStack.find((n) => n.cat === "Caching") ? (
                        <>
                          <span className="text-[7px] uppercase tracking-wider text-[#A78BFA]/80 mb-1 font-mono font-bold">In-Memory</span>
                          <span className="text-[9px] font-semibold text-slate-200 text-center leading-tight">Redis Cache</span>
                        </>
                      ) : simulatedStack.find((n) => n.cat === "Storage") ? (
                        <>
                          <span className="text-[7px] uppercase tracking-wider text-[#06B6D4]/80 mb-1 font-mono font-bold">Storage</span>
                          <span className="text-[9px] font-semibold text-slate-200 text-center leading-tight">AWS S3</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[7px] uppercase tracking-wider text-slate-400 mb-1 font-mono font-bold">Host Env</span>
                          <span className="text-[9px] font-semibold text-slate-300 text-center leading-tight truncate w-full">
                            {simulatedStack.find((n) => n.cat === "Deployment")?.name.replace(" Environment", "").replace(" Cluster / Helm", "")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Runner Node at Bottom */}
                  {simulatedStack.find((n) => n.cat === "Deployment") && (
                    <div className="flex flex-col items-center w-full mt-2 animate-tab-fade">
                      <div className="w-0.5 h-3 bg-white/10" />
                      <div className="px-2 py-0.5 rounded border border-white/10 bg-white/[0.02] text-center text-[8px] font-medium text-slate-400 max-w-[90%] truncate font-mono">
                        ⚙️ {simulatedStack.find((n) => n.cat === "Deployment")?.name}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 min-h-[280px] animate-tab-fade">
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
              )}

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

        {/* ── Blueprint Output (Rendered below the Main Grid so sidebar stops sticky scroll when past config options) ── */}
        <div ref={outputRef} className="scroll-mt-8 w-full">
          {loading && !blueprint && (
            <div className="glass rounded-2xl border border-[#22252B] p-8 flex flex-col gap-8 mb-8">
              {/* Heading */}
              <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin text-[#5FA9FF]" size={20} />
                  <div>
                    <h3 className="text-sm font-semibold text-white">{stageLabel || "Architecting System..."}</h3>
                    <p className="text-[10px] text-slate-400">
                      {stageLabel ? "Generating the selected blueprint partition" : "Please wait while the AI models design your solution"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeModel && (
                    <span
                      key={activeModel}
                      className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border"
                      style={{
                        background: "rgba(61,217,164,0.08)",
                        color: "#3DD9A4",
                        border: "1px solid rgba(61,217,164,0.25)",
                        animation: "modelFadeIn 0.4s ease",
                      }}
                    >
                      ⚡ {activeModel}
                    </span>
                  )}
                  <span className="text-[10px] bg-[#5FA9FF]/10 text-[#5FA9FF] border border-[#5FA9FF]/20 px-2 py-0.5 rounded-full font-mono font-medium animate-pulse">
                    {Math.round(((stepIndex + 1) / GENERATION_STEPS.length) * 100)}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-[#22252B] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#5FA9FF] to-[#3B82F6] transition-all duration-500 rounded-full"
                  style={{ width: `${((stepIndex + 1) / GENERATION_STEPS.length) * 100}%` }}
                />
              </div>

              {/* Steps progression checklist */}
              <div className="grid sm:grid-cols-2 gap-4">
                {GENERATION_STEPS.map((step, idx) => {
                  const isCompleted = idx < stepIndex;
                  const isActive = idx === stepIndex;
                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 ${
                        isCompleted
                          ? "bg-[#3DD9A4]/5 border-[#3DD9A4]/20 text-slate-300"
                          : isActive
                          ? "bg-[#5FA9FF]/5 border-[#5FA9FF]/30 text-white shadow-[0_0_15px_rgba(95,169,255,0.06)] animate-pulse"
                          : "bg-white/[0.01] border-white/5 text-slate-500"
                      }`}
                    >
                      {isCompleted ? (
                        <div className="w-4 h-4 rounded-full bg-[#3DD9A4] flex items-center justify-center text-[#050505] text-[10px] font-bold">✓</div>
                      ) : isActive ? (
                        <Loader2 className="animate-spin text-[#5FA9FF]" size={14} />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-white/10" />
                      )}
                      <span className="text-xs font-medium font-sans">{step}</span>
                    </div>
                  );
                })}
              </div>

              {/* Skeleton Cards */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="h-4 bg-white/10 rounded w-1/4 animate-pulse" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-24 bg-white/5 rounded-xl border border-white/5 animate-pulse" />
                  <div className="h-24 bg-white/5 rounded-xl border border-white/5 animate-pulse" />
                  <div className="h-24 bg-white/5 rounded-xl border border-white/5 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-white/5 rounded w-5/6 animate-pulse" />
                  <div className="h-3 bg-white/5 rounded w-4/6 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {blueprint && (
            <FadeContent blur={true} duration={1000} ease="power2.out" initialOpacity={0}>
              <div
                className="rounded-2xl overflow-hidden mb-8"
                style={{ border: "1px solid #22252B" }}
              >
                {/* Output header */}
                <div
                  className="px-6 py-4 flex items-center justify-between"
                  style={{ background: "#0E1014", borderBottom: "1px solid #22252B" }}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      {loading ? (
                        <Loader2 className="animate-spin text-[#5FA9FF]" size={14} />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-[#3DD9A4]" />
                      )}
                      <p className="text-sm font-medium text-white">
                        {loading ? "Streaming blueprint..." : "Blueprint Generated"}
                      </p>
                    </div>
                    {activeModel && (
                      <span
                        key={activeModel}
                        className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border animate-tab-fade"
                        style={{
                          background: "rgba(61,217,164,0.08)",
                          color: "#3DD9A4",
                          border: "1px solid rgba(61,217,164,0.25)",
                        }}
                      >
                        ⚡ {activeModel}
                      </span>
                    )}
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
                  historyId={activeHistoryId}
                />
              </div>
            </FadeContent>
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
        {deleteConfirmId && (
          <ConfirmDeleteModal
            title="Delete Project"
            message="Are you sure you want to permanently delete this project blueprint? This action cannot be undone."
            onConfirm={handleDeleteHistoryConfirm}
            onClose={() => setDeleteConfirmId(null)}
          />
        )}
      </div>
    </div>
  );
}
