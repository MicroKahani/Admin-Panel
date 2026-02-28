// src/components/AppConfig/ConfigEditor.tsx
import React from 'react';
import {
  Box,
  Paper,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Stack,
  Typography,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { Info } from '@mui/icons-material';

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

interface ConfigEditorProps {
  config: AppConfig;
  onChange: (config: AppConfig) => void;
  loading?: boolean;
}

const ConfigEditor: React.FC<ConfigEditorProps> = ({ config, onChange, loading = false }) => {
  const handleChange = (field: keyof AppConfig, value: any) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  return (
    <Box>
      <Stack spacing={3}>
        {/* Version Information Section */}
        <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            📱 Version Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Latest Version"
                value={config.latestVersion}
                onChange={(e) => handleChange('latestVersion', e.target.value)}
                placeholder="e.g., 1.2.0"
                disabled={loading}
                helperText="Current version available in app stores"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum Supported Version"
                value={config.minSupportedVersion}
                onChange={(e) => handleChange('minSupportedVersion', e.target.value)}
                placeholder="e.g., 1.0.0"
                disabled={loading}
                helperText="Versions below this will be blocked"
                size="small"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Update Settings Section */}
        <Paper sx={{ p: 3, backgroundColor: '#fff3e0' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            🔄 Update Settings
          </Typography>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.forceUpdate}
                  onChange={(e) => handleChange('forceUpdate', e.target.checked)}
                  disabled={loading}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Force Update
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Users cannot bypass the update
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={config.blockAppUsage}
                  onChange={(e) => handleChange('blockAppUsage', e.target.checked)}
                  disabled={loading}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Block App Usage
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Block app completely if version is outdated
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={config.showEveryLaunch}
                  onChange={(e) => handleChange('showEveryLaunch', e.target.checked)}
                  disabled={loading}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Show Every Launch
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Display update message on every app launch
                  </Typography>
                </Box>
              }
            />
          </Stack>
        </Paper>

        {/* Messages Section */}
        <Paper sx={{ p: 3, backgroundColor: '#e3f2fd' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            💬 Update Messages
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Update Message"
              value={config.updateMessage}
              onChange={(e) => handleChange('updateMessage', e.target.value)}
              placeholder="What's new in this version?"
              multiline
              rows={3}
              disabled={loading}
              helperText="Shown to users who need to update"
              size="small"
            />

            <TextField
              fullWidth
              label="Changelog"
              value={config.changeLog}
              onChange={(e) => handleChange('changeLog', e.target.value)}
              placeholder="Detailed list of changes and improvements"
              multiline
              rows={4}
              disabled={loading}
              helperText="Detailed changelog for users to review"
              size="small"
            />
          </Stack>
        </Paper>

        {/* Download Section */}
        <Paper sx={{ p: 3, backgroundColor: '#f3e5f5' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            🔗 Download Link
          </Typography>
          <TextField
            fullWidth
            label="Update URL"
            value={config.updateUrl}
            onChange={(e) => handleChange('updateUrl', e.target.value)}
            placeholder="https://play.google.com/store/apps/details?id=com.example.app"
            disabled={loading}
            helperText="Link where users can download the app update"
            size="small"
          />
        </Paper>

        {/* Info Alert */}
        <Alert icon={<Info />} severity="info">
          <Typography variant="body2">
            💡 <strong>Pro Tip:</strong> Test your configuration changes using the "Test Configuration" tab before saving to ensure they work as expected.
          </Typography>
        </Alert>
      </Stack>
    </Box>
  );
};

export default ConfigEditor;
