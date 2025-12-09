'use client';

import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';
import { EmployeeDetailsPage } from '../../../components/details/EmployeeDetailsPage';

export default function EmployeeDetailsPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <EmployeeDetailsPage />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
