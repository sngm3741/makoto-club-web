import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ReviewDetailContent } from '@/components/reviews/review-detail';
import { fetchReviewById } from '@/lib/reviews';

type ReviewDetailPageProps = {
  params: {
    id: string;
  };
};

export async function generateMetadata({
  params,
}: ReviewDetailPageProps): Promise<Metadata> {
  const review = await fetchReviewById(params.id);

  if (!review) {
    return {
      title: 'レビューが見つかりません',
    };
  }

  return {
    title: `${review.storeName}のレビュー詳細`,
    description: `${review.prefecture} / ${review.visitedAt} に働いた体験談です。平均稼ぎは${review.averageEarning}万円、待機時間は${review.waitTimeHours}時間。`,
  };
}

export default async function ReviewDetailPage({ params }: ReviewDetailPageProps) {
  const review = await fetchReviewById(params.id);

  if (!review) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-12">
      <Link href="/reviews" className="text-sm font-semibold text-pink-600 hover:text-pink-500">
        ← アンケート一覧に戻る
      </Link>
      <ReviewDetailContent review={review} />
    </div>
  );
}
