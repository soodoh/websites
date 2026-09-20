const baseUrl = new URL(
	process.env.HOSTING_BASE_URL ?? "http://127.0.0.1:4173/",
);
const expectAmplify = process.env.HOSTING_EXPECT_AMPLIFY === "1";
const expectDomainRedirects =
	process.env.HOSTING_EXPECT_DOMAIN_REDIRECTS === "1";
const expectedCommit = process.env.HOSTING_EXPECT_COMMIT;

/** @type {(condition: unknown, message: string) => asserts condition} */
const assert = (condition, message) => {
	if (!condition) {
		throw new Error(message);
	}
};

/** @param {string | URL} url */
const request = async (url) => {
	const response = await fetch(url, { redirect: "manual" });
	return { response, body: await response.text() };
};

/** @param {Headers} headers @param {string} directive */
const hasCacheDirective = (headers, directive) =>
	(headers.get("cache-control") ?? "")
		.toLowerCase()
		.split(",")
		.map((value) => value.trim())
		.includes(directive);

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
for (const path of [
	"/hosting-migration-smoke/missing-page",
	"/hosting-migration-smoke/missing-page.missing",
]) {
	const missing = await request(new URL(path, baseUrl));
	missingResponses.push({ path, response: missing.response });
	assert(
		missing.response.status === 404,
		`${path} returned ${missing.response.status}, expected 404`,
	);
	assert(
		missing.body.includes("404: Page Not Found") &&
			!missing.body.includes("<script"),
		`${path} does not return the hydration-free custom 404 body`,
	);
}

if (expectedCommit) {
	const releaseUrl = new URL("/release.json", baseUrl);
	releaseUrl.searchParams.set("expectedCommit", expectedCommit);
	const release = await request(releaseUrl);
	assert(
		release.response.status === 200,
		`Release marker returned ${release.response.status}`,
	);
	const releaseIdentity = JSON.parse(release.body);
	assert(
		releaseIdentity.commit === expectedCommit,
		`Release marker commit ${releaseIdentity.commit} does not match ${expectedCommit}`,
	);
	if (expectAmplify) {
		assert(
			hasCacheDirective(release.response.headers, "no-store") &&
				hasCacheDirective(release.response.headers, "must-revalidate"),
			`Release marker cache policy is incorrect: ${release.response.headers.get("cache-control")}`,
		);
	}
}

if (expectAmplify) {
	const expectedSecurityHeaders = new Map([
		["strict-transport-security", "max-age=63072000; includeSubDomains"],
		["x-content-type-options", "nosniff"],
		["x-frame-options", "DENY"],
		["referrer-policy", "strict-origin-when-cross-origin"],
		["permissions-policy", "camera=(), geolocation=(), microphone=()"],
	]);

	for (const [name, expectedValue] of expectedSecurityHeaders) {
		for (const { path, response } of [
			{ path: "/", response: root.response },
			...missingResponses,
		]) {
			assert(
				response.headers.get(name) === expectedValue,
				`${name} header is missing or incorrect for ${path}`,
			);
		}
	}
	assert(
		hasCacheDirective(root.response.headers, "no-store") &&
			hasCacheDirective(root.response.headers, "must-revalidate"),
		`Root cache policy is incorrect: ${root.response.headers.get("cache-control")}`,
	);
	assert(
		hasCacheDirective(cleanPath.response.headers, "no-store") &&
			hasCacheDirective(cleanPath.response.headers, "must-revalidate"),
		`Clean-path cache policy is incorrect: ${cleanPath.response.headers.get("cache-control")}`,
	);
	assert(
		hasCacheDirective(hashedAsset.response.headers, "max-age=31536000") &&
			hasCacheDirective(hashedAsset.response.headers, "immutable"),
		`Hashed asset cache policy is incorrect: ${hashedAsset.response.headers.get("cache-control")}`,
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
