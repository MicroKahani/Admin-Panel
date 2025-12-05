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
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { getAllAdmins, createAdmin, updateAdmin, deleteAdmin } from '../services/api';

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
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await getAllAdmins();
      setAdmins(response.data);
    } catch (err) {
      console.error('Failed to fetch admins:', err);
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
  };

  const handleSubmit = async () => {
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
      alert(err.response?.data?.message || 'Failed to delete admin');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Role Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Admin/Manager
        </Button>
      </Box>

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
            {admins.map((admin) => (
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
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(admin)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(admin._id)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
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