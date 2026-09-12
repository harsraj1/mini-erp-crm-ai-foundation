import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { operationsApi as api, type Balance, type Item, type Location, type WorkOrder, type Transfer, type Order, type InventoryEvent } from '../../api/operations';
import { errorMessage, fieldErrors } from '../../api/client';
import { ErrorAlert, Loading, PageHeader, TableRegion } from '../../components/ui';
import { useResource } from '../../hooks/useResource';
import { useAuth } from '../../contexts/AuthContext';
import type { User } from '../../types';

export type OperationsScreen='inventory'|'work-orders'|'transfers'|'orders';
const titles={inventory:'Inventory','work-orders':'Work Orders',transfers:'Internal Transfers',orders:'Customer Orders'};
const statusLabel=(s:string)=>s.split('_').map(w=>w[0]+w.slice(1).toLowerCase()).join(' ');
const balanceLabel=(b:Balance)=>`${b.item.name} (${b.item.code}) · ${b.location.name} · Batch ${b.batch} · Available ${b.availableQuantity}`;
interface Choice {value:string;label:string}
interface InputField {name:string;label:string;choices?:Choice[];numeric?:boolean;zero?:boolean;max?:number}

function OperationForm({title,fields,path,onSaved,onAttempt,requestKey=true}:{title:string;fields:InputField[];path:string;onSaved:()=>void;onAttempt:()=>void;requestKey?:boolean}) {
  const {register,handleSubmit,formState:{errors,isSubmitting},reset,setError}=useForm<Record<string,string>>();
  const [failure,setFailure]=useState('');const lock=useRef(false);const request=useRef({payload:'',id:''});
  async function submit(values:Record<string,string>){
    if(lock.current)return;lock.current=true;setFailure('');onAttempt();
    const body:Record<string,string|number>={};for(const f of fields)body[f.name]=f.numeric?Number(values[f.name]):values[f.name].trim();
    const payload=JSON.stringify(body);if(payload!==request.current.payload)request.current={payload,id:crypto.randomUUID()};
    if(requestKey)body.requestId=request.current.id;
    try{await api.post(path,body);reset();request.current={payload:'',id:''};onSaved()}
    catch(e){setFailure(errorMessage(e));for(const issue of fieldErrors(e))setError(issue.field,{message:issue.message})}
    finally{lock.current=false}
  }
  return <form onSubmit={handleSubmit(submit)} className="card stack" noValidate><h2>{title}</h2><ErrorAlert message={failure}/><fieldset disabled={isSubmitting} className="form-grid">{fields.map(f=><div className="field" key={f.name}><label htmlFor={`${path}-${f.name}`}>{f.label} *</label>{f.choices?<select id={`${path}-${f.name}`} aria-invalid={!!errors[f.name]} {...register(f.name,{required:`Select ${f.label.toLowerCase()}`})}><option value="">Select…</option>{f.choices.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select>:<input id={`${path}-${f.name}`} type={f.numeric?'number':'text'} step={f.numeric?1:undefined} min={f.numeric?(f.zero?0:1):undefined} aria-invalid={!!errors[f.name]} {...register(f.name,{validate:value=>f.numeric?(value!==''&&Number.isInteger(Number(value))&&Number(value)>=(f.zero?0:1)&&Number(value)<=2147483647)||'Enter a valid whole quantity':(!!value?.trim()&&value.trim().length<=(f.max??200))||`Enter 1–${f.max??200} characters`})}/>}<small className="field-error" role={errors[f.name]?'alert':undefined}>{errors[f.name]?.message}</small></div>)}</fieldset><button className="primary" disabled={isSubmitting}>{isSubmitting?'Saving…':title}</button></form>
}

function Action({title,warning,run,onSaved,onAttempt}:{title:string;warning:string;run:()=>Promise<unknown>;onSaved:()=>void;onAttempt:()=>void}) {
  const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');const lock=useRef(false);const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close()},[open]);
  async function submit(){if(lock.current)return;lock.current=true;setBusy(true);setError('');onAttempt();try{await run();setOpen(false);onSaved()}catch(e){setError(errorMessage(e))}finally{lock.current=false;setBusy(false)}}
  return <><button disabled={busy} onClick={()=>{setError('');setOpen(true)}}>{title}</button><dialog className="challan-dialog" ref={dialog} aria-label={title} onCancel={e=>{if(busy)e.preventDefault();else setOpen(false)}}><h2>{title}</h2><p>{warning}</p><ErrorAlert message={error}/><div className="form-footer"><button disabled={busy} onClick={()=>setOpen(false)}>Back</button><button disabled={busy} onClick={submit}>{busy?'Saving…':'Continue'}</button></div></dialog></>
}

function History({id}:{id:string}) {
  const [page,setPage]=useState(1);const load=useCallback(()=>api.list<InventoryEvent>(`inventory/${id}/history`,page),[id,page]);const r=useResource(load);
  return <section className="card"><h2>Inventory transaction history</h2><ErrorAlert message={r.error} retry={r.retry}/>{r.loading?<Loading/>:r.data&&<>{r.data.rows.length?<TableRegion name="Inventory transactions"><table className="operations-table"><thead><tr><th>Physical change</th><th>Reserved change</th><th>Reason</th><th>By</th><th>Time</th></tr></thead><tbody>{r.data.rows.map(e=><tr key={e.id}><td>{e.physicalChange}</td><td>{e.reservedChange}</td><td>{e.reason}</td><td>{e.createdBy.name}</td><td>{new Date(e.createdAt).toLocaleString()}</td></tr>)}</tbody></table></TableRegion>:<p>No transactions yet.</p>}<Pager page={page} total={r.data.pagination.totalPages} setPage={setPage}/></>}</section>
}
function Pager({page,total,setPage}:{page:number;total:number;setPage:(page:number)=>void}){return <div className="pagination"><button disabled={page===1} onClick={()=>setPage(page-1)}>Previous</button><span>Page {page} of {Math.max(1,total)}</span><button disabled={page>=total} onClick={()=>setPage(page+1)}>Next</button></div>}

export function Operations({screen}:{screen:OperationsScreen}) {
  const {user}=useAuth();const manage=['ADMIN','OPERATIONS','WAREHOUSE'].includes(user!.role),admin=user!.role==='ADMIN',sales=admin||user!.role==='SALES';
  const [page,setPage]=useState(1),[search,setSearch]=useState(''),[version,setVersion]=useState(0),[message,setMessage]=useState('');
  const [selected,setSelected]=useState<Balance>();
  const load=useCallback(()=>api.list<Balance|WorkOrder|Transfer|Order>(screen,page,screen==='inventory'?search:''),[screen,page,search,version]);const r=useResource(load);
  const loadChoices=useCallback(async()=>{
    const catalog=await api.catalog();const balances=await api.allBalances();const users=admin&&screen==='work-orders'?await api.assignees():[];
    return {...catalog,balances,users};
  },[admin,screen,version]);const choices=useResource(loadChoices);
  const saved=()=>{setMessage('Saved successfully. Quantities and statuses below come from the server.');setVersion(v=>v+1)};
  const itemChoices=(items:Item[])=>items.map(i=>({value:i.id,label:`${i.name} (${i.code})`}));
  const locationChoices=(locations:Location[])=>locations.map(l=>({value:l.id,label:l.name}));
  const balances=choices.data?.balances.map(b=>({value:b.id,label:balanceLabel(b)}))??[];
  const tableHeaders=screen==='inventory'?['Item / Category','Location / Batch','Physical','Reserved','Available','Actions']:screen==='work-orders'?['Work order','Item / Location','Required','Available / Shortage','Assigned to','Status','Action']:screen==='transfers'?['Transfer','Item / Batch','Source','Destination','Quantity','Status','Action']:['Order','Customer','Item / Location / Batch','Reserved quantity','Status'];
  return <div className="stack"><PageHeader title={titles[screen]} description={screen==='inventory'?'Available = physical − reserved.':screen==='work-orders'?'Check material shortages at the work location.':screen==='transfers'?'Dispatch reduces the source. Receipt increases the destination.':'Reserve available stock without reducing physical quantity.'}/>{message&&<div role="status" className="alert success">{message}</div>}
    {screen==='inventory'&&<label>Search inventory<input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/></label>}
    <ErrorAlert message={r.error} retry={r.retry}/>{r.loading?<Loading/>:r.data&&<section className="card list-card">{!r.data.rows.length?<div className="empty">No {titles[screen].toLowerCase()} found.</div>:<TableRegion name={titles[screen]}><table className="operations-table"><thead><tr>{tableHeaders.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{r.data.rows.map(row=>{
      if(screen==='inventory'){const b=row as Balance;return <tr key={b.id}><td>{b.item.name}<small>{b.item.code} · {b.item.category}</small></td><td>{b.location.name}<small>{b.batch}</small></td><td>{b.physicalQuantity}</td><td>{b.reservedQuantity}</td><td>{b.availableQuantity}</td><td><button onClick={()=>setSelected(b)}>{manage?'View / adjust':'View history'}</button></td></tr>}
      if(screen==='work-orders'){const w=row as WorkOrder;return <tr key={w.id}><td>{w.id}</td><td>{w.item.name}<small>{w.location.name}</small></td><td>{w.requiredQuantity}</td><td>{w.availableQuantity} available<strong className={w.shortage?'field-error':''}> / {w.shortage} short</strong>{w.alternatives.map(b=><small key={b.id}>{b.location.name}, batch {b.batch}: {b.availableQuantity} available</small>)}{w.shortage>0&&manage&&<Link to="/transfers">Request internal transfer</Link>}</td><td>{w.assignedUser.name}</td><td><span className="badge">{statusLabel(w.status)}</span></td><td>{manage&&(admin||user!.id===w.assignedUser.id)&&w.status!=='COMPLETED'&&<Action title={w.status==='ASSIGNED'?'Start work':'Complete work'} warning="This updates work status only. It does not consume or produce stock." run={()=>api.workStatus(w.id,w.status==='ASSIGNED'?'IN_PROGRESS':'COMPLETED')} onSaved={saved} onAttempt={()=>setMessage('')}/>}</td></tr>}
      if(screen==='transfers'){const t=row as Transfer;return <tr key={t.id}><td>{t.id}</td><td>{t.sourceBalance.item.name}<small>{t.sourceBalance.batch}</small></td><td>{t.sourceBalance.location.name}</td><td>{t.destinationLocation.name}</td><td>{t.quantity}</td><td><span className="badge">{statusLabel(t.status)}</span></td><td>{manage&&t.status!=='RECEIVED'&&<Action title={t.status==='REQUESTED'?'Dispatch':'Receive'} warning={t.status==='REQUESTED'?'Source physical stock will decrease. Destination stock stays unchanged until receipt.':'Destination physical stock will increase. This receipt can only happen once.'} run={()=>api.post(`transfers/${t.id}/${t.status==='REQUESTED'?'dispatch':'receive'}`,{})} onSaved={saved} onAttempt={()=>setMessage('')}/>}</td></tr>}
      const o=row as Order;return <tr key={o.id}><td>{o.id}</td><td>{o.customerName}</td><td>{o.balance.item.name}<small>{o.balance.location.name} · {o.balance.batch}</small></td><td>{o.quantity}</td><td><span className="badge active">Reserved</span></td></tr>
    })}</tbody></table></TableRegion>}<Pager page={page} total={r.data.pagination.totalPages} setPage={setPage}/></section>}
    <ErrorAlert message={choices.error} retry={choices.retry}/>
    {choices.loading?<Loading/>:choices.data&&<>
      {screen==='inventory'&&manage&&<div className="ops-forms"><OperationForm title="Add item" path="items" requestKey={false} fields={[{name:'name',label:'Item name'},{name:'code',label:'Item code',max:100},{name:'category',label:'Category',max:100}]} onSaved={saved} onAttempt={()=>setMessage('')}/><OperationForm title="Add location" path="locations" requestKey={false} fields={[{name:'name',label:'Location name',max:100}]} onSaved={saved} onAttempt={()=>setMessage('')}/><OperationForm title="Add opening inventory" path="inventory" fields={[{name:'itemId',label:'Item',choices:itemChoices(choices.data.items)},{name:'locationId',label:'Location',choices:locationChoices(choices.data.locations)},{name:'batch',label:'Batch',max:100},{name:'physicalQuantity',label:'Physical quantity',numeric:true,zero:true}]} onSaved={saved} onAttempt={()=>setMessage('')}/></div>}
      {screen==='work-orders'&&admin&&<OperationForm title="Create work order" path="work-orders" fields={[{name:'itemId',label:'Required material',choices:itemChoices(choices.data.items)},{name:'locationId',label:'Work location',choices:locationChoices(choices.data.locations)},{name:'requiredQuantity',label:'Required quantity',numeric:true},{name:'assignedUserId',label:'Assigned user',choices:choices.data.users.map((u:User)=>({value:u.id,label:`${u.name} (${u.role})`}))}]} onSaved={saved} onAttempt={()=>setMessage('')}/>}
      {screen==='transfers'&&manage&&<OperationForm title="Request transfer" path="transfers" fields={[{name:'sourceBalanceId',label:'Source inventory',choices:balances},{name:'destinationLocationId',label:'Destination location',choices:locationChoices(choices.data.locations)},{name:'quantity',label:'Transfer quantity',numeric:true}]} onSaved={saved} onAttempt={()=>setMessage('')}/>}
      {screen==='orders'&&sales&&<OperationForm title="Create order and reserve" path="orders" fields={[{name:'customerName',label:'Customer name'},{name:'balanceId',label:'Inventory to reserve',choices:balances},{name:'quantity',label:'Order quantity',numeric:true}]} onSaved={saved} onAttempt={()=>setMessage('')}/>}
    </>}
    {screen==='inventory'&&selected&&<section className="stack"><PageHeader title={`${selected.item.name} · ${selected.location.name} · ${selected.batch}`}><button onClick={()=>setSelected(undefined)}>Close selection</button></PageHeader>{manage&&<OperationForm key={selected.id} title="Adjust inventory" path={`inventory/${selected.id}/adjust`} fields={[{name:'direction',label:'Direction',choices:[{value:'IN',label:'IN — add physical stock'},{value:'OUT',label:'OUT — remove available stock'}]},{name:'quantity',label:'Adjustment quantity',numeric:true},{name:'reason',label:'Reason',max:500}]} onSaved={saved} onAttempt={()=>setMessage('')}/>}<History key={`${selected.id}-${version}`} id={selected.id}/></section>}
  </div>
}
