import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import {
  sendInAppBroadcastNotification,
  getInAppBroadcastHistory,
  uploadNotificationImage,
  setActiveBanner,
  disableActiveBanner,
  getActiveBanners,
  disableBannerById,
  showBannerFromLog,
  deleteBroadcastLog,
} from '../services/api';

const getImageFullUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const notificationTypes = [
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
  { value: 'promo', label: 'Promo' },
  { value: 'banner', label: 'Banner (full-screen popup on app open until disabled)' },
];

interface BroadcastLog {
  _id: string;
  title: string;
  message: string;
  type: string;
  imageUrl?: string;
  action?: { label: string; route: string };
  userCount: number;
  sentAt: string;
}

const NotificationsPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error' | 'promo' | 'banner'>('promo');
  const [actionLabel, setActionLabel] = useState('Watch now');
  const [actionRoute, setActionRoute] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<BroadcastLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeBanners, setActiveBannersState] = useState<{ _id: string; title: string; message: string }[]>([]);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; row: BroadcastLog } | null>(null);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res: any = await getInAppBroadcastHistory({ page: 1, limit: 100 });
      const body = res?.data;
      const list = Array.isArray(body?.data) ? body.data : [];
      setHistory(list as BroadcastLog[]);
    } catch (err: any) {
      console.warn('Failed to fetch broadcast history:', err?.message || err);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchActiveBanners();
  }, []);

  const fetchActiveBanners = async () => {
    setBannerLoading(true);
    try {
      const res: any = await getActiveBanners();
      const data = res?.data ?? res;
      const list = Array.isArray(data?.banners) ? data.banners : [];
      setActiveBannersState(list);
    } catch {
      setActiveBannersState([]);
    } finally {
      setBannerLoading(false);
    }
  };

  useEffect(() => {
    if (success) fetchActiveBanners();
  }, [success]);

  useEffect(() => {
    if (success) fetchHistory();
  }, [success]);

  // Refetch when tab becomes visible (user switches back)
  useEffect(() => {
    const onFocus = () => {
      fetchHistory();
      fetchActiveBanners();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WebP, GIF)');
      return;
    }
    setImageUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res: any = await uploadNotificationImage(formData);
      const url = res?.data?.imageUrl ?? res?.imageUrl ?? '';
      setImageUrl(url);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to upload image');
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (type === 'banner') {
        await setActiveBanner({
          title,
          message,
          imageUrl: imageUrl || undefined,
          actionLabel: actionRoute ? actionLabel : undefined,
          actionRoute: actionRoute || undefined,
        });
      } else {
        await sendInAppBroadcastNotification({
          title,
          message,
          type,
          imageUrl: imageUrl || undefined,
          actionLabel: actionRoute ? actionLabel : undefined,
          actionRoute: actionRoute || undefined,
        });
      }

      setSuccess(true);
      setTitle('');
      setMessage('');
      setActionRoute('');
      setImageUrl('');
      await fetchActiveBanners();
      if (type === 'banner') {
        setHistory((prev) => [
          {
            _id: `banner-${Date.now()}`,
            title,
            message,
            type: 'banner',
            imageUrl: imageUrl || undefined,
            action: actionRoute && actionLabel ? { label: actionLabel, route: actionRoute } : undefined,
            userCount: 0,
            sentAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
      await fetchHistory();
    } catch (err: any) {
      setError(err.userMessage || err.message || 'Failed to send notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisableAllBanners = async () => {
    setBannerLoading(true);
    setError(null);
    try {
      await disableActiveBanner();
      setActiveBannersState([]);
      setSuccess(true);
    } catch (err: any) {
      setError(err.userMessage || err.message || 'Failed to disable banners');
    } finally {
      setBannerLoading(false);
    }
  };

  const handleDisableBannerById = async (bannerId: string) => {
    setError(null);
    try {
      await disableBannerById(bannerId);
      setActiveBannersState((prev) => prev.filter((b) => b._id !== bannerId));
      setSuccess(true);
    } catch (err: any) {
      setError(err.userMessage || err.message || 'Failed to remove banner');
    }
  };

  const handleMenuClose = () => setMenuAnchor(null);

  const handleShowBanner = async () => {
    if (!menuAnchor) return;
    const { row } = menuAnchor;
    handleMenuClose();
    setError(null);
    try {
      await showBannerFromLog(row._id);
      setSuccess(true);
      fetchActiveBanners();
    } catch (err: any) {
      setError(err.userMessage || err.message || 'Failed to show banner');
    }
  };

  const handleStopBanner = async () => {
    handleMenuClose();
    await handleDisableAllBanners();
  };

  const handleDeleteLog = async () => {
    if (!menuAnchor) return;
    const { row } = menuAnchor;
    handleMenuClose();
    setError(null);
    try {
      await deleteBroadcastLog(row._id);
      setSuccess(true);
      fetchHistory();
    } catch (err: any) {
      setError(err.userMessage || err.message || 'Failed to delete');
    }
  };

  return (
    <Box maxWidth={600} mx="auto">
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mt: 2,
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" fontWeight={700} mb={1} color="primary">
          In-App Notifications
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Send in-app notifications directly to all active users. Use this for announcements like
          new series drops, special events, or promotions. These do not use FCM push.
        </Typography>

        <form onSubmit={handleSend}>
          <Stack spacing={2.5}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
            />

            <TextField
              label="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              fullWidth
              required
              multiline
              minRows={3}
            />

            <TextField
              select
              label="Notification Type"
              value={type}
              onChange={(e) =>
                setType(e.target.value as 'info' | 'success' | 'warning' | 'error' | 'promo' | 'banner')
              }
              fullWidth
            >
              {notificationTypes.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Image (optional)
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  variant="outlined"
                  startIcon={<ImageIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                >
                  {imageUploading ? 'Uploading...' : 'Choose from local storage'}
                </Button>
                {imageUrl && (
                  <>
                    <Box
                      component="img"
                      src={getImageFullUrl(imageUrl)}
                      alt="Preview"
                      sx={{
                        width: 80,
                        height: 60,
                        objectFit: 'cover',
                        borderRadius: 1,
                        border: '1px solid #e0e0e0',
                      }}
                    />
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => setImageUrl('')}
                    >
                      Remove
                    </Button>
                  </>
                )}
              </Stack>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Action Label"
                value={actionLabel}
                onChange={(e) => setActionLabel(e.target.value)}
                fullWidth
                helperText="Optional button label (e.g. “Watch now”)"
              />
              <TextField
                label="Action Route"
                value={actionRoute}
                onChange={(e) => setActionRoute(e.target.value)}
                fullWidth
                placeholder="/series/123 or /episode/456"
                helperText="Optional deep link route inside the app"
              />
            </Stack>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 1 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send In-App Notification to All Users'}
            </Button>
          </Stack>
        </form>
      </Paper>

      {activeBanners.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mt: 4,
            borderRadius: 3,
            border: '2px solid',
            borderColor: 'warning.main',
          }}
        >
          <Typography variant="h6" fontWeight={600} color="warning.main" mb={1}>
            Active Banners ({activeBanners.length}) — shown one by one on app open
          </Typography>
          <Stack spacing={1.5} mb={2}>
            {activeBanners.map((b) => (
              <Box
                key={b._id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  bgcolor: 'rgba(0,0,0,0.04)',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" noWrap sx={{ flex: 1, mr: 1 }}>
                  {b.title} — {b.message}
                </Typography>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  onClick={() => handleDisableBannerById(b._id)}
                >
                  Remove
                </Button>
              </Box>
            ))}
          </Stack>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDisableAllBanners}
            disabled={bannerLoading}
          >
            {bannerLoading ? 'Disabling...' : 'Disable All Banners'}
          </Button>
        </Paper>
      )}

      <Paper elevation={3} sx={{ p: 3, mt: 4, borderRadius: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight={600} color="primary">
              Sent Notifications History
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={() => fetchHistory()}
            disabled={historyLoading}
            sx={{ minWidth: 100 }}
          >
            {historyLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </Box>

        {historyLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={32} />
          </Box>
        ) : !Array.isArray(history) || history.length === 0 ? (
          <Typography color="text.secondary" py={3}>
            No notifications sent yet.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Message</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Users</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Sent At</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Manage
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(Array.isArray(history) ? history : []).map((row) => (
                  <TableRow key={row._id} hover>
                    <TableCell>{row.title}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>{row.message}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.type}
                        size="small"
                        color={row.type === 'banner' ? 'warning' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{row.type === 'banner' ? '—' : row.userCount}</TableCell>
                    <TableCell>{formatDate(row.sentAt)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => setMenuAnchor({ el: e.currentTarget, row })}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {menuAnchor?.row.type === 'banner' && (
          <>
            <MenuItem onClick={handleShowBanner}>
              <ListItemIcon>
                <PlayArrowIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Show</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleStopBanner}>
              <ListItemIcon>
                <StopIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Stop</ListItemText>
            </MenuItem>
          </>
        )}
        <MenuItem onClick={handleDeleteLog} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Notification sent successfully to all active users.
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={4000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationsPage;