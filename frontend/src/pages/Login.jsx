import React, { useState } from 'react';

const Login = ({ apiBaseUrl, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (!data.success) {
        setError(data.message || 'Login failed');
        return;
      }

      if (data.data.role !== 'admin') {
        setError('Access Denied: Only Administrator users can access this panel.');
        return;
      }

      onLoginSuccess(data.data.token, data.data);
    } catch (err) {
      setError('Could not connect to the backend server. Make sure the backend is running.');
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-panel auth-card">
        <span className="auth-logo">💼</span>
        <h1 className="auth-title">Photo Wallet</h1>
        <p className="auth-subtitle">Admin Control Panel</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="arunkumar957877@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary">Sign In</button>
        </form>
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          Seed Admin: <strong>arunkumar957877@gmail.com</strong> / <strong>Arun@123</strong>
        </div>
      </div>
    </div>
  );
};

export default Login;
