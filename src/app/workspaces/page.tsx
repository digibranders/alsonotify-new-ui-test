'use client';

import { AlsonotifyLayoutWrapper } from '../AlsonotifyLayoutWrapper';
import { WorkspacePage } from '../../components/features/workspaces/WorkspacePage';

export default function WorkspacesPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <WorkspacePage />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
