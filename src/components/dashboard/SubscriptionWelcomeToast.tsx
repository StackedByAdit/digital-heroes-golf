'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export function SubscriptionWelcomeToast() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get('subscribed') !== '1') return;

    toast.success('Subscription active — welcome to Digital Heroes Golf!');

    const url = new URL(window.location.href);
    url.searchParams.delete('subscribed');
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router, searchParams]);

  return null;
}
