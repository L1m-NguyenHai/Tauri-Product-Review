import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Package, TrendingUp, Eye, Edit, Trash2, CheckCircle, XCircle, Loader2, RefreshCw, Plus } from 'lucide-react';
import ReviewerBadge from '../components/ReviewerBadge';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI, type User, type Review, type ReviewRequest, type DashboardStats, type Product } from '../services/api';
import { useNotification } from '../components/Notification';
import AddProductModal from '../components/AddProductModal';
import EditProductModal from '../components/EditProductModal';

const AdminPanel: React.FC = () => {
  const { isDark } = useTheme();
  const { isAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showNotification, NotificationComponent } = useNotification();

  // State for data
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRequests, setReviewRequests] = useState<ReviewRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Modal states
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [prefilledRequestData, setPrefilledRequestData] = useState<ReviewRequest | null>(null);

  // Helper function to load all products
  const loadAllProducts = async (): Promise<Product[]> => {
    const allProducts: Product[] = [];
    let offset = 0;
    const limit = 100; // Maximum allowed by backend
    
    while (true) {
      try {
        const response = await adminAPI.getAllProducts({ limit, offset });
        const products = response.products || [];
        
        if (products.length === 0) {
          break; // No more products
        }
        
        allProducts.push(...products);
        
        if (products.length < limit) {
          break; // Last page
        }
        
        offset += limit;
      } catch (error) {
        console.error('Failed to load products at offset', offset, ':', error);
        break;
      }
    }
    
    return allProducts;
  };

  // All function definitions before conditional return
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load basic data with individual error handling
      const results = await Promise.allSettled([
        adminAPI.getDashboardStats(),
        adminAPI.getAllUsers({ limit: 10 }),
        adminAPI.getAllReviewsForAdmin({ limit: 10, sort_by: 'created_at', sort_order: 'desc' }),
        adminAPI.getPendingReviewRequests(),
      ]);

      // Load all products separately
      const allProducts = await loadAllProducts();
      setProducts(allProducts);

      // Handle dashboard stats
      if (results[0].status === 'fulfilled') {
        setDashboardStats(results[0].value);
      } else {
        console.error('Failed to load dashboard stats:', results[0].reason);
        showNotification('warning', 'Could not load dashboard statistics');
      }

      // Handle users
      if (results[1].status === 'fulfilled') {
        setUsers(results[1].value.users || []);
      } else {
        console.error('Failed to load users:', results[1].reason);
        showNotification('warning', 'Could not load users data');
      }

      // Handle reviews
      if (results[2].status === 'fulfilled') {
        console.log('Reviews response:', results[2].value);
        setReviews(results[2].value.reviews || []);
      } else {
        console.error('Failed to load reviews:', results[2].reason);
        setReviews([]);
      }

      // Handle review requests
      if (results[3].status === 'fulfilled') {
        setReviewRequests(results[3].value || []);
      } else {
        console.error('Failed to load review requests:', results[3].reason);
        showNotification('warning', 'Could not load review requests');
      }

      // Check if all basic APIs failed (products loading is separate)
      const allBasicApiFailed = results.every(result => result.status === 'rejected');
      if (allBasicApiFailed && allProducts.length === 0) {
        throw new Error('All API calls failed - check authentication');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      showNotification('error', errorMessage);
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      await adminAPI.approveReview(reviewId);
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, status: 'published' as const }
          : review
      ));
      showNotification('success', 'Review approved successfully');
    } catch (err) {
      console.error('Failed to approve review:', err);
      showNotification('error', 'Failed to approve review');
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    try {
      await adminAPI.rejectReview(reviewId);
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, status: 'rejected' as const }
          : review
      ));
      showNotification('success', 'Review rejected successfully');
    } catch (err) {
      console.error('Failed to reject review:', err);
      showNotification('error', 'Failed to reject review');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await adminAPI.deleteUser(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
      showNotification('success', 'User deleted successfully');
    } catch (err) {
      console.error('Failed to delete user:', err);
      showNotification('error', 'Failed to delete user');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'user' | 'reviewer') => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, role: newRole }
          : user
      ));
      showNotification('success', `User role updated to ${newRole}`);
    } catch (err) {
      console.error('Failed to update user role:', err);
      showNotification('error', 'Failed to update user role');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      await adminAPI.approveReviewRequest(requestId);
      setReviewRequests(prev => prev.map(request => 
        request.id === requestId 
          ? { ...request, status: 'approved' as const }
          : request
      ));
      showNotification('success', 'Review request approved successfully');
    } catch (err) {
      console.error('Failed to approve request:', err);
      showNotification('error', 'Failed to approve request');
    }
  };

  const handleApproveAndCreateProduct = (request: ReviewRequest) => {
    // Pre-fill AddProductModal with review request data
    setPrefilledRequestData(request);
    setShowAddProductModal(true);
  };

  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      await adminAPI.rejectReviewRequest(requestId, reason);
      setReviewRequests(prev => prev.map(request => 
        request.id === requestId 
          ? { ...request, status: 'rejected' as const, admin_notes: reason }
          : request
      ));
      showNotification('success', 'Review request rejected successfully');
    } catch (err) {
      console.error('Failed to reject request:', err);
      showNotification('error', 'Failed to reject request');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await adminAPI.deleteProduct(productId);
      setProducts(prev => prev.filter(product => product.id !== productId));
      showNotification('success', 'Product deleted successfully');
    } catch (err) {
      console.error('Failed to delete product:', err);
      showNotification('error', 'Failed to delete product');
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditProductModal(true);
  };

  const handleProductCreated = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
    setShowAddProductModal(false);
  };

  const handleProductUpdated = (updatedProduct: Product) => {
    setProducts(prev => prev.map(product => 
      product.id === updatedProduct.id ? updatedProduct : product
    ));
    setShowEditProductModal(false);
    setSelectedProduct(null);
  };

  // useEffect hook after all function definitions
  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  // Early return for non-admin users
  if (!isAdmin) {
    return (
      <div className={`text-center py-12 ${
        isDark ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <p className="text-lg">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  const stats = dashboardStats ? [
    { icon: Users, label: 'Total Users', value: dashboardStats.total_users?.toLocaleString() || '0', change: `+${dashboardStats.recent_registrations || 0}` },
    { icon: MessageSquare, label: 'Total Reviews', value: dashboardStats.total_reviews?.toLocaleString() || '0', change: `${dashboardStats.pending_reviews || 0} pending` },
    { icon: Package, label: 'Products', value: dashboardStats.total_products?.toLocaleString() || '0', change: `${dashboardStats.average_rating?.toFixed(1) || '0.0'} avg rating` },
    { icon: TrendingUp, label: 'Categories', value: dashboardStats.total_categories?.toString() || '0', change: 'Active' }
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-red-500 mb-4">{error}</p>
        <button 
          onClick={loadDashboardData}
          className="flex items-center space-x-2 mx-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const TabButton = ({ id, label, count }: { id: string; label: string; count?: number }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        activeTab === id
          ? 'border-blue-500 text-blue-500'
          : isDark
          ? 'border-transparent text-gray-400 hover:text-gray-300'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {label} {count && `(${count})`}
    </button>
  );

  // Debug info
  const debugInfo = {
    user,
    isAdmin,
    hasToken: !!localStorage.getItem('access_token'),
    tokenType: localStorage.getItem('token_type'),
    tokenPreview: localStorage.getItem('access_token')?.substring(0, 20) + '...'
  };

  return (
    <div className="space-y-8">
      {NotificationComponent}
      
      {/* Debug Panel - Remove in production */}
      {import.meta.env.DEV && (
        <div className={`p-4 rounded-lg border-2 border-dashed ${
          isDark ? 'border-yellow-600 bg-yellow-900/20' : 'border-yellow-500 bg-yellow-50'
        }`}>
          <h3 className="font-semibold text-yellow-600 mb-2">Debug Info (Development Only)</h3>
          <pre className="text-xs text-gray-600 dark:text-gray-400">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
      
      {/* Header */}
      <div className={`rounded-xl p-6 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } shadow-sm`}>
        <h1 className={`text-3xl font-bold ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Admin Dashboard
        </h1>
        <p className={`mt-2 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Manage users, reviews, and content requests
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`rounded-xl p-6 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {stat.value}
                </p>
                <p className="text-sm text-green-500">
                  {stat.change} from last month
                </p>
              </div>
              <div className="p-3 bg-blue-500 rounded-lg">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Tabs */}
      <div className={`rounded-xl ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } shadow-sm`}>
        <div className={`border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <nav className="flex p-6 pb-0">
            <TabButton id="overview" label="Overview" />
            <TabButton id="users" label="Users" count={users.length} />
            <TabButton id="reviews" label="Reviews" count={reviews.length} />
            <TabButton id="requests" label="Requests" count={reviewRequests.length} />
            <TabButton id="products" label="Products" count={products.length} />
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Dashboard Overview
                </h3>
                <button
                  onClick={loadDashboardData}
                  disabled={loading}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
              
              {dashboardStats?.recent_activity && dashboardStats.recent_activity.length > 0 ? (
                <div className="space-y-3">
                  {dashboardStats.recent_activity.map((activity, index) => (
                    <div key={index} className={`p-3 rounded-lg ${
                      isDark ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {activity.description || 'Recent activity'}
                      </p>
                      <p className={`text-xs ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Recently'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <p>No recent activity available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  User Management ({users.length} users)
                </h3>
                <button
                  onClick={loadDashboardData}
                  disabled={loading}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
              {users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${
                        isDark ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <th className={`text-left py-3 px-4 font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          User
                        </th>
                        <th className={`text-left py-3 px-4 font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Role
                        </th>
                        <th className={`text-left py-3 px-4 font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Created
                        </th>
                        <th className={`text-left py-3 px-4 font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                      <tr key={user.id} className={`border-b ${
                        isDark ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <td className="py-3 px-4">
                          <div>
                            <div className={`flex items-center gap-2 font-medium ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              <span>{user.name}</span>
                              {user.role === 'reviewer' && (
                                <ReviewerBadge size="sm" showText={false} />
                              )}
                            </div>
                            <div className={`text-sm ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {user.role === 'admin' ? (
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              admin
                            </span>
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) => handleUpdateUserRole(user.id, e.target.value as 'user' | 'reviewer')}
                              className={`text-xs px-2 py-1 rounded border ${
                                isDark 
                                  ? 'bg-gray-700 border-gray-600 text-gray-200' 
                                  : 'bg-white border-gray-300 text-gray-700'
                              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                            >
                              <option value="user">user</option>
                              <option value="reviewer">reviewer</option>
                            </select>
                          )}
                        </td>
                        <td className={`py-3 px-4 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button className="p-1 text-blue-500 hover:text-blue-600">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-500 hover:text-gray-600">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1 text-red-500 hover:text-red-600"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={`text-center py-8 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No users found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Review Management ({reviews.length} reviews)
                </h3>
                <button
                  onClick={loadDashboardData}
                  disabled={loading}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
              {/* Debug info */}
              <div className="mb-4 text-sm text-gray-500">
                Reviews loaded: {reviews.length} | Loading: {loading ? 'Yes' : 'No'}
              </div>
              
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                  <div key={review.id} className={`p-4 rounded-lg border ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-medium ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {review.product_name || 'Product'}
                        </h4>
                        <p className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          by {review.user_name || 'User'} • {new Date(review.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-full ${
                                i < review.rating ? 'bg-yellow-400' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                          <span className={`ml-2 text-sm ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {review.rating}/5
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          review.status === 'published'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : review.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {review.status}
                        </span>
                        {review.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApproveReview(review.id)}
                              className="p-1 text-green-500 hover:text-green-600"
                              title="Approve Review"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleRejectReview(review.id)}
                              className="p-1 text-red-500 hover:text-red-600"
                              title="Reject Review"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No reviews found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Review Requests ({reviewRequests.length} requests)
                </h3>
                <button
                  onClick={loadDashboardData}
                  disabled={loading}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
              {reviewRequests.length > 0 ? (
                <div className="space-y-4">
                  {reviewRequests.map((request) => (
                  <div key={request.id} className={`p-4 rounded-lg border ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-medium ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {request.product_name}
                        </h4>
                        <p className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Requested by {request.user_email || 'User'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-blue-500">
                            {request.manufacturer}
                          </span>
                          <span className={`text-sm ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            • {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          request.status === 'approved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {request.status}
                        </span>
                        {request.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApproveRequest(request.id)}
                              className="p-1 text-green-500 hover:text-green-600"
                              title="Approve Request"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleApproveAndCreateProduct(request)}
                              className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                              title="Approve & Create Product"
                            >
                              Create Product
                            </button>
                            <button 
                              onClick={() => handleRejectRequest(request.id)}
                              className="p-1 text-red-500 hover:text-red-600"
                              title="Reject Request"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No review requests found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Product Management ({products.length} products)
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                  <button
                    onClick={loadDashboardData}
                    disabled={loading}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
              {products.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${
                        isDark ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <th className={`text-left py-3 px-4 font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Product
                        </th>
                        <th className={`text-left py-3 px-4 font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Price
                        </th>
                        <th className={`text-left py-3 px-4 font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Status
                        </th>
                        <th className={`text-left py-3 px-4 font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Created
                        </th>
                        <th className={`text-left py-3 px-4 font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className={`border-b ${
                          isDark ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              {product.image && (
                                <img 
                                  src={product.image} 
                                  alt={product.name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              )}
                              <div>
                                <div className={`font-medium ${
                                  isDark ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {product.name}
                                </div>
                                <div className={`text-sm ${
                                  isDark ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {product.manufacturer}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className={`py-3 px-4 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            <div className="flex flex-col">
                              <span className="font-medium">${product.price}</span>
                              {product.original_price && (
                                <span className="text-sm text-gray-500 line-through">
                                  ${product.original_price}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col space-y-1">
                              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                product.status === 'active'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : product.status === 'inactive'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}>
                                {product.status}
                              </span>
                              <span className={`text-xs ${
                                product.availability === 'Available'
                                  ? 'text-green-500'
                                  : product.availability === 'Out of Stock'
                                  ? 'text-red-500'
                                  : 'text-yellow-500'
                              }`}>
                                {product.availability.replace('_', ' ')}
                              </span>
                            </div>
                          </td>
                          <td className={`py-3 px-4 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {new Date(product.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button className="p-1 text-blue-500 hover:text-blue-600">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleEditProduct(product)}
                                className="p-1 text-gray-500 hover:text-gray-600"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-1 text-red-500 hover:text-red-600"
                                title="Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={`text-center py-8 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No products found</p>
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add First Product
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddProductModal 
        isOpen={showAddProductModal}
        onClose={() => {
          setShowAddProductModal(false);
          setPrefilledRequestData(null);
        }}
        onProductCreated={handleProductCreated}
        reviewRequest={prefilledRequestData || undefined}
      />
      
      <EditProductModal 
        isOpen={showEditProductModal}
        onClose={() => {
          setShowEditProductModal(false);
          setSelectedProduct(null);
        }}
        onProductUpdated={handleProductUpdated}
        product={selectedProduct}
      />
    </div>
  );
};

export default AdminPanel;