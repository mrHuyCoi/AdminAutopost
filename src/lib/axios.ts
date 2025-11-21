// src/lib/axios.ts
import axios from 'axios';
import qs from 'qs';

const apiClient = axios.create({
  // baseURL: 'http://127.0.0.1:8000/api/v1',
  baseURL: 'https://afeea541b3ca.ngrok-free.app/api/v1',
  timeout: 10000,
});


// INTERCEPTOR: TỰ ĐỘNG THÊM TOKEN + XỬ LÝ FORM-URLENCODED
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // CHỈ DÙNG form-urlencoded CHO CÁC ENDPOINT CỤ THỂ
  config.headers['ngrok-skip-browser-warning'] = 'true';
  const formUrlEncodedEndpoints = ['/auth/login'];
  const isFormUrlEncoded = formUrlEncodedEndpoints.some(endpoint =>
    config.url?.includes(endpoint)
  );

  if (isFormUrlEncoded && config.data && typeof config.data === 'object') {
    config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    config.data = qs.stringify(config.data);
  } else if (config.data instanceof FormData) {
    // Nếu là FormData (upload file), để axios tự set Content-Type
    delete config.headers['Content-Type'];
  } else {
    // MẶC ĐỊNH: JSON
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
    
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;


