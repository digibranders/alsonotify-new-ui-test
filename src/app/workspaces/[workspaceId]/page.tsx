'use client';

import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';
import { WorkspaceDetailsPage } from '../../../components/WorkspaceDetailsPage';

export default function WorkspaceDetailsPageRoute({ params }: { params: { workspaceId: string } }) {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <WorkspaceDetailsPage id={params.workspaceId} />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
