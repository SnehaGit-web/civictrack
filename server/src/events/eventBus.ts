import { EventEmitter } from 'events';
import { StatusUpdatedPayload } from '../types';

// Typed event map for full TypeScript safety
interface AppEvents {
  'status.updated': StatusUpdatedPayload;
  'request.created': { requestId: string; userId: string; title: string };
}

class AppEventBus extends EventEmitter {
  emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]): boolean {
    return super.emit(event as string, payload);
  }

  on<K extends keyof AppEvents>(
    event: K,
    listener: (payload: AppEvents[K]) => void
  ): this {
    return super.on(event as string, listener);
  }
}

export const eventBus = new AppEventBus();

// Increase max listeners to avoid warnings in tests
eventBus.setMaxListeners(20);
