import React, { useState, useEffect } from 'react';
// CHUẨN HÓA: Import 'api' (trung tâm điều khiển)
import api from '../../lib/axios'; 
import { Save, RefreshCw, AlertCircle } from 'lucide-react';

interface SystemPromptCustomTabProps {}

// Giả định kiểu dữ liệu trả về
interface GeneralPromptResponse {
  prompt_content: string | null;
}

const SystemPromptCustomTab: React.FC<SystemPromptCustomTabProps> = () => {
  const [promptContent, setPromptContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // CHUẨN HÓA: Xóa URL hardcode. 'api' đã có baseURL từ .env
  // const API_URL = 'https://chatbotproduct.quandoiai.vn';

  useEffect(() => {
    loadPromptContent();
  }, []);

  const loadPromptContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // CHUẨN HÓA:
      // 1. Dùng 'api.get'
      // 2. Dùng đường dẫn tương đối
      // 3. 'api' tự động gắn token (nếu có)
      // 4. 'api' tự động trả về 'data' (do interceptor)
      const data = await api.get<GeneralPromptResponse>('/general-prompt');

      // CHUẨN HÓA: Bỏ 'if (!response.ok)' và 'response.json()'
      
      setPromptContent(data.prompt_content || '');
    } catch (err: any) {
      // CHUẨN HÓA: Bắt lỗi từ axios
      const errorMessage = err.response?.data?.detail || err.message || 'Có lỗi xảy ra khi tải dữ liệu';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // CHUẨN HÓA:
      // 1. Dùng 'api.put'
      // 2. 'api' tự động gắn token
      // 3. Gửi object 'body' trực tiếp
      const body = {
        prompt_content: promptContent
      };
      await api.put('/general-prompt', body);

      // CHUẨN HÓA: Bỏ 'if (!response.ok)'
      // Nếu code chạy đến đây là đã thành công
      
      setSuccess('Lưu thành công!');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      // CHUẨN HÓA: Bắt lỗi từ axios
      const errorMessage = err.response?.data?.detail || err.message || 'Có lỗi xảy ra khi lưu dữ liệu';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    loadPromptContent();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-gray-600">Đang tải dữ liệu...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    // ... (Toàn bộ phần JSX render không thay đổi) ...
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">System Prompt Custom</h1>
        <p className="text-gray-600">Quản lý system prompt cho Chatbot Linh kiện</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Thành công</h3>
              <div className="mt-2 text-sm text-green-700">{success}</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Prompt Content Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <label htmlFor="prompt-content" className="block text-sm font-medium text-gray-700 mb-2">
            System Prompt Content
          </label>
          <textarea
            id="prompt-content"
            value={promptContent}
            onChange={(e) => setPromptContent(e.target.value)}
            rows={20}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-vertical font-mono text-sm"
            placeholder="Nhập system prompt content..."
          />
        </div>
        
        <div className="text-sm text-gray-500">
          <p>Nhập system prompt cho Chatbot Linh kiện. Nội dung này sẽ được sử dụng để định hướng hành vi của chatbot.</p>
        </div>
      </div>

      {/* Save Button at Bottom */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          {saving ? 'Đang lưu...' : 'Lưu system prompt'}
        </button>
      </div>
    </div>
  );
};

export default SystemPromptCustomTab;