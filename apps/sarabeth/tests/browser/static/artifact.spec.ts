import publicRoutes from "@scripts/public-routes.json" with { type: "json" };
import { expect, test } from "@websites/playwright-support/test";

test("serves both clean-path forms from the packaged public pages", async ({
	request,
}) => {
	for (const path of publicRoutes.filter((path) => path !== "/")) {
		const index = await request.get(`${path}/index.html`);
		expect(index.status()).toBe(200);
		for (const form of [path, `${path}/`, `${path}.html`]) {
			const response = await request.get(form, { maxRedirects: 0 });
			expect(response.status(), form).toBe(200);
			expect(await response.text(), form).toBe(await index.text());
		}
	}
});

test("hydrates and navigates using only packaged static route data", async ({
	page,
}) => {
	const dataResponses: Array<{ path: string; status: number }> = [];
	const serverFunctionRequests: string[] = [];
	let documentNavigations = 0;
	page.on("response", (response) => {
		const path = new URL(response.url()).pathname;
		if (path.startsWith("/__tsr/staticServerFnCache/")) {
			dataResponses.push({ path, status: response.status() });
		}
	});
	page.on("request", (request) => {
		const path = new URL(request.url()).pathname;
		if (path.includes("/_serverFn")) serverFunctionRequests.push(path);
	});
	await page.goto("/");
	page.on("request", (request) => {
		if (
			request.isNavigationRequest() &&
			request.resourceType() === "document"
		) {
			documentNavigations += 1;
		}
	});
	const trigger = page.getByRole("button", { name: "Open Navigation" });
	if (await trigger.isVisible()) await trigger.click();
	await page
		.getByRole("link", { name: "About", exact: true })
		.filter({ visible: true })
		.click();
	await expect(page).toHaveURL(/\/about$/);
	await expect(page).toHaveTitle("About Sarabeth");
	await expect(
		page.getByRole("heading", { name: "Sarabeth Belón", exact: true }),
	).toBeVisible();
	expect(documentNavigations).toBe(0);
	expect(serverFunctionRequests).toEqual([]);
	expect(dataResponses.length).toBeGreaterThan(0);
	expect(dataResponses.every(({ status }) => status === 200)).toBe(true);
});

test("does not hide missing route-data files behind an SSR or SPA fallback", async ({
	request,
}) => {
	const response = await request.get(
		"/__tsr/staticServerFnCache/missing-release.json",
	);
	expect(response.status()).toBe(404);
	const unsupported = await request.post("/about");
	expect(unsupported.status()).toBe(405);
	expect(unsupported.headers().allow).toBe("GET, HEAD");
});
