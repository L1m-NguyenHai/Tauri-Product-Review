import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Package, 
  User, 
  Settings, 
  Info, 
  Phone,
  PlusCircle,
  Search,
  Grid,
  List
} from 'lucide-react';
import { publicAPI } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  productFilters?: {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    sortBy: string;
    setSortBy: (sort: string) => void;
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, productFilters }) => {
  const { isDark } = useTheme();
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const isProductsPage = location.pathname === '/products';
  const [categories, setCategories] = useState<{id: string, name: string}[]>([
    {id: 'all', name: 'All Categories'}
  ]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await publicAPI.getCategories();
        if (response && Array.isArray(response)) {
          setCategories([
            {id: 'all', name: 'All Categories'},
            ...response.map((category: any) => ({
              id: category.id,
              name: category.name
            }))
          ]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/products', icon: Package, label: 'Products' },
    ...(user ? [
      { to: '/request-review', icon: PlusCircle, label: 'Request Review' },
      { to: '/profile', icon: User, label: 'Profile' },
    ] : []),
  ];

  const adminItems = [
    { to: '/admin', icon: Settings, label: 'Admin Panel' },
  ];

  const footerItems = [
    { to: '/about', icon: Info, label: 'About' },
    { to: '/contact', icon: Phone, label: 'Contact' },
  ];
  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
          isActive
            ? 'bg-blue-500 text-white'
            : isDark
            ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </NavLink>
  );

  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r z-40`}>
      <nav className="flex flex-col h-full p-4">
        <div className="space-y-2">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
          
          {/* Show auth prompt for non-authenticated users */}
          {!user && (
            <div className={`mt-6 p-4 rounded-lg border ${
              isDark ? 'border-gray-700 bg-gray-700' : 'border-orange-200 bg-orange-50'
            }`}>
              <p className={`text-sm font-medium mb-2 ${
                isDark ? 'text-white' : 'text-orange-900'
              }`}>
                Get Full Access
              </p>
              <p className={`text-xs mb-3 ${
                isDark ? 'text-gray-300' : 'text-orange-700'
              }`}>
                Sign in to write reviews, request products, and access your profile.
              </p>
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="flex-1 text-center px-3 py-2 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className={`flex-1 text-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    isDark 
                      ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                      : 'bg-white hover:bg-gray-50 text-orange-600 border border-orange-200'
                  }`}
                >
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Product Filters Section */}
        {isProductsPage && productFilters && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className={`text-sm font-semibold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Filters & Search
            </h3>
            
            {/* Search */}
            <div className="mb-4">
              <label className={`block text-xs font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Search Products
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={productFilters.searchQuery}
                  onChange={(e) => productFilters.setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border-0 ${
                    isDark 
                      ? 'bg-gray-700 text-white placeholder-gray-400' 
                      : 'bg-gray-100 text-gray-900'
                  } focus:ring-2 focus:ring-orange-500 focus:outline-none`}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-4">
              <label className={`block text-xs font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Category
              </label>
              <select
                value={productFilters.selectedCategory}
                onChange={(e) => productFilters.setSelectedCategory(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border-0 ${
                  isDark 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-gray-100 text-gray-900'
                } focus:ring-2 focus:ring-orange-500 focus:outline-none`}
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="mb-4">
              <label className={`block text-xs font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Sort By
              </label>
              <select
                value={productFilters.sortBy}
                onChange={(e) => productFilters.setSortBy(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border-0 ${
                  isDark 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-gray-100 text-gray-900'
                } focus:ring-2 focus:ring-orange-500 focus:outline-none`}
              >
                <option value="average_rating">Sort by Rating</option>
                <option value="price">Sort by Price</option>
                <option value="review_count">Sort by Reviews</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>

            {/* View Mode */}
            <div className="mb-4">
              <label className={`block text-xs font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                View Mode
              </label>
              <div className="flex rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                <button
                  onClick={() => productFilters.setViewMode('grid')}
                  className={`flex-1 p-2 text-sm ${
                    productFilters.viewMode === 'grid'
                      ? 'bg-orange-500 text-white'
                      : isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  <Grid className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => productFilters.setViewMode('list')}
                  className={`flex-1 p-2 text-sm ${
                    productFilters.viewMode === 'list'
                      ? 'bg-orange-500 text-white'
                      : isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  <List className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          </div>
        )}
        {isAdmin && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              {adminItems.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            {footerItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;