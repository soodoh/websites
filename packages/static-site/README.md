# Static-site output

Shared TypeScript support for the four sites’ static artifacts. It does not alter HTML, remove JavaScript, replace navigation, change runtime rendering modes, or add compute routes.

## Native 404 documents

Each site asks TanStack Start to prerender the intentionally unmatched `/404` path to `/404.html`. There must be no app route for `/404`: the normal root `notFoundComponent` renders the document and Start serializes an actual not-found match. This lets that same document hydrate at arbitrary missing URLs, including Carolyn’s unknown project slugs. A successful placeholder route has different route/Suspense state and can cause hydration errors or stale metadata.

Start’s installed prerenderer accepts only 2xx responses. Each site’s server entry calls `acceptNotFoundPrerender(request, response)`, which changes **only** that build-time `/404` response from 404 to 200 for the crawler. It preserves the body, headers, JavaScript, and serialized router state. Runtime responses and other build failures are untouched. The hosting layer still supplies HTTP 404 for missing requests. Remove this adapter if Start gains native support for saving non-2xx prerender responses.

Not-found title and robots metadata belong to the normal not-found UI, so they work for both the artifact and subsequent client navigation. Normal framework bundling and route splitting remain enabled; there is no bespoke 404 JavaScript optimization.

## Clean-path aliases

`writeCleanPathAliases(outputDirectory, publicPaths)` copies directory indexes to matching `.html` documents without deleting indexes or changing URLs. This preserves both clean-path forms on Amplify.

- DiLoreto uses the native prerender `onSuccess` hook to alias each completed route.
- Carolyn and Sarabeth alias their explicit public release paths after Amplify packaging.
- Paul does not need aliases.

Paths come from the framework’s completed prerenders or the release inventory; there is no directory crawler or second route-discovery implementation. The helper rejects paths outside the output tree.

## Verification

Unit tests run in the root workspace Vitest project. `@websites/playwright-support/not-found` checks real static fallback status and initial content, metadata, mobile-sheet interaction/focus, navigation to a valid page, metadata cleanup, and history recovery. Run app builds/tests serially.
