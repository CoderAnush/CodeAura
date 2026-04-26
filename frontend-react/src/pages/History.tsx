import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHistory, FaSearch, FaFilter, FaTrash, FaCopy, FaEye, FaCode, FaChartLine, FaBug } from 'react-icons/fa';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Header from '@/components/Header';
import toast from 'react-hot-toast';

// ─── STYLES ──────────────────────────────────────────────────────

const PageWrapper = styled.div`min-height: 100vh;`;

const Container = styled.div`
  max-width: 1300px;
  margin: 0 auto;
  padding: 2.5rem 2rem;
`;

const TitleRow = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const TitleLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const IconBadge = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
`;

const PageH1 = styled.h1`
  font-size: 1.8rem !important;
  font-weight: 800;
  margin: 0 0 0.1rem 0;
  background: linear-gradient(135deg, #60a5fa, #a78bfa) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;
`;

const PageSub = styled.p`
  color: rgba(148, 163, 184, 0.6);
  font-size: 0.85rem;
  margin: 0;
`;

const ControlsRow = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(10, 15, 30, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9px;
  padding: 0.5rem 0.9rem;
  flex: 1;
  min-width: 200px;
  max-width: 360px;
  transition: all 0.2s;

  &:focus-within {
    border-color: rgba(59, 130, 246, 0.4);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.08);
  }

  svg {
    color: rgba(148, 163, 184, 0.5);
    flex-shrink: 0;
  }
`;

const SearchInput = styled.input`
  background: transparent;
  border: none;
  color: #f1f5f9;
  font-size: 0.88rem;
  flex: 1;
  min-width: 0;
  outline: none;

  &::placeholder {
    color: rgba(148, 163, 184, 0.4);
  }
`;

const FilterSelect = styled.select`
  background: rgba(10, 15, 30, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9px;
  color: #cbd5e1;
  font-size: 0.85rem;
  padding: 0.5rem 0.9rem;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: rgba(59, 130, 246, 0.4);
  }

  option {
    background: #1e293b;
  }
`;

const ClearBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.15);
  color: #f87171;
  padding: 0.5rem 0.9rem;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.3);
  }
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const HistoryCard = styled(motion.div)<{ expanded: boolean }>`
  background: rgba(10, 15, 30, 0.7);
  border: 1px solid ${props => props.expanded ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.06)'};
  border-radius: 14px;
  overflow: hidden;
  transition: border-color 0.2s;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: background 0.2s;
  flex-wrap: wrap;
  gap: 0.5rem;

  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`;

const CardLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem;
`;

const LangPill = styled.div<{ lang: string }>`
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
  font-family: 'Fira Code', monospace;
  background: ${props => getLangColor(props.lang)}18;
  color: ${props => getLangColor(props.lang)};
  border: 1px solid ${props => getLangColor(props.lang)}30;
  min-width: 32px;
  text-align: center;
`;

function getLangColor(lang: string): string {
  const map: Record<string, string> = {
    python: '#60a5fa',
    javascript: '#fbbf24',
    typescript: '#818cf8',
    java: '#f97316',
    cpp: '#a78bfa',
    c: '#34d399',
    go: '#06b6d4',
    rust: '#fb923c',
  };
  return map[lang] || '#8b5cf6';
}

const CardTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #f1f5f9;
`;

const CardMeta = styled.div`
  font-size: 0.75rem;
  color: rgba(148, 163, 184, 0.55);
  margin-top: 2px;
`;

const CardRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const IssueBadge = styled.div<{ count: number }>`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  color: ${props => props.count === 0 ? '#34d399' : props.count > 4 ? '#f87171' : '#fbbf24'};
  background: ${props => props.count === 0 ? 'rgba(16,185,129,0.1)' : props.count > 4 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'};
`;

const QualityBadge = styled.div<{ score: number }>`
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  color: ${props => props.score >= 80 ? '#34d399' : props.score >= 60 ? '#fbbf24' : '#f87171'};
  background: ${props => props.score >= 80 ? 'rgba(16,185,129,0.1)' : props.score >= 60 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'};
`;

const CardActions = styled.div`
  display: flex;
  gap: 0.35rem;
`;

const ActionBtn = styled.button`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  color: rgba(148, 163, 184, 0.7);
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.78rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.2s;
  font-weight: 500;

  &:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
  }

  &.danger:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }
`;

const ExpandContent = styled(motion.div)`
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1.25rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const ExpandSection = styled.div``;

const ExpandLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(148, 163, 184, 0.5);
  margin-bottom: 0.6rem;
`;

const IssueChip = styled.div`
  font-size: 0.8rem;
  color: #fde68a;
  background: rgba(245, 158, 11, 0.07);
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
  margin-bottom: 0.35rem;
`;

const AiText = styled.p`
  font-size: 0.82rem;
  color: rgba(203, 213, 225, 0.8);
  line-height: 1.6;
  margin: 0;
  max-height: 120px;
  overflow-y: auto;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 5rem 2rem;
  color: rgba(148, 163, 184, 0.5);

  .icon { font-size: 3rem; margin-bottom: 1rem; }
  h3 { color: rgba(148, 163, 184, 0.6); font-size: 1.1rem; margin-bottom: 0.5rem; }
  p { font-size: 0.88rem; margin: 0; }
`;

// ─── MOCK DATA ────────────────────────────────────────────────────

const mockHistory = [
  {
    id: 1, lang: 'python', title: 'data_processor.py',
    time: '2 minutes ago', lines: 45, issues: ['Nested loop detected O(n²)', 'Variable \'d\' is too short'], 
    quality: 78, complexity: 'O(n²)', provider: 'openai',
    explanation: 'The code has nested loops causing quadratic complexity. Consider using dictionary lookups or set operations to achieve O(n) time complexity.',
    code: 'def process(data):\n    result = []\n    for i in range(len(data)):\n        for j in range(len(data)):\n            if data[i] == data[j]:\n                result.append(data[i])\n    return result'
  },
  {
    id: 2, lang: 'typescript', title: 'App.tsx',
    time: '15 minutes ago', lines: 120, issues: ['Function \'handleSubmit\' is too long'],
    quality: 92, complexity: 'O(n)', provider: 'openai',
    explanation: 'Overall the code is well-structured. Consider breaking down the handleSubmit function into smaller, focused functions.',
    code: 'const App: React.FC = () => {\n  return <div>App</div>;\n};'
  },
  {
    id: 3, lang: 'javascript', title: 'utils.js',
    time: '1 hour ago', lines: 89, issues: ["Avoid using bare 'except:'", 'Pattern range(len(seq)) detected', 'SQL injection risk', 'Hardcoded secret'],
    quality: 61, complexity: 'O(n log n)', provider: 'gemini',
    explanation: 'Several security and code quality issues detected. Hardcoded credentials should be moved to environment variables. SQL queries should use parameterized statements.',
    code: 'const password = "admin123";\nconst query = "SELECT * FROM users WHERE id = " + userId;'
  },
  {
    id: 4, lang: 'python', title: 'neural_net.py',
    time: '3 hours ago', lines: 210, issues: ['Function \'train\' has too many arguments (8)'],
    quality: 84, complexity: 'O(n)', provider: 'openai',
    explanation: 'Good code overall. The train() function could benefit from using a configuration dataclass instead of individual parameters.',
    code: 'def train(model, lr, epochs, batch_size, optimizer, loss, data, labels):\n    pass'
  },
];

// ─── COMPONENT ───────────────────────────────────────────────────

const History: React.FC = () => {
  const [history, setHistory] = useState(mockHistory);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = history.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                       item.lang.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || item.lang === filter;
    return matchSearch && matchFilter;
  });

  const clearHistory = () => {
    setHistory([]);
    toast.success('History cleared');
  };

  const deleteItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(h => h.id !== id));
    toast.success('Entry removed');
  };

  const copyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success('Code copied!');
  };

  return (
    <PageWrapper>
      <Header />
      <Container>
        <TitleRow
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <TitleLeft>
            <IconBadge><FaHistory /></IconBadge>
            <div>
              <PageH1>Analysis History</PageH1>
              <PageSub>{history.length} past analyses stored locally</PageSub>
            </div>
          </TitleLeft>
          {history.length > 0 && (
            <ClearBtn onClick={clearHistory}>
              <FaTrash style={{ fontSize: '0.75rem' }} /> Clear All
            </ClearBtn>
          )}
        </TitleRow>

        <ControlsRow>
          <SearchBox>
            <FaSearch size={12} />
            <SearchInput
              placeholder="Search by filename or language..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </SearchBox>
          <FilterSelect value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Languages</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="go">Go</option>
          </FilterSelect>
        </ControlsRow>

        {filtered.length === 0 ? (
          <EmptyState>
            <div className="icon">📭</div>
            <h3>{search || filter !== 'all' ? 'No matching results' : 'No history yet'}</h3>
            <p>{search || filter !== 'all' ? 'Try adjusting your search or filter' : 'Analyze some code to see your history here'}</p>
          </EmptyState>
        ) : (
          <HistoryList>
            <AnimatePresence>
              {filtered.map((item, i) => {
                const isExpanded = expandedId === item.id;
                return (
                  <HistoryCard
                    key={item.id}
                    expanded={isExpanded}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <CardHeader onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                      <CardLeft>
                        <LangPill lang={item.lang}>{item.lang.slice(0, 2).toUpperCase()}</LangPill>
                        <div>
                          <CardTitle>{item.title}</CardTitle>
                          <CardMeta>{item.time} · {item.lines} lines · {item.provider}</CardMeta>
                        </div>
                      </CardLeft>
                      <CardRight>
                        <IssueBadge count={item.issues.length}>
                          <FaBug style={{ fontSize: '0.65rem' }} /> {item.issues.length}
                        </IssueBadge>
                        <QualityBadge score={item.quality}>{item.quality}</QualityBadge>
                        <CardActions>
                          <ActionBtn onClick={(e) => copyCode(item.code, e)}>
                            <FaCopy /> Copy
                          </ActionBtn>
                          <ActionBtn onClick={(e) => deleteItem(item.id, e)} className="danger">
                            <FaTrash />
                          </ActionBtn>
                        </CardActions>
                        <span style={{ color: 'rgba(148,163,184,0.4)', fontSize: '0.8rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▾</span>
                      </CardRight>
                    </CardHeader>

                    <AnimatePresence>
                      {isExpanded && (
                        <ExpandContent
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <ExpandSection>
                            <ExpandLabel><FaBug /> Issues ({item.issues.length})</ExpandLabel>
                            {item.issues.length === 0 ? (
                              <IssueChip style={{ color: '#34d399', background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.15)' }}>✓ No issues found</IssueChip>
                            ) : (
                              item.issues.map((issue, j) => <IssueChip key={j}>{issue}</IssueChip>)
                            )}
                            <div style={{ marginTop: '1rem' }}>
                              <ExpandLabel><FaBrain style={{ display:'inline' }} /> AI Explanation</ExpandLabel>
                              <AiText>{item.explanation}</AiText>
                            </div>
                          </ExpandSection>
                          <ExpandSection>
                            <ExpandLabel><FaCode /> Code Snapshot</ExpandLabel>
                            <SyntaxHighlighter
                              language={item.lang}
                              style={oneDark}
                              customStyle={{
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                padding: '0.75rem',
                                margin: 0,
                                maxHeight: '180px',
                                overflow: 'auto',
                                background: 'rgba(0,0,0,0.4)',
                                border: '1px solid rgba(255,255,255,0.05)',
                              }}
                            >
                              {item.code}
                            </SyntaxHighlighter>
                          </ExpandSection>
                        </ExpandContent>
                      )}
                    </AnimatePresence>
                  </HistoryCard>
                );
              })}
            </AnimatePresence>
          </HistoryList>
        )}
      </Container>
    </PageWrapper>
  );
};

// Quick fix: FaBrain is used in JSX but not imported in some files
const FaBrain = ({ style }: { style?: React.CSSProperties }) => <span style={style}>🧠</span>;

export default History;
