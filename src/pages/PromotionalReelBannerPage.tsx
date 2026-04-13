import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Stack,
  Divider,
  Chip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CampaignIcon from '@mui/icons-material/Campaign';
import { useAuth } from '../contexts/AuthContext';
import { getReelPromoBannerAdmin, updateReelPromoBannerAdmin } from '../services/api';

function isoToDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface ConfigPayload {
  isEnabled: boolean;
  title: string;
  linkUrl: string;
  imageUrl: string;
  label: string;
  autoExpandAfterSeconds: number;
  startsAt: string | null;
  endsAt: string | null;
  scheduledActive: boolean;
}

const PromotionalReelBannerPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('write');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isEnabled, setIsEnabled] = useState(false);
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [label, setLabel] = useState('Shop');
  const [autoExpandAfterSeconds, setAutoExpandAfterSeconds] = useState(0);
  const [startsLocal, setStartsLocal] = useState('');
  const [endsLocal, setEndsLocal] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [scheduledActive, setScheduledActive] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await getReelPromoBannerAdmin();
      const d: ConfigPayload = res?.data?.data;
      if (!d) {
        setError('Invalid response from server');
        return;
      }
      setIsEnabled(!!d.isEnabled);
      setTitle(d.title || '');
      setLinkUrl(d.linkUrl || '');
      setLabel(d.label || 'Shop');
      setAutoExpandAfterSeconds(
        typeof d.autoExpandAfterSeconds === 'number' && d.autoExpandAfterSeconds >= 0
          ? d.autoExpandAfterSeconds
          : 0
      );
      setStartsLocal(isoToDatetimeLocalValue(d.startsAt));
      setEndsLocal(isoToDatetimeLocalValue(d.endsAt));
      setImageUrl(d.imageUrl || '');
      setPreview(d.imageUrl || '');
      setScheduledActive(!!d.scheduledActive);
      setImageFile(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setError('Image must be 5MB or smaller');
      return;
    }
    setImageFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const save = async () => {
    if (!canWrite) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const fd = new FormData();
      fd.append('isEnabled', String(isEnabled));
      fd.append('title', title.trim());
      fd.append('linkUrl', linkUrl.trim());
      fd.append('label', label.trim() || 'Shop');
      fd.append('autoExpandAfterSeconds', String(Math.max(0, Math.min(3600, autoExpandAfterSeconds || 0))));
      fd.append(
        'startsAt',
        startsLocal.trim() ? new Date(startsLocal).toISOString() : ''
      );
      fd.append('endsAt', endsLocal.trim() ? new Date(endsLocal).toISOString() : '');
      fd.append('imageUrl', imageUrl);
      if (imageFile) {
        fd.append('image', imageFile);
      }
      const res: any = await updateReelPromoBannerAdmin(fd);
      const d = res?.data?.data;
      if (d) {
        setImageUrl(d.imageUrl || '');
        setScheduledActive(!!d.scheduledActive);
        setImageFile(null);
        if (d.imageUrl) setPreview(d.imageUrl);
      }
      setSuccess('Saved successfully');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography>Loading…</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <CampaignIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>
          Reel promo banner
        </Typography>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Top-right tab on Reels and episode player: tap to expand, tap again to open the link. You can
        set the interval in seconds: the banner auto-expands, stays open 5 seconds, collapses, then after
        the same interval it expands again (repeats until the user swipes to another episode or opens it
        manually). Optional schedule uses your browser local time (stored as UTC on the server).
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, maxWidth: 720 }}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={isEnabled}
                  onChange={(_, v) => setIsEnabled(v)}
                  disabled={!canWrite}
                />
              }
              label="Banner enabled"
            />
            <Chip
              size="small"
              label={scheduledActive ? 'Live in app (within schedule)' : 'Not shown in app'}
              color={scheduledActive ? 'success' : 'default'}
            />
          </Stack>

          <TextField
            label="Banner title"
            placeholder="e.g. Monsoon Sale — 50% off"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            disabled={!canWrite}
            helperText="Shown beside the image in one row (orange text); label shows after · if different"
          />

          <TextField
            label="Destination link"
            placeholder="https://microkahani.com/shop"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            fullWidth
            required={isEnabled}
            disabled={!canWrite}
            helperText="Opened when the user taps the expanded banner"
          />

          <TextField
            label="Auto-expand interval (seconds, per episode)"
            type="number"
            inputProps={{ min: 0, max: 3600, step: 1 }}
            value={autoExpandAfterSeconds}
            onChange={(e) => setAutoExpandAfterSeconds(parseInt(e.target.value, 10) || 0)}
            fullWidth
            disabled={!canWrite}
            helperText="0 = only manual tap. Otherwise: wait this many seconds → expand → stay 5s → collapse → repeat on the same episode. Swipe to another episode resets the cycle. Tapping to expand manually stops auto-repeat until the next episode."
          />

          <TextField
            label="Short label (fallback if no image)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            fullWidth
            disabled={!canWrite}
          />

          <Divider />

          <Typography variant="subtitle2" color="text.secondary">
            Schedule (optional)
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Start"
              type="datetime-local"
              value={startsLocal}
              onChange={(e) => setStartsLocal(e.target.value)}
              fullWidth
              disabled={!canWrite}
              InputLabelProps={{ shrink: true }}
              helperText="Leave empty to start immediately when enabled"
            />
            <TextField
              label="End"
              type="datetime-local"
              value={endsLocal}
              onChange={(e) => setEndsLocal(e.target.value)}
              fullWidth
              disabled={!canWrite}
              InputLabelProps={{ shrink: true }}
              helperText="Leave empty for no end date"
            />
          </Stack>

          <Divider />

          <Typography variant="subtitle2" color="text.secondary">
            Image (shown in expanded banner)
          </Typography>
          {preview ? (
            <Box
              component="img"
              src={preview}
              alt="Preview"
              sx={{ maxWidth: 320, maxHeight: 120, objectFit: 'contain', borderRadius: 1, border: '1px solid #eee' }}
            />
          ) : null}
          <Button variant="outlined" component="label" disabled={!canWrite}>
            Upload image (JPG, PNG, WEBP — max 5MB)
            <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={handleFile} />
          </Button>
          <TextField
            label="Or paste image URL"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              if (!imageFile) setPreview(e.target.value);
            }}
            fullWidth
            disabled={!canWrite}
            helperText="Used when no new file is uploaded"
          />

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={save}
            disabled={!canWrite || saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default PromotionalReelBannerPage;
