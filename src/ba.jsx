// src/ba.jsx
import React, { useState, useEffect } from "react";

function BaselineAssessment({ chapter, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [assignedLevel, setAssignedLevel] = useState(null);
  const [showAssignedLevel, setShowAssignedLevel] = useState(false);

  useEffect(() => {
    fetch("/student/baseline")
      .then((res) => res.json())
      .then((data) => setQuestions(data));
  }, []);

  const handleChange = (qIdx, ansIdx) => {
    const updated = [...answers];
    updated[qIdx] = ansIdx;
    setAnswers(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.answer) correct++;
    });
    setScore(correct);
    setSubmitted(true);

    fetch("/student/baseline/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: "test_user", // <-- Replace with real user
        scores: questions.map((q, idx) => (answers[idx] === q.answer ? 1 : 0)),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setAssignedLevel(data.assigned_level);
        setShowAssignedLevel(true);

        // Briefly show assigned level, then call parent to go to quiz
        setTimeout(() => {
          setShowAssignedLevel(false);
          if (onComplete) onComplete(data.assigned_level);
        }, 1500);
      });
  };

  if (!questions.length) return <div>Loading baseline assessment...</div>;

  return (
    <div className="container">
      <h2>Baseline Assessment</h2>
      <form onSubmit={handleSubmit}>
        {questions.map((q, idx) => (
          <div key={idx} style={{ marginBottom: 24 }}>
            <b>{idx + 1}. {q.question}</b>
            <div>
              {q.choices.map((choice, cidx) => (
                <div key={cidx}>
                  <label>
                    <input
                      type="radio"
                      name={`q${idx}`}
                      checked={answers[idx] === cidx}
                      onChange={() => handleChange(idx, cidx)}
                      disabled={submitted}
                    />
                    {" "}{String.fromCharCode(65 + cidx)}. {choice}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!submitted && (
          <button type="submit" disabled={answers.length < questions.length}>
            Submit Assessment
          </button>
        )}
      </form>
      {submitted && (
        <div>
          <h3>Your Score: {score} / {questions.length}</h3>
          {showAssignedLevel && assignedLevel && (
            <div style={{ fontSize: 20, margin: "20px 0", color: "#0057a3" }}>
              You have been assigned to: <b>{assignedLevel.charAt(0).toUpperCase() + assignedLevel.slice(1)}</b> level!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BaselineAssessment;
