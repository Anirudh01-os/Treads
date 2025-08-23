import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const HeaderContainer = styled.header`
  background: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  padding: 0 2rem;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    color: ${props => props.theme.colors.secondary};
  }
`;

const LogoIcon = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    gap: 1rem;
  }
`;

const NavLink = styled(Link)<{ $isActive: boolean }>`
  color: ${props => props.$isActive ? props.theme.colors.primary : props.theme.colors.textSecondary};
  font-weight: ${props => props.$isActive ? '600' : '500'};
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    color: ${props => props.theme.colors.primary};
    background-color: ${props => props.theme.colors.background};
  }

  ${props => props.$isActive && `
    background-color: ${props.theme.colors.background};
  `}

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    padding: 0.5rem;
    font-size: 0.9rem;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${props => props.theme.colors.text};
  cursor: pointer;

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    display: block;
  }
`;

const MobileNav = styled(motion.div)`
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  padding: 1rem 2rem;
  flex-direction: column;
  gap: 1rem;

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    display: flex;
  }
`;

const Header: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/upload-clothing', label: 'Upload Clothes' },
    { path: '/body-scan', label: 'Body Scan' },
    { path: '/try-on', label: 'Try On' },
    { path: '/wardrobe', label: 'Wardrobe' },
    { path: '/profile', label: 'Profile' }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <HeaderContainer>
      <Logo to="/">
        <LogoIcon>T</LogoIcon>
        Treads
      </Logo>
      
      <Nav>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            $isActive={isActive(item.path)}
          >
            {item.label}
          </NavLink>
        ))}
      </Nav>

      <MobileMenuButton onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        ☰
      </MobileMenuButton>

      {mobileMenuOpen && (
        <MobileNav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              $isActive={isActive(item.path)}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </MobileNav>
      )}
    </HeaderContainer>
  );
};

export default Header;