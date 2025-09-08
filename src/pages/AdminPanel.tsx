import React, { useState } from 'react';
import { Users, MessageSquare, Package, TrendingUp, Eye, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const AdminPanel: React.FC = () => {
  const { isDark } = useTheme();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isAdmin) {
    return (
      <div className={`text-center py-12 ${
        isDark ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <p className="text-lg">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  const stats = [
    { icon: Users, label: 'Total Users', value: '1,234', change: '+12%' },
    { icon: MessageSquare, label: 'Total Reviews', value: '15,234', change: '+8%' },
    { icon: Package, label: 'Products', value: '2,890', change: '+15%' },
    { icon: TrendingUp, label: 'Pending Requests', value: '23', change: '+5%' }
  ];

  const recentReviews = [
    {
      id: '1',
      user: 'HuyNe hehe',
      product: 'iPhone 15 Pro',
      rating: 5,
      status: 'published',
      date: '2024-01-15'
    },
    {
      id: '2',
      user: 'Sarah Wilson',
      product: 'MacBook Pro M3',
      rating: 4,
      status: 'pending',
      date: '2024-01-14'
    },
    {
      id: '3',
      user: 'Mike Johnson',
      product: 'Sony WH-1000XM5',
      rating: 5,
      status: 'published',
      date: '2024-01-13'
    }
  ];

  const reviewRequests = [
    {
      id: '1',
      product: 'Steam Deck OLED',
      user: 'gaming_enthusiast@email.com',
      category: 'Gaming',
      status: 'pending',
      date: '2024-01-15'
    },
    {
      id: '2',
      product: 'Google Pixel 8 Pro',
      user: 'tech_reviewer@email.com',
      category: 'Smartphones',
      status: 'approved',
      date: '2024-01-14'
    },
    {
      id: '3',
      product: 'Framework Laptop 16',
      user: 'dev_user@email.com',
      category: 'Laptops',
      status: 'pending',
      date: '2024-01-13'
    }
  ];

  const users = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      reviews: 23,
      joinDate: '2023-06-15',
      status: 'active'
    },
    {
      id: '2',
      name: 'Sarah Wilson',
      email: 'sarah@example.com',
      role: 'user',
      reviews: 45,
      joinDate: '2023-03-20',
      status: 'active'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      role: 'reviewer',
      reviews: 12,
      joinDate: '2023-12-01',
      status: 'active'
    }
  ];

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

  return (
    <div className="space-y-8">
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
            <TabButton id="reviews" label="Reviews" count={recentReviews.length} />
            <TabButton id="requests" label="Requests" count={reviewRequests.length} />
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg ${
                    isDark ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      New review submitted for iPhone 15 Pro by John Doe
                    </p>
                    <p className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      2 hours ago
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    isDark ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Review request for Steam Deck OLED received
                    </p>
                    <p className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      4 hours ago
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    isDark ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      New user registration: Sarah Wilson
                    </p>
                    <p className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      1 day ago
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  User Management
                </h3>
              </div>
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
                        Reviews
                      </th>
                      <th className={`text-left py-3 px-4 font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Join Date
                      </th>
                      <th className={`text-left py-3 px-4 font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Status
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
                            <div className={`font-medium ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {user.name}
                            </div>
                            <div className={`text-sm ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'admin'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : user.role === 'reviewer'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className={`py-3 px-4 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {user.reviews}
                        </td>
                        <td className={`py-3 px-4 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {user.joinDate}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            user.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button className="p-1 text-blue-500 hover:text-blue-600">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-500 hover:text-gray-600">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-red-500 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Review Management
                </h3>
              </div>
              <div className="space-y-4">
                {recentReviews.map((review) => (
                  <div key={review.id} className={`p-4 rounded-lg border ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-medium ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {review.product}
                        </h4>
                        <p className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          by {review.user} • {review.date}
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
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {review.status}
                        </span>
                        <button className="p-1 text-green-500 hover:text-green-600">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-red-500 hover:text-red-600">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Review Requests
                </h3>
              </div>
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
                          {request.product}
                        </h4>
                        <p className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Requested by {request.user}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-blue-500">
                            {request.category}
                          </span>
                          <span className={`text-sm ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            • {request.date}
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
                        <button className="p-1 text-green-500 hover:text-green-600">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-red-500 hover:text-red-600">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;