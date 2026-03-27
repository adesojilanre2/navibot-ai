"use client";

import { useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Home() {
  const [mode, setMode] = useState("chat");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [bpResult, setBpResult] = useState("");

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMsg = { role: "user", text: message };
    setChat((prev) => [...prev, userMsg]);

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("user_input", message);

    try {
      const res = await fetch(`${BACKEND_URL}/triage`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      const aiMsg = {
        role: "ai",
        text: `Risk Level: ${data.risk_level}\n\nAdvice: ${data.advice}`,
      };

      setChat((prev) => [...prev, aiMsg]);
    } catch (err) {
      setChat((prev) => [
        ...prev,
        { role: "ai", text: "Error connecting to backend." },
      ]);
    }

    setLoading(false);
  };

  const checkBP = async () => {
    if (!systolic || !diastolic) {
      setBpResult("Please enter both systolic and diastolic values.");
      return;
    }

    const formData = new FormData();
    formData.append("systolic", systolic);
    formData.append("diastolic", diastolic);

    try {
      const res = await fetch(`${BACKEND_URL}/bp-log`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setBpResult(data.message || "No result returned.");
    } catch (err) {
      setBpResult("Error checking blood pressure.");
    }
  };

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "5px" }}>Navibot AI</h1>
      <p style={{ textAlign: "center", marginTop: "0", color: "#444" }}>
        NHS-style AI health assistant
      </p>

      <div style={{ textAlign: "center", marginTop: "15px", marginBottom: "20px" }}>
        <button
          onClick={() => setMode("chat")}
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            border: "none",
            background: mode === "chat" ? "#007bff" : "#ddd",
            color: mode === "chat" ? "white" : "black",
            cursor: "pointer",
          }}
        >
          Chat
        </button>

        <button
          onClick={() => setMode("bp")}
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            border: "none",
            background: mode === "bp" ? "#007bff" : "#ddd",
            color: mode === "bp" ? "white" : "black",
            cursor: "pointer",
            marginLeft: "10px",
          }}
        >
          Blood Pressure
        </button>
      </div>

      {mode === "chat" ? (
        <>
          <div
            style={{
              marginTop: "20px",
              minHeight: "400px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "15px",
              background: "#fafafa",
            }}
          >
            {chat.map((msg, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "12px",
                  textAlign: msg.role === "user" ? "right" : "left",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    background: msg.role === "user" ? "#007bff" : "#e5e5ea",
                    color: msg.role === "user" ? "white" : "black",
                    maxWidth: "70%",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && <p>Thinking...</p>}
          </div>

          <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about your health..."
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            />

            <button
              onClick={sendMessage}
              style={{
                padding: "12px 20px",
                borderRadius: "8px",
                border: "none",
                background: "#007bff",
                color: "white",
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        </>
      ) : (
        <div
          style={{
            marginTop: "20px",
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "20px",
            background: "#fafafa",
          }}
        >
          <h2>Blood Pressure Checker</h2>
          <p>Enter your blood pressure readings below.</p>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "15px" }}>
            <input
              type="number"
              placeholder="Systolic (e.g. 120)"
              value={systolic}
              onChange={(e) => setSystolic(e.target.value)}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                width: "220px",
              }}
            />

            <input
              type="number"
              placeholder="Diastolic (e.g. 80)"
              value={diastolic}
              onChange={(e) => setDiastolic(e.target.value)}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                width: "220px",
              }}
            />
          </div>

          <button
            onClick={checkBP}
            style={{
              marginTop: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#007bff",
              color: "white",
              cursor: "pointer",
            }}
          >
            Check BP
          </button>

          {bpResult && (
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                borderRadius: "8px",
                background: "#e5e5ea",
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
          marginTop: "25px",
          paddingTop: "15px",
          borderTop: "1px solid #ddd",
          fontSize: "14px",
          color: "#555",
          lineHeight: "1.5",
        }}
      >
        <strong>Medical disclaimer:</strong> Navibot provides general health
        information only. It is not a diagnosis, emergency service, or substitute
        for a licensed clinician. If you have severe symptoms, chest pain, trouble
        breathing, stroke symptoms, suicidal thoughts, or any medical emergency,
        call emergency services or seek urgent medical care immediately.
      </div>
    </main>
  );
}