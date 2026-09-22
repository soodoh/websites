import { createServer } from "node:net";

export function parseTcpPort(value: string, name: string): number {
	const port = Number(value);
	if (!Number.isInteger(port) || port < 1 || port > 65_535) {
		throw new Error(`${name} must be an integer between 1 and 65535.`);
	}
	return port;
}

export async function assertTcpPortAvailable(
	port: number,
	label = "Amplify compute port",
): Promise<void> {
	const probe = createServer();
	try {
		await new Promise<void>((resolve, reject) => {
			probe.once("error", reject);
			probe.listen(port, "127.0.0.1", resolve);
		});
	} catch (error) {
		throw new Error(`${label} ${port} is already in use.`, {
			cause: error,
		});
	} finally {
		if (probe.listening) {
			await new Promise<void>((resolve, reject) => {
				probe.close((error) => (error ? reject(error) : resolve()));
			});
		}
	}
}
