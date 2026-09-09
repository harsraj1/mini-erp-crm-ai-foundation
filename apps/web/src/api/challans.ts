import { api } from './client';
import type { Customer, User } from '../types';
export interface Challan { id:string; challanNumber:string; status:'DRAFT'|'CONFIRMED'|'CANCELLED'; totalQuantity:number; customer:Customer; createdBy:User; createdAt:string; items:{id:string;productNameSnapshot:string;skuSnapshot:string;unitPriceSnapshot:string;quantity:number}[] }
export const challansApi={
 list:async(page:number,status:string)=>(await api.get<{data:{challans:Challan[];pagination:{totalPages:number}}}>('/challans',{params:{page,limit:20,...(status?{status}:{})}})).data.data,
 detail:async(id:string)=>(await api.get<{data:{challan:Challan}}>(`/challans/${id}`)).data.data.challan,
 create:async(input:{customerId:string;items:{productId:string;quantity:number}[]})=>(await api.post<{data:{challan:Challan}}>('/challans',input)).data.data.challan,
 confirm:async(id:string)=>(await api.post<{data:{challan:Challan}}>(`/challans/${id}/confirm`)).data.data.challan,
};
