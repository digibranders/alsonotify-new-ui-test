'use client';

import { Suspense } from 'react';


import dynamic from 'next/dynamic';
const ReportsPage = dynamic(() => import('../../../components/features/reports/ReportsPage').then(mod => mod.ReportsPage), {
  loading: () => <div className="flex h-full items-center justify-center">Loading reports...</div>
});

export default function ReportsPageRoute() {
  return (

      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div>Loading reports...</div>}>
          <ReportsPage />
        </Suspense>
      </div>

  );
}
