// src/AppAuto.jsx
import React, { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./ui.css";
import AITutor from "./AITutor";

// ---- Backend RAG endpoint (customizable) ----
// 1) Preferred: Vite env: VITE_RAG_URL="http://localhost:5001/rag"
// 2) Fallback: window.__RAG_URL__ = "http://localhost:5001/rag" (set in index.html)
// 3) Default:  http://localhost:5001/rag
const RAG_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_RAG_URL) ||
  (typeof window !== "undefined" && window.__RAG_URL__) ||
  "http://localhost:5001/rag";

const LEVELS = ["novice", "intermediate", "advanced"];

// ---------- Data (static from /public) ----------
async function fetchManifest() {
  const res = await fetch("/chapters/index.json");
  if (!res.ok) return [];
  return await res.json();
}
async function fetchChapter(id) {
  const res = await fetch(`/chapters/${id}.json`);
  if (!res.ok) return null;
  return await res.json();
}

// ---------- Helpers ----------
function toBaselineMCQs(baselineStrings) {
  return (baselineStrings || []).map((s) => {
    const yn = /yes$/i.test(s) ? "Yes" : /no$/i.test(s) ? "No" : "Yes";
    const stem = s.replace(/\s*(yes|no)\s*$/i, "").trim();
    const choices = ["Yes", "No"].sort(() => Math.random() - 0.5);
    const answerIdx = choices.indexOf(yn);
    return { question: stem, choices, answer: answerIdx };
  });
}

function bucket12(quiz) {
  const src = Array.isArray(quiz) ? quiz.slice(0, 12) : [];
  const b = { novice: [], intermediate: [], advanced: [] };
  const order = ["novice", "intermediate", "advanced"];

  const toMCQ = (q) => {
    const correct = String(q.answer);
    const opts = new Set([correct]);
    const pool = [
      "0","1","2","3","4","5","6","7","8","9",
      "rectangle","triangle","square","surface area","perimeter","area",
      "1/2 × base × height"
    ];
    while (opts.size < 3) opts.add(pool[Math.floor(Math.random() * pool.length)]);
    const choices = Array.from(opts).sort(() => Math.random() - 0.5);
    const answer = choices.indexOf(correct);
    return { question: q.question, choices, answer };
  };

  src.map(toMCQ).forEach((q, i) => b[order[i % 3]].push(q));
  Object.keys(b).forEach((k) => (b[k] = b[k].slice(0, 4)));
  return b;
}

// ---------- UI bits ----------
function CardGrid({ items, unlocked, completed, onStart }) {
  // local fallback: never blanks out
  const fallbackSvg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0' stop-color='#1b1f24'/><stop offset='1' stop-color='#0f1316'/>
      </linearGradient></defs>
      <rect width='800' height='450' fill='url(#g)'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
            fill='#a8b3c1' font-size='36' font-family='Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial'>Chapter</text>
    </svg>`
  );
  const fallbackImg = `data:image/svg+xml;utf8,${fallbackSvg}`;

  return (
    <div className="container card-grid">
      <div className="section-title">Chapters</div>

      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
        {items.map((c) => {
          const isUnlocked = !!unlocked[c.id];
          const thumbSrc = c.thumb || "/chapter-placeholder.png";
          return (
            <div key={c.id} className="col d-flex">
              <div className={`chapter-card flex-fill ${isUnlocked ? "" : "locked"}`}>
                <div className="chapter-thumb-wrap">
                  <img
                    className="chapter-thumb"
                    src={thumbSrc}
                    alt="Chapter"
                    onError={(e) => {
                      e.currentTarget.src = fallbackImg;
                    }}
                  />
                </div>
                <div className="chapter-body">
                  <div className="chapter-title">{c.name}</div>
                  <button
                    className="btn btn-primary chapter-btn"
                    disabled={!isUnlocked}
                    onClick={() => onStart(c.id)}
                  >
                    {isUnlocked ? "Start" : "Locked"}
                  </button>
                  {completed[c.id] && (
                    <div className="badge bg-success ms-2 align-self-center">Completed</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Summary({ title, bullets, onDone }) {
  return (
    <div className="sheet">
      <div className="section-title">{title}</div>
      {(bullets || []).map((p, i) => (
        <div key={i} className="summary-block">
          <ul className="summary-bullet">
            <li>{p}</li>
          </ul>
        </div>
      ))}
      <button className="btn btn-success mt-3" onClick={onDone}>
        Done
      </button>
    </div>
  );
}

function MCQBlock({ title, items, onFinish, checkLabel = "Check Answers" }) {
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const total = items.length;

  return (
    <div className="sheet">
      <div className="section-title">{title}</div>
      <div className="panel">
        {items.map((q, i) => (
          <div className="q-item" key={i}>
            <b>
              {i + 1}. {q.question}
            </b>
            <div className="q-options mt-2">
              {q.choices.map((o, j) => (
                <label key={j}>
                  <input
                    type="radio"
                    name={`q${i}`}
                    checked={answers[i] === j}
                    onChange={() => setAnswers((a) => ({ ...a, [i]: j }))}
                    disabled={score != null}
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
            disabled={Object.keys(answers).length < total}
            onClick={() => {
              const s = items.reduce(
                (acc, q, i) => acc + ((answers[i] ?? -1) === q.answer ? 1 : 0),
                0
              );
              setScore(s);
              onFinish?.(s, total);
            }}
          >
            {checkLabel}
          </button>
        ) : (
          <div className="mt-3 fs-5">
            Score: {score} / {total}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Driver (summary → baseline → quizzes) ----------
function ChapterRunner({ id, onFinished }) {
  const [data, setData] = useState(null);
  const [phase, setPhase] = useState("summary"); // summary → baseline → quiz
  const [levelIdx, setLevelIdx] = useState(0);
  const [tokensLeft, setTokensLeft] = useState(3); // tutor tokens

  useEffect(() => {
    (async () => setData(await fetchChapter(id)))();
  }, [id]);

  // seed tokens from chapter JSON if present
  useEffect(() => {
    if (data?.ai_tutor_limit != null) setTokensLeft(Number(data.ai_tutor_limit) || 3);
  }, [data]);

  const buckets = useMemo(() => bucket12(data?.quiz), [data]);
  const baseline = useMemo(() => toBaselineMCQs(data?.baseline_assessment), [data]);

  if (!data) return <div className="container mt-4">Loading…</div>;
  const level = LEVELS[levelIdx];

  return (
    <div>
      {phase === "summary" && (
        <Summary
          title={data.title}
          bullets={data.learning_points}
          onDone={() => setPhase("baseline")}
        />
      )}

      {phase === "baseline" && (
        <MCQBlock
          title="Baseline Assessment"
          items={baseline}
          checkLabel="Submit Assessment"
          onFinish={() => setPhase("quiz")}
        />
      )}

      {phase === "quiz" && (
        <>
          <MCQBlock
            title={`${level[0].toUpperCase() + level.slice(1)} Quiz`}
            items={buckets[level] || []}
            onFinish={(score, total) => {
              const passed = total && score / total >= 0.8;
              if (passed && levelIdx < LEVELS.length - 1) setLevelIdx(levelIdx + 1);
              else if (passed) onFinished?.();
            }}
          />
          {/* Pass the RAG backend URL to the tutor */}
          <AITutor
            chapterId={id}
            chapterTitle={data.title}
            ragUrl={RAG_URL}
            tokensLeft={tokensLeft}
            onUseToken={() => setTokensLeft((t) => Math.max(0, t - 1))}
          />
        </>
      )}
    </div>
  );
}

// ---------- Main (auto from manifest) ----------
export default function AppAuto() {
  const [manifest, setManifest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [unlocked, setUnlocked] = useState({});
  const [completed, setCompleted] = useState({});

  useEffect(() => {
    (async () => {
      try {
        setManifest(await fetchManifest());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!manifest.length) return;
    const map = {};
    manifest.forEach((c, i) => {
      map[c.id] = i === 0 || !c.locked;
    });
    setUnlocked(map);
  }, [manifest]);

  if (loading) return <div className="container mt-5">Loading…</div>;

  return (
    <div className="container">
      <div className="app-title">EduAI Learning Portal</div>
      {!activeId ? (
        <CardGrid
          items={manifest.map((m) => ({
            id: m.id,
            name: m.name,
            locked: !!m.locked,
            thumb: m.thumb,
          }))}
          unlocked={unlocked}
          completed={completed}
          onStart={setActiveId}
        />
      ) : (
        <ChapterRunner
          id={activeId}
          onFinished={() => {
            setCompleted((prev) => ({ ...prev, [activeId]: true }));
            const idx = manifest.findIndex((x) => x.id === activeId);
            const next = manifest[idx + 1]?.id;
            if (next) setUnlocked((u) => ({ ...u, [next]: true }));
            setActiveId(null);
          }}
        />
      )}
    </div>
  );
}
