// src/AppDynamic.jsx
import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./ui.css";
import { fetchManifest } from "./api";
import ChapterCards from "./ChapterCards";
import ChapterRunner from "./ChapterRunner";

export default function App() {
  const [manifest, setManifest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [unlocked, setUnlocked] = useState({});
  const [completed, setCompleted] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const m = await fetchManifest();
        setManifest(m);
        const map = {};
        m.forEach((c, i) => { map[c.id] = i === 0 || !c.locked; });
        setUnlocked(map);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="container mt-5">Loading…</div>;

  return (
    <div className="container">
      <div className="app-title">EduAI Learning Portal</div>

      {!activeId ? (
        <ChapterCards
          items={manifest}
          unlockedMap={unlocked}
          completedMap={completed}
          onStart={(id) => setActiveId(id)}
        />
      ) : (
        <ChapterRunner
          id={activeId}
          onFinished={() => {
            setCompleted(prev => ({ ...prev, [activeId]: true }));
            const idx = manifest.findIndex(x => x.id === activeId);
            if (idx >= 0 && idx + 1 < manifest.length) {
              const next = manifest[idx + 1].id;
              setUnlocked(u => ({ ...u, [next]: true }));
            }
            setActiveId(null);
          }}
        />
      )}
    </div>
  );
}
