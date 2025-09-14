import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { authAPI } from '../services/api';

const Login: React.FC = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState('');
  
  const { login } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // Handle state from registration redirect
  useEffect(() => {
    if (location.state?.showEmailVerificationWarning) {
      setEmailNotVerified(true);
      setRegistrationMessage(location.state.message || '');
      
      if (location.state.email) {
        setEmail(location.state.email);
      }
      
      // Clear the state to prevent showing on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Don't clear emailNotVerified if it was set from registration
    if (!registrationMessage) {
      setEmailNotVerified(false);
    }
    setLoading(true);

    try {
      // Check email verification status first
      const verificationStatus = await authAPI.checkEmailVerification(email);
      
      if (!verificationStatus.email_verified) {
        setEmailNotVerified(true);
        setError('');
        setLoading(false);
        return;
      }
      
      // If email is verified, proceed with login
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      // Handle email verification check errors
      if (err.message.includes('User not found') || err.message.includes('404')) {
        setError('Invalid email or password');
        if (!registrationMessage) {
          setEmailNotVerified(false);
        }
      } else if (err.message === 'EMAIL_NOT_VERIFIED') {
        setEmailNotVerified(true);
        setError('');
      } else if (err.message === 'INVALID_CREDENTIALS') {
        setError('Invalid email or password');
        // Only clear emailNotVerified if it wasn't from registration
        if (!registrationMessage) {
          setEmailNotVerified(false);
        }
      } else {
        setError('An error occurred during login');
        if (!registrationMessage) {
          setEmailNotVerified(false);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Back to Home Button */}
      <Link
        to="/"
        className={`fixed top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isDark 
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700' 
            : 'bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 border border-gray-200'
        } shadow-sm`}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Home className="w-8 h-8 text-orange-500" />
            <span className={`text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              LimReview
            </span>
          </Link>
        </div>
        
        <div className="text-center">
          <h2 className={`text-3xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Welcome Back
          </h2>
          <p className={`mt-2 text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Sign in to your LimReview account
          </p>
        </div>

        <div className={`rounded-xl p-8 shadow-lg border ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } ${
          isDark ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {emailNotVerified && (
              <div className={`border rounded-lg p-4 ${
                isDark ? 'bg-orange-900/50 border-orange-700' : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-orange-800' : 'bg-orange-100'
                  }`}>
                    <Mail className={`w-3 h-3 ${
                      isDark ? 'text-orange-300' : 'text-orange-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-sm font-medium ${
                      isDark ? 'text-orange-300' : 'text-orange-800'
                    }`}>
                      Email chưa được xác nhận
                    </h3>
                    <p className={`text-sm mt-1 ${
                      isDark ? 'text-orange-400' : 'text-orange-700'
                    }`}>
                      {registrationMessage || 'Bạn cần xác nhận email trước khi đăng nhập. Kiểm tra hộp thư của bạn.'}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Link
                        to="/resend-verification"
                        state={{ email }}
                        className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                          isDark 
                            ? 'bg-orange-800 hover:bg-orange-700 text-orange-200' 
                            : 'bg-orange-100 hover:bg-orange-200 text-orange-800'
                        }`}
                      >
                        Gửi lại email xác nhận
                      </Link>
                      <a
                        href="mailto:"
                        className={`text-xs px-3 py-1 rounded-md font-medium transition-colors border ${
                          isDark 
                            ? 'border-orange-700 text-orange-300 hover:bg-orange-900' 
                            : 'border-orange-200 text-orange-700 hover:bg-orange-50'
                        }`}
                      >
                        Mở email
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 rounded-lg border transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-500 hover:text-blue-600 font-medium">
                Sign up
              </Link>
            </p>
          </div>

          <div className={`mt-6 pt-6 border-t ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="text-center">
              <p className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              } mb-2`}>
                Demo Credentials:
              </p>
              <div className="space-y-2 text-xs flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                    Admin: admin@example.com / password
                  </span>
                  <button
                    type="button"
                    className="ml-1 px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-600 text-xs font-semibold border border-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onClick={() => {
                      setEmail('admin@example.com');
                      setPassword('password');
                    }}
                    aria-label="Fill admin credentials"
                  >
                    Autofill
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                    User: test@test.com / 123123
                  </span>
                  <button
                    type="button"
                    className="ml-1 px-2 py-1 rounded bg-green-100 hover:bg-green-200 text-green-700 text-xs font-semibold border border-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
                    onClick={() => {
                      setEmail('test@test.com');
                      setPassword('123123');
                    }}
                    aria-label="Fill user credentials"
                  >
                    Autofill
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;