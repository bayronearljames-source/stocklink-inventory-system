import { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      return savedUser ? JSON.parse(savedUser) : null; // no more "default to Admin" — you're logged out until a real login succeeds
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.TOKEN) || null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  }, [token]);

  // Login handler — now hits the real backend instead of picking from MOCK_USERS
  const login = async (username, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // routes/auth.js sends { error: "..." } on 400/401/500
        throw new Error(data.error || 'Login failed');
      }

      // data = { token, user: { id, role, branch_id, username } }
      setUser(data.user);
      setToken(data.token);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err; // let the login form catch this and show it
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  };

  // Check if current user has any of the given roles
  const hasRole = (allowedRoles = []) => {
    if (!user || !user.role) return false;
    return allowedRoles.includes(user.role);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    role: user?.role || null,
    isLoading,
    error,
    login,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
