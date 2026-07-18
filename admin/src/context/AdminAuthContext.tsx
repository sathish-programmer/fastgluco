import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: 'SuperAdmin' | 'Admin' | 'Editor' | 'Doctor' | 'Vendor' | 'LabPartner';
}

interface AdminAuthContextType {
  admin: AdminProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, role: 'Admin' | 'Editor' | 'Doctor', password: string) => Promise<boolean>;
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

  const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001/api' : 'https://api.mitoreboot.in/api');

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
        const profile = { id: docData.doctor.id, name: docData.doctor.name, email: docData.doctor.email, role: 'Doctor' as any };
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
        const profile = { id: venData.vendor.id, name: venData.vendor.name, email: venData.vendor.email, role: 'Vendor' as any };
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
        const profile = { id: labData._id, name: labData.name, email: labData.email, role: 'LabPartner' as any, laboratoryId: labData.laboratoryId };
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
        const profile = { id: data.doctor.id, name: data.doctor.name, email: data.doctor.email, role: 'Doctor' as any };
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
