# Sprint 4: Component Migration - Implementation Plan

**Project:** AlsoNotify Frontend  
**Sprint:** 4 (Component Migration)  
**Estimated Duration:** 2-3 days  
**Risk Level:** Medium  
**Dependencies:** Sprint 1 & 2 complete (workflow module ready)

---

## Executive Summary

Sprint 4 migrates existing requirement components to use the new centralized workflow module (`@/lib/workflow`). This eliminates duplicate business logic, ensures consistency across components, and provides a single source of truth for status transitions, CTA mappings, and tab determination.

**Key Objectives:**
1. Refactor `requirementState.utils.ts` to delegate to workflow module (backward compatible)
2. Migrate `RequirementCard` to use `getRequirementCTAConfig`
3. Simplify `RequirementsPage.handleReqAccept` using workflow CTA routing
4. Migrate `RequirementDetailsPage` action buttons
5. Add comprehensive unit tests for workflow module

**Success Criteria:**
- All components work identically to before (no visual/functional regressions)
- Code is cleaner, more maintainable, and type-safe
- All tests pass
- No `any` types introduced
- Build succeeds with no TypeScript errors

---

## Guiding Principles for AI Agent

### Migration Strategy

1. **Backward Compatibility First** - Existing function signatures must remain unchanged. Components should work without modification during transition.

2. **Incremental Refactoring** - One component at a time. Verify each works before moving to the next. Old and new code can coexist.

3. **Type Safety** - Convert `Requirement` type usage to proper workflow types. Map `rawStatus` strings to `RequirementStatus` enum using type guards.

4. **Context Mapping** - Extract `RequirementContext` from `Requirement` object. Map `isSender`/`isReceiver` to `UserRole`. Handle `isArchived` flag correctly.

5. **Action Routing** - Use `ActionConfig.modal` to route to correct modals. Use `ActionConfig.apiAction` for direct API calls.

### Anti-Hallucination Rules

1. **Read Before Write** - Always read the existing component implementation fully before refactoring.

2. **Preserve Behavior** - Match existing behavior exactly. Test edge cases (rejection flows, workspace mapping, etc.).

3. **Verify Imports** - Check that all workflow module exports exist before using them.

4. **Type Guards** - Use `isRequirementStatus()` and `isTaskStatus()` from workflow module to validate status strings.

---

## Phase 4.1: Migrate requirementState.utils.ts

**File:** `src/components/features/requirements/utils/requirementState.utils.ts`  
**Estimated Time:** 1-2 hours  
**Risk:** Low (backward compatible wrapper)

### Current State Analysis

**Existing Functions:**
- `getRequirementTab(req: Requirement): RequirementTab` - Lines 18-80
- `getRequirementActionState(req: Requirement, currentUserId?: number): RequirementActionState` - Lines 87-215

**Key Dependencies:**
- Uses `req.rawStatus` (string) - needs conversion to `RequirementStatus`
- Uses `req.isSender`, `req.isReceiver` - needs conversion to `UserRole`
- Uses `req.receiver_workspace_id` - maps to `isWorkspaceMapped` context
- Uses `req.updated_user` - for rejection source detection

### Implementation Steps

1. **Add Imports**
   ```typescript
   import {
     getRequirementTab as getWorkflowTab,
     getRequirementCTAConfig,
     isRequirementStatus,
     type RequirementStatus,
     type UserRole,
     type RequirementContext,
   } from '@/lib/workflow';
   import type { Tab, RequirementCTAConfig } from '@/lib/workflow';
   ```

2. **Create Helper Functions**
   - `mapRequirementToStatus(req: Requirement): RequirementStatus | 'draft'` - Convert `rawStatus` to enum
   - `mapRequirementToRole(req: Requirement): UserRole` - Convert `isSender`/`isReceiver` to role
   - `mapRequirementToContext(req: Requirement, currentUserId?: number): RequirementContext` - Extract context

3. **Refactor `getRequirementTab`**
   - Call `getWorkflowTab()` with mapped parameters
   - Handle `'draft'` special status
   - Handle `isArchived` flag (check `req.isArchived` or `req.rawStatus === 'Archived'`)
   - Return `RequirementTab` (should match `Tab` type)

4. **Refactor `getRequirementActionState`**
   - Call `getRequirementCTAConfig()` with mapped parameters
   - Map `RequirementCTAConfig` to `RequirementActionState`:
     - `isPending` → `isPending`
     - `displayStatus` → `displayStatus`
     - `primaryAction?.label` → `actionButtonLabel`
     - `primaryAction?.type` → `actionButton` (map 'primary'/'danger' to 'Approve'/'Reject'/'Submit'/'Map'/'Edit'/'Revise')
     - `isSender`/`isReceiver` → extract from role

5. **Add Deprecation Comments**
   ```typescript
   /**
    * @deprecated This function is a compatibility wrapper for the workflow module.
    * Use `getRequirementTab()` from `@/lib/workflow` directly.
    * This wrapper will be removed in a future version.
    */
   ```

### Verification Checklist

- [ ] `getRequirementTab()` returns same values as before for all test cases
- [ ] `getRequirementActionState()` returns same values as before
- [ ] Handles `'draft'` status correctly
- [ ] Handles `isArchived` flag correctly
- [ ] Handles rejection source detection (`updated_user` comparison)
- [ ] TypeScript compiles with no errors
- [ ] No `any` types introduced

### Test Cases to Verify

1. **Tab Determination:**
   - Archived requirement → 'archived'
   - Delayed requirement → 'delayed'
   - Draft requirement → 'draft'
   - Completed requirement → 'completed'
   - Waiting (receiver) → 'pending'
   - Waiting (sender) → 'pending'
   - Assigned + mapped → 'active'
   - Assigned + not mapped → 'pending'
   - Rejected (sender rejected) → 'pending' (sender sees draft)
   - Rejected (receiver rejected) → 'pending' (receiver sees pending)

2. **Action State:**
   - Waiting (receiver) → Submit Quote button
   - Submitted (sender) → Accept Quote button
   - Assigned + not mapped (receiver) → Map Workspace button
   - Review (sender) → Approve Work button
   - Rejected (receiver, sender rejected quote) → Revise Quote button
   - Rejected (sender, receiver rejected requirement) → Edit & Resend button

---

## Phase 4.2: Migrate RequirementCard

**File:** `src/components/features/requirements/components/RequirementCard.tsx`  
**Estimated Time:** 2-3 hours  
**Risk:** Medium (UI component, visual regressions possible)

### Current State Analysis

**Key Sections:**
- Lines 51-53: Uses `getRequirementActionState()` hook
- Lines 387-469: Action button rendering logic
- Lines 407-416: Reject button conditional rendering
- Lines 419-458: Primary action button rendering

**Current Logic:**
- Uses `actionButton` from `RequirementActionState`
- Hardcoded reject button conditions: `(isReceiver && rawStatus === 'Waiting') || (isSender && (rawStatus === 'Review' || rawStatus === 'Submitted'))`
- Maps `actionButton` to click handlers: 'Edit' → `onEdit`, 'Revise' → `onAccept`, others → `onAccept`

### Implementation Steps

1. **Update Imports**
   ```typescript
   import {
     getRequirementCTAConfig,
     isRequirementStatus,
     type RequirementStatus,
     type UserRole,
   } from '@/lib/workflow';
   import { getRequirementActionState } from '../utils/requirementState.utils';
   ```

2. **Create Helper Hook (Optional)**
   - Create `useRequirementCTA(requirement, currentUserId)` hook
   - Returns `RequirementCTAConfig` + mapped `UserRole`
   - Handles status/role/context mapping internally

3. **Update Action Button Rendering (Lines 387-469)**
   - Replace `getRequirementActionState()` call with `getRequirementCTAConfig()` call
   - Use `config.primaryAction` and `config.secondaryAction` instead of `actionButton`
   - Render reject button based on `config.secondaryAction?.type === 'danger'`
   - Map `config.primaryAction.modal` to modal openers:
     - `'quotation'` → open quotation modal (via `onAccept` or new prop)
     - `'mapping'` → open mapping modal (via `onAccept` or new prop)
     - `'reject'` → open reject modal (via `onReject`)
     - `'none'` → direct API call (via `onAccept`)

4. **Update Reject Button Logic**
   - Remove hardcoded conditions
   - Use `config.secondaryAction?.type === 'danger'` to determine visibility
   - Use `config.secondaryAction.modal === 'reject'` to confirm it's a reject action

5. **Handle Action Types**
   - `primaryAction.type === 'primary'` → green button (current style)
   - `primaryAction.type === 'danger'` → red button
   - `secondaryAction.type === 'danger'` → red reject button (X icon)

### Verification Checklist

- [ ] All action buttons render correctly
- [ ] Reject button appears in correct scenarios
- [ ] Primary action button labels match previous behavior
- [ ] Click handlers route to correct modals/actions
- [ ] Visual appearance unchanged (button styles, colors, icons)
- [ ] No console errors
- [ ] Works in all tabs (Draft, Pending, Active, Completed, Delayed, Archived)

### Test Scenarios

1. **Receiver View:**
   - Waiting → Submit Quote button + Reject button
   - Submitted → No buttons (passive wait)
   - Assigned (not mapped) → Map Workspace button
   - Rejected (sender rejected) → Revise Quote button

2. **Sender View:**
   - Waiting → No buttons (passive wait)
   - Submitted → Accept Quote button + Reject button
   - Review → Approve Work button + Reject button
   - Rejected (receiver rejected) → Edit & Resend button

3. **Edge Cases:**
   - Archived requirement → No action buttons
   - Completed requirement → No action buttons
   - Delayed requirement → Status display only

---

## Phase 4.3: Migrate RequirementsPage handleReqAccept

**File:** `src/components/features/requirements/RequirementsPage.tsx`  
**Estimated Time:** 2-3 hours  
**Risk:** Medium (complex routing logic)

### Current State Analysis

**Key Function:** `handleReqAccept(id: number)` - Lines 894-976

**Current Logic:**
- Finds requirement by ID
- Sets `pendingReqId`
- Routes based on `req.type`, `req.isSender`, `req.isReceiver`, `req.rawStatus`
- Opens modals: `setIsQuotationOpen(true)`, `setIsMappingOpen(true)`
- Direct API calls: `updateRequirementMutation.mutate()` with status transitions

**Routing Scenarios:**
1. Receiver + Waiting/Rejected → Quotation modal
2. Receiver + Assigned (not mapped) → Mapping modal
3. Sender + Submitted → Direct API (status: 'Assigned')
4. Sender + Review → Direct API (status: 'Completed')
5. Fallback → Quotation modal

### Implementation Steps

1. **Add Imports**
   ```typescript
   import {
     getRequirementCTAConfig,
     isRequirementStatus,
     type RequirementStatus,
     type UserRole,
   } from '@/lib/workflow';
   ```

2. **Create Helper Function**
   ```typescript
   function mapRequirementToWorkflowParams(req: Requirement): {
     status: RequirementStatus;
     role: UserRole;
     context: RequirementContext;
     type: RequirementType;
   } {
     // Map req to workflow parameters
   }
   ```

3. **Refactor `handleReqAccept`**
   - Get requirement by ID
   - Map to workflow parameters
   - Call `getRequirementCTAConfig()` to get CTA config
   - Route based on `config.primaryAction.modal`:
     ```typescript
     if (config.primaryAction?.modal === 'quotation') {
       setIsQuotationOpen(true);
     } else if (config.primaryAction?.modal === 'mapping') {
       setIsMappingOpen(true);
     } else if (config.primaryAction?.modal === 'none') {
       // Direct API call based on apiAction
       if (config.primaryAction.apiAction === 'accept_quote') {
         updateRequirementMutation.mutate({ status: 'Assigned' });
       } else if (config.primaryAction.apiAction === 'approve_work') {
         updateRequirementMutation.mutate({ status: 'Completed' });
       }
     }
     ```

4. **Remove Nested If/Else Tree**
   - Delete lines 904-971 (old routing logic)
   - Replace with CTA config-based routing

5. **Handle Edge Cases**
   - If no `primaryAction`, show info message
   - If requirement not found, show error

### Verification Checklist

- [ ] All accept flows work correctly
- [ ] Correct modals open for each scenario
- [ ] Direct API calls use correct status transitions
- [ ] Success/error messages display correctly
- [ ] `pendingReqId` is set correctly
- [ ] No broken flows

### Test Scenarios

1. **Receiver Actions:**
   - Click "Submit Quote" (Waiting) → Quotation modal opens
   - Click "Map Workspace" (Assigned, not mapped) → Mapping modal opens
   - Click "Revise Quote" (Rejected) → Quotation modal opens

2. **Sender Actions:**
   - Click "Accept Quote" (Submitted) → Status updates to 'Assigned', success message
   - Click "Approve Work" (Review) → Status updates to 'Completed', success message

3. **Error Cases:**
   - Requirement not found → Error message
   - No action available → Info message

---

## Phase 4.4: Migrate RequirementDetailsPage

**File:** `src/components/features/requirements/RequirementDetailsPage.tsx`  
**Estimated Time:** 1-2 hours  
**Risk:** Low (similar to RequirementCard)

### Current State Analysis

**Key Sections:**
- Lines 554-596: Action button rendering
- Lines 598-620: Reject button rendering
- Uses `getRequirementActionState()` (likely imported from utils)

**Current Logic:**
- Hardcoded button conditions: `actionButton === 'Map'`, `actionButton === 'Submit'`, `actionButton === 'Approve'`
- Reject button: Hardcoded conditions based on `requirement.receiver_company_id` and status

### Implementation Steps

1. **Update Imports**
   ```typescript
   import {
     getRequirementCTAConfig,
     isRequirementStatus,
     type RequirementStatus,
     type UserRole,
   } from '@/lib/workflow';
   ```

2. **Replace Action Button Logic (Lines 554-596)**
   - Get CTA config using `getRequirementCTAConfig()`
   - Render primary action button based on `config.primaryAction`
   - Map `config.primaryAction.modal` to modal openers/API calls
   - Remove hardcoded `actionButton === 'Map'` conditions

3. **Update Reject Button Logic (Lines 598-620)**
   - Use `config.secondaryAction?.type === 'danger'` to determine visibility
   - Remove hardcoded company_id and status checks

4. **Handle Modal Integration**
   - Map `'quotation'` modal → existing quotation flow
   - Map `'mapping'` modal → `setIsAcceptModalOpen(true)` (if that's the mapping modal)
   - Map `'none'` → direct `updateRequirement()` call

### Verification Checklist

- [ ] Action buttons render correctly
- [ ] Reject button appears in correct scenarios
- [ ] Modal opens correctly for each action
- [ ] API calls use correct status transitions
- [ ] No visual regressions

### Test Scenarios

1. **Receiver View:**
   - Waiting → Submit Quote button
   - Assigned (not mapped) → Map Workspace button
   - Rejected → Revise Quote button

2. **Sender View:**
   - Submitted → Accept Quote button + Reject button
   - Review → Approve Work button + Reject button

---

## Phase 4.5: Add Unit Tests

**Files to Create:**
- `src/lib/workflow/__tests__/requirementWorkflow.test.ts`
- `src/lib/workflow/__tests__/requirementCTA.test.ts`
- `src/lib/workflow/__tests__/requirementTab.test.ts`
- `src/lib/workflow/__tests__/statusRollup.test.ts`

**Estimated Time:** 3-4 hours  
**Risk:** Low (additive, doesn't affect production code)

### Test Framework

Use Bun's built-in test runner:
```typescript
import { test, expect } from 'bun:test';
```

### Test Coverage Requirements

#### requirementWorkflow.test.ts

**Test Cases:**
1. **Transition Validation:**
   - Test all valid transitions for SENDER role
   - Test all valid transitions for RECEIVER role
   - Test all valid transitions for INTERNAL role
   - Test invalid transitions return `false`
   - Test `getAllowedTransitions()` returns correct arrays

2. **Edge Cases:**
   - Test transitions from terminal states (Completed)
   - Test transitions to/from blocking states (Impediment, Stuck, Delayed, On_Hold)
   - Test `isRequirementStatus()` type guard

**Example Test:**
```typescript
test('SENDER can transition from Waiting to Submitted', () => {
  expect(isTransitionValid('Waiting', 'Submitted', 'sender')).toBe(true);
});

test('SENDER cannot transition from Waiting to Completed', () => {
  expect(isTransitionValid('Waiting', 'Completed', 'sender')).toBe(false);
});
```

#### requirementCTA.test.ts

**Test Cases:**
1. **All Status × Role Combinations:**
   - Test every status with sender role
   - Test every status with receiver role
   - Test every status with internal role
   - Verify `displayStatus` matches specification
   - Verify `isPending` is correct
   - Verify `tab` is correct
   - Verify `primaryAction` exists when expected
   - Verify `secondaryAction` exists when expected

2. **Context-Dependent CTAs:**
   - Test `isWorkspaceMapped: false` vs `true` for Assigned status
   - Test `isRejectedBySender: true` vs `false` for Rejected status
   - Test `hasQuotedPrice: true` vs `false`

**Example Test:**
```typescript
test('Receiver Waiting status shows Submit Quote action', () => {
  const config = getRequirementCTAConfig(
    'Waiting',
    'receiver',
    { isWorkspaceMapped: false, isRejectedBySender: false, hasQuotedPrice: false }
  );
  
  expect(config.isPending).toBe(true);
  expect(config.displayStatus).toBe('Action Needed: Submit Quote');
  expect(config.primaryAction?.label).toBe('Submit Quote');
  expect(config.primaryAction?.modal).toBe('quotation');
});
```

#### requirementTab.test.ts

**Test Cases:**
1. **Tab Determination:**
   - Test all statuses return correct tabs
   - Test `isArchived: true` → 'archived' tab
   - Test `'draft'` special status → 'draft' tab
   - Test Delayed/On_Hold → 'delayed' tab
   - Test Completed → 'completed' tab
   - Test rejection tab logic (sender vs receiver)

2. **Type Combinations:**
   - Test outsourced requirements
   - Test inhouse requirements
   - Test client requirements

**Example Test:**
```typescript
test('Archived requirement goes to archived tab', () => {
  const tab = getRequirementTab(
    'Assigned',
    'outsourced',
    'sender',
    { isArchived: true }
  );
  expect(tab).toBe('archived');
});
```

#### statusRollup.test.ts

**Test Cases:**
1. **Member Aggregation:**
   - Test priority: Stuck > Impediment > In_Progress > Completed (all) > Review > Delayed > Assigned
   - Test empty array returns 'Assigned'
   - Test single member status

2. **Task Rollup:**
   - Test priority: Revision (any active) > Review (all complete) > In_Progress (any) > Assigned
   - Test empty array returns 'Waiting'
   - Test mixed statuses

**Example Test:**
```typescript
test('Member aggregation prioritizes Stuck over Impediment', () => {
  const members = [
    { status: 'Impediment' },
    { status: 'Stuck' },
    { status: 'In_Progress' },
  ];
  const aggregated = aggregateMemberStatuses(members);
  expect(aggregated).toBe('Stuck');
});
```

### Verification Checklist

- [ ] All tests pass: `bun test`
- [ ] Test coverage > 80% for workflow module
- [ ] Edge cases covered
- [ ] Type guards tested
- [ ] No flaky tests

---

## Final Verification & Cleanup

### Build Verification

```bash
# Frontend
cd alsonotify-new-ui
bun run build

# Check for TypeScript errors
bun run type-check  # if available
```

### Manual QA Checklist

1. **RequirementsPage:**
   - [ ] All tabs filter correctly (Draft, Pending, Active, Completed, Delayed, Archived)
   - [ ] Cards display correct status and actions
   - [ ] Accept button opens correct modal/API call
   - [ ] Reject button opens reject modal
   - [ ] Status transitions work correctly

2. **RequirementCard:**
   - [ ] Action buttons render correctly
   - [ ] Reject button appears when expected
   - [ ] Click handlers work correctly
   - [ ] Visual appearance unchanged

3. **RequirementDetailsPage:**
   - [ ] Action buttons render correctly
   - [ ] Reject button appears when expected
   - [ ] Modals open correctly
   - [ ] API calls succeed

4. **Edge Cases:**
   - [ ] Archived requirements show no actions
   - [ ] Delayed requirements show correct status
   - [ ] Rejection flows work (sender rejects quote, receiver rejects requirement)
   - [ ] Workspace mapping flow works

### Code Quality Checklist

- [ ] No `any` types introduced
- [ ] All functions have JSDoc comments
- [ ] No console.log statements
- [ ] No unused imports
- [ ] Consistent code style
- [ ] Type guards used for status validation

### Documentation Updates

- [ ] Update `workflow-implementation-progress.md` with Sprint 4 completion
- [ ] Add migration notes if needed
- [ ] Document any breaking changes (none expected)

---

## Rollback Strategy

If issues arise during migration:

1. **Phase 4.1-4.2:** Revert `requirementState.utils.ts` and `RequirementCard.tsx` changes. Old code still works.

2. **Phase 4.3:** Revert `RequirementsPage.tsx` `handleReqAccept` function. Old routing logic can be restored.

3. **Phase 4.4:** Revert `RequirementDetailsPage.tsx` changes. Old button logic can be restored.

4. **Phase 4.5:** Tests are additive, no rollback needed.

**Note:** Workflow module remains untouched. It can exist alongside old code indefinitely.

---

## Success Metrics

- ✅ All components work identically to before
- ✅ Code is cleaner (removed duplicate logic)
- ✅ Type safety improved (no `any` types)
- ✅ All tests pass
- ✅ Build succeeds with no errors
- ✅ No visual regressions
- ✅ All manual QA scenarios pass

---

## Next Steps After Sprint 4

1. **Sprint 5 (Optional):** Task component migration (if needed)
2. **Sprint 6 (Optional):** Remove deprecated `requirementState.utils.ts` functions
3. **Sprint 7 (Optional):** Performance optimization (memoization, etc.)

---

*Prepared by: CTO + Project Manager | January 2026*  
*Based on: workflow-refactoring-implementation-plan.md*
