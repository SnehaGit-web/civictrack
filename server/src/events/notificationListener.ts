import { eventBus } from './eventBus';
import { db } from '../db/pool';

const statusLabels: Record<string, string> = {
  in_review: 'In Review',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const registerListeners = () => {
  if (process.env.NODE_ENV === 'test') return;

  eventBus.on('status.updated', async (payload) => {
    const label: Record<string, string> = {
      in_review: 'In Review',
      resolved: 'Resolved',
      rejected: 'Rejected',
    };
    const message = payload.adminNote
      ? `Your request status changed to "${label[payload.newStatus] ?? payload.newStatus}". Note: ${payload.adminNote}`
      : `Your request status changed to "${label[payload.newStatus] ?? payload.newStatus}".`;

    try {
      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
        [payload.userId, message]
      );
    } catch (err) {
      console.error('Failed to write notification:', err);
    }
  });

  eventBus.on('request.created', async (payload) => {
    console.log(`[EventBus] New request created: "${payload.title}" by user ${payload.userId}`);
  });

  console.log('✓ Event listeners registered');
};
