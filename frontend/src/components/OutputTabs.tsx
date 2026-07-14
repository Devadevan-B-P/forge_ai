import { useState, Dispatch, SetStateAction } from "react";
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
] as const;

export default function OutputTabs({
  bp,
  config,
  cachedSql,
  setCachedSql,
  cachedApiCodes,
  setCachedApiCodes,
}: {
  bp: Blueprint;
  config: BlueprintConfig;
  cachedSql: string | null;
  setCachedSql: (sql: string | null) => void;
  cachedApiCodes: Record<string, string>;
  setCachedApiCodes: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  const [active, setActive] = useState<(typeof TABS)[number]>("Prompt Analysis");

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex overflow-x-auto border-b border-border">
        {TABS.map((t) => (
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
          />
        )}
        {active === "API" && (
          <ApiTab
            bp={bp}
            framework={config.backend}
            cachedApiCodes={cachedApiCodes}
            setCachedApiCodes={setCachedApiCodes}
          />
        )}
        {active === "Folder" && <FolderTab bp={bp} />}
        {active === "AWS" && <AwsTab bp={bp} />}
        {active === "Docker" && <DockerTab bp={bp} />}
        {active === "Timeline" && <TimelineTab bp={bp} />}
        {active === "Security" && <SecurityTab bp={bp} />}
      </div>
    </div>
  );
}
