'use client';

import { Suspense } from 'react';

import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';
import { InvoicesPage } from '../../../components/features/invoices/InvoicesPage';

export default function InvoicesPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div>Loading invoices...</div>}>
          <InvoicesPage />
        </Suspense>
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
