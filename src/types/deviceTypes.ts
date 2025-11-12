// --- Từ deviceInfo.ts & device.ts ---
export interface DeviceInfo {
  id: string;
  model: string;
  brand?: string;
  release_date?: string;
  screen?: string;
  chip_ram?: string;
  camera?: string;
  battery?: string;
  connectivity_os?: string;
  color_english?: string;
  dimensions_weight?: string;
  warranty?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  // (Trường 'name' từ device.ts có vẻ trùng 'model')
}

// --- Từ color.ts & device.ts ---
export interface Color {
  id: string;
  name: string;
  hex_code?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

// --- Từ storage.ts & device.ts ---
export interface DeviceStorage { // (Đổi tên từ 'Storage' trong device.ts)
  id: string;
  capacity: number;
  created_at: string;
  updated_at: string;
  type?: string; // (type có trong device.ts)
}

// Kiểu GỬI ĐI (từ storage.ts)
export interface StorageCreate {
  capacity: number;
}
export type StorageUpdate = Partial<StorageCreate>;


// --- Các kiểu Quan hệ (Relationship Types) ---

export interface DeviceColor {
  id: string;
  device_info_id: string;
  color_id: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  device_info?: DeviceInfo;
  color?: Color;
}

export interface UserDevice {
  id: string;
  user_id: string;
  product_code: string;
  warranty: string;
  device_condition: string;
  device_type: string;
  battery_condition: string;
  price: number;
  inventory: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Thông tin lồng nhau
  device_info: DeviceInfo;
  color: Color;
  device_storage: DeviceStorage;
  device_storage_id: string;

  // Thông tin hiển thị (UI)
  deviceModel?: string;
  colorName?: string;
  storageCapacity?: number;
}

// --- Các kiểu Filter/Pagination ---
export interface DeviceFilter {
  search?: string;
  brand?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DevicePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// --- Các kiểu Response (Phản hồi API) ---
export interface DeviceInfoResponse {
  devices: DeviceInfo[];
  pagination: DevicePagination;
}
export interface ColorResponse {
  colors: Color[];
  pagination: DevicePagination;
}
export interface StorageResponse {
  storages: DeviceStorage[];
  pagination: DevicePagination;
}
export interface DeviceColorResponse {
  deviceColors: DeviceColor[];
  pagination: DevicePagination;
}

// --- Kết quả Import (từ deviceTypes.ts) ---
export interface ImportResult {
  total: number;
  success: number;
  updated_count: number;
  created_count: number;
  error: number;
  errors?: string[];
}