// src/App.jsx
import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import ChapterSummary from './ChapterSummary';
import BA from './ba';
import MCQGenerator from './MCQGenerator';
import Login from "./Login";
import Signup from "./Signup";
import LLMHelp from "./LLMHelp";   // << NEW

const chapters = [
  { id: "101", name: "The Fish Tale" },
  { id: "102", name: "Shapes and Angles" },
  // ...add all chapters here
];
const levels = ["novice", "intermediate", "advanced"];

export default function App() {
  // --- AUTH STATE ---
  const [authPage, setAuthPage] = useState("login"); // or "signup"
  const [user, setUser] = useState(null);

  // --- LEARNING STATE ---
  const [unlocked, setUnlocked] = useState([true, ...Array(chapters.length - 1).fill(false)]);
  const [progress, setProgress] = useState({});
  const [activeChapter, setActiveChapter] = useState(null);
  const [phase, setPhase] = useState("card");
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);

  // --- LLM TOKEN SYSTEM ---
  const MAX_TOKENS = 3;
  const [aiTokens, setAiTokens] = useState(() =>
    Object.fromEntries(chapters.map(ch => [ch.id, MAX_TOKENS]))
  );

  // --- AUTH UI ---
  if (!user) {
    return authPage === "login"
      ? <Login onLogin={setUser} switchToSignup={() => setAuthPage("signup")} />
      : <Signup onSignup={() => setAuthPage("login")} switchToLogin={() => setAuthPage("login")} />;
  }

  // --- CHAPTER WORKFLOW ---
  const handleSummaryDone = () => setPhase("baseline");
  const handleBaselineDone = (level) => {
    setCurrentLevelIdx(levels.indexOf(level));
    setPhase("quiz");
  };
  const handleQuizDone = (score, total) => {
    const passed = score / total >= 0.8;
    if (passed && currentLevelIdx < levels.length - 1) {
      setCurrentLevelIdx(currentLevelIdx + 1);
      setPhase("quiz");
    } else if (currentLevelIdx === levels.length - 1) {
      // Completed all levels, unlock next chapter
      const idx = chapters.findIndex(c => c.id === activeChapter);
      setProgress(prev => ({
        ...prev,
        [activeChapter]: { ...prev[activeChapter], quizDone: true }
      }));
      if (idx + 1 < chapters.length) {
        setUnlocked(u => {
          const updated = [...u];
          updated[idx + 1] = true;
          return updated;
        });
      }
      setActiveChapter(null);
      setPhase("card");
      setCurrentLevelIdx(0);
      // Reset AI tokens for next chapter (optional)
      setAiTokens(prev => ({
        ...prev,
        [chapters[idx + 1]?.id]: MAX_TOKENS
      }));
    }
    // else, user can retry this level (handled in MCQGenerator)
  };

  // --- MAIN CHAPTER CARD VIEW ---
  function renderChapterCards() {
    return (
      <div className="container mt-4">
        <h2 className="mb-4">Chapters</h2>
        <div className="row">
          {chapters.map((ch, idx) => (
            <div key={ch.id} className="col-md-4 mb-4">
              <div
                className={`card h-100 shadow-sm ${unlocked[idx] ? "" : "bg-light text-muted"}`}
                style={{ minHeight: 300, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
              >
                <div style={{
                  width: "100%", height: 130, background: "#eaeaea",
                  borderTopLeftRadius: "calc(.25rem - 1px)",
                  borderTopRightRadius: "calc(.25rem - 1px)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <img src="https://via.placeholder.com/140x90?text=Chapter+Image" alt="Chapter" style={{ maxHeight: 90, objectFit: "contain" }} />
                </div>
                <div className="card-body d-flex flex-column align-items-center">
                  <h5 className="card-title mt-2">{ch.name}</h5>
                  <button
                    className="btn btn-primary mt-2"
                    disabled={!unlocked[idx]}
                    onClick={() => {
                      setActiveChapter(ch.id);
                      setPhase("summary");
                      setCurrentLevelIdx(0);
                    }}
                    style={{ width: 100 }}
                  >
                    {unlocked[idx] ? "Start" : "Locked"}
                  </button>
                  {progress[ch.id]?.quizDone && (
                    <div className="badge bg-success mt-2">Completed</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- ACTIVE CHAPTER WORKFLOW ---
  function renderActiveChapter() {
    if (!activeChapter) return null;

    if (phase === "summary")
      return (
        <div className="container mt-4">
          <ChapterSummary chapter={activeChapter} />
          <button className="btn btn-success mt-3" onClick={() => {
            setProgress(prev => ({
              ...prev,
              [activeChapter]: { ...prev[activeChapter], summaryDone: true }
            }));
            setPhase("baseline");
          }}>
            Done
          </button>
        </div>
      );
    if (phase === "baseline")
      return (
        <div className="container mt-4">
          <BA
            chapter={activeChapter}
            onComplete={handleBaselineDone}
          />
          {/* Optionally add LLMHelp below BA as well */}
        </div>
      );
    if (phase === "quiz")
      return (
        <div className="container mt-4">
          <MCQGenerator
            chapter={activeChapter}
            level={levels[currentLevelIdx]}
            onComplete={handleQuizDone}
            user={user}
          />
          {/* LLM AI Help system */}
          <LLMHelp
            chapterId={activeChapter}
            tokensLeft={aiTokens[activeChapter]}
            onUseToken={() =>
              setAiTokens(prev => ({
                ...prev,
                [activeChapter]: prev[activeChapter] > 0 ? prev[activeChapter] - 1 : 0
              }))
            }
          />
        </div>
      );
    return null;
  }

  // --- MAIN RENDER ---
  return (
    <div>
      <h1 className="text-center mt-4">EduAI Learning Portal</h1>
      {!activeChapter ? renderChapterCards() : renderActiveChapter()}
    </div>
  );
}
