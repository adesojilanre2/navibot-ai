"use client";

import { useEffect, useMemo, useState } from "react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

const ADMIN_PASSWORD =
  process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "navibot123";

export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("navibot_admin_authed");
    if (saved === "true") {
      setIsAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthed) {
      fetchAnalytics();
    }
  }, [isAuthed, selectedTopic, selectedRisk]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("topic", selectedTopic);
    params.set("risk", selectedRisk);
    params.set("search", search);
    return params.toString();
  }, [selectedTopic, selectedRisk, search]);

  const login = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthed(true);
      setError("");
      window.localStorage.setItem("navibot_admin_authed", "true");
    } else {
      setError("Wrong password.");
    }
  };

  const logout = () => {
    setIsAuthed(false);
    window.localStorage.removeItem("navibot_admin_authed");
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/analytics?${queryString}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    window.open(`${BACKEND_URL}/export?${queryString}`, "_blank");
  };

  if (!isAuthed) {
    return (
      <main style={styles.page}>
        <div style={styles.loginCard}>
          <div style={styles.badge}>Navibot analytics</div>
          <h1 style={styles.title}>Admin login</h1>
          <p style={styles.subtext}>
            Enter the admin password to view interactions, risks, feedback, and exports.
          </p>

          <div style={styles.formGroup}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              style={styles.input}
              onKeyDown={(e) => {
                if (e.key === "Enter") login();
              }}
            />
            <button onClick={login} style={styles.primaryButton}>
              Enter dashboard
            </button>
          </div>

          {error && <div style={styles.error}>{error}</div>}
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topRow}>
          <div>
            <div style={styles.badge}>Navibot analytics</div>
            <h1 style={styles.title}>Admin dashboard</h1>
            <p style={styles.subtext}>
              View interactions, risks, feedback, and recent user questions.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="/" style={styles.ghostButton}>Home</a>
            <button onClick={logout} style={styles.ghostButton}>Logout</button>
          </div>
        </div>

        <div style={styles.filtersCard}>
          <div style={styles.filterGrid}>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              style={styles.input}
            >
              <option value="all">All topics</option>
              {(data?.filters?.topics || []).map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>

            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              style={styles.input}
            >
              <option value="all">All risks</option>
              {(data?.filters?.risks || []).map((risk) => (
                <option key={risk} value={risk}>{risk}</option>
              ))}
            </select>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search question text"
              style={styles.input}
            />

            <button onClick={fetchAnalytics} style={styles.primaryButton}>
              Refresh analytics
            </button>

            <button onClick={exportCsv} style={styles.successButton}>
              ⬇ Download CSV
            </button>
          </div>
        </div>

        {loading && <div style={styles.notice}>Loading analytics...</div>}

        {!loading && !data && (
          <div style={styles.notice}>Could not load analytics.</div>
        )}

        {!loading && data && (
          <>
            <div style={styles.metricsGrid}>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Total interactions</div>
                <div style={styles.metricValue}>{data.totals?.interactions ?? 0}</div>
              </div>

              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Total feedback</div>
                <div style={styles.metricValue}>{data.totals?.feedback ?? 0}</div>
              </div>

              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Waitlist emails</div>
                <div style={styles.metricValue}>{data.totals?.waitlist ?? 0}</div>
              </div>
            </div>

            <div style={styles.threeGrid}>
              <div style={styles.panelCard}>
                <h3 style={styles.panelTitle}>Topic counts</h3>
                {Object.keys(data.topic_counts || {}).length === 0 ? (
                  <div style={styles.emptyText}>No data yet.</div>
                ) : (
                  Object.entries(data.topic_counts).map(([key, value]) => (
                    <div key={key} style={styles.rowPill}>
                      <span>{key}</span>
                      <strong>{value}</strong>
                    </div>
                  ))
                )}
              </div>

              <div style={styles.panelCard}>
                <h3 style={styles.panelTitle}>Risk counts</h3>
                {Object.keys(data.risk_counts || {}).length === 0 ? (
                  <div style={styles.emptyText}>No data yet.</div>
                ) : (
                  Object.entries(data.risk_counts).map(([key, value]) => (
                    <div key={key} style={styles.rowPill}>
                      <span>{key}</span>
                      <strong>{value}</strong>
                    </div>
                  ))
                )}
              </div>

              <div style={styles.panelCard}>
                <h3 style={styles.panelTitle}>Feedback counts</h3>
                {Object.keys(data.feedback_counts || {}).length === 0 ? (
                  <div style={styles.emptyText}>No data yet.</div>
                ) : (
                  Object.entries(data.feedback_counts).map(([key, value]) => (
                    <div key={key} style={styles.rowPill}>
                      <span>{key}</span>
                      <strong>{value}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={styles.panelCard}>
              <h3 style={styles.panelTitle}>Recent questions</h3>
              {(data.recent_questions || []).length === 0 ? (
                <div style={styles.emptyText}>No recent questions yet.</div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {data.recent_questions.map((item, index) => (
                    <div key={index} style={styles.questionCard}>
                      <div style={styles.questionMeta}>{item.timestamp}</div>
                      <div style={styles.questionText}>{item.user_input}</div>
                      <div style={styles.metaRow}>
                        <span style={styles.topicBadge}>Topic: {item.topic}</span>
                        <span style={styles.riskBadge}>Risk: {item.risk}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #EAF2FF 0%, #F8FAFC 38%, #FFFFFF 100%)",
    padding: "32px 16px",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: "#111827",
  },
  container: {
    maxWidth: "1180px",
    margin: "0 auto",
    display: "grid",
    gap: 22,
  },
  loginCard: {
    maxWidth: "520px",
    margin: "60px auto",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(255,255,255,0.7)",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-flex",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "#DBEAFE",
    color: "#1D4ED8",
    fontSize: "12px",
    fontWeight: 800,
    marginBottom: "12px",
  },
  title: {
    fontSize: "40px",
    fontWeight: 800,
    margin: "0 0 10px",
  },
  subtext: {
    color: "#475569",
    fontSize: "16px",
    lineHeight: 1.7,
    margin: 0,
  },
  filtersCard: {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(255,255,255,0.7)",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },
  metricCard: {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(255,255,255,0.7)",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
  },
  metricLabel: {
    color: "#64748B",
    fontWeight: 700,
    fontSize: "14px",
    marginBottom: "8px",
  },
  metricValue: {
    fontSize: "42px",
    fontWeight: 800,
    color: "#0F172A",
  },
  threeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
  },
  panelCard: {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(255,255,255,0.7)",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
  },
  panelTitle: {
    fontSize: "18px",
    fontWeight: 800,
    margin: "0 0 14px",
  },
  rowPill: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    borderRadius: "16px",
    background: "#F8FAFC",
    border: "1px solid #E5E7EB",
    marginBottom: "10px",
  },
  questionCard: {
    padding: "16px",
    borderRadius: "18px",
    background: "#F8FAFC",
    border: "1px solid #E5E7EB",
  },
  questionMeta: {
    fontSize: "12px",
    color: "#64748B",
    marginBottom: "8px",
  },
  questionText: {
    fontSize: "16px",
    color: "#111827",
    lineHeight: 1.6,
    marginBottom: "10px",
  },
  metaRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  topicBadge: {
    display: "inline-flex",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    background: "#EFF6FF",
    color: "#1D4ED8",
    border: "1px solid #BFDBFE",
  },
  riskBadge: {
    display: "inline-flex",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    background: "#DCFCE7",
    color: "#166534",
    border: "1px solid #86EFAC",
  },
  input: {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid #D1D5DB",
    fontSize: "15px",
    background: "#FFFFFF",
    outline: "none",
  },
  primaryButton: {
    padding: "14px 16px",
    borderRadius: "14px",
    border: "none",
    background: "#2563EB",
    color: "#FFFFFF",
    fontWeight: 800,
    fontSize: "15px",
    cursor: "pointer",
  },
  successButton: {
    padding: "14px 16px",
    borderRadius: "14px",
    border: "none",
    background: "#16A34A",
    color: "#FFFFFF",
    fontWeight: 800,
    fontSize: "15px",
    cursor: "pointer",
  },
  ghostButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 14px",
    borderRadius: "14px",
    textDecoration: "none",
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    color: "#111827",
    fontWeight: 700,
    cursor: "pointer",
  },
  notice: {
    padding: "14px 16px",
    borderRadius: "14px",
    background: "#F8FAFC",
    border: "1px solid #E5E7EB",
    color: "#475569",
  },
  formGroup: {
    display: "grid",
    gap: 12,
    marginTop: 16,
  },
  error: {
    marginTop: 12,
    color: "#991B1B",
    background: "#FEE2E2",
    border: "1px solid #FCA5A5",
    borderRadius: "12px",
    padding: "10px 12px",
    fontSize: "14px",
  },
  emptyText: {
    color: "#64748B",
    fontSize: "15px",
  },
};