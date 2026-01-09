# Refactor Report: Query Key Standardization

## Executive Summary

Step 3 is complete. React Query keys have been standardized across the application using a central factory pattern (`src/lib/queryKeys.ts`). This ensures deterministic caching and consistent invalidation, fixing the risk of stale UI updates. All hooks and previously ad-hoc component invalidations now use the factory.

## Files Touched

-   **[NEW]** `src/lib/queryKeys.ts`: Singleton factory module defining the schema for all query keys.
-   **[NEW]** `src/lib/queryKeys.ts`
-   `src/hooks/useUser.ts`
-   `src/hooks/useAuth.ts`
-   `src/hooks/useWorkspace.ts`
-   `src/hooks/useTask.ts`
-   `src/hooks/useNotes.ts`
-   `src/hooks/useNotification.ts`
-   `src/hooks/useMeeting.ts`
-   `src/hooks/useHoliday.ts`
-   `src/hooks/useCalendar.ts`
-   `src/hooks/useFeedback.ts`
-   `src/hooks/useLeave.ts`
-   `src/components/dashboard/NotesWidget.tsx`
-   `src/components/common/NoteViewModal.tsx`
-   `src/components/features/employees/EmployeesPage.tsx`
-   `src/components/dashboard/MeetingsWidget.tsx`

## Query Key Standard Adopted

We adopted a schema where every entity (e.g., `tasks`, `users`) has a root key for global invalidation and specific sub-keys for lists and details.

**Design Pattern:**

```typescript
export const queryKeys = {
    tasks: {
        all: () => ["tasks"] as const, // Root for invalidation
        list: (filters) => ["tasks", "list", filters] as const,
        detail: (id) => ["tasks", "detail", id] as const,
        // ...
    },
};
```

## Invalidation Changes

-   **Tasks**: Creating/updating/deleting tasks now invalidates `queryKeys.tasks.listRoot()` (replaces `['tasks']`) and `queryKeys.tasks.detail(id)`.
-   **Users/Employees**: Employee updates now consistently invalidate `queryKeys.users.employeesRoot()` and `queryKeys.users.me()` where relevant.
-   **Workspaces**: Workspace updates invalidate `queryKeys.workspaces.listRoot()` and `queryKeys.workspaces.detail(id)`.
-   **Ad-hoc**: Removed raw string invalidations like `queryClient.invalidateQueries({ queryKey: ["notes"] })` in favor of `queryKeys.notes.all()`.

## Verification Results

| Command             | Result   | Notes                                 |
| :------------------ | :------- | :------------------------------------ |
| `npm run lint`      | **PASS** | 0 errors, 580+ warnings (legacy debt) |
| `npm run typecheck` | **PASS** | **0 errors**                          |
| `npm run build`     | **PASS** | Production build successful           |
| `npm run test`      | **PASS** | No behavior changes to tested logic   |

## Metrics & Health

| Metric                       | Count   | Status                  |
| :--------------------------- | :------ | :---------------------- |
| **Query Key Roots**          | ~10     | Unified in `queryKeys`  |
| **Hooks Updated**            | 11      | ✅ Refactored           |
| **Manual Invalidations Fix** | 4 Files | ✅ Standardized         |
| **Typecheck Errors**         | 0       | ✅ Clean                |
| **Lint Warnings**            | 587     | ⚠️ Legacy Debt (Stable) |
| **Explicit `any`**           | 161     | Used as `: any`         |
| **Casted `any`**             | 122     | Used as `as any`        |
| **Tests Passing**            | 50/50   | ✅ 100%                 |

## Risk Notes

-   **Cache Busting**: Changing keys effectively busts the cache for all users on deployment. This is expected and desirable to clear out any old/inconsistent cache states.
-   **Future Hooks**: New hooks MUST import and use `queryKeys`. Do not add string literals for keys in new code.
