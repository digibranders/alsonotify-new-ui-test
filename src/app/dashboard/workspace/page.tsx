'use client';

import { Suspense } from 'react';


import { WorkspacePage } from '../../../components/features/workspaces/WorkspacePage';

export default function WorkspacesPageRoute() {
  return (

      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div>Loading workspaces...</div>}>
          <WorkspacePage />
        </Suspense>
      </div>

  );
}
