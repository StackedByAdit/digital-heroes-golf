import { CharityManager } from '@/components/admin/CharityManager';

export default function AdminCharitiesPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Charity Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Add, edit, feature, and remove partner charities.
        </p>
      </div>
      <CharityManager />
    </div>
  );
}
