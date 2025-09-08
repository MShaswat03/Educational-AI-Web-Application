//aiTutor.js
export async function askTutor({chapter, question}) {
    const res = await fetch("http://localhost:5001/rag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chapter, question })
});
if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json(); // { answer, sources }
}
