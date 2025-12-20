import Link from 'next/link';
import { ReactNode } from 'react';

interface LinkWrapperProps {
    href: string;
    children: ReactNode;
    className?: string;
}

export default function LinkWrapper({ href, children, className = "" }: LinkWrapperProps) {
    return (
        <Link href={href} className={className}>
            {children}
        </Link>
    );
}
