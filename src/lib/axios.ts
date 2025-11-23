import axios from 'axios';
import qs from 'qs';

// QUAN TRỌNG: Key này phải khớp tuyệt đối với bên useAuth.ts
const TOKEN_KEY = 'accessToken'; 

const apiClient = axios.create({
  // baseURL: 'http://127.0.0.1:8000/api/v1',
  baseURL: 'https://e3d98dfa0d4d.ngrok-free.app/api/v1',

});

// INTERCEPTOR: TỰ ĐỘNG THÊM TOKEN + XỬ LÝ FORM-URLENCODED
apiClient.interceptors.request.use((config) => {
  // --- [SỬA LỖI] Lấy đúng key accessToken ---
  const token = localStorage.getItem(TOKEN_KEY);
  // ------------------------------------------
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Giữ nguyên logic xử lý ngrok và form-urlencoded của bạn
  config.headers['ngrok-skip-browser-warning'] = 'true';
  const formUrlEncodedEndpoints = ['/auth/login'];
  const isFormUrlEncoded = formUrlEncodedEndpoints.some(endpoint =>
    config.url?.includes(endpoint)
  );

  if (isFormUrlEncoded && config.data && typeof config.data === 'object') {
    config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    config.data = qs.stringify(config.data);
  } else if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else {
    config.headers['Content-Type'] = 'application/json';
  }

  console.log('🚀 GỬI API:', {
    method: config.method?.toUpperCase(),
    url: config.baseURL + config.url,
    data: config.data,
  });

  return config;
});

// INTERCEPTOR: XỬ LÝ LỖI TOÀN CỤC
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ NHẬN API:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('❌ API LỖI:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    
    // --- [SỬA LỖI] Xử lý cả 401 và 403 ---
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Xóa đúng key token
      localStorage.removeItem(TOKEN_KEY);
      
      // Chỉ redirect nếu không phải đang ở trang login để tránh loop
      if (window.location.pathname !== '/login') {
         window.location.href = '/login';
      }
    }
    // ------------------------------------
    
    return Promise.reject(error);
  }
);

export default apiClient;
