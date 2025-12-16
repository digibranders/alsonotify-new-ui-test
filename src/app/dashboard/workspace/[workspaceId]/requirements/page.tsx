'use client';

import { AlsonotifyLayoutWrapper } from '../../../../AlsonotifyLayoutWrapper';
import { WorkspaceRequirementsPage } from '@/components/features/workspaces/WorkspaceRequirementsPage';

export default function WorkspaceRequirementsPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <WorkspaceRequirementsPage />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
