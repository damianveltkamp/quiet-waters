// feed-utils.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  slugify,
  classifyImage,
  filterUnseen,
  extractImageUrl,
  buildCandidate,
} from "./feed-utils.mjs";

test("slugify: lowercases, replaces runs of non-alphanumerics with single dash, trims", () => {
  assert.equal(slugify("  Hello, World!!  "), "hello-world");
});

test("slugify: caps length and never leaves a trailing dash", () => {
  const s = slugify("a".repeat(80) + " tail", 10);
  assert.ok(s.length <= 10);
  assert.doesNotMatch(s, /-$/);
});

test("slugify: empty/garbage input falls back to 'item'", () => {
  assert.equal(slugify("!!!"), "item");
  assert.equal(slugify(""), "item");
});

test("classifyImage: ok when shorter side >= threshold", () => {
  assert.equal(classifyImage({ width: 1200, height: 600 }, 600), "ok");
});

test("classifyImage: needs-manual when shorter side below threshold", () => {
  assert.equal(classifyImage({ width: 1200, height: 400 }, 600), "needs-manual");
});

test("classifyImage: needs-manual when dimensions missing or zero", () => {
  assert.equal(classifyImage(null, 600), "needs-manual");
  assert.equal(classifyImage({ width: 0, height: 0 }, 600), "needs-manual");
});

test("filterUnseen: drops items whose link is in the seen set", () => {
  const items = [{ link: "a" }, { link: "b" }, { link: "c" }];
  const out = filterUnseen(items, new Set(["b"]));
  assert.deepEqual(out.map((i) => i.link), ["a", "c"]);
});

test("filterUnseen: accepts a plain array of seen urls and drops linkless items", () => {
  const items = [{ link: "a" }, { title: "no link" }, { link: "d" }];
  const out = filterUnseen(items, ["a"]);
  assert.deepEqual(out.map((i) => i.link), ["d"]);
});

test("extractImageUrl: prefers an image enclosure", () => {
  const item = { enclosure: { url: "http://x/img.jpg", type: "image/jpeg" } };
  assert.equal(extractImageUrl(item), "http://x/img.jpg");
});

test("extractImageUrl: falls back to media:content url", () => {
  const item = { "media:content": { $: { url: "http://x/m.jpg" } } };
  assert.equal(extractImageUrl(item), "http://x/m.jpg");
});

test("extractImageUrl: falls back to first <img> in content", () => {
  const item = { content: "<p>hi</p><img src='http://x/inline.png' />" };
  assert.equal(extractImageUrl(item), "http://x/inline.png");
});

test("extractImageUrl: returns null when nothing present", () => {
  assert.equal(extractImageUrl({ title: "no images here" }), null);
});

test("buildCandidate: normalizes fields and trims", () => {
  const item = {
    title: "  Big News  ",
    contentSnippet: "  a summary  ",
    link: "http://x/story",
    isoDate: "2026-07-08T09:00:00Z",
  };
  const c = buildCandidate(item, { source: "God Reports", image: "feed-images/x.jpg", imageStatus: "ok" });
  assert.deepEqual(c, {
    source: "God Reports",
    title: "Big News",
    summary: "a summary",
    link: "http://x/story",
    published: "2026-07-08T09:00:00Z",
    image: "feed-images/x.jpg",
    imageStatus: "ok",
  });
});
