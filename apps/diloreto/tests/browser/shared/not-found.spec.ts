import { expectNotFoundPage } from "@websites/playwright-support/not-found";
import { test } from "../../support/test";

for (const path of ["/missing-page", "/nested/missing-page"]) {
	test(`404 keeps navigation usable at ${path}`, async ({
		page,
		diagnostics,
	}) => {
		await expectNotFoundPage(
			{ page, diagnostics },
			{
				path,
				heading: "404: Page Not Found",
				title: "Page Not Found | The DiLoreto Family",
				mobileMenu: false,
				navigation: {
					name: "Return to the home page",
					destination: /\/$/,
					title: "The DiLoreto Family",
				},
			},
		);
	});
}
