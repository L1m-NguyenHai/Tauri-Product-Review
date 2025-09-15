import React, { createContext, useContext, useState } from 'react';
import { authAPI, type User } from '../services/api';

interface AuthContextType {
  user: User | null;
  setUser?: React.Dispatch<React.SetStateAction<User | null>>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
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
          const userData = await authAPI.getMe();
          setUser(userData);
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
      const { access_token, token_type } = await authAPI.login(email, password);

      // Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('token_type', token_type);

      // Use the token to fetch user details
      const userData = await authAPI.getMe();

      // Update the user state with the fetched details
      setUser(userData);

      return true;
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Re-throw error with proper details for the UI to handle
      if (error.message.includes('Please verify your email address') || error.message.includes('403')) {
        throw new Error('EMAIL_NOT_VERIFIED');
      } else if (error.message.includes('Incorrect email or password') || error.message.includes('401')) {
        throw new Error('INVALID_CREDENTIALS');
      } else {
        throw new Error('LOGIN_ERROR');
      }
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      // Send registration details to the backend
      const userData = await authAPI.register({ name, email, password });

      // Update the user state with the registered user's details
      setUser(userData);

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

  const refreshUser = async (): Promise<void> => {
    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');
    
    if (token && tokenType) {
      try {
        const userData = await authAPI.getMe();
        setUser(userData);
      } catch (error) {
        console.error('Failed to refresh user data:', error);
        // Don't clear tokens on refresh failure, user might just be offline
      }
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, refreshUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};