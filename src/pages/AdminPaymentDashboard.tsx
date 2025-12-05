import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material';
import {
  AttachMoney,
  AccountBalance,
  Pending,
  CheckCircle,
  Cancel,
  Visibility,
  Phone,
  Email,
  Business,
  CalendarToday,
  Payment,
  AccessTime,
  CurrencyRupee
} from '@mui/icons-material';
import apiService from '../services/api';

interface PaymentWithdrawalRequest {
  _id: string;
  eventId: {
    _id: string;
    title: string;
    username: string;
  };
  organizerId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile?: string;
  };
  eventUsername: string;
  upiId: string;
  phoneNumber: string;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requestDate: string;
  processedDate?: string;
  adminNotes?: string;
  organizerDetails: {
    firstName: string;
    lastName: string;
    email: string;
    mobile?: string;
  };
}

// Custom hook for debouncing
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Custom toast functions
const toast = {
  success: (message: string) => {
    console.log('Success:', message);
    // You can replace this with your preferred toast library
    alert(message);
  },
  error: (message: string) => {
    console.error('Error:', message);
    // You can replace this with your preferred toast library
    alert(message);
  }
};



const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'processed', label: 'Processed' },
];

const amountRangeOptions = [
  { value: '', label: 'All Amounts' },
  { value: '0-1000', label: '₹0 - ₹1,000' },
  { value: '1000-5000', label: '₹1,000 - ₹5,000' },
  { value: '5000-10000', label: '₹5,000 - ₹10,000' },
  { value: '10000+', label: '₹10,000+' },
];

const dateRangeOptions = [
  { value: '', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: '90days', label: 'Last 90 Days' },
];

const AdminPaymentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [withdrawalRequests, setWithdrawalRequests] = useState<PaymentWithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters state
  const [filters, setFilters] = useState({
    status: [],
    amountRange: '',
    dateRange: '',
    search: '',
    eventSearch: '',
    startDate: '',
    endDate: '',
  });
  
  const [appliedFilters, setAppliedFilters] = useState({
    status: [],
    amountRange: '',
    dateRange: '',
    startDate: '',
    endDate: '',
  });

  // Modal state
  const [selectedRequest, setSelectedRequest] = useState<PaymentWithdrawalRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Debounced search
  const debouncedSearch = useDebounce(filters.search, 400);
  const debouncedEventSearch = useDebounce(filters.eventSearch, 400);

  useEffect(() => {
    fetchWithdrawalRequests();
  }, [debouncedSearch, debouncedEventSearch, appliedFilters]);

  const fetchWithdrawalRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiFilters = {
        search: debouncedSearch.trim(),
        eventSearch: debouncedEventSearch.trim(),
        status: appliedFilters.status.length > 0 ? appliedFilters.status.join(',') : undefined,
        amountRange: appliedFilters.amountRange,
        dateRange: appliedFilters.dateRange,
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
      };
      
      const response = await paymentApiService.getPaymentWithdrawalRequests(apiFilters);
      if (response.success) {
        setWithdrawalRequests(response.data || []);
      }
    } catch (error) {
      setError('Failed to fetch withdrawal requests');
      toast.error('Failed to fetch withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleViewDetails = (request: PaymentWithdrawalRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || '');
    setShowDetailsModal(true);
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      setProcessingAction(true);
      const response = await paymentApiService.updatePaymentWithdrawalRequest(requestId, {
        status: 'approved',
        adminNotes: adminNotes
      });
      
      if (response.success) {
        toast.success('Request approved successfully');
        fetchWithdrawalRequests();
        setShowDetailsModal(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setProcessingAction(true);
      const response = await paymentApiService.updatePaymentWithdrawalRequest(requestId, {
        status: 'rejected',
        adminNotes: adminNotes
      });
      
      if (response.success) {
        toast.success('Request rejected successfully');
        fetchWithdrawalRequests();
        setShowDetailsModal(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleMarkAsProcessed = async (requestId: string) => {
    try {
      setProcessingAction(true);
      const response = await paymentApiService.updatePaymentWithdrawalRequest(requestId, {
        status: 'processed',
        adminNotes: adminNotes
      });
      
      if (response.success) {
        toast.success('Request marked as processed');
        fetchWithdrawalRequests();
        setShowDetailsModal(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update request');
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#fbc02d';
      case 'approved': return '#43a047';
      case 'rejected': return '#e53935';
      case 'processed': return '#1976d2';
      default: return '#607d8b';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Pending sx={{ fontSize: 16 }} />;
      case 'approved': return <CheckCircle sx={{ fontSize: 16 }} />;
      case 'rejected': return <Cancel sx={{ fontSize: 16 }} />;
      case 'processed': return <Payment sx={{ fontSize: 16 }} />;
      default: return <Pending sx={{ fontSize: 16 }} />;
    }
  };

  // Calculate summary data
  const totalPendingAmount = withdrawalRequests
    .filter(request => request.status === 'pending')
    .reduce((total, request) => total + request.totalAmount, 0);

  const totalApprovedAmount = withdrawalRequests
    .filter(request => request.status === 'approved')
    .reduce((total, request) => total + request.totalAmount, 0);

  const totalProcessedAmount = withdrawalRequests
    .filter(request => request.status === 'processed')
    .reduce((total, request) => total + request.totalAmount, 0);

  const statusCounts = {
    total: withdrawalRequests.length,
    pending: withdrawalRequests.filter(r => r.status === 'pending').length,
    approved: withdrawalRequests.filter(r => r.status === 'approved').length,
    rejected: withdrawalRequests.filter(r => r.status === 'rejected').length,
    processed: withdrawalRequests.filter(r => r.status === 'processed').length,
  };

  return (
    <Box maxWidth={1200} mx="auto" p={2}>
      <Typography variant="h4" fontWeight={700} color="primary" mb={3}>
        Payment Withdrawal Analytics
      </Typography>
      
      {/* Summary Cards */}
      <Box display="flex" flexWrap="wrap" gap={3} mb={4}>
        <Paper elevation={3} sx={{ p: 3, flex: '1 1 200px', minWidth: 200 }}>
          <Typography variant="h6" fontWeight={600} mb={1}>Total Requests</Typography>
          <Typography variant="h4" color="primary.main" fontWeight={800}>
            {statusCounts.total}
          </Typography>
        </Paper>
        <Paper elevation={3} sx={{ p: 3, flex: '1 1 200px', minWidth: 200 }}>
          <Typography variant="h6" fontWeight={600} mb={1}>Pending</Typography>
          <Typography variant="h4" color="warning.main" fontWeight={800}>
            {statusCounts.pending}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            ₹{totalPendingAmount.toLocaleString()}
          </Typography>
        </Paper>
        <Paper elevation={3} sx={{ p: 3, flex: '1 1 200px', minWidth: 200 }}>
          <Typography variant="h6" fontWeight={600} mb={1}>Approved</Typography>
          <Typography variant="h4" color="success.main" fontWeight={800}>
            {statusCounts.approved}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            ₹{totalApprovedAmount.toLocaleString()}
          </Typography>
        </Paper>
        <Paper elevation={3} sx={{ p: 3, flex: '1 1 200px', minWidth: 200 }}>
          <Typography variant="h6" fontWeight={600} mb={1}>Processed</Typography>
          <Typography variant="h4" color="info.main" fontWeight={800}>
            {statusCounts.processed}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            ₹{totalProcessedAmount.toLocaleString()}
          </Typography>
        </Paper>
        <Paper elevation={3} sx={{ p: 3, flex: '1 1 200px', minWidth: 200 }}>
          <Typography variant="h6" fontWeight={600} mb={1}>Rejected</Typography>
          <Typography variant="h4" color="error.main" fontWeight={800}>
            {statusCounts.rejected}
          </Typography>
        </Paper>
      </Box>
      
      {/* Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={2}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              multiple
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
              input={<OutlinedInput label="Status" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {statusOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel>Amount Range</InputLabel>
            <Select
              value={filters.amountRange}
              onChange={e => handleFilterChange('amountRange', e.target.value)}
              label="Amount Range"
            >
              {amountRangeOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={filters.dateRange}
              onChange={e => handleFilterChange('dateRange', e.target.value)}
              label="Date Range"
            >
              {dateRangeOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            label="Search by Organizer"
            value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
            fullWidth
          />
          
          <TextField
            label="Search by Event"
            value={filters.eventSearch}
            onChange={e => handleFilterChange('eventSearch', e.target.value)}
            fullWidth
          />
          
          <TextField
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={e => handleFilterChange('startDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          
          <TextField
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={e => handleFilterChange('endDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Box>
        
        <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
          <Button 
            variant="outlined" 
            onClick={() => setFilters({
              status: [],
              amountRange: '',
              dateRange: '',
              search: '',
              eventSearch: '',
              startDate: '',
              endDate: '',
            })}
          >
            Clear Filters
          </Button>
          <Button variant="contained" color="primary" onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </Box>
      </Paper>
      
      {/* Withdrawal Requests Cards */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} mb={2}>
          All Withdrawal Requests
        </Typography>
        
        {loading ? (
          <Typography>Loading withdrawal requests...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Box>
            {withdrawalRequests.length === 0 ? (
              <Typography>No withdrawal requests found.</Typography>
            ) : (
              <Box 
                display="grid" 
                gridTemplateColumns="repeat(auto-fill, minmax(320px, 1fr))" 
                gap={3}
              >
                {withdrawalRequests.map((request) => (
                  <Card 
                    key={request._id}
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      }
                    }}
                    onClick={() => handleViewDetails(request)}
                  >
                    <Box sx={{ position: 'relative', p: 2, backgroundColor: 'grey.50' }}>
                      {/* Status Chip - top right */}
                      <Chip
                        label={request.status}
                        size="small"
                        icon={getStatusIcon(request.status)}
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          zIndex: 2,
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          color: '#fff',
                          backgroundColor: getStatusColor(request.status),
                          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                          textTransform: 'capitalize',
                        }}
                      />
                      
                      {/* Amount Display */}
                      <Box display="flex" alignItems="center" mb={1}>
                        <AttachMoney sx={{ fontSize: 24, color: 'primary.main', mr: 1 }} />
                        <Typography variant="h5" fontWeight={700} color="primary.main">
                          ₹{request.totalAmount.toLocaleString()}
                        </Typography>
                      </Box>
                      
                      {/* Event Title */}
                      <Typography variant="h6" fontWeight={600} sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.3,
                        pr: 8 // Space for status chip
                      }}>
                        {request.eventId.title}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        @{request.eventUsername}
                      </Typography>
                    </Box>

                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                      {/* Organizer Details */}
                      <Box display="flex" alignItems="center" mb={1.5}>
                        <Business sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                        <Typography variant="body2" color="text.secondary" sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {request.organizerDetails.firstName} {request.organizerDetails.lastName}
                        </Typography>
                      </Box>

                      {/* Email */}
                      <Box display="flex" alignItems="center" mb={1.5}>
                        <Email sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                        <Typography variant="body2" color="text.secondary" sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {request.organizerDetails.email}
                        </Typography>
                      </Box>

                      {/* Phone */}
                      <Box display="flex" alignItems="center" mb={1.5}>
                        <Phone sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          {request.phoneNumber}
                        </Typography>
                      </Box>

                      {/* UPI ID */}
                      <Box display="flex" alignItems="center" mb={1.5}>
                        <AccountBalance sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                        <Typography variant="body2" color="text.secondary" sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontFamily: 'monospace',
                          fontSize: '0.75rem'
                        }}>
                          {request.upiId}
                        </Typography>
                      </Box>

                      {/* Request Date */}
                      <Box display="flex" alignItems="center" mb={1.5}>
                        <CalendarToday sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(request.requestDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </CardContent>

                    <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                        <Typography variant="caption" color="text.secondary">
                          Click to view details
                        </Typography>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Details Modal */}
      <Dialog
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Withdrawal Request Details
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                {/* Event Details */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>
                    Event Details
                  </Typography>
                  <Box sx={{ space: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Event Title
                    </Typography>
                    <Typography variant="body1" mb={2}>
                      {selectedRequest.eventId.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Event Username
                    </Typography>
                    <Typography variant="body1" mb={2}>
                      @{selectedRequest.eventUsername}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Amount
                    </Typography>
                    <Typography variant="h5" fontWeight={600} color="primary.main" mb={2}>
                      ₹{selectedRequest.totalAmount.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>

                {/* Organizer Details */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>
                    Organizer Details
                  </Typography>
                  <Box sx={{ space: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Name
                    </Typography>
                    <Typography variant="body1" mb={2}>
                      {selectedRequest.organizerDetails.firstName} {selectedRequest.organizerDetails.lastName}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Email
                    </Typography>
                    <Typography variant="body1" mb={2}>
                      {selectedRequest.organizerDetails.email}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Mobile
                    </Typography>
                    <Typography variant="body1" mb={2}>
                      {selectedRequest.organizerDetails.mobile || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Payment Details */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>
                    Payment Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        UPI ID
                      </Typography>
                      <Paper sx={{ p: 1, backgroundColor: 'grey.50', fontFamily: 'monospace' }}>
                        <Typography variant="body2">
                          {selectedRequest.upiId}
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Phone Number
                      </Typography>
                      <Typography variant="body1">
                        {selectedRequest.phoneNumber}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Request Date
                      </Typography>
                      <Typography variant="body1">
                        {new Date(selectedRequest.requestDate).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Current Status
                      </Typography>
                      <Chip
                        label={selectedRequest.status}
                        icon={getStatusIcon(selectedRequest.status)}
                        sx={{
                          fontWeight: 600,
                          color: '#fff',
                          backgroundColor: getStatusColor(selectedRequest.status),
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {/* Admin Notes */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>
                    Admin Notes
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes for this request..."
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          {selectedRequest?.status === 'pending' && (
            <>
              <Button
                onClick={() => handleApproveRequest(selectedRequest._id)}
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                disabled={processingAction}
              >
                Approve Request
              </Button>
              <Button
                onClick={() => handleRejectRequest(selectedRequest._id)}
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                disabled={processingAction}
              >
                Reject Request
              </Button>
            </>
          )}
          
          {selectedRequest?.status === 'approved' && (
            <Button
              onClick={() => handleMarkAsProcessed(selectedRequest._id)}
              variant="contained"
              color="info"
              startIcon={<Payment />}
              disabled={processingAction}
            >
              Mark as Processed
            </Button>
          )}

          <Button
            onClick={() => setShowDetailsModal(false)}
            variant="outlined"
            sx={{ ml: 'auto' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPaymentDashboard;