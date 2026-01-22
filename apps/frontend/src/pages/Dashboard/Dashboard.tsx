/**
 * Dashboard page component (placeholder for future development)
 */

import { Card, CardHeader, CardContent } from '@components/common';
import styles from './Dashboard.module.css';

export function Dashboard() {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Dashboard</h1>
                <p className={styles.subtitle}>Overview of your inventory metrics</p>
            </header>

            <div className={styles.statsGrid}>
                <Card variant="glass" padding="lg">
                    <CardContent>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>1,234</span>
                            <span className={styles.statLabel}>Total Items</span>
                        </div>
                    </CardContent>
                </Card>

                <Card variant="glass" padding="lg">
                    <CardContent>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>56</span>
                            <span className={styles.statLabel}>Categories</span>
                        </div>
                    </CardContent>
                </Card>

                <Card variant="glass" padding="lg">
                    <CardContent>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>89%</span>
                            <span className={styles.statLabel}>Stock Level</span>
                        </div>
                    </CardContent>
                </Card>

                <Card variant="glass" padding="lg">
                    <CardContent>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>23</span>
                            <span className={styles.statLabel}>Low Stock Alerts</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card variant="elevated" padding="lg">
                <CardHeader>
                    <h2 className={styles.sectionTitle}>Recent Activity</h2>
                </CardHeader>
                <CardContent>
                    <p className={styles.placeholder}>
                        Connect to backend API to display real-time activity data.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
