import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

function MCQGenerator({ chapter, level, onComplete }) {
  const [mcqs, setMcqs] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetch(`/student/mcq/${level}/${chapter}`)
      .then(res => res.json())
      .then(data => setMcqs(data));
    setUserAnswers([]);
    setShowResult(false);
    setScore(0);
  }, [chapter, level]);

  const handleChange = (qIdx, ansIdx) => {
    const updated = [...userAnswers];
    updated[qIdx] = ansIdx;
    setUserAnswers(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let correct = 0;
    mcqs.forEach((q, idx) => {
      if (userAnswers[idx] === q.answer) correct++;
    });
    setScore(correct);
    setShowResult(true);
  };

  const handleRetry = () => {
    setUserAnswers([]);
    setShowResult(false);
    setScore(0);
  };

  if (!mcqs.length) return <div>Loading quiz...</div>;

  const passed = score / mcqs.length >= 0.8;

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>
        {level.charAt(0).toUpperCase() + level.slice(1)} Quiz
      </h2>
      <form onSubmit={handleSubmit}>
        {mcqs.map((q, idx) => (
          <div key={idx} style={{ marginBottom: 20 }}>
            <b>{idx + 1}. {q.question}</b>
            <div>
              {q.choices.map((choice, oidx) => (
                <div key={oidx}>
                  <label>
                    <input
                      type="radio"
                      name={`q${idx}`}
                      checked={userAnswers[idx] === oidx}
                      onChange={() => handleChange(idx, oidx)}
                      disabled={showResult}
                    />
                    {" "}{String.fromCharCode(65 + oidx)}. {choice.text}
                  </label>
                </div>
              ))}
            </div>
            {showResult && (
              <div style={{ marginTop: 6 }}>
                {userAnswers[idx] === q.answer ? (
                  <span style={{ color: "green" }}>Correct!</span>
                ) : (
                  <span style={{ color: "red" }}>
                    Incorrect. Correct Answer: {String.fromCharCode(65 + q.answer)}. {q.choices[q.answer].text}
                  </span>
                )}
                <div><b>Explanation:</b> {q.choices[userAnswers[idx]]?.explanation || ""}</div>
              </div>
            )}
          </div>
        ))}
        {!showResult &&
          <button
            type="submit"
            className="btn btn-primary"
            disabled={userAnswers.length < mcqs.length}
          >
            Check Answers
          </button>
        }
      </form>
      {showResult && (
        <div className="mt-4">
          <h4>Your Score: {score} / {mcqs.length}</h4>
          {passed ? (
            <button
              className="btn btn-success mt-2"
              onClick={() => onComplete(score, mcqs.length)}
            >
              🎉 Great job! Go to Next Level Quiz
            </button>
          ) : (
            <button
              className="btn btn-warning mt-2"
              onClick={handleRetry}
            >
              🔄 Retry Quiz
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default MCQGenerator;
