'use client';

import { startTransition, useEffect, useState } from 'react';

import {
  LoginResponseMessage,
  LineLoginResult,
  persistAuthResult,
} from '@/lib/line-auth';

type MessageState =
  | {
      variant: 'success';
      text: string;
    }
  | {
      variant: 'error';
      text: string;
    };

const HASH_PREFIX = '#line-login=';

function decodeMessage(encoded: string): LoginResponseMessage | undefined {
  try {
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4;
    const padded =
      padding === 0 ? normalized : normalized + '='.repeat(4 - padding);
    const json = window.atob(padded);
    return JSON.parse(json) as LoginResponseMessage;
  } catch {
    return undefined;
  }
}

function toLineLoginResult(message: LoginResponseMessage): LineLoginResult | undefined {
  if (!message.success) {
    return undefined;
  }
  const payload = message.payload;
  if (!payload?.accessToken || !payload?.lineUser) {
    return undefined;
  }
  return {
    accessToken: payload.accessToken,
    lineUser: payload.lineUser,
  };
}

export const LineLoginHandler = () => {
  const [message, setMessage] = useState<MessageState | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { hash, pathname, search } = window.location;
    if (!hash.startsWith(HASH_PREFIX)) {
      return;
    }

    const encoded = hash.slice(HASH_PREFIX.length);
    window.history.replaceState(null, '', `${pathname}${search}`);

    const parsed = decodeMessage(encoded);
    if (!parsed || parsed.type !== 'line-login-result') {
      startTransition(() =>
        setMessage({
          variant: 'error',
          text: 'LINEログインの応答が不明です。時間を置いて再度お試しください。',
        }),
      );
      return;
    }

    if (parsed.success) {
      const result = toLineLoginResult(parsed);
      if (result) {
        persistAuthResult(result);
      }
      startTransition(() =>
        setMessage({
          variant: 'success',
          text: 'LINEが送られました。確認お願いします。',
        }),
      );
    } else {
      startTransition(() =>
        setMessage({
          variant: 'error',
          text: parsed.error ?? 'LINEログインがキャンセルされました。',
        }),
      );
    }
  }, []);

  if (!message) {
    return null;
  }

  const handleClose = () => setMessage(null);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="space-y-2 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            {message.variant === 'success' ? '連携完了' : 'エラー'}
          </h2>
          <p className="text-sm text-slate-600">{message.text}</p>
        </div>
        <button
          type="button"
          className="mt-6 w-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:from-pink-400 hover:to-violet-400"
          onClick={handleClose}
        >
          OK
        </button>
      </div>
    </div>
  );
};
