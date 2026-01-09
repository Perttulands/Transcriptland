import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'transcriptai-hints-dismissed';

// Hook for managing dismissable guided hints with localStorage persistence
export function useGuidedHints() {
    const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set());

    // Load dismissed hints from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setDismissedHints(new Set(parsed));
                }
            }
        } catch (error) {
            console.warn('Failed to load dismissed hints from localStorage:', error);
        }
    }, []);

    // Save dismissed hints to localStorage whenever they change
    const saveDismissedHints = useCallback((hints: Set<string>) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(hints)));
        } catch (error) {
            console.warn('Failed to save dismissed hints to localStorage:', error);
        }
    }, []);

    // Check if a specific hint has been dismissed
    const isDismissed = useCallback((hintId: string): boolean => {
        return dismissedHints.has(hintId);
    }, [dismissedHints]);

    // Dismiss a specific hint
    const dismissHint = useCallback((hintId: string) => {
        setDismissedHints((prev) => {
            const next = new Set(prev);
            next.add(hintId);
            saveDismissedHints(next);
            return next;
        });
    }, [saveDismissedHints]);

    // Reset all dismissed hints (show all hints again)
    const resetHints = useCallback(() => {
        setDismissedHints(new Set());
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.warn('Failed to clear dismissed hints from localStorage:', error);
        }
    }, []);

    return {
        isDismissed,
        dismissHint,
        resetHints,
    };
}
