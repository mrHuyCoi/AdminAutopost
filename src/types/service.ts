// src/types/service.ts
export interface Service {
  id: string;
  name: string;
  description?: string;
  thuonghieu?: string;
  price?: string;
  warranty?: string;
  note?: string;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceCreate {
  name: string;
  description?: string;
  thuonghieu?: string;
  price?: string;
  warranty?: string;
  note?: string;
}

export interface ServiceUpdate {
  name?: string;
  description?: string;
  thuonghieu?: string;
  price?: string;
  warranty?: string;
  note?: string;
}