import React, { useState, useRef, DragEvent } from 'react';
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

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
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
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-300 ease-in-out transform
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105' 
            : isDark 
              ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${isDragOver ? 'shadow-lg' : 'hover:shadow-md'}
        `}
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
            {description}
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
          
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  isDark 
                    ? 'border-gray-600 bg-gray-800 hover:bg-gray-750' 
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-blue-500">
                    {getFileIcon(file)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
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
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-1 text-red-500 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
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