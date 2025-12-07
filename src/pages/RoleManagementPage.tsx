// frontend/src/pages/RoleManagementPage.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { getAllAdmins, createAdmin, updateAdmin, deleteAdmin } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Admin {
  _id: string;
  email: string;
  role: 'admin' | 'manager';
  permissions: { read: boolean; write: boolean; delete: boolean };
  isActive: boolean;
  createdAt: string;
}

const RoleManagementPage: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    role: 'manager' as 'admin' | 'manager',
    permissions: { read: true, write: false, delete: false },
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [fetchError, setFetchError] = useState('');
  const { hasPermission } = useAuth();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setFetchLoading(true);
    setFetchError('');
    try {
      const response = await getAllAdmins();
      console.log('Fetched admins response:', response); // Debug log
      
      // Backend returns: { message, total, admins }
      // So we need to access response.data.admins
      const adminsData = response.data?.admins || response.admins || [];
      console.log('Admins data:', adminsData); // Debug log
      
      setAdmins(Array.isArray(adminsData) ? adminsData : []);
    } catch (err: any) {
      console.error('Failed to fetch admins:', err);
      setFetchError(err.response?.data?.message || 'Failed to load admins');
      setAdmins([]);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleOpenDialog = (admin?: Admin) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      });
    } else {
      setEditingAdmin(null);
      setFormData({
        email: '',
        role: 'manager',
        permissions: { read: true, write: false, delete: false },
      });
    }
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAdmin(null);
    setError('');
  };

  const handleSubmit = async () => {
    // Validation
    if (!editingAdmin && !formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!editingAdmin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (editingAdmin) {
        await updateAdmin(editingAdmin._id, {
          role: formData.role,
          permissions: formData.permissions,
        });
      } else {
        await createAdmin(formData);
      }
      await fetchAdmins();
      handleCloseDialog();
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (adminId: string) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;

    try {
      await deleteAdmin(adminId);
      await fetchAdmins();
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete admin');
    }
  };

  // Show loading state
  if (fetchLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Role Management
        </Typography>
        {hasPermission('write') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Admin/Manager
          </Button>
        )}
      </Box>

      {fetchError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {fetchError}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Permissions</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Created</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    No admins found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => (
                <TableRow key={admin._id}>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={admin.role}
                      color={admin.role === 'admin' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {admin.role === 'admin' ? (
                      <Typography variant="body2" color="text.secondary">All</Typography>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {admin.permissions.read && <Chip label="Read" size="small" />}
                        {admin.permissions.write && <Chip label="Write" size="small" />}
                        {admin.permissions.delete && <Chip label="Delete" size="small" color="error" />}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={admin.isActive ? 'Active' : 'Inactive'}
                      color={admin.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    {hasPermission('write') && (
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(admin)}
                      >
                        <Edit />
                      </IconButton>
                    )}
                    {hasPermission('delete') && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(admin._id)}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAdmin ? 'Edit Admin' : 'Add New Admin/Manager'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={!!editingAdmin}
            sx={{ mt: 2, mb: 2 }}
            required
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              label="Role"
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            >
              <MenuItem value="admin">Admin (Full Access)</MenuItem>
              <MenuItem value="manager">Manager (Custom Permissions)</MenuItem>
            </Select>
          </FormControl>

          {formData.role === 'manager' && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Permissions
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.permissions.read}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permissions: { ...formData.permissions, read: e.target.checked },
                      })
                    }
                  />
                }
                label="Read"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.permissions.write}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permissions: { ...formData.permissions, write: e.target.checked },
                      })
                    }
                  />
                }
                label="Write"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.permissions.delete}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permissions: { ...formData.permissions, delete: e.target.checked },
                      })
                    }
                  />
                }
                label="Delete"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : editingAdmin ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleManagementPage;