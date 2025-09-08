// src/ChapterRunner.jsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchChapter } from "./api";

function SummaryView({ data, onDone }) {
  return (
    <div className="sheet">
      <div className="section-title">{data.title}</div>
      {data.learning_points.map((p, i) => (
        <div key={i} className="summary-block">
          <ul className="summary-bullet"><li>{p}</li></ul>
        </div>
      ))}
      <button className="btn btn-success mt-3" onClick={onDone}>Done</button>
    </div>
  );
}

function makeOptions(answer) {
  const n = Number(String(answer).replace(/[^\d.-]/g, ""));
  if (Number.isFinite(n)) {
    const unit = String(answer).match(/[^\d.-]+$/)?.[0] || "";
    const s = new Set([String(answer)]);
    while (s.size < 3) {
      const delta = Math.floor(Math.random() * 10 - 5);
      s.add(String(n + delta) + unit);
    }
    return Array.from(s).sort(() => Math.random() - 0.5);
  }
  const pool = ["Yes", "No", "Triangle", "Square", "Rectangle", "Circle", "Maybe"];
  const s = new Set([String(answer)]);
  while (s.size < 3) s.add(pool[Math.floor(Math.random() * pool.length)]);
  return Array.from(s).sort(() => Math.random() - 0.5);
}

function MCQBlock({ title, items, onFinish, bigTitle=false, showCheck=true }) {
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);

  const prepared = useMemo(() => items.map(q => {
    const opts = makeOptions(q.answer);
    if (!opts.includes(q.answer)) {
      opts[Math.floor(Math.random()*opts.length)] = q.answer;
    }
    return { ...q, options: opts.sort(() => Math.random() - 0.5) };
  }), [items]);

  const heading = bigTitle ? "qa-title" : "section-title";

  return (
    <div className="sheet">
      <div className={heading}>{title}</div>
      <div className="panel">
        {prepared.map((q, i) => (
          <div className="q-item" key={i}>
            <b>{i + 1}. {q.question}</b>
            <div className="q-options mt-2">
              {q.options.map((o, j) => (
                <label key={j}>
                  <input
                    type="radio"
                    name={`q${i}`}
                    checked={answers[i] === o}
                    onChange={() => setAnswers(a => ({ ...a, [i]: o }))}
                  />
                  {String.fromCharCode(65 + j)}. {o}
                </label>
              ))}
            </div>
          </div>
        ))}

        {score == null ? (
          <button
            className="btn btn-primary"
            disabled={Object.keys(answers).length < prepared.length}
            onClick={() => {
              const s = prepared.reduce((acc, q, idx) => acc + (answers[idx] === q.answer ? 1 : 0), 0);
              setScore(s);
              onFinish?.(s, prepared.length);
            }}
          >
            {showCheck ? "Check Answers" : "Submit Assessment"}
          </button>
        ) : (
          <div className="mt-3 fs-5">Score: {score} / {prepared.length}</div>
        )}
      </div>
    </div>
  );
}

const LEVELS = ["novice", "intermediate", "advanced"];

export default function ChapterRunner({ id, onFinished }) {
  const [data, setData] = useState(null);
  const [phase, setPhase] = useState("summary"); // summary → baseline → quiz
  const [levelIdx, setLevelIdx] = useState(0);

  useEffect(() => { (async () => setData(await fetchChapter(id)))(); }, [id]);

  // === SPLIT 12 QUESTIONS INTO 3×4 ON THE FLY (no backend, no heuristics) ===
  const buckets = useMemo(() => {
    const src = Array.isArray(data?.quiz) ? data.quiz.slice(0, 12) : [];
    const b = { novice: [], intermediate: [], advanced: [] };
    const order = ["novice", "intermediate", "advanced"];
    src.forEach((q, i) => b[order[i % 3]].push(q));
    // cap each to 4 just in case
    Object.keys(b).forEach(k => b[k] = b[k].slice(0, 4));
    return b;
  }, [data]);

  if (!data) return <div className="container mt-4">Loading…</div>;

  // Turn baseline strings into MCQs like your screenshot (Y/N questions)
  const baselineItems = useMemo(() => {
    return (data.baseline_assessment || []).map(s => {
      const yn = /yes$/i.test(s) ? "Yes" : /no$/i.test(s) ? "No" : "Yes";
      return { question: s.replace(/\s*(yes|no)\s*$/i, "").trim(), answer: yn };
    });
  }, [data]);

  const currentLevel = LEVELS[levelIdx];

  return (
    <div>
      {phase === "summary" && (
        <SummaryView data={data} onDone={() => setPhase("baseline")} />
      )}

      {phase === "baseline" && (
        <MCQBlock
          bigTitle
          title="Baseline Assessment"
          items={baselineItems}
          onFinish={() => setPhase("quiz")}
          showCheck={false}
        />
      )}

      {phase === "quiz" && (
        <div className="sheet">
          <MCQBlock
            title={`${currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)} Quiz`}
            items={buckets[currentLevel] || []}
            onFinish={(score, total) => {
              // pass gate = 80%
              if (score / total >= 0.8 && levelIdx < LEVELS.length - 1) {
                setLevelIdx(levelIdx + 1);
              } else if (score / total >= 0.8 && levelIdx === LEVELS.length - 1) {
                onFinished?.();
              }
              // else: user can retry this level (stay on same level)
            }}
          />

          {/* simple AI helper box (visual like your screenshot) */}
          <div className="ai-box">
            <div className="d-flex align-items-center justify-content-between">
              <div><b>Ask the AI Tutor</b> <span className="badge bg-primary ms-2">3 left</span></div>
              <button className="btn btn-outline btn-sm" disabled>Ask AI</button>
            </div>
            <div className="helper">Type your math question… (wire to your backend later)</div>
          </div>
        </div>
      )}
    </div>
  );
}
