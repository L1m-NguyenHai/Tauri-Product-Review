import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import DragZone from '../components/DragZone/DragZone';

const ReviewPage: React.FC = () => {
  const { productId } = useParams();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pros, setPros] = useState(['']);
  const [cons, setCons] = useState(['']);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock product data
  const product = {
    id: '1',
    name: 'iPhone 15 Pro',
    image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2'
  };

  const handleAddPro = () => {
    setPros([...pros, '']);
  };

  const handleRemovePro = (index: number) => {
    setPros(pros.filter((_, i) => i !== index));
  };

  const handleAddCon = () => {
    setCons([...cons, '']);
  };

  const handleRemoveCon = (index: number) => {
    setCons(cons.filter((_, i) => i !== index));
  };

  const handleMediaFiles = (files: File[]) => {
    setMediaFiles(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      navigate(`/products/${productId}`);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className={`rounded-xl p-6 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } shadow-sm`}>
        <h1 className={`text-3xl font-bold mb-4 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Write a Review
        </h1>
        
        <div className="flex items-center gap-4">
          <img
            src={product.image}
            alt={product.name}
            className="w-16 h-16 object-cover rounded-lg"
          />
          <div>
            <h2 className={`text-xl font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {product.name}
            </h2>
            <p className={`${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Share your experience with this product
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div className={`rounded-xl p-6 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Overall Rating
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

        {/* Review Content */}
        <div className={`rounded-xl p-6 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-sm`}>
          <div className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Review Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                placeholder="Summarize your review in one sentence"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Detailed Review
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
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
        </div>

        {/* Pros and Cons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`rounded-xl p-6 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } shadow-sm`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Pros
            </h3>
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

          <div className={`rounded-xl p-6 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } shadow-sm`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Cons
            </h3>
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

        {/* Media Upload */}
        <div className={`rounded-xl p-6 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Media (Optional)
          </h3>
          
          <DragZone
            onFilesSelected={handleMediaFiles}
            acceptedTypes={['image/*', 'video/*']}
            maxFiles={10}
            title="Upload Photos & Videos"
            description="Drag and drop your media files here or click to browse"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate(`/products/${productId}`)}
            className={`px-6 py-3 rounded-lg border font-medium transition-colors ${
              isDark 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Publishing...' : 'Publish Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewPage;