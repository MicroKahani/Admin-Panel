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
import { Upload, Delete, CloudUpload, Image as ImageIcon } from '@mui/icons-material';
import { getAllVideos, uploadVideo, updateVideo, deleteVideo, getAllSeasons } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Video {
  _id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  type: 'reel' | 'episode';
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  isPublished: boolean;
  duration: number;
  createdAt: string;
}

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
            <Card>
              <CardMedia
                component="img"
                height="180"
                image={video.thumbnailUrl || 'https://via.placeholder.com/300x180?text=No+Thumbnail'}
                alt={video.title}
              />
              <CardContent>
                <Typography variant="h6" noWrap>
                  {video.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {video.description || 'No description'}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={video.type} size="small" />
                  <Chip
                    label={video.status}
                    size="small"
                    color={getStatusColor(video.status) as any}
                  />
                  {video.isPublished && <Chip label="Published" size="small" color="success" />}
                </Box>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between' }}>
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
    </Box>
  );
};

export default VideoManagementPage;