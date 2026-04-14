import { Router, Request, Response } from 'express';
import { db } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { eventBus } from '../events/eventBus';
import { RequestCategory } from '../types';

const router = Router();

const VALID_CATEGORIES: RequestCategory[] = ['pothole', 'permit', 'noise', 'other'];

// POST /api/requests — citizen submits a new request
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { category, title, description } = req.body;

  if (!title || !category) {
    res.status(400).json({ error: 'title and category are required' });
    return;
  }

  if (!VALID_CATEGORIES.includes(category)) {
    res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
    return;
  }

  try {
    const result = await db.query(
      `INSERT INTO service_requests (user_id, category, title, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user!.id, category, title, description ?? '']
    );

    const newRequest = result.rows[0];

    // Emit event — notify admin listeners
    eventBus.emit('request.created', {
      requestId: newRequest.id,
      userId: req.user!.id,
      title: newRequest.title,
    });

    res.status(201).json(newRequest);
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// GET /api/requests — citizen sees own requests; admin sees all
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    let result;

    if (req.user!.role === 'admin') {
      result = await db.query(
        `SELECT sr.*, u.name as citizen_name, u.email as citizen_email
         FROM service_requests sr
         JOIN users u ON sr.user_id = u.id
         ORDER BY sr.created_at DESC`
      );
    } else {
      result = await db.query(
        `SELECT * FROM service_requests WHERE user_id = $1 ORDER BY created_at DESC`,
        [req.user!.id]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// GET /api/requests/:id — single request (owner or admin)
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query(
      `SELECT sr.*, u.name as citizen_name
       FROM service_requests sr
       JOIN users u ON sr.user_id = u.id
       WHERE sr.id = $1`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    const request = result.rows[0];

    // Citizens can only see their own requests
    if (req.user!.role === 'citizen' && request.user_id !== req.user!.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json(request);
  } catch (err) {
    console.error('Get request error:', err);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

// PATCH /api/requests/:id/status — admin updates status (triggers pub/sub)
router.patch('/:id/status', authenticate, async (req: Request, res: Response): Promise<void> => {
  if (req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Admins only' });
    return;
  }

  const { status, admin_note } = req.body;
  const VALID_STATUSES = ['in_review', 'resolved', 'rejected'];

  if (!status || !VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    return;
  }

  try {
    const result = await db.query(
      `UPDATE service_requests
       SET status = $1, admin_note = $2, updated_at = now()
       WHERE id = $3
       RETURNING *`,
      [status, admin_note ?? null, req.params.id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    const updated = result.rows[0];

    // 🔔 Emit the pub/sub event — triggers notificationListener
    eventBus.emit('status.updated', {
      requestId: updated.id,
      userId: updated.user_id,
      newStatus: updated.status,
      adminNote: admin_note,
    });

    res.json(updated);
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;
