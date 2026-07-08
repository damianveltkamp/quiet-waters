// feeds.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = dirname(fileURLToPath(import.meta.url));
const { feeds } = JSON.parse(readFileSync(join(ROOT, "feeds.json"), "utf8"));

test("feeds.json: is a non-empty array", () => {
  assert.ok(Array.isArray(feeds));
  assert.ok(feeds.length > 0);
});

test("feeds.json: every feed has a name and an http(s) url", () => {
  for (const f of feeds) {
    assert.ok(f.name && typeof f.name === "string", `feed missing name: ${JSON.stringify(f)}`);
    assert.match(f.url, /^https?:\/\//, `feed url not http(s): ${JSON.stringify(f)}`);
  }
});

test("feeds.json: urls are unique", () => {
  const urls = feeds.map((f) => f.url);
  assert.equal(new Set(urls).size, urls.length);
});
