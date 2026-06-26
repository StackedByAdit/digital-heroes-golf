'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const WELCOME_TOAST_ID = 'subscription-welcome';
const WELCOME_SESSION_KEY = 'dhg-subscription-welcome-shown';

function stripSubscribedParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('subscribed')) return;
  url.searchParams.delete('subscribed');
  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );
}

export function SubscriptionWelcomeToast() {
  const searchParams = useSearchParams();
  const subscribed = searchParams.get('subscribed');
  const handledRef = useRef(false);

  useEffect(() => {
    if (subscribed !== '1') return;

    stripSubscribedParam();

    if (handledRef.current) return;
    handledRef.current = true;

    if (sessionStorage.getItem(WELCOME_SESSION_KEY) === '1') {
      return;
    }

    sessionStorage.setItem(WELCOME_SESSION_KEY, '1');
    toast.success('Subscription active — welcome to Digital Heroes Golf!', {
      id: WELCOME_TOAST_ID,
    });
  }, [subscribed]);

  return null;
}
