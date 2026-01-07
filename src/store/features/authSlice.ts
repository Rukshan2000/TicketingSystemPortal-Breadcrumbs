import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  role: number | string;
  status: string;
  phone?: string;
  department?: string;
  is_verified: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tokenType: string;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; tokens: AuthTokens }>
    ) => {
      state.user = action.payload.user;
      state.tokens = action.payload.tokens;
      state.isAuthenticated = true;
      state.error = null;
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', action.payload.tokens.accessToken);
        localStorage.setItem('refreshToken', action.payload.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      }
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      if (state.tokens) {
        state.tokens.accessToken = action.payload;
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', action.payload);
        }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.error = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    },
    initializeFromStorage: (state) => {
      if (typeof window !== 'undefined') {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const userStr = localStorage.getItem('user');
        
        if (accessToken && refreshToken && userStr) {
          try {
            const user = JSON.parse(userStr);
            state.user = user;
            state.tokens = {
              accessToken,
              refreshToken,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              tokenType: 'Bearer',
            };
            state.isAuthenticated = true;
          } catch (error) {
            state.isAuthenticated = false;
          }
        }
      }
    },
  },
});

export const { 
  setCredentials, 
  setAccessToken, 
  setLoading, 
  setError, 
  logout,
  initializeFromStorage 
} = authSlice.actions;
export default authSlice.reducer;
