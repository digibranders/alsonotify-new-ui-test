'use client';

import { AlsonotifyLayoutWrapper } from '../AlsonotifyLayoutWrapper';
import { SettingsPage } from '@/components/features/settings/SettingsPage';

export default function SettingsPageRoute() {
    return (
        <AlsonotifyLayoutWrapper>
            <div className="flex-1 overflow-hidden">
                <SettingsPage />
            </div>
        </AlsonotifyLayoutWrapper>
    );
}
