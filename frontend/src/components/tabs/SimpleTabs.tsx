import React, { useState } from "react";
import type { Blueprint } from "../../types/blueprint";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="mb-6">
    <h3 className="text-sm uppercase tracking-wide text-accent2 mb-2">
      {title}
    </h3>
    {children}
  </div>
);

const Pill = ({ text }: { text: string }) => (
  <span className="inline-block px-3 py-1 mr-2 mb-2 rounded-full bg-panel border border-border text-sm">
    {text}
  </span>
);

export const OverviewTab = ({ bp }: { bp: Blueprint }) => (
  <p className="text-slate-300 leading-relaxed">{bp.overview}</p>
);

export const FeaturesTab = ({ bp }: { bp: Blueprint }) => (
  <div className="grid sm:grid-cols-3 gap-6">
    {(["user", "admin", "system"] as const).map((k) => (
      <Section key={k} title={k}>
        <ul className="space-y-1.5 text-slate-300 text-sm">
          {(bp.features[k] || []).map((f, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-accent">•</span> {f}
            </li>
          ))}
        </ul>
      </Section>
    ))}
  </div>
);

export const TechStackTab = ({ bp }: { bp: Blueprint }) => (
  <div className="grid sm:grid-cols-2 gap-x-8">
    {Object.entries(bp.techStack).map(([category, items]) => (
      <Section key={category} title={category}>
        <div>{items.map((i, idx) => <Pill key={idx} text={i} />)}</div>
      </Section>
    ))}
  </div>
);

export const FolderTab = ({ bp }: { bp: Blueprint }) => (
  <div className="grid sm:grid-cols-2 gap-6">
    <Section title="backend/">
      <pre className="glass rounded-xl p-4 text-xs text-slate-300 overflow-x-auto whitespace-pre">
        {bp.folderStructure.backend.join("\n")}
      </pre>
    </Section>
    <Section title="frontend/">
      <pre className="glass rounded-xl p-4 text-xs text-slate-300 overflow-x-auto whitespace-pre">
        {bp.folderStructure.frontend.join("\n")}
      </pre>
    </Section>
  </div>
);

export const AwsTab = ({ bp }: { bp: Blueprint }) => (
  <div className="space-y-6">
    <div className="grid sm:grid-cols-2 gap-6">
      <Section title="Cloud Components">
        <ul className="space-y-2 text-xs text-slate-300">
          <li><b className="text-slate-100">Frontend Hosting:</b> {bp.awsArchitecture.frontendHosting}</li>
          <li><b className="text-slate-100">Backend Hosting:</b> {bp.awsArchitecture.backendHosting}</li>
          <li><b className="text-slate-100">Database Instance:</b> {bp.awsArchitecture.database}</li>
          <li><b className="text-slate-100">Object Storage:</b> {bp.awsArchitecture.storage}</li>
          <li><b className="text-slate-100">Auth Identity:</b> {bp.awsArchitecture.authentication}</li>
          <li><b className="text-slate-100">CDN Edge:</b> {bp.awsArchitecture.cdn}</li>
          <li><b className="text-slate-100">Load Balancer:</b> {bp.awsArchitecture.loadBalancer}</li>
        </ul>
      </Section>
      <Section title="Data & Service Flow Path">
        <div className="flex flex-col items-start gap-1.5 text-xs">
          {bp.awsArchitecture.flow.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-panel border border-border text-slate-300 font-mono">{step}</span>
              {i < bp.awsArchitecture.flow.length - 1 && (
                <span className="text-slate-500">↓</span>
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>

    {/* Monitoring Section */}
    {bp.monitoring && (
      <div className="border-t border-border/40 pt-6">
        <h3 className="text-sm uppercase tracking-wide text-accent2 mb-3">Monitoring & Observability</h3>
        <div className="grid sm:grid-cols-3 gap-4 text-xs">
          <div className="glass rounded-xl p-3 border border-border/40 bg-panel/20">
            <span className="text-slate-500 block mb-1">Distributed Tracing</span>
            <span className="font-semibold text-slate-200">{bp.monitoring.tracing}</span>
          </div>
          <div className="glass rounded-xl p-3 border border-border/40 bg-panel/20">
            <span className="text-slate-500 block mb-1">Metrics Storage</span>
            <span className="font-semibold text-slate-200">{bp.monitoring.metrics?.join(", ")}</span>
          </div>
          <div className="glass rounded-xl p-3 border border-border/40 bg-panel/20">
            <span className="text-slate-500 block mb-1">Dashboard Visualization</span>
            <span className="font-semibold text-slate-200">{bp.monitoring.dashboards?.join(", ")}</span>
          </div>
        </div>
        <div className="mt-3">
          <span className="text-xs text-slate-500 block mb-1">Service Health Checks</span>
          <div className="flex gap-2 flex-wrap">
            {bp.monitoring.healthChecks?.map((hc, idx) => (
              <span key={idx} className="bg-[#3DD9A4]/15 border border-[#3DD9A4]/30 text-[#3DD9A4] text-[10px] px-2 py-0.5 rounded-full">{hc}</span>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* Cost Estimation Section */}
    {bp.estimatedCost && (
      <div className="border-t border-border/40 pt-6">
        <h3 className="text-sm uppercase tracking-wide text-accent2 mb-3">Resource & Cost Projections</h3>
        <div className="grid sm:grid-cols-3 gap-4 text-xs">
          <div className="glass rounded-xl p-4 border border-border/40 bg-white/[0.01]">
            <span className="text-slate-500 block mb-1">Estimated AWS Cost</span>
            <span className="text-base font-bold text-accent">{bp.estimatedCost.aws}</span>
          </div>
          <div className="glass rounded-xl p-4 border border-border/40 bg-white/[0.01]">
            <span className="text-slate-500 block mb-1">Development Resources</span>
            <span className="text-base font-bold text-slate-200">{bp.estimatedCost.development}</span>
          </div>
          <div className="glass rounded-xl p-4 border border-border/40 bg-white/[0.01]">
            <span className="text-slate-500 block mb-1">Project Duration</span>
            <span className="text-base font-bold text-slate-200">{bp.estimatedCost.duration}</span>
          </div>
        </div>
      </div>
    )}
  </div>
);

export const DockerTab = ({ bp }: { bp: Blueprint }) => (
  <div className="flex flex-col items-start gap-1.5 text-sm">
    {bp.dockerArchitecture.containers.map((c, i) => (
      <div key={i} className="flex items-center gap-2">
        <span className="px-3 py-1.5 rounded-lg bg-panel border border-border">{c}</span>
        {i < bp.dockerArchitecture.containers.length - 1 && (
          <span className="text-slate-500">↓</span>
        )}
      </div>
    ))}
  </div>
);

export const TimelineTab = ({ bp }: { bp: Blueprint }) => (
  <table className="w-full text-sm">
    <thead>
      <tr className="text-left text-slate-400 border-b border-border">
        <th className="pb-2">Phase</th>
        <th className="pb-2">Description</th>
        <th className="pb-2 text-right">Days</th>
      </tr>
    </thead>
    <tbody>
      {bp.timeline.map((t, i) => (
        <tr key={i} className="border-b border-border/50">
          <td className="py-2 font-medium">{t.phase}</td>
          <td className="py-2 text-slate-400">{t.description}</td>
          <td className="py-2 text-right">{t.days}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export const SecurityTab = ({ bp }: { bp: Blueprint }) => (
  <div className="grid sm:grid-cols-2 gap-6">
    <Section title="Security Checklist">
      <ul className="space-y-1.5 text-sm text-slate-300">
        {bp.security.map((s, i) => (
          <li key={i} className="flex gap-2"><span className="text-accent2">✔</span>{s}</li>
        ))}
      </ul>
    </Section>
    <Section title="Scalability Suggestions">
      <div>{bp.scalability.map((s, i) => <Pill key={i} text={s} />)}</div>
    </Section>
    <Section title="Future Enhancements">
      <ul className="space-y-1.5 text-sm text-slate-300">
        {bp.futureEnhancements.map((s, i) => (
          <li key={i} className="flex gap-2"><span className="text-accent">•</span>{s}</li>
        ))}
      </ul>
    </Section>
  </div>
);


export const PromptAnalysisTab = ({ bp }: { bp: Blueprint }) => {
  const analysis = bp.promptAnalysis || {
    industry: "N/A",
    businessType: "N/A",
    complexity: "N/A",
    expectedUsers: "N/A",
    scale: "N/A",
    budget: "N/A",
    cloudRequirements: "N/A",
    compliance: "N/A",
    estimatedTimeline: "N/A",
  };

  const fields = [
    { label: "Industry", value: analysis.industry },
    { label: "Business Type", value: analysis.businessType },
    { label: "Complexity", value: analysis.complexity },
    { label: "Expected Users", value: analysis.expectedUsers },
    { label: "Scale", value: analysis.scale },
    { label: "Budget", value: analysis.budget },
    { label: "Cloud Requirements", value: analysis.cloudRequirements },
    { label: "Compliance", value: analysis.compliance },
    { label: "Estimated Timeline", value: analysis.estimatedTimeline },
  ];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        {fields.map((f, i) => (
          <div key={i} className="glass rounded-xl p-4 border border-border/50 bg-panel/30">
            <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-1">{f.label}</h4>
            <p className="text-sm font-semibold text-slate-200">{f.value}</p>
          </div>
        ))}
      </div>

      {bp.decisions && bp.decisions.length > 0 && (
        <div className="mt-6 border-t border-border/40 pt-6">
          <h3 className="text-sm uppercase tracking-wider text-accent2 mb-3">Architectural Decisions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-500 border-b border-border/60">
                  <th className="pb-2 font-semibold">Component</th>
                  <th className="pb-2 font-semibold">User Requirement</th>
                  <th className="pb-2 font-semibold">AI Recommendation</th>
                  <th className="pb-2 font-semibold">Alternatives</th>
                  <th className="pb-2 font-semibold text-right">Architect Justification</th>
                </tr>
              </thead>
              <tbody>
                {bp.decisions.map((d, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-white/[0.01]">
                    <td className="py-2.5 font-semibold text-slate-200">{d.component}</td>
                    <td className="py-2.5 text-slate-400 italic">{d.userRequirement}</td>
                    <td className="py-2.5 text-accent">{d.recommendation}</td>
                    <td className="py-2.5 text-slate-400">{d.alternatives?.join(", ")}</td>
                    <td className="py-2.5 text-slate-300 leading-relaxed text-right pl-4">{d.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};


export const PrdTab = ({ bp }: { bp: Blueprint }) => {
  const prd = bp.prd || {
    documentMetadata: { ownership: "N/A", deploymentTarget: "N/A", versionStatus: "N/A" },
    executiveSummary: "N/A",
    userStories: [],
    businessRules: [],
    acceptanceCriteria: [],
    uxDesign: { interfaceOverview: "N/A", layoutDescription: "N/A" },
    businessFlow: [],
    systemFlow: [],
  };

  return (
    <div className="space-y-8 text-slate-300 text-sm">
      {/* 1. Document Metadata */}
      <div className="border-b border-border/40 pb-4">
        <h3 className="text-base font-semibold text-white mb-3">1. Document Metadata</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <span className="text-xs text-slate-400 block">Ownership</span>
            <span className="font-medium text-slate-200">{prd.documentMetadata?.ownership}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Deployment Target</span>
            <span className="font-medium text-slate-200">{prd.documentMetadata?.deploymentTarget}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Version Status</span>
            <span className="font-medium text-slate-200">{prd.documentMetadata?.versionStatus}</span>
          </div>
        </div>
      </div>

      {/* 2. Executive Summary & Objectives */}
      <div className="border-b border-border/40 pb-4">
        <h3 className="text-base font-semibold text-white mb-2">2. Executive Summary & Objectives</h3>
        <p className="leading-relaxed whitespace-pre-wrap">{prd.executiveSummary}</p>
      </div>

      {/* 3. User Stories */}
      <div className="border-b border-border/40 pb-4">
        <h3 className="text-base font-semibold text-white mb-3">3. User Stories</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {prd.userStories?.map((p, i) => (
            <div key={i} className="bg-panel/40 rounded-xl p-4 border border-border/50">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-accent mb-2 inline-block">{p.persona}</span>
              <p className="text-xs text-slate-200 leading-relaxed font-serif">"{p.story}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Business Rules */}
      <div className="border-b border-border/40 pb-4">
        <h3 className="text-base font-semibold text-white mb-3">4. Business Rules</h3>
        <ul className="space-y-2">
          {prd.businessRules?.map((r, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="text-[#3DD9A4] shrink-0 font-semibold">↳</span>
              <span className="text-slate-300">{r.rule}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 5. Acceptance Criteria */}
      <div className="border-b border-border/40 pb-4">
        <h3 className="text-base font-semibold text-white mb-3">5. Acceptance Criteria</h3>
        <div className="space-y-4">
          {prd.acceptanceCriteria?.map((ac, i) => (
            <div key={i} className="bg-panel/20 rounded-xl p-4 border border-border/40">
              <h4 className="text-sm font-semibold text-slate-200 mb-2 border-b border-border/30 pb-1">{ac.feature}</h4>
              <ul className="space-y-1.5 text-xs text-slate-400">
                {ac.criteria?.map((c, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-[#3DD9A4]">✓</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 6. User Experience & Design Links */}
      <div className="border-b border-border/40 pb-4">
        <h3 className="text-base font-semibold text-white mb-2">6. User Experience & Design Links</h3>
        <div className="space-y-2">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-0.5">Interface Overview</span>
            <p className="text-slate-300 leading-relaxed">{prd.uxDesign?.interfaceOverview}</p>
          </div>
          <div className="mt-2">
            <span className="text-xs font-semibold text-slate-400 block mb-0.5">Workspace Layout Description</span>
            <p className="text-slate-300 leading-relaxed">{prd.uxDesign?.layoutDescription}</p>
          </div>
        </div>
      </div>

      {/* 7. Business Flow */}
      <div className="border-b border-border/40 pb-4">
        <h3 className="text-base font-semibold text-white mb-3">7. Business Flow</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {prd.businessFlow?.map((flow, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <span className="px-3 py-2 rounded-xl bg-panel border border-border text-slate-300">{flow}</span>
              {i < prd.businessFlow.length - 1 && (
                <span className="text-slate-500">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 8. System Flow */}
      <div>
        <h3 className="text-base font-semibold text-white mb-3">8. System Flow</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {prd.systemFlow?.map((flow, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <span className="px-3 py-2 rounded-xl bg-panel/50 border border-[#22252B] text-slate-300">{flow}</span>
              {i < prd.systemFlow.length - 1 && (
                <span className="text-slate-500">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


export const AiRecommendationsTab = ({ bp }: { bp: Blueprint }) => {
  const recs = bp.aiRecommendations || {
    alternativeTechStack: [],
    potentialBottlenecks: [],
    scalingAdvice: [],
    securityAdvice: [],
    estimatedComplexity: "N/A",
    architectureScore: "N/A"
  };

  return (
    <div className="space-y-6 text-sm text-slate-300">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-4 border border-border/50 bg-[#0E1014]/50 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-0.5">Estimated Complexity</span>
            <span className="text-lg font-bold text-slate-100">{recs.estimatedComplexity}</span>
          </div>
          <div className="h-10 w-1 bg-border/40 rounded-full" />
        </div>
        <div className="glass rounded-xl p-4 border border-border/50 bg-[#0E1014]/50 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-0.5">Architecture Score</span>
            <span className="text-lg font-bold text-accent">{recs.architectureScore}</span>
          </div>
          <div className="h-10 w-1 bg-accent/30 rounded-full" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mt-6">
        <Section title="Alternative Tech Stack Recommendations">
          <ul className="space-y-2">
            {recs.alternativeTechStack?.map((alt, i) => (
              <li key={i} className="flex gap-2 text-xs">
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">{alt}</span>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Potential System Bottlenecks">
          <ul className="space-y-2">
            {recs.potentialBottlenecks?.map((bot, i) => (
              <li key={i} className="flex gap-2 text-xs">
                <span className="text-red-400 shrink-0">⚠️</span>
                <span className="text-slate-300">{bot}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mt-6">
        <Section title="Scaling Strategy Advice">
          <ul className="space-y-2">
            {recs.scalingAdvice?.map((scale, i) => (
              <li key={i} className="flex gap-2 text-xs">
                <span className="text-accent shrink-0">↗</span>
                <span className="text-slate-300">{scale}</span>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Proactive Security Measures">
          <ul className="space-y-2">
            {recs.securityAdvice?.map((sec, i) => (
              <li key={i} className="flex gap-2 text-xs">
                <span className="text-[#3DD9A4] shrink-0">🛡️</span>
                <span className="text-slate-300">{sec}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
};


export const MermaidTab = ({ bp }: { bp: Blueprint }) => {
  const mermaidData = bp.mermaid || {
    erDiagram: "",
    architectureDiagram: "",
    flowDiagram: "",
    sequenceDiagram: "",
    deploymentDiagram: ""
  };

  const [activeDiag, setActiveDiag] = useState<keyof typeof mermaidData>("architectureDiagram");
  const [showRaw, setShowRaw] = useState(false);

  const diagrams = [
    { key: "architectureDiagram" as const, label: "Architecture Diagram" },
    { key: "erDiagram" as const, label: "ER Diagram" },
    { key: "flowDiagram" as const, label: "Flow Diagram" },
    { key: "sequenceDiagram" as const, label: "Sequence Diagram" },
    { key: "deploymentDiagram" as const, label: "Deployment Diagram" },
  ];

  const code = mermaidData[activeDiag]?.trim();
  
  let imageUrl = "";
  if (code) {
    try {
      imageUrl = "https://mermaid.ink/svg/" + btoa(unescape(encodeURIComponent(code)));
    } catch (e) {
      console.error("Failed to generate Mermaid SVG link", e);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-3">
        <div className="flex gap-2 flex-wrap">
          {diagrams.map((d) => (
            <button
              key={d.key}
              onClick={() => { setActiveDiag(d.key); setShowRaw(false); }}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                activeDiag === d.key
                  ? "bg-[#5FA9FF]/10 border-[#5FA9FF]/30 text-white font-semibold"
                  : "bg-panel border-border text-slate-400 hover:text-white"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowRaw((r) => !r)}
          className="text-xs px-3 py-1.5 rounded-lg border bg-panel border-border text-slate-400 hover:text-white hover:border-accent/40"
        >
          {showRaw ? "Show Visual" : "Show Code"}
        </button>
      </div>

      <div className="glass rounded-2xl border border-border/50 bg-panel/30 overflow-hidden flex flex-col items-center justify-center p-6 min-h-[400px]">
        {showRaw ? (
          <pre className="w-full text-xs text-slate-300 font-mono bg-panel/60 p-4 rounded-xl overflow-x-auto whitespace-pre">
            {code || "No diagram code generated."}
          </pre>
        ) : imageUrl ? (
          <div className="w-full flex flex-col items-center justify-center bg-white/5 rounded-xl p-4 overflow-auto border border-border/30">
            <img
              src={imageUrl}
              alt={`${activeDiag} visualization`}
              className="max-h-[600px] object-contain select-none filter invert brightness-200"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                const errDiv = e.currentTarget.parentElement?.querySelector(".mermaid-error");
                if (errDiv) (errDiv as HTMLElement).style.display = "block";
              }}
            />
            <div className="mermaid-error hidden text-center py-8">
              <p className="text-red-400 text-sm font-semibold mb-1">Failed to render Mermaid diagram visually.</p>
              <button
                onClick={() => setShowRaw(true)}
                className="text-xs text-[#5FA9FF] underline mt-1"
              >
                Click here to view raw Mermaid syntax code
              </button>
            </div>
          </div>
        ) : (
          <div className="text-slate-400 text-xs italic">
            Diagram unavailable
          </div>
        )}
      </div>
    </div>
  );
};
