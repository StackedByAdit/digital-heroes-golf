import { WinnersManager } from '@/components/admin/WinnersManager';

export default function AdminWinnersPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Winners</h1>
        <p className="mt-1 text-sm text-gray-600">
          Verify winner proofs and track payout status.
        </p>
      </div>
      <WinnersManager />
    </div>
  );
}
