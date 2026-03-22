// frontend/src/pages/WebSeriesPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import { Add, Edit, Delete, Visibility, Public as PublicIcon, PublicOff as PublicOffIcon } from '@mui/icons-material';
import { getAllSeasons, createSeason, updateSeason, deleteSeason, toggleSeasonPublish } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AVAILABLE_TAGS = [
  'Trending Now',
  'Drama & Emotions',
  'Comedy Section',
  'Thriller & Suspense',
  'Religious & Devotional',
  'Life Philosophy',
] as const;

interface SeasonTagEntry {
  name: string;
  addedAt: string;
}

interface Season {
  _id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  episodeCount: number;
  seasonNumber: number;
  isActive: boolean;
  tags?: SeasonTagEntry[];
  createdAt: string;
}

const getTagNames = (tags?: (SeasonTagEntry | string)[]): string[] =>
  (tags || []).map((t) => typeof t === 'string' ? t : t.name);

const WebSeriesPage: React.FC = () => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    seasonNumber: '',
    tags: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');

  useEffect(() => {
    fetchSeasons();
  }, []);

  // Filtered seasons logic
  const filteredSeasons = seasons.filter((season) => {
    // Search term filter
    const searchMatch = 
      season.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (season.description && season.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Status filter
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'active' ? season.isActive : !season.isActive);

    // Tag filter
    const tagMatch = filterTag === 'all' || 
      (season.tags && season.tags.some((t) => (typeof t === 'string' ? t : t.name) === filterTag));

    return searchMatch && statusMatch && tagMatch;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterTag('all');
  };

  const fetchSeasons = async () => {
    setFetchLoading(true);
    try {
      console.log('Fetching seasons...');
      const response: any = await getAllSeasons();
      console.log('Seasons response:', response);
      
      // Check if response has data
      if (response && response.data) {
        console.log('Response data:', response.data);
        
        // Handle different response structures
        const seasonsData = response.data.data || response.data;
        console.log('Seasons data:', seasonsData);
        
        if (Array.isArray(seasonsData)) {
          setSeasons(seasonsData);
          console.log('Set seasons:', seasonsData.length, 'items');
        } else {
          console.error('Seasons data is not an array:', seasonsData);
          setSeasons([]);
        }
      } else {
        console.error('No response data');
        setSeasons([]);
      }
    } catch (err) {
      console.error('Failed to fetch seasons:', err);
      setError('Failed to load web series');
      setSeasons([]);
    } finally {
      setFetchLoading(false);
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

  const handleOpenDialog = (season?: Season) => {
    if (season) {
      setSelectedSeason(season);
      setFormData({
        title: season.title,
        description: season.description || '',
        seasonNumber: season.seasonNumber.toString(),
        tags: getTagNames(season.tags),
      });
      setThumbnailPreview(season.thumbnail || '');
    } else {
      setSelectedSeason(null);
      setFormData({
        title: '',
        description: '',
        seasonNumber: (seasons.length + 1).toString(),
        tags: [],
      });
      setThumbnailPreview('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSeason(null);
    setSelectedThumbnailFile(null);
    setThumbnailPreview('');
    setFormData({
      title: '',
      description: '',
      seasonNumber: '',
      tags: [],
    });
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!formData.seasonNumber || parseInt(formData.seasonNumber) < 1) {
      setError('Please enter a valid season number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('seasonNumber', formData.seasonNumber);
      formDataToSend.append('tags', JSON.stringify(formData.tags));

      if (selectedThumbnailFile) {
        formDataToSend.append('thumbnail', selectedThumbnailFile);
      }

      if (selectedSeason) {
        await updateSeason(selectedSeason._id, formDataToSend);
        alert('Season updated successfully!');
      } else {
        await createSeason(formDataToSend);
        alert('Season created successfully!');
      }

      handleCloseDialog();
      fetchSeasons();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (seasonId: string) => {
    if (!window.confirm('Are you sure you want to delete this season? All episodes will remain but be unlinked.')) return;

    try {
      await deleteSeason(seasonId);
      fetchSeasons();
      alert('Season deleted successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete season');
    }
  };

  const handleTogglePublish = async (season: Season) => {
    const action = season.isActive ? 'unpublish' : 'publish';
    if (!window.confirm(`Are you sure you want to ${action} "${season.title}"?\n\n${season.isActive ? 'Users will no longer see this web series in the app.' : 'This web series will become visible to all users in the app.'}`)) return;

    // Optimistic update
    setSeasons((prev) =>
      prev.map((s) => s._id === season._id ? { ...s, isActive: !s.isActive } : s)
    );

    try {
      await toggleSeasonPublish(season._id, !season.isActive);
    } catch (err: any) {
      // Rollback on failure
      setSeasons((prev) =>
        prev.map((s) => s._id === season._id ? { ...s, isActive: season.isActive } : s)
      );
      alert(err.response?.data?.message || `Failed to ${action} season`);
    }
  };

  const handleViewSeason = (seasonId: string) => {
    navigate(`/webseries/${seasonId}`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Web Series Management
        </Typography>
        {hasPermission('write') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add New WebSeries
          </Button>
        )}
      </Box>

      {/* Show error if exists */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Search Web Series"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Title or description..."
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Tag</InputLabel>
              <Select
                value={filterTag}
                label="Tag"
                onChange={(e) => setFilterTag(e.target.value)}
              >
                <MenuItem value="all">All Tags</MenuItem>
                {AVAILABLE_TAGS.map((tag) => (
                  <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, sm: 2, md: 1 }}>
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

      {/* Show loading state */}
      {fetchLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Stack alignItems="center" spacing={2}>
            <Typography>Loading web series...</Typography>
          </Stack>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredSeasons.map((season) => (
          <Grid key={season._id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
                sx={{
                  width: 320,          // 🔒 SAME WIDTH (same as video page)
                  height: 500,         // Increased to fit Publish button
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  mx: 'auto',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
              >

              <CardMedia
                  component="img"
                  height="200"
                  sx={{
                    width: '100%',
                    objectFit: 'cover',
                  }}
                  image={season.thumbnail || 'https://via.placeholder.com/300x200?text=No+Thumbnail'}
                  alt={season.title}
                  onClick={() => handleViewSeason(season._id)}
                />

              <CardContent
                    onClick={() => handleViewSeason(season._id)}
                    sx={{
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                  <Chip label={`Season ${season.seasonNumber}`} size="small" color="primary" />
                  <Chip label={`${season.episodeCount} Episodes`} size="small" variant="outlined" />
                  <Chip
                    label={season.isActive ? 'Published' : 'Unpublished'}
                    size="small"
                    color={season.isActive ? 'success' : 'default'}
                    variant={season.isActive ? 'filled' : 'outlined'}
                    sx={{ ml: 'auto' }}
                  />
                </Box>
                {season.tags && season.tags.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.5 }}>
                    {getTagNames(season.tags).map((tagName) => (
                      <Chip key={tagName} label={tagName} size="small" color="warning" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                    ))}
                  </Box>
                )}
                <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >

                  {season.title}
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: 40,        // 🔒 SAME as video page
                    }}
                  >
                    {season.description || 'No description'}
                  </Typography>

              </CardContent>
              <CardActions
                    sx={{
                      mt: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      gap: 0.5,
                      px: 2,
                      pb: 2,
                    }}
                  >
                {/* Publish / Unpublish — full width prominent button */}
                {hasPermission('write') && (
                  <Button
                    fullWidth
                    size="small"
                    variant={season.isActive ? 'outlined' : 'contained'}
                    color={season.isActive ? 'error' : 'success'}
                    startIcon={season.isActive ? <PublicOffIcon /> : <PublicIcon />}
                    onClick={(e) => { e.stopPropagation(); handleTogglePublish(season); }}
                  >
                    {season.isActive ? 'Unpublish' : 'Publish to App'}
                  </Button>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => handleViewSeason(season._id)}
                  >
                    View Episodes
                  </Button>
                  <Box>
                    {hasPermission('write') && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(season);
                        }}
                      >
                        <Edit />
                      </IconButton>
                    )}
                    {hasPermission('delete') && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(season._id);
                        }}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </CardActions>
            </Card>
          </Grid>
          ))}
        </Grid>

        {filteredSeasons.length === 0 && !fetchLoading && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No web series created yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click "Add New WebSeries" to create your first season
            </Typography>
          </Paper>
        )}
      </>
    )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedSeason ? 'Edit Season' : 'Create New Season'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Stack spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ py: 2 }}
              color={selectedThumbnailFile || thumbnailPreview ? 'success' : 'primary'}
            >
              {selectedThumbnailFile ? 'Thumbnail Selected' : 'Upload Thumbnail'}
              <input 
                type="file" 
                hidden 
                accept="image/jpeg,image/jpg,image/png" 
                onChange={handleThumbnailFileSelect} 
              />
            </Button>
            
            {thumbnailPreview && (
              <Box sx={{ textAlign: 'center' }}>
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

            <TextField
              fullWidth
              label="Season Number"
              type="number"
              value={formData.seasonNumber}
              onChange={(e) => setFormData({ ...formData, seasonNumber: e.target.value })}
              required
            />

            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g., Bhutiya Gadi"
            />

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the season..."
            />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Home Screen Categories
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {AVAILABLE_TAGS.map((tag) => {
                  const isSelected = formData.tags.includes(tag);
                  return (
                    <Chip
                      key={tag}
                      label={tag}
                      clickable
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          tags: isSelected
                            ? prev.tags.filter((t) => t !== tag)
                            : [...prev.tags, tag],
                        }));
                      }}
                      color={isSelected ? 'warning' : 'default'}
                      variant={isSelected ? 'filled' : 'outlined'}
                      sx={{
                        fontWeight: isSelected ? 600 : 400,
                        fontSize: '0.85rem',
                        py: 2,
                        transition: 'all 0.2s',
                        borderWidth: 2,
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                      }}
                    />
                  );
                })}
              </Box>
              {formData.tags.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {formData.tags.length} tag{formData.tags.length > 1 ? 's' : ''} selected
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : selectedSeason ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WebSeriesPage;