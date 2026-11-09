export interface ResponseModel<T = any> {
  statusCode: number;
  showMessage: boolean;
  message: string;
  data: T;
  error?: any;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  pages?: number;
  hasNext?: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: Pagination;
}

export class ApiError extends Error {
  public statusCode: number;
  public showMessage: boolean;
  public data?: any;

  constructor(message: string, statusCode: number = 500, showMessage: boolean = true, data?: any) {
    super(message);
    this.statusCode = statusCode;
    this.showMessage = showMessage;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
