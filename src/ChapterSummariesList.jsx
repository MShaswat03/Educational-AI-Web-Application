// src/ChapterSummariesList.jsx
import React, { useEffect, useState } from "react";

const chapters = [
  { id: "101", name: "The Fish Tale" },
  { id: "102", name: "Shapes and Angles" },
  // ...add more chapters
];

const cardStyle = {
  background: "#f8fafd",
  borderRadius: 16,
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  margin: "18px 0",
  padding: 24,
  display: "flex",
  alignItems: "flex-start",
  gap: 18
};
const iconStyle = { fontSize: 40, marginRight: 18 };

function ChapterCard({ summary }) {
  if (!summary) return null;
  return (
    <div>
      <h2 style={{ marginTop: 30 }}>{summary.title}</h2>
      {summary.keypoints.map((k, i) => (
        <div style={cardStyle} key={i}>
          <div style={iconStyle}>{k.icon}</div>
          <div>
            <h3 style={{ margin: "0 0 10px" }}>{k.title}</h3>
            <ul>
              {k.details.map((d, j) => <li key={j}>{d}</li>)}
            </ul>
            {k.visual && (
              <div style={{ fontStyle: "italic", color: "#888", marginTop: 10 }}>
                {typeof k.visual === "string" ? k.visual : ""}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ChapterSummariesList() {
  const [summaries, setSummaries] = useState({});

  useEffect(() => {
    chapters.forEach((c) => {
      fetch(`/student/chapter_summary/${c.id}`)
        .then((res) => res.json())
        .then((data) => {
          setSummaries((prev) => ({ ...prev, [c.id]: data }));
        });
    });
  }, []);

  return (
    <div>
      <h1>Chapter Key Concepts</h1>
      {chapters.map((c) => (
        <div key={c.id}>
          <h1 style={{ marginBottom: 0 }}>{c.name}</h1>
          {summaries[c.id] ? (
            <ChapterCard summary={summaries[c.id]} />
          ) : (
            <div>Loading summary...</div>
          )}
        </div>
      ))}
    </div>
  );
}
