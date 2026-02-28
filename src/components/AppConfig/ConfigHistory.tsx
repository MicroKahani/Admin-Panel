// src/components/AppConfig/ConfigHistory.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider,
  Chip,
} from '@mui/material';
import { Visibility, Refresh } from '@mui/icons-material';
import api from '../../services/api';

interface HistoryRecord {
  config: any;
  changedBy: string;
  changedAt: string;
  changes: {
    [key: string]: {
      old: any;
      new: any;
    };
  };
}

interface ConfigHistoryProps {
  onRefresh?: () => void;
}

const ConfigHistory: React.FC<ConfigHistoryProps> = ({ onRefresh }) => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/app-config/history', {
        params: { limit: 20, skip: page * 20 },
      });
      const data = response.data?.data || response.data;
      setHistory(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load history';
      setError(errorMsg);
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (record: HistoryRecord) => {
    setSelectedRecord(record);
    setDetailsOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getChangedFields = (changes: Record<string, any>) => {
    return Object.keys(changes);
  };

  return (
    <Box>
      <Stack spacing={3}>
        {/* Header with Refresh */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              📋 Configuration Change History
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Track all changes made to app configuration
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchHistory}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* History Table */}
        {!loading && history.length > 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Changed By</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Fields Changed</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((record, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(record.changedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.changedBy || 'System'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                        {getChangedFields(record.changes).map((field) => (
                          <Chip
                            key={field}
                            label={field}
                            size="small"
                            variant="filled"
                            color="primary"
                          />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => handleViewDetails(record)}
                        variant="outlined"
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Empty State */}
        {!loading && history.length === 0 && (
          <Alert severity="info">
            No change history available. Configuration changes will appear here.
          </Alert>
        )}
      </Stack>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Change Details</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              {/* Change Info */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  When
                </Typography>
                <Typography variant="body2">
                  {formatDate(selectedRecord.changedAt)}
                </Typography>
              </Box>

              <Divider />

              {/* Changed By */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Changed By
                </Typography>
                <Chip
                  label={selectedRecord.changedBy || 'System'}
                  size="small"
                  variant="outlined"
                />
              </Box>

              <Divider />

              {/* Field Changes */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Changes
                </Typography>
                <Stack spacing={2}>
                  {Object.entries(selectedRecord.changes).map(([field, change]: any) => (
                    <Card key={field} sx={{ backgroundColor: '#f5f5f5' }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          {field}
                        </Typography>
                        <Box sx={{ ml: 1 }}>
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Before
                            </Typography>
                            <Box
                              sx={{
                                p: 1,
                                backgroundColor: '#ffebee',
                                borderRadius: 0.5,
                                mt: 0.5,
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: 'monospace',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {typeof change.old === 'string'
                                  ? change.old
                                  : JSON.stringify(change.old)}
                              </Typography>
                            </Box>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              After
                            </Typography>
                            <Box
                              sx={{
                                p: 1,
                                backgroundColor: '#e8f5e9',
                                borderRadius: 0.5,
                                mt: 0.5,
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: 'monospace',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {typeof change.new === 'string'
                                  ? change.new
                                  : JSON.stringify(change.new)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConfigHistory;
