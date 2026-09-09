import { z } from 'zod';
import { customerTypes, customerStatuses, type Customer, type CustomerInput } from '../../types';
const optionalDate = z.union([z.literal(''), z.string().date('Enter a valid date')]);
export const customerSchema = z.object({
  customerName: z.string().trim().min(1, 'Enter a customer name').max(200),
  mobileNumber: z.string().trim().regex(/^\+?[0-9]{7,15}$/, 'Use 7–15 digits with an optional +'),
  email: z.string().trim().email('Enter a valid email address').max(254),
  businessName: z.string().trim().min(1, 'Enter a business name').max(200),
  gstNumber: z.string().trim().refine((v) => v === '' || /^[a-zA-Z0-9]{15}$/.test(v), 'Use 15 letters and digits, or leave blank'),
  customerType: z.enum(customerTypes), address: z.string().trim().min(1, 'Enter an address').max(2000),
  status: z.enum(customerStatuses), followUpDate: optionalDate, notes: z.string().trim().max(10000),
});
export type CustomerValues = z.infer<typeof customerSchema>;
export const defaults: CustomerValues = { customerName: '', mobileNumber: '', email: '', businessName: '', gstNumber: '', customerType: 'RETAIL', address: '', status: 'LEAD', followUpDate: '', notes: '' };
export function valuesFor(customer: Customer): CustomerValues {
  return { customerName: customer.customerName, mobileNumber: customer.mobileNumber, email: customer.email, businessName: customer.businessName,
    gstNumber: customer.gstNumber ?? '', customerType: customer.customerType, address: customer.address, status: customer.status,
    followUpDate: customer.followUpDate?.slice(0, 10) ?? '', notes: customer.notes ?? '' };
}
export function customerPayload(values: CustomerValues, original?: Customer): CustomerInput {
  return { ...values, gstNumber: values.gstNumber || null, notes: values.notes || null,
    followUpDate: original && values.followUpDate === (original.followUpDate?.slice(0, 10) ?? '') ? original.followUpDate : values.followUpDate || null };
}
export const followUpSchema = z.object({ note: z.string().trim().min(1, 'Enter a follow-up note').max(10000),
  schedule: z.enum(['keep', 'set', 'clear']), followUpDate: optionalDate }).superRefine((value, ctx) => {
  if (value.schedule === 'set' && !value.followUpDate) ctx.addIssue({ code: 'custom', path: ['followUpDate'], message: 'Choose the next follow-up date' });
});
export type FollowUpValues = z.infer<typeof followUpSchema>;
export function followUpPayload(values: FollowUpValues) { return { note: values.note, ...(values.schedule === 'keep' ? {} : { followUpDate: values.schedule === 'clear' ? null : values.followUpDate }) }; }
