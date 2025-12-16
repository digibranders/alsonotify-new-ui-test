'use client';

import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';
import { ClientsPage } from '../../../components/features/clients/ClientsPage';

export default function ClientsPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <ClientsPage />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
