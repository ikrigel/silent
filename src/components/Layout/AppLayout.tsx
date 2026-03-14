import React, { useState } from 'react';
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const DRAWER_WIDTH = 240;

/** Page title map based on route */
const PAGE_TITLES: Record<string, string> = {
  '/':          'Dashboard',
  '/scheduler': 'Scheduler',
  '/logs':      'Logs',
  '/settings':  'Settings',
  '/about':     'About',
  '/help':      'Help',
};

/** Root layout component wrapping all pages with nav and header */
export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { pathname } = useLocation();

  const title = PAGE_TITLES[pathname] ?? 'Silent';

  return (
    <Box sx={{ display: 'flex' }}>
      <Header
        onMenuClick={() => setMobileOpen((prev) => !prev)}
        title={`💤 ${title}`}
      />

      {/* Permanent sidebar on desktop, temporary drawer on mobile */}
      <Sidebar
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        variant={isMobile ? 'temporary' : 'permanent'}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
        }}
      >
        <Toolbar />  {/* Spacer for fixed AppBar */}
        <Outlet />
      </Box>
    </Box>
  );
};
