import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api, QUERY_KEYS } from "../api/client";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: endpoints = [] } = useQuery({
    queryKey: QUERY_KEYS.endpoints,
    queryFn: api.endpoints.list,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      setQuery("");
      setSelected(0);
      inputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const epResults = useMemo(
    () =>
      endpoints.filter(
        (e) =>
          !query ||
          e.name.toLowerCase().includes(query.toLowerCase()) ||
          e.provider.toLowerCase().includes(query.toLowerCase()),
      ),
    [endpoints, query],
  );

  const actions = useMemo(
    () => [
      ...(query === "" || "dashboard".includes(query.toLowerCase())
        ? [{ type: "action" as const, icon: "⊞", label: "Go to Dashboard", sub: "", action: () => navigate("/") }]
        : []),
      ...(query === "" || "diffs".includes(query.toLowerCase())
        ? [{ type: "action" as const, icon: "⊟", label: "Recent Diffs", sub: "", action: () => navigate("/diffs") }]
        : []),
      ...epResults.map((ep) => ({
        type: "endpoint" as const,
        icon: ep.latest_snapshot_hash ? "●" : "○",
        label: ep.name,
        sub: ep.provider,
        action: () => navigate(`/endpoints/${ep.id}`),
      })),
    ],
    [epResults, navigate, query],
  );

  const go = useCallback(
    (i: number) => {
      if (actions[i]) {
        actions[i].action();
        onClose();
      }
    },
    [actions, onClose],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, actions.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        go(selected);
      }
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [actions, go, onClose, open, selected]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] px-4 pointer-events-none">
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.96, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="card w-full max-w-[520px] overflow-hidden pointer-events-auto shadow-2xl"
              style={{ boxShadow: "0 0 0 1px rgba(99,102,241,0.2), 0 32px 80px -8px rgba(0,0,0,0.9), 0 0 60px rgba(99,102,241,0.08)" }}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--text-3)" strokeWidth={2.2} className="flex-shrink-0">
                  <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search endpoints, navigate…"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelected(0); }}
                  style={{ flex: 1, background: "transparent", fontSize: 13, color: "var(--text-1)", outline: "none", border: "none" }}
                  placeholder-style={{ color: "var(--text-3)" }}
                />
                <kbd style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 10, color: "var(--text-3)", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-2)", padding: "2px 6px", borderRadius: 4 }}>ESC</kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto">
                {actions.length === 0 ? (
                  <div className="px-4 py-8 text-center caption">No results for "{query}"</div>
                ) : (
                  <div className="py-1.5">
                    {actions.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all duration-100"
                        style={{ background: selected === i ? "rgba(99,102,241,0.12)" : "transparent" }}
                        onMouseEnter={() => setSelected(i)}
                        onClick={() => go(i)}
                      >
                        <span style={{ fontSize: 14, flexShrink: 0, color: item.type === "endpoint" ? (item.icon === "●" ? "#86efac" : "var(--text-3)") : "var(--indigo-light)" }}>
                          {item.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>{item.label}</span>
                          {item.sub && <span style={{ marginLeft: 8, fontSize: 11, color: "var(--text-3)" }}>{item.sub}</span>}
                        </div>
                        {selected === i && (
                          <kbd style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 10, color: "var(--indigo-light)", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)", padding: "1px 5px", borderRadius: 4 }}>↵</kbd>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 flex items-center gap-4" style={{ borderTop: "1px solid var(--border)" }}>
                {[["↑↓", "navigate"], ["↵", "open"], ["ESC", "close"]].map(([k, l]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <kbd style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, color: "var(--text-3)", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-2)", padding: "1px 5px", borderRadius: 4 }}>{k}</kbd>
                    <span className="caption">{l}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
