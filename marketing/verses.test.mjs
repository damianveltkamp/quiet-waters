// verses.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadBook, parseRef, resolveVerse } from "./resolve-verse.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const KJV_DIR = join(ROOT, "..", "mobile", "src", "bible", "data", "KJV");
const { verses } = JSON.parse(readFileSync(join(ROOT, "verses.json"), "utf8"));

test("verses.json: every entry has a unique id", () => {
  const ids = verses.map((v) => v.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("verses.json: every ref resolves to real KJV text", () => {
  for (const { id, ref } of verses) {
    const { bookCode } = parseRef(ref);
    const book = loadBook(bookCode, KJV_DIR);
    const { text, label } = resolveVerse(ref, book);
    assert.ok(text.length > 0, `${id} (${ref}) produced empty text`);
    assert.ok(label.length > 0, `${id} (${ref}) produced empty label`);
  }
});
