import { describe, expect, test } from "vitest";
import { buildProjectAuthManifest } from "@/lib/project-auth-manifest-builder";

const deriveAuthVersion = async (slug: string, password: string) =>
	`version:${slug}:${password}`;

describe("project auth manifest", () => {
	test("records public and protected projects explicitly", async () => {
		const manifest = await buildProjectAuthManifest(
			[
				{ slug: "public-project" },
				{ slug: "protected-project", password: "secret" },
			],
			async (password) => `hashed:${password}`,
			deriveAuthVersion,
		);

		expect(manifest).toEqual({
			"public-project": { authVersion: null, passwordHash: null },
			"protected-project": {
				authVersion: "version:protected-project:secret",
				passwordHash: "hashed:secret",
			},
		});
	});

	test("rejects duplicate and malformed slugs", async () => {
		const hashPassword = async (password: string) => password;
		await expect(
			buildProjectAuthManifest(
				[{ slug: "duplicate" }, { slug: "duplicate" }],
				hashPassword,
				deriveAuthVersion,
			),
		).rejects.toThrow("Duplicate project slug: duplicate");
		await expect(
			buildProjectAuthManifest(
				[{ slug: "Invalid Slug" }],
				hashPassword,
				deriveAuthVersion,
			),
		).rejects.toThrow("Project has an invalid slug");
	});

	test("rejects passwords above bcrypt's byte limit", async () => {
		await expect(
			buildProjectAuthManifest(
				[{ slug: "protected", password: "é".repeat(37) }],
				async (password) => password,
				deriveAuthVersion,
			),
		).rejects.toThrow("72-byte limit");
	});
});
