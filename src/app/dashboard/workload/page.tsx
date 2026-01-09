'use client';

import React, { Suspense } from 'react';


// Lazy load the WorkloadChartPage
const WorkloadChartPage = React.lazy(() => import('../../../components/features/workload/WorkloadChartPage'));

export default function WorkloadPageRoute() {
  return (

      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div>Loading workload...</div>}>
          <WorkloadChartPage />
        </Suspense>
      </div>

  );
}
