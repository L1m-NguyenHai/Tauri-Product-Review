import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicAPI } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";

// Utility functions memoized outside component to prevent recreation
const formatPrice = (price: number | string): string => {
  if (typeof price === "string") {
    price = parseFloat(price);
  }

  // Remove decimal part and format with thousand separators
  return (
    Math.floor(price)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ"
  );
};

const calculateDiscount = (
  originalPrice: number,
  currentPrice: number
): number => {
  if (!originalPrice || originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};

// Debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface ProductListProps {
  searchQuery: string;
  selectedCategory: string;
  sortBy: string;
  viewMode: "grid" | "list";
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

const ProductList: React.FC<ProductListProps> = ({
  searchQuery,
  selectedCategory,
  sortBy,
  viewMode,
  currentPage,
  setCurrentPage,
}) => {
  const { isDark } = useTheme();
  const productsPerPage = 8;

  // Debounce search query to reduce API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Convert sortBy to API format
  const apiSortBy =
    sortBy === "rating"
      ? "average_rating"
      : sortBy === "created_at"
      ? "created_at"
      : sortBy;

  // Fetch products with React Query (automatic caching, deduplication)
  const { data: productsData, isLoading: loading } = useQuery({
    queryKey: [
      "products",
      "list",
      {
        search: debouncedSearchQuery,
        category: selectedCategory,
        sortBy: apiSortBy,
        page: currentPage,
      },
    ],
    queryFn: () =>
      publicAPI.getProducts({
        search: debouncedSearchQuery,
        category_id: selectedCategory !== "all" ? selectedCategory : undefined,
        sort_by: apiSortBy,
        sort_order: sortBy === "created_at" ? "desc" : "desc",
        limit: productsPerPage,
        offset: (currentPage - 1) * productsPerPage,
      }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });

  const products = productsData?.items || [];
  const totalPages = Math.ceil((productsData?.total || 0) / productsPerPage);

  // Memoize ProductListItem component to prevent unnecessary re-renders
  const ProductListItem = React.memo(({ product }: { product: any }) => {
    const formattedPrice = useMemo(
      () => formatPrice(product.price),
      [product.price]
    );
    const productImage = useMemo(
      () =>
        (product.images &&
          product.images.length > 0 &&
          product.images[0].image_url) ||
        product.display_image ||
        "https://images.pexels.com/photos/2115256/pexels-photo-2115256.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2",
      [product.images, product.display_image]
    );

    return (
      <Link
        to={`/products/${product.id}`}
        className={`block rounded-lg p-4 transition-colors hover:${
          isDark ? "bg-gray-700" : "bg-gray-50"
        } ${isDark ? "bg-gray-800" : "bg-white"}`}
      >
        <div className="flex gap-4">
          <div className="relative">
            <img
              src={productImage}
              alt={product.name}
              className="w-24 h-24 object-contain rounded-lg"
              loading="lazy"
            />
            {/* Availability indicator */}
            <div className="absolute top-0 right-0">
              {product.availability === "Available" && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Available
                </span>
              )}
              {product.availability === "Out of Stock" && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  Out of Stock
                </span>
              )}
              {product.availability === "Pre-order" && (
                <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                  Pre-order
                </span>
              )}
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
                <h3
                  className={`font-semibold text-sm ${
                    isDark ? "text-white" : "text-gray-900"
                  } truncate mb-1`}
                >
                  {product.name}
                </h3>

                {/* Category */}
                <span className="text-xs text-gray-500 mb-2 block">
                  {product.category_name || product.category}
                </span>
              </div>

              <div className="flex flex-col items-end">
                {/* Current price */}
                <span
                  className={`text-base font-bold ${
                    isDark ? "text-green-400" : "text-green-600"
                  }`}
                >
                  {formattedPrice}
                </span>

                {/* Original price and discount */}
                {product.original_price &&
                  product.original_price > product.price && (
                    <>
                      <span
                        className={`text-xs line-through ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {formatPrice(product.original_price)}
                      </span>
                      <span className="text-xs text-red-500">
                        (-
                        {calculateDiscount(
                          product.original_price,
                          product.price
                        )}
                        %)
                      </span>
                    </>
                  )}
              </div>
            </div>

            {/* Cart button */}
            <div className="flex justify-end mt-2">
              <button className="bg-green-100 rounded-full p-1.5 text-green-600 hover:bg-green-200 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  });

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      // Scroll to top when changing pages
      window.scrollTo(0, 0);
    },
    [setCurrentPage]
  );

  // Pagination component - memoized to prevent unnecessary re-renders
  const Pagination = React.memo(() => {
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
                ? `${
                    isDark
                      ? "bg-gray-700 text-gray-500"
                      : "bg-gray-200 text-gray-400"
                  }`
                : `${
                    isDark
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-blue-500 hover:bg-blue-600"
                  } text-white`
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
                  isDark
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                1
              </button>
              {startPage > 2 && <span className="text-gray-400">...</span>}
            </>
          )}

          {pages.map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded ${
                currentPage === page
                  ? `${isDark ? "bg-blue-600" : "bg-blue-500"} text-white`
                  : `${
                      isDark
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`
              }`}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="text-gray-400">...</span>
              )}
              <button
                onClick={() => handlePageChange(totalPages)}
                className={`px-3 py-1 rounded ${
                  isDark
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
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
                ? `${
                    isDark
                      ? "bg-gray-700 text-gray-500"
                      : "bg-gray-200 text-gray-400"
                  }`
                : `${
                    isDark
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-blue-500 hover:bg-blue-600"
                  } text-white`
            }`}
          >
            &gt;
          </button>
        </div>
      </div>
    );
  });

  if (loading) {
    return <LoadingSpinner fullScreen={false} message="Loading products..." />;
  }

  if (products.length === 0) {
    return (
      <div
        className={`text-center py-12 ${
          isDark ? "text-gray-400" : "text-gray-500"
        }`}
      >
        <p className="text-lg">No products found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results */}
      <div
        className={`${
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            : "space-y-4"
        }`}
      >
        {products.map((product) =>
          viewMode === "grid" ? (
            <ProductCard key={product.id} product={product} />
          ) : (
            <ProductListItem key={product.id} product={product} />
          )
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && <Pagination />}
    </div>
  );
};

export default ProductList;
