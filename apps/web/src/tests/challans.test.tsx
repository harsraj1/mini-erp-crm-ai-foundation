import { beforeEach,it,expect,vi } from 'vitest';
import { render,screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ChallanCreate,ChallanList } from '../pages/challans/Challans';
import { challansApi,type Challan } from '../api/challans';
import { customersApi } from '../api/customers';
import { productsApi } from '../api/products';
vi.mock('../contexts/AuthContext',()=>({useAuth:()=>({user:{role:'SALES'}})}));
vi.mock('../api/challans',()=>({challansApi:{list:vi.fn(),create:vi.fn(),confirm:vi.fn(),cancel:vi.fn()}}));
vi.mock('../api/customers',()=>({customersApi:{list:vi.fn()}}));
vi.mock('../api/products',()=>({productsApi:{list:vi.fn()}}));
const customer={id:'c1',customerName:'Customer',businessName:'Business'};
const c={id:'draft1',challanNumber:'CH-1',status:'DRAFT',totalQuantity:1,customer,items:[{id:'i1',productNameSnapshot:'Widget',skuSnapshot:'SKU',unitPriceSnapshot:'10',quantity:1}]} as Challan;
beforeEach(()=>{
 vi.resetAllMocks();
 HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};
 vi.mocked(customersApi.list).mockResolvedValue({customers:[customer],pagination:{totalPages:1}} as Awaited<ReturnType<typeof customersApi.list>>);
 vi.mocked(productsApi.list).mockResolvedValue({products:[{id:'p1',productName:'Widget',sku:'SKU',unitPrice:'10',currentStock:5}],pagination:{totalPages:1}} as Awaited<ReturnType<typeof productsApi.list>>);
 vi.mocked(challansApi.create).mockResolvedValue(c);
});
it('saves a draft and preserves it through insufficient-stock retry without creating twice',async()=>{
 render(<MemoryRouter><ChallanCreate/></MemoryRouter>);const u=userEvent.setup();
 await u.selectOptions(await screen.findByLabelText('Customer *'),'c1');await u.selectOptions(screen.getByLabelText('Product 1 *'),'p1');
 expect(screen.getByText('Available stock').parentElement).toHaveTextContent('5');
 await u.click(screen.getByRole('button',{name:'Save Draft'}));await screen.findByText('Draft saved. Stock has not changed.');
 expect(challansApi.create).toHaveBeenCalledWith({customerId:'c1',items:[{productId:'p1',quantity:1}]});
 vi.mocked(challansApi.confirm).mockRejectedValueOnce({isAxiosError:true,response:{data:{error:{message:'Insufficient stock for SKU'}}}}).mockResolvedValue({...c,status:'CONFIRMED'});
 await u.click(screen.getByRole('button',{name:'Confirm Challan'}));await u.click(screen.getByRole('button',{name:'Confirm stock deduction'}));await screen.findByText('Insufficient stock for SKU');
 await u.click(screen.getByRole('button',{name:'Confirm stock deduction'}));await screen.findByText('Challan confirmed by the server.');expect(challansApi.create).toHaveBeenCalledTimes(1);expect(challansApi.confirm).toHaveBeenCalledWith('draft1');
});
it('adds and removes rows and retains form values on server rejection',async()=>{
 vi.mocked(challansApi.create).mockRejectedValue(new Error('network'));render(<MemoryRouter><ChallanCreate/></MemoryRouter>);const u=userEvent.setup();
 await u.selectOptions(await screen.findByLabelText('Customer *'),'c1');await u.selectOptions(screen.getByLabelText('Product 1 *'),'p1');
 await u.click(screen.getByRole('button',{name:'Add product row'}));expect(screen.getByLabelText('Product 2 *')).toBeInTheDocument();await u.click(screen.getByRole('button',{name:'Remove row 2'}));
 await u.click(screen.getByRole('button',{name:'Save Draft'}));await screen.findByRole('alert');expect(screen.getByLabelText('Customer *')).toHaveValue('c1');expect(screen.getByLabelText('Product 1 *')).toHaveValue('p1');
});
it('shows loading and empty list',async()=>{
 vi.mocked(challansApi.list).mockResolvedValue({challans:[],pagination:{totalPages:0}});render(<MemoryRouter><ChallanList/></MemoryRouter>);expect(screen.getByRole('status')).toHaveTextContent('Loading');await screen.findByText('No challans found.');expect(screen.getByRole('button',{name:'Next'})).toBeDisabled();
});

it('cancels a saved draft only after confirmation and updates its status',async()=>{
 vi.mocked(challansApi.cancel).mockResolvedValue({...c,status:'CANCELLED'});
 render(<MemoryRouter><ChallanCreate/></MemoryRouter>);const u=userEvent.setup();
 await u.selectOptions(await screen.findByLabelText('Customer *'),'c1');await u.selectOptions(screen.getByLabelText('Product 1 *'),'p1');
 await u.click(screen.getByRole('button',{name:'Save Draft'}));await screen.findByText('Draft saved. Stock has not changed.');
 await u.click(screen.getByRole('button',{name:'Cancel Challan'}));expect(challansApi.cancel).not.toHaveBeenCalled();
 await u.click(screen.getByRole('button',{name:'Yes, cancel challan'}));await screen.findByText('Challan cancelled. Stock has not changed.');
 expect(challansApi.cancel).toHaveBeenCalledWith('draft1');expect(screen.getByText('CANCELLED')).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Confirm Challan'})).not.toBeInTheDocument();
});
it('preserves draft on cancellation failure and supports retry',async()=>{
 vi.mocked(challansApi.cancel).mockRejectedValueOnce({isAxiosError:true,response:{data:{error:{message:'Cannot cancel right now'}}}}).mockResolvedValue({...c,status:'CANCELLED'});
 render(<MemoryRouter><ChallanCreate/></MemoryRouter>);const u=userEvent.setup();
 await u.selectOptions(await screen.findByLabelText('Customer *'),'c1');await u.selectOptions(screen.getByLabelText('Product 1 *'),'p1');
 await u.click(screen.getByRole('button',{name:'Save Draft'}));await u.click(await screen.findByRole('button',{name:'Cancel Challan'}));
 await u.click(screen.getByRole('button',{name:'Yes, cancel challan'}));await screen.findByText('Cannot cancel right now');expect(screen.getByText('DRAFT')).toBeInTheDocument();
 await u.click(screen.getByRole('button',{name:'Yes, cancel challan'}));await screen.findByText('CANCELLED');
});
