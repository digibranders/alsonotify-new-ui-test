'use client';

import { Suspense } from 'react';
import { CreateInvoicePage } from '../../../../components/features/finance/CreateInvoicePage';

export default function Page() {
  return (
    <Suspense>
      <CreateInvoicePage />
    </Suspense>
  );
}
