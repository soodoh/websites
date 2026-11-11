import assert from "node:assert/strict";
import {
	assertCacheDirectives,
	assertSecurityHeaders,
	hasCacheDirective,
	hostingEnvironment,
	request,
	verifyReleaseMarker,
} from "../../../scripts/deploy/hosting.ts";

const environment = hostingEnvironment("http://127.0.0.1:4173/");
const { baseUrl, expectAmplify, expectDomainRedirects } = environment;

const root = await request(new URL("/", baseUrl));
assert(root.response.status === 200, `Root returned ${root.response.status}`);
assert(
	root.body.includes("The DiLoreto Family") &&
		root.body.includes("Family History"),
	"Root does not contain the expected static site content",
);

const cleanPath = await request(new URL("/areyou", baseUrl));
assert(
	cleanPath.response.status === 200,
	`/areyou returned ${cleanPath.response.status}`,
);
assert(
	cleanPath.body.includes("Are You a DiLoreto?") &&
		cleanPath.body.includes("Explore the Family Tree"),
	"/areyou does not contain the family-history page",
);
const cleanPathWithSlash = await request(new URL("/areyou/", baseUrl));
assert(
	cleanPathWithSlash.response.status === 200,
	`/areyou/ returned ${cleanPathWithSlash.response.status}`,
);
assert(
	cleanPathWithSlash.body.includes("Explore the Family Tree"),
	"/areyou/ does not contain the family-history page",
);

const hashedAssetPath = root.body.match(
	/(?:href|src)=["'](\/assets\/[A-Za-z0-9_.-]+\.(?:css|js))["']/,
)?.[1];
assert(
	hashedAssetPath,
	"Root does not reference a hashed CSS or JavaScript asset",
);
const hashedAsset = await request(new URL(hashedAssetPath, baseUrl));
assert(
	hashedAsset.response.status === 200,
	`Hashed asset returned ${hashedAsset.response.status}`,
);

const missingResponses = [];
for (const { path, amplifyCanonicalPath } of [
	{
		path: "/hosting-migration-smoke/missing-page",
		amplifyCanonicalPath: "/hosting-migration-smoke/missing-page/",
	},
	{
		path: "/hosting-migration-smoke/missing-page.missing",
		amplifyCanonicalPath: undefined,
	},
]) {
	let missing = await request(new URL(path, baseUrl));
	missingResponses.push({ path, response: missing.response });

	if (
		expectAmplify &&
		amplifyCanonicalPath &&
		missing.response.status === 301
	) {
		const location = missing.response.headers.get("location");
		assert(location, `${path} did not return a Location header`);
		const canonicalUrl = new URL(location, baseUrl);
		assert(
			canonicalUrl.origin === baseUrl.origin &&
				canonicalUrl.pathname === amplifyCanonicalPath,
			`${path} canonicalized to the wrong URL: ${canonicalUrl}`,
		);
		missing = await request(canonicalUrl);
		missingResponses.push({
			path: amplifyCanonicalPath,
			response: missing.response,
		});
	}

	assert(
		missing.response.status === 404,
		`${path} returned ${missing.response.status}, expected 404`,
	);
	assert(
		missing.body.includes("404: Page Not Found"),
		`${path} does not return the custom 404 body`,
	);
}

await verifyReleaseMarker(environment);

if (expectAmplify) {
	const expectedSecurityHeaders = new Map([
		["strict-transport-security", "max-age=63072000; includeSubDomains"],
		["x-content-type-options", "nosniff"],
		["x-frame-options", "DENY"],
		["referrer-policy", "strict-origin-when-cross-origin"],
		["permissions-policy", "camera=(), geolocation=(), microphone=()"],
	]);

	for (const { path, response } of [
		{ path: "/", response: root.response },
		...missingResponses,
	]) {
		assertSecurityHeaders(response, expectedSecurityHeaders, path);
	}
	assertCacheDirectives(root.response, ["no-store", "must-revalidate"], "Root");
	assertCacheDirectives(
		cleanPath.response,
		["no-store", "must-revalidate"],
		"Clean-path",
	);
	assertCacheDirectives(
		hashedAsset.response,
		["max-age=31536000", "immutable"],
		"Hashed asset",
	);
	const robots = await request(new URL("/robots.txt", baseUrl));
	assert(
		robots.response.status === 200,
		`robots.txt returned ${robots.response.status}`,
	);
	assert(
		hasCacheDirective(robots.response.headers, "no-store") &&
			!hasCacheDirective(robots.response.headers, "immutable"),
		`Non-fingerprinted file cache policy is incorrect: ${robots.response.headers.get("cache-control")}`,
	);
}

if (expectDomainRedirects) {
	assert(
		baseUrl.hostname === "diloreto.com",
		"Domain redirect checks require HOSTING_BASE_URL to use diloreto.com",
	);
	const redirectPath = "/hosting-redirect-check/deep/path";
	const query = "source=smoke&campaign=domain-migration";
	const redirects = [
		{
			source: `https://www.diloreto.com${redirectPath}?${query}`,
			targetOrigin: "https://diloreto.com",
		},
		{
			source: `https://paul.diloreto.com${redirectPath}?${query}`,
			targetOrigin: "https://pauldiloreto.com",
		},
	];

	for (const { source, targetOrigin } of redirects) {
		const redirect = await request(source);
		assert(
			redirect.response.status === 301,
			`${new URL(source).hostname} returned ${redirect.response.status}, expected 301`,
		);
		const location = redirect.response.headers.get("location");
		assert(
			location,
			`${new URL(source).hostname} did not return a Location header`,
		);
		const destination = new URL(location);
		assert(
			destination.origin === targetOrigin &&
				destination.pathname === redirectPath &&
				destination.searchParams.get("source") === "smoke" &&
				destination.searchParams.get("campaign") === "domain-migration",
			`${new URL(source).hostname} did not preserve the path and query: ${location}`,
		);
	}
}

console.log(
	`Hosting smoke checks passed for ${baseUrl.origin} (${expectAmplify ? "Amplify" : "local"} mode).`,
);
