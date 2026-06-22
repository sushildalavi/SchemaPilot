import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api, QUERY_KEYS } from "../api/client";
import { SpotlightCard } from "../components/SpotlightCard";
import { BorderGlow } from "../components/BorderGlow";
import { CountTicker } from "../components/CountTicker";
import { MiniChart } from "../components/MiniChart";
import { DiffTable } from "../components/DiffTable";
import { SchemaTimeline } from "../components/SchemaTimeline";
import { ChangelogPanel } from "../components/ChangelogPanel";

type Tab = "diffs" | "timeline" | "schema" | "changelog";

function timeAgo(dt: string | null) {
  if (!dt) return "–";
  const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "diffs", label: "Diffs" },
  { id: "timeline", label: "Timeline" },
  { id: "schema", label: "Schema" },
  { id: "changelog", label: "Changelog" },
];

const TC: Record<string, string> = {
  string: "tc-string", integer: "tc-integer", number: "tc-number",
  boolean: "tc-boolean", array: "tc-array", object: "tc-object",
  null: "tc-null", mixed: "tc-mixed",
};

export function EndpointDetail() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("diffs");

  const { data: endpoint, isLoading } = useQuery({ queryKey: QUERY_KEYS.endpoint(id!), queryFn: () => api.endpoints.get(id!), staleTime: 30_000 });
  const { data: snapshots = [] } = useQuery({ queryKey: QUERY_KEYS.snapshots(id!), queryFn: () => api.endpoints.snapshots(id!), staleTime: 30_000 });
  const { data: diffs = [] } = useQuery({ queryKey: QUERY_KEYS.diffs(id!), queryFn: () => api.endpoints.diffs(id!), staleTime: 30_000 });

  const diffSnapIds = new Set(diffs.map(d => d.new_snapshot_id));
  const latestSnap  = snapshots[0] ?? null;
  const breaking    = diffs.filter(d => d.severity === "breaking").length;
  const risky       = diffs.filter(d => d.severity === "risky").length;
  const safe        = diffs.filter(d => d.severity === "safe").length;
  const rts         = snapshots.filter(s => !s.fetch_error).map(s => s.response_time_ms).reverse();
  const avgMs       = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;

  const fields = (latestSnap?.normalized_schema_json as Array<{
    path: string; type: string; required: boolean; nullable: boolean;
    array_item_type?: string; enum_values?: string[]; example_value?: unknown;
  }> | null) ?? [];

  const tabCounts: Record<Tab, number | undefined> = {
    diffs: diffs.length, timeline: snapshots.length, schema: fields.length, changelog: undefined,
  };

  if (isLoading) return (
    <div className="space-y-4">
      <div className="skel h-6 w-48 rounded-lg" />
      <div className="skel h-52 rounded-xl" />
    </div>
  );
  if (!endpoint) return <p style={{ color: "var(--text-2)" }}>Endpoint not found.</p>;

  return (
    <motion.div className="space-y-5" style={{ maxWidth: 1440 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, type: "spring", stiffness: 200 }}>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mono caption">
        <Link to="/" style={{ color: "var(--text-3)" }} onMouseEnter={e => (e.currentTarget.style.color = "var(--indigo-light)")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}>overview</Link>
        <span style={{ color: "var(--text-4)" }}>/</span>
        <span style={{ color: "var(--text-2)" }}>{endpoint.name}</span>
      </div>

      {/* Hero */}
      <div className="card relative overflow-hidden">
        <div className="h-[3px]" style={{ background: "linear-gradient(to right, #6366f1, #8b5cf6, #a855f7, transparent)" }} />
        <BorderGlow size={300} duration={12} colorFrom="#6366f1" colorTo="#a855f7" borderWidth={1} />

        <div className="p-6">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="heading-xl">{endpoint.name}</h1>
                <span className="badge" style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-2)", borderColor: "var(--border-2)", fontSize: 10 }}>{endpoint.provider}</span>
                <code className="mono badge" style={{ background: "rgba(99,102,241,0.1)", color: "var(--indigo-light)", borderColor: "rgba(99,102,241,0.2)", fontSize: 10 }}>{endpoint.method}</code>
              </div>
              <a href={endpoint.url} target="_blank" rel="noreferrer"
                className="mono caption block truncate mb-3"
                style={{ color: "var(--text-3)", maxWidth: 500 }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--indigo-light)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}>
                {endpoint.url}
              </a>
              {endpoint.latest_snapshot_hash && (
                <div className="flex items-center gap-2">
                  <span className="caption">Hash</span>
                  <code className="mono caption" style={{ color: "var(--indigo-light)", background: "rgba(99,102,241,0.1)", padding: "2px 8px", borderRadius: 4 }}>
                    {endpoint.latest_snapshot_hash.slice(0, 20)}
                  </code>
                  <span className="caption">· {timeAgo(endpoint.latest_checked_at)}</span>
                </div>
              )}
            </div>

            {rts.length > 2 && (
              <div className="text-right flex-shrink-0">
                <p className="eyebrow mb-2">Response Time</p>
                <MiniChart data={rts} width={120} height={38} color={avgMs > 1000 ? "#f59e0b" : "#22c55e"} />
                <p className="mono caption mt-1" style={{ color: avgMs > 1000 ? "#fcd34d" : "#86efac" }}>{avgMs}ms avg</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            {[
              { label: "Snapshots", val: snapshots.length, color: "var(--indigo-light)" },
              { label: "Breaking",  val: breaking, color: breaking > 0 ? "#fca5a5" : "var(--text-3)" },
              { label: "Risky",     val: risky,    color: risky > 0 ? "#fcd34d" : "var(--text-3)" },
              { label: "Safe",      val: safe,     color: safe > 0 ? "#86efac" : "var(--text-3)" },
              { label: "Fields",    val: fields.length, color: "#c4b5fd" },
              { label: "Avg ms",    val: avgMs,    color: avgMs > 1000 ? "#fcd34d" : "#93c5fd" },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <p className="eyebrow mb-1">{label}</p>
                <p className="mono" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color }}>
                  <CountTicker value={val} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1" style={{ borderBottom: "1px solid var(--border)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="relative flex items-center gap-2 px-4 py-2.5 transition-colors"
            style={{ fontSize: 13, fontWeight: tab === t.id ? 500 : 400, color: tab === t.id ? "var(--text-1)" : "var(--text-3)", background: "none", border: "none", cursor: "pointer" }}
            onMouseEnter={e => { if (tab !== t.id) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"; }}
            onMouseLeave={e => { if (tab !== t.id) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; }}
          >
            {t.label}
            {tabCounts[t.id] !== undefined && (
              <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, fontWeight: 600, background: tab === t.id ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)", color: tab === t.id ? "var(--indigo-light)" : "var(--text-3)" }}>
                {tabCounts[t.id]}
              </span>
            )}
            {tab === t.id && (
              <motion.div layoutId="ep-tab" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: "var(--indigo)" }} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
          {tab === "diffs"    && <SpotlightCard className="card overflow-hidden" gradientColor="rgba(99,102,241,0.04)"><DiffTable diffs={diffs} /></SpotlightCard>}
          {tab === "timeline" && <SpotlightCard className="card p-6" gradientColor="rgba(99,102,241,0.04)"><SchemaTimeline snapshots={snapshots} diffSnapshotIds={diffSnapIds} /></SpotlightCard>}
          {tab === "schema"   && (
            <SpotlightCard className="card overflow-hidden" gradientColor="rgba(99,102,241,0.04)">
              {fields.length === 0 ? <p className="body p-8 text-center">No schema data yet</p> : (
                <>
                  <div className="grid grid-cols-[1fr_80px_60px_60px_150px_160px] gap-3 px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Path", "Type", "Req", "Null", "Enum", "Example"].map(h => <span key={h} className="eyebrow">{h}</span>)}
                  </div>
                  {fields.map((f, i) => (
                    <motion.div key={f.path} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                      className="row grid grid-cols-[1fr_80px_60px_60px_150px_160px] gap-3 px-5 py-2.5">
                      <div className="flex items-center self-center" style={{ paddingLeft: (f.path.split(".").length - 1) * 14 }}>
                        {f.path.split(".").length > 1 && <span className="caption mr-1.5" style={{ color: "var(--text-4)" }}>└</span>}
                        <code className="mono" style={{ fontSize: 11, color: f.path.includes("[*]") ? "#93c5fd" : "var(--indigo-light)" }}>{f.path.split(".").at(-1)}</code>
                      </div>
                      <div className="self-center"><span className={`type-chip ${TC[f.type] ?? "tc-null"}`}>{f.type}</span></div>
                      <span className="self-center body" style={{ fontSize: 11, color: f.required ? "#86efac" : "var(--text-3)" }}>{f.required ? "yes" : "no"}</span>
                      <span className="self-center body" style={{ fontSize: 11, color: f.nullable ? "#fcd34d" : "var(--text-3)" }}>{f.nullable ? "yes" : "no"}</span>
                      <div className="self-center flex gap-1 flex-wrap">
                        {f.enum_values?.length ? f.enum_values.slice(0, 3).map(v => (
                          <span key={String(v)} className="mono" style={{ fontSize: 9, color: "#c4b5fd", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", padding: "1px 5px", borderRadius: 3 }}>{String(v)}</span>
                        )) : <span className="caption">—</span>}
                        {(f.enum_values?.length ?? 0) > 3 && <span className="caption">+{(f.enum_values?.length ?? 0) - 3}</span>}
                      </div>
                      <code className="self-center mono truncate" style={{ fontSize: 10, color: "var(--text-3)" }}>
                        {f.example_value != null ? String(f.example_value).slice(0, 22) : "—"}
                      </code>
                    </motion.div>
                  ))}
                </>
              )}
            </SpotlightCard>
          )}
          {tab === "changelog" && <SpotlightCard className="card p-6" gradientColor="rgba(99,102,241,0.04)"><ChangelogPanel endpointId={id!} latestSnapshot={latestSnap} /></SpotlightCard>}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
