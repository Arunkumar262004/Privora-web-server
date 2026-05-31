import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export const API_BASE_URL = 'https://photo-wallet-app.onrender.com/api';

const App = () => {
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('admin_user')) || null);

  // Handle successful login
  const handleLoginSuccess = (userToken, userData) => {
    setToken(userToken);
    setUser(userData);
    localStorage.setItem('admin_token', userToken);
    localStorage.setItem('admin_user', JSON.stringify(userData));
  };

  // Handle Logout
  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  };

  if (!token) {
    return (
      <Login 
        apiBaseUrl={API_BASE_URL} 
        onLoginSuccess={handleLoginSuccess} 
      />
    );
  }

  return (
    <Dashboard 
      token={token} 
      user={user} 
      apiBaseUrl={API_BASE_URL} 
      onLogout={handleLogout} 
    />
  );
};

export default App;
