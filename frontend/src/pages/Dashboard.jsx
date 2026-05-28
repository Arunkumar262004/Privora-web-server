import React, { useState, useEffect } from 'react';
import CalendarComponent from '../components/CalendarComponent';

const Dashboard = ({ token, user, apiBaseUrl, onLogout }) => {
  // Admin Dashboard state
  const [users, setUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [userActionError, setUserActionError] = useState('');
  const [userActionSuccess, setUserActionSuccess] = useState('');

  // Calendar states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [transactions, setTransactions] = useState([]);
  const [notes, setNotes] = useState([]);

  // Active Date Note Editor state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteId, setNoteId] = useState(null);
  const [noteMessage, setNoteMessage] = useState('');

  // Fetch Users (Admin Only)
  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBaseUrl}/auth/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  // Create standard user account
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
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword
        })
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

  // Fetch Calendar Data (notes + indicators)
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

  // Triggered when selecting another date
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

  // Load dashboard data when authenticated
  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchCalendarData();
    }
  }, [token, currentMonth]);

  // Upsert (Create/Update) Note for Selected Date
  const handleSaveNote = async (e) => {
    e.preventDefault();
    setNoteMessage('');
    if (!noteTitle) {
      setNoteMessage('Note title is required.');
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/calendar-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: selectedDate,
          title: noteTitle,
          content: noteContent
        })
      });
      const data = await res.json();

      if (data.success) {
        setNoteMessage('Note saved successfully! 🎉');
        fetchCalendarData();
      } else {
        setNoteMessage(data.message || 'Failed to save note');
      }
    } catch (err) {
      setNoteMessage('Failed to save note.');
    }
  };

  // Delete Calendar Note
  const handleDeleteNote = async () => {
    if (!noteId) return;
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    setNoteMessage('');

    try {
      const res = await fetch(`${apiBaseUrl}/calendar-notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setNoteMessage('Note deleted.');
        setNoteTitle('');
        setNoteContent('');
        setNoteId(null);
        fetchCalendarData();
      } else {
        setNoteMessage(data.message || 'Failed to delete note');
      }
    } catch (err) {
      setNoteMessage('Failed to delete note.');
    }
  };

  // Selected date transactions
  const selectedDateTx = transactions.filter(t => t.date === selectedDate);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header glass-panel" style={{ borderRadius: '0 0 20px 20px', borderTop: 'none' }}>
        <div className="header-brand">
          <span>💼</span> Photo Wallet Admin Panel
        </div>
        <div className="header-user">
          <span className="user-badge">👑 Admin: {user?.email}</span>
          <button onClick={onLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="dashboard-grid">
        
        {/* Left Side: Calendar & Detail Editor */}
        <div className="calendar-section">
          <CalendarComponent
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            transactions={transactions}
            notes={notes}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
          />

          {/* Date details */}
          <div className="glass-panel date-details-panel">
            <div className="date-details-header">
              <span className="date-details-title">📅 Details for {selectedDate}</span>
            </div>

            <div className="date-details-grid">
              
              {/* Note Editor */}
              <div className="note-editor">
                <h3 style={{ fontSize: '15px', marginBottom: '14px', color: '#a5a5d9' }}>📝 Date Notation</h3>
                {noteMessage && (
                  <div className={`alert ${noteMessage.includes('success') || noteMessage.includes('deleted') || noteMessage.includes('saved') ? 'alert-success' : 'alert-danger'}`}>
                    {noteMessage}
                  </div>
                )}
                <form onSubmit={handleSaveNote}>
                  <div className="form-group">
                    <label className="form-label">Note Title</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Server Maintenance or Daily Target"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Content details</label>
                    <textarea
                      className="form-input"
                      placeholder="Write any custom notes here..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                    ></textarea>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }}>
                      Save Notation
                    </button>
                    {noteId && (
                      <button
                        type="button"
                        onClick={handleDeleteNote}
                        className="btn-logout"
                        style={{ padding: '10px 20px', borderRadius: '12px' }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Day's Transactions Preview */}
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '14px', color: '#a5a5d9' }}>💸 Day's Transactions</h3>
                {selectedDateTx.length === 0 ? (
                  <div className="empty-state">No transaction records on this day.</div>
                ) : (
                  <div className="tx-list">
                    {selectedDateTx.map(tx => (
                      <div key={tx._id} className={`tx-item ${tx.type}`}>
                        <div>
                          <div className="tx-desc">{tx.description || tx.category}</div>
                          <div className="tx-cat">{tx.category}</div>
                        </div>
                        <div className={`tx-val ${tx.type}`}>
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

        {/* Right Side: Sidebar (User creation & details) */}
        <div className="sidebar-section">
          
          {/* User Management Form */}
          <div className="glass-panel form-card">
            <h2 className="section-title">👤 Create Mobile User</h2>
            {userActionError && <div className="alert alert-danger">{userActionError}</div>}
            {userActionSuccess && <div className="alert alert-success">{userActionSuccess}</div>}

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Jane Doe"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. user@gmail.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary">Register Mobile User</button>
            </form>
          </div>

          {/* User List */}
          <div className="glass-panel users-card">
            <h2 className="section-title">📱 Registered Users ({users.length})</h2>
            {users.length === 0 ? (
              <div className="empty-state">No standard users registered yet.</div>
            ) : (
              <div className="users-list">
                {users.map(u => (
                  <div key={u._id} className="user-item">
                    <div>
                      <div className="user-info-name">{u.name}</div>
                      <div className="user-info-email">{u.email}</div>
                    </div>
                    <div className="user-item-balance">
                      ₹{u.walletBalance.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
};

export default Dashboard;
