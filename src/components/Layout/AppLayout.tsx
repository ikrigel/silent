import React, { useState } from 'react';
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const DRAWER_WIDTH = 240;

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/scheduler': 'Scheduler',
  '/logs': 'Logs',
  '/settings': 'Settings',
  '/about': 'About',
  '/help': 'Help',
};

/**
 * Root layout with parallax background image.
 * The background (silent.png) is fixed and scrolls at a slower rate than
 * the content, creating a parallax depth effect.
 */
export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'Silent';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Parallax background layer — fixed attachment creates the depth effect */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'url(/silent.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',   // ← parallax effect
          opacity: theme.palette.mode === 'dark' ? 0.08 : 0.12,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <Header
        onMenuClick={() => setMobileOpen((prev) => !prev)}
        title={`💤 ${title}`}
      />

      <Sidebar
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        variant={isMobile ? 'temporary' : 'permanent'}
      />

      {/* Main content — sits above the parallax layer */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};
