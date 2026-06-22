import { motion } from "framer-motion";

interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}

export function MiniChart({ data, width = 80, height = 32, color = "#6366f1", fill = true }: Props) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }));
  const path = pts.reduce(
    (acc, p, i) =>
      i === 0
        ? `M ${p.x},${p.y}`
        : `${acc} C ${pts[i - 1].x + (p.x - pts[i - 1].x) / 2},${pts[i - 1].y} ${
            pts[i - 1].x + (p.x - pts[i - 1].x) / 2
          },${p.y} ${p.x},${p.y}`,
    ""
  );
  const areaPath = `${path} L ${pts[pts.length - 1].x},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      {fill && (
        <defs>
          <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {fill && (
        <motion.path
          d={areaPath}
          fill={`url(#sg-${color.replace("#", "")})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        />
      )}
      <motion.path
        d={path}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
      <circle
        cx={pts[pts.length - 1].x}
        cy={pts[pts.length - 1].y}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}
