/**
 * Home page component
 */

import { Button, Card, CardHeader, CardContent } from '@components/common';
import { config } from '@/config';
import styles from './Home.module.css';

export function Home() {
    return (
        <div className={styles.page}>
            <section className={styles.hero}>
                <h1 className={styles.title}>
                    Welcome to <span className={styles.highlight}>{config.app.name}</span>
                </h1>
                <p className={styles.subtitle}>
                    A modern, scalable inventory management system built with React, TypeScript, and Vite.
                    Ready for Docker DevContainer development.
                </p>
                <div className={styles.actions}>
                    <Button size="lg">Get Started</Button>
                    <Button variant="outline" size="lg">
                        Learn More
                    </Button>
                </div>
            </section>

            <section className={styles.features}>
                <h2 className={styles.sectionTitle}>Features</h2>
                <div className={styles.grid}>
                    <Card variant="glass" padding="lg">
                        <CardHeader>
                            <h3 className={styles.cardTitle}>⚡ Fast Development</h3>
                        </CardHeader>
                        <CardContent>
                            <p>Hot reload in Docker with Vite. Make changes and see them instantly.</p>
                        </CardContent>
                    </Card>

                    <Card variant="glass" padding="lg">
                        <CardHeader>
                            <h3 className={styles.cardTitle}>🔒 Type Safety</h3>
                        </CardHeader>
                        <CardContent>
                            <p>Full TypeScript support with strict mode for better code quality.</p>
                        </CardContent>
                    </Card>

                    <Card variant="glass" padding="lg">
                        <CardHeader>
                            <h3 className={styles.cardTitle}>📦 Monorepo Ready</h3>
                        </CardHeader>
                        <CardContent>
                            <p>Structured for scaling with backend services and shared packages.</p>
                        </CardContent>
                    </Card>

                    <Card variant="glass" padding="lg">
                        <CardHeader>
                            <h3 className={styles.cardTitle}>🎨 Beautiful UI</h3>
                        </CardHeader>
                        <CardContent>
                            <p>Modern design with CSS custom properties and component-based architecture.</p>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}
