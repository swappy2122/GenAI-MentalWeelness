import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import './App.css';

// Import components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Chat from './components/chat/Chat';
import Journal from './components/journal/Journal';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/auth/ProtectedRoute';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f8fa;
  color: #333;
`;

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      // In a real app, we would validate the token with the backend
      setIsAuthenticated(true);
      // For now, we'll just set a placeholder user
      setUser({ username: 'User', preferred_friend_gender: 'neutral' });
    }
  }, []);
  
  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setIsAuthenticated(true);
  };
  
  const handleRegister = (userData, token) => {
    // Similar to login, but could have different behavior if needed
    localStorage.setItem('token', token);
    setUser(userData);
    setIsAuthenticated(true);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };
  
  return (
    <Router>
      <AppContainer>
        <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} user={user} />
        <ContentContainer>
          <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/chat" /> : <Navigate to="/login" />} />
            <Route path="/login" element={isAuthenticated ? <Navigate to="/chat" /> : <Login onLogin={handleLogin} />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/chat" /> : <Register onRegister={handleRegister} />} />
            <Route path="/chat" element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Chat user={user} />
              </ProtectedRoute>
            } />
            <Route path="/journal" element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Journal user={user} />
              </ProtectedRoute>
            } />
          </Routes>
        </ContentContainer>
      </AppContainer>
    </Router>
  )
}

export default App
