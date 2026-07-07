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
