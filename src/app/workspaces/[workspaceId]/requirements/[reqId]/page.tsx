'use client';

import { AlsonotifyLayoutWrapper } from '../../../../AlsonotifyLayoutWrapper';
import { RequirementDetailsPage } from '../../../../../components/RequirementDetailsPage';

export default function RequirementDetailsPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <RequirementDetailsPage />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
