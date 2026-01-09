'use client';

import { Suspense } from 'react';


import { EmployeesPage } from '../../../components/features/employees/EmployeesPage';

export default function EmployeesPageRoute() {
  return (

      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div>Loading employees...</div>}>
          <EmployeesPage />
        </Suspense>
      </div>

  );
}
