import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Initialize user from localStorage on component mount
  React.useEffect(() => {
    const initializeUser = async () => {
      const token = localStorage.getItem('access_token');
      const tokenType = localStorage.getItem('token_type');
      
      if (token && tokenType) {
        try {
          const response = await axios.get('http://127.0.0.1:8000/api/v1/auth/me', {
            headers: {
              Authorization: `${tokenType} ${token}`,
            },
          });

          const userData = response.data;
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            avatar: userData.avatar,
            role: userData.role,
          });
        } catch (error) {
          console.error('Failed to restore user session:', error);
          // Clear invalid tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('token_type');
        }
      }
    };

    initializeUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Authenticate and get the token
      const loginResponse = await axios.post('http://127.0.0.1:8000/api/v1/auth/login', {
        email,
        password,
      });

      const { access_token, token_type } = loginResponse.data;

      // Use the token to fetch user details
      const userResponse = await axios.get('http://127.0.0.1:8000/api/v1/auth/me', {
        headers: {
          Authorization: `${token_type} ${access_token}`,
        },
      });

      const userData = userResponse.data;

      // Update the user state with the fetched details
      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        role: userData.role,
      });

      // Optionally store the token in localStorage or cookies
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('token_type', token_type);

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      // Send registration details to the backend
      const response = await axios.post('http://127.0.0.1:8000/api/v1/auth/register', {
        name,
        email,
        password,
      });

      const userData = response.data;

      // Update the user state with the registered user's details
      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        role: userData.role,
      });

      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};