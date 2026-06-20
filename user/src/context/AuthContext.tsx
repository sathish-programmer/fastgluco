import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  mobileNumber: string;
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
  cancerJourney?: 'PREVENTION' | 'TREATMENT' | 'SECONDARY_PREVENTION';
  cancerDisclaimerAccepted?: boolean;
  cancerDisclaimerAcceptedAt?: string;
}

export interface AppBranding {
  appName: string;
  appTagline: string;
  appLogoUrl: string;
  cancerTreatmentDisclaimer: string;
  cancerSecondaryDisclaimer: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  verifyOtpToken: (idToken: string) => Promise<{ isNewUser: boolean } | null>;
  completeOnboarding: (profileData: Partial<UserProfile>) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profileUpdates: Partial<UserProfile>) => Promise<boolean>;
  clearError: () => void;
  apiUrl: string;
  branding: AppBranding;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('fastgluco_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [branding, setBranding] = useState<AppBranding>({
    appName: 'Mito_Reboot',
    appTagline: 'The circadian fasting app',
    appLogoUrl: '',
    cancerTreatmentDisclaimer: 'Disclaimer: This app is for informational purposes only. If you are undergoing active cancer treatment, please consult with your oncologist before starting any circadian fasting protocols.',
    cancerSecondaryDisclaimer: 'Disclaimer: This app is for informational purposes only. If you have a previous history of cancer (secondary prevention), please consult with your medical team before starting any circadian fasting protocols.'
  });

  const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001/api' : 'https://api.mitoreboot.in/api');

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetch(`${apiUrl}/config/public`);
        if (res.ok) {
          const config = await res.json();
          if (config.appName) {
            setBranding({
              appName: config.appName,
              appTagline: config.appTagline,
              appLogoUrl: config.appLogoUrl || '',
              cancerTreatmentDisclaimer: config.cancerTreatmentDisclaimer || '',
              cancerSecondaryDisclaimer: config.cancerSecondaryDisclaimer || ''
            });
            document.title = `${config.appName} - ${config.appTagline}`;
          }
        }
      } catch (err) {
        console.error('Failed to load branding:', err);
      }
    };
    fetchBranding();
  }, [apiUrl]);

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
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [token]);

  const verifyOtpToken = async (idToken: string): Promise<{ isNewUser: boolean } | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed.');
      }

      localStorage.setItem('fastgluco_token', data.accessToken);
      localStorage.setItem('fastgluco_refresh_token', data.refreshToken);
      setToken(data.accessToken);
      setUser(data.user);
      return { isNewUser: data.isNewUser };
    } catch (err: any) {
      setError(err.message || 'An error occurred during OTP verification.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (profileData: Partial<UserProfile>): Promise<boolean> => {
    if (!token) {
      setError('No active authentication token found.');
      return false;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/auth/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Onboarding failed.');
      }

      setUser(data.user);
      return true;
    } catch (err: any) {
      setError(err.message || 'An error occurred during onboarding.');
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
        verifyOtpToken,
        completeOnboarding,
        logout,
        updateProfile,
        clearError,
        apiUrl,
        branding
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
