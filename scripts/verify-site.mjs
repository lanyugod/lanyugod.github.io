import { readFileSync, readdirSync, existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { resolve, join } from "node:path";
import { fromHtml } from "hast-util-from-html";
import { mediaUrl } from "../src/plugins/public-media.mjs";
try { loadEnvFile(); } catch (error) { if (error.code !== "ENOENT") throw error; }
const root = resolve("dist");
const baseline = JSON.parse(readFileSync("tests/fixtures/content-baseline.json", "utf8"));
const errors = [];
const htmlPath = path => join(root, decodeURI(path).replace(/^\//, ""), "index.html");
for (const post of baseline.posts) {
	const file = htmlPath(post.path);
	if (!existsSync(file)) { errors.push("Missing article: "+post.path); continue; }
	const html = readFileSync(file, "utf8");
	if (!html.includes(post.title)) errors.push("Missing title: "+post.title);
	if (!html.includes(encodeURI(post.commentPath))) errors.push("Changed comment identity: "+post.title);
}
for (const retired of ["archives", "masonry", "links", "status", "2024", "2025"]) {
	if (existsSync(join(root, retired))) errors.push("Retired entry was generated: "+retired);
}
const scan = dir => readdirSync(dir, { withFileTypes:true }).flatMap(entry => entry.isDirectory() ? scan(join(dir, entry.name)) : entry.name.endsWith(".html") ? [join(dir, entry.name)] : []);
const images = new Set(); let pages = 0;
function walk(node, fn) { fn(node); for (const child of node.children || []) walk(child, fn); }
for (const file of scan(root)) {
	pages++;
	walk(fromHtml(readFileSync(file, "utf8")), node => {
		if (node.tagName === "img" && typeof node.properties?.src === "string") images.add(node.properties.src);
		for (const key of ["href", "src"]) {
			const value = node.properties?.[key];
			if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("cdn-cgi/")) continue;
			const path = decodeURI(new URL(value, "https://blog.lanyu.dev").pathname);
			if (!existsSync(join(root, path))) errors.push(file.slice(root.length)+" -> missing "+value);
		}
	});
}
for (const file of Object.keys(baseline.mediaHashes)) {
	if (!existsSync(join(root, file))) errors.push("Missing image: "+file);
}
for (const photo of JSON.parse(readFileSync("src/data/gallery.json", "utf8"))) {
	const expected = mediaUrl(photo.image, process.env.PUBLIC_MEDIA_ORIGIN || "");
	if (!images.has(expected)) errors.push("Missing gallery image: "+expected);
}
if (!existsSync(join(root, "pagefind/pagefind.js"))) errors.push("Search index missing");
if (errors.length) { console.error([...new Set(errors)].join("\n")); process.exitCode=1; }
else console.log(`Verified ${baseline.posts.length} articles, ${Object.keys(baseline.mediaHashes).length} images, search index and local links across ${pages} pages. No retired entries generated.`);
