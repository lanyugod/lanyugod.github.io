import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import matter from "gray-matter";
const baseline = JSON.parse(readFileSync("tests/fixtures/content-baseline.json", "utf8"));
const hash = value => createHash("sha256").update(value).digest("hex");
test("published documents retain their content and metadata", () => {
	for (const post of baseline.posts) {
		const raw = readFileSync(post.file, "utf8");
		const { data } = matter(raw);
		assert.equal(hash(raw.replace(/^---\n[\s\S]*?\n---/, "")), post.bodySha256, post.file);
		assert.equal(data.title, post.title);
		assert.equal(data.published.toISOString(), new Date(post.published).toISOString());
		assert.deepEqual(data.tags, post.tags);
		assert.equal(data.category, post.category);
		assert.equal(data.commentPath, post.commentPath);
	}
});
test("all articles have unique native Firefly paths", () => {
	const paths = new Set();
	for (const post of baseline.posts) {
		assert.ok(post.path.startsWith("/posts/"));
		assert.ok(!paths.has(post.path));
		paths.add(post.path);
	}
});
test("Docker and docker continue to select different documents", () => {
	const posts = baseline.posts.map(post => ({ path: post.path, ...matter(readFileSync(post.file, "utf8")).data }));
	const upper = posts.filter(post => post.tags.includes("Docker"));
	const lower = posts.filter(post => post.tags.includes("docker"));
	assert.equal(upper.length, 1);
	assert.equal(lower.length, 1);
	assert.notEqual(upper[0].path, lower[0].path);
});
test("referenced public image files retain their exact bytes", () => {
	for (const [file, expectedHash] of Object.entries(baseline.mediaHashes)) {
		assert.ok(existsSync("public"+file), file);
		assert.equal(hash(readFileSync("public"+file)), expectedHash, file);
	}
});
