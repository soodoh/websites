/**
 * TanStack prerendering currently rejects non-2xx responses. Let it save the
 * genuine root not-found render at /404 without changing its serialized router
 * state or HTML. The hosting layer supplies HTTP 404 when serving the artifact.
 * Runtime responses (including auth failures and other paths) are untouched.
 */
export function acceptNotFoundPrerender(
	request: Request,
	response: Response,
): Response {
	if (
		process.env.TSS_PRERENDERING !== "true" ||
		new URL(request.url).pathname.replace(/\/$/, "") !== "/404" ||
		response.status !== 404
	) {
		return response;
	}
	return new Response(response.body, {
		status: 200,
		headers: response.headers,
	});
}
