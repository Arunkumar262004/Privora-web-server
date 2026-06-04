import React, { useState, useEffect } from 'react';
import CalendarComponent from '../components/CalendarComponent';
import Sidebar from '../components/Sidebar';

const Dashboard = ({ token, user, apiBaseUrl, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [users, setUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [userActionError, setUserActionError] = useState('');
  const [userActionSuccess, setUserActionSuccess] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [showAddUserForm, setShowAddUserForm] = useState(false);

  // Calendar states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [transactions, setTransactions] = useState([]);
  const [notes, setNotes] = useState([]);

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteId, setNoteId] = useState(null);
  const [noteMessage, setNoteMessage] = useState('');

  const totalTransactions = transactions.length;
  const totalCredit = transactions.reduce((sum, tx) => sum + (tx.type === 'credit' ? Number(tx.amount) : 0), 0);
  const totalDebit = transactions.reduce((sum, tx) => sum + (tx.type === 'debit' ? Number(tx.amount) : 0), 0);
  const totalWalletBalance = users.reduce((sum, u) => sum + Number(u.walletBalance || 0), 0);
  const totalNotes = notes.length;
  const transactionRatio = totalCredit + totalDebit ? Math.round((totalCredit / (totalCredit + totalDebit)) * 100) : 0;
  const topUsers = [...users].sort((a, b) => (b.walletBalance || 0) - (a.walletBalance || 0)).slice(0, 5);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBaseUrl}/auth/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserActionError('');
    setUserActionSuccess('');

    if (!newUserName || !newUserEmail || !newUserPassword) {
      setUserActionError('Please fill in all user details.');
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/auth/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newUserName, email: newUserEmail, password: newUserPassword })
      });
      const data = await res.json();

      if (data.success) {
        setUserActionSuccess(`User "${data.data.name}" created successfully!`);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        fetchUsers();
      } else {
        setUserActionError(data.message || 'Failed to create user');
      }
    } catch (err) {
      setUserActionError('Failed to communicate with backend.');
    }
  };

  const fetchCalendarData = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBaseUrl}/calendar-notes?month=${currentMonth}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotes(data.data.notes);
        setTransactions(data.data.transactions);
      }
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
    }
  };

  useEffect(() => {
    const activeNote = notes.find(n => n.date === selectedDate);
    if (activeNote) {
      setNoteTitle(activeNote.title);
      setNoteContent(activeNote.content || '');
      setNoteId(activeNote._id);
    } else {
      setNoteTitle('');
      setNoteContent('');
      setNoteId(null);
    }
    setNoteMessage('');
  }, [selectedDate, notes]);

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchCalendarData();
    }
  }, [token, currentMonth]);

  const handleSaveNote = async (e) => {
    e.preventDefault();
    setNoteMessage('');
    if (!noteTitle) { setNoteMessage('Note title is required.'); return; }

    try {
      const res = await fetch(`${apiBaseUrl}/calendar-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ date: selectedDate, title: noteTitle, content: noteContent })
      });
      const data = await res.json();
      if (data.success) { setNoteMessage('Note saved successfully!'); fetchCalendarData(); }
      else setNoteMessage(data.message || 'Failed to save note');
    } catch (err) {
      setNoteMessage('Failed to save note.');
    }
  };

  const handleDeleteNote = async () => {
    if (!noteId) return;
    if (!window.confirm('Delete this note?')) return;
    setNoteMessage('');

    try {
      const res = await fetch(`${apiBaseUrl}/calendar-notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNoteMessage('Note deleted.');
        setNoteTitle(''); setNoteContent(''); setNoteId(null);
        fetchCalendarData();
      } else setNoteMessage(data.message || 'Failed to delete note');
    } catch (err) {
      setNoteMessage('Failed to delete note.');
    }
  };

  const selectedDateTx = transactions.filter(t => t.date === selectedDate);

  return (
    <div className="app-shell">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        user={user}
        onLogout={onLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="app-body">
        {/* Mobile topbar — no header on desktop */}
        <div className="mobile-topbar">
          <button className="topbar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <i className={`bi ${sidebarOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
          </button>
          <span className="topbar-brand">
            <span className="brand-pri">Pri</span><span className="brand-vora">Vora</span>
          </span>
        </div>

        <main className="app-main">
          {/* ─── Overview ─────────────────────────────── */}
          {activeSection === 'overview' && (
            <div className="page">
              <div className="page-header">
                <h2 className="page-title">Overview</h2>
                <p className="page-subtitle">Summary of users, wallets & transactions.</p>
              </div>

              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-card-icon"><i className="bi bi-people-fill"></i></div>
                  <div className="stat-card-title">Registered Users</div>
                  <div className="stat-card-value">{users.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon"><i className="bi bi-arrow-left-right"></i></div>
                  <div className="stat-card-title">Month Transactions</div>
                  <div className="stat-card-value">{totalTransactions}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon"><i className="bi bi-wallet2"></i></div>
                  <div className="stat-card-title">Total Wallet Balance</div>
                  <div className="stat-card-value">₹{totalWalletBalance.toLocaleString('en-IN')}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon"><i className="bi bi-journal-text"></i></div>
                  <div className="stat-card-title">Saved Notes</div>
                  <div className="stat-card-value">{totalNotes}</div>
                </div>
              </div>

              <div className="graphs-grid">
                <div className="graph-card">
                  <div className="graph-title">Transaction Split</div>
                  <div className="graph-row">
                    <span className="graph-label">Credit</span>
                    <div className="graph-bar-wrapper">
                      <div className="graph-bar graph-bar--credit" style={{ width: `${transactionRatio}%` }} />
                    </div>
                    <span className="graph-amount">₹{totalCredit.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="graph-row">
                    <span className="graph-label">Debit</span>
                    <div className="graph-bar-wrapper">
                      <div className="graph-bar graph-bar--debit" style={{ width: `${100 - transactionRatio}%` }} />
                    </div>
                    <span className="graph-amount">₹{totalDebit.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="graph-card">
                  <div className="graph-title">Top Wallet Balances</div>
                  {topUsers.length === 0 ? (
                    <div className="empty-state">No balance data available.</div>
                  ) : (
                    topUsers.map((u, index) => {
                      const width = totalWalletBalance ? Math.max(6, Math.round((Number(u.walletBalance || 0) / totalWalletBalance) * 100)) : 6;
                      return (
                        <div key={u._id} className="user-balance-row">
                          <div className="user-balance-name">{index + 1}. {u.name}</div>
                          <div className="balance-meter">
                            <div className="balance-fill" style={{ width: `${width}%` }} />
                          </div>
                          <div className="user-balance-amount">₹{Number(u.walletBalance || 0).toLocaleString('en-IN')}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── Calendar ─────────────────────────────── */}
          {activeSection === 'calendar' && (
            <div className="page calendar-page">
              <div className="page-header">
                <h2 className="page-title">Calendar</h2>
                <p className="page-subtitle">Manage day notes and review transactions by date.</p>
              </div>

              <CalendarComponent
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                transactions={transactions}
                notes={notes}
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
              />

              <div className="pv-card date-details-panel">
                <div className="date-details-header">
                  <span className="date-details-title">
                    <i className="bi bi-calendar-event"></i> Details for {selectedDate}
                  </span>
                </div>

                <div className="date-details-grid">
                  <div className="note-editor">
                    <h3 className="section-title"><i className="bi bi-journal-text"></i> Date Notation</h3>
                    {noteMessage && (
                      <div className={`alert ${noteMessage.includes('success') || noteMessage.includes('deleted') || noteMessage.includes('saved') ? 'alert-success' : 'alert-danger'}`}>
                        {noteMessage}
                      </div>
                    )}
                    <form onSubmit={handleSaveNote}>
                      <div className="form-group">
                        <label className="form-label">Note Title</label>
                        <input type="text" className="form-input" placeholder="e.g. Daily Target" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Content</label>
                        <textarea className="form-input form-textarea" placeholder="Write notes here..." value={noteContent} onChange={(e) => setNoteContent(e.target.value)} />
                      </div>
                      <div className="btn-row">
                        <button type="submit" className="btn-primary btn-sm">Save Notation</button>
                        {noteId && (
                          <button type="button" onClick={handleDeleteNote} className="btn-danger btn-sm">Delete</button>
                        )}
                      </div>
                    </form>
                  </div>

                  <div>
                    <h3 className="section-title"><i className="bi bi-card-list"></i> Day's Transactions</h3>
                    {selectedDateTx.length === 0 ? (
                      <div className="empty-state">No transactions on this day.</div>
                    ) : (
                      <div className="tx-list">
                        {selectedDateTx.map(tx => (
                          <div key={tx._id} className={`tx-item tx-item--${tx.type}`}>
                            <div>
                              <div className="tx-desc">{tx.description || tx.category}</div>
                              <div className="tx-cat">{tx.category}</div>
                            </div>
                            <div className={`tx-val tx-val--${tx.type}`}>
                              {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Users ────────────────────────────────── */}
          {activeSection === 'users' && (
            <div className="page users-page">
              <div className="page-header">
                <div>
                  <h2 className="page-title">Registered Users</h2>
                  <p className="page-subtitle">Manage mobile users and wallet balances.</p>
                </div>
                <button className="btn-primary btn-inline" onClick={() => { setShowAddUserForm(v => !v); setUserActionError(''); setUserActionSuccess(''); }}>
                  <i className={`bi ${showAddUserForm ? 'bi-x-lg' : 'bi-person-plus'}`}></i>
                  {showAddUserForm ? 'Cancel' : 'Add User'}
                </button>
              </div>

              {/* Inline Add User Form */}
              {showAddUserForm && (
                <div className="pv-card add-user-card">
                  <div className="add-user-header">
                    <h3 className="add-user-title"><i className="bi bi-person-plus-fill"></i> Create Mobile User</h3>
                    <p className="add-user-sub">Register a new user account from the admin panel.</p>
                  </div>

                  {userActionError && <div className="alert alert-danger">{userActionError}</div>}
                  {userActionSuccess && <div className="alert alert-success">{userActionSuccess}</div>}

                  <form onSubmit={handleCreateUser} className="add-user-form">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input type="text" className="form-input" placeholder="e.g. Jane Doe" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input type="email" className="form-input" placeholder="e.g. user@gmail.com" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <input type="password" className="form-input" placeholder="••••••••" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-primary btn-inline">
                      <i className="bi bi-check-lg"></i> Create User
                    </button>
                  </form>
                </div>
              )}

              {/* Users List */}
              <div className="pv-card users-card">
                {users.length === 0 ? (
                  <div className="empty-state">No users registered yet.</div>
                ) : (
                  <div className="users-list">
                    {users.map((u, i) => (
                      <div key={u._id} className="user-item">
                        <div className="user-item-avatar">{u.name?.charAt(0).toUpperCase()}</div>
                        <div className="user-item-info">
                          <div className="user-info-name">{u.name}</div>
                          <div className="user-info-email">{u.email}</div>
                        </div>
                        <div className="user-item-balance">₹{Number(u.walletBalance || 0).toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;