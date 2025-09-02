import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Heart, Share2, Reply, ChevronDown, ChevronUp, ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import LazyImage from '../components/LazyImage';
import ConfirmDialog from '../components/ConfirmDialog';
import ReviewModal from '../components/ReviewModal/ReviewModal';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [mediaPreview, setMediaPreview] = useState<{url: string, type: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState<{[key: string]: boolean}>({});
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'review' | 'comment';
    id: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'review',
    id: '',
    title: '',
    message: ''
  });
  const thumbnailsContainerRef = useRef<HTMLDivElement>(null);
  const activeThumbRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/api/v1/products/${id}`);
        const data = await response.json();
        
        // Ensure images is an array of URLs
        if (data) {
          if (Array.isArray(data.images)) {
            // If images is array of objects, map to URLs
            data.images = data.images.map((imgObj: any) => imgObj.image_url || imgObj.url || imgObj);
          } else if (data.images) {
            // If images is a single object or string
            if (typeof data.images === 'object' && data.images.image_url) {
              data.images = [data.images.image_url];
            } else {
              data.images = [data.images];
            }
          } else if (data.image) {
            data.images = [data.image];
          } else {
            data.images = [];
          }
        }
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product details:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        // First get the list of review IDs for this product
        const response = await fetch(`http://127.0.0.1:8000/api/v1/reviews/?product_id=${id}`);
        const reviewsList = await response.json();
        
        // Then fetch detailed data for each review including pros, cons and media
        if (reviewsList && reviewsList.length > 0) {
          const detailedReviews = await Promise.all(
            reviewsList.map(async (review: any) => {
              try {
                const detailResponse = await fetch(`http://127.0.0.1:8000/api/v1/reviews/${review.id}`);
                return await detailResponse.json();
              } catch (error) {
                console.error(`Error fetching detailed review data for ${review.id}:`, error);
                return review; // Return original review if detail fetch fails
              }
            })
          );
          setReviews(detailedReviews);
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    if (id) {
      fetchProductDetails();
      fetchReviews();
    }
  }, [id]);

  const avatarCache = new Map<string, string>();

  const fetchUserAvatar = async (userId: string) => {
    if (avatarCache.has(userId)) {
      return avatarCache.get(userId);
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/users/${userId}`);
      const data = await response.json();
      avatarCache.set(userId, data.avatar);
      return data.avatar;
    } catch (error) {
      console.error(`Error fetching user data for userId: ${userId}`, error);
      return null;
    }
  };

  useEffect(() => {
    const fetchRepliesForReviews = async () => {
      const accessToken = localStorage.getItem('access_token');
      const tokenType = localStorage.getItem('token_type');
      
      // Skip if no auth token available
      if (!accessToken || !tokenType) {
        console.warn('No authentication token available for fetching replies');
      }
      
      const updatedReviews = await Promise.all(
        reviews.map(async (review) => {
          if (!review.repliesFetched) {
            try {
              const response = await fetch(`http://127.0.0.1:8000/api/v1/reviews/${review.id}/comments`, {
                headers: {
                  'Authorization': accessToken && tokenType ? `${tokenType} ${accessToken}` : '',
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                const replies = await response.json();
                // Ensure consistent field names for each reply
                const formattedReplies = replies.map((reply: any) => ({
                  ...reply,
                  // Ensure we have user_name and user_avatar fields
                  user_name: reply.user_name || reply.username || 'Anonymous',
                  user_avatar: reply.user_avatar || reply.avatar || 'https://via.placeholder.com/32'
                }));
                return { ...review, replies: formattedReplies, repliesFetched: true };
              } else {
                console.error(`Error fetching replies for review ${review.id}: ${response.status}`);
                return { ...review, replies: [], repliesFetched: true };
              }
            } catch (error) {
              console.error(`Error fetching replies for review ${review.id}:`, error);
              return { ...review, replies: [], repliesFetched: true };
            }
          }
          return review;
        })
      );
      setReviews(updatedReviews);
    };

    if (reviews.length > 0) {
      fetchRepliesForReviews();
    }
  }, [reviews.length]);

  useEffect(() => {
    const fetchAvatarsForReviews = async () => {
      const updatedReviews = await Promise.all(
        reviews.map(async (review) => {
          if (!review.avatarFetched) {
            // Đảm bảo user_id là một string
            const userId = review.user_id ? review.user_id.toString() : '';
            const avatar = await fetchUserAvatar(userId);
            return { ...review, avatar, avatarFetched: true };
          }
          return review;
        })
      );
      setReviews(updatedReviews);
    };

    if (reviews.length > 0) {
      fetchAvatarsForReviews();
    }
  }, [reviews]);
  
  // Keyboard navigation for image gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!product?.images || product.images.length <= 1) return;
      
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveImage(prev => (prev === product.images.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveImage(prev => (prev === 0 ? product.images.length - 1 : prev - 1));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [product]);
  
  // Scroll active thumbnail into center view with improved precision
  const scrollActiveThumbnailToCenter = useCallback(() => {
    if (!thumbnailsContainerRef.current || !activeThumbRef.current) return;
    
    const container = thumbnailsContainerRef.current;
    const activeThumb = activeThumbRef.current;
    
    const containerWidth = container.offsetWidth;
    const thumbPosition = activeThumb.offsetLeft;
    const thumbWidth = activeThumb.offsetWidth;
    
    // Calculate position to perfectly center the thumbnail
    const scrollPosition = thumbPosition - containerWidth / 2 + thumbWidth / 2;
    
    // Smooth scroll to the calculated position
    container.scrollTo({
      left: Math.max(0, scrollPosition),
      behavior: 'smooth'
    });
    
    // For more precise centering on resize and initial load
    const ensureCentered = () => {
      if (container && activeThumb) {
        const updatedScrollPosition = activeThumb.offsetLeft - container.offsetWidth / 2 + activeThumb.offsetWidth / 2;
        container.scrollLeft = Math.max(0, updatedScrollPosition);
      }
    };
    
    // Additional check after transition
    setTimeout(ensureCentered, 300);
  }, []);
  
  // Center the active thumbnail whenever it changes
  useEffect(() => {
    if (product?.images && product.images.length > 1) {
      // Small delay to ensure the DOM is updated
      setTimeout(scrollActiveThumbnailToCenter, 50);
    }
  }, [activeImage, scrollActiveThumbnailToCenter, product?.images]);

  const toggleReplies = (reviewId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReplies(newExpanded);
  };

  const handleReply = (reviewId: string) => {
    setReplyingTo(reviewId);
    setReplyContent('');
  };

  const submitReply = async (reviewId: string, content: string) => {
    if (!content.trim() || !user) return;

    try {
      const accessToken = localStorage.getItem('access_token');
      const tokenType = localStorage.getItem('token_type');
      
      if (!accessToken || !tokenType) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      
      const response = await fetch(`http://127.0.0.1:8000/api/v1/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${tokenType} ${accessToken}`
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const newReply = await response.json();
        
        // Thêm thông tin người dùng vào reply để hiển thị ngay lập tức
        const formattedReply = {
          ...newReply,
          user_name: user.name || 'Anonymous',
          user_avatar: user.avatar || 'https://via.placeholder.com/32'
        };
        
        setReviews((prevReviews) =>
          prevReviews.map((review) =>
            review.id === reviewId
              ? { ...review, replies: [...(review.replies || []), formattedReply] }
              : review
          )
        );
        
        // Tự động mở phần trả lời sau khi gửi
        if (!expandedReplies.has(reviewId)) {
          const newExpanded = new Set(expandedReplies);
          newExpanded.add(reviewId);
          setExpandedReplies(newExpanded);
        }
        
        // Đóng form reply sau khi gửi thành công
        setReplyingTo(null);
        setReplyContent('');
      } else {
        console.error('Failed to submit reply:', await response.text());
        alert('Không thể gửi trả lời. Vui lòng đăng nhập lại hoặc thử lại sau.');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('Đã xảy ra lỗi khi gửi trả lời.');
    }
  };

  const handleHelpfulVote = async (reviewId: string) => {
    if (!user) {
      // Show login prompt if not logged in
      alert('Vui lòng đăng nhập để đánh giá mức độ hữu ích');
      return;
    }

    try {
      const accessToken = localStorage.getItem('access_token');
      const tokenType = localStorage.getItem('token_type');
      
      if (!accessToken || !tokenType) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      
      const response = await fetch(`http://127.0.0.1:8000/api/v1/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${tokenType} ${accessToken}`
        }
      });

      if (response.ok) {
        // Update the review's helpful count in the state
        setReviews(prevReviews => 
          prevReviews.map(review => 
            review.id === reviewId 
              ? { ...review, helpful_count: (review.helpful_count || 0) + 1, userVotedHelpful: true }
              : review
          )
        );
      } else if (response.status === 400) {
        // User already voted, try to remove vote
        await removeHelpfulVote(reviewId);
      } else {
        console.error('Failed to vote helpful');
      }
    } catch (error) {
      console.error('Error voting helpful:', error);
    }
  };

  const removeHelpfulVote = async (reviewId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const tokenType = localStorage.getItem('token_type');
      
      if (!accessToken || !tokenType) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      
      const response = await fetch(`http://127.0.0.1:8000/api/v1/reviews/${reviewId}/helpful`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${tokenType} ${accessToken}`
        }
      });

      if (response.ok) {
        // Update the review's helpful count in the state
        setReviews(prevReviews => 
          prevReviews.map(review => 
            review.id === reviewId 
              ? { ...review, helpful_count: Math.max(0, (review.helpful_count || 0) - 1), userVotedHelpful: false }
              : review
          )
        );
      } else {
        console.error('Failed to remove helpful vote');
      }
    } catch (error) {
      console.error('Error removing helpful vote:', error);
    }
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  const deleteReview = async (reviewId: string) => {
    if (!user) return;

    try {
      setIsDeleting(prev => ({...prev, [reviewId]: true}));
      
      // Get fresh tokens
      const accessToken = localStorage.getItem('access_token');
      const tokenType = localStorage.getItem('token_type');
      
      if (!accessToken || !tokenType) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      
      const response = await fetch(`http://127.0.0.1:8000/api/v1/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `${tokenType} ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove the review from the UI
        setReviews(prevReviews => prevReviews.filter(review => review.id !== reviewId));
        // Close the dialog
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      } else if (response.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        console.error('Failed to delete review:', await response.text());
        alert('Không thể xóa đánh giá. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Đã xảy ra lỗi khi xóa đánh giá.');
    } finally {
      setIsDeleting(prev => ({...prev, [reviewId]: false}));
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      setIsDeleting(prev => ({...prev, [commentId]: true}));
      
      // Get fresh tokens
      const accessToken = localStorage.getItem('access_token');
      const tokenType = localStorage.getItem('token_type');
      
      if (!accessToken || !tokenType) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      
      const response = await fetch(`http://127.0.0.1:8000/api/v1/reviews/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `${tokenType} ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove the comment from the UI
        setReviews(prevReviews => 
          prevReviews.map(review => ({
            ...review,
            replies: review.replies ? review.replies.filter((reply: any) => reply.id !== commentId) : []
          }))
        );
        // Close the dialog
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      } else if (response.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        console.error('Failed to delete comment:', await response.text());
        alert('Không thể xóa bình luận. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Đã xảy ra lỗi khi xóa bình luận.');
    } finally {
      setIsDeleting(prev => ({...prev, [commentId]: false}));
    }
  };

  const handleConfirmDeleteReview = (reviewId: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'review',
      id: reviewId,
      title: 'Xóa đánh giá',
      message: 'Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.'
    });
  };

  const handleConfirmDeleteComment = (commentId: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'comment',
      id: commentId,
      title: 'Xóa bình luận',
      message: 'Bạn có chắc chắn muốn xóa bình luận này? Hành động này không thể hoàn tác.'
    });
  };

  const handleConfirmAction = () => {
    if (confirmDialog.type === 'review') {
      deleteReview(confirmDialog.id);
    } else {
      deleteComment(confirmDialog.id);
    }
  };

  const handleCancelAction = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleReviewSubmit = async (reviewData: any) => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const tokenType = localStorage.getItem('token_type');
      
      if (!accessToken || !tokenType) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      // First, create the review
      const reviewResponse = await fetch('http://127.0.0.1:8000/api/v1/reviews/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${tokenType} ${accessToken}`
        },
        body: JSON.stringify({
          product_id: reviewData.productId,
          rating: reviewData.rating,
          title: reviewData.title,
          content: reviewData.content
        }),
      });

      if (!reviewResponse.ok) {
        const errorData = await reviewResponse.text();
        console.error('Review creation failed:', errorData);
        throw new Error('Failed to create review');
      }

      const newReview = await reviewResponse.json();

      // Add pros if any
      if (reviewData.pros && reviewData.pros.length > 0) {
        for (let i = 0; i < reviewData.pros.length; i++) {
          const pro = reviewData.pros[i];
          if (pro.trim()) {
            const proResponse = await fetch(`http://127.0.0.1:8000/api/v1/reviews/${newReview.id}/pros`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `${tokenType} ${accessToken}`
              },
              body: JSON.stringify({
                pro_text: pro,
                sort_order: i
              }),
            });
            
            if (!proResponse.ok) {
              console.error('Failed to add pro:', await proResponse.text());
            }
          }
        }
      }

      // Add cons if any
      if (reviewData.cons && reviewData.cons.length > 0) {
        for (let i = 0; i < reviewData.cons.length; i++) {
          const con = reviewData.cons[i];
          if (con.trim()) {
            const conResponse = await fetch(`http://127.0.0.1:8000/api/v1/reviews/${newReview.id}/cons`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `${tokenType} ${accessToken}`
              },
              body: JSON.stringify({
                con_text: con,
                sort_order: i
              }),
            });
            
            if (!conResponse.ok) {
              console.error('Failed to add con:', await conResponse.text());
            }
          }
        }
      }

      // Add media if any - upload to Discord via backend
      if (reviewData.mediaFiles && reviewData.mediaFiles.length > 0) {
        for (let i = 0; i < reviewData.mediaFiles.length; i++) {
          const file = reviewData.mediaFiles[i];
          const formData = new FormData();
          formData.append('file', file);
          formData.append('media_type', file.type);
          formData.append('sort_order', i.toString());

          const mediaResponse = await fetch(`http://127.0.0.1:8000/api/v1/reviews/${newReview.id}/media/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `${tokenType} ${accessToken}`
            },
            body: formData,
          });
          
          if (!mediaResponse.ok) {
            console.error('Failed to upload media:', await mediaResponse.text());
          }
        }
      }

      // Refresh reviews to show the new one
      const refreshResponse = await fetch(`http://127.0.0.1:8000/api/v1/reviews/?product_id=${id}`);
      if (refreshResponse.ok) {
        const refreshedReviewsList = await refreshResponse.json();
        
        if (refreshedReviewsList && refreshedReviewsList.length > 0) {
          const detailedReviews = await Promise.all(
            refreshedReviewsList.map(async (review: any) => {
              try {
                const detailResponse = await fetch(`http://127.0.0.1:8000/api/v1/reviews/${review.id}`);
                if (detailResponse.ok) {
                  return await detailResponse.json();
                } else {
                  return review;
                }
              } catch (error) {
                console.error(`Error fetching review details for ${review.id}:`, error);
                return review;
              }
            })
          );
          setReviews(detailedReviews);
        }
      }

      alert('Đánh giá đã được gửi thành công!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Đã xảy ra lỗi khi gửi đánh giá. Vui lòng thử lại sau.');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading product details...</div>;
  }

  if (!product) {
    return (
      <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        <p className="text-lg">Product not found.</p>
      </div>
    );
  }

  const reviewsToDisplay = reviews || [];

  // Format price with thousand separator
  const formatPrice = (price: string | number): string => {
    if (typeof price === 'string') {
      price = parseFloat(price);
    }
    return Math.floor(price)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
  };

  // Calculate discount percentage
  const calculateDiscount = (originalPrice: number | string, currentPrice: number | string): number => {
    const origPrice = typeof originalPrice === 'string' ? parseFloat(originalPrice) : originalPrice;
    const currPrice = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;
    if (!origPrice || origPrice <= currPrice) return 0;
    return Math.round(((origPrice - currPrice) / origPrice) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Product and Image Section - Clean and Compact */}
      <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Left: Product Image with Gallery */}
          <div className="p-4 flex flex-col items-center justify-center">
            <div 
              className="relative aspect-square max-h-[400px] w-full flex items-center justify-center overflow-hidden rounded-lg mb-4 cursor-pointer"
              onClick={() => setIsFullscreen(true)}
              tabIndex={0} // Make focusable for keyboard navigation
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsFullscreen(true);
              }}
            >
              <LazyImage
                src={product.images && product.images.length > 0 
                  ? product.images[activeImage] || product.image 
                  : product.image || 'https://www.svgrepo.com/show/508699/landscape-placeholder.svg'}
                alt={product.name}
                fadeIn={true}
                className="max-h-full max-w-full object-contain shadow-lg transition-all duration-300"
              />
              <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black bg-opacity-60 text-white opacity-70 hover:opacity-100 transition-opacity">
                <ZoomIn size={16} />
              </div>
              
              {/* Left/Right Navigation Arrows */}
              {product.images && product.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImage(prev => (prev === 0 ? product.images.length - 1 : prev - 1));
                    }}
                    className="absolute left-2 p-2 bg-black bg-opacity-50 rounded-full text-white opacity-0 hover:opacity-80 focus:opacity-80 transition-opacity group-hover:opacity-80"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImage(prev => (prev === product.images.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-2 p-2 bg-black bg-opacity-50 rounded-full text-white opacity-0 hover:opacity-80 focus:opacity-80 transition-opacity group-hover:opacity-80"
                    aria-label="Next image"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
            
            {/* Image Selection Thumbnails with Navigation Buttons */}
            {product.images && product.images.length > 1 && (
              <div className="relative w-full max-w-[400px] mt-2">
                {/* Left Navigation Button */}
                <button
                  onClick={() => {
                    if (!thumbnailsContainerRef.current) return;
                    thumbnailsContainerRef.current.scrollBy({ left: -100, behavior: 'smooth' });
                  }}
                  className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center 
                    ${isDark ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-100'} 
                    shadow-md focus:outline-none`}
                  aria-label="Scroll thumbnails left"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div 
                  className="flex items-center justify-start gap-3 overflow-x-auto w-full pb-2 px-10 scroll-smooth hide-scrollbar"
                  ref={thumbnailsContainerRef}
                >
                  {product.images.map((img: string, index: number) => (
                    <button
                      key={index}
                      ref={index === activeImage ? activeThumbRef : null}
                      onClick={() => setActiveImage(index)}
                      className={`relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all duration-200 transform ${
                        activeImage === index 
                          ? `${isDark ? 'border-blue-400' : 'border-blue-500'} scale-110 z-10` 
                          : `${isDark ? 'border-gray-700' : 'border-gray-200'} opacity-60 hover:opacity-90 focus:opacity-90`
                      }`}
                    >
                      <img 
                        src={img} 
                        alt={`${product.name} - Image ${index + 1}`} 
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      {activeImage === index && (
                        <div className="absolute inset-0 bg-blue-500 bg-opacity-10"></div>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Right Navigation Button */}
                <button
                  onClick={() => {
                    if (!thumbnailsContainerRef.current) return;
                    thumbnailsContainerRef.current.scrollBy({ left: 100, behavior: 'smooth' });
                  }}
                  className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center
                    ${isDark ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-100'} 
                    shadow-md focus:outline-none`}
                  aria-label="Scroll thumbnails right"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="p-6 flex flex-col h-full justify-between">
            {/* Product Category */}
            <div className="mb-2">
              <span className="inline-block px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-medium">
                {product.category_name}
              </span>
            </div>
            
            {/* Product Name */}
            <h1 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'} text-xl mb-2 leading-tight`}>
              {product.name}
            </h1>
            
            {/* Rating Bar */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.round(Number(product.average_rating)) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className={`ml-1 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {Number(product.average_rating).toFixed(1)}
              </span>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                ({product.review_count} đánh giá)
              </span>
            </div>
            
            {/* Price Section */}
            <div className="mb-4">
              <div className="flex items-end gap-2">
                <span className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'} text-2xl`}>
                  {formatPrice(product.price)}
                </span>
                {product.original_price && parseFloat(product.original_price) > parseFloat(product.price) && (
                  <>
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(product.original_price)}
                    </span>
                    <span className="text-xs font-medium bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                      -{calculateDiscount(product.original_price, product.price)}%
                    </span>
                  </>
                )}
              </div>
              <div className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {product.availability === 'in_stock' ? 
                  <span className="text-green-500">● Còn hàng</span> : 
                  <span className="text-red-500">● Hết hàng</span>
                }
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              {user ? (
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-center text-sm"
                >
                  Viết đánh giá
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-center text-sm"
                >
                  Đăng nhập để đánh giá
                </Link>
              )}
              <button className={`p-2 rounded-lg border transition-colors ${
                isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'
              }`} title="Yêu thích">
                <Heart className="w-5 h-5" />
              </button>
              <button className={`p-2 rounded-lg border transition-colors ${
                isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'
              }`} title="Chia sẻ">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fullscreen Image Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col items-center justify-center"
          onClick={() => setIsFullscreen(false)}
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsFullscreen(false);
            if (e.key === 'ArrowRight' && product.images && product.images.length > 1) {
              e.preventDefault();
              setActiveImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
            }
            if (e.key === 'ArrowLeft' && product.images && product.images.length > 1) {
              e.preventDefault();
              setActiveImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
            }
          }}
        >
          <div className="absolute top-4 right-4">
            <button 
              className="text-white p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullscreen(false);
              }}
              aria-label="Close fullscreen view"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="relative w-full h-full max-w-4xl max-h-[80vh] flex items-center justify-center p-10">
            <LazyImage
              src={product.images && product.images.length > 0 
                ? product.images[activeImage] || product.image 
                : product.image || 'https://www.svgrepo.com/show/508699/landscape-placeholder.svg'}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
              fadeIn={true}
            />
            
            {product.images && product.images.length > 1 && (
              <>
                <button 
                  className="absolute left-4 p-3 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 focus:bg-opacity-70 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
                  }}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  className="absolute right-4 p-3 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 focus:bg-opacity-70 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
                  }}
                  aria-label="Next image"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
          
          {/* Thumbnail Strip with Navigation Buttons for Fullscreen Mode */}
          {product.images && product.images.length > 1 && (
            <div className="relative max-w-[80vw]" onClick={(e) => e.stopPropagation()}>
              {/* Left Navigation Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const thumbnailStrip = e.currentTarget.nextElementSibling as HTMLDivElement;
                  if (thumbnailStrip) {
                    thumbnailStrip.scrollBy({ left: -150, behavior: 'smooth' });
                  }
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center 
                  bg-black bg-opacity-50 text-white hover:bg-opacity-70 focus:bg-opacity-70 shadow-md"
                aria-label="Scroll thumbnails left"
              >
                <ChevronLeft size={18} />
              </button>

              <div 
                className="flex items-center justify-start gap-3 p-4 overflow-x-auto scroll-smooth px-12 hide-scrollbar"
              >
                {product.images.map((img: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all duration-200 transform ${
                      activeImage === index 
                        ? 'border-white scale-110 z-10' 
                        : 'border-gray-700 opacity-50 hover:opacity-80 focus:opacity-80'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`${product.name} - Image ${index + 1}`} 
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {activeImage === index && (
                      <div className="absolute inset-0 bg-white bg-opacity-10"></div>
                    )}
                  </button>
                ))}
              </div>

              {/* Right Navigation Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const thumbnailStrip = e.currentTarget.previousElementSibling as HTMLDivElement;
                  if (thumbnailStrip) {
                    thumbnailStrip.scrollBy({ left: 150, behavior: 'smooth' });
                  }
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center
                  bg-black bg-opacity-50 text-white hover:bg-opacity-70 focus:bg-opacity-70 shadow-md"
                aria-label="Scroll thumbnails right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Description Section - Added as requested */}
      <div className={`mt-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm p-6`}>
        <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Mô tả sản phẩm
        </h2>
        <div className={`prose max-w-none ${isDark ? 'prose-invert text-gray-300' : 'text-gray-600'}`}>
          <p className="leading-relaxed text-sm">
            {product.description}
          </p>
        </div>
      </div>


      {/* Reviews Section - Cleaner design */}
      <div className={`mt-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Đánh giá ({Array.isArray(reviews) ? reviews.length : 0})
          </h2>
          {user ? (
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="text-orange-500 hover:text-orange-600 font-medium text-sm"
            >
              + Thêm đánh giá
            </button>
          ) : (
            <Link
              to="/login"
              className="text-orange-500 hover:text-orange-600 font-medium text-sm"
            >
              Đăng nhập để đánh giá
            </Link>
          )}
        </div>
        
        {Array.isArray(reviewsToDisplay) && reviewsToDisplay.length > 0 ? (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {reviewsToDisplay.map((review: any) => (
              <div key={review.id} className={`border-b last:border-none pb-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                {/* Main Review */}
                <div className="flex gap-3">
                  <img
                    src={review.avatar || 'https://via.placeholder.com/40'}
                    alt={review.user_name || "User"}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                      <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {review.user_name || "Anonymous"}
                      </span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {review.created_at ? new Date(review.created_at).toLocaleDateString('vi-VN') : ''}
                      </span>
                    </div>
                    
                    <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                      {review.title}
                    </h4>
                    
                    <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {review.content}
                    </p>
                    
                    {/* Pros and Cons Section */}
                    {(review.pros?.length > 0 || review.cons?.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 mt-2">
                        {/* Pros Section */}
                        {review.pros?.length > 0 && (
                          <div className={`rounded-lg p-3 ${isDark ? 'bg-gray-700/50' : 'bg-green-50'}`}>
                            <h5 className={`text-xs font-medium mb-2 ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                              Ưu điểm
                            </h5>
                            <ul className="space-y-1.5">
                              {review.pros.map((pro: any) => (
                                <li key={pro.id} className="flex items-start gap-2">
                                  <div className={`flex-shrink-0 rounded-full p-0.5 mt-0.5 ${isDark ? 'bg-green-500/30 text-green-400' : 'bg-green-100 text-green-600'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {pro.pro_text}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Cons Section */}
                        {review.cons?.length > 0 && (
                          <div className={`rounded-lg p-3 ${isDark ? 'bg-gray-700/50' : 'bg-red-50'}`}>
                            <h5 className={`text-xs font-medium mb-2 ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                              Nhược điểm
                            </h5>
                            <ul className="space-y-1.5">
                              {review.cons.map((con: any) => (
                                <li key={con.id} className="flex items-start gap-2">
                                  <div className={`flex-shrink-0 rounded-full p-0.5 mt-0.5 ${isDark ? 'bg-red-500/30 text-red-400' : 'bg-red-100 text-red-600'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                    </svg>
                                  </div>
                                  <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {con.con_text}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Review Media Gallery */}
                    {review.media?.length > 0 && (
                      <div className="mb-3">
                        <h5 className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Hình ảnh/Video
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {review.media.map((item: any) => (
                            <div 
                              key={item.id} 
                              className="w-16 h-16 rounded-md overflow-hidden cursor-pointer border border-gray-300 dark:border-gray-700"
                              onClick={() => setMediaPreview({url: item.media_url, type: item.media_type})}
                            >
                              {item.media_type.includes('image') ? (
                                <img 
                                  src={item.media_url} 
                                  alt="Review media" 
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : item.media_type.includes('video') ? (
                                <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-400">
                                    <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zm6.905 9.97a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72V18a.75.75 0 001.5 0v-4.19l1.72 1.72a.75.75 0 101.06-1.06l-3-3z" clipRule="evenodd" />
                                    <path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <button 
                        onClick={() => handleHelpfulVote(review.id)}
                        className={`flex items-center gap-1 text-xs transition-colors ${
                          review.userVotedHelpful 
                            ? (isDark ? 'text-blue-400' : 'text-blue-600')
                            : (isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600')
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0114 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 01-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 01-1.341-.317l-2.734-1.366A3 3 0 016.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 012.166-1.73c.432-.143.853-.386 1.011-.814.16-.432.248-.9.248-1.388z" />
                        </svg>
                        Hữu ích ({review.helpful_count || 0})
                      </button>
                      
                      {user && (
                        <button
                          onClick={() => handleReply(review.id)}
                          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
                        >
                          <Reply className="w-3 h-3" />
                          Trả lời
                        </button>
                      )}
                      
                      {/* Delete Review Button - Only show for review owner or admin */}
                      {user && (user.id === review.user_id || user.role === 'admin') && (
                        <button
                          onClick={() => handleConfirmDeleteReview(review.id)}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
                          aria-label="Delete review"
                          title="Xóa đánh giá"
                          disabled={isDeleting[review.id]}
                        >
                          {isDeleting[review.id] ? (
                            <>
                              <svg className="animate-spin -ml-1 h-3 w-3 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Đang xóa...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                              </svg>
                              Xóa
                            </>
                          )}
                        </button>
                      )}
                      
                      {Array.isArray(review.replies) && review.replies.length > 0 && (
                        <button
                          onClick={() => toggleReplies(review.id)}
                          className={`flex items-center gap-1 text-xs font-medium transition-colors px-2 py-1 rounded-full
                            ${expandedReplies.has(review.id) 
                              ? (isDark ? 'bg-blue-500 bg-opacity-20 text-blue-400' : 'bg-blue-500 bg-opacity-10 text-blue-600') 
                              : 'text-blue-500 hover:text-blue-600'}`}
                        >
                          {expandedReplies.has(review.id) ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                              Ẩn trả lời ({review.replies.length})
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                              Xem trả lời ({review.replies.length})
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Reply Form */}
                    {replyingTo === review.id && (
                      <div className="mt-3 pl-3 border-l-2 border-blue-500 animate-fade-in">
                        <div className="flex gap-2">
                          <img
                            src={user?.avatar || 'https://via.placeholder.com/32'}
                            alt={user?.name || 'You'}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="text-xs font-medium mb-1 text-blue-500">
                              Trả lời bình luận
                            </div>
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Viết trả lời của bạn..."
                              className={`w-full px-3 py-2 text-xs rounded-lg border resize-none ${
                                isDark 
                                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                              rows={2}
                              autoFocus
                            />
                            <div className="flex gap-2 mt-1.5">
                              <button
                                onClick={() => submitReply(review.id, replyContent)}
                                disabled={!replyContent.trim()}
                                className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                              >
                                Gửi
                              </button>
                              <button
                                onClick={cancelReply}
                                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                  isDark 
                                    ? 'text-gray-400 hover:text-gray-300' 
                                    : 'text-gray-500 hover:text-gray-600'
                                }`}
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {expandedReplies.has(review.id) && review.replies && review.replies.length > 0 && (
                      <div className="mt-3 space-y-2 pl-4 animate-fade-in">
                        {review.replies.map((reply: any) => (
                          <div key={reply.id} className="border-l-2 border-gray-300 dark:border-gray-600 pl-3">
                            <div className="flex gap-2">
                              <img
                                src={reply.user_avatar || 'https://via.placeholder.com/32'}
                                alt={reply.user_name || 'User'}
                                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {reply.user_name || 'Anonymous'}
                                  </span>
                                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {reply.created_at ? new Date(reply.created_at).toLocaleDateString('vi-VN') : ''}
                                  </span>
                                </div>
                                <p className={`text-xs leading-relaxed mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {reply.content}
                                </p>
                                {/* Delete Comment Button - Only show for comment owner or admin */}
                                {user && (user.id === reply.user_id || user.role === 'admin') && (
                                  <button
                                    onClick={() => handleConfirmDeleteComment(reply.id)}
                                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors mt-1"
                                    aria-label="Delete comment"
                                    title="Xóa bình luận"
                                    disabled={isDeleting[reply.id]}
                                  >
                                    {isDeleting[reply.id] ? (
                                      <>
                                        <svg className="animate-spin -ml-1 h-3 w-3 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang xóa...
                                      </>
                                    ) : (
                                      <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                                        </svg>
                                        Xóa
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>Chưa có đánh giá nào cho sản phẩm này.</p>
            {user ? (
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="mt-2 inline-block text-blue-500 hover:underline"
              >
                Hãy là người đầu tiên đánh giá!
              </button>
            ) : (
              <Link to="/login" className="mt-2 inline-block text-blue-500 hover:underline">
                Đăng nhập để viết đánh giá
              </Link>
            )}
          </div>
        )}
      </div>
      
      {/* Media Preview Modal */}
      {mediaPreview && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={() => setMediaPreview(null)}
        >
          <div className="absolute top-4 right-4">
            <button 
              className="text-white p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
              onClick={() => setMediaPreview(null)}
              aria-label="Close media preview"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="max-w-4xl max-h-[90vh] p-4">
            {mediaPreview.type.includes('image') ? (
              <img 
                src={mediaPreview.url} 
                alt="Media preview" 
                className="max-w-full max-h-[85vh] object-contain"
              />
            ) : mediaPreview.type.includes('video') ? (
              <video 
                src={mediaPreview.url} 
                controls 
                autoPlay 
                className="max-w-full max-h-[85vh]"
              />
            ) : (
              <div className="bg-white p-4 rounded-lg">
                <a 
                  href={mediaPreview.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Review Modal */}
      {product && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          product={{
            id: product.id,
            name: product.name,
            image: Array.isArray(product.images) && product.images.length > 0 
              ? product.images[0] 
              : 'https://via.placeholder.com/64'
          }}
          onSubmit={handleReviewSubmit}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
        isLoading={isDeleting[confirmDialog.id]}
      />
    </div>
  );
};

export default ProductDetail;