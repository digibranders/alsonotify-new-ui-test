'use client';

import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';
import { InvoicesPage } from '../../../components/features/invoices/InvoicesPage';

export default function InvoicesPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <InvoicesPage />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
