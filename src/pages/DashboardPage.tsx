import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Chip,
} from '@mui/material';
import {
  VideoLibrary,
  People,
  Visibility,
  Favorite,
  Comment,
  AccountBalanceWallet,
  TrendingUp,
  Web,
  Block,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardAnalytics } from '../services/api';
import logger from '../utils/logger';

interface DashboardAnalytics {
  overview: {
    videos: {
      total: number;
      episodes: number;
      reels: number;
      seasons: number;
    };
    users: {
      total: number;
      active: number;
      blocked: number;
      commentBanned: number;
    };
    engagement: {
      views: number;
      likes: number;
      comments: number;
    };
    revenue: {
      total: number;
      transactions: number;
      coinsSold: number;
      averageOrderValue: number;
    };
  };
  recent: {
    users: number;
    purchases: number;
    revenue: number;
    views: number;
  };
  topContent: {
    videos: any[];
    seasons: any[];
  };
}

const DashboardPage: React.FC = () => {
  const { admin } = useAuth();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const response: any = await getDashboardAnalytics();
      setAnalytics(response.data || null);
    } catch (err: any) {
      logger.error('DashboardPage', 'Failed to fetch dashboard analytics', err);
      setError(err.userMessage || err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            background: 'linear-gradient(135deg, #1f2937 0%, #3b82f6 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.5,
          }}
        >
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back to your admin panel. Here's your performance overview.
        </Typography>
      </Box>

      {error && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            bgcolor: '#fee2e2',
            borderLeft: '4px solid #ef4444',
            color: '#7f1d1d',
          }}
        >
          <Typography fontWeight="500">{error}</Typography>
        </Paper>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={50} sx={{ color: '#3b82f6' }} />
        </Box>
      ) : analytics ? (
        <>
          {/* Welcome Card */}
          <Paper
            sx={{
              p: 3,
              mb: 4,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 2,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#1f2937',
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  Welcome Back, {admin?.email}!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Role: <span style={{ fontWeight: 500, color: '#3b82f6' }}>{admin?.role || 'Admin'}</span>
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right', opacity: 0.6 }}>
                <Typography variant="caption" color="text.secondary">
                  Last updated: {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Content Overview Section */}
          <Typography
            variant="h5"
            fontWeight="bold"
            gutterBottom
            sx={{ mt: 4, mb: 2 }}
          >
            Content Overview
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid xs={12} sm={6} md={3}>
              <Card sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 100,
                    height: 100,
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: 1.5,
                      }}
                    >
                      <VideoLibrary sx={{ color: '#3b82f6' }} />
                    </Box>
                    <Typography color="textSecondary" sx={{ fontSize: '0.875rem' }}>
                      Total Videos
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {analytics.overview.videos.total}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {analytics.overview.videos.episodes} Episodes • {analytics.overview.videos.reels} Reels
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <Card sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 100,
                    height: 100,
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: 1.5,
                      }}
                    >
                      <Web sx={{ color: '#10b981' }} />
                    </Box>
                    <Typography color="textSecondary" sx={{ fontSize: '0.875rem' }}>
                      Web Series
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {analytics.overview.videos.seasons}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active Series
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <Card sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 100,
                    height: 100,
                    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: 'rgba(6, 182, 212, 0.1)',
                        borderRadius: 1.5,
                      }}
                    >
                      <Visibility sx={{ color: '#06b6d4' }} />
                    </Box>
                    <Typography color="textSecondary" sx={{ fontSize: '0.875rem' }}>
                      Total Views
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {formatNumber(analytics.overview.engagement.views)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <Card sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 100,
                    height: 100,
                    background: 'radial-gradient(circle, rgba(244, 63, 94, 0.1) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: 'rgba(244, 63, 94, 0.1)',
                        borderRadius: 1.5,
                      }}
                    >
                      <Favorite sx={{ color: '#f43f5e' }} />
                    </Box>
                    <Typography color="textSecondary" sx={{ fontSize: '0.875rem' }}>
                      Total Likes
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {formatNumber(analytics.overview.engagement.likes)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Users Overview */}
          <Typography
            variant="h5"
            fontWeight="bold"
            gutterBottom
            sx={{ mt: 4, mb: 2 }}
          >
            Users Overview
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid xs={12} sm={6} md={3}>
              <Card sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box sx={{ p: 1.5, bgcolor: 'rgba(59, 130, 246, 0.1)', borderRadius: 1.5 }}>
                      <People sx={{ color: '#3b82f6' }} />
                    </Box>
                    <Typography color="textSecondary" sx={{ fontSize: '0.875rem' }}>Total Users</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>{analytics.overview.users.total}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <Card sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box sx={{ p: 1.5, bgcolor: 'rgba(16, 185, 129, 0.1)', borderRadius: 1.5 }}>
                      <TrendingUp sx={{ color: '#10b981' }} />
                    </Box>
                    <Typography color="textSecondary" sx={{ fontSize: '0.875rem' }}>Active Users</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: '#10b981' }}>{analytics.overview.users.active}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <Card sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: 'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box sx={{ p: 1.5, bgcolor: 'rgba(239, 68, 68, 0.1)', borderRadius: 1.5 }}>
                      <Block sx={{ color: '#ef4444' }} />
                    </Box>
                    <Typography color="textSecondary" sx={{ fontSize: '0.875rem' }}>Blocked Users</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: '#ef4444' }}>{analytics.overview.users.blocked}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <Card sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box sx={{ p: 1.5, bgcolor: 'rgba(245, 158, 11, 0.1)', borderRadius: 1.5 }}>
                      <Comment sx={{ color: '#f59e0b' }} />
                    </Box>
                    <Typography color="textSecondary" sx={{ fontSize: '0.875rem' }}>Comment Banned</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: '#f59e0b' }}>{analytics.overview.users.commentBanned}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Engagement Overview */}
          <Typography
            variant="h5"
            fontWeight="bold"
            gutterBottom
            sx={{ mt: 4, mb: 2 }}
          >
            Engagement Overview
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid xs={12} sm={4}>
              <Card sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box sx={{ p: 1.5, bgcolor: 'rgba(6, 182, 212, 0.1)', borderRadius: 1.5 }}>
                      <Visibility sx={{ color: '#06b6d4' }} />
                    </Box>
                    <Typography color="textSecondary" sx={{ fontSize: '0.875rem' }}>Total Views</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>{formatNumber(analytics.overview.engagement.views)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={12} sm={4}>
              <Card sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: 'radial-gradient(circle, rgba(244, 63, 94, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box sx={{ p: 1.5, bgcolor: 'rgba(244, 63, 94, 0.1)', borderRadius: 1.5 }}>
                      <Favorite sx={{ color: '#f43f5e' }} />
                    </Box>
                    <Typography color="textSecondary" sx={{ fontSize: '0.875rem' }}>Total Likes</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>{formatNumber(analytics.overview.engagement.likes)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={12} sm={4}>
              <Card sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box sx={{ p: 1.5, bgcolor: 'rgba(59, 130, 246, 0.1)', borderRadius: 1.5 }}>
                      <Comment sx={{ color: '#3b82f6' }} />
                    </Box>
                    <Typography color="textSecondary" sx={{ fontSize: '0.875rem' }}>Total Comments</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>{formatNumber(analytics.overview.engagement.comments)}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Revenue Overview */}
          <Typography
            variant="h5"
            fontWeight="bold"
            gutterBottom
            sx={{ mt: 4, mb: 2 }}
          >
            Revenue Overview
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid xs={12} sm={6} md={3}>
              <Card sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box sx={{ p: 1.5, bgcolor: 'rgba(16, 185, 129, 0.1)', borderRadius: 1.5 }}>
                      <AccountBalanceWallet sx={{ color: '#10b981' }} />
                    </Box>
                    <Typography color="textSecondary" sx={{ fontSize: '0.875rem' }}>Total Revenue</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: '#10b981' }}>
                    {formatCurrency(analytics.overview.revenue.total)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <Card sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box sx={{ p: 1.5, bgcolor: 'rgba(59, 130, 246, 0.1)', borderRadius: 1.5 }}>
                      <TrendingUp sx={{ color: '#3b82f6' }} />
                    </Box>
                    <Typography color="textSecondary" sx={{ fontSize: '0.875rem' }}>Transactions</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>{analytics.overview.revenue.transactions}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <Card sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box sx={{ p: 1.5, bgcolor: 'rgba(245, 158, 11, 0.1)', borderRadius: 1.5 }}>
                      <AccountBalanceWallet sx={{ color: '#f59e0b' }} />
                    </Box>
                    <Typography color="textSecondary" sx={{ fontSize: '0.875rem' }}>Coins Sold</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>{formatNumber(analytics.overview.revenue.coinsSold)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <Card sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box sx={{ p: 1.5, bgcolor: 'rgba(139, 92, 246, 0.1)', borderRadius: 1.5 }}>
                      <TrendingUp sx={{ color: '#8b5cf6' }} />
                    </Box>
                    <Typography color="textSecondary" sx={{ fontSize: '0.875rem' }}>Avg. Order Value</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {formatCurrency(analytics.overview.revenue.averageOrderValue)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recent Activity (Last 7 Days) */}
          <Typography
            variant="h5"
            fontWeight="bold"
            gutterBottom
            sx={{ mt: 4, mb: 2 }}
          >
            Recent Activity (Last 7 Days)
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem' }}>
                    New Users
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{analytics.recent.users}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem' }}>
                    Coin Purchases
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{analytics.recent.purchases}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem' }}>
                    Revenue (7 Days)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#10b981' }}>
                    {formatCurrency(analytics.recent.revenue)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem' }}>
                    Recent Views
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatNumber(analytics.recent.views)}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Top Content */}
          {(analytics.topContent.videos.length > 0 || analytics.topContent.seasons.length > 0) && (
            <>
              <Typography
                variant="h5"
                fontWeight="bold"
                gutterBottom
                sx={{ mt: 4, mb: 2 }}
              >
                Top Performing Content
              </Typography>
              <Grid container spacing={2}>
                {analytics.topContent.videos.length > 0 && (
                  <Grid xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        🎬 Top Videos
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {analytics.topContent.videos.map((video: any, index: number) => (
                          <Box
                            key={index}
                            sx={{
                              p: 2,
                              bgcolor: index === 0 ? 'rgba(59, 130, 246, 0.05)' : 'rgba(107, 114, 128, 0.03)',
                              borderLeft: index === 0 ? '4px solid #3b82f6' : '4px solid #d1d5db',
                              borderRadius: 1,
                              transition: 'all 0.2s',
                              '&:hover': {
                                bgcolor: index === 0 ? 'rgba(59, 130, 246, 0.08)' : 'rgba(107, 114, 128, 0.05)',
                              }
                            }}
                          >
                            <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: '#1f2937',
                                }}
                              >
                                {index + 1}. {video.seasonId?.title && `${video.seasonId.title} - `}{video.title}
                              </Typography>
                              {index === 0 && (
                                <Box
                                  sx={{
                                    display: 'inline-block',
                                    px: 1.5,
                                    py: 0.5,
                                    bgcolor: 'rgba(59, 130, 246, 0.2)',
                                    color: '#3b82f6',
                                    borderRadius: 0.5,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  #1
                                </Box>
                              )}
                            </Box>
                            <Box display="flex" gap={1} flexWrap="wrap">
                              <Chip
                                label={`${formatNumber(video.views)} views`}
                                size="small"
                                icon={<Visibility sx={{ fontSize: '1rem !important' }} />}
                                sx={{ bgcolor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}
                              />
                              <Chip
                                label={`${formatNumber(video.likes?.length || 0)} likes`}
                                size="small"
                                icon={<Favorite sx={{ fontSize: '1rem !important' }} />}
                                sx={{ bgcolor: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}
                              />
                              <Chip
                                label={video.type}
                                size="small"
                                sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', textTransform: 'capitalize' }}
                              />
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                )}
                {analytics.topContent.seasons.length > 0 && (
                  <Grid xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        🎥 Top Series
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {analytics.topContent.seasons.map((season: any, index: number) => (
                          <Box
                            key={index}
                            sx={{
                              p: 2,
                              bgcolor: index === 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(107, 114, 128, 0.03)',
                              borderLeft: index === 0 ? '4px solid #10b981' : '4px solid #d1d5db',
                              borderRadius: 1,
                              transition: 'all 0.2s',
                              '&:hover': {
                                bgcolor: index === 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(107, 114, 128, 0.05)',
                              }
                            }}
                          >
                            <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: '#1f2937',
                                }}
                              >
                                {index + 1}. {season.title}
                              </Typography>
                              {index === 0 && (
                                <Box
                                  sx={{
                                    display: 'inline-block',
                                    px: 1.5,
                                    py: 0.5,
                                    bgcolor: 'rgba(16, 185, 129, 0.2)',
                                    color: '#10b981',
                                    borderRadius: 0.5,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  #1
                                </Box>
                              )}
                            </Box>
                            <Box display="flex" gap={1} flexWrap="wrap">
                              <Chip
                                label={`${formatNumber(season.totalViews || 0)} views`}
                                size="small"
                                icon={<Visibility sx={{ fontSize: '1rem !important' }} />}
                                sx={{ bgcolor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}
                              />
                              <Chip
                                label={`${season.episodeCount || 0} episodes`}
                                size="small"
                                icon={<Web sx={{ fontSize: '1rem !important' }} />}
                                sx={{ bgcolor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}
                              />
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Typography color="textSecondary">No analytics data available</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default DashboardPage;