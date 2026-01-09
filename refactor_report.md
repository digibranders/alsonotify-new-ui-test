# Refactor Report - UI Explicit Any Removal

## Overview

This refactor aims to remove explicit `any` usage from the UI layer to improve type safety and maintainability.

## Progress

### Batch 1 (High Impact)

**Status**: Completed & Verified
**Files**:

-   `src/components/features/requirements/RequirementsPage.tsx`
-   `src/components/features/tasks/TasksPage.tsx`
-   `src/components/features/employees/EmployeesPage.tsx`
-   `src/components/features/requirements/RequirementDetailsPage.tsx`
-   `src/components/workspace/ProjectCard.tsx`

**Changes**:

-   Replaced `any` with strict domain types (`Requirement`, `Task`, `Employee`, `Workspace`).
-   Created `ProjectTaskUI` interface for `ProjectCard` to handle view-specific data shape.
-   Used boundary casts (`t: any` -> `t: Task`) in mapping functions where service layer types (`TaskType`) were loose or incompatible with strict domain types.
-   Extended `domain.ts` with missing fields found during refactoring.

## Metrics

-   **Type Failures Resolved**: Reduced from implicit `any` usage to strict types. Remaining errors highlight actual type mismatches between Service and Domain layers.
-   **Files Touched**: 5

### Phase 2: Service-Domain Alignment

**Status**: Completed & Verified

**Changes**:

-   **DTOs Created**: Defined strict Data Transfer Objects mirroring backend responses (`TaskDto`, `UserDto`, `WorkspaceDto`, `RequirementDto`) in `src/types/dto/`.
-   **Mappers Implemented**: Created pure mapping functions (`mapTaskDtoToDomain`, etc.) in `src/utils/mappers/` to safely transform nullables to strict Domain types.
-   **Service Layer Hardening**: Updated `src/services/` to return `ApiResponse<DTO>` instead of loose types. Relaxed input types to `Partial<DTO>` for create/update operations to match UI flexibility.
-   **Hook Integration**: Updated `useTasks`, `useEmployees`, `useWorkspaces` hooks to automatically map DTOs to Domain types using `select` option.
-   **UI Cast Removal**: Removed `as any` and `as Type` casts from Batch 1 UI files. UI now consumes strict Domain types directly from hooks.

## Metrics

-   **Type Failures Resolved**: `npm run typecheck` now passes with 0 errors (from 85+).
-   **Files Touched**: 10+ (Services, Hooks, Mappers, UI Components).

## Remaining Issues / Debt

-   Some Service input types might need further refinement if backend requires strict non-partials in specific endpoints.
-   Batch 2 UI files still contain explicit `any` and will be addressed in next phase.

## Next Steps

-   Proceed to Batch 2 files (`WorkspacePage`, `SettingsPage`, etc).
