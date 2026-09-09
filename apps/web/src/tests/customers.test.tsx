import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { customersApi } from '../api/customers';
import type { CustomerDetail, Role, User } from '../types';
import { customerPayload, valuesFor, followUpPayload } from '../pages/customers/schema';

const auth = { user: { id: 'u1', name: 'Demo Sales', email: 'sales@example.com', role: 'SALES' as Role }, loading: false, error: '', login: vi.fn(), logout: vi.fn(), retry: vi.fn() };
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../api/customers', () => ({ customersApi: { list: vi.fn(), detail: vi.fn(), create: vi.fn(), update: vi.fn(), followUp: vi.fn() } }));
const customer: CustomerDetail = { id: 'customer1', customerName: 'Asha Shah', mobileNumber: '+919876543210', email: 'asha@example.com', businessName: 'Asha Wholesale', gstNumber: null, customerType: 'WHOLESALE', address: '12 Market Road', status: 'LEAD', followUpDate: '2026-10-01T04:30:00.000Z', notes: 'Profile notes', createdAt: '2026-09-08T10:00:00.000Z', updatedAt: '2026-09-08T10:00:00.000Z', followUps: [] };
const actor: User = { ...auth.user };
const failure = { isAxiosError: true, response: { status: 400, data: { error: { message: 'Please check the customer details', details: [{ field: 'email', message: 'Email was rejected by the server' }] } } } };
function mount(path = '/customers') { return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>); }
beforeEach(() => {
  vi.resetAllMocks(); auth.user = { ...actor, role: 'SALES' };
  vi.mocked(customersApi.list).mockResolvedValue({ customers: [customer], pagination: { page: 1, limit: 20, total: 21, totalPages: 2 } });
  vi.mocked(customersApi.detail).mockResolvedValue(customer);
  vi.mocked(customersApi.create).mockResolvedValue(customer);
  vi.mocked(customersApi.update).mockResolvedValue(customer);
});

describe('customer navigation and permissions', () => {
  it('shows loading, list, search and pagination using the actual query contract', async () => {
    mount(); expect(screen.getByRole('status')).toHaveTextContent('Loading');
    await screen.findByRole('link', { name: 'Asha Shah' });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(customersApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, limit: 20 })));
    await user.type(screen.getByLabelText('Search customers'), 'asha');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(customersApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, search: 'asha' })));
    await user.selectOptions(screen.getByLabelText('Status'), 'ACTIVE');
    await waitFor(() => expect(customersApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, search: 'asha', status: 'ACTIVE' })));
    await user.selectOptions(screen.getByLabelText('Customer type'), 'WHOLESALE');
    await waitFor(() => expect(customersApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ customerType: 'WHOLESALE' })));
  });
  it('shows an API error and retries', async () => {
    vi.mocked(customersApi.list).mockRejectedValueOnce(failure); mount();
    await screen.findByRole('alert'); await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await screen.findByRole('link', { name: 'Asha Shah' }); expect(customersApi.list).toHaveBeenCalledTimes(2);
  });
  it('shows an empty result with disabled pagination', async () => {
    vi.mocked(customersApi.list).mockResolvedValue({ customers: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    mount(); await screen.findByText('No customers found'); expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
  it('gives Accounts read-only detail and blocks direct edit URLs', async () => {
    auth.user.role = 'ACCOUNTS'; const view = mount('/customers/customer1'); await screen.findByText('Customer information');
    expect(screen.queryByRole('link', { name: 'Edit customer' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add follow-up' })).not.toBeInTheDocument();
    view.unmount(); mount('/customers/customer1/edit'); await screen.findByRole('heading', { name: 'Customers' });
    expect(screen.queryByRole('link', { name: '+ Add customer' })).not.toBeInTheDocument();
  });
  it('does not request customers for Warehouse', () => {
    auth.user.role = 'WAREHOUSE'; mount(); expect(screen.getByRole('heading', { name: 'Customer access unavailable' })).toBeInTheDocument(); expect(customersApi.list).not.toHaveBeenCalled();
  });
  it('shows detail API errors without an editable form', async () => {
    vi.mocked(customersApi.detail).mockRejectedValue(failure); mount('/customers/missing'); await screen.findByRole('alert'); expect(screen.queryByRole('button', { name: 'Save customer' })).not.toBeInTheDocument();
  });
});

describe('customer forms and history', () => {
  it('validates required inputs and creates a customer through the API', async () => {
    mount('/customers/new'); const user = userEvent.setup(); await user.click(screen.getByRole('button', { name: 'Save customer' }));
    await screen.findByText('Enter a customer name'); expect(customersApi.create).not.toHaveBeenCalled();
    for (const [name, value] of [['Customer name *', 'Asha Shah'], ['Business name *', 'Asha Wholesale'], ['Mobile number *', '+919876543210'], ['Email *', 'asha@example.com'], ['Address *', '12 Market Road']]) await user.type(screen.getByLabelText(name), value);
    await user.click(screen.getByRole('button', { name: 'Save customer' })); await screen.findByText('Customer created.');
    expect(customersApi.create).toHaveBeenCalledWith(expect.objectContaining({ gstNumber: null, followUpDate: null, customerName: 'Asha Shah' }));
  });
  it('preserves edited values and shows server field errors', async () => {
    vi.mocked(customersApi.update).mockRejectedValue(failure); mount('/customers/customer1/edit'); const user = userEvent.setup();
    const name = await screen.findByLabelText('Customer name *'); await user.clear(name); await user.type(name, 'Updated Asha'); await user.click(screen.getByRole('button', { name: 'Save customer' }));
    await screen.findByText('Email was rejected by the server'); expect(name).toHaveValue('Updated Asha');
    expect(customersApi.update).toHaveBeenCalledWith('customer1', expect.objectContaining({ followUpDate: customer.followUpDate, customerName: 'Updated Asha' }));
  });
  it('disables duplicate submissions while saving', async () => {
    vi.mocked(customersApi.update).mockImplementation(() => new Promise(() => {})); mount('/customers/customer1/edit'); await screen.findByLabelText('Customer name *');
    await userEvent.click(screen.getByRole('button', { name: 'Save customer' })); expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled(); expect(customersApi.update).toHaveBeenCalledTimes(1);
  });
  it('retains historical notes, validates new notes, and appends only a confirmed response', async () => {
    const prior = { id: 'f0', customerId: customer.id, note: 'Earlier call', followUpDate: null, createdById: actor.id, createdBy: actor, createdAt: '2026-09-08T10:00:00Z' };
    vi.mocked(customersApi.detail).mockResolvedValue({ ...customer, followUps: [prior] });
    vi.mocked(customersApi.followUp).mockResolvedValue({ ...prior, id: 'f1', note: 'New call' });
    mount('/customers/customer1'); const user = userEvent.setup(); await screen.findByText('Earlier call');
    await user.click(screen.getByRole('button', { name: 'Add follow-up' })); await screen.findByText('Enter a follow-up note');
    await user.type(screen.getByLabelText('Follow-up note *'), 'New call'); await user.click(screen.getByRole('button', { name: 'Add follow-up' }));
    await screen.findByText('Follow-up added.'); expect(screen.getByText('Earlier call')).toBeInTheDocument(); expect(screen.getByText('New call')).toBeInTheDocument();
    expect(customersApi.followUp).toHaveBeenCalledWith('customer1', { note: 'New call' }); expect(screen.getByLabelText('Follow-up note *')).toHaveValue('');
  });
  it('preserves an unsuccessful follow-up for retry', async () => {
    vi.mocked(customersApi.followUp).mockRejectedValue(failure); mount('/customers/customer1'); await screen.findByText('No follow-ups yet.');
    await userEvent.type(screen.getByLabelText('Follow-up note *'), 'Call again'); await userEvent.click(screen.getByRole('button', { name: 'Add follow-up' }));
    await screen.findByRole('alert'); expect(screen.getByLabelText('Follow-up note *')).toHaveValue('Call again'); expect(screen.queryByText('Follow-up added.')).not.toBeInTheDocument();
  });
  it('maps date omission, clearing, and setting distinctly and preserves unchanged timestamps', () => {
    expect(followUpPayload({ note: 'x', schedule: 'keep', followUpDate: '' })).toEqual({ note: 'x' });
    expect(followUpPayload({ note: 'x', schedule: 'clear', followUpDate: '' })).toEqual({ note: 'x', followUpDate: null });
    expect(followUpPayload({ note: 'x', schedule: 'set', followUpDate: '2026-10-02' })).toEqual({ note: 'x', followUpDate: '2026-10-02' });
    expect(customerPayload(valuesFor(customer), customer).followUpDate).toBe(customer.followUpDate);
  });
});
