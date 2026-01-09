# alsonotify.md Project Scoped Ruleset for Antigravity IDE (Frontend Only)

## 0) Non-negotiable constraints (hard stops)

-   Frontend-only edits. Backend is read-only reference.
-   Do not change UI visuals, layout, copy, styling, or component structure in a way that changes pixels.
-   Do not change user flows, routing behavior, access rules, redirects, or guard logic unless the step explicitly scopes it.
-   Do not change functional behavior. Every change must be behavior-preserving.
-   Do not change API contracts:
    -   No endpoint path changes.
    -   No request payload key changes.
    -   No response parsing semantic changes.
-   Auth contract is fixed:
    -   Backend expects JWT token as a raw string in request header `authorization` (no `Bearer` prefix).
    -   Preserve current header behavior exactly (including casing if both are set today).

## 1) Mandatory execution protocol (must follow every time)

1. Read this file (`alsonotify.md`) fully before doing anything.
2. Read the latest `/mnt/data/refactor_report.md` to understand current state and prior decisions.
3. Run baseline gates before edits:
    - `npm run lint`
    - `npm run typecheck`
    - `npm run build`
    - `npm run test` (run it; if suite is not configured, do not “fix tests” unless the step is explicitly test-focused. Record the failure and proceed only if lint/typecheck/build are green.)
4. Make changes in small, reviewable diffs. One concern per step.
5. Re-run the same gates after changes and confirm results.

## 2) Definition of Done (per step)

A step is complete only when all are true:

-   No UI or behavior changes (pixel, flow, or network contract).
-   `npm run lint` passes with **no new warnings introduced**.
-   `npm run typecheck` passes with zero new `any`.
-   `npm run build` passes.
-   `npm run test` is executed and status is recorded.
-   No unused vars/imports introduced.
-   No new console logs in production paths.
-   No dead code or commented-out blocks introduced.

## 3) Strict lint policy (no warning suppression shortcuts)

-   Do not add file-level or project-level lint suppressions to “make it pass”.
    -   Forbidden examples:
        -   `/* eslint-disable */`
        -   `/* eslint-disable no-useless-catch */`
        -   `// eslint-disable-next-line ...` unless it is a single-line, narrowly justified exception with a comment explaining why it is safe and necessary.
-   If a rule is noisy (existing debt), avoid touching unrelated files. Do not spread suppressions across the repo.
-   If a change triggers warnings in a file you touched, fix the warning properly or revert the change.

## 4) Security safety rules (frontend-focused)

### 4.1 XSS / HTML injection

-   Never render untrusted HTML without sanitization.
-   If rich text exists:
    -   Sanitize on write and sanitize on read.
    -   Use the centralized sanitizer utilities. Do not bypass them.
-   Do not remove sanitization to “fix formatting”.

### 4.2 Token handling

-   Never log tokens.
-   Never store tokens in localStorage.
-   Do not change auth storage mechanism unless explicitly scoped.
-   Cookie flags must remain correct:
    -   `Secure=true` only in HTTPS environments as currently implemented.
    -   `SameSite=Lax` unless a scoped requirement proves otherwise.
    -   Preserve path and expiry semantics.

### 4.3 Requests and headers

-   Preserve request behavior and headers.
-   Do not switch auth scheme (raw token vs Bearer).
-   Do not introduce new request wrappers unless the step explicitly scopes it.

## 5) TypeScript discipline (senior-level constraints)

-   Do not introduce `any`.
-   Prefer DTO-first types at service boundaries.
-   Prefer `unknown` at unsafe boundaries plus runtime checks only when needed.
-   Do not widen types to “make it compile”.
-   Avoid `as any`. If unavoidable in a single line, it must be:
    -   tightly scoped,
    -   justified by a comment,
    -   and accompanied by a TODO referencing the intended type.

## 6) Architecture boundaries (must be maintained)

-   Services return DTO-shaped data.
-   Hooks are the mapping boundary:
    -   Map DTO → Domain via `select` in React Query (or equivalent) when scoped.
-   UI consumes Domain types (camelCase).
-   Do not standardize query keys, invalidations, staleTime, or cache policies unless the step explicitly scopes it.
-   Do not change middleware/route-guard behavior unless the step explicitly scopes it.

## 7) Refactoring constraints

-   No big-bang rewrites.
-   Split files only when behavior-preserving:
    -   Move pure helpers first.
    -   Extract presentational components with identical props.
-   Do not rename public exports unless all imports are updated in the same step.
-   No formatting-only sweeps. Only format files you touch, and only if required.

## 8) Required measurements (record deltas per step)

For the touched scope, collect and report before/after counts:

-   `any` (overall for touched directories)
-   `as any`
-   `dangerouslySetInnerHTML` occurrences (if touched files include rich text render paths)
-   try/catch and `no-useless-catch` candidates (if touched files include services)

## 9) Mandatory refactor report update (end of every step)

At the end of every step, rewrite `refactor_report.md to include:

-   Executive summary (what changed, why, behavior-preserving proof).
-   Files touched (exact paths).
-   Commands executed and results (lint/typecheck/test/build).
-   Before/after metrics (from section 8).
-   Risk notes (file-anchored, concrete).
-   Next step pointer (which roadmap step is next).

## 10) Output format for each agent completion message

-   Files changed (exact paths).
-   What changed (bullets).
-   Why it is behavior-preserving (bullets tied to constraints).
-   Verification results (commands + pass/fail).
-   Metrics deltas.
-   Rollback plan (git revert / file list).

## 11) If blocked

If a requirement conflicts with this ruleset:

-   Stop.
-   State the conflict precisely.
-   Propose the smallest safe alternative that preserves behavior.
