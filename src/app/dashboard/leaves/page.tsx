'use client';

import { Suspense } from 'react';


import { LeavesPage } from '../../../components/features/leaves/LeavesPage';

export default function LeavesPageRoute() {
  return (
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div>Loading leaves...</div>}>
          <LeavesPage />
        </Suspense>
      </div>
  );
}
