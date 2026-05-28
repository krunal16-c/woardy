const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

export const IMG_URL = BASE_URL;

async function req(path, opts = {}) {
  const res = await fetch(`${BASE_URL}${path}`, opts);
  return res.json();
}

// Settings
export const getSettings = () => req('/api/settings');
export const saveSettings = data =>
  req('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

// Weather
export const getWeather = city =>
  req(`/api/weather?city=${encodeURIComponent(city)}`);

// Wardrobe
export const getWardrobe = () => req('/api/wardrobe');
export const addWardrobeItem = formData =>
  req('/api/wardrobe', { method: 'POST', body: formData });
export const deleteWardrobeItem = id =>
  req(`/api/wardrobe/${id}`, { method: 'DELETE' });

// Calendar
export const getCalendarEvents = () => req('/api/calendar');
export const addCalendarEvent = data =>
  req('/api/calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
export const deleteCalendarEvent = id =>
  req(`/api/calendar/${id}`, { method: 'DELETE' });

// Outfits
export const getOutfits = () => req('/api/outfits');
export const generateOutfits = () => req('/api/outfits/generate', { method: 'POST' });
export const markOutfitWorn = id => req(`/api/outfits/${id}/worn`, { method: 'PUT' });
export const markOutfitUnworn = id => req(`/api/outfits/${id}/unworn`, { method: 'PUT' });

// Laundry
export const getLaundry = () => req('/api/laundry');
export const markAsWashed = itemIds =>
  req('/api/laundry/wash', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemIds }),
  });
