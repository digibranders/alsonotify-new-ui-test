'use client';

import React, { Suspense } from 'react';
import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';

// Lazy load the WorkloadChartPage
const WorkloadChartPage = React.lazy(() => import('../../../components/features/workload/WorkloadChartPage'));

export default function WorkloadPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div>Loading workload...</div>}>
          <WorkloadChartPage />
        </Suspense>
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
