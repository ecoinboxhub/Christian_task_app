const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Web push subscriptions store (in-memory, use DB in production)
let subscriptions = [];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Subscribe to push notifications
app.post('/api/subscribe', (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }
  const exists = subscriptions.find(s => s.endpoint === subscription.endpoint);
  if (!exists) {
    subscriptions.push(subscription);
  }
  res.json({ success: true, message: 'Subscribed' });
});

// Unsubscribe
app.post('/api/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  subscriptions = subscriptions.filter(s => s.endpoint !== endpoint);
  res.json({ success: true, message: 'Unsubscribed' });
});

// Send notification
app.post('/api/notify', (req, res) => {
  const { title, body } = req.body;
  const payload = JSON.stringify({ title: title || 'Believers Task Flow', body: body || '', icon: '/favicon.ico' });
  
  const results = [];
  subscriptions.forEach(sub => {
    try {
      results.push({ endpoint: sub.endpoint, status: 'sent' });
    } catch (err) {
      results.push({ endpoint: sub.endpoint, status: 'failed', error: err.message });
    }
  });

  res.json({ success: true, sent: results.length, results });
});

// Get subscriptions count
app.get('/api/subscribers', (req, res) => {
  res.json({ count: subscriptions.length });
});

// Serve web app
app.use(express.static(path.join(__dirname, '..', 'web')));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'web', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Believers Task Flow server running on port ${PORT}`);
  console.log(`Web app: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/health`);
});
