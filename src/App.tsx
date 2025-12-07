import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Box, CssBaseline, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Button, ListItemButton } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DashboardIcon from '@mui/icons-material/Dashboard';
import QuizIcon from '@mui/icons-material/Quiz';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import RoleManagementPage from './pages/RoleManagementPage';
import VideoManagementPage from './pages/VideoManagementPage';
import WebSeriesPage from './pages/WebSeriesPage';
import EpisodePlayerPage from './pages/EpisodePlayerPage';
import SeasonDetailPage from './pages/SeasonDetailPage';

const drawerWidth = 220;

const theme = createTheme({
  palette: {
    primary: { main: '#0a66c2' },
    background: { default: '#f3f6f8' },
  },
  typography: {
    fontFamily: 'Segoe UI, Arial, sans-serif',
  },
});

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Video Management', icon: <DashboardIcon />, path: '/video-management' },
  { text: 'Role Management', icon: <QuizIcon />, path: '/role-management' },
  { text: 'Web Series', icon: <DashboardIcon />, path: '/webseries' },
  { text: 'General Notification', icon: <NotificationsIcon />, path: '/general-notification' },
  { text: 'Automated Notifications', icon: <ScheduleIcon />, path: '/automated-notifications' },
];

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading, logout, admin } = useAuth(); // Changed user to admin
  const location = useLocation();

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

  // If authenticated, show main layout
  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', background: '#fff' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem disablePadding key={item.text}>
                <ListItemButton component={Link} to={item.path} selected={location.pathname === item.path}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, background: '#0a66c2' }}>
          <Toolbar>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              Admin Panel
            </Typography>
            {admin && (
              <>
                <Typography variant="body2" sx={{ mr: 2 }}>
                  {admin.email}
                </Typography>
                <Button color="inherit" onClick={logout} sx={{ textTransform: 'none' }}>
                  Logout
                </Button>
              </>
            )}
          </Toolbar>
        </AppBar>
        <Toolbar />
        <Box sx={{ p: 3 }}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/role-management" element={<RoleManagementPage />} />
            <Route path="/video-management" element={<VideoManagementPage />} />
            <Route path="/webseries" element={<WebSeriesPage />} />
            <Route path="/webseries/:seasonId" element={<SeasonDetailPage />} />
            <Route path="/episode/:episodeId" element={<EpisodePlayerPage />} />
            {/* Uncomment when these pages are ready */}
            {/* <Route path="/analytics" element={<AnalyticsPage />} /> */}
            {/* <Route path="/user-analytics" element={<UserAnalyticsPage />} /> */}
            {/* <Route path="/general-notification" element={<GeneralNotificationPage />} /> */}
            {/* <Route path="/automated-notifications" element={<AutomatedNotificationsPage />} /> */}
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