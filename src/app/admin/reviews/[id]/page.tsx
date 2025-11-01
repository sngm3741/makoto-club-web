import { notFound } from 'next/navigation';

import { AdminReviewEditor } from '@/components/admin/admin-review-editor';

const API_BASE_URL = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const LOG_PREFIX = '[admin/reviews/[id]]';

const logInfo = (...args: any[]) => {
  console.log(LOG_PREFIX, ...args);
};

const logError = (...args: any[]) => {
  console.error(LOG_PREFIX, ...args);
};

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

type PageProps = {
  params: {
    id?: string;
  };
};

async function fetchReview(id: string): Promise<AdminReview> {
  if (!API_BASE_URL) {
    logError('API_BASE_URL is empty. Ensure Vercel 環境変数が設定されています。', {
      'process.env.API_BASE_URL': process.env.API_BASE_URL,
      'process.env.NEXT_PUBLIC_API_BASE_URL': process.env.NEXT_PUBLIC_API_BASE_URL,
    });
    throw new Error('API_BASE_URL が設定されていません');
  }
  const requestUrl = `${API_BASE_URL}/api/admin/reviews/${id}`;
  logInfo('fetchReview start', { id, requestUrl });
  const response = await fetch(requestUrl, {
    cache: 'no-store',
  });
  logInfo('fetchReview response', { status: response.status, ok: response.ok, redirected: response.redirected });
  if (response.status === 404) {
    logInfo('fetchReview result notFound', { id, requestUrl });
    notFound();
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '<<failed to read body>>');
    logError('fetchReview failed', { id, requestUrl, status: response.status, body });
    throw new Error('レビューの取得に失敗しました');
  }
  const payload = (await response.json()) as AdminReview;
  logInfo('fetchReview success', {
    id,
    status: payload.status,
    rewardStatus: payload.rewardStatus,
    reviewerId: payload.reviewerId,
  });
  return payload;
}

export const dynamic = 'force-dynamic';

export default async function AdminReviewDetailPage({ params }: PageProps) {
  const id = params?.id;
  logInfo('page render start', { params });
  if (!id) {
    logError('params.id is missing. params:', params);
    notFound();
  }

  const review = await fetchReview(id);
  logInfo('page render success', { id });
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <AdminReviewEditor initialReview={review} />
    </div>
  );
}
