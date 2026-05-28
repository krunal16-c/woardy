const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const CALDAV_BASE = 'https://caldav.icloud.com';

function basicAuth(email, password) {
  return 'Basic ' + Buffer.from(`${email}:${password}`).toString('base64');
}

async function discoverPrincipalUrl(email, appPassword) {
  const auth = basicAuth(email, appPassword);
  const body = `<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:current-user-principal/>
  </D:prop>
</D:propfind>`;

  const res = await axios({
    method: 'PROPFIND',
    url: `${CALDAV_BASE}/`,
    headers: {
      Authorization: auth,
      Depth: '0',
      'Content-Type': 'application/xml; charset=utf-8',
    },
    data: body,
    timeout: 10000,
    maxRedirects: 5,
    validateStatus: s => s < 500,
  });

  if (res.status === 401) throw new Error('Invalid Apple ID credentials. Ensure you are using an App-Specific Password.');
  if (res.status >= 400) throw new Error(`CalDAV server returned ${res.status}`);

  const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
  const parsed = parser.parse(res.data || '');

  // Navigate multistatus > response > propstat > prop > current-user-principal > href
  const multistatus = parsed?.multistatus || parsed?.['D:multistatus'];
  const responses = [multistatus?.response || multistatus?.['D:response']].flat().filter(Boolean);

  for (const r of responses) {
    const propstat = [r?.propstat || r?.['D:propstat']].flat()[0];
    const prop = propstat?.prop || propstat?.['D:prop'];
    const principal = prop?.['current-user-principal'] || prop?.['D:current-user-principal'];
    const href = principal?.href || principal?.['D:href'];
    if (href) return href;
  }

  throw new Error('Could not determine CalDAV principal URL from iCloud response.');
}

async function discoverCalendarHome(principalUrl, email, appPassword) {
  const auth = basicAuth(email, appPassword);
  const body = `<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <C:calendar-home-set/>
  </D:prop>
</D:propfind>`;

  const url = principalUrl.startsWith('http') ? principalUrl : `${CALDAV_BASE}${principalUrl}`;
  const res = await axios({
    method: 'PROPFIND',
    url,
    headers: { Authorization: auth, Depth: '0', 'Content-Type': 'application/xml; charset=utf-8' },
    data: body,
    timeout: 10000,
    validateStatus: s => s < 500,
  });

  const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
  const parsed = parser.parse(res.data || '');
  const multistatus = parsed?.multistatus;
  const responses = [multistatus?.response].flat().filter(Boolean);

  for (const r of responses) {
    const propstat = [r?.propstat].flat()[0];
    const prop = propstat?.prop;
    const homeSet = prop?.['calendar-home-set'];
    const href = homeSet?.href;
    if (href) return href;
  }

  throw new Error('Could not determine calendar home set.');
}

function parseVEvents(icalText, daysAhead = 14) {
  const events = [];
  const cutoff = new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const blocks = icalText.split(/BEGIN:VEVENT/gi);
  for (let i = 1; i < blocks.length; i++) {
    const b = blocks[i];
    const title = (b.match(/SUMMARY:(.+)/i)?.[1] || '').trim().replace(/\\n/g, ' ');
    const dtRaw = b.match(/DTSTART(?:;[^:]*)?:(\d{8})/i)?.[1];
    if (!title || !dtRaw) continue;
    const date = `${dtRaw.slice(0, 4)}-${dtRaw.slice(4, 6)}-${dtRaw.slice(6, 8)}`;
    if (date < today || date > cutoff) continue;
    events.push({ title, date, source: 'apple' });
  }

  return events;
}

async function fetchEvents(email, appPassword, daysAhead = 14) {
  const principalUrl = await discoverPrincipalUrl(email, appPassword);
  const calendarHome = await discoverCalendarHome(principalUrl, email, appPassword);
  const auth = basicAuth(email, appPassword);

  const homeUrl = calendarHome.startsWith('http') ? calendarHome : `${CALDAV_BASE}${calendarHome}`;
  const today = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const end = new Date(Date.now() + daysAhead * 86400000).toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';

  const reportBody = `<?xml version="1.0" encoding="utf-8" ?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${today}" end="${end}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;

  const res = await axios({
    method: 'REPORT',
    url: homeUrl,
    headers: {
      Authorization: auth,
      Depth: '1',
      'Content-Type': 'application/xml; charset=utf-8',
    },
    data: reportBody,
    timeout: 15000,
    validateStatus: s => s < 500,
  });

  // calendar-data is embedded in XML — extract raw VCALENDAR blocks
  const icalChunks = (res.data || '').match(/BEGIN:VCALENDAR[\s\S]*?END:VCALENDAR/gi) || [];
  const events = [];
  for (const chunk of icalChunks) {
    events.push(...parseVEvents(chunk, daysAhead));
  }

  return events;
}

// Quick credential verification — just check the principal URL resolves
async function verifyCredentials(email, appPassword) {
  await discoverPrincipalUrl(email, appPassword);
  return true;
}

module.exports = { verifyCredentials, fetchEvents };
