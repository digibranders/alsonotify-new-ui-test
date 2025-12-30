'use client';

import { Suspense } from 'react';

import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';
import { EmployeesPage } from '../../../components/features/employees/EmployeesPage';

export default function EmployeesPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div>Loading employees...</div>}>
          <EmployeesPage />
        </Suspense>
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
