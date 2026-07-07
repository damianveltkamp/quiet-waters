// resolve-verse.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRef, resolveVerse } from "./resolve-verse.mjs";

test("parseRef: single verse", () => {
  assert.deepEqual(parseRef("PSA 23:1"), { bookCode: "PSA", chapter: 23, vStart: 1, vEnd: 1 });
});

test("parseRef: range", () => {
  assert.deepEqual(parseRef("PSA 23:1-3"), { bookCode: "PSA", chapter: 23, vStart: 1, vEnd: 3 });
});

test("parseRef: tolerates extra whitespace and lowercase code", () => {
  assert.deepEqual(parseRef("  jhn 3:16 "), { bookCode: "JHN", chapter: 3, vStart: 16, vEnd: 16 });
});

test("parseRef: rejects malformed ref", () => {
  assert.throws(() => parseRef("PSA 23"), /malformed reference/i);
});

test("parseRef: rejects reversed range", () => {
  assert.throws(() => parseRef("PSA 23:5-2"), /range/i);
});

const PSALMS = {
  code: "PSA",
  name: "Psalms",
  // chapters[22] === Psalm 23 (0-indexed); verses 1..2 shown
  chapters: (() => { const c = []; c[22] = ["The LORD is my shepherd; I shall not want.", "He maketh me to lie down in green pastures: he leadeth me beside the still waters."]; return c; })(),
};

test("resolveVerse: single verse text + label uses book name", () => {
  const r = resolveVerse("PSA 23:1", PSALMS);
  assert.equal(r.text, "The LORD is my shepherd; I shall not want.");
  assert.equal(r.label, "PSALMS 23:1");
});

test("resolveVerse: range joins verses and labels the span", () => {
  const r = resolveVerse("PSA 23:1-2", PSALMS);
  assert.equal(r.text, "The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters.");
  assert.equal(r.label, "PSALMS 23:1-2");
});

test("resolveVerse: throws on out-of-range verse", () => {
  assert.throws(() => resolveVerse("PSA 23:99", PSALMS), /verse 99/i);
});

test("resolveVerse: throws on out-of-range chapter", () => {
  assert.throws(() => resolveVerse("PSA 200:1", PSALMS), /chapter 200/i);
});
