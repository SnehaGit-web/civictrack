import { eventBus } from './eventBus';
import { db } from '../db/pool';

const STATUS_LABELS: Record<string, string> = {
  in_review: 'In Review',
  resolved:  'Resolved',
  rejected:  'Rejected',
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export const registerListeners = () => {
  if (process.env.NODE_ENV === 'test') return;

  eventBus.on('status.updated', async (payload) => {
    const label = statusLabel(payload.newStatus);
    const message = payload.adminNote?.trim()
      ? `Your request status changed to "${label}". Note: ${payload.adminNote.trim()}`
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

  eventBus.on('request.created', async (payload) => {
    console.log(`[EventBus] New request created: "${payload.title}" by user ${payload.userId}`);
  });

  console.log('✓ Event listeners registered');
};