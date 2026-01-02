/**
 * Calendar Empty Row Polyfill
 * 
 * This utility adds the .calendar-empty-row class to the 6th row of Ant Design
 * calendar pickers when it doesn't contain any current-month days.
 * 
 * This is a fallback for browsers that don't support the CSS :has() selector.
 * Modern browsers use the native CSS :has() via @supports in globals.css.
 */

const supportsHasSelector = (): boolean => {
  try {
    return CSS.supports('selector(:has(*))');
  } catch {
    return false;
  }
};

/**
 * Checks if a table row contains any cells with the .ant-picker-cell-in-view class.
 * If not, adds the .calendar-empty-row class to hide it.
 */
const processCalendarRow = (row: HTMLTableRowElement): void => {
  const hasVisibleCell = row.querySelector('.ant-picker-cell-in-view') !== null;
  if (!hasVisibleCell) {
    row.classList.add('calendar-empty-row');
  } else {
    row.classList.remove('calendar-empty-row');
  }
};

/**
 * Finds all 6th rows in calendar picker tables and processes them.
 */
const processAllCalendarRows = (): void => {
  const sixthRows = document.querySelectorAll<HTMLTableRowElement>(
    '.ant-picker-content tbody tr:nth-child(6)'
  );
  sixthRows.forEach(processCalendarRow);
};

/**
 * Initializes the calendar empty row polyfill.
 * Only runs for browsers that don't support the :has() selector.
 */
export const initCalendarEmptyRowPolyfill = (): (() => void) | undefined => {
  // Skip if browser supports :has() - CSS handles it natively
  if (supportsHasSelector()) {
    return undefined;
  }

  // Process existing rows on page
  processAllCalendarRows();

  // Set up MutationObserver to handle dynamically added calendars
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if any added nodes might be calendar-related
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            if (
              node.classList?.contains('ant-picker-dropdown') ||
              node.querySelector?.('.ant-picker-content')
            ) {
              shouldProcess = true;
              break;
            }
          }
        }
      }
      if (shouldProcess) break;
    }

    if (shouldProcess) {
      // Debounce: wait a tick for DOM to settle
      requestAnimationFrame(processAllCalendarRows);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Return cleanup function
  return () => observer.disconnect();
};

export default initCalendarEmptyRowPolyfill;
