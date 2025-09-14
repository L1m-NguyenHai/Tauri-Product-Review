import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';

interface ResendStatus {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
}

const ResendVerification: React.FC = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<ResendStatus>({
    status: 'idle',
    message: ''
  });

  // Pre-fill email if passed from login page
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setResendStatus({
        status: 'error',
        message: 'Vui lòng nhập địa chỉ email.'
      });
      return;
    }

    setResendStatus({
      status: 'loading',
      message: 'Đang gửi email xác nhận...'
    });

    try {
      const response = await authAPI.sendVerificationEmail(email);
      setResendStatus({
        status: 'success',
        message: response.message || 'Email xác nhận đã được gửi thành công!'
      });
    } catch (error: any) {
      console.error('Failed to send verification email:', error);
      
      let errorMessage = 'Có lỗi xảy ra khi gửi email xác nhận.';
      
      if (error.detail) {
        switch (error.detail) {
          case 'User not found':
            errorMessage = 'Không tìm thấy tài khoản với email này.';
            break;
          case 'Email already verified':
            errorMessage = 'Email này đã được xác nhận.';
            break;
          default:
            errorMessage = error.detail;
        }
      }

      setResendStatus({
        status: 'error',
        message: errorMessage
      });
    }
  };

  const renderStatusMessage = () => {
    if (resendStatus.status === 'idle') return null;

    const statusClasses = {
      loading: 'bg-blue-50 border-blue-200 text-blue-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800'
    };

    const iconClasses = {
      loading: 'text-blue-500',
      success: 'text-green-500',
      error: 'text-red-500'
    };

    return (
      <div className={`rounded-md border p-4 mb-6 ${statusClasses[resendStatus.status]}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {resendStatus.status === 'loading' && (
              <div className={`animate-spin rounded-full h-5 w-5 border-b-2 border-current ${iconClasses.loading}`}></div>
            )}
            {resendStatus.status === 'success' && (
              <svg className={`h-5 w-5 ${iconClasses.success}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {resendStatus.status === 'error' && (
              <svg className={`h-5 w-5 ${iconClasses.error}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{resendStatus.message}</p>
            {resendStatus.status === 'success' && (
              <p className="text-sm mt-2">
                Vui lòng kiểm tra email và click vào link xác nhận. 
                Email có thể nằm trong thư mục spam/junk.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            Gửi lại Email Xác nhận
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Nhập email đã đăng ký để nhận lại email xác nhận
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          {renderStatusMessage()}
          
          {resendStatus.status !== 'success' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Địa chỉ Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={resendStatus.status === 'loading'}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={resendStatus.status === 'loading'}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendStatus.status === 'loading' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang gửi...
                    </>
                  ) : (
                    'Gửi lại Email Xác nhận'
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center space-y-2">
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              Quay lại đăng nhập
            </Link>
            <br />
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              Đăng ký tài khoản mới
            </Link>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Lưu ý
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Email xác nhận có hiệu lực trong 24 giờ</li>
                  <li>Kiểm tra thư mục spam/junk nếu không thấy email</li>
                  <li>Chỉ có thể gửi lại email cho tài khoản chưa được xác nhận</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResendVerification;