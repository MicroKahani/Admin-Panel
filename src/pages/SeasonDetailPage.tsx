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
} from '@mui/material';
import {
  ArrowBack,
  Upload,
  Edit,
  Delete,
  PlayArrow,
  CloudUpload,
  Image as ImageIcon
} from '@mui/icons-material';
import {
  getSeasonById,
  getEpisodesBySeason,
  uploadVideo,
  updateVideo,
  deleteVideo
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Episode {
  _id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  episodeNumber: number;
  duration: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  isPublished: boolean;
  views: number;
  createdAt: string;
}

interface Season {
  _id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  seasonNumber: number;
  episodeCount: number;
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
  const [isAdLocked, setIsAdLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const { hasPermission } = useAuth();

  useEffect(() => {
    if (seasonId) {
      fetchSeasonDetails();
      fetchEpisodes();
    } else {
      setError('Invalid season ID');
      setFetchLoading(false);
    }
  }, [seasonId]);

  const fetchSeasonDetails = async () => {
    try {
      console.log('Fetching season details...');
      const response = await getSeasonById(seasonId!);
      console.log('Season response:', response);

      if (response && response.data) {
        console.log('Response data:', response.data);
        const seasonData = response.data.data || response.data;
        console.log('Season data:', seasonData);
        if (seasonData && typeof seasonData === 'object') {
          setSeason(seasonData);
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
      const response = await getEpisodesBySeason(seasonId!);
      console.log('Episodes response:', response);

      if (response && response.data) {
        console.log('Response data:', response.data);
        const episodesData = response.data.data || response.data;
        console.log('Episodes data:', episodesData);

        if (Array.isArray(episodesData)) {
          setEpisodes(episodesData);
          console.log('Set episodes:', episodesData.length, 'items');
        } else {
          console.error('Episodes data is not an array:', episodesData);
          setEpisodes([]);
        }
      } else {
        console.error('No response data');
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
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        alert('File size must be less than 500MB');
        return;
      }
      const allowedTypes = ['video/mp4', 'video/quicktime'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only MP4 and MOV files are allowed');
        return;
      }
      setSelectedVideoFile(file);
    }
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
  setIsAdLocked(false);   // ✅ CORRECT PLACE
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
  setIsAdLocked(false);
  setError('');
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
        isAdLocked ? 'locked' : 'unlocked'
      );


      if (selectedThumbnailFile) {
        formDataToSend.append('thumbnail', selectedThumbnailFile);
      }
      await uploadVideo(formDataToSend);

      alert('Episode upload started! Processing will take some time.');
      handleCloseDialog();
      fetchEpisodes(); // Refresh episodes after upload
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
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

      {/* Episodes Grid */}
      <Grid container spacing={3}>
        {episodes.map((episode) => (
          <Grid item xs={12} sm={6} md={4} key={episode._id}>
            <Card>
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="180"
                  image={episode.thumbnailUrl || `https://via.placeholder.com/300x180?text=Episode+${episode.episodeNumber}`}
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

      {episodes.length === 0 && (
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
              {selectedVideoFile ? selectedVideoFile.name : 'Select Video (MP4/MOV, max 500MB)'}
              <input
                type="file"
                hidden
                accept="video/mp4,video/quicktime"
                onChange={handleVideoFileSelect}
              />
            </Button>
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
            <FormControlLabel
              control={
                <Switch
                  checked={isAdLocked}
                  onChange={(e) => setIsAdLocked(e.target.checked)}
                  color="warning"
                />
              }
              label="Require ad to watch this episode"
            />

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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleUpload} variant="contained" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SeasonDetailPage;