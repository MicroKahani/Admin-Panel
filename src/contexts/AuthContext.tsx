import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentAdmin, logout as logoutAPI } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Admin {
  id: string;
  email: string;
  role: 'admin' | 'manager';
  permissions: { read: boolean; write: boolean; delete: boolean };
  lastLogin?: string;
}

interface AuthContextType {
  admin: Admin | null;
  setAdmin: (admin: Admin | null) => void;
  logout: () => Promise<void>;
  loading: boolean;
  isLoading: boolean;       // alias for compatibility
  isAuthenticated: boolean;
  sessionExpired: boolean;  // true when a 401 fires AFTER initial auth
  dismissSessionExpired: () => void;
  hasPermission: (permission: 'read' | 'write' | 'delete') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── AuthProvider ─────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdminState] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // ── Initial auth check ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      try {
        const response: any = await getCurrentAdmin();
        if (!cancelled && response.success) {
          setAdminState(response.data);
        }
      } catch {
        // 401 during initial load just means "not logged in" — not an error
        // Don't trigger sessionExpired banner during initial check
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    checkAuth();
    return () => { cancelled = true; };
  }, []);

  // ── Listen for session-expired event from api.ts interceptor ─────────────
  // The axios interceptor dispatches this custom event on 401AFTER initial load.
  // This avoids a hard redirect and shows an in-app modal instead (better UX).
  useEffect(() => {
    const handleSessionExpired = () => {
      if (admin) {
        // Only show if there was an active session (not just "not logged in")
        setAdminState(null);
        setSessionExpired(true);
      }
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, [admin]);

  // ── Synchronous admin setter (used in LoginPage after verify OTP) ─────────
  // Sync — no await needed. Previous code incorrectly used `await setAdmin()`
  const setAdmin = useCallback((nextAdmin: Admin | null) => {
    setAdminState(nextAdmin);
    if (nextAdmin) setSessionExpired(false);
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await logoutAPI();
    } catch {
      // Ignore logout API errors — we clear client state regardless
    } finally {
      setAdminState(null);
      setSessionExpired(false);
      window.location.href = '/login';
    }
  }, []);

  const dismissSessionExpired = useCallback(() => {
    setSessionExpired(false);
    window.location.href = '/login';
  }, []);

  // ── Permission check ──────────────────────────────────────────────────────
  const hasPermission = useCallback(
    (permission: 'read' | 'write' | 'delete'): boolean => {
      if (!admin) return false;
      if (admin.role === 'admin') return true;
      return admin.permissions[permission];
    },
    [admin]
  );

  const value: AuthContextType = {
    admin,
    setAdmin,
    logout,
    loading,
    isLoading: loading,
    isAuthenticated: admin !== null,
    sessionExpired,
    dismissSessionExpired,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── useAuth hook ─────────────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return context;
}