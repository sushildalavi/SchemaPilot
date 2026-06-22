import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api, QUERY_KEYS } from "../api/client";
import { SpotlightCard } from "../components/SpotlightCard";
import { BorderGlow } from "../components/BorderGlow";
import { CountTicker } from "../components/CountTicker";
import type { Severity } from "../types";

function timeAgo(dt: string) {
  const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type Filter = Severity | "all";
const FILTERS: Filter[] = ["all", "breaking", "risky", "safe"];

const ACTIVE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  all:      { bg: "rgba(255,255,255,0.08)", color: "var(--text-1)", border: "rgba(255,255,255,0.15)" },
  breaking: { bg: "rgba(239,68,68,0.12)",  color: "#fca5a5",       border: "rgba(239,68,68,0.25)" },
  risky:    { bg: "rgba(245,158,11,0.12)", color: "#fcd34d",       border: "rgba(245,158,11,0.25)" },
  safe:     { bg: "rgba(34,197,94,0.12)",  color: "#86efac",       border: "rgba(34,197,94,0.25)" },
};

const STAT_CARDS: [string, string, string, string][] = [
  ["Breaking", "breaking", "#fca5a5", "rgba(239,68,68,0.07)"],
  ["Risky",    "risky",    "#fcd34d", "rgba(245,158,11,0.07)"],
  ["Safe",     "safe",     "#86efac", "rgba(34,197,94,0.07)"],
];

const CHANGE_COLOR: Record<string, string> = {
  removed_field: "#fca5a5", added_field: "#86efac", type_changed: "#fcd34d",
  int_to_number: "#fcd34d", number_to_int: "#fcd34d", nullable_added: "#93c5fd",
  nullable_removed: "#67e8f9", enum_expanded: "#c4b5fd", enum_narrowed: "#a5b4fc",
  enum_changed: "#c4b5fd", array_item_type_changed: "#fca5a5", nested_object_removed: "#fca5a5",
};

export function RecentDiffs() {
  const [severity, setSeverity] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: diffs = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.recentDiffs, severity],
    queryFn: () => api.diffs.recent(200, severity !== "all" ? severity : undefined),
    staleTime: 30_000,
  });
  const { data: endpoints = [] } = useQuery({ queryKey: QUERY_KEYS.endpoints, queryFn: api.endpoints.list, staleTime: 60_000 });
  const epMap = Object.fromEntries(endpoints.map(e => [e.id, e]));

  const counts = diffs.reduce<Record<string, number>>((a, d) => {
    a[d.severity] = (a[d.severity] ?? 0) + 1;
    return a;
  }, {});

  const filtered = diffs.filter(d =>
    !search ||
    d.path.toLowerCase().includes(search.toLowerCase()) ||
    d.change_type.toLowerCase().includes(search.toLowerCase()) ||
    (epMap[d.endpoint_id]?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      className="space-y-6"
      style={{ maxWidth: 1440 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, type: "spring", stiffness: 200 }}
    >
      {/* Header */}
      <div>
        <h1 className="heading-xl">Diff History</h1>
        <p className="body mt-1.5">{filtered.length} diffs · {endpoints.length} endpoints monitored</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {STAT_CARDS.map(([label, key, color, glow]) => (
          <motion.div key={key} whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <SpotlightCard className="card overflow-hidden cursor-pointer" gradientColor={glow} gradientSize={220}>
              <button
                onClick={() => setSeverity(severity === key ? "all" : key as Severity)}
                className="w-full text-left"
                style={{ padding: "20px 22px", background: "none", border: "none", cursor: "pointer" }}
              >
                <p className="eyebrow mb-2">{label}</p>
                <p className="mono" style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1, color: (counts[key] ?? 0) > 0 ? color : "var(--text-4)" }}>
                  <CountTicker value={counts[key] ?? 0} />
                </p>
                <p className="caption mt-2">{(counts[key] ?? 0) > 0 ? "diffs detected" : "all clear"}</p>
              </button>
              {severity === key && <BorderGlow size={80} duration={5} colorFrom={color} colorTo="transparent" borderWidth={1} />}
            </SpotlightCard>
          </motion.div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {FILTERS.map(f => {
            const isActive = severity === f;
            const a = ACTIVE_STYLE[f];
            return (
              <motion.button
                key={f}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSeverity(f)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  textTransform: "capitalize",
                  cursor: "pointer",
                  border: `1px solid ${isActive ? a.border : "var(--border-2)"}`,
                  background: isActive ? a.bg : "rgba(255,255,255,0.03)",
                  color: isActive ? a.color : "var(--text-3)",
                  transition: "all 0.15s ease",
                }}
              >
                {f}
                {f !== "all" && (counts[f] ?? 0) > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7, fontFamily: "JetBrains Mono,monospace" }}>{counts[f]}</span>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="relative" style={{ flex: 1, maxWidth: 300 }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}
            style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Filter path, change type, endpoint…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input"
            style={{ paddingLeft: 34, fontSize: 12 }}
          />
        </div>

        {search && (
          <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            onClick={() => setSearch("")}
            className="btn btn-secondary caption"
          >Clear ✕</motion.button>
        )}

        <span className="caption" style={{ marginLeft: "auto" }}>{filtered.length} results</span>
      </div>

      {/* Table */}
      <SpotlightCard className="card overflow-hidden" gradientColor="rgba(99,102,241,0.04)">
        {isLoading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skel h-10 rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={1.8}><path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="heading-sm">No diffs found</p>
            <p className="body">Try a different filter or trigger a monitor run</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[85px_140px_1fr_150px_65px_65px_80px_16px] gap-3 px-5 py-2.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Severity", "Change", "Path", "Endpoint", "Old", "New", "When", ""].map(h => <span key={h} className="eyebrow">{h}</span>)}
            </div>

            <AnimatePresence initial={false}>
              {filtered.map((d, i) => {
                const ep = epMap[d.endpoint_id];
                const isOpen = expanded === d.id;
                return (
                  <motion.div key={d.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.015, 0.25) }}>
                    <div
                      className="row grid grid-cols-[85px_140px_1fr_150px_65px_65px_80px_16px] gap-3 px-5 py-3 cursor-pointer"
                      onClick={() => setExpanded(isOpen ? null : d.id)}
                    >
                      <div className="self-center">
                        <span className={`badge badge-${d.severity}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${d.severity === "breaking" ? "dot-red" : d.severity === "risky" ? "dot-yellow" : "dot-green"}`} />
                          {d.severity}
                        </span>
                      </div>
                      <span className="mono self-center" style={{ fontSize: 11, color: CHANGE_COLOR[d.change_type] ?? "var(--text-2)" }}>{d.change_type}</span>
                      <code className="mono self-center truncate" style={{ fontSize: 11, color: "var(--indigo-light)" }}>{d.path}</code>
                      {ep ? (
                        <Link to={`/endpoints/${ep.id}`} onClick={e => e.stopPropagation()} className="self-center body truncate" style={{ fontSize: 12, color: "var(--text-2)" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "var(--indigo-light)")}
                          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-2)")}>
                          {ep.name}
                        </Link>
                      ) : <span className="self-center caption">—</span>}
                      <span className="mono self-center caption">{d.old_type ?? "—"}</span>
                      <span className="mono self-center caption">{d.new_type ?? "—"}</span>
                      <span className="self-center caption">{timeAgo(d.created_at)}</span>
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="self-center">
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "var(--text-3)" }}>
                          <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </motion.div>
                    </div>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                          <div className="px-5 pb-3">
                            <div className="rounded-lg px-4 py-3 body" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 12 }}>
                              <span style={{ color: "var(--text-3)", marginRight: 8 }}>↳</span>{d.message}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </>
        )}
      </SpotlightCard>
    </motion.div>
  );
}
