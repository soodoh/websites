import assert from "node:assert/strict";
import {
	assertCacheDirectives,
	assertSecurityHeaders,
	hostingEnvironment,
	request,
	verifyReleaseMarker,
} from "../../../scripts/deploy/hosting.ts";

const environment = hostingEnvironment("http://127.0.0.1:3000/");
const { baseUrl, expectAmplify, expectDomainRedirects } = environment;

const root = await request(new URL("/", baseUrl));
assert(root.response.status === 200, `Root returned ${root.response.status}`);
assert(
	root.body.includes("Paul<br/>DiLoreto") &&
		root.body.includes(
			"Frontend platforms, technical strategy, and developer experience.",
		),
	"Root does not contain the current main-branch content",
);
assert(
	root.body.includes('<link rel="canonical" href="https://pauldiloreto.com/"'),
	"Root canonical metadata is missing or incorrect",
);
for (const hash of ["projects", "about", "contact"]) {
	assert(
		root.body.includes(`href="/#${hash}"`),
		`Root is missing the #${hash} navigation anchor`,
	);
}

const hashedAssetPath = root.body.match(
	/(?:href|src)="(\/assets\/[A-Za-z0-9_.-]+\.(?:css|js))"/,
)?.[1];
assert(
	hashedAssetPath,
	"Root does not reference a hashed CSS or JavaScript asset",
);
const hashedAsset = await request(new URL(hashedAssetPath, baseUrl), {
	headers: { "Accept-Encoding": "br, gzip" },
});
assert(
	hashedAsset.response.status === 200,
	`Hashed asset returned ${hashedAsset.response.status}`,
);

const imagePath = root.body.match(
	/(?:src|srcSet)="(\/assets\/[^" ]+\.(?:avif|webp|png|jpe?g))/i,
)?.[1];
assert(imagePath, "Root does not reference a build-generated responsive image");
const image = await request(new URL(imagePath, baseUrl), {
	headers: { "Accept-Encoding": "br, gzip" },
});
assert(
	image.response.status === 200,
	`Image returned ${image.response.status}`,
);
assert(
	image.response.headers.get("content-type")?.startsWith("image/"),
	"Responsive image has an incorrect content type",
);

await verifyReleaseMarker(environment);

const missing = await request(
	new URL("/hosting-migration-smoke/missing-page.missing", baseUrl),
);
assert(
	missing.response.status === 404,
	`Unknown path returned ${missing.response.status}, expected 404`,
);
assert(
	missing.body.includes("404: Page Not Found") &&
		!missing.body.includes('class="h-screen flex flex-col'),
	"Unknown path does not return only the custom 404 body",
);

if (expectAmplify) {
	const expectedSecurityHeaders = new Map([
		["strict-transport-security", "max-age=63072000; includeSubDomains"],
		["x-content-type-options", "nosniff"],
		["referrer-policy", "strict-origin-when-cross-origin"],
		["x-frame-options", "DENY"],
		[
			"permissions-policy",
			"camera=(), geolocation=(), microphone=(), payment=(), usb=()",
		],
	]);

	assertSecurityHeaders(root.response, expectedSecurityHeaders);

	assertCacheDirectives(root.response, ["no-store", "must-revalidate"], "HTML");
	assertCacheDirectives(
		hashedAsset.response,
		["max-age=31536000", "immutable"],
		"Hashed asset",
	);
	assertCacheDirectives(
		image.response,
		["max-age=31536000", "immutable"],
		"Image",
	);
	assert(
		Boolean(hashedAsset.response.headers.get("content-encoding")),
		"Hashed text asset was not delivered with compression",
	);
}

if (expectDomainRedirects) {
	const redirectPath = "/hosting-redirect-check/deep/path?source=smoke";
	const httpRedirect = await request(`http://pauldiloreto.com${redirectPath}`);
	assert(
		[301, 308].includes(httpRedirect.response.status),
		`HTTP apex redirect returned ${httpRedirect.response.status}`,
	);
	assert(
		httpRedirect.response.headers.get("location") ===
			`https://pauldiloreto.com${redirectPath}`,
		"HTTP apex redirect did not preserve the path and query",
	);

	const wwwRedirect = await request(
		`https://www.pauldiloreto.com${redirectPath}`,
	);
	assert(
		wwwRedirect.response.status === 301,
		`www redirect returned ${wwwRedirect.response.status}`,
	);
	assert(
		wwwRedirect.response.headers.get("location") ===
			`https://pauldiloreto.com${redirectPath}`,
		"www redirect did not preserve the path and query",
	);

	const legacyRedirect = await request(
		`https://paul.diloreto.com${redirectPath}`,
	);
	assert(
		legacyRedirect.response.status === 301,
		`paul.diloreto.com redirect returned ${legacyRedirect.response.status}`,
	);
	assert(
		legacyRedirect.response.headers.get("location") ===
			`https://pauldiloreto.com${redirectPath}`,
		"paul.diloreto.com redirect did not preserve the path and query",
	);
}

console.log(
	`Hosting smoke checks passed for ${baseUrl.origin} (${expectAmplify ? "Amplify" : "local"} mode).`,
);
