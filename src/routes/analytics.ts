import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from '../db';
import { reviews, ruleSuggestions } from '../db/schema';
import { gte, eq, desc } from 'drizzle-orm';
import { detectPatterns, getAnalytics } from '../services/patternDetectionService';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('analyticsRoutes');

// GET /api/analytics — 통계 데이터
router.get('/analytics', async (_req: Request, res: Response) => {
  try {
    const data = await getAnalytics();
    res.json(data);
  } catch (err) {
    logger.error({ err }, 'Analytics fetch failed');
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/reviews — 리뷰 목록
router.get('/reviews', async (req: Request, res: Response) => {
  try {
    const limitParam = typeof req.query['limit'] === 'string' ? req.query['limit'] : '50';
    const limit = Math.min(parseInt(limitParam, 10), 100);
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const rows = await db
      .select()
      .from(reviews)
      .where(gte(reviews.createdAt, since))
      .orderBy(desc(reviews.createdAt))
      .limit(limit);

    res.json(rows);
  } catch (err) {
    logger.error({ err }, 'Reviews fetch failed');
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /api/suggestions — 룰 제안 목록
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const status = req.query['status'] as string | undefined;

    let query = db.select().from(ruleSuggestions).$dynamic();

    if (status && ['pending', 'adopted', 'dismissed'].includes(status)) {
      query = query.where(
        eq(ruleSuggestions.status, status as 'pending' | 'adopted' | 'dismissed')
      );
    }

    const rows = await query.orderBy(desc(ruleSuggestions.createdAt));
    res.json(rows);
  } catch (err) {
    logger.error({ err }, 'Suggestions fetch failed');
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// PUT /api/suggestions/:id — 상태 업데이트
router.put('/suggestions/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params['id'] ?? '', 10);
    const { status } = req.body as { status: string };

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid suggestion ID' });
      return;
    }

    if (!['pending', 'adopted', 'dismissed'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be pending, adopted, or dismissed' });
      return;
    }

    const updated = await db
      .update(ruleSuggestions)
      .set({ status: status as 'pending' | 'adopted' | 'dismissed' })
      .where(eq(ruleSuggestions.id, id))
      .returning();

    if (updated.length === 0) {
      res.status(404).json({ error: 'Suggestion not found' });
      return;
    }

    res.json(updated[0]);
  } catch (err) {
    logger.error({ err }, 'Suggestion update failed');
    res.status(500).json({ error: 'Failed to update suggestion' });
  }
});

// POST /api/patterns/detect — 패턴 감지 트리거 (관리용)
router.post('/patterns/detect', async (_req: Request, res: Response) => {
  try {
    const created = await detectPatterns();
    res.json({ created, message: `Created ${created} new rule suggestions` });
  } catch (err) {
    logger.error({ err }, 'Pattern detection trigger failed');
    res.status(500).json({ error: 'Pattern detection failed' });
  }
});

export default router;
