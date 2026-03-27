"use client";

import { useState } from "react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export default function Home() {
  const [activeTab, setActiveTab] = useState("chat");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [bpResult, setBpResult] = useState("");

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userText = message.trim();
    setChat((prev) => [...prev, { role: "user", text: userText }]);
    setMessage("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("user_input", userText);

      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to get chat response.");
      }

      const data = await res.json();

      setChat((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.response || "No response returned.",
        },
      ]);
    } catch (error) {
      setChat((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Error connecting to backend.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const checkBP = async () => {
    if (!systolic || !diastolic) return;

    try {
      const formData = new FormData();
      formData.append("systolic", systolic);
      formData.append("diastolic", diastolic);

      const res = await fetch(`${BACKEND_URL}/bp-log`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to check blood pressure.");
      }

      const data = await res.json();
      setBpResult(data.message || "No result returned.");
    } catch (error) {
      setBpResult("Error connecting to backend.");
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f7f8",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "920px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "8px",
            fontSize: "48px",
            fontWeight: "700",
          }}
        >
          Navibot AI
        </h1>

        <p
          style={{
            textAlign: "center",
            marginBottom: "24px",
            color: "#444",
            fontSize: "24px",
          }}
        >
          NHS-style AI health assistant
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <button
            onClick={() => setActiveTab("chat")}
            style={{
              padding: "12px 20px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              background: activeTab === "chat" ? "#0070f3" : "#e5e7eb",
              color: activeTab === "chat" ? "white" : "black",
              fontSize: "18px",
            }}
          >
            Chat
          </button>

          <button
            onClick={() => setActiveTab("bp")}
            style={{
              padding: "12px 20px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              background: activeTab === "bp" ? "#0070f3" : "#e5e7eb",
              color: activeTab === "bp" ? "white" : "black",
              fontSize: "18px",
            }}
          >
            Blood Pressure
          </button>
        </div>

        {activeTab === "chat" ? (
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "14px",
              background: "white",
              padding: "16px",
            }}
          >
            <div
              style={{
                height: "420px",
                overflowY: "auto",
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "14px",
                marginBottom: "16px",
                background: "#fafafa",
              }}
            >
              {chat.length === 0 ? (
                <div style={{ color: "#777", marginTop: "8px" }}>
                  Start a conversation about your health.
                </div>
              ) : (
                chat.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent:
                        item.role === "user" ? "flex-end" : "flex-start",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "75%",
                        padding: "14px 16px",
                        borderRadius: "14px",
                        background:
                          item.role === "user" ? "#0070f3" : "#e5e7eb",
                        color: item.role === "user" ? "white" : "black",
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.5",
                        fontSize: "17px",
                      }}
                    >
                      {item.text}
                    </div>
                  </div>
                ))
              )}

              {loading && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "75%",
                      padding: "14px 16px",
                      borderRadius: "14px",
                      background: "#e5e7eb",
                      color: "black",
                      fontSize: "17px",
                    }}
                  >
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <input
                type="text"
                placeholder="Ask about your health..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  fontSize: "17px",
                }}
              />

              <button
                onClick={sendMessage}
                disabled={loading}
                style={{
                  padding: "14px 22px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#0070f3",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "17px",
                }}
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "14px",
              background: "white",
              padding: "20px",
            }}
          >
            <h2 style={{ marginBottom: "8px", fontSize: "28px" }}>
              Blood Pressure Checker
            </h2>

            <p style={{ marginBottom: "16px", color: "#444", fontSize: "18px" }}>
              Enter your blood pressure readings below.
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <input
                type="number"
                placeholder="Systolic"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  fontSize: "17px",
                }}
              />

              <input
                type="number"
                placeholder="Diastolic"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  fontSize: "17px",
                }}
              />
            </div>

            <button
              onClick={checkBP}
              style={{
                padding: "14px 22px",
                borderRadius: "10px",
                border: "none",
                background: "#0070f3",
                color: "white",
                cursor: "pointer",
                fontSize: "17px",
                marginBottom: "16px",
              }}
            >
              Check BP
            </button>

            {bpResult && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#e5e7eb",
                  fontSize: "18px",
                }}
              >
                <strong>Result:</strong>
                <p style={{ marginTop: "8px" }}>{bpResult}</p>
              </div>
            )}
          </div>
        )}

        <div
          style={{
            marginTop: "18px",
            paddingTop: "16px",
            borderTop: "1px solid #ddd",
            color: "#444",
            lineHeight: "1.6",
            fontSize: "16px",
          }}
        >
          <strong>Medical disclaimer:</strong> Navibot provides general health
          information only. It is not a diagnosis, emergency service, or
          substitute for a licensed clinician. If you have severe symptoms,
          chest pain, trouble breathing, stroke symptoms, suicidal thoughts, or
          any medical emergency, call emergency services or seek urgent medical
          care immediately.
        </div>
      </div>
    </main>
  );
}