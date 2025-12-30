'use client';

import { Suspense } from 'react';
import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';
import { CalendarPage } from '../../../components/features/calendar/CalendarPage';

export default function CalendarPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div>Loading calendar...</div>}>
          <CalendarPage />
        </Suspense>
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
