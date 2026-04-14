import { eventBus } from './eventBus';
import { db } from '../db/pool';

const statusLabels: Record<string, string> = {
  in_review: 'In Review',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const registerListeners = () => {
  // Listen for status updates → create a notification row
  eventBus.on('status.updated', async (payload) => {
    const label = statusLabels[payload.newStatus] ?? payload.newStatus;
    const message = payload.adminNote
      ? `Your request status changed to "${label}". Note: ${payload.adminNote}`
      : `Your request status changed to "${label}".`;

    try {
      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
        [payload.userId, message]
      );
    } catch (err) {
      console.error('Failed to write notification:', err);
    }
  });

  // Listen for new requests → notify admins (extensible)
  eventBus.on('request.created', async (payload) => {
    console.log(`[EventBus] New request created: "${payload.title}" by user ${payload.userId}`);
    // In production: notify admin users via push/email
  });

  console.log('✓ Event listeners registered');
};
