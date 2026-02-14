// frontend/src/pages/VideoAnalyticsPage.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
} from '@mui/material';
import {
  Visibility,
  Favorite,
  Comment,
  LockOpen,
  TrendingUp,
  Info,
  Close,
  FilterList,
} from '@mui/icons-material';
import { getVideoAnalytics, getVideoDetailedAnalytics } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface VideoAnalytics {
  videoId: string;
  title: string;
  description?: string;
  type: 'reel' | 'episode' | 'series';
  thumbnailUrl?: string;
  views: number;
  likes: number;
  comments: number;
  coinUnlocks: number;
  adUnlocks: number;
  totalUnlocks: number;
  coinTransactions: number;
  seasonId?: any;
  episodeNumber?: number | null;
  episodeCount?: number;
  adStatus: 'locked' | 'unlocked' | null;
  status: string;
  isPublished: boolean;
  createdAt: string;
  uploadedBy?: any;
}

interface Summary {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalCoinUnlocks: number;
  totalAdUnlocks: number;
  totalUnlocks: number;
}

interface DetailedAnalytics {
  video: any;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    coinUnlocks: number;
    adUnlocks: number;
    totalUnlocks: number;
    coinTransactions: number;
  };
  rates: {
    engagementRate: number;
    unlockRate: number;
    coinUnlockRate: number;
    adUnlockRate: number;
  };
  recent: {
    coinUnlocks: number;
    adUnlocks: number;
    views: number;
  };
  details: {
    comments: any[];
    likes: any[];
    coinUnlockUsers: any[];
    adUnlockUsers: any[];
    coinTransactions: any[];
  };
}

const VideoAnalyticsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [analytics, setAnalytics] = useState<VideoAnalytics[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'views' | 'comments' | 'likes' | 'coin_unlocks' | 'ad_unlocks' | 'total_unlocks'>('views');
  const [sort, setSort] = useState<'asc' | 'desc'>('desc');
  const [typeFilter, setTypeFilter] = useState<'all' | 'episode' | 'series'>('all');
  const [selectedVideo, setSelectedVideo] = useState<VideoAnalytics | null>(null);
  const [detailedAnalytics, setDetailedAnalytics] = useState<DetailedAnalytics | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [filter, sort, typeFilter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getVideoAnalytics({
        filter,
        sort,
        limit: 100,
        type: typeFilter !== 'all' ? typeFilter : undefined,
      });
      setAnalytics(response.data || []);
      setSummary(response.summary || null);
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      setError(err.response?.data?.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (video: VideoAnalytics) => {
    setSelectedVideo(video);
    setDetailDialogOpen(true);
    setDetailLoading(true);
    setDetailedAnalytics(null);
    try {
      const response = await getVideoDetailedAnalytics(video.videoId);
      setDetailedAnalytics(response.data || null);
    } catch (err: any) {
      console.error('Failed to fetch detailed analytics:', err);
      setError(err.response?.data?.message || 'Failed to fetch detailed analytics');
    } finally {
      setDetailLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFilterIcon = (filterType: string) => {
    switch (filterType) {
      case 'views':
        return <Visibility />;
      case 'comments':
        return <Comment />;
      case 'likes':
        return <Favorite />;
      case 'coin_unlocks':
        return <LockOpen />;
      case 'ad_unlocks':
        return <LockOpen />;
      case 'total_unlocks':
        return <LockOpen />;
      default:
        return <TrendingUp />;
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Video Analytics Dashboard
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Filter By</InputLabel>
              <Select
                value={filter}
                label="Filter By"
                onChange={(e) => setFilter(e.target.value as any)}
              >
                <MenuItem value="views">Views</MenuItem>
                <MenuItem value="comments">Comments</MenuItem>
                <MenuItem value="likes">Likes</MenuItem>
                <MenuItem value="coin_unlocks">Coin Unlocks</MenuItem>
                <MenuItem value="ad_unlocks">Ad Unlocks</MenuItem>
                <MenuItem value="total_unlocks">Total Unlocks</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Sort Order</InputLabel>
              <Select
                value={sort}
                label="Sort Order"
                onChange={(e) => setSort(e.target.value as 'asc' | 'desc')}
              >
                <MenuItem value="desc">Descending</MenuItem>
                <MenuItem value="asc">Ascending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Video Type</InputLabel>
              <Select
                value={typeFilter}
                label="Video Type"
                onChange={(e) => setTypeFilter(e.target.value as any)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="episode">Episodes</MenuItem>
                <MenuItem value="series">Series (Webseries)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Videos
                </Typography>
                <Typography variant="h4">{summary.totalVideos}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Views
                </Typography>
                <Typography variant="h4">{formatNumber(summary.totalViews)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Likes
                </Typography>
                <Typography variant="h4">{formatNumber(summary.totalLikes)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Unlocks
                </Typography>
                <Typography variant="h4">{formatNumber(summary.totalUnlocks)}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {summary.totalCoinUnlocks} coins, {summary.totalAdUnlocks} ads
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Analytics Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Thumbnail</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                    {getFilterIcon(filter)}
                    Views
                  </Box>
                </TableCell>
                <TableCell align="right">Likes</TableCell>
                <TableCell align="right">Comments</TableCell>
                <TableCell align="right">Coin Unlocks</TableCell>
                <TableCell align="right">Ad Unlocks</TableCell>
                <TableCell align="right">Total Unlocks</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analytics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography color="textSecondary" py={4}>
                      No videos found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                analytics.map((video) => (
                  <TableRow key={video.videoId} hover>
                    <TableCell>
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 60,
                            height: 40,
                            bgcolor: 'grey.300',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="caption" color="textSecondary">
                            No Image
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {video.title}
                      </Typography>
                      {video.type === 'episode' && video.episodeNumber && (
                        <Typography variant="caption" color="textSecondary">
                          Episode {video.episodeNumber}
                        </Typography>
                      )}
                      {video.type === 'series' && video.episodeCount !== undefined && (
                        <Typography variant="caption" color="textSecondary">
                          {video.episodeCount} Episodes
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={video.type === 'series' ? 'Series' : video.type}
                        size="small"
                        color={video.type === 'series' ? 'secondary' : video.type === 'episode' ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                        <Visibility fontSize="small" color="action" />
                        {formatNumber(video.views)}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                        <Favorite fontSize="small" color="error" />
                        {formatNumber(video.likes)}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                        <Comment fontSize="small" color="action" />
                        {formatNumber(video.comments)}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatNumber(video.coinUnlocks)}
                        size="small"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatNumber(video.adUnlocks)}
                        size="small"
                        color="secondary"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatNumber(video.totalUnlocks)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(video)}
                        color="primary"
                      >
                        <Info />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Detailed Analytics Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Detailed Analytics: {selectedVideo?.title}
            </Typography>
            <IconButton onClick={() => setDetailDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : detailedAnalytics ? (
            <Box>
              {/* Metrics Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Views
                      </Typography>
                      <Typography variant="h5">{formatNumber(detailedAnalytics.metrics.views)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Likes
                      </Typography>
                      <Typography variant="h5">{formatNumber(detailedAnalytics.metrics.likes)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Comments
                      </Typography>
                      <Typography variant="h5">{formatNumber(detailedAnalytics.metrics.comments)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Unlocks
                      </Typography>
                      <Typography variant="h5">{formatNumber(detailedAnalytics.metrics.totalUnlocks)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Rates */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography color="textSecondary" gutterBottom>
                      Engagement Rate
                    </Typography>
                    <Typography variant="h6">{detailedAnalytics.rates.engagementRate}%</Typography>
                  </Paper>
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography color="textSecondary" gutterBottom>
                      Unlock Rate
                    </Typography>
                    <Typography variant="h6">{detailedAnalytics.rates.unlockRate}%</Typography>
                  </Paper>
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography color="textSecondary" gutterBottom>
                      Coin Unlock Rate
                    </Typography>
                    <Typography variant="h6">{detailedAnalytics.rates.coinUnlockRate}%</Typography>
                  </Paper>
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography color="textSecondary" gutterBottom>
                      Ad Unlock Rate
                    </Typography>
                    <Typography variant="h6">{detailedAnalytics.rates.adUnlockRate}%</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Recent Activity */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Activity (Last 7 Days)
                </Typography>
                <Grid container spacing={2}>
                  <Grid xs={4}>
                    <Typography color="textSecondary">Coin Unlocks</Typography>
                    <Typography variant="h6">{detailedAnalytics.recent.coinUnlocks}</Typography>
                  </Grid>
                  <Grid xs={4}>
                    <Typography color="textSecondary">Ad Unlocks</Typography>
                    <Typography variant="h6">{detailedAnalytics.recent.adUnlocks}</Typography>
                  </Grid>
                  <Grid xs={4}>
                    <Typography color="textSecondary">Views</Typography>
                    <Typography variant="h6">{detailedAnalytics.recent.views}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Unlock Breakdown */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Coin Unlocks ({detailedAnalytics.details.coinUnlockUsers.length})
                    </Typography>
                    <List>
                      {detailedAnalytics.details.coinUnlockUsers.slice(0, 10).map((user: any) => (
                        <ListItem key={user._id}>
                          <ListItemText
                            primary={user.name || user.username || user.phone}
                            secondary={`Unlocked: ${formatDate(new Date(user.unlockedAt).toISOString())}`}
                          />
                        </ListItem>
                      ))}
                      {detailedAnalytics.details.coinUnlockUsers.length > 10 && (
                        <Typography variant="caption" color="textSecondary" sx={{ pl: 2 }}>
                          ...and {detailedAnalytics.details.coinUnlockUsers.length - 10} more
                        </Typography>
                      )}
                    </List>
                  </Paper>
                </Grid>
                <Grid xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Ad Unlocks ({detailedAnalytics.details.adUnlockUsers.length})
                    </Typography>
                    <List>
                      {detailedAnalytics.details.adUnlockUsers.slice(0, 10).map((user: any) => (
                        <ListItem key={user._id}>
                          <ListItemText
                            primary={user.name || user.username || user.phone}
                            secondary={`Unlocked: ${formatDate(new Date(user.unlockedAt).toISOString())}`}
                          />
                        </ListItem>
                      ))}
                      {detailedAnalytics.details.adUnlockUsers.length > 10 && (
                        <Typography variant="caption" color="textSecondary" sx={{ pl: 2 }}>
                          ...and {detailedAnalytics.details.adUnlockUsers.length - 10} more
                        </Typography>
                      )}
                    </List>
                  </Paper>
                </Grid>
              </Grid>

              {/* Comments */}
              {detailedAnalytics.details.comments.length > 0 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Comments ({detailedAnalytics.details.comments.length})
                  </Typography>
                  <List>
                    {detailedAnalytics.details.comments.slice(0, 10).map((comment: any, index: number) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <Avatar sx={{ mr: 2 }}>
                            {comment.user?.name?.[0] || comment.user?.username?.[0] || 'U'}
                          </Avatar>
                          <ListItemText
                            primary={comment.user?.name || comment.user?.username || comment.user?.phone || 'Anonymous'}
                            secondary={comment.text}
                          />
                        </ListItem>
                        {index < detailedAnalytics.details.comments.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                    {detailedAnalytics.details.comments.length > 10 && (
                      <Typography variant="caption" color="textSecondary" sx={{ pl: 2 }}>
                        ...and {detailedAnalytics.details.comments.length - 10} more comments
                      </Typography>
                    )}
                  </List>
                </Paper>
              )}
            </Box>
          ) : (
            <Typography color="textSecondary">No detailed analytics available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VideoAnalyticsPage;
