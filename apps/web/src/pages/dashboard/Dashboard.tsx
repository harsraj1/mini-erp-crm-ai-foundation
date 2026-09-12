import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { customersApi } from '../../api/customers';
import { productsApi } from '../../api/products';
import { useAuth } from '../../contexts/AuthContext';
import { useResource } from '../../hooks/useResource';
import { ErrorAlert, Skeleton, PageHeader } from '../../components/ui';
import { canReadCustomers } from '../../types';
export async function dashboardMetrics(customerAccess:boolean){
 const result:{title:string;count:number;href:string}[]=[];
 if(customerAccess){const [all,leads]=await Promise.all([customersApi.list({page:1,limit:1}),customersApi.list({page:1,limit:1,status:'LEAD'})]);result.push({title:'Customers',count:all.pagination.total,href:'/customers'},{title:'Leads',count:leads.pagination.total,href:'/customers?status=LEAD'})}
 let low=0,total=0;for(let page=1;;page++){const r=await productsApi.list({page,limit:100});total=r.pagination.total;low+=r.products.filter(p=>p.currentStock<=p.minimumStockAlertQuantity).length;if(page>=r.pagination.totalPages)break}
 result.push({title:'Products',count:total,href:'/products'},{title:'Low stock',count:low,href:'/products'});
 for(const status of ['DRAFT','CONFIRMED']){const r=await api.get<{data:{pagination:{total:number}}}>('/challans',{params:{page:1,limit:1,status}});result.push({title:status==='DRAFT'?'Draft challans':'Confirmed challans',count:r.data.data.pagination.total,href:'/challans'})}
 return result;
}
export function Dashboard(){const {user}=useAuth();const read=canReadCustomers(user!.role);const load=useCallback(()=>dashboardMetrics(read),[read]);const r=useResource(load);return <><PageHeader title="Dashboard" description="Current operational totals from your accessible modules."/><ErrorAlert message={r.error} retry={r.retry}/>{r.loading?<Skeleton kind="metrics"/>:r.data&&<div className="metric-grid">{r.data.map(m=><Link key={m.title} className="card metric" to={m.href}><span>{m.title}</span><strong>{m.count}</strong></Link>)}</div>}{!read&&<p>Customer metrics are unavailable for your role.</p>}<p className="dashboard-note">Low stock includes products at or below their minimum alert quantity. Totals refresh when you open this page.</p></>}
