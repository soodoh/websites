import { expect, test } from "@playwright/test";
import { selectFilter } from "@tests/visual-helpers";

const publicProjectPath = "/projects/the-voice-app-agt-app";
const protectedProjectPath = "/projects/magnolia-app";
const artifactMode = process.env.EXPECTED_ARTIFACT_MODE;
if (artifactMode !== "fixture" && artifactMode !== "production") {
	throw new Error("EXPECTED_ARTIFACT_MODE must be fixture or production");
}

function expectArtifactTarget(
	response: { headers: () => Record<string, string> },
	target: "compute" | "static",
): void {
	expect(response.headers()["x-amplify-artifact-target"]).toBe(target);
}

test.describe("emitted Amplify artifact", () => {
	test("serves fixed and public project pages statically", async ({
		page,
		request,
	}) => {
		for (const path of [
			"/",
			"/about",
			"/photography",
			"/projects",
			publicProjectPath,
		]) {
			const response = await request.get(path, { maxRedirects: 0 });
			expect(response.status(), path).toBe(200);
			expectArtifactTarget(response, "static");
		}

		const dataRequests: string[] = [];
		page.on("request", (request) => {
			const pathname = new URL(request.url()).pathname;
			if (
				pathname.includes("/_serverFn/") ||
				pathname.includes("/staticServerFnCache/")
			) {
				dataRequests.push(pathname);
			}
		});
		await page.goto("/projects");
		await page.locator("html[data-hydrated='true']").waitFor();
		await page.getByRole("link", { name: /The Voice App \/ AGT App/ }).click();
		await expect(
			page.getByRole("heading", { name: "The Voice App / AGT App" }),
		).toBeVisible();
		expect(
			dataRequests.some((path) => path.includes("/staticServerFnCache/")),
		).toBe(true);
		expect(dataRequests.some((path) => path.includes("/_serverFn/"))).toBe(
			false,
		);
	});

	test("switches every photography album through immutable static JSON", async ({
		page,
	}) => {
		const albumResponses: string[] = [];
		page.on("response", (response) => {
			if (new URL(response.url()).pathname.startsWith("/__release/albums/")) {
				albumResponses.push(response.url());
				expectArtifactTarget(response, "static");
				expect(response.headers()["cache-control"]).toBe(
					"public, max-age=31536000, immutable",
				);
			}
		});
		if (artifactMode === "production") {
			await page.route("https://images.ctfassets.net/**", (route) =>
				route.fulfill({ path: "public/favicon.png", status: 200 }),
			);
		}
		await page.goto("/photography");
		await page.locator("html[data-hydrated='true']").waitFor();
		await selectFilter(page, "Dance", "Portraits");
		await expect(page.locator("[data-photography-album]")).toHaveAttribute(
			"data-photography-album",
			"Portraits",
		);
		await selectFilter(page, "Portraits", "Spaces");
		await expect(page.locator("[data-photography-album]")).toHaveAttribute(
			"data-photography-album",
			"Spaces",
		);
		expect(albumResponses).toHaveLength(2);
	});

	test("keeps protected details behind the secure authorization cookie", async ({
		page,
	}) => {
		const gate = await page.goto(protectedProjectPath);
		if (!gate) throw new Error("Protected project returned no response");
		expectArtifactTarget(gate, "compute");
		const gateBody = await gate.text();
		expect(gateBody).not.toContain(
			"On July 15, 2021, we launched the Magnolia App",
		);
		await expect(
			page.getByRole("heading", { name: "Password Protected" }),
		).toBeVisible();

		await page
			.getByLabel("Password", { exact: true })
			.fill("playwright-password");
		await page.getByRole("button", { name: "Submit password" }).click();
		await expect(
			page.getByRole("heading", { name: "Magnolia App" }),
		).toBeVisible();
		const cookie = (await page.context().cookies()).find(
			(candidate) => candidate.name === "project-auth-magnolia-app",
		);
		expect(cookie).toMatchObject({
			httpOnly: true,
			path: "/",
			sameSite: "Strict",
			secure: true,
		});

		await page.reload();
		await expect(
			page.getByRole("heading", { name: "Magnolia App" }),
		).toBeVisible();
		await expect(
			page.getByText(/On July 15, 2021, we launched the Magnolia App/),
		).toBeVisible();
	});

	test("preserves the resume redirect and keeps unknown paths off compute", async ({
		request,
	}) => {
		const resume = await request.get("/resume", { maxRedirects: 0 });
		expect(resume.status()).toBe(307);
		expectArtifactTarget(resume, "compute");
		expect(resume.headers().location).toMatch(
			/^https:\/\/[^/]+\.ctfassets\.net\//,
		);

		const missingRoute = await request.get("/not-an-artifact-route", {
			maxRedirects: 0,
		});
		expect(missingRoute.status()).toBe(404);
		expectArtifactTarget(missingRoute, "static");
		expect(await missingRoute.text()).toContain("Page not found");

		const missingAsset = await request.get("/missing-asset.png", {
			maxRedirects: 0,
		});
		expect(missingAsset.status()).toBe(404);
		expectArtifactTarget(missingAsset, "static");
	});
});
