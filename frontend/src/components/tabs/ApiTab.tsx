import { useState, Dispatch, SetStateAction } from "react";
import type { Blueprint, ApiEndpoint } from "../../types/blueprint";
import { generateEndpointCode, getErrorMessage } from "../../services/api";
import CodeModal from "../CodeModal";
import { Loader2, Code2 } from "lucide-react";

const METHOD_COLOR: Record<string, string> = {
  GET: "text-accent2 border-accent2/40 bg-accent2/10",
  POST: "text-accent border-accent/40 bg-accent/10",
  PUT: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  DELETE: "text-red-400 border-red-400/40 bg-red-400/10",
};

export default function ApiTab({
  bp,
  framework,
  cachedApiCodes,
  setCachedApiCodes,
  historyId,
}: {
  bp: Blueprint;
  framework: string;
  cachedApiCodes: Record<string, string>;
  setCachedApiCodes: Dispatch<SetStateAction<Record<string, string>>>;
  historyId?: string | null;
}) {
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const [code, setCode] = useState<{ title: string; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (endpoint: ApiEndpoint, idx: number) => {
    const cacheKey = `${endpoint.method}:${endpoint.route}`;
    if (cachedApiCodes[cacheKey]) {
      setCode({ title: `${endpoint.method} ${endpoint.route}`, body: cachedApiCodes[cacheKey] });
      return;
    }

    setLoadingIdx(idx);
    setError(null);
    try {
      const res = await generateEndpointCode(endpoint, framework, historyId, cacheKey);
      setCachedApiCodes((prev) => ({ ...prev, [cacheKey]: res.code }));
      setCode({ title: `${endpoint.method} ${endpoint.route}`, body: res.code });
    } catch (e: any) {
      setError(getErrorMessage(e, "Failed to generate endpoint code."));
    } finally {
      setLoadingIdx(null);
    }
  };

  return (
    <div>
      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
      <div className="space-y-3">
        {bp.apis.map((a, i) => (
          <div key={i} className="glass rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-mono px-2 py-1 rounded-md border ${
                    METHOD_COLOR[a.method] || "text-slate-300 border-border"
                  }`}
                >
                  {a.method}
                </span>
                <div>
                  <p className="font-mono text-sm">{a.route}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{a.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleGenerate(a, i)}
                disabled={loadingIdx === i}
                className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-panel border border-border hover:border-accent/50 hover:text-accent2 transition disabled:opacity-50"
              >
                {loadingIdx === i ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Code2 size={13} />
                )}
                Generate {framework} Codes
              </button>
            </div>
            <div className="mt-3 grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="mb-2">
                  <span className="text-slate-500">Auth:</span> <span className={a.authRequired ? "text-accent2" : "text-slate-400"}>{a.authRequired ? "Required" : "None"}</span>
                </div>
                {a.validation && (
                  <div className="mb-2">
                    <span className="text-slate-500 block mb-0.5">Validation:</span>
                    <span className="text-slate-300">{a.validation}</span>
                  </div>
                )}
                {a.headers && a.headers.length > 0 && (
                  <div className="mb-2">
                    <span className="text-slate-500 block mb-0.5">Headers:</span>
                    <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                      {a.headers.map((h, idx) => (
                        <li key={idx}><span className="text-slate-300 font-mono">{h.name}</span>: {h.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {a.statusCodes && a.statusCodes.length > 0 && (
                  <div className="mb-2">
                    <span className="text-slate-500 block mb-0.5">Success Codes:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {a.statusCodes.map((sc, idx) => (
                        <span key={idx} className="bg-[#3DD9A4]/10 text-[#3DD9A4] border border-[#3DD9A4]/20 px-1.5 py-0.5 rounded text-[10px]"><b className="font-semibold">{sc.code}</b>: {sc.description}</span>
                      ))}
                    </div>
                  </div>
                )}
                {a.errors && a.errors.length > 0 && (
                  <div className="mb-2">
                    <span className="text-slate-500 block mb-0.5">Errors:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {a.errors.map((err, idx) => (
                        <span key={idx} className="bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded text-[10px]"><b className="font-semibold">{err.code}</b>: {err.message}</span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-slate-500 mb-1 mt-2">Sample Request</p>
                <pre className="bg-panel rounded-lg p-2 overflow-x-auto text-slate-300 font-mono">
                  {a.sampleRequest}
                </pre>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Sample Response</p>
                <pre className="bg-panel rounded-lg p-2 overflow-x-auto text-slate-300 font-mono">
                  {a.sampleResponse}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>

      {code && (
        <CodeModal title={code.title} code={code.body} onClose={() => setCode(null)} />
      )}
    </div>
  );
}
