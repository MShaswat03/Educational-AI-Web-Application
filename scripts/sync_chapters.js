// frontend/scripts/sync_chapters.js
const fs = require("fs");
const path = require("path");

const SRC = path.resolve(__dirname, "../../admin_engine/chapters");
const DEST = path.resolve(__dirname, "../public/chapters");

// ensure dest folder
fs.mkdirSync(DEST, { recursive: true });

// read all chapter jsons
const files = fs.readdirSync(SRC).filter(f => f.endsWith(".json"));

const manifest = [];

for (const file of files) {
  const srcFile = path.join(SRC, file);
  const destFile = path.join(DEST, file);

  // copy the chapter file
  fs.copyFileSync(srcFile, destFile);

  // read it to build manifest entry
  const data = JSON.parse(fs.readFileSync(srcFile, "utf-8"));
  const id = path.basename(file, ".json");

  manifest.push({
    id,
    title: data.title || id,
    locked: Boolean(data.locked),
    // put an image if you have one in /public/chapters/
    image: `/chapters/${id}.png`
  });
}

// write manifest
fs.writeFileSync(
  path.join(DEST, "index.json"),
  JSON.stringify(manifest, null, 2),
  "utf-8"
);

console.log(`Synced ${files.length} chapter(s) → public/chapters/index.json`);
