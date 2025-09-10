const API_BASE_URL = 'http://localhost:8000/api/v1';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin' | 'reviewer';
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  manufacturer: string;
  price: number;
  original_price?: number;
  product_url: string;
  availability: string;
  status: string;
  image?: string;
  category_id: string;
  category_name?: string;
  average_rating?: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string;
  content: string;
  status: 'pending' | 'published' | 'rejected';
  verified_purchase: boolean;
  created_at: string;
  updated_at: string;
  user_name?: string;
  product_name?: string;
}

interface ReviewRequest {
  id: string;
  product_name: string;
  manufacturer: string;
  product_url: string;
  reason: string;
  priority: 'low' | 'normal' | 'high';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  user_id: string;
  user_email?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'resolved';
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  total_users?: number;
  total_products?: number;
  total_reviews?: number;
  total_categories?: number;
  pending_reviews?: number;
  recent_registrations?: number;
  average_rating?: number;
  top_categories?: any[];
  recent_activity?: any[];
}

// API Helper
const getAuthToken = (): string | null => {
  const token = localStorage.getItem('access_token');
  const tokenType = localStorage.getItem('token_type');
  return token ? `${tokenType} ${token}` : null;
};

const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: token }),
      ...options.headers,
    },
    ...options,
  };

  console.log('API Request:', {
    url,
    method: config.method || 'GET',
    hasToken: !!token,
    headers: config.headers
  });

  const response = await fetch(url, config);
  
  console.log('API Response:', {
    url,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('API Error:', {
      url,
      status: response.status,
      errorData
    });
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

// Admin API Functions
export const adminAPI = {
  // Dashboard Stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    return apiRequest('/admin/dashboard');
  },

  // User Management
  getAllUsers: async (params?: { limit?: number; offset?: number }): Promise<{ users: User[]; total: number }> => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    
    const users = await apiRequest(`/users/?${query}`);
    return { users, total: users.length };
  },

  deleteUser: async (userId: string): Promise<void> => {
    return apiRequest(`/users/${userId}`, { method: 'DELETE' });
  },

  updateUserRole: async (userId: string, role: 'user' | 'reviewer'): Promise<void> => {
    return apiRequest(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  },

  // Review Management
  getAllReviews: async (params?: { 
    limit?: number; 
    offset?: number; 
    status?: string;
    sort_by?: string;
    sort_order?: string;
  }): Promise<{ reviews: Review[]; total: number }> => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.sort_by) query.append('sort_by', params.sort_by);
    if (params?.sort_order) query.append('sort_order', params.sort_order);
    
    const response = await apiRequest(`/reviews/?${query}`);
    // API trả về array trực tiếp hoặc object với reviews property
    if (Array.isArray(response)) {
      return { reviews: response, total: response.length };
    } else if (response.reviews) {
      return { reviews: response.reviews, total: response.total || response.reviews.length };
    } else {
      return { reviews: [], total: 0 };
    }
  },

  getPendingReviews: async (): Promise<Review[]> => {
    // Sử dụng endpoint chính với status=pending thay vì /reviews/pending
    const response = await apiRequest('/reviews/?status=pending&limit=100');
    if (Array.isArray(response)) {
      return response;
    } else if (response.reviews) {
      return response.reviews;
    } else {
      return [];
    }
  },

  getAllReviewsForAdmin: async (params?: { 
    limit?: number; 
    offset?: number; 
    sort_by?: string;
    sort_order?: string;
  }): Promise<{ reviews: Review[]; total: number }> => {
    try {
      console.log('Fetching all reviews for admin (published + pending)...');
      
      // Gọi cả published và pending reviews
      const [publishedResponse, pendingResponse] = await Promise.allSettled([
        adminAPI.getAllReviews({ ...params, status: 'published' }),
        adminAPI.getPendingReviews()
      ]);
      
      const publishedReviews = publishedResponse.status === 'fulfilled' ? publishedResponse.value.reviews : [];
      const pendingReviews = pendingResponse.status === 'fulfilled' ? pendingResponse.value : [];
      
      console.log('Published reviews:', publishedReviews.length);
      console.log('Pending reviews:', pendingReviews.length);
      
      // Merge và sort
      const allReviews = [...publishedReviews, ...pendingReviews];
      
      // Sort by created_at desc
      allReviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      const limitedReviews = params?.limit ? allReviews.slice(0, params.limit) : allReviews;
      
      console.log('Total reviews after merge:', allReviews.length);
      console.log('Limited reviews:', limitedReviews.length);
      
      return {
        reviews: limitedReviews,
        total: allReviews.length
      };
    } catch (error) {
      console.error('Failed to get reviews for admin:', error);
      return { reviews: [], total: 0 };
    }
  },

  approveReview: async (reviewId: string): Promise<void> => {
    return apiRequest(`/reviews/${reviewId}/approve`, { method: 'PUT' });
  },

  rejectReview: async (reviewId: string, reason?: string): Promise<void> => {
    return apiRequest(`/reviews/${reviewId}/reject`, { 
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
  },

  deleteReview: async (reviewId: string): Promise<void> => {
    return apiRequest(`/reviews/${reviewId}`, { method: 'DELETE' });
  },

  // Review Request Management
  getAllReviewRequests: async (): Promise<ReviewRequest[]> => {
    return apiRequest('/review-requests/admin/all');
  },

  getPendingReviewRequests: async (): Promise<ReviewRequest[]> => {
    return apiRequest('/review-requests/admin/pending');
  },

  approveReviewRequest: async (requestId: string): Promise<void> => {
    return apiRequest(`/review-requests/admin/${requestId}/approve`, { method: 'PUT' });
  },

  rejectReviewRequest: async (requestId: string, adminNotes: string): Promise<void> => {
    return apiRequest(`/review-requests/admin/${requestId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ admin_notes: adminNotes })
    });
  },

  completeReviewRequest: async (requestId: string): Promise<void> => {
    return apiRequest(`/review-requests/admin/${requestId}/complete`, { method: 'PUT' });
  },

  updateReviewRequestNotes: async (requestId: string, adminNotes: string): Promise<void> => {
    return apiRequest(`/review-requests/admin/${requestId}/notes`, {
      method: 'PUT',
      body: JSON.stringify({ admin_notes: adminNotes })
    });
  },

  // Contact Management
  getAllContacts: async (): Promise<ContactMessage[]> => {
    return apiRequest('/contact/');
  },

  getUnreadContacts: async (): Promise<ContactMessage[]> => {
    return apiRequest('/contact/unread');
  },

  getContactMessage: async (messageId: string): Promise<ContactMessage> => {
    return apiRequest(`/contact/${messageId}`);
  },

  markContactAsRead: async (messageId: string): Promise<void> => {
    return apiRequest(`/contact/${messageId}/mark-read`, { method: 'PUT' });
  },

  markContactAsReplied: async (messageId: string): Promise<void> => {
    return apiRequest(`/contact/${messageId}/mark-replied`, { method: 'PUT' });
  },

  updateContactStatus: async (messageId: string, status: string): Promise<void> => {
    return apiRequest(`/contact/${messageId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  deleteContactMessage: async (messageId: string): Promise<void> => {
    return apiRequest(`/contact/${messageId}`, { method: 'DELETE' });
  },

  getContactStats: async (): Promise<{
    total_messages: number;
    unread_count: number;
    pending_count: number;
    resolved_count: number;
  }> => {
    return apiRequest('/contact/stats/summary');
  },

  // Analytics
  getProductAnalytics: async (params?: { period?: string; category_id?: string }): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.category_id) query.append('category_id', params.category_id);
    
    return apiRequest(`/admin/analytics/products?${query}`);
  },

  getReviewAnalytics: async (params?: { period?: string }): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    
    return apiRequest(`/admin/analytics/reviews?${query}`);
  },

  getUserAnalytics: async (params?: { period?: string }): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    
    return apiRequest(`/admin/analytics/users?${query}`);
  },

  getEngagementAnalytics: async (params?: { period?: string }): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    
    return apiRequest(`/admin/analytics/engagement?${query}`);
  },

  // System Health
  getSystemHealth: async (): Promise<any> => {
    return apiRequest('/admin/system/health');
  },

  cleanupOrphanedData: async (): Promise<any> => {
    return apiRequest('/admin/maintenance/cleanup-orphaned', { method: 'POST' });
  },

  getRecentLogs: async (params?: { limit?: number; level?: string }): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.level) query.append('level', params.level);
    
    return apiRequest(`/admin/logs/recent?${query}`);
  }
};

// Export types for use in components
export type { 
  User, 
  Product, 
  Review, 
  ReviewRequest, 
  ContactMessage, 
  DashboardStats 
};
