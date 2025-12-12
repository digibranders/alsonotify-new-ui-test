'use client';

import { AlsonotifyLayoutWrapper } from '../AlsonotifyLayoutWrapper';
import { ProfilePage } from '@/components/features/profile/ProfilePage';

export default function ProfilePageRoute() {
    return (
        <AlsonotifyLayoutWrapper>
            <div className="flex-1 overflow-hidden">
                <ProfilePage />
            </div>
        </AlsonotifyLayoutWrapper>
    );
}
