'use client';

import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';
import { ReportsPage } from '../../../components/features/reports/ReportsPage';

export default function ReportsPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <ReportsPage />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
