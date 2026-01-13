// frontend/src/pages/VideoManagementPage.tsx

import React, { useState, useEffect } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Alert,
  Stack,
} from '@mui/material';
import { Upload, Delete, CloudUpload, Image as ImageIcon, Edit } from '@mui/icons-material';
import { getAllVideos, uploadVideo, updateVideo, deleteVideo, getAllSeasons, updateVideoAdStatus } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Video {
  _id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  type: 'reel' | 'episode';
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  isPublished: boolean;
  adStatus: 'locked' | 'unlocked';
  duration: number;
  createdAt: string;
}

// Helper to force-refresh thumbnail images when the file changes but URL stays the same.
// We use a local "version" number so the URL changes immediately after an update.
const getThumbnailWithCacheBust = (thumbnailUrl?: string, version?: number) => {
  if (!thumbnailUrl) return undefined;
  const v = typeof version === 'number' ? version : Date.now();
  return `${thumbnailUrl}?v=${v}`;
};

const VideoManagementPage: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'reel' as 'reel' | 'episode',
    seasonId: '',
    episodeNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [thumbnailDialogOpen, setThumbnailDialogOpen] = useState(false);
  const [selectedVideoForThumbnail, setSelectedVideoForThumbnail] = useState<Video | null>(null);
  const [newThumbnailFile, setNewThumbnailFile] = useState<File | null>(null);
  const [newThumbnailPreview, setNewThumbnailPreview] = useState<string>('');
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailVersion, setThumbnailVersion] = useState<Record<string, number>>({});
  const { hasPermission } = useAuth();

  useEffect(() => {
    fetchVideos();
    fetchSeasons();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await getAllVideos();
      setVideos(response.data);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    }
  };

  const fetchSeasons = async () => {
    try {
      const response = await getAllSeasons();
      setSeasons(response.data);
    } catch (err) {
      console.error('Failed to fetch seasons:', err);
    }
  };

  const handleVideoFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        alert('File size must be less than 500MB');
        return;
      }

      // Validate file type
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
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Thumbnail size must be less than 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, JPEG, and PNG files are allowed');
        return;
      }

      setSelectedThumbnailFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('video', selectedVideoFile);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('type', formData.type);
      
      // Add thumbnail if selected
      if (selectedThumbnailFile) {
        formDataToSend.append('thumbnail', selectedThumbnailFile);
      }
      
      if (formData.type === 'episode') {
        formDataToSend.append('seasonId', formData.seasonId);
        formDataToSend.append('episodeNumber', formData.episodeNumber);
      }

      await uploadVideo(formDataToSend);
      
      alert('Video upload started! Processing will take some time.');
      handleCloseDialog();
      fetchVideos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedVideoFile(null);
    setSelectedThumbnailFile(null);
    setThumbnailPreview('');
    setFormData({
      title: '',
      description: '',
      type: 'reel',
      seasonId: '',
      episodeNumber: '',
    });
    setError('');
  };

  const handleTogglePublish = async (videoId: string, currentStatus: boolean) => {
    try {
      await updateVideo(videoId, { isPublished: !currentStatus });
      fetchVideos();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update video');
    }
  };

  const handleAdStatusChange = async (
  videoId: string,
  adStatus: 'locked' | 'unlocked'
) => {
  try {
    await updateVideoAdStatus(videoId, adStatus);
    fetchVideos(); // refresh list
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to update ad status');
  }
};


  const handleDelete = async (videoId: string) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;

    try {
      await deleteVideo(videoId);
      fetchVideos();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete video');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const handleOpenThumbnailDialog = (video: Video) => {
    setSelectedVideoForThumbnail(video);
    setNewThumbnailFile(null);
    setNewThumbnailPreview('');
    setThumbnailDialogOpen(true);
  };

  const handleCloseThumbnailDialog = () => {
    setThumbnailDialogOpen(false);
    setSelectedVideoForThumbnail(null);
    setNewThumbnailFile(null);
    setNewThumbnailPreview('');
  };

  const handleNewThumbnailSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Thumbnail size must be less than 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, JPEG, and PNG files are allowed');
        return;
      }

      setNewThumbnailFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateThumbnail = async () => {
    if (!selectedVideoForThumbnail || !newThumbnailFile) {
      alert('Please select a thumbnail image');
      return;
    }

    setThumbnailUploading(true);
    try {
      const formData = new FormData();
      formData.append('thumbnail', newThumbnailFile);
      
      await updateVideo(selectedVideoForThumbnail._id, formData);

      // Bump local version for this video's thumbnail so the URL changes immediately
      setThumbnailVersion((prev) => ({
        ...prev,
        [selectedVideoForThumbnail._id]: (prev[selectedVideoForThumbnail._id] || 0) + 1,
      }));

      alert('Thumbnail updated successfully!');
      handleCloseThumbnailDialog();
      fetchVideos(); // Refresh the video list
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update thumbnail');
    } finally {
      setThumbnailUploading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Video Management
        </Typography>
        {hasPermission('write') && (
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={() => setOpenDialog(true)}
          >
            Upload Video
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {videos.map((video) => (
          <Grid item xs={12} sm={6} md={4} key={video._id}>

            <Card
              sx={{
                width: 320,          // 🔒 SAME WIDTH for all cards
                height: 460,         // 🔒 SAME HEIGHT for all cards
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                mx: 'auto',          // center card inside grid column
              }}
>

              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="200"
                  sx={{
                    width: '100%',
                    objectFit: 'cover',
                  }}
                  image={
                    getThumbnailWithCacheBust(video.thumbnailUrl, thumbnailVersion[video._id]) ||
                    'https://via.placeholder.com/300x200?text=No+Thumbnail'
                  }
                  alt={video.title}
                />
                {hasPermission('write') && (
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.8)',
                      },
                    }}
                    size="small"
                    onClick={() => handleOpenThumbnailDialog(video)}
                    title="Change Thumbnail"
                  >
                    <ImageIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography
                    variant="h6"
                    sx={{
                      mb: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >

                  {video.title}
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 1,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      height: 40,          // 🔒 SAME height for all
                    }}
                  >
                    {video.description || 'No description'}
                  </Typography>

                <Box sx={{ mt: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  <Chip label={video.type} size="small" />
                  <Chip
                    label={video.status}
                    size="small"
                    color={getStatusColor(video.status) as any}
                  />
                  {video.isPublished && <Chip label="Published" size="small" color="success" />}
                </Box>
                {hasPermission('write') && (
  <FormControl size="small" fullWidth sx={{ mt: 1 }}>
    <InputLabel>Ad Status</InputLabel>
    <Select
      value={video.adStatus}
      label="Ad Status"
      onChange={(e) =>
        handleAdStatusChange(
          video._id,
          e.target.value as 'locked' | 'unlocked'
        )
      }
    >
      <MenuItem value="unlocked">Unlocked (No Ad)</MenuItem>
      <MenuItem value="locked">Locked (Show Ad)</MenuItem>
    </Select>
  </FormControl>
)}

              </CardContent>
              <CardActions
                  sx={{
                    mt: 'auto',
                    minHeight: 52,       // 🔒 uniform footer
                    justifyContent: 'space-between',
                  }}
>

                <Box>
                  {hasPermission('write') && video.status === 'completed' && (
                    <Button
                      size="small"
                      onClick={() => handleTogglePublish(video._id, video.isPublished)}
                    >
                      {video.isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                  )}
                </Box>
                <Box>
                  {hasPermission('delete') && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(video._id)}
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

      {videos.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CloudUpload sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No videos uploaded yet
          </Typography>
        </Paper>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Video</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Stack spacing={2} sx={{ mt: 2 }}>
            {/* Video Upload */}
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

            {/* Thumbnail Upload */}
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
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Preview
                  </Typography>
                </Box>
              )}
              
              {!selectedThumbnailFile && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  If no thumbnail is provided, one will be auto-generated from the video
                </Typography>
              )}
            </Box>

            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              >
                <MenuItem value="reel">Reel</MenuItem>
                <MenuItem value="episode">Episode</MenuItem>
              </Select>
            </FormControl>

            {formData.type === 'episode' && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Season</InputLabel>
                  <Select
                    value={formData.seasonId}
                    label="Season"
                    onChange={(e) => setFormData({ ...formData, seasonId: e.target.value })}
                  >
                    {seasons.map((season) => (
                      <MenuItem key={season._id} value={season._id}>
                        {season.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Episode Number"
                  type="number"
                  value={formData.episodeNumber}
                  onChange={(e) => setFormData({ ...formData, episodeNumber: e.target.value })}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleUpload} variant="contained" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Thumbnail Change Dialog */}
      <Dialog open={thumbnailDialogOpen} onClose={handleCloseThumbnailDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Change Thumbnail</DialogTitle>
        <DialogContent>
          {selectedVideoForThumbnail && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Video: {selectedVideoForThumbnail.title}
              </Typography>
              
              {/* Current Thumbnail */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Current Thumbnail</Typography>
                <Box
                  component="img"
                  src={
                    selectedVideoForThumbnail.thumbnailUrl ||
                    'https://via.placeholder.com/300x200?text=No+Thumbnail'
                  }
                  alt="Current thumbnail"
                  sx={{
                    width: '100%',
                    maxHeight: '200px',
                    objectFit: 'contain',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                />
              </Box>

              {/* New Thumbnail Upload */}
              <Box>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{ py: 2 }}
                  color={newThumbnailFile ? 'success' : 'primary'}
                  startIcon={<ImageIcon />}
                >
                  {newThumbnailFile ? 'Thumbnail Selected' : 'Select New Thumbnail'}
                  <input 
                    type="file" 
                    hidden 
                    accept="image/jpeg,image/jpg,image/png" 
                    onChange={handleNewThumbnailSelect} 
                  />
                </Button>
                
                {newThumbnailPreview && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>New Thumbnail Preview</Typography>
                    <Box
                      component="img"
                      src={newThumbnailPreview}
                      alt="New thumbnail preview"
                      sx={{
                        width: '100%',
                        maxHeight: '200px',
                        objectFit: 'contain',
                        border: '1px solid',
                        borderColor: 'primary.main',
                        borderRadius: 1,
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseThumbnailDialog}>Cancel</Button>
          <Button 
            onClick={handleUpdateThumbnail} 
            variant="contained" 
            disabled={thumbnailUploading || !newThumbnailFile}
          >
            {thumbnailUploading ? 'Uploading...' : 'Update Thumbnail'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VideoManagementPage;