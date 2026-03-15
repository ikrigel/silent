import React from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, Divider, Typography, Box, IconButton, useTheme,
} from '@mui/material';
import {
  Dashboard, Schedule, Settings, ListAlt, Info, HelpOutline, SmartToy, PushPin, Favorite,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/settingsStore';

const DRAWER_WIDTH = 240;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant: 'permanent' | 'temporary';
}

/** Application navigation sidebar with i18n support */
export const Sidebar: React.FC<SidebarProps> = ({ open, onClose, variant }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const theme = useTheme();
  const { settings, setMenuPinned } = useSettingsStore();

  const dir = theme.direction;
  const sidebarAnchor = settings.menuPosition === 'left' || settings.menuPosition === 'right'
    ? (settings.menuPosition === 'right' || (settings.menuPosition === 'left' && dir === 'rtl') ? 'right' : 'left')
    : 'left';

  const NAV_ITEMS = [
    { label: t('nav.dashboard'),  path: '/',          icon: <Dashboard /> },
    { label: t('nav.scheduler'),  path: '/scheduler', icon: <Schedule /> },
    { label: t('nav.robot'),      path: '/robot',      icon: <SmartToy /> },
    { label: t('nav.logs'),       path: '/logs',       icon: <ListAlt /> },
    { label: t('nav.settings'),   path: '/settings',   icon: <Settings /> },
    { label: t('nav.about'),      path: '/about',      icon: <Info /> },
    { label: t('nav.help'),       path: '/help',       icon: <HelpOutline /> },
    { label: t('nav.donate'),     path: '/donate',     icon: <Favorite /> },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    if (variant === 'temporary') onClose();
  };

  const content = (
    <>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize="1.5rem">💤</Typography>
          <Typography variant="h6" fontWeight="bold">{t('app.name')}</Typography>
        </Box>
        {variant === 'permanent' && (
          <IconButton size="small" onClick={() => setMenuPinned(!settings.menuPinned)} title="Pin menu">
            <PushPin fontSize="small" />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List>
        {NAV_ITEMS.map(({ label, path, icon }) => (
          <ListItem key={path} disablePadding>
            <ListItemButton selected={pathname === path} onClick={() => handleNav(path)}>
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
      anchor={sidebarAnchor as 'left' | 'right'}
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
