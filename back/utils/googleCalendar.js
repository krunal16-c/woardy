const { google } = require('googleapis');

function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3333/api/google-calendar/callback'
  );
}

function getAuthUrl(oauth2Client) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Always return refresh_token
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  });
}

async function exchangeCode(oauth2Client, code) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

async function getTokenInfo(accessToken) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  return data; // { email, name, picture }
}

async function fetchEvents(tokens, daysAhead = 14) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(tokens);

  // Auto-refresh expired tokens
  oauth2Client.on('tokens', updatedTokens => {
    // Caller should persist updated tokens — returned via refreshedTokens field
    tokens._refreshed = updatedTokens;
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + daysAhead * 86400000).toISOString();

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    maxResults: 50,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return {
    events: (res.data.items || []).map(ev => ({
      id: ev.id,
      title: ev.summary || '(No title)',
      date: (ev.start.dateTime || ev.start.date || '').slice(0, 10),
      source: 'google',
    })),
    refreshedTokens: tokens._refreshed || null,
  };
}

async function revokeToken(accessToken) {
  const oauth2Client = createOAuth2Client();
  try {
    await oauth2Client.revokeToken(accessToken);
  } catch {
    // Token may already be expired — ignore revocation errors
  }
}

module.exports = { createOAuth2Client, getAuthUrl, exchangeCode, getTokenInfo, fetchEvents, revokeToken };
