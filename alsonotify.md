# alsonotify.md Project Scoped Ruleset for Antigravity IDE (Frontend Only) Development Phase

## 0) Hard stops

-   **Frontend-only edits.** Backend is read-only reference.
-   **Do not break API contracts by accident.**
    -   Do not change endpoint paths, request payload keys, or response parsing semantics unless the step explicitly calls it out and you have verified backend compatibility.
-   **Auth contract is fixed unless explicitly scoped:**
    -   JWT token is a **raw string** in request header `authorization` (no `Bearer` prefix).
    -   Preserve current header casing and interceptor behavior unless the step explicitly scopes a change.
-   **Security hard stops**
    -   Never log tokens or secrets.
    -   Never store auth tokens in localStorage.
    -   Do not bypass the centralized rich-text sanitizer. No raw untrusted HTML rendering.

## 1) Mandatory execution protocol (every prompt)

1. Read this file (`alsonotify.md`) fully before starting.
2. Read the latest `/mnt/data/refactor_report.md` to understand current baseline and open risks.
3. Run baseline gates before edits:
    - `npm run lint`
    - `npm run typecheck`
    - `npm run test`
    - `npm run build`
4. Make changes in **small, reviewable diffs**.
5. Re-run the same gates after changes and record results.

## 2) Definition of Done (per step)

A step is complete only when all are true:

-   The change matches the step’s stated scope and acceptance criteria.
-   `npm run typecheck` passes.
-   `npm run build` passes.
-   `npm run test` is executed and status is recorded (pass is expected unless the step explicitly documents why not).
-   `npm run lint` has **0 errors** (warnings may exist, but do not introduce lint errors).
-   No new production console logs.
-   No dead/commented-out code shipped.

## 3) Change scoping rules (UI + functionality is allowed)

-   UI changes are allowed, but every prompt must state:
    -   **Intended UI change** (what the user will see)
    -   **Intended behavior change** (what the app will do differently)
    -   **Non-goals** (what must not change)
    -   **Acceptance criteria** (explicit checks)
-   If the change affects routing/auth/guards, the prompt must include manual verification flows (token/no-token, deep links, refresh).

## 4) Lint and TypeScript safety

-   Do not introduce `any` unless the step explicitly justifies it. Prefer `unknown` + narrowing.
-   Avoid `as any`. If unavoidable:
    -   keep it single-line and tightly scoped,
    -   add a short justification comment,
    -   add a TODO to remove it with a tracking note.
-   **No suppression shortcuts**
    -   Do not add `/* eslint-disable */`, broad `eslint-disable-next-line`, `@ts-ignore`, or `@ts-expect-error`.
    -   If an existing suppression exists, remove it only if you can replace it safely without breaking behavior.

## 5) Security rules (must always hold)

### 5.1 XSS / HTML

-   Any use of `dangerouslySetInnerHTML` must be preceded by the centralized sanitizer output.
-   Editor write path and render path must remain sanitized.
-   Do not relax sanitizer allowlists to “fix formatting” unless the step explicitly scopes a security review.

### 5.2 Token and cookies

-   Never log tokens.
-   Keep cookies secure:
    -   `Secure` is environment-aware (HTTPS only).
    -   `SameSite` remains as implemented unless explicitly scoped.
-   Do not change token storage mechanism unless explicitly scoped.

### 5.3 Requests

-   Preserve axios interceptor behavior unless explicitly scoped.
-   Do not alter auth header format (raw token) unless explicitly scoped.

## 6) Architecture guardrails (keep the refined shape)

-   Services remain DTO-shaped.
-   Hooks remain the boundary (DTO → Domain mapping) unless explicitly scoped.
-   UI should prefer Domain types.
-   React Query queryKeys should keep using the canonical key factory unless explicitly scoped.

## 7) Reporting requirement (end of every step)

Rewrite `/mnt/data/refactor_report.md` with:

-   Step title and scope
-   What changed (UI + behavior + technical)
-   Files touched (exact paths)
-   Commands executed and results (lint/typecheck/test/build)
-   Risks introduced or retired (concrete, file-anchored)
-   Next step recommendation

## 8) Completion message format (every step)

-   ✅ What you changed (scope + intent)
-   ✅ Files changed (paths)
-   ✅ Verification results (lint/typecheck/test/build)
-   ✅ Any known risks or follow-ups
-   ✅ `/mnt/data/refactor_report.md` updated

## 9) If blocked

-   Stop.
-   State the exact blocker with file paths and error output.
-   Propose the smallest safe alternative plan.
