import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaHome, FaChartLine } from 'react-icons/fa';

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  background: #080c1a;
`;

const Content = styled(motion.div)`
  max-width: 480px;
`;

const Code = styled.div`
  font-size: 7rem;
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  color: #f1f5f9;
  margin-bottom: 0.75rem;
`;

const Desc = styled.p`
  color: rgba(148, 163, 184, 0.7);
  font-size: 0.95rem;
  margin-bottom: 2rem;
`;

const BtnRow = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
`;

const Btn = styled(Link)<{ primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 9px;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.2s;
  background: ${props => props.primary ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.05)'};
  color: ${props => props.primary ? 'white' : '#cbd5e1'};
  border: 1px solid ${props => props.primary ? 'transparent' : 'rgba(255,255,255,0.1)'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px ${props => props.primary ? 'rgba(59,130,246,0.3)' : 'transparent'};
  }
`;

const NotFound: React.FC = () => (
  <Wrapper>
    <Content
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Code>404</Code>
      <Title>Page Not Found</Title>
      <Desc>Looks like this page doesn't exist. Maybe it was analyzed and optimized away?</Desc>
      <BtnRow>
        <Btn to="/" primary><FaHome /> Go Home</Btn>
        <Btn to="/dashboard"><FaChartLine /> Dashboard</Btn>
      </BtnRow>
    </Content>
  </Wrapper>
);

export default NotFound;
