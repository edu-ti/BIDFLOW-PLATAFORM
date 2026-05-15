export * from './user';
export * from './auction';
export * from './bid';

export type ApiResponse<T> = {
  data: T;
  message?: string;
  success: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ApiError = {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
};

export type UserRole = 'ADMIN' | 'USER' | 'MANAGER';
export type AuctionStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';