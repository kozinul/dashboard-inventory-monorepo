/**
 * About page component
 */

import { Card, CardContent } from '@components/common';
import { config } from '@/config';
import styles from './About.module.css';

export function About() {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>About</h1>
                <p className={styles.subtitle}>
                    Learn more about {config.app.name}
                </p>
            </header>

            <Card variant="glass" padding="lg">
                <CardContent>
                    <div className={styles.content}>
                        <h2>Tech Stack</h2>
                        <ul className={styles.list}>
                            <li>⚛️ React 18 with TypeScript</li>
                            <li>⚡ Vite for blazing fast development</li>
                            <li>🐳 Docker DevContainer support</li>
                            <li>📦 npm Workspaces for monorepo</li>
                            <li>🎨 CSS Modules with custom properties</li>
                            <li>🔗 React Router for navigation</li>
                        </ul>

                        <h2>Project Structure</h2>
                        <pre className={styles.code}>
                            {`/apps
  /frontend    # React application
/packages      # Shared packages (future)
.devcontainer  # Docker dev environment`}
                        </pre>

                        <h2>Getting Started</h2>
                        <ol className={styles.list}>
                            <li>Open project in VS Code</li>
                            <li>Click "Reopen in Container" when prompted</li>
                            <li>Run <code>npm run dev</code></li>
                            <li>Visit <code>http://localhost:5173</code></li>
                        </ol>
                    </div>
                </CardContent>
            </Card>

            <p className={styles.version}>
                Version {config.app.version}
            </p>
        </div>
    );
}
