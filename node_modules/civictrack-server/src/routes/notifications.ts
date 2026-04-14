import { Router, Request, Response } from 'express';
import { db } from '../db/pool';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/notifications — citizen's notifications (unread first)
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY read ASC, created_at DESC
       LIMIT 50`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await db.query(
      `UPDATE notifications SET read = true
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user!.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await db.query(
      'UPDATE notifications SET read = true WHERE user_id = $1',
      [req.user!.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

export default router;
