# Biome Migration: Replace Oxlint + Prettier

## Summary

Replace oxlint (linting) and prettier (formatting) with Biome, a single tool that handles both. Adopt Biome's recommended defaults rather than replicating existing config.

## Packages

**Remove:**

- `oxlint`
- `@standard-config/oxlint`
- `oxlint-tsgolint`
- `prettier`

**Add:**

- `@biomejs/biome`

## Config Files

**Remove:**

- `.prettierrc`
- `.prettierignore`
- `oxlint.config.ts`

**Create:** `biome.json`

- Recommended lint rules (Biome's default)
- Formatter with Biome defaults (tabs, 80-char line width)
- Ignore patterns: `dist`, `.output`, `node_modules`, `src/routeTree.gen.ts`

## Scripts

Update `package.json` scripts:

```json
{
  "lint": "biome check .",
  "lint:fix": "biome check --fix ."
}
```

## Lefthook Hooks

Update `lefthook.yml` pre-commit jobs:

- **lint-fix job** (JS/TS files): `biome check --fix {staged_files}` with `stage_fixed: true`
- **format job** (CSS/JSON/YAML): `biome format --write {staged_files}` with `stage_fixed: true`
- **commit-msg job**: unchanged (commitlint stays as-is)

## CLAUDE.md

Update the lint/lint:fix command references in the project CLAUDE.md to reflect biome.

## Commit Strategy

1. First commit: tooling swap (config files, packages, scripts, hooks)
2. Second commit: `biome check --fix .` to reformat the entire codebase to Biome's style
