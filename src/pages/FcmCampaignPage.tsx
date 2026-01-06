import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import SendIcon from '@mui/icons-material/Send';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import { createFcmCampaign, getFcmCampaigns } from '../services/api';

type TargetType = 'all_users' | 'by_user_ids' | 'by_tokens';

interface Campaign {
  _id: string;
  title: string;
  body: string;
  targetType: TargetType;
  tokenCount: number;
  successCount: number;
  failureCount: number;
  status: string;
  createdAt: string;
  sentAt?: string;
}

const FcmCampaignPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [data, setData] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high'>('normal');
  const [targetType, setTargetType] = useState<TargetType>('all_users');
  const [userIds, setUserIds] = useState('');
  const [tokens, setTokens] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignsError, setCampaignsError] = useState('');

  const parsedData = useMemo(() => {
    try {
      return data ? JSON.parse(data) : undefined;
    } catch {
      return undefined;
    }
  }, [data]);

  const fetchCampaigns = async () => {
    console.log('[FCM UI] fetchCampaigns start');
    setCampaignsLoading(true);
    setCampaignsError('');
    try {
      const res: any = await getFcmCampaigns({ page: 1, limit: 10 });
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      setCampaigns(list);
      console.log('[FCM UI] fetchCampaigns success', { count: list.length });
    } catch (err: any) {
      console.error('[FCM UI] fetchCampaigns error', err);
      setCampaignsError(err?.response?.data?.message || 'Failed to load campaigns');
      setCampaigns([]);
    } finally {
      setCampaignsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      const payload = {
        title,
        body,
        imageUrl: imageUrl || undefined,
        deepLink: deepLink || undefined,
        data: parsedData,
        priority,
        targetType,
        userIds: targetType === 'by_user_ids' ? userIds.split(',').map((id) => id.trim()).filter(Boolean) : undefined,
        tokens: targetType === 'by_tokens' ? tokens.split('\n').map((t) => t.trim()).filter(Boolean) : undefined,
      };
      console.log('[FCM UI] create campaign submit', {
        ...payload,
        data: parsedData ? '[object]' : undefined,
        userIdsCount: payload.userIds?.length,
        tokensCount: payload.tokens?.length,
      });
      await createFcmCampaign(payload);
      setSuccess(true);
      fetchCampaigns();
      // reset minimal fields
      setTitle('');
      setBody('');
      setImageUrl('');
      setDeepLink('');
      setData('');
      setUserIds('');
      setTokens('');
      setTargetType('all_users');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={1200} mx="auto">
      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <CampaignIcon color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight={700} color="primary">
            FCM Campaigns
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Compose and send Firebase Cloud Messaging campaigns to all users or specific audiences. Data payload accepts JSON (for deep links, screen names, etc.).
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Box flex="1 1 520px" minWidth={320}>
              <Card variant="outlined">
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    fullWidth
                    multiline
                    minRows={3}
                  />
                  <TextField
                    label="Image URL (optional)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    fullWidth
                    placeholder="https://..."
                  />
                  <TextField
                    label="Deep link / Screen (optional)"
                    value={deepLink}
                    onChange={(e) => setDeepLink(e.target.value)}
                    fullWidth
                    placeholder="HomeScreen or https://example.com"
                  />
                  <TextField
                    label="Custom Data (JSON, optional)"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    fullWidth
                    multiline
                    minRows={3}
                    placeholder='{"type":"promo","cta":"open_app"}'
                    error={Boolean(data) && parsedData === undefined}
                    helperText={Boolean(data) && parsedData === undefined ? 'Invalid JSON' : 'Data is added to FCM data payload'}
                  />
                </CardContent>
              </Card>
            </Box>

            <Box flex="1 1 300px" minWidth={280}>
              <Card variant="outlined">
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    select
                    label="Target Audience"
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as TargetType)}
                    fullWidth
                  >
                    <MenuItem value="all_users">All Users (with FCM token)</MenuItem>
                    <MenuItem value="by_user_ids">Specific Users (by userId)</MenuItem>
                    <MenuItem value="by_tokens">Manual Tokens</MenuItem>
                  </TextField>

                  <TextField
                    select
                    label="Priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'normal' | 'high')}
                    fullWidth
                  >
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </TextField>

                  {targetType === 'by_user_ids' && (
                    <TextField
                      label="User IDs (comma separated)"
                      value={userIds}
                      onChange={(e) => setUserIds(e.target.value)}
                      fullWidth
                      placeholder="64c0...123, 64c0...789"
                    />
                  )}

                  {targetType === 'by_tokens' && (
                    <TextField
                      label="FCM Tokens (one per line)"
                      value={tokens}
                      onChange={(e) => setTokens(e.target.value)}
                      fullWidth
                      multiline
                      minRows={5}
                      placeholder="token1\ntoken2"
                    />
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SendIcon />}
                    disabled={loading || !title || !body || (targetType === 'by_tokens' && !tokens)}
                  >
                    {loading ? 'Sending...' : 'Send Campaign'}
                  </Button>
                  {error && <Alert severity="error">{error}</Alert>}
                </CardContent>
              </Card>
            </Box>
          </Box>
        </form>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0' }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <PlaylistAddCheckIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>Recent Campaigns</Typography>
        </Stack>
        {campaignsLoading ? (
          <Typography>Loading campaigns...</Typography>
        ) : campaignsError ? (
          <Alert severity="error">{campaignsError}</Alert>
        ) : campaigns.length === 0 ? (
          <Typography color="text.secondary">No campaigns yet.</Typography>
        ) : (
          <Stack spacing={2}>
            {campaigns.map((c) => (
              <Card key={c._id} variant="outlined">
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight={700}>{c.title}</Typography>
                    <Chip
                      label={c.status}
                      color={c.status === 'failed' ? 'error' : 'success'}
                      size="small"
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{c.body}</Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Chip label={`Target: ${c.targetType}`} size="small" />
                    <Chip label={`Tokens: ${c.tokenCount}`} size="small" />
                    <Chip label={`Sent: ${c.successCount}`} size="small" color="success" />
                    <Chip label={`Failed: ${c.failureCount}`} size="small" color="error" />
                    {c.sentAt && (
                      <Chip
                        label={`Sent ${new Date(c.sentAt).toLocaleString()}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Paper>

      <Snackbar open={success} autoHideDuration={4000} onClose={() => setSuccess(false)}>
        <Alert severity="success" sx={{ width: '100%' }}>
          Campaign created and dispatched successfully.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FcmCampaignPage;

