'use client';

import { Suspense } from 'react';

import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';
import { ProfilePage } from '@/components/features/profile/ProfilePage';

export default function ProfilePageRoute() {
    return (
        <AlsonotifyLayoutWrapper>
            <div className="flex-1 overflow-hidden">
                <Suspense fallback={<div>Loading profile...</div>}>
                    <ProfilePage />
                </Suspense>
            </div>
        </AlsonotifyLayoutWrapper>
    );
}
