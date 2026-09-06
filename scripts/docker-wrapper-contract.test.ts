import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const wrappers = [
	["sarabeth", "playwright-docker.sh"],
	["paul", "playwright-docker.sh"],
	["carolyn", "playwright-docker.sh"],
	["diloreto", "test-playwright-docker.sh"],
];

// No Docker daemon, network, production configuration, or actual project artifacts.
describe("Sarabeth successful-container manifest contracts", () => {
	const commit = "0123456789abcdef0123456789abcdef01234567";
	for (const [mode, manifest, expectedExit] of [
		["matching", JSON.stringify({ commit }), 0],
		["copy-failure", "", 1],
		["missing-file", "", 1],
		["malformed-json", "{broken", 1],
		["missing-commit", "{}", 1],
		["mismatched-commit", JSON.stringify({ commit: "a".repeat(40) }), 1],
	] as const) {
		test(`${mode}: verifies the actual successful container and cleans only its own ID`, () => {
			const scratch = mkdtempSync(join(tmpdir(), "websites-sarabeth-manifest-"));
			try {
				const appRoot = join(scratch, "apps/sarabeth");
				const bin = join(scratch, "bin");
				const log = join(scratch, "docker.log");
				const script = join(appRoot, "scripts/playwright-docker.sh");
				mkdirSync(join(appRoot, "scripts"), { recursive: true });
				mkdirSync(bin);
				writeFileSync(join(scratch, "bun.lock"), "fixture lock identity\n");
				writeFileSync(script, readFileSync(join(root, "apps/sarabeth/scripts/playwright-docker.sh")));
				writeFileSync(join(bin, "docker"), `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$MOCK_DOCKER_LOG"
case "$1" in
  build) exit 0 ;;
  create) echo owned-manifest-container ;;
  start) [[ "$*" == "start --attach owned-manifest-container" ]] ;;
  cp)
    # Diagnostic copy failure must not bypass the successful-container manifest check.
    [[ "$2" == "owned-manifest-container:/work/apps/sarabeth/.amplify-hosting/static/__deployment.json" ]] || exit 2
    [[ "$MOCK_MANIFEST_MODE" != copy-failure ]] || exit 2
    [[ "$MOCK_MANIFEST_MODE" != missing-file ]] || exit 0
    printf '%s' "$MOCK_MANIFEST" > "$3"
    ;;
  rm) [[ "$*" == "rm --force owned-manifest-container" ]] ;;
  *) exit 99 ;;
esac
`, { mode: 0o755 });
				writeFileSync(join(bin, "git"), `#!/usr/bin/env bash
[[ "$*" == "-C $MOCK_WORKSPACE_ROOT rev-parse HEAD" ]] || exit 99
echo ${commit}
`, { mode: 0o755 });
				const run = Bun.spawnSync(["bash", script], {
					cwd: scratch,
					env: {
						PATH: `${bin}:${process.env.PATH}`,
						HOME: scratch,
						MOCK_DOCKER_LOG: log,
						MOCK_WORKSPACE_ROOT: scratch,
						MOCK_MANIFEST_MODE: mode,
						MOCK_MANIFEST: manifest,
						RELEASE_COMMIT: "untrusted-inherited-value",
					},
				});
				expect(run.exitCode).toBe(expectedExit);
				const commands = readFileSync(log, "utf8").trim().split("\n");
				expect(commands.filter(command => command.startsWith("create "))).toHaveLength(1);
				expect(commands).toContain("start --attach owned-manifest-container");
				expect(commands).toContain(`cp owned-manifest-container:/work/apps/sarabeth/.amplify-hosting/static/__deployment.json ${appRoot}/test-results/container-deployment.json`);
				expect(commands.filter(command => command.startsWith("rm "))).toEqual(["rm --force owned-manifest-container"]);
				expect(commands.join("\n")).toContain(`--env RELEASE_COMMIT=${commit}`);
				expect(commands.join("\n")).not.toContain("untrusted-inherited-value");
			} finally {
				rmSync(scratch, { recursive: true, force: true });
			}
		});
	}
});
describe("workspace Docker wrapper failure contracts", () => {
	for (const [app, script] of wrappers) {
		test(`${app} preserves test failure and cleans only its own container`, () => {
			const scratch = mkdtempSync(join(tmpdir(), "websites-docker-contract-"));
			try {
				const appRoot = join(scratch, "apps", app);
				const bin = join(scratch, "bin");
				const log = join(scratch, "docker.log");
				mkdirSync(join(appRoot, "scripts"), { recursive: true });
				mkdirSync(bin);
				writeFileSync(join(scratch, "bun.lock"), "fixture lock identity\n");
				writeFileSync(join(appRoot, "scripts", script), readFileSync(join(root, "apps", app, "scripts", script)));
				writeFileSync(join(bin, "docker"), `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$MOCK_DOCKER_LOG"
case "$1" in
  info) echo aarch64 ;;
  build) exit 0 ;;
  create) echo owned-contract-container ;;
  start) exit 23 ;;
  cp) exit 2 ;;
  rm) [[ "$*" == "rm --force owned-contract-container" ]] ;;
  *) exit 99 ;;
esac
`, { mode: 0o755 });
				writeFileSync(join(bin, "git"), `#!/usr/bin/env bash
[[ "$*" == "-C $MOCK_WORKSPACE_ROOT rev-parse HEAD" ]] || exit 99
echo 0123456789abcdef0123456789abcdef01234567
`, { mode: 0o755 });
				const run = Bun.spawnSync(["bash", join(appRoot, "scripts", script), "--update-snapshots=none"], {
					cwd: scratch,
					env: {
						PATH: `${bin}:${process.env.PATH}`,
						HOME: scratch,
						MOCK_DOCKER_LOG: log,
						MOCK_WORKSPACE_ROOT: scratch,
						RELEASE_COMMIT: "untrusted-inherited-value",
						PLAYWRIGHT_SKIP_BUILD: "1",
						PLAYWRIGHT_BASE_URL: "http://127.0.0.1:4173",
						EXPECTED_ARTIFACT_MODE: "fixture",
					},
				});
				expect(run.exitCode).toBe(23);
				const commands = readFileSync(log, "utf8");
				expect(commands).toContain("rm --force owned-contract-container");
				expect(commands).not.toContain("type=bind");
				expect(commands).not.toContain("--volume");
				expect(commands).not.toContain("prune");
				expect(commands).not.toContain("tests/.");
				expect(commands).not.toContain("__screenshots__");
				if (app === "sarabeth") {
					expect(commands).toContain("--env RELEASE_COMMIT=0123456789abcdef0123456789abcdef01234567");
					expect(commands).not.toContain("untrusted-inherited-value");
				}
				if (app === "carolyn") {
					expect(commands).toContain("NODE_OPTIONS=--dns-result-order=ipv4first bun run build:test");
					expect(commands).toContain("NODE_OPTIONS=--dns-result-order=ipv4first bun run build:production:test");
				}
			} finally {
				rmSync(scratch, { recursive: true, force: true });
			}
		});
	}
});
