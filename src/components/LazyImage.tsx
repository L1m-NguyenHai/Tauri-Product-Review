import React, { useState, useRef, useEffect } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fadeIn?: boolean;
  placeholder?: string;
}

const LazyImage: React.FC<LazyImageProps> = React.memo(
  ({ src, alt, className = "", fadeIn = true, placeholder }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [error, setError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
      // Reset state when src changes
      setIsLoaded(false);
      setError(false);

      // Intersection Observer for lazy loading
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        {
          rootMargin: "50px", // Load image when it's 50px away from viewport
        }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }, [src]);

    const handleLoad = () => {
      setIsLoaded(true);
    };

    const handleError = () => {
      setError(true);
    };

    return (
      <div
        ref={imgRef}
        className={`${className} ${
          isLoaded ? "" : "bg-gray-200 dark:bg-gray-700"
        }`}
      >
        {isInView && !error && (
          <img
            src={src}
            alt={alt}
            className={`${className} ${
              fadeIn ? (isLoaded ? "opacity-100" : "opacity-0") : ""
            } transition-opacity duration-300`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
          />
        )}
        {placeholder && !isInView && !error && (
          <div
            className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}
          >
            <span className="text-gray-400 text-sm">Loading...</span>
          </div>
        )}
        {error && (
          <div
            className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-12 h-12 text-gray-400 dark:text-gray-500"
            >
              <path
                fillRule="evenodd"
                d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
    );
  }
);

LazyImage.displayName = "LazyImage";

export default LazyImage;
