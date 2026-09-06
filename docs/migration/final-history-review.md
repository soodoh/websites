## Review

Candidate: `cb7a15fb23b810285f51432de7efeec05e115a3f`

No issues found.

- **Correct — exhaustive preservation checks:** The verifier establishes bijective reachable-commit mapping, compares nonsignature headers including ordered mapped parents and trees, checks exact planned messages, and independently compares body/footer bytes (`docs/migration/scripts/verify-history-normalization.py:27–50`). Source-subtree and initial-ancestry checks are explicit (`:54–72`). Recorded results match the stated 1,109 commits, 1,105 changed subjects and 40 removed signatures.

- **Correct — scope ownership and semantics:** Source ancestry takes precedence over inherited dependency/infrastructure scopes; ambiguous shared ancestry fails explicitly (`docs/migration/scripts/plan-history-subjects.py:40–47,101–107`). Existing types and breaking markers are preserved (`:134–137`). Reviewed compact legacy records across all four apps and sampled overrides, imports, dependency subjects, merge/reverts and the single shortened subject. No demonstrably incorrect scope/type or material semantic reversal found. Both explicit revert rewrites preserve their direction (`docs/migration/history-message-subjects.json:1725–1729,2202–2206`).

- **Correct — actual-message lint:** The linter reads every HEAD ancestor directly from commit objects and disables both custom and default ignores (`docs/migration/scripts/lint-history.mjs:15–29`). `/tmp/websites-final-review/actual-history-lint.json:2–6` identifies this candidate, checks 1,110 messages and reports zero failures. Its six inherited footer warnings match the durable stage report.

- **Correct — two-stage Portfolio provenance:** Original approved head `15630718…` maps to sanitized `af5ac584…`, then normalized `2980d3aa…` (`docs/migration/portfolio-commit-map.txt:11`; `docs/migration/history-normalization-commit-map.txt:771`). `source-imports.json:83–98` retains the distinct identities and redaction-map reference.

- **Correct — authorization and documentary boundaries:** Initial-commit rewriting and unchanged `origin/main` are explicitly documented, alongside the separate non-fast-forward publication approval requirement (`docs/migration/history-normalization-decision.md:7–21`). Earlier checkpoint statements are clearly historical rather than contradictory current claims (`docs/migration/01-history-and-turborepo-handoff.md:11–13`). Final normalized-checkout validation remains pending, not falsely claimed complete.

### Limitations

Read-only inspection only: no subprocesses, writes, source-repository access or private credential/bundle access. Git preservation results, clean status, fsck success and unchanged source refs rely on supplied parent evidence; I did not independently rerun commands or recompute bundle/map hashes. Semantic review did not inspect every historical code diff. The separately running fresh CI result is outside this review.

- **Merge verdict: OK with notes** for the authorized local normalization. Final phase-1 acceptance still requires normalized-SHA validation and handoff; publication remains unauthorized.