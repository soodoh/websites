import { expect, test } from "../playwright";

test("the development server renders the home page", async ({ request }) => {
	const response = await request.get("/");
	expect(response.status()).toBe(200);
	expect(await response.text()).toContain("Carolyn");
});
