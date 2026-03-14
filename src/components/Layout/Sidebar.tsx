import React from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, Divider, Typography, Box,
} from '@mui/material';
import {
  Dashboard, Schedule, Settings, ListAlt,
  Info, HelpOutline,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { label: 'Dashboard',  path: '/',          icon: <Dashboard /> },
  { label: 'Scheduler',  path: '/scheduler', icon: <Schedule /> },
  { label: 'Logs',       path: '/logs',       icon: <ListAlt /> },
  { label: 'Settings',   path: '/settings',   icon: <Settings /> },
  { label: 'About',      path: '/about',      icon: <Info /> },
  { label: 'Help',       path: '/help',       icon: <HelpOutline /> },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant: 'permanent' | 'temporary';
}

/** Application navigation sidebar */
export const Sidebar: React.FC<SidebarProps> = ({ open, onClose, variant }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleNav = (path: string) => {
    navigate(path);
    if (variant === 'temporary') onClose();
  };

  const content = (
    <>
      <Toolbar>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize="1.5rem">💤</Typography>
          <Typography variant="h6" fontWeight="bold">Silent</Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {NAV_ITEMS.map(({ label, path, icon }) => (
          <ListItem key={path} disablePadding>
            <ListItemButton
              selected={pathname === path}
              onClick={() => handleNav(path)}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}
    >
      {content}
    </Drawer>
  );
};
