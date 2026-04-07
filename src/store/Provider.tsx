"use client";

import { Provider } from 'react-redux';
import { store } from './index';
import { ReactNode, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';
import { setSidebarTheme, setHighContrastMode } from './slices/uiThemeSlice';

const SIDEBAR_THEME_STORAGE_KEY = 'deepskyn_sidebar_theme';

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return { r: 21, g: 109, b: 149 };

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const clampChannel = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const mixRgb = (
  base: { r: number; g: number; b: number },
  target: { r: number; g: number; b: number },
  weight: number
) => {
  const w = Math.max(0, Math.min(1, weight));
  return {
    r: clampChannel(base.r * (1 - w) + target.r * w),
    g: clampChannel(base.g * (1 - w) + target.g * w),
    b: clampChannel(base.b * (1 - w) + target.b * w),
  };
};

const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) =>
  `#${clampChannel(r).toString(16).padStart(2, '0')}${clampChannel(g).toString(16).padStart(2, '0')}${clampChannel(b)
    .toString(16)
    .padStart(2, '0')}`;

interface HcPalette {
  accent: string;
  soft: string;
  softStrong: string;
  ink: string;
  dark: string;
  light: string;
}

const HC_THEME_PALETTES: Record<string, HcPalette> = {
  'Accessible Blue': {
    accent: '#005FCC',
    soft: '#dbeafe',
    softStrong: '#bfdbfe',
    ink: '#1e3a8a',
    dark: '#1d4ed8',
    light: '#93c5fd',
  },
  'Accessible Green': {
    accent: '#1B5E20',
    soft: '#dcfce7',
    softStrong: '#bbf7d0',
    ink: '#14532d',
    dark: '#166534',
    light: '#86efac',
  },
  'Accessible Rose': {
    accent: '#A61B47',
    soft: '#ffe4ec',
    softStrong: '#fecdd8',
    ink: '#881337',
    dark: '#9f1239',
    light: '#fda4af',
  },
  'Accessible Purple': {
    accent: '#5B2C83',
    soft: '#f3e8ff',
    softStrong: '#e9d5ff',
    ink: '#581c87',
    dark: '#6d28d9',
    light: '#c4b5fd',
  },
};

function ThemeStorageSync() {
  const dispatch = useAppDispatch();
  const sidebarTheme = useAppSelector((state) => state.uiTheme.sidebarTheme);
  const hasLoadedFromStorage = useRef(false);

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(SIDEBAR_THEME_STORAGE_KEY);
      if (storedTheme) {
        dispatch(setSidebarTheme(JSON.parse(storedTheme)));
      }
      // High contrast is now opt-in per session and should only be enabled by explicit click.
      dispatch(setHighContrastMode(false));
    } catch (error) {
      console.error('Failed to load theme state from localStorage', error);
    } finally {
      hasLoadedFromStorage.current = true;
    }
  }, [dispatch]);

  useEffect(() => {
    if (!hasLoadedFromStorage.current) return;

    try {
      localStorage.setItem(SIDEBAR_THEME_STORAGE_KEY, JSON.stringify(sidebarTheme));
    } catch (error) {
      console.error('Failed to store theme state in localStorage', error);
    }
  }, [sidebarTheme]);

  useEffect(() => {
    const { r, g, b } = hexToRgb(sidebarTheme.color);
    const base = { r, g, b };
    const fallbackPalette: HcPalette = {
      accent: sidebarTheme.color,
      soft: rgbToHex(mixRgb(base, { r: 255, g: 255, b: 255 }, 0.86)),
      softStrong: rgbToHex(mixRgb(base, { r: 255, g: 255, b: 255 }, 0.75)),
      ink: rgbToHex(mixRgb(base, { r: 0, g: 0, b: 0 }, 0.48)),
      dark: rgbToHex(mixRgb(base, { r: 0, g: 0, b: 0 }, 0.22)),
      light: rgbToHex(mixRgb(base, { r: 255, g: 255, b: 255 }, 0.25)),
    };
    const palette = HC_THEME_PALETTES[sidebarTheme.name] ?? fallbackPalette;
    const root = document.documentElement;

    root.style.setProperty('--app-accent', sidebarTheme.color);
    root.style.setProperty('--app-accent-rgb', `${r} ${g} ${b}`);
    root.style.setProperty('--primary', sidebarTheme.color);
    root.style.setProperty('--ring', sidebarTheme.color);
    root.style.setProperty('--sidebar-primary', sidebarTheme.color);
    root.style.setProperty('--hc-theme-accent', palette.accent);
    root.style.setProperty('--hc-theme-accent-soft', palette.soft);
    root.style.setProperty('--hc-theme-accent-soft-strong', palette.softStrong);
    root.style.setProperty('--hc-theme-accent-ink', palette.ink);
    root.style.setProperty('--hc-theme-accent-dark', palette.dark);
    root.style.setProperty('--hc-theme-accent-light', palette.light);

  }, [sidebarTheme]);

  return null;
}

export function ReduxProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeStorageSync />
      {children}
    </Provider>
  );
}
