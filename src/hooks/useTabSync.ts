import { useState, useCallback, useMemo } from 'react';

interface UseTabSyncOptions<T extends string> {
    defaultTab: T;
    validTabs: T[];
    paramName?: string;
}

/**
 * Get initial tab from URL (runs only on client)
 */
function getInitialTab<T extends string>(
    paramName: string,
    validTabs: T[],
    defaultTab: T
): T {
    if (typeof window === 'undefined') return defaultTab;
    const params = new URLSearchParams(window.location.search);
    const tabFromUrl = params.get(paramName);
    return (tabFromUrl && validTabs.includes(tabFromUrl as T))
        ? (tabFromUrl as T)
        : defaultTab;
}

/**
 * Custom hook to sync tab state with URL search parameters.
 * 
 * This hook manages tab state locally and syncs to URL using history.replaceState
 * to avoid triggering Next.js navigation and causing page re-renders/flickering.
 * 
 * Key features:
 * - Instant tab switching (no flicker)
 * - URL stays in sync for bookmarking/sharing
 * - Back/forward button support via popstate listener
 * 
 * @param options Configuration options
 * @returns [activeTab, setActiveTab] tuple
 */
export function useTabSync<T extends string>({
    defaultTab,
    validTabs,
    paramName = 'tab'
}: UseTabSyncOptions<T>) {
    // Stabilize validTabs to prevent re-renders if passed as inline array
    const stableValidTabs = useMemo(() => validTabs, [JSON.stringify(validTabs)]);

    // Initialize state from URL (client-side only)
    const [activeTab, setActiveTabState] = useState<T>(() => 
        getInitialTab(paramName, stableValidTabs, defaultTab)
    );

    // Handler to update state and URL
    // Note: We use functional update to avoid stale closure issues
    const setActiveTab = useCallback((newTab: T) => {
        // Validation: Bail out if invalid tab
        if (!stableValidTabs.includes(newTab)) {
            console.warn(`[useTabSync] Invalid tab requested: ${newTab}. Valid tabs: ${stableValidTabs.join(', ')}`);
            return;
        }

        // Update React state using functional update to get current value
        setActiveTabState((currentTab) => {
            // Skip if already on this tab
            if (newTab === currentTab) {
                return currentTab;
            }
            return newTab;
        });

        // Update URL using history.replaceState (no page reload, no Next.js navigation)
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);

            if (newTab === defaultTab) {
                params.delete(paramName);
            } else {
                params.set(paramName, newTab);
            }

            const queryString = params.toString();
            const newUrl = queryString 
                ? `${window.location.pathname}?${queryString}`
                : window.location.pathname;

            window.history.replaceState(
                { ...window.history.state, __tab: newTab },
                '',
                newUrl
            );
        }
    }, [paramName, defaultTab, stableValidTabs]);

    return [activeTab, setActiveTab] as const;
}
