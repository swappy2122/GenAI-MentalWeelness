import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import './App.css';

// Import components
import Chat from './components/chat/Chat';
import Journal from './components/journal/Journal';
import Navbar from './components/layout/Navbar';

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
  const [user, setUser] = useState({
    id: 'guest',
    username: 'Guest User',
    preferred_friend_gender: 'neutral'
  });
  
  useEffect(() => {
    // Set up guest user - no authentication required
    // Create a mock token for any components that might check for it
    localStorage.setItem('token', 'guest-token');
    setUser({
      id: 'guest',
      username: 'Guest User',
      preferred_friend_gender: 'neutral'
    });
  }, []);
  
  return (
    <Router>
      <AppContainer>
        <Navbar user={user} />
        <ContentContainer>
          <Routes>
            <Route path="/" element={<Navigate to="/chat" />} />
            <Route path="/login" element={<Navigate to="/chat" />} />
            <Route path="/register" element={<Navigate to="/chat" />} />
            <Route path="/chat" element={<Chat user={user} />} />
            <Route path="/journal" element={<Journal user={user} />} />
          </Routes>
        </ContentContainer>
      </AppContainer>
    </Router>
  )
}

export default App
