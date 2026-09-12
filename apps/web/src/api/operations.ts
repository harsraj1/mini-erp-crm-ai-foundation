import { api } from './client';
import type { User } from '../types';

export interface Item {id:string;name:string;code:string;category:string}
export interface Location {id:string;name:string}
export interface Balance {id:string;itemId:string;locationId:string;batch:string;physicalQuantity:number;reservedQuantity:number;availableQuantity:number;item:Item;location:Location}
export interface WorkOrder {id:string;item:Item;location:Location;requiredQuantity:number;assignedUser:User;status:'ASSIGNED'|'IN_PROGRESS'|'COMPLETED';availableQuantity:number;shortage:number;alternatives:(Balance & {location:Location})[]}
export interface Transfer {id:string;sourceBalance:Balance;destinationLocation:Location;quantity:number;status:'REQUESTED'|'DISPATCHED'|'RECEIVED'}
export interface Order {id:string;customerName:string;balance:Balance;quantity:number;createdBy:User}
export interface InventoryEvent {id:string;physicalChange:number;reservedChange:number;reason:string;createdAt:string;createdBy:User}
export interface Page<T> {rows:T[];pagination:{page:number;limit:number;total:number;totalPages:number}}
export const operationsApi={
  catalog:async()=>(await api.get<{data:{items:Item[];locations:Location[]}}>('/operations/catalog')).data.data,
  assignees:async()=>(await api.get<{data:User[]}>('/operations/assignees')).data.data,
  list:async<T>(path:string,page=1,search='')=>(await api.get<{data:Page<T>}>(`/operations/${path}`,{params:{page,limit:20,...(search?{search}:{})}})).data.data,
  allBalances:async()=>{const rows:Balance[]=[];for(let page=1;;page++){const r=await operationsApi.list<Balance>('inventory',page);rows.push(...r.rows);if(page>=r.pagination.totalPages)break}return rows},
  post:async(path:string,body:unknown)=>(await api.post(`/operations/${path}`,body)).data.data,
  workStatus:async(id:string,status:string)=>(await api.patch(`/operations/work-orders/${id}`,{status})).data.data,
};
