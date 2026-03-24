import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';
import { isPositiveInt } from '@/lib/validation';

/** GET /api/points?userId=123 — fetch loyalty points */
export async function GET(req: NextRequest) {
  try {
    const userIdParam = req.nextUrl.searchParams.get('userId');
    if (!isPositiveInt(userIdParam)) {
      return NextResponse.json({ points: 0, history: [] }, { status: 200 });
    }

    const url = `${API_CONFIG.baseUrl}/wp-json/stp-app/v1/points/${userIdParam}`;
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ points: 0, history: [] });

    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ points: 0, history: [] });
  }
}
