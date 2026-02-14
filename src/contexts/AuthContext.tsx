import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentAdmin, logout as logoutAPI } from '../services/api';
import logger from '../utils/logger';

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
    logger.info('AuthContext', 'Checking authentication...');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      logger.debug('AuthContext', 'Fetching current admin...');
      const response: any = await getCurrentAdmin();

      // response is already res.data from API service
      if (response.success) {
        logger.info('AuthContext', 'Admin authenticated', { email: response.data.email });
        setAdmin(response.data);
      } else {
        logger.warn('AuthContext', 'Authentication check failed - success=false');
        setAdmin(null);
      }
    } catch (error: any) {
      // Don't log out on 401 during initial load - just set admin to null
      logger.debug('AuthContext', 'Error fetching admin', { message: error.message });
      setAdmin(null);
    } finally {
      logger.debug('AuthContext', 'Setting loading to false');
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutAPI();
    } catch (error) {
      logger.error('AuthContext', 'Logout error', error);
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