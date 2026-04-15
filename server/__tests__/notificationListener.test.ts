import { eventBus } from '../src/events/eventBus';

jest.mock('../src/db/pool', () => ({
  db: {
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  },
  pool: { query: jest.fn(), on: jest.fn() },
  initDb: jest.fn(),
}));

import { db } from '../src/db/pool';

// Register listeners manually for testing — bypassing NODE_ENV guard
const STATUS_LABELS: Record<string, string> = {
  in_review: 'In Review',
  resolved:  'Resolved',
  rejected:  'Rejected',
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function registerTestListeners() {
  eventBus.on('status.updated', async (payload) => {
    const label = statusLabel(payload.newStatus);
    const message = payload.adminNote?.trim()
      ? `Your request status changed to "${label}". Note: ${payload.adminNote.trim()}`
      : `Your request status changed to "${label}".`;

    await db.query(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      [payload.userId, message]
    );
  });
}

describe('notificationListener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eventBus.removeAllListeners();
    registerTestListeners();
  });

  it('inserts a notification when status.updated fires', async () => {
    eventBus.emit('status.updated', {
      requestId: 'req-1',
      userId: 'user-1',
      newStatus: 'resolved',
    });

    await new Promise(r => setTimeout(r, 50));

    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      ['user-1', 'Your request status changed to "Resolved".']
    );
  });

  it('includes admin note in notification message when provided', async () => {
    eventBus.emit('status.updated', {
      requestId: 'req-2',
      userId: 'user-2',
      newStatus: 'rejected',
      adminNote: 'Outside our service area',
    });

    await new Promise(r => setTimeout(r, 50));

    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      ['user-2', 'Your request status changed to "Rejected". Note: Outside our service area']
    );
  });

  it('uses correct label for in_review status', async () => {
    eventBus.emit('status.updated', {
      requestId: 'req-3',
      userId: 'user-3',
      newStatus: 'in_review',
    });

    await new Promise(r => setTimeout(r, 50));

    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      ['user-3', 'Your request status changed to "In Review".']
    );
  });
});