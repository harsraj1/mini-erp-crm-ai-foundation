import { beforeEach,it,expect,vi } from 'vitest';
import { render,screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { customersApi } from '../api/customers';
import { productsApi } from '../api/products';
import { challansApi } from '../api/challans';
import { api } from '../api/client';
import type { Role } from '../types';
const auth={user:{role:'ADMIN' as Role,name:'Test User'},loading:false,logout:vi.fn()};
vi.mock('../contexts/AuthContext',()=>({useAuth:()=>auth}));
vi.mock('../api/customers',()=>({customersApi:{list:vi.fn()}}));
vi.mock('../api/products',()=>({productsApi:{list:vi.fn()}}));
vi.mock('../api/challans',()=>({challansApi:{list:vi.fn()}}));
vi.mock('../api/client',()=>({api:{get:vi.fn()},errorMessage:()=> 'Server unavailable'}));
beforeEach(()=>{
 vi.clearAllMocks();vi.mocked(customersApi.list).mockResolvedValue({customers:[],pagination:{page:1,limit:1,total:7,totalPages:1}});
 vi.mocked(productsApi.list).mockResolvedValue({products:[],pagination:{page:1,limit:100,total:0,totalPages:0}});
 vi.mocked(challansApi.list).mockResolvedValue({challans:[],pagination:{totalPages:0}});
 vi.mocked(api.get).mockResolvedValue({data:{data:{pagination:{total:2}}}});
});
for(const role of ['ADMIN','SALES','WAREHOUSE','ACCOUNTS'] as Role[]){
 it(`${role} can open dashboard with permitted metrics`,async()=>{
 auth.user.role=role;render(<MemoryRouter initialEntries={['/dashboard']}><App/></MemoryRouter>);
 await screen.findByText('Low stock');expect(screen.getByRole('link',{name:'Inventory'})).toBeInTheDocument();
 expect(customersApi.list).toHaveBeenCalledTimes(role==='WAREHOUSE'?0:2);
 expect(screen.getByText('Test User')).toBeInTheDocument();
 });
 it(`${role} has correct product actions`,async()=>{
 auth.user.role=role;render(<MemoryRouter initialEntries={['/products']}><App/></MemoryRouter>);await screen.findByText('No products found.');
 expect(!!screen.queryByRole('link',{name:'Add product'})).toBe(role==='ADMIN'||role==='WAREHOUSE');
 });
 it(`${role} has correct challan actions`,async()=>{
 auth.user.role=role;render(<MemoryRouter initialEntries={['/challans']}><App/></MemoryRouter>);await screen.findByText('No challans found.');
 expect(!!screen.queryByRole('link',{name:'Create challan'})).toBe(role==='ADMIN'||role==='SALES');
 });
}
it('dashboard reports errors instead of fabricated zero metrics',async()=>{
 auth.user.role='ADMIN';vi.mocked(customersApi.list).mockRejectedValueOnce(new Error('offline'));render(<MemoryRouter initialEntries={['/dashboard']}><App/></MemoryRouter>);await screen.findByRole('alert');expect(screen.queryByText('Low stock')).not.toBeInTheDocument();
});
