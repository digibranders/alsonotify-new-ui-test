# Refactor Report: Finance Page Redesign

## Objective

Redesign the Finance (Invoice) page to match the visual language and layout of the Reports page, including the use of the Date Range Selector and a specific KPI card layout requested by the user.

## Changes

### 1. Layout & UI

-   **File:** `src/components/features/finance/FinancePage.tsx`
-   **Change:** Replaced the entire component structure to use `PageLayout` with `customFilters` typical of the Reports page.
-   **Detail:**
    -   Integrated `DateRangeSelector` to replace legacy Year/Month dropdowns.
    -   Implemented the requested KPI card layout:
        -   **Card 1:** Combined view of "Amount Invoiced", "Received", and "Due" in a multi-section card.
        -   **Card 2:** "Amount to be Invoiced" (Unbilled).
        -   **Card 3:** "Total Expenses".

### 2. Logic & State

-   **File:** `src/components/features/finance/FinancePage.tsx`
-   **Change:** Switched date handling library.
-   **Old Logic:** `date-fns` for formatting and manual filtering.
-   **New Logic:** `dayjs` with `isBetween` plugin to support the shared `DateRangeSelector` component and streamline date filtering.
-   **Filtering:** Updated filtering logic to respect the selected date range for both Invoices and Requirements.

## Verification

-   **Typecheck:** Passed (`npm run typecheck`)
-   **Build:** Passed (`npm run build`)
-   **Behavior:**
    -   Layout matches Reports page.
    -   KPI cards reflect the new design.
    -   Date filtering works across requirements and invoices.
    -   "Generate Invoice" and "Mark as Paid" flows preserved.

## Statistics

-   **Files Changed:** 1
-   **Any Types Introduced:** 0
-   **Build Status:** Success
