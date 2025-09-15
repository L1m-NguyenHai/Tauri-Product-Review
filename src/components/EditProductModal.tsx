import React, { useState, useEffect } from 'react';
import { X, Package, Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { adminAPI, type Category, type ProductInput, type Product, type StoreLinkInput } from '../services/api';
import { useNotification } from './Notification';
import DragZone from './DragZone/DragZone';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: (product: Product) => void;
  product: Product | null;
}

interface ExtendedStoreLinkInput extends StoreLinkInput {
  id?: number;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  onProductUpdated,
  product
}) => {
  const { isDark } = useTheme();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [storeLinks, setStoreLinks] = useState<ExtendedStoreLinkInput[]>([]);
  const [loadingStoreLinks, setLoadingStoreLinks] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<{id: string, url: string}[]>([]);

  const [formData, setFormData] = useState<ProductInput>({
    name: '',
    description: '',
    manufacturer: '',
    product_url: '',
    availability: 'Available',
    status: 'active',
    category_id: ''
  });

  const [newStoreLink, setNewStoreLink] = useState<StoreLinkInput>({
    store_name: '',
    url: '',
    price: 0,
    is_official: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load categories, store links, and populate form when modal opens
  useEffect(() => {
    if (isOpen && product) {
      loadCategories();
      loadStoreLinks();
      // Populate form with product data
      setFormData({
        name: product.name,
        description: product.description,
        manufacturer: product.manufacturer,
        product_url: product.product_url,
        availability: product.availability,
        status: product.status,
        category_id: product.category_id
      });
      setUploadedImages([]);
      // Load existing images
      if (product.images && Array.isArray(product.images)) {
        const formattedImages = product.images.map(img => {
          // Handle both object and string formats
          if (typeof img === 'object' && img.image_url) {
            return { id: img.id, url: img.image_url };
          } else if (typeof img === 'string') {
            return { id: `temp-${Date.now()}-${Math.random()}`, url: img };
          }
          return null;
        }).filter((img): img is {id: string, url: string} => img !== null);
        setExistingImages(formattedImages);
      } else if (product.display_image) {
        // Fallback to display_image if images array is not available
        setExistingImages([{ id: `display-${Date.now()}`, url: product.display_image }]);
      } else {
        setExistingImages([]);
      }
    }
  }, [isOpen, product]);

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

  const loadStoreLinks = async () => {
    if (!product) return;
    
    setLoadingStoreLinks(true);
    try {
      const response = await adminAPI.getProductStoreLinks(product.id.toString());
      setStoreLinks(response.store_links || []);
    } catch (error) {
      console.error('Failed to load store links:', error);
      showNotification('error', 'Failed to load store links');
    } finally {
      setLoadingStoreLinks(false);
    }
  };

  // Handle price for store links
  const handleStoreLinkPriceInput = (index: number, value: string) => {
    setStoreLinks(prev => prev.map((link, i) =>
      i === index ? { ...link, price: value === '' ? 0 : parseInt(value, 10) } : link
    ));
  };

  const updateStoreLink = (index: number, field: keyof ExtendedStoreLinkInput, value: any) => {
    setStoreLinks(prev => prev.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    ));
  };

  const removeStoreLink = (index: number) => {
    setStoreLinks(prev => prev.filter((_, i) => i !== index));
  };



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };



  const addStoreLinkAPI = async () => {
    if (!product || !newStoreLink.store_name || !newStoreLink.url || newStoreLink.price <= 0) {
      showNotification('error', 'Please fill all store link fields');
      return;
    }

    try {
      const response = await adminAPI.addStoreLink(product.id.toString(), {
        store_name: newStoreLink.store_name,
        url: newStoreLink.url,
        price: newStoreLink.price,
        is_official: false
      });
      
      const addedStoreLink = response.store_link;
      setStoreLinks(prev => [...prev, addedStoreLink]);
      setNewStoreLink({ store_name: '', url: '', price: 0, is_official: false });
      showNotification('success', 'Store link added successfully');
    } catch (error) {
      console.error('Failed to add store link:', error);
      showNotification('error', 'Failed to add store link');
    }
  };



  const deleteStoreLinkAPI = async (storeLinkId: number) => {
    if (!product) return;

    try {
      await adminAPI.deleteStoreLink(storeLinkId.toString());
      setStoreLinks(prev => prev.filter(link => link.id !== storeLinkId));
      showNotification('success', 'Store link deleted successfully');
      
      // Update the product price to reflect new lowest price
      const remainingPrices = storeLinks.filter(link => link.id !== storeLinkId).map(link => link.price);
      if (remainingPrices.length > 0) {
        const lowestPrice = Math.min(...remainingPrices);
        setFormData(prev => ({ ...prev, price: lowestPrice }));
      } else {
        setFormData(prev => ({ ...prev, price: 0 }));
      }
    } catch (error) {
      console.error('Failed to delete store link:', error);
      showNotification('error', 'Failed to delete store link');
    }
  };



  // Xóa ảnh cũ
  const handleDeleteExistingImage = async (imageId: string) => {
    if (!product) return;
    try {
      await adminAPI.deleteProductImage(imageId);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      showNotification('success', 'Image deleted');
    } catch (error) {
      showNotification('error', 'Failed to delete image');
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
    if (!validateForm() || !product) return;
    setLoading(true);
    try {
      // Calculate price from store links
      const lowestPrice = storeLinks.length > 0 
        ? Math.min(...storeLinks.filter(link => link.price > 0).map(link => link.price))
        : 0;
      
      // Prepare clean data for API with auto-calculated price
      const updatedFormData: Partial<ProductInput> = {
        name: formData.name,
        description: formData.description,
        manufacturer: formData.manufacturer,
        price: lowestPrice,
        product_url: formData.product_url,
        availability: formData.availability,
        status: formData.status,
        category_id: formData.category_id
      };
      
      // Remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(updatedFormData).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
      
      console.log('Updating product with data:', cleanedData);
      const updatedProduct = await adminAPI.updateProduct(product.id.toString(), cleanedData);
      
      // Upload new images
      if (uploadedImages.length > 0) {
        for (let i = 0; i < uploadedImages.length; i++) {
          try {
            await adminAPI.uploadProductImage(product.id.toString(), uploadedImages[i], i === 0);
          } catch (error) {
            console.error(`Failed to upload image ${i + 1}:`, error);
            // Try fallback to URL method if upload endpoint doesn't exist
            try {
              await adminAPI.addProductImage(product.id.toString(), { 
                image_url: URL.createObjectURL(uploadedImages[i]), 
                is_primary: i === 0 
              });
            } catch (fallbackError) {
              console.error(`Fallback image upload also failed for image ${i + 1}:`, fallbackError);
              showNotification('warning', `Failed to upload image: ${uploadedImages[i].name}`);
            }
          }
        }
      }
      
      showNotification('success', 'Product updated successfully');
      onProductUpdated(updatedProduct);
      onClose();
    } catch (error) {
      showNotification('error', 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setErrors({});
      setNewStoreLink({ store_name: '', url: '', price: 0, is_official: false });
      setUploadedImages([]);
    }
  };

  if (!isOpen || !product) return null;

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
              Edit Product
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
            
            {loadingStoreLinks ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2 text-sm text-gray-500">Loading store links...</span>
              </div>
            ) : (
              <>
                {/* Existing store links */}
                {storeLinks.map((link, idx) => (
                  <div key={link.id || idx} className={`flex items-center gap-2 mb-2 p-2 border rounded ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                    <input
                      type="text"
                      placeholder="Store Name"
                      value={link.store_name}
                      onChange={e => updateStoreLink(idx, 'store_name', e.target.value)}
                      className={`px-2 py-1 border rounded w-1/4 ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                      disabled={loading}
                    />
                    <input
                      type="text"
                      placeholder="Price"
                      value={link.price === 0 ? '' : link.price}
                      onChange={e => handleStoreLinkPriceInput(idx, e.target.value)}
                      className={`px-2 py-1 border rounded w-1/4 ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                      disabled={loading}
                    />
                    <input
                      type="url"
                      placeholder="URL"
                      value={link.url}
                      onChange={e => updateStoreLink(idx, 'url', e.target.value)}
                      className={`px-2 py-1 border rounded flex-1 ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                      disabled={loading}
                    />
                    <button 
                      type="button" 
                      onClick={() => link.id ? deleteStoreLinkAPI(link.id) : removeStoreLink(idx)} 
                      disabled={loading} 
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete store link"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                
                {/* Add new store link */}
                <div className={`flex items-center gap-2 mb-2 p-2 border-2 border-dashed rounded ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  <input
                    type="text"
                    placeholder="Store Name"
                    value={newStoreLink.store_name}
                    onChange={e => setNewStoreLink((prev: StoreLinkInput) => ({ ...prev, store_name: e.target.value }))}
                    className={`px-2 py-1 border rounded w-1/4 ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                    disabled={loading}
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={newStoreLink.price === 0 ? '' : newStoreLink.price}
                    onChange={e => setNewStoreLink((prev: StoreLinkInput) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className={`px-2 py-1 border rounded w-1/4 ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                    disabled={loading}
                  />
                  <input
                    type="url"
                    placeholder="URL"
                    value={newStoreLink.url}
                    onChange={e => setNewStoreLink((prev: StoreLinkInput) => ({ ...prev, url: e.target.value }))}
                    className={`px-2 py-1 border rounded flex-1 ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                    disabled={loading}
                  />
                  <button 
                    type="button" 
                    onClick={addStoreLinkAPI} 
                    disabled={loading || !newStoreLink.store_name || !newStoreLink.url || newStoreLink.price <= 0} 
                    className="text-blue-500 hover:text-blue-700 p-1 disabled:opacity-50"
                    title="Add store link"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </>
            )}
            
            {errors.storeLinks && (
              <p className="mt-1 text-sm text-red-500">{errors.storeLinks}</p>
            )}
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

          {/* Product Images */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Product Images
            </label>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Current Images ({existingImages.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {existingImages.map((img, index) => (
                    <div key={img.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors">
                        <img 
                          src={img.url} 
                          alt={`Product image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkM5Ljc5IDEzLjc5IDkuNzkgMTAuMjEgMTIgOEMxNC4yMSAxMC4yMSAxNC4yMSAxMy43OSAxMiAxNloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteExistingImage(img.id)}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        title="Delete image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New Images */}
            <DragZone
              onFilesSelected={(files: File[]) => setUploadedImages(files)}
              acceptedTypes={['image/*']}
              maxFiles={10}
              title="Upload Product Images"
              description="Click to upload or drag and drop"
              className="mb-4"
            />

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
                <option value="discontinued">Discontinued</option>
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
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;