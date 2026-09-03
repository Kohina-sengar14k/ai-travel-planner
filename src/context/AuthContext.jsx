import { createContext, useState, useContext, useEffect } from 'react';
import { login as loginAPI, register as registerAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch { /* corrupt storage */ }
    setLoading(false);
  }, []);

  const persist = (data) => {
  const token = data.token || data?.data?.token;

  console.log("TOKEN SAVED:", token); // 👈 debug

  if (!token) {
    console.error("No token found in response!");
    return;
  }

  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(data.user || data?.data?.user || data));
  setUser(data.user || data?.data?.user || data);
};

  const login = async (email, password) => {
    const { data } = await loginAPI({ email, password });
    console.log("LOGIN RESPONSE:", data);
    persist(data);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await registerAPI({ name, email, password });
    persist(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
