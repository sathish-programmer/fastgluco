import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: 'SuperAdmin' | 'Admin' | 'Editor';
}

interface AdminAuthContextType {
  admin: AdminProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, role: 'Admin' | 'Editor', password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  apiUrl: string;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('fastgluco_admin_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    // Decode admin details from localStorage if present
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

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Admin login failed.');
      }

      localStorage.setItem('fastgluco_admin_token', data.token);
      localStorage.setItem('fastgluco_admin_profile', JSON.stringify(data.admin));
      setToken(data.token);
      setAdmin(data.admin);
      return true;
    } catch (err: any) {
      setError(err.message || 'An error occurred during admin login.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, role: 'Admin' | 'Editor', password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
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
      setError(err.message || 'An error occurred during admin registration.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('fastgluco_admin_token');
    localStorage.removeItem('fastgluco_admin_profile');
    setToken(null);
    setAdmin(null);
    setError(null);
  };

  const clearError = () => setError(null);

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
