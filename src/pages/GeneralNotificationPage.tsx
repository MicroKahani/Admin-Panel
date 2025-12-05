import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Snackbar,
  Alert,
  Paper,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Divider,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore, Notifications, PriorityHigh, Group, Link } from '@mui/icons-material';
import { sendGeneralNotification } from '../services/api';

const GeneralNotificationPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');
  const [notificationType, setNotificationType] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [targetAudience, setTargetAudience] = useState('all');
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [actionButton1, setActionButton1] = useState('');
  const [actionButton2, setActionButton2] = useState('');
  const [actionButton1Link, setActionButton1Link] = useState('');
  const [actionButton2Link, setActionButton2Link] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const notificationData: any = {
        title,
        body,
        data: {
          ...(image ? { image } : {}),
          ...(link ? { link } : {}),
          type: notificationType,
          priority,
          targetAudience,
          ...(showActionButtons && actionButton1 ? { actionButton1, actionButton1Link } : {}),
          ...(showActionButtons && actionButton2 ? { actionButton2, actionButton2Link } : {}),
        },
      };

      await sendGeneralNotification(notificationData);
      setSuccess(true);

      // Reset form
      setTitle('');
      setBody('');
      setImage('');
      setLink('');
      setNotificationType('general');
      setPriority('normal');
      setTargetAudience('all');
      setShowActionButtons(false);
      setActionButton1('');
      setActionButton2('');
      setActionButton1Link('');
      setActionButton2Link('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send notification');
    }
    setLoading(false);
  };

  return (
    <Box maxWidth={800} mx="auto">
      <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
        <Typography variant="h5" fontWeight={700} mb={2} color="primary">
          Send General Notification
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Send a general notification to all users or specific target audiences. You can customize the notification type, priority, and add action buttons for better user engagement.
        </Typography>

        <form onSubmit={handleSend}>
          {/* Basic Information */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Notifications />
                Basic Information
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  fullWidth
                  required
                  placeholder="Enter notification title"
                />
                <TextField
                  label="Body"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  fullWidth
                  required
                  multiline
                  minRows={3}
                  placeholder="Enter notification message"
                />
                <TextField
                  label="Image URL (optional)"
                  value={image}
                  onChange={e => setImage(e.target.value)}
                  fullWidth
                  placeholder="https://example.com/image.jpg"
                  helperText="Add an image to make the notification more engaging"
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Notification Settings */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PriorityHigh />
                Notification Settings
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControl sx={{ minWidth: 200 }} fullWidth>
                    <InputLabel>Notification Type</InputLabel>
                    <Select
                      value={notificationType}
                      onChange={(e) => setNotificationType(e.target.value)}
                      label="Notification Type"
                    >
                      <MenuItem value="general">General</MenuItem>
                      <MenuItem value="announcement">Announcement</MenuItem>
                      <MenuItem value="update">Update</MenuItem>
                      <MenuItem value="reminder">Reminder</MenuItem>
                      <MenuItem value="promotion">Promotion</MenuItem>
                      <MenuItem value="news">News</MenuItem>
                      <MenuItem value="alert">Alert</MenuItem>
                      <MenuItem value="maintenance">Maintenance</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl sx={{ minWidth: 200 }} fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      label="Priority"
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="normal">Normal</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <FormControl fullWidth>
                  <InputLabel>Target Audience</InputLabel>
                  <Select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    label="Target Audience"
                  >
                    <MenuItem value="all">All Users</MenuItem>
                    <MenuItem value="new_users">New Users (registered in last 30 days)</MenuItem>
                    <MenuItem value="active_users">Active Users (logged in last 7 days)</MenuItem>
                    <MenuItem value="inactive_users">Inactive Users (not logged in 30+ days)</MenuItem>
                    <MenuItem value="premium_users">Premium Users</MenuItem>
                    <MenuItem value="organizers">Event Organizers</MenuItem>
                    <MenuItem value="students">Students</MenuItem>
                    <MenuItem value="professionals">Professionals</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Deep Linking */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Link />
                Deep Linking
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Deep Link or URL (optional)"
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  fullWidth
                  placeholder="e.g. HomeScreen, ProfileScreen, or https://example.com"
                  helperText="When users tap the notification, they'll be taken to this screen or URL"
                />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    label="HomeScreen"
                    onClick={() => setLink('HomeScreen')}
                    variant={link === 'HomeScreen' ? 'filled' : 'outlined'}
                    color="primary"
                  />
                  <Chip
                    label="ProfileScreen"
                    onClick={() => setLink('ProfileScreen')}
                    variant={link === 'ProfileScreen' ? 'filled' : 'outlined'}
                    color="primary"
                  />
                  <Chip
                    label="EventsScreen"
                    onClick={() => setLink('EventsScreen')}
                    variant={link === 'EventsScreen' ? 'filled' : 'outlined'}
                    color="primary"
                  />
                  <Chip
                    label="HackathonsScreen"
                    onClick={() => setLink('HackathonsScreen')}
                    variant={link === 'HackathonsScreen' ? 'filled' : 'outlined'}
                    color="primary"
                  />
                  <Chip
                    label="QuizzesScreen"
                    onClick={() => setLink('QuizzesScreen')}
                    variant={link === 'QuizzesScreen' ? 'filled' : 'outlined'}
                    color="primary"
                  />
                  <Chip
                    label="SavedScreen"
                    onClick={() => setLink('SavedScreen')}
                    variant={link === 'SavedScreen' ? 'filled' : 'outlined'}
                    color="primary"
                  />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Action Buttons */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Group />
                Action Buttons (Optional)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showActionButtons}
                      onChange={(e) => setShowActionButtons(e.target.checked)}
                    />
                  }
                  label="Enable Action Buttons"
                />

                {showActionButtons && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Action Button 1
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <TextField
                        label="Button Text"
                        value={actionButton1}
                        onChange={(e) => setActionButton1(e.target.value)}
                        sx={{ flex: 1, minWidth: 200 }}
                        placeholder="e.g. View Details, Learn More"
                      />
                      <TextField
                        label="Action Link"
                        value={actionButton1Link}
                        onChange={(e) => setActionButton1Link(e.target.value)}
                        sx={{ flex: 1, minWidth: 200 }}
                        placeholder="e.g. HomeScreen or https://..."
                      />
                    </Box>

                    <Typography variant="subtitle2" color="text.secondary">
                      Action Button 2
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <TextField
                        label="Button Text"
                        value={actionButton2}
                        onChange={(e) => setActionButton2(e.target.value)}
                        sx={{ flex: 1, minWidth: 200 }}
                        placeholder="e.g. Dismiss, Later"
                      />
                      <TextField
                        label="Action Link"
                        value={actionButton2Link}
                        onChange={(e) => setActionButton2Link(e.target.value)}
                        sx={{ flex: 1, minWidth: 200 }}
                        placeholder="e.g. HomeScreen or https://..."
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>

          <Divider sx={{ my: 3 }} />

          {/* Send Button */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={loading || !title || !body}
            sx={{ py: 1.5 }}
          >
            {loading ? 'Sending Notification...' : 'Send General Notification'}
          </Button>
        </form>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>

      <Snackbar open={success} autoHideDuration={5000} onClose={() => setSuccess(false)}>
        <Alert severity="success" sx={{ width: '100%' }}>
          General notification sent successfully to {targetAudience === 'all' ? 'all users' : targetAudience.replace('_', ' ')}!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GeneralNotificationPage; 