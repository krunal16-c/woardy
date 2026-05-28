function getWeatherCategory(temp) {
  if (temp < 5) return 'freezing';
  if (temp < 12) return 'cold';
  if (temp < 18) return 'cool';
  if (temp < 25) return 'mild';
  return 'hot';
}

function scoreItem(item, temp, eventType, usedItemIds) {
  let score = 10;
  const tags = (item.tags || []).map(t => t.toLowerCase());
  const weatherCat = getWeatherCategory(temp);

  // Temperature scoring
  if (weatherCat === 'freezing') {
    if (tags.includes('winter') || tags.includes('heavy')) score += 5;
    if (tags.includes('summer') || tags.includes('light')) score -= 6;
    if (item.category === 'outerwear') score += 4;
  } else if (weatherCat === 'cold') {
    if (tags.includes('winter') || tags.includes('fall')) score += 3;
    if (tags.includes('summer')) score -= 3;
    if (item.category === 'outerwear') score += 3;
  } else if (weatherCat === 'cool') {
    if (tags.includes('spring') || tags.includes('fall')) score += 2;
    if (item.category === 'outerwear') score += 1;
  } else if (weatherCat === 'mild') {
    if (tags.includes('spring') || tags.includes('casual')) score += 2;
    if (item.category === 'outerwear') score -= 1;
  } else {
    // hot
    if (tags.includes('summer') || tags.includes('light')) score += 4;
    if (tags.includes('winter') || tags.includes('heavy')) score -= 5;
    if (item.category === 'outerwear') score -= 4;
  }

  // Formality scoring
  if (eventType === 'formal' || eventType === 'business') {
    if (tags.some(t => ['formal', 'business', 'dress'].includes(t))) score += 5;
    if (tags.some(t => ['sport', 'athletic', 'casual'].includes(t))) score -= 4;
  } else if (eventType === 'sport' || eventType === 'outdoor') {
    if (tags.some(t => ['sport', 'athletic', 'outdoor', 'casual'].includes(t))) score += 4;
    if (tags.some(t => ['formal', 'business'].includes(t))) score -= 4;
  } else if (eventType === 'party') {
    if (tags.some(t => ['party', 'evening', 'formal'].includes(t))) score += 3;
    if (tags.some(t => ['sport', 'athletic'].includes(t))) score -= 2;
  } else {
    if (tags.includes('casual')) score += 2;
  }

  // Penalty for worn in last few days
  if (item.lastWorn) {
    const daysSince = (Date.now() - new Date(item.lastWorn).getTime()) / 86400000;
    if (daysSince < 2) score -= 8;
    else if (daysSince < 4) score -= 3;
  }

  // Penalty for too many wears since last wash
  const wsw = item.wornSinceWash || 0;
  if (wsw >= 4) score -= 7;
  else if (wsw >= 2) score -= 2;

  // Penalty for already used in this suggestion run
  const timesUsed = usedItemIds.filter(id => id === item.id).length;
  if (timesUsed > 0) score -= timesUsed * 4;

  return score;
}

function pickBest(items, temp, eventType, usedItemIds) {
  if (!items || items.length === 0) return null;
  const scored = items.map(item => ({
    item,
    score: scoreItem(item.dataValues || item, temp, eventType, usedItemIds),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0].item;
}

function getOutfitForDay(date, allItems, weatherDay, calendarEvents, usedItemIds) {
  const tempMax = weatherDay.temperature_2m_max;
  const tempMin = weatherDay.temperature_2m_min;
  const temp = (tempMax + tempMin) / 2;
  const weatherCode = weatherDay.weathercode;
  const isRainy = weatherCode >= 51 && weatherCode <= 99;

  const events = calendarEvents.filter(e => e.date === date);
  const primaryEvent = events.length > 0 ? events[0] : null;
  const eventType = primaryEvent ? primaryEvent.eventType : 'casual';

  const groups = {};
  for (const item of allItems) {
    const cat = (item.dataValues || item).category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }

  const outfit = [];

  // Try dress first (if formal/party and dress available)
  const dresses = groups['dresses'] || [];
  let usedDress = false;
  if (dresses.length > 0 && (eventType === 'formal' || eventType === 'party' || eventType === 'business')) {
    const best = pickBest(dresses, temp, eventType, usedItemIds);
    if (best) { outfit.push(best); usedDress = true; }
  }

  if (!usedDress) {
    const bestTop = pickBest(groups['tops'] || [], temp, eventType, usedItemIds);
    if (bestTop) outfit.push(bestTop);
    const bestBottom = pickBest(groups['bottoms'] || [], temp, eventType, usedItemIds);
    if (bestBottom) outfit.push(bestBottom);
  }

  // Outerwear if cool or cold
  if (temp < 18) {
    const bestOuter = pickBest(groups['outerwear'] || [], temp, eventType, usedItemIds);
    if (bestOuter) outfit.push(bestOuter);
  }

  // Shoes (always add best)
  const bestShoes = pickBest(groups['shoes'] || [], temp, eventType, usedItemIds);
  if (bestShoes) outfit.push(bestShoes);

  // Accessories (optional, only if score is decent)
  const accs = groups['accessories'] || [];
  if (accs.length > 0) {
    const scored = accs.map(i => ({
      item: i,
      score: scoreItem(i.dataValues || i, temp, eventType, usedItemIds),
    }));
    const bestAcc = scored.sort((a, b) => b.score - a.score)[0];
    if (bestAcc && bestAcc.score > 8) outfit.push(bestAcc.item);
  }

  const itemIds = outfit.map(i => (i.dataValues || i).id);

  return {
    date,
    items: outfit,
    itemIds,
    weatherContext: {
      temp: Math.round(temp),
      tempMax: Math.round(tempMax),
      tempMin: Math.round(tempMin),
      weatherCode,
      isRainy,
    },
    eventContext: eventType,
    eventTitle: primaryEvent ? primaryEvent.title : null,
  };
}

function suggestOutfitsForWeek(allItems, weekWeather, calendarEvents) {
  const suggestions = [];
  const usedItemIds = [];

  for (let i = 0; i < weekWeather.daily.time.length; i++) {
    const date = weekWeather.daily.time[i];
    const weatherDay = {
      temperature_2m_max: weekWeather.daily.temperature_2m_max[i],
      temperature_2m_min: weekWeather.daily.temperature_2m_min[i],
      weathercode: weekWeather.daily.weathercode[i],
      precipitation_probability_max: weekWeather.daily.precipitation_probability_max
        ? weekWeather.daily.precipitation_probability_max[i]
        : 0,
    };

    const suggestion = getOutfitForDay(date, allItems, weatherDay, calendarEvents, usedItemIds);
    suggestions.push(suggestion);
    usedItemIds.push(...suggestion.itemIds);
  }

  return suggestions;
}

module.exports = { suggestOutfitsForWeek };
