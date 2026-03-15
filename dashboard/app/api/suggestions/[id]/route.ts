import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ruleSuggestions } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as { status: 'adopted' | 'dismissed' };
    const { status } = body;

    if (!['adopted', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "adopted" or "dismissed"' },
        { status: 400 }
      );
    }

    const updated = await db
      .update(ruleSuggestions)
      .set({ status })
      .where(eq(ruleSuggestions.id, parseInt(id, 10)))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updated[0] });
  } catch (error) {
    console.error('PUT /api/suggestions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update suggestion' }, { status: 500 });
  }
}
