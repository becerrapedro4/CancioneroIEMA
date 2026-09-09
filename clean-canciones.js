// clean-canciones.js
// Uso: node clean-canciones.js
// Lee canciones.json → escribe canciones_clean.json (no sobreescribe el original)

const fs = require("fs");
const songs = JSON.parse(fs.readFileSync("canciones.json", "utf8"));
let removed = 0, merged = 0, stanzasCollapsed = 0;

// ── helpers ──
function stanzaText(s) {
  const p = s.lyrics?.paragraphs;
  return p ? p.map(x => (x.text || "").trim()).join("\n\n") : (s.lyrics?.full_text || "");
}
function stanzaCount(s) { return s.lyrics?.paragraphs?.length || 0; }
function getAllStanzas(s) { return s.lyrics?.paragraphs || []; }

// ── 1. Deduplicar por título ──
const titleMap = {};
for (const s of songs) {
  const key = (s.title || "").trim().toLowerCase();
  if (!key) { titleMap["__empty__" + s.id] = s; continue; }
  if (!titleMap[key]) { titleMap[key] = s; continue; }
  const existing = titleMap[key];
  // Conservar la que tenga más estrofas; si empatan, quedarse con la que tiene artista
  if (stanzaCount(s) > stanzaCount(existing) || (!existing.artist && s.artist)) {
    // Merge: transferir info faltante
    if (!existing.artist && s.artist) existing.artist = s.artist;
    if (!existing.note && s.note) existing.note = s.note;
    if (!existing.key && s.key) existing.key = s.key;
    titleMap[key] = s;
  } else {
    // Transferir info faltante del descartado al conservado
    if (!existing.artist && s.artist) existing.artist = s.artist;
    if (!existing.note && s.note) existing.note = s.note;
  }
  removed++;
}

// ── 2. Colapsar estrofas idénticas consecutivas (3+ → 2) ──
function collapseStanzas(song) {
  const paras = getAllStanzas(song);
  if (paras.length < 3) return;
  let i = 0;
  while (i < paras.length - 2) {
    const a = (paras[i].text || "").trim();
    const b = (paras[i + 1].text || "").trim();
    const c = (paras[i + 2].text || "").trim();
    if (a && a === b && b === c) {
      // Unir nombres/descripciones de las 3
      const names = [paras[i], paras[i + 1], paras[i + 2]]
        .map(p => (p.description || "").trim())
        .filter(Boolean);
      const unique = [...new Set(names)];
      paras[i].description = unique.join(" / ") || paras[i].description || "";
      // Borrar la 2da y 3ra
      paras.splice(i + 1, 2);
      stanzasCollapsed++;
    } else {
      i++;
    }
  }
  // Reconstruir lyrics
  song.lyrics.paragraphs = paras;
  song.lyrics.full_text = paras.map(p => p.text || "").join("\n\n");
}

// ── Ejecutar ──
const clean = Object.values(titleMap);
for (const s of clean) collapseStanzas(s);

// Reconstruir full_text por si cambió
for (const s of clean) {
  const paras = s.lyrics?.paragraphs || [];
  s.lyrics.full_text = paras.map(p => p.text || "").join("\n\n");
}

fs.writeFileSync("canciones_clean.json", JSON.stringify(clean, null, 2), "utf8");

console.log(`Original:  ${songs.length} canciones`);
console.log(`Duplicados eliminados: ${removed}`);
console.log(`Estrofas colapsadas: ${stanzasCollapsed}`);
console.log(`Limpio:    ${clean.length} canciones → canciones_clean.json`);
