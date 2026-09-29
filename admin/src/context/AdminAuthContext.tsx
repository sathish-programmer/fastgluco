import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: 'SuperAdmin' | 'Admin' | 'Editor' | 'Doctor' | 'Vendor' | 'LabPartner';
  laboratoryId?: string;
}

interface AdminAuthContextType {
  admin: AdminProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, role: 'Admin' | 'Editor' | 'Doctor', password: string) => Promise<boolean>;
  logout: (reason?: any) => void;
  clearError: () => void;
  apiUrl: string;
}

/**
 * Safely inspect a JWT token to check if it has expired
 */
export const isTokenExpired = (jwtToken: string | null): boolean => {
  if (!jwtToken) return true;
  try {
    const parts = jwtToken.split('.');
    if (parts.length < 2) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    if (typeof parsed.exp === 'number') {
      return Date.now() >= parsed.exp * 1000;
    }
    return false;
  } catch {
    return false;
  }
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    const saved = localStorage.getItem('fastgluco_admin_token');
    if (!saved || isTokenExpired(saved)) {
      localStorage.removeItem('fastgluco_admin_token');
      localStorage.removeItem('fastgluco_admin_profile');
      return null;
    }
    return saved;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001/api' : 'https://api.mitoreboot.in/api');

  const logout = (reason?: any) => {
    localStorage.removeItem('fastgluco_admin_token');
    localStorage.removeItem('fastgluco_admin_profile');
    setToken(null);
    setAdmin(null);
    if (typeof reason === 'string') {
      setError(reason);
    } else {
      setError(null);
    }
  };

  const clearError = () => setError(null);

  // Validate token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('fastgluco_admin_token');
    if (savedToken && isTokenExpired(savedToken)) {
      logout('Your session has expired. Please sign in again.');
      setIsLoading(false);
      return;
    }

    const storedAdmin = localStorage.getItem('fastgluco_admin_profile');
    if (storedAdmin && token) {
      try {
        setAdmin(JSON.parse(storedAdmin));
      } catch (e) {
        logout();
      }
    }
    setIsLoading(false);
  }, [token]);

  // Periodic expiration checker (every 15 seconds)
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('fastgluco_admin_token');
      if (currentToken && isTokenExpired(currentToken)) {
        console.warn('[AdminAuth] Token expired on schedule. Logging out...');
        logout('Your session has expired. Please sign in again.');
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [token]);

  // Global fetch response interceptor to immediately catch 401/403 expired or invalid tokens
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
      try {
        const response = await originalFetch(...args);

        // Check if response indicates authentication failure
        if (response.status === 401 || response.status === 403) {
          try {
            const clone = response.clone();
            const data = await clone.json();
            const isAuthFailure = 
              response.status === 401 ||
              data?.tokenExpired === true ||
              data?.message === 'Invalid or expired token.' ||
              data?.message === 'Authentication token is required.' ||
              data?.message === 'Authentication required.';

            if (isAuthFailure) {
              const currentToken = localStorage.getItem('fastgluco_admin_token');
              if (currentToken) {
                console.warn('[AdminAuth] Expired or invalid token detected from API. Redirecting to login page...');
                logout('Your session has expired. Please sign in again.');
              }
            }
          } catch {
            if (response.status === 401) {
              const currentToken = localStorage.getItem('fastgluco_admin_token');
              if (currentToken) {
                logout('Your session has expired. Please sign in again.');
              }
            }
          }
        }

        return response;
      } catch (fetchError) {
        throw fetchError;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Try standard Admin Login
      const response = await fetch(`${apiUrl}/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('fastgluco_admin_token', data.token);
        localStorage.setItem('fastgluco_admin_profile', JSON.stringify(data.admin));
        setToken(data.token);
        setAdmin(data.admin);
        return true;
      }

      // 2. Try Doctor Portal Login
      const docRes = await fetch(`${apiUrl}/doctor/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (docRes.ok) {
        const docData = await docRes.json();
        const profile = { id: docData.doctor.id, name: docData.doctor.name, email: docData.doctor.email, role: 'Doctor' as const };
        localStorage.setItem('fastgluco_admin_token', docData.token);
        localStorage.setItem('fastgluco_admin_profile', JSON.stringify(profile));
        setToken(docData.token);
        setAdmin(profile);
        return true;
      }

      // 3. Try Vendor Portal Login
      const venRes = await fetch(`${apiUrl}/vendor/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (venRes.ok) {
        const venData = await venRes.json();
        const profile = { id: venData.vendor.id, name: venData.vendor.name, email: venData.vendor.email, role: 'Vendor' as const };
        localStorage.setItem('fastgluco_admin_token', venData.token);
        localStorage.setItem('fastgluco_admin_profile', JSON.stringify(profile));
        setToken(venData.token);
        setAdmin(profile);
        return true;
      }

      // 4. Try Lab Portal Login
      const labRes = await fetch(`${apiUrl}/labs/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (labRes.ok) {
        const labData = await labRes.json();
        const profile = { id: labData._id, name: labData.name, email: labData.email, role: 'LabPartner' as const, laboratoryId: labData.laboratoryId };
        localStorage.setItem('fastgluco_admin_token', labData.token);
        localStorage.setItem('fastgluco_admin_profile', JSON.stringify(profile));
        setToken(labData.token);
        setAdmin(profile);
        return true;
      }

      throw new Error(data.message || 'Login failed.');
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, role: 'Admin' | 'Editor' | 'Doctor', password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      if (role === 'Doctor') {
        const response = await fetch(`${apiUrl}/doctor/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, specialty: 'General Practice', description: 'Consultant Specialist' })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Doctor registration failed.');
        const profile = { id: data.doctor.id, name: data.doctor.name, email: data.doctor.email, role: 'Doctor' as const };
        localStorage.setItem('fastgluco_admin_token', data.token);
        localStorage.setItem('fastgluco_admin_profile', JSON.stringify(profile));
        setToken(data.token);
        setAdmin(profile);
        return true;
      }

      const response = await fetch(`${apiUrl}/admin/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Admin registration failed.');
      }

      localStorage.setItem('fastgluco_admin_token', data.token);
      localStorage.setItem('fastgluco_admin_profile', JSON.stringify(data.admin));
      setToken(data.token);
      setAdmin(data.admin);
      return true;
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!token;

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
        apiUrl
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
