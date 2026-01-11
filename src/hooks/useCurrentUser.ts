import { useState, useEffect, useMemo } from 'react';
import { useUserDetails } from './useUser';

// Define a unified User type that covers what's currently being used in the app
// This effectively combines parts of the API response wrapper and the user object
// to handle the messy state of current types
export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role?: string;
  user_profile?: {
    first_name?: string;
    last_name?: string;
    profile_pic?: string;
    designation?: string;
    [key: string]: any;
  };
  company?: {
    name?: string;
    id?: number;
    account_type?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export const useCurrentUser = () => {
  const { data: userDetailsData, isLoading, error } = useUserDetails();
  const [localUser, setLocalUser] = useState<any>(null);

  useEffect(() => {
    // Initial load from local storage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setLocalUser(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse user from local storage", e);
        }
      }
    }
  }, []);

  const user = useMemo(() => {
    // Prefer API data if available
    if (userDetailsData?.result?.user) {
      return userDetailsData.result.user;
    }
    if (userDetailsData?.result && !userDetailsData.result.user) {
      return userDetailsData.result; // Handle flattened response
    }

    // Fallback to local storage
    if (localUser && typeof localUser === 'object') {
       // Handle both { result: { user: ... } } and direct user object styles in localStorage
       // just in case they were stored differently at some point
       if (localUser.result?.user) return localUser.result.user;
       if (localUser.result) return localUser.result;
       return localUser;
    }

    return null;
  }, [userDetailsData, localUser]);

  return {
    user: user as CurrentUser | null,
    isLoading: isLoading && !user, // Only true loading if we don't even have local data
    isAuthenticated: !!user,
    error
  };
};
