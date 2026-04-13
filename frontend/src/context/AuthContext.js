import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminLogin, verifyAdmin } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('mediqueue_token');
      const cached = localStorage.getItem('mediqueue_admin');
      if (!token) { setLoading(false); return; }
      try {
        // Verify token is still valid
        const res = await verifyAdmin();
        setAdmin(res.data.admin);
      } catch {
        // Token invalid/expired
        localStorage.removeItem('mediqueue_token');
        localStorage.removeItem('mediqueue_admin');
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await adminLogin(username, password);
    const { token, admin: adminData } = res.data;
    localStorage.setItem('mediqueue_token', token);
    localStorage.setItem('mediqueue_admin', JSON.stringify(adminData));
    setAdmin(adminData);
    return adminData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('mediqueue_token');
    localStorage.removeItem('mediqueue_admin');
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
