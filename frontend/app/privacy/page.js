"use client";

import { useEffect, useState } from "react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

const riskColors = {
  HIGH: { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
  MEDIUM: { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  LOW: { bg: "#DCFCE7", text: "#166534", border: "#86EFAC" },
  unknown: { bg: "#E5E7EB", text: "#374151", border: "#D1D5DB" },
};

const sampleQuestions = [
  "I have tummy ache. How can I be seen by a doctor?",
  "My heart is racing. Where can I get my blood pressure checked?",
  "I just arrived in the UK and don’t know where to go if I’m sick.",
  "I ran out of my regular medicine. What should I do?",
];

function SectionCard({ children, style = {} }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.65)",
        borderRadius: "28px",
        boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function RiskBadge({ risk }) {
  const style = riskColors[risk] || riskColors.unknown;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "7px 11px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        background: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
      }}
    >
      Risk: {risk || "unknown"}
    </span>
  );
}

function TopicBadge({ topic }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "7px 11px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        background: "#EFF6FF",
        color: "#1D4ED8",
        border: "1px solid #BFDBFE",
      }}
    >
      Topic: {topic || "unknown"}
    </span>
  );
}

function parseStructuredResponse(text) {
  if (!text || typeof text !== "string") return null;

  const titles = [
    "What may help now:",
    "Best place to go:",
    "Go urgently now if:",
    "Next steps:",
  ];

  const found = titles
    .map((title) => ({ title, index: text.indexOf(title) }))
    .filter((item) => item.index !== -1)
    .sort((a, b) => a.index - b.index);

  if (found.length < 3) return null;

  const sections = {};
  for (let i = 0; i < found.length; i++) {
    const current = found[i];
    const next = found[i + 1];
    const start = current.index + current.title.length;
    const end = next ? next.index : text.length;
    sections[current.title] = text.slice(start, end).trim();
  }

  return {
    helpNow: sections["What may help now:"] || "",
    bestPlace: sections["Best place to go:"] || "",
    urgent: sections["Go urgently now if:"] || "",
    nextSteps: sections["Next steps:"] || "",
  };
}

function StructuredSection({ title, content, icon, bg, border }) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div
      style={{
        border: `1px solid ${border}`,
        background: bg,
        borderRadius: "18px",
        padding: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          fontWeight: 800,
          marginBottom: "10px",
          color: "#111827",
        }}
      >
        <span>{icon}</span>
        <span>{title}</span>
      </div>

      <ul style={{ margin: 0, paddingLeft: "18px", lineHeight: 1.7, color: "#1F2937" }}>
        {lines.map((line, idx) => (
          <li key={idx}>{line.replace(/^[-•]\s*/, "")}</li>
        ))}
      </ul>
    </div>
  );
}

function renderAssistantContent(text) {
  const parsed = parseStructuredResponse(text);

  if (!parsed) {
    return (
      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.75, fontSize: "16px" }}>
        {text}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {parsed.helpNow && (
        <StructuredSection
          title="What may help now"
          content={parsed.helpNow}
          icon="🩺"
          bg="#F8FAFC"
          border="#E5E7EB"
        />
      )}
      {parsed.bestPlace && (
        <StructuredSection
          title="Best place to go"
          content={parsed.bestPlace}
          icon="📍"
          bg="#EFF6FF"
          border="#BFDBFE"
        />
      )}
      {parsed.urgent && (
        <StructuredSection
          title="Go urgently now if"
          content={parsed.urgent}
          icon="🚨"
          bg="#FEF2F2"
          border="#FECACA"
        />
      )}
      {parsed.nextSteps && (
        <StructuredSection
          title="Next steps"
          content={parsed.nextSteps}
          icon="✅"
          bg="#F0FDF4"
          border="#BBF7D0"
        />
      )}
    </div>
  );
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([
    {
      role: "assistant",
      text:
        "Hi — I can help you understand where to go for healthcare in the UK.\n\nYou can ask things like:\n- I have tummy ache. How can I be seen today?\n- My heart is racing. Where can I get my blood pressure checked?\n- I just arrived in the UK and don’t know where to go if I’m sick.",
      topic: "general_navigation",
      risk: "LOW",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 980);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const sendMessageWithText = async (text) => {
    if (!text.trim() || loading) return;

    const userText = text.trim();
    setMessage("");
    setChat((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userText }),
      });

      const data = await res.json();

      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.response || "Sorry, I could not generate a response.",
          topic: data.topic || "unknown",
          risk: data.risk || "unknown",
          originalUserInput: userText,
        },
      ]);
    } catch {
      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Error connecting to backend.",
          topic: "unknown",
          risk: "unknown",
          originalUserInput: userText,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    await sendMessageWithText(message);
  };

  const joinWaitlist = async () => {
    setWaitlistStatus("");

    if (!email.trim()) {
      setWaitlistStatus("Please enter your email first.");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/waitlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setWaitlistStatus(data.message || "Waitlist updated.");

      if (data.status === "ok") {
        setEmail("");
      }
    } catch {
      setWaitlistStatus("Could not join the waitlist.");
    }
  };

  const handleEnter = (e) => {
    if (e.key === "Enter" && !isMobile) {
      sendMessage();
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, #DBEAFE 0%, #EFF6FF 26%, #F8FAFC 54%, #FFFFFF 100%)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: isMobile ? "20px 12px 40px" : "28px 20px 60px",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            marginBottom: isMobile ? "24px" : "34px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                color: "#FFFFFF",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                fontSize: "20px",
                boxShadow: "0 12px 30px rgba(37, 99, 235, 0.25)",
              }}
            >
              N
            </div>

            <div>
              <div style={{ fontWeight: 800, fontSize: "18px", color: "#0F172A" }}>
                Navibot AI
              </div>
              <div style={{ fontSize: "13px", color: "#64748B" }}>
                UK healthcare navigation assistant
              </div>
            </div>
          </div>

          <nav style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a href="/" style={navLinkStyle}>Home</a>
            <a href="/about" style={navLinkStyle}>About</a>
            <a href="/privacy" style={navLinkStyle}>Privacy</a>
            <a href="/contact" style={navLinkStyle}>Contact</a>
            <a href="/admin" style={navLinkStyle}>Admin</a>
          </nav>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.05fr 0.95fr",
            gap: "22px",
            alignItems: "stretch",
            marginBottom: "24px",
          }}
        >
          <SectionCard style={{ padding: isMobile ? "24px" : "34px" }}>
            <div
              style={{
                display: "inline-flex",
                padding: "8px 14px",
                borderRadius: "999px",
                background: "#DBEAFE",
                color: "#1D4ED8",
                fontSize: "12px",
                fontWeight: 800,
                marginBottom: "18px",
              }}
            >
              Plain-language UK care guidance
            </div>

            <h1
              style={{
                margin: "0 0 14px",
                fontSize: isMobile ? "42px" : "66px",
                lineHeight: 1.02,
                fontWeight: 800,
                letterSpacing: isMobile ? "-1.5px" : "-2px",
                color: "#0F172A",
              }}
            >
              Get help finding the right healthcare path in the UK
            </h1>

            <p
              style={{
                margin: "0 0 22px",
                fontSize: isMobile ? "18px" : "22px",
                color: "#475569",
                lineHeight: 1.55,
                maxWidth: "740px",
              }}
            >
              Navibot helps people explain symptoms in everyday language and understand where to go next — such as pharmacy, GP, NHS 111, or urgent care.
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
              {sampleQuestions.slice(0, 2).map((q) => (
                <button key={q} onClick={() => sendMessageWithText(q)} style={secondaryButtonStyle}>
                  {q}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard style={{ padding: isMobile ? "20px" : "26px" }}>
            <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "16px", color: "#111827" }}>
              Common questions people ask
            </div>

            <div style={{ display: "grid", gap: "12px", marginBottom: "18px" }}>
              {sampleQuestions.map((item) => (
                <button key={item} onClick={() => sendMessageWithText(item)} style={questionButtonStyle}>
                  {item}
                </button>
              ))}
            </div>
          </SectionCard>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 360px",
            gap: "22px",
            alignItems: "start",
          }}
        >
          <SectionCard style={{ padding: "22px" }}>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#111827", marginBottom: "4px" }}>
                Chat with Navibot
              </div>
              <div style={{ fontSize: "14px", color: "#6B7280" }}>
                Ask in your own words. You do not need NHS language first.
              </div>
            </div>

            <div
              style={{
                minHeight: isMobile ? "420px" : "640px",
                maxHeight: isMobile ? "480px" : "640px",
                overflowY: "auto",
                border: "1px solid #E5E7EB",
                borderRadius: "24px",
                background: "linear-gradient(180deg, #F8FAFC 0%, #F3F4F6 100%)",
                padding: isMobile ? "14px" : "18px",
              }}
            >
              <div style={{ display: "grid", gap: "16px" }}>
                {chat.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: item.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: isMobile ? "94%" : "82%",
                        borderRadius: "22px",
                        padding: isMobile ? "16px" : "18px 20px",
                        background: item.role === "user" ? "#2563EB" : "#FFFFFF",
                        color: item.role === "user" ? "#FFFFFF" : "#111827",
                        boxShadow:
                          item.role === "user"
                            ? "0 10px 28px rgba(37, 99, 235, 0.22)"
                            : "0 8px 22px rgba(15, 23, 42, 0.04)",
                        border: item.role === "assistant" ? "1px solid #E5E7EB" : "none",
                      }}
                    >
                      {item.role === "assistant" ? (
                        renderAssistantContent(item.text)
                      ) : (
                        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.75, fontSize: isMobile ? "16px" : "17px" }}>
                          {item.text}
                        </div>
                      )}

                      {item.role === "assistant" && (
                        <div style={{ marginTop: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <TopicBadge topic={item.topic} />
                          <RiskBadge risk={item.risk} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div
                      style={{
                        maxWidth: isMobile ? "94%" : "82%",
                        borderRadius: "22px",
                        padding: isMobile ? "16px" : "18px 20px",
                        background: "#FFFFFF",
                        color: "#111827",
                        border: "1px solid #E5E7EB",
                      }}
                    >
                      Thinking...
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 130px",
                gap: "12px",
                marginTop: "16px",
                alignItems: "center",
              }}
            >
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleEnter}
                placeholder="Ask in your own words..."
                style={{
                  width: "100%",
                  padding: isMobile ? "16px" : "18px",
                  borderRadius: "18px",
                  border: "1px solid #D1D5DB",
                  fontSize: isMobile ? "16px" : "17px",
                  outline: "none",
                  background: "#FFFFFF",
                }}
              />

              <button onClick={sendMessage} disabled={loading} style={primaryButtonStyle}>
                Send
              </button>
            </div>
          </SectionCard>

          <div style={{ display: "grid", gap: "22px" }}>
            <SectionCard style={{ padding: "20px" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#111827", marginBottom: "10px" }}>
                Join waitlist
              </div>

              <p style={{ margin: "0 0 12px", fontSize: "14px", lineHeight: 1.7, color: "#4B5563" }}>
                Leave your email to get updates when Navibot is live publicly.
              </p>

              <div style={{ display: "grid", gap: "10px" }}>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  style={{
                    width: "100%",
                    padding: "14px 14px",
                    borderRadius: "14px",
                    border: "1px solid #D1D5DB",
                    fontSize: "15px",
                    outline: "none",
                    background: "#FFFFFF",
                  }}
                />

                <button onClick={joinWaitlist} style={darkButtonStyle}>
                  Join waitlist
                </button>
              </div>

              {waitlistStatus && (
                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "14px",
                    color: "#166534",
                    background: "#DCFCE7",
                    border: "1px solid #86EFAC",
                    padding: "11px 13px",
                    borderRadius: "12px",
                  }}
                >
                  {waitlistStatus}
                </div>
              )}
            </SectionCard>

            <SectionCard style={{ padding: "20px" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#111827", marginBottom: "10px" }}>
                Safety note
              </div>

              <div style={{ fontSize: "14px", lineHeight: 1.8, color: "#4B5563" }}>
                Navibot provides general health information only. It is not a diagnosis or emergency medical service.
                If you have severe symptoms, chest pain, stroke symptoms, difficulty breathing, or any emergency,
                seek urgent care immediately.
              </div>
            </SectionCard>
          </div>
        </section>
      </div>
    </main>
  );
}

const navLinkStyle = {
  padding: "10px 14px",
  borderRadius: "12px",
  textDecoration: "none",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  color: "#111827",
  fontWeight: 700,
};

const primaryButtonStyle = {
  width: "100%",
  padding: "18px 20px",
  borderRadius: "18px",
  border: "none",
  background: "#2563EB",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(37, 99, 235, 0.22)",
};

const secondaryButtonStyle = {
  padding: "14px 18px",
  borderRadius: "16px",
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#111827",
  fontWeight: 800,
  fontSize: "15px",
  cursor: "pointer",
};

const darkButtonStyle = {
  padding: "14px 16px",
  borderRadius: "14px",
  border: "none",
  background: "#0F172A",
  color: "#FFFFFF",
  fontWeight: 800,
  fontSize: "15px",
  cursor: "pointer",
};

const questionButtonStyle = {
  width: "100%",
  textAlign: "left",
  padding: "14px 16px",
  borderRadius: "16px",
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
  cursor: "pointer",
  fontSize: "15px",
  lineHeight: 1.45,
  color: "#111827",
};