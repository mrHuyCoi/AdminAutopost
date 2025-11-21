import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  const [brands, setBrands] = useState<Brand[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBrands = useCallback(async () => {
    const token = localStorage.getItem('token');  // <-- Fix đúng key

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/login', {
        email: email,
        password
      });


      let brandsArray: Brand[] = [];
      if (response?.data && Array.isArray(response.data)) {
        brandsArray = response.data;
      } else if (response?.items && Array.isArray(response.items)) {
        brandsArray = response.items;
      } else if (Array.isArray(response)) {
        brandsArray = response;
      }

      setBrands(brandsArray);

    } catch (err: any) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        console.warn("User chưa xác thực, dừng tải Brands.");
        setBrands([]);
      } else {
        const errorMsg = err.response?.data?.message || 'Lỗi tải danh sách thương hiệu';
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Chỉ gọi 1 lần duy nhất
  useEffect(() => {
    loadBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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