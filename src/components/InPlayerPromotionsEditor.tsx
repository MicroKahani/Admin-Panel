import React from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Stack,
  IconButton,
  Paper,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import type { PromotionFormRow } from '../utils/inPlayerPromotions';
import { newPromotionRow } from '../utils/inPlayerPromotions';

export type InPlayerPromotionsEditorProps = {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  rows: PromotionFormRow[];
  onRowsChange: (rows: PromotionFormRow[]) => void;
  disabled?: boolean;
};

export function InPlayerPromotionsEditor({
  enabled,
  onEnabledChange,
  rows,
  onRowsChange,
  disabled,
}: InPlayerPromotionsEditorProps) {
  const updateRow = (id: string, patch: Partial<PromotionFormRow>) => {
    onRowsChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };
  const removeRow = (id: string) => onRowsChange(rows.filter((r) => r.id !== id));
  const addRow = () => onRowsChange([...rows, newPromotionRow()]);

  return (
    <Box sx={{ opacity: enabled ? 1 : 0.55 }}>
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={(_, v) => onEnabledChange(v)}
            disabled={disabled}
          />
        }
        label="Show in-player promotions in app"
      />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
        Har promo: title, subtitle (optional), image ka direct URL, tap par khulne wala link, aur timestamps
        (har time par 2 second dikhega). Alag-alag creatives ke liye multiple promos add karo.
      </Typography>
      {enabled && (
        <Stack spacing={2}>
          {rows.map((row) => (
            <Paper key={row.id} variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
              <Stack spacing={1.5}>
                <TextField
                  size="small"
                  label="Title"
                  value={row.title}
                  onChange={(e) => updateRow(row.id, { title: e.target.value })}
                  fullWidth
                  disabled={disabled}
                />
                <TextField
                  size="small"
                  label="Subtitle (optional)"
                  value={row.subtitle}
                  onChange={(e) => updateRow(row.id, { subtitle: e.target.value })}
                  fullWidth
                  disabled={disabled}
                />
                <TextField
                  size="small"
                  label="Image URL (direct link)"
                  value={row.imageUrl}
                  onChange={(e) => updateRow(row.id, { imageUrl: e.target.value })}
                  fullWidth
                  disabled={disabled}
                  placeholder="https://..."
                />
                <TextField
                  size="small"
                  label="Link URL (user tap)"
                  value={row.linkUrl}
                  onChange={(e) => updateRow(row.id, { linkUrl: e.target.value })}
                  fullWidth
                  disabled={disabled}
                  placeholder="https://..."
                />
                <TextField
                  size="small"
                  label="Timestamps"
                  value={row.timestampsText}
                  onChange={(e) => updateRow(row.id, { timestampsText: e.target.value })}
                  fullWidth
                  disabled={disabled}
                  placeholder="15, 1:30, 2:00"
                  helperText="Comma-separated seconds ya M:SS — har time par 2 sec promo"
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => removeRow(row.id)}
                    disabled={disabled}
                    aria-label="Remove promotion"
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Box>
              </Stack>
            </Paper>
          ))}
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            onClick={addRow}
            disabled={disabled}
            size="small"
          >
            Add promotion
          </Button>
        </Stack>
      )}
    </Box>
  );
}
