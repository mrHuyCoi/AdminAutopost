import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios'; 
import { useAuth } from '../hooks/useAuth';
import { Book, Loader2, Save, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface SystemPromptResponse {
  custom_system_prompt: string | null;
}

// CHUẨN HÓA: Thêm interface cho request body
interface UpdatePromptRequest {
  custom_system_prompt: string;
}

export const PromptManager: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [initialPrompt, setInitialPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user } = useAuth();

  // CHUẨN HÓA: Sửa lỗi dependency và tối ưu fetchPrompt
  const fetchPrompt = useCallback(async () => {
    if (!user) { 
      setError('Bạn phải đăng nhập để quản lý prompt.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // CHUẨN HÓA: Sửa response structure - axios trả về data trong property 'data'
      const response = await api.get<SystemPromptResponse>('/users/me/system-prompt');
      
      // SỬA QUAN TRỌNG: response.data chứa dữ liệu thực tế
      const currentPrompt = response.data.custom_system_prompt || '';
      setPrompt(currentPrompt);
      setInitialPrompt(currentPrompt);

    } catch (err: any) {
      console.error('Fetch prompt error:', err);
      
      // CHUẨN HÓA: Xử lý lỗi chi tiết hơn
      if (err.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (err.response?.status === 404) {
        // Endpoint không tồn tại - có thể BE chưa implement
        setError('Tính năng này đang được phát triển. Vui lòng thử lại sau.');
      } else {
        setError(err.response?.data?.detail || err.message || 'Đã có lỗi xảy ra khi tải prompt.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // CHUẨN HÓA: Tối ưu useEffect
  useEffect(() => {
    fetchPrompt();
  }, [fetchPrompt]);

  // Handle saving the new prompt
  const handleSavePrompt = async () => {
    if (!user) {
      setError('Bạn phải đăng nhập để cập nhật prompt.');
      return;
    }
    
    // CHUẨN HÓA: Validate input
    if (prompt.trim().length === 0) {
      setError('Prompt không được để trống.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // CHUẨN HÓA: Sử dụng interface cho request body
      const requestBody: UpdatePromptRequest = { 
        custom_system_prompt: prompt 
      };
      
      // CHUẨN HÓA: Sửa response structure
      await api.put('/users/me/system-prompt', requestBody);

      setSuccess('Prompt đã được cập nhật thành công!');
      setInitialPrompt(prompt);

      // CHUẨN HÓA: Clear success message sau delay
      setTimeout(() => setSuccess(null), 3000);

    } catch (err: any) {
      console.error('Save prompt error:', err);
      
      // CHUẨN HÓA: Xử lý lỗi chi tiết
      if (err.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (err.response?.status === 400) {
        setError('Dữ liệu không hợp lệ: ' + (err.response.data?.detail || 'Vui lòng kiểm tra lại prompt.'));
      } else {
        setError(err.response?.data?.detail || err.message || 'Đã có lỗi xảy ra khi lưu prompt.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // CHUẨN HÓA: Reset form
  const handleReset = () => {
    setPrompt(initialPrompt);
    setError(null);
    setSuccess(null);
  };

  const hasChanges = prompt !== initialPrompt;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Book size={20} className="text-purple-600" />
          System Prompt
        </h2>
        
        <div className="flex items-center gap-2">
          {/* CHUẨN HÓA: Thêm nút reset khi có thay đổi */}
          {hasChanges && (
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              Hủy thay đổi
            </button>
          )}
          
          <button
            onClick={fetchPrompt}
            disabled={isLoading || isSaving}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            title="Tải lại prompt từ cơ sở dữ liệu"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? 'Đang tải...' : 'Tải lại'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="animate-spin text-purple-600" size={32} />
          <p className="ml-4 text-gray-600">Đang tải prompt...</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {!isLoading && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            System prompt này sẽ được sử dụng làm chỉ dẫn mặc định cho AI khi tạo nội dung. 
            Bạn có thể tùy chỉnh nó để phù hợp với giọng văn thương hiệu của mình.
          </p>
          
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setError(null); // Clear error khi user bắt đầu nhập
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y text-sm leading-relaxed disabled:bg-gray-50 disabled:cursor-not-allowed"
              rows={8}
              placeholder="Nhập system prompt của bạn ở đây..."
              disabled={isSaving}
            />
            
            {/* CHUẨN HÓA: Thêm character counter */}
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {prompt.length} ký tự
            </div>
          </div>

          {success && (
            <div className="p-3 rounded-lg flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm animate-fade-in">
              <CheckCircle size={16} />
              {success}
            </div>
          )}

          <div className="flex justify-between items-center">
            {/* CHUẨN HÓA: Hiển thị trạng thái thay đổi */}
            <div className="text-sm text-gray-500">
              {hasChanges && !isSaving && (
                <span className="text-orange-600">⚠️ Có thay đổi chưa lưu</span>
              )}
            </div>
            
            <button
              onClick={handleSavePrompt}
              disabled={isSaving || !hasChanges || !prompt.trim()}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Lưu Prompt
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};