import React, { useState } from 'react';
import { Star, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import DragZone from '../DragZone/DragZone';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    image: string;
  };
  onSubmit: (reviewData: any) => Promise<void>;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, product, onSubmit }) => {
  const { isDark } = useTheme();

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pros, setPros] = useState(['']);
  const [cons, setCons] = useState(['']);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const totalSteps = 3;

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setRating(0);
      setTitle('');
      setContent('');
      setPros(['']);
      setCons(['']);
      setMediaFiles([]);
      setLoading(false);
    }
  }, [isOpen]);

  const handleAddPro = () => {
    setPros([...pros, '']);
  };

  const handleRemovePro = (index: number) => {
    if (pros.length > 1) {
      setPros(pros.filter((_, i) => i !== index));
    }
  };

  const handleAddCon = () => {
    setCons([...cons, '']);
  };

  const handleRemoveCon = (index: number) => {
    if (cons.length > 1) {
      setCons(cons.filter((_, i) => i !== index));
    }
  };

  const handleMediaFiles = (files: File[]) => {
    setMediaFiles(files);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return rating > 0 && title.trim() !== '' && content.trim() !== '';
      case 2:
        return true; // Pros and cons are optional
      case 3:
        return true; // Media is optional
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!canProceedToNextStep()) return;

    setLoading(true);
    
    try {
      const reviewData = {
        productId: product.id,
        rating,
        title,
        content,
        pros: pros.filter(pro => pro.trim() !== ''),
        cons: cons.filter(con => con.trim() !== ''),
        mediaFiles
      };

      await onSubmit(reviewData);
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Write a Review
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>

          {/* Product Info */}
          <div className="flex items-center gap-4 mb-6">
            <img
              src={product.image}
              alt={product.name}
              className="w-12 h-12 object-cover rounded-lg"
            />
            <div>
              <h3 className={`font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {product.name}
              </h3>
              <p className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Share your experience with this product
              </p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === currentStep
                    ? 'bg-blue-500 text-white'
                    : step < currentStep
                    ? 'bg-green-500 text-white'
                    : isDark
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-8 h-0.5 ${
                    step < currentStep ? 'bg-green-500' : isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex justify-between mt-2 text-xs">
            <span className={currentStep >= 1 ? 'text-blue-500' : isDark ? 'text-gray-400' : 'text-gray-600'}>
              Rating & Review
            </span>
            <span className={currentStep >= 2 ? 'text-blue-500' : isDark ? 'text-gray-400' : 'text-gray-600'}>
              Pros & Cons
            </span>
            <span className={currentStep >= 3 ? 'text-blue-500' : isDark ? 'text-gray-400' : 'text-gray-600'}>
              Media
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Rating, Title, Content */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Rating */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Overall Rating *
                </h3>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className={`ml-4 text-lg font-medium ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {rating > 0 ? `${rating}/5` : 'Select a rating'}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Review Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                  placeholder="Summarize your review in one sentence"
                />
              </div>

              {/* Content */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Detailed Review *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                  placeholder="Share your detailed thoughts about this product..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Pros and Cons */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className={`text-lg font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Pros and Cons (Optional)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pros */}
                <div>
                  <h4 className={`text-md font-medium mb-3 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Pros
                  </h4>
                  <div className="space-y-3">
                    {pros.map((pro, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={pro}
                          onChange={(e) => {
                            const newPros = [...pros];
                            newPros[index] = e.target.value;
                            setPros(newPros);
                          }}
                          className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="What did you like?"
                        />
                        {pros.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePro(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddPro}
                      className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                    >
                      + Add another pro
                    </button>
                  </div>
                </div>

                {/* Cons */}
                <div>
                  <h4 className={`text-md font-medium mb-3 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Cons
                  </h4>
                  <div className="space-y-3">
                    {cons.map((con, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={con}
                          onChange={(e) => {
                            const newCons = [...cons];
                            newCons[index] = e.target.value;
                            setCons(newCons);
                          }}
                          className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="What could be improved?"
                        />
                        {cons.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCon(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddCon}
                      className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                    >
                      + Add another con
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Media Upload */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className={`text-lg font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Add Media (Optional)
              </h3>
              
              <DragZone
                onFilesSelected={handleMediaFiles}
                acceptedTypes={['image/*', 'video/*']}
                maxFiles={10}
                title="Upload Photos & Videos"
                description="Drag and drop your media files here or click to browse"
              />

              {mediaFiles.length > 0 && (
                <div className="mt-4">
                  <p className={`text-sm mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Selected files: {mediaFiles.length}
                  </p>
                  <div className="space-y-1">
                    {mediaFiles.map((file, index) => (
                      <div key={index} className={`text-xs ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {file.name} ({Math.round(file.size / 1024)} KB)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex justify-between">
            <button
              onClick={currentStep === 1 ? onClose : handlePrev}
              className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                isDark 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {currentStep === 1 ? (
                'Cancel'
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 inline mr-1" />
                  Previous
                </>
              )}
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={!canProceedToNextStep()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !canProceedToNextStep()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Publishing...' : 'Publish Review'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;