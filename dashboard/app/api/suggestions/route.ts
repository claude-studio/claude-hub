import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ruleSuggestions } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'adopted' | 'dismissed' | null;

    let query = db
      .select()
      .from(ruleSuggestions)
      .orderBy(desc(ruleSuggestions.occurrenceCount), desc(ruleSuggestions.createdAt))
      .$dynamic();

    if (status) {
      query = query.where(eq(ruleSuggestions.status, status));
    }

    const rows = await query;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('GET /api/suggestions error:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}
