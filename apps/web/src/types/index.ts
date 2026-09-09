export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
export interface User { id: string; name: string; email: string; role: Role }
export const customerTypes = ['RETAIL', 'WHOLESALE', 'DISTRIBUTOR'] as const;
export const customerStatuses = ['LEAD', 'ACTIVE', 'INACTIVE'] as const;
export type CustomerType = typeof customerTypes[number];
export type CustomerStatus = typeof customerStatuses[number];
export interface Customer {
  id: string; customerName: string; mobileNumber: string; email: string;
  businessName: string; gstNumber: string | null; customerType: CustomerType;
  address: string; status: CustomerStatus; followUpDate: string | null;
  notes: string | null; createdAt: string; updatedAt: string;
}
export interface FollowUp { id: string; customerId: string; note: string; followUpDate: string | null; createdById: string; createdAt: string; createdBy: User }
export interface CustomerDetail extends Customer { followUps: FollowUp[] }
export interface CustomerPage { customers: Customer[]; pagination: { page: number; limit: number; total: number; totalPages: number } }
export type CustomerInput = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;
export const canWriteCustomers = (role: Role) => role === 'ADMIN' || role === 'SALES';
export const canReadCustomers = (role: Role) => role !== 'WAREHOUSE';
export interface Product { id:string; productName:string; sku:string; category:string; unitPrice:string|number; currentStock:number; minimumStockAlertQuantity:number; warehouseLocation:string; createdAt:string; updatedAt:string; stockMovements?: StockMovement[] }
export interface StockMovement { id:string; productId:string; quantityChanged:number; movementType:'IN'|'OUT'; reason:string; createdAt:string; product?:Product; createdBy:User }
export interface ProductPage { products:Product[]; pagination:{page:number;limit:number;total:number;totalPages:number} }
export interface MovementPage { movements:StockMovement[]; pagination:{page:number;limit:number;total:number;totalPages:number} }
export const canWriteProducts=(role:Role)=>role==='ADMIN'||role==='WAREHOUSE';
