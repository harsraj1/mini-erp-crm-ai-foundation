import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { productsApi } from '../../api/products';
import { errorMessage, fieldErrors } from '../../api/client';
import { ErrorAlert, Field, PageHeader, Skeleton } from '../../components/ui';
const defaults = { productName: '', sku: '', category: '', unitPrice: '', currentStock: '0', minimumStockAlertQuantity: '0', warehouseLocation: '' };
type Values = typeof defaults;
const groups: { title: string; fields: { key: keyof Values; label: string; numeric?: boolean; hint?: string }[] }[] = [
  { title: 'Product information', fields: [{ key: 'productName', label: 'Product name' }, { key: 'sku', label: 'SKU' }, { key: 'category', label: 'Category' }, { key: 'unitPrice', label: 'Unit price', numeric: true, hint: 'Enter a price with up to two decimal places.' }] },
  { title: 'Inventory', fields: [{ key: 'currentStock', label: 'Opening stock', numeric: true }, { key: 'minimumStockAlertQuantity', label: 'Minimum stock alert', numeric: true, hint: 'Stock at or below this quantity is marked as low.' }, { key: 'warehouseLocation', label: 'Warehouse location' }] },
];
export function ProductForm() {
  const { id } = useParams(); const nav = useNavigate(); const lock = useRef(false);
  const [v, setV] = useState<Values>(defaults); const [err, setErr] = useState(''); const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false); const [loading, setLoading] = useState(!!id); const [loaded, setLoaded] = useState(!id); const [retry, setRetry] = useState(0);
  useEffect(() => { if (!id) return; let active = true; setLoading(true); setErr(''); productsApi.detail(id).then(p => { if (active) { setV(Object.fromEntries(Object.keys(defaults).map(k => [k, String(p[k as keyof typeof p] ?? '')])) as Values); setLoaded(true); } }).catch(e => { if (active) setErr(errorMessage(e)); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [id, retry]);
  return <><Link className="back" to="/products">← Back to products</Link><PageHeader title={id ? 'Edit product' : 'Add product'} description="Keep product details and inventory settings up to date." />{loading ? <Skeleton kind="form" /> : !loaded ? <ErrorAlert message={err} retry={() => setRetry(retry + 1)} /> : <form className="card product-form" onSubmit={async e => {
    e.preventDefault(); if (lock.current) return; lock.current = true; setErr(''); setErrors({}); setSaving(true);
    try { const { currentStock, ...fields } = v; const data = { ...fields, unitPrice: Number(v.unitPrice), minimumStockAlertQuantity: Number(v.minimumStockAlertQuantity), ...(!id ? { currentStock: Number(currentStock) } : {}) }; if (id) await productsApi.update(id, data); else await productsApi.create(data); nav('/products', { state: { message: id ? 'Product updated.' : 'Product created.' } }); }
    catch (e) { setErr(errorMessage(e)); setErrors(Object.fromEntries(fieldErrors(e).map(d => [d.field, d.message]))); }
    finally { lock.current = false; setSaving(false); }
  }}><ErrorAlert message={err} /><p className="small">Fields marked * are required.</p>{groups.map(group => <fieldset disabled={saving} className="form-section" key={group.title}><legend>{group.title}</legend>{id && group.title === 'Inventory' && <p className="small">Use Adjust on the product list to change current stock.</p>}<div className="form-grid">{group.fields.filter(f => !id || f.key !== 'currentStock').map(f => <Field key={f.key} name={f.key} title={`${f.label} *`} error={errors[f.key]} hint={f.hint}><input id={f.key} required type={f.numeric ? 'number' : 'text'} step={f.key === 'unitPrice' ? '0.01' : f.numeric ? '1' : undefined} value={v[f.key]} aria-invalid={!!errors[f.key]} aria-describedby={errors[f.key] ? `${f.key}-error` : undefined} onChange={e => setV({ ...v, [f.key]: e.target.value })} /></Field>)}</div></fieldset>)}<div className="form-footer"><button type="button" disabled={saving} onClick={() => nav('/products')}>Cancel</button><button className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save product'}</button></div></form>}</>;
}
