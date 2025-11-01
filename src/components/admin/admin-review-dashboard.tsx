'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type AdminReview = {
  id: string;
  storeName: string;
  prefecture: string;
  category: string;
  visitedAt: string;
  age: number;
  specScore: number;
  waitTimeHours: number;
  averageEarning: number;
  status: string;
  statusNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  comment?: string;
  rewardStatus: string;
  rewardNote?: string;
  rewardSentAt?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewerHandle?: string;
  createdAt: string;
  updatedAt: string;
};

type StatusOption = 'pending' | 'approved' | 'rejected' | 'all';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
}

const STATUS_LABEL: Record<string, string> = {
  pending: '審査中',
  approved: '掲載OK',
  rejected: '掲載不可',
};

const REWARD_STATUS_LABEL: Record<string, string> = {
  pending: '未処理',
  ready: '送付準備中',
  sent: '送付済み',
};

const statusOptions: { value: StatusOption; label: string }[] = [
  { value: 'pending', label: '審査中' },
  { value: 'approved', label: '掲載OK' },
  { value: 'rejected', label: '掲載不可' },
  { value: 'all', label: 'すべて' },
];

export const AdminReviewDashboard = ({
  initialSelectedId,
}: {
  initialSelectedId?: string;
} = {}) => {
  const [statusFilter, setStatusFilter] = useState<StatusOption>('pending');
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [selected, setSelected] = useState<AdminReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [rewardNote, setRewardNote] = useState('');
  const [reviewedBy, setReviewedBy] = useState('');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
      const response = await fetch(`${API_BASE}/api/admin/reviews${query}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`一覧取得に失敗しました (${response.status})`);
      }
      const data = (await response.json()) as { items: AdminReview[] };
      setReviews(data.items);
      if (data.items.length > 0) {
        setSelected((prev) => {
          const targetId = initialSelectedId ?? prev?.id;
          if (targetId) {
            const next = data.items.find((item) => item.id === targetId);
            if (next) {
              return next;
            }
          }
          if (prev) {
            const next = data.items.find((item) => item.id === prev.id);
            if (next) {
              return next;
            }
          }
          return data.items[0];
        });
      } else {
        setSelected(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '一覧取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, initialSelectedId]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    if (!selected) {
      setStatusNote('');
      setRewardNote('');
      setReviewedBy('');
      return;
    }
    setStatusNote(selected.statusNote ?? '');
    setRewardNote(selected.rewardNote ?? '');
    setReviewedBy(selected.reviewedBy ?? '');
  }, [selected]);

  const handleSelect = useCallback(
    (id: string) => {
      const review = reviews.find((item) => item.id === id) ?? null;
      setSelected(review);
    },
    [reviews],
  );

  const handleUpdate = useCallback(
    async (nextStatus: string, nextRewardStatus?: string) => {
      if (!selected) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE}/api/admin/reviews/${selected.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: nextStatus,
            statusNote,
            reviewedBy,
            rewardStatus: nextRewardStatus,
            rewardNote,
          }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const message =
            payload && typeof payload === 'object' && payload !== null && 'error' in payload
              ? (payload as { error: string }).error
              : `更新に失敗しました (${response.status})`;
          throw new Error(message);
        }
        const updated = (await response.json()) as AdminReview;
        setSelected(updated);
        setReviews((prev) =>
          prev
            .map((item) => (item.id === updated.id ? updated : item))
            .filter((item) => (statusFilter === 'all' ? true : item.status === statusFilter)),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : '更新に失敗しました');
      } finally {
        setLoading(false);
      }
    },
    [selected, statusNote, reviewedBy, rewardNote, statusFilter],
  );

  const statusLabel = useMemo(() => STATUS_LABEL[selected?.status ?? ''] ?? selected?.status ?? '-', [
    selected,
  ]);
  const rewardLabel = useMemo(
    () => REWARD_STATUS_LABEL[selected?.rewardStatus ?? ''] ?? selected?.rewardStatus ?? '-',
    [selected],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">アンケート審査</h1>
          <p className="text-sm text-slate-500">
            審査ステータスと報酬送付状況を管理します。ステータス更新後は自動的にサイトへ反映されます。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusOption)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void fetchReviews()}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow"
            disabled={loading}
          >
            再読み込み
          </button>
        </div>
      </header>

      {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-600">アンケート一覧</h2>
          {loading ? <p className="text-sm text-slate-500">読み込み中…</p> : null}
          {!loading && reviews.length === 0 ? (
            <p className="text-sm text-slate-500">該当するアンケートはありません。</p>
          ) : null}
          <div className="divide-y divide-slate-100 text-sm">
            {reviews.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`grid w-full grid-cols-[1.5fr_1fr_1fr] gap-2 px-3 py-2 text-left transition ${
                  selected?.id === item.id ? 'bg-pink-50 text-pink-700' : 'hover:bg-slate-50'
                }`}
              >
                <span className="font-semibold">{item.storeName}</span>
                <span className="text-xs text-slate-500">{item.prefecture}</span>
                <span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          {selected ? (
            <div className="space-y-4">
              <header className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900">{selected.storeName}</h2>
                <p className="text-sm text-slate-500">
                  {selected.prefecture} / {selected.category} / 訪問 {formatDate(selected.visitedAt)}
                </p>
              </header>

              <div className="grid gap-3 text-sm">
                <DetailRow label="審査ステータス" value={statusLabel} />
                <DetailRow label="審査メモ" value={selected.statusNote || '-'} />
                <DetailRow label="審査担当" value={selected.reviewedBy || '-'} />
                <DetailRow label="審査日時" value={formatDate(selected.reviewedAt)} />
                <DetailRow label="報酬ステータス" value={rewardLabel} />
                <DetailRow label="報酬メモ" value={selected.rewardNote || '-'} />
                <DetailRow label="報酬送付日時" value={formatDate(selected.rewardSentAt)} />
                <DetailRow
                  label="投稿者"
                  value={
                    selected.reviewerHandle
                      ? `@${selected.reviewerHandle} (${selected.reviewerName ?? '匿名'})`
                      : selected.reviewerName ?? '-'
                  }
                />
                <DetailRow label="投稿ID" value={selected.reviewerId || '-'} />
                <DetailRow label="投稿日時" value={formatDate(selected.createdAt)} />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">
                  審査メモ
                  <textarea
                    value={statusNote}
                    onChange={(event) => setStatusNote(event.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
                    placeholder="審査内容や注意点を記録してください"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  審査担当者
                  <input
                    value={reviewedBy}
                    onChange={(event) => setReviewedBy(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
                    placeholder="担当者名（任意）"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  報酬メモ
                  <textarea
                    value={rewardNote}
                    onChange={(event) => setRewardNote(event.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
                    placeholder="送付リンクなどを控えてください"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void handleUpdate('approved', 'ready')}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-400"
                  disabled={loading}
                >
                  掲載OKにする
                </button>
                <button
                  type="button"
                  onClick={() => void handleUpdate('rejected', 'pending')}
                  className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-400"
                  disabled={loading}
                >
                  掲載不可にする
                </button>
                <button
                  type="button"
                  onClick={() => void handleUpdate(selected.status, 'sent')}
                  className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-400"
                  disabled={loading}
                >
                  報酬送付済みにする
                </button>
                <button
                  type="button"
                  onClick={() => void handleUpdate(selected.status, 'pending')}
                  className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                  disabled={loading}
                >
                  報酬ステータスを戻す
                </button>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700">コメント</h3>
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {selected.comment && selected.comment.trim() !== '' ? selected.comment : '—'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">一覧からアンケートを選択してください。</p>
          )}
        </section>
      </div>
    </div>
  );
};

type DetailRowProps = {
  label: string;
  value: string;
};

const DetailRow = ({ label, value }: DetailRowProps) => (
  <div className="flex items-start gap-3 text-sm">
    <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">
      {label}
    </span>
    <span className="text-slate-700">{value}</span>
  </div>
);
