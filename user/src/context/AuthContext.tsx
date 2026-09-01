import React, { createContext, useContext, useState, useEffect } from 'react';

export type FocusModeType =
  | 'PREVENTION'
  | 'TREATMENT'
  | 'SECONDARY_PREVENTION'
  | 'AGEING'
  | 'PCOD'
  | 'DIABETES'
  | 'HYPERTENSION'
  | 'PARKINSON'
  | 'CARDIAC';

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
  cancerJourney?: FocusModeType;
  cancerDisclaimerAccepted?: boolean;
  cancerDisclaimerAcceptedAt?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  acceptedTermsVersion?: string;
  pendingProfileEdits?: Partial<UserProfile>;
  addressLine1?: string;
  addressCity?: string;
  addressState?: string;
  addressPinCode?: string;
}

export interface AppBranding {
  appName: string;
  appTagline: string;
  appLogoUrl: string;
  cancerTreatmentDisclaimer: string;
  cancerSecondaryDisclaimer: string;
  cancerPreventionDisclaimer: string;
  enableSubscriptionCoupons: boolean;
  enableSaferFoodCoupons: boolean;
  enableSubscriptions?: boolean;
  enableExternalPayments?: boolean;
  enableIOSExternalPayments?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  verifyOtp: (mobileNumber: string, otp: string, email: string) => Promise<{ isNewUser: boolean } | null>;
  completeOnboarding: (profileData: Partial<UserProfile>) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profileUpdates: Partial<UserProfile>) => Promise<boolean>;
  requestProfileUpdate: (profileUpdates: Partial<UserProfile>) => Promise<boolean>;
  acceptTerms: (termsVersion: string) => Promise<boolean>;
  clearError: () => void;
  apiUrl: string;
  branding: AppBranding;
  activeMode: FocusModeType;
  setActiveMode: (mode: FocusModeType) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('fastgluco_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [branding, setBranding] = useState<AppBranding>({
    appName: 'Mito_Reboot',
    appTagline: 'Preventive Lifestyle App',
    appLogoUrl: '',
    cancerTreatmentDisclaimer: '',
    cancerSecondaryDisclaimer: '',
    cancerPreventionDisclaimer: '',
    enableSubscriptionCoupons: true,
    enableSaferFoodCoupons: true,
    enableSubscriptions: false,
    enableExternalPayments: false
  });
  const [activeMode, _setActiveMode] = useState<FocusModeType>(() => {
    return (localStorage.getItem('fastgluco_active_mode') as FocusModeType) || 'PREVENTION';
  });

  const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001/api' : 'https://api.mitoreboot.in/api');

  useEffect(() => {
    if (user && user.cancerJourney) {
      _setActiveMode(user.cancerJourney);
      localStorage.setItem('fastgluco_active_mode', user.cancerJourney);
    }
  }, [user?.cancerJourney]);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetch(`${apiUrl}/config/public`);
        if (res.ok) {
          const config = await res.json();
          if (config.appName) {
            const tagline = (!config.appTagline || config.appTagline === 'The circadian fasting app') ? 'Preventive Lifestyle App' : config.appTagline;
            setBranding({
              appName: config.appName,
              appTagline: tagline,
              appLogoUrl: config.appLogoUrl || '',
              cancerTreatmentDisclaimer: config.cancerTreatmentDisclaimer || '',
              cancerSecondaryDisclaimer: config.cancerSecondaryDisclaimer || '',
              cancerPreventionDisclaimer: config.cancerPreventionDisclaimer || '',
              enableSubscriptionCoupons: config.enableSubscriptionCoupons ?? true,
              enableSaferFoodCoupons: config.enableSaferFoodCoupons ?? true,
              enableSubscriptions: config.enableSubscriptions,
              enableExternalPayments: config.enableExternalPayments,
              enableIOSExternalPayments: config.enableIOSExternalPayments
            });
            document.title = `${config.appName} - ${tagline}`;
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
          setUser({ ...profile, id: profile._id || profile.id });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [token]);

  const verifyOtp = async (mobileNumber: string, otp: string, email: string): Promise<{ isNewUser: boolean } | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, otp, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed.');
      }

      localStorage.setItem('fastgluco_token', data.accessToken);
      localStorage.setItem('fastgluco_refresh_token', data.refreshToken);
      setToken(data.accessToken);
      setUser({ ...data.user, id: data.user._id || data.user.id });
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

      setUser({ ...data.user, id: data.user._id || data.user.id });
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

      setUser({ ...data.user, id: data.user._id || data.user.id });
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
      return false;
    }
  };

  const setActiveMode = async (mode: 'PREVENTION' | 'TREATMENT' | 'SECONDARY_PREVENTION') => {
    _setActiveMode(mode);
    localStorage.setItem('fastgluco_active_mode', mode);
    await updateProfile({ cancerJourney: mode });
  };

  const requestProfileUpdate = async (profileUpdates: Partial<UserProfile>): Promise<boolean> => {
    if (!token) return false;
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/users/profile/request-edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileUpdates)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to request profile update.');
      }

      setUser({ ...data.user, id: data.user._id || data.user.id });
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to request profile update.');
      return false;
    }
  };

  const acceptTerms = async (termsVersion: string): Promise<boolean> => {
    if (!token) {
      setError('Authentication token missing.');
      return false;
    }
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/users/accept-terms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ termsVersion })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept terms & conditions.');
      }

      if (data.user) {
        setUser({ ...data.user, id: data.user._id || data.user.id });
      } else if (user) {
        setUser({
          ...user,
          termsAccepted: true,
          termsAcceptedAt: data.termsAcceptedAt || new Date().toISOString(),
          acceptedTermsVersion: termsVersion
        });
      }
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to accept terms & conditions.');
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
        verifyOtp,
        completeOnboarding,
        logout,
        updateProfile,
        requestProfileUpdate,
        acceptTerms,
        clearError,
        apiUrl,
        branding,
        activeMode,
        setActiveMode
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
