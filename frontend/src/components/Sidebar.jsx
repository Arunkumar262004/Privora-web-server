import React from 'react';

const Sidebar = ({ activeSection, setActiveSection, user, onLogout, open, onClose }) => {
  const navItems = [
    { key: 'overview', icon: 'bi-speedometer2', label: 'Overview' },
    { key: 'calendar', icon: 'bi-calendar3', label: 'Calendar' },
    { key: 'users', icon: 'bi-people', label: 'Users' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <i className="bi bi-heartbeat"></i>
            <div className="sidebar-logo-lock"><i className="bi bi-lock-fill"></i></div>
          </div>
          <div className="sidebar-brand-text">
            <span className="brand-pri">Pri</span><span className="brand-vora">Vora</span>
          </div>
          <div className="sidebar-brand-sub">ADMIN PANEL</div>
        </div>

        <div className="sidebar-divider" />

        {/* User Info */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            <i className="bi bi-person-fill"></i>
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'Admin'}</div>
            <div className="sidebar-user-role">Administrator</div>
          </div>
        </div>

        <div className="sidebar-divider" />

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Quick Action</div>
          {navItems.map(item => (
            <button
              key={item.key}
              className={`sidebar-nav-btn ${activeSection === item.key ? 'sidebar-nav-btn--active' : ''}`}
              onClick={() => { setActiveSection(item.key); onClose && onClose(); }}
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
              {activeSection === item.key && <div className="sidebar-nav-indicator" />}
            </button>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <div className="sidebar-divider" />

        {/* Logout */}
        <button className="sidebar-logout-btn" onClick={onLogout}>
          <i className="bi bi-box-arrow-right"></i>
          <span>Sign Out</span>
        </button>
      </aside>
    </>
  );
};

export default Sidebar;