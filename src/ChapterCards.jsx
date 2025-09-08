// src/ChapterCards.jsx
import React from "react";

export default function ChapterCards({ items, unlockedMap, completedMap, onStart }) {
  return (
    <div className="container card-grid">
      <div className="section-title">Chapters</div>
      <div className="row">
        {items.map((c) => {
          const isUnlocked = !!unlockedMap[c.id];
          return (
            <div key={c.id} className="col-md-6 mb-4">
              <div className={`card h-100 ${isUnlocked ? "" : "text-muted"}`}>
                <div className="card-top">
                  <img
                    src="/chapter-placeholder.png"
                    alt="Chapter"
                    style={{maxHeight: 92, opacity: isUnlocked ? 0.95 : 0.55}}
                  />
                </div>
                <div className="card-body d-flex flex-column align-items-center justify-content-end">
                  <div className="card-title">{c.name}</div>
                  <button
                    className="btn btn-primary mt-2"
                    disabled={!isUnlocked}
                    onClick={() => onStart(c.id)}
                    style={{minWidth: 110}}
                  >
                    {isUnlocked ? "Start" : "Locked"}
                  </button>
                  {completedMap[c.id] && (
                    <div className="badge badge-success mt-2">Completed</div>
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
