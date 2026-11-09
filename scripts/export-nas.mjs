import { readdir, mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
const publicRoot = path.resolve("public");
const output = path.resolve("nas-export");
let count = 0;
async function copyImages(relative) {
	const source = path.join(publicRoot, relative);
	for (const entry of await readdir(source, { withFileTypes:true })) {
		if (entry.isSymbolicLink()) continue;
		const child = path.join(relative, entry.name);
		if (entry.isDirectory()) await copyImages(child);
		else if (entry.isFile() && /\.(png|jpe?g|gif|webp|avif)$/i.test(entry.name)) {
			const target = path.join(output, child);
			await mkdir(path.dirname(target), { recursive:true });
			await copyFile(path.join(publicRoot, child), target);
			count++;
		}
	}
}
await copyImages("images/posts");
await copyImages("images/gallery");
console.log(`Exported ${count} public images to ${output}`);
