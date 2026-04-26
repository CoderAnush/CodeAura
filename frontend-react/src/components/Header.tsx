import React from 'react';
import styled from 'styled-components';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGithub, FaBolt, FaTerminal } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';

const HeaderWrapper = styled(motion.header)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(8, 12, 26, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const LogoSection = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  
  &:hover {
    transform: none;
  }
`;

const LogoIcon = styled.div`
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: white;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
`;

const LogoText = styled.div`
  font-size: 1.4rem;
  font-weight: 800;
  background: linear-gradient(135deg, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.03em;
`;

const LogoVersion = styled.span`
  font-size: 0.65rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-weight: 600;
  margin-left: 0.25rem;
  vertical-align: super;
`;

const Nav = styled.nav`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const StyledNavLink = styled(NavLink)`
  color: rgba(203, 213, 225, 0.7);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  transition: all 0.2s;
  
  &:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.06);
  }
  
  &.active {
    color: #60a5fa;
    background: rgba(59, 130, 246, 0.1);
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 0.5rem;
`;

const IconLink = styled.a`
  color: rgba(203, 213, 225, 0.7);
  font-size: 1.2rem;
  padding: 0.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  
  &:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.06);
  }
`;

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: #34d399;
  font-weight: 500;
  padding: 0.3rem 0.7rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 6px;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    background: #34d399;
    border-radius: 50%;
    animation: pulse-ring 2s ease-in-out infinite;
  }
`;

const Header: React.FC = () => {
  return (
    <HeaderWrapper
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <LogoSection to="/">
        <LogoIcon><FaBolt /></LogoIcon>
        <LogoText>
          CodeAura
          <LogoVersion>v2</LogoVersion>
        </LogoText>
      </LogoSection>

      <Nav>
        <StyledNavLink to="/" end>Home</StyledNavLink>
        <StyledNavLink to="/dashboard">Dashboard</StyledNavLink>
        <StyledNavLink to="/history">History</StyledNavLink>
        <Divider />
        <StatusBadge>Online</StatusBadge>
        <Divider />
        <IconLink href="https://github.com" target="_blank" rel="noopener noreferrer" title="GitHub">
          <FaGithub />
        </IconLink>
        <IconLink href="/docs" target="_blank" rel="noopener noreferrer" title="API Docs">
          <FaTerminal />
        </IconLink>
      </Nav>
    </HeaderWrapper>
  );
};

export default Header;
