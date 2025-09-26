import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "white";
  fullScreen?: boolean;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(
  ({
    size = "md",
    color = "primary",
    fullScreen = false,
    message = "Loading...",
  }) => {
    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-6 h-6",
      lg: "w-8 h-8",
    };

    const colorClasses = {
      primary: "text-blue-600 dark:text-blue-400",
      secondary: "text-gray-600 dark:text-gray-400",
      white: "text-white",
    };

    const spinner = (
      <div className="flex flex-col items-center justify-center gap-3">
        <Loader2
          className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
        />
        {message && (
          <p
            className={`text-sm ${
              color === "white"
                ? "text-white"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    );

    if (fullScreen) {
      return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
          {spinner}
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center p-8">{spinner}</div>
    );
  }
);

LoadingSpinner.displayName = "LoadingSpinner";

export default LoadingSpinner;
