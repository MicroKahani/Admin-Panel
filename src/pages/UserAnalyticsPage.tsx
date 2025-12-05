import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Chip, 
  OutlinedInput, 
  Card,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Alert,
  Grid,
  Badge,
  Divider,
  LinearProgress
} from '@mui/material';
import { 
  Person, 
  Email, 
  LocationOn, 
  Business,
  CalendarToday,
  Verified,
  Block,
  Delete,
  Visibility,
  School,
  Phone,
  Language,
  GitHub,
  LinkedIn,
  Twitter,
  Group,
  Favorite,
  Bookmark
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { 
  getUserAnalyticsStats, 
  getAllUsersAdmin, 
  deleteUser, 
  getUserDetails 
} from '../services/api';
import useDebounce from '../hooks/useDebounce';

interface UserStats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  recentUsers: number;
  todayUsers: number;
  roleStats: {
    user: number;
    admin: number;
    organizer: number;
  };
  socialAuthStats: {
    googleAuth: number;
    githubAuth: number;
    linkedinAuth: number;
  };
}

interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profilePicture: string;
  bio: string;
  tagline: string;
  country: string;
  state: string;
  college: string;
  mobile: string;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  createdAtFormatted: string;
  lastLoginFormatted: string;
  projectCount: number;
  followerCount: number;
  followingCount: number;
  connectionCount: number;
  hasSocialAuth: boolean;
  socialLinks: {
    github: string;
    linkedin: string;
    twitter: string;
  };
  skills: string[];
}

const roleOptions = [
  { value: '', label: 'All Roles' },
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
  { value: 'organizer', label: 'Organizer' },
];

const verificationOptions = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Verified' },
  { value: 'false', label: 'Unverified' },
];

const activeOptions = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

const UserAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    recentUsers: 0,
    todayUsers: 0,
    roleStats: { user: 0, admin: 0, organizer: 0 },
    socialAuthStats: { googleAuth: 0, githubAuth: 0, linkedinAuth: 0 }
  });
  
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    isEmailVerified: '',
    isActive: '',
    country: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 20
  });
  
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalUsers: 0,
    hasNext: false,
    hasPrev: false
  });
  
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Delete confirmation states
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    user: null as User | null,
    step: 1,
    confirmText: '',
    loading: false
  });
  
  // User detail dialog
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    user: null as User | null,
    loading: false
  });

  // Debounced search
  const debouncedSearch = useDebounce(filters.search, 400);

  // Load stats
  useEffect(() => {
    async function loadStats() {
      try {
        setStatsLoading(true);
        const data = await getUserAnalyticsStats();
        setStats(data.data);
      } catch (error) {
        console.error('Error loading user stats:', error);
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, []);

  // Load users
  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      setError(null);
      try {
        const apiFilters = {
          search: debouncedSearch.trim(),
          role: appliedFilters.role,
          isEmailVerified: appliedFilters.isEmailVerified,
          isActive: appliedFilters.isActive,
          country: appliedFilters.country.trim(),
          sortBy: appliedFilters.sortBy,
          sortOrder: appliedFilters.sortOrder,
          dateFrom: appliedFilters.dateFrom,
          dateTo: appliedFilters.dateTo,
          page: appliedFilters.page,
          limit: appliedFilters.limit
        };
        
        const data = await getAllUsersAdmin(apiFilters);
        setUsers(data.data.users || []);
        setPagination(data.data.pagination);
      } catch (error) {
        setError('Failed to load users');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, [debouncedSearch, appliedFilters]);

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ 
      ...prev, 
      [field]: value,
      ...(field !== 'page' && { page: 1 }) // Reset page when other filters change
    }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setAppliedFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleViewUser = async (user: User) => {
    setDetailDialog({ open: true, user, loading: true });
    try {
      const data = await getUserDetails(user._id);
      setDetailDialog({ open: true, user: data.data, loading: false });
    } catch (error) {
      console.error('Error loading user details:', error);
      setDetailDialog({ open: true, user, loading: false });
    }
  };

  const handleDeleteUser = (user: User) => {
    setDeleteDialog({
      open: true,
      user,
      step: 1,
      confirmText: '',
      loading: false
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.user) return;
    
    if (deleteDialog.step < 3) {
      setDeleteDialog(prev => ({ ...prev, step: prev.step + 1, confirmText: '' }));
      return;
    }
    
    if (deleteDialog.confirmText !== 'DELETE') {
      alert('Please type "DELETE" to confirm');
      return;
    }
    
    try {
      setDeleteDialog(prev => ({ ...prev, loading: true }));
      await deleteUser(deleteDialog.user._id);
      
      // Refresh data
      setAppliedFilters(prev => ({ ...prev }));
      const statsData = await getUserAnalyticsStats();
      setStats(statsData.data);
      
      setDeleteDialog({ open: false, user: null, step: 1, confirmText: '', loading: false });
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
      setDeleteDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const getRoleChipColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'organizer': return 'warning';
      default: return 'default';
    }
  };

  const getStatusColor = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return '#f44336';
    if (!isVerified) return '#ff9800';
    return '#4caf50';
  };

  return (
    <Box maxWidth={1400} mx="auto" p={2}>
      <Typography variant="h4" fontWeight={700} color="primary" mb={3}>
        User Analytics
      </Typography>
      
      {/* Summary Cards */}
      {statsLoading ? (
        <LinearProgress sx={{ mb: 4 }} />
      ) : (
        <Grid container spacing={2} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={600} mb={1}>Total Users</Typography>
              <Typography variant="h3" color="primary.main" fontWeight={800}>
                {stats.totalUsers}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={600} mb={1}>Verified</Typography>
              <Typography variant="h3" color="success.main" fontWeight={800}>
                {stats.verifiedUsers}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={600} mb={1}>Active</Typography>
              <Typography variant="h3" color="primary.main" fontWeight={800}>
                {stats.activeUsers}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={600} mb={1}>New (30d)</Typography>
              <Typography variant="h3" color="secondary.main" fontWeight={800}>
                {stats.recentUsers}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {/* Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" fontWeight={600} mb={2}>Filters</Typography>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={2} mb={3}>
          <TextField
            label="Search (name, email, username)"
            value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
            fullWidth
          />
          
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={filters.role}
              onChange={e => handleFilterChange('role', e.target.value)}
              label="Role"
            >
              {roleOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel>Email Verification</InputLabel>
            <Select
              value={filters.isEmailVerified}
              onChange={e => handleFilterChange('isEmailVerified', e.target.value)}
              label="Email Verification"
            >
              {verificationOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.isActive}
              onChange={e => handleFilterChange('isActive', e.target.value)}
              label="Status"
            >
              {activeOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            label="Country"
            value={filters.country}
            onChange={e => handleFilterChange('country', e.target.value)}
            fullWidth
          />
          
          <TextField
            label="Date From"
            type="date"
            value={filters.dateFrom}
            onChange={e => handleFilterChange('dateFrom', e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          
          <TextField
            label="Date To"
            type="date"
            value={filters.dateTo}
            onChange={e => handleFilterChange('dateTo', e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Box>
        
        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button 
            variant="outlined" 
            onClick={() => setFilters({
              search: '',
              role: '',
              isEmailVerified: '',
              isActive: '',
              country: '',
              sortBy: 'createdAt',
              sortOrder: 'desc',
              dateFrom: '',
              dateTo: '',
              page: 1,
              limit: 20
            })}
          >
            Clear Filters
          </Button>
          <Button variant="contained" color="primary" onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </Box>
      </Paper>
      
      {/* Users List */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight={600}>
            All Users ({pagination.totalUsers})
          </Typography>
          <Box display="flex" gap={1}>
            <Button 
              variant="outlined" 
              size="small"
              disabled={!pagination.hasPrev}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
            >
              Previous
            </Button>
            <Typography variant="body2" sx={{ px: 2, py: 1, alignSelf: 'center' }}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </Typography>
            <Button 
              variant="outlined" 
              size="small"
              disabled={!pagination.hasNext}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
            >
              Next
            </Button>
          </Box>
        </Box>
        
        {loading ? (
          <LinearProgress />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : users.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            No users found matching the criteria.
          </Typography>
        ) : (
          <Box 
            display="grid" 
            gridTemplateColumns="repeat(auto-fill, minmax(400px, 1fr))" 
            gap={3}
          >
            {users.map((user) => (
              <Card 
                key={user._id} 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative',
                  border: `2px solid ${getStatusColor(user.isActive, user.isEmailVerified)}20`,
                }}
              >
                {/* Status indicator */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(user.isActive, user.isEmailVerified),
                    zIndex: 1,
                    m: 1
                  }}
                />
                
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  {/* Header with Avatar */}
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Badge 
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        user.isEmailVerified ? 
                        <Verified sx={{ fontSize: 16, color: 'success.main' }} /> : 
                        <Block sx={{ fontSize: 16, color: 'error.main' }} />
                      }
                    >
                      <Avatar
                        src={user.profilePicture}
                        alt={user.fullName}
                        sx={{ width: 56, height: 56 }}
                      >
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </Avatar>
                    </Badge>
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight={600} noWrap>
                        {user.fullName || user.username}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        @{user.username}
                      </Typography>
                      <Chip 
                        label={user.role} 
                        color={getRoleChipColor(user.role)}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>

                  {/* User Info */}
                  <Box space={1}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" noWrap flex={1}>
                        {user.email}
                      </Typography>
                    </Box>
                    
                    {user.mobile && (
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {user.mobile}
                        </Typography>
                      </Box>
                    )}
                    
                    {user.country && (
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {user.country}{user.state ? `, ${user.state}` : ''}
                        </Typography>
                      </Box>
                    )}
                    
                    {user.college && (
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <School sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {user.college}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Joined: {user.createdAtFormatted}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Last Login: {user.lastLoginFormatted}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Stats */}
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Box textAlign="center">
                      <Typography variant="h6" fontWeight={600} color="primary">
                        {user.projectCount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Projects
                      </Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="h6" fontWeight={600} color="primary">
                        {user.followerCount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Followers
                      </Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="h6" fontWeight={600} color="primary">
                        {user.connectionCount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Connections
                      </Typography>
                    </Box>
                  </Box>

                  {/* Social Links */}
                  {(user.socialLinks?.github || user.socialLinks?.linkedin || user.socialLinks?.twitter || user.hasSocialAuth) && (
                    <Box display="flex" gap={1} justifyContent="center" mb={1}>
                      {user.socialLinks?.github && (
                        <Tooltip title="GitHub">
                          <IconButton size="small" color="primary">
                            <GitHub fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {user.socialLinks?.linkedin && (
                        <Tooltip title="LinkedIn">
                          <IconButton size="small" color="primary">
                            <LinkedIn fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {user.socialLinks?.twitter && (
                        <Tooltip title="Twitter">
                          <IconButton size="small" color="primary">
                            <Twitter fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {user.hasSocialAuth && (
                        <Chip 
                          label="Social Auth" 
                          size="small" 
                          color="info"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  )}

                  {/* Skills */}
                  {user.skills && user.skills.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        Skills:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {user.skills.slice(0, 3).map((skill, index) => (
                          <Chip 
                            key={index} 
                            label={skill} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        ))}
                        {user.skills.length > 3 && (
                          <Chip 
                            label={`+${user.skills.length - 3} more`} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ pt: 0, pb: 2, px: 2, justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => handleViewUser(user)}
                    size="small"
                  >
                    View Details
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleDeleteUser(user)}
                    size="small"
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        )}
        
        {/* Pagination */}
        {!loading && users.length > 0 && (
          <Box display="flex" justifyContent="center" alignItems="center" gap={2} mt={4}>
            <Button 
              variant="outlined" 
              disabled={!pagination.hasPrev}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
            >
              Previous
            </Button>
            <Typography>
              Page {pagination.currentPage} of {pagination.totalPages}
            </Typography>
            <Button 
              variant="outlined" 
              disabled={!pagination.hasNext}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
            >
              Next
            </Button>
          </Box>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialog.open} 
        onClose={() => !deleteDialog.loading && setDeleteDialog({ open: false, user: null, step: 1, confirmText: '', loading: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle color="error.main">
          Delete User - Step {deleteDialog.step} of 3
        </DialogTitle>
        <DialogContent>
          {deleteDialog.step === 1 && (
            <DialogContentText>
              Are you sure you want to delete user <strong>{deleteDialog.user?.fullName}</strong> ({deleteDialog.user?.email})?
              This action cannot be undone and will permanently remove all user data.
            </DialogContentText>
          )}
          {deleteDialog.step === 2 && (
            <DialogContentText>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This is your second confirmation. The user and all their data will be permanently deleted.
              </Alert>
              Deleting user: <strong>{deleteDialog.user?.fullName}</strong><br/>
              Email: <strong>{deleteDialog.user?.email}</strong><br/>
              Projects: <strong>{deleteDialog.user?.projectCount}</strong><br/>
              Joined: <strong>{deleteDialog.user?.createdAtFormatted}</strong>
            </DialogContentText>
          )}
          {deleteDialog.step === 3 && (
            <>
              <DialogContentText>
                <Alert severity="error" sx={{ mb: 2 }}>
                  Final confirmation required. This action is irreversible.
                </Alert>
                Type <strong>DELETE</strong> to confirm the deletion of user <strong>{deleteDialog.user?.fullName}</strong>:
              </DialogContentText>
              <TextField
                fullWidth
                label="Type DELETE to confirm"
                value={deleteDialog.confirmText}
                onChange={(e) => setDeleteDialog(prev => ({ ...prev, confirmText: e.target.value }))}
                margin="normal"
                autoFocus
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, user: null, step: 1, confirmText: '', loading: false })}
            disabled={deleteDialog.loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            disabled={deleteDialog.loading}
            variant={deleteDialog.step === 3 ? "contained" : "outlined"}
          >
            {deleteDialog.loading ? 'Deleting...' : 
             deleteDialog.step === 3 ? 'DELETE USER' : 'Continue'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog 
        open={detailDialog.open} 
        onClose={() => setDetailDialog({ open: false, user: null, loading: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              src={detailDialog.user?.profilePicture}
              alt={detailDialog.user?.fullName}
              sx={{ width: 48, height: 48 }}
            >
              {detailDialog.user?.firstName?.[0]}{detailDialog.user?.lastName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h6">{detailDialog.user?.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">
                @{detailDialog.user?.username}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailDialog.loading ? (
            <LinearProgress />
          ) : detailDialog.user ? (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography variant="body1" mb={2}>{detailDialog.user.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Role</Typography>
                  <Box mb={2}>
                    <Chip label={detailDialog.user.role} color={getRoleChipColor(detailDialog.user.role)} />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Box display="flex" gap={1} mb={2}>
                    <Chip 
                      label={detailDialog.user.isActive ? 'Active' : 'Inactive'} 
                      color={detailDialog.user.isActive ? 'success' : 'error'} 
                      size="small"
                    />
                    <Chip 
                      label={detailDialog.user.isEmailVerified ? 'Verified' : 'Unverified'} 
                      color={detailDialog.user.isEmailVerified ? 'success' : 'warning'} 
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                  <Typography variant="body1" mb={2}>
                    {detailDialog.user.country}{detailDialog.user.state ? `, ${detailDialog.user.state}` : ''}
                  </Typography>
                </Grid>
                {detailDialog.user.bio && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Bio</Typography>
                    <Typography variant="body1" mb={2}>{detailDialog.user.bio}</Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Account Info</Typography>
                  <Typography variant="body2">
                    Joined: {detailDialog.user.createdAtFormatted}<br/>
                    Last Login: {detailDialog.user.lastLoginFormatted}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog({ open: false, user: null, loading: false })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserAnalyticsPage;