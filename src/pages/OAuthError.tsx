import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const platformNames: Record<string, string> = {
  facebook: 'Facebook',
  youtube: 'YouTube',
  instagram: 'Instagram',
  google: 'Google',
};

export const OAuthError: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const platform = searchParams.get('platform') || 'tài khoản';
  const msg = searchParams.get('msg') || 'Đã xảy ra lỗi không xác định.';
  const platformLabel = platformNames[platform] || platform;

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="mb-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-red-700 mb-2">Kết nối thất bại!</h2>
          <p className="text-gray-700 mb-4">
            Không thể kết nối {platformLabel}.<br />
            <span className="text-xs text-red-500">{msg}</span>
          </p>
          <button
            onClick={() => navigate('/accounts')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Về trang tài khoản
          </button>
        </div>
      </div>
    </div>
  );
};

export default OAuthError; 