// frontend/src/pages/EpisodePlayerPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Stack,
  Breadcrumbs,
  Link,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  Settings,
  Edit,
  Delete,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { getVideoById, updateVideo, deleteVideo } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface VideoVariant {
  resolution: '360p' | '480p' | '720p' | '1080p';
  url: string;
  size: number;
  duration: number;
}

interface Video {
  _id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  variants?: VideoVariant[];
  episodeNumber: number;
  duration: number;
  status: string;
  isPublished: boolean;
  views: number;
  likes: number;
  seasonId: {
    _id: string;
    title: string;
    seasonNumber: number;
  };
  createdAt: string;
}

// Helper to cache-bust episode poster thumbnails
const getThumbnailWithCacheBust = (thumbnailUrl?: string, updatedAt?: string) => {
  if (!thumbnailUrl) return undefined;
  try {
    const ts = updatedAt ? new Date(updatedAt).getTime() : Date.now();
    return `${thumbnailUrl}?v=${ts}`;
  } catch {
    return `${thumbnailUrl}?v=${Date.now()}`;
  }
};

const EpisodePlayerPage: React.FC = () => {
  const { episodeId } = useParams<{ episodeId: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>('720p');
  const [isPlaying, setIsPlaying] = useState(false);
  const [qualityMenuAnchor, setQualityMenuAnchor] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(true);
  const { isAuthenticated, hasPermission } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (episodeId && isAuthenticated) {
      fetchVideo();
    }
  }, [episodeId, isAuthenticated]);

  useEffect(() => {
    if (video?.variants?.length > 0) {
      const availableQualities = video.variants.map(v => v.resolution);
      const preferredOrder = ['1080p', '720p', '480p', '360p'];
      for (const quality of preferredOrder) {
        if (availableQualities.includes(quality)) {
          setSelectedQuality(quality);
          break;
        }
      }
    }
  }, [video]);

  const fetchVideo = async () => {
    if (!episodeId || !isAuthenticated) return;
    try {
      setPlayerLoading(true);
      setError('');
      setVideoLoadError(false);
      const videoData = await getVideoById(episodeId!);
      
      // DEBUG: Log exact response
      console.log('Full API Response (videoData):', JSON.stringify(videoData, null, 2));
      
      // Handle deeply nested response: {data: {success: true, data: video}} or {data: video} or just video
      let videoObj = null;
      if (videoData.data) {
        // Check if data has nested data (success wrapper)
        if (videoData.data.data) {
          videoObj = videoData.data.data;
        } else {
          videoObj = videoData.data;
        }
      } else if (videoData.video) {
        videoObj = videoData.video;
      } else if (videoData._id) {
        videoObj = videoData;
      }
      
      console.log('Extracted videoObj:', videoObj);
      
      if (!videoObj || !videoObj._id) {
        setError(`Invalid video data: No _id found. Response was: ${JSON.stringify(videoData)}`);
        setVideo(null);
        return;
      }
      
      // Ensure variants is array
      const safeVideo: Video = {
        ...videoObj,
        variants: Array.isArray(videoObj.variants) ? videoObj.variants : [],
      };
      
      setVideo(safeVideo);
      setEditForm({
        title: safeVideo.title || '',
        description: safeVideo.description || '',
      });
      
      if (safeVideo.variants.length === 0) {
        setError('No video variants (e.g., 480p.mp4) found. Check backend upload.');
      }
    } catch (err: any) {
      console.error('API Error Details:', err.response?.data || err.message);
      setError(`Failed to fetch episode: ${err.response?.status} - ${err.response?.data?.message || err.message}`);
      setVideo(null);
    } finally {
      setPlayerLoading(false);
    }
  };

  const handleVideoError = (e: any) => {
    console.error('Video playback error:', e);
    setVideoLoadError(true);
    setError('Video file failed to load (possible CORS issue). Check console.');
  };

  const handleVideoLoadedData = () => {
    setPlayerLoading(false);
    setVideoLoadError(false);
  };

  const handleQualityChange = (quality: string) => {
    if (!video?.variants) return;
    const currentTime = videoRef.current?.currentTime || 0;
    const wasPlaying = !videoRef.current?.paused;
    setSelectedQuality(quality);
    setQualityMenuAnchor(null);
    setPlayerLoading(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.src = getCurrentVideoUrl(); // Reload src for new quality
        videoRef.current.currentTime = currentTime;
        if (wasPlaying) {
          videoRef.current.play().catch(console.error);
        }
        setPlayerLoading(false);
      }
    }, 200);
  };

  const getCurrentVideoUrl = () => {
    if (!video?.variants?.length) return '';
    const variant = video.variants.find(v => v.resolution === selectedQuality);
    const url = variant?.url || video.variants[0]?.url || '';
    if (url && !url.startsWith('http')) {
      // If relative, prepend base (adjust if needed)
      return `https://sagarteotia.in${url}`;
    }
    console.log('Video URL set to:', url);
    return url;
  };

  // Rest of functions same as before (togglePlayPause, toggleFullscreen, handleEdit, etc.)
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
      setIsPlaying(!videoRef.current.paused);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current?.requestFullscreen) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleEdit = async () => {
    if (!editForm.title.trim()) {
      setError('Title is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await updateVideo(episodeId!, editForm);
      alert('Episode updated!');
      setEditDialogOpen(false);
      fetchVideo();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete episode?')) return;
    try {
      await deleteVideo(episodeId!);
      alert('Deleted!');
      navigate('/admin/webseries');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleTogglePublish = async () => {
    if (!video) return;
    try {
      await updateVideo(episodeId!, { isPublished: !video.isPublished });
      fetchVideo();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Publish failed');
    }
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography>Redirecting...</Typography>
      </Box>
    );
  }

  const safeVideo = video || { variants: [] as VideoVariant[] };
  const safeVariants = safeVideo.variants || [];

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link color="inherit" onClick={() => navigate('/admin/webseries')}>Web Series</Link>
        <Link color="inherit" onClick={() => navigate(`/admin/webseries/${safeVideo.seasonId?._id || ''}`)}>
          {safeVideo.seasonId?.title || 'Unknown Season'}
        </Link>
        <Typography>Episode {safeVideo.episodeNumber || '?'}</Typography>
      </Breadcrumbs>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<ErrorIcon />}>
          {error}
        </Alert>
      )}
      <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 4,
            mb: 4,
          }}
        >


            <Paper
              sx={{
                mb: 3,
                overflow: 'hidden',
                maxWidth: 420,
                ml: 0,              // ✅ stick to left
                mr: 'auto',
                borderRadius: 3,
                flexShrink: 0,
              }}
            >

          <Box
              sx={{
                position: 'relative',
                bgcolor: 'black',
                aspectRatio: '9/16',   // 🔥 VERTICAL PLAYER
              }}
            >
          {playerLoading && (
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1, color: 'white' }}>
              <CircularProgress color="primary" />
              <Typography variant="body2" sx={{ mt: 1 }}>Loading...</Typography>
            </Box>
          )}
          <video
            ref={videoRef}
            src={getCurrentVideoUrl()}
            poster={getThumbnailWithCacheBust(safeVideo.thumbnailUrl, (safeVideo as any).updatedAt) || safeVideo.thumbnailUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',   // 🔑 fills vertical frame
              display: safeVariants.length === 0 ? 'none' : 'block',
            }}
            
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedData={handleVideoLoadedData}
            onError={handleVideoError}
            onLoadStart={() => setPlayerLoading(true)}
            preload="metadata"
          />
          {safeVariants.length === 0 && (
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', textAlign: 'center' }}>
              <ErrorIcon sx={{ fontSize: 48, color: 'warning.main' }} />
              <Typography variant="h6" sx={{ mt: 1 }}>No Video Available</Typography>
              <Typography variant="body2">Upload variants (e.g., 480p.mp4) in backend.</Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1}>
            <Chip label={selectedQuality} color="primary" size="small" />
            <Chip label={safeVideo.isPublished ? 'Published' : 'Draft'} color={safeVideo.isPublished ? 'success' : 'default'} size="small" />
            <Chip label={`${safeVideo.views || 0} views`} size="small" variant="outlined" />
          </Stack>
          <IconButton
            size="small"
            onClick={(e) => setQualityMenuAnchor(e.currentTarget)}
            disabled={safeVariants.length === 0}
          >
            <Settings />
          </IconButton>
          <Menu anchorEl={qualityMenuAnchor} open={Boolean(qualityMenuAnchor)} onClose={() => setQualityMenuAnchor(null)}>
            <MenuItem disabled sx={{ fontWeight: 'bold' }}>Quality</MenuItem>
            {safeVariants.map((variant) => (
              <MenuItem
                key={variant.resolution}
                selected={selectedQuality === variant.resolution}
                onClick={() => handleQualityChange(variant.resolution)}
              >
                {variant.resolution} {selectedQuality === variant.resolution && ' ✓'}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Episode {safeVideo.episodeNumber || '?'}: {safeVideo.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {safeVideo.seasonId?.title || 'Unknown'} • Season {safeVideo.seasonId?.seasonNumber || '?'}
            </Typography>
          </Box>
          {hasPermission('write') && (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<Edit />} onClick={() => setEditDialogOpen(true)}>Edit</Button>
              {safeVideo.status === 'completed' && (
                <Button variant="contained" onClick={handleTogglePublish} color={safeVideo.isPublished ? 'warning' : 'success'}>
                  {safeVideo.isPublished ? 'Unpublish' : 'Publish'}
                </Button>
              )}
              {hasPermission('delete') && <Button variant="outlined" color="error" startIcon={<Delete />} onClick={handleDelete}>Delete</Button>}
            </Stack>
          )}
        </Box>
        {safeVideo.description && <Typography variant="body1" sx={{ mt: 2 }}>{safeVideo.description}</Typography>}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip label={`Duration: ${Math.round((safeVideo.duration || 0) / 60)} min`} />
          <Chip label={`${safeVideo.likes || 0} likes`} variant="outlined" />
          <Chip label={`Status: ${safeVideo.status}`} color="success" />
        </Box>
        <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>

        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Quality Options</Typography>
        <Stack spacing={1}>
          {safeVariants.length > 0 ? (
            safeVariants.map((variant) => (
              <Box key={variant.resolution} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, border: '1px solid', borderColor: selectedQuality === variant.resolution ? 'primary.main' : 'divider', borderRadius: 1, bgcolor: selectedQuality === variant.resolution ? 'primary.lighter' : 'transparent' }}>
                <Box>
                  <Typography variant="body1" fontWeight="bold">{variant.resolution} {selectedQuality === variant.resolution && '(Current)'}</Typography>
                  <Typography variant="body2" color="text.secondary">Size: {(variant.size / (1024 * 1024)).toFixed(2)} MB</Typography>
                </Box>
                <Button variant={selectedQuality === variant.resolution ? 'contained' : 'outlined'} size="small" onClick={() => handleQualityChange(variant.resolution)}>
                  {selectedQuality === variant.resolution ? 'Playing' : 'Switch'}
                </Button>
              </Box>
            ))
          ) : (
            <Alert severity="warning">No variants. Backend mein upload karo (e.g., 480p.mp4).</Alert>
          )}
        </Stack>
      </Box>

      </Paper>

      
    </Box>


      

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Episode</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField fullWidth label="Title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
            <TextField fullWidth label="Description" multiline rows={4} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEdit} variant="contained" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EpisodePlayerPage;