// frontend/src/pages/DashboardPage.tsx

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getAllVideos, getAllAdmins } from '../services/api';

const DashboardPage: React.FC = () => {
  const { admin } = useAuth();
  const [totalVideos, setTotalVideos] = useState<number>(0);
  const [activeAdmins, setActiveAdmins] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch videos
      const videosResponse: any = await getAllVideos();
      const videos = videosResponse.data || videosResponse || [];
      const videosArray = Array.isArray(videos) ? videos : [];
      setTotalVideos(videosArray.length);

      // Fetch admins
      const adminsResponse: any = await getAllAdmins();
      const adminsData = adminsResponse.data?.admins || adminsResponse.data?.data?.admins || [];
      const adminsArray = Array.isArray(adminsData) ? adminsData : [];
      // Count active admins (isActive !== false means active or undefined, which defaults to active)
      const activeCount = adminsArray.filter((admin: any) => admin.isActive !== false).length;
      setActiveAdmins(activeCount);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set to 0 on error to show something
      setTotalVideos(0);
      setActiveAdmins(0);
    } finally {
      setLoading(false);
    }
  };

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
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary">Loading...</Typography>
              </Box>
            ) : (
              <Typography variant="h3">{totalVideos}</Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Active Admins
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary">Loading...</Typography>
              </Box>
            ) : (
              <Typography variant="h3">{activeAdmins}</Typography>
            )}
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