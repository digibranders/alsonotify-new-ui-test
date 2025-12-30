'use client';

import { Suspense } from 'react';

import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';
import { WorkspacePage } from '../../../components/features/workspaces/WorkspacePage';

export default function WorkspacesPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div>Loading workspaces...</div>}>
          <WorkspacePage />
        </Suspense>
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
