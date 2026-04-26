import React, { useState } from 'react';
import styled from 'styled-components';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCopy, FaDownload, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaChartBar, FaCode, FaBrain, FaShieldAlt } from 'react-icons/fa';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

const Panel = styled.div`
  height: 540px;
  background: rgba(10, 15, 30, 0.7);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  overflow-y: auto;
  position: relative;
`;

const Placeholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(148, 163, 184, 0.5);
  gap: 1rem;
  text-align: center;
  padding: 2rem;
`;

const PlaceholderIcon = styled.div`
  font-size: 3rem;
  opacity: 0.3;
`;

const PlaceholderText = styled.p`
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1.5rem;
`;

const LoadingBar = styled.div`
  width: 200px;
  height: 3px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 9999px;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: 40%;
    background: linear-gradient(90deg, transparent, #3b82f6, #8b5cf6, transparent);
    animation: loading 1.5s ease-in-out infinite;
    border-radius: 9999px;
  }
  
  @keyframes loading {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(350%); }
  }
`;

const TabBar = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  position: sticky;
  top: 0;
  background: rgba(10, 15, 30, 0.95);
  backdrop-filter: blur(12px);
  z-index: 10;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.8rem 1.1rem;
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: 0;
  border: none;
  background: transparent;
  color: ${(props) => props.active ? '#60a5fa' : 'rgba(148, 163, 184, 0.6)'};
  border-bottom: 2px solid ${(props) => props.active ? '#3b82f6' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.4rem;

  &:hover {
    color: ${(props) => props.active ? '#60a5fa' : '#cbd5e1'};
  }
`;

const TabContent = styled(motion.div)`
  padding: 1.25rem;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const MetricCard = styled.div<{ color?: string }>`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 0.9rem;
  text-align: center;
`;

const MetricValue = styled.div<{ color?: string }>`
  font-size: 1.6rem;
  font-weight: 700;
  color: ${(props) => props.color || '#60a5fa'};
  font-variant-numeric: tabular-nums;
  margin-bottom: 0.2rem;
`;

const MetricLabel = styled.div`
  font-size: 0.75rem;
  color: rgba(148, 163, 184, 0.6);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const QualityScore = styled.div<{ score: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.25rem;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const ScoreRing = styled.div<{ score: number }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(
    ${(props) => 
      props.score >= 80 ? '#10b981' : 
      props.score >= 60 ? '#f59e0b' : 
      '#ef4444'} ${(props) => props.score * 3.6}deg, 
    rgba(255, 255, 255, 0.05) 0deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 0.75rem;

  &::after {
    content: '';
    position: absolute;
    width: 62px;
    height: 62px;
    background: #0a0f1e;
    border-radius: 50%;
  }
`;

const ScoreNumber = styled.div<{ score: number }>`
  font-size: 1rem;
  font-weight: 800;
  color: ${(props) => 
    props.score >= 80 ? '#34d399' : 
    props.score >= 60 ? '#fbbf24' : 
    '#f87171'};
  position: relative;
  z-index: 1;
`;

const ScoreLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(148, 163, 184, 0.7);
  font-weight: 500;
`;

const IssueList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const IssueItem = styled.li<{ severity?: 'warning' | 'error' | 'info' | 'success' }>`
  background: ${(props) => 
    props.severity === 'error' ? 'rgba(239, 68, 68, 0.08)' :
    props.severity === 'warning' ? 'rgba(245, 158, 11, 0.08)' :
    props.severity === 'success' ? 'rgba(16, 185, 129, 0.08)' :
    'rgba(59, 130, 246, 0.08)'};
  color: ${(props) => 
    props.severity === 'error' ? '#fca5a5' :
    props.severity === 'warning' ? '#fde68a' :
    props.severity === 'success' ? '#6ee7b7' :
    '#93c5fd'};
  padding: 0.6rem 0.9rem;
  border-radius: 8px;
  border-left: 3px solid ${(props) => 
    props.severity === 'error' ? '#ef4444' :
    props.severity === 'warning' ? '#f59e0b' :
    props.severity === 'success' ? '#10b981' :
    '#3b82f6'};
  font-size: 0.85rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;

  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const Explanation = styled.div`
  color: rgba(203, 213, 225, 0.9);
  line-height: 1.7;
  background: rgba(255, 255, 255, 0.02);
  padding: 1rem;
  border-radius: 10px;
  font-size: 0.88rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  white-space: pre-wrap;
`;

const CodeActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(203, 213, 225, 0.9);
  padding: 0.45rem 0.9rem;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 500;
  
  &:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
    color: #60a5fa;
  }
`;

const ComplexityBadge = styled.span<{ complexity: string }>`
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.8rem;
  border-radius: 9999px;
  font-size: 0.82rem;
  font-weight: 600;
  font-family: 'Fira Code', monospace;
  background: ${(props) => 
    props.complexity.includes('n^') || props.complexity === 'O(n!)' ? 'rgba(239, 68, 68, 0.15)' :
    props.complexity === 'O(n log n)' || props.complexity === 'O(n^2)' ? 'rgba(245, 158, 11, 0.15)' :
    'rgba(16, 185, 129, 0.15)'};
  color: ${(props) => 
    props.complexity.includes('n^') || props.complexity === 'O(n!)' ? '#fca5a5' :
    props.complexity === 'O(n log n)' || props.complexity === 'O(n^2)' ? '#fde68a' :
    '#6ee7b7'};
  border: 1px solid ${(props) => 
    props.complexity.includes('n^') || props.complexity === 'O(n!)' ? 'rgba(239, 68, 68, 0.3)' :
    props.complexity === 'O(n log n)' || props.complexity === 'O(n^2)' ? 'rgba(245, 158, 11, 0.3)' :
    'rgba(16, 185, 129, 0.3)'};
`;

const ProgressBar = styled.div<{ value: number; color: string }>`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 9999px;
  overflow: hidden;
  margin-top: 0.4rem;

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${(props) => Math.min(100, props.value)}%;
    background: ${(props) => props.color};
    border-radius: 9999px;
    transition: width 0.8s ease;
  }
`;

const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 0.85rem;

  &:last-child {
    border-bottom: none;
  }
`;

const MetricRowLabel = styled.span`
  color: rgba(148, 163, 184, 0.7);
`;

const MetricRowValue = styled.span<{ color?: string }>`
  color: ${(props) => props.color || '#f1f5f9'};
  font-weight: 600;
  font-variant-numeric: tabular-nums;
`;

interface ResultPanelProps {
  result: any;
  isLoading: boolean;
  language?: string;
}

const ResultPanel: React.FC<ResultPanelProps> = ({ result, isLoading, language = 'javascript' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'ai' | 'code'>('overview');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadCode = (code: string) => {
    const ext = language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : 'txt';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `optimized_code.${ext}`);
    toast.success('Code downloaded!');
  };

  if (isLoading) {
    return (
      <Panel>
        <LoadingContainer>
          <FaBrain style={{ fontSize: '2.5rem', color: '#3b82f6', opacity: 0.8 }} />
          <div>
            <p style={{ color: 'rgba(148,163,184,0.8)', marginBottom: '0.75rem', textAlign: 'center', fontSize: '0.9rem' }}>
              Analyzing your code with AI...
            </p>
            <LoadingBar />
          </div>
        </LoadingContainer>
      </Panel>
    );
  }

  if (!result) {
    return (
      <Panel>
        <Placeholder>
          <PlaceholderIcon>🔍</PlaceholderIcon>
          <PlaceholderText>
            Paste your code in the editor and click<br />
            <strong style={{ color: '#60a5fa' }}>Analyze Code</strong> to get AI-powered insights
          </PlaceholderText>
        </Placeholder>
      </Panel>
    );
  }

  const quality = result.quality_metrics;
  const qualityScore = quality?.quality_score ?? 85;
  const issueCount = result.issues?.length ?? 0;
  const complexity = result.complexity || 'O(n)';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FaChartBar /> },
    { id: 'issues', label: `Issues (${issueCount})`, icon: <FaExclamationTriangle /> },
    { id: 'ai', label: 'AI Analysis', icon: <FaBrain /> },
    { id: 'code', label: 'Optimized', icon: <FaCode /> },
  ];

  return (
    <Panel>
      <TabBar>
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            active={activeTab === tab.id as any}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.icon}
            {tab.label}
          </Tab>
        ))}
      </TabBar>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <TabContent
            key="overview"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <QualityScore score={qualityScore}>
              <ScoreRing score={qualityScore}>
                <ScoreNumber score={qualityScore}>{Math.round(qualityScore)}</ScoreNumber>
              </ScoreRing>
              <ScoreLabel>Code Quality Score</ScoreLabel>
            </QualityScore>

            <MetricsGrid>
              <MetricCard>
                <MetricValue color="#60a5fa">{quality?.lines_of_code ?? '—'}</MetricValue>
                <MetricLabel>Lines of Code</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue color={issueCount > 0 ? '#f87171' : '#34d399'}>{issueCount}</MetricValue>
                <MetricLabel>Issues Found</MetricLabel>
              </MetricCard>
              <MetricCard>
                <ComplexityBadge complexity={complexity}>{complexity}</ComplexityBadge>
                <MetricLabel style={{ marginTop: '0.4rem' }}>Time Complexity</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue color="#a78bfa">{quality?.complexity_metrics?.function_count ?? '—'}</MetricValue>
                <MetricLabel>Functions</MetricLabel>
              </MetricCard>
            </MetricsGrid>

            {quality && (
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.82rem', color: 'rgba(148,163,184,0.7)', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Metrics Breakdown
                </div>
                <MetricRow>
                  <MetricRowLabel>Maintainability Index</MetricRowLabel>
                  <MetricRowValue color="#34d399">{Math.round(quality.maintainability_index ?? 60)}/100</MetricRowValue>
                </MetricRow>
                <ProgressBar value={quality.maintainability_index ?? 60} color="#10b981" />
                
                <MetricRow style={{ marginTop: '0.5rem' }}>
                  <MetricRowLabel>Cyclomatic Complexity</MetricRowLabel>
                  <MetricRowValue color={quality.complexity_metrics?.cyclomatic_complexity > 10 ? '#f87171' : '#fbbf24'}>
                    {quality.complexity_metrics?.cyclomatic_complexity ?? '—'}
                  </MetricRowValue>
                </MetricRow>
                
                <MetricRow>
                  <MetricRowLabel>Cognitive Complexity</MetricRowLabel>
                  <MetricRowValue>{quality.complexity_metrics?.cognitive_complexity ?? '—'}</MetricRowValue>
                </MetricRow>

                <MetricRow>
                  <MetricRowLabel>Nesting Depth</MetricRowLabel>
                  <MetricRowValue color={quality.complexity_metrics?.nesting_depth > 3 ? '#f87171' : '#6ee7b7'}>
                    {quality.complexity_metrics?.nesting_depth ?? '—'} {quality.complexity_metrics?.nesting_depth > 3 ? '⚠️' : '✓'}
                  </MetricRowValue>
                </MetricRow>

                <MetricRow>
                  <MetricRowLabel>Classes</MetricRowLabel>
                  <MetricRowValue>{quality.complexity_metrics?.class_count ?? 0}</MetricRowValue>
                </MetricRow>
              </div>
            )}
          </TabContent>
        )}

        {activeTab === 'issues' && (
          <TabContent
            key="issues"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <IssueList>
              {issueCount === 0 ? (
                <IssueItem severity="success">
                  <FaCheckCircle />
                  No issues detected — your code looks clean!
                </IssueItem>
              ) : (
                result.issues.map((issue: string, i: number) => {
                  const isError = issue.toLowerCase().includes('error') || issue.toLowerCase().includes('security') || issue.toLowerCase().includes('sql');
                  const isInfo = issue.toLowerCase().includes('pattern') || issue.toLowerCase().includes('consider');
                  return (
                    <IssueItem key={i} severity={isError ? 'error' : isInfo ? 'info' : 'warning'}>
                      {isError ? <FaExclamationTriangle /> : isInfo ? <FaInfoCircle /> : <FaExclamationTriangle />}
                      {issue}
                    </IssueItem>
                  );
                })
              )}
            </IssueList>
          </TabContent>
        )}

        {activeTab === 'ai' && (
          <TabContent
            key="ai"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <FaBrain style={{ color: '#a78bfa' }} />
              <span style={{ fontSize: '0.85rem', color: 'rgba(148,163,184,0.8)', fontWeight: 600 }}>
                Powered by {result.ai_provider?.toUpperCase() || 'AI'}
              </span>
            </div>
            <Explanation>{result.explanation || 'No AI analysis available.'}</Explanation>
          </TabContent>
        )}

        {activeTab === 'code' && (
          <TabContent
            key="code"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <CodeActions>
              <ActionButton onClick={() => copyToClipboard(result.improved_code)}>
                <FaCopy /> Copy
              </ActionButton>
              <ActionButton onClick={() => downloadCode(result.improved_code)}>
                <FaDownload /> Download
              </ActionButton>
            </CodeActions>
            <SyntaxHighlighter
              language={language}
              style={oneDark}
              customStyle={{
                borderRadius: '10px',
                padding: '1rem',
                fontSize: '0.85rem',
                margin: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {result.improved_code || '// No optimized code available'}
            </SyntaxHighlighter>
          </TabContent>
        )}
      </AnimatePresence>
    </Panel>
  );
};

export default ResultPanel;
