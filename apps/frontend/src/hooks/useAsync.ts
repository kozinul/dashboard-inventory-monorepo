/**
 * Custom hook for managing async API calls
 */

import { useState, useCallback } from 'react';
import type { ApiError, FormStatus } from '@/types';

interface UseAsyncState<T> {
    data: T | null;
    status: FormStatus;
    error: ApiError | null;
}

interface UseAsyncReturn<T, Args extends unknown[]> extends UseAsyncState<T> {
    execute: (...args: Args) => Promise<T | null>;
    reset: () => void;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
}

export function useAsync<T, Args extends unknown[] = []>(
    asyncFunction: (...args: Args) => Promise<T>
): UseAsyncReturn<T, Args> {
    const [state, setState] = useState<UseAsyncState<T>>({
        data: null,
        status: 'idle',
        error: null,
    });

    const execute = useCallback(
        async (...args: Args): Promise<T | null> => {
            setState({ data: null, status: 'loading', error: null });

            try {
                const result = await asyncFunction(...args);
                setState({ data: result, status: 'success', error: null });
                return result;
            } catch (error) {
                const apiError = error as ApiError;
                setState({ data: null, status: 'error', error: apiError });
                return null;
            }
        },
        [asyncFunction]
    );

    const reset = useCallback(() => {
        setState({ data: null, status: 'idle', error: null });
    }, []);

    return {
        ...state,
        execute,
        reset,
        isLoading: state.status === 'loading',
        isSuccess: state.status === 'success',
        isError: state.status === 'error',
    };
}
