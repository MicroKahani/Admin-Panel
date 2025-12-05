import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Avatar,
  IconButton,
  Tooltip,
  Chip,
  Grid
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Business,
  Language,
  PhotoLibrary,
  Save,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import {
  getAllGeneralSponsors,
  createGeneralSponsor,
  updateGeneralSponsor,
  deleteGeneralSponsor,
  toggleGeneralSponsorStatus,
  GeneralSponsor,
  GeneralSponsorFormData
} from '../services/api';

const GeneralSponsors: React.FC = () => {
  const [sponsors, setSponsors] = useState<GeneralSponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<GeneralSponsor | null>(null);
  const [formData, setFormData] = useState<GeneralSponsorFormData>({
    name: '',
    imageUrl: '',
    websiteUrl: '',
    isActive: true
  });

  // Load all sponsors
  const loadSponsors = async () => {
    try {
      setLoading(true);
      const response = await getAllGeneralSponsors();
      if (response.success) {
        setSponsors(response.data);
      } else {
        setError('Failed to load sponsors');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading sponsors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSponsors();
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setUpdating(true);
      
      if (editingSponsor) {
        // Update existing sponsor
        const response = await updateGeneralSponsor(editingSponsor._id, formData);
        if (response.success) {
          setSuccess('Sponsor updated successfully');
          await loadSponsors();
        }
      } else {
        // Create new sponsor
        const response = await createGeneralSponsor(formData);
        if (response.success) {
          setSuccess('Sponsor created successfully');
          await loadSponsors();
        }
      }
      
      setDialogOpen(false);
      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to save sponsor');
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdating(false);
    }
  };

  // Handle delete
  const handleDelete = async (sponsor: GeneralSponsor) => {
    if (window.confirm(`Are you sure you want to delete "${sponsor.name}"?`)) {
      try {
        setUpdating(true);
        const response = await deleteGeneralSponsor(sponsor._id);
        if (response.success) {
          setSuccess('Sponsor deleted successfully');
          await loadSponsors();
          setTimeout(() => setSuccess(null), 3000);
        }
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to delete sponsor');
        setTimeout(() => setError(null), 5000);
      } finally {
        setUpdating(false);
      }
    }
  };



  // Handle status toggle
  const handleToggleStatus = async (sponsor: GeneralSponsor) => {
    try {
      setUpdating(true);
      const response = await toggleGeneralSponsorStatus(sponsor._id);
      if (response.success) {
       // setSuccess(response.message);
        await loadSponsors();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update sponsor status');
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdating(false);
    }
  };

  // Dialog handlers
  const openAddDialog = () => {
    resetForm();
    setEditingSponsor(null);
    setDialogOpen(true);
  };

  const openEditDialog = (sponsor: GeneralSponsor) => {
    setFormData({
      name: sponsor.name,
      imageUrl: sponsor.imageUrl,
      websiteUrl: sponsor.websiteUrl,
      isActive: sponsor.isActive
    });
    setEditingSponsor(sponsor);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    resetForm();
    setEditingSponsor(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      imageUrl: '',
      websiteUrl: '',
      isActive: true
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth={1200} mx="auto" p={2}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700} color="primary">
          General Sponsor Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openAddDialog}
          disabled={updating}
        >
          Add New Sponsor
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Sponsors Grid */}
      {sponsors.length > 0 ? (
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)'
            },
            gap: 3
          }}
        >
          {sponsors.map((sponsor) => (
            <Card
              key={sponsor._id}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                },
                opacity: sponsor.isActive ? 1 : 0.6
              }}
            >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                  {/* Logo */}
                  {sponsor.imageUrl ? (
                    <img
                      src={sponsor.imageUrl}
                      alt={sponsor.name}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        marginBottom: '16px'
                      }}
                    />
                  ) : (
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        mx: 'auto',
                        mb: 2,
                        bgcolor: 'primary.200'
                      }}
                    >
                      <Business fontSize="large" />
                    </Avatar>
                  )}

                  {/* Name */}
                  <Typography variant="h6" fontWeight={600} mb={1}>
                    {sponsor.name}
                  </Typography>

                  {/* Website */}
                  {sponsor.websiteUrl && (
                    <Typography
                      variant="body2"
                      color="primary.main"
                      sx={{
                        mb: 2,
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        '&:hover': { color: 'primary.dark' }
                      }}
                      onClick={() => window.open(sponsor.displayWebsiteUrl, '_blank')}
                    >
                      <Language fontSize="small" />
                      Website
                    </Typography>
                  )}

                  {/* Status */}
                  <Chip
                    label={sponsor.isActive ? 'Active' : 'Inactive'}
                    color={sponsor.isActive ? 'success' : 'default'}
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  {/* Created Date */}
                  <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                    Created: {sponsor.formattedCreatedAt}
                  </Typography>

                  {/* Action Buttons */}
                  <Box display="flex" justifyContent="center" gap={1}>
                    <Tooltip title="Edit Sponsor">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => openEditDialog(sponsor)}
                        disabled={updating}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={sponsor.isActive ? 'Deactivate' : 'Activate'}>
                      <IconButton
                        size="small"
                        color={sponsor.isActive ? 'warning' : 'success'}
                        onClick={() => handleToggleStatus(sponsor)}
                        disabled={updating}
                      >
                        {sponsor.isActive ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Sponsor">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(sponsor)}
                        disabled={updating}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            bgcolor: 'grey.50',
            borderRadius: 2,
            border: '2px dashed',
            borderColor: 'grey.300'
          }}
        >
          <Business sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" mb={2}>
            No General Sponsors Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Create your first general sponsor to showcase on the homepage
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openAddDialog}
            size="large"
          >
            Add First Sponsor
          </Button>
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Business color="primary" />
            <Typography variant="h6" fontWeight={600}>
              {editingSponsor ? 'Edit General Sponsor' : 'Add New General Sponsor'}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <TextField
              label="Sponsor Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
              variant="outlined"
              placeholder="Enter sponsor company name"
            />
            
            <TextField
              label="Website URL"
              value={formData.websiteUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
              fullWidth
              variant="outlined"
              placeholder="https://example.com"
              InputProps={{
                startAdornment: <Language sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              helperText="Optional: Company website URL"
            />
            
            <TextField
              label="Logo Image URL"
              value={formData.imageUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
              fullWidth
              variant="outlined"
              placeholder="https://example.com/logo.png"
              InputProps={{
                startAdornment: <PhotoLibrary sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              helperText="Optional: Direct URL to sponsor logo image"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  color="primary"
                />
              }
              label="Active (visible on homepage)"
            />
            
            {/* Preview */}
            {(formData.name || formData.imageUrl) && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" mb={1}>
                  Preview:
                </Typography>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 2, 
                  border: 1, 
                  borderColor: 'grey.200', 
                  borderRadius: 1, 
                  bgcolor: 'white' 
                }}>
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt={formData.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        marginBottom: '8px'
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 1, bgcolor: 'primary.200' }}>
                      <Business />
                    </Avatar>
                  )}
                  {formData.name && (
                    <Typography variant="subtitle1" fontWeight={600}>
                      {formData.name}
                    </Typography>
                  )}
                  <Chip
                    label={formData.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={formData.isActive ? 'success' : 'default'}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={closeDialog} disabled={updating}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={updating || !formData.name.trim()}
            startIcon={updating ? <CircularProgress size={16} /> : <Save />}
          >
            {updating ? 'Saving...' : (editingSponsor ? 'Update' : 'Create')} Sponsor
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GeneralSponsors;