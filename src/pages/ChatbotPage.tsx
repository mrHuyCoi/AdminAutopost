// src/pages/ChatbotPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner, faPaperPlane, faTrash,
  faRobot, faMessage, faCopy, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { chatbotService, ChatMessage } from '../services/chatbotService';

const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(
    () => localStorage.getItem('chatbot_thread_id')
  );
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tự động cuộn xuống
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input khi load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Tải lịch sử nếu có thread_id
  useEffect(() => {
    if (currentThreadId) {
      loadChatHistory(currentThreadId);
    } else {
      setLoadingHistory(false);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async (thread_id: string) => {
    setLoadingHistory(true);
    try {
      const response = await chatbotService.getChatHistory(thread_id);
      setMessages(response.data.messages || []);
    } catch (error: any) {
      console.error('Error loading chat history:', error);
      toast.error('Không thể tải lịch sử. Bắt đầu mới.');
      if (error.response?.status === 404) {
        startNewChat();
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const sendMessage = async () => {
    const messageContent = input.trim();
    if (!messageContent || sending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const response = await chatbotService.sendMessage(messageContent, currentThreadId);
      
      const botMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.data.reply,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
      
      if (response.data.thread_id && !currentThreadId) {
        const newThreadId = response.data.thread_id;
        setCurrentThreadId(newThreadId);
        localStorage.setItem('chatbot_thread_id', newThreadId);
        toast.success('Đã tạo phiên trò chuyện mới');
      }

    } catch (error: any) {
      const errorMsg = error?.response?.data?.detail || 'Không thể gửi tin nhắn';
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `Lỗi: ${errorMsg}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error(errorMsg);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const startNewChat = () => {
    if (currentThreadId) {
      chatbotService.clearHistory().catch(() => {});
    }
    setMessages([]);
    setCurrentThreadId(null);
    localStorage.removeItem('chatbot_thread_id');
    toast.success('Bắt đầu cuộc trò chuyện mới');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyThreadId = () => {
    if (currentThreadId) {
      navigator.clipboard.writeText(currentThreadId);
      toast.success('Đã sao chép Thread ID');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container-fluid px-4 py-3">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h1 className="h3 mb-1 text-dark fw-bold d-flex align-items-center">
            <FontAwesomeIcon icon={faRobot} className="me-2 text-primary" />
            Chatbot AI Trợ lý
          </h1>
          <p className="text-muted mb-0 small">Hỏi đáp, hỗ trợ tự động bằng AI</p>
        </div>
        <button
          className="btn btn-outline-danger btn-sm d-flex align-items-center shadow-sm"
          onClick={startNewChat}
          disabled={sending}
        >
          <FontAwesomeIcon icon={faTrash} className="me-1" />
          Trò chuyện mới
        </button>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-8">
          <div className="card shadow-lg border-0 h-100" style={{ minHeight: '70vh' }}>
            {/* Card Header */}
            <div className="card-header bg-gradient text-white d-flex justify-content-between align-items-center" 
                 style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <h5 className="mb-0 d-flex align-items-center">
                <FontAwesomeIcon icon={faMessage} className="me-2" />
                Trò chuyện với AI
              </h5>
              {currentThreadId && (
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-light text-dark px-2 py-1 small">
                    Thread: <code className="fw-bold">{currentThreadId.slice(0, 8)}...</code>
                  </span>
                  <button
                    className="btn btn-sm btn-outline-light border-0 p-1"
                    onClick={copyThreadId}
                    title="Sao chép Thread ID"
                  >
                    <FontAwesomeIcon icon={faCopy} size="sm" />
                  </button>
                </div>
              )}
            </div>

            {/* Chat Body */}
            <div className="card-body d-flex flex-column p-0" style={{ minHeight: '60vh' }}>
              {/* Messages Area */}
              <div 
                className="flex-grow-1 p-4 overflow-auto"
                style={{ 
                  backgroundColor: '#f8f9fa',
                  minHeight: '500px'
                }}
              >
                {loadingHistory ? (
                  // Skeleton Loading
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`d-flex ${i % 2 === 0 ? 'justify-content-end' : 'justify-content-start'}`}>
                        <div className="placeholder-glow" style={{ maxWidth: '70%' }}>
                          <div className={`placeholder col-${i % 2 === 0 ? '8' : '10'} rounded p-3`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center text-muted">
                    <div className="bg-light rounded-circle p-4 mb-3">
                      <FontAwesomeIcon icon={faRobot} size="3x" className="text-primary opacity-50" />
                    </div>
                    <h5>Chưa có tin nhắn</h5>
                    <p className="small">Hãy bắt đầu bằng cách nhập câu hỏi bên dưới</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`d-flex ${message.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                      >
                        <div
                          className={`rounded-3 p-3 position-relative shadow-sm ${
                            message.role === 'user'
                              ? 'bg-primary text-white'
                              : message.role === 'assistant'
                              ? 'bg-white border'
                              : 'bg-danger text-white'
                          }`}
                          style={{ maxWidth: '75%' }}
                        >
                          {/* Avatar */}
                          {message.role !== 'user' && (
                            <div className="position-absolute top-0 start-0 translate-middle-x">
                              <div className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-bold ${
                                message.role === 'assistant' ? 'bg-gradient' : 'bg-danger'
                              }`}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  fontSize: '0.75rem',
                                  background: message.role === 'assistant' 
                                    ? 'linear-gradient(135deg, #667eea, #764ba2)' 
                                    : undefined
                                }}
                              >
                                {message.role === 'assistant' ? 'AI' : '!'}
                              </div>
                            </div>
                          )}

                          <div className={`d-flex align-items-center mb-1 ${message.role === 'user' ? 'justify-content-end' : ''}`}>
                            <small className={`fw-semibold ${message.role === 'user' ? 'text-white opacity-75' : 'text-muted'}`}>
                              {message.role === 'user' ? 'Bạn' : message.role === 'assistant' ? 'AI Assistant' : 'Hệ thống'}
                            </small>
                            <small className={`ms-2 ${message.role === 'user' ? 'text-white opacity-50' : 'text-muted'}`}>
                              {formatTime(message.timestamp)}
                            </small>
                          </div>

                          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-top bg-white p-3">
                <div className="input-group shadow-sm">
                  <input
                    ref={inputRef}
                    type="text"
                    className="form-control border-0 ps-3"
                    placeholder="Nhập tin nhắn... (Enter để gửi)"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sending}
                    style={{ height: '50px' }}
                  />
                  <button
                    className="btn btn-primary d-flex align-items-center justify-content-center"
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    style={{ width: '60px' }}
                  >
                    {sending ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <FontAwesomeIcon icon={faPaperPlane} />
                    )}
                  </button>
                </div>
                <div className="form-text text-center mt-2 text-muted small">
                  Nhấn <kbd>Enter</kbd> để gửi • <kbd>Shift + Enter</kbd> để xuống dòng
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;