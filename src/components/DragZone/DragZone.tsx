import React, { useState, useRef, DragEvent, useEffect } from 'react';
import { Upload, File, X, Image, Video } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface DragZoneProps {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  className?: string;
  title?: string;
  description?: string;
}

const DragZone: React.FC<DragZoneProps> = ({
  onFilesSelected,
  acceptedTypes = ['image/*', 'video/*'],
  maxFiles = 10,
  className = '',
  title = 'Drop files here',
  description = 'or click to browse'
}) => {
  const { isDark } = useTheme();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Handle paste events only when dropzone is focused
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only handle paste if the dropzone or its children are focused/active
      if (dropZoneRef.current && 
          (document.activeElement === dropZoneRef.current || 
           dropZoneRef.current.contains(document.activeElement))) {
        if (e.clipboardData && e.clipboardData.files.length > 0) {
          e.preventDefault();
          const files = Array.from(e.clipboardData.files);
          handleFiles(files);
        }
      }
    };

    // Add paste event listener to document
    document.addEventListener('paste', handlePaste);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [selectedFiles]); // Depend on selectedFiles to access current state

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const items = e.dataTransfer.items;
    const files: File[] = [];

    // Handle DataTransfer items (for browser drag)
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Handle files
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
        // Handle images from browser (drag from web)
        else if (item.kind === 'string' && item.type.startsWith('text/')) {
          try {
            // Try to get URL from dragged content
            const url = await new Promise<string>((resolve) => {
              item.getAsString(resolve);
            });
            
            // If it's an image URL, fetch and convert to File
            if (url && (url.startsWith('http') || url.startsWith('data:'))) {
              try {
                const response = await fetch(url);
                const blob = await response.blob();
                
                // Check if it's an image
                if (blob.type.startsWith('image/')) {
                  const fileName = url.split('/').pop() || 'dragged-image.jpg';
                  // @ts-ignore: File constructor is available in browsers
                  const file = new (window as any).File([blob], fileName, { type: blob.type });
                  files.push(file);
                }
              } catch (error) {
                console.warn('Failed to fetch dragged image:', error);
              }
            }
          } catch (error) {
            console.warn('Failed to process dragged content:', error);
          }
        }
      }
    }
    
    // Fallback to files from dataTransfer
    if (files.length === 0 && e.dataTransfer.files.length > 0) {
      files.push(...Array.from(e.dataTransfer.files));
    }

    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      return acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });
    });

    const limitedFiles = validFiles.slice(0, maxFiles - selectedFiles.length);
    const newFiles = [...selectedFiles, ...limitedFiles];
    
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    } else if (file.type.startsWith('video/')) {
      return <Video className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        ref={dropZoneRef}
        tabIndex={0}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : isDark
              ? 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-750'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          aria-label="Select files to upload"
        />
        
        <div className={`transition-all duration-300 ${isDragOver ? 'scale-110' : ''}`}>
          <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${
            isDragOver 
              ? 'text-blue-500' 
              : isDark 
                ? 'text-gray-400' 
                : 'text-gray-500'
          }`} />
          
          <h3 className={`text-lg font-semibold mb-2 transition-colors ${
            isDragOver 
              ? 'text-blue-600 dark:text-blue-400' 
              : isDark 
                ? 'text-white' 
                : 'text-gray-900'
          }`}>
            {title}
          </h3>
          
          <p className={`text-sm transition-colors ${
            isDragOver 
              ? 'text-blue-500 dark:text-blue-300' 
              : isDark 
                ? 'text-gray-400' 
                : 'text-gray-600'
          }`}>
            {description} • Ctrl+V to paste
          </p>
          
          <p className={`text-xs mt-2 transition-colors ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Supports: {acceptedTypes.join(', ')} • Max {maxFiles} files
          </p>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className={`rounded-lg p-4 ${
          isDark ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <h4 className={`text-sm font-medium mb-3 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Selected Files ({selectedFiles.length})
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className={`relative group rounded-lg border overflow-hidden transition-colors ${
                  isDark 
                    ? 'border-gray-600 bg-gray-800' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                {/* Image Preview */}
                {file.type.startsWith('image/') ? (
                  <div className="aspect-square relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onLoad={(e) => {
                        // Clean up object URL after loading
                        const img = e.target as HTMLImageElement;
                        setTimeout(() => URL.revokeObjectURL(img.src), 1000);
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
                  </div>
                ) : (
                  /* Non-image file preview */
                  <div className="aspect-square flex flex-col items-center justify-center p-4">
                    <div className="text-blue-500 mb-2">
                      {getFileIcon(file)}
                    </div>
                    <p className={`text-xs text-center ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {file.type || 'Unknown'}
                    </p>
                  </div>
                )}
                
                {/* File Info Overlay */}
                <div className={`absolute bottom-0 left-0 right-0 p-2 ${
                  isDark ? 'bg-gray-900 bg-opacity-90' : 'bg-white bg-opacity-90'
                } backdrop-blur-sm`}>
                  <p className={`text-xs font-medium truncate ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {file.name}
                  </p>
                  <p className={`text-xs ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {formatFileSize(file.size)}
                  </p>
                </div>
                
                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-90 hover:scale-100"
                  title="Remove file"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DragZone;