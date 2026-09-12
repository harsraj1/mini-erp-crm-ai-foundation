import { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { customersApi } from '../../api/customers';
import { useResource } from '../../hooks/useResource';
import { useAuth } from '../../contexts/AuthContext';
import { canWriteCustomers, customerStatuses, customerTypes } from '../../types';
import { Badge, dateLabel, ErrorAlert, label, Skeleton, TableRegion, PageHeader } from '../../components/ui';

export function CustomerList() {
  const { user } = useAuth(); const [params, setParams] = useSearchParams();
  const search = params.get('search') || ''; const status = params.get('status') || ''; const customerType = params.get('customerType') || '';
  const page = Math.min(1000000, Math.max(1, Number(params.get('page')) || 1));
  const [draft, setDraft] = useState(search);
  const [searchError, setSearchError] = useState('');
  const load = useCallback(() => customersApi.list({ page, limit: 20, search: search || undefined, status: status || undefined, customerType: customerType || undefined }), [page, search, status, customerType]);
  const resource = useResource(load);
  function filter(key: string, value: string) { const next = new URLSearchParams(params); value ? next.set(key, value) : next.delete(key); next.delete('page'); setParams(next); }
  const writable = !!user && canWriteCustomers(user.role);
  return <><PageHeader title="Customers" description="Manage relationships, contact details, and follow-ups.">{writable && <Link className="button primary" to="/customers/new">+ Add customer</Link>}</PageHeader>
    <div className="card list-card"><form className="filters" onSubmit={(event) => { event.preventDefault(); if (draft.trim().length > 200) { setSearchError('Search must be 200 characters or fewer.'); return; } setSearchError(''); filter('search', draft.trim()); }}>
      <div className="search-field"><label htmlFor="search">Search customers</label><div className="search-input"><input id="search" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Name, business, mobile, or email" /><button type="submit">Search</button></div>{searchError && <small className="field-error" role="alert">{searchError}</small>}</div>
      <div className="field"><label htmlFor="status-filter">Status</label><select id="status-filter" value={status} onChange={(e) => filter('status', e.target.value)}><option value="">All statuses</option>{customerStatuses.map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></div>
      <div className="field"><label htmlFor="type-filter">Customer type</label><select id="type-filter" value={customerType} onChange={(e) => filter('customerType', e.target.value)}><option value="">All types</option>{customerTypes.map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></div>
      {(search || status || customerType) && <button type="button" onClick={() => { setParams({}); setDraft(''); setSearchError(''); }}>Clear filters</button>}
    </form>
    {resource.loading ? <Skeleton /> : resource.error ? <ErrorAlert message={resource.error} retry={resource.retry} /> : resource.data && <>
      {resource.data.customers.length === 0 ? <div className="empty"><h2>No customers found</h2><p>{search || status || customerType ? 'Try another search or clear your filters.' : 'Customer relationships start here.'}</p>{writable && <Link to="/customers/new">Add a customer</Link>}</div> :
      <TableRegion name="Customer table"><table className="customer-table"><thead><tr><th>Customer</th><th>Business</th><th>Mobile</th><th>Type</th><th>Status</th><th>Follow-up</th><th>Action</th></tr></thead><tbody>{resource.data.customers.map((customer) => <tr key={customer.id}>
        <td><Link className="customer-name" to={`/customers/${customer.id}`}>{customer.customerName}</Link><small>{customer.email}</small></td><td>{customer.businessName}</td><td className="nowrap">{customer.mobileNumber}</td><td>{label(customer.customerType)}</td><td><Badge status={customer.status} /></td><td className="nowrap">{dateLabel(customer.followUpDate)}</td><td><Link to={`/customers/${customer.id}`} aria-label={`View ${customer.customerName}`}>View</Link></td>
      </tr>)}</tbody></table></TableRegion>}
      <div className="pagination"><span>{resource.data.pagination.total} customer{resource.data.pagination.total === 1 ? '' : 's'} · Page {page} of {Math.max(1, resource.data.pagination.totalPages)}</span><div className="actions">
        <button disabled={page <= 1} onClick={() => { const next = new URLSearchParams(params); next.set('page', String(page - 1)); setParams(next); }}>Previous</button>
        <button disabled={page >= resource.data.pagination.totalPages} onClick={() => { const next = new URLSearchParams(params); next.set('page', String(page + 1)); setParams(next); }}>Next</button>
      </div></div></>}
    </div>{user?.role === 'ACCOUNTS' && <p className="small">Your Accounts role has read-only customer access.</p>}</>;
}
