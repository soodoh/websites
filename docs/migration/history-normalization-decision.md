# Approved local all-main message normalization

**LOCAL ONLY. No push, force-push, deployment, source mutation, or phase-2 work is authorized.**

## Authorization and identity boundary

After approving the four short app folders and required commit scopes, the user explicitly
selected rewriting **every commit reachable from local main, including the already-published
initial commit**. This supersedes the earlier original-SHA-preservation requirement for this
local history. It does not authorize publication or rewriting any source repository.

The parent completed this stage after the rename worker stopped at
`c2c8f0ea4dcf924464fca66d37272e0a215e3421`. The verified normalized counterpart is
`910584aff8472845ab5f85b0f466b8e50c161ec7`. Subsequent evidence commits are ordinary scoped
commits on top, not another rewrite.

The original public initial commit `5b236ef3a519759c84ebd3504809d391baf085ea` maps to
`2e6fb629522ff1ced21533bd572aff874bd2db90`. `origin/main` still records the original initial
commit. **Ordinary fast-forward publication is therefore impossible.** A future publication
strategy, its non-fast-forward operation, and fresh-clone checks require separate approval.
No remote-tracking ref was falsified to imply that the remote had changed.

## Message policy

- Every imported ancestor and its import commit uses its app scope: `carolyn`, `paul`,
  `diloreto`, or `sarabeth`. This includes source-app infrastructure/dependency commits.
- Shared migration work uses `repo`; future shared CI/dependency changes may use `ci`/`deps`.
  Existing package names are not renamed.
- Existing Conventional Commit types are retained. Legacy subjects receive conservative
  types using subject/path evidence plus explicit reviewed overrides. The durable subject
  record preserves both original and normalized subjects and their scope decisions.
- Headers are at most 100 characters. Initial subject case/trailing punctuation and legacy
  merge/revert subjects are normalized. One multiline first paragraph is reflowed; its
  original identity is recorded in the verification JSON.
- All bytes after the subject-paragraph separator are preserved, including bodies, footers,
  old SHA references and URLs. Six inherited Dependabot footer-spacing **warnings** remain;
  there are no commitlint errors. Merge and revert ignores were disabled during full lint.

## Exhaustive verification and adoption

Pinned `git-filter-repo` 2.47.0 operated only in a disposable bare clone, with
`--prune-empty never --prune-degenerate never --preserve-commit-hashes` and an exact,
pre-linted per-original-SHA message callback. Source repositories were neither fetched into
nor edited. `original.git` and `normalized.git` in the private scratch directory were
independent clones, not shared object stores with the target.

For **all 1,109 original commits** the verifier proved:

- A bijective old/new mapping, with 1,109 retained commits and all 1,109 IDs changed.
- Exactly 1,105 changed subjects; four already-scoped headers stayed unchanged.
- Identical tree IDs, author/committer identity and timestamps, all other nonsignature
  headers, and byte-identical bodies/footers.
- Identical ordered parent relationships under the map: no squashing, flattening,
  dropped empty commits, merge pruning, or code/content change.
- Exact planned messages, independently linted again from actual adopted Git objects.
- All four normalized imported heads and every ancestor reachable from normalized main;
  pristine import subtree IDs equal the approved source trees at the historical prefixes.
- Normalized initial ancestry. The original initial object is absent from the disposable
  normalized-only repository (but remains in the target through the real origin ref).

Forty invalidated signature headers were removed by this message rewrite. The earlier
Portfolio credential-redaction stage separately removed 16 signatures; these counts are
not interchangeable. Original signed objects remain in private original backup bundles.

Only after these checks, the parent fetched verified objects locally and atomically moved
`refs/heads/main` plus the four `refs/remotes/import/<original-name>/main` refs, with expected
old-ref guards. The index/worktree tree and linked-worktree `.git` file were unchanged;
no reset, worktree reconstruction, reflog expiration, or manual object deletion was used.
The four sources remained clean with unchanged local main/origin-main values.

Disposable normalized `git fsck --full` passed. An immediate target fsck transiently reported
unavailable old pack indexes following fetch/pack replacement; a subsequent full recheck
passed with no ref changes or repair/pruning action, and the old target head still resolved.
Full normalized-history Gitleaks scanning found only the two previously reviewed vendored
Yarn `MismatchedTokenException` false positives. No credential value is recorded here.

## Durable provenance and recovery

Files in this directory:

- `history-normalization-commit-map.txt`: complete pre-normalization → normalized SHA map.
  SHA256: `d7ffd0daacd01c4220e5de4f790510a174082e1d90fc76beb4a904ea91490c7b`.
- `history-message-subjects.json`: original/new subjects, ownership and decisions for all
  mapped commits; not entire historical bodies.
- `history-normalization-verification.json`: exhaustive metadata/topology and source proofs.
- `history-normalization-commitlint.json`: actual normalized-object lint evidence.
- `source-imports.json`: original approved/source/checkpoint SHAs remain historical;
  `importedSha`, `importCommit`, `normalizedStartingSha` describe current ancestry, with
  explicit `preNormalization*` identities. `targetPrefix` remains the pristine import path;
  `currentPrefix` is the current short app path.

Private verified complete bundles live outside worktrees in
`/Users/pauldiloreto/Projects/websites-migration-backups/`:

| Bundle | SHA256 |
| --- | --- |
| `websites-before-message-normalization.bundle` | `380d73673d752a96af4358ed2c875ce2b25dfd16ea14bdb630c2155cecc095ec` |
| `websites-normalized-main.bundle` | `f316cff0df1dbb2cddd8830ce2b3e286c68bb9abf09f2b4dc77dbb4289fab0b8` |

The map and verification JSON are also backed up there. Original source bundles and the
separate Portfolio original → sanitized map remain unchanged. To navigate Portfolio from
an original source SHA, first apply `portfolio-commit-map.txt`, then this stage's map.
Do not globally replace old SHAs inside checkpoint evidence or claim older artifact
manifests were built at a normalized SHA.

## Reproduction and remaining acceptance

The read-only planner `scripts/plan-history-subjects.py --repo <original-bare-clone>
--head main --output-directory <private-output>` regenerates the original plan byte-for-byte
from the before bundle; it does not rewrite refs. `scripts/verify-history-normalization.py
<scratch-directory>` checks the two original bare clones plus `message-plan.json` and the
filter-repo commit map. Original scratch evidence is at `/tmp/websites-history-normalization`.
After a workspace install, `bun docs/migration/scripts/lint-history.mjs <checkout>
<output-json>` lints every HEAD ancestor, including the initial commit, without ignores.

The complete post-rename gates passed before normalization; tree equivalence preserves
that code correspondence but does **not** substitute for a fresh normalized-SHA artifact
check. Final independent review and clean normalized-checkout validation remain pending
at this evidence checkpoint. The final phase-1 handoff records their disposition. Source
repositories remain production deployment owners regardless of local phase-1 acceptance.
