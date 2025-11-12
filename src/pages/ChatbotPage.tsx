import React, { useState, useEffect } from 'react';
import { userService, ApiKeyData, SystemPromptData } from '../services/userService'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faSpinner } from '@fortawesome/free-solid-svg-icons';

type ChatbotSettingsForm = ApiKeyData & SystemPromptData;

const ChatbotPage: React.FC = () => {
  const [formData, setFormData] = useState<ChatbotSettingsForm>({
    gemini_api_key: '',
    openai_api_key: '',
    custom_system_prompt: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const titleElement = document.getElementById('pageTitle');
    const subtitleElement = document.getElementById('pageSubtitle');
    if (titleElement) titleElement.innerText = 'Cài đặt Chatbot';
    if (subtitleElement) subtitleElement.innerText = 'Cấu hình API Key và System Prompt';
    
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [apiKeysResponse, promptResponse] = await Promise.all([
        userService.getApiKeys(),
        userService.getSystemPrompt()
      ]);
      
      setFormData({
        gemini_api_key: apiKeysResponse.gemini_api_key || '',
        openai_api_key: apiKeysResponse.openai_api_key || '',
        custom_system_prompt: promptResponse.custom_system_prompt || ''
      });
      
    } catch (err: any) {
      console.error('Error loading settings:', err);
      setError(err.response?.data?.detail || err.message || 'Lỗi tải cài đặt');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const apiKeyData: ApiKeyData = {
        gemini_api_key: formData.gemini_api_key || null,
        openai_api_key: formData.openai_api_key || null
      };
      
      const promptData: SystemPromptData = {
        custom_system_prompt: formData.custom_system_prompt || null
      };

      await Promise.all([
        userService.updateApiKeys(apiKeyData),
        userService.updateSystemPrompt(promptData)
      ]);
      
      setSuccess('Đã lưu cài đặt thành công!');

    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.response?.data?.detail || err.message || 'Lỗi khi lưu cài đặt');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const renderForm = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="mb-4">
          <label htmlFor="custom_system_prompt" className="form-label fs-5 fw-bold">
            Câu lệnh hệ thống (System Prompt)
          </label>
          <textarea
            className="form-control"
            id="custom_system_prompt"
            name="custom_system_prompt"
            rows={10}
            value={formData.custom_system_prompt || ''}
            onChange={handleFormChange}
            placeholder="Ví dụ: Bạn là trợ lý AI chuyên nghiệp cho cửa hàng điện thoại..."
          ></textarea>
          <div className="form-text">
            Cung cấp hướng dẫn, bối cảnh, và quy tắc cho Chatbot của bạn.
          </div>
        </div>

        <hr className="my-4" />

        <h5 className="mb-3 fw-bold">Cấu hình API Keys (LLM)</h5>
        
        <div className="mb-3">
          <label htmlFor="gemini_api_key" className="form-label">Google Gemini API Key</label>
          <input
            type="password"
            className="form-control"
            id="gemini_api_key"
            name="gemini_api_key"
            value={formData.gemini_api_key || ''}
            onChange={handleFormChange}
            placeholder="Để trống nếu không dùng"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="openai_api_key" className="form-label">OpenAI API Key (GPT-4, GPT-3.5)</label>
          <input
            type="password"
            className="form-control"
            id="openai_api_key"
            name="openai_api_key"
            value={formData.openai_api_key || ''}
            onChange={handleFormChange}
            placeholder="Để trống nếu không dùng"
          />
        </div>

        <div className="d-flex justify-content-end mt-4">
          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            disabled={isSaving}
          >
            <FontAwesomeIcon icon={isSaving ? faSpinner : faSave} spin={isSaving} className="me-2" />
            {isSaving ? 'Đang lưu...' : 'Lưu Cài đặt'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="col-12 main-content-right d-flex flex-column gap-3 gap-lg-4">
      <div className="card shadow-sm">
        <div className="card-body p-4 p-md-5">
          {renderForm()}
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;