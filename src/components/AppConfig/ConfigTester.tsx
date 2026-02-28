// src/components/AppConfig/ConfigTester.tsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
  Chip,
  Grid,
  CircularProgress,
  Divider,
} from '@mui/material';
import { PlayArrow, CheckCircle, ErrorOutline } from '@mui/icons-material';
import api from '../../services/api';

interface AppConfig {
  forceUpdate: boolean;
  minSupportedVersion: string;
  latestVersion: string;
  updateMessage: string;
  blockAppUsage: boolean;
  showEveryLaunch: boolean;
  updateUrl: string;
  changeLog: string;
  timestamp?: string;
}

interface TestResult {
  config: AppConfig;
  appState: {
    isBlocked: boolean;
    shouldShowModal: boolean;
    modalType: 'forced' | 'optional' | 'none';
    needsUpdate: boolean;
    reason: string;
  };
}

interface ConfigTesterProps {
  config: AppConfig;
}

const ConfigTester: React.FC<ConfigTesterProps> = ({ config }) => {
  const [testVersion, setTestVersion] = useState('1.0.0');
  const [testPlatform, setTestPlatform] = useState<'android' | 'ios'>('android');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testError, setTestError] = useState('');

  const handleTest = async () => {
    setTesting(true);
    setTestError('');
    setTestResult(null);

    try {
      const response = await api.post('/admin/app-config/test', {
        version: testVersion,
        platform: testPlatform,
      });

      const result = response.data?.data || response.data;
      setTestResult(result);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Test failed';
      setTestError(errorMsg);
      console.error('Test error:', err);
    } finally {
      setTesting(false);
    }
  };

  const getStatusColor = (isBlocked: boolean, shouldShowModal: boolean): 'success' | 'warning' | 'error' => {
    if (isBlocked) return 'error';
    if (shouldShowModal) return 'warning';
    return 'success';
  };

  return (
    <Box>
      <Stack spacing={3}>
        {/* Test Input Section */}
        <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            🧪 Test Configuration
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="App Version to Test"
                value={testVersion}
                onChange={(e) => setTestVersion(e.target.value)}
                placeholder="e.g., 1.0.5"
                size="small"
                helperText="Enter the app version you want to test"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Platform</InputLabel>
                <Select
                  value={testPlatform}
                  onChange={(e) => setTestPlatform(e.target.value as 'android' | 'ios')}
                  label="Platform"
                >
                  <MenuItem value="android">Android</MenuItem>
                  <MenuItem value="ios">iOS</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                startIcon={testing ? <CircularProgress size={20} /> : <PlayArrow />}
                onClick={handleTest}
                disabled={testing}
              >
                {testing ? 'Testing...' : 'Run Test'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Error Alert */}
        {testError && (
          <Alert severity="error" onClose={() => setTestError('')}>
            {testError}
          </Alert>
        )}

        {/* Test Results */}
        {testResult && (
          <Stack spacing={2}>
            {/* Status Card */}
            <Paper sx={{ p: 3, backgroundColor: '#f9fafb', border: '2px solid #e5e7eb' }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
                {testResult.appState.isBlocked ? (
                  <ErrorOutline sx={{ color: 'error.main', fontSize: 32 }} />
                ) : testResult.appState.shouldShowModal ? (
                  <ErrorOutline sx={{ color: 'warning.main', fontSize: 32 }} />
                ) : (
                  <CheckCircle sx={{ color: 'success.main', fontSize: 32 }} />
                )}
                <Box flex={1}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {testResult.appState.isBlocked
                      ? '🚫 App Blocked'
                      : testResult.appState.shouldShowModal
                      ? '⚠️ Update Available'
                      : '✅ App Current'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {testResult.appState.reason}
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Status Details */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Tested Version
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {testVersion}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Latest Version
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {testResult.config.latestVersion}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Minimum Supported
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {testResult.config.minSupportedVersion}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Modal Type
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      <Chip
                        label={testResult.appState.modalType}
                        size="small"
                        variant="outlined"
                        color={testResult.appState.modalType === 'forced' ? 'error' : 'warning'}
                      />
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Configuration State */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Configuration State
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Force Update Enabled</Typography>
                  <Chip
                    label={testResult.config.forceUpdate ? 'Yes' : 'No'}
                    size="small"
                    color={testResult.config.forceUpdate ? 'error' : 'default'}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Block App Usage</Typography>
                  <Chip
                    label={testResult.config.blockAppUsage ? 'Yes' : 'No'}
                    size="small"
                    color={testResult.config.blockAppUsage ? 'error' : 'default'}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Show Every Launch</Typography>
                  <Chip
                    label={testResult.config.showEveryLaunch ? 'Yes' : 'No'}
                    size="small"
                    color={testResult.config.showEveryLaunch ? 'warning' : 'default'}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Needs Update</Typography>
                  <Chip
                    label={testResult.appState.needsUpdate ? 'Yes' : 'No'}
                    size="small"
                    color={testResult.appState.needsUpdate ? 'warning' : 'success'}
                  />
                </Box>
              </Stack>
            </Paper>

            {/* Update Message Preview */}
            {testResult.appState.shouldShowModal && (
              <Card sx={{ backgroundColor: '#e3f2fd', border: '1px solid #90caf9' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    📢 Update Message Preview
                  </Typography>
                  <Box sx={{
                    p: 2,
                    backgroundColor: 'white',
                    borderRadius: 1,
                    border: '1px solid #90caf9',
                    mb: 2
                  }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {testResult.config.updateMessage}
                    </Typography>
                  </Box>

                  {testResult.config.changeLog && (
                    <>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        📝 Changelog
                      </Typography>
                      <Box sx={{
                        p: 2,
                        backgroundColor: 'white',
                        borderRadius: 1,
                        border: '1px solid #90caf9'
                      }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {testResult.config.changeLog}
                        </Typography>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default ConfigTester;
