const baseUrl = new URL(
	process.env.HOSTING_BASE_URL ?? "http://127.0.0.1:3000/",
);
const expectAmplify = process.env.HOSTING_EXPECT_AMPLIFY === "1";
const expectDomainRedirects =
	process.env.HOSTING_EXPECT_DOMAIN_REDIRECTS === "1";

const assert = (condition, message) => {
	if (!condition) {
		throw new Error(message);
	}
};

const request = async (url, options = {}) => {
	const response = await fetch(url, {
		redirect: "manual",
		...options,
	});
	return { response, body: await response.text() };
};

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

const image = await request(new URL("/images/profile-480.webp", baseUrl), {
	headers: { "Accept-Encoding": "br, gzip" },
});
assert(
	image.response.status === 200,
	`Image returned ${image.response.status}`,
);
assert(
	image.response.headers.get("content-type")?.startsWith("image/webp"),
	"Responsive image has an incorrect content type",
);

const missing = await request(
	new URL("/hosting-migration-smoke/missing-page", baseUrl),
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

	for (const [name, expectedValue] of expectedSecurityHeaders) {
		assert(
			root.response.headers.get(name) === expectedValue,
			`${name} header is missing or incorrect`,
		);
	}

	const htmlCacheControl = root.response.headers.get("cache-control") ?? "";
	assert(
		htmlCacheControl.includes("no-store") &&
			htmlCacheControl.includes("must-revalidate"),
		`HTML cache policy is incorrect: ${htmlCacheControl}`,
	);
	const assetCacheControl =
		hashedAsset.response.headers.get("cache-control") ?? "";
	assert(
		assetCacheControl.includes("max-age=31536000") &&
			assetCacheControl.includes("immutable"),
		`Hashed asset cache policy is incorrect: ${assetCacheControl}`,
	);
	const imageCacheControl = image.response.headers.get("cache-control") ?? "";
	assert(
		imageCacheControl.includes("must-revalidate") &&
			!imageCacheControl.includes("immutable"),
		`Image cache policy is incorrect: ${imageCacheControl}`,
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
}

console.log(
	`Hosting smoke checks passed for ${baseUrl.origin} (${expectAmplify ? "Amplify" : "local"} mode).`,
);
