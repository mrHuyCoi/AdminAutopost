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
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      const brandsData = await brandService.getAllBrands(0, 1000); // Lấy tất cả brands
      setBrands(brandsData || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi tải danh sách thương hiệu');
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