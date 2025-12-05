import api from './api';

export async function fetchUserStatsAndStatus() {
  const res = await api.get('/users/analytics/summary');
  return res.data.data;
}

export async function fetchQuizStats() {
  const res = await api.get('/quizzes/analytics/summary');
  return res.data.data;
}

export async function fetchQuizTrends(lastNDays = 7) {
  const today = new Date();
  const end = new Date(today);
  end.setHours(0, 0, 0, 0);
  end.setDate(today.getDate() + 1);
  const start = new Date(end);
  start.setDate(end.getDate() - lastNDays);
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);
  const res = await api.get('/quizzes/analytics/datewise-counts', {
    params: { startDate, endDate },
  });
  return (res.data.data || []).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString(),
    count: d.count,
  }));
}

export async function fetchHackathonStatusCounts() {
  const res = await api.get('/hackathons/analytics/status-counts');
  return res.data.data;
}

export async function fetchEventStatusCounts() {
  const res = await api.get('/events/analytics/status-counts');
  return res.data.data;
}

export async function fetchQuizStatusCounts() {
  const res = await api.get('/quizzes/analytics/status-counts');
  return res.data.data;
}

export async function fetchEntityStats(entity: 'hackathons' | 'events' | 'quizzes') {
  const [total, active, upcoming, pending] = await Promise.all([
    api.get(`/${entity}`, { params: { limit: 1 } }),
    api.get(`/${entity}`, { params: { status: 'ongoing', limit: 1 } }),
    api.get(`/${entity}`, { params: { status: 'registration_open', limit: 1 } }),
    api.get(`/${entity}`, { params: { status: 'draft', limit: 1 } }),
  ]);
  return {
    total: total.data.total,
    active: active.data.total,
    upcoming: upcoming.data.total,
    pending: pending.data.total,
  };
}

export async function fetchEntityTrends(entity: 'hackathons' | 'events' | 'quizzes', lastNDays = 7) {
  if (entity === 'hackathons' || entity === 'events') {
    const today = new Date();
    const end = new Date(today);
    end.setHours(0, 0, 0, 0);
    end.setDate(today.getDate() + 1);
    const start = new Date(end);
    start.setDate(end.getDate() - lastNDays);
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);
    const res = await api.get(`/${entity}/analytics/datewise-counts`, {
      params: { startDate, endDate },
    });
    return (res.data.data || []).map((d: any) => ({
      date: new Date(d.date).toLocaleDateString(),
      count: d.count,
    }));
  } else {
    return fetchQuizTrends(lastNDays);
  }
}

// Use backend endpoint for user growth chart
type UserGrowthPoint = { date: string; count: number };
export async function fetchUserGrowth(lastNDays = 7): Promise<UserGrowthPoint[]> {
  const today = new Date();
  const end = new Date(today);
  end.setHours(0, 0, 0, 0);
  end.setDate(today.getDate() + 1);
  const start = new Date(end);
  start.setDate(end.getDate() - lastNDays);
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);
  const res = await api.get('/users/analytics/new-users', {
    params: { startDate, endDate },
  });
  // Format date for chart
  return (res.data.data || []).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString(),
    count: d.count,
  }));
} 