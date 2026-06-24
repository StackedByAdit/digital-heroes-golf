'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CHARITY_CATEGORIES, charityCategoryLabel } from '@/lib/charity/categories';
import { formatCurrency } from '@/lib/utils';
import { excerpt as charityExcerpt } from '@/lib/charity/helpers';
import type { Charity, CharityCategory } from '@/types';

interface CharitiesDirectoryProps {
  charities: Charity[];
  featuredCharity: Charity | null;
}

export function CharitiesDirectory({
  charities,
  featuredCharity,
}: CharitiesDirectoryProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CharityCategory | 'all'>('all');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return charities.filter((charity) => {
      const matchesSearch =
        !term ||
        charity.name.toLowerCase().includes(term) ||
        charity.description.toLowerCase().includes(term);
      const matchesCategory = category === 'all' || charity.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [charities, search, category]);

  const showFeatured = featuredCharity && !search && category === 'all';

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-br from-brand-green to-brand-green/80 px-6 py-12 text-white sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-gold">
          Play for purpose
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">
          Your game. Your cause.
        </h1>
        <p className="mt-4 max-w-2xl text-white/90">
          Every subscription supports a charity you choose. Set your contribution
          from 10% upward — or make a one-off donation anytime.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Partner charities" value={String(charities.length)} />
          <StatCard label="Minimum gift" value="10%" />
          <StatCard label="Monthly from" value={formatCurrency(1)} />
        </div>
        <Link
          href="/donate"
          className="btn-interactive btn-cta mt-8 inline-flex rounded-full bg-brand-gold px-6 py-2.5 text-sm font-semibold text-brand-charcoal hover:bg-brand-gold/90"
        >
          Donate without subscribing
        </Link>
      </section>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search charities…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm"
          />
        </div>
        <select
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as CharityCategory | 'all')
          }
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {CHARITY_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {showFeatured && (
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
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-green">
                  Spotlight · {charityCategoryLabel(featuredCharity.category)}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900 group-hover:text-brand-green">
                  {featuredCharity.name}
                </h3>
                <p className="mt-3 text-gray-600">
                  {charityExcerpt(featuredCharity.description, 220)}
                </p>
                <span className="mt-5 inline-flex text-sm font-semibold text-brand-green">
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
          <p className="text-sm text-gray-500">No charities match your filters.</p>
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
      <p className="text-sm text-white/80">{label}</p>
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
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">
          {charityCategoryLabel(charity.category)}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-gray-900">{charity.name}</h3>
        <p className="mt-2 text-sm text-gray-600">
          {charityExcerpt(charity.description)}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/charities/${charity.id}`}
            className="inline-flex text-sm font-semibold text-brand-green hover:text-brand-green/80"
          >
            Learn more
          </Link>
          <Link
            href={`/donate?charity=${charity.id}`}
            className="inline-flex text-sm font-semibold text-brand-gold hover:underline"
          >
            Donate
          </Link>
        </div>
      </div>
    </article>
  );
}
