import { addMonths, format, startOfMonth } from 'date-fns';
import { calculateCharityContribution } from '@/lib/charity/helpers';
import {
  calculatePrizePools,
  totalMonthlyPoolContribution,
} from '@/lib/drawEngine';
import { resolveRolloverForMonth } from '@/lib/draw/processing';
import { fetchPlatformAccessProfiles } from '@/lib/subscription/subscribers';
import { getMonthKey } from '@/lib/utils';

export type PublicStats = {
  charity_raised_this_month: number;
  prize_pool: number;
  active_players: number;
  next_draw_date: string;
  next_draw_label: string;
};

function defaultPublicStats(): PublicStats {
  const nextDraw = startOfMonth(addMonths(new Date(), 1));
  return {
    charity_raised_this_month: 0,
    prize_pool: 0,
    active_players: 0,
    next_draw_date: nextDraw.toISOString(),
    next_draw_label: format(nextDraw, 'd MMMM yyyy'),
  };
}

export async function getPublicStats(): Promise<PublicStats> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return defaultPublicStats();
  }

  try {
    const currentMonth = getMonthKey();

    const activeProfiles = await fetchPlatformAccessProfiles();

    let charityRaisedThisMonth = 0;
    for (const profile of activeProfiles) {
      if (!profile.charity_id) continue;
      charityRaisedThisMonth += calculateCharityContribution(
        profile.subscription_plan,
        profile.charity_percentage
      );
    }

    const rolloverAmount = await resolveRolloverForMonth(currentMonth);

    const prizePools = calculatePrizePools({
      totalMonthlyPool: totalMonthlyPoolContribution(
        activeProfiles.map((profile) => profile.subscription_plan)
      ),
      rolloverAmount,
    });

    const nextDraw = startOfMonth(addMonths(new Date(), 1));

    return {
      charity_raised_this_month: Math.round(charityRaisedThisMonth * 100) / 100,
      prize_pool:
        Math.round(
          (prizePools.jackpot + prizePools.pool4match + prizePools.pool3match) * 100,
        ) / 100,
      active_players: activeProfiles.length,
      next_draw_date: nextDraw.toISOString(),
      next_draw_label: format(nextDraw, 'd MMMM yyyy'),
    };
  } catch {
    return defaultPublicStats();
  }
}
