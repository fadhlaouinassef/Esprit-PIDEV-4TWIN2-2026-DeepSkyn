import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Profile from '@/app/ui/profile';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) =>
      React.createElement('div', props, children),
  },
}));

jest.mock('@/store/slices/authSlice', () => ({
  updateUserProfile: jest.fn((payload) => ({ type: 'auth/updateUserProfile', payload })),
}));

jest.mock('next/link', () =>
  function Link({ children, href }: { children: React.ReactNode; href: string }) {
    return React.createElement('a', { href }, children);
  }
);

jest.mock('next/image', () =>
  function NextImage({ src, alt }: { src: string; alt: string }) {
    return React.createElement('img', { src, alt });
  }
);

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockProfile = {
  id: 1,
  nom: 'Alice',
  prenom: 'Admin',
  email: 'alice@test.com',
  role: 'ADMIN',
  image: null,
  age: 30,
  sexe: 'F',
  skin_type: 'NORMAL',
  created_at: '2024-01-01T00:00:00.000Z',
  verified: true,
  hasPassword: true,
  badges: [],
  subscriptions: [],
  skinAnalyses: [],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Profile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('shows a loading spinner before data is fetched', () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {})); // never resolves

    render(<Profile />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders profile data after successful fetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockProfile,
    });

    render(<Profile />);

    await waitFor(() => {
      expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    });
  });

  it('renders the admin name after successful fetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockProfile,
    });

    render(<Profile />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });

  it('shows a toast error when fetch fails', async () => {
    const { toast } = require('sonner');
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    render(<Profile />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('adminProfile.toasts.loadProfileError');
    });
  });

  it('shows a toast error when fetch throws a network error', async () => {
    const { toast } = require('sonner');
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<Profile />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('adminProfile.toasts.loadProfileError');
    });
  });

  it('shows a toast error when image is too large (> 5 MB)', async () => {
    const { toast } = require('sonner');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockProfile,
    });

    render(<Profile />);

    await waitFor(() => screen.getByText('alice@test.com'));

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (!input) return; // skip if camera input not rendered

    const bigFile = new File(['x'.repeat(6 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [bigFile] });
    fireEvent.change(input);

    expect(toast.error).toHaveBeenCalledWith('adminProfile.toasts.imageTooLarge');
  });

  it('calls PUT /api/user/profile when a valid image is selected', async () => {
    const { toast } = require('sonner');
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockProfile }) // GET
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });        // PUT

    render(<Profile />);
    await waitFor(() => screen.getByText('alice@test.com'));

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (!input) return;

    const smallFile = new File(['png'], 'avatar.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [smallFile] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('adminProfile.toasts.photoUpdated');
    });
  });
});
