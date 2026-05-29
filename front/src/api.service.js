const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3333';
export const IMG_BASE = BASE;

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
  if (!res.ok) throw Object.assign(new Error(data.message || 'Request failed'), { status: res.status, data });
  return data;
}

const json = (method, path, body) =>
  req(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

// Settings
export const getSettings = () => req('/api/settings');
export const saveSettings = body => json('POST', '/api/settings', body);

// Weather
export const getWeather = city => req(`/api/weather?city=${encodeURIComponent(city)}`);

// Wardrobe
export const getWardrobe = () => req('/api/wardrobe');
export const addWardrobeItem = formData => req('/api/wardrobe', { method: 'POST', body: formData });
export const deleteWardrobeItem = id => req(`/api/wardrobe/${id}`, { method: 'DELETE' });

// Manual calendar events
export const getCalendarEvents = () => req('/api/calendar');
export const addCalendarEvent = body => json('POST', '/api/calendar', body);
export const deleteCalendarEvent = id => req(`/api/calendar/${id}`, { method: 'DELETE' });

// Outfits
export const getOutfits = () => req('/api/outfits');
export const generateOutfits = () => req('/api/outfits/generate', { method: 'POST' });
export const markOutfitWorn = id => req(`/api/outfits/${id}/worn`, { method: 'PUT' });
export const markOutfitUnworn = id => req(`/api/outfits/${id}/unworn`, { method: 'PUT' });

// Laundry
export const getLaundry = () => req('/api/laundry');
export const markAsWashed = itemIds => json('PUT', '/api/laundry/wash', { itemIds });

// Google Calendar
export const getGoogleStatus = () => req('/api/google-calendar/status');
export const getGoogleAuthUrl = () => req('/api/google-calendar/auth-url');
export const getGoogleEvents = () => req('/api/google-calendar/events');
export const disconnectGoogle = () => req('/api/google-calendar/disconnect', { method: 'DELETE' });

// Wardrobe scanner (Gemini)
export const scanWardrobe = formData => req('/api/scan', { method: 'POST', body: formData });
export const confirmScan = items => json('POST', '/api/scan/confirm', { items });

// Apple Calendar
export const getAppleStatus = () => req('/api/apple-calendar/status');
export const connectApple = body => json('POST', '/api/apple-calendar/connect', body);
export const getAppleEvents = () => req('/api/apple-calendar/events');
export const disconnectApple = () => req('/api/apple-calendar/disconnect', { method: 'DELETE' });
