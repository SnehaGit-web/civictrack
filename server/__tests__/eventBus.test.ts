import { eventBus } from '../src/events/eventBus';

describe('AppEventBus', () => {
  afterEach(() => {
    eventBus.removeAllListeners();
  });

  it('emits and receives status.updated event', (done) => {
    const payload = {
      requestId: 'req-123',
      userId: 'user-456',
      newStatus: 'resolved' as const,
      adminNote: 'Fixed on site',
    };

    eventBus.on('status.updated', (received) => {
      expect(received.requestId).toBe(payload.requestId);
      expect(received.userId).toBe(payload.userId);
      expect(received.newStatus).toBe('resolved');
      expect(received.adminNote).toBe('Fixed on site');
      done();
    });

    eventBus.emit('status.updated', payload);
  });

  it('emits and receives request.created event', (done) => {
    const payload = {
      requestId: 'req-789',
      userId: 'user-001',
      title: 'Pothole on Main St',
    };

    eventBus.on('request.created', (received) => {
      expect(received.title).toBe('Pothole on Main St');
      done();
    });

    eventBus.emit('request.created', payload);
  });

  it('supports multiple listeners on the same event', () => {
    const results: string[] = [];

    eventBus.on('status.updated', () => results.push('listener-1'));
    eventBus.on('status.updated', () => results.push('listener-2'));

    eventBus.emit('status.updated', {
      requestId: 'r1',
      userId: 'u1',
      newStatus: 'in_review',
    });

    expect(results).toEqual(['listener-1', 'listener-2']);
  });

  it('does not call listener after removeAllListeners', () => {
    const fn = jest.fn();
    eventBus.on('status.updated', fn);
    eventBus.removeAllListeners();

    eventBus.emit('status.updated', {
      requestId: 'r1',
      userId: 'u1',
      newStatus: 'rejected',
    });

    expect(fn).not.toHaveBeenCalled();
  });
});
