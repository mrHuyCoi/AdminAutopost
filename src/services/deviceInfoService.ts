// Dán thay thế cho interface DeviceInfo cũ (dòng 23)
interface DeviceInfo {
  id: string;
  model: string;
  brand: string;
  is_active: boolean; // Bạn không dùng trường này, nhưng nên giữ lại
  created_at: string;
  updated_at?: string;

  // Các trường mới từ JSON của bạn
  release_date?: string;
  screen?: string; // Đã sửa (trước là display)
  chip_ram?: string;
  camera?: string;
  battery?: string;
  connectivity_os?: string;
  color_english?: string; // Đã sửa (trước là color_en)
  dimensions_weight?: string;
  sensors_health_features?: string; // Đã sửa (trước là sensors_health)
  warranty?: string;
}