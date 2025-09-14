import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

interface VerificationStatus {
  status: 'loading' | 'success' | 'error' | 'invalid';
  message: string;
  email?: string;
}

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    status: 'loading',
    message: 'Đang xác nhận email của bạn...'
  });

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setVerificationStatus({
          status: 'invalid',
          message: 'Token xác nhận không hợp lệ. Vui lòng kiểm tra lại link trong email.'
        });
        return;
      }

      try {
        const response = await authAPI.verifyEmail(token);
        setVerificationStatus({
          status: 'success',
          message: response.message,
          email: response.email
        });
      } catch (error: any) {
        console.error('Email verification failed:', error);
        
        let errorMessage = 'Có lỗi xảy ra khi xác nhận email.';
        
        if (error.detail) {
          switch (error.detail) {
            case 'Invalid verification token':
              errorMessage = 'Token xác nhận không hợp lệ hoặc đã được sử dụng.';
              break;
            case 'Email already verified':
              errorMessage = 'Email này đã được xác nhận trước đó.';
              break;
            case 'Verification token has expired':
              errorMessage = 'Token xác nhận đã hết hạn. Vui lòng yêu cầu gửi lại email xác nhận.';
              break;
            default:
              errorMessage = error.detail;
          }
        }

        setVerificationStatus({
          status: 'error',
          message: errorMessage
        });
      }
    };

    verifyEmail();
  }, [searchParams]);

  const renderContent = () => {
    switch (verificationStatus.status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{verificationStatus.message}</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Xác nhận thành công!</h2>
            <p className="text-gray-600 mb-6">{verificationStatus.message}</p>
            {verificationStatus.email && (
              <p className="text-sm text-gray-500 mb-6">Email: {verificationStatus.email}</p>
            )}
            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Đăng nhập ngay
              </Link>
              <Link
                to="/"
                className="block w-full text-blue-600 px-4 py-2 rounded-md border border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Xác nhận thất bại</h2>
            <p className="text-gray-600 mb-6">{verificationStatus.message}</p>
            <div className="space-y-3">
              <Link
                to="/resend-verification"
                className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Gửi lại email xác nhận
              </Link>
              <Link
                to="/register"
                className="block w-full text-blue-600 px-4 py-2 rounded-md border border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Đăng ký lại
              </Link>
            </div>
          </div>
        );

      case 'invalid':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Link không hợp lệ</h2>
            <p className="text-gray-600 mb-6">{verificationStatus.message}</p>
            <div className="space-y-3">
              <Link
                to="/resend-verification"
                className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Gửi lại email xác nhận
              </Link>
              <Link
                to="/"
                className="block w-full text-blue-600 px-4 py-2 rounded-md border border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            Xác nhận Email
          </h1>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;