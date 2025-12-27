'use client';

import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';
import { PartnersPageContent } from '../../../components/features/partners/PartnersPage';

export const dynamic = 'force-dynamic';

export default function PartnersPageRoute() {
    return (
        <AlsonotifyLayoutWrapper>
            <div className="flex-1 overflow-hidden">
                <PartnersPageContent />
            </div>
        </AlsonotifyLayoutWrapper>
    );
}
