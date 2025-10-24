import Link from 'next/link';

import type { ReviewSummary } from '@/types/review';

type ReviewCardProps = {
  review: ReviewSummary;
};

export const ReviewCard = ({ review }: ReviewCardProps) => {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="rounded-full bg-pink-50 px-3 py-1 text-pink-600">{review.prefecture}</span>
        <time dateTime={review.createdAt}>{review.createdAt}</time>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{review.storeName}</h3>
        <p className="mt-1 text-sm text-slate-500">
          訪問時期: {review.visitedAt} / 業種: {translateCategory(review.category)}
        </p>
      </div>
      {review.excerpt ? (
        <p className="text-sm text-slate-600">{review.excerpt}</p>
      ) : (
        <p className="text-sm text-slate-500">詳しいレビューは詳細ページでチェック！</p>
      )}
      <dl className="grid grid-cols-2 gap-3 text-xs text-slate-500">
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="font-medium text-slate-700">平均稼ぎ</dt>
          <dd className="mt-1 text-lg font-semibold text-pink-600">{review.averageEarning}万円</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="font-medium text-slate-700">待機時間</dt>
          <dd className="mt-1 text-lg font-semibold text-slate-800">{review.waitTimeHours}時間</dd>
        </div>
      </dl>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>年齢: {review.age}歳 / スペック: {review.specScore}</span>
        {typeof review.helpfulCount === 'number' && (
          <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-600">
            役に立った {review.helpfulCount}
          </span>
        )}
      </div>
      <Link
        href={`/reviews/${review.id}`}
        className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-pink-600 hover:text-pink-500"
      >
        レビュー詳細へ
        <span aria-hidden>→</span>
      </Link>
    </article>
  );
};

const CATEGORY_LABEL_MAP: Record<string, string> = {
  store_health: '店舗型ヘルス',
  delivery_health: '出張型ヘルス',
  soap: 'ソープ',
  dc: 'デリヘル (DC)',
  pinsaro: 'ピンサロ',
};

const translateCategory = (category: string) =>
  CATEGORY_LABEL_MAP[category] ?? category;
