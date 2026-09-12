import type { ReactNode } from 'react';
import type { CustomerStatus } from '../types';
export const label = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();
export function dateLabel(value: string | null) { return value ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value)) : 'Not scheduled'; }
export function ErrorAlert({ message, retry }: { message: string; retry?: () => void }) {
  return message ? <div className="alert error" role="alert"><span>{message}</span>{retry && <button type="button" onClick={retry}>Try again</button>}</div> : null;
}
export function Loading() { return <div className="empty" role="status">Loading…</div>; }
export function Skeleton({ kind = 'table' }: { kind?: 'table' | 'form' | 'metrics' }) {
  return <div className={`skeleton skeleton-${kind}`} role="status"><span className="sr-only">Loading…</span>{Array.from({ length: kind === 'table' ? 5 : 6 }, (_, i) => <div className="skeleton-block" aria-hidden="true" key={i} />)}</div>;
}
export function TableRegion({ name, children }: { name: string; children: ReactNode }) {
  return <><p className="scroll-hint small">Scroll horizontally to see all columns.</p><div className="table-scroll" tabIndex={0} role="region" aria-label={name}>{children}</div></>;
}
export const priceLabel = (value: string | number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
export function StockBadge({ stock, minimum }: { stock: number; minimum: number }) {
  return stock === 0 ? <span className="badge danger">Out of stock</span> : stock <= minimum ? <span className="badge warning">Low stock</span> : null;
}
export function Badge({ status }: { status: CustomerStatus }) { return <span className={`badge ${status.toLowerCase()}`}>{label(status)}</span>; }
export function Field({ name, title, error, children, hint, wide = false }: { name: string; title: string; error?: string; children: ReactNode; hint?: string; wide?: boolean }) {
  return <div className={`field${wide ? ' wide' : ''}`}><label htmlFor={name}>{title}</label>{children}{hint && <small>{hint}</small>}{error && <small id={`${name}-error`} className="field-error" role="alert">{error}</small>}</div>;
}
export function PageHeader({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return <header className="page-heading"><div><h1>{title}</h1>{description && <p>{description}</p>}</div><div className="actions">{children}</div></header>;
}
