# Authorized Portfolio redaction and import checkpoint

This decision supersedes the original plan's ban on history rewriting **only for
Portfolio (`portfolio-website`)**. The user confirmed that the historical token is
no longer valid and authorized rewriting; when asked about scope, selected
“Remove all flagged values”, including the historical Google API-key value.
There is still **no publication or deployment approval**.

The rewrite ran using git-filter-repo 2.47.0 in a new disposable bare repository,
not any source repository or the target. Two exact values were replaced with
`REMOVED_HISTORICAL_CREDENTIAL` in blob contents and commit messages. Both empty
commit and degenerate merge pruning were disabled; commit-hash references in
messages were preserved. No filenames, file modes, other file content, authors,
committer identities/timestamps, or commit messages changed beyond the permitted
replacement. All 152 commits remain and their mapped parent topology was verified.
Six blob versions changed and 147 commit IDs changed. Sixteen GPG signatures were
necessarily dropped; original signatures cannot verify changed commits.

- Approved original head: `15630718474e8b97f7c9150dfc2357825e352adb`.
- Sanitized import head: `af5ac5840aac9126357a7ca22dea0ff753c5a4b3`.
- Complete SHA mapping: `portfolio-commit-map.txt`.
- Verification evidence: `portfolio-redaction-verification.json`.
- Original current tree equals sanitized current tree; current application code
  contained neither credential value.
- Gitleaks 8.30.1 sanitized-main history scan: exit 0, zero findings.
- All four current-tree Gitleaks scans: exit 0, zero findings.
- All reachable histories were inspected for LFS pointers, gitlinks, and nested
  `.git` entries: none found. Counts/path candidates: `history-object-audit.json`.
- Sarabeth/Carolyn findings are vendored Yarn exception code, not credentials.
  Historical Portfolio `node_modules` contains dependency test-key fixtures and
  development-server certificates; those are not current application credentials
  and were not included in the two-value redaction authorization. Preserve this
  distinction in future security reviews; do not claim the entire history contains
  no key-shaped fixture data.

Private original backups remain outside worktrees in
`/Users/pauldiloreto/Projects/websites-migration-backups/`. A verified sanitized
`portfolio-website-sanitized-main.bundle` is also there. Never upload the original
bundles or the private replacement file in scratch storage.

Four **unsquashed** subtree imports are now committed to local target main:

| App | Import commit |
| --- | --- |
| Sarabeth | `dab13bd3d4769f66567586982cec20ae9cb16205` |
| Portfolio (sanitized) | `a2cebdbbe15ec8fdfd311cd2a6cf9be2610c0d84` |
| Carolyn | `e05ce97e526c3b8413a8e8443ddce216e635faf6` |
| DiLoreto | `392fb4fe1a6163e23de77bc760134e16ba079147` |

Every imported head is an ancestor of target main, every reachable imported commit
is present, pristine subtree IDs match source tree IDs, and `git fsck --full`
passed after all imports. Portfolio ancestry assertions use the **sanitized head**,
not the original head. The other three histories and target initial history retain
original IDs. No source repository was modified, no dependencies installed in
sources, and nothing pushed. Remaining phase-1 workspace implementation/validation
must now proceed before phase 2. The previous credential-stop handoff describes the
earlier checkpoint; this decision and `source-imports.json` supersede that status.
