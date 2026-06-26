import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/dashboard/data';
import { getAuthUser } from '@/lib/supabase/cached-auth';
import { AccountSettings } from '@/components/dashboard/AccountSettings';

export default async function AccountPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const profile = await getProfile(user.id);
  if (!profile) redirect('/login');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Account & Billing</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your profile, password, and subscription.
        </p>
      </div>
      <AccountSettings profile={profile} />
    </div>
  );
}
