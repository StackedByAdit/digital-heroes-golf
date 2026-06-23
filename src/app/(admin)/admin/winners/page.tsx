import Link from 'next/link';
import { WinnersManager } from '@/components/admin/WinnersManager';

export default function AdminWinnersPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/admin" className="hover:text-gray-900">
              Admin
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-gray-900">Winners</li>
        </ol>
      </nav>

      <h1 className="mb-6 text-3xl font-bold">Winner Verification & Payouts</h1>
      <WinnersManager />
    </main>
  );
}
