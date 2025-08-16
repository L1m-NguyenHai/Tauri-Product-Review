import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Heart, Share2, ExternalLink, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface Reply {
  id: string;
  user: string;
  avatar: string;
  content: string;
  date: string;
  helpful: number;
}

interface Review {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  helpful: number;
  replies: Reply[];
}

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [activeImage, setActiveImage] = useState(0);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Mock product data with enhanced reviews including replies
  const product = {
    id: '1',
    name: 'iPhone 15 Pro',
    category: 'Smartphones',
    rating: 4.8,
    reviews: 1234,
    price: '$999',
    originalPrice: '$1,099',
    description: 'The iPhone 15 Pro features a titanium design, A17 Pro chip, and advanced camera system with 3x telephoto lens.',
    features: [
      'A17 Pro chip with 6-core GPU',
      'Pro camera system with 48MP main camera',
      '3x Telephoto camera',
      'Titanium design',
      'USB-C connector',
      'Action Button'
    ],
    specifications: {
      'Display': '6.1-inch Super Retina XDR',
      'Chip': 'A17 Pro',
      'Storage': '128GB, 256GB, 512GB, 1TB',
      'Camera': '48MP Main, 12MP Ultra Wide, 12MP Telephoto',
      'Battery': 'Up to 23 hours video playbook',
      'OS': 'iOS 17'
    },
    images: [
      'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=2',
      'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=2',
      'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=2'
    ],
    reviews: [
      {
        id: '1',
        user: 'John Doe',
        avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=2',
        rating: 5,
        date: '2024-01-15',
        title: 'Excellent upgrade from iPhone 14',
        content: 'The titanium build feels premium and the camera improvements are noticeable. Battery life is also better than expected. The Action Button is a game-changer for quick access to frequently used functions.',
        helpful: 23,
        replies: [
          {
            id: 'r1',
            user: 'Sarah Chen',
            avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=2',
            content: 'Totally agree about the Action Button! I\'ve set mine to toggle the flashlight and it\'s so convenient.',
            date: '2024-01-16',
            helpful: 8
          },
          {
            id: 'r2',
            user: 'Mike Rodriguez',
            avatar: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=2',
            content: 'How\'s the battery life compared to your iPhone 14? I\'m considering the upgrade.',
            date: '2024-01-17',
            helpful: 5
          }
        ]
      },
      {
        id: '2',
        user: 'Sarah Wilson',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=2',
        rating: 4,
        date: '2024-01-10',
        title: 'Great phone but expensive',
        content: 'Love the new features and performance, but the price point is quite high. Worth it if you need the latest tech. The camera quality in low light is impressive.',
        helpful: 15,
        replies: [
          {
            id: 'r3',
            user: 'Alex Thompson',
            avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=2',
            content: 'The price is steep, but I think the titanium build and improved cameras justify it for professional use.',
            date: '2024-01-11',
            helpful: 12
          }
        ]
      },
      {
        id: '3',
        user: 'Tech Enthusiast',
        avatar: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=2',
        rating: 5,
        date: '2024-01-08',
        title: 'Best iPhone yet',
        content: 'The A17 Pro chip performance is incredible. Gaming and video editing are buttery smooth. USB-C finally makes it universal.',
        helpful: 31,
        replies: []
      }
    ] as Review[],
    buyLinks: [
      { store: 'Apple Store', price: '$999', url: '#', official: true },
      { store: 'Amazon', price: '$979', url: '#', official: false },
      { store: 'Best Buy', price: '$999', url: '#', official: false }
    ]
  };

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

  const submitReply = () => {
    if (!replyContent.trim() || !user) return;
    
    // In a real app, this would make an API call
    console.log('Submitting reply:', { reviewId: replyingTo, content: replyContent });
    
    setReplyingTo(null);
    setReplyContent('');
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  return (
    <div className="space-y-8">
      {/* Product Header */}
      <div className={`rounded-xl p-6 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } shadow-sm`}>
        <div className="mb-6">
          <span className="text-blue-500 font-medium">{product.category}</span>
          <h1 className={`text-3xl font-bold mt-1 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {product.name}
          </h1>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.floor(product.rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className={`ml-2 font-medium ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {product.rating}
            </span>
          </div>
          <span className={`${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            ({product.reviews.length} reviews)
          </span>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <span className={`text-3xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {product.price}
          </span>
          {product.originalPrice && (
            <span className="text-xl text-gray-500 line-through">
              {product.originalPrice}
            </span>
          )}
        </div>

        <p className={`text-lg mb-6 ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {product.description}
        </p>

        <div className="flex gap-3">
          {user ? (
            <Link
              to={`/review/${product.id}`}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Write Review
            </Link>
          ) : (
            <Link
              to="/login"
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Sign In to Review
            </Link>
          )}
          <button className={`p-3 rounded-lg border transition-colors ${
            isDark 
              ? 'border-gray-600 hover:bg-gray-700' 
              : 'border-gray-300 hover:bg-gray-50'
          }`}>
            <Heart className="w-5 h-5" />
          </button>
          <button className={`p-3 rounded-lg border transition-colors ${
            isDark 
              ? 'border-gray-600 hover:bg-gray-700' 
              : 'border-gray-300 hover:bg-gray-50'
          }`}>
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content: Side-by-Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Product Images */}
        <div className={`rounded-xl p-6 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-sm`}>
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden">
              <img
                src={product.images[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2 justify-center">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    activeImage === index 
                      ? 'border-blue-500 scale-105' 
                      : isDark 
                        ? 'border-gray-600 hover:border-gray-500' 
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Reviews with Reply System */}
        <div className={`rounded-xl p-6 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-sm`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Reviews ({product.reviews.length})
            </h2>
            {user ? (
              <Link
                to={`/review/${product.id}`}
                className="text-orange-500 hover:text-orange-600 font-medium text-sm"
              >
                Write Review
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-orange-500 hover:text-orange-600 font-medium text-sm"
              >
                Sign In to Review
              </Link>
            )}
          </div>

          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
            {product.reviews.map((review) => (
              <div key={review.id} className={`border-b pb-6 ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                {/* Main Review */}
                <div className="flex items-start gap-3">
                  <img
                    src={review.avatar}
                    alt={review.user}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`font-medium text-sm ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {review.user}
                      </span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-xs ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {review.date}
                      </span>
                    </div>
                    
                    <h4 className={`font-medium mb-2 text-sm ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {review.title}
                    </h4>
                    
                    <p className={`text-sm mb-3 leading-relaxed ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {review.content}
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <button className={`text-xs transition-colors ${
                        isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'
                      }`}>
                        Helpful ({review.helpful})
                      </button>
                      
                      {user && (
                        <button
                          onClick={() => handleReply(review.id)}
                          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
                        >
                          <Reply className="w-3 h-3" />
                          Reply
                        </button>
                      )}
                      
                      {review.replies.length > 0 && (
                        <button
                          onClick={() => toggleReplies(review.id)}
                          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
                        >
                          {expandedReplies.has(review.id) ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                              Hide Replies ({review.replies.length})
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                              Show Replies ({review.replies.length})
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Reply Form */}
                    {replyingTo === review.id && (
                      <div className="mt-4 pl-4 border-l-2 border-blue-500">
                        <div className="flex gap-2">
                          <img
                            src={user?.avatar || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=32&h=32&dpr=2'}
                            alt={user?.name || 'You'}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write your reply..."
                              className={`w-full px-3 py-2 text-sm rounded-lg border resize-none ${
                                isDark 
                                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                              rows={3}
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={submitReply}
                                disabled={!replyContent.trim()}
                                className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                              >
                                Reply
                              </button>
                              <button
                                onClick={cancelReply}
                                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                  isDark 
                                    ? 'text-gray-400 hover:text-gray-300' 
                                    : 'text-gray-500 hover:text-gray-600'
                                }`}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {expandedReplies.has(review.id) && review.replies.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {review.replies.map((reply) => (
                          <div key={reply.id} className="pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                            <div className="flex items-start gap-2">
                              <img
                                src={reply.avatar}
                                alt={reply.user}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`font-medium text-xs ${
                                    isDark ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {reply.user}
                                  </span>
                                  <span className={`text-xs ${
                                    isDark ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {reply.date}
                                  </span>
                                </div>
                                <p className={`text-xs leading-relaxed mb-2 ${
                                  isDark ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  {reply.content}
                                </p>
                                <button className={`text-xs transition-colors ${
                                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'
                                }`}>
                                  Helpful ({reply.helpful})
                                </button>
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
        </div>
      </div>

      {/* Features and Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`rounded-xl p-6 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-sm`}>
          <h2 className={`text-xl font-bold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Key Features
          </h2>
          <ul className="space-y-2">
            {product.features.map((feature, index) => (
              <li key={index} className={`flex items-center gap-2 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className={`rounded-xl p-6 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-sm`}>
          <h2 className={`text-xl font-bold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Specifications
          </h2>
          <dl className="space-y-3">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <dt className={`font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {key}
                </dt>
                <dd className={`text-right ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Where to Buy */}
      <div className={`rounded-xl p-6 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } shadow-sm`}>
        <h2 className={`text-xl font-bold mb-4 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Where to Buy
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {product.buyLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors hover:${
                isDark ? 'bg-gray-700' : 'bg-gray-50'
              } ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {link.store}
                  </span>
                  {link.official && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                      Official
                    </span>
                  )}
                </div>
                <span className={`text-lg font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {link.price}
                </span>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;