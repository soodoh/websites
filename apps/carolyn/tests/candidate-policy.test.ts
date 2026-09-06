import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test } from "@playwright/test";
import { routeCandidateRequest } from "@/tests/candidate-policy";

async function listen(server: Server): Promise<string> {
	await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
	return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

async function close(server: Server): Promise<void> {
	server.closeAllConnections();
	await new Promise<void>((resolve, reject) =>
		server.close((error) => (error ? reject(error) : resolve())),
	);
}

for (const path of ["/control", "/direct", "/multihop", "/empty"]) {
	test(`candidate policy confines real browser navigation ${path} to its first nonredirect response`, async ({
		browser,
	}) => {
		const candidateRequests: string[] = [];
		const destinationRequests: string[] = [];
		const destination = createServer((request, response) => {
			destinationRequests.push(request.url ?? "");
			response.end("escaped candidate");
		});
		const destinationOrigin = await listen(destination);
		const candidate = createServer((request, response) => {
			candidateRequests.push(request.url ?? "");
			if (request.url === "/control") {
				response.setHeader("Content-Type", "text/html");
				response.end("<h1>candidate control</h1>");
			} else {
				response.writeHead(request.url === "/multihop" ? 307 : 302, {
					location:
						request.url === "/empty"
							? ""
							: request.url === "/multihop"
								? "/hop"
								: `${destinationOrigin}/escaped`,
				});
				response.end();
			}
		});
		const origin = await listen(candidate);
		const context = await browser.newContext({ serviceWorkers: "block" });
		try {
			await context.route("**/*", (route) =>
				routeCandidateRequest(route, origin),
			);
			const page = await context.newPage();
			const navigation = await page
				.goto(origin + path)
				.catch((error: unknown) => error);
			await test.info().attach("loopback-request-counters", {
				body: JSON.stringify({ candidateRequests, destinationRequests }),
				contentType: "application/json",
			});
			expect(destinationRequests).toEqual([]);
			// Completed navigation must never fetch even the same-origin redirect hop.
			expect(candidateRequests).toEqual([path]);
			if (path === "/control") {
				await expect(page.getByRole("heading")).toHaveText("candidate control");
			} else {
				expect(navigation).toBeInstanceOf(Error);
			}
		} finally {
			await context.close();
			await close(candidate);
			await close(destination);
		}
	});
}
