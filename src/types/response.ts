// // NGUỒN CHÂN LÝ - ĐÃ HOÀN THIỆN
// export interface PaginationMetadata {
//   page: number;
//   limit: number;
//   total: number;
//   total_pages: number;
//   pages?: number;
// }

// export interface ResponseModel<T> {
//   data: T;
//   message: string;
//   status_code: number;
//   total?: number | null;
//   totalPages?: number | null;
//   pagination?: PaginationMetadata | null;
//   metadata?: PaginationMetadata | null;
// }

// // THÊM: Standardized API Response Interface
// export interface ApiListResponse<T> {
//   data: T[];
//   metadata: PaginationMetadata;
//   message?: string;
//   status_code?: number;
// }

// src/types/response.ts
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}