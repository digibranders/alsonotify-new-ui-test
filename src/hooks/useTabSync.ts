import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface UseTabSyncOptions<T extends string> {
    defaultTab: T;
    validTabs: T[];
    paramName?: string;
}

/**
 * Custom hook to sync tab state with URL search parameters.
 * 
 * @param options Configuration options
 * @returns [activeTab, setActiveTab] tuple
 */
export function useTabSync<T extends string>({
    defaultTab,
    validTabs,
    paramName = 'tab'
}: UseTabSyncOptions<T>) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Stabilize validTabs to prevent infinite loops if passed as inline array
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const stableValidTabs = useMemo(() => validTabs, [JSON.stringify(validTabs)]);

    // Initialize state from URL or default
    const [activeTab, setActiveTabState] = useState<T>(() => {
        const tabFromUrl = searchParams.get(paramName);
        return (tabFromUrl && stableValidTabs.includes(tabFromUrl as T))
            ? (tabFromUrl as T)
            : defaultTab;
    });

    // Sync state when URL changes (e.g. back button)
    useEffect(() => {
        const tabFromUrl = searchParams.get(paramName);
        if (tabFromUrl && stableValidTabs.includes(tabFromUrl as T)) {
            // Only update if different to avoid redundant state updates
            if (activeTab !== tabFromUrl) {
                setActiveTabState(tabFromUrl as T);
            }
        } else if (!tabFromUrl && activeTab !== defaultTab) {
            // If strictly syncing, revert to default when param missing
            setActiveTabState(defaultTab);
        }
    }, [searchParams, paramName, stableValidTabs, defaultTab, activeTab]);

    // Handler to update state and URL
    const setActiveTab = useCallback((newTab: T) => {
        // Validation: Bail out if invalid tab
        if (!stableValidTabs.includes(newTab)) {
            console.warn(`Invalid tab requested: ${newTab}`);
            return;
        }

        setActiveTabState(newTab);

        const params = new URLSearchParams(searchParams.toString());

        if (newTab === defaultTab) {
            params.delete(paramName);
        } else {
            params.set(paramName, newTab);
        }

        // Use window.location.pathname to ensure we stay on the same page
        const newPath = `${window.location.pathname}?${params.toString()}`;
        router.push(newPath);
    }, [router, searchParams, paramName, defaultTab, stableValidTabs]);

    return [activeTab, setActiveTab] as const;
}
