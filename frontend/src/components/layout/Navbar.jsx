import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const NavbarContainer = styled.nav`
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0.8rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  color: #4a90e2;
  text-decoration: none;
  display: flex;
  align-items: center;
  
  &:hover {
    color: #357ab8;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 1.5rem;
`;

const NavLink = styled(Link)`
  color: #555;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 0;
  position: relative;
  
  &:hover {
    color: #4a90e2;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background-color: #4a90e2;
    transition: width 0.3s;
  }
  
  &:hover::after {
    width: 100%;
  }
`;

const Button = styled.button`
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #357ab8;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Username = styled.span`
  font-weight: 500;
  color: #333;
`;

function Navbar({ user = { username: 'Guest User' }, onLogout }) {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/');
  };
  
  return (
    <NavbarContainer>
      <Logo to="/">FriendBot</Logo>
      
      <NavLinks>
        <NavLink to="/chat">Chat</NavLink>
        <NavLink to="/journal">Journal</NavLink>
        <UserInfo>
          <Username>{user?.username}</Username>
          {/* Hide logout button for guest user or make it optional */}
          {onLogout && (
            <Button onClick={handleLogout}>Logout</Button>
          )}
        </UserInfo>
      </NavLinks>
    </NavbarContainer>
  );
}

export default Navbar;