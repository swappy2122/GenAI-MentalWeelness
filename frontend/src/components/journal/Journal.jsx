import { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const JournalContainer = styled.div`
  display: flex;
  max-width: 1000px;
  margin: 0 auto;
  height: calc(100vh - 120px);
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 300px;
  border-right: 1px solid #eee;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 15px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  color: #333;
`;

const JournalList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const JournalItem = styled.div`
  padding: 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
  
  ${props => props.active ? 'background-color: #f0f7ff;' : ''}
  
  &:hover {
    background-color: ${props => props.active ? '#f0f7ff' : '#f5f5f5'};
  }
`;

const JournalTitle = styled.h3`
  margin: 0 0 5px 0;
  font-size: 1rem;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const JournalDate = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: #888;
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ContentHeader = styled.div`
  padding: 15px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s;
  
  ${props => props.primary ? `
    background-color: #4a90e2;
    color: white;
    
    &:hover {
      background-color: #357ab8;
    }
  ` : props.danger ? `
    background-color: #e74c3c;
    color: white;
    
    &:hover {
      background-color: #c0392b;
    }
  ` : `
    background-color: #f1f1f1;
    color: #333;
    
    &:hover {
      background-color: #ddd;
    }
  `}
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const EditorContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 15px;
  overflow-y: auto;
`;

const TitleInput = styled.input`
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    border-color: #4a90e2;
    outline: none;
  }
`;

const ContentTextarea = styled.textarea`
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: none;
  
  &:focus {
    border-color: #4a90e2;
    outline: none;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
  text-align: center;
  padding: 20px;
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  text-align: center;
  margin: 10px 0;
  padding: 10px;
  background-color: #fde2e2;
  border-radius: 4px;
`;

const LoadingIndicator = styled.div`
  text-align: center;
  color: #888;
  margin: 20px 0;
  font-style: italic;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  padding: 10px;
  border-top: 1px solid #eee;
`;

const PageButton = styled.button`
  padding: 5px 10px;
  margin: 0 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: ${props => props.active ? '#4a90e2' : 'white'};
  color: ${props => props.active ? 'white' : '#333'};
  cursor: pointer;
  
  &:disabled {
    background-color: #f5f5f5;
    color: #aaa;
    cursor: not-allowed;
  }
`;

function Journal() {
  const [journals, setJournals] = useState([]);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  
  // Fetch journals when component mounts or pagination changes
  useEffect(() => {
    fetchJournals(pagination.currentPage);
  }, [pagination.currentPage]);
  
  const fetchJournals = async (page = 1) => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get(`http://localhost:5000/api/journal?page=${page}&per_page=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setJournals(response.data.journals);
      setPagination({
        currentPage: response.data.current_page,
        totalPages: response.data.pages,
        totalItems: response.data.total
      });
      
      // If we have journals but none selected, select the first one
      if (response.data.journals.length > 0 && !selectedJournal) {
        setSelectedJournal(response.data.journals[0]);
      }
      
    } catch (err) {
      console.error('Error fetching journals:', err);
      setError('Failed to load journals. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleJournalSelect = (journal) => {
    setSelectedJournal(journal);
    setIsEditing(false);
  };
  
  const handleNewJournal = () => {
    setSelectedJournal(null);
    setEditTitle('');
    setEditContent('');
    setIsEditing(true);
  };
  
  const handleEditJournal = () => {
    if (!selectedJournal) return;
    
    setEditTitle(selectedJournal.title);
    setEditContent(selectedJournal.content);
    setIsEditing(true);
  };
  
  const handleDeleteJournal = async () => {
    if (!selectedJournal) return;
    
    if (!window.confirm('Are you sure you want to delete this journal entry?')) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/journal/${selectedJournal.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from list and select another journal if available
      const updatedJournals = journals.filter(j => j.id !== selectedJournal.id);
      setJournals(updatedJournals);
      
      if (updatedJournals.length > 0) {
        setSelectedJournal(updatedJournals[0]);
      } else {
        setSelectedJournal(null);
      }
      
      setIsEditing(false);
      
    } catch (err) {
      console.error('Error deleting journal:', err);
      setError('Failed to delete journal. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveJournal = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      setError('Title and content are required.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      let response;
      
      if (selectedJournal && isEditing) {
        // Update existing journal
        response = await axios.put(
          `http://localhost:5000/api/journal/${selectedJournal.id}`,
          { title: editTitle, content: editContent },
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        // Update in the list
        setJournals(journals.map(j => 
          j.id === selectedJournal.id ? response.data.journal : j
        ));
        
      } else {
        // Create new journal
        response = await axios.post(
          'http://localhost:5000/api/journal',
          { title: editTitle, content: editContent },
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        // Add to the list
        setJournals([response.data.journal, ...journals]);
      }
      
      setSelectedJournal(response.data.journal);
      setIsEditing(false);
      
    } catch (err) {
      console.error('Error saving journal:', err);
      setError('Failed to save journal. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (selectedJournal) {
      setEditTitle(selectedJournal.title);
      setEditContent(selectedJournal.content);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <JournalContainer>
      <Sidebar>
        <SidebarHeader>
          <Title>My Journals</Title>
          <Button primary onClick={handleNewJournal}>New</Button>
        </SidebarHeader>
        
        <JournalList>
          {loading && journals.length === 0 ? (
            <LoadingIndicator>Loading journals...</LoadingIndicator>
          ) : journals.length === 0 ? (
            <EmptyState>
              <p>No journal entries yet.</p>
              <p>Click "New" to create your first entry!</p>
            </EmptyState>
          ) : (
            journals.map(journal => (
              <JournalItem 
                key={journal.id} 
                active={selectedJournal && selectedJournal.id === journal.id}
                onClick={() => handleJournalSelect(journal)}
              >
                <JournalTitle>{journal.title}</JournalTitle>
                <JournalDate>{formatDate(journal.updated_at)}</JournalDate>
              </JournalItem>
            ))
          )}
        </JournalList>
        
        {pagination.totalPages > 1 && (
          <Pagination>
            <PageButton 
              disabled={pagination.currentPage === 1}
              onClick={() => setPagination({...pagination, currentPage: pagination.currentPage - 1})}
            >
              &lt;
            </PageButton>
            
            <span>{pagination.currentPage} / {pagination.totalPages}</span>
            
            <PageButton 
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => setPagination({...pagination, currentPage: pagination.currentPage + 1})}
            >
              &gt;
            </PageButton>
          </Pagination>
        )}
      </Sidebar>
      
      <ContentArea>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        {!selectedJournal && !isEditing ? (
          <EmptyState>
            <p>Select a journal entry or create a new one.</p>
          </EmptyState>
        ) : isEditing ? (
          <>
            <ContentHeader>
              <Title>{selectedJournal ? 'Edit Journal' : 'New Journal'}</Title>
              <ButtonGroup>
                <Button onClick={handleCancelEdit}>Cancel</Button>
                <Button primary onClick={handleSaveJournal} disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </ButtonGroup>
            </ContentHeader>
            
            <EditorContainer>
              <TitleInput 
                type="text" 
                placeholder="Journal Title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
              <ContentTextarea 
                placeholder="Write your thoughts here..."
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
            </EditorContainer>
          </>
        ) : selectedJournal && (
          <>
            <ContentHeader>
              <Title>{selectedJournal.title}</Title>
              <ButtonGroup>
                <Button onClick={handleEditJournal}>Edit</Button>
                <Button danger onClick={handleDeleteJournal}>Delete</Button>
              </ButtonGroup>
            </ContentHeader>
            
            <EditorContainer>
              <div style={{ whiteSpace: 'pre-wrap' }}>{selectedJournal.content}</div>
            </EditorContainer>
          </>
        )}
      </ContentArea>
    </JournalContainer>
  );
}

export default Journal;