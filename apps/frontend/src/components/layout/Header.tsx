/**
 * Application header component
 */

import { Link } from 'react-router-dom';
import { config } from '@/config';
import styles from './Header.module.css';

export function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link to="/" className={styles.logo}>
                    <span className={styles.logoIcon}>📦</span>
                    <span className={styles.logoText}>{config.app.name}</span>
                </Link>

                <nav className={styles.nav}>
                    <Link to="/" className={styles.navLink}>
                        Home
                    </Link>
                    <Link to="/dashboard" className={styles.navLink}>
                        Dashboard
                    </Link>
                    <Link to="/about" className={styles.navLink}>
                        About
                    </Link>
                </nav>
            </div>
        </header>
    );
}
