/**
 * Layout — sidebar nav + topbar + page wrapper.
 * Animations: 8=nav-spring, 9=page-transition, 10=breadcrumb-crossfade, 11=clock-update, 12=progress-bar
 */
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CommandPalette } from "./CommandPalette";

function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <span className="mono text-[10px] tabular-nums" style={{ color: "var(--text-3)" }}>
      {t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

const NAV = [
  {
    to: "/", end: true, label: "Overview", badge: null,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    to: "/diffs", end: false, label: "Diff History", badge: null,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
];

const ROUTE_LABELS: Record<string, string> = {
  "/": "overview",
  "/diffs": "diff-history",
};

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(o => !o); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const routeLabel = ROUTE_LABELS[location.pathname] ?? "endpoint";

  return (
    <>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>

        {/* ─── Sidebar ──────────────────────────── */}
        <aside
          className="fixed inset-y-0 left-0 z-40 flex flex-col"
          style={{
            width: 240,
            background: "var(--surface)",
            borderRight: "1px solid var(--border-2)",
          }}
        >
          {/* Brand */}
          <div className="flex h-[58px] items-center px-5 gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
            {/* Animated logo — Animation 13: float */}
            <div className="relative flex-shrink-0 animate-float" style={{ animationDuration: "4s" }}>
              <div
                className="absolute inset-0 rounded-xl"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", filter: "blur(10px)", opacity: 0.6 }}
              />
              <div
                className="relative w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.4} strokeLinecap="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
                </svg>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>SchemaPilot</p>
              <p className="eyebrow" style={{ fontSize: 9, marginTop: 2 }}>API Monitor</p>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 pt-3 pb-1">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCmdOpen(true)}
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border-2)",
                cursor: "pointer",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-2)")}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} style={{ color: "var(--text-3)", flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
              </svg>
              <span style={{ flex: 1, fontSize: 12, color: "var(--text-3)" }}>Search endpoints…</span>
              <kbd className="mono" style={{ fontSize: 9, color: "var(--text-3)", background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-2)", padding: "2px 5px", borderRadius: 4 }}>⌘K</kbd>
            </motion.button>
          </div>

          {/* Nav — Animation 8: spring nav indicator */}
          <nav className="flex-1 px-3 py-3 space-y-0.5">
            <p className="eyebrow px-2 mb-2">Navigation</p>
            {NAV.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {({ isActive }) => (
                  <motion.div
                    className="relative flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer overflow-hidden"
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "var(--text-1)" : "var(--text-3)",
                    }}
                    whileHover={!isActive ? {
                      color: "var(--text-2)",
                      backgroundColor: "rgba(255,255,255,0.04)",
                    } : undefined}
                    transition={{ duration: 0.1 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-bg"
                        className="absolute inset-0 rounded-xl"
                        style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="nav-accent"
                        className="absolute left-0 inset-y-2 w-[3px] rounded-full"
                        style={{ background: "linear-gradient(to bottom, #6366f1, #8b5cf6)" }}
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                    <span className="relative z-10" style={{ color: isActive ? "var(--indigo-l)" : "var(--text-3)" }}>
                      {item.icon}
                    </span>
                    <span className="relative z-10">{item.label}</span>
                  </motion.div>
                )}
              </NavLink>
            ))}
          </nav>

          {/* API link */}
          <div className="px-3 pb-2">
            <a
              href="http://localhost:8080/docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors"
              style={{ fontSize: 12, color: "var(--text-3)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-2)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
              API Reference
            </a>
          </div>

          {/* Status footer — Animation 11: live dot, 12: progress bar */}
          <div className="px-4 py-4" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-shrink-0 w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-40" />
                  <span className="relative block w-2 h-2 rounded-full bg-green-400" />
                </div>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>Live monitoring</span>
              </div>
              <LiveClock />
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: 2, background: "rgba(255,255,255,0.06)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(to right, var(--indigo), var(--violet), #a855f7)" }}
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </div>
            <p style={{ fontSize: 10, color: "var(--text-4)", marginTop: 4 }}>Next cron · 08:00 UTC daily</p>
          </div>
        </aside>

        {/* ─── Main ─────────────────────────────── */}
        <div className="flex flex-col flex-1" style={{ marginLeft: 240 }}>
          {/* Topbar */}
          <header
            className="sticky top-0 z-30 flex h-[58px] items-center px-8 gap-4"
            style={{
              background: "rgba(15,17,23,0.85)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {/* Animation 10: breadcrumb crossfade */}
            <AnimatePresence mode="wait">
              <motion.div
                key={routeLabel}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="mono flex items-center gap-1.5"
                style={{ fontSize: 11 }}
              >
                <span style={{ color: "var(--text-4)" }}>schemapilot</span>
                <span style={{ color: "var(--text-4)" }}>/</span>
                <span style={{ color: "var(--text-3)" }}>{routeLabel}</span>
              </motion.div>
            </AnimatePresence>

            <div className="flex-1" />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCmdOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-xl px-3 py-1.5"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border-2)",
                cursor: "pointer",
                fontSize: 12,
                color: "var(--text-3)",
              }}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
              </svg>
              Quick search
              <kbd className="mono" style={{ fontSize: 9, color: "var(--text-4)", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-2)", padding: "1px 5px", borderRadius: 4 }}>⌘K</kbd>
            </motion.button>

            <div style={{ width: 1, height: 20, background: "var(--border-2)" }} />

            <div
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer select-none animate-glow-pulse"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                fontSize: 12,
                fontWeight: 800,
                color: "#fff",
              }}
            >S</div>
          </header>

          {/* Page — Animation 9: route transition */}
          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex-1 px-8 py-8"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
