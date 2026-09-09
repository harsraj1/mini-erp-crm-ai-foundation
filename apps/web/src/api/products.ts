import { api } from './client';
import type { Product, ProductPage, MovementPage } from '../types';
export const productsApi={
 list:async(params:Record<string,unknown>)=>(await api.get<{data:ProductPage}>('/products',{params})).data.data,
 create:async(input:unknown)=>(await api.post<{data:Product}>('/products',input)).data.data,
 update:async(id:string,input:unknown)=>(await api.patch<{data:Product}>(`/products/${id}`,input)).data.data,
 detail:async(id:string)=>(await api.get<{data:Product}>(`/products/${id}`)).data.data,
 adjust:async(id:string,input:unknown)=>(await api.post<{data:Product}>(`/products/${id}/stock-movements`,input)).data.data,
 movements:async(params:Record<string,unknown>)=>(await api.get<{data:MovementPage}>('/stock-movements',{params})).data.data,
};
