// src/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faSpinner, faSync, faKey, faUser, faComment } from '@fortawesome/free-solid-svg-icons';
import { userConfigService, SystemApiKeys } from '../services/userConfigService';

const SettingsPage: React.FC = () => {
  // States cho dữ liệu
  const [persona, setPersona] = useState('');
  const [prompt, setPrompt] = useState('');
  
  // SỬA: Dùng state mới cho SystemApiKeys
  const [apiKeys, setApiKeys] = useState<SystemApiKeys>({
    gemini_api_key: '',
    openai_api_key: ''
  });

  // States cho việc tải
  const [loading, setLoading] = useState(true);
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [isSavingKeys, setIsSavingKeys] = useState(false); // SỬA: Thêm state lưu key

  // Hàm tải tất cả dữ liệu
  const loadAllSettings = async () => {
    setLoading(true);
    try {
      // SỬA: Gọi getApiKeys
      const [personaRes, promptRes, keysRes] = await Promise.all([
        userConfigService.getPersona(),
        userConfigService.getPrompt(),
        userConfigService.getApiKeys()
      ]);
      
      setPersona(personaRes);
      setPrompt(promptRes);
      setApiKeys(keysRes);
      
    } catch (err: any) {
      console.error('Lỗi tải cài đặt:', err);
      toast.error('Không thể tải dữ liệu cài đặt');
    } finally {
      setLoading(false);
    }
  };

  // Tải dữ liệu khi mount
  useEffect(() => {
    loadAllSettings();
  }, []);

  // === Xử lý Lưu Persona ===
  const handleSavePersona = async () => {
    setIsSavingPersona(true);
    try {
      await userConfigService.setPersona(persona);
      toast.success('Đã cập nhật Persona!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Lỗi khi lưu Persona');
    } finally {
      setIsSavingPersona(false);
    }
  };

  // === Xử lý Lưu Prompt ===
  const handleSavePrompt = async () => {
    setIsSavingPrompt(true);
    try {
      await userConfigService.setPrompt(prompt);
      toast.success('Đã cập nhật Prompt hệ thống!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Lỗi khi lưu Prompt');
    } finally {
      setIsSavingPrompt(false);
    }
  };

  // SỬA: Thêm hàm Lưu API Keys
  const handleSaveApiKeys = async () => {
    setIsSavingKeys(true);
    try {
      await userConfigService.setApiKeys(apiKeys);
      toast.success('Đã cập nhật API Keys hệ thống!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Lỗi khi lưu API Keys');
    } finally {
      setIsSavingKeys(false);
    }
  };


  // === Giao diện ===
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-primary" />
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-dark">Cài đặt hệ thống</h1>
        <button 
          className="btn btn-outline-primary" 
          onClick={loadAllSettings} 
          disabled={loading}
        >
          <FontAwesomeIcon icon={faSync} className={`me-2 ${loading ? 'fa-spin' : ''}`} />
          Tải lại
        </button>
      </div>

      <div className="row g-4">
        {/* Card 1: Persona */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faUser} className="me-2" />
                Cấu hình Persona
              </h5>
            </div>
            <div className="card-body">
              <p className="text-muted small">
                Thiết lập vai trò, cá tính và cách xưng hô cho chatbot của bạn.
              </p>
              <textarea
                className="form-control"
                rows={10}
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="Ví dụ: Bạn là một trợ lý ảo thân thiện tên là My, chuyên gia về..."
              />
            </div>
            <div className="card-footer text-end">
              <button 
                className="btn btn-primary" 
                onClick={handleSavePersona} 
                disabled={isSavingPersona}
              >
                <FontAwesomeIcon icon={isSavingPersona ? faSpinner : faSave} spin={isSavingPersona} className="me-2" />
                {isSavingPersona ? 'Đang lưu...' : 'Lưu Persona'}
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: System Prompt */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faComment} className="me-2" />
                Prompt Hệ thống
              </h5>
            </div>
            <div className="card-body">
              <p className="text-muted small">
                Cung cấp các chỉ dẫn nền, quy tắc, hoặc thông tin cơ sở cho mọi câu trả lời của chatbot.
              </p>
              <textarea
                className="form-control"
                rows={10}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ví dụ: Luôn trả lời bằng tiếng Việt. Không trả lời các câu hỏi chính trị..."
              />
            </div>
            <div className="card-footer text-end">
              <button 
                className="btn btn-info text-white" 
                onClick={handleSavePrompt} 
                disabled={isSavingPrompt}
              >
                <FontAwesomeIcon icon={isSavingPrompt ? faSpinner : faSave} spin={isSavingPrompt} className="me-2" />
                {isSavingPrompt ? 'Đang lưu...' : 'Lưu Prompt'}
              </button>
            </div>
          </div>
        </div>

        {/* SỬA: Card 3: API Keys (Hệ thống) */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faKey} className="me-2" />
                Cài đặt API Keys (Hệ thống)
              </h5>
            </div>
            <div className="card-body">
              <p className="text-muted small">
                Đây là các API Key của bên thứ ba (Gemini, OpenAI) để hệ thống chatbot hoạt động.
              </p>
              
              <div className="mb-3">
                <label className="form-label fw-semibold">Google Gemini API Key</label>
                <input
                  type="password"
                  className="form-control"
                  value={apiKeys.gemini_api_key || ''}
                  onChange={(e) => setApiKeys(prev => ({
                    ...prev,
                    gemini_api_key: e.target.value
                  }))}
                  placeholder="Dán Gemini API key của bạn vào đây"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">OpenAI API Key</label>
                <input
                  type="password"
                  className="form-control"
                  value={apiKeys.openai_api_key || ''}
                  onChange={(e) => setApiKeys(prev => ({
                    ...prev,
                    openai_api_key: e.target.value
                  }))}
                  placeholder="Dán OpenAI API key của bạn vào đây"
                />
              </div>
            </div>
            <div className="card-footer text-end">
              <button 
                className="btn btn-secondary" 
                onClick={handleSaveApiKeys} 
                disabled={isSavingKeys}
              >
                <FontAwesomeIcon icon={isSavingKeys ? faSpinner : faSave} spin={isSavingKeys} className="me-2" />
                {isSavingKeys ? 'Đang lưu...' : 'Lưu API Keys'}
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default SettingsPage;