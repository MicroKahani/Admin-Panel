import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  Schedule,
  Notifications,
  PlayArrow,
  Refresh,
  TrendingUp,
  Event,
  Code,
  Quiz,
  People,
  AccessTime
} from '@mui/icons-material';
import { getSchedulerStatus, triggerRegistrationReminders, triggerStartNotifications, getUpcomingNotifications, getNotificationStats } from '../services/api';

interface SchedulerStatus {
  isInitialized: boolean;
  registrationReminders: string;
  startNotifications: string;
  timezone: string;
}

interface NotificationStats {
  tomorrow: {
    registrationEnding: {
      events: number;
      hackathons: number;
      quizzes: number;
      total: number;
    };
  };
  thisWeek: {
    starting: {
      events: number;
      hackathons: number;
      quizzes: number;
      total: number;
    };
  };
  scheduler: SchedulerStatus;
}

interface UpcomingNotification {
  _id: string;
  title: string;
  dates: {
    registrationEndDate?: string;
    startDate?: string;
  };
  status?: string;
  savedBy?: Array<{ username: string; firstName: string; lastName: string }>;
  participants?: Array<{ username: string; firstName: string; lastName: string }>;
}

const AutomatedNotificationsPage: React.FC = () => {
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [upcoming, setUpcoming] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statusRes, statsRes, upcomingRes] = await Promise.all([
        getSchedulerStatus(),
        getNotificationStats(),
        getUpcomingNotifications()
      ]);

      setSchedulerStatus(statusRes.data);
      setStats(statsRes.data);
      setUpcoming(upcomingRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTriggerRegistration = async () => {
    try {
      await triggerRegistrationReminders();
      setSuccess('Registration reminders triggered successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to trigger registration reminders');
    }
  };

  const handleTriggerStart = async () => {
    try {
      await triggerStartNotifications();
      setSuccess('Start notifications triggered successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to trigger start notifications');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntil = (dateString: string) => {
    const now = new Date();
    const target = new Date(dateString);
    const diff = target.getTime() - now.getTime();
    
    if (diff < 0) return 'Past';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth={1200} mx="auto">
      <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Schedule color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700} color="primary">
            Automated Notifications
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Scheduler Status */}
        {schedulerStatus && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Scheduler Status
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <Box flex="1 1 200px" minWidth={200} maxWidth={300} textAlign="center">
                  <Chip
                    label={schedulerStatus.isInitialized ? 'Active' : 'Inactive'}
                    color={schedulerStatus.isInitialized ? 'success' : 'error'}
                    icon={<Notifications />}
                  />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Status
                  </Typography>
                </Box>
                <Box flex="1 1 200px" minWidth={200} maxWidth={300} textAlign="center">
                  <Typography variant="h6" color="primary">
                    7:00 PM
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Registration Reminders
                  </Typography>
                </Box>
                <Box flex="1 1 200px" minWidth={200} maxWidth={300} textAlign="center">
                  <Typography variant="h6" color="primary">
                    Every 15 min
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start Notifications
                  </Typography>
                </Box>
                <Box flex="1 1 200px" minWidth={200} maxWidth={300} textAlign="center">
                  <Typography variant="h6" color="primary">
                    IST
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Timezone
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        {stats && (
          <Box display="flex" flexWrap="wrap" gap={3} mb={3}>
            <Box flex="1 1 350px" minWidth={300} maxWidth={500}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
                    <AccessTime color="primary" />
                    Tomorrow's Registration Deadlines
                  </Typography>
                  <Box display="flex" gap={2}>
                    <Box flex="1 1 100px" minWidth={100} textAlign="center">
                      <Typography variant="h4" color="primary">
                        {stats.tomorrow.registrationEnding.events}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Events
                      </Typography>
                    </Box>
                    <Box flex="1 1 100px" minWidth={100} textAlign="center">
                      <Typography variant="h4" color="primary">
                        {stats.tomorrow.registrationEnding.hackathons}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Hackathons
                      </Typography>
                    </Box>
                    <Box flex="1 1 100px" minWidth={100} textAlign="center">
                      <Typography variant="h4" color="primary">
                        {stats.tomorrow.registrationEnding.quizzes}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Quizzes
                      </Typography>
                    </Box>
                  </Box>
                  <Box textAlign="center" mt={2}>
                    <Typography variant="h6" color="success.main">
                      Total: {stats.tomorrow.registrationEnding.total}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box flex="1 1 350px" minWidth={300} maxWidth={500}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
                    <TrendingUp color="primary" />
                    This Week's Start Dates
                  </Typography>
                  <Box display="flex" gap={2}>
                    <Box flex="1 1 100px" minWidth={100} textAlign="center">
                      <Typography variant="h4" color="primary">
                        {stats.thisWeek.starting.events}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Events
                      </Typography>
                    </Box>
                    <Box flex="1 1 100px" minWidth={100} textAlign="center">
                      <Typography variant="h4" color="primary">
                        {stats.thisWeek.starting.hackathons}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Hackathons
                      </Typography>
                    </Box>
                    <Box flex="1 1 100px" minWidth={100} textAlign="center">
                      <Typography variant="h4" color="primary">
                        {stats.thisWeek.starting.quizzes}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Quizzes
                      </Typography>
                    </Box>
                  </Box>
                  <Box textAlign="center" mt={2}>
                    <Typography variant="h6" color="success.main">
                      Total: {stats.thisWeek.starting.total}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}

        {/* Manual Triggers */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Manual Triggers
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Manually trigger notifications for testing or immediate sending
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrow />}
                onClick={handleTriggerRegistration}
              >
                Trigger Registration Reminders
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<PlayArrow />}
                onClick={handleTriggerStart}
              >
                Trigger Start Notifications
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchData}
              >
                Refresh Data
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Upcoming Notifications */}
        {upcoming && (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" fontWeight={600}>
                Upcoming Notifications ({upcoming.summary.totalRegistrationReminders + upcoming.summary.totalStartNotifications})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" flexWrap="wrap" gap={3}>
                {/* Registration Reminders */}
                <Box flex="1 1 400px" minWidth={300} maxWidth={600}>
                  <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
                    <AccessTime color="warning" />
                    Registration Deadlines (Tomorrow)
                  </Typography>
                  {/* Events */}
                  {upcoming.registrationReminders.events && upcoming.registrationReminders.events.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle1" fontWeight={600} color="primary" display="flex" alignItems="center" gap={1}>
                        <Event />
                        Events ({upcoming.registrationReminders.events.length})
                      </Typography>
                      <List dense>
                        {upcoming.registrationReminders.events.map((event: UpcomingNotification) => (
                          <ListItem key={event._id} sx={{ pl: 0 }}>
                            <ListItemText
                              primary={event.title}
                              secondary={`${formatDate(event.dates.registrationEndDate!)} • ${event.savedBy?.length || 0} saved`}
                            />
                            <ListItemSecondaryAction>
                              <Chip
                                label={getTimeUntil(event.dates.registrationEndDate!)}
                                size="small"
                                color="warning"
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  {/* Hackathons */}
                  {upcoming.registrationReminders.hackathons && upcoming.registrationReminders.hackathons.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle1" fontWeight={600} color="primary" display="flex" alignItems="center" gap={1}>
                        <Code />
                        Hackathons ({upcoming.registrationReminders.hackathons.length})
                      </Typography>
                      <List dense>
                        {upcoming.registrationReminders.hackathons.map((hackathon: UpcomingNotification) => (
                          <ListItem key={hackathon._id} sx={{ pl: 0 }}>
                            <ListItemText
                              primary={hackathon.title}
                              secondary={`${formatDate(hackathon.dates.registrationEndDate!)} • ${hackathon.savedBy?.length || 0} saved`}
                            />
                            <ListItemSecondaryAction>
                              <Chip
                                label={getTimeUntil(hackathon.dates.registrationEndDate!)}
                                size="small"
                                color="warning"
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  {/* Quizzes */}
                  {upcoming.registrationReminders.quizzes && upcoming.registrationReminders.quizzes.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle1" fontWeight={600} color="primary" display="flex" alignItems="center" gap={1}>
                        <Quiz />
                        Quizzes ({upcoming.registrationReminders.quizzes.length})
                      </Typography>
                      <List dense>
                        {upcoming.registrationReminders.quizzes.map((quiz: UpcomingNotification) => (
                          <ListItem key={quiz._id} sx={{ pl: 0 }}>
                            <ListItemText
                              primary={quiz.title}
                              secondary={`${formatDate(quiz.dates.registrationEndDate!)} • ${quiz.savedBy?.length || 0} saved`}
                            />
                            <ListItemSecondaryAction>
                              <Chip
                                label={getTimeUntil(quiz.dates.registrationEndDate!)}
                                size="small"
                                color="warning"
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
                {/* Start Notifications */}
                <Box flex="1 1 400px" minWidth={300} maxWidth={600}>
                  <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
                    <TrendingUp color="success" />
                    Starting Soon (15 min)
                  </Typography>
                  {/* Events */}
                  {upcoming.startNotifications.events && upcoming.startNotifications.events.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle1" fontWeight={600} color="primary" display="flex" alignItems="center" gap={1}>
                        <Event />
                        Events ({upcoming.startNotifications.events.length})
                      </Typography>
                      <List dense>
                        {upcoming.startNotifications.events.map((event: UpcomingNotification) => (
                          <ListItem key={event._id} sx={{ pl: 0 }}>
                            <ListItemText
                              primary={event.title}
                              secondary={`${formatDate(event.dates.startDate!)} • ${event.participants?.length || 0} participants`}
                            />
                            <ListItemSecondaryAction>
                              <Chip
                                label={getTimeUntil(event.dates.startDate!)}
                                size="small"
                                color="success"
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  {/* Hackathons */}
                  {upcoming.startNotifications.hackathons && upcoming.startNotifications.hackathons.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle1" fontWeight={600} color="primary" display="flex" alignItems="center" gap={1}>
                        <Code />
                        Hackathons ({upcoming.startNotifications.hackathons.length})
                      </Typography>
                      <List dense>
                        {upcoming.startNotifications.hackathons.map((hackathon: UpcomingNotification) => (
                          <ListItem key={hackathon._id} sx={{ pl: 0 }}>
                            <ListItemText
                              primary={hackathon.title}
                              secondary={`${formatDate(hackathon.dates.startDate!)} • ${hackathon.participants?.length || 0} participants`}
                            />
                            <ListItemSecondaryAction>
                              <Chip
                                label={getTimeUntil(hackathon.dates.startDate!)}
                                size="small"
                                color="success"
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  {/* Quizzes */}
                  {upcoming.startNotifications.quizzes && upcoming.startNotifications.quizzes.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle1" fontWeight={600} color="primary" display="flex" alignItems="center" gap={1}>
                        <Quiz />
                        Quizzes ({upcoming.startNotifications.quizzes.length})
                      </Typography>
                      <List dense>
                        {upcoming.startNotifications.quizzes.map((quiz: UpcomingNotification) => (
                          <ListItem key={quiz._id} sx={{ pl: 0 }}>
                            <ListItemText
                              primary={quiz.title}
                              secondary={`${formatDate(quiz.dates.startDate!)} • ${quiz.participants?.length || 0} participants`}
                            />
                            <ListItemSecondaryAction>
                              <Chip
                                label={getTimeUntil(quiz.dates.startDate!)}
                                size="small"
                                color="success"
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
      </Paper>
    </Box>
  );
};

export default AutomatedNotificationsPage; 