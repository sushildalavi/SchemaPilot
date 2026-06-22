/**
 * Dashboard — all 30 animations live here.
 * 14: hero FadeIn, 15: BorderGlow, 16: Starfield, 17: GridBackdrop,
 * 18: GradientText, 19: CountTicker×4, 20: GlowCard,
 * 21: MiniChart draw, 22: severity bar grow, 23: endpoint list x-slide,
 * 24: activity StaggeredList, 25: chart area draw, 26: run stagger,
 * 27: diffs fade, 28: SpotlightCard spotlight×all, 29: status badge spring,
 * 30: health ring draw
 */
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api, QUERY_KEYS } from "../api/client";
import { FadeIn } from "../components/FadeIn";
import { BorderGlow } from "../components/BorderGlow";
import { SpotlightCard } from "../components/SpotlightCard";
import { Starfield } from "../components/Starfield";
import { GridBackdrop } from "../components/GridBackdrop";
import { GlowCard } from "../components/GlowCard";
import { GradientText } from "../components/GradientText";
import { StaggeredList } from "../components/StaggeredList";
import { CountTicker } from "../components/CountTicker";
import { DriftChart } from "../components/DriftChart";
import { MiniChart } from "../components/MiniChart";
import type { Diff, Endpoint, MonitorRun } from "../types";

const STATUS: Record<MonitorRun["status"], { color: string; dot: string; label: string }> = {
  success:         { color: "#86efac", dot: "#22c55e",  label: "Completed" },
  partial_failure: { color: "#fcd34d", dot: "#f59e0b",  label: "Partial" },
  failed:          { color: "#fca5a5", dot: "#ef4444",  label: "Failed" },
  running:         { color: "#93c5fd", dot: "#3b82f6",  label: "Running" },
};

const CHANGE_COLOR: Record<string, string> = {
  removed_field: "#fca5a5", added_field: "#86efac", type_changed: "#fcd34d",
  nullable_added: "#93c5fd", nullable_removed: "#67e8f9",
  enum_expanded: "#c4b5fd", enum_narrowed: "#a5b4fc", enum_changed: "#c4b5fd",
  array_item_type_changed: "#fca5a5", nested_object_removed: "#fca5a5",
  int_to_number: "#fcd34d", number_to_int: "#fcd34d",
};

function timeAgo(dt: string | null) {
  if (!dt) return "–";
  const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* Animation 30: health ring */
function HealthRing({ score, color }: { score: number; color: string }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5"/>
      <motion.circle
        cx="18" cy="18" r={r}
        fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
        transform="rotate(-90 18 18)"
        style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
      />
      <text x="18" y="22" textAnchor="middle" fill={color} fontSize="8" fontWeight="700" fontFamily="JetBrains Mono,monospace">
        {score}
      </text>
    </svg>
  );
}

/* Activity item component for StaggeredList */
function ActivityItem({ diff, ep }: { diff: Diff; ep?: Endpoint }) {
  const cfg = CHANGE_COLOR[diff.change_type] ?? "var(--text-2)";
  const iconChar = diff.change_type.startsWith("removed") || diff.change_type === "nested_object_removed" ? "−"
    : diff.change_type.startsWith("added") ? "+" : "⇄";

  return (
    <div
      className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
      onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold flex-shrink-0"
        style={{ background: `${cfg}18`, color: cfg, border: `1px solid ${cfg}28` }}
      >
        {iconChar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>{ep?.name ?? "Unknown"}</span>
          <span className={`badge badge-${diff.severity}`} style={{ fontSize: 9 }}>{diff.severity}</span>
        </div>
        <div className="flex items-center gap-1">
          <code className="mono" style={{ fontSize: 10, color: "var(--indigo-l)" }}>{diff.path}</code>
          <span style={{ fontSize: 10, color: "var(--text-4)" }}>·</span>
          <span className="mono" style={{ fontSize: 10, color: cfg }}>{diff.change_type}</span>
        </div>
      </div>
      <span style={{ fontSize: 10, color: "var(--text-3)", flexShrink: 0 }}>{timeAgo(diff.created_at)}</span>
    </div>
  );
}

const P = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 250, damping: 24 } } },
};

export function Dashboard() {
  const { data: endpoints = [], isLoading: epLoad } = useQuery({ queryKey: QUERY_KEYS.endpoints, queryFn: api.endpoints.list, staleTime: 30_000, refetchInterval: 60_000 });
  const { data: runs = [], isLoading: runsLoad } = useQuery({ queryKey: QUERY_KEYS.monitorRuns, queryFn: () => api.monitor.runs(20), staleTime: 30_000, refetchInterval: 30_000 });
  const { data: allDiffs = [] } = useQuery({ queryKey: QUERY_KEYS.recentDiffs, queryFn: () => api.diffs.recent(200), staleTime: 30_000, refetchInterval: 30_000 });

  const latestRun  = runs[0];
  const breaking   = allDiffs.filter(d => d.severity === "breaking").length;
  const risky      = allDiffs.filter(d => d.severity === "risky").length;
  const safe       = allDiffs.filter(d => d.severity === "safe").length;
  const totalSnaps = runs.reduce((a, r) => a + r.snapshots_created, 0);
  const driftTrend = runs.slice().reverse().map(r => r.diffs_detected);
  const epMap      = Object.fromEntries(endpoints.map(e => [e.id, e]));

  return (
    <motion.div className="space-y-6" style={{ maxWidth: 1440 }} variants={P.container} initial="hidden" animate="show">

      {/* ── HERO ── Animation 14-18 ─────────────── */}
      <motion.div variants={P.item}>
        <FadeIn delay={0.05}>
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border-2)", padding: "36px 36px 30px", minHeight: 180 }}
          >
            {/* Animation 17: GridBackdrop */}
            <GridBackdrop angle={55} className="opacity-40" />
            {/* Animation 16: Starfield */}
            <Starfield number={8} />
            {/* Animation 15: BorderGlow */}
            <BorderGlow size={300} duration={10} colorFrom="#6366f1" colorTo="#a855f7" borderWidth={1} />

            <div className="relative z-10 flex items-start justify-between gap-8 flex-wrap">
              <div>
                {/* Animation 18: GradientText badge */}
                <div className="mb-3">
                  <GradientText>
                    <span>⚡</span>
                    <span>Schema drift detection — powered by deterministic rules</span>
                  </GradientText>
                </div>
                <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.035em", color: "var(--text-1)", lineHeight: 1.15, marginBottom: 10 }}>
                  API Contract Monitor
                </h1>
                <p style={{ fontSize: 14, color: "var(--text-2)", maxWidth: 460 }}>
                  Monitoring {endpoints.length} endpoints across {runs.length} runs · {totalSnaps} snapshots captured
                  {latestRun && ` · last check ${timeAgo(latestRun.started_at)}`}
                </p>
                {latestRun && (
                  <motion.div
                    className="flex items-center gap-2 mt-3 w-fit rounded-full px-3 py-1"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      fontSize: 12,
                      fontWeight: 500,
                      color: STATUS[latestRun.status].color,
                    }}
                  >
                    {/* Animation 29: status badge spring */}
                    <span className="w-2 h-2 rounded-full animate-live-dot" style={{ background: STATUS[latestRun.status].dot }} />
                    {STATUS[latestRun.status].label} · {latestRun.endpoints_checked} endpoints
                  </motion.div>
                )}
              </div>

              {/* Quick stats */}
              <div className="hidden lg:flex items-center gap-8 flex-shrink-0">
                {([
                  ["Breaking", breaking, "#fca5a5"],
                  ["Risky",    risky,    "#fcd34d"],
                  ["Safe",     safe,     "#86efac"],
                ] as [string, number, string][]).map(([label, val, color]) => (
                  <div key={label} className="text-center">
                    <p className="mono" style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em", color: val > 0 ? color : "var(--text-4)" }}>
                      {val}
                    </p>
                    <p className="eyebrow mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </motion.div>

      {/* ── METRIC CARDS ── Animation 19-21 ─────── */}
      <motion.div variants={P.item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {epLoad
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skel rounded-2xl h-[130px]" />)
          : ([
              { label: "Endpoints",    value: endpoints.length, sub: `${totalSnaps} snapshots total`,   spark: runs.map(r => r.endpoints_checked).reverse(), color: "#818cf8", sc: "#6366f1" },
              { label: "Breaking",     value: breaking,         sub: breaking > 0 ? "Action needed" : "All clear", spark: driftTrend, color: breaking > 0 ? "#fca5a5" : "var(--text-4)", sc: "#ef4444" },
              { label: "Risky",        value: risky,            sub: "Requires review", spark: [0,0,1,1,2,1], color: risky > 0 ? "#fcd34d" : "var(--text-4)", sc: "#f59e0b" },
              { label: "Safe Changes", value: safe,             sub: "Non-breaking",    spark: [1,2,1,3,2,4], color: safe > 0 ? "#86efac" : "var(--text-4)", sc: "#22c55e" },
            ] as { label: string; value: number; sub: string; spark: number[]; color: string; sc: string }[]).map((m, i) => (
              <FadeIn key={m.label} delay={0.08 + i * 0.06}>
                {/* Animation 20: GlowCard */}
                <GlowCard
                  neonColors={{ firstColor: m.sc, secondColor: m.sc === "#6366f1" ? "#8b5cf6" : m.sc }}
                  borderSize={1.5}
                >
                  {/* Animation 28: SpotlightCard spotlight */}
                  <SpotlightCard className="rounded-2xl" gradientColor={`${m.sc}18`} gradientSize={220}>
                    <div className="p-5 h-full" style={{ background: "var(--surface)", borderRadius: 14 }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="eyebrow">{m.label}</span>
                        {/* Animation 21: sparkline path draw */}
                        {m.spark.length > 2 && <MiniChart data={m.spark} width={60} height={24} color={m.sc} />}
                      </div>
                      {/* Animation 19: CountTicker */}
                      <p className="mono" style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1, color: m.color }}>
                        <CountTicker value={m.value} />
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>{m.sub}</p>
                    </div>
                  </SpotlightCard>
                </GlowCard>
              </FadeIn>
            ))
        }
      </motion.div>

      {/* ── SEVERITY BAR ── Animation 22 ─────────── */}
      {(breaking + risky + safe) > 0 && (
        <motion.div variants={P.item}>
          <FadeIn delay={0.2}>
            <SpotlightCard className="card" gradientColor="rgba(99,102,241,0.06)">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="eyebrow">Severity Breakdown</span>
                  <div className="flex items-center gap-4">
                    {([["Breaking", breaking, "#fca5a5"], ["Risky", risky, "#fcd34d"], ["Safe", safe, "#86efac"]] as [string, number, string][])
                      .filter(([, v]) => v > 0).map(([l, v, c]) => (
                        <span key={l} className="flex items-center gap-1.5" style={{ fontSize: 11, color: "var(--text-2)" }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                          <span style={{ color: c, fontWeight: 600 }}>{v}</span> {l}
                        </span>
                      ))}
                  </div>
                </div>
                <div className="flex gap-0.5 rounded-full overflow-hidden" style={{ height: 8, background: "rgba(255,255,255,0.06)" }}>
                  {/* Animation 22: bar segments grow */}
                  {([["b", breaking, "#ef4444"], ["r", risky, "#f59e0b"], ["s", safe, "#22c55e"]] as [string, number, string][])
                    .filter(([, v]) => v > 0).map(([key, v, c], i) => (
                      <motion.div
                        key={key}
                        className="h-full rounded-full"
                        style={{ background: c }}
                        initial={{ flex: 0 }}
                        animate={{ flex: v }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                      />
                    ))}
                </div>
              </div>
            </SpotlightCard>
          </FadeIn>
        </motion.div>
      )}

      {/* ── MAIN GRID ─────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

        {/* Endpoints — Animation 23 x-slide + 30 health ring */}
        <motion.div variants={P.item} className="xl:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Monitored Endpoints</span>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>{endpoints.length} active</span>
          </div>

          {epLoad ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skel rounded-xl h-[72px]" />)}</div>
          ) : endpoints.length === 0 ? (
            <div className="card p-10 text-center">
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>No endpoints yet</p>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>Run the monitor to populate from config</p>
            </div>
          ) : (
            endpoints.map((ep, i) => {
              const epDiffs    = allDiffs.filter(d => d.endpoint_id === ep.id);
              const epBreaking = epDiffs.filter(d => d.severity === "breaking").length;
              const epRisky    = epDiffs.filter(d => d.severity === "risky").length;
              const score      = Math.max(0, 100 - epBreaking * 18 - epRisky * 7);
              const ringColor  = epBreaking > 0 ? "#ef4444" : epRisky > 0 ? "#f59e0b" : "#22c55e";

              return (
                <FadeIn key={ep.id} delay={0.05 * i}>
                  <Link to={`/endpoints/${ep.id}`}>
                    {/* Animation 23: x-slide entry */}
                    <motion.div
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, type: "spring", stiffness: 250, damping: 24 }}
                    >
                      <SpotlightCard
                        className="card"
                        gradientColor={epBreaking > 0 ? "rgba(239,68,68,0.07)" : "rgba(99,102,241,0.06)"}
                      >
                        <div className="flex items-center gap-4 p-4 row !border-b-0" style={{ cursor: "pointer" }}>
                          {/* Animation 30: health ring draw */}
                          <HealthRing score={score} color={ringColor} />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{ep.name}</span>
                              {epBreaking > 0 && <span className="badge badge-breaking">{epBreaking} breaking</span>}
                              {!epBreaking && epRisky > 0 && <span className="badge badge-risky">{epRisky} risky</span>}
                            </div>
                            <p className="mono truncate" style={{ fontSize: 10, color: "var(--text-3)" }}>{ep.url}</p>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            {ep.latest_snapshot_hash && (
                              <code className="mono" style={{ fontSize: 10, color: "var(--text-3)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4 }}>
                                {ep.latest_snapshot_hash.slice(0, 8)}
                              </code>
                            )}
                            <span style={{ fontSize: 11, color: "var(--text-3)" }}>{timeAgo(ep.latest_checked_at)}</span>
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--text-4)" }}>
                              <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
                            </svg>
                          </div>
                        </div>
                      </SpotlightCard>
                    </motion.div>
                  </Link>
                </FadeIn>
              );
            })
          )}
        </motion.div>

        {/* Activity — Animation 24: StaggeredList */}
        <motion.div variants={P.item} className="xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <span className="eyebrow">Live Activity</span>
            <Link to="/diffs" style={{ fontSize: 11, color: "var(--indigo-l)", textDecoration: "none" }}>View all →</Link>
          </div>
          <SpotlightCard className="card" gradientColor="rgba(99,102,241,0.05)">
            <div className="p-3">
              {allDiffs.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={1.8}><path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>All clear</p>
                </div>
              ) : (
                /* Animation 24: StaggeredList sequential slide-in */
                <StaggeredList delay={600} className="gap-2">
                  {allDiffs.slice(0, 8).map(d => (
                    <ActivityItem key={d.id} diff={d} ep={epMap[d.endpoint_id]} />
                  ))}
                </StaggeredList>
              )}
            </div>
          </SpotlightCard>
        </motion.div>
      </div>

      {/* ── CHART + RUNS ── Animation 25-26 ─────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <motion.div variants={P.item} className="xl:col-span-2">
          <FadeIn delay={0.25}>
            <SpotlightCard className="card" gradientColor="rgba(99,102,241,0.04)">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>Monitor History</p>
                    <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>Drift events and snapshots per run</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {[["Snapshots", "#22c55e"], ["Diffs", "#6366f1"]].map(([l, c]) => (
                      <div key={l} className="flex items-center gap-2">
                        <div style={{ width: 18, height: 2, background: c as string, borderRadius: 2 }} />
                        <span style={{ fontSize: 10, color: "var(--text-3)" }}>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Animation 25: chart area draw */}
                {runsLoad ? <div className="skel h-44" /> : <DriftChart runs={runs} />}
              </div>
            </SpotlightCard>
          </FadeIn>
        </motion.div>

        <motion.div variants={P.item}>
          <FadeIn delay={0.3}>
            <div className="flex items-center justify-between mb-3">
              <span className="eyebrow">Monitor Runs</span>
            </div>
            <SpotlightCard className="card" gradientColor="rgba(99,102,241,0.04)">
              {runsLoad ? (
                <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skel h-10 rounded-lg" />)}</div>
              ) : runs.length === 0 ? (
                <p style={{ padding: 28, textAlign: "center", fontSize: 12, color: "var(--text-3)" }}>No runs yet</p>
              ) : (
                /* Animation 26: stagger run rows */
                <div className="stagger">
                  {runs.slice(0, 8).map((run, i) => {
                    const cfg = STATUS[run.status];
                    const dur = run.finished_at
                      ? `${Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s`
                      : null;
                    return (
                      <motion.div
                        key={run.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="row flex items-center gap-3 px-4 py-2.5"
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                        <div className="flex-1">
                          <span style={{ fontSize: 12, fontWeight: 500, color: cfg.color }}>{cfg.label}</span>
                          <span style={{ fontSize: 10, color: "var(--text-3)", marginLeft: 8 }}>
                            {run.endpoints_checked}ep · {run.snapshots_created}snaps
                          </span>
                          {run.diffs_detected > 0 && (
                            <span style={{ fontSize: 10, color: "#fca5a5", marginLeft: 6 }}>⚡{run.diffs_detected}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <p style={{ fontSize: 10, color: "var(--text-3)" }}>{timeAgo(run.started_at)}</p>
                          {dur && <p className="mono" style={{ fontSize: 9, color: "var(--text-4)" }}>{dur}</p>}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </SpotlightCard>
          </FadeIn>
        </motion.div>
      </div>

      {/* ── RECENT DIFFS TABLE ── Animation 27 ──── */}
      <motion.div variants={P.item}>
        <FadeIn delay={0.3}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="eyebrow">Recent Diffs</span>
              {allDiffs.length > 0 && (
                <span className="badge badge-risky">{allDiffs.length} events</span>
              )}
            </div>
            <Link to="/diffs">
              <motion.div
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 cursor-pointer"
                style={{ border: "1px solid var(--border-2)", fontSize: 12, color: "var(--text-3)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--text-1)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
              >
                View all <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
              </motion.div>
            </Link>
          </div>

          <SpotlightCard className="card overflow-hidden" gradientColor="rgba(99,102,241,0.03)">
            {allDiffs.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={1.8}><path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>Schema stable</p>
                <p style={{ fontSize: 12, color: "var(--text-3)" }}>No drift detected</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[80px_130px_1fr_140px_65px_65px] gap-3 px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Severity","Change","Path","Endpoint","Old","New"].map(h => <span key={h} className="eyebrow">{h}</span>)}
                </div>
                {/* Animation 27: stagger fade rows */}
                {allDiffs.slice(0, 10).map((d, i) => {
                  const ep = endpoints.find(e => e.id === d.endpoint_id);
                  return (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.05 + i * 0.025 }}
                      className="row grid grid-cols-[80px_130px_1fr_140px_65px_65px] gap-3 px-5 py-3"
                    >
                      <div className="self-center">
                        <span className={`badge badge-${d.severity}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${d.severity === "breaking" ? "bg-red-400" : d.severity === "risky" ? "bg-yellow-400" : "bg-green-400"}`} />
                          {d.severity}
                        </span>
                      </div>
                      <span className="mono self-center" style={{ fontSize: 11, color: CHANGE_COLOR[d.change_type] ?? "var(--text-2)" }}>{d.change_type}</span>
                      <code className="mono self-center truncate" style={{ fontSize: 11, color: "var(--indigo-l)" }}>{d.path}</code>
                      {ep ? (
                        <Link to={`/endpoints/${ep.id}`} className="self-center truncate" style={{ fontSize: 12, color: "var(--text-2)", textDecoration: "none" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "var(--indigo-l)")}
                          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-2)")}>
                          {ep.name}
                        </Link>
                      ) : <span className="self-center" style={{ fontSize: 12, color: "var(--text-4)" }}>—</span>}
                      <span className="mono self-center" style={{ fontSize: 10, color: "var(--text-3)" }}>{d.old_type ?? "—"}</span>
                      <span className="mono self-center" style={{ fontSize: 10, color: "var(--text-3)" }}>{d.new_type ?? "—"}</span>
                    </motion.div>
                  );
                })}
              </>
            )}
          </SpotlightCard>
        </FadeIn>
      </motion.div>
    </motion.div>
  );
}
