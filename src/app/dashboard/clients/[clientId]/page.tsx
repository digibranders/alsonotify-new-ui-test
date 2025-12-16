'use client';

import { AlsonotifyLayoutWrapper } from '../../../AlsonotifyLayoutWrapper';
import { ClientDetailsPage } from '@/components/features/clients/ClientDetailsPage';

export default function ClientDetailsPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <ClientDetailsPage />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
