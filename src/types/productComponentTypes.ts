// NGUỒN CHÂN LÝ (Đã hợp nhất từ productComponentTypes.ts, category.ts, component.ts)

// --- 1. Định nghĩa Danh mục (Category) ---
// (từ category.ts và productComponentTypes.ts)
export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  children?: Category[];
  product_components?: ProductComponent[];
}

export interface CategoryCreate {
  name: string;
  parent_id?: string | null; // (hợp nhất)
}
export type CategoryUpdate = Partial<CategoryCreate>;


// --- 2. Định nghĩa Thuộc tính (Property) ---
// (từ productComponentTypes.ts)
export interface Property {
  id: string;
  key: string;
  values?: string[];
  parent_id?: string;
  created_at: string;
  updated_at: string;
  children?: Property[];
  product_components?: ProductComponent[];
}

export interface PropertyCreate {
  key: string;
  values?: string[];
  parent_id?: string;
}
export type PropertyUpdate = Partial<PropertyCreate>;


// --- 3. Định nghĩa Linh kiện (ProductComponent) ---
// (từ productComponentTypes.ts và component.ts)
export interface ProductComponent {
  id: string;
  product_code: string; // (từ productComponentTypes.ts)
  product_name: string; // (từ productComponentTypes.ts)
  amount: number;
  wholesale_price?: number;
  trademark?: string;
  guarantee?: string;
  stock: number;
  description?: string;
  product_photo?: string;
  product_link?: string;
  user_id: string;
  category_id?: string;
  properties?: string;
  created_at: string;
  updated_at: string;
  
  // Thông tin lồng nhau
  category?: Category;
  property_ids?: string[];

  // (Các trường từ 'component.ts' dường như đã được bao gồm
  //  với tên Tiếng Anh, ngoại trừ 'thuocTinh' (là 'properties'))
}

export interface ProductComponentCreate {
  product_code?: string;
  product_name: string;
  amount: number;
  wholesale_price?: number;
  trademark?: string;
  guarantee?: string;
  stock: number;
  description?: string;
  product_photo?: string;
  product_link?: string;
  user_id?: string;
  category_id?: string;
  properties?: string;
}

export type ProductComponentUpdate = Partial<ProductComponentCreate>;

// --- 4. Kiểu Import (Import) ---
export interface ImportResult {
  total: number;
  success: number;
  updated_count: number;
  created_count: number;
  error: number;
  errors?: string[];
}