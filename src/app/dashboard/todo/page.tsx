'use client';

import { Suspense } from 'react';

import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';
import { NotesPage } from '../../../components/features/notes/NotesPage';

export default function NotesPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div>Loading...</div>}>
          <NotesPage />
        </Suspense>
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
