'use client';

import { useEffect, useState } from 'react';

import { AUTH_UPDATE_EVENT, TwitterLoginResult, readStoredAuth } from '@/lib/twitter-auth';

export const TwitterLoginStatus = () => {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const current = readStoredAuth();
    if (current?.twitterUser?.username) {
      setUsername(current.twitterUser.username);
    }

    const handler = (event: Event) => {
      const custom = event as CustomEvent<TwitterLoginResult>;
      if (custom.detail?.twitterUser?.username) {
        setUsername(custom.detail.twitterUser.username);
      }
    };

    window.addEventListener(AUTH_UPDATE_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(AUTH_UPDATE_EVENT, handler as EventListener);
    };
  }, []);

  if (!username) {
    return null;
  }

  return (
    <p className="rounded-2xl bg-white/80 px-4 py-3 text-xs text-slate-600">
      アンケート審査中です。審査後に（@{username}）へDMをお送りします。
    </p>
  );
};
