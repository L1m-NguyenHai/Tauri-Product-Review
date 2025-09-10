import React from 'react';
import { Star } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ReviewerBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const ReviewerBadge: React.FC<ReviewerBadgeProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '' 
}) => {
  const { isDark } = useTheme();
  
  const sizeClasses = {
    sm: {
      star: 'w-3 h-3',
      text: 'text-xs px-1.5 py-0.5',
      gap: 'gap-1'
    },
    md: {
      star: 'w-4 h-4', 
      text: 'text-xs px-2 py-0.5',
      gap: 'gap-1'
    },
    lg: {
      star: 'w-5 h-5',
      text: 'text-sm px-2.5 py-1',
      gap: 'gap-2'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center ${currentSize.gap} ${className}`}>
      <div className="relative group">
        <Star className={`${currentSize.star} fill-blue-500 text-blue-500`} />
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          Người đánh giá chuyên nghiệp
        </div>
      </div>
      {showText && (
        <span className={`${currentSize.text} rounded-full font-medium ${
          isDark 
            ? 'bg-blue-900/30 text-blue-400' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          Reviewer
        </span>
      )}
    </div>
  );
};

export default ReviewerBadge;