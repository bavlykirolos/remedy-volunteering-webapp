import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './Register';
import Login from './Login';
import Account from './Account';
import Dashboard from './Dashboard';
import Calendar from './Calendar';

function App() {
  const [user, setUser] = useState(null);
  
  const API = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

  const checkLoginStatus = useCallback(async () => { //wrapped in useCallback to avoid unnecessary re-renders
    try {
      const res = await fetch(`${API}/check-login`, { credentials: 'include' });
      const data = await res.json();
      if (data.logged_in) {
        setUser(data.user);
      }
    } catch (err) {
        console.error("Fehler beim Prüfen des Logins:", err);
    } 
  }, [API]);

  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  const handleLogout = async () => {
    try {
      await fetch(`${API}/logout`, {
      method: "POST",
      credentials: "include",
      });
      setUser(null);
    } catch (err) {
      console.error("Fehler beim Ausloggen:", err);
    }
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={user ? <Navigate to="/dashboard" /> : <Login onLogin={setUser} />}
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/dashboard" /> : <Register />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/calendar" 
            element={user ? <Calendar user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/account" 
            element={user ? <Account user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;