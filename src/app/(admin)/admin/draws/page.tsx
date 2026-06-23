import { DrawAdminPanel } from '@/components/admin/DrawAdminPanel';

export default function AdminDrawsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Draw Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Configure, simulate, and publish monthly draws.
        </p>
      </div>
      <DrawAdminPanel />
    </div>
  );
}
