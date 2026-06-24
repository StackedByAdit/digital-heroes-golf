'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { excerpt as charityExcerpt } from '@/lib/charity/helpers';
import type { Charity } from '@/types';

interface CharitiesDirectoryProps {
  charities: Charity[];
  featuredCharity: Charity | null;
}

export function CharitiesDirectory({
  charities,
  featuredCharity,
}: CharitiesDirectoryProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return charities;
    return charities.filter(
      (charity) =>
        charity.name.toLowerCase().includes(term) ||
        charity.description.toLowerCase().includes(term)
    );
  }, [charities, search]);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 px-6 py-12 text-white sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">
          Play for purpose
        </p>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Your game. Your cause.</h1>
        <p className="mt-4 max-w-2xl text-emerald-50">
          Every subscription supports a charity you choose. Set your contribution
          from 10% upward and make every round count.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Partner charities" value={String(charities.length)} />
          <StatCard label="Minimum gift" value="10%" />
          <StatCard label="Monthly from" value={formatCurrency(1)} />
        </div>
      </section>

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Search charities…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm"
        />
      </div>

      {featuredCharity && !search && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Featured charity
          </h2>
          <Link
            href={`/charities/${featuredCharity.id}`}
            className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="grid md:grid-cols-2">
              <div className="aspect-[16/10] bg-gray-100 md:aspect-auto">
                {featuredCharity.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featuredCharity.image_url}
                    alt={featuredCharity.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full min-h-[220px] items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  Spotlight
                </p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900 group-hover:text-emerald-800">
                  {featuredCharity.name}
                </h3>
                <p className="mt-3 text-gray-600">
                  {charityExcerpt(featuredCharity.description, 220)}
                </p>
                <span className="mt-5 inline-flex text-sm font-semibold text-emerald-700">
                  Learn more →
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">All charities</h2>
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500">No charities match your search.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((charity) => (
              <CharityCard key={charity.id} charity={charity} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-emerald-100">{label}</p>
    </div>
  );
}

function CharityCard({ charity }: { charity: Charity }) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="aspect-video bg-gray-100">
        {charity.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={charity.image_url}
            alt={charity.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No image
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900">{charity.name}</h3>
        <p className="mt-2 text-sm text-gray-600">
          {charityExcerpt(charity.description)}
        </p>
        <Link
          href={`/charities/${charity.id}`}
          className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-900"
        >
          Learn More
        </Link>
      </div>
    </article>
  );
}
