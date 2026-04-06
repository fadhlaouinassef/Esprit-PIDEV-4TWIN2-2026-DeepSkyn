import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SidebarThemeOption {
  name: string;
  color: string;
}

export const SIDEBAR_THEMES: SidebarThemeOption[] = [
  { name: 'Accessible Blue', color: '#005FCC' },
  { name: 'Accessible Green', color: '#1B5E20' },
  { name: 'Accessible Rose', color: '#A61B47' },
  { name: 'Accessible Purple', color: '#5B2C83' },
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
