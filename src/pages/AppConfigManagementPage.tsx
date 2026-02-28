// src/pages/AppConfigManagementPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Stack,
  Tabs,
  Tab,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Save, Refresh, RestartAlt, Info } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ConfigEditor from '../components/AppConfig/ConfigEditor';

interface AppConfig {
  forceUpdate: boolean;
  minSupportedVersion: string;
  latestVersion: string;
  updateMessage: string;
  blockAppUsage: boolean;
  showEveryLaunch: boolean;
  updateUrl: string;
  changeLog: string;
  timestamp: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`appconfig-tabpanel-${index}`}
      aria-labelledby={`appconfig-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AppConfigManagementPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { admin } = useAuth();

  // Fetch current config
  useEffect(() => {
    fetchConfig();
  }, []);

  // Detect changes
  useEffect(() => {
    if (config && originalConfig) {
      const hasChanged = JSON.stringify(config) !== JSON.stringify(originalConfig);
      setHasChanges(hasChanged);
    }
  }, [config, originalConfig]);

  const fetchConfig = async () => {
    setFetchLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/app-config');
      const data = response.data?.data || response.data;
      setConfig(data);
      setOriginalConfig(data);
      setSuccessMessage('Configuration loaded successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load configuration';
      setError(errorMsg);
      console.error('Error loading config:', err);
      // Set default config on error so page can still render
      const defaultConfig: AppConfig = {
        forceUpdate: false,
        minSupportedVersion: '1.0.0',
        latestVersion: '1.2.0',
        updateMessage: 'Update available',
        blockAppUsage: false,
        showEveryLaunch: false,
        updateUrl: 'https://play.google.com/store',
        changeLog: 'Bug fixes and improvements',
      };
      setConfig(defaultConfig);
      setOriginalConfig(defaultConfig);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleConfigChange = (updatedConfig: AppConfig) => {
    setConfig(updatedConfig);
  };

  const handleSave = async () => {
    if (!config) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await api.put('/admin/app-config', config);
      const data = response.data?.data || response.data;
      setConfig(data);
      setOriginalConfig(data);
      setHasChanges(false);
      setSuccessMessage('Configuration saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save configuration';
      setError(errorMsg);
      console.error('Error saving config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await api.post('/admin/app-config/reset');
      const data = response.data?.data || response.data;
      setConfig(data);
      setOriginalConfig(data);
      setHasChanges(false);
      setResetConfirmOpen(false);
      setSuccessMessage('Configuration reset to defaults successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to reset configuration';
      setError(errorMsg);
      console.error('Error resetting config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchConfig();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (fetchLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          App Configuration Management
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Manage app versions, feature flags, and force update settings
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage('')} sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* Info Card */}
      <Card sx={{ mb: 3, backgroundColor: 'info.light', backgroundOpacity: 0.1, border: '1px solid #e3f2fd' }}>
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Info sx={{ color: 'info.main' }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Current Version: {config?.latestVersion || 'N/A'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Updated: {config?.timestamp ? new Date(config.timestamp).toLocaleString() : 'Never'}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto' }} />
          </Stack>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={loading || !hasChanges}
          sx={{ flex: { xs: 1, sm: 'auto' } }}
        >
          Save Changes
        </Button>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={loading}
          sx={{ flex: { xs: 1, sm: 'auto' } }}
        >
          Refresh
        </Button>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<RestartAlt />}
          onClick={() => setResetConfirmOpen(true)}
          disabled={loading}
          sx={{ flex: { xs: 1, sm: 'auto' } }}
        >
          Reset to Default
        </Button>
      </Stack>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          aria-label="app config tabs"
        >
          <Tab label="Configuration Editor" id="appconfig-tab-0" aria-controls="appconfig-tabpanel-0" />
          <Tab label="Test Configuration" id="appconfig-tab-1" aria-controls="appconfig-tabpanel-1" />
          <Tab label="Change History" id="appconfig-tab-2" aria-controls="appconfig-tabpanel-2" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {config && (
          <ConfigEditor
            config={config}
            onChange={handleConfigChange}
            loading={loading}
          />
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Alert severity="info">Coming soon: Configuration testing</Alert>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Alert severity="info">Coming soon: Change history</Alert>
      </TabPanel>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 600 }}>Reset Configuration</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Are you sure you want to reset the configuration to default values?
          </Typography>
          <Typography variant="caption" sx={{ color: 'warning.main', display: 'block', mt: 1 }}>
            ⚠️ This action cannot be undone
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleReset}
            variant="contained"
            color="warning"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Reset'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppConfigManagementPage;
