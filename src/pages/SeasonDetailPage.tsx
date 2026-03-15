// frontend/src/pages/SeasonDetailPage.tsx
//contains the add episode popup + edit episode popup for each season
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Stack,
  Chip,
  Breadcrumbs,
  Link,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Upload,
  Delete,
  PlayArrow,
  CloudUpload,
  Image as ImageIcon,
  Edit as EditIcon,
  VideoFile as VideoFileIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  getSeasonById,
  getEpisodesBySeasonAdmin,
  uploadVideo,
  updateVideo,
  deleteVideo,
  updateVideoAdStatus,
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CastCrewManager from '../components/CastCrewManager';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Episode {
  _id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  episodeNumber: number;
  duration: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  isPublished: boolean;
  views: number;
  adStatus: 'unlocked' | 'interstitial' | 'rewarded' | 'rewarded_interstitial';
  createdAt: string;
  updatedAt?: string;
}

interface Season {
  _id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  seasonNumber: number;
  episodeCount: number;
  cast?: CastMember[];
}

interface CastMember {
  id?: string;
  name: string;
  character: string;
  image?: string;
  role: 'actor' | 'crew';
}

// ─── Form state shape (shared between upload + edit) ─────────────────────────

interface EpisodeFormState {
  title: string;
  description: string;
  episodeNumber: string;
  adStatus: Episode['adStatus'];
}

const EMPTY_FORM: EpisodeFormState = {
  title: '',
  description: '',
  episodeNumber: '',
  adStatus: 'unlocked',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cacheBust = (url: string | undefined, updatedAt?: string, seed?: number | string) => {
  const base = url || '';
  if (!base) return '';
  try {
    const ts = updatedAt ? new Date(updatedAt).getTime() : (seed ?? Date.now());
    return `${base}?v=${ts}`;
  } catch {
    return `${base}?v=${Date.now()}`;
  }
};

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  completed: 'success',
  processing: 'warning',
  failed: 'error',
};

const AD_LABELS: Record<Episode['adStatus'], string> = {
  unlocked: 'No Ad (Unlocked)',
  interstitial: 'Interstitial',
  rewarded: 'Rewarded',
  rewarded_interstitial: 'Rewarded Interstitial',
};

// ─── File validators ──────────────────────────────────────────────────────────

const validateVideoFile = (file: File): string | null => {
  if (file.size > 800 * 1024 * 1024) return 'File size must be less than 800 MB';
  if (!['video/mp4', 'video/quicktime'].includes(file.type)) return 'Only MP4 and MOV files are allowed';
  return null;
};

const validateImageFile = (file: File): string | null => {
  if (file.size > 5 * 1024 * 1024) return 'Thumbnail must be less than 5 MB';
  if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) return 'Only JPG / JPEG / PNG files are allowed';
  return null;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FilePickerProps {
  accept: string;
  label: string;
  file: File | null;
  preview?: string;
  icon: React.ReactNode;
  onChange: (file: File) => void;
  validate: (file: File) => string | null;
  onError: (msg: string) => void;
  warning?: string; // optional caveat shown below the picker (e.g. "Replacing will unpublish")
}

const FilePicker: React.FC<FilePickerProps> = ({
  accept, label, file, preview, icon, onChange, validate, onError, warning,
}) => (
  <Box>
    <Button
      variant="outlined"
      component="label"
      fullWidth
      sx={{ py: 1.5, justifyContent: 'flex-start', gap: 1, textAlign: 'left' }}
      color={file ? 'success' : 'primary'}
      startIcon={file ? <CheckCircleIcon /> : icon}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {file ? file.name : label}
        </Typography>
        {file && (
          <Typography variant="caption" color="text.secondary">
            {(file.size / 1024 / 1024).toFixed(1)} MB
          </Typography>
        )}
      </Box>
      <input
        type="file"
        hidden
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const err = validate(f);
          if (err) { onError(err); return; }
          onChange(f);
        }}
      />
    </Button>

    {warning && (
      <Alert severity="warning" icon={<WarningIcon fontSize="small" />} sx={{ mt: 1, py: 0.5 }}>
        <Typography variant="caption">{warning}</Typography>
      </Alert>
    )}

    {preview && (
      <Box sx={{ mt: 1.5, textAlign: 'center' }}>
        <img
          src={preview}
          alt="Preview"
          style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8, border: '1px solid #ddd' }}
        />
      </Box>
    )}
  </Box>
);

// ─── Main component ───────────────────────────────────────────────────────────

const SeasonDetailPage: React.FC = () => {
  const { seasonId } = useParams<{ seasonId: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // ── Data state ──
  const [season, setSeason] = useState<Season | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [castMembers, setCastMembers] = useState<CastMember[]>([]);

  // ── UI state ──
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // ── Upload dialog state ──
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState<EpisodeFormState>(EMPTY_FORM);
  const [uploadVideoFile, setUploadVideoFile] = useState<File | null>(null);
  const [uploadThumbFile, setUploadThumbFile] = useState<File | null>(null);
  const [uploadThumbPreview, setUploadThumbPreview] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // ── Edit dialog state ──
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Episode | null>(null);
  const [editForm, setEditForm] = useState<EpisodeFormState>(EMPTY_FORM);
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null);
  const [editThumbFile, setEditThumbFile] = useState<File | null>(null);
  const [editThumbPreview, setEditThumbPreview] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // ─── Fetch helpers ──────────────────────────────────────────────────────────

  const fetchSeasonDetails = useCallback(async () => {
    try {
      const response = await getSeasonById(seasonId!);
      const seasonData = (response as any).data?.data ?? (response as any).data;
      if (seasonData && typeof seasonData === 'object') {
        setSeason(seasonData);
        if (Array.isArray(seasonData.cast)) setCastMembers(seasonData.cast);
      } else {
        setError('Invalid season data');
      }
    } catch {
      setError('Failed to load season details');
    } finally {
      setFetchLoading(false);
    }
  }, [seasonId]);

  const fetchEpisodes = useCallback(async () => {
    try {
      const response = await getEpisodesBySeasonAdmin(seasonId!);
      const data = (response as any).data ?? response;
      setEpisodes(Array.isArray(data) ? data : []);
    } catch {
      console.error('Failed to fetch episodes');
    }
  }, [seasonId]);

  useEffect(() => {
    if (seasonId) {
      fetchSeasonDetails();
      fetchEpisodes();
    } else {
      setError('Invalid season ID');
      setFetchLoading(false);
    }
  }, [seasonId, fetchSeasonDetails, fetchEpisodes]);

  // ─── Filtered episodes ──────────────────────────────────────────────────────

  const filteredEpisodes = episodes.filter((ep) => {
    const lc = searchTerm.toLowerCase();
    const matchSearch =
      ep.title.toLowerCase().includes(lc) ||
      (ep.description ?? '').toLowerCase().includes(lc);
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'published' ? ep.isPublished :
       filterStatus === 'unpublished' ? !ep.isPublished : true);
    return matchSearch && matchStatus;
  });

  // ─── Ad-status quick-change ─────────────────────────────────────────────────

  const handleAdStatusChange = async (episodeId: string, adStatus: Episode['adStatus']) => {
    try {
      await updateVideoAdStatus(episodeId, adStatus);
      setEpisodes((prev) => prev.map((ep) => ep._id === episodeId ? { ...ep, adStatus } : ep));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update ad status');
      fetchEpisodes();
    }
  };

  // ─── Publish toggle ─────────────────────────────────────────────────────────

  const handleTogglePublish = async (episodeId: string, current: boolean) => {
    try {
      await updateVideo(episodeId, { isPublished: !current } as any);
      setEpisodes((prev) => prev.map((ep) => ep._id === episodeId ? { ...ep, isPublished: !current } : ep));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update episode');
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (episodeId: string) => {
    if (!window.confirm('Are you sure you want to delete this episode? This cannot be undone.')) return;
    try {
      await deleteVideo(episodeId);
      setEpisodes((prev) => prev.filter((ep) => ep._id !== episodeId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete episode');
    }
  };

  // ─── Thumbnail helper ───────────────────────────────────────────────────────

  const previewImageFile = (file: File, setter: (s: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ══════════════════════════════════════════════════════════════════════════════
  //  UPLOAD DIALOG
  // ══════════════════════════════════════════════════════════════════════════════

  const openUploadDialog = () => {
    const next = episodes.length > 0 ? Math.max(...episodes.map((e) => e.episodeNumber)) + 1 : 1;
    setUploadForm({ ...EMPTY_FORM, episodeNumber: String(next) });
    setUploadVideoFile(null);
    setUploadThumbFile(null);
    setUploadThumbPreview('');
    setUploadError('');
    setUploadOpen(true);
  };

  const closeUploadDialog = () => {
    setUploadOpen(false);
    setUploadError('');
  };

  const handleUpload = async () => {
    if (!uploadVideoFile) { setUploadError('Please select a video file'); return; }
    if (!uploadForm.title.trim()) { setUploadError('Title is required'); return; }
    if (!uploadForm.episodeNumber || parseInt(uploadForm.episodeNumber) < 1) {
      setUploadError('Enter a valid episode number');
      return;
    }

    setUploadLoading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('video', uploadVideoFile);
      fd.append('title', uploadForm.title.trim());
      fd.append('description', uploadForm.description);
      fd.append('type', 'episode');
      fd.append('seasonId', seasonId!);
      fd.append('episodeNumber', uploadForm.episodeNumber);
      fd.append('adStatus', uploadForm.adStatus);
      if (uploadThumbFile) fd.append('thumbnail', uploadThumbFile);

      await uploadVideo(fd);
      alert('Episode upload started! It will appear shortly once processed.');
      closeUploadDialog();
      fetchEpisodes();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  //  EDIT DIALOG
  // ══════════════════════════════════════════════════════════════════════════════

  const openEditDialog = (episode: Episode) => {
    setEditTarget(episode);
    setEditForm({
      title: episode.title,
      description: episode.description ?? '',
      episodeNumber: String(episode.episodeNumber),
      adStatus: episode.adStatus,
    });
    setEditVideoFile(null);
    setEditThumbFile(null);
    setEditThumbPreview('');
    setEditError('');
    setEditOpen(true);
  };

  const closeEditDialog = () => {
    setEditOpen(false);
    setEditTarget(null);
    setEditError('');
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    if (!editForm.title.trim()) { setEditError('Title is required'); return; }

    setEditLoading(true);
    setEditError('');
    try {
      const fd = new FormData();
      fd.append('title', editForm.title.trim());
      fd.append('description', editForm.description);
      fd.append('adStatus', editForm.adStatus);

      if (editVideoFile) {
        fd.append('video', editVideoFile);
        if (editThumbFile) fd.append('thumbnail', editThumbFile);
      } else if (editThumbFile) {
        fd.append('thumbnail', editThumbFile);
      }

      await updateVideo(editTarget._id, fd);

      if (editVideoFile) {
        // Video is being replaced — mark it as processing in local state
        setEpisodes((prev) =>
          prev.map((ep) =>
            ep._id === editTarget._id
              ? {
                  ...ep,
                  title: editForm.title.trim(),
                  description: editForm.description,
                  adStatus: editForm.adStatus,
                  status: 'processing',
                  isPublished: false,
                }
              : ep
          )
        );
        alert(
          'Video replacement started! The episode will be automatically re-published once processing completes. All likes and views have been preserved.'
        );
      } else {
        // Metadata-only update — reflect changes immediately
        setEpisodes((prev) =>
          prev.map((ep) =>
            ep._id === editTarget._id
              ? {
                  ...ep,
                  title: editForm.title.trim(),
                  description: editForm.description,
                  adStatus: editForm.adStatus,
                  ...(editThumbFile ? { updatedAt: new Date().toISOString() } : {}),
                }
              : ep
          )
        );
      }

      closeEditDialog();
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  // ─── Loading / error screens ────────────────────────────────────────────────

  if (fetchLoading) {
    return (
      <Box sx={{ pt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }} color="text.secondary">
          Loading season details…
        </Typography>
      </Box>
    );
  }

  if (error && !season) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Button variant="outlined" onClick={() => navigate('/webseries')}>Back to Web Series</Button>
      </Box>
    );
  }

  if (!season) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Season not found.</Alert>
        <Button variant="outlined" onClick={() => navigate('/webseries')} sx={{ mt: 2 }}>Back</Button>
      </Box>
    );
  }

  // ─── Main render ────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href="#"
            onClick={(e) => { e.preventDefault(); navigate('/webseries'); }}
          >
            Web Series
          </Link>
          <Typography color="text.primary">{season.title}</Typography>
        </Breadcrumbs>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">{season.title}</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              Season {season.seasonNumber} • {episodes.length} Episodes
            </Typography>
          </Box>
          {hasPermission('write') && (
            <Button variant="contained" startIcon={<Upload />} onClick={openUploadDialog}>
              Add Episode
            </Button>
          )}
        </Box>
      </Box>

      {/* ── Non-fatal error banner ── */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>
      )}

      {/* ── Season description ── */}
      {season.description && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="body1">{season.description}</Typography>
        </Paper>
      )}

      {/* ── Cast & Crew ── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <CastCrewManager
          castMembers={castMembers}
          onCastChange={(members) => {
            setCastMembers(members);
            setSeason((s) => s ? { ...s, cast: members } : s);
          }}
          error={error}
        />
      </Paper>

      {/* ── Filters ── */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 8 }}>
            <TextField
              fullWidth
              size="small"
              label="Search Episodes"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or description…"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="unpublished">Unpublished</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* ── Episodes grid ── */}
      <Grid container spacing={3}>
        {filteredEpisodes.map((episode) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={episode._id}>
            <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Thumbnail */}
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="180"
                  image={cacheBust(episode.thumbnailUrl, episode.updatedAt, episode.episodeNumber) ||
                    `https://via.placeholder.com/300x180?text=Episode+${episode.episodeNumber}`}
                  alt={episode.title}
                />
                {/* Play button */}
                <IconButton
                  sx={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: 'rgba(0,0,0,0.65)', color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.88)' },
                  }}
                  onClick={() => navigate(`/episode/${episode._id}`)}
                >
                  <PlayArrow sx={{ fontSize: 38 }} />
                </IconButton>
                {/* Episode number badge */}
                <Chip
                  label={`Ep ${episode.episodeNumber}`}
                  size="small"
                  sx={{
                    position: 'absolute', top: 8, left: 8,
                    bgcolor: 'rgba(0,0,0,0.7)', color: 'white', fontWeight: 700,
                  }}
                />
                {/* Status badge */}
                {episode.status !== 'completed' && (
                  <Chip
                    label={episode.status.toUpperCase()}
                    size="small"
                    color={STATUS_COLOR[episode.status] ?? 'default'}
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  />
                )}
              </Box>

              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" noWrap title={episode.title}>{episode.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{
                  mt: 0.5, mb: 1,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {episode.description || 'No description'}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  <Chip label={episode.status} size="small" color={STATUS_COLOR[episode.status] ?? 'default'} />
                  {episode.isPublished && <Chip label="Published" size="small" color="success" />}
                  <Chip label={`${episode.views ?? 0} views`} size="small" variant="outlined" />
                </Box>

                {/* Ad type selector */}
                {hasPermission('write') && (
                  <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                    <InputLabel>Ad Type</InputLabel>
                    <Select
                      value={episode.adStatus || 'unlocked'}
                      label="Ad Type"
                      onChange={(e) => handleAdStatusChange(episode._id, e.target.value as Episode['adStatus'])}
                    >
                      {(Object.keys(AD_LABELS) as Episode['adStatus'][]).map((k) => (
                        <MenuItem key={k} value={k}>{AD_LABELS[k]}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </CardContent>

              <Divider />

              <CardActions sx={{ justifyContent: 'space-between', px: 1.5, py: 1 }}>
                {/* Left: Publish toggle */}
                <Box>
                  {hasPermission('write') && episode.status === 'completed' && (
                    <Button size="small" onClick={() => handleTogglePublish(episode._id, episode.isPublished)}>
                      {episode.isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                  )}
                </Box>

                {/* Right: Edit + Delete */}
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {hasPermission('write') && (
                    <Tooltip title="Edit episode">
                      <IconButton size="small" color="primary" onClick={() => openEditDialog(episode)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {hasPermission('delete') && (
                    <Tooltip title="Delete episode">
                      <IconButton size="small" color="error" onClick={() => handleDelete(episode._id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredEpisodes.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center', mt: 2 }}>
          <CloudUpload sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No episodes found</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your filters.'
              : 'Click "Add Episode" to upload your first episode.'}
          </Typography>
        </Paper>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           UPLOAD DIALOG
         ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={uploadOpen} onClose={closeUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Upload New Episode</DialogTitle>
        <DialogContent>
          {uploadError && <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FilePicker
              accept="video/mp4,video/quicktime"
              label="Select Video (MP4 / MOV, max 800 MB)"
              file={uploadVideoFile}
              icon={<VideoFileIcon />}
              onChange={setUploadVideoFile}
              validate={validateVideoFile}
              onError={setUploadError}
            />

            <FilePicker
              accept="image/jpeg,image/jpg,image/png"
              label="Upload Custom Thumbnail (Optional)"
              file={uploadThumbFile}
              preview={uploadThumbPreview}
              icon={<ImageIcon />}
              onChange={(f) => { setUploadThumbFile(f); previewImageFile(f, setUploadThumbPreview); }}
              validate={validateImageFile}
              onError={setUploadError}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="Episode Number"
                  type="number"
                  value={uploadForm.episodeNumber}
                  onChange={(e) => setUploadForm((f) => ({ ...f, episodeNumber: e.target.value }))}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Ad Requirement</InputLabel>
                  <Select
                    value={uploadForm.adStatus}
                    label="Ad Requirement"
                    onChange={(e) => setUploadForm((f) => ({ ...f, adStatus: e.target.value as Episode['adStatus'] }))}
                  >
                    {(Object.keys(AD_LABELS) as Episode['adStatus'][]).map((k) => (
                      <MenuItem key={k} value={k}>{AD_LABELS[k]}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Title"
              value={uploadForm.title}
              onChange={(e) => setUploadForm((f) => ({ ...f, title: e.target.value }))}
              required
              placeholder="Episode title…"
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={uploadForm.description}
              onChange={(e) => setUploadForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief description…"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeUploadDialog} disabled={uploadLoading}>Cancel</Button>
          <Button onClick={handleUpload} variant="contained" disabled={uploadLoading}>
            {uploadLoading ? 'Uploading…' : 'Upload Episode'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
           EDIT DIALOG
         ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={editOpen} onClose={closeEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Edit Episode {editTarget ? `— Ep ${editTarget.episodeNumber}` : ''}
        </DialogTitle>
        <DialogContent>
          {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}

          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* ── Metadata ── */}
            <TextField
              fullWidth
              label="Title"
              value={editForm.title}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel>Ad Requirement</InputLabel>
              <Select
                value={editForm.adStatus}
                label="Ad Requirement"
                onChange={(e) => setEditForm((f) => ({ ...f, adStatus: e.target.value as Episode['adStatus'] }))}
              >
                {(Object.keys(AD_LABELS) as Episode['adStatus'][]).map((k) => (
                  <MenuItem key={k} value={k}>{AD_LABELS[k]}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider>
              <Typography variant="caption" color="text.secondary">OPTIONAL FILE REPLACEMENTS</Typography>
            </Divider>

            {/* ── Replace video ── */}
            <FilePicker
              accept="video/mp4,video/quicktime"
              label="Replace Video File (MP4 / MOV, max 800 MB)"
              file={editVideoFile}
              icon={<VideoFileIcon />}
              onChange={setEditVideoFile}
              validate={validateVideoFile}
              onError={setEditError}
              warning="Replacing the video will temporarily unpublish the episode while it re-processes. All likes, views, and comments are preserved."
            />

            {/* ── Replace thumbnail ── */}
            <FilePicker
              accept="image/jpeg,image/jpg,image/png"
              label="Replace Thumbnail (Optional)"
              file={editThumbFile}
              preview={editThumbPreview}
              icon={<ImageIcon />}
              onChange={(f) => { setEditThumbFile(f); previewImageFile(f, setEditThumbPreview); }}
              validate={validateImageFile}
              onError={setEditError}
            />

            {/* Show current thumbnail if no new one selected */}
            {!editThumbPreview && editTarget?.thumbnailUrl && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Current Thumbnail
                </Typography>
                <img
                  src={cacheBust(editTarget.thumbnailUrl, editTarget.updatedAt)}
                  alt="Current thumbnail"
                  style={{ maxWidth: '100%', maxHeight: 140, borderRadius: 8, border: '1px solid #ddd' }}
                />
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeEditDialog} disabled={editLoading}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" disabled={editLoading}>
            {editLoading
              ? (editVideoFile ? 'Starting…' : 'Saving…')
              : (editVideoFile ? 'Replace Video & Save' : 'Save Changes')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SeasonDetailPage;