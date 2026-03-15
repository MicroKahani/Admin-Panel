// frontend/src/pages/SeasonDetailPage.tsx
//contains the add episode pop for each season
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Stack,
  Chip,
  Breadcrumbs,
  Link,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
} from '@mui/material';
import {
  Upload,
  Delete,
  PlayArrow,
  CloudUpload,
  Image as ImageIcon
} from '@mui/icons-material';
import {
  getSeasonById,
  getEpisodesBySeasonAdmin,
  uploadVideo,
  updateVideo,
  deleteVideo,
  updateVideoAdStatus
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CastCrewManager from '../components/CastCrewManager';

/**
 * Max videos in queue. Backend + admin on same PC: FFmpeg uses ~1.5–2.5GB RAM per job.
 * With 8GB RAM (OS + browser + Node + one transcode) keep queue small; 20 is safe.
 */
const MAX_QUEUE_SIZE = 20;

const FFMPEG_STAGES = [
  'Starting...',
  'Transcoding 1080p',
  'Transcoding 720p',
  'Transcoding 480p',
  'Transcoding 360p',
  'Generating master playlist',
  'Uploading 1080p to R2',
  'Uploading 720p to R2',
  'Uploading 480p to R2',
  'Uploading 360p to R2',
  'Uploading master playlist to R2',
  'Thumbnail',
] as const;

interface Episode {
  _id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  episodeNumber: number;
  duration: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  processingStage?: string;
  isPublished: boolean;
  views: number;
  adStatus: 'unlocked' | 'interstitial' | 'rewarded' | 'rewarded_interstitial';
  createdAt: string;
}

// Helper to cache-bust episode thumbnails when the underlying file changes
const getEpisodeThumbnailWithCacheBust = (thumbnailUrl: string | undefined, updatedAt: string | undefined, episodeNumber: number) => {
  const base = thumbnailUrl || `https://via.placeholder.com/300x180?text=Episode+${episodeNumber}`;
  try {
    const ts = updatedAt ? new Date(updatedAt).getTime() : Date.now();
    return `${base}?v=${ts}`;
  } catch {
    return `${base}?v=${Date.now()}`;
  }
};

interface Season {
  _id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  seasonNumber: number;
  episodeCount: number;
  cast?: CastMember[];
}

interface CastMember {
  id?: string;
  name: string;
  character: string;
  image?: string;
  role: 'actor' | 'crew';
}

const SeasonDetailPage: React.FC = () => {
  const { seasonId } = useParams<{ seasonId: string }>();
  const navigate = useNavigate();
  const [season, setSeason] = useState<Season | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    episodeNumber: '',
  });
  const [adStatus, setAdStatus] = useState<Episode['adStatus']>('unlocked');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [castMembers, setCastMembers] = useState<CastMember[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  /** Queue for multiple video uploads: upload one by one */
  type QueueItem = {
    id: string;
    file: File;
    title: string;
    description: string;
    episodeNumber: string;
    adStatus: Episode['adStatus'];
    thumbnailFile?: File;
  };
  const [uploadQueue, setUploadQueue] = useState<QueueItem[]>([]);
  const [queueUploadIndex, setQueueUploadIndex] = useState<number | null>(null);
  const [queueUploadTotal, setQueueUploadTotal] = useState<number>(0);
  const [queueUploadProgress, setQueueUploadProgress] = useState<number | null>(null);
  const { hasPermission } = useAuth();

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filtered Episodes Logic
  const filteredEpisodes = episodes.filter((episode) => {
    // Search filter
    const searchMatch =
      episode.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (episode.description && episode.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // Status filter
    const statusMatch = filterStatus === 'all' ||
      (filterStatus === 'published' ? episode.isPublished :
        filterStatus === 'unpublished' ? !episode.isPublished : true);

    return searchMatch && statusMatch;
  });

  const handleAdStatusChange = async (
    episodeId: string,
    adStatus: Episode['adStatus']
  ) => {
    try {
      await updateVideoAdStatus(episodeId, adStatus);
      // Optimistically update local state or refetch
      setEpisodes(prev => prev.map(ep =>
        ep._id === episodeId ? { ...ep, adStatus } : ep
      ));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update ad status');
      fetchEpisodes(); // Revert on failure
    }
  };

  useEffect(() => {
    if (seasonId) {
      fetchSeasonDetails();
      fetchEpisodes();
    } else {
      setError('Invalid season ID');
      setFetchLoading(false);
    }
  }, [seasonId]);

  // Poll episodes when any is uploading or processing (to update FFmpeg stage / status)
  const hasProcessingOrUploading = episodes.some(
    (ep) => ep.status === 'processing' || ep.status === 'uploading'
  );
  useEffect(() => {
    if (!seasonId || !hasProcessingOrUploading) return;
    const interval = setInterval(fetchEpisodes, 4000);
    return () => clearInterval(interval);
  }, [seasonId, hasProcessingOrUploading]);

  const fetchSeasonDetails = async () => {
    try {
      console.log('Fetching season details...');
      const response = await getSeasonById(seasonId!);
      console.log('Season response:', response);

      if (response && (response as any).data) {
        console.log('Response data:', (response as any).data);
        const seasonData = (response as any).data.data || (response as any).data;
        console.log('Season data:', seasonData);
        if (seasonData && typeof seasonData === 'object') {
          setSeason(seasonData);
          if (seasonData.cast && Array.isArray(seasonData.cast)) {
            setCastMembers(seasonData.cast);
          }
          console.log('Set season:', seasonData.title);
        } else {
          console.error('Season data is invalid:', seasonData);
          setError('Invalid season data');
        }
      } else {
        console.error('No response data');
        setError('Failed to load season');
      }
    } catch (err) {
      console.error('Failed to fetch season:', err);
      setError('Failed to load season details');
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchEpisodes = async () => {
    try {
      console.log('Fetching episodes...');
      const response = await getEpisodesBySeasonAdmin(seasonId!);
      console.log('Episodes response:', response);

      const episodesData = (response as any).data || response;
      console.log('Episodes data:', episodesData);

      if (Array.isArray(episodesData)) {
        setEpisodes(episodesData);
        console.log('Set episodes:', episodesData.length, 'items');
      } else {
        console.error('Episodes data is not an array:', episodesData);
        setEpisodes([]);
      }
    } catch (err) {
      console.error('Failed to fetch episodes:', err);
      setError('Failed to load episodes');
    } finally {
      // Fetch loading is shared; set only after both, but for simplicity, set here too
      setFetchLoading((prev) => prev); // No-op, but ensures finally runs
    }
  };

  const handleVideoFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    const allowedTypes = ['video/mp4', 'video/quicktime'];
    const nextEp = episodes.length > 0 ? Math.max(...episodes.map((e) => e.episodeNumber)) + 1 : 1;
    const toAdd: QueueItem[] = [];
    const spaceLeft = Math.max(0, MAX_QUEUE_SIZE - uploadQueue.length);
    for (let i = 0; i < files.length && toAdd.length < spaceLeft; i++) {
      const file = files[i];
      if (file.size > 800 * 1024 * 1024) {
        alert(`File ${file.name} must be less than 800MB`);
        continue;
      }
      if (!allowedTypes.includes(file.type)) {
        alert(`Only MP4 and MOV allowed: ${file.name}`);
        continue;
      }
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      toAdd.push({
        id: `${Date.now()}-${i}-${file.name}`,
        file,
        title: nameWithoutExt,
        description: '',
        episodeNumber: String(nextEp + toAdd.length),
        adStatus,
        thumbnailFile: undefined,
      });
    }
    if (toAdd.length < files.length) {
      const skipped = files.length - toAdd.length;
      alert(`Queue limited to ${MAX_QUEUE_SIZE} videos to keep your PC responsive. ${toAdd.length > 0 ? `Added ${toAdd.length}; ${skipped} skipped.` : 'Queue is full.'} Upload this batch, then add more.`);
    }
    if (toAdd.length === 1 && uploadQueue.length === 0) {
      setSelectedVideoFile(toAdd[0].file);
      setFormData((prev) => ({ ...prev, title: toAdd[0].title, episodeNumber: toAdd[0].episodeNumber }));
    } else {
      setUploadQueue((q) => [...q, ...toAdd]);
      if (toAdd.length > 0) setSelectedVideoFile(null);
    }
    event.target.value = '';
  };

  const handleThumbnailFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Thumbnail size must be less than 5MB');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, JPEG, and PNG files are allowed');
        return;
      }
      setSelectedThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleOpenDialog = () => {
    const nextEpisodeNumber = episodes.length > 0
      ? Math.max(...episodes.map(e => e.episodeNumber)) + 1
      : 1;

    setFormData({
      title: '',
      description: '',
      episodeNumber: nextEpisodeNumber.toString(),
    });

    setSelectedVideoFile(null);
    setSelectedThumbnailFile(null);
    setThumbnailPreview('');
    setAdStatus('unlocked');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedVideoFile(null);
    setSelectedThumbnailFile(null);
    setThumbnailPreview('');
    setFormData({
      title: '',
      description: '',
      episodeNumber: '',
    });
    setAdStatus('unlocked');
    setError('');
    setUploadProgress(null);
    setUploadQueue([]);
    setQueueUploadIndex(null);
    setQueueUploadTotal(0);
    setQueueUploadProgress(null);
  };

  const removeFromQueue = (id: string) => {
    setUploadQueue((q) => q.filter((item) => item.id !== id));
  };

  const updateQueueItem = (id: string, updates: Partial<QueueItem>) => {
    setUploadQueue((q) =>
      q.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };



  const handleUpload = async () => {
    if (!selectedVideoFile) {
      setError('Please select a video file');
      return;
    }
    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }
    if (!formData.episodeNumber || parseInt(formData.episodeNumber) < 1) {
      setError('Please enter a valid episode number');
      return;
    }
    setLoading(true);
    setUploadProgress(0);
    setError('');
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('video', selectedVideoFile);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('type', 'episode');
      formDataToSend.append('seasonId', seasonId!);
      formDataToSend.append('episodeNumber', formData.episodeNumber);
      formDataToSend.append(
        'adStatus',
        adStatus
      );


      if (selectedThumbnailFile) {
        formDataToSend.append('thumbnail', selectedThumbnailFile);
      }
      await uploadVideo(formDataToSend, (event) => {
        if (!event.total) {
          setUploadProgress(null);
          return;
        }
        const percent = Math.round((event.loaded * 100) / event.total);
        setUploadProgress(percent);
      });

      alert('Episode upload started! Processing will take some time.');
      handleCloseDialog();
      fetchEpisodes(); // Refresh episodes after upload
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const handleUploadAll = async () => {
    if (uploadQueue.length === 0) return;
    const invalid = uploadQueue.filter(
      (item) => !item.title.trim() || !item.episodeNumber || parseInt(item.episodeNumber, 10) < 1
    );
    if (invalid.length > 0) {
      setError('Please set title and valid episode number for all queued videos.');
      return;
    }
    const total = uploadQueue.length;
    setError('');
    setLoading(true);
    setQueueUploadTotal(total);
    let queue = [...uploadQueue];
    let currentIndex = 0;
    while (queue.length > 0) {
      const item = queue[0];
      setQueueUploadIndex(currentIndex);
      setQueueUploadProgress(0);
      try {
        const formDataToSend = new FormData();
        formDataToSend.append('video', item.file);
        formDataToSend.append('title', item.title);
        formDataToSend.append('description', item.description);
        formDataToSend.append('type', 'episode');
        formDataToSend.append('seasonId', seasonId!);
        formDataToSend.append('episodeNumber', item.episodeNumber);
        formDataToSend.append('adStatus', item.adStatus);
        if (item.thumbnailFile) formDataToSend.append('thumbnail', item.thumbnailFile);
        await uploadVideo(formDataToSend, (event) => {
          if (event.total) {
            setQueueUploadProgress(Math.round((event.loaded * 100) / event.total));
          }
        });
        queue = queue.slice(1);
        setUploadQueue(queue);
        currentIndex++;
        fetchEpisodes();
      } catch (err: any) {
        setError(err.response?.data?.message || `Upload failed for ${item.file.name}`);
        setQueueUploadIndex(null);
        setQueueUploadProgress(null);
        setLoading(false);
        return;
      }
    }
    setQueueUploadIndex(null);
    setQueueUploadProgress(null);
    setLoading(false);
    alert(`All ${total} episode(s) upload started. Processing will take some time.`);
    handleCloseDialog();
    fetchEpisodes();
  };

  const handleTogglePublish = async (episodeId: string, currentStatus: boolean) => {
    try {
      await updateVideo(episodeId, { isPublished: !currentStatus });
      fetchEpisodes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update episode');
    }
  };

  const handleDelete = async (episodeId: string) => {
    if (!window.confirm('Are you sure you want to delete this episode?')) return;
    try {
      await deleteVideo(episodeId);
      fetchEpisodes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete episode');
    }
  };

  const handlePlayEpisode = (episodeId: string) => {
    navigate(`/episode/${episodeId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  if (fetchLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Stack alignItems="center" spacing={2}>
          <Typography>Loading season details...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error && !season) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/webseries')}>
          Back to Web Series
        </Button>
      </Box>
    );
  }

  if (!season) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Season not found.
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/webseries')} sx={{ mt: 2 }}>
          Back to Web Series
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/webseries');
            }}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            Web Series
          </Link>
          <Typography color="text.primary">{season.title}</Typography>
        </Breadcrumbs>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {season.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Season {season.seasonNumber} • {episodes.length} Episodes
            </Typography>
          </Box>
          {hasPermission('write') && (
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={handleOpenDialog}
            >
              Add Episode
            </Button>
          )}
        </Box>
      </Box>

      {/* Show error if exists (non-fatal) */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Season Description */}
      {season.description && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="body1">{season.description}</Typography>
        </Paper>
      )}

      {/* Cast & Crew Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <CastCrewManager
          castMembers={castMembers}
          onCastChange={(newCastMembers) => {
            setCastMembers(newCastMembers);
            // Update season with new cast members
            if (season) {
              setSeason({ ...season, cast: newCastMembers });
            }
          }}
          error={error}
        />
      </Paper>

      {/* Filters Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 8 }}>
            <TextField
              fullWidth
              size="small"
              label="Search Episodes"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or description..."
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="unpublished">Unpublished</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Episodes Grid */}
      <Grid container spacing={3}>
        {filteredEpisodes.map((episode) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={episode._id}>
            <Card>
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="180"
                  image={getEpisodeThumbnailWithCacheBust(episode.thumbnailUrl, (episode as any).updatedAt, episode.episodeNumber)}
                  alt={episode.title}
                />
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.9)',
                    }
                  }}
                  onClick={() => handlePlayEpisode(episode._id)}
                >
                  <PlayArrow sx={{ fontSize: 40 }} />
                </IconButton>
                <Chip
                  label={`Episode ${episode.episodeNumber}`}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                  }}
                />
              </Box>
              <CardContent>
                <Typography variant="h6" noWrap>
                  {episode.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {episode.description || 'No description'}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={episode.status}
                    size="small"
                    color={getStatusColor(episode.status) as any}
                  />
                  {episode.isPublished && (
                    <Chip label="Published" size="small" color="success" />
                  )}
                  <Chip
                    label={`${episode.views || 0} views`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                {(episode.status === 'processing' || episode.status === 'uploading') && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      {episode.status === 'uploading' ? 'Status' : 'FFmpeg stages'}
                    </Typography>
                    {episode.status === 'uploading' && (
                      <Box sx={{ py: 0.5, px: 1, borderRadius: 1, bgcolor: 'action.selected', fontSize: '0.75rem' }}>
                        <Typography variant="caption" color="primary.main" fontWeight={600}>
                          Uploading file...
                        </Typography>
                      </Box>
                    )}
                    <Stack direction="column" spacing={0.25} sx={{ mt: episode.status === 'uploading' ? 0.5 : 0 }}>
                      {FFMPEG_STAGES.map((stage) => {
                        const isCurrent = episode.status === 'processing' && episode.processingStage === stage;
                        const stageOrder = FFMPEG_STAGES.indexOf(stage);
                        const currentOrder =
                          episode.processingStage !== undefined && episode.processingStage !== null
                            ? FFMPEG_STAGES.indexOf(episode.processingStage as (typeof FFMPEG_STAGES)[number])
                            : -1;
                        const isDone = stageOrder >= 0 && currentOrder >= 0 && stageOrder < currentOrder;
                        return (
                          <Box
                            key={stage}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              py: 0.25,
                              px: 1,
                              borderRadius: 1,
                              bgcolor: isCurrent ? 'action.selected' : isDone ? 'action.hover' : 'transparent',
                              fontSize: '0.75rem',
                            }}
                          >
                            {isDone && <Typography component="span" color="success.main">✓</Typography>}
                            {isCurrent && !isDone && (
                              <LinearProgress sx={{ width: 24, height: 4, borderRadius: 1 }} />
                            )}
                            <Typography
                              component="span"
                              variant="caption"
                              color={isCurrent ? 'primary.main' : 'text.secondary'}
                              fontWeight={isCurrent ? 600 : 400}
                            >
                              {stage}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                )}

                {hasPermission('write') && (
                  <FormControl size="small" fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Ad Type</InputLabel>
                    <Select
                      value={episode.adStatus || 'unlocked'}
                      label="Ad Type"
                      onChange={(e) =>
                        handleAdStatusChange(
                          episode._id,
                          e.target.value as Episode['adStatus']
                        )
                      }
                    >
                      <MenuItem value="unlocked">None (Unlocked)</MenuItem>
                      <MenuItem value="interstitial">Interstitial</MenuItem>
                      <MenuItem value="rewarded">Rewarded</MenuItem>
                      <MenuItem value="rewarded_interstitial">Rewarded Interstitial</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between' }}>
                <Box>
                  {hasPermission('write') && episode.status === 'completed' && (
                    <Button
                      size="small"
                      onClick={() => handleTogglePublish(episode._id, episode.isPublished)}
                    >
                      {episode.isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                  )}
                </Box>
                <Box>
                  {hasPermission('delete') && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(episode._id)}
                    >
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredEpisodes.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CloudUpload sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No episodes yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Click "Add Episode" to upload your first episode
          </Typography>
        </Paper>
      )}

      {/* Upload Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Upload New Episode</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ py: 2 }}
            >
              <Upload sx={{ mr: 1 }} />
              {selectedVideoFile && uploadQueue.length === 0
                ? selectedVideoFile.name
                : uploadQueue.length > 0
                  ? `Add more videos (${uploadQueue.length} in queue)`
                  : 'Select video(s) — MP4/MOV, max 800MB each'}
              <input
                type="file"
                hidden
                multiple
                accept="video/mp4,video/quicktime"
                onChange={handleVideoFileSelect}
              />
            </Button>
            {uploadQueue.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Upload queue ({uploadQueue.length})</Typography>
                <Stack spacing={1}>
                  {uploadQueue.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        alignItems: 'center',
                        p: 1,
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="caption" noWrap sx={{ minWidth: 120 }}>
                        {item.file.name}
                      </Typography>
                      <TextField
                        size="small"
                        label="Ep #"
                        type="number"
                        value={item.episodeNumber}
                        onChange={(e) => updateQueueItem(item.id, { episodeNumber: e.target.value })}
                        sx={{ width: 70 }}
                      />
                      <TextField
                        size="small"
                        label="Title"
                        value={item.title}
                        onChange={(e) => updateQueueItem(item.id, { title: e.target.value })}
                        sx={{ flex: 1, minWidth: 120 }}
                      />
                      <IconButton size="small" color="error" onClick={() => removeFromQueue(item.id)}>
                        <Delete />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
                {queueUploadIndex !== null && queueUploadTotal > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Uploading {queueUploadIndex + 1} of {queueUploadTotal}...
                    </Typography>
                    <LinearProgress
                      variant={queueUploadProgress !== null ? 'determinate' : 'indeterminate'}
                      value={queueUploadProgress ?? undefined}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                )}
              </Paper>
            )}
            <Box>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ py: 2 }}
                color={selectedThumbnailFile ? 'success' : 'primary'}
              >
                <ImageIcon sx={{ mr: 1 }} />
                {selectedThumbnailFile ? 'Thumbnail Selected' : 'Upload Custom Thumbnail (Optional)'}
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleThumbnailFileSelect}
                />
              </Button>

              {thumbnailPreview && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      borderRadius: '8px',
                      border: '1px solid #ddd'
                    }}
                  />
                </Box>
              )}
            </Box>
            <TextField
              fullWidth
              label="Episode Number"
              type="number"
              value={formData.episodeNumber}
              onChange={(e) => setFormData({ ...formData, episodeNumber: e.target.value })}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Ad Requirement</InputLabel>
              <Select
                value={adStatus}
                label="Ad Requirement"
                onChange={(e) => setAdStatus(e.target.value as Episode['adStatus'])}
                sx={{ mb: 1 }}
              >
                <MenuItem value="unlocked">No Ad (Unlocked)</MenuItem>
                <MenuItem value="interstitial">Interstitial Ad</MenuItem>
                <MenuItem value="rewarded">Rewarded Ad</MenuItem>
                <MenuItem value="rewarded_interstitial">Rewarded Interstitial Ad</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Episode title..."
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description..."
            />
            {loading && uploadQueue.length === 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {uploadProgress !== null
                    ? `Uploading video... ${uploadProgress}%`
                    : 'Uploading video...'}
                </Typography>
                <LinearProgress
                  variant={uploadProgress !== null ? 'determinate' : 'indeterminate'}
                  value={uploadProgress ?? undefined}
                />
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
          {uploadQueue.length > 0 ? (
            <Button
              onClick={handleUploadAll}
              variant="contained"
              disabled={loading}
              startIcon={<Upload />}
            >
              {loading ? 'Uploading...' : `Upload all (${uploadQueue.length})`}
            </Button>
          ) : (
            <Button onClick={handleUpload} variant="contained" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SeasonDetailPage;