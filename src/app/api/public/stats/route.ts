import { NextResponse } from 'next/server';
import { getPublicStats } from '@/lib/public/stats';

export async function GET() {
  try {
    const stats = await getPublicStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('[public stats GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch public stats' },
      { status: 500 }
    );
  }
}
