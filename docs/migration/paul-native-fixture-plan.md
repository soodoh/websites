# Paul native fixture diagnostic — manual fixture-only contract

**This contract establishes neither a native result nor production acceptance.** The
sole fixture job admits manual main dispatches only for soodoh/websites (repository
1358469291, owner soodoh18269267), attempt1 and the exact main workflow path. Existing
helper admission and all protected input pins remain intact. Release, observer and
recovery jobs remain literal-false; publication/runtime/release/drain flags are unchanged.

The owner approved a bounded diagnostic sequence: local refresh and independent review,
normal-hook commits/PR/CI publication, ONE native diagnostic, then the independently
reviewed forward three-path re-lock through normal commits/PR/CI. Local preparation does
not execute those later stages. Actual source, PR, main CI, workflow, run and closure
identities belong in operational receipts; no future SHA, outcome or publication is
asserted here. The predicate is NOT a one-shot controller: distinct fresh dispatches
remain technically callable until the re-lock reaches main, but no additional dispatch,
retry or settings-level disable is authorized. The main-ref dispatch race is non-atomic;
unexpected source/run identity or ambiguous outcome stops for parent reconciliation.
Production locks and source deployment ownership remain unchanged.

The preceding guarded CDP-on/off diagnostic pair failed the unchanged performance 0.90
median gate: scores 0.71/0.76/0.78 versus 0.71/0.77/0.77, TBT medians 948.69/939.29ms.
Disabling the additional CDP guard did not materially recover performance. Emulation,
proxy and page cost remain unresolved; this is **not evidence that emulation caused it**.
This native configuration tests that hypothesis without changing the full harness.

## Deliberately narrow implementation

- `.github/workflows/paul-native-fixture.yml`: one main/intended-repository manual job, fixed
  GitHub-hosted `ubuntu-24.04`, contents:read, no production environment, OIDC, secrets,
  release triggers, input-selected platform, cache, retry or continue-on-error.
  Existing immutable checkout/upload action pins and root `ci-tools` are reused.
- `scripts/ci/paul_native_fixture.py`: hosted-only preflight/run entry; no candidate,
  production URL, release, recovery or generic execution mode. Before setup and again
  before build it checks manual/main/intended repository, clean exact checkout/workflow
  SHA, real run/attempt, GitHub-hosted Linux/X64, actual host and Docker daemon Linux
  amd64 (`amd64` or `x86_64` only). Image inspection requires Linux/amd64 too.
  These are configuration assertions, **not physical-hardware attestation**. No binfmt,
  privileged/alternate builder, architecture fallback or native-worker access is added.
- Future runner only: existing root frozen install with Bun1.4.0/Node24.20.0; require
  absent Paul dist, build Paul freshly, then create a nonrelease diagnostic `release.json`.
  Serving identity is deliberately synthetic (`000…000`, run1/attempt1), matching the
  unchanged hosting check's three fields. Actual checkout SHA/run/attempt are separate
  diagnostic metadata, never relabeled as schema-v1 `.github/workflows/ci.yml` provenance.
- Image context contains explicit public manifests, unchanged Dockerfile/guards, required
  serving/browser scripts/configs, tracked e2e source/screenshots and fresh public dist.
  No recursive checkout copy, .git, host node_modules, configuration, credentials or
  caches. Symlinks, hidden/private and unexpected output types fail closed. The root
  source-only `.dockerignore` excludes dist, so it is intentionally NOT copied: the
  minimal context has its own explanatory ignore file that preserves prebuilt dist.
  Protected byte pins and per-input SHA256/size evidence precede a fresh no-cache build.
- The resulting immutable image ID must retain the original full runner CMD, no
  entrypoint/healthcheck/volumes/ports and nonroot defaults. The unchanged
  `container_args(..., fixture=True)` and inspection are reused, with strict unique
  exact Env name/value checks (order-independent, duplicates rejected), extra namespace,
  lifecycle and device denials. Base locales may be absent or exactly C.UTF-8; actual
  validated image Env is the exact expected container baseline, never a raw dump.
- Exactly one create/start of the full fixture: 26 guard denials, hosting checks, the
  existing 56 browser tests/four unchanged viewport skips, and one three-LHR set.
  Chrome152.0.7977.77, Playwright1.62.1, Lighthouse12.6.1, mobile390x844, CPU4 and all
  assertions including performance0.90 remain unchanged. No additional CDP loader,
  proxy modification, bypass, alternate browser or performance waiver.

## Network and evidence boundary

Checkout, pinned action/tool/package downloads and the image build use normal networking
on the trusted ephemeral runner. Ordinary checkout/artifact action tokens stay there;
this is **not whole-job zero networking**. The helper creates a fresh HOME and explicit
noncredential subprocess environment. It does not pass runner tokens, proxy settings,
AWS/GitHub environments or host Docker configuration to the build/browser fixture.

The measurement container is network-none, UID/GID1000, read-only root, private IPC,
cap-drop ALL, no-new-privileges, only the existing private tmpfs paths; no host binds,
ports, devices, socket, volumes or credential environment. It runs only the sealed image's
original CMD. Normal build networking is outside that measurement boundary.

Only explicitly named `preflight.json` and `diagnostic.json` are uploaded, with the existing
pinned action, `always()` and seven-day retention. The latter contains bounded input hashes,
source/run/attempt, image/container IDs, architecture, observed guard/hosting/browser
milestones, numeric LHR metrics and exit status, never page data, warning prose, raw Env,
traces or profiles. Raw attached output is drained without printing/retaining it; oversized
output is flagged. The shipped runner emits sanitized metrics before tmpfs teardown on
Lighthouse failure too. A zero exit without exactly three reports/full milestones fails;
a nonzero harness exit is preserved even if later evidence validation fails. Failed upload
cannot make a failed harness green. OomKillDisable before/after is recorded as observed;
false and null are **not** claimed equivalent or compared as whole-lifecycle identity.

No cleanup commands are included: invocation-created stopped objects remain until hosted
runner teardown. Forced cancellation, process termination or runner loss can prevent final
evidence export; preflight evidence is best effort, not a success receipt. Earlier-stage
failures may have zero LHRs; do not rerun automatically or call partial metrics acceptance.
Every result is diagnostic, not deployment, authentic legacy/candidate or production proof.

## Local validation and review boundary

Local preparation validation is restricted to pure/fake-boundary tests and sequential root
`test:ci`, `test:workspace`, `lint`, and workflow/shell/syntax lint with existing pinned tools,
existing TARGET dependencies and new empty HOME/environment/cache. No local install,
Docker/Colima command, app build, browser/Lighthouse, cleanup or live account call is allowed.
The Python tests deny real subprocess boundaries and fabricate their own public fixture
output; they are not native measurements. Root `test:ci` discovers both new test patterns.

The complete37-path held cumulative preparation received independent review. Its sole
native evidence finding F1 was separately repaired, validated and independently closed:
the actual exporter-to-consumer regression preserves observed reduced UA152.0.0.0 (or
supported full UA152.0.7977.77), independently of the unchanged full executable pin.
Synthetic UA tests are not a fresh executable observation or a native score result.
Prior failed scores and historical setup/test failures remain retained, not waived.

This enablement changes only the native workflow's predicate/display labels, matching
Bun contract and this plan; the other34 cumulative paths, F1 regression, helper, guards,
settings and dependencies are preserved. Independent review must bind the actual37-path
enabled manifest, incremental/cumulative patches and offline logs, plus the exact
prospective three-path re-lock patch and complete before/after bytes BEFORE live action.
The prospective closure is unapplied/untested until its actual later validation; it
returns the job to literal-false and retains F1 without asserting any diagnostic outcome.
A correctly bound terminal diagnostic, including a failed performance result, proceeds
only to the approved reviewed closure, not repair or rerun. Ambiguous identity/outcome
stops; report remaining callability if closure cannot proceed. Reviewer readiness is code
evidence, not a substitute for owner authority and the required parent live handoffs.

The runner rebuilds a fresh fixture and image; it does not transfer the retained local
image. Compare exported per-file hashes with retained fixture evidence. HTML hash
differences alone cannot establish timestamp-only equivalence; full LHRs, HTML bodies,
main-thread breakdowns and profiles are not exported. Report gaps without task-level
causal attribution, canonical payload equality or an app-optimization claim.
All AWS, production, source-owner and deployment operations remain outside this sequence.
