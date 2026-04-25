import prisma from '@/lib/prisma';
import {
  updateUser,
  getUserWithRelations,
  verifyUserOtp,
  markUserAsVerified,
} from '@/services/user.service';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $executeRawUnsafe: jest.fn(),
  },
}));

const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockUpdate = prisma.user.update as jest.Mock;

describe('Admin Profile – User Service', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── updateUser ──────────────────────────────────────────────────────────────

  describe('updateUser', () => {
    it('calls prisma.user.update with the correct id and data', async () => {
      const mockUser = { id: 1, nom: 'Alice', email: 'alice@test.com' };
      mockUpdate.mockResolvedValue(mockUser);

      const result = await updateUser(1, { nom: 'Alice' });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { nom: 'Alice' },
      });
      expect(result).toEqual(mockUser);
    });

    it('updates multiple profile fields at once', async () => {
      const data = { nom: 'Bob', prenom: 'Smith', age: 30, sexe: 'M' };
      mockUpdate.mockResolvedValue({ id: 2, email: 'bob@test.com', ...data });

      await updateUser(2, data);

      expect(mockUpdate).toHaveBeenCalledWith({ where: { id: 2 }, data });
    });

    it('updates only the image field', async () => {
      mockUpdate.mockResolvedValue({ id: 3, image: 'data:image/png;base64,abc' });

      await updateUser(3, { image: 'data:image/png;base64,abc' });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { image: 'data:image/png;base64,abc' },
      });
    });

    it('propagates database errors', async () => {
      mockUpdate.mockRejectedValue(new Error('DB error'));

      await expect(updateUser(99, { nom: 'X' })).rejects.toThrow('DB error');
    });
  });

  // ─── getUserWithRelations ─────────────────────────────────────────────────────

  describe('getUserWithRelations', () => {
    it('fetches user with all relations included', async () => {
      const mockUser = {
        id: 1,
        email: 'admin@test.com',
        badges: [],
        subscriptions: [],
        chatbotMessages: [],
        complaints: [],
        routines: [],
        skinAnalyses: [],
        surveyAnswers: [],
      };
      mockFindUnique.mockResolvedValue(mockUser);

      const result = await getUserWithRelations(1);

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          badges: true,
          subscriptions: true,
          chatbotMessages: true,
          complaints: true,
          routines: true,
          skinAnalyses: true,
          surveyAnswers: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('returns null when user does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await getUserWithRelations(999);

      expect(result).toBeNull();
    });
  });

  // ─── verifyUserOtp ────────────────────────────────────────────────────────────

  describe('verifyUserOtp', () => {
    const FUTURE = new Date(Date.now() + 10 * 60 * 1000);
    const PAST   = new Date(Date.now() - 10 * 60 * 1000);

    it('returns false when user is not found', async () => {
      mockFindUnique.mockResolvedValue(null);
      expect(await verifyUserOtp(1, '123456')).toBe(false);
    });

    it('returns false when otp_code is null', async () => {
      mockFindUnique.mockResolvedValue({ id: 1, otp_code: null, otp_expiry: FUTURE });
      expect(await verifyUserOtp(1, '123456')).toBe(false);
    });

    it('returns false when otp_expiry is null', async () => {
      mockFindUnique.mockResolvedValue({ id: 1, otp_code: '123456', otp_expiry: null });
      expect(await verifyUserOtp(1, '123456')).toBe(false);
    });

    it('returns false when OTP code does not match', async () => {
      mockFindUnique.mockResolvedValue({ id: 1, otp_code: '999999', otp_expiry: FUTURE });
      expect(await verifyUserOtp(1, '123456')).toBe(false);
    });

    it('returns false when OTP has expired', async () => {
      mockFindUnique.mockResolvedValue({ id: 1, otp_code: '123456', otp_expiry: PAST });
      expect(await verifyUserOtp(1, '123456')).toBe(false);
    });

    it('returns true when OTP is correct and not expired', async () => {
      mockFindUnique.mockResolvedValue({ id: 1, otp_code: '123456', otp_expiry: FUTURE });
      expect(await verifyUserOtp(1, '123456')).toBe(true);
    });
  });

  // ─── markUserAsVerified ───────────────────────────────────────────────────────

  describe('markUserAsVerified', () => {
    it('sets verified=true and clears otp_code and otp_expiry', async () => {
      const mockResult = { id: 1, verified: true, otp_code: null, otp_expiry: null };
      mockUpdate.mockResolvedValue(mockResult);

      const result = await markUserAsVerified(1);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { verified: true, otp_code: null, otp_expiry: null },
      });
      expect(result.verified).toBe(true);
      expect(result.otp_code).toBeNull();
      expect(result.otp_expiry).toBeNull();
    });
  });
});
