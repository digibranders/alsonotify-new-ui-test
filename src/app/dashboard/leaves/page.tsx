'use client';

import { Suspense } from 'react';

import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';
import { LeavesPage } from '../../../components/features/leaves/LeavesPage';

export default function LeavesPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div>Loading leaves...</div>}>
          <LeavesPage />
        </Suspense>
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
