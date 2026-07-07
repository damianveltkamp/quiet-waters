import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadBook } from "./resolve-verse.mjs";

const KJV_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "mobile", "src", "bible", "data", "KJV");

test("loadBook: loads a real KJV book with expected shape", () => {
  const book = loadBook("PSA", KJV_DIR);
  assert.equal(book.code, "PSA");
  assert.equal(book.name, "Psalms");
  assert.ok(Array.isArray(book.chapters));
  assert.equal(typeof book.chapters[22][0], "string"); // Psalm 23:1
});

test("loadBook: throws a clear error for an unknown book code", () => {
  assert.throws(() => loadBook("ZZZ", KJV_DIR), /unknown book|ZZZ/i);
});
