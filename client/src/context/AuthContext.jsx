import { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS, MOCK_USERS, ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      return savedUser ? JSON.parse(savedUser) : MOCK_USERS.admin; // Default to Admin for easy preview
    } catch {
      return MOCK_USERS.admin;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.TOKEN) || 'mock-jwt-token-stocklink';
  });

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

  // Login handler
  const login = (roleKeyOrUserData) => {
    let targetUser;
    if (typeof roleKeyOrUserData === 'string') {
      targetUser = MOCK_USERS[roleKeyOrUserData] || MOCK_USERS.admin;
    } else {
      targetUser = roleKeyOrUserData;
    }
    const mockToken = `mock-jwt-${targetUser.role}-${Date.now()}`;
    setUser(targetUser);
    setToken(mockToken);
    return targetUser;
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

  // Switch role quickly (convenient for defense demos)
  const switchRole = (roleKey) => {
    if (MOCK_USERS[roleKey]) {
      return login(roleKey);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    role: user?.role || null,
    login,
    logout,
    hasRole,
    switchRole,
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
