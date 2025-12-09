'use client';

import { AlsonotifyLayoutWrapper } from '../AlsonotifyLayoutWrapper';
import { WorkloadChartPage } from '../../components/WorkloadChartPage';

export default function WorkloadPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <WorkloadChartPage />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
