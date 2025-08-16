import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ProductListProps {
  searchQuery: string;
  selectedCategory: string;
  sortBy: string;
  viewMode: 'grid' | 'list';
}

const ProductList: React.FC<ProductListProps> = ({
  searchQuery,
  selectedCategory,
  sortBy,
  viewMode
}) => {
  const { isDark } = useTheme();

  const products = [
    {
      id: '1',
      name: 'iPhone 15 Pro',
      category: 'smartphones',
      rating: 4.8,
      reviews: 1234,
      image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2',
      price: '$999',
      description: 'Latest iPhone with titanium design and A17 Pro chip'
    },
    {
      id: '2',
      name: 'MacBook Pro M3',
      category: 'laptops',
      rating: 4.9,
      reviews: 856,
      image: 'https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2',
      price: '$1,999',
      description: 'Powerful laptop with M3 chip for professional workflows'
    },
    {
      id: '3',
      name: 'Sony WH-1000XM5',
      category: 'audio',
      rating: 4.7,
      reviews: 542,
      image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2',
      price: '$399',
      description: 'Industry-leading noise canceling wireless headphones'
    },
    {
      id: '4',
      name: 'iPad Pro M2',
      category: 'tablets',
      rating: 4.6,
      reviews: 789,
      image: 'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2',
      price: '$799',
      description: 'Professional tablet with M2 chip and Liquid Retina display'
    },
    {
      id: '5',
      name: 'Canon EOS R5',
      category: 'cameras',
      rating: 4.8,
      reviews: 423,
      image: 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2',
      price: '$3,899',
      description: 'Professional mirrorless camera with 8K video recording'
    },
    {
      id: '6',
      name: 'Steam Deck',
      category: 'gaming',
      rating: 4.5,
      reviews: 1567,
      image: 'https://images.pexels.com/photos/7915437/pexels-photo-7915437.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2',
      price: '$549',
      description: 'Portable gaming device that runs your Steam library'
    }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'price':
        return parseFloat(a.price.replace(/[$,]/g, '')) - parseFloat(b.price.replace(/[$,]/g, ''));
      case 'reviews':
        return b.reviews - a.reviews;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const ProductCard = ({ product }: { product: any }) => (
    <Link
      to={`/products/${product.id}`}
      className={`block rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}
    >
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-40 object-cover"
      />
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-orange-500 font-medium capitalize">
            {product.category}
          </span>
          <span className={`text-sm font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {product.price}
          </span>
        </div>
        <h3 className={`font-semibold mb-3 text-sm ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {product.name}
        </h3>
        <p className={`text-xs mb-3 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {product.description}
        </p>
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
          <span className={`text-xs ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            ({product.reviews} reviews)
          </span>
        </div>
      </div>
    </Link>
  );

  const ProductListItem = ({ product }: { product: any }) => (
    <Link
      to={`/products/${product.id}`}
      className={`block rounded-2xl p-6 transition-colors hover:${
        isDark ? 'bg-gray-700' : 'bg-gray-50'
      } ${isDark ? 'bg-gray-800' : 'bg-white'}`}
    >
      <div className="flex gap-4">
        <img
          src={product.image}
          alt={product.name}
          className="w-20 h-20 object-cover rounded-xl"
        />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-orange-500 font-medium capitalize">
                {product.category}
              </span>
              <h3 className={`font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {product.name}
              </h3>
              <p className={`text-sm mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {product.description}
              </p>
            </div>
            <span className={`text-lg font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {product.price}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-3">
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
            <span className={`text-xs ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              ({product.reviews} reviews)
            </span>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-2xl p-8 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h1 className={`text-3xl font-bold mb-4 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Tech Products
        </h1>
        <p className={`${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Use the sidebar filters to search and sort products
        </p>
      </div>

      {/* Results */}
      <div className={`${
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
          : 'space-y-4'
      }`}>
        {sortedProducts.map(product => (
          viewMode === 'grid' 
            ? <ProductCard key={product.id} product={product} />
            : <ProductListItem key={product.id} product={product} />
        ))}
      </div>

      {sortedProducts.length === 0 && (
        <div className={`text-center py-12 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <p className="text-lg">No products found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default ProductList;