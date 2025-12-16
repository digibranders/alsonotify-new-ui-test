'use client';

import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';
import { EmployeesPage } from '../../../components/features/employees/EmployeesPage';

export default function EmployeesPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <EmployeesPage />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
