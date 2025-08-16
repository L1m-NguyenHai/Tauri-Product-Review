import React from 'react';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, Users, Award } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Home: React.FC = () => {
  const { isDark } = useTheme();

  const featuredProducts = [
    {
      id: '1',
      name: 'iPhone 15 Pro',
      category: 'Smartphones',
      rating: 4.8,
      reviews: 1234,
      image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2',
      price: '$999'
    },
    {
      id: '2',
      name: 'MacBook Pro M3',
      category: 'Laptops',
      rating: 4.9,
      reviews: 856,
      image: 'https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2',
      price: '$1,999'
    },
    {
      id: '3',
      name: 'Sony WH-1000XM5',
      category: 'Audio',
      rating: 4.7,
      reviews: 542,
      image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2',
      price: '$399'
    }
  ];

  const stats = [
    { icon: Star, label: 'Total Reviews', value: '15,234' },
    { icon: TrendingUp, label: 'Products Reviewed', value: '2,890' },
    { icon: Users, label: 'Active Users', value: '45,678' },
    { icon: Award, label: 'Expert Reviewers', value: '234' }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section - Deal of the Day Style */}
      <section className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-orange-500 to-orange-400 shadow-xl">
        <div className="flex items-center justify-between p-8 lg:p-12">
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                Review of the<br />
                Week
              </h1>
              <p className="text-orange-100 text-lg">
                Discover the latest tech through expert reviews
              </p>
            </div>
            <button className="bg-white text-orange-500 hover:bg-orange-50 px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg">
              Read Now
            </button>
          </div>
          <div className="hidden lg:block">
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2"
                alt="Featured Product"
                className="w-64 h-64 object-cover rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300"
              />
              <div className="absolute -top-4 -right-4 bg-white text-orange-500 px-4 py-2 rounded-full font-bold shadow-lg">
                4.9★
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Icons */}
      <section className="grid grid-cols-5 gap-6">
        {[
          { icon: '📱', label: 'Phones', color: 'bg-blue-100 text-blue-600' },
          { icon: '💻', label: 'Laptops', color: 'bg-green-100 text-green-600' },
          { icon: '🎧', label: 'Audio', color: 'bg-purple-100 text-purple-600' },
          { icon: '⌚', label: 'Wearables', color: 'bg-red-100 text-red-600' },
          { icon: '🎮', label: 'Gaming', color: 'bg-yellow-100 text-yellow-600' }
        ].map((category, index) => (
          <div key={index} className="text-center group cursor-pointer">
            <div className={`w-16 h-16 mx-auto rounded-2xl ${category.color} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
              {category.icon}
            </div>
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {category.label}
            </span>
          </div>
        ))}
      </section>

      {/* Trending Products */}
      <section className={`rounded-2xl p-8 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Trending Products
          </h2>
          <Link
            to="/products"
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className={`block rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 ${
                isDark ? 'bg-gray-700' : 'bg-white'
              }`}
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-40 object-cover"
              />
              <div className="p-5">
                <h3 className={`font-semibold mb-2 text-sm ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {product.name}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < Math.floor(product.rating) ? 'bg-yellow-400' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                    <span className={`text-xs font-medium ml-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {product.rating}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-lg font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {product.price}
                  </span>
                  <span className={`text-xs ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {product.reviews} reviews
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`rounded-2xl p-6 text-center ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
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
          </div>
        ))}
      </section>
    </div>
  );
};

export default Home;