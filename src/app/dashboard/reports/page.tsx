'use client';

import { Suspense } from 'react';

import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';
import { ReportsPage } from '../../../components/features/reports/ReportsPage';

export default function ReportsPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div>Loading reports...</div>}>
          <ReportsPage />
        </Suspense>
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
