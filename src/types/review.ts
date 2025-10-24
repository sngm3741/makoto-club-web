export type ReviewCategory =
  | 'store_health'
  | 'delivery_health'
  | 'soap'
  | 'dc'
  | 'pinsaro';

export interface ReviewSummary {
  id: string;
  storeName: string;
  prefecture: string;
  category: ReviewCategory;
  visitedAt: string;
  age: number;
  specScore: number;
  waitTimeHours: number;
  averageEarning: number;
  createdAt: string;
  helpfulCount?: number;
  excerpt?: string;
}

export interface ReviewDetail extends ReviewSummary {
  description?: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
}

export interface ReviewListResponse {
  items: ReviewSummary[];
  page: number;
  limit: number;
  total: number;
}

export interface StoreSummary {
  id: string;
  storeName: string;
  prefecture: string;
  category: ReviewCategory;
  averageEarning: number;
  waitTimeHours: number;
  reviewCount: number;
}
