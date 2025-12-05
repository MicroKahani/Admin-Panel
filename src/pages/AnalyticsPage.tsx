import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { fetchUserStatsAndStatus, fetchQuizStats, fetchEntityStats, fetchEntityTrends, fetchUserGrowth, fetchHackathonStatusCounts, fetchEventStatusCounts } from '../services/analytics';
// @ts-ignore: If using TypeScript, install @types/recharts for type support
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const entityLabels = {
  hackathons: 'Hackathons',
  events: 'Events',
  quizzes: 'Quizzes',
};

const AnalyticsPage: React.FC = () => {
  const [userStats, setUserStats] = useState<any>(null);
  const [hackathonStatusCounts, setHackathonStatusCounts] = useState<any>(null);
  const [eventStatusCounts, setEventStatusCounts] = useState<any>(null);
  const [quizStats, setQuizStats] = useState<any>(null);
  const [trends, setTrends] = useState<any>({});
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [growthDays, setGrowthDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [growthLoading, setGrowthLoading] = useState(false);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      const [userSummary, hackathonStatus, eventStatus, quizSummary, quizTrends, hackathonTrends, eventTrends, growth] = await Promise.all([
        fetchUserStatsAndStatus(),
        fetchHackathonStatusCounts(),
        fetchEventStatusCounts(),
        fetchQuizStats(),
        fetchEntityTrends('quizzes', 7),
        fetchEntityTrends('hackathons', 7),
        fetchEntityTrends('events', 7),
        fetchUserGrowth(growthDays),
      ]);
      setUserStats({
        total: userSummary.total,
        active: userSummary.active,
        inactive: userSummary.inactive,
      });
      setHackathonStatusCounts(hackathonStatus);
      setEventStatusCounts(eventStatus);
      setQuizStats(quizSummary);
      setTrends({
        hackathons: hackathonTrends,
        events: eventTrends,
        quizzes: quizTrends,
      });
      setUserGrowth(growth);
      setLoading(false);
    }
    loadStats();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setGrowthLoading(true);
    fetchUserGrowth(growthDays).then((growth) => {
      setUserGrowth(growth);
      setGrowthLoading(false);
    });
  }, [growthDays]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth={1200} mx="auto" p={2}>
      <Typography variant="h4" fontWeight={700} color="primary" mb={3}>
        Admin Analytics Dashboard
      </Typography>
      {/* User Summary Card - visually prominent */}
      <Box display="flex" flexWrap="wrap" gap={3} mb={4}>
        <Paper elevation={4} sx={{ p: 4, flex: '2 1 340px', minWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)', color: 'white' }}>
          <Typography variant="h6" fontWeight={600} mb={1} sx={{ opacity: 0.9 }}>Total Users</Typography>
          <Typography variant="h1" fontWeight={900} mb={1} sx={{ fontSize: { xs: 48, md: 72 }, lineHeight: 1 }}>{userStats.total}</Typography>
          <Box display="flex" gap={2} mb={2}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'white', opacity: 0.95 }}>Active: <b>{userStats.active}</b></Typography>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'white', opacity: 0.95 }}>Inactive: <b>{userStats.inactive}</b></Typography>
          </Box>
        </Paper>
        {/* Hackathon Summary Card */}
        <Paper elevation={3} sx={{ p: 3, flex: '1 1 220px', minWidth: 220 }}>
          <Typography variant="h6" fontWeight={600} mb={1}>Hackathons</Typography>
          <Typography variant="h4" color="primary.main" fontWeight={800}>{hackathonStatusCounts?.total ?? 0}</Typography>
          <Typography color="text.secondary">Pending: {hackathonStatusCounts?.pending ?? 0}</Typography>
          <Typography color="text.secondary">Accepted: {hackathonStatusCounts?.accepted ?? 0}</Typography>
          <Typography color="text.secondary">Rejected: {hackathonStatusCounts?.rejected ?? 0}</Typography>
        </Paper>
        {/* Event Summary Card */}
        <Paper elevation={3} sx={{ p: 3, flex: '1 1 220px', minWidth: 220 }}>
          <Typography variant="h6" fontWeight={600} mb={1}>Events</Typography>
          <Typography variant="h4" color="primary.main" fontWeight={800}>{eventStatusCounts?.total ?? 0}</Typography>
          <Typography color="text.secondary">Pending: {eventStatusCounts?.pending ?? 0}</Typography>
          <Typography color="text.secondary">Accepted: {eventStatusCounts?.accepted ?? 0}</Typography>
          <Typography color="text.secondary">Rejected: {eventStatusCounts?.rejected ?? 0}</Typography>
        </Paper>
        {/* Quiz Summary Card */}
        <Paper elevation={3} sx={{ p: 3, flex: '1 1 220px', minWidth: 220 }}>
          <Typography variant="h6" fontWeight={600} mb={1}>Quizzes</Typography>
          <Typography variant="h4" color="primary.main" fontWeight={800}>{quizStats.total}</Typography>
          <Typography color="text.secondary">Active: {quizStats.active}</Typography>
          <Typography color="text.secondary">Inactive: {quizStats.inactive}</Typography>
        </Paper>
      </Box>
      {/* User Growth Chart */}
      <Box mb={4}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" fontWeight={700}>New Users Joined (Datewise)</Typography>
            <ToggleButtonGroup
              value={growthDays}
              exclusive
              onChange={(_, val) => val && setGrowthDays(val)}
              size="small"
              color="primary"
            >
              <ToggleButton value={7}>7 Days</ToggleButton>
              <ToggleButton value={14}>14 Days</ToggleButton>
              <ToggleButton value={30}>30 Days</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={userGrowth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#1976d2" name="New Users" />
            </BarChart>
          </ResponsiveContainer>
          {growthLoading && <Box textAlign="center" mt={1}><CircularProgress size={20} /></Box>}
        </Paper>
      </Box>
      {/* Trends Charts */}
      <Box display="flex" flexWrap="wrap" gap={3}>
        {(['hackathons', 'events', 'quizzes'] as const).map((entity) => (
          <Paper elevation={2} sx={{ p: 2, flex: '1 1 340px', minWidth: 340 }} key={entity}>
            <Typography variant="h6" fontWeight={600} mb={2}>{entityLabels[entity]} - Next 7 Days</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trends[entity]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#1976d2" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default AnalyticsPage; 