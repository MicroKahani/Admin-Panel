// frontend/src/pages/CarouselManagementPage.tsx
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
  IconButton,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  CircularProgress,
  FormHelperText,
} from '@mui/material';
import { Add, Edit, Delete, Visibility, Save, Cancel } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { 
  getAllCarouselItems, 
  createCarouselItem, 
  updateCarouselItem, 
  deleteCarouselItem,
  reorderCarouselItems
} from '../services/api';
import { getAllSeasons } from '../services/api';

interface CarouselItem {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  contentType: 'webseries' | 'reels' | 'trending' | 'custom';
  contentId?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

interface Season {
  _id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  episodeCount: number;
  seasonNumber: number;
  isActive: boolean;
  createdAt: string;
}

const CarouselManagementPage: React.FC = () => {
  const [carousels, setCarousels] = useState<CarouselItem[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCarousel, setSelectedCarousel] = useState<CarouselItem | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const [error, setError] = useState('');
  const { hasPermission } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contentType: 'webseries' as 'webseries' | 'reels' | 'trending' | 'custom',
    contentId: '',
    order: 1,
    isActive: true,
  });

  // Fetch carousels and seasons
  useEffect(() => {
    fetchCarousels();
    fetchSeasons();
  }, []);

  const fetchCarousels = async () => {
    setFetchLoading(true);
    try {
      const response: any = await getAllCarouselItems();
      // Type assertion to ensure correct type
      const responseData = response.data || {};
      const carouselData = (responseData.data || []) as CarouselItem[];
      setCarousels(carouselData);
    } catch (err: any) {
      setError('Failed to load carousel items: ' + (err.response?.data?.message || err.message));
      console.error('Failed to fetch carousels:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchSeasons = async () => {
    setSeasonsLoading(true);
    try {
      const response: any = await getAllSeasons();
      const responseData: any = response.data || {};
      const seasonsData = responseData.data || responseData || [];
      setSeasons(Array.isArray(seasonsData) ? seasonsData : []);
    } catch (err: any) {
      console.error('Failed to fetch seasons:', err);
    } finally {
      setSeasonsLoading(false);
    }
  };

  const handleImageFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, JPEG, and PNG files are allowed');
        return;
      }

      setSelectedImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenDialog = (carousel?: CarouselItem) => {
    if (carousel) {
      setSelectedCarousel(carousel);
      setFormData({
        title: carousel.title,
        description: carousel.description,
        contentType: carousel.contentType,
        contentId: carousel.contentId || '',
        order: carousel.order,
        isActive: carousel.isActive,
      });
      setImagePreview(carousel.imageUrl);
    } else {
      setSelectedCarousel(null);
      setFormData({
        title: '',
        description: '',
        contentType: 'webseries',
        contentId: '',
        order: carousels.length + 1,
        isActive: true,
      });
      setImagePreview('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCarousel(null);
    setSelectedImageFile(null);
    setImagePreview('');
    setFormData({
      title: '',
      description: '',
      contentType: 'webseries',
      contentId: '',
      order: 1,
      isActive: true,
    });
    setError('');
  };

  const handleSeasonSelect = (season: Season | null) => {
    if (season) {
      setFormData({
        ...formData,
        title: season.title,
        description: season.description || '',
        contentId: season._id,
      });
      setImagePreview(season.thumbnail || '');
    } else {
      setFormData({
        ...formData,
        title: '',
        description: '',
        contentId: '',
      });
      setImagePreview('');
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (formData.contentType === 'webseries' && !formData.contentId) {
      setError('Please select a web series');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('contentType', formData.contentType);
      if (formData.contentId) {
        formDataToSend.append('contentId', formData.contentId);
      }
      formDataToSend.append('order', formData.order.toString());
      formDataToSend.append('isActive', formData.isActive.toString());
      
      if (selectedImageFile) {
        formDataToSend.append('image', selectedImageFile);
      } else if (imagePreview && !selectedImageFile) {
        // If we're using a season thumbnail, we don't need to upload an image
      }

      if (selectedCarousel) {
        // Update existing carousel
        await updateCarouselItem(selectedCarousel._id, formDataToSend);
        alert('Carousel item updated successfully!');
      } else {
        // Create new carousel
        await createCarouselItem(formDataToSend);
        alert('Carousel item created successfully!');
      }

      handleCloseDialog();
      fetchCarousels(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (carouselId: string) => {
    if (!window.confirm('Are you sure you want to delete this carousel item?')) return;

    try {
      await deleteCarouselItem(carouselId);
      alert('Carousel item deleted successfully!');
      fetchCarousels(); // Refresh the list
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete carousel item');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    
    try {
      const newCarousels = [...carousels];
      [newCarousels[index], newCarousels[index - 1]] = [newCarousels[index - 1], newCarousels[index]];
      
      // Update order values
      newCarousels.forEach((item, i) => {
        item.order = i + 1;
      });
      
      // Prepare items for reorder API
      const itemsToReorder = newCarousels.map(item => ({
        id: item._id,
        order: item.order
      }));
      
      await reorderCarouselItems(itemsToReorder);
      setCarousels(newCarousels);
    } catch (err: any) {
      alert('Failed to reorder carousel items: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === carousels.length - 1) return;
    
    try {
      const newCarousels = [...carousels];
      [newCarousels[index], newCarousels[index + 1]] = [newCarousels[index + 1], newCarousels[index]];
      
      // Update order values
      newCarousels.forEach((item, i) => {
        item.order = i + 1;
      });
      
      // Prepare items for reorder API
      const itemsToReorder = newCarousels.map(item => ({
        id: item._id,
        order: item.order
      }));
      
      await reorderCarouselItems(itemsToReorder);
      setCarousels(newCarousels);
    } catch (err: any) {
      alert('Failed to reorder carousel items: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Carousel Management
        </Typography>
        {hasPermission('write') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add New Carousel Item
          </Button>
        )}
      </Box>

      {/* Show error if exists */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Show loading state */}
      {fetchLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography>Loading carousel items...</Typography>
          </Stack>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {carousels
              .sort((a, b) => a.order - b.order)
              .map((carousel, index) => (
                <Grid item xs={12} key={carousel._id}>
                  <Card 
                    sx={{ 
                      width: '100%',
                      maxWidth: 1000,          // 🔒 SAME WIDTH for all cards
                      height: 220,             // 🔒 SAME HEIGHT
                      mx: 'auto',              // center card in row
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      overflow: 'hidden',
                      transition: 'box-shadow 0.2s',
                      '&:hover': {
                        boxShadow: 6,
                      },
                    }}
                  >

                    <CardMedia
                      component="img"
                      sx={{ 
                        width: { xs: '100%', md: 220 }, // fixed image column
                        height: 220,                    // 🔒 match card height
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                      image={carousel.imageUrl}
                      alt={carousel.title}
                    />

                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        flexGrow: 1,
                      }}
                    >

                      <CardContent sx={{ flex: '1 0 auto' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Chip 
                            label={`Order: ${carousel.order}`} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                          <Chip 
                            label={carousel.contentType} 
                            size="small" 
                            color={carousel.isActive ? 'success' : 'default'} 
                            variant="filled" 
                          />
                          {carousel.isActive ? (
                            <Chip label="Active" size="small" color="success" />
                          ) : (
                            <Chip label="Inactive" size="small" color="default" />
                          )}
                        </Box>
                        <Typography
                        component="div"
                        variant="h6"
                        fontWeight="bold"
                        sx={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >

                          {carousel.title}
                        </Typography>
                        <Typography 
                          variant="subtitle1" 
                          color="text.secondary" 
                          component="div"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {carousel.description}
                        </Typography>
                        {carousel.contentId && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            <strong>Content ID:</strong> {carousel.contentId}
                          </Typography>
                        )}
                      </CardContent>
                      <CardActions
                            sx={{
                              minHeight: 52,           // 🔒 uniform footer
                              justifyContent: 'space-between',
                              px: 2,
                              pb: 2,
                            }}
                          >

                        <Box>
                          <IconButton 
                            size="small" 
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="18 15 12 9 6 15"></polyline>
                            </svg>
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleMoveDown(index)}
                            disabled={index === carousels.length - 1}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </IconButton>
                        </Box>
                        <Box>
                          {hasPermission('write') && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDialog(carousel)}
                            >
                              <Edit />
                            </IconButton>
                          )}
                          {hasPermission('delete') && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(carousel._id)}
                            >
                              <Delete />
                            </IconButton>
                          )}
                        </Box>
                      </CardActions>
                    </Box>
                  </Card>
                </Grid>
              ))}
          </Grid>

          {carousels.length === 0 && !fetchLoading && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                No carousel items created yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click "Add New Carousel Item" to create your first carousel item
              </Typography>
            </Paper>
          )}
        </>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedCarousel ? 'Edit Carousel Item' : 'Create New Carousel Item'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Stack spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ py: 2 }}
              color={selectedImageFile || imagePreview ? 'success' : 'primary'}
            >
              {selectedImageFile ? 'Image Selected' : 'Upload Carousel Image'}
              <input 
                type="file" 
                hidden 
                accept="image/jpeg,image/jpg,image/png" 
                onChange={handleImageFileSelect} 
              />
            </Button>
            
            {imagePreview && (
              <Box sx={{ textAlign: 'center' }}>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '200px',
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }} 
                />
              </Box>
            )}

            <FormControl fullWidth>
              <InputLabel>Content Type</InputLabel>
              <Select
                value={formData.contentType}
                label="Content Type"
                onChange={(e) => setFormData({ 
                  ...formData, 
                  contentType: e.target.value as 'webseries' | 'reels' | 'trending' | 'custom',
                  contentId: '', // Reset contentId when changing type
                  title: '',
                  description: ''
                })}
              >
                <MenuItem value="webseries">Web Series</MenuItem>
                <MenuItem value="reels">Reels</MenuItem>
                <MenuItem value="trending">Trending Content</MenuItem>
                <MenuItem value="custom">Custom Link</MenuItem>
              </Select>
            </FormControl>

            {formData.contentType === 'webseries' && (
              <Autocomplete
                options={seasons}
                getOptionLabel={(option) => `${option.title} (Season ${option.seasonNumber})`}
                value={seasons.find(s => s._id === formData.contentId) || null}
                onChange={(event, newValue) => handleSeasonSelect(newValue)}
                loading={seasonsLoading}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Select Web Series"
                    helperText="Select a web series to automatically populate title, description, and thumbnail"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {seasonsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            )}

            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g., Featured Web Series"
            />

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the carousel item..."
            />

            {formData.contentType === 'custom' && (
              <TextField
                fullWidth
                label="Custom Link/URL"
                value={formData.contentId}
                onChange={(e) => setFormData({ ...formData, contentId: e.target.value })}
                placeholder="Enter custom URL or deep link"
              />
            )}

            <TextField
              fullWidth
              label="Display Order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
              required
              InputProps={{ inputProps: { min: 1 } }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography>Active Status</Typography>
              <IconButton 
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                color={formData.isActive ? 'success' : 'default'}
              >
                {formData.isActive ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                )}
              </IconButton>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          >
            {loading ? 'Saving...' : selectedCarousel ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CarouselManagementPage;