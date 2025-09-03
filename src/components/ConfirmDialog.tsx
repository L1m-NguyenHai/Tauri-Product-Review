import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onCancel}
      ></div>
      
      {/* Dialog */}
      <div 
        className={`relative rounded-lg shadow-xl transform transition-all max-w-sm w-full p-6 ${
          isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        <div className="mb-4">
          <h3 className="text-lg font-medium leading-6">{title}</h3>
          <div className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
            <p>{message}</p>
          </div>
        </div>
        
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={`inline-flex justify-center px-4 py-2 text-sm font-medium rounded-md ${
              isDark 
                ? 'text-gray-300 hover:text-white focus:ring-gray-600' 
                : 'text-gray-700 hover:text-gray-900 focus:ring-gray-300'
            } border ${isDark ? 'border-gray-600' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-offset-2`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex justify-center px-4 py-2 text-sm font-medium rounded-md text-white ${
              isLoading 
                ? 'bg-red-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
            } border border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;