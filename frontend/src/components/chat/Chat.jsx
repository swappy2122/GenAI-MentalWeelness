import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  max-width: 800px;
  margin: 0 auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const ChatHeader = styled.div`
  padding: 15px 20px;
  background-color: #4a90e2;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.2rem;
`;

const PreferenceSelect = styled.select`
  padding: 8px;
  border-radius: 4px;
  border: none;
  background-color: white;
  font-size: 0.9rem;
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 1rem;
  line-height: 1.4;
  word-wrap: break-word;
  
  ${props => props.isUser ? `
    align-self: flex-end;
    background-color: #4a90e2;
    color: white;
    border-bottom-right-radius: 4px;
  ` : `
    align-self: flex-start;
    background-color: #f1f0f0;
    color: #333;
    border-bottom-left-radius: 4px;
  `}
`;

const InputContainer = styled.form`
  display: flex;
  padding: 15px;
  border-top: 1px solid #eee;
  background-color: white;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 1rem;
  outline: none;
  
  &:focus {
    border-color: #4a90e2;
  }
`;

const SendButton = styled.button`
  margin-left: 10px;
  padding: 0 20px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #357ab8;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const LoadingIndicator = styled.div`
  align-self: center;
  color: #888;
  margin: 10px 0;
  font-style: italic;
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  text-align: center;
  margin: 10px 0;
  padding: 10px;
  background-color: #fde2e2;
  border-radius: 4px;
`;

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [genderPreference, setGenderPreference] = useState('neutral');
  const messagesEndRef = useRef(null);
  
  // Fetch chat history and user preferences when component mounts
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await axios.get('http://localhost:5000/api/chat/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Format messages for display
        const formattedMessages = response.data.chats.map(chat => ({
          id: chat.id,
          text: chat.is_from_user ? chat.message : chat.response,
          isUser: chat.is_from_user
        }));
        
        setMessages(formattedMessages);
        
        // Fetch user preferences
        const userResponse = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setGenderPreference(userResponse.data.user.preferred_friend_gender);
      } catch (err) {
        console.error('Error fetching chat history:', err);
        setError('Failed to load chat history. Please try again.');
      }
    };
    
    fetchChatHistory();
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const userMessage = newMessage.trim();
    setNewMessage('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { id: Date.now(), text: userMessage, isUser: true }]);
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/chat/send', 
        { message: userMessage },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Add AI response to chat
      setMessages(prev => [...prev, { 
        id: response.data.chat_id, 
        text: response.data.response, 
        isUser: false 
      }]);
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGenderChange = async (e) => {
    const newGender = e.target.value;
    setGenderPreference(newGender);
    
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/chat/preferences', 
        { preferred_friend_gender: newGender },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Update user in localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData) {
        userData.preferred_friend_gender = newGender;
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError('Failed to update preferences. Please try again.');
    }
  };
  
  return (
    <ChatContainer>
      <ChatHeader>
        <Title>Chat with your AI Friend</Title>
        <div>
          <label htmlFor="gender-select">Friend type: </label>
          <PreferenceSelect 
            id="gender-select"
            value={genderPreference} 
            onChange={handleGenderChange}
          >
            <option value="neutral">Neutral</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </PreferenceSelect>
        </div>
      </ChatHeader>
      
      <MessagesContainer>
        {messages.length === 0 && !loading && (
          <MessageBubble isUser={false}>
            Hi there! I'm your AI friend. How can I help you today?
          </MessageBubble>
        )}
        
        {messages.map(message => (
          <MessageBubble key={message.id} isUser={message.isUser}>
            {message.text}
          </MessageBubble>
        ))}
        
        {loading && <LoadingIndicator>Your friend is typing...</LoadingIndicator>}
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      <InputContainer onSubmit={handleSubmit}>
        <MessageInput
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={loading}
        />
        <SendButton type="submit" disabled={loading || !newMessage.trim()}>
          Send
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
}

export default Chat;