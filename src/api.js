const axios = require('axios');
const config = require('./config');

let cachedEvents = null;
let lastFetch = 0;

async function fetchEvents(forceRefresh = false) {
  const now = Date.now();
  const cacheTime = config.API_REFRESH_INTERVAL * 60 * 1000;
  
  // Используем кеш
  if (!forceRefresh && cachedEvents && (now - lastFetch) < cacheTime) {
    return cachedEvents;
  }
  
  try {
    const response = await axios.get(config.API_URL, {
      headers: { 'User-Agent': 'ARC-Raiders-TG-Bot/1.0' },
      timeout: 10000
    });
    
    cachedEvents = response.data.data;
    lastFetch = now;
    console.log(`[API] Fetched ${cachedEvents.length} events`);
    return cachedEvents;
  } catch (error) {
    console.error('[API] Error:', error.message);
    return cachedEvents || [];
  }
}

function categorizeEvents(events) {
  const now = Date.now();
  const current = [];
  const upcoming = [];
  
  for (const event of events) {
    if (event.startTime <= now && event.endTime > now) {
      current.push({ ...event, timeLeft: event.endTime - now });
    } else if (event.startTime > now) {
      upcoming.push({ ...event, timeUntil: event.startTime - now });
    }
  }
  
  current.sort((a, b) => a.endTime - b.endTime);
  upcoming.sort((a, b) => a.startTime - b.startTime);
  
  return { current, upcoming: upcoming.slice(0, 12) };
}

module.exports = { fetchEvents, categorizeEvents };
