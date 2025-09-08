// src/api.js
export async function fetchManifest() {
    const res = await fetch("/chapters/index.json");
    if (!res.ok) throw new Error("manifest not found");
    return res.json();
  }
  
  export async function fetchChapter(id) {
    const res = await fetch(`/chapters/${id}.json`);
    if (!res.ok) throw new Error("chapter json not found");
    return res.json();
  }
  