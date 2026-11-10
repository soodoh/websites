import { spawnSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));
const wrappers = [
	["sarabeth", "playwright-docker.sh"],
	["paul", "playwright-docker.sh"],
	["carolyn", "playwright-docker.sh"],
	["diloreto", "test-playwright-docker.sh"],
] as const;
const commit = "0123456789abcdef0123456789abcdef01234567";
const realMove = spawnSync("bash", ["-c", "command -v mv"], {
	encoding: "utf8",
}).stdout.trim();

type App = (typeof wrappers)[number][0];

// Exercise the real runner and publication commands with real scratch files.
// Only Docker, Git identity, and deliberate move failures use command adapters.
function withRunner(
	app: App,
	verify: (runner: ReturnType<typeof makeRunner>) => void,
) {
	const scratch = mkdtempSync(join(tmpdir(), "websites browser contract "));
	try {
		verify(makeRunner(scratch, app));
	} finally {
		rmSync(scratch, { recursive: true, force: true });
	}
}

function makeRunner(scratch: string, app: App) {
	const appRoot = join(scratch, "apps", app);
	const bin = join(scratch, "bin");
	const log = join(scratch, "docker.log");
	const script = wrappers.find(([name]) => name === app)?.[1];
	if (!script) throw new Error(`Unknown runner ${app}`);
	const scriptPath = join(appRoot, "scripts", script);
	const snapshots = join(appRoot, "tests/__screenshots__");
	mkdirSync(join(appRoot, "scripts"), { recursive: true });
	mkdirSync(join(scratch, "scripts/playwright"), { recursive: true });
	mkdirSync(snapshots, { recursive: true });
	mkdirSync(bin);
	writeFileSync(join(snapshots, "old.png"), "reviewed baseline");
	writeFileSync(join(scratch, "bun.lock"), "fixture lock identity\n");
	writeFileSync(
		scriptPath,
		readFileSync(join(root, "apps", app, "scripts", script)),
	);
	writeFileSync(
		join(scratch, "scripts/playwright/publish-snapshots.sh"),
		readFileSync(join(root, "scripts/playwright/publish-snapshots.sh")),
	);
	writeFileSync(
		join(bin, "docker"),
		`#!/usr/bin/env bash
set -eu
printf '%s\\n' "$*" >> "$MOCK_DOCKER_LOG"
case "$1" in
  info) echo aarch64 ;;
  build) exit 0 ;;
  create) echo owned-contract-container ;;
  start) exit "$MOCK_TEST_STATUS" ;;
  cp)
    case "$2" in
      owned-contract-container:/work/apps/*/tests/__screenshots__/.)
        case "$MOCK_SNAPSHOT_MODE" in
          copy-failure) printf partial > "$3/partial.png"; exit 2 ;;
          empty) printf diagnostic > "$3/report.txt" ;;
          *) printf 'new baseline' > "$3/new.png" ;;
        esac ;;
      owned-contract-container:/work/apps/sarabeth/.amplify-hosting/static/__deployment.json)
        [[ "$MOCK_MANIFEST_MODE" != copy-failure ]] || exit 2
        [[ "$MOCK_MANIFEST_MODE" != missing-file ]] || exit 0
        printf '%s' "$MOCK_MANIFEST" > "$3" ;;
      *) exit 2 ;;
    esac ;;
  rm) [[ "$*" == 'rm --force owned-contract-container' ]] ;;
  *) exit 99 ;;
esac
`,
		{ mode: 0o755 },
	);
	writeFileSync(
		join(bin, "git"),
		`#!/usr/bin/env bash
[[ "$*" == "-C $MOCK_WORKSPACE_ROOT rev-parse HEAD" ]] || exit 99
echo ${commit}
`,
		{ mode: 0o755 },
	);
	writeFileSync(
		join(bin, "mv"),
		`#!/usr/bin/env bash
case "$MOCK_MOVE_MODE:\${1##*/}" in
  backup-failure:__screenshots__|swap-failure:next|restore-failure:next|restore-failure:previous) exit 73 ;;
esac
exec "$MOCK_REAL_MV" "$@"
`,
		{ mode: 0o755 },
	);
	return {
		appRoot,
		snapshots,
		run(args = ["--update-snapshots=all"], env: Record<string, string> = {}) {
			return spawnSync("bash", [scriptPath, ...args], {
				cwd: scratch,
				encoding: "utf8",
				env: {
					PATH: `${bin}:${process.env.PATH}`,
					HOME: scratch,
					MOCK_DOCKER_LOG: log,
					MOCK_WORKSPACE_ROOT: scratch,
					MOCK_TEST_STATUS: "0",
					MOCK_SNAPSHOT_MODE: "success",
					MOCK_MOVE_MODE: "success",
					MOCK_REAL_MV: realMove,
					MOCK_MANIFEST_MODE: "matching",
					MOCK_MANIFEST: JSON.stringify({ commit }),
					RELEASE_COMMIT: "untrusted-inherited-value",
					PLAYWRIGHT_SKIP_BUILD: "1",
					PLAYWRIGHT_BASE_URL: "http://127.0.0.1:4173",
					EXPECTED_ARTIFACT_MODE: "fixture",
					...env,
				},
			});
		},
		commands: () => readFileSync(log, "utf8").trim().split("\n"),
		transactions: () =>
			readdirSync(join(appRoot, "tests")).filter((name) =>
				name.startsWith(".screenshots-staging."),
			),
	};
}

function expectOwnedContainerCleanup(commands: string[]) {
	expect(
		commands.filter((command) => command.startsWith("create ")),
	).toHaveLength(1);
	expect(commands).toContain("start --attach owned-contract-container");
	expect(commands.filter((command) => command.startsWith("rm "))).toEqual([
		"rm --force owned-contract-container",
	]);
	expect(commands.join("\n")).not.toMatch(/type=bind|--volume|prune/);
}

describe.each(wrappers)("%s browser runner", (app) => {
	test("publishes once after success and cleans only its own container", () => {
		withRunner(app, (runner) => {
			const result = runner.run();
			expect(result.status, result.stderr).toBe(0);
			expect(readdirSync(runner.snapshots)).toEqual(["new.png"]);
			expect(readFileSync(join(runner.snapshots, "new.png"), "utf8")).toBe(
				"new baseline",
			);
			expect(runner.transactions()).toEqual([]);
			const commands = runner.commands();
			expectOwnedContainerCleanup(commands);
			const snapshotCopies = commands.filter((command) =>
				command.includes("/__screenshots__/."),
			);
			expect(snapshotCopies).toHaveLength(1);
			if (app === "sarabeth") {
				expect(commands.join("\n")).toContain(`--env RELEASE_COMMIT=${commit}`);
				expect(commands.join("\n")).not.toContain("untrusted-inherited-value");
				expect(
					commands.findIndex((command) =>
						command.includes("/__deployment.json"),
					),
				).toBeLessThan(commands.indexOf(snapshotCopies[0]));
			}
		});
	});

	test("preserves test failure without publishing any snapshots", () => {
		withRunner(app, (runner) => {
			expect(
				runner.run(["--update-snapshots=all"], { MOCK_TEST_STATUS: "23" })
					.status,
			).toBe(23);
			const commands = runner.commands();
			expectOwnedContainerCleanup(commands);
			expect(commands.join("\n")).not.toContain("__screenshots__");
			expect(readdirSync(runner.snapshots)).toEqual(["old.png"]);
			expect(runner.transactions()).toEqual([]);
			if (app === "carolyn") {
				expect(commands.join("\n")).toContain(
					"NODE_OPTIONS=--dns-result-order=ipv4first bun run build:test",
				);
				expect(commands.join("\n")).toContain(
					"NODE_OPTIONS=--dns-result-order=ipv4first bun run build:production:test",
				);
			}
			if (app === "diloreto")
				expect(commands.join("\n")).toContain(
					"--tmpfs /tmp:rw,size=2g,mode=1777",
				);
		});
	});

	test.each(["copy-failure", "empty", "backup-failure", "swap-failure"])(
		"%s preserves reviewed baselines and cleans staging",
		(failure) => {
			withRunner(app, (runner) => {
				const result = runner.run(undefined, {
					MOCK_SNAPSHOT_MODE: failure,
					MOCK_MOVE_MODE: failure,
				});
				expect(result.status).not.toBe(0);
				expect(readFileSync(join(runner.snapshots, "old.png"), "utf8")).toBe(
					"reviewed baseline",
				);
				expect(readdirSync(runner.snapshots)).toEqual(["old.png"]);
				expect(runner.transactions()).toEqual([]);
				expectOwnedContainerCleanup(runner.commands());
			});
		},
	);
});

describe("snapshot publication interface", () => {
	test.each([
		"--update-snapshots",
		"--update-snapshots=all",
		"--update-snapshots=changed",
		"--update-snapshots=missing",
		"--update-snapshots=default",
		"-u",
		"test:e2e:update",
	])("recognizes %s", (flag) => {
		withRunner("sarabeth", (runner) => {
			expect(runner.run([flag]).status).toBe(0);
			expect(readdirSync(runner.snapshots)).toEqual(["new.png"]);
		});
	});

	test.each([
		[],
		["--update-snapshots=none"],
		["--update-snapshots=all", "--update-snapshots=none"],
		["--update-snapshots", "none"],
		["-u", "none"],
		["--update-snapshots=all", "-u", "none"],
	])("leaves baselines alone for arguments %j", (...args) => {
		withRunner("paul", (runner) => {
			expect(runner.run(args).status).toBe(0);
			expect(readdirSync(runner.snapshots)).toEqual(["old.png"]);
			expect(runner.commands().join("\n")).not.toContain("__screenshots__");
			expect(runner.transactions()).toEqual([]);
		});
	});

	test.each([
		["--update-snapshots", "changed"],
		["-u", "missing"],
		["--update-snapshots=none", "--update-snapshots", "all"],
	])("publishes for mode arguments %j", (...args) => {
		withRunner("paul", (runner) => {
			expect(runner.run(args).status).toBe(0);
			expect(readdirSync(runner.snapshots)).toEqual(["new.png"]);
			expect(runner.transactions()).toEqual([]);
		});
	});

	test("publishes the first baseline directory", () => {
		withRunner("paul", (runner) => {
			rmSync(runner.snapshots, { recursive: true });
			expect(runner.run().status).toBe(0);
			expect(readdirSync(runner.snapshots)).toEqual(["new.png"]);
			expect(runner.transactions()).toEqual([]);
		});
	});

	test("retains the recovery copy and reports its location if restoration also fails", () => {
		withRunner("paul", (runner) => {
			const result = runner.run(undefined, {
				MOCK_MOVE_MODE: "restore-failure",
			});
			expect(result.status).not.toBe(0);
			expect(existsSync(runner.snapshots)).toBe(false);
			expect(runner.transactions()).toHaveLength(1);
			const backup = join(
				runner.appRoot,
				"tests",
				runner.transactions()[0],
				"previous",
			);
			expect(readFileSync(join(backup, "old.png"), "utf8")).toBe(
				"reviewed baseline",
			);
			expect(result.stderr).toContain(backup);
			expectOwnedContainerCleanup(runner.commands());
		});
	});
});

describe("Sarabeth final verification gates snapshot publication", () => {
	test.each([
		["copy-failure", ""],
		["missing-file", ""],
		["malformed-json", "{broken"],
		["missing-commit", "{}"],
		["mismatched-commit", JSON.stringify({ commit: "a".repeat(40) })],
	])("%s leaves reviewed snapshots untouched", (mode, manifest) => {
		withRunner("sarabeth", (runner) => {
			const result = runner.run(undefined, {
				MOCK_MANIFEST_MODE: mode,
				MOCK_MANIFEST: manifest,
			});
			expect(result.status).toBe(1);
			expect(readdirSync(runner.snapshots)).toEqual(["old.png"]);
			expect(runner.commands().join("\n")).not.toContain("__screenshots__");
			expect(runner.transactions()).toEqual([]);
			expectOwnedContainerCleanup(runner.commands());
		});
	});
});
