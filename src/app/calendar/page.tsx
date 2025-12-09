'use client';

import { AlsonotifyLayoutWrapper } from '../AlsonotifyLayoutWrapper';
import { CalendarPage } from '../../components/CalendarPage';

export default function CalendarPageRoute() {
  return (
    <AlsonotifyLayoutWrapper>
      <div className="flex-1 overflow-hidden">
        <CalendarPage />
      </div>
    </AlsonotifyLayoutWrapper>
  );
}
