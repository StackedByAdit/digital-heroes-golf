import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchEventsForCharity } from '@/lib/charity/server';
import { formatDate } from '@/lib/utils';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CharityProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: charity, error } = await supabase
    .from('charities')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !charity) notFound();

  const events = await fetchEventsForCharity(supabase, id, true);

  return (
    <main className="pb-16">
      <div className="relative h-64 bg-gray-200 sm:h-80">
        {charity.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={charity.image_url}
            alt={charity.name}
            className="h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 container mx-auto px-4 pb-8">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{charity.name}</h1>
        </div>
      </div>

      <div className="container mx-auto grid gap-10 px-4 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">About</h2>
            <p className="mt-3 whitespace-pre-line text-gray-700 leading-relaxed">
              {charity.description}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Upcoming events</h2>
            {events.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No upcoming events scheduled.</p>
            ) : (
              <ol className="mt-4 space-y-4 border-l-2 border-emerald-200 pl-6">
                {events.map((event) => (
                  <li key={event.id} className="relative">
                    <span className="absolute -left-[1.65rem] top-1.5 h-3 w-3 rounded-full bg-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-700">
                      {formatDate(event.event_date)}
                    </p>
                    <p className="font-medium text-gray-900">{event.title}</p>
                    {event.description && (
                      <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Support this charity</h2>
            <p className="mt-2 text-sm text-gray-600">
              Choose this charity when you join Digital Heroes Golf, or update your
              selection anytime from your dashboard.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Link
                href={`/signup?charity=${charity.id}`}
                className="inline-flex justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Sign up & support
              </Link>
              <Link
                href="/dashboard/charity"
                className="inline-flex justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Select in dashboard
              </Link>
            </div>
          </div>

          {charity.website_url && (
            <a
              href={charity.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-emerald-700 hover:bg-gray-100"
            >
              Visit charity website →
            </a>
          )}

          <Link
            href="/charities"
            className="block text-sm text-gray-500 hover:text-gray-800"
          >
            ← Back to all charities
          </Link>
        </aside>
      </div>
    </main>
  );
}
