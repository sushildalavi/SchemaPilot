import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { MonitorRun } from "../types";

interface Props {
  runs: MonitorRun[];
}

interface TooltipPoint {
  dataKey?: string | number;
  color?: string;
  value?: string | number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPoint[];
  label?: string | number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2.5 text-xs space-y-1.5 shadow-2xl" style={{ minWidth: 140 }}>
      <p className="label mb-1">{label}</p>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5" style={{ color: p.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
            {p.dataKey}
          </span>
          <span className="font-semibold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function DriftChart({ runs }: Props) {
  if (runs.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 text-center">
        <div>
          <p className="text-sm font-medium text-slate-500">Not enough data</p>
          <p className="text-xs text-slate-700 mt-1">Run the monitor at least twice to see a chart</p>
        </div>
      </div>
    );
  }

  const data = runs.slice().reverse().map((r, i) => ({
    name: `Run ${i + 1}`,
    date: new Date(r.started_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    breaking: 0,
    risky: 0,
    safe: 0,
    total: r.diffs_detected,
    snapshots: r.snapshots_created,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gBreaking" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gSnaps" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "#334155", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fill: "#334155", fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }} />
        <Area type="monotone" dataKey="snapshots" stroke="#10b981" strokeWidth={1.5} fill="url(#gSnaps)" dot={false} activeDot={{ r: 4, fill: "#10b981", strokeWidth: 0 }} />
        <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={1.5} fill="url(#gTotal)" dot={false} activeDot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
