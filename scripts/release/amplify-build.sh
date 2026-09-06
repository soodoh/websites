#!/usr/bin/env bash
set -euo pipefail
# Repository-connected WEB_COMPUTE only. No production Turbo cache or sibling scripts.
site=${1:?site required}
case "$site" in
  carolyn) account=725669362139; branch=amplify-production ;;
  sarabeth) account=015989770400; branch=sarabeth-production ;;
  *) echo 'Unknown SSR site' >&2; exit 2 ;;
esac
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$root"
test "${AMPLIFY_MONOREPO_APP_ROOT:?}" = "apps/$site"
if [[ "$site" = carolyn && "${AWS_BRANCH:?}" != "$branch" ]]; then
  # Two independent explicit bindings: reviewed checkout policy and owning-CDK branch
  # configuration. An arbitrary AWS_BRANCH/environment cannot enlarge the allowlist.
  candidate=$(jq -er '.sites.carolyn.candidateBranch | select(type == "string")' config/release-runtime.json)
  [[ "$candidate" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$ ]]
  [[ "$candidate" != main && "$candidate" != amplify-production && "$candidate" != sarabeth-production ]]
  test "${CAROLYN_CANDIDATE_BRANCH:?}" = "$candidate"
  branch=$candidate
fi
test "${AWS_BRANCH:?}" = "$branch"
test "$(aws sts get-caller-identity --query Account --output text)" = "$account"
test "$(node --version)" = v24.20.0
test "$(bun --version)" = 1.4.0
# Explicit inherited provenance and fixture switches cannot certify production output.
for variable in PLAYWRIGHT_TEST HERMETIC_PRODUCTION_BUILD PRODUCTION_BUILD_TEST HERMETIC_ARTIFACT_TEST; do
  test "${!variable:-false}" = false
done
unset RELEASE_COMMIT GITHUB_SHA NODE_OPTIONS
actual=$(git rev-parse HEAD)
[[ "$actual" =~ ^[0-9a-f]{40}$ ]]
job=$(aws amplify get-job --app-id "${AWS_APP_ID:?}" --branch-name "$AWS_BRANCH" --job-id "${AWS_JOB_ID:?}" --output json)
export AMPLIFY_JOB_COMMIT
AMPLIFY_JOB_COMMIT=$(jq -er '.job.summary.commitId' <<< "$job")
export AMPLIFY_JOB_MESSAGE
AMPLIFY_JOB_MESSAGE=$(jq -r '.job.summary.commitMessage' <<< "$job")
cd "apps/$site"
if [[ "$site" = sarabeth ]]; then
  # Preserves concrete RELEASE and CI-attested content-rebuild guards, before CMS secrets.
  bun scripts/verify-amplify-source.ts
  parameter=/sarabeth-studio/production/contentful/access-token
  test "${CONTENTFUL_ACCESS_TOKEN_PARAMETER:?}" = "$parameter"
  test "$(aws ssm get-parameter --name "$parameter" --query Parameter.Type --output text)" = SecureString
  export CONTENTFUL_ACCESS_TOKEN
  CONTENTFUL_ACCESS_TOKEN=$(aws ssm get-parameter --name "$parameter" --with-decryption --query Parameter.Value --output text)
  test -n "${CONTENTFUL_SPACE_ID:?}" && test -n "$CONTENTFUL_ACCESS_TOKEN"
else
  # Carolyn CMS trigger behavior is uncollected. Deny every non-exact RELEASE until reviewed.
  test "$AMPLIFY_JOB_COMMIT" = "$actual"
  test "$AMPLIFY_JOB_MESSAGE" = "GitHub Actions release $actual"
  test "$(jq -er '.job.summary.jobType' <<< "$job")" = RELEASE
  test "$(jq -er '.job.summary.jobId' <<< "$job")" = "$AWS_JOB_ID"
fi
export RELEASE_COMMIT="$actual" AWS_COMMIT_ID="$actual" NODE_ENV=production
unset AMPLIFY_JOB_COMMIT AMPLIFY_JOB_MESSAGE
trap 'rm -f lib/project-auth-manifest.json; unset CONTENTFUL_ACCESS_TOKEN PROJECT_AUTH_SECRET' EXIT
if [[ "$site" = sarabeth ]]; then
  NITRO_PRESET=aws-amplify bun run build
  bun run prepare:amplify
  bun run validate:amplify
else
  AMPLIFY_ARTIFACT_MODE=production PLAYWRIGHT_TEST=false HERMETIC_PRODUCTION_BUILD=false PRODUCTION_BUILD_TEST=false bun run build
  AMPLIFY_ARTIFACT_MODE=production VERIFY_DEPLOYMENT_SECRETS=true bun run verify:prerender
fi
# Separate bundle attestation added only after production checks, never to a fixture bundle.
SITE="$site" node -e 'const fs=require("node:fs"); const marker={schemaVersion:1,kind:"website-ssr-production",site:process.env.SITE,commit:process.env.RELEASE_COMMIT,appId:process.env.AWS_APP_ID,branch:process.env.AWS_BRANCH,jobId:process.env.AWS_JOB_ID}; fs.writeFileSync(".amplify-hosting/static/__release.json",JSON.stringify(marker)+"\n")'
test "$(git rev-parse HEAD)" = "$actual"
