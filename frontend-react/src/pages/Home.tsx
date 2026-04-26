import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { FaCode, FaRobot, FaChartLine, FaShieldAlt, FaRocket, FaPlay, FaBolt, FaDownload, FaStar } from 'react-icons/fa';
import { HiSparkles, HiLightningBolt } from 'react-icons/hi';
import { Editor } from '@monaco-editor/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import Header from '@/components/Header';
import FeatureCard from '@/components/FeatureCard';
import LanguageSelector from '@/components/LanguageSelector';
import ResultPanel from '@/components/ResultPanel';

// ─────────────────────── STYLED COMPONENTS ───────────────────────

const PageWrapper = styled.div`
  min-height: 100vh;
`;

const HeroSection = styled.section`
  min-height: 88vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 5rem 2rem 3rem;
  position: relative;
  overflow: hidden;
`;

const HeroBg = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%);
    top: -100px;
    left: 50%;
    transform: translateX(-50%);
    filter: blur(40px);
  }

  &::after {
    content: '';
    position: absolute;
    width: 800px;
    height: 800px;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
    bottom: -200px;
    left: 50%;
    transform: translateX(-50%);
    filter: blur(60px);
  }
`;

const GridOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(59, 130, 246, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.04) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: radial-gradient(ellipse at center, transparent 20%, black 90%);
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  max-width: 860px;
`;

const HeroBadge = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 9999px;
  padding: 0.4rem 1rem;
  font-size: 0.82rem;
  color: #93c5fd;
  font-weight: 600;
  margin-bottom: 2rem;
  letter-spacing: 0.02em;
`;

const HeroTitle = styled(motion.h1)`
  font-size: clamp(2.8rem, 7vw, 5rem) !important;
  font-weight: 900 !important;
  line-height: 1.05 !important;
  margin-bottom: 1.5rem !important;
  letter-spacing: -0.04em !important;
`;

const HeroSubtitle = styled(motion.p)`
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: rgba(148, 163, 184, 0.85);
  max-width: 540px;
  margin: 0 auto 2.5rem;
  line-height: 1.7;
`;

const HeroButtons = styled(motion.div)`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 3.5rem;
`;

const PrimaryBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  padding: 0.85rem 1.8rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.35);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(59, 130, 246, 0.45);
    filter: brightness(1.08);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const SecondaryBtn = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
  padding: 0.85rem 1.8rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.25s;
  text-decoration: none;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    color: #f1f5f9;
    transform: translateY(-2px);
  }
`;

const StatsRow = styled(motion.div)`
  display: flex;
  justify-content: center;
  gap: 3rem;
  flex-wrap: wrap;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 1.8rem;
  font-weight: 800;
  background: linear-gradient(135deg, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 0.3rem;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(148, 163, 184, 0.6);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const SectionWrapper = styled.section`
  padding: 4rem 2rem;
  max-width: 1300px;
  margin: 0 auto;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const SectionLabel = styled.div`
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  padding: 0.3rem 0.8rem;
  border-radius: 9999px;
  margin-bottom: 1rem;
`;

const SectionTitle = styled.h2`
  margin-bottom: 0.75rem;
  color: #f1f5f9;
`;

const SectionDesc = styled.p`
  color: rgba(148, 163, 184, 0.7);
  max-width: 500px;
  margin: 0 auto;
  font-size: 0.95rem;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  gap: 1.25rem;
`;

const EditorSection = styled.section`
  padding: 4rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
`;

const EditorCard = styled.div`
  background: rgba(10, 15, 30, 0.6);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
`;

const EditorCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  flex-wrap: wrap;
  gap: 1rem;
`;

const WindowButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const WindowBtn = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.color};
`;

const AnalyzeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 12px rgba(59, 130, 246, 0.25);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 18px rgba(59, 130, 246, 0.4);
    filter: brightness(1.08);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Spinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const EditorGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const EditorPane = styled.div<{ bordered?: boolean }>`
  padding: 1.25rem;
  border-right: ${props => props.bordered ? '1px solid rgba(255,255,255,0.06)' : 'none'};
`;

const PaneTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(148, 163, 184, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.75rem;
`;

const ExamplesRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
`;

const ExampleChip = styled.button`
  font-size: 0.75rem;
  padding: 0.25rem 0.65rem;
  background: rgba(59, 130, 246, 0.08);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  
  &:hover {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.3);
  }
`;

const DividerLine = styled.div`
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3), transparent);
  margin: 0;
`;

// ─────────────────────── SAMPLE CODE EXAMPLES ────────────────────

const codeExamples: Record<string, { language: string; code: string }> = {
  'Nested Loops': {
    language: 'python',
    code: `def find_pairs(arr, target):
    result = []
    for i in range(len(arr)):
        for j in range(len(arr)):
            if arr[i] + arr[j] == target:
                result.append((arr[i], arr[j]))
    return result

myList = [1, 2, 3, 4, 5]
print(find_pairs(myList, 6))`
  },
  'Security Issue': {
    language: 'python',
    code: `import sqlite3

def get_user(username):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    # SQL injection vulnerability!
    query = "SELECT * FROM users WHERE name = '" + username + "'"
    cursor.execute(query)
    return cursor.fetchone()

password = "admin123"  # Hardcoded secret`
  },
  'Long Function': {
    language: 'javascript',
    code: `function processUserData(name, age, email, phone, address, city, country) {
    // validation
    if (!name || !age || !email || !phone || !address || !city || !country) {
        return null;
    }
    
    var userData = {}
    userData.name = name
    userData.age = age
    userData.email = email
    userData.phone = phone
    userData.address = address
    userData.city = city
    userData.country = country
    
    for (var i = 0; i < 100; i++) {
        for (var j = 0; j < 100; j++) {
            // O(n²) complexity
            userData['field_' + i + '_' + j] = i * j
        }
    }
    
    return userData
}`
  },
  'Clean Code': {
    language: 'typescript',
    code: `interface User {
  id: string;
  name: string;
  email: string;
}

const getActiveUsers = (users: User[]): User[] =>
  users.filter(user => user.email.includes('@'));

const formatUser = ({ name, email }: User): string =>
  \`\${name} <\${email}>\`;

const users: User[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
];

console.log(getActiveUsers(users).map(formatUser));`
  }
};

// ─────────────────────── HOME COMPONENT ───────────────────────

const Home: React.FC = () => {
  const [code, setCode] = useState<string>(codeExamples['Nested Loops'].code);
  const [language, setLanguage] = useState<string>('python');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiProvider, setAiProvider] = useState<string>('openai');
  const editorRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async () => {
    if (!code.trim()) {
      toast.error('Please enter some code first');
      return;
    }
    setIsLoading(true);
    setResult(null);
    try {
      const response = await axios.post('/api/analyze', {
        code,
        language,
        ai_provider: aiProvider
      });
      setResult(response.data);
      toast.success('Analysis complete! 🎉');
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Analysis failed. Check backend connection.';
      toast.error(msg);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExample = (name: string) => {
    const eg = codeExamples[name];
    setCode(eg.code);
    setLanguage(eg.language);
    setResult(null);
    toast(`Loaded "${name}" example`, { icon: '📄' });
  };

  const features = [
    { icon: <FaCode />, title: 'Multi-Language Support', description: 'Analyze 18+ languages including Python, JS, Java, C++, Go, Rust, and more with accurate Tree-sitter parsing.', color: '#60a5fa' },
    { icon: <FaRobot />, title: 'AI-Powered Analysis', description: 'Get intelligent suggestions from OpenAI GPT-4, Google Gemini, or local Ollama models for your code.', color: '#a78bfa' },
    { icon: <FaChartLine />, title: 'Deep Metrics', description: 'Cyclomatic complexity, maintainability index, nesting depth, and quality scores visualized clearly.', color: '#34d399' },
    { icon: <FaShieldAlt />, title: 'Security Scanning', description: 'Detect SQL injections, hardcoded secrets, XSS vulnerabilities, and OWASP Top 10 patterns.', color: '#fb923c' },
    { icon: <FaRocket />, title: 'Instant Optimization', description: 'Receive refactored code instantly with detailed explanations of every improvement made.', color: '#f472b6' },
    { icon: <FaBolt />, title: 'Smart Caching', description: 'Blazing fast repeated analysis with intelligent result caching — under 100ms for cached results.', color: '#fbbf24' },
  ];

  return (
    <PageWrapper>
      <Header />

      {/* ── HERO ── */}
      <HeroSection>
        <HeroBg />
        <GridOverlay />
        <HeroContent>
          <HeroBadge
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <HiSparkles /> AI-Powered Code Intelligence Platform
          </HeroBadge>

          <HeroTitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Write Better Code,<br />Automatically
          </HeroTitle>

          <HeroSubtitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            CodeAura analyzes your code in real-time, detects issues, calculates complexity, and generates AI-optimized refactors across 18+ languages.
          </HeroSubtitle>

          <HeroButtons
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <PrimaryBtn onClick={() => editorRef.current?.scrollIntoView({ behavior: 'smooth' })}>
              <FaPlay style={{ fontSize: '0.8rem' }} /> Try It Now
            </PrimaryBtn>
            <SecondaryBtn to="/dashboard">
              <FaChartLine style={{ fontSize: '0.85rem' }} /> View Dashboard
            </SecondaryBtn>
          </HeroButtons>

          <StatsRow
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {[
              { num: '20+', label: 'Languages' },
              { num: '3', label: 'AI Providers' },
              { num: '<2s', label: 'Analysis Time' },
              { num: '100%', label: 'Privacy (Local)' },
            ].map((s) => (
              <StatItem key={s.label}>
                <StatNumber>{s.num}</StatNumber>
                <StatLabel>{s.label}</StatLabel>
              </StatItem>
            ))}
          </StatsRow>
        </HeroContent>
      </HeroSection>

      {/* ── FEATURES ── */}
      <SectionWrapper id="features">
        <SectionHeader>
          <SectionLabel>Features</SectionLabel>
          <SectionTitle>Everything You Need to Write <br />Production-Quality Code</SectionTitle>
          <SectionDesc>From static analysis to AI-powered refactoring, CodeAura covers your full code quality workflow.</SectionDesc>
        </SectionHeader>
        <FeaturesGrid>
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} delay={i * 0.08} />
          ))}
        </FeaturesGrid>
      </SectionWrapper>

      <DividerLine />

      {/* ── EDITOR ── */}
      <EditorSection id="editor" ref={editorRef as any}>
        <SectionHeader style={{ marginBottom: '2rem' }}>
          <SectionLabel>Live Editor</SectionLabel>
          <SectionTitle>Analyze Your Code</SectionTitle>
          <SectionDesc>Paste any code, pick a language, and let AI help you improve it.</SectionDesc>
        </SectionHeader>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <EditorCard>
            <EditorCardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <WindowButtons>
                  <WindowBtn color="#ff5f57" />
                  <WindowBtn color="#febc2e" />
                  <WindowBtn color="#28c840" />
                </WindowButtons>
                <LanguageSelector
                  value={language}
                  onChange={(val) => { setLanguage(val); setResult(null); }}
                  aiProvider={aiProvider}
                  onAiProviderChange={setAiProvider}
                />
              </div>
              <AnalyzeButton onClick={handleAnalyze} disabled={isLoading}>
                {isLoading ? <><Spinner /> Analyzing...</> : <><FaBolt style={{ fontSize: '0.8rem' }} /> Analyze Code</>}
              </AnalyzeButton>
            </EditorCardHeader>

            <ExamplesRow style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.015)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(148,163,184,0.6)', fontWeight: 600, marginRight: '0.25rem' }}>Examples:</span>
              {Object.keys(codeExamples).map((name) => (
                <ExampleChip key={name} onClick={() => loadExample(name)}>{name}</ExampleChip>
              ))}
            </ExamplesRow>

            <EditorGrid>
              <EditorPane bordered>
                <PaneTitle>
                  <FaCode style={{ color: '#60a5fa' }} /> Source Code
                </PaneTitle>
                <Editor
                  height="540px"
                  language={language}
                  value={code}
                  onChange={(val) => setCode(val || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    lineNumbersMinChars: 3,
                    padding: { top: 8 },
                    fontFamily: "'Fira Code', 'Consolas', monospace",
                    fontLigatures: true,
                    cursorBlinking: 'expand',
                  }}
                />
              </EditorPane>

              <EditorPane>
                <PaneTitle>
                  <FaChartLine style={{ color: '#a78bfa' }} /> Analysis Results
                </PaneTitle>
                <ResultPanel result={result} isLoading={isLoading} language={language} />
              </EditorPane>
            </EditorGrid>
          </EditorCard>
        </motion.div>
      </EditorSection>
    </PageWrapper>
  );
};

export default Home;
