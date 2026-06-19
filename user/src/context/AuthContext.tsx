import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  gender?: 'Male' | 'Female' | 'Other';
  age?: number;
  height?: number;
  weight?: number;
  activityLevel?: 'Sedentary' | 'Lightly active' | 'Moderately active' | 'Very active';
  goal?: 'Lose weight' | 'Maintain weight' | 'Gain weight';
  dailyCalorieTarget?: number;
  spikeThreshold: number;
  currency?: string;
  libreEmail?: string;
  librePassword?: string;
  libreRegion?: string;
  libreActive?: boolean;
  libreLastSyncAt?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, mobile: string, password: string, additional?: Partial<UserProfile>) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profileUpdates: Partial<UserProfile>) => Promise<boolean>;
  clearError: () => void;
  apiUrl: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('fastgluco_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001/api' : 'https://api.mitoreboot.in/api');

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        let currentToken = token;
        let response = await fetch(`${apiUrl}/users/profile`, {
          headers: {
            'Authorization': `Bearer ${currentToken}`
          }
        });

        if (response.status === 401) {
          const refreshToken = localStorage.getItem('fastgluco_refresh_token');
          if (refreshToken) {
            const refreshRes = await fetch(`${apiUrl}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });
            if (refreshRes.ok) {
              const data = await refreshRes.json();
              localStorage.setItem('fastgluco_token', data.accessToken);
              currentToken = data.accessToken;
              setToken(currentToken);

              // Retry with new token
              response = await fetch(`${apiUrl}/users/profile`, {
                headers: {
                  'Authorization': `Bearer ${currentToken}`
                }
              });
            }
          }
        }

        if (response.ok) {
          const profile = await response.json();
          setUser(profile);
        }
        // No auto-logout — user must manually log out
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [token]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      localStorage.setItem('fastgluco_token', data.accessToken);
      localStorage.setItem('fastgluco_refresh_token', data.refreshToken);
      setToken(data.accessToken);
      setUser(data.user);
      return true;
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, mobile: string, password: string, additional?: Partial<UserProfile>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, mobile, password, ...additional })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      localStorage.setItem('fastgluco_token', data.accessToken);
      localStorage.setItem('fastgluco_refresh_token', data.refreshToken);
      setToken(data.accessToken);
      setUser(data.user);
      return true;
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('fastgluco_token');
    localStorage.removeItem('fastgluco_refresh_token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const updateProfile = async (profileUpdates: Partial<UserProfile>): Promise<boolean> => {
    if (!token) return false;
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileUpdates)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile.');
      }

      setUser(data.user);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
      return false;
    }
  };

  const clearError = () => setError(null);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout,
        updateProfile,
        clearError,
        apiUrl
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
