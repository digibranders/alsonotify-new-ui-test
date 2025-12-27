'use client';

import { Suspense } from 'react';
import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';
import { PartnersPageContent } from '../../../components/features/partners/PartnersPage';

export const dynamic = 'force-dynamic';

export default function PartnersPageRoute() {
    return (
        <AlsonotifyLayoutWrapper>
            <div className="flex-1 overflow-hidden">
                <Suspense fallback={<div className="p-8 text-center text-[#999999]">Loading partners...</div>}>
                    <PartnersPageContent />
                </Suspense>
            </div>
        </AlsonotifyLayoutWrapper>
    );
}
