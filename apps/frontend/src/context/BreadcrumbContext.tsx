import { createContext, useContext, useState, ReactNode } from 'react';

interface BreadcrumbContextType {
    setBreadcrumb: (path: string, label: string) => void;
    getBreadcrumb: (path: string) => string | undefined;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
    const [breadcrumbs, setBreadcrumbs] = useState<Record<string, string>>({});

    const setBreadcrumb = (path: string, label: string) => {
        setBreadcrumbs(prev => {
            if (prev[path] === label) return prev;
            return { ...prev, [path]: label };
        });
    };

    const getBreadcrumb = (path: string) => breadcrumbs[path];

    return (
        <BreadcrumbContext.Provider value={{ setBreadcrumb, getBreadcrumb }}>
            {children}
        </BreadcrumbContext.Provider>
    );
}

export function useBreadcrumb() {
    const context = useContext(BreadcrumbContext);
    if (!context) {
        throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
    }
    return context;
}
