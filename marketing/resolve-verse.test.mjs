// resolve-verse.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRef } from "./resolve-verse.mjs";

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
