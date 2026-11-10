import { expectNotFoundPage } from "@websites/playwright-support/not-found";
import { test } from "@websites/playwright-support/test";

for (const path of ["/missing-page", "/nested/missing-page"]) {
	test(`404 keeps navigation usable at ${path}`, async ({
		page,
		diagnostics,
	}) => {
		await expectNotFoundPage(
			{ page, diagnostics },
			{
				path,
				heading: "Page not found",
				title: "Page Not Found | Sarabeth Belón",
				navigation: {
					name: "About",
					destination: /\/about$/,
					title: "About Sarabeth",
				},
			},
		);
	});
}
