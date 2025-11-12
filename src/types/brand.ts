
export interface Brand {
  id: string;
  name: string;
  
  // Các trường tùy chọn (từ cả hai file cũ)
  product_count?: number;     // (Từ Brand.ts cũ)
  description?: string | null;  // (Từ Brand.ts cũ)
  warranty?: string | null;     // (Từ deviceBrand.ts cũ)
  user_id?: string;             // (Từ deviceBrand.ts cũ)

  created_at: string;
  updated_at: string;
}

// Kiểu 'Create' và 'Update' hợp nhất
export interface BrandCreate {
  name: string;
  description?: string | null;
  warranty?: string | null;
}

export type BrandUpdate = Partial<BrandCreate>;