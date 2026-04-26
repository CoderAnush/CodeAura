import { createGlobalStyle } from 'styled-components';
import { ThemeType } from './theme';

const GlobalStyles = createGlobalStyle<{ theme: ThemeType }>`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Fira+Code:wght@300;400;500&display=swap');

  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: ${(props) => props.theme.typography.fontFamily.primary};
    background: #080c1a;
    color: ${(props) => props.theme.colors.text.primary};
    line-height: 1.6;
    min-height: 100vh;
    overflow-x: hidden;
    background-image: 
      radial-gradient(ellipse at 20% 10%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(6, 182, 212, 0.04) 0%, transparent 70%);
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
    line-height: 1.2;
    margin-bottom: ${(props) => props.theme.spacing.md};
  }

  h1 {
    font-size: clamp(2rem, 5vw, ${(props) => props.theme.typography.fontSize['4xl']});
    font-weight: 800;
    background: linear-gradient(135deg, 
      #60a5fa 0%, 
      #a78bfa 50%, 
      #06b6d4 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.02em;
  }

  h2 {
    font-size: clamp(1.5rem, 3vw, ${(props) => props.theme.typography.fontSize['3xl']});
    font-weight: 700;
  }

  h3 {
    font-size: ${(props) => props.theme.typography.fontSize['2xl']};
  }

  p {
    margin-bottom: ${(props) => props.theme.spacing.md};
    color: ${(props) => props.theme.colors.text.secondary};
  }

  a {
    color: ${(props) => props.theme.colors.primary};
    text-decoration: none;
    transition: ${(props) => props.theme.transitions.default};
    
    &:hover {
      color: ${(props) => props.theme.colors.secondary};
    }
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    outline: none;
    transition: ${(props) => props.theme.transitions.default};
  }

  input, textarea, select {
    font-family: inherit;
    outline: none;
    border: 1px solid ${(props) => props.theme.colors.border.primary};
    background: ${(props) => props.theme.colors.background.card};
    color: ${(props) => props.theme.colors.text.primary};
    border-radius: ${(props) => props.theme.borderRadius.md};
    
    &:focus {
      border-color: ${(props) => props.theme.colors.primary};
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }

  code {
    font-family: ${(props) => props.theme.typography.fontFamily.mono};
    background: ${(props) => props.theme.colors.background.tertiary};
    padding: 0.2em 0.4em;
    border-radius: ${(props) => props.theme.borderRadius.sm};
    font-size: 0.875em;
  }

  pre {
    font-family: ${(props) => props.theme.typography.fontFamily.mono};
    background: ${(props) => props.theme.colors.background.secondary};
    border-radius: ${(props) => props.theme.borderRadius.lg};
    padding: ${(props) => props.theme.spacing.lg};
    overflow-x: auto;
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: ${(props) => props.theme.borderRadius.full};
    
    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  }

  .glass {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .gradient-text {
    background: linear-gradient(135deg, #60a5fa, #a78bfa, #06b6d4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .glow {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.15);
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
  }

  @keyframes pulse-ring {
    0% { transform: scale(0.9); opacity: 0.7; }
    50% { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(0.9); opacity: 0.7; }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  @keyframes scan {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }

  .animate-float {
    animation: float 4s ease-in-out infinite;
  }
`;

export default GlobalStyles;
