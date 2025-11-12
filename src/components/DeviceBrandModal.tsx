import React, { useState, useEffect } from 'react';
import { DeviceBrand, DeviceBrandCreate, DeviceBrandUpdate } from '../types/brand';
import Swal from 'sweetalert2';
import deviceBrandService from '../services/deviceBrandService';
import { Smartphone, Edit3, X } from 'lucide-react';

interface DeviceBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  currentDeviceBrand: Partial<DeviceBrand> | null;
  setCurrentDeviceBrand: React.Dispatch<React.SetStateAction<Partial<DeviceBrand> | null>>;
}

export const DeviceBrandModal: React.FC<DeviceBrandModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentDeviceBrand, 
  setCurrentDeviceBrand 
}) => {
  const [newBrandName, setNewBrandName] = useState('');

  useEffect(() => {
    if (currentDeviceBrand && currentDeviceBrand.name) {
      setNewBrandName(currentDeviceBrand.name);
    } else {
      setNewBrandName('');
    }
  }, [currentDeviceBrand]);

  const handleSave = async () => {
    if (!newBrandName.trim()) {
      Swal.fire('Lỗi', 'Tên thương hiệu không được để trống.', 'error');
      return;
    }

    try {
      if (currentDeviceBrand?.id) {
        // Update existing brand
        const updateData: DeviceBrandUpdate = { name: newBrandName.trim() };
        if (currentDeviceBrand.warranty) {
          updateData.warranty = currentDeviceBrand.warranty;
        }
        await deviceBrandService.updateDeviceBrand(currentDeviceBrand.id, updateData);
      } else {
        // Create new brand
        const createData: DeviceBrandCreate = { name: newBrandName.trim() };
        if (currentDeviceBrand?.warranty) {
          createData.warranty = currentDeviceBrand.warranty;
        }
        await deviceBrandService.createDeviceBrand(createData);
      }
      
      onSave();
      onClose();
      Swal.fire('Thành công', 'Thương hiệu đã được lưu.', 'success');
    } catch (error: any) {
      console.error('Failed to save device brand:', error);
      Swal.fire('Lỗi', error.message || 'Không thể lưu thương hiệu.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Edit3 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {currentDeviceBrand?.id ? 'Sửa thương hiệu' : 'Thêm thương hiệu mới'}
                </h3>
                <p className="text-purple-100 text-sm mt-1">
                  {currentDeviceBrand?.id ? 'Cập nhật thông tin thương hiệu' : 'Tạo thương hiệu điện thoại mới'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Brand Name Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Smartphone size={18} className="mr-2 text-purple-600" />
              Tên thương hiệu <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              placeholder="Nhập tên thương hiệu điện thoại"
              autoFocus
            />
          </div>

          {/* Warranty Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <span className="mr-2">🔧</span>
              Bảo hành (tùy chọn)
            </label>
            <input
              type="text"
              value={currentDeviceBrand?.warranty || ''}
              onChange={(e) => setCurrentDeviceBrand(prev => prev ? { ...prev, warranty: e.target.value } : null)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              placeholder="Thông tin bảo hành (VD: 12 tháng)"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button 
              onClick={onClose} 
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
            >
              Hủy
            </button>
            <button 
              onClick={handleSave} 
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
            >
              {currentDeviceBrand?.id ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
