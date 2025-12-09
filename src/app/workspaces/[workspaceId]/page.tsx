'use client';

import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';
import { WorkspaceDetailsPage } from '../../../components/WorkspaceDetailsPage';

export default function WorkspaceDetailsPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <WorkspaceDetailsPage />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
