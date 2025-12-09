'use client';

import { AlsonotifyLayoutWrapper } from '../AlsonotifyLayoutWrapper';
import { NotesPage } from '../../components/NotesPage';

export default function NotesPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <NotesPage />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
