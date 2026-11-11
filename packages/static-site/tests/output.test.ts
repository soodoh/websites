import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "vitest";
import { writeCleanPathAliases } from "../src/output";

const directories: string[] = [];
afterEach(async () => {
	await Promise.all(
		directories
			.splice(0)
			.map((path) => rm(path, { recursive: true, force: true })),
	);
});
async function fixture() {
	const root = await mkdtemp(join(tmpdir(), "static-aliases-"));
	directories.push(root);
	for (const path of [
		"index.html",
		"404.html",
		"areyou/index.html",
		"projects/example/index.html",
		"assets/file.js",
	]) {
		await mkdir(join(root, path, ".."), { recursive: true });
		await writeFile(join(root, path), path);
	}
	return root;
}

test("aliases nested indexes, preserves originals, and is repeatable", async () => {
	const root = await fixture();
	await writeCleanPathAliases(root, ["/", "/areyou", "/projects/example"]);
	await writeCleanPathAliases(root, ["/", "/areyou", "/projects/example"]);
	for (const path of ["areyou", "projects/example"]) {
		expect(await readFile(join(root, `${path}.html`), "utf8")).toBe(
			await readFile(join(root, path, "index.html"), "utf8"),
		);
	}
	expect(await readFile(join(root, "404.html"), "utf8")).toBe("404.html");
	await expect(readFile(`${root}.html`)).rejects.toMatchObject({
		code: "ENOENT",
	});
});

test("can limit aliases to the known public release paths", async () => {
	const root = await fixture();
	await writeCleanPathAliases(root, ["/", "/projects/example/"]);
	expect(await readFile(join(root, "projects/example.html"), "utf8")).toBe(
		"projects/example/index.html",
	);
	await expect(readFile(join(root, "areyou.html"))).rejects.toMatchObject({
		code: "ENOENT",
	});
	await expect(writeCleanPathAliases(root, ["/missing"])).rejects.toMatchObject(
		{ code: "ENOENT" },
	);
});

test("rejects aliases outside the output tree or over the root document", async () => {
	const root = await fixture();
	for (const path of ["/../outside", "..", "/./", "/areyou/.."]) {
		await expect(writeCleanPathAliases(root, [path])).rejects.toThrow(
			"inside the output directory",
		);
	}
});
