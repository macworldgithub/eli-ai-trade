import React, { createContext, useState, useContext, useEffect } from 'react';

// Simple dummy authentication context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null means not logged in
  const [token, setToken] = useState(localStorage.getItem('token') || null);

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
    setUser({ username });
    if (rememberMe) {
      setToken(dummyToken);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const signup = (username) => {
    // Dummy signup just logs in the new user
    setUser({ username });
  };

  const value = { user, token, login, logout, signup };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
