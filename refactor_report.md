# Refactor Report: Employee KPI Calculation Update

## Objective

1.  **Refine Employee KPIs:** Switch Employee KPI calculations from server-side pre-aggregation to robust client-side aggregation (for Filters) AND refactor Backend Revenue logic (for Accuracy).
2.  **Filter Awareness:** Ensure KPI cards (Investment, Revenue, Profit, Rate/Hr) dynamically update based on active filters (Search, Department, etc.) to match the visible table data.
3.  **Revenue Accuracy:** Implement "Pro-rated Fixed Price" revenue recognition instead of simple "Time & Materials".

## Changes

### 1. Backend Service (`report.service.ts`) - [New]

-   **Old Logic:** `Revenue = Engaged Hours * Hourly Rate`. (Removed).
-   **New Logic:**
    -   **Formula:** `Revenue = (Quoted Price / Total Duration) * Overlap Duration * (Member Share of Work)`.
    -   **Time Awareness:** Explicitly calculates the intersection of the Requirement timeframe and the User's selected Date Range.
    -   **Attribution:** Distributes the recognized revenue to employees based on their logged hours percentage.
    -   **Fallback:** If no quoted price/dates, falls back to `Hourly Rate`.
-   **Verification:** `npm run build` passed.

### 2. Reports Page (`ReportsPage.tsx`)

-   **Logic Update:** Implemented a `useMemo` hook to calculate Employee KPIs directly from the `filteredEmployees` list.
-   **Calculations:**
    -   **Total Investment:** Sum of `(engagedHrs * hourlyCost)`.
    -   **Total Revenue:** Sum of `revenue` (which now comes from the improved Backend logic).
    -   **Net Profit:** `Total Revenue - Total Investment`.
    -   **Avg. Rate/Hr:** `Total Revenue / Total Engaged Hours`.
-   **UI:** Updated rendering to use client-side calculated values.

### 3. Documentation

-   **Updated `KPI calculations.html`:** Documented the client-side aggregation methodology.

## Current System State

-   **Reports Module:** Hybrid robust implementation. Backend provides accurate "Attributed Revenue" per employee. Frontend aggregates these values dynamically based on filters.
-   **Build Status:** Both Frontend and Backend builds passed.

## Verification

-   **Automated:**
    -   Frontend `npm run typecheck` & `build`: Passed.
    -   Backend `npm run build`: Passed.
-   **Logic Check:**
    -   Pro-rated logic correctly handles date overlaps.
    -   Client-side aggregation correctly handles search/filters.

## Statistics

-   **Files Changed:**
    -   `alsonotify-backend-new/service/report.service.ts`
    -   `alsonotify-new-ui/src/components/features/reports/ReportsPage.tsx`
    -   `KPI calculations.html`
-   **Bug Fixes:**
    -   Fixed deprecated `width` prop warning in `ReportsPage.tsx` Drawer.
    -   Updated Drawer width to `50%` for responsiveness.
-   **Type Safety:**
    -   Removed `any` cast in `report.service.ts` by including `role` relation in Prisma query.
-   **Logic Update:**
    -   Employee Cost Calculation now dynamically determines "Annual Working Days" based on Company/Profile working hours (e.g., 6-day work weeks) instead of static 260.
-   **UI Fix:**
    -   Updated `ReportsPage.tsx` "Investment" column to display **Total Investment** (`Cost * Hours`) instead of just `Hourly Rate`.
    -   Renamed "Delayed but Completed" KPI card to **In Progress** and wired it to real backend `inProgress` count.
    -   Added **Delayed** KPI card (Active Late + Completed Late).
    -   Updated KPI Grid to **5 columns** (Req/Task) and **4 columns** (Employee) to display cards optimally without gaps.
-   **Build Status:** Success

---

## Update: Documenting Report Calculations

**Timestamp:** 2026-01-10T16:25:10+05:30

### Objective

Update external documentation to reflect the calculation logic for all Tabs in the Reports module (Requirements, Tasks, Employees).

### Changes

-   **Modified:** `Employee_Report_Calculations.html`
    -   Renamed title to "Reports Module Calculations".
    -   Added detailed calculation formulas for **Requirements Tab** (Utilization, Revenue, KPIs).
    -   Added detailed calculation formulas for **Tasks Tab** (Extra Hours, KPIs).
    -   Refined **Employees Tab** details including Drawer efficiency stats.

### Verification

-   **Manual Check:** Verified HTML content against `ReportsPage.tsx` logic.
-   **Build:** N/A (Documentation only).
