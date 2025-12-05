// frontend/src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentAdmin, logout as logoutAPI } from '../services/api';

interface Admin {
  id: string;
  email: string;
  role: 'admin' | 'manager';
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
}

interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAdmin: (adminData: Admin) => void; // Add this
  logout: () => void;
  hasPermission: (permission: 'read' | 'write' | 'delete') => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // No need to check localStorage - the cookie is sent automatically
      const response = await getCurrentAdmin();
      if (response.success) {
        setAdmin(response.data);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutAPI();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setAdmin(null);
  };

  const hasPermission = (permission: 'read' | 'write' | 'delete') => {
    if (!admin) return false;
    if (admin.role === 'admin') return true;
    return admin.permissions[permission];
  };

  const isAdmin = admin?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        setAdmin, // Expose setAdmin
        logout,
        hasPermission,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};