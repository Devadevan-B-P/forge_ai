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
  <div className="grid sm:grid-cols-2 gap-6">
    <Section title="Components">
      <ul className="space-y-1.5 text-sm text-slate-300">
        <li><b className="text-slate-100">Frontend Hosting:</b> {bp.awsArchitecture.frontendHosting}</li>
        <li><b className="text-slate-100">Backend Hosting:</b> {bp.awsArchitecture.backendHosting}</li>
        <li><b className="text-slate-100">Database:</b> {bp.awsArchitecture.database}</li>
        <li><b className="text-slate-100">Storage:</b> {bp.awsArchitecture.storage}</li>
        <li><b className="text-slate-100">Authentication:</b> {bp.awsArchitecture.authentication}</li>
        <li><b className="text-slate-100">CDN:</b> {bp.awsArchitecture.cdn}</li>
        <li><b className="text-slate-100">Load Balancer:</b> {bp.awsArchitecture.loadBalancer}</li>
      </ul>
    </Section>
    <Section title="Request Flow">
      <div className="flex flex-col items-start gap-1.5 text-sm">
        {bp.awsArchitecture.flow.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-panel border border-border">{step}</span>
            {i < bp.awsArchitecture.flow.length - 1 && (
              <span className="text-slate-500">↓</span>
            )}
          </div>
        ))}
      </div>
    </Section>
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
    <div className="grid sm:grid-cols-3 gap-4">
      {fields.map((f, i) => (
        <div key={i} className="glass rounded-xl p-4 border border-border/50 bg-panel/30">
          <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-1">{f.label}</h4>
          <p className="text-sm font-semibold text-slate-200">{f.value}</p>
        </div>
      ))}
    </div>
  );
};


export const PrdTab = ({ bp }: { bp: Blueprint }) => {
  const prd = bp.prd || {
    documentMetadata: { ownership: "N/A", deploymentTarget: "N/A", versionStatus: "N/A" },
    executiveSummary: "N/A",
    userPersonas: [],
    functionalRequirements: [],
    uxDesign: { interfaceOverview: "N/A", layoutDescription: "N/A" },
    nonFunctionalRequirements: [],
    metricsSuccess: [],
    risksDependencies: [],
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
        <p className="leading-relaxed">{prd.executiveSummary}</p>
      </div>

      {/* 3. User Personas & Use Cases */}
      <div className="border-b border-border/40 pb-4">
        <h3 className="text-base font-semibold text-white mb-3">3. User Personas & Use Cases</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {prd.userPersonas?.map((p, i) => (
            <div key={i} className="bg-panel/40 rounded-xl p-3 border border-border/50">
              <h4 className="text-sm font-semibold text-slate-100 mb-1">{p.persona}</h4>
              <p className="text-xs text-slate-400">{p.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Functional Requirements & Scope */}
      <div className="border-b border-border/40 pb-4">
        <h3 className="text-base font-semibold text-white mb-3">4. Functional Requirements & Scope</h3>
        <ul className="space-y-2">
          {prd.functionalRequirements?.map((r, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase shrink-0 ${
                r.priority?.toLowerCase() === "high" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                r.priority?.toLowerCase() === "medium" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              }`}>{r.priority}</span>
              <span className="text-slate-300">{r.requirement}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 5. User Experience & Design Links */}
      <div className="border-b border-border/40 pb-4">
        <h3 className="text-base font-semibold text-white mb-2">5. User Experience & Design Links</h3>
        <div className="space-y-2">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-0.5">Interface Overview</span>
            <p className="text-slate-300">{prd.uxDesign?.interfaceOverview}</p>
          </div>
          <div className="mt-2">
            <span className="text-xs font-semibold text-slate-400 block mb-0.5">Workspace Layout Description</span>
            <p className="text-slate-300">{prd.uxDesign?.layoutDescription}</p>
          </div>
        </div>
      </div>

      {/* 6. Non-Functional Requirements */}
      <div className="border-b border-border/40 pb-4">
        <h3 className="text-base font-semibold text-white mb-3">6. Non-Functional Requirements</h3>
        <ul className="space-y-2">
          {prd.nonFunctionalRequirements?.map((r, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 uppercase font-mono">{r.type}</span>
              <span className="text-slate-300">{r.requirement}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 7. Metrics & Success Criteria */}
      <div className="border-b border-border/40 pb-4">
        <h3 className="text-base font-semibold text-white mb-3">7. Metrics & Success Criteria</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {prd.metricsSuccess?.map((m, i) => (
            <div key={i} className="bg-panel/40 rounded-xl p-3 border border-border/50">
              <span className="text-xs text-slate-400 block">{m.metric}</span>
              <span className="text-sm font-semibold text-slate-200">{m.target}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 8. Risks, Dependencies, & Open Questions */}
      <div>
        <h3 className="text-base font-semibold text-white mb-3">8. Risks, Dependencies, & Open Questions</h3>
        <div className="space-y-3">
          {prd.risksDependencies?.map((r, i) => (
            <div key={i} className="bg-panel/40 rounded-xl p-3 border border-border/50">
              <h4 className="text-sm font-semibold text-red-400 mb-1">Risk: {r.risk}</h4>
              <p className="text-xs text-slate-400"><b className="text-slate-200">Mitigation:</b> {r.mitigation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

