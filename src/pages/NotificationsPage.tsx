import React, { useState } from 'react';
import { Box, Typography, Button, TextField, MenuItem, Snackbar, Alert, Paper } from '@mui/material';

const mockHackathons = [
  { id: '1', name: 'AI Innovation Hackathon' },
  { id: '2', name: 'Web3 Builders Hackathon' },
  { id: '3', name: 'Green Tech Challenge' },
];

const NotificationsPage: React.FC = () => {
  const [hackathonId, setHackathonId] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Call backend API to send notification
    setSuccess(true);
    setHackathonId('');
    setMessage('');
  };

  return (
    <Box maxWidth={500} mx="auto">
      <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
        <Typography variant="h5" fontWeight={700} mb={2} color="primary">
          Send Hackathon Notification
        </Typography>
        <form onSubmit={handleSend}>
          <TextField
            select
            label="Select Hackathon"
            value={hackathonId}
            onChange={e => setHackathonId(e.target.value)}
            fullWidth
            required
            margin="normal"
          >
            {mockHackathons.map(h => (
              <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Notification Message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            fullWidth
            required
            margin="normal"
            multiline
            minRows={3}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            Send Notification
          </Button>
        </form>
      </Paper>
      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)}>
        <Alert severity="success" sx={{ width: '100%' }}>
          Notification sent successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationsPage; 