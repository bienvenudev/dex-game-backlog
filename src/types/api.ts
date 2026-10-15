// A page of results plus the totals the backend reports in response headers.
export interface Paged<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
