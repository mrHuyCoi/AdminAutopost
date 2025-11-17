// src/contexts/BrandContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Brand } from '../types/brand';
import { brandService } from '../services/brandService';

interface BrandContextType {
  brands: Brand[];
  loading: boolean;
  error: string | null;
  refreshBrands: () => Promise<void>;
  addBrand: (brand: Brand) => void;
  updateBrand: (id: string, brand: Brand) => void;
  deleteBrand: (id: string) => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [brands, setBrands] = useState<Brand[]>([]); // Khởi tạo là mảng rỗng
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Sửa ở đây:
      // 1. Đổi tên 'brandsData' thành 'response' cho rõ nghĩa
      const response = await brandService.getAllBrands(1, 1000); 

      let brandsArray: Brand[] = [];

      // 2. Thêm logic kiểm tra cấu trúc response, giống như bạn làm ở loadServices
      if (response && response.data && Array.isArray(response.data)) {
        // Trường hợp API trả về: { data: [...] }
        brandsArray = response.data;
      } else if (Array.isArray(response)) {
        // Trường hợp API trả về: [...]
        brandsArray = response;
      } else {
        // Trường hợp lạ, log lỗi nhưng vẫn set mảng rỗng để không crash
        console.warn("Cấu trúc dữ liệu brands không xác định:", response);
      }
      
      // 3. Set state bằng mảng đã xử lý
      setBrands(brandsArray);

    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Lỗi tải danh sách thương hiệu';
      setError(errorMsg);
      setBrands([]); // Đảm bảo set mảng rỗng khi lỗi
      console.error('Error loading brands:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshBrands = async () => {
    await loadBrands();
  };

  const addBrand = (brand: Brand) => {
    setBrands(prev => [brand, ...prev]);
  };

  const updateBrand = (id: string, updatedBrand: Brand) => {
    setBrands(prev => prev.map(brand => brand.id === id ? updatedBrand : brand));
  };

  const deleteBrand = (id: string) => {
    setBrands(prev => prev.filter(brand => brand.id !== id));
  };

  useEffect(() => {
    loadBrands();
  }, []);

  return (
    <BrandContext.Provider value={{
      brands,
      loading,
      error,
      refreshBrands,
      addBrand,
      updateBrand,
      deleteBrand
    }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrands = () => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrands must be used within a BrandProvider');
  }
  return context;
};