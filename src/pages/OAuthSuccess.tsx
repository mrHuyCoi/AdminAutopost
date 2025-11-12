import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const platformNames: Record<string, string> = {
  facebook: 'Facebook',
  youtube: 'YouTube',
  instagram: 'Instagram',
  google: 'Google',
};

export const OAuthSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const platform = searchParams.get('platform') || 'tài khoản';
  const platformLabel = platformNames[platform] || platform;

//   React.useEffect(() => {
//     const timer = setTimeout(() => {
//       navigate('/accounts');
//     }, 3000);
//     return () => clearTimeout(timer);
//   }, [navigate]);

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="mb-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-green-700 mb-2">Kết nối thành công!</h2>
          <p className="text-gray-700 mb-4">
            Bạn đã kết nối {platformLabel} thành công.<br />
            Bạn sẽ được chuyển về trang quản lý tài khoản trong giây lát.
          </p>
          <button
            onClick={() => navigate('/accounts')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Về trang tài khoản
          </button>
        </div>
      </div>
    </div>
  );
};

export default OAuthSuccess; 