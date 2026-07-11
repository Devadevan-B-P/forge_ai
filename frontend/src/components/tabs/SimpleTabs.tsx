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
