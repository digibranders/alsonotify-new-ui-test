# Workflow Module Refactoring - Implementation Plan

**Project:** AlsoNotify Frontend + Backend  
**Total Sprints:** 4  
**Estimated Duration:** 8-10 Days  
**Risk Level:** Low  
**Breaking Changes:** None

---

## Guiding Principles for AI Agent

### Anti-Hallucination Strategy

1. **Reference Before Writing** - Always read the backend source files before writing frontend equivalents. Mirror the exact status enums, transition rules, and role logic from backend.

2. **Small Verifiable Units** - Complete ONE file at a time. Verify it compiles and exports correctly before moving to the next file. Never write multiple interdependent files in one go.

3. **Type-First Development** - Always create .types.ts files FIRST. All subsequent files import from types. This catches errors early and ensures consistency.

4. **Incremental Migration** - New workflow module must work alongside existing code. Migrate ONE component at a time. Old and new can coexist during transition.

> **CRITICAL RULE:** After each phase, STOP and wait for human verification. Do not proceed to next phase until explicitly instructed. This prevents cascading errors.

---

## Progress Tracking Protocol

### Why This Matters
Each implementation phase should be executed in a **NEW chat conversation** to prevent context history from causing AI hallucinations. Long conversations accumulate context that can lead to inconsistent or incorrect code generation.

### Two-File System
After each phase completion, you will have two files to pass to the next chat:

1. **This file:** `docs/workflow-refactoring-implementation-plan.md` - The master plan (read-only)
2. **Progress file:** `docs/workflow-implementation-progress.md` - Tracks completed work (updated after each phase)

### Progress File Template
Create this file before starting Phase 1.1:

**File:** `docs/workflow-implementation-progress.md`

```markdown
# Workflow Implementation Progress

**Last Updated:** [DATE]
**Current Phase:** Not Started
**Next Phase:** 1.1

---

## Completed Phases

(None yet)

---

## Files Created

(None yet)

---

## Notes for Next Phase

- Starting fresh implementation
- Begin with Phase 1.1: Directory Setup & Common Types

---

## Verification Log

(Record verification results here)
```

### After Each Phase - UPDATE the Progress File

**Example after completing Phase 1.1:**

```markdown
# Workflow Implementation Progress

**Last Updated:** 2026-01-23
**Current Phase:** 1.1 COMPLETE
**Next Phase:** 1.2

---

## Completed Phases

### Phase 1.1: Directory Setup & Common Types ✅
- Created directory structure: src/lib/workflow/types/, requirement/, task/, rollup/
- Created: src/lib/workflow/types/common.types.ts
- Exports: Tab, ModalType types
- Verified: No TypeScript errors, imports work

---

## Files Created

1. `src/lib/workflow/types/common.types.ts` - Tab and ModalType types

---

## Notes for Next Phase

- Phase 1.2 should create requirement.types.ts
- Must read backend file first: alsonotify-backend-new/service/requirement.service.ts lines 364-500
- Import Tab, ModalType from common.types.ts

---

## Verification Log

- [2026-01-23] Phase 1.1: ✅ bun run build passed, no errors
```

### Starting a New Chat

When starting a new chat for the next phase, paste this prompt:

```
I am implementing the workflow refactoring for AlsoNotify.

Please read these two files:
1. docs/workflow-refactoring-implementation-plan.md (master plan)
2. docs/workflow-implementation-progress.md (current progress)

Execute the next phase as indicated in the progress file. Follow all Senior Software Engineer Standards. After completion, provide the updated progress file content.
```

### Mandatory End-of-Phase Action

**At the end of EVERY phase, the AI agent MUST:**

1. Output the complete updated `workflow-implementation-progress.md` content
2. Include all files created/modified in this phase
3. Include verification results
4. Include specific notes for the next phase
5. Human copies this to the progress file before starting next chat

---

## Senior Software Engineer Standards

### TypeScript Best Practices

1. **NEVER use `any`** - This is a strict rule. Always use proper types.
   ```typescript
   // BAD
   function getStatus(req: any): any { ... }
   
   // GOOD
   function getStatus(req: Requirement): RequirementStatus { ... }
   ```

2. **Use `unknown` instead of `any` for truly unknown types** - Then narrow with type guards.
   ```typescript
   // If you must accept unknown input
   function parseError(error: unknown): string {
     if (error instanceof Error) return error.message;
     if (typeof error === 'string') return error;
     return 'Unknown error';
   }
   ```

3. **Exhaustive switch statements** - Use `never` type to catch unhandled cases at compile time.
   ```typescript
   function getTabForStatus(status: RequirementStatus): Tab {
     switch (status) {
       case 'Waiting': return 'pending';
       case 'Submitted': return 'pending';
       // ... all cases
       default:
         const _exhaustive: never = status;
         throw new Error(`Unhandled status: ${_exhaustive}`);
     }
   }
   ```

4. **Use `as const` for literal objects** - Ensures type inference is precise.
   ```typescript
   // BAD
   const TRANSITIONS = { Waiting: ['Submitted', 'Rejected'] };
   // Type: { Waiting: string[] }
   
   // GOOD
   const TRANSITIONS = {
     Waiting: ['Submitted', 'Rejected'],
   } as const;
   // Type: { readonly Waiting: readonly ['Submitted', 'Rejected'] }
   ```

5. **Use `readonly` for immutable data structures** - Prevent accidental mutations.
   ```typescript
   type TransitionMap = Readonly<Record<RequirementStatus, readonly RequirementStatus[]>>;
   ```

6. **Prefer `interface` for object shapes, `type` for unions/primitives**
   ```typescript
   // Interface for objects
   interface CTAConfig {
     displayStatus: string;
     isPending: boolean;
   }
   
   // Type for unions
   type RequirementStatus = 'Waiting' | 'Submitted' | 'Assigned';
   type Tab = 'draft' | 'pending' | 'active' | 'completed' | 'delayed' | 'archived';
   ```

### Code Quality Standards

7. **JSDoc comments for all exported functions** - Include @param, @returns, @example.
   ```typescript
   /**
    * Determines if a status transition is valid for the given role.
    * 
    * @param from - Current requirement status
    * @param to - Target requirement status
    * @param role - User's role in this requirement
    * @returns true if transition is allowed
    * 
    * @example
    * isTransitionValid('Waiting', 'Submitted', 'receiver') // true
    * isTransitionValid('Waiting', 'Completed', 'receiver') // false
    */
   export function isTransitionValid(
     from: RequirementStatus,
     to: RequirementStatus,
     role: UserRole
   ): boolean { ... }
   ```

8. **Pure functions** - No side effects. Same input = same output. No mutations.
   ```typescript
   // BAD - mutates input
   function addTransition(map: TransitionMap, from: Status, to: Status) {
     map[from].push(to); // Mutation!
   }
   
   // GOOD - returns new value
   function addTransition(map: TransitionMap, from: Status, to: Status): TransitionMap {
     return { ...map, [from]: [...map[from], to] };
   }
   ```

9. **Descriptive variable names** - No single letters except loop indices.
   ```typescript
   // BAD
   const r = getRequirement();
   const s = r.status;
   
   // GOOD
   const requirement = getRequirement();
   const currentStatus = requirement.status;
   ```

10. **Early returns over nested conditions** - Reduces cognitive complexity.
    ```typescript
    // BAD
    function getCTA(status: Status, role: Role) {
      if (role === 'sender') {
        if (status === 'Waiting') {
          return { ... };
        } else if (status === 'Submitted') {
          return { ... };
        }
      }
    }
    
    // GOOD
    function getCTA(status: Status, role: Role) {
      if (role === 'sender' && status === 'Waiting') {
        return { ... };
      }
      if (role === 'sender' && status === 'Submitted') {
        return { ... };
      }
    }
    ```

### File Organization Standards

11. **Imports order** - External libs → Internal absolute → Relative, separated by blank lines.
    ```typescript
    // External
    import { useMemo } from 'react';
    
    // Internal absolute
    import { Requirement } from '@/types/domain';
    
    // Relative
    import { RequirementStatus } from './requirement.types';
    ```

12. **Export organization** - Types first, then constants, then functions.
    ```typescript
    // 1. Type exports
    export type { RequirementStatus, UserRole, CTAConfig };
    
    // 2. Constant exports
    export const SENDER_TRANSITIONS = { ... } as const;
    
    // 3. Function exports
    export function isTransitionValid() { ... }
    ```

13. **No default exports** - Use named exports only for better refactoring support.
    ```typescript
    // BAD
    export default function getStatus() { ... }
    
    // GOOD
    export function getStatus() { ... }
    ```

### Error Handling

14. **Throw descriptive errors with context**
    ```typescript
    // BAD
    throw new Error('Invalid transition');
    
    // GOOD
    throw new Error(
      `Invalid transition from "${currentStatus}" to "${targetStatus}" for role "${role}". ` +
      `Allowed transitions: ${allowedTransitions.join(', ')}`
    );
    ```

15. **Use type narrowing, not assertions**
    ```typescript
    // BAD - assertion can be wrong
    const status = req.status as RequirementStatus;
    
    // GOOD - validate at runtime
    function isRequirementStatus(value: string): value is RequirementStatus {
      return ['Waiting', 'Submitted', ...].includes(value);
    }
    
    if (!isRequirementStatus(req.status)) {
      throw new Error(`Invalid status: ${req.status}`);
    }
    ```

### Comment Writing Standards

16. **Comments should describe WHAT, not WHEN or WHY refactored**
    ```typescript
    // BAD - exposes timeline/refactoring context
    // Sprint 2: Added tab logic
    // Refactored from old implementation
    // TODO: Migrate in Sprint 3
    
    // GOOD - describes functionality
    // Requirement tab determination
    // Task CTA configuration
    // Status aggregation and rollup
    ```

17. **Keep comments functional and concise**
    ```typescript
    // BAD - too verbose, mentions implementation history
    // This function was added in Sprint 2 to centralize CTA logic
    // that was previously scattered across multiple components
    
    // GOOD - describes what the code does
    // Returns CTA configuration based on status and role
    ```

18. **Section comments should categorize, not narrate**
    ```typescript
    // BAD
    // =============================================================================
    // Functions added during the workflow refactoring project
    // =============================================================================
    
    // GOOD
    // =============================================================================
    // Function Exports
    // =============================================================================
    ```

19. **JSDoc should focus on usage, not history**
    ```typescript
    // BAD
    /**
     * Replaces the old getRequirementTab function from requirementState.utils.ts
     * Added as part of the workflow module refactoring.
     */
    
    // GOOD
    /**
     * Determines which tab a requirement belongs to based on status and context.
     * 
     * @param status - Current requirement status
     * @param type - Requirement type (outsourced, inhouse, client)
     * @returns The tab this requirement should appear in
     */
    ```

---

## Target File Structure

```
alsonotify-new-ui/src/lib/workflow/
├── index.ts                           # Public API exports
│
├── types/
│   ├── requirement.types.ts           # RequirementStatus, UserRole, CTAConfig
│   ├── task.types.ts                  # TaskStatus, MemberStatus, TaskCTAConfig
│   └── common.types.ts                # Shared types (Tab, ModalType, etc.)
│
├── requirement/
│   ├── requirementWorkflow.ts         # State machine, transitions
│   ├── requirementCTA.ts              # CTA mapping per status/role
│   ├── requirementTab.ts              # Tab determination logic
│   └── requirementModal.ts            # Modal field configurations
│
├── task/
│   ├── taskWorkflow.ts                # Task state machine
│   ├── taskCTA.ts                     # Task CTA mapping
│   └── memberAggregation.ts           # Member → Task status rollup
│
└── rollup/
    └── statusRollup.ts                # Task → Requirement rollup
```

---

## Sprint 1: Foundation - Types & State Machines

**Estimated:** 2-3 days | **Files:** 7 | **Risk:** Low

Create the workflow module structure with type definitions and state machines. No component changes yet - this sprint is purely additive.

---

### Phase 1.1: Directory Setup & Common Types

**Files to create:**
- `src/lib/workflow/` - Create directory structure: types/, requirement/, task/, rollup/
- `src/lib/workflow/types/common.types.ts`

**AI Agent Instructions:**
1. Create the directory structure first
2. Define `Tab` type: `'draft' | 'pending' | 'active' | 'completed' | 'delayed' | 'archived'`
3. Define `ModalType`: `'quotation' | 'reject' | 'mapping' | 'edit' | 'none'`
4. Keep this file minimal - only truly shared types

**Verification Checkpoint:**
- [ ] File exists and has no TypeScript errors
- [ ] Can be imported in another test file

---

### Phase 1.2: Requirement Types

**File:** `src/lib/workflow/types/requirement.types.ts`

**AI Agent Instructions:**
1. **FIRST:** Read `alsonotify-backend-new/service/requirement.service.ts` lines 364-500
2. Extract exact `RequirementStatus` values from backend enum
3. Define `UserRole`: `'sender' | 'receiver' | 'internal'`
4. Define `RequirementCTAConfig` interface with: displayStatus, isPending, tab, primaryAction, secondaryAction
5. Define `ActionConfig`: `{ label, type, modal?, apiAction? }`
6. Import Tab and ModalType from common.types.ts

**Verification Checkpoint:**
- [ ] RequirementStatus has all 14 statuses matching backend
- [ ] No TypeScript errors
- [ ] Types are properly exported

---

### Phase 1.3: Task Types

**File:** `src/lib/workflow/types/task.types.ts`

**AI Agent Instructions:**
1. **FIRST:** Read `alsonotify-backend-new/service/TaskWorkflowManager.ts`
2. Extract exact `TaskStatus` values from VALID_TRANSITIONS keys
3. Define `ExecutionMode`: `'parallel' | 'sequential'`
4. Define `MemberStatus` type
5. Define `TaskCTAConfig` interface

**Verification Checkpoint:**
- [ ] TaskStatus matches backend: Assigned, In_Progress, Review, Stuck, Impediment, Delayed, Completed
- [ ] No TypeScript errors

---

### Phase 1.4: Requirement State Machine

**File:** `src/lib/workflow/requirement/requirementWorkflow.ts`

**AI Agent Instructions:**
1. **FIRST:** Re-read backend `RequirementWorkflowManager.validateTransition()`
2. Create `SENDER_TRANSITIONS: Record<RequirementStatus, RequirementStatus[]>`
3. Create `RECEIVER_TRANSITIONS: Record<RequirementStatus, RequirementStatus[]>`
4. Create `INTERNAL_TRANSITIONS: Record<RequirementStatus, RequirementStatus[]>`
5. Implement `isTransitionValid(from, to, role): boolean`
6. Implement `getAllowedTransitions(status, role): RequirementStatus[]`
7. Add JSDoc comments explaining each transition

**Verification Checkpoint:**
- [ ] Transitions match backend exactly - cross-reference line by line
- [ ] Helper functions work with simple test calls
- [ ] No TypeScript errors

---

### Phase 1.5: Task State Machine

**File:** `src/lib/workflow/task/taskWorkflow.ts`

**AI Agent Instructions:**
1. **FIRST:** Read `TaskWorkflowManager.VALID_TRANSITIONS`
2. Create `TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]>`
3. Copy the exact transitions from backend
4. Implement `isTaskTransitionValid(from, to): boolean`
5. Implement `getAllowedTaskTransitions(status): TaskStatus[]`

**Verification Checkpoint:**
- [ ] TASK_TRANSITIONS matches TaskWorkflowManager.VALID_TRANSITIONS exactly
- [ ] No TypeScript errors

---

### Phase 1.6: Status Rollup Logic

**File:** `src/lib/workflow/rollup/statusRollup.ts`

**AI Agent Instructions:**
1. **FIRST:** Read `rollupRequirementStatus()` in task.service.ts lines 1267-1316
2. **ALSO READ:** `calculateAggregatedTaskStatus()` lines 1174-1190
3. Implement `deriveRequirementStatusFromTasks(tasks): RequirementStatus`
   - Priority: Revision → Review (all complete) → In_Progress → Assigned
4. Implement `aggregateMemberStatuses(members): TaskStatus`
   - Priority: Stuck → Impediment → In_Progress → Completed → Review → Delayed → Assigned

**Verification Checkpoint:**
- [ ] Logic matches backend rollup exactly
- [ ] Test with sample data arrays

---

### Phase 1.7: Index Export File

**File:** `src/lib/workflow/index.ts`

**AI Agent Instructions:**
1. Export all types from types/*.ts
2. Export workflow functions from requirement/ and task/
3. Export rollup functions
4. Use named exports, not default exports

**Verification Checkpoint:**
- [ ] Can import from `@/lib/workflow` in any component
- [ ] All exports resolve correctly
- [ ] Run: `bun run build` - no errors

---

> **SPRINT 1 COMPLETE - STOP**  
> Do not proceed to Sprint 2 until all Phase 1.x files are verified. Run `bun run build` to ensure no compilation errors.

---

## Sprint 2: CTA & Tab Logic

**Estimated:** 2 days | **Files:** 4 | **Risk:** Low

Implement the CTA mapping and tab determination logic using the specification document. Still no component changes - building the complete workflow module.

---

### Phase 2.1: Requirement Tab Logic

**File:** `src/lib/workflow/requirement/requirementTab.ts`

**AI Agent Instructions:**
1. **REFERENCE:** Read `docs/requirements-workflow-specification.html` CTA Matrix table
2. **ALSO READ:** Existing `getRequirementTab()` in requirementState.utils.ts
3. Implement `getRequirementTab(status, type, role, context): Tab`
4. Context includes: isWorkspaceMapped, isRejectedBySender, etc.
5. Handle rejection tab logic: Sender → Draft, Receiver → Pending
6. Use exhaustive switch statements for type safety

**Verification Checkpoint:**
- [ ] Test each status returns correct tab
- [ ] Rejection logic correct for both roles

---

### Phase 2.2: Requirement CTA Mapping

**File:** `src/lib/workflow/requirement/requirementCTA.ts`

**AI Agent Instructions:**
1. **REFERENCE:** CTA Matrix in specification document
2. **ALSO READ:** Existing `getRequirementActionState()`
3. Implement `getRequirementCTAConfig(status, role, context): RequirementCTAConfig`
4. Return: displayStatus, isPending, tab, primaryAction, secondaryAction
5. primaryAction/secondaryAction include: label, type, modal
6. Handle all status × role combinations from the matrix

**Verification Checkpoint:**
- [ ] Every row in CTA Matrix has corresponding code path
- [ ] No missing combinations

---

### Phase 2.3: Requirement Modal Config

**File:** `src/lib/workflow/requirement/requirementModal.ts`

**AI Agent Instructions:**
1. **REFERENCE:** Modal Configuration section in specification
2. Define `ModalFieldConfig` interface
3. Implement `getQuotationModalConfig(pricingModel): ModalFieldConfig`
4. Implement `getRejectModalConfig(): ModalFieldConfig`
5. Implement `getMappingModalConfig(): ModalFieldConfig`

**Verification Checkpoint:**
- [ ] Modal configs match existing dialog implementations
- [ ] Field conditions are correct (hourly vs project)

---

### Phase 2.4: Task CTA Mapping

**File:** `src/lib/workflow/task/taskCTA.ts`

**AI Agent Instructions:**
1. **FIRST:** Analyze existing TaskCard and TasksPage components
2. Identify all task CTAs currently in use
3. Implement `getTaskCTAConfig(status, isLeader, isMember): TaskCTAConfig`
4. Include: displayStatus, primaryAction, secondaryAction

**Verification Checkpoint:**
- [ ] All task statuses have CTA mappings
- [ ] Leader vs member permissions correct

---

> **SPRINT 2 COMPLETE - STOP**  
> Update index.ts to export new functions. Run `bun run build`. Do not proceed until verified.

---

## Sprint 3: Backend Types Refactoring

**Estimated:** 1-2 days | **Files:** 5 new + 28 imports to update | **Risk:** Low

Refactor backend type files to improve organization and fix naming inconsistencies. This ensures backend types are properly organized before frontend component migration.

---

### Phase 3.1: Create Common Types File

**File:** `alsonotify-backend-new/types/common-type.ts`

**AI Agent Instructions:**
1. Create new file `types/common-type.ts`
2. Extract from `user.ts`:
   - `ParamsSchema` / `IParamsType` (lines 193-204)
   - `QueryParamsSchema` / `IQueryParamsType` (lines 238-264)
   - `idParamsSchema` / `IdParamsType` (lines 503-514)
3. Add proper JSDoc comments
4. Export all schemas and types

**Verification Checkpoint:**
- [ ] File created with no TypeScript errors
- [ ] All exports are properly typed

---

### Phase 3.2: Create Workspace Types File

**File:** `alsonotify-backend-new/types/workspace-type.ts` (NEW - properly named)

**AI Agent Instructions:**
1. Create new file `types/workspace-type.ts`
2. Extract from `user.ts`:
   - `WorkspaceStatusUpdateSchema` / `IWorkspaceStatusUpdate` (lines 206-220)
   - `WorkspaceQueryParamsSchema` / `IWorkspaceQueryParamsType` (lines 266-294)
   - `WorkspaceCreateSchema` / `IWorkspaceCreateType` (lines 296-328)
   - `WorkspaceApprovalSchema` / `IWorkspaceApprovalType` (lines 330-344)
   - `WorkspaceWorklogParamsSchema` / `IWorkspaceWorklogParamsType` (lines 491-501)
   - `WorkspaceReportQueryParamsSchema` / `IWorkspaceReportQueryParamsType` (lines 587-606)
3. Import `FromSchema` from "json-schema-to-ts"
4. Add proper JSDoc comments

**Verification Checkpoint:**
- [ ] File created with all workspace types
- [ ] No TypeScript errors

---

### Phase 3.3: Create Task Types File

**File:** `alsonotify-backend-new/types/task-type.ts`

**AI Agent Instructions:**
1. Create new file `types/task-type.ts`
2. Extract from `user.ts`:
   - `TaskStatusUpdateSchema` / `ITaskStatusUpdate` (lines 222-236)
   - `TaskCreateSchema` / `ITaskCreateType` (lines 346-406)
   - `TaskQueryParamsSchema` / `ITaskQueryParamsType` (lines 408-452)
   - `TaskWorklogCreatSchema` / `ITaskWorklogCreatType` (lines 454-477)
   - `WorklogParamsSchema` / `IWorklogParamsType` (lines 479-489)
   - `TaskReportQueryParamsSchema` / `ITaskReportQueryParamsType` (lines 608-633)
   - `TaskMemberStatus` / `TaskMemberStatusType` (lines 751-759)
3. **IMPORTANT:** Add `"Stuck"` to `TaskStatusUpdateSchema` enum (line 229)
4. **IMPORTANT:** Add `"Stuck"` to `TaskCreateSchema` enum (line 383)
5. Import `FromSchema` from "json-schema-to-ts"

**Verification Checkpoint:**
- [ ] File created with all task types
- [ ] `Stuck` added to both status enums
- [ ] No TypeScript errors

---

### Phase 3.4: Rename and Fix Requirement Types

**File:** `alsonotify-backend-new/types/requirement-type.ts` (RENAMED from workspace-type.ts)

**AI Agent Instructions:**
1. **RENAME** `types/workspace-type.ts` → `types/requirement-type.ts`
2. **UPDATE** `RequirementSchema` status enum (line 72):
   - Add `"Delayed"` to the enum array
   - Should be: `["Assigned", "In_Progress", "On_Hold", "Submitted", "Completed", "Waiting", "Rejected", "Review", "Revision", "Impediment", "Stuck", "Delayed", null]`
3. Keep all existing content:
   - `RequirementSchema` / `IRequirementSchema`
   - `WorkspaceParamsSchema` / `IWorkspaceParamsSchema` (used in requirement routes)
   - `RequirementApprovalSchema` / `IRequirementApprovalType`

**Verification Checkpoint:**
- [ ] File renamed successfully
- [ ] `Delayed` added to status enum
- [ ] No TypeScript errors

---

### Phase 3.5: Update User Types File

**File:** `alsonotify-backend-new/types/user.ts`

**AI Agent Instructions:**
1. **REMOVE** all extracted types (common, workspace, task types)
2. **KEEP** only user-related types:
   - User auth schemas (Login, Register, Password, RegisterCompany)
   - User management schemas (Create, Invite, Activate, Update)
   - Partner schemas (Delete, Activate)
   - Company update schema
   - Role actions schema
   - Invoice schemas (optional - can keep or move later)
   - Employee engagement schema (optional)
3. **ADD** imports for extracted types:
   ```typescript
   // Re-export common types for backward compatibility (temporary)
   export type { IParamsType, IQueryParamsType, IdParamsType } from './common-type';
   export type { IWorkspaceCreateType, IWorkspaceStatusUpdate, ... } from './workspace-type';
   export type { ITaskCreateType, ITaskStatusUpdate, ... } from './task-type';
   ```

**Verification Checkpoint:**
- [ ] `user.ts` only contains user-related types
- [ ] Backward compatibility exports added (temporary)
- [ ] No TypeScript errors

---

### Phase 3.6: Update All Imports

**AI Agent Instructions:**
1. **Update 4 files** importing from `workspace-type.ts`:
   - `service/requirement.service.ts` → `requirement-type.ts`
   - `routes/workspace-routes.ts` → `requirement-type.ts` (for requirement types)
   - `routes/requirement-routes.ts` → `requirement-type.ts`
   - `controller/requirement.controller.ts` → `requirement-type.ts`

2. **Update 24 files** importing from `user.ts`:
   - Files needing `common-type.ts`: controllers, routes using ParamsSchema, QueryParamsSchema
   - Files needing `workspace-type.ts`: workspace controller, workspace routes, workspace service
   - Files needing `task-type.ts`: task controller, task routes, task service
   - Files keeping `user.ts`: auth routes, user controller, user routes, user service

3. **Update import statements** to use new file paths:
   ```typescript
   // FROM:
   import { IParamsType, IWorkspaceCreateType } from '../types/user';
   
   // TO:
   import { IParamsType } from '../types/common-type';
   import { IWorkspaceCreateType } from '../types/workspace-type';
   ```

**Verification Checkpoint:**
- [ ] All 28 files updated with correct imports
- [ ] No broken import references
- [ ] Backend builds successfully

---

> **SPRINT 3 COMPLETE - STOP**  
> Run `bun run build` in backend. Verify all imports resolve. Do not proceed until verified.

---

## Sprint 4: Component Migration

**Estimated:** 2-3 days | **Files:** 5+ | **Risk:** Medium

Migrate existing components to use the new workflow module. One component at a time. Verify each before proceeding.

---

### Phase 4.1: Migrate requirementState.utils.ts

**File:** `src/components/features/requirements/utils/requirementState.utils.ts`

**AI Agent Instructions:**
1. **DO NOT DELETE** existing file - refactor in place
2. Import from `@/lib/workflow`
3. Replace `getRequirementTab` implementation with call to workflow module
4. Replace `getRequirementActionState` with call to `getRequirementCTAConfig`
5. Keep same function signatures for backward compatibility
6. Add deprecation comments pointing to workflow module

**Verification Checkpoint:**
- [ ] RequirementsPage still works unchanged
- [ ] RequirementCard still works unchanged
- [ ] No visual regressions

---

### Phase 4.2: Migrate RequirementCard

**File:** `src/components/features/requirements/components/RequirementCard.tsx`

**AI Agent Instructions:**
1. Import `getRequirementCTAConfig` from workflow module
2. Replace inline CTA logic (lines ~386-458) with config object
3. Render buttons based on config.primaryAction, config.secondaryAction
4. Keep component props unchanged
5. Remove redundant status checks - use config.isPending, config.tab

**Verification Checkpoint:**
- [ ] Cards display same CTAs as before
- [ ] Click handlers still work
- [ ] Test all tab views

---

### Phase 4.3: Migrate RequirementsPage handleReqAccept

**File:** `src/components/features/requirements/RequirementsPage.tsx`

**AI Agent Instructions:**
1. Import `getRequirementCTAConfig` from workflow module
2. Refactor `handleReqAccept` (lines 894-976)
3. Get CTA config for requirement, then switch on config.primaryAction.modal
4. Modal routing becomes: quotation → setIsQuotationOpen, mapping → setIsMappingOpen, none → direct API
5. Remove nested if/else tree
6. Also refactor `mapRequirementStatus` to use workflow module

**Verification Checkpoint:**
- [ ] All accept/reject flows still work
- [ ] Correct modals open for each status
- [ ] Status transitions succeed

---

### Phase 4.4: Migrate RequirementDetailsPage

**File:** `src/components/features/requirements/RequirementDetailsPage.tsx`

**AI Agent Instructions:**
1. Import from workflow module
2. Refactor action button rendering (around lines 596-620)
3. Use `getRequirementCTAConfig` to determine which buttons to show
4. Simplify inline conditions

**Verification Checkpoint:**
- [ ] Detail page shows correct actions per status
- [ ] Accept/Reject buttons work

---

### Phase 4.5: Add Unit Tests

**Files:**
- `src/lib/workflow/__tests__/requirementWorkflow.test.ts`
- `src/lib/workflow/__tests__/requirementCTA.test.ts`
- `src/lib/workflow/__tests__/statusRollup.test.ts`

**AI Agent Instructions:**
1. Use `bun test` framework
2. Test every transition in SENDER/RECEIVER/INTERNAL_TRANSITIONS
3. Test invalid transitions return false
4. Test CTA config for each row in the specification matrix
5. Test rollup priority logic with edge cases

**Verification Checkpoint:**
- [ ] All tests pass: `bun test`
- [ ] Coverage for all status combinations

---

> **SPRINT 4 COMPLETE - FINAL VERIFICATION**  
> Run full test suite. Manual QA all requirement flows. Check for regressions in all tabs.

---

## Final Deliverables Checklist

| Sprint | File | Purpose | Status |
|--------|------|---------|--------|
| S1 | `types/common.types.ts` | Tab, ModalType enums | ☐ |
| S1 | `types/requirement.types.ts` | RequirementStatus, CTAConfig | ☐ |
| S1 | `types/task.types.ts` | TaskStatus, MemberStatus | ☐ |
| S1 | `requirement/requirementWorkflow.ts` | State machine transitions | ☐ |
| S1 | `task/taskWorkflow.ts` | Task state machine | ☐ |
| S1 | `rollup/statusRollup.ts` | Task → Requirement rollup | ☐ |
| S1 | `index.ts` | Public exports | ☐ |
| S2 | `requirement/requirementTab.ts` | Tab determination | ☐ |
| S2 | `requirement/requirementCTA.ts` | CTA mapping | ☐ |
| S2 | `requirement/requirementModal.ts` | Modal configurations | ☐ |
| S2 | `task/taskCTA.ts` | Task CTA mapping | ☐ |
| S3 | `requirementState.utils.ts` | Migrate to workflow module | ☐ |
| S3 | `RequirementCard.tsx` | Use workflow CTA | ☐ |
| S3 | `RequirementsPage.tsx` | Simplify handleReqAccept | ☐ |
| S3 | `RequirementDetailsPage.tsx` | Use workflow CTA | ☐ |
| S3 | `__tests__/*.test.ts` | Unit tests | ☐ |

---

## Risk Mitigation

### Rollback Strategy
Since Sprint 1 & 2 are purely additive (new files only), there's zero rollback risk. Sprint 3 (backend types refactoring) is also low risk - imports can be reverted if needed. Sprint 4 modifies existing components - if issues arise, simply revert those specific file changes. The workflow module can exist alongside old code indefinitely.

### Testing Strategy
Sprint 3: Verify backend builds after each phase. Check all imports resolve. Sprint 4: Manual QA after each phase. Test all tabs (Draft, Pending, Active, Completed, Delayed). Test both Sender and Receiver views. Test rejection flows specifically. Automated tests in Phase 4.5 provide regression safety net.

---

## Quick Reference: Backend Source Files

| Frontend File | Backend Reference |
|---------------|-------------------|
| requirement.types.ts | `requirement.service.ts` lines 364-500 |
| task.types.ts | `TaskWorkflowManager.ts` |
| requirementWorkflow.ts | `RequirementWorkflowManager.validateTransition()` |
| taskWorkflow.ts | `TaskWorkflowManager.VALID_TRANSITIONS` |
| statusRollup.ts | `rollupRequirementStatus()` lines 1267-1316, `calculateAggregatedTaskStatus()` lines 1174-1190 |

---

*Prepared by: AI CTO + Project Manager | January 2026*
