import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SectionProps {
    children: ReactNode;
    className?: string;
}

export function Section({ children, className }: SectionProps) {
    return (
        <div className={twMerge(clsx("bg-white shadow sm:rounded-lg p-6", className))}>
            {children}
        </div>
    );
}
