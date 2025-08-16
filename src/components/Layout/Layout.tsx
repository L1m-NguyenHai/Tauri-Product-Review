import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useTheme } from '../../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
  productFilters?: any;
}

const Layout: React.FC<LayoutProps> = ({ children, productFilters }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isDark } = useTheme();
  const location = useLocation();

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-gray-900' : 'bg-gray-100'
    }`}>
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} productFilters={productFilters} />
        
        <main className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-0'
        } pt-16`}>
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;