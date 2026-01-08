# Baseline Report

## A. Command results summary

-   `npm ci`: **PASS** (Added 749 packages)
-   `npm run build`: **PASS** (Next.js build succeeded)
-   `npm run lint`: **PASS** (Execution successful after config fix).
    -   Found **704 problems** (88 errors, 616 warnings).
-   `npm run typecheck`: **PASS** (0 errors).
-   `npm test`: **FAIL** (Script missing in package.json)

## B. Top errors list

-   **Lint**: 88 Errors total.
    -   Top Error: `no-useless-catch` (Redundant try-catch wrappers in services).
    -   Top Warning: `@typescript-eslint/no-explicit-any` (616 warnings).
-   **Typecheck**: 0 errors.

## C. Error taxonomy and counts

-   **Unused vars/imports**: Tracked by linter (present in warnings).
-   **Type errors**: 0 (Full compilation pass).
-   **`any` / type widening**: High (616 lint warnings + ~30 grep matches).
    -   Widespread in `src/services/` and `src/components/common/`.
-   **Redundant Exception Handling**: High (80+ `no-useless-catch` errors).
-   **Security-relevant patterns**:
    -   `innerHTML`: ~20 matches (`RichTextEditor.tsx`, `RequirementDetailsPage.tsx`).
    -   `cookie` flags: `secure: false` discovered in `src/services/cookies.ts`.
-   **API/service inconsistencies**:
    -   `Authorization` vs `authorization` header casing in `src/services/auth.ts` vs `src/config/axios.ts`.

## D. Highest-risk findings

1.  **Insecure Cookies**: Cookies are explicitly set with `secure: false` which is unsafe for production.
    -   File: `src/services/cookies.ts:5`
2.  **Unsafe HTML Injection**: Widespread use of `innerHTML` and `dangerouslySetInnerHTML`. While some use `DOMPurify`, others (e.g. `RichTextEditor.tsx`) directly manipulate `innerHTML`.
    -   File: `src/components/common/RichTextEditor.tsx`
3.  **Implicit `any` Usage**: Multiple instances of `(item: any)` or `as any` bypass type safety, hiding potential bugs.
    -   File: `src/components/common/Topbar.tsx`
4.  **Redundant Code**: Widespread use of `try/catch` blocks that only rethrow, cluttering the code and potentially hiding stack traces if not handled correctly (though currently they just throw).

## E. Refactor sequence proposal

1.  **[DONE] Fix Environment & scripts**
    -   Restored `npm run lint` by fixing `eslint.config.mjs` (avoiding circular dependency).
    -   Added `typecheck` script.
2.  **Clean up Lint Errors (High Noise)**
    -   Remove `no-useless-catch` blocks to unblock CI gate enforcement on errors.
3.  **Harmonize API Headers** (Low Risk)
    -   Standardize Axios `Authorization` header casing.
4.  **Security Hardening - Cookies** (Medium Risk)
    -   Update cookie configuration to use `secure: true` in production (env-based).
5.  **Security Hardening - HTML** (High Risk)
    -   Audit and replace `innerHTML`/`execCommand`.
6.  **Type Safety - Remove `any`** (Medium Risk)
    -   Iteratively replace `any` with specific types.
