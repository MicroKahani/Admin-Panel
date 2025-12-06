import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { sendOTP, verifyOTP } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  const { setAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await sendOTP(email);
      console.log('OTP Response:', response); // Debug log
      
      // response is already res.data from API service
      if (response.success) {
        setSuccess(response.message || 'OTP sent to your email!');
        setStep('otp');
        setCountdown(response.expiresIn || 180);

        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        console.error('OTP failed - response:', response);
        setError(response.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      console.error('OTP Error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await verifyOTP(email, otp);
      console.log('Verify OTP Response:', response); // Debug log
      
      // response is already res.data from API service
      if (response.success) {
        console.log('OTP verified! Admin data:', response.data);
        
        // Set admin in context first
        await setAdmin(response.data.admin);
        console.log('Admin set in context, navigating to dashboard...');
        
        // Navigate to dashboard
        navigate('/dashboard', { replace: true });
      } else {
        console.error('OTP verification failed:', response);
        setError(response.message || 'Invalid OTP');
      }
    } catch (err: any) {
      console.error('Verify OTP Error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Paper
        elevation={24}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 450,
          borderRadius: 3,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Admin Panel
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {step === 'email'
              ? 'Enter your email to receive OTP'
              : 'Enter the OTP sent to your email'}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOTP}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 3 }}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Send OTP'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <TextField
              fullWidth
              label="6-Digit OTP"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              required
              sx={{ mb: 2 }}
              disabled={loading}
              inputProps={{
                maxLength: 6,
                style: { fontSize: 24, letterSpacing: 8, textAlign: 'center' },
              }}
            />

            {countdown > 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={{ mb: 2 }}
              >
                OTP expires in: <strong>{formatTime(countdown)}</strong>
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || countdown === 0}
              sx={{ py: 1.5, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify OTP'}
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={() => {
                setStep('email');
                setOtp('');
                setError('');
                setSuccess('');
                setCountdown(0);
              }}
              disabled={loading}
            >
              Change Email
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default LoginPage;