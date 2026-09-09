import { api } from './client';
import type { Customer, CustomerDetail, CustomerInput, CustomerPage, FollowUp } from '../types';
interface Envelope<T> { success: true; data: T }
export const customersApi = {
  list: async (params: { page: number; limit: number; search?: string; status?: string; customerType?: string }) =>
    (await api.get<Envelope<CustomerPage>>('/customers', { params })).data.data,
  detail: async (id: string) => (await api.get<Envelope<{ customer: CustomerDetail }>>(`/customers/${encodeURIComponent(id)}`)).data.data.customer,
  create: async (input: CustomerInput) => (await api.post<Envelope<{ customer: Customer }>>('/customers', input)).data.data.customer,
  update: async (id: string, input: CustomerInput) => (await api.patch<Envelope<{ customer: Customer }>>(`/customers/${encodeURIComponent(id)}`, input)).data.data.customer,
  followUp: async (id: string, input: { note: string; followUpDate?: string | null }) =>
    (await api.post<Envelope<{ followUp: FollowUp }>>(`/customers/${encodeURIComponent(id)}/follow-ups`, input)).data.data.followUp,
};
