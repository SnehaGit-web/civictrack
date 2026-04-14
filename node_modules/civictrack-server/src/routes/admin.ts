import { Router, Request, Response } from 'express';
import { db } from '../db/pool';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/admin/stats — dashboard summary
router.get(
  '/stats',
  authenticate,
  requireRole('admin'),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const [totals, byStatus, byCategory] = await Promise.all([
        db.query('SELECT COUNT(*) as total FROM service_requests'),
        db.query(
          `SELECT status, COUNT(*) as count
           FROM service_requests GROUP BY status`
        ),
        db.query(
          `SELECT category, COUNT(*) as count
           FROM service_requests GROUP BY category`
        ),
      ]);

      res.json({
        total: parseInt(totals.rows[0].total, 10),
        byStatus: byStatus.rows,
        byCategory: byCategory.rows,
      });
    } catch (err) {
      console.error('Stats error:', err);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }
);

// GET /api/admin/users — list all users
router.get(
  '/users',
  authenticate,
  requireRole('admin'),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await db.query(
        'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
);

export default router;
