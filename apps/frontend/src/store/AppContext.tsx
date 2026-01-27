/**
 * Simple state store using React Context
 * For larger apps, consider Zustand or Redux Toolkit
 */

import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { User, Theme } from '@/types';

// State shape
interface AppState {
    user: User | null;
    theme: Theme;
    sidebarOpen: boolean;
    notifications: Notification[];
}

interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: number;
}

// Action types
type AppAction =
    | { type: 'SET_USER'; payload: User | null }
    | { type: 'SET_THEME'; payload: Theme }
    | { type: 'TOGGLE_SIDEBAR' }
    | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp'> }
    | { type: 'REMOVE_NOTIFICATION'; payload: string };

// Initial state
const initialState: AppState = {
    user: null,
    theme: 'system',
    sidebarOpen: true,
    notifications: [],
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, user: action.payload };

        case 'SET_THEME':
            return { ...state, theme: action.payload };

        case 'TOGGLE_SIDEBAR':
            return { ...state, sidebarOpen: !state.sidebarOpen };

        case 'ADD_NOTIFICATION':
            return {
                ...state,
                notifications: [
                    ...state.notifications,
                    {
                        ...action.payload,
                        id: crypto.randomUUID(),
                        timestamp: Date.now(),
                    },
                ],
            };

        case 'REMOVE_NOTIFICATION':
            return {
                ...state,
                notifications: state.notifications.filter((n) => n.id !== action.payload),
            };

        default:
            return state;
    }
}

// Context
interface AppContextValue {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// Provider
interface AppProviderProps {
    children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
}

// Hook
export function useAppState() {
    const context = useContext(AppContext);

    if (context === undefined) {
        throw new Error('useAppState must be used within an AppProvider');
    }

    return context;
}

// Convenience hooks
export function useUser() {
    const { state, dispatch } = useAppState();

    return {
        user: state.user,
        setUser: (user: User | null) => dispatch({ type: 'SET_USER', payload: user }),
    };
}

export function useTheme() {
    const { state, dispatch } = useAppState();

    return {
        theme: state.theme,
        setTheme: (theme: Theme) => dispatch({ type: 'SET_THEME', payload: theme }),
    };
}

export function useSidebar() {
    const { state, dispatch } = useAppState();

    return {
        isOpen: state.sidebarOpen,
        toggle: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    };
}

export function useNotifications() {
    const { state, dispatch } = useAppState();

    return {
        notifications: state.notifications,
        addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) =>
            dispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
        removeNotification: (id: string) =>
            dispatch({ type: 'REMOVE_NOTIFICATION', payload: id }),
    };
}
