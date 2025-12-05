// frontend/src/pages/DashboardPage.tsx

import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { admin } = useAuth();

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Welcome Back!
            </Typography>
            <Typography variant="body1">
              {admin?.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Role: {admin?.role}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Total Videos
            </Typography>
            <Typography variant="h3">0</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Active Admins
            </Typography>
            <Typography variant="h3">0</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Use the sidebar to navigate to different sections of the admin panel.
        </Typography>
      </Paper>
    </Box>
  );
};

export default DashboardPage;