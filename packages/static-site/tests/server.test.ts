import { afterEach, expect, test, vi } from "vitest";
import { acceptNotFoundPrerender } from "../src/server";

afterEach(() => vi.unstubAllEnvs());

test("lets the native prerenderer save the genuine 404 without editing its HTML", async () => {
	vi.stubEnv("TSS_PRERENDERING", "true");
	const html =
		'<html><body>Page not found<script>window.bootstrap="notFound"</script></body></html>';
	const response = new Response(html, {
		status: 404,
		headers: { "Content-Type": "text/html", "X-Test": "preserved" },
	});
	const rendered = acceptNotFoundPrerender(
		new Request("http://localhost/404/"),
		response,
	);
	expect(rendered.status).toBe(200);
	expect(rendered.headers.get("X-Test")).toBe("preserved");
	expect(await rendered.text()).toBe(html);
});

test("never changes runtime HTTP status", () => {
	vi.stubEnv("TSS_PRERENDERING", "false");
	const response = new Response("Not found", { status: 404 });
	expect(
		acceptNotFoundPrerender(new Request("http://localhost/404"), response),
	).toBe(response);
});

test("does not hide missing routes, auth failures, or rendering errors during builds", () => {
	vi.stubEnv("TSS_PRERENDERING", "true");
	for (const [path, status] of [
		["/missing", 404],
		["/projects/private", 404],
		["/404.html", 404],
		["/404", 401],
		["/404", 403],
		["/404", 500],
		["/404", 200],
	] as const) {
		const response = new Response("unchanged", { status });
		expect(
			acceptNotFoundPrerender(new Request(`http://localhost${path}`), response),
		).toBe(response);
	}
});
