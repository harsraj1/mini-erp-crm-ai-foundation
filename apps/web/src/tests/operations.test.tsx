import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { Operations } from '../pages/operations/Operations';
import { operationsApi as api, type Balance, type Transfer } from '../api/operations';
import type { Role } from '../types';

const auth = { user: { id: 'u1', name: 'Demo user', role: 'ADMIN' as Role }, loading: false, logout: vi.fn() };
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../api/operations', () => ({ operationsApi: { catalog: vi.fn(), assignees: vi.fn(), allBalances: vi.fn(), list: vi.fn(), post: vi.fn(), workStatus: vi.fn() } }));
const item = { id: 'i1', name: 'Cotton', code: 'COT', category: 'Material' };
const location = { id: 'l1', name: 'Main warehouse' }, destination = { id: 'l2', name: 'Factory' };
const b: Balance = { id: 'b1', itemId: 'i1', locationId: 'l1', item, location, batch: 'B1', physicalQuantity: 100, reservedQuantity: 30, availableQuantity: 70 };
const page = (rows: unknown[]) => ({ rows, pagination: { page: 1, limit: 20, total: rows.length, totalPages: rows.length ? 1 : 0 } });
beforeEach(() => {
  vi.resetAllMocks(); auth.user.role = 'ADMIN';
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  vi.mocked(api.catalog).mockResolvedValue({ items: [item], locations: [location, destination] });
  vi.mocked(api.allBalances).mockResolvedValue([b]); vi.mocked(api.assignees).mockResolvedValue([]);
  vi.mocked(api.list).mockImplementation(async path => page(path === 'inventory' ? [b] : []));
  vi.mocked(api.post).mockResolvedValue({});
});

it('displays authoritative physical, reserved and available quantities and inventory history', async () => {
  render(<MemoryRouter><Operations screen="inventory" /></MemoryRouter>);
  expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  await screen.findByText('Cotton'); expect(screen.getByText('100')).toBeInTheDocument(); expect(screen.getByText('30')).toBeInTheDocument(); expect(screen.getByText('70')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'View / adjust' })); await screen.findByText('No transactions yet.');
  expect(api.list).toHaveBeenCalledWith('inventory/b1/history', 1);
});
it('validates order input and preserves both input and request ID after recoverable error', async () => {
  auth.user.role = 'SALES'; vi.mocked(api.post).mockRejectedValueOnce({ isAxiosError: true, response: { data: { error: { message: 'Requested quantity exceeds available stock' } } } }).mockResolvedValue({});
  render(<MemoryRouter><Operations screen="orders" /></MemoryRouter>); const u = userEvent.setup();
  const save = await screen.findByRole('button', { name: 'Create order and reserve' }); await u.click(save); expect(api.post).not.toHaveBeenCalled();
  expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  await u.type(screen.getByLabelText('Customer name *'), 'Asha'); await u.selectOptions(screen.getByLabelText('Inventory to reserve *'), 'b1'); await u.type(screen.getByLabelText('Order quantity *'), '80');
  await u.click(save); await screen.findByText('Requested quantity exceeds available stock'); expect(screen.getByLabelText('Customer name *')).toHaveValue('Asha'); expect(screen.getByLabelText('Order quantity *')).toHaveValue(80);
  const first = vi.mocked(api.post).mock.calls[0]; await u.click(save);
  await screen.findByText(/Saved successfully/); expect(vi.mocked(api.post).mock.calls[1]).toEqual(first); expect(first).toEqual(['orders', expect.objectContaining({ customerName: 'Asha', balanceId: 'b1', quantity: 80, requestId: expect.any(String) })]);
});
it('prevents duplicate submit while a reservation is pending', async () => {
  auth.user.role = 'SALES'; let resolve!: (value: unknown) => void; vi.mocked(api.post).mockImplementation(() => new Promise(r => { resolve = r; }));
  render(<MemoryRouter><Operations screen="orders" /></MemoryRouter>); const u = userEvent.setup();
  await u.type(await screen.findByLabelText('Customer name *'), 'Asha'); await u.selectOptions(screen.getByLabelText('Inventory to reserve *'), 'b1'); await u.type(screen.getByLabelText('Order quantity *'), '5');
  await u.dblClick(screen.getByRole('button', { name: 'Create order and reserve' })); expect(api.post).toHaveBeenCalledTimes(1); expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  resolve({}); await screen.findByText(/Saved successfully/);
});
it('requires confirmation to receive a transfer and refreshes the server status', async () => {
  auth.user.role = 'OPERATIONS'; const transfer: Transfer = { id: 't1', sourceBalance: b, destinationLocation: destination, quantity: 20, status: 'DISPATCHED' };
  vi.mocked(api.list).mockResolvedValue(page([transfer])); render(<MemoryRouter><Operations screen="transfers" /></MemoryRouter>); const u = userEvent.setup();
  await u.click(await screen.findByRole('button', { name: 'Receive' })); expect(api.post).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog', { name: 'Receive' })).toHaveTextContent('Destination physical stock will increase');
  vi.mocked(api.list).mockResolvedValue(page([{ ...transfer, status: 'RECEIVED' }])); await u.click(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByText('Received'); expect(api.post).toHaveBeenCalledWith('transfers/t1/receive', {}); expect(screen.queryByRole('button', { name: 'Receive' })).not.toBeInTheDocument();
});
it('shows retry and empty states', async () => {
  vi.mocked(api.list).mockRejectedValueOnce(new Error('offline')); render(<MemoryRouter><Operations screen="transfers" /></MemoryRouter>);
  await screen.findByRole('alert'); await userEvent.click(screen.getByRole('button', { name: 'Try again' })); await screen.findByText('No internal transfers found.'); expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
});
for (const role of ['ADMIN', 'OPERATIONS', 'SALES'] as Role[]) {
  it(`${role} sees role-aware actions and can navigate the required screens`, async () => {
    auth.user.role = role; const u = userEvent.setup(); render(<MemoryRouter initialEntries={['/inventory']}><App /></MemoryRouter>);
    await screen.findByText('Cotton'); await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
    expect(!!screen.queryByRole('button', { name: 'Add item' })).toBe(role !== 'SALES');
    await u.click(screen.getByRole('link', { name: 'Work Orders' })); await screen.findByText('No work orders found.');
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument()); expect(!!screen.queryByRole('button', { name: 'Create work order' })).toBe(role === 'ADMIN');
    await u.click(screen.getByRole('link', { name: 'Internal Transfers' })); await screen.findByText('No internal transfers found.');
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument()); expect(!!screen.queryByRole('button', { name: 'Request transfer' })).toBe(role !== 'SALES');
    await u.click(screen.getByRole('link', { name: 'Customer Orders' })); await screen.findByText('No customer orders found.');
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument()); expect(!!screen.queryByRole('button', { name: 'Create order and reserve' })).toBe(role !== 'OPERATIONS');
  });
}
