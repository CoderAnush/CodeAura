import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { Toaster } from 'react-hot-toast';

import GlobalStyles from '@/styles/GlobalStyles';
import theme from '@/styles/theme';
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import History from '@/pages/History';
import NotFound from '@/pages/NotFound';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            fontSize: '0.88rem',
            fontWeight: 500,
          },
          success: {
            iconTheme: {
              primary: '#34d399',
              secondary: '#1e293b',
            },
          },
          error: {
            iconTheme: {
              primary: '#f87171',
              secondary: '#1e293b',
            },
          },
        }}
      />
    </ThemeProvider>
  );
};

export default App;
