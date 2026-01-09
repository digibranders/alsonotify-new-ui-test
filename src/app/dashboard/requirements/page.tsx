'use client';

import { Suspense } from 'react';

import { RequirementsPage } from '../../../components/features/requirements/RequirementsPage';

export default function RequirementsPageRoute() {
  return (

      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div className="flex items-center justify-center h-full"><p className="text-[#999999]">Loading...</p></div>}>
          <RequirementsPage />
        </Suspense>
      </div>

  );
}

