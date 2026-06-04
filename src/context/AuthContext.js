import React, { createContext, useState, useContext, useEffect } from 'react';

// Simple dummy authentication context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Restore user from localStorage on mount so reload stays on the same page
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('eli_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  // Keep localStorage in sync with user state
  useEffect(() => {
    if (user) {
      localStorage.setItem('eli_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('eli_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const login = (username, rememberMe = false) => {
    // In a real app, you would verify credentials. Here we just set a dummy user and token.
    const dummyToken = 'fake-jwt-token';
    const newUser = { username };
    setUser(newUser);
    setToken(dummyToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('eli_user');
    localStorage.removeItem('token');
  };

  const signup = (username) => {
    // Dummy signup just logs in the new user
    const newUser = { username };
    setUser(newUser);
    setToken('fake-jwt-token');
  };

  const value = { user, token, login, logout, signup };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
