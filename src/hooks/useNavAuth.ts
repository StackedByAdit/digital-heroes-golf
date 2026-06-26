'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  dashboardAccessFromNavProfile,
  isAdminProfile,
  NAV_PROFILE_SELECT,
  type NavProfileRow,
} from '@/lib/auth/nav-profile';

type NavAuthState = {
  isAuthenticated: boolean;
  hasDashboardAccess: boolean;
  userName: string | null;
  isAdmin: boolean;
};

export function useNavAuth(
  initialAuthenticated = false,
  initialHasDashboardAccess = false,
  initialUserName: string | null = null,
  initialIsAdmin = false,
): NavAuthState {
  const [state, setState] = useState<NavAuthState>({
    isAuthenticated: initialAuthenticated,
    hasDashboardAccess: initialHasDashboardAccess,
    userName: initialUserName,
    isAdmin: initialIsAdmin,
  });

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function syncAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setState({
          isAuthenticated: false,
          hasDashboardAccess: false,
          userName: null,
          isAdmin: false,
        });
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select(NAV_PROFILE_SELECT)
        .eq('id', user.id)
        .maybeSingle();

      if (!mounted) return;

      if (error || !profile) {
        setState((prev) => ({
          ...prev,
          isAuthenticated: true,
        }));
        return;
      }

      const navProfile = profile as NavProfileRow;

      setState({
        isAuthenticated: true,
        hasDashboardAccess: dashboardAccessFromNavProfile(navProfile),
        userName: navProfile.full_name ?? null,
        isAdmin: isAdminProfile(navProfile),
      });
    }

    syncAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      syncAuth();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    ...state,
    hasDashboardAccess: state.hasDashboardAccess || state.isAdmin,
  };
}
