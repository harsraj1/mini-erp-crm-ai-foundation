import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerTypes, customerStatuses, type Customer } from '../../types';
import { ErrorAlert, Field, label, PageHeader } from '../../components/ui';
import { customerSchema, customerPayload, defaults, valuesFor, type CustomerValues } from './schema';
import { customersApi } from '../../api/customers';
import { errorMessage, fieldErrors } from '../../api/client';

export function CustomerForm({ customer }: { customer?: Customer }) {
  const navigate = useNavigate(); const [error, setErrorMessage] = useState('');
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<CustomerValues>({ resolver: zodResolver(customerSchema), defaultValues: customer ? valuesFor(customer) : defaults });
  const input = (name: keyof CustomerValues) => ({ id: name, ...register(name), 'aria-invalid': !!errors[name], 'aria-describedby': errors[name] ? `${name}-error` : undefined });
  const back = customer ? `/customers/${customer.id}` : '/customers';
  return <><Link className="back" to={back}>← {customer ? 'Customer detail' : 'Customers'}</Link><PageHeader title={customer ? 'Edit customer' : 'Add customer'} description="Keep contact and business information up to date." />
    <form className="card" noValidate onSubmit={handleSubmit(async (values) => {
      setErrorMessage('');
      try { const payload = customerPayload(values, customer); const saved = customer ? await customersApi.update(customer.id, payload) : await customersApi.create(payload);
        navigate(`/customers/${saved.id}`, { state: { message: customer ? 'Customer updated.' : 'Customer created.' } });
      } catch (err) { setErrorMessage(errorMessage(err)); for (const detail of fieldErrors(err)) if (detail.field in defaults) setError(detail.field as keyof CustomerValues, { message: detail.message }); }
    })}>
      <ErrorAlert message={error} /><p className="small">Fields marked * are required.</p>
      <fieldset disabled={isSubmitting} className="form-grid"><legend className="sr-only">Customer information</legend>
        <Field name="customerName" title="Customer name *" error={errors.customerName?.message}><input {...input('customerName')} autoComplete="name" /></Field>
        <Field name="businessName" title="Business name *" error={errors.businessName?.message}><input {...input('businessName')} autoComplete="organization" /></Field>
        <Field name="mobileNumber" title="Mobile number *" error={errors.mobileNumber?.message} hint="7–15 digits; country code may start with +."><input {...input('mobileNumber')} type="tel" autoComplete="tel" /></Field>
        <Field name="email" title="Email *" error={errors.email?.message}><input {...input('email')} type="email" autoComplete="email" /></Field>
        <Field name="customerType" title="Customer type *" error={errors.customerType?.message}><select {...input('customerType')}>{customerTypes.map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></Field>
        <Field name="status" title="Status *" error={errors.status?.message}><select {...input('status')}>{customerStatuses.map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></Field>
        <Field name="gstNumber" title="GST number (optional)" error={errors.gstNumber?.message}><input {...input('gstNumber')} maxLength={15} /></Field>
        <Field name="followUpDate" title="Follow-up date (optional)" error={errors.followUpDate?.message} hint="Clear this field to remove the scheduled date."><input {...input('followUpDate')} type="date" /></Field>
        <Field name="address" title="Address *" error={errors.address?.message} wide><textarea {...input('address')} rows={3} autoComplete="street-address" /></Field>
        <Field name="notes" title="Profile notes (optional)" error={errors.notes?.message} hint="Follow-up history is recorded separately." wide><textarea {...input('notes')} rows={4} /></Field>
      </fieldset><div className="form-footer"><Link className="button" to={back}>Cancel</Link><button className="primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save customer'}</button></div>
    </form></>;
}
