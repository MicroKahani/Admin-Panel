import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  TextField,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
  Avatar,
  Paper,
} from '@mui/material';
import { Delete, Add, CloudUpload, Edit } from '@mui/icons-material';

interface CastMember {
  id?: string;
  name: string;
  character: string;
  image?: string;
  role: 'actor' | 'crew';
}

interface CastCrewManagerProps {
  castMembers: CastMember[];
  onCastChange: (castMembers: CastMember[]) => void;
  error?: string;
}

const CastCrewManager: React.FC<CastCrewManagerProps> = ({
  castMembers,
  onCastChange,
  error,
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<CastMember>({
    name: '',
    character: '',
    role: 'actor',
  });
  const [validationError, setValidationError] = useState('');

  const handleOpenDialog = (index?: number) => {
    setValidationError('');
    if (index !== undefined) {
      // Edit mode
      setEditingIndex(index);
      const member = castMembers[index];
      setFormData(member);
      setImagePreview(member.image || '');
      setSelectedImageFile(null);
    } else {
      // Add mode
      setEditingIndex(null);
      setFormData({ name: '', character: '', role: 'actor' });
      setImagePreview('');
      setSelectedImageFile(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ name: '', character: '', role: 'actor' });
    setImagePreview('');
    setSelectedImageFile(null);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setValidationError('Image size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setValidationError('Only image files are allowed');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    setValidationError('');

    if (!formData.name.trim()) {
      setValidationError('Name is required');
      return false;
    }

    if (!formData.character.trim()) {
      setValidationError('Character/Role is required');
      return false;
    }

    if (editingIndex === null && !imagePreview) {
      setValidationError('Image is required for new cast members');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const updatedMember: CastMember = {
      ...formData,
      id: formData.id || `cast_${Date.now()}`,
      image: imagePreview,
    };

    const updatedMembers = [...castMembers];
    if (editingIndex !== null) {
      updatedMembers[editingIndex] = updatedMember;
    } else {
      updatedMembers.push(updatedMember);
    }

    onCastChange(updatedMembers);
    handleCloseDialog();
  };

  const handleDeleteMember = (index: number) => {
    const updatedMembers = castMembers.filter((_, i) => i !== index);
    onCastChange(updatedMembers);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Cast & Crew</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          color="primary"
        >
          Add Cast Member
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {castMembers.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f5' }}>
          <Typography color="textSecondary">No cast members added yet</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {castMembers.map((member, index) => (
            <Grid item xs={12} sm={6} md={4} key={member.id || index}>
              <Card sx={{ height: '100%' }}>
                {member.image && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={member.image}
                    alt={member.name}
                    sx={{ objectFit: 'cover' }}
                  />
                )}
                <CardContent>
                  <Typography variant="h6" gutterBottom noWrap>
                    {member.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {member.character}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'inline-block',
                      mt: 1,
                      px: 1,
                      py: 0.5,
                      bgcolor: member.role === 'actor' ? '#e3f2fd' : '#f3e5f5',
                      color: member.role === 'actor' ? '#1976d2' : '#7b1fa2',
                      borderRadius: 1,
                      fontWeight: 600,
                    }}
                  >
                    {member.role.toUpperCase()}
                  </Typography>
                </CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: 2 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(index)}
                    color="primary"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteMember(index)}
                    color="error"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIndex !== null ? 'Edit Cast Member' : 'Add Cast Member'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {validationError && (
              <Alert severity="error">{validationError}</Alert>
            )}

            {/* Image Upload */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Photo
              </Typography>
              {imagePreview && (
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      borderRadius: '8px',
                    }}
                  />
                </Box>
              )}
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<CloudUpload />}
              >
                {imagePreview ? 'Change Photo' : 'Upload Photo'}
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleImageSelect}
                />
              </Button>
            </Box>

            {/* Name Field */}
            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
              placeholder="e.g., John Doe"
            />

            {/* Character Field */}
            <TextField
              label="Character/Role"
              name="character"
              value={formData.character}
              onChange={handleInputChange}
              fullWidth
              placeholder="e.g., Lead Actor, Director, Cinematographer"
            />

            {/* Role Type */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Type
              </Typography>
              <Stack direction="row" spacing={1}>
                {(['actor', 'crew'] as const).map((role) => (
                  <Button
                    key={role}
                    variant={formData.role === role ? 'contained' : 'outlined'}
                    onClick={() => setFormData((prev) => ({ ...prev, role }))}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Button>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {editingIndex !== null ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CastCrewManager;
