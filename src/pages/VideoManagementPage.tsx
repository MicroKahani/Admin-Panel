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
  Stack,
} from '@mui/material';
import { Delete, CloudUpload, Image as ImageIcon } from '@mui/icons-material';
import { getAllVideos, updateVideo, deleteVideo, getAllSeasons, updateVideoAdStatus } from '../services/api';
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
  // Upload and Reels filtering removed
  const [thumbnailDialogOpen, setThumbnailDialogOpen] = useState(false);
  const [selectedVideoForThumbnail, setSelectedVideoForThumbnail] = useState<Video | null>(null);
  const [newThumbnailFile, setNewThumbnailFile] = useState<File | null>(null);
  const [newThumbnailPreview, setNewThumbnailPreview] = useState<string>('');
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailVersion, setThumbnailVersion] = useState<Record<string, number>>({});
  const { hasPermission } = useAuth();
  
  // Filtering states
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPublish, setFilterPublish] = useState<string>('all');
  const [filterSeason, setFilterSeason] = useState<string>('all');

  useEffect(() => {
    fetchVideos();
    fetchSeasons();
  }, []);

  // Filtered videos logic
  const filteredVideos = videos.filter((video) => {
    // Search term filter
    const searchMatch = 
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Status filter
    const statusMatch = filterStatus === 'all' || video.status === filterStatus;
    
    // Publish filter
    const publishMatch = filterPublish === 'all' || 
      (filterPublish === 'published' ? video.isPublished : !video.isPublished);
      
    // Season filter (for episodes)
    const seasonMatch = filterSeason === 'all' || 
      (video.type === 'episode' && (video as any).seasonId?._id === filterSeason) || 
      (video.type === 'episode' && (video as any).seasonId === filterSeason);

    return searchMatch && statusMatch && publishMatch && seasonMatch;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterPublish('all');
    setFilterSeason('all');
  };

  const fetchVideos = async () => {
    try {
      const response: any = await getAllVideos();
      const videosData = response.data?.data || response.data || [];
      if (Array.isArray(videosData)) {
        setVideos(videosData);
      } else {
        console.error('Videos data is not an array:', videosData);
        setVideos([]);
      }
    } catch (err) {
      console.error('Failed to fetch videos:', err);
      setVideos([]);
    }
  };

  const fetchSeasons = async () => {
    try {
      const response: any = await getAllSeasons();
      const seasonsData = response.data?.data || response.data || [];
      if (Array.isArray(seasonsData)) {
        setSeasons(seasonsData);
      } else {
        console.error('Seasons data is not an array:', seasonsData);
        setSeasons([]);
      }
    } catch (err) {
      console.error('Failed to fetch seasons:', err);
      setSeasons([]);
    }
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

      </Box>

      {/* Filters Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, sm: 4, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            label="Search Videos"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Title or description..."
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="uploading">Uploading</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Publish State</InputLabel>
            <Select
              value={filterPublish}
              label="Publish State"
              onChange={(e) => setFilterPublish(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="unpublished">Unpublished</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Season</InputLabel>
            <Select
              value={filterSeason}
              label="Season"
              onChange={(e) => setFilterSeason(e.target.value)}
            >
              <MenuItem value="all">All Seasons</MenuItem>
              {seasons.map((season) => (
                <MenuItem key={season._id} value={season._id}>
                  {season.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 1 }}>
          <Button 
            fullWidth 
            variant="outlined" 
            onClick={clearFilters}
            size="medium"
          >
            Clear
          </Button>
        </Grid>
      </Grid>
      </Paper>

      <Grid container spacing={3}>
        {filteredVideos.map((video) => (
          <Grid key={video._id} size={{ xs: 12, sm: 6, md: 4 }}>

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

      {filteredVideos.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CloudUpload sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No videos uploaded yet
          </Typography>
        </Paper>
      )}



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