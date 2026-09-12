import { Dashboard } from './pages/dashboard/Dashboard';
import { Operations, type OperationsScreen } from './pages/operations/Operations';
import { ChallanList, ChallanCreate, ChallanDetail } from './pages/challans/Challans';
import { useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { canReadCustomers, canWriteCustomers, canWriteProducts } from './types';
import { Loading, label } from './components/ui';
import { Login } from './pages/auth/Login';
import { CustomerList } from './pages/customers/CustomerList';
import { CustomerDetail } from './pages/customers/CustomerDetail';
import { CustomerForm } from './pages/customers/CustomerForm';
import { ProductList } from './pages/products/ProductList'; import { ProductForm } from './pages/products/ProductForm'; import { ProductDetail } from './pages/products/ProductDetail';

export function App() {
  const auth = useAuth(); const [menuOpen, setMenuOpen] = useState(false); const location = useLocation();
  if (auth.loading) return <main><Loading /></main>;
  if (!auth.user) return <Login />;
  const userId = auth.user.id;
  const readable = canReadCustomers(auth.user.role); const writable = canWriteCustomers(auth.user.role);
  return <div className="app-shell"><a className="skip-link" href="#main">Skip to content</a>
    <aside className="sidebar"><div className="brand"><span className="brand-mark">M</span><span>Mini ERP <small>OPERATIONS PORTAL</small></span></div>
      <button className="menu-toggle" aria-expanded={menuOpen} aria-controls="navigation" onClick={() => setMenuOpen(!menuOpen)}>Menu</button>
      <nav id="navigation" className={menuOpen ? 'open' : ''} aria-label="Main navigation">{(['inventory','work-orders','transfers','orders'] as OperationsScreen[]).map((screen,index)=><NavLink key={screen} to={`/${screen}`} onClick={()=>setMenuOpen(false)}>{['Inventory','Work Orders','Internal Transfers','Customer Orders'][index]}</NavLink>)}</nav>
      <p className="sidebar-note">Inventory, transfers and reservations</p></aside>
    <div className="workspace"><header className="topbar"><span>{location.pathname.startsWith('/inventory')?'Inventory':location.pathname.startsWith('/work-orders')?'Work Orders':location.pathname.startsWith('/transfers')?'Internal Transfers':location.pathname.startsWith('/orders')?'Customer Orders':location.pathname.startsWith('/challans')?'Sales challans':location.pathname.startsWith('/products')?'Inventory':location.pathname.startsWith('/customers')?'Customer CRM':'Operations overview'}</span><div className="user-menu"><span>{auth.user.name}<small>{label(auth.user.role)}</small></span><button onClick={auth.logout}>Sign out</button></div></header>
      <main id="main">{!readable && location.pathname.startsWith('/customers') ? <section className="card"><h1>Customer access unavailable</h1><p>Your Warehouse role does not have customer access. Sign in with an authorized account to continue.</p></section> :
        <Routes>{(['inventory','work-orders','transfers','orders'] as OperationsScreen[]).map(screen=><Route key={screen} path={`/${screen}`} element={<Operations key={`${screen}-${userId}`} screen={screen}/>}/>)}<Route path="/dashboard" element={<Dashboard key={auth.user.role}/>}/><Route path="/customers" element={<CustomerList key={location.search} />} /><Route path="/customers/new" element={writable ? <CustomerForm /> : <Navigate to="/customers" replace />} />
          <Route path="/customers/:id" element={<CustomerDetail key={location.pathname} />} /><Route path="/customers/:id/edit" element={writable ? <CustomerDetail key={location.pathname} edit /> : <Navigate to="/customers" replace />} />
          <Route path="/products" element={<ProductList />} /><Route path="/products/new" element={canWriteProducts(auth.user.role)?<ProductForm/>:<Navigate to="/products" replace/>}/><Route path="/products/:id" element={<ProductDetail/>}/><Route path="/products/:id/edit" element={canWriteProducts(auth.user.role)?<ProductForm/>:<Navigate to="/products" replace/>}/>
          <Route path="/challans" element={<ChallanList/>}/><Route path="/challans/new" element={writable?<ChallanCreate/>:<Navigate to="/challans" replace/>}/><Route path="/challans/:id" element={<ChallanDetail key={location.pathname}/>}/><Route path="*" element={<Navigate to="/inventory" replace />} /></Routes>}
      </main></div></div>;
}


