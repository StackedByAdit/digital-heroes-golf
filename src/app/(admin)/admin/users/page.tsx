import { UserManager } from '@/components/admin/UserManager';

export default function AdminUsersPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and edit subscribers, scores, and charity preferences.
        </p>
      </div>
      <UserManager />
    </div>
  );
}
