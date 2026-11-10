import { expectNotFoundPage } from "@websites/playwright-support/not-found";
import { test } from "@websites/playwright-support/test";

for (const path of [
	"/missing-page",
	"/nested/missing-page",
	"/projects/unknown-project",
]) {
	test(`404 keeps navigation usable at ${path}`, async ({
		page,
		diagnostics,
	}) => {
		await expectNotFoundPage(
			{ page, diagnostics },
			{
				path,
				heading: "404",
				title: "CD: Page Not Found",
				navigation: {
					name: "About",
					destination: /\/about$/,
					title: "About Carolyn",
				},
			},
		);
	});
}
