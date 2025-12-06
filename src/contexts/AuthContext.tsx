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
  setAdmin: (admin: Admin | null) => void;
  logout: () => Promise<void>;
  loading: boolean;
  isLoading: boolean; // Alias for compatibility
  isAuthenticated: boolean; // Computed property
  hasPermission: (permission: 'read' | 'write' | 'delete') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated by calling /me endpoint
    // If cookie exists, backend will verify it
    console.log('AuthContext: Checking authentication...');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('AuthContext: Fetching current admin...');
      const response = await getCurrentAdmin();
      console.log('AuthContext: Response:', response);
      
      // response is already res.data from API service
      if (response.success) {
        console.log('AuthContext: Admin authenticated:', response.data);
        setAdmin(response.data);
      } else {
        console.log('AuthContext: Response success=false');
        setAdmin(null);
      }
    } catch (error: any) {
      // Don't log out on 401 during initial load - just set admin to null
      console.log('AuthContext: Error fetching admin:', error.message);
      setAdmin(null);
    } finally {
      console.log('AuthContext: Setting loading to false');
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutAPI();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAdmin(null);
      window.location.href = '/login';
    }
  };

  const hasPermission = (permission: 'read' | 'write' | 'delete'): boolean => {
    if (!admin) return false;
    if (admin.role === 'admin') return true;
    return admin.permissions[permission];
  };

  const value = {
    admin,
    setAdmin,
    logout,
    loading,
    isLoading: loading, // Alias for compatibility
    isAuthenticated: admin !== null, // Computed property
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Export hook separately to maintain Fast Refresh compatibility
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}