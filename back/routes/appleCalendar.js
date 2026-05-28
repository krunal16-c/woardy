const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const CalendarConnection = require('../models/CalendarConnection.model');
const { encrypt, decrypt } = require('../utils/encryption');
const { verifyCredentials, fetchEvents } = require('../utils/appleCalendar');

const connectLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

// GET /api/apple-calendar/status
router.get('/status', async (req, res) => {
  try {
    const conn = await CalendarConnection.findOne({ where: { provider: 'apple' } });
    if (!conn) return res.json({ connected: false });
    res.json({ connected: true, status: conn.status, accountHint: conn.accountHint, lastSyncAt: conn.lastSyncAt });
  } catch {
    res.status(500).json({ message: 'Failed to check connection status' });
  }
});

// POST /api/apple-calendar/connect
// Body: { email, appPassword }
// appPassword must be an App-Specific Password from appleid.apple.com
router.post('/connect', connectLimiter, async (req, res) => {
  const { email, appPassword } = req.body;
  if (!email || !appPassword) {
    return res.status(400).json({ message: 'email and appPassword are required' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ message: 'Invalid email address' });
  }
  // App-Specific Passwords are 16 chars in 4 groups: xxxx-xxxx-xxxx-xxxx
  const cleanPassword = appPassword.replace(/\s/g, '');
  if (!/^[a-z]{4}-[a-z]{4}-[a-z]{4}-[a-z]{4}$/.test(cleanPassword)) {
    return res.status(400).json({
      message: 'App-Specific Password must be in the format xxxx-xxxx-xxxx-xxxx (from appleid.apple.com)',
    });
  }

  try {
    await verifyCredentials(email, cleanPassword);

    const payload = JSON.stringify({ email, appPassword: cleanPassword });
    const encryptedPayload = encrypt(payload);
    const hint = email.replace(/(?<=.{2}).(?=.*@)/g, '*');

    await CalendarConnection.upsert({
      provider: 'apple',
      encryptedPayload,
      status: 'active',
      lastSyncAt: new Date(),
      accountHint: hint,
    }, { conflictFields: ['provider'] });

    res.json({ connected: true, accountHint: hint });
  } catch (err) {
    const isAuthError = err.message.includes('Invalid Apple ID') || err.message.includes('401');
    res.status(isAuthError ? 401 : 502).json({
      message: isAuthError
        ? 'Authentication failed. Check your Apple ID email and App-Specific Password.'
        : 'Could not connect to Apple Calendar. Please try again.',
    });
  }
});

// GET /api/apple-calendar/events
router.get('/events', async (req, res) => {
  try {
    const conn = await CalendarConnection.findOne({ where: { provider: 'apple' } });
    if (!conn) return res.json([]);

    const { email, appPassword } = JSON.parse(decrypt(conn.encryptedPayload));
    const events = await fetchEvents(email, appPassword);

    await conn.update({ lastSyncAt: new Date(), status: 'active' });
    res.json(events);
  } catch (err) {
    console.error('Apple Calendar fetch error:', err.message);
    await CalendarConnection.update({ status: 'error' }, { where: { provider: 'apple' } });
    res.status(502).json({ message: 'Failed to fetch Apple Calendar events. Please reconnect.' });
  }
});

// DELETE /api/apple-calendar/disconnect
router.delete('/disconnect', async (req, res) => {
  try {
    const conn = await CalendarConnection.findOne({ where: { provider: 'apple' } });
    if (conn) await conn.destroy();
    res.json({ message: 'Disconnected successfully' });
  } catch {
    res.status(500).json({ message: 'Failed to disconnect' });
  }
});

module.exports = router;
