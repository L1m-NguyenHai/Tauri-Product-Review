// User Activity Types
export interface UserActivity {
  id: string; // UUID được trả về dưới dạng string
  user_id: string;
  activity_type: string;
  activity_data?: any;
  created_at: string;
}

export interface UserActivityCreate {
  user_id: string;
  activity_type: string;
  activity_data?: any;
}

export const activityAPI = {
  logActivity: async (activity: UserActivityCreate): Promise<UserActivity> => {
    return apiRequest("/activities/", {
      method: "POST",
      body: JSON.stringify(activity),
    });
  },
  getActivities: async (
    user_id?: string,
    limit = 20,
    offset = 0
  ): Promise<UserActivity[]> => {
    let url = `/activities/?limit=${limit}&offset=${offset}`;
    if (user_id) url += `&user_id=${user_id}`;
    return apiRequest(url);
  },
};
// Dynamic API base URL - gets value from localStorage or defaults
const getApiBaseUrl = (): string => {
  return localStorage.getItem("api_base_url") || "http://localhost:8000/api/v1";
};

// Types
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "user" | "admin" | "reviewer";
  email_verified?: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationConfirm {
  token: string;
}

export interface EmailVerificationResponse {
  message: string;
  email: string;
  verified?: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  manufacturer: string;
  price: number;
  product_url: string;
  availability: string;
  status: string;
  category_id: string;
  category_name?: string;
  average_rating?: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  features?: ProductFeature[];
  images?: ProductImage[];
  display_image?: string; // from view products_with_image
  specifications?: ProductSpecification[];
  store_links?: StoreLink[];
}

interface ProductFeature {
  id: string;
  product_id: string;
  feature_text: string;
  sort_order: number;
}

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

interface ProductSpecification {
  id: string;
  product_id: string;
  spec_name: string;
  spec_value: string;
}

interface StoreLink {
  id: string;
  product_id: string;
  store_name: string;
  price: number;
  url: string;
  is_official: boolean;
}

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string;
  content: string;
  status: "pending" | "published" | "rejected";
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
  priority: "low" | "normal" | "high";
  status: "pending" | "approved" | "rejected" | "completed";
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
  status: "unread" | "read" | "replied" | "resolved";
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  total_users?: number;
  total_products?: number;
  total_reviews?: number;
  total_categories?: number;
  pending_reviews?: number;
  pending_review_requests?: number;
  unread_messages?: number;
  recent_registrations?: number;
  average_rating?: number;
  top_categories?: any[];
  recent_activity?: any[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface ProductInput {
  name: string;
  description: string;
  manufacturer: string;
  price?: number;
  product_url: string;
  availability: string;
  status: string;
  category_id: string;
}

interface StoreLinkInput {
  store_name: string;
  price: number;
  url: string;
  is_official: boolean;
}

// API Helper
const getAuthToken = (): string | null => {
  const token = localStorage.getItem("access_token");
  const tokenType = localStorage.getItem("token_type");
  return token ? `${tokenType} ${token}` : null;
};

const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getAuthToken();
  const url = `${getApiBaseUrl()}${endpoint}`;

  // Check if body is FormData to avoid setting Content-Type
  const isFormData = options.body instanceof FormData;

  const config: RequestInit = {
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token && { Authorization: token }),
      ...options.headers,
    },
    ...options,
  };

  console.log("API Request:", {
    url,
    method: config.method || "GET",
    hasToken: !!token,
    isFormData,
    headers: config.headers,
  });

  const response = await fetch(url, config);

  console.log("API Response:", {
    url,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("API Error:", {
      url,
      status: response.status,
      errorData,
    });
    throw new Error(
      errorData.detail ||
        `HTTP error! status: ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
};

// Admin API Functions
export const adminAPI = {
  // Dashboard Stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    return apiRequest("/admin/dashboard");
  },
  adminDeleteProduct: async (productId: string): Promise<void> => {
    const accessToken = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type");
    if (!accessToken || !tokenType) {
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
    const response = await fetch(
      `${getApiBaseUrl().replace(
        "/api/v1",
        "/api/v1/admin"
      )}/products/${productId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `${tokenType} ${accessToken}`,
        },
      }
    );
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || "Không thể xóa sản phẩm. Vui lòng thử lại.");
    }
  },

  // User Management
  getAllUsers: async (params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ users: User[]; total: number }> => {
    const query = new URLSearchParams();
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.offset) query.append("offset", params.offset.toString());

    const users = await apiRequest(`/users/?${query}`);
    return { users, total: users.length };
  },

  deleteUser: async (userId: string): Promise<void> => {
    return apiRequest(`/users/${userId}`, { method: "DELETE" });
  },

  updateUserRole: async (
    userId: string,
    role: "user" | "reviewer"
  ): Promise<void> => {
    return apiRequest(`/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
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
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.offset) query.append("offset", params.offset.toString());
    if (params?.status) query.append("status", params.status);
    if (params?.sort_by) query.append("sort_by", params.sort_by);
    if (params?.sort_order) query.append("sort_order", params.sort_order);

    const response = await apiRequest(`/reviews/?${query}`);
    // API trả về array trực tiếp hoặc object với reviews property
    if (Array.isArray(response)) {
      return { reviews: response, total: response.length };
    } else if (response.reviews) {
      return {
        reviews: response.reviews,
        total: response.total || response.reviews.length,
      };
    } else {
      return { reviews: [], total: 0 };
    }
  },

  getPendingReviews: async (): Promise<Review[]> => {
    // Sử dụng endpoint chính với status=pending thay vì /reviews/pending
    const response = await apiRequest("/reviews/?status=pending&limit=100");
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
      console.log("Fetching all reviews for admin (published + pending)...");

      // Gọi cả published và pending reviews
      const [publishedResponse, pendingResponse] = await Promise.allSettled([
        adminAPI.getAllReviews({ ...params, status: "published" }),
        adminAPI.getPendingReviews(),
      ]);

      const publishedReviews =
        publishedResponse.status === "fulfilled"
          ? publishedResponse.value.reviews
          : [];
      const pendingReviews =
        pendingResponse.status === "fulfilled" ? pendingResponse.value : [];

      console.log("Published reviews:", publishedReviews.length);
      console.log("Pending reviews:", pendingReviews.length);

      // Merge và sort
      const allReviews = [...publishedReviews, ...pendingReviews];

      // Sort by created_at desc
      allReviews.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const limitedReviews = params?.limit
        ? allReviews.slice(0, params.limit)
        : allReviews;

      console.log("Total reviews after merge:", allReviews.length);
      console.log("Limited reviews:", limitedReviews.length);

      return {
        reviews: limitedReviews,
        total: allReviews.length,
      };
    } catch (error) {
      console.error("Failed to get reviews for admin:", error);
      return { reviews: [], total: 0 };
    }
  },

  approveReview: async (reviewId: string): Promise<void> => {
    return apiRequest(`/reviews/${reviewId}/approve`, { method: "PUT" });
  },

  rejectReview: async (reviewId: string, reason?: string): Promise<void> => {
    return apiRequest(`/reviews/${reviewId}/reject`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    });
  },

  deleteReview: async (reviewId: string): Promise<void> => {
    return apiRequest(`/reviews/${reviewId}`, { method: "DELETE" });
  },

  // Review Request Management
  getAllReviewRequests: async (): Promise<ReviewRequest[]> => {
    return apiRequest("/review-requests/admin/all");
  },

  getPendingReviewRequests: async (): Promise<ReviewRequest[]> => {
    return apiRequest("/review-requests/admin/pending");
  },

  approveReviewRequest: async (requestId: string): Promise<void> => {
    return apiRequest(`/review-requests/admin/${requestId}/approve`, {
      method: "PUT",
    });
  },

  rejectReviewRequest: async (
    requestId: string,
    adminNotes: string
  ): Promise<void> => {
    return apiRequest(`/review-requests/admin/${requestId}/reject`, {
      method: "PUT",
      body: JSON.stringify({ admin_notes: adminNotes }),
    });
  },

  completeReviewRequest: async (requestId: string): Promise<void> => {
    return apiRequest(`/review-requests/admin/${requestId}/complete`, {
      method: "PUT",
    });
  },

  updateReviewRequestNotes: async (
    requestId: string,
    adminNotes: string
  ): Promise<void> => {
    return apiRequest(`/review-requests/admin/${requestId}/notes`, {
      method: "PUT",
      body: JSON.stringify({ admin_notes: adminNotes }),
    });
  },

  // Contact Management
  getAllContacts: async (): Promise<ContactMessage[]> => {
    return apiRequest("/contact/");
  },

  getUnreadContacts: async (): Promise<ContactMessage[]> => {
    return apiRequest("/contact/unread");
  },

  getContactMessage: async (messageId: string): Promise<ContactMessage> => {
    return apiRequest(`/contact/${messageId}`);
  },

  markContactAsRead: async (messageId: string): Promise<void> => {
    return apiRequest(`/contact/${messageId}/mark-read`, { method: "PUT" });
  },

  markContactAsReplied: async (messageId: string): Promise<void> => {
    return apiRequest(`/contact/${messageId}/mark-replied`, { method: "PUT" });
  },

  updateContactStatus: async (
    messageId: string,
    status: string
  ): Promise<void> => {
    return apiRequest(`/contact/${messageId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  deleteContactMessage: async (messageId: string): Promise<void> => {
    return apiRequest(`/contact/${messageId}`, { method: "DELETE" });
  },

  getContactStats: async (): Promise<{
    total_messages: number;
    unread_count: number;
    pending_count: number;
    resolved_count: number;
  }> => {
    return apiRequest("/contact/stats/summary");
  },

  // Product Management
  getAllProducts: async (params?: {
    limit?: number;
    offset?: number;
    category_id?: string;
    manufacturer?: string;
    min_price?: number;
    max_price?: number;
    min_rating?: number;
    status?: string;
    sort_by?: string;
    sort_order?: string;
    search?: string;
  }): Promise<{ products: Product[]; total: number }> => {
    const query = new URLSearchParams();
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.offset) query.append("offset", params.offset.toString());
    if (params?.category_id) query.append("category_id", params.category_id);
    if (params?.manufacturer) query.append("manufacturer", params.manufacturer);
    if (params?.min_price)
      query.append("min_price", params.min_price.toString());
    if (params?.max_price)
      query.append("max_price", params.max_price.toString());
    if (params?.min_rating)
      query.append("min_rating", params.min_rating.toString());
    if (params?.status) query.append("status", params.status);
    if (params?.sort_by) query.append("sort_by", params.sort_by);
    if (params?.sort_order) query.append("sort_order", params.sort_order);
    if (params?.search) query.append("search", params.search);

    const response = await apiRequest(`/products/?${query}`);
    return {
      products: response.items || response.products || [],
      total: response.total || 0,
    };
  },

  getProduct: async (productId: string): Promise<Product> => {
    return apiRequest(`/products/${productId}`);
  },

  createProduct: async (productData: ProductInput): Promise<Product> => {
    return apiRequest("/products/", {
      method: "POST",
      body: JSON.stringify(productData),
    });
  },

  updateProduct: async (
    productId: string,
    productData: Partial<ProductInput>
  ): Promise<Product> => {
    return apiRequest(`/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    });
  },

  deleteProduct: async (productId: string): Promise<void> => {
    return apiRequest(`/products/${productId}`, { method: "DELETE" });
  },

  // Category Management
  getAllCategories: async (): Promise<Category[]> => {
    return apiRequest("/categories/");
  },

  getCategory: async (categoryId: string): Promise<Category> => {
    return apiRequest(`/categories/${categoryId}`);
  },

  createCategory: async (categoryData: {
    name: string;
    slug: string;
    description?: string;
  }): Promise<Category> => {
    return apiRequest("/categories/", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  },

  updateCategory: async (
    categoryId: string,
    categoryData: Partial<{ name: string; slug: string; description?: string }>
  ): Promise<Category> => {
    return apiRequest(`/categories/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify(categoryData),
    });
  },

  deleteCategory: async (categoryId: string): Promise<void> => {
    return apiRequest(`/categories/${categoryId}`, { method: "DELETE" });
  },

  // Product Features
  addProductFeature: async (
    productId: string,
    featureData: { feature_text: string; sort_order?: number }
  ): Promise<ProductFeature> => {
    return apiRequest(`/products/${productId}/features`, {
      method: "POST",
      body: JSON.stringify(featureData),
    });
  },

  deleteProductFeature: async (featureId: string): Promise<void> => {
    return apiRequest(`/products/features/${featureId}`, { method: "DELETE" });
  },

  // Product Images
  addProductImage: async (
    productId: string,
    imageData: { image_url: string; is_primary?: boolean; sort_order?: number }
  ): Promise<ProductImage> => {
    return apiRequest(`/products/${productId}/images`, {
      method: "POST",
      body: JSON.stringify(imageData),
    });
  },

  uploadProductImage: async (
    productId: string,
    file: File,
    isPrimary?: boolean
  ): Promise<ProductImage> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("is_primary", isPrimary ? "true" : "false");
    formData.append("sort_order", "0");

    return apiRequest(`/products/${productId}/images/upload`, {
      method: "POST",
      body: formData,
      // Don't set Content-Type, let browser set it for FormData
      headers: {},
    });
  },

  deleteProductImage: async (imageId: string): Promise<void> => {
    return apiRequest(`/products/images/${imageId}`, { method: "DELETE" });
  },

  // Product Specifications
  addProductSpecification: async (
    productId: string,
    specData: { spec_name: string; spec_value: string }
  ): Promise<ProductSpecification> => {
    return apiRequest(`/products/${productId}/specifications`, {
      method: "POST",
      body: JSON.stringify(specData),
    });
  },

  deleteProductSpecification: async (specId: string): Promise<void> => {
    return apiRequest(`/products/specifications/${specId}`, {
      method: "DELETE",
    });
  },

  // Analytics endpoints
  getProductAnalytics: async (days?: number): Promise<any> => {
    const query = new URLSearchParams();
    if (days) query.append("days", days.toString());
    return apiRequest(`/admin/analytics/products?${query}`);
  },

  getReviewAnalytics: async (days?: number): Promise<any> => {
    const query = new URLSearchParams();
    if (days) query.append("days", days.toString());
    return apiRequest(`/admin/analytics/reviews?${query}`);
  },

  getUserAnalytics: async (days?: number): Promise<any> => {
    const query = new URLSearchParams();
    if (days) query.append("days", days.toString());
    return apiRequest(`/admin/analytics/users?${query}`);
  },

  getEngagementAnalytics: async (): Promise<any> => {
    return apiRequest("/admin/analytics/engagement");
  },

  // System maintenance
  getSystemHealth: async (): Promise<any> => {
    return apiRequest("/admin/system/health");
  },

  cleanupOrphanedData: async (): Promise<any> => {
    return apiRequest("/admin/maintenance/cleanup-orphaned", {
      method: "POST",
    });
  },

  getRecentActivity: async (limit?: number): Promise<any[]> => {
    const query = new URLSearchParams();
    if (limit) query.append("limit", limit.toString());
    return apiRequest(`/admin/logs/recent?${query}`);
  },

  // Store Links Management
  getProductStoreLinks: async (
    productId: string
  ): Promise<{ store_links: any[] }> => {
    return apiRequest(`/admin/products/${productId}/store-links`);
  },

  addStoreLink: async (
    productId: string,
    storeLinkData: {
      store_name: string;
      price?: number;
      url: string;
      is_official?: boolean;
    }
  ): Promise<{ message: string; store_link: any }> => {
    return apiRequest(`/admin/products/${productId}/store-links`, {
      method: "POST",
      body: JSON.stringify(storeLinkData),
    });
  },

  updateStoreLink: async (
    linkId: string,
    storeLinkData: {
      store_name: string;
      price?: number;
      url: string;
      is_official?: boolean;
    }
  ): Promise<{ message: string; store_link: any }> => {
    return apiRequest(`/admin/store-links/${linkId}`, {
      method: "PUT",
      body: JSON.stringify(storeLinkData),
    });
  },

  deleteStoreLink: async (linkId: string): Promise<{ message: string }> => {
    return apiRequest(`/admin/store-links/${linkId}`, {
      method: "DELETE",
    });
  },
};

// User API Functions
export const userAPI = {
  // User Profile
  getUserProfile: async (): Promise<User> => {
    return apiRequest("/auth/me");
  },

  updateUserProfile: async (profileData: { name: string }): Promise<User> => {
    return apiRequest("/users/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },

  updateUserAvatar: async (formData: FormData): Promise<void> => {
    const token = getAuthToken();
    const url = `${getApiBaseUrl()}/users/profile/avatar`;

    const config: RequestInit = {
      method: "POST",
      headers: {
        ...(token && { Authorization: token }),
      },
      body: formData,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  },

  getUserStats: async (): Promise<{
    total_reviews: number;
    helpful_votes: number;
    followers: number;
    avg_rating: number;
  }> => {
    return apiRequest("/users/profile/stats");
  },

  getUserReviews: async (userId: string): Promise<{ items: Review[] }> => {
    return apiRequest(`/users/${userId}/reviews`);
  },

  getUserById: async (userId: string): Promise<User> => {
    return apiRequest(`/users/${userId}`);
  },
};

// Auth API Functions
export const authAPI = {
  login: async (
    email: string,
    password: string
  ): Promise<{
    access_token: string;
    token_type: string;
  }> => {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> => {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  getMe: async (): Promise<User> => {
    return apiRequest("/auth/me");
  },

  sendVerificationEmail: async (
    email: string
  ): Promise<EmailVerificationResponse> => {
    return apiRequest("/auth/send-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  checkEmailVerification: async (
    email: string
  ): Promise<{ email: string; email_verified: boolean; message: string }> => {
    return apiRequest("/auth/check-email-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  verifyEmail: async (token: string): Promise<EmailVerificationResponse> => {
    return apiRequest("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },
};

// Public API Functions (no auth required)
export const publicAPI = {
  // Products
  getProducts: async (params?: {
    limit?: number;
    offset?: number;
    category_id?: string;
    manufacturer?: string;
    min_price?: number;
    max_price?: number;
    min_rating?: number;
    status?: string;
    sort_by?: string;
    sort_order?: string;
    search?: string;
  }): Promise<{ items: Product[]; total: number }> => {
    const query = new URLSearchParams();
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.offset) query.append("offset", params.offset.toString());
    if (params?.category_id) query.append("category_id", params.category_id);
    if (params?.manufacturer) query.append("manufacturer", params.manufacturer);
    if (params?.min_price)
      query.append("min_price", params.min_price.toString());
    if (params?.max_price)
      query.append("max_price", params.max_price.toString());
    if (params?.min_rating)
      query.append("min_rating", params.min_rating.toString());
    if (params?.status) query.append("status", params.status);
    if (params?.sort_by) query.append("sort_by", params.sort_by);
    if (params?.sort_order) query.append("sort_order", params.sort_order);
    if (params?.search) query.append("search", params.search);

    const response = await apiRequest(`/products/?${query}`);
    return {
      items: response.items || response.products || response,
      total: response.total || response.length || 0,
    };
  },

  getProduct: async (productId: string): Promise<Product> => {
    return apiRequest(`/products/${productId}`);
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    return apiRequest("/categories/");
  },

  // Reviews
  getReviewsByProduct: async (productId: string): Promise<Review[]> => {
    return apiRequest(`/reviews/?product_id=${productId}`);
  },

  getReviewDetail: async (reviewId: string): Promise<Review> => {
    return apiRequest(`/reviews/${reviewId}`);
  },
};

// Review API Functions
export const reviewAPI = {
  // Create review
  createReview: async (reviewData: {
    product_id: string;
    rating: number;
    title: string;
    content: string;
    verified_purchase?: boolean;
  }): Promise<Review> => {
    return apiRequest("/reviews/", {
      method: "POST",
      body: JSON.stringify(reviewData),
    });
  },

  // Review pros/cons
  addReviewPros: async (reviewId: string, pros: string[]): Promise<void> => {
    return apiRequest(`/reviews/${reviewId}/pros`, {
      method: "POST",
      body: JSON.stringify({ pros }),
    });
  },

  addReviewCons: async (reviewId: string, cons: string[]): Promise<void> => {
    return apiRequest(`/reviews/${reviewId}/cons`, {
      method: "POST",
      body: JSON.stringify({ cons }),
    });
  },

  // Review media
  uploadReviewMedia: async (
    reviewId: string,
    formData: FormData
  ): Promise<void> => {
    const token = getAuthToken();
    const url = `${getApiBaseUrl()}/reviews/${reviewId}/media/upload`;

    const config: RequestInit = {
      method: "POST",
      headers: {
        ...(token && { Authorization: token }),
      },
      body: formData,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  },

  // Review comments
  getReviewComments: async (reviewId: string): Promise<any[]> => {
    return apiRequest(`/reviews/${reviewId}/comments`);
  },

  addReviewComment: async (reviewId: string, content: string): Promise<any> => {
    return apiRequest(`/reviews/${reviewId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  deleteReviewComment: async (commentId: string): Promise<void> => {
    return apiRequest(`/reviews/comments/${commentId}`, {
      method: "DELETE",
    });
  },

  // Review helpful votes
  markReviewHelpful: async (reviewId: string): Promise<void> => {
    return apiRequest(`/reviews/${reviewId}/helpful`, {
      method: "POST",
    });
  },

  unmarkReviewHelpful: async (reviewId: string): Promise<void> => {
    return apiRequest(`/reviews/${reviewId}/helpful`, {
      method: "DELETE",
    });
  },

  // Delete review
  deleteReview: async (reviewId: string): Promise<void> => {
    return apiRequest(`/reviews/${reviewId}`, {
      method: "DELETE",
    });
  },
};

// Review Request API Functions
export const reviewRequestAPI = {
  createReviewRequest: async (requestData: {
    product_name: string;
    manufacturer: string;
    product_url: string;
    reason: string;
    priority?: string;
  }): Promise<ReviewRequest> => {
    return apiRequest("/review-requests/", {
      method: "POST",
      body: JSON.stringify(requestData),
    });
  },
};

// Contact API Functions
export const contactAPI = {
  sendMessage: async (messageData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<ContactMessage> => {
    return apiRequest("/contact/", {
      method: "POST",
      body: JSON.stringify(messageData),
    });
  },
};

// Export types for use in components
export type {
  User,
  Product,
  Review,
  ReviewRequest,
  ContactMessage,
  DashboardStats,
  Category,
  ProductInput,
  ProductFeature,
  ProductImage,
  ProductSpecification,
  StoreLink,
  StoreLinkInput,
};
