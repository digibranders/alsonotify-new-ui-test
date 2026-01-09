'use client';

import { Suspense } from 'react';
import { FinancePage } from '../../../components/features/finance/FinancePage';

export default function FinancePageRoute() {
  return (
    <div className="flex-1 overflow-hidden">
      <Suspense fallback={<div>Loading finance...</div>}>
        <FinancePage />
      </Suspense>
    </div>
  );
}
