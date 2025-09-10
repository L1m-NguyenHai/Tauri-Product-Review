import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Edit, Star, Calendar, Award, TrendingUp, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import EditableUserName from '../components/EditableUserName';

const UserProfile: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reviews');
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({
    total_reviews: 0,
    helpful_votes: 0,
    followers: 0,
    avg_rating: 0
  });
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<{url: string, type: string} | null>(null);


  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('avatar', file);
    setUploadingAvatar(true);
    try {
      const tokenType = localStorage.getItem('token_type');
      const accessToken = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/api/v1/users/profile/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `${tokenType} ${accessToken}`
        },
        body: formData
      } as any); // 'as any' to avoid TS error for headers+body
      if (response.ok) {
        // Reload page or refetch user info
        window.location.reload();
      } else {
        alert('Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const tokenType = localStorage.getItem('token_type');
        const accessToken = localStorage.getItem('access_token');
        // Fetch user statistics
        const statsResponse = await fetch(`http://127.0.0.1:8000/api/v1/users/profile/stats`, {
          headers: {
            'Authorization': `${tokenType} ${accessToken}`
          }
        });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setUserStats(statsData);
        }
        // Fetch user reviews
        const reviewsResponse = await fetch(`http://127.0.0.1:8000/api/v1/users/${user.id}/reviews`, {
          headers: {
            'Authorization': `${tokenType} ${accessToken}`
          }
        });
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          // Lấy media của từng review từ API review detail (giống ProductDetail)
          const reviewsWithMedia = await Promise.all(
            (reviewsData.items || []).map(async (review: any) => {
              try {
                const detailRes = await fetch(`http://127.0.0.1:8000/api/v1/reviews/${review.id}`);
                if (detailRes.ok) {
                  const detail = await detailRes.json();
                  return { ...review, ...detail };
                }
              } catch (e) {
                console.error('Error fetching review detail:', e);
              }
              return review;
            })
          );
          setUserReviews(reviewsWithMedia);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user, navigate]);

  if (!user) {
    return (
      <div className={`text-center py-12 ${
        isDark ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <p className="text-lg">Please log in to view your profile.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`text-center py-12 ${
        isDark ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <p className="text-lg">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className={`rounded-xl p-8 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } shadow-sm`}>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <label className="absolute bottom-2 right-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors cursor-pointer">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar}
                aria-label="Upload profile picture"
                title="Upload profile picture"
              />
            </label>
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="text-white text-sm">Uploading...</div>
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <EditableUserName name={user.name} isDark={isDark} email={user.email} role={user.role} />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {userStats.total_reviews || 0}
                </div>
                <div className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Reviews
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {userStats.helpful_votes || 0}
                </div>
                <div className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Helpful Votes
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {userStats.followers || 0}
                </div>
                <div className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Followers
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {userStats.avg_rating || 0}
                </div>
                <div className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Avg Rating
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements section removed */}

      {/* Content Tabs */}
      <div className={`rounded-xl ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } shadow-sm`}>
        <div className={`border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <nav className="flex">
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'reviews'
                  ? 'border-blue-500 text-blue-500'
                  : isDark
                  ? 'border-transparent text-gray-400 hover:text-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Reviews ({userReviews.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'activity'
                  ? 'border-blue-500 text-blue-500'
                  : isDark
                  ? 'border-transparent text-gray-400 hover:text-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Activity
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {userReviews.length > 0 ? (
                userReviews.map((review) => (
                  <div key={review.id} className={`p-4 rounded-lg border ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <div className="flex gap-4">
                      <div className="w-16 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                        {(() => {
                          if (Array.isArray(review.media) && review.media.length > 0) {
                            const m = review.media[0];
                            
                            if (m.media_type?.startsWith('image')) {
                              return (
                                <img
                                  src={m.media_url}
                                  alt={review.product_name}
                                  className="w-full h-full object-cover cursor-pointer"
                                  onClick={() => setMediaPreview({ url: m.media_url, type: m.media_type })}
                                />
                              );
                            } else if (m.media_type?.startsWith('video')) {
                              return (
                                <button
                                  className="w-full h-full bg-gray-800 flex items-center justify-center border-none p-0 cursor-pointer relative"
                                  onClick={() => setMediaPreview({ url: m.media_url, type: m.media_type })}
                                  title="Xem video"
                                >
                                  {m.thumbnail ? (
                                    <img 
                                      src={m.thumbnail} 
                                      alt="Video thumbnail" 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-white text-2xl">▶</span>
                                  )}
                                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                                    <span className="text-white text-lg">▶</span>
                                  </div>
                                </button>
                              );
                            } else {
                              return <span className="text-xs text-gray-500">Unknown Media</span>;
                            }
                          } else {
                            return <span className="text-xs text-gray-500">No Image</span>;
                          }
                        })()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className={`font-medium ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {review.title}
                            </h3>
                            <p className={`text-sm ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {review.product_name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className={`text-sm mt-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {review.content?.substring(0, 150)}
                          {review.content?.length > 150 ? '...' : ''}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                          <span>Status: {review.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className={`${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    No reviews yet. Start reviewing products to build your profile!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="text-center py-8">
              <p className={`${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Activity feed coming soon...
              </p>
            </div>
          )}
        </div>
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
              onClick={(e) => {
                e.stopPropagation();
                setMediaPreview(null);
              }}
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
              <div className="text-white">Unsupported media type</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;