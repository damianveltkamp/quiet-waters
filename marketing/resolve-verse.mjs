const REF_RE = /^([1-3]?[A-Za-z]{2,3})\s+(\d+):(\d+)(?:-(\d+))?$/;

export function parseRef(ref) {
  const trimmed = String(ref).trim();
  const m = trimmed.match(REF_RE);
  if (!m) {
    throw new Error(`Malformed reference "${ref}" (expected like "PSA 23:1" or "PSA 23:1-3")`);
  }
  const bookCode = m[1].toUpperCase();
  const chapter = Number(m[2]);
  const vStart = Number(m[3]);
  const vEnd = m[4] !== undefined ? Number(m[4]) : vStart;
  if (vEnd < vStart) {
    throw new Error(`Invalid range in "${ref}": end verse ${vEnd} precedes start verse ${vStart}`);
  }
  return { bookCode, chapter, vStart, vEnd };
}

export function resolveVerse(ref, book) {
  const { bookCode, chapter, vStart, vEnd } = parseRef(ref);
  const chapters = book.chapters || [];
  const chapterArr = chapters[chapter - 1];
  if (!Array.isArray(chapterArr)) {
    throw new Error(`${bookCode}: chapter ${chapter} does not exist`);
  }
  const parts = [];
  for (let v = vStart; v <= vEnd; v++) {
    const verseText = chapterArr[v - 1];
    if (typeof verseText !== "string") {
      throw new Error(`${bookCode} ${chapter}: verse ${v} does not exist`);
    }
    parts.push(verseText.trim());
  }
  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  const versePart = vEnd > vStart ? `${vStart}-${vEnd}` : `${vStart}`;
  const label = `${book.name} ${chapter}:${versePart}`.toUpperCase();
  return { text, label };
}
