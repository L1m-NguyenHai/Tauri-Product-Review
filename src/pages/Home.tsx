import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, Users, Award } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import ProductCard from '../components/ProductCard';
import axios from 'axios';

const Home: React.FC = () => {
  const { isDark } = useTheme();
  
  // State for API data
  const [latestProducts, setLatestProducts] = useState<any[]>([]);
  const [highestRatedProduct, setHighestRatedProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalReviews: '0',
    productsReviewed: '0',
    activeUsers: '0',
    expertReviewers: '0'
  });
  const [loading, setLoading] = useState(true);

  // Utility function to format price
  const formatPrice = (price: number | string): string => {
    if (typeof price === 'string') {
      price = parseFloat(price);
    }
    
    // Remove decimal part and format with thousand separators
    return Math.floor(price)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
  };

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch latest products (products with few or no reviews)
        const latestResponse = await axios.get('http://localhost:8000/api/v1/products/', {
          params: {
            limit: 3,
            sort_by: 'created_at',
            sort_order: 'desc'
          }
        });
        
        // Fetch highest rated product for hero section
        const highestRatedResponse = await axios.get('http://localhost:8000/api/v1/products/', {
          params: {
            limit: 1,
            sort_by: 'average_rating',
            sort_order: 'desc'
          }
        });
        
        // Fetch categories
        const categoriesResponse = await axios.get('http://localhost:8000/api/v1/categories/');
        
        // Debug: Log API responses
        console.log('Latest products response:', latestResponse.data);
        console.log('Highest rated response:', highestRatedResponse.data);
        console.log('Categories response:', categoriesResponse.data);
        
        // Set the data
        setLatestProducts(latestResponse.data.items || []);
        setHighestRatedProduct(highestRatedResponse.data.items?.[0] || null);
        setCategories(categoriesResponse.data.slice(0, 5) || []); // Limit to 5 categories
        
        // For stats, we'll use static data for now but you can create endpoints for these
        setStats({
          totalReviews: '15,234',
          productsReviewed: latestResponse.data.total?.toString() || '0',
          activeUsers: '45,678',
          expertReviewers: '234'
        });
        
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to empty arrays/objects on error
        setLatestProducts([]);
        setHighestRatedProduct(null);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Category icon mapping
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: string } = {
      'keyboard': '⌨️',
      'mouse': '🖱️',
      'monitor': '🖥️',
      'headphone': '🎧',
      'mobile': '📱',
      'laptop': '💻',
      'audio': '🎧',
      'gaming': '🎮',
      'accessories': '⚙️',
      'storage': '💾'
    };
    
    const key = categoryName.toLowerCase();
    return iconMap[key] || '📦';
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-green-100 text-green-600',
      'bg-purple-100 text-purple-600',
      'bg-red-100 text-red-600',
      'bg-yellow-100 text-yellow-600'
    ];
    return colors[index % colors.length];
  };

  const statsIcons = [
    { icon: Star, label: 'Total Reviews', value: stats.totalReviews },
    { icon: TrendingUp, label: 'Products Reviewed', value: stats.productsReviewed },
    { icon: Users, label: 'Active Users', value: stats.activeUsers },
    { icon: Award, label: 'Expert Reviewers', value: stats.expertReviewers }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section - Deal of the Day Style */}
      <section className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-orange-500 to-orange-400 shadow-xl">
        <div className="flex items-center justify-between p-8 lg:p-12">
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                Highest Rated<br />
                Product
              </h1>
              <p className="text-orange-100 text-lg">
                {highestRatedProduct ? 
                  `${highestRatedProduct.name} - ${formatPrice(highestRatedProduct.price)}` :
                  'Discover top-rated products loved by our community'
                }
              </p>
            </div>
            {highestRatedProduct && (
              <Link 
                to={`/products/${highestRatedProduct.id}`}
                className="inline-block bg-white text-orange-500 hover:bg-orange-50 px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                View Product
              </Link>
            )}
          </div>
          <div className="hidden lg:block">
            <div className="relative">
              <img
                src={highestRatedProduct?.image || "https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2"}
                alt="Featured Product"
                className="w-64 h-64 object-cover rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300"
              />
              <div className="absolute -top-4 -right-4 bg-white text-orange-500 px-4 py-2 rounded-full font-bold shadow-lg">
                {highestRatedProduct ? `${parseFloat(highestRatedProduct.average_rating).toFixed(1)}★` : '4.9★'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Icons */}
      <section className="grid grid-cols-5 gap-6">
        {loading ? (
          // Loading skeleton for categories
          [...Array(5)].map((_, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-200 animate-pulse mb-3"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))
        ) : (
          categories.map((category: any, index: number) => (
            <Link key={category.id} to={`/products?category=${category.id}`} className="text-center group cursor-pointer">
              <div className={`w-16 h-16 mx-auto rounded-2xl ${getCategoryColor(index)} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
                {getCategoryIcon(category.name)}
              </div>
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {category.name}
              </span>
            </Link>
          ))
        )}
      </section>

      {/* Latest Products Needing Reviews */}
      <section className={`rounded-2xl p-8 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Latest Products Needing Reviews
          </h2>
          <Link
            to="/products"
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            // Loading skeleton for products
            [...Array(3)].map((_, index) => (
              <div key={index} className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="w-full h-40 bg-gray-200 animate-pulse"></div>
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            latestProducts.map((product: any) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                showCategory={false}
                imageClassName="w-full h-40 object-cover"
                cardClassName="rounded-2xl"
              />
            ))
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {statsIcons.map((stat, index) => (
          <div key={index} className={`rounded-2xl p-6 text-center ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            {loading ? (
              <>
                <div className="p-3 bg-gray-200 rounded-2xl inline-block mb-4 w-12 h-12 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </>
            ) : (
              <>
                <div className="p-3 bg-orange-100 rounded-2xl inline-block mb-4">
                  <stat.icon className="w-6 h-6 text-orange-500" />
                </div>
                <p className={`text-2xl font-bold mb-1 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {stat.value}
                </p>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {stat.label}
                </p>
              </>
            )}
          </div>
        ))}
      </section>
    </div>
  );
};

export default Home;