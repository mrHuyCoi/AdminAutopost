export interface Brand {
  service: any;
  id: string;
  name: string;
  description?: string;
  service_id?: string;
  product_count?: number;
  device_count?: number;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BrandCreate {
  name: string;
  description?: string;
  service_id?: string;
}

export interface BrandUpdate {
  name?: string;
  description?: string;
  service_id?: string;
}