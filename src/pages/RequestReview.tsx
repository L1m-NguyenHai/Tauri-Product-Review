import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Link, DollarSign, Tag, FileText, Send } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const RequestReview: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState({
    productName: '',
    manufacturer: '',
    category: '',
    productUrl: '',
    price: '',
    availability: '',
    description: '',
    reasoning: '',
    contactEmail: user?.email || ''
  });
  const [loading, setLoading] = useState(false);

  const categories = [
    'Smartphones',
    'Laptops',
    'Tablets',
    'Audio',
    'Cameras',
    'Gaming',
    'Wearables',
    'Smart Home',
    'Accessories',
    'Other'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // Show success message and redirect
      navigate('/');
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
          Request a Product Review
        </h1>
        <p className={`text-lg ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Suggest a tech product for our expert team to review. We'll consider all submissions and reach out if we decide to review your suggestion.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Information */}
        <div className={`rounded-xl p-6 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-sm`}>
          <h2 className={`text-xl font-semibold mb-6 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Product Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Product Name *
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                  placeholder="e.g., iPhone 15 Pro Max"
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Manufacturer *
              </label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                placeholder="e.g., Apple, Samsung, Sony"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Category *
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Estimated Price
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                  placeholder="e.g., $999, €850, £799"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Product URL
              </label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  name="productUrl"
                  value={formData.productUrl}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                  placeholder="Official product page or announcement"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Availability
              </label>
              <input
                type="text"
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                placeholder="e.g., Available now, Coming Q2 2024, Pre-order only"
              />
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className={`rounded-xl p-6 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-sm`}>
          <h2 className={`text-xl font-semibold mb-6 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Additional Details
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Product Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                placeholder="Briefly describe the product, its key features, and what makes it noteworthy..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Why should we review this product? *
              </label>
              <textarea
                name="reasoning"
                value={formData.reasoning}
                onChange={handleChange}
                required
                rows={4}
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                placeholder="Tell us why this product would be valuable to review. Is it innovative? Does it solve a unique problem? Is there high demand for information about it?"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Contact Email *
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                placeholder="We'll use this to contact you if we decide to review the product"
              />
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className={`rounded-xl p-6 border ${
          isDark ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex gap-3">
            <FileText className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className={`font-medium ${
                isDark ? 'text-blue-300' : 'text-blue-900'
              }`}>
                Review Process
              </h3>
              <p className={`text-sm mt-1 ${
                isDark ? 'text-blue-200' : 'text-blue-700'
              }`}>
                Our editorial team reviews all submissions. Due to high volume, we can't guarantee a response to every request, but we do read them all. Priority is given to innovative products with broad consumer interest.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/')}
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
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequestReview;