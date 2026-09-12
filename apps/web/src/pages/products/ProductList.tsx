import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { productsApi } from '../../api/products';
import { errorMessage } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useResource } from '../../hooks/useResource';
import { canWriteProducts, type Product } from '../../types';
import { ErrorAlert, PageHeader, Skeleton, StockBadge, TableRegion, priceLabel } from '../../components/ui';

export function ProductList() {
  const { user } = useAuth(); const location = useLocation();
  const writable = canWriteProducts(user!.role);
  const [q, setQ] = useState(''); const [page, setPage] = useState(1);
  const load = useCallback(() => productsApi.list({ search: q, page, limit: 20 }), [q, page]);
  const resource = useResource(load);
  const [selected, setSelected] = useState<Product>();
  const [success, setSuccess] = useState((location.state as { message?: string } | null)?.message || '');
  const trigger = useRef<HTMLButtonElement | null>(null);
  function close() { setSelected(undefined); trigger.current?.focus(); }
  return <><PageHeader title="Products" description="Manage products and stock.">{writable && <Link className="button primary" to="/products/new">Add product</Link>}</PageHeader>
    {success && <div className="alert success" role="status">{success}</div>}
    <section className="card list-card"><div className="filters"><div className="search-field"><label htmlFor="product-search">Search products</label><input id="product-search" placeholder="Search by product name or SKU" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} /></div>{q && <button onClick={() => { setQ(''); setPage(1); }}>Clear search</button>}</div>
      {resource.loading ? <Skeleton /> : resource.error ? <ErrorAlert message={resource.error} retry={resource.retry} /> : resource.data && <>
        {resource.data.products.length === 0 ? <div className="empty"><h2>No products found.</h2><p>{q ? 'Try another search or clear your search.' : (writable ? 'Add your first product to start tracking inventory.' : 'Products will appear here once added by your inventory team.')}</p>{writable && !q && <Link to="/products/new">Create your first product</Link>}</div> : <TableRegion name="Product table"><table className="product-table"><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th className="numeric">Unit price</th><th className="numeric">Stock</th><th>Location</th><th>Actions</th></tr></thead><tbody>{resource.data.products.map(p => <tr key={p.id}><td><Link className="customer-name" to={`/products/${p.id}`}>{p.productName}</Link></td><td>{p.sku}</td><td>{p.category}</td><td className="numeric">{priceLabel(p.unitPrice)}</td><td className="numeric"><strong>{p.currentStock}</strong><div><StockBadge stock={p.currentStock} minimum={p.minimumStockAlertQuantity} /></div><small>Alert at {p.minimumStockAlertQuantity}</small></td><td>{p.warehouseLocation}</td><td><div className="row-actions"><Link to={`/products/${p.id}`}>View</Link>{writable && <><Link to={`/products/${p.id}/edit`}>Edit</Link><button className="link-button" onClick={e => { trigger.current = e.currentTarget; setSelected(p); }}>Adjust</button></>}</div></td></tr>)}</tbody></table></TableRegion>}
        <div className="pagination"><span>{resource.data.pagination.total} products · Page {page} of {Math.max(1, resource.data.pagination.totalPages)}</span><div className="actions"><button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><button disabled={page >= resource.data.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</button></div></div>
      </>}
    </section>{selected && <StockAdjustment product={selected} onClose={close} onSaved={() => { close(); setSuccess('Stock adjustment saved.'); resource.retry(); }} />}
  </>;
}
function StockAdjustment({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null); const lock = useRef(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [form, setForm] = useState({ movementType: 'IN', quantityChanged: '1', reason: '' });
  useEffect(() => { const element = dialog.current!; element.showModal(); return () => element.close(); }, []);
  return <dialog ref={dialog} className="stock-dialog" aria-labelledby="stock-title" onCancel={e => { e.preventDefault(); if (!lock.current) onClose(); }}><form onSubmit={async e => {
    e.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try { await productsApi.adjust(product.id, { ...form, quantityChanged: Number(form.quantityChanged) }); onSaved(); }
    catch (err) { setError(errorMessage(err)); }
    finally { lock.current = false; setBusy(false); }
  }}><h2 id="stock-title">Adjust stock</h2><p>{product.productName} · Current stock: <strong>{product.currentStock}</strong></p><ErrorAlert message={error} />
    <fieldset className="stack" disabled={busy}><div><label htmlFor="movement-type">Movement type</label><select id="movement-type" autoFocus value={form.movementType} onChange={e => setForm({ ...form, movementType: e.target.value })}><option value="IN">IN — Add stock</option><option value="OUT">OUT — Remove stock</option></select></div><div><label htmlFor="movement-quantity">Quantity *</label><input id="movement-quantity" type="number" min="1" step="1" required value={form.quantityChanged} onChange={e => setForm({ ...form, quantityChanged: e.target.value })} /></div><div><label htmlFor="movement-reason">Reason *</label><textarea id="movement-reason" rows={3} required value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div></fieldset>
    <div className="form-footer"><button type="button" disabled={busy} onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save adjustment'}</button></div>
  </form></dialog>;
}
