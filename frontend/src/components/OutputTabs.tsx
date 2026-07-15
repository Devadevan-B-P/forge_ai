import { useState, useEffect, Dispatch, SetStateAction } from "react";
import type { Blueprint, BlueprintConfig } from "../types/blueprint";
import {
  OverviewTab,
  FeaturesTab,
  TechStackTab,
  FolderTab,
  AwsTab,
  DockerTab,
  TimelineTab,
  SecurityTab,
  PromptAnalysisTab,
  PrdTab,
  AiRecommendationsTab,
  MermaidTab,
} from "./tabs/SimpleTabs";
import DatabaseTab from "./tabs/DatabaseTab";
import ApiTab from "./tabs/ApiTab";

const TABS = [
  "Prompt Analysis",
  "PRD",
  "Overview",
  "Features",
  "Tech Stack",
  "Database",
  "API",
  "Folder",
  "AWS",
  "Docker",
  "Timeline",
  "Security",
  "AI Recommendations",
  "Mermaid Diagrams",
] as const;

export default function OutputTabs({
  bp,
  config,
  cachedSql,
  setCachedSql,
  cachedApiCodes,
  setCachedApiCodes,
  historyId,
}: {
  bp: Blueprint;
  config: BlueprintConfig;
  cachedSql: string | null;
  setCachedSql: (sql: string | null) => void;
  cachedApiCodes: Record<string, string>;
  setCachedApiCodes: Dispatch<SetStateAction<Record<string, string>>>;
  historyId?: string | null;
}) {
  const [active, setActive] = useState<(typeof TABS)[number]>("Prompt Analysis");

  const visibleTabs = TABS.filter((t) => {
    switch (t) {
      case "Prompt Analysis":
        return !!(bp.promptAnalysis && bp.decisions);
      case "PRD":
        return !!bp.prd;
      case "Overview":
        return !!bp.overview;
      case "Features":
        return !!bp.features;
      case "Tech Stack":
        return !!bp.techStack;
      case "Database":
        return !!bp.database;
      case "API":
        return !!bp.apis;
      case "Folder":
        return !!bp.folderStructure;
      case "AWS":
        return !!bp.awsArchitecture;
      case "Docker":
        return !!bp.dockerArchitecture;
      case "Timeline":
        return !!bp.timeline;
      case "Security":
        return !!bp.security;
      case "AI Recommendations":
        return !!bp.aiRecommendations;
      case "Mermaid Diagrams":
        return !!bp.mermaid;
      default:
        return false;
    }
  }) as unknown as typeof TABS;

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.includes(active)) {
      setActive(visibleTabs[0]);
    }
  }, [visibleTabs, active]);

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex overflow-x-auto border-b border-border">
        {visibleTabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition ${
              active === t
                ? "border-accent text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="p-6">
        {active === "Prompt Analysis" && <PromptAnalysisTab bp={bp} />}
        {active === "PRD" && <PrdTab bp={bp} />}
        {active === "Overview" && <OverviewTab bp={bp} />}
        {active === "Features" && <FeaturesTab bp={bp} />}
        {active === "Tech Stack" && <TechStackTab bp={bp} />}
        {active === "Database" && (
          <DatabaseTab
            bp={bp}
            dialect={config.database}
            cachedSql={cachedSql}
            setCachedSql={setCachedSql}
            historyId={historyId}
          />
        )}
        {active === "API" && (
          <ApiTab
            bp={bp}
            framework={config.backend}
            cachedApiCodes={cachedApiCodes}
            setCachedApiCodes={setCachedApiCodes}
            historyId={historyId}
          />
        )}
        {active === "Folder" && <FolderTab bp={bp} />}
        {active === "AWS" && <AwsTab bp={bp} />}
        {active === "Docker" && <DockerTab bp={bp} />}
        {active === "Timeline" && <TimelineTab bp={bp} />}
        {active === "Security" && <SecurityTab bp={bp} />}
        {active === "AI Recommendations" && <AiRecommendationsTab bp={bp} />}
        {active === "Mermaid Diagrams" && <MermaidTab bp={bp} />}
      </div>
    </div>
  );
}
