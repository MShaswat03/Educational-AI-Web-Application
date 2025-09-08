// src/AppMerged.jsx — 14 classic chapters wired up
import React, { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./ui.css";

import ChapterCards from "./ChapterCards";
import ChapterRunner from "./ChapterRunner";   // dynamic JSON flow (optional)
import ChapterSummary from "./ChapterSummary";  // classic flow pieces
import BA from "./ba";
import MCQGenerator from "./MCQGenerator";
import LLMHelp from "./LLMHelp";
import { fetchManifest } from "./api";

// ✅ We’ll drive all 14 via the classic flow (Summary → Baseline → MCQ).
// If you later want JSON-driven (dynamic) chapters, see the manifest sample below.

// ---- 14 CLASSIC CHAPTERS ----
// NOTE: Adjust names to match your syllabus exactly if needed.
const classicChapters = [
  { id: "101", name: "The Fish Tale" },
  { id: "102", name: "Shapes and Angles" },
  { id: "103", name: "How Many Squares?" },
  { id: "104", name: "Parts and Wholes" },
  { id: "105", name: "Does it Look the Same?" },
  { id: "106", name: "Be My Multiple, I'll be Your Factor" },
  { id: "107", name: "Can You See the Pattern?" },
  { id: "108", name: "Mapping Your Way" },
  { id: "109", name: "Boxes and Sketches" },
  { id: "110", name: "Tenths and Hundredths" },
  { id: "111", name: "Area and Its Boundary" },
  { id: "112", name: "Smart Charts!" },
  { id: "113", name: "How Big? How Heavy?" },
  { id: "114", name: "Revision Lab" }, // placeholder title — edit if you have a specific ch. 14 name
];

const levels = ["novice", "intermediate", "advanced"]; // classic flow quiz levels
const MAX_TOKENS = 3; // LLM help tokens per chapter

export default function AppMerged() {
  // dynamic manifest (optional): if you later add JSON-driven chapters, they’ll show up too
  const [manifest, setManifest] = useState([]);
  const [loading, setLoading] = useState(true);

  // app state (shared)
  const [unlocked, setUnlocked] = useState({});
  const [completed, setCompleted] = useState({});
  const [active, setActive] = useState(null); // { id, kind: 'classic'|'dynamic' }
  const [phase, setPhase] = useState("card");
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);

  // AI tokens per chapter (classic flow uses this)
  const [aiTokens, setAiTokens] = useState({});

  // optional: load dynamic manifest (won't block classic)
  useEffect(() => {
    (async () => {
      try {
        const m = await fetchManifest(); // from /public/chapters/index.json (if present)
        setManifest(Array.isArray(m) ? m : []);
      } catch (_) {
        setManifest([]); // ignore if missing
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // combine classic + dynamic into one array of cards
  const combinedCards = useMemo(() => {
    const dynamicCards = manifest.map(m => ({
      id: String(m.id),
      name: m.name,
      locked: !!m.locked,
      kind: "dynamic",
    }));
    const classicCards = classicChapters.map(c => ({
      ...c,
      locked: false, // all classic chapters start unlocked (change if you want progression)
      kind: "classic",
    }));
    return [...classicCards, ...dynamicCards];
  }, [manifest]);

  // unlocked map + token buckets init
  useEffect(() => {
    if (!combinedCards.length) return;
    const map = {};
    combinedCards.forEach((c, i) => { map[c.id] = i === 0 || !c.locked; });
    setUnlocked(map);

    const tokenInit = {};
    combinedCards.forEach(c => { tokenInit[c.id] = MAX_TOKENS; });
    setAiTokens(tokenInit);
  }, [combinedCards]);

  if (loading) return <div className="container mt-5">Loading…</div>;

  // quick helpers
  const dynamicIds = new Set(manifest.map(m => String(m.id)));
  const startChapter = (id) => {
    if (dynamicIds.has(id)) {
      setActive({ id, kind: "dynamic" });
      setPhase("dynamic"); // handled entirely by <ChapterRunner/>
    } else {
      setActive({ id, kind: "classic" });
      setPhase("summary");
      setCurrentLevelIdx(0);
    }
  };

  // -------------------- CLASSIC FLOW HANDLERS --------------------
  const handleBaselineDone = (level) => {
    setCurrentLevelIdx(levels.indexOf(level));
    setPhase("quiz");
  };

  const handleClassicQuizDone = (score, total) => {
    const passed = total > 0 && score / total >= 0.8;
    if (passed && currentLevelIdx < levels.length - 1) {
      setCurrentLevelIdx(currentLevelIdx + 1);
      setPhase("quiz");
    } else if (currentLevelIdx === levels.length - 1) {
      // completed this chapter — unlock next
      const idx = combinedCards.findIndex(c => c.id === active.id);
      setCompleted(prev => ({ ...prev, [active.id]: true }));
      if (idx + 1 < combinedCards.length) {
        const next = combinedCards[idx + 1].id;
        setUnlocked(u => ({ ...u, [next]: true }));
        setAiTokens(prev => ({ ...prev, [next]: MAX_TOKENS }));
      }
      setActive(null);
      setPhase("card");
      setCurrentLevelIdx(0);
    }
  };

  // -------------------- RENDER --------------------
  const renderCards = () => (
    <ChapterCards
      items={combinedCards}
      unlockedMap={unlocked}
      completedMap={completed}
      onStart={startChapter}
    />
  );

  const renderActive = () => {
    if (!active) return null;

    // Dynamic (JSON-driven) chapter uses ChapterRunner
    if (active.kind === "dynamic") {
      return (
        <ChapterRunner
          id={active.id}
          onFinished={() => {
            setCompleted(prev => ({ ...prev, [active.id]: true }));
            // unlock next
            const idx = combinedCards.findIndex(x => x.id === active.id);
            if (idx >= 0 && idx + 1 < combinedCards.length) {
              const next = combinedCards[idx + 1].id;
              setUnlocked(u => ({ ...u, [next]: true }));
            }
            setActive(null);
            setPhase("card");
          }}
        />
      );
    }

    // Classic chapter keeps Summary → Baseline → Quiz
    if (phase === "summary") {
      return (
        <div className="container mt-4">
          <ChapterSummary chapter={active.id} />
          <button
            className="btn btn-success mt-3"
            onClick={() => setPhase("baseline")}
          >
            Continue
          </button>
        </div>
      );
    }

    if (phase === "baseline") {
      return (
        <div className="container mt-4">
          <BA chapter={active.id} onComplete={handleBaselineDone} />
        </div>
      );
    }

    if (phase === "quiz") {
      return (
        <div className="container mt-4">
          <MCQGenerator
            chapter={active.id}
            level={levels[currentLevelIdx]}
            onComplete={handleClassicQuizDone}
            user={{ id: "demo" }}
          />
          <LLMHelp
            chapterId={active.id}
            tokensLeft={aiTokens[active.id] ?? MAX_TOKENS}
            onUseToken={() =>
              setAiTokens(prev => ({
                ...prev,
                [active.id]: Math.max(0, (prev[active.id] ?? MAX_TOKENS) - 1),
              }))
            }
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="container">
      <div className="app-title">EduAI Learning Portal</div>
      {!active ? renderCards() : renderActive()}
    </div>
  );
}

/* --------------------------------------------------------------
   OPTIONAL: public/chapters/index.json (for dynamic JSON chapters)
   Drop this file under /public/chapters/index.json if/when you want
   to add JSON-driven chapters handled by <ChapterRunner />.

   [
     { "id": "201", "name": "Fractions — Dynamic", "locked": false },
     { "id": "202", "name": "Decimals — Dynamic",  "locked": true }
   ]

   For each dynamic id, create /public/chapters/<id>/flow.json to drive the UI.
   Keep all 14 classic chapters above — dynamic ones will appear AFTER them.
-------------------------------------------------------------- */

/* --------------------------------------------------------------
   OPTIONAL: public/chapters/201/flow.json (shape example for ChapterRunner)
   This is a minimal, generic schema that many runners use. If your
   ChapterRunner expects a different schema, adapt accordingly.

   {
     "title": "Fractions — Dynamic",
     "nodes": [
       { "id": "intro", "type": "markdown", "text": "# Fractions\nQuick warmup." },
       { "id": "ba",    "type": "baseline", "levelOptions": ["novice","intermediate","advanced"] },
       { "id": "q1",    "type": "mcq",
         "prompt": "1/2 is equal to?",
         "options": ["0.2","0.5","2","5"],
         "answer": 1,
         "explain": "Half equals 0.5 in decimal."
       },
       { "id": "done",  "type": "finish",  "text": "Great work!" }
     ],
     "edges": [
       ["intro","ba"],
       ["ba","q1"],
       ["q1","done"]
     ]
   }
-------------------------------------------------------------- */
