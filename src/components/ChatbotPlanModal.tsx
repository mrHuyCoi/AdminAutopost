import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Check, X as XIcon } from 'lucide-react';
import { ChatbotPlan, ChatbotPlanCreate, ChatbotPlanUpdate, ChatbotService } from '../types/chatbot';

interface ChatbotPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: ChatbotPlan | ChatbotPlanCreate) => void;
  currentPlan: ChatbotPlan | null;
  availableServices: ChatbotService[];
}

export const ChatbotPlanModal: React.FC<ChatbotPlanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentPlan,
  availableServices
}) => {
  const [formData, setFormData] = useState<ChatbotPlanCreate>({
    name: '',
    description: '',
    monthly_price: 0,
    service_ids: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentPlan) {
      setFormData({
        name: currentPlan.name,
        description: currentPlan.description || '',
        monthly_price: currentPlan.monthly_price,
        service_ids: currentPlan.services.map(s => s.id)
      });
    } else {
      setFormData({
        name: '',
        description: '',
        monthly_price: 0,
        service_ids: []
      });
    }
    setErrors({});
  }, [currentPlan]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên gói cước là bắt buộc';
    }

    if (formData.monthly_price < 0) {
      newErrors.monthly_price = 'Giá hàng tháng không được âm';
    }

    if (formData.service_ids.length === 0) {
      newErrors.service_ids = 'Phải chọn ít nhất một dịch vụ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      if (currentPlan) {
        // Update existing plan
        const selectedServices = availableServices.filter(s => formData.service_ids.includes(s.id));
        const planData: ChatbotPlan = {
          id: currentPlan.id,
          ...formData,
          services: selectedServices,
          created_at: currentPlan.created_at,
          updated_at: currentPlan.updated_at
        };
        onSave(planData);
      } else {
        // Create new plan - pass ChatbotPlanCreate directly
        onSave(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ChatbotPlanCreate, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const toggleService = (serviceId: string) => {
    const newServiceIds = formData.service_ids.includes(serviceId)
      ? formData.service_ids.filter(id => id !== serviceId)
      : [...formData.service_ids, serviceId];
    
    handleInputChange('service_ids', newServiceIds);
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {currentPlan ? 'Chỉnh sửa gói cước' : 'Thêm gói cước mới'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên gói cước *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nhập tên gói cước"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá hàng tháng (VNĐ) *
              </label>
              <input
                type="number"
                value={formData.monthly_price}
                onChange={(e) => handleInputChange('monthly_price', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.monthly_price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
                min="0"
              />
              {errors.monthly_price && (
                <p className="text-red-500 text-sm mt-1">{errors.monthly_price}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Nhập mô tả gói cước"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dịch vụ được bao gồm *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
              {availableServices.map(service => (
                <div
                  key={service.id}
                  className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${
                    formData.service_ids.includes(service.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleService(service.id)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{service.name}</div>
                    <div className="text-sm text-gray-500">{formatPrice(service.base_price)}</div>
                  </div>
                  <div className="ml-2">
                    {formData.service_ids.includes(service.id) ? (
                      <Check className="h-5 w-5 text-blue-600" />
                    ) : (
                      <XIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            {errors.service_ids && (
              <p className="text-red-500 text-sm mt-1">{errors.service_ids}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Đã chọn {formData.service_ids.length} dịch vụ
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="-ml-1 mr-2 h-4 w-4" />
                  Lưu
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 