import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface Product {
  id: string;
  name: string;
  image: string;
  price: number | string;
  original_price?: number | string;
  availability: string;
  category_name?: string;
  average_rating: number | string;
  review_count: number;
}

interface ProductCardProps {
  product: Product;
  showCategory?: boolean;
  imageClassName?: string;
  cardClassName?: string;
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

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  showCategory = true,
  imageClassName = "w-full h-48 object-contain p-2",
  cardClassName = ""
}) => {
  const { isDark } = useTheme();

  return (
    <Link
      to={`/products/${product.id}`}
      className={`block rounded-lg overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } ${cardClassName}`}
    >
      <div className="relative">
        <img
          src={product.image || 'https://images.pexels.com/photos/2115256/pexels-photo-2115256.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2'}
          alt={product.name}
          className={imageClassName}
        />
        {/* Availability indicator */}
        <div className="absolute top-2 right-2">
          {product.availability === 'Available' && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Available
            </span>
          )}
          {product.availability === 'Out of Stock' && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              Out of Stock
            </span>
          )}
          {product.availability === 'Pre-order' && (
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              Pre-order
            </span>
          )}
        </div>
      </div>
      
      <div className="p-3">
        {/* Category name */}
        {showCategory && product.category_name && (
          <div className="text-xs text-gray-500 mb-1">
            {product.category_name}
          </div>
        )}
        
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
                (-{calculateDiscount(Number(product.original_price), Number(product.price))}%)
              </span>
            </>
          )}
        </div>
        
        {/* Rating and review count */}
        <div className="flex items-center gap-2 mt-2">
          {product.review_count === 0 ? (
            <span className={`text-xs font-medium ${
              isDark ? 'text-orange-400' : 'text-orange-600'
            }`}>
              🔍 Needs Review
            </span>
          ) : (
            <>
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
                  {Number(product.average_rating).toFixed(1)}
                </span>
              </div>
              <span className={`text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                ({product.review_count} đánh giá)
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;