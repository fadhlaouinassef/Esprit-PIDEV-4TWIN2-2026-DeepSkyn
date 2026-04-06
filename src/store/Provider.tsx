"use client";

import { Provider } from 'react-redux';
import { store } from './index';
import { ReactNode, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';
import { setSidebarTheme } from './slices/uiThemeSlice';

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
    } catch (error) {
      console.error('Failed to load sidebar theme from localStorage', error);
    } finally {
      hasLoadedFromStorage.current = true;
    }
  }, [dispatch]);

  useEffect(() => {
    if (!hasLoadedFromStorage.current) return;

    try {
      localStorage.setItem(SIDEBAR_THEME_STORAGE_KEY, JSON.stringify(sidebarTheme));
    } catch (error) {
      console.error('Failed to store sidebar theme in localStorage', error);
    }
  }, [sidebarTheme]);

  useEffect(() => {
    const { r, g, b } = hexToRgb(sidebarTheme.color);
    const root = document.documentElement;

    root.style.setProperty('--app-accent', sidebarTheme.color);
    root.style.setProperty('--app-accent-rgb', `${r} ${g} ${b}`);
    root.style.setProperty('--primary', sidebarTheme.color);
    root.style.setProperty('--ring', sidebarTheme.color);
    root.style.setProperty('--sidebar-primary', sidebarTheme.color);
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
