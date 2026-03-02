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

// Helper to safely access localStorage
const getStoredUser = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('deepskyn_user');
    return stored ? JSON.parse(stored) : null;
  }
  return null;
};

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

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('deepskyn_user', JSON.stringify(action.payload));
      }

      // Afficher les données demandées dans la console
      console.log('[Redux] Utilisateur connecté :');
      console.log('ID :', action.payload.id);
      console.log('Nom :', action.payload.nom);
      console.log('Prénom :', action.payload.prenom || 'N/A');
      console.log('Rôle :', action.payload.role);
      console.log('Status (Vérifié) :', action.payload.verified ? 'Vérifié' : 'Non vérifié');
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('deepskyn_user');
      }
      
      console.log('[Redux] Utilisateur déconnecté');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<UserData>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        console.log('[Redux] Profil mis à jour :', state.user);
      }
    },
  },
});

export const { setUser, clearUser, setLoading, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;
