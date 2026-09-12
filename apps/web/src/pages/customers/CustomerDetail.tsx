import { useCallback, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customersApi } from '../../api/customers';
import { errorMessage, fieldErrors } from '../../api/client';
import { useResource } from '../../hooks/useResource';
import { useAuth } from '../../contexts/AuthContext';
import { canWriteCustomers, type CustomerDetail as CustomerData } from '../../types';
import { Badge, dateLabel, ErrorAlert, Field, label, Loading, PageHeader } from '../../components/ui';
import { CustomerForm } from './CustomerForm';
import { followUpPayload, followUpSchema, type FollowUpValues } from './schema';

export function CustomerDetail({ edit = false }: { edit?: boolean }) {
  const { id = '' } = useParams(); const { user } = useAuth(); const location = useLocation();
  const load = useCallback(() => customersApi.detail(id), [id]); const resource = useResource(load);
  if (resource.loading) return <Loading />;
  if (resource.error) return <><Link to="/customers">← Back to customers</Link><ErrorAlert message={resource.error} retry={resource.retry} /></>;
  if (!resource.data) return null;
  if (edit) return <CustomerForm key={id} customer={resource.data} />;
  return <DetailContent key={id} customer={resource.data} setCustomer={resource.setData} writable={!!user && canWriteCustomers(user.role)} message={(location.state as { message?: string } | null)?.message} />;
}
function DetailContent({ customer, setCustomer, writable, message }: { customer: CustomerData; setCustomer: (value: CustomerData) => void; writable: boolean; message?: string }) {
  const [error, setErrorMessage] = useState(''); const [success, setSuccess] = useState(message ?? '');
  const { register, watch, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FollowUpValues>({ resolver: zodResolver(followUpSchema), defaultValues: { note: '', schedule: 'keep', followUpDate: '' } });
  const schedule = watch('schedule');
  const fields = [['Business', customer.businessName], ['Email', customer.email], ['Mobile', customer.mobileNumber], ['Type', label(customer.customerType)], ['GST number', customer.gstNumber || 'Not provided'], ['Next follow-up', dateLabel(customer.followUpDate)], ['Address', customer.address], ['Profile notes', customer.notes || 'No profile notes']];
  return <><Link className="back" to="/customers">← Back to customers</Link><PageHeader title={customer.customerName} description={customer.businessName}><Badge status={customer.status} />{writable && <Link className="button" to={`/customers/${customer.id}/edit`}>Edit customer</Link>}</PageHeader>
    {success && <div role="status" className="alert success">{success}</div>}
    <div className="detail-grid"><section className="card"><h2>Customer information</h2><dl className="customer-info">{fields.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl></section>
      <section className="card"><div className="section-heading"><h2>Follow-up history</h2><span className="count">{customer.followUps.length}</span></div>
        {customer.followUps.length === 0 ? <p className="muted">No follow-ups yet.</p> : <ol className="history">{customer.followUps.map((entry) => <li key={entry.id}><p className="note">{entry.note}</p><p className="small">{entry.createdBy.name} · {new Date(entry.createdAt).toLocaleString('en-IN')}</p>{entry.followUpDate && <p className="small">Scheduled for {dateLabel(entry.followUpDate)}</p>}</li>)}</ol>}
        {writable && <form className="follow-up-form stack" noValidate onSubmit={handleSubmit(async (values) => {
          setErrorMessage(''); setSuccess('');
          try {
            const payload = followUpPayload(values); const saved = await customersApi.followUp(customer.id, payload);
            setCustomer({ ...customer, followUps: [saved, ...customer.followUps], followUpDate: payload.followUpDate === undefined ? customer.followUpDate : payload.followUpDate });
            reset(); setSuccess('Follow-up added.');
          } catch (err) { setErrorMessage(errorMessage(err)); for (const detail of fieldErrors(err)) if (detail.field === 'note' || detail.field === 'followUpDate') setError(detail.field, { message: detail.message }); }
        })}>
          <h3>Add follow-up</h3><ErrorAlert message={error} />
          <Field name="note" title="Follow-up note *" error={errors.note?.message}><textarea id="note" rows={4} {...register('note')} disabled={isSubmitting} aria-invalid={!!errors.note} aria-describedby={errors.note ? 'note-error' : undefined} /></Field>
          <Field name="schedule" title="Next follow-up"><select id="schedule" {...register('schedule')} disabled={isSubmitting}><option value="keep">Keep current date</option><option value="set">Set a new date</option><option value="clear">Clear scheduled date</option></select></Field>
          {schedule === 'set' && <Field name="nextDate" title="New follow-up date *" error={errors.followUpDate?.message}><input id="nextDate" type="date" {...register('followUpDate')} disabled={isSubmitting} aria-invalid={!!errors.followUpDate} aria-describedby={errors.followUpDate ? 'nextDate-error' : undefined} /></Field>}
          <button className="primary" disabled={isSubmitting}>{isSubmitting ? 'Adding…' : 'Add follow-up'}</button>
        </form>}
      </section></div></>;
}
