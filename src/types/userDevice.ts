// src/types/userDevice.ts
import { DeviceInfoRead } from './deviceInfo';
import { ColorRead } from './color';
import { StorageRead } from './storage'; // Dùng StorageRead cho đơn giản

/**
 * Hình dáng JSON GỬI ĐI khi Thêm mới
 * (Khớp với Pydantic: UserDeviceCreate)
 */
export interface UserDeviceCreate {
  device_info_id: string; // uuid
  color_id: string | null;
  device_storage_id: string | null;
  product_code: string | null;
  warranty: string | null;
  device_condition: string;
  device_type: string;
  battery_condition: string | null;
  price: number;
  wholesale_price: number | null;
  inventory: number;
  notes: string | null;
}

/**
 * Hình dáng JSON GỬI ĐI khi Cập nhật
 * (Khớp với Pydantic: UserDeviceUpdate)
 */
export type UserDeviceUpdate = Partial<UserDeviceCreate>;

/**
 * Hình dáng JSON NHẬN VỀ (để hiển thị trong bảng)
 * (Khớp với Pydantic: UserDeviceDetailRead)
 */
export interface UserDeviceDetailRead {
  id: string; // uuid
  user_id: string;
  product_code: string | null;
  device_name: string | null; // Tên này được BE tự động tạo
  warranty: string | null;
  device_condition: string;
  device_type: string;
  battery_condition: string | null;
  price: number;
  wholesale_price: number | null;
  inventory: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  
  // Dữ liệu lồng nhau
  device_info: DeviceInfoRead | null;
  color: ColorRead | null;
  device_storage: StorageRead | null; // Dùng StorageRead
  device_storage_id: string | null;
}