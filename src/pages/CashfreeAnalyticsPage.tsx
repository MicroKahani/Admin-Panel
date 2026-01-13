// frontend/src/pages/CashfreeAnalyticsPage.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  CurrencyRupee,
  ShoppingCart,
  Coins,
  DateRange,
} from '@mui/icons-material';
import { getCashfreeRevenueAnalytics, getCashfreeTransactions } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface RevenueSummary {
  totalRevenue: number;
  totalCoinsSold: number;
  totalTransactions: number;
  averageOrderValue: number;
  last30DaysRevenue: number;
  previous30DaysRevenue: number;
  revenueGrowth: number;
}

interface TimeSeriesData {
  date: string;
  revenue: number;
  transactions: number;
  coinsSold: number;
}

interface PackageBreakdown {
  packageId: string;
  revenue: number;
  transactions: number;
  coinsSold: number;
  averageAmount: number;
}

interface Transaction {
  orderId: string;
  userId: any;
  amount: number;
  coins: number;
  packageId: string;
  status: string;
  completedAt: string;
  createdAt: string;
}

const CashfreeAnalyticsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [packageBreakdown, setPackageBreakdown] = useState<PackageBreakdown[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [groupBy, setGroupBy] = useState<'day' | 'month' | 'year'>('day');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [groupBy, startDate, endDate]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getCashfreeRevenueAnalytics({
        groupBy,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setSummary(response.data.summary);
      setTimeSeries(response.data.timeSeries);
      setPackageBreakdown(response.data.packageBreakdown);
      setRecentTransactions(response.data.recentTransactions);
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      setError(err.response?.data?.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Cashfree Revenue Analytics
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Group By</InputLabel>
              <Select
                value={groupBy}
                label="Group By"
                onChange={(e) => setGroupBy(e.target.value as any)}
              >
                <MenuItem value="day">Day</MenuItem>
                <MenuItem value="month">Month</MenuItem>
                <MenuItem value="year">Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              variant="outlined"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              fullWidth
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Revenue
                </Typography>
                <Typography variant="h4" color="primary">
                  {formatCurrency(summary.totalRevenue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Transactions
                </Typography>
                <Typography variant="h4">{summary.totalTransactions}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Coins Sold
                </Typography>
                <Typography variant="h4">{formatNumber(summary.totalCoinsSold)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Order Value
                </Typography>
                <Typography variant="h4">{formatCurrency(summary.averageOrderValue)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Growth Card */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Last 30 Days Revenue
                </Typography>
                <Typography variant="h5" color="primary">
                  {formatCurrency(summary.last30DaysRevenue)}
                </Typography>
                {summary.revenueGrowth !== 0 && (
                  <Box display="flex" alignItems="center" mt={1}>
                    {summary.revenueGrowth > 0 ? (
                      <TrendingUp color="success" />
                    ) : (
                      <TrendingDown color="error" />
                    )}
                    <Typography
                      variant="body2"
                      color={summary.revenueGrowth > 0 ? 'success.main' : 'error.main'}
                      sx={{ ml: 1 }}
                    >
                      {summary.revenueGrowth > 0 ? '+' : ''}
                      {summary.revenueGrowth.toFixed(2)}% vs previous 30 days
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Previous 30 Days Revenue
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(summary.previous30DaysRevenue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Time Series Chart */}
      {timeSeries.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Revenue Over Time
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">Transactions</TableCell>
                  <TableCell align="right">Coins Sold</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {timeSeries.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(item.revenue)}
                    </TableCell>
                    <TableCell align="right">{item.transactions}</TableCell>
                    <TableCell align="right">{formatNumber(item.coinsSold)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Package Breakdown */}
      {packageBreakdown.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Package Breakdown
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Package ID</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">Transactions</TableCell>
                  <TableCell align="right">Coins Sold</TableCell>
                  <TableCell align="right">Avg. Order Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {packageBreakdown.map((pkg, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Chip label={pkg.packageId} size="small" />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(pkg.revenue)}
                    </TableCell>
                    <TableCell align="right">{pkg.transactions}</TableCell>
                    <TableCell align="right">{formatNumber(pkg.coinsSold)}</TableCell>
                    <TableCell align="right">{formatCurrency(pkg.averageAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Transactions
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Coins</TableCell>
                  <TableCell>Package</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : recentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary" py={4}>
                        No transactions found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  recentTransactions.map((tx, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="caption" fontFamily="monospace">
                          {tx.orderId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {tx.userId?.name || tx.userId?.username || tx.userId?.phone || 'Unknown'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell align="right">{formatNumber(tx.coins)}</TableCell>
                      <TableCell>
                        <Chip label={tx.packageId} size="small" />
                      </TableCell>
                      <TableCell>{formatDate(tx.completedAt || tx.createdAt)}</TableCell>
                      <TableCell>
                        <Chip
                          label={tx.status}
                          size="small"
                          color={
                            tx.status === 'completed'
                              ? 'success'
                              : tx.status === 'failed'
                              ? 'error'
                              : 'default'
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default CashfreeAnalyticsPage;
