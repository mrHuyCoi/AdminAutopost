export interface Brand {
  id: string;
  name: string;
  service_id: string;

  // các field backend có nhưng FE không dùng, để optional
  created_at?: string;
  updated_at?: string;
}

export interface BrandCreate {
  name: string;
  service_id: string;
}

export interface BrandUpdate {
  name?: string;
  service_id?: string;
}
