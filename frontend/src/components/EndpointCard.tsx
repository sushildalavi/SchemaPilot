import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MiniChart } from "./MiniChart";
import type { Diff, Endpoint, Snapshot } from "../types";

interface Props {
  endpoint: Endpoint;
  diffs: Diff[];
  snapshots: Snapshot[];
}

function healthScore(diffs: Diff[]): { score: number; label: string; color: string } {
  if (!diffs.length) return { score: 100, label: "Healthy", color: "#34d399" };
  const breaking = diffs.filter(d => d.severity === "breaking").length;
  const risky    = diffs.filter(d => d.severity === "risky").length;
  const score = Math.max(0, 100 - breaking * 15 - risky * 6);
  if (score >= 80) return { score, label: "Healthy", color: "#34d399" };
  if (score >= 50) return { score, label: "At Risk", color: "#fbbf24" };
  return { score, label: "Critical", color: "#f87171" };
}

function timeAgo(dt: string | null) {
  if (!dt) return "never";
  const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function HealthRing({ score, color }: { score: number; color: string }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
      <motion.circle
        cx="20" cy="20" r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        transform="rotate(-90 20 20)"
        style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
      />
      <text x="20" y="24" textAnchor="middle" fill={color} fontSize="9" fontWeight="700" fontFamily="JetBrains Mono,monospace">
        {score}
      </text>
    </svg>
  );
}

export function EndpointCard({ endpoint, diffs, snapshots }: Props) {
  const { score, label, color } = healthScore(diffs);
  const rts = snapshots.filter(s => !s.fetch_error).slice(0, 10).map(s => s.response_time_ms).reverse();
  const breaking = diffs.filter(d => d.severity === "breaking").length;
  const risky    = diffs.filter(d => d.severity === "risky").length;

  return (
    <Link to={`/endpoints/${endpoint.id}`}>
      <motion.div
        whileHover={{ y: -3, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="card card-glow p-4 flex flex-col gap-3 cursor-pointer h-full"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-200 truncate">{endpoint.name}</p>
            <p className="text-[10px] text-slate-600 mt-0.5 uppercase tracking-wider">{endpoint.provider}</p>
          </div>
          <HealthRing score={score} color={color} />
        </div>

        {/* Hash + time */}
        {endpoint.latest_snapshot_hash && (
          <div className="flex items-center gap-2">
            <code className="mono text-[10px] text-indigo-400/60 bg-indigo-500/8 px-1.5 py-0.5 rounded-md">
              {endpoint.latest_snapshot_hash.slice(0, 10)}
            </code>
            <span className="text-[10px] text-slate-700">{timeAgo(endpoint.latest_checked_at)}</span>
          </div>
        )}

        {/* MiniChart */}
        {rts.length > 2 && (
          <div>
            <MiniChart
              data={rts}
              width={160}
              height={28}
              color={rts[rts.length-1] > 1000 ? "#fbbf24" : "#10b981"}
            />
          </div>
        )}

        {/* Diff badges */}
        <div className="flex items-center gap-2 mt-auto pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <span className="text-[10px]" style={{ color }}>{label}</span>
          {breaking > 0 && <span className="badge badge-breaking text-[9px]"><span className="w-1 h-1 rounded-full bg-red-400" />{breaking}</span>}
          {risky > 0    && <span className="badge badge-risky text-[9px]"><span className="w-1 h-1 rounded-full bg-amber-400" />{risky}</span>}
          {!breaking && !risky && <span className="text-[10px] text-slate-700">{snapshots.length} snaps</span>}
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="ml-auto text-slate-800">
            <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
          </svg>
        </div>
      </motion.div>
    </Link>
  );
}
