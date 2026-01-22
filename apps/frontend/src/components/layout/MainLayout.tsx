/**
 * Main application layout wrapper
 */

import { type ReactNode } from 'react';
import { Header } from './Header';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className={styles.layout}>
            <Header />
            <main className={styles.main}>
                <div className={styles.container}>
                    {children}
                </div>
            </main>
        </div>
    );
}
