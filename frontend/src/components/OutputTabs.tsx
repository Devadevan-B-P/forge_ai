import { useState } from "react";
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
} from "./tabs/SimpleTabs";
import DatabaseTab from "./tabs/DatabaseTab";
import ApiTab from "./tabs/ApiTab";

const TABS = [
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
}: {
  bp: Blueprint;
  config: BlueprintConfig;
}) {
  const [active, setActive] = useState<(typeof TABS)[number]>("Overview");

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
        {active === "Overview" && <OverviewTab bp={bp} />}
        {active === "Features" && <FeaturesTab bp={bp} />}
        {active === "Tech Stack" && <TechStackTab bp={bp} />}
        {active === "Database" && (
          <DatabaseTab bp={bp} dialect={config.database} />
        )}
        {active === "API" && <ApiTab bp={bp} framework={config.backend} />}
        {active === "Folder" && <FolderTab bp={bp} />}
        {active === "AWS" && <AwsTab bp={bp} />}
        {active === "Docker" && <DockerTab bp={bp} />}
        {active === "Timeline" && <TimelineTab bp={bp} />}
        {active === "Security" && <SecurityTab bp={bp} />}
      </div>
    </div>
  );
}
