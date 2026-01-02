'use client';

import { useEffect } from 'react';
import { initCalendarEmptyRowPolyfill } from '@/utils/calendarPolyfill';

/**
 * Client component that initializes browser polyfills.
 * Currently handles the :has() CSS selector fallback for calendar empty rows.
 */
export function BrowserPolyfills() {
  useEffect(() => {
    const cleanup = initCalendarEmptyRowPolyfill();
    return cleanup;
  }, []);

  return null;
}

export default BrowserPolyfills;
