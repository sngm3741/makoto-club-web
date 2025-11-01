import { notFound } from 'next/navigation';

import { AdminReviewEditor } from '@/components/admin/admin-review-editor';

const API_BASE_URL = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

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
    throw new Error('API_BASE_URL が設定されていません');
  }
  const response = await fetch(`${API_BASE_URL}/api/admin/reviews/${id}`, {
    cache: 'no-store',
  });
  if (response.status === 404) {
    notFound();
  }
  if (!response.ok) {
    throw new Error('レビューの取得に失敗しました');
  }
  return (await response.json()) as AdminReview;
}

export const dynamic = 'force-dynamic';

export default async function AdminReviewDetailPage({ params }: PageProps) {
  const id = params?.id;
  if (!id) {
    notFound();
  }

  const review = await fetchReview(id);
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <AdminReviewEditor initialReview={review} />
    </div>
  );
}
