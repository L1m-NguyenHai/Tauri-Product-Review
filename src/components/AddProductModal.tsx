import React, { useState, useEffect } from 'react';
import { X, Package, Loader2, Plus, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { adminAPI, type Category, type ProductInput, type ReviewRequest, type StoreLinkInput } from '../services/api';
import { useNotification } from './Notification';
import DragZone from './DragZone/DragZone';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (product: any) => void;
  reviewRequest?: ReviewRequest; // Pre-fill from review request
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onProductCreated,
  reviewRequest
}) => {
  const { isDark } = useTheme();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [formData, setFormData] = useState<ProductInput>({
    name: '',
    description: '',
    manufacturer: '',
    product_url: '',
    availability: 'Available',
    status: 'active',
    category_id: ''
  });

  const [storeLinks, setStoreLinks] = useState<StoreLinkInput[]>([]);
  const [images, setImages] = useState<File[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load categories when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      
      // Pre-fill from review request if provided
      if (reviewRequest) {
        setFormData(prev => ({
          ...prev,
          name: reviewRequest.product_name,
          manufacturer: reviewRequest.manufacturer,
          product_url: reviewRequest.product_url,
          description: `Product requested by user: ${reviewRequest.reason}`
        }));
      }
    }
  }, [isOpen, reviewRequest]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const categoriesData = await adminAPI.getAllCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load categories:', error);
      showNotification('error', 'Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  // Handle price for store links
  const handleStoreLinkPriceInput = (index: number, value: string) => {
    setStoreLinks(prev => prev.map((link, i) =>
      i === index ? { ...link, price: value === '' ? 0 : parseInt(value, 10) } : link
    ));
  };

  // Store links management
  const addStoreLink = () => {
    setStoreLinks(prev => [...prev, {
      store_name: '',
      price: 0,
      url: '',
      is_official: false
    }]);
  };

  const updateStoreLink = (index: number, field: keyof StoreLinkInput, value: any) => {
    setStoreLinks(prev => prev.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    ));
  };

  const removeStoreLink = (index: number) => {
    setStoreLinks(prev => prev.filter((_, i) => i !== index));
  };

  // For other fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required';
    }

    if (!formData.product_url.trim()) {
      newErrors.product_url = 'Product URL is required';
    } else if (!/^https?:\/\/.+/.test(formData.product_url)) {
      newErrors.product_url = 'Product URL must be a valid HTTP/HTTPS URL';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      // Calculate price from store links
      const lowestPrice = storeLinks.length > 0 
        ? Math.min(...storeLinks.filter(link => link.price > 0).map(link => link.price))
        : 0;
      
      // 1. Tạo sản phẩm với price tính từ store links
      const productData = {
        ...formData,
        price: lowestPrice
      };
      const product = await adminAPI.createProduct(productData);
      
      // 2. Upload ảnh nếu có
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          try {
            await adminAPI.uploadProductImage(product.id.toString(), images[i], i === 0);
          } catch (error) {
            console.error(`Failed to upload image ${i + 1}:`, error);
            // Try fallback to URL method if upload endpoint doesn't exist
            try {
              await adminAPI.addProductImage(product.id.toString(), { 
                image_url: URL.createObjectURL(images[i]), 
                is_primary: i === 0 
              });
            } catch (fallbackError) {
              console.error(`Fallback image upload also failed for image ${i + 1}:`, fallbackError);
              showNotification('warning', `Failed to upload image: ${images[i].name}`);
            }
          }
        }
      }
      
      // 3. Thêm store links nếu có
      if (storeLinks.length > 0) {
        for (const link of storeLinks) {
          await adminAPI.addStoreLink(product.id.toString(), link);
        }
      }
      showNotification('success', 'Product created successfully');
      onProductCreated(product);
      onClose();
      // Reset form
      setFormData({
        name: '',
        description: '',
        manufacturer: '',
        price: 0,
        product_url: '',
        availability: 'Available',
        status: 'active',
        category_id: ''
      });
      setStoreLinks([]);
      setImages([]);
      setErrors({});
    } catch (error) {
      console.error('Failed to create product:', error);
      showNotification('error', 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setErrors({});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-blue-500" />
            <h2 className={`text-xl font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {reviewRequest ? 'Create Product from Request' : 'Add New Product'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            } disabled:opacity-50`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Name */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Enter product name"
              disabled={loading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Enter product description"
              disabled={loading}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Manufacturer and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } ${errors.manufacturer ? 'border-red-500' : ''}`}
                placeholder="Enter manufacturer"
                disabled={loading}
              />
              {errors.manufacturer && (
                <p className="mt-1 text-sm text-red-500">{errors.manufacturer}</p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Category *
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                disabled={loading || loadingCategories}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } ${errors.category_id ? 'border-red-500' : ''}`}
              >
                <option value="">
                  {loadingCategories ? 'Loading categories...' : 'Select a category'}
                </option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1 text-sm text-red-500">{errors.category_id}</p>
              )}
            </div>
          </div>

          {/* Store Links */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Store Links
            </label>
            {storeLinks.map((link, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Store Name"
                  value={link.store_name}
                  onChange={e => updateStoreLink(idx, 'store_name', e.target.value)}
                  className="px-2 py-1 border rounded w-1/4"
                  disabled={loading}
                />
                <input
                  type="text"
                  placeholder="Price"
                  value={link.price === 0 ? '' : link.price}
                  onChange={e => handleStoreLinkPriceInput(idx, e.target.value)}
                  className="px-2 py-1 border rounded w-1/4"
                  disabled={loading}
                />
                <input
                  type="url"
                  placeholder="URL"
                  value={link.url}
                  onChange={e => updateStoreLink(idx, 'url', e.target.value)}
                  className="px-2 py-1 border rounded w-1/2"
                  disabled={loading}
                />
                <button type="button" onClick={() => removeStoreLink(idx)} disabled={loading} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
              </div>
            ))}
            <button type="button" onClick={addStoreLink} disabled={loading} className="flex items-center gap-1 text-blue-500 hover:text-blue-700 mt-2"><Plus size={16} /> Add Store Link</button>
          </div>

          {/* Upload Images */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Product Images
            </label>
            
            <DragZone
              onFilesSelected={(files: File[]) => setImages(files)}
              acceptedTypes={['image/*']}
              maxFiles={10}
              title="Upload Product Images"
              description="Click to upload or drag and drop"
              className="mb-4"
            />
          </div>

          {/* Product URL */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Product URL *
            </label>
            <input
              type="url"
              name="product_url"
              value={formData.product_url}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } ${errors.product_url ? 'border-red-500' : ''}`}
              placeholder="https://example.com/product"
              disabled={loading}
            />
            {errors.product_url && (
              <p className="mt-1 text-sm text-red-500">{errors.product_url}</p>
            )}
          </div>

          {/* Availability and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Availability
              </label>
              <select
                name="availability"
                value={formData.availability}
                onChange={handleInputChange}
                disabled={loading}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="Available">Available</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Pre-order">Pre-order</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                disabled={loading}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  <span>Create Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;