import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Box, CssBaseline, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Button, ListItemButton, IconButton, useTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DashboardIcon from '@mui/icons-material/Dashboard';
import QuizIcon from '@mui/icons-material/Quiz';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PeopleIcon from '@mui/icons-material/People';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import RoleManagementPage from './pages/RoleManagementPage';
// import VideoManagementPage from './pages/VideoManagementPage';
import VideoAnalyticsPage from './pages/VideoAnalyticsPage';
import CashfreeAnalyticsPage from './pages/CashfreeAnalyticsPage';
import UserManagementPage from './pages/UserManagementPage';
import WebSeriesPage from './pages/WebSeriesPage';
import EpisodePlayerPage from './pages/EpisodePlayerPage';
import SeasonDetailPage from './pages/SeasonDetailPage';
import FcmCampaignPage from './pages/FcmCampaignPage';
import GeneralNotificationPage from './pages/GeneralNotificationPage';
import AutomatedNotificationsPage from './pages/AutomatedNotificationsPage';
import CarouselManagementPage from './pages/CarouselManagementPage';
const drawerWidth = 220;

const theme = createTheme({
  palette: {
    primary: { 
      main: '#1f2937',
      light: '#374151',
      dark: '#111827',
      contrastText: '#ffffff',
    },
    secondary: { 
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#1d4ed8',
    },
    success: {
      main: '#10b981',
      light: '#6ee7b7',
    },
    error: {
      main: '#ef4444',
      light: '#fca5a5',
    },
    warning: {
      main: '#f59e0b',
      light: '#fcd34d',
    },
    info: {
      main: '#06b6d4',
      light: '#67e8f9',
    },
    background: { 
      default: '#f9fafb',
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
          border: '1px solid #e5e7eb',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
            borderColor: '#d1d5db',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
          border: '1px solid #e5e7eb',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRight: '4px solid #3b82f6',
            '& .MuiListItemIcon-root': {
              color: '#3b82f6',
            },
          },
        },
      },
    },
  },
});

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  // { text: 'Video Management', icon: <DashboardIcon />, path: '/video-management' },
  { text: 'Role Management', icon: <QuizIcon />, path: '/role-management' },
  { text: 'Web Series', icon: <DashboardIcon />, path: '/webseries' },
  { text: 'Carousel Management', icon: <ViewCarouselIcon />, path: '/carousel-management' },
  // { text: 'General Notification', icon: <NotificationsIcon />, path: '/general-notification' },
  // { text: 'Automated Notifications', icon: <ScheduleIcon />, path: '/automated-notifications' },
  { text: 'FCM Campaigns', icon: <NotificationsIcon />, path: '/fcm-campaigns' },
  { text: 'Video Analytics', icon: <BarChartIcon />, path: '/video-analytics' },
  { text: 'Cashfree Revenue Analytics', icon: <AccountBalanceWalletIcon />, path: '/cashfree-analytics' },
  { text: 'User Management', icon: <PeopleIcon />, path: '/user-management' },
];
const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading, logout, admin } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const drawerContent = (
    <>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #1f2937 0%, #3b82f6 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          DesiDrama
        </Typography>
      </Toolbar>
      <Box sx={{ overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <List sx={{ flex: 1 }}>
          {menuItems.map((item) => (
            <ListItem disablePadding key={item.text} sx={{ mb: 0.5, px: 1 }}>
              <ListItemButton 
                component={Link} 
                to={item.path} 
                selected={location.pathname === item.path}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  borderRadius: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    sx: { fontSize: '0.9rem', fontWeight: 500 }
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
              Admin Panel
            </Typography>
          </Box>
          
          {admin && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {admin.email}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {admin.role || 'Admin'}
                </Typography>
              </Box>
              <Button 
                color="inherit" 
                onClick={logout} 
                sx={{ 
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                Logout
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              width: drawerWidth, 
              boxSizing: 'border-box',
              background: 'linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)',
              borderRight: '1px solid #e5e7eb',
            },
          }}
        >
          {drawerContent}
        </Drawer>
        
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              width: drawerWidth, 
              boxSizing: 'border-box',
              background: 'linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)',
              borderRight: '1px solid #e5e7eb',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          bgcolor: 'background.default', 
          minHeight: '100vh',
          width: { md: `calc(100% - ${drawerWidth}px)` } 
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/role-management" element={<RoleManagementPage />} />
            {/* <Route path="/video-management" element={<VideoManagementPage />} /> */}
            <Route path="/video-analytics" element={<VideoAnalyticsPage />} />
            <Route path="/cashfree-analytics" element={<CashfreeAnalyticsPage />} />
            <Route path="/user-management" element={<UserManagementPage />} />
            <Route path="/webseries" element={<WebSeriesPage />} />
            <Route path="/webseries/:seasonId" element={<SeasonDetailPage />} />
            <Route path="/episode/:episodeId" element={<EpisodePlayerPage />} />
            <Route path="/carousel-management" element={<CarouselManagementPage />} />
            {/* <Route path="/general-notification" element={<GeneralNotificationPage />} /> */}
            {/* <Route path="/automated-notifications" element={<AutomatedNotificationsPage />} /> */}
            <Route path="/fcm-campaigns" element={<FcmCampaignPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <MainLayout />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;