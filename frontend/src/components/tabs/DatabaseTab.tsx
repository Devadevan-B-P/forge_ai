import { useState } from "react";
import type { Blueprint } from "../../types/blueprint";
import { generateSql, getErrorMessage } from "../../services/api";
import CodeModal from "../CodeModal";
import { Loader2, Database } from "lucide-react";

export default function DatabaseTab({
  bp,
  dialect,
  cachedSql,
  setCachedSql,
}: {
  bp: Blueprint;
  dialect: string;
  cachedSql: string | null;
  setCachedSql: (sql: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (cachedSql) {
      setShowCode(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await generateSql(bp.database, dialect);
      setCachedSql(res.code);
      setShowCode(true);
    } catch (e: any) {
      setError(getErrorMessage(e, "Failed to generate Schema."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm uppercase tracking-wide text-accent2">
          Tables
        </h3>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-accent/20 border border-accent/40 text-accent2 hover:bg-accent/30 transition disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
          Generate Schema
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      <div className="space-y-4">
        {bp.database.tables.map((t, i) => (
          <div key={i} className="glass rounded-xl p-4">
            <p className="font-medium text-sm mb-2">{t.name}</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-1">Column</th>
                  <th className="pb-1">Type</th>
                  <th className="pb-1">Key</th>
                  <th className="pb-1">Notes</th>
                </tr>
              </thead>
              <tbody>
                {t.columns.map((c, j) => (
                  <tr key={j} className="border-t border-border/50">
                    <td className="py-1.5 text-slate-200">{c.name}</td>
                    <td className="py-1.5 text-slate-400">{c.type}</td>
                    <td className="py-1.5 text-slate-400">
                      {c.primaryKey ? "PK" : c.foreignKey ? `FK → ${c.foreignKey}` : ""}
                    </td>
                    <td className="py-1.5 text-slate-500">{c.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {bp.database.relationships?.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm uppercase tracking-wide text-accent2 mb-2">
            Relationships
          </h3>
          <ul className="space-y-1 text-sm text-slate-300">
            {bp.database.relationships.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-accent">•</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showCode && cachedSql && (
        <CodeModal title={`${dialect} Schema`} code={cachedSql} onClose={() => setShowCode(false)} />
      )}
    </div>
  );
}
