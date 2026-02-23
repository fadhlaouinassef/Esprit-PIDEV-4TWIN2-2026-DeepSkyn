import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserData {
  id: number;
  nom: string;
  prenom?: string;
  email: string;
  photo?: string;
  role?: string;
  // Données supplémentaires de l'utilisateur
  age?: number;
  sexe?: string;
  skin_type?: string;
  verified?: boolean;
}

interface AuthState {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserData>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      // Afficher toutes les données utilisateur dans la console
      console.log('🔐 [Redux] Utilisateur connecté :', action.payload);
      console.log('📋 [Redux] Détails :', {
        id: action.payload.id,
        nom: action.payload.nom,
        prenom: action.payload.prenom,
        email: action.payload.email,
        role: action.payload.role,
        photo: action.payload.photo,
        age: action.payload.age,
        sexe: action.payload.sexe,
        skin_type: action.payload.skin_type,
        verified: action.payload.verified,
      });
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      console.log('🚪 [Redux] Utilisateur déconnecté');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<UserData>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        console.log('✏️ [Redux] Profil mis à jour :', state.user);
      }
    },
  },
});

export const { setUser, clearUser, setLoading, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;
