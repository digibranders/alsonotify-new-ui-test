'use client';

import { AlsonotifyLayoutWrapper } from '../AlsonotifyLayoutWrapper';
import { RequirementsPage } from '../../components/features/requirements/RequirementsPage';

export default function RequirementsPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <RequirementsPage />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
