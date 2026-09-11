import { test as base, expect } from "@playwright/test";
import { installRecoveryBrowserGuard } from "../scripts/recovery-browser-guard.mjs";

// Only the isolated recovery runner sets this. Ordinary app tests retain their behavior.
export const test = base.extend<{ recoveryGuard: undefined }>({
	recoveryGuard: [
		async ({ context }, use) => {
			const origin = process.env.PAUL_RECOVERY_ORIGIN;
			if (origin) {
				await installRecoveryBrowserGuard(
					context,
					origin,
					process.env.PAUL_ACCEPTANCE_MODE,
				);
			}
			await use(undefined);
		},
		{ auto: true },
	],
});
export { expect };
