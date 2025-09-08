// src/ChapterSummary.jsx
import React, { useEffect, useState } from "react";

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

export default function ChapterSummary({ chapter }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch(`/student/chapter_summary/${chapter}`)
      .then(res => res.json())
      .then(data => setSummary(data));
  }, [chapter]);

  if (!summary) return <div>Loading chapter summary...</div>;
  if (summary.error) return <div>{summary.error}</div>;

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
