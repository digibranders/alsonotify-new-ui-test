'use client';

import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';
import { LeavesPage } from '../../../components/features/leaves/LeavesPage';

export default function LeavesPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <LeavesPage />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
