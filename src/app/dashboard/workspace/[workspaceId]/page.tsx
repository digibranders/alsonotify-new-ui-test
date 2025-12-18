'use client';

import { AlsonotifyLayoutWrapper } from '../../../AlsonotifyLayoutWrapper';
import { WorkspaceDetailsPage } from '@/components/workspace/ProjectCard';

export default async function WorkspaceDetailsPageRoute({ params }: { params: Promise<{ workspaceId: string }> }) {
  const resolvedParams = await params;

  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <WorkspaceDetailsPage id={resolvedParams.workspaceId} />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
