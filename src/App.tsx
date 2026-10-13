import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TCForm from './pages/TCForm';
import TCPreview from './pages/TCPreview';
import Records from './pages/Records';
import Colleges from './pages/Colleges';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import DropdownMaster from './pages/DropdownMaster';
import { CollegeProvider } from './context/CollegeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { signOut } from './lib/auth';
import './App.css';

const Sidebar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { profile } = useAuth();
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">TC</div>
        <div>
          <div className="sidebar-brand-title">TC System</div>
          <div className="sidebar-brand-sub">Palar Agricultural College</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">MAIN</div>
        <NavLink to="/" end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={onClose}>
          <span className="sl-icon">🏠</span> Dashboard
        </NavLink>
        <NavLink to="/new-tc" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={onClose}>
          <span className="sl-icon">➕</span> New TC
        </NavLink>
        <NavLink to="/records" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={onClose}>
          <span className="sl-icon">📋</span> TC Records
        </NavLink>
        <NavLink to="/colleges" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={onClose}>
          <span className="sl-icon">🏫</span> Colleges
        </NavLink>
        {profile?.role === 'admin' && (
          <>
            <div className="sidebar-section">ADMIN</div>
            <NavLink to="/admin" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={onClose}>
              <span className="sl-icon">👤</span> User Management
            </NavLink>
            <NavLink to="/dropdowns" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={onClose}>
              <span className="sl-icon">⚙</span> Dropdown Master
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{profile?.username?.[0]?.toUpperCase() ?? 'U'}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-email">{profile?.username || '—'}</div>
            <div className="sidebar-user-role">{profile?.role ?? 'user'}</div>
          </div>
        </div>
        <button className="sidebar-signout" onClick={() => signOut()}>⏻ Sign Out</button>
      </div>
    </aside>
  );
};

const ProtectedLayout: React.FC = () => {
  const { session, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) return <div className="app-loading">Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;

  return (
    <CollegeProvider>
      <div className="app-shell">
        {/* Mobile overlay */}
        {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

        <div className={`sidebar-wrap${mobileOpen ? ' open' : ''}`}>
          <Sidebar onClose={() => setMobileOpen(false)} />
        </div>

        <div className="main-area">
          <header className="topbar">
            <button className="topbar-menu-btn" onClick={() => setMobileOpen(o => !o)}>☰</button>
            <span className="topbar-title">Transfer Certificate System</span>
          </header>
          <div className="main-content">
            <Routes>
              <Route path="/"             element={<Dashboard />} />
              <Route path="/new-tc"       element={<TCForm />} />
              <Route path="/preview/:id"  element={<TCPreview />} />
              <Route path="/records"      element={<Records />} />
              <Route path="/colleges"     element={<Colleges />} />
              <Route path="/admin"      element={<AdminPanel />} />
              <Route path="/dropdowns"  element={<DropdownMaster />} />
              <Route path="*"             element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </CollegeProvider>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*"    element={<ProtectedLayout />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
