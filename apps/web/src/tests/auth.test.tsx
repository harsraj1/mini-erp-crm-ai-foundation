import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { AuthProvider } from '../contexts/AuthContext';
import { api, tokenKey } from '../api/client';
import { customersApi } from '../api/customers';
const user = { id: 'u1', name: 'Demo Sales', email: 'sales@example.com', role: 'SALES' };
beforeEach(() => { sessionStorage.clear(); vi.spyOn(customersApi, 'list').mockResolvedValue({ customers: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }); });
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); });
function mount() { render(<MemoryRouter initialEntries={['/customers']}><AuthProvider><App /></AuthProvider></MemoryRouter>); }
it('signs in using the existing API, stores the session, and signs out', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: { token: 'test-token', user } } });
  mount(); const actor = userEvent.setup();
  await actor.type(await screen.findByLabelText('Email'), user.email); await actor.type(screen.getByLabelText('Password'), 'demo-password');
  await actor.click(screen.getByRole('button', { name: 'Sign in' })); await screen.findByRole('heading', { name: 'Customers' });
  expect(post).toHaveBeenCalledWith('/auth/login', { email: user.email, password: 'demo-password' });
  expect(sessionStorage.getItem(tokenKey)).toBe('test-token');
  await actor.click(screen.getByRole('button', { name: 'Sign out' })); expect(sessionStorage.getItem(tokenKey)).toBeNull();
  await screen.findByRole('heading', { name: 'Welcome back' });
});
it('shows a login error and preserves the email', async () => {
  vi.spyOn(api, 'post').mockRejectedValue({ isAxiosError: true, response: { status: 401, data: { error: { message: 'Invalid email or password' } } } });
  mount(); await userEvent.type(await screen.findByLabelText('Email'), user.email); await userEvent.type(screen.getByLabelText('Password'), 'wrong');
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' })); await screen.findByText('Invalid email or password');
  expect(screen.getByLabelText('Email')).toHaveValue(user.email); expect(sessionStorage.getItem(tokenKey)).toBeNull();
});
it('restores the current user and returns to sign-in on session expiry', async () => {
  sessionStorage.setItem(tokenKey, 'test-token');
  const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: { user } } });
  mount(); await screen.findByRole('heading', { name: 'Customers' }); expect(get).toHaveBeenCalledWith('/auth/me');
  act(() => { sessionStorage.removeItem(tokenKey); window.dispatchEvent(new Event('session-expired')); });
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument());
  expect(screen.getByText('Your session expired. Please sign in again.')).toBeInTheDocument();
});
