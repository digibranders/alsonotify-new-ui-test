'use client';

import { Suspense } from 'react';

import dynamic from 'next/dynamic';
const CalendarPage = dynamic(() => import('../../../components/features/calendar/CalendarPage').then(mod => mod.CalendarPage), {
  loading: () => <div className="flex h-full items-center justify-center">Loading calendar...</div>
});

export default function CalendarPageRoute() {
  return (

      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div>Loading calendar...</div>}>
          <CalendarPage />
        </Suspense>
      </div>

  );
}
