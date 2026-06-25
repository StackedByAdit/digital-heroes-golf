'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { hasPlatformAccess } from '@/lib/subscription/access';

type NavAuthState = {
  isAuthenticated: boolean;
  hasDashboardAccess: boolean;
};

export function useNavAuth(
  initialAuthenticated = false,
  initialHasDashboardAccess = false,
): NavAuthState {
  const [state, setState] = useState<NavAuthState>({
    isAuthenticated: initialAuthenticated,
    hasDashboardAccess: initialHasDashboardAccess,
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
        setState({ isAuthenticated: false, hasDashboardAccess: false });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, subscription_status, subscription_ends_at')
        .eq('id', user.id)
        .maybeSingle();

      if (!mounted) return;

      const hasDashboardAccess =
        profile?.role === 'admin' ||
        hasPlatformAccess(
          profile?.subscription_status,
          profile?.subscription_ends_at,
        );

      setState({ isAuthenticated: true, hasDashboardAccess });
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

  return state;
}
