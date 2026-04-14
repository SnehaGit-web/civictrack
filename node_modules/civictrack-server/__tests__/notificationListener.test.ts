// Mock BEFORE any imports
jest.mock('../src/db/pool', () => ({
  db: {
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  },
  pool: { query: jest.fn(), on: jest.fn(), end: jest.fn() },
  initDb: jest.fn(),
}));

import { eventBus } from '../src/events/eventBus';
import { db } from '../src/db/pool';
import { registerListeners } from '../src/events/notificationListener';

// Uses setImmediate to flush microtasks — no real timers, no hanging
const flushPromises = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('notificationListener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eventBus.removeAllListeners();
    registerListeners();
  });

  afterEach(() => {
    eventBus.removeAllListeners();
  });

  it('inserts a notification when status.updated fires (no admin note)', async () => {
    eventBus.emit('status.updated', {
      requestId: 'req-1',
      userId: 'user-1',
      newStatus: 'resolved',
    });

    await flushPromises();

    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      ['user-1', 'Your request status changed to "Resolved".']
    );
  });

  it('includes admin note in message when provided', async () => {
    eventBus.emit('status.updated', {
      requestId: 'req-2',
      userId: 'user-2',
      newStatus: 'rejected',
      adminNote: 'Outside our service area',
    });

    await flushPromises();

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

    await flushPromises();

    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      ['user-3', 'Your request status changed to "In Review".']
    );
  });
});