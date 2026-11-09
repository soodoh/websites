import { createServer } from "node:net";

// LHCI only warns when its server fails to start. Refuse occupied ports first
// so it cannot accidentally audit an unrelated server already listening there.
export async function assertPortsAvailable(ports) {
	for (const port of ports) {
		await new Promise((accept, reject) => {
			const probe = createServer();
			probe.once("error", (error) =>
				reject(
					new Error(`Lighthouse requires free port ${port}`, { cause: error }),
				),
			);
			probe.listen(port, "127.0.0.1", () => probe.close(accept));
		});
	}
}
