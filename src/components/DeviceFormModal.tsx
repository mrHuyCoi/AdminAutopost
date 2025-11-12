import React, { useState, useEffect } from 'react';
// CHUẨN HÓA: Import 'api' (trung tâm điều khiển)
import api from '../lib/axios'; 
import { UserDevice, DeviceInfo, Color, DeviceStorage } from '../types/deviceTypes';
import { deviceInfoService } from '../services/deviceInfoService';
import { Search } from 'lucide-react';

interface DeviceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (device: UserDevice) => void;
  device: UserDevice | null;
}

// ... (Interface DeviceFormData và defaultFormData không đổi) ...
interface DeviceFormData extends Partial<UserDevice> {
  device_info_id?: string;
  color_ids?: string[];
  device_storage_id?: string;
}

const defaultFormData: DeviceFormData = {
  product_code: '',
  price: 0,
  inventory: 1,
  device_condition: 'Mới',
  device_type: 'Mới',
  battery_condition: '100%',
  warranty: '12 tháng',
  notes: '',
  device_info_id: '',
  color_ids: [],
  device_storage_id: '',
};
// ...

const DeviceFormModal: React.FC<DeviceFormModalProps> = ({ isOpen, onClose, onSave, device }) => {
  const [formData, setFormData] = useState<DeviceFormData>(defaultFormData);
  const [deviceInfos, setDeviceInfos] = useState<DeviceInfo[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [storages, setStorages] = useState<DeviceStorage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ... (useEffect cho [device, isOpen] không đổi) ...
  useEffect(() => {
    if (isOpen) {
      if (device) {
        setFormData({
          ...device,
          device_info_id: device.device_info?.id || '',
          color_ids: device.color?.id ? [device.color.id] : [],
          device_storage_id: device.device_storage?.id || '',
        });
      } else {
        setFormData(defaultFormData);
        setColors([]);
        setStorages([]);
      }
      setSearchTerm('');
    }
  }, [device, isOpen]);

  // ... (useEffect cho [searchTerm] không đổi) ...
  useEffect(() => {
    // Debounce search term to reduce API calls
    const handler = setTimeout(() => {
      if (searchTerm.length >= 2 || searchTerm.length === 0) { 
        fetchDeviceInfos(searchTerm);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // ... (hàm fetchDeviceInfos không đổi, vì nó đã dùng 'deviceInfoService') ...
  const fetchDeviceInfos = async (search = '') => {
    if (!isOpen || formData.device_info_id) return; 
    setIsLoading(true);
    try {
      const params = { search: search };
      const deviceInfosData = await deviceInfoService.getDeviceInfos(params, { page: 1, limit: 100 });
      setDeviceInfos(Array.isArray(deviceInfosData.devices) ? deviceInfosData.devices : []);
    } catch (error) {
      console.error('Error fetching device infos', error);
      setDeviceInfos([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ... (useEffect cho [isOpen] không đổi) ...
  useEffect(() => {
    if (isOpen) {
      fetchDeviceInfos(); // Initial fetch when modal opens
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchDependentData = async () => {
      const deviceId = formData.device_info_id;
      if (deviceId) {
        setIsLoading(true);
        try {
          // CHUẨN HÓA: Bỏ 'token' và 'headers'. Interceptor của 'api' sẽ tự động làm việc này.
          // const token = localStorage.getItem('auth_token');
          // const headers = { 'Authorization': `Bearer ${token}` };

          // CHUẨN HÓA:
          // 1. Dùng 'api.get' thay vì 'fetch'
          // 2. Dùng đường dẫn tương đối (đã sửa lỗi '//')
          // 3. 'api' tự động gắn header và trả về data (do interceptor)
          const [colorsData, storagesData] = await Promise.all([
            api.get<any>(`/device-infos/${deviceId}/colors`),
            api.get<any>(`/device-infos/${deviceId}/storages`),
          ]);

          // CHUẨN HÓA: Bỏ .json(). 'api' đã trả về data rồi.
          // const colorsData = await colorsRes.json();
          // const storagesData = await storagesRes.json();

          // Giữ nguyên logic xử lý data trả về (vì API của bạn trả về { data: [...] })
          setColors(Array.isArray(colorsData.data) ? colorsData.data : []);
          setStorages(Array.isArray(storagesData.data) ? storagesData.data : []);

        } catch (error) {
          console.error('Error fetching dependent data for form', error);
          setColors([]);
          setStorages([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setColors([]);
        setStorages([]);
      }
    };

    if (isOpen) {
      fetchDependentData();
    }
  }, [formData.device_info_id, isOpen]);
  
  // ... (Tất cả các hàm render và xử lý form còn lại (handleChange, handleSubmit, formatPrice...) 
  // ...  không có thay đổi vì chúng không gọi API) ...
  const filteredDeviceInfos = deviceInfos.filter(info =>
    info.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Price formatting functions
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, '');
    if (/^\d*$/.test(rawValue)) {
      const numericValue = parseInt(rawValue) || 0;
      setFormData(prev => ({ ...prev, price: numericValue }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.device_info_id || !formData.color_ids || formData.color_ids.length === 0 || !formData.device_storage_id) {
      // Thay thế alert() bằng một phương thức thông báo tốt hơn nếu có
      console.warn('Vui lòng chọn đầy đủ Thiết bị, Màu sắc và Dung lượng!');
      alert('Vui lòng chọn đầy đủ Thiết bị, Màu sắc và Dung lượng!');
      return;
    }

    if (device) {
      const deviceData: any = {
        ...formData,
        device_info_id: formData.device_info_id!,
        color_id: formData.color_ids?.[0] || '', // Giả định chỉ lưu 1 màu? logic của bạn
        device_storage_id: formData.device_storage_id!,
      };
      // Xóa các trường không cần thiết nếu BE yêu cầu
      delete deviceData.color_ids; 
      onSave(deviceData);
    } else {
       const newDeviceData: any = {
        ...formData,
        device_info_id: formData.device_info_id!,
        color_id: formData.color_ids?.[0] || '', // Giả định chỉ lưu 1 màu?
        device_storage_id: formData.device_storage_id!,
      };
      delete newDeviceData.color_ids;
      onSave(newDeviceData);
    }
  };

  if (!isOpen) return null;

  return (
    // ... (Toàn bộ phần JSX render không thay đổi) ...
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{device ? 'Sửa thiết bị' : 'Thêm thiết bị'}</h2>
        <form onSubmit={handleSubmit}>
          {isLoading && <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-10"><p>Đang tải...</p></div>}
          {/* Hàng 1: Thiết bị, Màu sắc, Dung lượng */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* ... (JSX cho Thiết bị) ... */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Thiết bị <span className="text-red-500">*</span>
              </label>
              {formData.device_info_id && (
                <div className="mb-2"><span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium">{deviceInfos.find(d => d.id === formData.device_info_id)?.model}</span></div>
              )}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm thiết bị..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  disabled={isLoading}
                />
                <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
              </div>
              <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                {filteredDeviceInfos.length > 0 ? (
                  filteredDeviceInfos.map(info => (
                    <div
                      key={info.id}
                      onClick={() => {
                        if (isLoading) return;
                        setFormData(prev => ({ ...prev, device_info_id: info.id, color_ids: [], device_storage_id: '' }));
                        setSearchTerm('');
                      }}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${formData.device_info_id === info.id ? 'bg-blue-50 text-blue-700 font-medium' : ''} ${isLoading ? 'cursor-not-allowed' : ''}`}
                    >
                      {info.model}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500">Không tìm thấy thiết bị</div>
                )}
              </div>
            </div>
            {/* ... (JSX cho Màu sắc) ... */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Màu sắc <span className="text-red-500">*</span>
              </label>
              {formData.color_ids && formData.color_ids.length > 0 && (
                <div className="mb-2">
                  <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium text-sm">
                    {formData.color_ids.length} màu đã chọn
                  </span>
                </div>
              )}
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg bg-white">
                {colors.length > 0 && (
                  <div
                    onClick={() => {
                      if (isLoading) return;
                      if (formData.color_ids?.length === colors.length) {
                        setFormData(prev => ({ ...prev, color_ids: [] }));
                      } else {
                        const allColorIds = colors.map(color => color.id);
                        setFormData(prev => ({ ...prev, color_ids: allColorIds }));
                      }
                    }}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${formData.color_ids?.length === colors.length ? 'bg-blue-50 text-blue-700 font-medium' : ''} ${isLoading ? 'cursor-not-allowed' : ''} border-b border-gray-200`}
                  >
                    {formData.color_ids?.length === colors.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </div>
                )}
                {colors.length > 0 ? (
                  colors.map(color => (
                    <div
                      key={color.id}
                      onClick={() => {
                        if (isLoading) return;
                        const currentColors = formData.color_ids || [];
                        const colorIndex = currentColors.indexOf(color.id);
                        
                        if (colorIndex > -1) {
                          currentColors.splice(colorIndex, 1);
                        } else {
                          currentColors.push(color.id);
                        }
                        
                        setFormData(prev => ({ ...prev, color_ids: [...currentColors] }));
                      }}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${formData.color_ids?.includes(color.id) ? 'bg-blue-50 text-blue-700 font-medium' : ''} ${isLoading ? 'cursor-not-allowed' : ''}`}
                    >
                      {color.name}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500">
                    {formData.device_info_id ? (isLoading ? 'Đang tải...' : 'Không có màu sắc') : 'Vui lòng chọn thiết bị'}
                  </div>
                )}
              </div>
            </div>
            {/* ... (JSX cho Dung lượng) ... */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Dung lượng <span className="text-red-500">*</span>
              </label>
              {formData.device_storage_id && (
                <div className="mb-2"><span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium">{storages.find(s => s.id === formData.device_storage_id)?.capacity} GB</span></div>
              )}
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg bg-white">
                {storages.length > 0 ? (
                  storages.map(storage => (
                    <div
                      key={storage.id}
                      onClick={() => { if (!isLoading) setFormData(prev => ({ ...prev, device_storage_id: storage.id }))}}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${formData.device_storage_id === storage.id ? 'bg-blue-50 text-blue-700 font-medium' : ''} ${isLoading ? 'cursor-not-allowed' : ''}`}
                    >
                      {storage.capacity} GB
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500">{formData.device_info_id ? (isLoading ? 'Đang tải...' : 'Không có dung lượng') : 'VVui lòng chọn thiết bị'}</div>
                )}
              </div>
            </div>
          </div>
          {/* Hàng 2: Loại thiết bị, Tình trạng, Tình trạng pin */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* ... (JSX cho Loại thiết bị) ... */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Loại thiết bị</label>
              <select
                name="device_type"
                value={formData.device_type || ''}
                onChange={e => {
                  const value = e.target.value;
                  if (value === 'Mới') {
                    setFormData(prev => ({
                      ...prev,
                      device_type: value,
                      device_condition: 'Mới',
                      battery_condition: '100%',
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      device_type: value,
                      device_condition: '',
                      battery_condition: '',
                    }));
                  }
                }}
                className="mt-1 block w-full rounded-md border-2 border-gray-500 shadow-sm"
              >
                <option value="Mới">Mới</option>
                <option value="Cũ">Cũ</option>
              </select>
            </div>
            {/* ... (JSX cho Tình trạng) ... */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Tình trạng</label>
              <input
                type="text"
                name="device_condition"
                value={formData.device_condition || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-2 border-gray-500 shadow-sm disabled:opacity-50 disabled:bg-gray-100"
                disabled={formData.device_type === 'Mới'}
                placeholder={formData.device_type === 'Cũ' ? "Nhập tình trạng thiết bị" : ""}
              />
            </div>
            {/* ... (JSX cho Tình trạng pin) ... */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Tình trạng pin</label>
              <input
                type="text"
                name="battery_condition"
                value={formData.battery_condition || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-2 border-gray-500 shadow-sm disabled:opacity-50 disabled:bg-gray-100"
                disabled={formData.device_type === 'Mới'}
                placeholder={formData.device_type === 'Cũ' ? "Nhập tình trạng pin" : ""}
              />
            </div>
          </div>
          {/* Hàng 3: Giá, Tồn kho, Bảo hành */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* ... (JSX cho Giá) ... */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Giá</label>
              <input
                type="text"
                name="price"
                value={formatPrice(formData.price || 0)}
                onChange={handlePriceChange}
                className="mt-1 block w-full rounded-md border-2 border-gray-500 shadow-sm"
              />
            </div>
            {/* ... (JSX cho Tồn kho) ... */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Tồn kho</label>
              <input
                type="number"
                name="inventory"
                value={formData.inventory || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-2 border-gray-500 shadow-sm"
              />
            </div>
            {/* ... (JSX cho Bảo hành) ... */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Bảo hành</label>
              <input
                type="text"
                name="warranty"
                value={formData.warranty || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-2 border-gray-500 shadow-sm"
              />
            </div>
          </div>
          {/* Hàng 4: Ghi chú */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-2 border-gray-500 shadow-sm"
                rows={2}
              ></textarea>
            </div>
          </div>
          {/* Nút bấm */}
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" disabled={isLoading}>Lưu</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeviceFormModal;