"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { SIDEBAR_THEMES, setSidebarTheme } from "@/store/slices/uiThemeSlice";
import { useHydrated } from "@/hooks/use-hydrated";
import { useTranslations } from "next-intl";

interface ThemePickerProps {
  isCollapsed?: boolean;
}

export function ThemePicker({ isCollapsed }: ThemePickerProps) {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector((state) => state.uiTheme.sidebarTheme);
  const hydrated = useHydrated();
  const appliedTheme = hydrated ? currentTheme : SIDEBAR_THEMES[0];

  return (
    <div
      className={cn(
        "flex min-h-24 flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 transition-all duration-200 dark:border-gray-700 dark:bg-gray-900/60",
        isCollapsed ? "items-center" : "items-start"
      )}
    >
      {!isCollapsed && (
        <span className="px-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {t('components.themePicker.title')}
        </span>
      )}

      <div className={cn("flex flex-wrap items-center gap-3", isCollapsed && "flex-col")}> 
        {SIDEBAR_THEMES.map((theme) => {
          const isActive = appliedTheme.name === theme.name;
          return (
            <button
              key={theme.name}
              type="button"
              onClick={() => dispatch(setSidebarTheme(theme))}
              className="relative cursor-pointer rounded-full outline-none transition-transform duration-150 hover:scale-110"
              aria-label={t('components.themePicker.selectTheme', { theme: theme.name })}
              title={theme.name}
            >
              <div
                className={cn(
                  "size-6 rounded-full border border-white/70 shadow-sm transition-all duration-150",
                  isActive && "ring-2 ring-offset-1 ring-offset-gray-50 dark:ring-offset-gray-900"
                )}
                style={{
                  backgroundColor: theme.color,
                  boxShadow: isActive ? `0 0 0 2px ${theme.color}40` : "none",
                  outline: isActive ? `2px solid ${theme.color}` : "none",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
