'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  AGE_OPTIONS,
  AVERAGE_EARNING_OPTIONS,
  PREFECTURES,
  REVIEW_CATEGORIES,
  SPEC_OPTIONS,
  WAIT_TIME_OPTIONS,
} from '@/constants/filters';
import {
  AUTH_UPDATE_EVENT,
  LineLoginResult,
  readStoredAuth,
  startLineLogin,
} from '@/lib/line-auth';

type FormValues = {
  storeName: string;
  prefecture: string;
  category: string;
  visitedAt: string;
  age: number;
  specScore: number;
  waitTimeHours: number;
  averageEarning: number;
};

const LINE_AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_LINE_AUTH_BASE_URL ?? '';
const PENDING_REVIEW_STORAGE_KEY = 'makotoClubPendingReview';

const storePendingReview = (values: FormValues) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PENDING_REVIEW_STORAGE_KEY, JSON.stringify(values));
  } catch (error) {
    console.error('Pending review の保存に失敗しました', error);
  }
};

const readPendingReview = (): FormValues | undefined => {
  if (typeof window === 'undefined') return undefined;
  const raw = sessionStorage.getItem(PENDING_REVIEW_STORAGE_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as FormValues;
  } catch {
    return undefined;
  }
};

const clearPendingReview = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PENDING_REVIEW_STORAGE_KEY);
};

export const ReviewForm = () => {
  const [auth, setAuth] = useState<LineLoginResult | undefined>();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const hasAutoSubmitted = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      storeName: '',
      prefecture: '',
      category: '',
      visitedAt: '',
      age: 20,
      specScore: 100,
      waitTimeHours: 8,
      averageEarning: 10,
    },
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const current = readStoredAuth();
    if (current) {
      setAuth(current);
    }

    const listener: EventListener = (event) => {
      const custom = event as CustomEvent<LineLoginResult>;
      if (!custom.detail) return;
      setAuth(custom.detail);
      setErrorMessage('');
      setStatus('idle');
      hasAutoSubmitted.current = false;
    };

    window.addEventListener(AUTH_UPDATE_EVENT, listener);
    return () => {
      window.removeEventListener(AUTH_UPDATE_EVENT, listener);
    };
  }, []);

  const handleLineLogin = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!LINE_AUTH_BASE_URL) {
      setErrorMessage('LINEログインのエンドポイントが設定されていません。');
      setStatus('error');
      return;
    }

    setAuthLoading(true);
    setErrorMessage('');

    try {
      await startLineLogin(LINE_AUTH_BASE_URL);
      setStatus('idle');
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'LINEログインに失敗しました。時間を置いて再度お試しください。',
      );
      setStatus('error');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const onSubmit = useCallback(
    async (values: FormValues) => {
      if (!auth?.accessToken) {
        storePendingReview(values);
        hasAutoSubmitted.current = false;
        handleLineLogin();
        return;
      }

      setStatus('submitting');
      setErrorMessage('');

      const payload = {
        storeName: values.storeName,
        prefecture: values.prefecture,
        category: values.category,
        visitedAt: values.visitedAt,
        age: values.age,
        specScore: values.specScore,
        waitTimeHours: values.waitTimeHours,
        averageEarning: values.averageEarning,
      };

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

      try {
        if (!apiBase) {
          // API 確定前の仮実装: 成功したふりをしてプレビューできるようにする
          console.info('投稿ペイロード', payload);
          await new Promise((resolve) => setTimeout(resolve, 800));
        } else {
          const response = await fetch(`${apiBase}/api/reviews`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth.accessToken}`,
            },
            body: JSON.stringify(payload),
          });

          const data = await response.json().catch(() => null);
          if (!response.ok) {
            const message =
              data && typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
                ? data.error
                : '投稿に失敗しました。時間を置いて再度お試しください。';
            throw new Error(message);
          }

          if (data && typeof window !== 'undefined') {
            console.info('投稿結果', data);
          }
        }

        setStatus('success');
        reset();
        clearPendingReview();
        hasAutoSubmitted.current = false;
      } catch (error) {
        console.error(error);
        setErrorMessage('投稿に失敗しました。時間を置いて再度お試しください。');
        setStatus('error');
      }
    },
    [auth, reset],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!auth?.accessToken) return;
    if (hasAutoSubmitted.current) return;

    const pending = readPendingReview();
    if (!pending) return;

    hasAutoSubmitted.current = true;
    reset(pending);
    setTimeout(() => {
      void handleSubmit(onSubmit)();
    }, 0);
  }, [auth, handleSubmit, onSubmit, reset]);

  return (
    <section className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">アンケートを投稿する</h1>
        <p className="text-sm text-slate-600">
        LINEで本人確認をした上で、実際に働いた体験をシェアしてください。PayPay1,000円の特典も
        LINEでご案内します。
        </p>
        {!auth?.lineUser ? (
          <button
            type="button"
            onClick={handleLineLogin}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-pink-400 hover:to-violet-400"
            disabled={authLoading}
          >
            {authLoading ? 'LINEで認証中…' : 'LINEでログインして投稿する'}
          </button>
        ) : (
          <div className="inline-flex items-center gap-3 rounded-full bg-pink-50 px-4 py-2 text-sm text-pink-700">
            <span>ログイン中: {auth.lineUser.displayName} さん</span>
          </div>
        )}
      </header>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <Field
          label="店舗名"
          required
          error={errors.storeName?.message}
        >
          <input
            id="storeName"
            type="text"
            placeholder="例: 静岡🚗アンドエッセンス"
            {...register('storeName', { required: '店舗名は必須です' })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
          />
        </Field>

        <Field label="都道府県" required error={errors.prefecture?.message}>
          <select
            id="prefecture"
            {...register('prefecture', { required: '都道府県を選択してください' })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
          >
            <option value="">選択してください</option>
            {PREFECTURES.map((prefecture) => (
              <option key={prefecture} value={prefecture}>
                {prefecture}
              </option>
            ))}
          </select>
        </Field>

        <Field label="業種" required error={errors.category?.message}>
          <select
            id="category"
            {...register('category', { required: '業種を選択してください' })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
          >
            <option value="">選択してください</option>
            {REVIEW_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="働いた時期" required error={errors.visitedAt?.message}>
          <input
            id="visitedAt"
            type="month"
            {...register('visitedAt', { required: '働いた時期を入力してください' })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="年齢" required error={errors.age?.message}>
            <select
              id="age"
              {...register('age', { valueAsNumber: true, required: '年齢を選択してください' })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
            >
              {AGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="スペック" required error={errors.specScore?.message}>
            <select
              id="specScore"
              {...register('specScore', {
                valueAsNumber: true,
                required: 'スペックを選択してください',
              })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
            >
              {SPEC_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="待機時間" required error={errors.waitTimeHours?.message}>
            <select
              id="waitTimeHours"
              {...register('waitTimeHours', {
                valueAsNumber: true,
                required: '待機時間を選択してください',
              })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
            >
              {WAIT_TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="平均稼ぎ" required error={errors.averageEarning?.message}>
            <select
              id="averageEarning"
              {...register('averageEarning', {
                valueAsNumber: true,
                required: '平均稼ぎを選択してください',
              })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
            >
              {AVERAGE_EARNING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
          <p>投稿が完了すると、登録のLINEアカウントに PayPay 1,000円の受け取り方法をお送りします。</p>
          <p>虚偽または第三者の情報が含まれる場合、掲載を停止することがあります。</p>
        </div>

        {status === 'success' ? (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            投稿ありがとうございます！運営チームが内容を確認後、LINEで特典のご案内を送ります。
          </p>
        ) : null}

        {status === 'error' && errorMessage ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
        ) : null}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-pink-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'submitting' ? '送信中...' : 'この内容で投稿する'}
        </button>
      </form>
    </section>
  );
};

type FieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
};

const Field = ({ label, required, children, error }: FieldProps) => {
  return (
    <div className="space-y-1 text-sm">
      <label className="font-semibold text-slate-700">
        {label}
        {required ? <span className="ml-1 text-pink-600">*</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
};
