import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SidebarThemeOption {
  name: string;
  color: string;
}

export const SIDEBAR_THEMES: SidebarThemeOption[] = [
  { name: 'Vivid Blue', color: '#007AFF' },
  { name: 'Emerald Green', color: '#34C759' },
  { name: 'Soft Pink', color: '#FF2D55' },
  { name: 'Electric Purple', color: '#AF52DE' },
];

interface UiThemeState {
  sidebarTheme: SidebarThemeOption;
}

const initialState: UiThemeState = {
  sidebarTheme: SIDEBAR_THEMES[0],
};

const isKnownTheme = (theme: SidebarThemeOption) => {
  return SIDEBAR_THEMES.some((item) => item.name === theme.name && item.color === theme.color);
};

const uiThemeSlice = createSlice({
  name: 'uiTheme',
  initialState,
  reducers: {
    setSidebarTheme: (state, action: PayloadAction<SidebarThemeOption>) => {
      if (isKnownTheme(action.payload)) {
        state.sidebarTheme = action.payload;
      }
    },
  },
});

export const { setSidebarTheme } = uiThemeSlice.actions;
export default uiThemeSlice.reducer;
