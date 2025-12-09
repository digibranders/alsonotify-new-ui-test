'use client';

import { AlsonotifyLayoutWrapper } from '../AlsonotifyLayoutWrapper';
import { ReportsPage } from '../../components/ReportsPage';

export default function ReportsPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <ReportsPage />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
