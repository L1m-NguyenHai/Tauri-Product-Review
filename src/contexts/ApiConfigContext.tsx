import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ApiConfigContextType {
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  resetToDefault: () => void;
}

const DEFAULT_BASE_URL = 'http://localhost:8000/api/v1';
const STORAGE_KEY = 'api_base_url';

const ApiConfigContext = createContext<ApiConfigContextType | undefined>(undefined);

interface ApiConfigProviderProps {
  children: ReactNode;
}

export const ApiConfigProvider: React.FC<ApiConfigProviderProps> = ({ children }) => {
  const [baseUrl, setBaseUrlState] = useState<string>(() => {
    // Load from localStorage on initialization
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved || DEFAULT_BASE_URL;
  });

  const setBaseUrl = (url: string) => {
    const trimmedUrl = url.trim();
    setBaseUrlState(trimmedUrl);
    localStorage.setItem(STORAGE_KEY, trimmedUrl);
  };

  const resetToDefault = () => {
    setBaseUrlState(DEFAULT_BASE_URL);
    localStorage.setItem(STORAGE_KEY, DEFAULT_BASE_URL);
  };

  return (
    <ApiConfigContext.Provider value={{ baseUrl, setBaseUrl, resetToDefault }}>
      {children}
    </ApiConfigContext.Provider>
  );
};

export const useApiConfig = (): ApiConfigContextType => {
  const context = useContext(ApiConfigContext);
  if (context === undefined) {
    throw new Error('useApiConfig must be used within an ApiConfigProvider');
  }
  return context;
};