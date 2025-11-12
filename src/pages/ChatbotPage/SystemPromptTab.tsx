import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle } from 'lucide-react';
import { chatbotService } from '../../services/chatbotService';

interface Instruction {
  key: string;
  value: string;
}

const SystemPromptTab: React.FC = () => {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Define the instruction keys and their display names
  const instructionKeys = [
    { key: 'base_instructions', label: 'Hướng dẫn cơ bản' },
    { key: 'service_workflow', label: 'Quy trình dịch vụ' },
    { key: 'product_workflow', label: 'Quy trình sản phẩm' },
    { key: 'accessory_workflow', label: 'Quy trình linh kiện/phụ kiện' },
    { key: 'workflow_instructions', label: 'Hướng dẫn xử lý kết quả' },
    { key: 'other_instructions', label: 'Các tình huống khác' }
  ];

  useEffect(() => {
    loadInstructions();
  }, []);

  const loadInstructions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatbotService.getInstructions();
      
      // Create a map for quick lookup
      const instructionMap = new Map(data.map(item => [item.key, item.value]));
      
      // Initialize instructions with all keys, using existing values or empty strings
      const initializedInstructions = instructionKeys.map(({ key }) => ({
        key,
        value: instructionMap.get(key) || ''
      }));
      
      setInstructions(initializedInstructions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleInstructionChange = (key: string, value: string) => {
    setInstructions(prev => 
      prev.map(instruction => 
        instruction.key === key 
          ? { ...instruction, value }
          : instruction
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await chatbotService.updateInstructions(instructions);
      setSuccess('Lưu thành công!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    loadInstructions();
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">System Prompt</h1>
        <p className="text-gray-600">Quản lý các hướng dẫn và quy trình cho chatbot</p>
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

      {/* Instructions Form */}
      <div className="space-y-6">
        {instructionKeys.map(({ key, label }) => {
          const instruction = instructions.find(inst => inst.key === key);
          const value = instruction?.value || '';

          return (
            <div key={key} className="bg-white shadow rounded-lg p-6">
              <div className="mb-4">
                <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-2">
                  {label}
                </label>
                <textarea
                  id={key}
                  value={value}
                  onChange={(e) => handleInstructionChange(key, e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                  placeholder={`Nhập ${label.toLowerCase()}...`}
                />
              </div>
            </div>
          );
        })}
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
          {saving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
        </button>
      </div>
    </div>
  );
};

export default SystemPromptTab;
