/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/user/profile/route';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { updateUser } from '@/services/user.service';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }));

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({ authOptions: {} }));

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
  },
}));

jest.mock('@/services/user.service', () => ({
  updateUser: jest.fn(),
  getUserWithRelations: jest.fn(),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockSession = getServerSession as jest.Mock;
const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockUpdateUser = updateUser as jest.Mock;

const makeGetReq = () =>
  new NextRequest('http://localhost/api/user/profile', { method: 'GET' });

const makePutReq = (body: object) =>
  new NextRequest('http://localhost/api/user/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/user/profile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when there is no session', async () => {
    mockSession.mockResolvedValue(null);

    const res = await GET(makeGetReq());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when session has no email', async () => {
    mockSession.mockResolvedValue({ user: {} });

    const res = await GET(makeGetReq());

    expect(res.status).toBe(401);
  });

  it('returns 404 when user does not exist in DB', async () => {
    mockSession.mockResolvedValue({ user: { email: 'ghost@test.com' } });
    mockFindUnique.mockResolvedValue(null);

    const res = await GET(makeGetReq());

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'User not found' });
  });

  it('returns 200 with safe user data (password stripped)', async () => {
    mockSession.mockResolvedValue({ user: { email: 'admin@test.com' } });
    mockFindUnique.mockResolvedValue({
      id: 1,
      email: 'admin@test.com',
      nom: 'Admin',
      prenom: 'Test',
      role: 'ADMIN',
      created_at: new Date('2024-01-01'),
      age: null,
      sexe: null,
      skin_type: null,
      image: null,
      verified: true,
      password: 'hashed_password',
      otp_code: null,
      otp_expiry: null,
      badges: [],
      subscriptions: [],
      skinAnalyses: [],
    });

    const res = await GET(makeGetReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.email).toBe('admin@test.com');
    expect(body.nom).toBe('Admin');
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('otp_code');
    expect(body).not.toHaveProperty('otp_expiry');
    expect(body.hasPassword).toBe(true);
  });

  it('sets hasPassword=false when password is empty', async () => {
    mockSession.mockResolvedValue({ user: { email: 'oauth@test.com' } });
    mockFindUnique.mockResolvedValue({
      id: 2,
      email: 'oauth@test.com',
      nom: 'OAuth',
      prenom: null,
      role: 'USER',
      created_at: new Date(),
      age: null, sexe: null, skin_type: null, image: null,
      verified: true,
      password: '',
      otp_code: null,
      otp_expiry: null,
      badges: [],
      subscriptions: [],
      skinAnalyses: [],
    });

    const res = await GET(makeGetReq());
    const body = await res.json();

    expect(body.hasPassword).toBe(false);
  });

  it('returns 500 on unexpected error', async () => {
    mockSession.mockRejectedValue(new Error('DB crash'));

    const res = await GET(makeGetReq());

    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/user/profile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when there is no session', async () => {
    mockSession.mockResolvedValue(null);

    const res = await PUT(makePutReq({ nom: 'Alice' }));

    expect(res.status).toBe(401);
  });

  it('returns 404 when user does not exist in DB', async () => {
    mockSession.mockResolvedValue({ user: { email: 'ghost@test.com' } });
    mockFindUnique.mockResolvedValue(null);

    const res = await PUT(makePutReq({ nom: 'Alice' }));

    expect(res.status).toBe(404);
  });

  it('returns 200 with updated user data', async () => {
    mockSession.mockResolvedValue({ user: { email: 'admin@test.com' } });
    mockFindUnique.mockResolvedValue({ id: 1, email: 'admin@test.com' });
    mockUpdateUser.mockResolvedValue({
      id: 1,
      nom: 'Alice',
      email: 'admin@test.com',
      image: null,
    });

    const res = await PUT(makePutReq({ nom: 'Alice', prenom: 'Smith', age: '28' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe('Profile updated successfully');
    expect(body.user.nom).toBe('Alice');
  });

  it('parses age as integer', async () => {
    mockSession.mockResolvedValue({ user: { email: 'admin@test.com' } });
    mockFindUnique.mockResolvedValue({ id: 1, email: 'admin@test.com' });
    mockUpdateUser.mockResolvedValue({ id: 1, nom: 'X', email: 'admin@test.com', image: null });

    await PUT(makePutReq({ nom: 'X', age: '35' }));

    expect(mockUpdateUser).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ age: 35 })
    );
  });

  it('sends undefined for age when age is not provided', async () => {
    mockSession.mockResolvedValue({ user: { email: 'admin@test.com' } });
    mockFindUnique.mockResolvedValue({ id: 1, email: 'admin@test.com' });
    mockUpdateUser.mockResolvedValue({ id: 1, nom: 'X', email: 'admin@test.com', image: null });

    await PUT(makePutReq({ nom: 'X' }));

    expect(mockUpdateUser).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ age: undefined })
    );
  });

  it('returns 500 on unexpected error', async () => {
    mockSession.mockRejectedValue(new Error('crash'));

    const res = await PUT(makePutReq({ nom: 'X' }));

    expect(res.status).toBe(500);
  });
});
