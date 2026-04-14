import { generateToken } from '../src/middleware/auth';
import * as jwt from 'jsonwebtoken';

const SECRET = 'civictrack-dev-secret';

describe('generateToken', () => {
  it('generates a valid JWT with correct payload', () => {
    const payload = { id: 'u1', email: 'test@example.com', role: 'citizen' as const };
    const token = generateToken(payload);

    const decoded = jwt.verify(token, SECRET) as typeof payload & { iat: number; exp: number };

    expect(decoded.id).toBe('u1');
    expect(decoded.email).toBe('test@example.com');
    expect(decoded.role).toBe('citizen');
  });

  it('generates a token that expires in 24h', () => {
    const token = generateToken({ id: 'u2', email: 'a@b.com', role: 'admin' });
    const decoded = jwt.decode(token) as { exp: number; iat: number };

    const diffSeconds = decoded.exp - decoded.iat;
    expect(diffSeconds).toBe(60 * 60 * 24);
  });

  it('generates different tokens for different payloads', () => {
    const t1 = generateToken({ id: 'u1', email: 'a@a.com', role: 'citizen' });
    const t2 = generateToken({ id: 'u2', email: 'b@b.com', role: 'admin' });
    expect(t1).not.toBe(t2);
  });

  it('includes role in token payload', () => {
    const adminToken = generateToken({ id: 'u3', email: 'admin@gov.ca', role: 'admin' });
    const decoded = jwt.decode(adminToken) as { role: string };
    expect(decoded.role).toBe('admin');
  });
});

describe('authenticate middleware', () => {
  it('rejects request with no Authorization header', async () => {
    const { authenticate } = await import('../src/middleware/auth');
    const req = { headers: {} } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects request with malformed token', async () => {
    const { authenticate } = await import('../src/middleware/auth');
    const req = { headers: { authorization: 'Bearer badtoken' } } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() with valid token and attaches user to req', async () => {
    const { authenticate, generateToken } = await import('../src/middleware/auth');
    const token = generateToken({ id: 'u1', email: 'test@test.com', role: 'citizen' });

    const req = { headers: { authorization: `Bearer ${token}` } } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe('u1');
    expect(req.user.role).toBe('citizen');
  });
});
