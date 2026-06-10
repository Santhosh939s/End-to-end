import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import AllUsers from './pages/AllUsers';
import Requests from './pages/Requests';
import Chats from './pages/Chats';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import LockScreen from './components/LockScreen';
import { useAuthStore } from './store/auth.store';

function App() {
  const isLocked = useAuthStore(state => state.isLocked);
  const lock = useAuthStore(state => state.lock);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // 10-minute idle timer logic
  useEffect(() => {
    if (!isAuthenticated || isLocked) return;

    let timeoutId: number | undefined;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      // 10 minutes = 600,000 ms (For testing purposes, we could use a smaller value, but requirements specify 10 mins)
      timeoutId = setTimeout(() => {
        lock();
      }, 600000); 
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer(); // Start timer initially

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [isAuthenticated, isLocked, lock]);

  return (
    <Router>
      {isLocked && <LockScreen />}
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard/chats" replace />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        } />
        <Route path="/register" element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        } />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="chats" replace />} />
          <Route path="chats" element={<Chats />} />
          <Route path="users" element={<AllUsers />} />
          <Route path="requests" element={<Requests />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
