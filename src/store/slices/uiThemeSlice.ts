import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SidebarThemeOption {
  name: string;
  color: string;
}

export type ColorBlindAssistMode =
  | 'none'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia';

export const SIDEBAR_THEMES: SidebarThemeOption[] = [
  { name: 'Accessible Blue', color: '#005FCC' },
  { name: 'Accessible Green', color: '#1B5E20' },
  { name: 'Accessible Rose', color: '#A61B47' },
  { name: 'Accessible Purple', color: '#5B2C83' },
];

interface UiThemeState {
  sidebarTheme: SidebarThemeOption;
  highContrastMode: boolean;
  colorBlindAssistMode: ColorBlindAssistMode;
}

const initialState: UiThemeState = {
  sidebarTheme: SIDEBAR_THEMES[0],
  highContrastMode: false,
  colorBlindAssistMode: 'none',
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
    toggleHighContrastMode: (state) => {
      state.highContrastMode = !state.highContrastMode;
    },
    setHighContrastMode: (state, action: PayloadAction<boolean>) => {
      state.highContrastMode = action.payload;
    },
    setColorBlindAssistMode: (state, action: PayloadAction<ColorBlindAssistMode>) => {
      state.colorBlindAssistMode = action.payload;
    },
  },
});

export const { setSidebarTheme, toggleHighContrastMode, setHighContrastMode, setColorBlindAssistMode } = uiThemeSlice.actions;
export default uiThemeSlice.reducer;
