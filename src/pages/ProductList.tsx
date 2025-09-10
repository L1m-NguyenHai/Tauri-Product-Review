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

// Calculate discount percentage
const calculateDiscount = (originalPrice: number, currentPrice: number): number => {
  if (!originalPrice || originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};

interface ProductListProps {
  searchQuery: string;
  selectedCategory: string;
  sortBy: string;
  viewMode: 'grid' | 'list';
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

const ProductList: React.FC<ProductListProps> = ({
  searchQuery,
  selectedCategory,
  sortBy,
  viewMode,
  currentPage,
  setCurrentPage
}) => {
  const { isDark } = useTheme();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const productsPerPage = 8; // Adjust this number as needed

  useEffect(() => {
      const fetchProducts = async () => {
        setLoading(true);
        try {
          // Nếu sortBy là 'rating', chuyển thành 'average_rating' khi gọi API
          const apiSortBy = sortBy === 'rating' ? 'average_rating' : sortBy;
          const response = await axios.get('http://127.0.0.1:8000/api/v1/products', {
            params: {
              search: searchQuery,
              category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
              sort_by: apiSortBy,
              limit: productsPerPage,
              offset: (currentPage - 1) * productsPerPage
            }
          });
          setProducts(response.data.items);
          // Calculate total pages based on total count
          const totalCount = response.data.total || 0;
          setTotalPages(Math.ceil(totalCount / productsPerPage));
        } catch (error) {
          console.error('Error fetching products:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchProducts();
    }, [searchQuery, selectedCategory, sortBy, currentPage]);

  const ProductCard = ({ product }: { product: any }) => (
    <Link
      to={`/products/${product.id}`}
      className={`block rounded-lg overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}
    >
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-contain p-2"
        />
        {/* Stock indicator, similar to reference image */}
        <div className="absolute top-2 right-2">
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
            Còn hàng
          </span>
        </div>
      </div>
      
      <div className="p-3">
        {/* Category name */}
        <div className="text-xs text-gray-500 mb-1">
          {product.category_name}
        </div>
        {/* Product name */}
        <h3 className={`font-semibold text-xs ${
          isDark ? 'text-white' : 'text-gray-900'
        } truncate mb-2`}>
          {product.name}
        </h3>
        {/* Price section */}
        <div className="flex items-start gap-2 mb-2">
          <span className={`text-sm font-bold ${
            isDark ? 'text-green-400' : 'text-green-600'
          }`}>
            {formatPrice(product.price)}
          </span>
          {product.original_price && product.original_price > product.price && (
            <>
              <span className={`text-xs line-through ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {formatPrice(product.original_price)}
              </span>
              <span className="text-xs text-red-500">
                (-{calculateDiscount(product.original_price, product.price)}%)
              </span>
            </>
          )}
        </div>
        {/* Rating and review count */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < Math.floor(Number(product.average_rating)) ? 'bg-yellow-400' : 'bg-gray-300'
                }`}
              />
            ))}
            <span className={`text-xs font-medium ml-1 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {Number(product.average_rating).toFixed(2)}
            </span>
          </div>
          <span className={`text-xs ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            ({product.review_count} đánh giá)
          </span>
        </div>
      </div>
    </Link>
  );

  const ProductListItem = ({ product }: { product: any }) => (
    <Link
      to={`/products/${product.id}`}
      className={`block rounded-lg p-4 transition-colors hover:${
        isDark ? 'bg-gray-700' : 'bg-gray-50'
      } ${isDark ? 'bg-gray-800' : 'bg-white'}`}
    >
      <div className="flex gap-4">
        <div className="relative">
          <img
            src={product.image}
            alt={product.name}
            className="w-24 h-24 object-contain rounded-lg"
          />
          {/* Stock indicator */}
          <div className="absolute top-0 right-0">
            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
              Còn hàng
            </span>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              {/* Product code */}
              <div className="text-xs text-gray-500 mb-1">
                Mã: {product.id}
              </div>
              
              {/* Product name */}
              <h3 className={`font-semibold text-sm ${
                isDark ? 'text-white' : 'text-gray-900'
              } truncate mb-1`}>
                {product.name}
              </h3>
              
              {/* Category */}
              <span className="text-xs text-gray-500 mb-2 block">
                {product.category_name || product.category}
              </span>
            </div>
            
            <div className="flex flex-col items-end">
              {/* Current price */}
              <span className={`text-base font-bold ${
                isDark ? 'text-green-400' : 'text-green-600'
              }`}>
                {formatPrice(product.price)}
              </span>
              
              {/* Original price and discount */}
              {product.original_price && product.original_price > product.price && (
                <>
                  <span className={`text-xs line-through ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {formatPrice(product.original_price)}
                  </span>
                  <span className="text-xs text-red-500">
                    (-{calculateDiscount(product.original_price, product.price)}%)
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* Cart button */}
          <div className="flex justify-end mt-2">
            <button className="bg-green-100 rounded-full p-1.5 text-green-600 hover:bg-green-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo(0, 0);
  };

  // Pagination component
  const Pagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <div className="flex justify-center mt-8">
        <div className="flex items-center gap-2">
          {/* Previous button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${
              currentPage === 1 
                ? `${isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'}`
                : `${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`
            }`}
          >
            &lt;
          </button>
          
          {/* Page numbers */}
          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className={`px-3 py-1 rounded ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                1
              </button>
              {startPage > 2 && <span className="text-gray-400">...</span>}
            </>
          )}
          
          {pages.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded ${
                currentPage === page 
                  ? `${isDark ? 'bg-blue-600' : 'bg-blue-500'} text-white` 
                  : `${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`
              }`}
            >
              {page}
            </button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
              <button
                onClick={() => handlePageChange(totalPages)}
                className={`px-3 py-1 rounded ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {totalPages}
              </button>
            </>
          )}
          
          {/* Next button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded ${
              currentPage === totalPages 
                ? `${isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'}`
                : `${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`
            }`}
          >
            &gt;
          </button>
        </div>
      </div>
    );
  };

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
      
      {/* Pagination */}
      {totalPages > 1 && <Pagination />}
    </div>
  );
};

export default ProductList;