import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
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
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/v1/products', {
          params: {
            search: searchQuery,
            category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
            sort_by: sortBy,
            limit: 20,
            offset: 0
          }
        });
        setProducts(response.data.items);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery, selectedCategory, sortBy]);

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
            {product.category_name}
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
                  i < Math.floor(product.average_rating) ? 'bg-yellow-400' : 'bg-gray-300'
                }`}
              />
            ))}
            <span className={`text-xs font-medium ml-1 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {product.average_rating}
            </span>
          </div>
          <span className={`text-xs ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            ({product.review_count} reviews)
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

  if (loading) {
    return <div className="text-center py-12">Loading products...</div>;
  }

  if (products.length === 0) {
    return (
      <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        <p className="text-lg">No products found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-2xl p-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <h1 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Tech Products
        </h1>
        <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Use the sidebar filters to search and sort products
        </p>
      </div>

      {/* Results */}
      <div className={`${
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
          : 'space-y-4'
      }`}>
        {products.map(product => (
          viewMode === 'grid'
            ? <ProductCard key={product.id} product={product} />
            : <ProductListItem key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductList;