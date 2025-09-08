// src/LLMHelp.jsx
import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

export default function LLMHelp({ chapterId, tokensLeft, onUseToken }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAsk = async () => {
    setLoading(true);
    setError("");
    setAnswer(null);

    try {
      const resp = await fetch("/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, chapter: chapterId }),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const data = await resp.json();
      setAnswer(data.answer ?? "");
      // decrement token via callback (NOT a React hook)
      if (onUseToken) onUseToken();
    } catch (e) {
      setError("LLM service is not available right now.");
    } finally {
      setLoading(false);
    }
  };

  if (tokensLeft <= 0) {
    return (
      <div className="alert alert-warning text-center mt-3">
        You have used all your AI Help tokens for this chapter.
      </div>
    );
  }

  return (
    <div className="border rounded p-3 mt-4 bg-light">
      <div className="mb-2 d-flex align-items-center gap-2">
        <b>Ask the AI Tutor</b>
        <span className="badge bg-info">{tokensLeft} left</span>
      </div>

      <input
        type="text"
        className="form-control mb-2"
        placeholder="Type your math question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        disabled={loading}
      />

      <button
        className="btn btn-warning"
        onClick={handleAsk}
        disabled={!question.trim() || loading}
      >
        {loading ? "Asking..." : "Ask AI"}
      </button>

      {error && <div className="alert alert-danger mt-2">{error}</div>}

      {answer && (
        <div className="alert alert-success mt-3" style={{ whiteSpace: "pre-wrap" }}>
          <b>AI:</b> {answer}
        </div>
      )}
    </div>
  );
}
