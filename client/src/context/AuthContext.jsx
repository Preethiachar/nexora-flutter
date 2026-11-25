import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nexora_token');
    const savedUser = localStorage.getItem('nexora_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      connectSocket();
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('nexora_token', data.token);
    localStorage.setItem('nexora_user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket();
    return data;
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('nexora_token', data.token);
    localStorage.setItem('nexora_user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket();
    return data;
  };

  const logout = () => {
    localStorage.removeItem('nexora_token');
    localStorage.removeItem('nexora_user');
    setUser(null);
    disconnectSocket();
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('nexora_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
