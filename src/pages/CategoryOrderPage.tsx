import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  IconButton,
  Avatar,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  ArrowUpward,
  ArrowDownward,
  Save,
  DragIndicator,
  CheckCircle,
} from '@mui/icons-material';
import { getAllSeasons, updateCategoryOrder } from '../services/api';

const CATEGORIES = [
  'Drama & Emotions',
  'Comedy Section',
  'Thriller & Suspense',
  'Religious & Devotional',
  'Life Philosophy',
] as const;

interface SeasonItem {
  _id: string;
  title: string;
  thumbnail?: string;
  episodeCount: number;
  tagOrder: number;
  tagAddedAt: string;
}

const CategoryOrderPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [allSeasons, setAllSeasons] = useState<any[]>([]);
  const [orderedItems, setOrderedItems] = useState<SeasonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedTab, setSavedTab] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getAllSeasons()
      .then((res: any) => {
        const data = res.data?.data || res.data || [];
        setAllSeasons(Array.isArray(data) ? data : []);
      })
      .catch(() => setError('Failed to load seasons'))
      .finally(() => setLoading(false));
  }, []);

  const selectedCategory = CATEGORIES[activeTab];

  // Rebuild the ordered list whenever category or data changes
  useEffect(() => {
    const category = CATEGORIES[activeTab];
    const filtered: SeasonItem[] = allSeasons
      .filter((s: any) => {
        if (!Array.isArray(s.tags)) return false;
        return s.tags.some((t: any) =>
          (typeof t === 'string' ? t : t.name) === category
        );
      })
      .map((s: any) => {
        const tag = s.tags.find((t: any) =>
          (typeof t === 'string' ? t : t.name) === category
        );
        const rawOrder = typeof tag === 'object' ? (tag?.order ?? 0) : 0;
        return {
          _id: s._id,
          title: s.title,
          thumbnail: s.thumbnail,
          episodeCount: s.episodeCount || 0,
          tagOrder: rawOrder === 0 ? 999999 : rawOrder,
          tagAddedAt: typeof tag === 'object' ? (tag?.addedAt ?? s.createdAt) : s.createdAt,
        };
      })
      .sort((a, b) => {
        if (a.tagOrder !== b.tagOrder) return a.tagOrder - b.tagOrder;
        return new Date(a.tagAddedAt).getTime() - new Date(b.tagAddedAt).getTime();
      });

    setOrderedItems(filtered);
    setSavedTab(null);
  }, [activeTab, allSeasons]);

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    setOrderedItems((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
    setSavedTab(null);
  }, []);

  const moveDown = useCallback((index: number) => {
    setOrderedItems((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
    setSavedTab(null);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const items = orderedItems.map((item, index) => ({
        seasonId: item._id,
        order: index + 1,
      }));

      await updateCategoryOrder({ category: selectedCategory, items });

      // Sync new orders back into allSeasons so switching tabs reflects saved state
      setAllSeasons((prev) =>
        prev.map((s) => {
          const updated = items.find((i) => i.seasonId === s._id);
          if (!updated) return s;
          return {
            ...s,
            tags: (s.tags || []).map((t: any) => {
              const name = typeof t === 'string' ? t : t.name;
              if (name !== selectedCategory) return t;
              return { ...(typeof t === 'object' ? t : { name: t }), order: updated.order };
            }),
          };
        })
      );

      setSavedTab(activeTab);
    } catch {
      setError('Failed to save order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Category Order
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Drag or use the arrows to set the display order of series in each category.
          Series at position 1 appears first in the app. Unordered series (no position set) appear at the end.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
        >
          {CATEGORIES.map((cat) => (
            <Tab key={cat} label={cat} />
          ))}
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      ) : orderedItems.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderStyle: 'dashed' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No series in "{selectedCategory}"
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tag series with this category in Web Series Management to set their order here.
          </Typography>
        </Paper>
      ) : (
        <Paper>
          <Box
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: 'grey.50',
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {orderedItems.length} series · {selectedCategory}
            </Typography>
          </Box>

          <List disablePadding>
            {orderedItems.map((item, index) => (
              <ListItem
                key={item._id}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  gap: 1.5,
                  py: 1.5,
                  px: 2,
                  '&:last-child': { borderBottom: 'none' },
                  transition: 'background 0.15s',
                  '&:hover': { bgcolor: 'grey.50' },
                }}
              >
                {/* Drag indicator (visual only) */}
                <DragIndicator sx={{ color: 'text.disabled', flexShrink: 0 }} />

                {/* Position badge */}
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </Box>

                {/* Thumbnail */}
                <Avatar
                  src={item.thumbnail}
                  variant="rounded"
                  sx={{ width: 52, height: 68, flexShrink: 0 }}
                />

                {/* Title & episode count */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={600} noWrap>
                    {item.title}
                  </Typography>
                  <Chip
                    label={
                      item.episodeCount === 0
                        ? 'Coming Soon'
                        : `${item.episodeCount} episode${item.episodeCount !== 1 ? 's' : ''}`
                    }
                    size="small"
                    color={item.episodeCount === 0 ? 'warning' : 'default'}
                    sx={{ mt: 0.5, height: 20, fontSize: 11 }}
                  />
                </Box>

                {/* Up / Down buttons */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, flexShrink: 0 }}>
                  <Tooltip title="Move up">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                      >
                        <ArrowUpward fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Move down">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => moveDown(index)}
                        disabled={index === orderedItems.length - 1}
                      >
                        <ArrowDownward fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Save footer */}
      {orderedItems.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 2,
            mt: 3,
          }}
        >
          {savedTab === activeTab && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'success.main' }}>
              <CheckCircle fontSize="small" />
              <Typography variant="body2" fontWeight={600}>
                Order saved!
              </Typography>
            </Box>
          )}
          <Button
            variant="contained"
            size="large"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
            onClick={handleSave}
            disabled={saving || orderedItems.length === 0}
            sx={{ minWidth: 140 }}
          >
            {saving ? 'Saving…' : 'Save Order'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CategoryOrderPage;
