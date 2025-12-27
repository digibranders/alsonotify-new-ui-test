'use client';

import { AlsonotifyLayoutWrapper } from '../../AlsonotifyLayoutWrapper';
import { PartnersPage } from '../../../components/features/partners/PartnersPage';

export default function PartnersPageRoute() {
    return (
        <AlsonotifyLayoutWrapper>
            <div className="flex-1 overflow-hidden">
                <PartnersPage />
            </div>
        </AlsonotifyLayoutWrapper>
    );
}
