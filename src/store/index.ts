import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import routineReducer from './slices/routineSlice';
import uiThemeReducer from './slices/uiThemeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    routine: routineReducer,
    uiTheme: uiThemeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
