import { AdminReviewDashboard } from '@/components/admin/admin-review-dashboard';

type AdminReviewDetailPageProps = {
  params: {
    id: string;
  };
};

export default function AdminReviewDetailPage({ params }: AdminReviewDetailPageProps) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <AdminReviewDashboard initialSelectedId={params.id} />
    </div>
  );
}
