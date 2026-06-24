import { ReportsDashboard } from '@/components/admin/ReportsDashboard';

export default function AdminReportsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="mt-1 text-sm text-gray-600">
          Revenue, draw performance, and charity contribution insights.
        </p>
      </div>
      <ReportsDashboard />
    </div>
  );
}
