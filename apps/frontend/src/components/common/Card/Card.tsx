/**
 * Card component for content containers
 */

import { type ReactNode } from 'react';
import styles from './Card.module.css';

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
    const classes = [
        styles.card,
        styles[variant],
        styles[`padding-${padding}`],
        className,
    ]
        .filter(Boolean)
        .join(' ');

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
