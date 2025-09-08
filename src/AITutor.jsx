// src/AITutor.jsx
import React, { useState } from "react";

/**
 * Props:
 *  - chapterId: "eemh103"
 *  - chapterTitle: human title for the chapter (optional)
 *  - ragUrl: e.g. "http://localhost:5001/rag"
 *  - tokensLeft: number
 *  - onUseToken: () => void
 */
export default function AITutor({
  chapterId,
  chapterTitle,
  ragUrl = "http://localhost:5001/rag",
  tokensLeft = 3,
  onUseToken,
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);

  const friendlyChapter = (srcPath) => {
    // try to infer chapter code from file name e.g., ".../uploads/eemh103.pdf"
    if (chapterTitle) return chapterTitle;
    try {
      const file = (srcPath || "").split("/").pop() || "";
      const id = file.replace(/\.pdf$/i, "");
      return id || chapterId || "Chapter";
    } catch {
      return chapterId || "Chapter";
    }
  };

  const nicePreview = (s) =>
    (s || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180) + ((s || "").length > 180 ? "…" : "");

  async function ask() {
    setErr("");
    setAnswer("");
    setSources([]);
    if (!q.trim()) {
      setErr("Please enter a question.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(ragUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapter: chapterId, question: q.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErr(data?.error || "Request failed.");
      } else {
        setAnswer(data?.answer || "");
        setSources(Array.isArray(data?.sources) ? data.sources : []);
        onUseToken?.();
      }
    } catch (e) {
      setErr("Could not reach the tutor service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel mt-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="section-title m-0">AI Tutor</div>
        <span className="badge bg-secondary">Tokens: {tokensLeft}</span>
      </div>

      <div className="mb-2">
        <textarea
          className="form-control"
          rows={3}
          placeholder="Ask a question about this chapter…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <button
        className="btn btn-primary"
        onClick={ask}
        disabled={loading || !q.trim() || tokensLeft <= 0}
      >
        {loading ? "Thinking…" : "Ask"}
      </button>

      {err && (
        <div className="alert alert-danger mt-3" role="alert">
          {err}
        </div>
      )}

      {(answer || (sources && sources.length)) && (
        <div className="mt-4">
          {answer && (
            <>
              <div className="h6 mb-2">Answer</div>
              <div className="ai-answer">{answer}</div>
            </>
          )}

          {sources?.length > 0 && (
            <div className="mt-3">
              <div className="h6 mb-2">Related Material</div>
              <ul className="related-list">
                {sources.map((s, i) => {
                  const chapLabel = friendlyChapter(s.source);
                  const page =
                    typeof s.page === "number" && s.page > 0 ? `p.${s.page}` : null;
                  return (
                    <li key={i} className="related-item">
                      <div className="related-title">
                        <span className="badge bg-dark-subtle text-dark me-2">
                          {chapLabel}
                        </span>
                        {page && <span className="text-muted">{page}</span>}
                      </div>
                      <div className="related-preview">{nicePreview(s.preview)}</div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
