const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const CalendarConnection = require('../models/CalendarConnection.model');
const { encrypt, decrypt } = require('../utils/encryption');
const {
  createOAuth2Client, getAuthUrl, exchangeCode,
  getTokenInfo, fetchEvents, revokeToken,
} = require('../utils/googleCalendar');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

// GET /api/google-calendar/status
router.get('/status', async (req, res) => {
  try {
    const conn = await CalendarConnection.findOne({ where: { provider: 'google' } });
    if (!conn) return res.json({ connected: false });
    res.json({ connected: true, status: conn.status, accountHint: conn.accountHint, lastSyncAt: conn.lastSyncAt });
  } catch (err) {
    res.status(500).json({ message: 'Failed to check connection status' });
  }
});

// GET /api/google-calendar/auth-url
router.get('/auth-url', authLimiter, (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({
      message: 'Google Calendar is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
      setup: true,
    });
  }
  const client = createOAuth2Client();
  res.json({ url: getAuthUrl(client) });
});

// GET /api/google-calendar/callback  (OAuth redirect from Google)
router.get('/callback', authLimiter, async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8888';
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${frontendUrl}/calendar?google=error&message=${encodeURIComponent(error || 'access_denied')}`);
  }

  try {
    const client = createOAuth2Client();
    const tokens = await exchangeCode(client, code);
    const userInfo = await getTokenInfo(tokens.access_token);

    const encryptedPayload = encrypt(JSON.stringify(tokens));
    const hint = userInfo.email ? userInfo.email.replace(/(?<=.{2}).(?=.*@)/g, '*') : null;

    await CalendarConnection.upsert({
      provider: 'google',
      encryptedPayload,
      status: 'active',
      lastSyncAt: new Date(),
      accountHint: hint,
    }, { conflictFields: ['provider'] });

    res.redirect(`${frontendUrl}/calendar?google=connected`);
  } catch (err) {
    console.error('Google OAuth callback error:', err.message);
    res.redirect(`${frontendUrl}/calendar?google=error&message=${encodeURIComponent('Authentication failed')}`);
  }
});

// GET /api/google-calendar/events
router.get('/events', async (req, res) => {
  try {
    const conn = await CalendarConnection.findOne({ where: { provider: 'google' } });
    if (!conn) return res.json([]);

    const tokens = JSON.parse(decrypt(conn.encryptedPayload));
    const { events, refreshedTokens } = await fetchEvents(tokens);

    if (refreshedTokens) {
      const merged = { ...tokens, ...refreshedTokens };
      await conn.update({ encryptedPayload: encrypt(JSON.stringify(merged)), lastSyncAt: new Date() });
    } else {
      await conn.update({ lastSyncAt: new Date() });
    }

    res.json(events);
  } catch (err) {
    console.error('Google Calendar fetch error:', err.message);
    // Mark connection as errored but don't expose internals
    await CalendarConnection.update({ status: 'error' }, { where: { provider: 'google' } });
    res.status(502).json({ message: 'Failed to fetch Google Calendar events. Please reconnect.' });
  }
});

// DELETE /api/google-calendar/disconnect
router.delete('/disconnect', async (req, res) => {
  try {
    const conn = await CalendarConnection.findOne({ where: { provider: 'google' } });
    if (!conn) return res.json({ message: 'Not connected' });

    try {
      const tokens = JSON.parse(decrypt(conn.encryptedPayload));
      if (tokens.access_token) await revokeToken(tokens.access_token);
    } catch { /* Best-effort revocation */ }

    await conn.destroy();
    res.json({ message: 'Disconnected successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to disconnect' });
  }
});

module.exports = router;
