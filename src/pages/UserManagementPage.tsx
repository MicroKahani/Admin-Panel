// frontend/src/pages/UserManagementPage.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Stack,
} from '@mui/material';
import {
  Block,
  CheckCircle,
  Search,
  Refresh,
  Person,
  Phone,
  Email,
} from '@mui/icons-material';
import {
  getAllUsers,
  banUser,
  unbanUser,
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface User {
  _id: string;
  phone: string;
  name?: string;
  username?: string;
  email?: string;
  coinsBalance?: number;
  totalVideosWatched?: number;
  streak?: number;
  isActive: boolean;
  isBlocked: boolean;
  commentBanned: boolean;
  createdAt: string;
  lastLoginDate?: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  commentBannedUsers: number;
}

const UserManagementPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked' | 'comment_banned'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banType, setBanType] = useState<'partial' | 'complete'>('complete');
  const [unbanType, setUnbanType] = useState<'partial' | 'complete' | 'both'>('both');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter, search]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAllUsers({
        page,
        limit: 50,
        search: search || undefined,
        status: statusFilter,
      });
      setUsers(response.data || []);
      setStats(response.stats || null);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await banUser(selectedUser._id, banType, banReason);
      setBanDialogOpen(false);
      setBanReason('');
      setBanType('complete');
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error('Failed to ban user:', err);
      setError(err.response?.data?.message || 'Failed to ban user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await unbanUser(selectedUser._id, unbanType === 'both' ? undefined : unbanType);
      setUnbanDialogOpen(false);
      setUnbanType('both');
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error('Failed to unban user:', err);
      setError(err.response?.data?.message || 'Failed to unban user');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        User Management
      </Typography>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4">{stats.totalUsers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Users
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.activeUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Blocked Users
                </Typography>
                <Typography variant="h4" color="error.main">
                  {stats.blockedUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Comment Banned
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.commentBannedUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid xs={12} sm={4}>
            <TextField
              fullWidth
              label="Search Users"
              placeholder="Phone, Name, Username, Email"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
              >
                <MenuItem value="all">All Users</MenuItem>
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="blocked">Completely Banned</MenuItem>
                <MenuItem value="comment_banned">Comment Banned</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid xs={12} sm={2}>
            <Button
              variant="outlined"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setPage(1);
              }}
              fullWidth
            >
              Clear
            </Button>
          </Grid>
          <Grid xs={12} sm={3}>
            <Button
              variant="contained"
              onClick={fetchUsers}
              startIcon={<Refresh />}
              fullWidth
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Users Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell align="right">Coins</TableCell>
                  <TableCell align="right">Videos Watched</TableCell>
                  <TableCell align="right">Streak</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="textSecondary" py={4}>
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user._id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {user.name || user.username || 'No Name'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ID: {user._id.slice(-8)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {user.phone && (
                            <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                              <Phone fontSize="small" color="action" />
                              <Typography variant="caption">{user.phone}</Typography>
                            </Box>
                          )}
                          {user.email && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Email fontSize="small" color="action" />
                              <Typography variant="caption">{user.email}</Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatNumber(user.coinsBalance)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(user.totalVideosWatched)}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={user.streak ?? 0}
                          size="small"
                          color={(user.streak ?? 0) > 0 ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {formatDate(user.lastLoginDate || '')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {user.isBlocked ? (
                          <Chip
                            label="Completely Banned"
                            size="small"
                            color="error"
                            icon={<Block />}
                          />
                        ) : user.commentBanned ? (
                          <Chip
                            label="Comment Banned"
                            size="small"
                            color="warning"
                            icon={<Block />}
                          />
                        ) : user.isActive ? (
                          <Chip
                            label="Active"
                            size="small"
                            color="success"
                            icon={<CheckCircle />}
                          />
                        ) : (
                          <Chip
                            label="Inactive"
                            size="small"
                            color="default"
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {user.isBlocked || user.commentBanned ? (
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => {
                              setSelectedUser(user);
                              // Determine which ban type to unban
                              if (user.isBlocked && user.commentBanned) {
                                setUnbanType('both');
                              } else if (user.isBlocked) {
                                setUnbanType('complete');
                              } else {
                                setUnbanType('partial');
                              }
                              setUnbanDialogOpen(true);
                            }}
                            title="Unban User"
                          >
                            <CheckCircle />
                          </IconButton>
                        ) : (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedUser(user);
                              setBanDialogOpen(true);
                            }}
                            title="Ban User"
                          >
                            <Block />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <Box p={2} display="flex" justifyContent="center">
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </TableContainer>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onClose={() => setBanDialogOpen(false)}>
        <DialogTitle>Ban User</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Select ban type for this user:
          </Typography>
          {selectedUser && (
            <Box mt={2}>
              <Typography variant="body2" color="textSecondary">
                User: {selectedUser.name || selectedUser.username || selectedUser.phone}
              </Typography>
            </Box>
          )}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Ban Type</InputLabel>
            <Select
              value={banType}
              label="Ban Type"
              onChange={(e) => setBanType(e.target.value as 'partial' | 'complete')}
            >
              <MenuItem value="partial">
                Partial Ban (Cannot Comment) - User can still login and use the app
              </MenuItem>
              <MenuItem value="complete">
                Complete Ban (Cannot Login) - User cannot access the app
              </MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Reason (Optional)"
            multiline
            rows={3}
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Enter reason for banning this user..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBanDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleBan}
            color="error"
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : `Ban User (${banType === 'partial' ? 'Comment Ban' : 'Complete Ban'})`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unban Dialog */}
      <Dialog open={unbanDialogOpen} onClose={() => setUnbanDialogOpen(false)}>
        <DialogTitle>Unban User</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Select which ban to remove:
          </Typography>
          {selectedUser && (
            <Box mt={2} mb={2}>
              <Typography variant="body2" color="textSecondary">
                User: {selectedUser.name || selectedUser.username || selectedUser.phone}
              </Typography>
              <Box mt={1}>
                {selectedUser.isBlocked && (
                  <Chip label="Completely Banned" size="small" color="error" sx={{ mr: 1 }} />
                )}
                {selectedUser.commentBanned && (
                  <Chip label="Comment Banned" size="small" color="warning" />
                )}
              </Box>
            </Box>
          )}
          {selectedUser && (selectedUser.isBlocked && selectedUser.commentBanned) && (
            <FormControl fullWidth>
              <InputLabel>Unban Type</InputLabel>
              <Select
                value={unbanType}
                label="Unban Type"
                onChange={(e) => setUnbanType(e.target.value as 'partial' | 'complete' | 'both')}
              >
                <MenuItem value="both">Remove All Bans</MenuItem>
                <MenuItem value="complete">Remove Complete Ban Only</MenuItem>
                <MenuItem value="partial">Remove Comment Ban Only</MenuItem>
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnbanDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUnban}
            color="success"
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Unban User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagementPage;
