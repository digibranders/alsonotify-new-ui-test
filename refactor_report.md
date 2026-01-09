# Refactor Report: Payload DTOs

**Status**: ✅ Complete
**Date**: 2026-01-09

## Executive Summary

We have successfully eliminated `as any` casts in payload creation and submission paths for Task, Requirement, Workspace, and Employee entities. We defined strict Request DTOs, updated service and hook signatures, and refactored UI components to comply with these new types.

The system now enforces strict type checking on all mutations, preventing payload mismatch regressions. All validation gates (Typecheck, Lint, Build) are passing.

## Changes Implemented

### 1. DTO Definitions

Established strict Request DTOs mirroring backend expectations and UI requirements:

-   `CreateTaskRequestDto`, `UpdateTaskRequestDto`
-   `CreateRequirementRequestDto`, `UpdateRequirementRequestDto`
-   `CreateWorkspaceRequestDto`, `UpdateWorkspaceRequestDto`
-   `CreateEmployeeRequestDto`, `UpdateEmployeeRequestDto`
-   `UpdateUserProfileRequestDto`

### 2. Service Layer Hardening

Updated service functions in `src/services/` to accept specific DTOs instead of generic `any` or loose partials:

-   `user.ts`: `createUser`, `updateUserById`, `updateCurrentUserProfile`
-   `task.ts`: `createTask`, `updateTask`
-   `workspace.ts`: `createWorkspace`, `updateWorkspace`, `addRequirementToWorkspace`, `updateRequirementById`

### 3. Hook Layer Hardening

Refactored React Query hooks in `src/hooks/` to enforce input types on mutations:

-   `useUser.ts`: `useCreateEmployee`, `useUpdateEmployee` (fixed ID handling), `useCreateClient`
-   `useTask.ts`: `useCreateTask`, `useUpdateTask`
-   `useWorkspace.ts`: `useCreateWorkspace`, `useUpdateWorkspace`, `useCreateRequirement`, `useUpdateRequirement`

### 4. UI Call Site Refactoring

Systematically removed `as any` casts and fixed payload construction in:

-   **`EmployeesPage.tsx`**: Removed `as any` from create/update/bulk mutations. Corrected field names (`joining_date` -> `date_of_joining`, added `manager_id`).
-   **`ProjectCard.tsx`**: Secured task creation payload.
-   **`Topbar.tsx`**: Secured global create actions for Tasks and Requirements.
-   **`RequirementsForm.tsx`**: Updated form submission to emit strict DTOs.
-   **`RequirementsPage.tsx`**: Updated handlers to accept DTOs directly, removing redundant logic and casts.
-   **`WorkspaceForm.tsx`**: Secured workspace creation/update payloads.

## Verification Results

| Gate                | Status    | Notes                                                |
| ------------------- | --------- | ---------------------------------------------------- |
| `npm run typecheck` | ✅ PASSED | 0 Errors (down from initial failures)                |
| `npm run lint`      | ✅ PASSED | 0 Errors, 586 Warnings (pre-existing, no new errors) |
| `npm run build`     | ✅ PASSED | Successful production build                          |

## Key Improvements

-   **Type Safety**: Mutations now strictly validate payloads at compile time.
-   **Code Clarity**: Removed ambiguous `any` casts, making data flow transparent.
-   **Bug Fixes**: Identified and fixed field name mismatches (e.g. `joining_date` vs `date_of_joining`) that were hidden by `any` casts.

## Codebase Metrics (Post-Refactor)

| Metric                | Count | Description                                                           |
| --------------------- | ----- | --------------------------------------------------------------------- |
| **Typecheck Errors**  | **0** | PASSED. No compilation errors.                                        |
| **Lint Warnings**     | 586   | Mostly legacy warnings, no new warnings introduced.                   |
| **`as any` Casts**    | 111   | Reduced from mutation paths. Remaining usage is in legacy components. |
| **`: any` Types**     | 164   | Remaining usage in legacy services/components.                        |
| **Total `any` Token** | 771   | Total occurrences including comments and strings.                     |
