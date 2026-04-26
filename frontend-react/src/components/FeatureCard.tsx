import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Card = styled(motion.div)`
  background: rgba(15, 23, 42, 0.6);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  position: relative;
  overflow: hidden;
  cursor: default;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05));
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.15);
    transform: translateY(-4px);
    
    &::before {
      opacity: 1;
    }
  }
`;

const IconWrapper = styled.div<{ color?: string }>`
  font-size: 2rem;
  margin-bottom: 1.25rem;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: ${(props) => props.color ? `${props.color}18` : 'rgba(59, 130, 246, 0.12)'};
  color: ${(props) => props.color || '#60a5fa'};
  border: 1px solid ${(props) => props.color ? `${props.color}30` : 'rgba(59, 130, 246, 0.2)'};
`;

const Title = styled.h3`
  font-size: 1.1rem;
  margin-bottom: 0.6rem;
  color: #f1f5f9;
  font-weight: 600;
`;

const Description = styled.p`
  color: rgba(148, 163, 184, 0.85);
  line-height: 1.65;
  font-size: 0.9rem;
  margin: 0;
`;

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: string;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color, delay = 0 }) => {
  return (
    <Card
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <IconWrapper color={color}>{icon}</IconWrapper>
      <Title>{title}</Title>
      <Description>{description}</Description>
    </Card>
  );
};

export default FeatureCard;
