import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaChartLine, FaCode, FaBug, FaStar, FaRocket, FaBolt, FaShieldAlt, FaTrophy, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';
import axios from 'axios';
import Header from '@/components/Header';

// ─── STYLED COMPONENTS ───────────────────────────────────────────

const PageWrapper = styled.div`
  min-height: 100vh;
`;

const Container = styled.div`
  max-width: 1300px;
  margin: 0 auto;
  padding: 2.5rem 2rem;
`;

const PageTitle = styled(motion.div)`
  margin-bottom: 2.5rem;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

const IconBadge = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: white;
`;

const PageH1 = styled.h1`
  font-size: 1.8rem !important;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #60a5fa, #a78bfa) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;
`;

const PageSub = styled.p`
  color: rgba(148, 163, 184, 0.7);
  font-size: 0.9rem;
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(motion.div)<{ glow?: string }>`
  background: rgba(10, 15, 30, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;

  &::before {
    content: '';
    position: absolute;
    top: -40px;
    right: -40px;
    width: 100px;
    height: 100px;
    background: radial-gradient(circle, ${props => props.glow || 'rgba(59,130,246,0.12)'} 0%, transparent 70%);
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
  }
`;

const StatIcon = styled.div<{ color: string }>`
  width: 38px;
  height: 38px;
  background: ${props => props.color}18;
  border: 1px solid ${props => props.color}30;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color};
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: #f1f5f9;
  line-height: 1;
  margin-bottom: 0.3rem;
  font-variant-numeric: tabular-nums;
`;

const StatTitle = styled.div`
  font-size: 0.82rem;
  color: rgba(148, 163, 184, 0.65);
  font-weight: 500;
`;

const StatChange = styled.div<{ positive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: ${props => props.positive ? '#34d399' : '#f87171'};
  margin-top: 0.4rem;
  font-weight: 600;
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled(motion.div)`
  background: rgba(10, 15, 30, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 1.5rem;
`;

const PanelTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 1.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  svg {
    color: #60a5fa;
  }
`;

const LanguageBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const LangRow = styled.div``;

const LangMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
`;

const LangName = styled.span`
  font-size: 0.84rem;
  color: #cbd5e1;
  font-weight: 500;
`;

const LangCount = styled.span`
  font-size: 0.78rem;
  color: rgba(148, 163, 184, 0.6);
`;

const BarTrack = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 9999px;
  overflow: hidden;
`;

const BarFill = styled(motion.div)<{ color: string }>`
  height: 100%;
  background: ${props => props.color};
  border-radius: 9999px;
`;

const QualityGauge = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const CircleGauge = styled.div<{ score: number }>`
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: conic-gradient(
    ${props => 
      props.score >= 80 ? '#10b981' : 
      props.score >= 60 ? '#f59e0b' : 
      '#ef4444'} ${props => props.score * 3.6}deg, 
    rgba(255, 255, 255, 0.04) 0deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    width: 110px;
    height: 110px;
    background: #0a0f1e;
    border-radius: 50%;
  }
`;

const GaugeInner = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
`;

const GaugeScore = styled.div<{ score: number }>`
  font-size: 2rem;
  font-weight: 800;
  color: ${props => 
    props.score >= 80 ? '#34d399' : 
    props.score >= 60 ? '#fbbf24' : 
    '#f87171'};
  line-height: 1;
`;

const GaugeLabel = styled.div`
  font-size: 0.72rem;
  color: rgba(148, 163, 184, 0.6);
  margin-top: 2px;
`;

const InsightsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
`;

const InsightItem = styled.div<{ type: 'good' | 'warn' | 'bad' }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.9rem;
  border-radius: 9px;
  background: ${props => 
    props.type === 'good' ? 'rgba(16, 185, 129, 0.07)' :
    props.type === 'warn' ? 'rgba(245, 158, 11, 0.07)' :
    'rgba(239, 68, 68, 0.07)'};
  border: 1px solid ${props => 
    props.type === 'good' ? 'rgba(16, 185, 129, 0.15)' :
    props.type === 'warn' ? 'rgba(245, 158, 11, 0.15)' :
    'rgba(239, 68, 68, 0.15)'};
  font-size: 0.82rem;
  color: ${props => 
    props.type === 'good' ? '#6ee7b7' :
    props.type === 'warn' ? '#fde68a' :
    '#fca5a5'};
`;

const RecentGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const RecentItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.08);
  }
`;

const RecentLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const LangPill = styled.div<{ lang: string }>`
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 5px;
  font-family: 'Fira Code', monospace;
  background: ${props => 
    props.lang === 'python' ? 'rgba(59, 130, 246, 0.15)' :
    props.lang === 'javascript' ? 'rgba(251, 191, 36, 0.15)' :
    props.lang === 'typescript' ? 'rgba(96, 165, 250, 0.15)' :
    'rgba(139, 92, 246, 0.15)'};
  color: ${props => 
    props.lang === 'python' ? '#93c5fd' :
    props.lang === 'javascript' ? '#fbbf24' :
    props.lang === 'typescript' ? '#60a5fa' :
    '#a78bfa'};
`;

const RecentTitle = styled.div`
  font-size: 0.84rem;
  color: #cbd5e1;
  font-weight: 500;
`;

const RecentTime = styled.div`
  font-size: 0.75rem;
  color: rgba(148, 163, 184, 0.5);
`;

const QualityBadge = styled.div<{ score: number }>`
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  color: ${props => props.score >= 80 ? '#34d399' : props.score >= 60 ? '#fbbf24' : '#f87171'};
  background: ${props => props.score >= 80 ? 'rgba(16, 185, 129, 0.1)' : props.score >= 60 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: rgba(148, 163, 184, 0.5);

  div {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
  }

  p {
    font-size: 0.9rem;
    margin: 0;
  }
`;

// ─── COMPONENT ───────────────────────────────────────────────────

const langColors: Record<string, string> = {
  python: '#3b82f6',
  javascript: '#fbbf24',
  typescript: '#60a5fa',
  java: '#f97316',
  cpp: '#a78bfa',
  go: '#06b6d4',
  rust: '#fb923c',
  default: '#8b5cf6',
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, trendsRes] = await Promise.all([
          axios.get('/api/stats'),
          axios.get('/api/analytics/trends'),
        ]);
        setStats(statsRes.data);
        setTrends(trendsRes.data);
      } catch (e) {
        // Use mock data if backend not available
        setStats({
          total_analyses: 0,
          supported_languages: 20,
          recent_trends: {}
        });
        setTrends({ message: 'No recent data available' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Mock recent analyses for demonstration
  const recentAnalyses = [
    { lang: 'python', title: 'data_processor.py', quality: 78, time: '2 min ago', issues: 3 },
    { lang: 'typescript', title: 'App.tsx', quality: 92, time: '15 min ago', issues: 1 },
    { lang: 'javascript', title: 'utils.js', quality: 61, time: '1 hr ago', issues: 7 },
    { lang: 'python', title: 'neural_net.py', quality: 84, time: '3 hr ago', issues: 2 },
  ];

  const langStats = [
    { lang: 'Python', count: 12, pct: 80, color: '#3b82f6' },
    { lang: 'JavaScript', count: 8, pct: 55, color: '#fbbf24' },
    { lang: 'TypeScript', count: 5, pct: 33, color: '#60a5fa' },
    { lang: 'Java', count: 3, pct: 20, color: '#f97316' },
    { lang: 'C++', count: 2, pct: 13, color: '#a78bfa' },
  ];

  const avgQuality = 79;

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <PageWrapper>
      <Header />
      <Container>
        <PageTitle
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <TitleRow>
            <IconBadge><FaChartLine /></IconBadge>
            <PageH1>Dashboard</PageH1>
          </TitleRow>
          <PageSub>Real-time analytics and code quality insights</PageSub>
        </PageTitle>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <StatsGrid>
            <StatCard variants={itemVariants} glow="rgba(59,130,246,0.15)">
              <StatIcon color="#60a5fa"><FaChartLine /></StatIcon>
              <StatValue>{stats?.total_analyses ?? 0}</StatValue>
              <StatTitle>Total Analyses</StatTitle>
              <StatChange positive={true}><FaArrowUp /> Active session</StatChange>
            </StatCard>
            <StatCard variants={itemVariants} glow="rgba(139,92,246,0.15)">
              <StatIcon color="#a78bfa"><FaCode /></StatIcon>
              <StatValue>{stats?.supported_languages ?? 20}</StatValue>
              <StatTitle>Languages Supported</StatTitle>
              <StatChange positive={true}><FaArrowUp /> +5 this month</StatChange>
            </StatCard>
            <StatCard variants={itemVariants} glow="rgba(16,185,129,0.15)">
              <StatIcon color="#34d399"><FaStar /></StatIcon>
              <StatValue>{avgQuality}</StatValue>
              <StatTitle>Avg Quality Score</StatTitle>
              <StatChange positive={true}><FaArrowUp /> +4 vs last week</StatChange>
            </StatCard>
            <StatCard variants={itemVariants} glow="rgba(249,115,22,0.15)">
              <StatIcon color="#fb923c"><FaBug /></StatIcon>
              <StatValue>{recentAnalyses.reduce((a, b) => a + b.issues, 0)}</StatValue>
              <StatTitle>Issues Found</StatTitle>
              <StatChange positive={false}><FaArrowDown /> Down from last session</StatChange>
            </StatCard>
          </StatsGrid>
        </motion.div>

        {/* Two columns */}
        <TwoCol>
          <Panel
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <PanelTitle><FaCode /> Language Breakdown</PanelTitle>
            <LanguageBar>
              {langStats.map((l, i) => (
                <LangRow key={l.lang}>
                  <LangMeta>
                    <LangName>{l.lang}</LangName>
                    <LangCount>{l.count} analyses</LangCount>
                  </LangMeta>
                  <BarTrack>
                    <BarFill
                      color={l.color}
                      initial={{ width: 0 }}
                      animate={{ width: `${l.pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                    />
                  </BarTrack>
                </LangRow>
              ))}
            </LanguageBar>
          </Panel>

          <Panel
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <PanelTitle><FaStar /> Overall Quality</PanelTitle>
            <QualityGauge>
              <CircleGauge score={avgQuality}>
                <GaugeInner>
                  <GaugeScore score={avgQuality}>{avgQuality}</GaugeScore>
                  <GaugeLabel>/ 100</GaugeLabel>
                </GaugeInner>
              </CircleGauge>
              <InsightsList>
                <InsightItem type="good">
                  <FaTrophy style={{ flexShrink: 0 }} /> Good maintainability index overall
                </InsightItem>
                <InsightItem type="warn">
                  ⚠️ Some functions exceed recommended length
                </InsightItem>
                <InsightItem type="bad">
                  🔴 Security issues detected in 2 analyses
                </InsightItem>
              </InsightsList>
            </QualityGauge>
          </Panel>
        </TwoCol>

        {/* Recent Analyses */}
        <Panel
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <PanelTitle><FaRocket /> Recent Analyses</PanelTitle>
          {recentAnalyses.length === 0 ? (
            <EmptyState>
              <div>📊</div>
              <p>No analyses yet. Go analyze some code!</p>
            </EmptyState>
          ) : (
            <RecentGrid>
              {recentAnalyses.map((item, i) => (
                <RecentItem key={i}>
                  <RecentLeft>
                    <LangPill lang={item.lang}>{item.lang.slice(0, 2).toUpperCase()}</LangPill>
                    <div>
                      <RecentTitle>{item.title}</RecentTitle>
                      <RecentTime>{item.time} · {item.issues} issue{item.issues !== 1 ? 's' : ''}</RecentTime>
                    </div>
                  </RecentLeft>
                  <QualityBadge score={item.quality}>{item.quality}</QualityBadge>
                </RecentItem>
              ))}
            </RecentGrid>
          )}
        </Panel>
      </Container>
    </PageWrapper>
  );
};

export default Dashboard;
