/**
 * Card component for content containers
 */

import { type ReactNode } from 'react';
import styles from './Card.module.css';
import { cn } from '@/lib/utils';

interface CardProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'elevated' | 'glass';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
    children,
    className = '',
    variant = 'default',
    padding = 'md',
}: CardProps) {
    const variantStyles = {
        default: 'bg-card border border-slate-200 dark:border-slate-800 shadow-sm',
        elevated: 'bg-card border-none shadow-md',
        glass: 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm',
    };

    const paddingStyles = {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    const classes = cn(
        'rounded-xl text-card-foreground',
        variantStyles[variant],
        paddingStyles[padding],
        className
    );

    return <div className={classes}>{children}</div>;
}

interface CardHeaderProps {
    children: ReactNode;
    className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
    return <div className={`${styles.header} ${className}`}>{children}</div>;
}

interface CardContentProps {
    children: ReactNode;
    className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
    return <div className={`${styles.content} ${className}`}>{children}</div>;
}

interface CardFooterProps {
    children: ReactNode;
    className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
    return <div className={`${styles.footer} ${className}`}>{children}</div>;
}
