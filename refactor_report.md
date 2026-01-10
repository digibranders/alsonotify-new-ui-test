# Refactor Report: Invoice Generation System, Access Level Fixes, Data Mapping & UI Components

## Objective

1.  Implement a professional "Create Invoice" page and enhance the global application layout with a collapsible sidebar ("Focus Mode").
2.  Fix Access Level assignment issues in the Employees module to ensure robust updates and accurate display of backend roles.
3.  Ensure "Add Employee" defaults to Admin access.
4.  **Fix Data Display Issues:** Correctly save and display "Designation" and "Salary" fields for employees.
5.  **UI Component Hardening:** Fix incorrect usage of Ant Design components and improve form validation logic.

## Changes

### 1. Fix Data Display Issues (Designation & Salary)

-   **Mapper Logic (`src/utils/mappers/user.ts`):**
    -   Explicitly mapped `designation` from `dto.designation`.
    -   Prioritized `salary_yearly` (Annual CTC) over `salary` to ensure the correct annual salary is displayed, fixing the "N/A" or incorrect value issue.
-   **Employees Page (`src/components/features/employees/EmployeesPage.tsx`):**
    -   Updated the data grid mapping to correctly reference `emp.designation` or fallback to `emp.role`.

### 2. Robust Access Level Handling

-   **Dynamic Role Display:**
    -   Updated `src/components/features/employees/EmployeesPage.tsx` to resolve the displayed "Access Level" dynamically from the `roles` list fetched from the backend (Company Settings).
    -   This replaces potentially stale fallback strings with the _actual_ role name (e.g., "Admin", "Manager", "Leads") corresponding to the employee's `role_id`.
-   **Case-Insensitive Resolution:**
    -   Enhanced logic to match role names case-insensitively during updates (`handleSaveEmployee`), ensuring updates succeed even if there are casing discrepancies (e.g., "admin" vs "Admin").
-   **Dynamic Filtering:**
    -   Updated the "Access Level" filter dropdown to populate from the live backend roles list rather than a hardcoded array.

### 3. Default Access

-   **Defaults:** "Add Employee" form (`EmployeesForm.tsx`) now defaults the Access Level to **"Admin"**.

### 4. Global Collapsible Sidebar

-   **Context:** `SidebarContext` manages persistent collapse state (localStorage).
-   **UI:** Updated Sidebar with a toggle button, smooth transitions, and favicon usage when collapsed.
-   **Layout:** Content area dynamically adjusts width.

### 5. Invoice Generation System

-   **Page:** New split-screen Create Invoice page with live client-side PDF preview.
-   **Features:** Auto-population, tax/discount toggles, clean UI.
-   **Bug Fix:** Fixed infinite re-render loop in `CreateInvoicePage`.

### 7. Role Update Reliability

-   **Fix:** Updated `EmployeesPage.tsx` to prioritize the explicit `role_id` from the form data instead of re-calculating it from the Access Level name. This ensures that the exact role selected by the user is sent to the backend, fixing issues where "Admin" selection resulted in "Employee" due to fallback logic.
-   **Mapper Fix:**
    -   Corrected logic to allow `dto.role` to pass through (e.g., "Manager", "Leader") instead of defaulting to "Employee" if not "Admin".
    -   Updated `roleId` mapping to fallback to `dto.user_employee?.role_id` if the root `role_id` is missing (common in list responses). This ensures correct Role Name resolution in the Employee List.
-   **List & Form Hardening:**
    -   **List:** Updated `EmployeesPage` to perform robust loose-equality checks for `roleId` (handling string vs number mismatches) and fallback to case-insensitive name lookup.
    -   **Form:** Updated `EmployeesForm` to prioritize resolving the access role from `initialData.role_id` rather than reusing a potentially stale `initialData.access` string.
-   **Data Mapping Fixes:**
    -   **Working Hours:** Added mapping for `working_hours` object to `rawWorkingHours` in `mapUserDtoToEmployee`. This allows `EmployeeDetailsModal` to correctly display "Start Time - End Time" instead of "N/A".
    -   **Salary:** Extended salary lookup to check `dto.user_employee.salary` and `dto.user_employee.salary_yearly` as fallbacks, ensuring correct value display even if nested.
    -   **Type Safety:** Updated `UserDto` to explicitly include `salary` and `salary_yearly` in the nested `user_employee` object, removing the need for `as any` casts in the mapper.
    -   **Strict Backend Alignment:** Analyzed backend schema (`IUserCreateType`) and enforced strict payload structure in `EmployeesPage.tsx`.
        -   **Mobile Number:** Strictly using `mobile_number` (removed `phone`).
        -   **Salary:** Strictly using `salary_yearly` (removed `salary`).
        -   **Working Hours:** Confirmed object structure `{ start_time, end_time }`.
    -   **Phone Number Parsing:** Improved `EmployeesForm` initialization logic to robustly handle phone numbers with unknown country codes.
    -   **Backend Service Fix:** Identified that `getUsersService` in `alsonotify-backend-new/service/user.service.ts` was not selecting `salary_yearly` in its response. Added `salary_yearly: true` to the `select` block to ensure the data is returned to the frontend.

### 6. Bulk Update & Type Safety

-   **Hardening:** `handleBulkUpdateDepartment` now robustly preserves the existing Access Level (Role) even if casing mismatches occur (case-insensitive fallback).
-   **Type Safety:** Replaced `any` in `EmployeesPage.tsx` with strict types (`CompanyDepartmentType`, `unknown` in catch blocks), improving codebase reliability.

### 8. Select Component & Form Validation Fixes

-   **Ant Design v6 Standardization:**
    -   Aligned `Select` component search configuration with Ant Design v6 standards.
    -   Verified usage of `showSearch={{ filterOption: ... }}` pattern, ensuring compliance with deprecation warnings for top-level `filterOption`.
    -   **Robust Filtering:**
        -   Fixed potential crashes or specific search failures where `option.children` was a complex ReactNode (e.g., Avatars in TaskForm) by prioritizing `option.label` string checks.
        -   Ensured search logic safely handles `null`/`undefined` properties without throwing errors.
    -   **Files Updated:**
        -   `src/app/company-details/page.tsx`
        -   `src/components/features/settings/SettingsPage.tsx` (Enhanced timezone search)
        -   `src/components/modals/WorkspaceForm.tsx`
        -   `src/components/modals/RequirementsForm.tsx`
        -   `src/components/modals/TaskForm.tsx` (Fixed Member search)
        -   `src/app/dashboard/feedback/page.tsx`
-   **Feedback Widget Hardening:**
    -   **Validation:** Updated `FeedbackWidget.tsx` to prevent submission of whitespace-only descriptions.
    -   **Logic:** Added trim checks in `handleSubmit` and updated `Form.Item` rules to include `whitespace: true`.
-   **Display Formatting:**
    -   **Salary:** Added space between currency code (e.g., "USD") and salary amount in `EmployeeDetailsModal` for better readability (Requested by User).
    -   **Sidebar:** Reduced default width from `292px` to `240px` to optimize screen real estate.

## Verification

-   **Typecheck:** Passed (`npm run typecheck`)
-   **Build:** Passed (`npm run build`)
-   **Manual Verification:**
    -   **Selects:** Search functionality now works correctly in all refactored dropdowns (Company Details, Settings, Workspaces, Requirements, Tasks, Feedback).
    -   **Feedback:** Empty/whitespace submissions are now correctly blocked with a validation error.
    -   **Display:** Verified that Employee list displays correct Role Names fetched from backend.
    -   **Update:** validated that changing Access Level successfully updates the user's role.
    -   **Defaults:** "Add Employee" defaults to "Admin".
    -   **Data Integrity:** Validated that Designation and Salary saved in the form are correctly displayed in the list and details view.
    -   **Bulk Operations:** Verified Bulk Access and Bulk Department updates work correctly, preserving other fields.

## Statistics

-   **Files Changed:** 16 (Total across recent sessions)
-   **Build Status:** Success
