import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Edit, Star, Calendar, Award, TrendingUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const UserProfile: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reviews');

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Mock user data
  const userStats = {
    totalReviews: 23,
    helpfulVotes: 156,
    followers: 89,
    avgRating: 4.2
  };

  const userReviews = [
    {
      id: '1',
      product: 'iPhone 15 Pro',
      rating: 5,
      title: 'Excellent upgrade from iPhone 14',
      date: '2024-01-15',
      helpful: 23,
      image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=100&h=80&dpr=2'
    },
    {
      id: '2',
      product: 'MacBook Pro M3',
      rating: 4,
      title: 'Powerful but expensive',
      date: '2024-01-10',
      helpful: 15,
      image: 'https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&w=100&h=80&dpr=2'
    },
    {
      id: '3',
      product: 'Sony WH-1000XM5',
      rating: 5,
      title: 'Best noise canceling headphones',
      date: '2024-01-05',
      helpful: 31,
      image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=100&h=80&dpr=2'
    }
  ];

  if (!user) {
    return (
      <div className={`text-center py-12 ${
        isDark ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <p className="text-lg">Please log in to view your profile.</p>
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
            <button className="absolute bottom-2 right-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className={`text-3xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {user.name}
                </h1>
                <p className={`text-lg ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {user.email}
                </p>
                {user.role === 'admin' && (
                  <span className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                    Admin
                  </span>
                )}
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {userStats.totalReviews}
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
                  {userStats.helpfulVotes}
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
                  {userStats.followers}
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
                  {userStats.avgRating}
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

      {/* Achievements */}
      <div className={`rounded-xl p-6 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } shadow-sm`}>
        <h2 className={`text-xl font-semibold mb-4 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Achievements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border ${
            isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className={`font-medium ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Top Reviewer
                </h3>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  20+ helpful reviews
                </p>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg border ${
            isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className={`font-medium ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Quality Contributor
                </h3>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  High-quality reviews
                </p>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg border ${
            isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className={`font-medium ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Rising Star
                </h3>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Fast-growing reviewer
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              {userReviews.map((review) => (
                <div key={review.id} className={`p-4 rounded-lg border ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <div className="flex gap-4">
                    <img
                      src={review.image}
                      alt={review.product}
                      className="w-16 h-12 object-cover rounded-lg"
                    />
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
                            {review.product}
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
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {review.date}
                        </span>
                        <span>{review.helpful} found helpful</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
    </div>
  );
};

export default UserProfile;