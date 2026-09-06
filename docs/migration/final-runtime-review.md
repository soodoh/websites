## Review

Reviewed candidate `cb7a15fb23b810285f51432de7efeec05e115a3f` against the supplied baseline/diff, root and app instructions, current source, tests, and recorded evidence. No commands executed or files changed.

- **Correct — Carolyn DNS seam:** IPv4 preference is confined to container-local fixture/hermetic build commands, not production configuration or browser assertions (`apps/carolyn/scripts/playwright-docker.sh:35–44`; `apps/carolyn/package.json:27–28`).
- **Correct — Sarabeth provenance:** Explicit commits require exactly 40 hexadecimal characters; malformed values fail rather than falling back. Git HEAD remains the unset-value fallback. Preparation and validation share the resolver (`apps/sarabeth/scripts/release-commit.ts:6–20`; `validate-amplify-bundle.ts:22–26`). Docker supplies workspace HEAD at runtime, overriding inherited provenance; Compose requires an explicit value (`scripts/playwright-docker.sh:8–22`; `compose.playwright.yaml:11`).
- **Correct — Rename and policy:** Directory aliases retain original package/filter names. Workspace contracts check lock mappings, direct versions, absence of old directories, and Docker manifests (`scripts/workspace-contract.test.ts:8–48,65–79`). Root hooks invoke commitlint; required approved scopes and Renovate’s `deps` scope are configured and tested (`lefthook.yml:5–8`; `commitlint.config.cjs:3–6`; `scripts/commit-policy.test.ts:12–27`).
- **Correct — Regression boundaries:** Supplied changes preserve production resources, screenshots, and existing artifact assertions apart from the intentional provenance-source substitution. Wrapper failure contracts retain exit-status and invocation-owned cleanup checks (`scripts/docker-wrapper-contract.test.ts:57–72`). Audit tooling distinguishes current versus historical prefixes without reopening the previously resolved missing-direct or installed-drift findings.

No issues found.

**Merge verdict: OK with notes** for the reviewed code/policy changes.

**Residual limits:** Supplied contracts report 24 passing tests and 391 assertions. Post-rename full CI success belongs to the earlier recorded checkpoint, not this normalized candidate. Fresh normalized-candidate CI remains parent-owned and unverified by this review. Supplied history lint reports 1,110 commits without errors and six preserved footer warnings. This review does not authorize publication, deployment, or phase 2.