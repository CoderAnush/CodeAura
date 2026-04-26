import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
`;

const SelectGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: rgba(148, 163, 184, 0.8);
  font-size: 0.82rem;
  font-weight: 500;
  white-space: nowrap;
`;

const Select = styled.select`
  padding: 0.45rem 0.9rem;
  background: rgba(15, 23, 42, 0.8);
  color: #f1f5f9;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.6rem center;
  padding-right: 2rem;
  
  &:focus {
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    outline: none;
  }
  
  option {
    background: #1e293b;
    color: #f1f5f9;
  }
`;

const ProviderBadge = styled.div<{ provider: string }>`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-weight: 600;
  background: ${(props) => 
    props.provider === 'openai' ? 'rgba(16, 185, 129, 0.1)' : 
    props.provider === 'gemini' ? 'rgba(249, 115, 22, 0.1)' : 
    'rgba(139, 92, 246, 0.1)'};
  color: ${(props) => 
    props.provider === 'openai' ? '#34d399' : 
    props.provider === 'gemini' ? '#fb923c' : 
    '#a78bfa'};
  border: 1px solid ${(props) => 
    props.provider === 'openai' ? 'rgba(16, 185, 129, 0.2)' : 
    props.provider === 'gemini' ? 'rgba(249, 115, 22, 0.2)' : 
    'rgba(139, 92, 246, 0.2)'};
`;

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  aiProvider: string;
  onAiProviderChange: (value: string) => void;
}

const languages = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'scala', label: 'Scala' },
  { value: 'r', label: 'R' },
  { value: 'dart', label: 'Dart' },
  { value: 'shell', label: 'Shell' },
  { value: 'sql', label: 'SQL' },
];

const aiProviders = [
  { value: 'openai', label: 'OpenAI GPT-4' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'ollama', label: 'Ollama (Local)' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  value,
  onChange,
  aiProvider,
  onAiProviderChange
}) => {
  return (
    <Container>
      <SelectGroup>
        <Label htmlFor="lang-select">Language:</Label>
        <Select id="lang-select" value={value} onChange={(e) => onChange(e.target.value)}>
          {languages.map(lang => (
            <option key={lang.value} value={lang.value}>{lang.label}</option>
          ))}
        </Select>
      </SelectGroup>
      
      <SelectGroup>
        <Label htmlFor="ai-select">AI Model:</Label>
        <Select id="ai-select" value={aiProvider} onChange={(e) => onAiProviderChange(e.target.value)}>
          {aiProviders.map(provider => (
            <option key={provider.value} value={provider.value}>{provider.label}</option>
          ))}
        </Select>
      </SelectGroup>

      <ProviderBadge provider={aiProvider}>
        {aiProvider === 'openai' ? '⚡ GPT-4' : aiProvider === 'gemini' ? '✦ Gemini' : '🔒 Local'}
      </ProviderBadge>
    </Container>
  );
};

export default LanguageSelector;
